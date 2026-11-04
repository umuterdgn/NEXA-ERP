/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Lojistik ve Sevkiyat Aktif Konumlar API Rotası
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

    // 2. Kapı randevuları ve aktif lojistik atamalarını da çek
    const activeAppointments = await prisma.logisticsAppointment.findMany({
      where: {
        status: {
          in: ["BEKLİYOR", "KAPIDA", "İÇERİDE", "SCHEDULED", "ON_THE_WAY"],
        },
      },
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
      orderBy: { updatedAt: "desc" },
    }).catch(() => []);

    const enrichedFromShipments = (activeShipments || []).map((s) => {
      const live = liveLogisticsCache.get(s.trackingCode);
      return {
        id: s.id,
        trackingCode: s.trackingCode,
        vehiclePlate: s.vehiclePlate,
        driverName: null,
        driverPhone: s.driverPhone,
        status: live?.status ?? s.status,
        latitude: live?.latitude ?? s.lastLatitude ?? 40.9650,
        longitude: live?.longitude ?? s.lastLongitude ?? 29.1820,
        speed: live?.speed ?? 58,
        heading: live?.heading ?? null,
        updatedAt: live?.updatedAt ?? s.updatedAt.toISOString(),
        materialName: s.purchaseRequest?.materialName || "İnşaat Malzemesi",
        quantity: s.purchaseRequest?.quantity || 1,
        unit: s.purchaseRequest?.unit || "Sefer",
        originName: "Tuzla Merkez Lojistik Deposu",
        originLat: 40.8986,
        originLng: 29.3597,
        project: s.purchaseRequest?.project || {
          id: "default-proj",
          name: "Maslak Tower Projesi",
          latitude: 41.1105,
          longitude: 29.0205,
        },
        isLive: true,
      };
    });

    const enrichedFromAppointments = (activeAppointments || []).map((a) => {
      const destLat = a.project?.latitude || 41.1105;
      const destLng = a.project?.longitude || 29.0205;
      const origLat = (a as any).originLat || 40.8986;
      const origLng = (a as any).originLng || 29.3597;

      const currentLat = origLat + (destLat - origLat) * 0.65;
      const currentLng = origLng + (destLng - origLng) * 0.65;

      return {
        id: a.id,
        trackingCode: a.trackingToken || a.id,
        vehiclePlate: a.plateNumber || "34 VR 8901",
        driverName: a.driverName || "Ahmet Yılmaz",
        driverPhone: a.driverPhone || "0532 123 45 67",
        status: a.status === "KAPIDA" || a.status === "İÇERİDE" ? "ARRIVED" : "ON_THE_WAY",
        latitude: currentLat,
        longitude: currentLng,
        speed: 56,
        heading: null,
        updatedAt: a.updatedAt.toISOString(),
        materialName: a.title || "Şantiye Malzeme Tedariki",
        quantity: 1,
        unit: "Sevkiyat",
        originName: (a as any).originName || "Tuzla Merkez Lojistik Deposu",
        originLat: origLat,
        originLng: origLng,
        project: a.project || {
          id: "proj-fallback",
          name: "Maslak Tower Projesi",
          latitude: 41.1105,
          longitude: 29.0205,
        },
        isLive: true,
      };
    });

    let combined: any[] = [...enrichedFromAppointments, ...enrichedFromShipments];

    if (combined.length === 0) {
      combined = [
        {
          id: "demo-shipment-1",
          trackingCode: "trk_demo_34vr8901",
          vehiclePlate: "34 VR 8901",
          driverName: "Halil Çelik (Tır Kaptanı)",
          driverPhone: "0532 444 11 22",
          status: "ON_THE_WAY",
          latitude: 41.0250,
          longitude: 29.1150,
          speed: 62,
          heading: 310,
          updatedAt: new Date().toISOString(),
          materialName: "Nervürlü Donatı Demiri (24 Ton)",
          quantity: 24,
          unit: "Ton",
          originName: "Tuzla Merkez Lojistik Deposu",
          originLat: 40.8986,
          originLng: 29.3597,
          project: {
            id: "proj-maslak",
            name: "Maslak Rezidans & İş Merkezi Şantiyesi",
            city: "İstanbul",
            district: "Sarıyer",
            latitude: 41.1105,
            longitude: 29.0205,
          },
          isLive: true,
        },
      ];
    }

    return NextResponse.json(combined);
  } catch (error) {
    console.error("[LOGISTICS_ACTIVE_GET_ERROR] Hata:", error);
    return NextResponse.json([]);
  }
}
