/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * This code is the property of NXA Software.
 */

import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { logFinancialAction } from "@/lib/logger"
import { resolveApiAuth, requireAnyModule } from "@/lib/api-rbac"

export async function GET(request: Request) {
  try {
    const caller = await resolveApiAuth(request)
    if (!caller) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const denied = requireAnyModule(caller, ["finance_cash"])
    if (denied) return denied
    if (caller.role !== "SUPER_ADMIN" && caller.tenantType === "INSPECTION") {
      return NextResponse.json({ error: "Yapı denetim rolleri müteahhit kasa ucuna erişemez." }, { status: 403 })
    }

    const userRole = caller.role
    const userTenantId = caller.tenantId

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
    const caller = await resolveApiAuth(request)
    if (!caller) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const denied = requireAnyModule(caller, ["finance_cash"])
    if (denied) return denied
    if (caller.role !== "SUPER_ADMIN" && caller.tenantType === "INSPECTION") {
      return NextResponse.json({ error: "Yapı denetim rolleri müteahhit kasa ucuna erişemez." }, { status: 403 })
    }

    const userTenantId = caller.tenantId
    const data = await request.json()
    const userName = caller.name || "Bilinmeyen Kullanıcı"
    
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
