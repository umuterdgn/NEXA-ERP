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
    const projectId = searchParams.get("projectId")
    const workerId = searchParams.get("workerId")

    const contracts = await prisma.contract.findMany({
      where: {
        ...(projectId && { projectId }),
        ...(workerId && { personelId: workerId })
      },
      include: {
        project: {
          select: {
            name: true,
            title: true
          }
        },
        personel: {
          select: {
            name: true
          }
        },
        template: {
          select: {
            name: true
          }
        }
      },
      orderBy: { createdAt: "desc" }
    })

    return NextResponse.json(contracts)
  } catch (error) {
    console.error("Error fetching contracts:", error)
    return NextResponse.json({ error: "Failed to fetch contracts" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { title, type, fileUrl, content, projectId, workerId, templateId } = body

    const contract = await prisma.contract.create({
      data: {
        title,
        type,
        fileUrl,
        content: content || null,
        projectId: projectId || null,
        personelId: workerId || null,
        templateId: templateId || null
      },
      include: {
        project: {
          select: {
            name: true,
            title: true
          }
        },
        personel: {
          select: {
            name: true
          }
        }
      }
    })

    return NextResponse.json(contract)
  } catch (error) {
    console.error("Error creating contract:", error)
    return NextResponse.json({ error: "Failed to create contract" }, { status: 500 })
  }
}