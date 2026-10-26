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
import { auth } from "@/lib/auth"
import { syncToGlobalArchive } from "@/lib/services/archive-sync"

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File
    const customName = formData.get("customName") as string | null
    const sourceModule = (formData.get("sourceModule") as string) || "GENERAL_UPLOAD"
    const category = (formData.get("category") as string) || "GENEL"
    const projectId = formData.get("projectId") as string | null
    const formTenantId = formData.get("tenantId") as string | null

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      )
    }

    // Oturum ve tenant tespiti
    const session = await auth().catch(() => null)
    const effectiveTenantId = formTenantId || (session?.user as any)?.tenantId || null
    const userId = session?.user?.id || null

    let finalUrl: string | null = null
    let driveId: string | undefined = undefined

    // 1. Try Cloudinary upload first
    try {
      const bytes = await file.arrayBuffer()
      const buffer = Buffer.from(bytes)

      const uploadResult = await new Promise((resolve, reject) => {
        cloudinary.uploader.upload_stream(
          {
            folder: 'nexa_erp',
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
        finalUrl = (uploadResult as any).secure_url
      }
    } catch (cloudinaryError) {
      console.error("Cloudinary upload failed, falling back to other methods:", cloudinaryError)
    }

    // 2. Check if Google Drive credentials are available (if Cloudinary didn't succeed)
    if (!finalUrl) {
      const apiKey = process.env.GOOGLE_DRIVE_API_KEY
      const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID

      if (apiKey && folderId) {
        try {
          const authClient = new google.auth.GoogleAuth({
            keyFile: process.env.GOOGLE_SERVICE_ACCOUNT_KEY_FILE,
            scopes: ["https://www.googleapis.com/auth/drive.file"],
          })

          const drive = google.drive({ version: "v3", auth: authClient })

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

          if (response.data.id) {
            driveId = response.data.id
            await drive.permissions.create({
              fileId: response.data.id,
              requestBody: {
                role: "reader",
                type: "anyone",
              },
            })
            finalUrl = response.data.webViewLink || `https://drive.google.com/file/d/${response.data.id}/view`
          }
        } catch (driveError) {
          console.error("Google Drive upload failed, falling back to other methods:", driveError)
        }
      }
    }

    // 3. Check if Storj S3 credentials are available
    if (!finalUrl) {
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
          finalUrl = `${storjEndpoint}/${storjBucket}/${filename}`
        } catch (storjError) {
          console.error("Storj upload failed, falling back to local:", storjError)
        }
      }
    }

    // 4. Fallback: Local upload
    if (!finalUrl) {
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

      finalUrl = `/uploads/${filename}`
    }

    // 🌟 MERKEZİ ARŞİV SENKRONİZASYONU & KOTA GÜNCELLEMESİ (Single Source of Truth)
    const syncRes = await syncToGlobalArchive({
      title: customName || file.name,
      fileUrl: finalUrl,
      fileSizeBytes: file.size,
      sourceModule: sourceModule,
      category: category,
      tenantId: effectiveTenantId,
      projectId: projectId,
      uploadedById: userId,
    })

    return NextResponse.json(
      { 
        url: finalUrl, 
        filename: customName || file.name,
        driveId,
        fileSizeMB: syncRes?.fileSizeMB || Number((file.size / (1024 * 1024)).toFixed(3)),
        archived: true
      },
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
