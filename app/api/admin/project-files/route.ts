/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * This code is the property of NXA Software.
 */

import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get('projectId')

    if (!projectId) {
      return NextResponse.json(
        { error: "Project ID required" },
        { status: 400 }
      )
    }

    const projectFiles = await prisma.projectFile.findMany({
      where: { projectId },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json(projectFiles)
  } catch (error) {
    console.error("Error fetching project files:", error)
    return NextResponse.json(
      { error: "Proje dosyaları getirilirken hata oluştu" },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, url, category, projectId, uploadedBy } = body

    if (!name || !url || !category || !projectId) {
      return NextResponse.json(
        { error: "Name, url, category and projectId are required" },
        { status: 400 }
      )
    }

    const projectFile = await prisma.projectFile.create({
      data: {
        name,
        url,
        category,
        projectId,
        uploadedBy: uploadedBy || null
      }
    })

    return NextResponse.json(projectFile, { status: 201 })
  } catch (error) {
    console.error("Error creating project file:", error)
    return NextResponse.json(
      { error: "Proje dosyası oluşturulurken hata oluştu" },
      { status: 500 }
    )
  }
}
