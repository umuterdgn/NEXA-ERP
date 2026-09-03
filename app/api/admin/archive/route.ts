/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * This code is the property of NXA Software.
 */

import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { uploadPDFToDrive } from "@/lib/google-drive"

export async function GET(request: Request) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const search = searchParams.get("search")
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")
    const sortBy = searchParams.get("sortBy") || "date-desc"

    let archives = await prisma.archive.findMany({
      orderBy: { uploadedAt: sortBy === "date-asc" ? "asc" : "desc" },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            title: true
          }
        }
      }
    }) as any[]

    if (search) {
      archives = archives.filter(a => 
        a.projectName.toLowerCase().includes(search.toLowerCase())
      )
    }

    if (startDate) {
      archives = archives.filter(a => new Date(a.uploadedAt) >= new Date(startDate))
    }

    if (endDate) {
      archives = archives.filter(a => new Date(a.uploadedAt) <= new Date(endDate))
    }

    return NextResponse.json(archives)
  } catch (error) {
    console.error("Archive fetch error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get("file") as File
    const projectId = formData.get("projectId") as string
    const documentName = formData.get("documentName") as string

    if (!file) {
      return NextResponse.json({ error: "Missing file" }, { status: 400 })
    }

    if (file.type !== "application/pdf") {
      return NextResponse.json({ error: "Only PDF files are allowed" }, { status: 400 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const driveUrl = await uploadPDFToDrive(buffer, file.name)

    // Get project name if projectId is provided
    let projectName = "Genel"
    if (projectId) {
      const project = await prisma.project.findUnique({
        where: { id: projectId }
      })
      if (project) {
        projectName = project.title
      }
    }

    const archive = await prisma.archive.create({
      data: {
        projectName,
        fileName: file.name,
        documentName: documentName || null,
        driveUrl,
        projectId: projectId || null
      }
    })

    return NextResponse.json(archive)
  } catch (error) {
    console.error("Archive upload error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}