"use client";

/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Franchise Rollout Haritası Client Wrapper (next/dynamic ssr: false)
 * Next.js SSR sırasında Leaflet 'window' hatasını önler.
 */

import React from "react";
import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";
import type { StoreProject, PinCategory } from "./RolloutLeafletMap";

interface RolloutMapWrapperProps {
  projects: StoreProject[];
  selectedProject: StoreProject | null;
  onSelectProject: (project: StoreProject) => void;
  getPinCategory: (p: StoreProject) => PinCategory;
}

const DynamicRolloutLeafletMap = dynamic(
  () => import("./RolloutLeafletMap"),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-[calc(100vh-240px)] min-h-[500px] rounded-xl bg-slate-950 border border-slate-800 flex flex-col items-center justify-center text-slate-400 gap-3">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
        <span className="text-xs font-medium">İnteraktif Rollout Haritası Yükleniyor...</span>
      </div>
    ),
  }
);

export default function RolloutMapWrapper(props: RolloutMapWrapperProps) {
  return <DynamicRolloutLeafletMap {...props} />;
}
