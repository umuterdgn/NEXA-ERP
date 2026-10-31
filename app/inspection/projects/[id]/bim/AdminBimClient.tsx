/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Müteahhit 3D BIM Modülü İstemci Bileşeni
 */

"use client";

import React from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import {
  ChevronLeft,
  Box,
  ShieldCheck,
} from "lucide-react";

// Dynamically import BimViewer with SSR disabled
const BimViewer = dynamic(
  () => import("@/app/inspection/projects/[id]/_components/BimViewer"),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-[calc(100vh-120px)] min-h-[600px] bg-slate-950 rounded-2xl border border-slate-800 flex flex-col items-center justify-center shadow-2xl">
        <div className="w-12 h-12 border-4 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin mb-3"></div>
        <p className="text-cyan-400 text-sm font-semibold tracking-wide">3D BIM Görüntüleyici Hazırlanıyor...</p>
        <p className="text-slate-500 text-xs mt-1">WebGL 3D motoru ve Web-IFC kütüphaneleri başlatılıyor</p>
      </div>
    ),
  }
);

interface AdminBimClientProps {
  project: {
    id: string;
    title: string;
    name?: string | null;
    yibfNo?: string | null;
    city?: string | null;
    district?: string | null;
    bimModelUrl?: string | null;
    ifcModelUrl?: string | null;
  };
}

export default function AdminBimClient({ project }: AdminBimClientProps) {
  const modelUrl = project.bimModelUrl || project.ifcModelUrl || null;

  return (
    <div className="max-w-7xl mx-auto space-y-5 pb-16 p-4 sm:p-6 lg:p-8">
      {/* Üst Navigasyon & Başlık */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
        <div className="flex items-center gap-3">
          <Link
            href={`/inspection/projects/${project.id}`}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700 transition cursor-pointer"
          >
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                MÜTEAHHİT PORTALI
              </span>
              <span className="text-slate-500 text-xs">/</span>
              <span className="text-slate-400 text-xs font-mono">5D BIM & DİJİTAL İKİZ</span>
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2 mt-1">
              <Box className="w-6 h-6 text-cyan-400" />
              {project.title || project.name} - 3D BIM Görüntüleyici
            </h1>
            <p className="text-slate-400 text-xs mt-0.5">
              Raycaster ile kiriş/kolon seçimi, IFC nitelik kümesi, hakediş metraj kontrolü ve taşeron iş emri atama
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {project.yibfNo && (
            <span className="px-3 py-1.5 rounded-lg bg-blue-950/60 border border-blue-800/80 text-blue-400 font-mono text-xs font-semibold">
              YİBF: #{project.yibfNo}
            </span>
          )}
          <span className="px-3 py-1.5 rounded-lg bg-emerald-950/60 border border-emerald-800/80 text-emerald-400 text-xs font-semibold flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>WASM & Web-IFC Aktif</span>
          </span>
        </div>
      </div>

      {/* 3D BIM Viewer Kartı */}
      <div className="relative w-full h-[calc(100vh-120px)] min-h-[600px]">
        <BimViewer
          url={modelUrl}
          ifcUrl={project.ifcModelUrl}
          bimUrl={project.bimModelUrl}
          projectId={project.id}
          fileName={`${project.title || project.name}.ifc`}
        />
      </div>
    </div>
  );
}
