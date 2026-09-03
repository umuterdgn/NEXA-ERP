/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * This code is the property of NXA Software.
 */

import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const discipline = searchParams.get('discipline')

    const blueprints = await prisma.projectBlueprint.findMany({
      where: discipline ? { discipline } : undefined,
      include: {
        project: {
          select: {
            name: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json(blueprints)
  } catch (error) {
    console.error("Blueprint fetch error:", error)
    return NextResponse.json(
      { error: "Çizimler getirilirken hata oluştu" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { projectId, title, discipline, revisionNo, fileUrl } = body

    if (!projectId || !title || !discipline || !fileUrl) {
      return NextResponse.json(
        { error: "Gerekli alanlar eksik" },
        { status: 400 }
      )
    }

    // If this is a revision of an existing blueprint, mark old versions as not current
    const existingBlueprints = await prisma.projectBlueprint.findMany({
      where: {
        projectId,
        title,
        discipline
      }
    })

    if (existingBlueprints.length > 0) {
      await prisma.projectBlueprint.updateMany({
        where: {
          projectId,
          title,
          discipline
        },
        data: {
          isCurrent: false
        }
      })
    }

    // Create new blueprint
    const blueprint = await prisma.projectBlueprint.create({
      data: {
        projectId,
        title,
        discipline,
        revisionNo,
        fileUrl,
        isCurrent: true
      }
    })

    return NextResponse.json(blueprint)
  } catch (error) {
    console.error("Blueprint creation error:", error)
    return NextResponse.json(
      { error: "Çizim oluşturulurken hata oluştu" },
      { status: 500 }
    )
  }
}
