/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * This code is the property of NXA Software.
 */

import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

export async function GET() {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const reports = await prisma.siteReport.findMany({
      include: {
        project: true
      },
      orderBy: { date: 'desc' }
    })
    
    return NextResponse.json(reports)
  } catch (error) {
    console.error("Error fetching site reports:", error)
    return NextResponse.json(
      { error: "Şantiye raporları getirilirken hata oluştu" },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session) {
      console.error("Site Reports POST: No session found")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const formData = await request.formData()
    
    const date = formData.get('date') as string
    const weather = formData.get('weather') as string
    const workerCount = formData.get('workerCount') as string
    const notes = formData.get('notes') as string
    const projectId = formData.get('projectId') as string
    const createdBy = formData.get('createdBy') as string
    console.log("Site Reports POST: Creating report with data:", { date, weather, workerCount, notes, projectId, createdBy })
    
    // Handle file uploads
    const images = formData.getAll('images') as File[]
    let imageUrls: string[] = []
    
    if (images && images.length > 0) {
      // Upload each image to the upload API
      for (const image of images) {
        const uploadFormData = new FormData()
        uploadFormData.append('file', image)
        
        try {
          const uploadResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/upload`, {
            method: 'POST',
            body: uploadFormData
          })
          
          if (uploadResponse.ok) {
            const uploadData = await uploadResponse.json()
            if (uploadData.url) {
              imageUrls.push(uploadData.url)
            }
          }
        } catch (uploadError) {
          console.error("Error uploading image:", uploadError)
        }
      }
    }

    const report = await prisma.siteReport.create({
      data: {
        date: date ? new Date(date) : new Date(),
        weather: weather || null,
        workerCount: workerCount ? parseInt(workerCount) : 0,
        notes: notes || "",
        images: imageUrls.length > 0 ? imageUrls.join(',') : null,
        projectId: projectId,
        createdBy: createdBy || null
      },
      include: {
        project: true
      }
    })

    return NextResponse.json(report, { status: 201 })
  } catch (error) {
    console.error("Error creating site report:", error)
    return NextResponse.json(
      { error: "Şantiye raporu oluşturulurken hata oluştu" },
      { status: 500 }
    )
  }
}
