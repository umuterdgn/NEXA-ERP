"use client"

/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Yatırımcı Portalı - 3D Dijital Proje İkizi (Read-Only BIM Viewer)
 */

import React from "react"
import dynamic from "next/dynamic"
import { Box, Layers, Eye, ShieldCheck, Info } from "lucide-react"

const BimViewerWrapper = dynamic<any>(() => import("@/components/bim/BimViewerWrapper"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[650px] bg-slate-950 rounded-2xl flex items-center justify-center text-slate-400 text-xs">
      3D BIM Proje Modeli Yükleniyor...
    </div>
  ),
})

export default function Investor3dTwinPage() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900 border border-slate-800 p-5 rounded-2xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30 font-bold">
              BIM 3D Model
            </span>
            <span className="text-xs text-slate-400 font-mono">• Nexa Plaza A Blok</span>
          </div>
          <h1 className="text-lg sm:text-xl font-bold text-white">
            3D Dijital Proje İkizi
          </h1>
          <p className="text-xs text-slate-400">
            Yapının 3 boyutlu mimari, statik ve tesisat modelini canlı olarak inceleyin.
          </p>
        </div>

        <div className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center gap-2 text-xs text-slate-400">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Etkileşimli Salt Okunur Gezinti</span>
        </div>
      </div>

      {/* 3D BIM Viewer Shell */}
      <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl relative">
        <div className="h-[650px] w-full relative">
          <BimViewerWrapper projectName="Nexa Plaza Statik & Mimari 3D" hideUpload={true} />
        </div>
      </div>

      {/* BIM Model Bilgi Kartları */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 space-y-1">
          <span className="text-[11px] text-slate-400">Mimari & Statik Kat Sayısı</span>
          <p className="text-lg font-bold text-white font-mono">14 Kat (2 Bodrum + Zemin + 11 Normal)</p>
        </div>
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 space-y-1">
          <span className="text-[11px] text-slate-400">Yapı Denetim Statüsü</span>
          <p className="text-lg font-bold text-emerald-400 font-mono">C30/37 Taşıyıcı Onaylı</p>
        </div>
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 space-y-1">
          <span className="text-[11px] text-slate-400">3D Koordinasyon</span>
          <p className="text-lg font-bold text-blue-400 font-mono">IFC2X3 & IFC4 Tam Uyumlu</p>
        </div>
      </div>
    </div>
  )
}
