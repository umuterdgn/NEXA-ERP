"use client";

/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Nexa ERP - Client Dynamic Wrapper for LiveSituationRiskMap (Leaflet SSR Safe)
 */

import React from "react";
import dynamic from "next/dynamic";
import type { LivePersonnel, RiskZoneItem } from "@/app/actions/ohs";

interface DynamicRiskMapWrapperProps {
  initialPersonnel?: LivePersonnel[];
  initialRiskZones?: RiskZoneItem[];
  siteCoordinates?: [number, number];
  projectName?: string;
}

const LiveSituationRiskMap = dynamic(
  () => import("@/components/ohs/LiveSituationRiskMap"),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-[620px] rounded-2xl bg-slate-900 border border-slate-800 flex flex-col items-center justify-center text-slate-400 gap-3">
        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-semibold">Vaziyet Planı & Canlı GPS Haritası Yükleniyor...</p>
      </div>
    ),
  }
);

export default function DynamicRiskMapWrapper(props: DynamicRiskMapWrapperProps) {
  return <LiveSituationRiskMap {...props} />;
}

