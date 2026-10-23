/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Admin Lojistik Canlı Haritası Sayfası (Server Component)
 * Tüm aktif sevkiyatların (ON_THE_WAY) harita üzerinde hareket eden araç ikonlarıyla gösterildiği panel.
 */

import React from "react";
import { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { liveLogisticsCache } from "@/lib/logistics-cache";
import { ShipmentLiveItem } from "./_components/LogisticsLiveMap";
import MapWrapper from "./_components/MapWrapper";

export const metadata: Metadata = {
  title: "Lojistik Canlı Filo Haritası | NEXA ERP",
  description: "Şantiyeye doğru hareket eden tır ve sevkiyatların gerçek zamanlı GPS takip haritası.",
};

export default async function AdminLogisticsMapPage() {
  // DB'deki aktif sevkiyatları çek
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

  // Bellekteki (In-Memory) canlı koordinatlarla zenginleştir
  const initialShipments: ShipmentLiveItem[] = dbShipments.map((s) => {
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

  return <MapWrapper shipments={initialShipments} />;
}
