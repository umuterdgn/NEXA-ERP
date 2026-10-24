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

    const contentType = request.headers.get("content-type") || ""
    let date: string | undefined
    let weather: string | undefined
    let workerCount: string | number | undefined
    let staffWorkerCount: string | number | undefined
    let subWorkerCount: string | number | undefined
    let activities: string | undefined
    let dailyEvents: string | undefined
    let notes: string | undefined
    let projectId: string | undefined
    let createdBy: string | undefined
    let imageUrls: string[] = []

    if (contentType.includes("application/json")) {
      const body = await request.json()
      date = body.date
      weather = body.weather
      workerCount = body.workerCount
      staffWorkerCount = body.staffWorkerCount
      subWorkerCount = body.subWorkerCount
      activities = body.activities
      dailyEvents = body.dailyEvents
      notes = body.notes
      projectId = body.projectId
      createdBy = body.createdBy || session.user?.name || "Saha Şefi"
      if (body.images && Array.isArray(body.images)) {
        imageUrls = body.images
      }
    } else {
      const formData = await request.formData()
      date = formData.get('date') as string
      weather = formData.get('weather') as string
      workerCount = formData.get('workerCount') as string
      staffWorkerCount = formData.get('staffWorkerCount') as string
      subWorkerCount = formData.get('subWorkerCount') as string
      activities = formData.get('activities') as string
      dailyEvents = formData.get('dailyEvents') as string
      notes = formData.get('notes') as string
      projectId = formData.get('projectId') as string
      createdBy = (formData.get('createdBy') as string) || session.user?.name || "Saha Şefi"
      
      const images = formData.getAll('images') as File[]
      if (images && images.length > 0) {
        for (const image of images) {
          if (image instanceof File && image.size > 0) {
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
      }
    }

    if (!projectId) {
      return NextResponse.json({ error: "Proje seçimi zorunludur" }, { status: 400 })
    }

    const parsedWorkerCount = workerCount ? Number(workerCount) : 0
    const parsedStaff = staffWorkerCount !== undefined ? Number(staffWorkerCount) : 0
    const parsedSub = subWorkerCount !== undefined ? Number(subWorkerCount) : 0
    const finalWorkerCount = parsedWorkerCount > 0 ? parsedWorkerCount : (parsedStaff + parsedSub)

    // Build comprehensive notes if activities/dailyEvents provided
    let combinedNotes = notes || ""
    if (activities && !combinedNotes.includes(activities)) {
      combinedNotes = `Yapılan İmalatlar:\n${activities}\n\n${combinedNotes}`.trim()
    }
    if (dailyEvents && !combinedNotes.includes(dailyEvents)) {
      combinedNotes = `${combinedNotes}\n\nGünlük Olaylar & Bağlı Kayıtlar:\n${dailyEvents}`.trim()
    }

    const report = await prisma.siteReport.create({
      data: {
        date: date ? new Date(date) : new Date(),
        weather: weather || null,
        workerCount: finalWorkerCount,
        staffWorkerCount: parsedStaff,
        subWorkerCount: parsedSub,
        activities: activities || null,
        dailyEvents: dailyEvents || null,
        notes: combinedNotes,
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
