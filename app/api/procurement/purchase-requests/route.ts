/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Purchase Requests API (Satınalma Talepleri & İhaleler)
 */

import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const status = searchParams.get("status")
    const projectId = searchParams.get("projectId")

    const where: any = {}
    if (status && status !== "ALL") {
      where.status = status
    }
    if (projectId && projectId !== "ALL") {
      where.projectId = projectId
    }

    const requests = await prisma.purchaseRequest.findMany({
      where,
      include: {
        project: {
          select: {
            id: true,
            title: true,
            name: true,
            location: true,
          },
        },
        bids: {
          include: {
            supplier: {
              select: {
                id: true,
                name: true,
                email: true,
                phone: true,
              },
            },
          },
          orderBy: {
            unitPrice: "asc",
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    return NextResponse.json(requests)
  } catch (error: any) {
    console.error("Purchase Requests GET Error:", error)
    return NextResponse.json({ error: error.message || "Failed to fetch purchase requests" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { projectId, materialName, quantity, unit, status } = body

    if (!projectId || !materialName || quantity === undefined || !unit) {
      return NextResponse.json({ error: "Eksik bilgi gönderildi" }, { status: 400 })
    }

    const newRequest = await prisma.purchaseRequest.create({
      data: {
        projectId,
        materialName,
        quantity: parseFloat(quantity),
        unit,
        status: status || "OPEN_FOR_BID",
        deadline: body.deadline ? new Date(body.deadline) : null,
        paymentType: body.paymentType || "PEŞİN",
        deliveryNotes: body.deliveryNotes || null,
      },
      include: {
        project: true,
      },
    })

    return NextResponse.json(newRequest, { status: 201 })
  } catch (error: any) {
    console.error("Purchase Requests POST Error:", error)
    return NextResponse.json({ error: error.message || "Failed to create purchase request" }, { status: 500 })
  }
}
