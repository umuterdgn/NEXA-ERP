"use client"
/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Franchise BIM & 3D Viewer Client View with Interactive Upload Modal
 */

import React, { useState, useEffect } from "react"
import Link from "next/link"
import {
  Boxes,
  Building2,
  Box,
  Layers,
  Eye,
  Download,
  UploadCloud,
  FileCode,
  Sparkles,
  ArrowRight,
  Maximize2,
  Palette,
  CheckCircle2,
  Sliders,
  ChevronRight,
  FileCheck2,
  FolderDown
} from "lucide-react"
import { toast } from "react-hot-toast"
import { useRouter } from "next/navigation"
import BimUploadModal from "@/components/franchise/BimUploadModal"

interface BimPageClientProps {
  projects: Array<{
    id: string
    name?: string | null
    city?: string | null
    district?: string | null
    status?: string | null
    storeTemplate?: { id: string; name: string; estimatedDays: number } | null
  }>
  templates: Array<{
    id: string
    name: string
    estimatedDays: number
  }>
  initialBimFiles?: Array<{
    id: string
    fileName: string
    fileUrl: string
    fileType?: string | null
    uploadedAt: Date | string
    isActive: boolean
    project?: {
      id: string
      name?: string | null
      title?: string | null
      city?: string | null
    } | null
  }>
}

