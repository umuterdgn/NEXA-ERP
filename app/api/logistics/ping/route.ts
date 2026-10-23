/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Lojistik ve Sevkiyat Canlı Konum (Ping) Endpoint'i
 * OSRM (Open Source Routing Machine) ile anlık ETA ve gecikme hesaplar.
 * Eğer hesaplanan ETA planlanan teslimat saatini 60 dakika aşarsa;
 * bağlı Gantt iş emrini (linkedTaskId) 1 saat öteler ve Şantiye Şefine bildirim fırlatır.
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { liveLogisticsCache } from "@/lib/logistics-cache";

// Kuş uçuşu mesafe hesaplayıcı (OSRM çevrimdışı/yavaşsa güvenli fallback)
function calculateHaversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Dünya yarıçapı km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      trackingCode,
      latitude,
      longitude,
      status,
      speed,
      heading,
      accuracy,
    } = body;

    if (!trackingCode || typeof latitude !== "number" || typeof longitude !== "number") {
      return NextResponse.json(
        { error: "trackingCode, latitude ve longitude parametreleri zorunludur." },
        { status: 400 }
      );
    }

    // 1. Veritabanındaki güncel sevkiyatı ve hedef projeyi çek
    const shipment = await prisma.shipmentTracking.findUnique({
      where: { trackingCode },
      include: {
        purchaseRequest: {
          include: {
            project: {
              select: {
                id: true,
                name: true,
                latitude: true,
                longitude: true,
                companyId: true,
              },
            },
            deliveryAppointments: {
              orderBy: { scheduledDate: "asc" },
              take: 1,
            },
          },
        },
      },
    });

    if (!shipment) {
      return NextResponse.json(
        { error: "Sevkiyat takip kodu bulunamadı." },
        { status: 404 }
      );
    }

    const currentStatus = shipment.status || "PREPARING";
    const newStatus = status || currentStatus;

    // 2. OSRM API ile Gerçek Yol ve Tahmini Varış Süresi (ETA) Hesaplama
    const destLat = shipment.purchaseRequest?.project?.latitude;
    const destLng = shipment.purchaseRequest?.project?.longitude;

    let durationSeconds = 3600; // Varsayılan 1 saat
    let distanceMeters = 30000; // Varsayılan 30 km
    let routeFound = false;

    if (destLat && destLng) {
      try {
        // OSRM API URL: {lng1},{lat1};{lng2},{lat2}
        const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${longitude},${latitude};${destLng},${destLat}?overview=false`;
        const osrmRes = await fetch(osrmUrl, {
          signal: AbortSignal.timeout(4000),
        });

        if (osrmRes.ok) {
          const osrmData = await osrmRes.json();
          if (osrmData.code === "Ok" && osrmData.routes?.[0]) {
            durationSeconds = osrmData.routes[0].duration;
            distanceMeters = osrmData.routes[0].distance;
            routeFound = true;
          }
        }
      } catch (err) {
        console.warn("[OSRM_FETCH_FALLBACK] OSRM'e ulaşılamadı, Haversine fallback devrede:", err);
      }

      if (!routeFound) {
        const distKm = calculateHaversineDistance(latitude, longitude, destLat, destLng);
        distanceMeters = distKm * 1000;
        durationSeconds = (distKm / 45) * 3600; // Şehir içi ortalama 45 km/s
      }
    }

    const now = new Date();
    const calculatedETA = new Date(now.getTime() + durationSeconds * 1000);

    // Planlanan teslimat tarihi (Randevu varsa randevu tarihi, yoksa oluşturulma + 2 saat)
    const scheduledDeliveryTime =
      shipment.purchaseRequest?.deliveryAppointments?.[0]?.scheduledDate ||
      shipment.estimatedTimeOfArrival ||
      new Date(shipment.createdAt.getTime() + 2 * 60 * 60 * 1000);

    // Gecikme süresi (dakika)
    const delayInMinutes = Math.round(
      (calculatedETA.getTime() - new Date(scheduledDeliveryTime).getTime()) / (60 * 1000)
    );

    // 3. Otonom İnşaat İlerleme Tetikleyicisi (İş Mantığı)
    // Eğer yeni ETA, planlanan teslimat saatinden 60 dakika daha geçse;
    // linkedTaskId ile bağlı olduğu şantiye iş emrinin (Gantt Task) bitiş tarihini otomatik olarak 1 saat ötele
    // ve Şantiye Şefine sistem içi bir bildirim (Notification) fırlat.
    let autonomousDelayApplied = false;

    if (delayInMinutes >= 60 && shipment.linkedTaskId) {
      // Çoklu pinglerde üst üste 1'er saat ötelenmesini önlemek için önceki gecikme kontrolü
      const previousDelay = shipment.delayInMinutes || 0;
      const shouldShiftTask = previousDelay < 60; // Eşik ilk defa 60 dakikayı aştığında tetiklenir

      if (shouldShiftTask) {
        // A. Gantt İş Emri (ProjectTask) Güncelleme
        const projectTask = await prisma.projectTask.findUnique({
          where: { id: shipment.linkedTaskId },
        });

        if (projectTask) {
          const shiftedEndDate = new Date(
            new Date(projectTask.endDate).getTime() + 60 * 60 * 1000
          );
          await prisma.projectTask.update({
            where: { id: shipment.linkedTaskId },
            data: { endDate: shiftedEndDate },
          });
          autonomousDelayApplied = true;
        }

        // B. Kanban / Saha Görevi (Task) Güncelleme (Eğer model Task ise)
        const siteTask = await prisma.task.findUnique({
          where: { id: shipment.linkedTaskId },
        });

        if (siteTask && siteTask.dueDate) {
          const shiftedDueDate = new Date(
            new Date(siteTask.dueDate).getTime() + 60 * 60 * 1000
          );
          await prisma.task.update({
            where: { id: shipment.linkedTaskId },
            data: { dueDate: shiftedDueDate },
          });
          autonomousDelayApplied = true;
        }

        // C. Şantiye Şefine Sistem İçi Bildirim (Notification) Fırlatma
        const siteManager = await prisma.user.findFirst({
          where: {
            role: { in: ["SITE_MANAGER", "PROJECT_MANAGER"] },
            OR: [
              { companyId: shipment.purchaseRequest?.project?.companyId ?? undefined },
              { managedProjects: { some: { id: shipment.purchaseRequest?.project?.id } } },
              { role: "SITE_MANAGER" },
            ],
          },
          orderBy: { createdAt: "asc" },
        });

        if (siteManager) {
          await prisma.notification.create({
            data: {
              userId: siteManager.id,
              title: "🚨 Lojistik Gecikmesi: İş Emri 1 Saat Ötelendi",
              message: `${shipment.vehiclePlate} plakalı malzeme sevkiyatında ${delayInMinutes} dakikalık kritik gecikme tespit edildi. Yeni Tahmini Varış (ETA): ${calculatedETA.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })}. Bağlı şantiye iş emrinin bitiş tarihi otomatik olarak 1 saat ötelendi.`,
              type: "URGENT",
              link: `/admin/communication/logistics?tracking=${trackingCode}`,
            },
          });
        }
      }
    }

    // 4. Veritabanı ve Önbellek Güncellemesi
    const updatedShipment = await prisma.shipmentTracking.update({
      where: { trackingCode },
      data: {
        lastLatitude: latitude,
        lastLongitude: longitude,
        status: newStatus,
        estimatedTimeOfArrival: calculatedETA,
        delayInMinutes: Math.max(0, delayInMinutes),
      },
    });

    // In-Memory Önbelleği güncelle
    liveLogisticsCache.set(trackingCode, {
      trackingCode,
      latitude,
      longitude,
      speed: speed ?? null,
      heading: heading ?? null,
      accuracy: accuracy ?? null,
      status: updatedShipment.status,
      vehiclePlate: updatedShipment.vehiclePlate,
      driverPhone: updatedShipment.driverPhone,
      materialName: shipment.purchaseRequest?.materialName || "İnşaat Malzemesi",
      projectName: shipment.purchaseRequest?.project?.name || "Şantiye Projesi",
      estimatedTimeOfArrival: calculatedETA.toISOString(),
      delayInMinutes: Math.max(0, delayInMinutes),
      linkedTaskId: shipment.linkedTaskId,
      updatedAt: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      trackingCode,
      status: updatedShipment.status,
      coordinates: { latitude, longitude },
      eta: calculatedETA.toISOString(),
      delayInMinutes: Math.max(0, delayInMinutes),
      distanceKm: Math.round((distanceMeters / 1000) * 10) / 10,
      durationMinutes: Math.round(durationSeconds / 60),
      autonomousDelayApplied,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("[LOGISTICS_PING_ERROR]", error);
    return NextResponse.json(
      { error: "Konum ping işlemi başarısız.", details: error.message },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const trackingCode = searchParams.get("trackingCode");

    // Tekil sorgu (Şoför veya Takip Linki)
    if (trackingCode) {
      const dbShipment = await prisma.shipmentTracking.findUnique({
        where: { trackingCode },
        include: {
          purchaseRequest: {
            include: {
              project: {
                select: {
                  id: true,
                  name: true,
                  city: true,
                  district: true,
                  location: true,
                  latitude: true,
                  longitude: true,
                },
              },
            },
          },
        },
      });

      if (!dbShipment) {
        return NextResponse.json(
          { error: "Sevkiyat bulunamadı." },
          { status: 404 }
        );
      }

      // Canlı önbellek koordinatını öncelikle al
      const livePing = liveLogisticsCache.get(trackingCode);

      return NextResponse.json({
        success: true,
        shipment: {
          ...dbShipment,
          currentLatitude: livePing?.latitude ?? dbShipment.lastLatitude,
          currentLongitude: livePing?.longitude ?? dbShipment.lastLongitude,
          liveSpeed: livePing?.speed ?? null,
          liveHeading: livePing?.heading ?? null,
          estimatedTimeOfArrival: livePing?.estimatedTimeOfArrival ?? (dbShipment.estimatedTimeOfArrival ? dbShipment.estimatedTimeOfArrival.toISOString() : null),
          delayInMinutes: livePing?.delayInMinutes ?? dbShipment.delayInMinutes ?? 0,
          linkedTaskId: livePing?.linkedTaskId ?? dbShipment.linkedTaskId ?? null,
          lastPingTime: livePing?.updatedAt ?? dbShipment.updatedAt.toISOString(),
          isLiveStreaming: !!livePing,
        },
      });
    }

    // Harita ve Çoklu Liste Sorgusu (Admin Canlı Haritası)
    const dbShipments = await prisma.shipmentTracking.findMany({
      where: {
        status: {
          in: ["PREPARING", "ON_THE_WAY", "ARRIVED"],
        },
      },
      include: {
        purchaseRequest: {
          include: {
            project: {
              select: {
                id: true,
                name: true,
                city: true,
                district: true,
                location: true,
                latitude: true,
                longitude: true,
              },
            },
          },
        },
      },
      orderBy: { updatedAt: "desc" },
    });

    const enriched = dbShipments.map((s) => {
      const live = liveLogisticsCache.get(s.trackingCode);
      return {
        id: s.id,
        trackingCode: s.trackingCode,
        vehiclePlate: s.vehiclePlate,
        driverPhone: s.driverPhone,
        status: live?.status ?? s.status,
        latitude: live?.latitude ?? s.lastLatitude,
        longitude: live?.longitude ?? s.lastLongitude,
        speed: live?.speed ?? null,
        heading: live?.heading ?? null,
        estimatedTimeOfArrival: live?.estimatedTimeOfArrival ?? (s.estimatedTimeOfArrival ? s.estimatedTimeOfArrival.toISOString() : null),
        delayInMinutes: live?.delayInMinutes ?? s.delayInMinutes ?? 0,
        linkedTaskId: live?.linkedTaskId ?? s.linkedTaskId ?? null,
        updatedAt: live?.updatedAt ?? s.updatedAt.toISOString(),
        materialName: s.purchaseRequest?.materialName || "İnşaat Malzemesi",
        quantity: s.purchaseRequest?.quantity || 0,
        unit: s.purchaseRequest?.unit || "Birim",
        project: s.purchaseRequest?.project || null,
        isLive: !!live,
      };
    });

    return NextResponse.json({
      success: true,
      count: enriched.length,
      shipments: enriched,
    });
  } catch (error: any) {
    console.error("[LOGISTICS_GET_ERROR]", error);
    return NextResponse.json(
      { error: "Sevkiyat bilgileri alınamadı.", details: error.message },
      { status: 500 }
    );
  }
}
