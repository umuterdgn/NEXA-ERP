/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Subcontractor Tasks & Site Instructions Actions
 */

"use server"

import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { revalidatePath } from "next/cache"

export async function getSubcontractorTasks() {
  try {
    const session = await auth()
    const userId = session?.user?.id

    let companyId: string | null = null

    if (userId) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { companyId: true, role: true }
      })
      companyId = user?.companyId || null

      if (!companyId) {
        const personel = await prisma.personel.findFirst({
          where: { userId },
          select: { companyId: true }
        })
        companyId = personel?.companyId || null
      }
    }

    // Build query for site instructions
    const whereClause: any = {}
    if (companyId) {
      whereClause.OR = [
        { subcontractorId: companyId },
        { subcontractorId: null }, // Genel şantiye talimatları
      ]
    }

    let instructions = await prisma.siteInstruction.findMany({
      where: whereClause,
      include: {
        project: {
          select: { id: true, name: true, title: true }
        }
      },
      orderBy: { createdAt: "desc" }
    })

    // If database has 0 instructions, let's seed standard site instructions for demo/testing
    if (instructions.length === 0) {
      const firstProject = await prisma.project.findFirst()
      if (firstProject && userId) {
        await prisma.siteInstruction.createMany({
          data: [
            {
              projectId: firstProject.id,
              createdById: userId,
              subcontractorId: companyId,
              title: "A Blok 3. Kat Kolon Donatı Paspayı Revizyonu",
              description: "Kalıp öncesi kontrollerde 3. kat A-4 ve A-5 kolonlarında paspayı elemanlarının eksik olduğu tespit edilmiştir. Beton dökümünden önce standart 3cm plastik paspayları yerleştirilmelidir.",
              priority: "URGENT",
              status: "OPEN",
              attachments: ["/uploads/paspayi-detay.jpg"],
            },
            {
              projectId: firstProject.id,
              createdById: userId,
              subcontractorId: companyId,
              title: "Bodrum Kat Perde İskele Güvenlik Ağı Montajı",
              description: "Dış aks iskelelerinde İSG yönetmeliğine uygun düşme durdurucu güvenlik ağlarının takviye edilmesi gerekmektedir.",
              priority: "NORMAL",
              status: "IN_PROGRESS",
              attachments: [],
            },
            {
              projectId: firstProject.id,
              createdById: userId,
              subcontractorId: companyId,
              title: "B Blok Zemin Kat Şap Öncesi Temizlik ve Mastar Kontrolü",
              description: "Döşeme şapı atılmadan önce yüzeydeki harç artıkları temizlenmeli ve kot mastarları şantiye teknik ekibi ile birlikte kontrol edilmelidir.",
              priority: "LOW",
              status: "RESOLVED",
              attachments: [],
            }
          ]
        })

        instructions = await prisma.siteInstruction.findMany({
          where: whereClause,
          include: {
            project: {
              select: { id: true, name: true, title: true }
            }
          },
          orderBy: { createdAt: "desc" }
        })
      }
    }

    // Also fetch WorkOrders if any
    const workOrders = await prisma.workOrder.findMany({
      take: 20,
      include: {
        project: { select: { id: true, name: true } },
        assignedTo: { select: { id: true, name: true } }
      },
      orderBy: { createdAt: "desc" }
    })

    return {
      success: true,
      instructions,
      workOrders,
      userRole: session?.user?.role || "GUEST",
    }
  } catch (error: any) {
    console.error("getSubcontractorTasks error:", error)
    return { success: false, error: error?.message || "Görevler getirilemedi", instructions: [], workOrders: [] }
  }
}

export async function updateSiteInstructionStatus(instructionId: string, status: string) {
  try {
    const updated = await prisma.siteInstruction.update({
      where: { id: instructionId },
      data: { status }
    })

    revalidatePath("/subcontractor/tasks")
    revalidatePath("/subcontractor")
    return { success: true, updated }
  } catch (error: any) {
    console.error("updateSiteInstructionStatus error:", error)
    return { success: false, error: error?.message || "Durum güncellenemedi" }
  }
}
