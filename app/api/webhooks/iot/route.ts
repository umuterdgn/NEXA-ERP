import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { broadcastRealtimeEvent } from "@/lib/realtime/broadcast"

/**
 * IoT Turnike / BLE / RFID Webhook Endpoint
 * /api/webhooks/iot
 * 
 * Donanım giriş isteklerini dinler, personelin ISG / Stage-Gate yetkilerini denetler,
 * yetkisiz geçiş durumunda CRITICAL seviyeli NonConformance (DÖF) kaydı açar ve
 * İSG Radarı ile AuditLog'a güvenlik olayı bildirir.
 */
export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { rfid, action, timestamp, projectId, hasSafetyClearance } = body

    if (!rfid) {
      return NextResponse.json({ error: "RFID bilgisi eksik" }, { status: 400 })
    }

    // Projeyi bul veya ilk projeyi referans al
    let targetProjectId = projectId
    if (!targetProjectId) {
      const proj = await prisma.project.findFirst({ select: { id: true, name: true } })
      targetProjectId = proj?.id
    }

    // Personeli rfid (veya nfcUid, tcNo, id) ile ara
    const worker = await prisma.personel.findFirst({
      where: {
        OR: [
          { nfcUid: rfid },
          { tcNo: rfid },
          { id: rfid },
        ],
      },
      select: {
        id: true,
        name: true,
        position: true,
        status: true,
      },
    })

    // İSG ve Saha Yetki İzni (Stage-Gate) Kontrolü
    const isWorkerActive = worker && worker.status === "ACTIVE"
    const isCleared = hasSafetyClearance !== undefined ? Boolean(hasSafetyClearance) : Boolean(isWorkerActive)

    // EĞER İZİNSİZ GEÇİŞ İSE (Yetkisiz Baret / RFID)
    if (!isCleared) {
      let sysUser = await prisma.user.findFirst({
        where: { role: { in: ["ADMIN", "ISG_EXPERT", "ENGINEER"] } },
        select: { id: true, name: true },
      })
      if (!sysUser) {
        sysUser = await prisma.user.findFirst({ select: { id: true, name: true } })
      }

      let ncr = null
      if (targetProjectId && sysUser) {
        const reportNo = `NCR-ISG-${Date.now().toString().slice(-6)}`
        ncr = await prisma.nonConformance.create({
          data: {
            reportNo,
            projectId: targetProjectId,
            creatorId: sysUser.id,
            description: `İzinsiz Sahaya Giriş (Yetkisiz Baret/RFID): Personel [${rfid}] ${worker ? worker.name : "Bilinmeyen Baret/Ziyaretçi"} geçerli İSG veya giriş izni (Stage-Gate) olmaksızın turnikeden giriş yapmaya çalıştı. Turnike otomatik kilitlendi.`,
            deadline: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 saat süre
            status: "OPEN",
            severity: "CRITICAL",
          },
        })
      }

      // Değiştirilemez Siber Güvenlik AuditLog Kaydı
      if (sysUser) {
        await prisma.auditLog.create({
          data: {
            action: "BLOCKED_ENTRY",
            entityType: "IoT_Turnstile",
            entityId: rfid,
            userId: sysUser.id,
            userName: sysUser.name || "SYSTEM_IOT",
            summary: `Yetkisiz RFID Giriş Denemesi: ${rfid} (${worker ? worker.name : "Bilinmeyen Baret/Ziyaretçi"})`,
            reason: "İzinsiz Sahaya Giriş (Yetkisiz Baret/RFID) - Turnike kilitlendi ve CRITICAL NCR açıldı",
            newValues: {
              rfid,
              action: action || "ENTRY",
              timestamp: timestamp || new Date().toISOString(),
              status: "UNAUTHORIZED_ENTRY",
              severity: "CRITICAL",
              ncrReportNo: ncr?.reportNo,
            },
          },
        })
      }

      // İSG Radarına Canlı WebSocket Bildirimi
      await broadcastRealtimeEvent("isg-radar", "unauthorized-entry", {
        rfid,
        workerName: worker ? worker.name : "Yetkisiz Baret/Ziyaretçi",
        severity: "CRITICAL",
        action: "ENTRY_BLOCKED",
        ncrReportNo: ncr?.reportNo,
        timestamp: timestamp || new Date().toISOString(),
      })

      return NextResponse.json({
        ok: true,
        accessGranted: false,
        reason: "UNAUTHORIZED_ENTRY",
        warning: "İzinsiz Sahaya Giriş (Yetkisiz Baret/RFID)",
        severity: "CRITICAL",
        ncr,
      }, { status: 200 })
    }

    // YETKİLİ GEÇİŞ (Turnike Açılsın)
    return NextResponse.json({
      ok: true,
      accessGranted: true,
      worker: {
        id: worker?.id,
        name: worker ? worker.name : rfid,
      },
      action: action || "ENTRY",
      timestamp: timestamp || new Date().toISOString(),
    }, { status: 200 })

  } catch (error: any) {
    console.error("[IoT Webhook Error]", error)
    return NextResponse.json({ error: error.message || "IoT Webhook Error" }, { status: 500 })
  }
}
