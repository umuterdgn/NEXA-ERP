/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * WorkPackage (İş Paketi / Poz) API Route
 */

import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { recordAuditLog } from "@/lib/enterprise-core"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get("projectId")

    if (!projectId) {
      return NextResponse.json({ error: "Project ID is required" }, { status: 400 })
    }

    let workPackages = await prisma.workPackage.findMany({
      where: { projectId },
      include: {
        elements: true,
      },
      orderBy: { createdAt: "asc" },
    })

    // Eğer projede henüz Poz yoksa otomatik 4 varsayılan Poz oluştur:
    // 15.150.1005 C30 Betonarme, 15.270.1002 Tuğla Duvar, 25.100.1001 Mekanik Borulama, 35.100.1001 Elektrik Tava
    if (workPackages.length === 0) {
      const defaultPozlar = [
        {
          projectId,
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
        where: { projectId },
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
