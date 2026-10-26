/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Geofencing & Turf.js Uzaysal Analiz Motoru (Cron / Webhook / Canlı Radar)
 * 
 * - Personel MAIN_SITE dışındaysa: Puantajı durdurur ("Şantiye Dışında" / checkOut)
 * - Personel DANGER_ZONE içindeyse: SystemErrorLog ve Notification tablolarına anlık kırmızı İSG alarmı atar.
 */

import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import * as turf from "@turf/turf"

export const dynamic = "force-dynamic"

// Turf GeoJSON poligon oluşturucu
function toTurfPolygon(coords: any[]) {
  if (!Array.isArray(coords) || coords.length < 3) return null
  try {
    const ring: [number, number][] = coords.map((c: any) => [Number(c.lng), Number(c.lat)])
    // İlk ve son nokta aynı olmalıdır
    const first = ring[0]
    const last = ring[ring.length - 1]
    if (first[0] !== last[0] || first[1] !== last[1]) {
      ring.push([first[0], first[1]])
    }
    if (ring.length < 4) return null
    return turf.polygon([ring])
  } catch (err) {
    console.error("Geçersiz poligon:", err)
    return null
  }
}

export async function GET(request: NextRequest) {
  return handleGeofenceCheck(request)
}

export async function POST(request: NextRequest) {
  return handleGeofenceCheck(request)
}

