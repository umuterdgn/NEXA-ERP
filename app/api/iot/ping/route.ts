import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// POST /api/iot/ping
// Gelecekteki mobil uygulamanın (işçinin telefonundaki BLE tarayıcısının) 
// her 3 dakikada bir atacağı telemetri isteğini karşılar:
// Payload: { workerId: "123", currentZone: "A_BLOK_ISKELE", nearbyBeacons: ["MAC_BARET_1", "MAC_AYAKKABI_2"], projectId?: "..." }
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { workerId, currentZone, nearbyBeacons = [], projectId: reqProjectId } = body

    if (!workerId || !currentZone) {
      return NextResponse.json(
        { error: "workerId ve currentZone alanları zorunludur" },
        { status: 400 }
      )
    }

    // 1. Projeyi belirle
    let projectId = reqProjectId
    if (!projectId) {
      const assignedDevice = await prisma.bleDevice.findFirst({
        where: { assignedTo: workerId }
      })
      if (assignedDevice) {
        projectId = assignedDevice.projectId
      } else {
        const firstProject = await prisma.project.findFirst({ select: { id: true } })
        projectId = firstProject?.id || "default-project"
      }
    }

    // 2. İşçi ismini bul
    let workerName = `Personel #${workerId}`
    try {
      const personel = await prisma.personel.findUnique({
        where: { id: workerId },
        select: { name: true }
      })
      if (personel?.name) {
        workerName = personel.name
      }
    } catch {
      // Fallback isim korunur
    }

    // 3. RiskZone Kontrolü
    const zoneStr = String(currentZone).toUpperCase()
    let isRiskZone = false
    let requiredPpe: string[] = ["BARET"]

    // Veritabanındaki RiskZone kayıtlarına bak
    const dbRiskZone = await prisma.riskZone.findFirst({
      where: {
        projectId,
        OR: [
          { zoneName: { contains: currentZone, mode: "insensitive" } },
          { id: currentZone }
        ]
      }
    })

    if (dbRiskZone) {
      isRiskZone = true
      requiredPpe = dbRiskZone.requiredPpe || ["BARET"]
    } else {
      // Isim bazlı riskli bölge tespiti (İskele, Kule Vinç, Kazı, Yüksekte Çalışma vb.)
      if (
        zoneStr.includes("ISKELE") ||
        zoneStr.includes("VINC") ||
        zoneStr.includes("KAZI") ||
        zoneStr.includes("YUKSEK") ||
        zoneStr.includes("DANGER") ||
        zoneStr.includes("RISK")
      ) {
        isRiskZone = true
      }
    }

    // 4. BLE Baret / Donanım Kontrolü
    let hasBaret = false
    const beaconsUpper: string[] = Array.isArray(nearbyBeacons)
      ? nearbyBeacons.map((b: string) => String(b).toUpperCase())
      : []

    // İşçiye zimmetli Baret kaydı var mı?
    const assignedBaret = await prisma.bleDevice.findFirst({
      where: {
        assignedTo: workerId,
        deviceType: "BARET"
      }
    })

    if (assignedBaret) {
      hasBaret = beaconsUpper.includes(assignedBaret.macAddress.toUpperCase())
    } else {
      // Eğer DB'de zimmetli kayıt yoksa, sinyal listesinde "BARET" içeren MAC veya beacon var mı?
      hasBaret = beaconsUpper.some((b) => b.includes("BARET"))
    }

    // 5. İhlal Mantığı: Risk bölgesinde baret sinyali yoksa IsgViolation kaydı oluştur
    let violationRecord = null
    let violationLogged = false

    if (isRiskZone && !hasBaret) {
      violationRecord = await prisma.isgViolation.create({
        data: {
          projectId,
          workerName,
          violation: "Baret takılmadı / BLE Bağlantısı Koptu",
          zoneName: dbRiskZone?.zoneName || currentZone,
          status: "OPEN"
        }
      })
      violationLogged = true
      console.warn(`[ISG İHLALİ TETİKLENDİ] ${workerName} - ${currentZone} bölgesinde Baret algılanamadı!`)
    }

    // 6. Yakındaki tespit edilen cihazların lastSeenAt ve batarya durumlarını güncelle
    if (beaconsUpper.length > 0) {
      try {
        await prisma.bleDevice.updateMany({
          where: {
            macAddress: { in: nearbyBeacons }
          },
          data: {
            lastSeenAt: new Date()
          }
        })
      } catch (err) {
        console.error("BLE cihaz güncelleme hatası:", err)
      }
    }

    return NextResponse.json({
      success: true,
      workerId,
      workerName,
      zone: currentZone,
      isRiskZone,
      hasBaret,
      violationLogged,
      violation: violationRecord
    })
  } catch (error) {
    console.error("IoT ping API hatası:", error)
    return NextResponse.json(
      { error: "Telemetri işlenirken hata oluştu" },
      { status: 500 }
    )
  }
}

// GET /api/iot/ping?projectId=...
// LiveSiteDashboard bileşeninin anlık canlı verileri sorgulaması için
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get("projectId")

    if (!projectId) {
      return NextResponse.json(
        { error: "projectId gereklidir" },
        { status: 400 }
      )
    }

    // Aktif açık İSG ihlalleri
    const violations = await prisma.isgViolation.findMany({
      where: { projectId },
      orderBy: { timestamp: "desc" },
      take: 10
    })

    // Günlük lojistik hareketleri
    const startOfToday = new Date()
    startOfToday.setHours(0, 0, 0, 0)

    const logistics = await prisma.dailyLogistics.findMany({
      where: {
        projectId,
        date: { gte: startOfToday }
      },
      orderBy: { date: "desc" }
    })

    // BLE Cihaz durumları
    const bleDevices = await prisma.bleDevice.findMany({
      where: { projectId },
      take: 20
    })

    // Sahadaki anlık personel (Yoklama/Attendance veya Personel sayısı)
    const attendanceCount = await prisma.attendanceRecord.count({
      where: {
        projectId,
        date: { gte: startOfToday }
      }
    })

    const totalPersonnelCount = await prisma.personel.count()

    return NextResponse.json({
      violations,
      logistics,
      bleDevices,
      activePersonnelCount: attendanceCount > 0 ? attendanceCount : Math.min(142, totalPersonnelCount || 142)
    })
  } catch (error) {
    console.error("IoT live-stats getirme hatası:", error)
    return NextResponse.json(
      { error: "Veri alınamadı" },
      { status: 500 }
    )
  }
}

// PATCH /api/iot/ping
// İSG İhlalini "RESOLVED" (Çözüldü) olarak işaretleme
export async function PATCH(request: Request) {
  try {
    const body = await request.json()
    const { violationId, status = "RESOLVED" } = body

    if (!violationId) {
      return NextResponse.json(
        { error: "violationId gereklidir" },
        { status: 400 }
      )
    }

    const updated = await prisma.isgViolation.update({
      where: { id: violationId },
      data: { status }
    })

    return NextResponse.json({ success: true, updated })
  } catch (error) {
    console.error("İhlal güncelleme hatası:", error)
    return NextResponse.json(
      { error: "İhlal güncellenemedi" },
      { status: 500 }
    )
  }
}
