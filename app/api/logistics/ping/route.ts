/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Lojistik ve Sevkiyat Canlı Konum (Ping) Endpoint'i
 * Yüksek trafiği absorbe etmek için Redis/Bellek (In-Memory) tabanlı çalışır;
 * Veritabanı (Prisma) yazımı yalnızca durum (status) değiştiğinde veya ilk konumda tetiklenir.
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { liveLogisticsCache, type LiveShipmentPing } from "@/lib/logistics-cache";

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

    // 1. Mevcut önbellek veya DB kaydını al
    let cached = liveLogisticsCache.get(trackingCode);
    let shipment = null;

    if (!cached) {
      shipment = await prisma.shipmentTracking.findUnique({
        where: { trackingCode },
        include: {
          purchaseRequest: {
            include: {
              project: {
                select: { name: true },
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
    }

    const currentStatus = cached?.status || shipment?.status || "PREPARING";
    const newStatus = status || currentStatus;
    const isStatusChanged = newStatus !== currentStatus;
    const isFirstLocation = shipment && shipment.lastLatitude === null;

    // 2. Yüksek Trafik Optimizasyonu: Sadece status değiştiğinde veya ilk konumda DB'ye yaz
    if (isStatusChanged || isFirstLocation) {
      const updatedShipment = await prisma.shipmentTracking.update({
        where: { trackingCode },
        data: {
          status: newStatus,
          lastLatitude: latitude,
          lastLongitude: longitude,
        },
        include: {
          purchaseRequest: {
            include: {
              project: {
                select: { name: true },
              },
            },
          },
        },
      });

      // Önbelleği güncelle
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
        materialName: updatedShipment.purchaseRequest?.materialName || "İnşaat Malzemesi",
        projectName: updatedShipment.purchaseRequest?.project?.name || "Şantiye Projesi",
        updatedAt: new Date().toISOString(),
      });

      return NextResponse.json({
        success: true,
        source: "database_persisted",
        status: updatedShipment.status,
        trackingCode,
        coordinates: { latitude, longitude },
        timestamp: new Date().toISOString(),
      });
    }

    // 3. Status aynıysa: SADECE Bellekte (In-Memory) güncelle, 0ms DB overhead!
    liveLogisticsCache.set(trackingCode, {
      trackingCode,
      latitude,
      longitude,
      speed: speed ?? cached?.speed ?? null,
      heading: heading ?? cached?.heading ?? null,
      accuracy: accuracy ?? cached?.accuracy ?? null,
      status: currentStatus,
      vehiclePlate: cached?.vehiclePlate || shipment?.vehiclePlate || "",
      driverPhone: cached?.driverPhone || shipment?.driverPhone || "",
      materialName:
        cached?.materialName ||
        shipment?.purchaseRequest?.materialName ||
        "İnşaat Malzemesi",
      projectName:
        cached?.projectName ||
        shipment?.purchaseRequest?.project?.name ||
        "Şantiye Projesi",
      updatedAt: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      source: "memory_stream",
      status: currentStatus,
      trackingCode,
      coordinates: { latitude, longitude },
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