async function handleGeofenceCheck(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const queryProjectId = searchParams.get("projectId")

    // İsteğe bağlı POST body verisi (Nexa Mobile'dan anlık GPS akışı gelebilir)
    let bodyData: any = {}
    try {
      if (request.method === "POST") {
        bodyData = await request.json()
      }
    } catch {}

    const targetPersonelId = bodyData.personelId
    const inputLat = bodyData.lat !== undefined ? Number(bodyData.lat) : undefined
    const inputLng = bodyData.lng !== undefined ? Number(bodyData.lng) : undefined
    const projectIdOverride = bodyData.projectId || queryProjectId

    // 1. Kontrol edilecek personelleri tespit et
    let personnelList: any[] = []

    if (targetPersonelId && inputLat !== undefined && inputLng !== undefined) {
      // Tek bir personelin canlı GPS koordinatını güncelle ve hemen analiz et
      const updatedPerson = await prisma.personel.update({
        where: { id: targetPersonelId },
        data: {
          lastKnownLat: inputLat,
          lastKnownLng: inputLng,
          lastLocationAt: new Date(),
          currentProjectId: projectIdOverride || undefined
        }
      })
      personnelList = [updatedPerson]
    } else {
      // Sistemdeki konumu akan aktif personelleri listele
      personnelList = await prisma.personel.findMany({
        where: {
          status: "ACTIVE",
          lastKnownLat: { not: null },
          lastKnownLng: { not: null }
        },
        take: 100
      })

      // Eğer henüz konumu akan personel yoksa, demo ve test için ilk 5 aktif personeli alıp proje koordinatlarına konumla
      if (personnelList.length === 0) {
        const defaultProject = await prisma.project.findFirst({
          where: { latitude: { not: null }, longitude: { not: null } },
          select: { id: true, latitude: true, longitude: true, tenantId: true }
        })

        if (defaultProject && defaultProject.latitude && defaultProject.longitude) {
          const samplePersonnel = await prisma.personel.findMany({
            where: { status: "ACTIVE" },
            take: 4
          })

          for (let i = 0; i < samplePersonnel.length; i++) {
            const p = samplePersonnel[i]
            // Rastgele 1 kişiyi şantiye dışına, 1 kişiyi vinç altına simüle et
            const offsetLat = i === 0 ? 0.0035 : i === 1 ? 0.0003 : 0.0001
            const offsetLng = i === 0 ? 0.0035 : i === 1 ? 0.0004 : 0.0001

            const updated = await prisma.personel.update({
              where: { id: p.id },
              data: {
                lastKnownLat: defaultProject.latitude + offsetLat,
                lastKnownLng: defaultProject.longitude + offsetLng,
                lastLocationAt: new Date(),
                currentProjectId: defaultProject.id
              }
            })
            personnelList.push(updated)
          }
        }
      }
    }

    const results: any[] = []
    const triggeredViolations: any[] = []
    const outOfSiteWorkers: any[] = []

    // 2. Her bir personel için Turf.js poligon kesişim analizi yap
    for (const person of personnelList) {
      const lat = person.lastKnownLat
      const lng = person.lastKnownLng
      if (lat === null || lng === null || lat === undefined || lng === undefined) continue

      const workerPoint = turf.point([lng, lat])

      // Personelin bağlı olduğu projeyi bul
      const targetProjectId = person.currentProjectId || projectIdOverride
      let project = targetProjectId
        ? await prisma.project.findUnique({
            where: { id: targetProjectId },
            select: { id: true, title: true, name: true, managerId: true, tenantId: true }
          })
        : null

      if (!project) {
        project = await prisma.project.findFirst({
          where: { latitude: { not: null } },
          select: { id: true, title: true, name: true, managerId: true, tenantId: true }
        })
      }

      if (!project) continue

      // Projeye ait GeofenceZone ve SiteZone kayıtlarını topla
      const geofenceZones = await prisma.geofenceZone.findMany({
        where: { projectId: project.id, isActive: true }
      })

      const siteZones = await prisma.siteZone.findMany({
        where: { projectId: project.id }
      })

      // Poligonları normalize et
      interface NormalizedZone {
        id: string
        name: string
        type: "MAIN_SITE" | "DANGER_ZONE" | "REST_AREA"
        turfPolygon: any
      }

      const allNormalized: NormalizedZone[] = []

      // 1) GeofenceZone listesi
      for (const gz of geofenceZones) {
        const poly = toTurfPolygon(gz.coordinates as any)
        if (poly) {
          allNormalized.push({
            id: gz.id,
            name: gz.name,
            type: gz.type as any,
            turfPolygon: poly
          })
        }
      }

      // 2) SiteZone listesi (GeofenceZone'da olmayanlar için)
      for (const sz of siteZones) {
        if (!allNormalized.some((z) => z.name === sz.title)) {
          let coords = sz.polygonCoordinates as any
          if (typeof coords === "string") {
            try { coords = JSON.parse(coords) } catch {}
          }
          const poly = toTurfPolygon(coords)
          if (poly) {
            allNormalized.push({
              id: sz.id,
              name: sz.title,
              type: sz.zoneType as any || (sz.category === "RISK" ? "DANGER_ZONE" : "MAIN_SITE"),
              turfPolygon: poly
            })
          }
        }
      }

      // Poligon Grupları
      const mainSiteZones = allNormalized.filter((z) => z.type === "MAIN_SITE")
      const dangerZones = allNormalized.filter((z) => z.type === "DANGER_ZONE")
      const restZones = allNormalized.filter((z) => z.type === "REST_AREA")

      // -------------------------------------------------------------
      // KURAL 1: MAIN_SITE Poligonunun Dışındaysa (Puantaj / Mesai Durdurma)
      // -------------------------------------------------------------
      let isInsideMainSite = true
      if (mainSiteZones.length > 0) {
        isInsideMainSite = mainSiteZones.some((z) =>
          turf.booleanPointInPolygon(workerPoint, z.turfPolygon)
        )
      }

      if (!isInsideMainSite) {
        // Personel Şantiye Dışında!
        await prisma.personel.update({
          where: { id: person.id },
          data: { isOutOfSite: true }
        })

        // Açık puantaj kaydını kapat (Mesaiyi o an itibariyle durdur)
        const todayStart = new Date()
        todayStart.setHours(0, 0, 0, 0)

        const activeAttendance = await prisma.attendanceRecord.findFirst({
          where: {
            personelId: person.id,
            date: { gte: todayStart },
            checkOut: null
          }
        })

        if (activeAttendance) {
          await prisma.attendanceRecord.update({
            where: { id: activeAttendance.id },
            data: {
              status: "OUT_OF_SITE",
              checkOut: new Date()
            }
          })
        }

        outOfSiteWorkers.push({
          personelId: person.id,
          name: person.name,
          reason: "MAIN_SITE sınırları dışına çıktı - Mesai durduruldu"
        })
      } else {
        // Şantiye içine geri girdiyse outOfSite bayrağını temizle
        if (person.isOutOfSite) {
          await prisma.personel.update({
            where: { id: person.id },
            data: { isOutOfSite: false }
          })
        }
      }

      // -------------------------------------------------------------
      // KURAL 2: DANGER_ZONE (Kırmızı Alan) Poligonunun İçindeyse (İSG Alarmı)
      // -------------------------------------------------------------
      for (const dz of dangerZones) {
        const isInsideDanger = turf.booleanPointInPolygon(workerPoint, dz.turfPolygon)

        if (isInsideDanger) {
          const alarmText = `İSG İHLALİ: ${person.name} riskli alana (${dz.name}) girdi!`

          // 1. SystemErrorLog tablosuna telemetri alarmı kaydet
          await prisma.systemErrorLog.create({
            data: {
              tenantId: person.tenantId || project.tenantId,
              userId: person.userId || null,
              module: "ISG_GEOFENCE_ALARM",
              errorMessage: `🚨 ${alarmText}`,
              errorStack: `[Turf.js Geofence Engine] Konum: [Lat: ${lat}, Lng: ${lng}], Tehlikeli Bölge: ${dz.name} (${dz.id}), Proje: ${project.title || project.name}`,
              isResolved: false
            }
          })

          // 2. IsgViolation tablosuna kaydet
          await prisma.isgViolation.create({
            data: {
              projectId: project.id,
              workerName: person.name,
              zoneName: dz.name,
              violation: alarmText,
              status: "OPEN"
            }
          }).catch(() => null)

          // 3. Proje Müdürü ve Superadmin'e Kırmızı Toast/Zil Bildirimi (Notification) üret
          const recipients = await prisma.user.findMany({
            where: {
              OR: [
                { id: project.managerId || undefined },
                { role: "ADMIN", tenantId: project.tenantId || undefined },
                { role: "SUPER_ADMIN" }
              ]
            },
            select: { id: true }
          })

          for (const recipient of recipients) {
            await prisma.notification.create({
              data: {
                userId: recipient.id,
                title: "🚨 İSG RİSK ALANI İHLALİ!",
                message: alarmText,
                type: "URGENT",
                link: `/admin/projects/${project.id}?tab=vaziyet`
              }
            }).catch(() => null)
          }

          triggeredViolations.push({
            personelId: person.id,
            name: person.name,
            zone: dz.name,
            message: alarmText
          })
        }
      }

      results.push({
        personelId: person.id,
        name: person.name,
        lat,
        lng,
        isInsideMainSite,
        triggeredDanger: dangerZones.some((dz) =>
          turf.booleanPointInPolygon(workerPoint, dz.turfPolygon)
        )
      })
    }

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      checkedCount: personnelList.length,
      outOfSiteCount: outOfSiteWorkers.length,
      violationsCount: triggeredViolations.length,
      outOfSiteWorkers,
      violations: triggeredViolations,
      results
    })
  } catch (error: any) {
    console.error("Geofence Check Cron Error:", error)
    return NextResponse.json(
      { error: error?.message || "Geofence denetim motoru hatası" },
      { status: 500 }
    )
  }
}
