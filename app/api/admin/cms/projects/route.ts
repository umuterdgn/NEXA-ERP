/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * This code is the property of NXA Software.
 */

import { NextResponse } from "next/server"
import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

export async function GET() {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const projects = await prisma.portfolioProject.findMany({
      orderBy: { displayOrder: "asc" }
    })

    return NextResponse.json(projects)
  } catch (error) {
    console.error("CMS projects fetch error:", error)
    return NextResponse.json([], { status: 200 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const {
      title,
      description,
      images = [],
      imageUrl,
      year,
      location,
      isPublished,
      displayOrder
    } = body

    const project = await prisma.portfolioProject.create({
      data: {
        title: title || "Yeni Proje",
        description: description || "",
        images: Array.isArray(images) ? images.filter((img: string) => img && img.trim() !== "") : [],
        imageUrl: imageUrl || null,
        year: year || null,
        location: location || null,
        isPublished: isPublished !== undefined ? Boolean(isPublished) : true,
        displayOrder: Number(displayOrder) || 0
      }
    })

    revalidatePath("/")
    revalidatePath("/projelerimiz")

    return NextResponse.json(project, { status: 201 })
  } catch (error) {
    console.error("CMS project create error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { id, ...data } = body

    if (!id) {
      return NextResponse.json({ error: "Project id is required" }, { status: 400 })
    }

    const project = await prisma.portfolioProject.update({
      where: { id },
      data: {
        title: data.title ?? undefined,
        description: data.description ?? undefined,
        images: Array.isArray(data.images)
          ? data.images.filter((img: string) => img && img.trim() !== "")
          : undefined,
        imageUrl: data.imageUrl ?? null,
        year: data.year ?? null,
        location: data.location ?? null,
        isPublished: data.isPublished !== undefined ? Boolean(data.isPublished) : undefined,
        displayOrder: data.displayOrder !== undefined ? Number(data.displayOrder) : undefined
      }
    })

    revalidatePath("/")
    revalidatePath("/projelerimiz")

    return NextResponse.json(project)
  } catch (error) {
    console.error("CMS project update error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
