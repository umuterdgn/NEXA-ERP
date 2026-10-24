/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Financial Documents API (Çek, Senet, Teminat Mektubu)
 */

import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const type = searchParams.get("type")
    const status = searchParams.get("status")
    const search = searchParams.get("search")

    const where: any = {}
    if (type && type !== "ALL") {
      where.documentType = type
    }
    if (status && status !== "ALL") {
      where.status = status
    }
    if (search) {
      where.OR = [
        { documentNo: { contains: search, mode: "insensitive" } },
        { company: { name: { contains: search, mode: "insensitive" } } },
      ]
    }

    const documents = await prisma.financialDocument.findMany({
      where,
      include: {
        company: {
          select: {
            id: true,
            name: true,
            type: true,
            taxNumber: true,
          },
        },
      },
      orderBy: {
        dueDate: "asc",
      },
    })

    // Calculate urgency status for each document
    const now = new Date()
    const enriched = documents.map((doc) => {
      const dueDate = new Date(doc.dueDate)
      const diffTime = dueDate.getTime() - now.getTime()
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

      let urgency: "RED" | "YELLOW" | "NORMAL" = "NORMAL"
      let urgencyText = `${diffDays} gün kaldı`

      if (diffDays < 0) {
        urgency = "RED"
        urgencyText = `Vadesi ${Math.abs(diffDays)} gün geçti!`
      } else if (diffDays <= 7) {
        urgency = "RED"
        urgencyText = `${diffDays} gün kaldı (Kritik)`
      } else if (diffDays <= 15) {
        urgency = "YELLOW"
        urgencyText = `${diffDays} gün kaldı (Yaklaşıyor)`
      }

      return {
        ...doc,
        diffDays,
        urgency,
        urgencyText,
      }
    })

    return NextResponse.json(enriched)
  } catch (error: any) {
    console.error("Financial Documents GET Error:", error)
    return NextResponse.json({ error: error.message || "Failed to fetch documents" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { documentType, documentNo, amount, currency, issueDate, dueDate, companyId, status } = body

    if (!documentType || !documentNo || amount === undefined || !issueDate || !dueDate || !companyId) {
      return NextResponse.json({ error: "Eksik alanlar var" }, { status: 400 })
    }

    const newDoc = await prisma.financialDocument.create({
      data: {
        documentType,
        documentNo,
        amount: parseFloat(amount),
        currency: currency || "TRY",
        issueDate: new Date(issueDate),
        dueDate: new Date(dueDate),
        companyId,
        status: status || "PORTFOLIO",
        documentUrl: body.documentUrl || null,
      },
      include: {
        company: true,
      },
    })

    return NextResponse.json(newDoc, { status: 201 })
  } catch (error: any) {
    console.error("Financial Documents POST Error:", error)
    return NextResponse.json({ error: error.message || "Failed to create document" }, { status: 500 })
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json()
    const { id, status, amount, dueDate, notes } = body

    if (!id) {
      return NextResponse.json({ error: "ID gerekli" }, { status: 400 })
    }

    const updateData: any = {}
    if (status) updateData.status = status
    if (amount !== undefined) updateData.amount = parseFloat(amount)
    if (dueDate) updateData.dueDate = new Date(dueDate)

    const updated = await prisma.financialDocument.update({
      where: { id },
      data: updateData,
      include: {
        company: true,
      },
    })

    return NextResponse.json(updated)
  } catch (error: any) {
    console.error("Financial Documents PATCH Error:", error)
    return NextResponse.json({ error: error.message || "Failed to update document" }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ error: "ID gerekli" }, { status: 400 })
    }

    await prisma.financialDocument.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Financial Documents DELETE Error:", error)
    return NextResponse.json({ error: error.message || "Failed to delete document" }, { status: 500 })
  }
}
