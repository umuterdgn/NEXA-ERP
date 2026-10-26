/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Tenant White-Label & Branding API (/api/tenant/branding)
 */

import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const tenantId = (session.user as any)?.tenantId

    if (!tenantId) {
      // Varsayılan Nexa Branding
      return NextResponse.json({
        success: true,
        branding: {
          name: "Nexa ERP",
          logoUrl: null,
          primaryColor: "#3B82F6",
          isWhiteLabelActive: false,
        },
      })
    }

    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: {
        id: true,
        name: true,
        logoUrl: true,
        primaryColor: true,
        isWhiteLabelActive: true,
      },
    })

    if (!tenant) {
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      branding: {
        id: tenant.id,
        name: tenant.name,
        logoUrl: tenant.logoUrl,
        primaryColor: tenant.primaryColor || "#3B82F6",
        isWhiteLabelActive: Boolean(tenant.isWhiteLabelActive),
      },
    })
  } catch (error: any) {
    console.error("Fetch branding error:", error)
    return NextResponse.json({ error: "Failed to fetch branding" }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const tenantId = (session.user as any)?.tenantId
    if (!tenantId) {
      return NextResponse.json({ error: "Bu kullanıcı bir firmaya bağlı değil" }, { status: 400 })
    }

    const body = await request.json()
    const { logoUrl, primaryColor } = body

    const dataToUpdate: any = {}
    if (typeof logoUrl !== "undefined") dataToUpdate.logoUrl = logoUrl ? String(logoUrl).trim() : null
    if (typeof primaryColor !== "undefined") dataToUpdate.primaryColor = primaryColor ? String(primaryColor).trim() : "#3B82F6"

    const updated = await prisma.tenant.update({
      where: { id: tenantId },
      data: dataToUpdate,
      select: {
        id: true,
        name: true,
        logoUrl: true,
        primaryColor: true,
        isWhiteLabelActive: true,
      },
    })

    return NextResponse.json({ success: true, branding: updated })
  } catch (error: any) {
    console.error("Update branding error:", error)
    return NextResponse.json({ error: "Marka ayarları kaydedilemedi" }, { status: 500 })
  }
}
