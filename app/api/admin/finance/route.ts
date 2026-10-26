/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * This code is the property of NXA Software.
 */

import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { logFinancialAction } from "@/lib/logger"

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user) {
      console.error("Finance GET: No session found")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userRole = session.user.role
    const userId = session.user.id
    let userTenantId = (session.user as any)?.tenantId as string | null | undefined

    if (!userTenantId && userId) {
      const dbUser = await prisma.user.findUnique({
        where: { id: userId },
        select: { tenantId: true }
      })
      userTenantId = dbUser?.tenantId || null
    }

    const isSuperAdmin = userRole === "SUPER_ADMIN"
    const whereClause: any = !isSuperAdmin
      ? userTenantId
        ? {
            OR: [
              { tenantId: userTenantId },
              { project: { tenantId: userTenantId } }
            ]
          }
        : { tenantId: "non-existent-tenant" }
      : {}

    const transactions = await prisma.transaction.findMany({
      where: whereClause,
      include: {
        project: true,
        company: true,
        personnel: true
      },
      orderBy: {
        date: 'desc'
      }
    })
    return NextResponse.json(transactions)
  } catch (error) {
    console.error("Finance GET Error:", error)
    return NextResponse.json(
      { error: "İşlemler getirilirken hata oluştu" },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session?.user) {
      console.error("Finance POST: No session found")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    let userTenantId = (session.user as any)?.tenantId as string | null | undefined
    if (!userTenantId && session.user.id) {
      const dbUser = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { tenantId: true }
      })
      userTenantId = dbUser?.tenantId || null
    }

    const data = await request.json()
    const userName = session.user.name || "Bilinmeyen Kullanıcı"
    
    const transaction = await prisma.transaction.create({
      data: {
        type: data.type,
        amount: parseFloat(data.amount.toString()),
        description: data.description,
        category: data.category,
        tenantId: userTenantId || null,
        personnelId: data.personnelId || null,
        projectId: data.projectId || null,
        companyId: data.companyId || null
      },
      include: {
        project: true,
        company: true,
        personnel: true
      }
    })
    
    // Log the financial action with detailed information
    await logFinancialAction("EKLENDI", userName, transaction.amount, `${transaction.type} - ${transaction.description}`)
    
    return NextResponse.json({ success: true, transaction })
  } catch (error) {
    console.error("Finance POST Error:", error)
    return NextResponse.json({ error: "İşlem kaydedilemedi" }, { status: 500 })
  }
}
