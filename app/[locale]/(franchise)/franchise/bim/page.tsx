/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Franchise Portal - BIM & 3D Mağaza Tasarım Modelleri
 */

import React from "react"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
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
  ChevronRight
} from "lucide-react"

export const dynamic = "force-dynamic"

export default async function FranchiseBimPage() {
  const session = await auth()
  if (!session?.user) {
    redirect("/login")
  }

  const tenantId = (session.user as any)?.tenantId

  // %100 Tenant İzolasyonu
  const [projects, templates] = await Promise.all([
    prisma.project.findMany({
      where: tenantId ? { tenantId } : {},
      select: {
        id: true,
        name: true,
        city: true,
        district: true,
        status: true,
        storeTemplate: {
          select: {
            id: true,
            name: true,
            estimatedDays: true,
          },
        },
      },
      take: 20,
    }),
    prisma.storeTemplate.findMany({
      where: tenantId ? { tenantId } : {},
      select: {
        id: true,
        name: true,
        estimatedDays: true,
      },
    }),
  ])

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
          <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white text-xs font-bold transition-all shadow-lg shadow-amber-500/20">
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
            <button className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300">
              <Maximize2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 3D Canvas Mockup & Interactive Viewport */}
        <div className="h-80 md:h-96 relative flex items-center justify-center p-6 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px]">
          <div className="text-center space-y-4 max-w-md z-10">
            <div className="h-20 w-20 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto shadow-xl shadow-amber-500/10">
              <Boxes className="w-10 h-10 animate-bounce" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                3D BIM & Sanal Mağaza İkizi (Digital Twin)
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Mağaza raf yerleşimi, kasa bankosu, soğutucu üniteleri ve HVAC havalandırma kanalları koordinatlı BIM modelindedir.
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
              <span className="px-3 py-1 rounded-full bg-slate-800/90 text-[11px] font-medium text-slate-300 border border-slate-700">
                Katman: Mimari (Arch)
              </span>
              <span className="px-3 py-1 rounded-full bg-slate-800/90 text-[11px] font-medium text-slate-300 border border-slate-700">
                Katman: Mekanik & HVAC
              </span>
              <span className="px-3 py-1 rounded-full bg-slate-800/90 text-[11px] font-medium text-slate-300 border border-slate-700">
                Katman: Mobilya & Gondol
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Model Catalog & Concept Types */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <Layers className="w-5 h-5 text-amber-400" />
          Zincir Konsept 3D Modelleri
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {templates.length > 0 ? (
            templates.map((tpl) => (
              <div
                key={tpl.id}
                className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800/80 hover:border-amber-500/40 transition-all space-y-4"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">
                      TİP KONSEPT
                    </span>
                    <h3 className="text-base font-bold text-white mt-0.5">
                      {tpl.name}
                    </h3>
                  </div>
                  <span className="px-2 py-1 rounded-md bg-slate-800 text-[10px] font-mono text-slate-300">
                    {tpl.estimatedDays} gün
                  </span>
                </div>

                <p className="text-xs text-slate-400">
                  Tip mimari şablon ve standart fit-out süreci.
                </p>

                <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-xs">
                  <span className="text-slate-500 text-[11px]">Format: IFC / RVT / DWG</span>
                  <button className="flex items-center gap-1.5 text-amber-400 hover:text-amber-300 font-semibold">
                    <Download className="w-3.5 h-3.5" />
                    <span>İndir</span>
                  </button>
                </div>
              </div>
            ))
          ) : (
            // Default Standard Franchise Concepts if none in DB
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
                  <button className="flex items-center gap-1.5 text-amber-400 hover:text-amber-300 font-semibold">
                    <Download className="w-3.5 h-3.5" />
                    <span>Paketi İndir</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
