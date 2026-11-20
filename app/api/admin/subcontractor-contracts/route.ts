/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * This code is the property of NXA Software.
 */

import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import {
  resolveApiAuth,
  requireAnyModule,
  resolveSubcontractorCompanyIdForUser,
} from "@/lib/api-rbac"

export async function GET(request: NextRequest) {
  try {
    const caller = await resolveApiAuth(request)
    if (!caller) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const denied = requireAnyModule(caller, ["subcontractor_contracts", "contracts"])
    if (denied) return denied

    const isSuperAdmin = caller.role === "SUPER_ADMIN"
    const tenantId = caller.tenantId

    const whereClause: any = !isSuperAdmin ? (tenantId ? { tenantId } : { tenantId: "non-existent" }) : {}

    if (caller.role === "SUBCONTRACTOR") {
      const ownCompanyId = await resolveSubcontractorCompanyIdForUser(caller)
      if (!ownCompanyId) {
        return NextResponse.json([])
      }
      whereClause.subcontractorId = ownCompanyId
    }

    const contracts = await prisma.contract.findMany({
      where: whereClause,
      include: {
        subcontractor: {
          select: { id: true, name: true }
        },
        project: {
          select: { id: true, name: true }
        }
      },
      orderBy: { createdAt: "desc" }
    })

    return NextResponse.json(contracts)
  } catch (error) {
    console.error("Failed to fetch contracts:", error)
    return NextResponse.json(
      { error: "Sözleşmeler yüklenirken hata oluştu" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const caller = await resolveApiAuth(request)
    if (!caller) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const denied = requireAnyModule(caller, ["subcontractor_contracts", "contracts"])
    if (denied) return denied
    if (caller.role === "SUBCONTRACTOR") {
      return NextResponse.json({ error: "Taşeron yeni sözleşme oluşturamaz" }, { status: 403 })
    }

    const tenantId = caller.tenantId

    const body = await request.json()
    const { title, subcontractorId, projectId, totalAmount, startDate, endDate, status } = body

    if (!title || !subcontractorId || !projectId || !totalAmount) {
      return NextResponse.json(
        { error: "Tüm zorunlu alanları doldurun" },
        { status: 400 }
      )
    }

    const contract = await prisma.contract.create({
      data: {
        title,
        subcontractorId,
        projectId,
        totalAmount: parseFloat(totalAmount),
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        status: status || "ACTIVE",
        tenantId: tenantId || null,
      },
      include: {
        subcontractor: {
          select: { id: true, name: true }
        },
        project: {
          select: { id: true, name: true }
        }
      }
    })

    return NextResponse.json(contract, { status: 201 })
  } catch (error) {
    console.error("Failed to create contract:", error)
    return NextResponse.json(
      { error: "Sözleşme oluşturulurken hata oluştu" },
      { status: 500 }
    )
  }
}
