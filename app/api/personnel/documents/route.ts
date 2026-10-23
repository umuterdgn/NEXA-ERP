/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Personnel Documents API (Süreli Evrak & İSG Alarm Takibi)
 */

import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const urgentOnly = searchParams.get("urgentOnly") === "true"
    const docType = searchParams.get("docType")
    const userId = searchParams.get("userId")

    const where: any = {}
    if (docType && docType !== "ALL") {
      where.docType = docType
    }
    if (userId) {
      where.userId = userId
    }

    const documents = await prisma.personnelDocument.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            company: {
              select: {
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        expiryDate: "asc",
      },
    })

    const now = new Date()
    const enriched = documents.map((doc) => {
      const expDate = new Date(doc.expiryDate)
      const diffTime = expDate.getTime() - now.getTime()
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

      let alertLevel: "EXPIRED" | "CRITICAL" | "WARNING" | "SAFE" = "SAFE"
      let badgeColor: "red" | "orange" | "yellow" | "green" = "green"
      let urgencyText = `${diffDays} gün kaldı`

      if (diffDays < 0) {
        alertLevel = "EXPIRED"
        badgeColor = "red"
        urgencyText = `Süresi ${Math.abs(diffDays)} gün önce doldu!`
      } else if (diffDays <= 7) {
        alertLevel = "CRITICAL"
        badgeColor = "red"
        urgencyText = `${diffDays} gün kaldı (Acil Aksiyon)`
      } else if (diffDays <= 15) {
        alertLevel = "WARNING"
        badgeColor = "yellow"
        urgencyText = `${diffDays} gün kaldı (Planlı Yenileme)`
      }

      return {
        ...doc,
        diffDays,
        alertLevel,
        badgeColor,
        urgencyText,
      }
    })

    // If urgentOnly, filter diffDays <= 15
    const filtered = urgentOnly
      ? enriched.filter((doc) => doc.diffDays <= 15)
      : enriched

    return NextResponse.json(filtered)
  } catch (error: any) {
    console.error("Personnel Documents GET Error:", error)
    return NextResponse.json({ error: error.message || "Failed to fetch personnel documents" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { userId, docType, issueDate, expiryDate } = body

    if (!userId || !docType || !issueDate || !expiryDate) {
      return NextResponse.json({ error: "Eksik bilgi" }, { status: 400 })
    }

    const doc = await prisma.personnelDocument.create({
      data: {
        userId,
        docType,
        issueDate: new Date(issueDate),
        expiryDate: new Date(expiryDate),
        isAlertSent: false,
      },
      include: {
        user: true,
      },
    })

    return NextResponse.json(doc, { status: 201 })
  } catch (error: any) {
    console.error("Personnel Documents POST Error:", error)
    return NextResponse.json({ error: error.message || "Failed to create personnel document" }, { status: 500 })
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json()
    const { id, isAlertSent, expiryDate, docType } = body

    if (!id) {
      return NextResponse.json({ error: "ID gerekli" }, { status: 400 })
    }

    const updateData: any = {}
    if (isAlertSent !== undefined) updateData.isAlertSent = isAlertSent
    if (expiryDate) updateData.expiryDate = new Date(expiryDate)
    if (docType) updateData.docType = docType

    const updated = await prisma.personnelDocument.update({
      where: { id },
      data: updateData,
      include: {
        user: true,
      },
    })

    return NextResponse.json(updated)
  } catch (error: any) {
    console.error("Personnel Documents PATCH Error:", error)
    return NextResponse.json({ error: error.message || "Failed to update personnel document" }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ error: "ID gerekli" }, { status: 400 })
    }

    await prisma.personnelDocument.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Personnel Documents DELETE Error:", error)
    return NextResponse.json({ error: error.message || "Failed to delete personnel document" }, { status: 500 })
  }
}
