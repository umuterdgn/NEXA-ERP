/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * WorkPackage (İş Paketi / Poz) API Route
 */

import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { recordAuditLog } from "@/lib/enterprise-core"

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    const userRole = session?.user?.role as string
    const isSuperAdmin = userRole === "SUPER_ADMIN"
    const tenantId = (session?.user as any)?.tenantId as string | undefined

    if (!session?.user || (!tenantId && !isSuperAdmin)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get("projectId")

    if (!projectId) {
      return NextResponse.json({ error: "Project ID is required" }, { status: 400 })
    }

    const tenantFilter: any = !isSuperAdmin ? (tenantId ? { tenantId } : { tenantId: "non-existent" }) : {}

    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        ...tenantFilter,
      }
    })

    if (!project) {
      return NextResponse.json({ error: "Project not found or access denied" }, { status: 404 })
    }

    let workPackages = await prisma.workPackage.findMany({
      where: {
        projectId,
        ...tenantFilter,
      },
      include: {
        elements: true,
      },
      orderBy: { createdAt: "asc" },
    })

    // Eğer projede henüz Poz yoksa otomatik 4 varsayılan Poz oluştur:
    if (workPackages.length === 0) {
      const defaultPozlar = [
        {
          projectId,
          tenantId: tenantId || null,
          pozNo: "15.150.1005",
          name: "C30/37 Betonarme Kolon ve Döşeme İmalatı",
          categoryKey: "statik",
          unit: "m3",
          unitPrice: 3200,
          plannedQuantity: 500,
          completedQuantity: 0,
          subcontractorName: "Kaba Yapı & Betonarme Taşeronu",
        },
        {
          projectId,
          tenantId: tenantId || null,
          pozNo: "15.270.1002",
          name: "Tuğla Duvar ve Bölme İmalatı",
          categoryKey: "mimari",
          unit: "m2",
          unitPrice: 850,
          plannedQuantity: 1200,
          completedQuantity: 0,
          subcontractorName: "İnce İşler & Duvar Taşeronu",
        },
        {
          projectId,
          tenantId: tenantId || null,
          pozNo: "25.100.1001",
          name: "Mekanik Borulama ve Havalandırma Tesisatı",
          categoryKey: "mekanik",
          unit: "mt",
          unitPrice: 1450,
          plannedQuantity: 800,
          completedQuantity: 0,
          subcontractorName: "Mekanik Tesisat Taşeronu",
        },
        {
          projectId,
          tenantId: tenantId || null,
          pozNo: "35.100.1001",
          name: "Elektrik Tava ve Kablolama Tesisatı",
          categoryKey: "elektrik",
          unit: "mt",
          unitPrice: 950,
          plannedQuantity: 1500,
          completedQuantity: 0,
          subcontractorName: "Elektrik Donatısı Taşeronu",
        },
      ]

      await prisma.workPackage.createMany({
        data: defaultPozlar,
      })

      // Denetim İzi (AuditLog) kaydı oluştur
      await recordAuditLog({
        projectId,
        action: "BOQ_LINKED",
        entityType: "WorkPackage",
        summary: "Proje için 4 adet kurumsal 5D BIM Poz / İş Paketi otomatik olarak oluşturuldu.",
        newValues: { count: 4, pozlar: defaultPozlar.map((p) => p.pozNo) },
      })

      workPackages = await prisma.workPackage.findMany({
        where: {
          projectId,
          ...tenantFilter,
        },
        include: {
          elements: true,
        },
        orderBy: { createdAt: "asc" },
      })
    }

    return NextResponse.json(workPackages)
  } catch (error: any) {
    console.error("Failed to fetch work packages:", error)
    return NextResponse.json({ error: error?.message || "Failed to fetch work packages" }, { status: 500 })
  }
}
