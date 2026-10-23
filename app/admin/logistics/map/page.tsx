/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Admin Lojistik Canlı Haritası Sayfası
 * Tüm aktif sevkiyatların (ON_THE_WAY) harita üzerinde hareket eden araç ikonlarıyla gösterildiği panel.
 */

import React from "react";
import dynamic from "next/dynamic";
import { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { liveLogisticsCache } from "@/app/api/logistics/ping/route";
import { ShipmentLiveItem } from "./_components/LogisticsLiveMap";
import { Truck } from "lucide-react";

export const metadata: Metadata = {
  title: "Lojistik Canlı Filo Haritası | NEXA ERP",
  description: "Şantiyeye doğru hareket eden tır ve sevkiyatların gerçek zamanlı GPS takip haritası.",
};

// Dynamic import to prevent SSR window/leaflet document errors
const LogisticsLiveMap = dynamic(
  () => import("./_components/LogisticsLiveMap"),
  {
    ssr: false,
    loading: () => (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-5rem)] bg-slate-950 text-slate-300">
        <Truck className="w-12 h-12 text-emerald-400 animate-pulse mb-3" />
        <h3 className="text-base font-bold text-white">Canlı Filo Haritası Yükleniyor...</h3>
        <p className="text-xs text-slate-500 mt-1">Leaflet ve GPS motoru başlatılıyor</p>
      </div>
    ),
  }
);

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

  return <LogisticsLiveMap initialShipments={initialShipments} />;
}
