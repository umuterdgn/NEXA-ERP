/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Masraf & Yakıt Fişi Bildirimi (ExpenseClaim) API
 */

import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")
    const projectId = searchParams.get("projectId")
    const onlyMine = searchParams.get("onlyMine") === "true"

    const whereClause: any = {}

    // Saha personeli sadece kendi masraflarını görebilir; Muhasebe/Admin ise tümünü görebilir
    const userRole = session.user.role as string
    const isManager = ["ADMIN", "SUPER_ADMIN", "MUHASEBE", "FINANCE_MANAGER"].includes(userRole)

    if (onlyMine || !isManager) {
      whereClause.userId = session.user.id
    }

    if (status && status !== "ALL") {
      whereClause.status = status
    }

    if (projectId && projectId !== "ALL") {
      whereClause.projectId = projectId
    }

    const expenses = await prisma.expenseClaim.findMany({
      where: whereClause,
      include: {
        user: {
          select: { id: true, name: true, email: true, role: true },
        },
      },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json({ expenses })
  } catch (error: any) {
    console.error("❌ Expense GET error:", error)
    return NextResponse.json({ error: error.message || "Masraf talepleri alınamadı" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 })
    }

    const body = await request.json()
    const { expenseType, amount, receiptUrl, description, projectId } = body

    if (!expenseType || !amount || !receiptUrl) {
      return NextResponse.json(
        { error: "Masraf türü, tutar ve fiş/fatura görseli zorunludur" },
        { status: 400 }
      )
    }

    const claim = await prisma.expenseClaim.create({
      data: {
        userId: session.user.id,
        projectId: projectId || null,
        expenseType, // "FUEL", "MATERIAL", "FOOD", etc.
        amount: parseFloat(amount),
        receiptUrl,
        description: description || null,
        status: "PENDING",
      },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
      },
    })

    return NextResponse.json({ success: true, claim }, { status: 201 })
  } catch (error: any) {
    console.error("❌ Expense POST error:", error)
    return NextResponse.json({ error: error.message || "Masraf fişi kaydedilemedi" }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 })
    }

    const userRole = session.user.role as string
    const isManager = ["ADMIN", "SUPER_ADMIN", "MUHASEBE", "FINANCE_MANAGER"].includes(userRole)
    if (!isManager) {
      return NextResponse.json({ error: "Bu işlem için finans yetkisi gerekir" }, { status: 403 })
    }

    const body = await request.json()
    const { claimId, status } = body // "APPROVED", "REJECTED", "PAID"

    if (!claimId || !status) {
      return NextResponse.json({ error: "claimId ve status zorunludur" }, { status: 400 })
    }

    const updated = await prisma.expenseClaim.update({
      where: { id: claimId },
      data: { status },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
      },
    })

    return NextResponse.json({ success: true, claim: updated })
  } catch (error: any) {
    console.error("❌ Expense PATCH error:", error)
    return NextResponse.json({ error: error.message || "Masraf durumu güncellenemedi" }, { status: 500 })
  }
}
