/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Lojistik ve Sevkiyat Aktif Konumlar API Rotası
 * Haritanın çökmesini önlemek için her zaman try-catch içinde çalışır ve
 * veritabanı boşsa veya bağlantı hatası durumunda 500 fırlatmak yerine boş bir dizi [] (200 OK) döndürür.
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { liveLogisticsCache } from "@/lib/logistics-cache";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await auth();
    const userRole = session?.user?.role as string;
    const isSuperAdmin = userRole === "SUPER_ADMIN";
    const tenantId = (session?.user as any)?.tenantId as string | undefined;

    if (!session?.user || (!tenantId && !isSuperAdmin)) {
      return NextResponse.json([]);
    }

    const tenantFilter: any = !isSuperAdmin ? (tenantId ? { tenantId } : { tenantId: "non-existent" }) : {};

    // 1. Prisma üzerinden aktif sevkiyatları (PREPARING, ON_THE_WAY, ARRIVED) çek
    const activeShipments = await prisma.shipmentTracking.findMany({
      where: {
        ...tenantFilter,
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

    // Veritabanı boşsa güvenli şekilde boş dizi döndür
    if (!activeShipments || activeShipments.length === 0) {
      return NextResponse.json([]);
    }

    // 2. Bellekteki canlı koordinat akışı ile zenginleştir
    const enriched = activeShipments.map((s) => {
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
        estimatedTimeOfArrival: live?.estimatedTimeOfArrival ?? (s.estimatedTimeOfArrival ? s.estimatedTimeOfArrival.toISOString() : null),
        delayInMinutes: live?.delayInMinutes ?? s.delayInMinutes ?? 0,
        linkedTaskId: live?.linkedTaskId ?? s.linkedTaskId ?? null,
        isLive: !!live,
      };
    });

    return NextResponse.json(enriched);
  } catch (error) {
    // Veritabanı hatası durumunda kesinlikle 500 fırlatma, haritayı korumak için 200 OK ile [] döndür
    console.error("[LOGISTICS_ACTIVE_GET_ERROR] Hata yakalandı, harita çökmesini önlemek için boş liste dönülüyor:", error);
    return NextResponse.json([]);
  }
}