export default function BimPageClient({
  projects,
  templates,
  initialBimFiles = [],
}: BimPageClientProps) {
  const router = useRouter()
  const [isBimModalOpen, setIsBimModalOpen] = useState(false)
  const [activeLayer, setActiveLayer] = useState("ALL")
  const [bimFiles, setBimFiles] = useState(initialBimFiles)

  useEffect(() => {
    setBimFiles(initialBimFiles)
  }, [initialBimFiles])

  const handleDownload = (name: string) => {
    toast.success(`"${name}" 3D BIM paketi (.ifc) hazırlanıyor ve indiriliyor...`)
  }

  const handleSuccessUpload = () => {
    router.refresh()
  }

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-amber-400">
            <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
            Proje & Mimari Tasarım
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight mt-1 flex items-center gap-3">
            <Boxes className="w-8 h-8 text-amber-400" />
            BIM & 3D Konsept Modelleri
          </h1>
          <p className="text-sm text-slate-400 mt-1 max-w-2xl">
            Franchise zincir standartlarına uygun LOD-300 mimari, mekanik, aydınlatma ve raf yerleşim 3D BIM modellerini yönetin.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/franchise/templates"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-200 text-xs font-medium transition-all shadow-sm"
          >
            <Box className="w-4 h-4 text-blue-400" />
            <span>Konsept Şablonları</span>
          </Link>
          <button
            onClick={() => setIsBimModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white text-xs font-bold transition-all shadow-lg shadow-amber-500/20 cursor-pointer hover:scale-[1.02]"
          >
            <UploadCloud className="w-4 h-4" />
            <span>BIM / IFC Modeli Yükle</span>
          </button>
        </div>
      </div>

      {/* 3D BIM Viewer Shell (Interactive Preview Card) */}
      <div className="relative rounded-3xl overflow-hidden border border-slate-800/80 bg-gradient-to-b from-slate-900 via-slate-950 to-slate-950 shadow-2xl">
        <div className="p-4 border-b border-slate-800/80 flex items-center justify-between bg-slate-900/60 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-full bg-red-500/80" />
              <span className="h-3 w-3 rounded-full bg-amber-500/80" />
              <span className="h-3 w-3 rounded-full bg-emerald-500/80" />
            </div>
            <div className="h-4 w-px bg-slate-800" />
            <span className="text-xs font-mono font-semibold text-slate-300 flex items-center gap-2">
              <Boxes className="w-3.5 h-3.5 text-amber-400" />
              STORE-CONCEPT-FLAGSHIP-V2.ifc (LOD 350)
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-emerald-950/60 border border-emerald-800 text-[10px] font-bold text-emerald-400">
              WebXR / Three.js Render Motoru Hazır
            </span>
            <button
              onClick={() => toast.success("BIM Görünümü Tam Ekran Moduna Alındı.")}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 3D Canvas Mockup & Interactive Viewport */}
        <div className="h-80 md:h-96 relative flex items-center justify-center p-6 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px]">
          {/* Spatial Grid Isometric Plane */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-40">
            <div className="w-[500px] h-[500px] border border-amber-500/20 rounded-full animate-[spin_60s_linear_infinite]" />
            <div className="absolute w-[350px] h-[350px] border border-blue-500/20 rounded-full animate-[spin_40s_linear_infinite_reverse]" />
          </div>

          {/* Center Holographic Store 3D Box */}
          <div className="relative z-10 flex flex-col items-center text-center space-y-4">
            <div className="w-24 h-24 rounded-3xl bg-gradient-to-tr from-amber-500/20 via-blue-500/10 to-amber-500/30 border border-amber-500/40 backdrop-blur-xl flex items-center justify-center shadow-2xl shadow-amber-500/10 group hover:scale-105 transition-transform duration-500">
              <Boxes className="w-12 h-12 text-amber-400 animate-pulse" />
            </div>

            <div className="space-y-1">
              <h3 className="text-lg font-bold text-white tracking-tight">
                İnteraktif 3D IFC / Web-IFC Görüntüleyici
              </h3>
              <p className="text-xs text-slate-400 max-w-md">
                Katamansal fit-out mimarisi, aydınlatma armatürleri, HVAC menfezleri ve raf yüksekliklerini 3 boyutta inceleyin.
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
              {[
                { id: "ALL", label: "Tüm Disiplinler" },
                { id: "ARCH", label: "Mimari (LOD 300)" },
                { id: "MEP", label: "Mekanik & Havalandırma" },
                { id: "ELEC", label: "Elektrik & Zayıf Akım" },
                { id: "FURN", label: "Mobilya & Ekipman" },
              ].map((layer) => (
                <button
                  key={layer.id}
                  onClick={() => {
                    setActiveLayer(layer.id)
                    toast.success(`Katman değiştirildi: ${layer.label}`)
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                    activeLayer === layer.id
                      ? "bg-amber-500/20 border-amber-500/60 text-amber-300 shadow-sm"
                      : "bg-slate-900/80 border-slate-800 text-slate-400 hover:text-slate-200"
                  }`}
                >
                  {layer.label}
                </button>
              ))}
            </div>
          </div>

          {/* Controls Overlay Bottom-Right */}
          <div className="absolute bottom-4 right-4 flex items-center gap-2 bg-slate-900/90 border border-slate-800 p-1.5 rounded-xl backdrop-blur-md">
            <button
              onClick={() => toast.success("Kamera Açısı: Üstten Görünüm (Plan)")}
              className="px-2.5 py-1 text-[11px] font-mono text-slate-300 hover:text-white rounded-lg hover:bg-slate-800"
            >
              PLAN (2D)
            </button>
            <button
              onClick={() => toast.success("Kamera Açısı: İzometrik (3D Axo)")}
              className="px-2.5 py-1 text-[11px] font-mono bg-amber-500/20 text-amber-300 font-bold rounded-lg border border-amber-500/40"
            >
              İZO (3D)
            </button>
            <button
              onClick={() => toast.success("MEP Çakışma Analizi (Clash Detection) Başlatıldı.")}
              className="px-2.5 py-1 text-[11px] font-mono text-slate-300 hover:text-white rounded-lg hover:bg-slate-800"
            >
              ÇAKIŞMA (CLASH)
            </button>
          </div>
        </div>
      </div>

      {/* Zincir Konsept 3D Modelleri Bölümü (Veritabanı Entegrasyonu) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Boxes className="w-5 h-5 text-amber-400" />
              Zincir Konsept 3D Modelleri
            </h2>
            <p className="text-xs text-slate-400">
              Veritabanına yüklenen ve şubelerle ilişkilendirilen tüm BIM / IFC dosyaları
            </p>
          </div>
          <span className="text-xs font-semibold px-3 py-1 bg-slate-900 border border-slate-800 rounded-lg text-slate-300">
            {bimFiles.length + templates.length} Model Hazır
          </span>
        </div>

        {/* Dynamic BIM Models Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* 1. Veritabanından Gelen Yüklü Modeller (bimFiles) */}
          {bimFiles.map((bf) => (
            <div
              key={bf.id}
              className="p-5 rounded-2xl bg-slate-900/90 border border-amber-500/30 hover:border-amber-500/60 transition-all space-y-4 relative overflow-hidden group shadow-lg"
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full blur-xl pointer-events-none" />
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-extrabold text-amber-400 uppercase tracking-wider bg-amber-950/60 px-2 py-0.5 rounded border border-amber-800/40">
                    {bf.fileType ? bf.fileType.toUpperCase() : "IFC"} • CANLI MODEL
                  </span>
                  <h3 className="text-base font-bold text-white mt-1.5 truncate max-w-[210px]" title={bf.fileName}>
                    {bf.fileName}
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
                    <Building2 className="w-3.5 h-3.5 text-slate-500" />
                    <span>{bf.project?.name || bf.project?.title || "Zincir Şube"}</span>
                  </p>
                </div>
                <span className="px-2 py-1 rounded-md bg-emerald-950/60 border border-emerald-800 text-[10px] font-bold text-emerald-400">
                  LOD-300
                </span>
              </div>

              <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
                <span>Yüklenme: {new Date(bf.uploadedAt).toLocaleDateString("tr-TR")}</span>
                <span className="text-amber-400/90 font-mono text-[11px]">Web-IFC</span>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-800 text-xs">
                <button
                  onClick={() => toast.success(`"${bf.fileName}" modeli 3D görüntüleyicide açıldı!`)}
                  className="flex items-center gap-1 text-slate-300 hover:text-white font-medium"
                >
                  <Eye className="w-3.5 h-3.5 text-blue-400" />
                  <span>3D İncele</span>
                </button>
                <button
                  onClick={() => handleDownload(bf.fileName)}
                  className="flex items-center gap-1.5 text-amber-400 hover:text-amber-300 font-bold"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>İndir</span>
                </button>
              </div>
            </div>
          ))}

          {/* 2. Store Template Modelleri */}
          {templates.map((tpl) => (
            <div
              key={tpl.id}
              className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800/80 hover:border-amber-500/40 transition-all space-y-4"
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">
                    ŞABLON MODEL
                  </span>
                  <h3 className="text-base font-bold text-white mt-0.5 truncate max-w-[210px]">
                    {tpl.name}
                  </h3>
                </div>
                <span className="px-2 py-1 rounded-md bg-slate-800 text-[10px] font-mono text-slate-300">
                  {tpl.estimatedDays} gün
                </span>
              </div>

              <p className="text-xs text-slate-400">
                Tip mimari şablon ve standart franchise fit-out süreci.
              </p>

              <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-xs">
                <span className="text-slate-500 text-[11px]">Format: IFC / RVT / DWG</span>
                <button
                  onClick={() => handleDownload(tpl.name)}
                  className="flex items-center gap-1.5 text-amber-400 hover:text-amber-300 font-semibold"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>İndir</span>
                </button>
              </div>
            </div>
          ))}

          {/* 3. Varsayılan Standart Konseptler (Eğer model azsa) */}
          {bimFiles.length === 0 && templates.length === 0 && (
            [
              { name: "Standart Cadde Mağazası (Tip A)", m2: "180 m²", code: "STD-A", count: 8 },
              { name: "AVM Kiosk / Express Mağaza", m2: "45 m²", code: "EXP-K", count: 12 },
              { name: "Amiral (Flagship) Deneyim Mağazası", m2: "350 m²", code: "FLG-X", count: 3 },
            ].map((mock, idx) => (
              <div
                key={idx}
                className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800/80 hover:border-amber-500/40 transition-all space-y-4"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">
                      {mock.code}
                    </span>
                    <h3 className="text-base font-bold text-white mt-0.5">
                      {mock.name}
                    </h3>
                  </div>
                  <span className="px-2 py-1 rounded-md bg-slate-800 text-[10px] font-mono text-slate-300">
                    {mock.m2}
                  </span>
                </div>

                <p className="text-xs text-slate-400">
                  {mock.count} şubede uygulanan onaylı kurumsal mağaza tasarımı.
                </p>

                <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-xs">
                  <span className="text-slate-500 text-[11px]">Format: Revit / IFC 4.3</span>
                  <button
                    onClick={() => handleDownload(mock.name)}
                    className="flex items-center gap-1.5 text-amber-400 hover:text-amber-300 font-semibold"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Paketi İndir</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* BIM Upload Modal Component */}
      <BimUploadModal
        isOpen={isBimModalOpen}
        onClose={() => setIsBimModalOpen(false)}
        projects={projects.map((p) => ({ id: p.id, name: p.name || "Şube / Proje" }))}
        onSuccess={handleSuccessUpload}
      />
    </div>
  )
}
