/**
 * 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * This code is the property of NXA Software.
 */

import { NextResponse } from "next/server"
import { writeFile, mkdir } from "fs/promises"
import { existsSync } from "fs"
import path from "path"
import { google } from "googleapis"
import { PutObjectCommand } from "@aws-sdk/client-s3"
import { s3Client } from "@/lib/s3"
import cloudinary from "@/lib/cloudinary"

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File
    const customName = formData.get("customName") as string | null

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      )
    }

    // Try Cloudinary upload first (for all file types including PDFs and documents)
    try {
      const bytes = await file.arrayBuffer()
      const buffer = Buffer.from(bytes)

      const uploadResult = await new Promise((resolve, reject) => {
        cloudinary.uploader.upload_stream(
          {
            folder: 'mahir-bakay-erp',
            resource_type: 'auto',
            public_id: customName ? `${customName}-${Date.now()}` : undefined,
          },
          (error, result) => {
            if (error) reject(error)
            else resolve(result)
          }
        ).end(buffer)
      })

      if (uploadResult && typeof uploadResult === 'object' && 'secure_url' in uploadResult) {
        return NextResponse.json(
          { url: uploadResult.secure_url, filename: customName || file.name },
          { status: 200 }
        )
      }
    } catch (cloudinaryError) {
      console.error("Cloudinary upload failed, falling back to other methods:", cloudinaryError)
      // Fall back to other upload methods if Cloudinary fails
    }

    // Check if Google Drive credentials are available
    const apiKey = process.env.GOOGLE_DRIVE_API_KEY
    const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID

    if (apiKey && folderId) {
      // Upload to Google Drive
      try {
        const auth = new google.auth.GoogleAuth({
          keyFile: process.env.GOOGLE_SERVICE_ACCOUNT_KEY_FILE,
          scopes: ["https://www.googleapis.com/auth/drive.file"],
        })

        const drive = google.drive({ version: "v3", auth })

        const fileMetadata = {
          name: customName || file.name,
          parents: [folderId],
        }

        const media = {
          mimeType: file.type,
          body: Buffer.from(await file.arrayBuffer()),
        }

        const response = await drive.files.create({
          requestBody: fileMetadata,
          media: media,
          fields: "id,webViewLink",
        })

        if (!response.data.id) {
          throw new Error("Failed to get file ID from Google Drive")
        }

        // Make file publicly viewable
        await drive.permissions.create({
          fileId: response.data.id,
          requestBody: {
            role: "reader",
            type: "anyone",
          },
        })

        return NextResponse.json(
          { 
            url: response.data.webViewLink || `https://drive.google.com/file/d/${response.data.id}/view`,
            filename: customName || file.name,
            driveId: response.data.id
          },
          { status: 200 }
        )
      } catch (driveError) {
        console.error("Google Drive upload failed, falling back to local:", driveError)
        // Fall back to local upload if Drive fails
      }
    }

    // Check if Storj S3 credentials are available
    const storjBucket = process.env.STORJ_BUCKET_NAME
    const storjEndpoint = process.env.STORJ_ENDPOINT

    if (storjBucket && storjEndpoint) {
      try {
        const timestamp = Date.now()
        const fileExtension = file.name.split(".").pop()
        const filename = `${timestamp}-${customName || file.name}.${fileExtension}`

        const bytes = await file.arrayBuffer()
        const buffer = Buffer.from(bytes)

        const command = new PutObjectCommand({
          Bucket: storjBucket,
          Key: filename,
          Body: buffer,
          ContentType: file.type,
        })

        await s3Client.send(command)

        const publicUrl = `${storjEndpoint}/${storjBucket}/${filename}`

        return NextResponse.json(
          { url: publicUrl, filename },
          { status: 200 }
        )
      } catch (storjError) {
        console.error("Storj upload failed, falling back to local:", storjError)
        // Fall back to local upload if Storj fails
      }
    }

    // Fallback: Local upload
    const uploadsDir = path.join(process.cwd(), "public", "uploads")
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true })
    }

    const timestamp = Date.now()
    const randomString = Math.random().toString(36).substring(2, 8)
    const fileExtension = file.name.split(".").pop()
    const filename = customName 
      ? `${customName}.${fileExtension}`
      : `${timestamp}-${randomString}.${fileExtension}`
    const filepath = path.join(uploadsDir, filename)

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    await writeFile(filepath, buffer)

    const publicUrl = `/uploads/${filename}`

    return NextResponse.json(
      { url: publicUrl, filename },
      { status: 200 }
    )
  } catch (error) {
    console.error("Error uploading file:", error)
    return NextResponse.json(
      { error: "Failed to upload file" },
      { status: 500 }
    )
  }
}
