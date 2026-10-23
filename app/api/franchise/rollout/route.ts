/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Franchise Rollout (Kanban & Harita) Veri ve Aşama Güncelleme API'si
 */

import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 })
    }

    const projects = await prisma.project.findMany({
      include: {
        storeTemplate: true,
        stageGates: {
          orderBy: { createdAt: "asc" },
        },
        punchLists: true,
      },
      orderBy: { createdAt: "desc" },
    })

    // Rollout aşamasını hesaplama:
    // 1. Kiralama Aşamasında (KİRALAMA onaylanmamış veya status === 'KİRALAMA' / 'ETUT')
    // 2. İdari İzinler / AVM Onayı (AVM_ONAYI onaylanmamış)
    // 3. İnşaatta / Uygulamada (KABA_YAPI veya status === 'SAHA')
    // 4. Punch List / Denetimde (Açık kusurları olan veya İTFAİYE_ONAYI aşamasında)
    // 5. Açılışa Hazır (Tüm stage-gate'ler onaylı, punch list açık kusuru yok veya status === 'TAMAMLANDI')
    const enrichedProjects = projects.map((p) => {
      const openDefects = p.punchLists.filter((item) => item.status === "OPEN").length
      const fixedDefects = p.punchLists.filter((item) => item.status === "FIXED").length
      const totalGates = p.stageGates.length
      const approvedGates = p.stageGates.filter((g) => g.isApproved).length

      // Varsayılan koordinatlar (Eğer latitude/longitude girilmemişse Türkiye şehirlerine göre eşle)
      let lat = p.latitude
      let lng = p.longitude
      if (!lat || !lng) {
        const cityUpper = (p.city || "").toUpperCase()
        if (cityUpper.includes("İSTANBUL") || cityUpper.includes("ISTANBUL")) {
          lat = 41.0082; lng = 28.9784
        } else if (cityUpper.includes("ANKARA")) {
          lat = 39.9334; lng = 32.8597
        } else if (cityUpper.includes("İZMİR") || cityUpper.includes("IZMIR")) {
          lat = 38.4237; lng = 27.1428
        } else if (cityUpper.includes("BURSA")) {
          lat = 40.1885; lng = 29.0610
        } else if (cityUpper.includes("ANTALYA")) {
          lat = 36.8969; lng = 30.7133
        } else if (cityUpper.includes("ADANA")) {
          lat = 37.0000; lng = 35.3213
        } else if (cityUpper.includes("TRABZON")) {
          lat = 41.0027; lng = 39.7168
        } else if (cityUpper.includes("GAZİANTEP")) {
          lat = 37.0662; lng = 37.3833
        } else {
          lat = 39.0; lng = 35.0 // Türkiye merkezi
        }
      }

      // Rollout kanban sütunu belirleme
      let rolloutPhase = "KIRALAMA"
      if (p.status === "TAMAMLANDI" || (totalGates > 0 && approvedGates === totalGates && openDefects === 0)) {
        rolloutPhase = "ACILISA_HAZIR"
      } else if (openDefects > 0 || (totalGates >= 4 && approvedGates >= 3)) {
        rolloutPhase = "PUNCH_LIST"
      } else if (p.status === "SAHA" || (totalGates >= 3 && approvedGates >= 2)) {
        rolloutPhase = "INSAATTA"
      } else if (totalGates >= 2 && approvedGates >= 1) {
        rolloutPhase = "AVM_ONAYI"
      }

      return {
        ...p,
        latitude: lat,
        longitude: lng,
        openDefects,
        fixedDefects,
        totalGates,
        approvedGates,
        rolloutPhase,
      }
    })

    return NextResponse.json({ projects: enrichedProjects })
  } catch (error: any) {
    console.error("❌ Rollout GET Error:", error)
    return NextResponse.json({ error: error.message || "Rollout verisi alınamadı" }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 })
    }

    const body = await request.json()
    const { projectId, rolloutPhase, progress } = body

    if (!projectId) {
      return NextResponse.json({ error: "projectId zorunludur" }, { status: 400 })
    }

    // Rollout phase mapping to project status
    let newStatus: string | undefined
    if (rolloutPhase === "KIRALAMA") newStatus = "ETUT"
    else if (rolloutPhase === "AVM_ONAYI") newStatus = "CIZIM"
    else if (rolloutPhase === "INSAATTA") newStatus = "SAHA"
    else if (rolloutPhase === "PUNCH_LIST") newStatus = "SAHA"
    else if (rolloutPhase === "ACILISA_HAZIR") newStatus = "TAMAMLANDI"

    const updated = await prisma.project.update({
      where: { id: projectId },
      data: {
        ...(newStatus ? { status: newStatus } : {}),
        ...(progress !== undefined ? { progress: Number(progress) } : {}),
      },
    })

    return NextResponse.json({ project: updated, success: true })
  } catch (error: any) {
    console.error("❌ Rollout PATCH Error:", error)
    return NextResponse.json({ error: error.message || "Rollout aşaması güncellenemedi" }, { status: 500 })
  }
}
