"use client";
/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Client Wrapper for Leaflet Logistics Live Map to resolve SSR restriction in Next.js Server Components
 */

import React from "react";
import dynamic from "next/dynamic";
import { Truck } from "lucide-react";
import type { ShipmentLiveItem } from "./LogisticsLiveMap";

// Dynamic import with ssr: false strictly enclosed inside this Client Component
const LogisticsLiveMap = dynamic(
  () => import("./LogisticsLiveMap"),
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

export default function MapWrapper({ shipments }: { shipments: ShipmentLiveItem[] }) {
  return <LogisticsLiveMap initialShipments={shipments} />;
}
