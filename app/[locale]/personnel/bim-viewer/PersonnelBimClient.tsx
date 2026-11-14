"use client"
/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Saha Personeli 3D Federated BIM Görüntüleyici İstemci Bileşeni
 */

import React from "react"
import Link from "next/link"
import { Box, ShieldCheck, Layers, HardHat, Building2, AlertCircle } from "lucide-react"
import BIMViewer, { type FederatedModelItem } from "@/components/bim/BIMViewer"

interface PersonnelBimClientProps {
  project: {
    id: string
    title?: string | null
    name?: string | null
    city?: string | null
    district?: string | null
    yibfNo?: string | null
    bimModelUrl?: string | null
    ifcModelUrl?: string | null
  } | null
  models: FederatedModelItem[]
}

export default function PersonnelBimClient({ project, models }: PersonnelBimClientProps) {
  if (!project) {
    return (
      <div className="max-w-4xl mx-auto py-16 px-4 text-center">
        <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mx-auto mb-4">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-white mb-2">Atanmış Şantiye Bulunamadı</h2>
        <p className="text-slate-400 text-sm max-w-md mx-auto mb-6">
          Profilinize tanımlı aktif bir şantiye / proje bulunamadı. Lütfen merkez ofis veya proje yöneticiniz ile iletişime geçiniz.
        </p>
        <Link
          href="/personnel/dashboard"
          className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold border border-slate-700 transition"
        >
          Ana Panele Dön
        </Link>
      </div>
    )
  }

  const modelUrl = project.bimModelUrl || project.ifcModelUrl || (models[0]?.url) || null
  const projectName = project.title || project.name || "Şantiye Projesi"

  return (
    <div className="w-full space-y-4 pb-12 p-3 sm:p-5 lg:p-6">
      {/* Üst Bilgi Barı */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-900/90 border border-slate-800/80 p-4 rounded-2xl shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400 flex-shrink-0">
            <HardHat className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                SAHA MÜHENDİSİ / PERSONEL
              </span>
              <span className="text-slate-500 text-xs">/</span>
              <span className="text-slate-400 text-xs font-mono">BIM DİJİTAL İKİZ</span>
            </div>
            <h1 className="text-lg sm:text-xl font-black text-white tracking-tight flex items-center gap-2 mt-0.5">
              <Building2 className="w-5 h-5 text-cyan-400" />
              <span>{projectName}</span>
            </h1>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {project.yibfNo && (
            <span className="px-2.5 py-1 rounded-lg bg-blue-950/60 border border-blue-800/80 text-blue-400 font-mono text-[11px] font-semibold">
              YİBF: #{project.yibfNo}
            </span>
          )}
          <span className="px-2.5 py-1 rounded-lg bg-cyan-950/60 border border-cyan-800/80 text-cyan-400 text-[11px] font-semibold flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5" />
            <span>{models.length} Katman (Prisma)</span>
          </span>
          <span className="px-2.5 py-1 rounded-lg bg-emerald-950/60 border border-emerald-800/80 text-emerald-400 text-[11px] font-semibold flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>WASM Senkron</span>
          </span>
        </div>
      </div>

      {/* 3D Federated BIM Viewer */}
      <div className="relative w-full h-[calc(100vh-140px)] min-h-[620px] rounded-2xl overflow-hidden border border-slate-800/90 shadow-2xl bg-slate-950">
        <BIMViewer
          models={models}
          url={modelUrl}
          ifcUrl={project.ifcModelUrl}
          bimUrl={project.bimModelUrl}
          projectId={project.id}
          fileName={`${projectName}.ifc`}
        />
      </div>
    </div>
  )
}
