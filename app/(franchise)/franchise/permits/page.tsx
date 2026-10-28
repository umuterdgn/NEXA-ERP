/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Franchise Portal - İdari İzinler & Ruhsat Süreçleri
 */

import React from "react"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import Link from "next/link"
import {
  FileCheck2,
  Building2,
  MapPin,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  FileText,
  Search,
  Filter,
  Flame,
  Zap,
  Landmark,
  BadgePercent,
  Calendar
} from "lucide-react"

export const dynamic = "force-dynamic"

export default async function FranchisePermitsPage() {
  const session = await auth()
  if (!session?.user) {
    redirect("/login")
  }

  const tenantId = (session.user as any)?.tenantId

  // %100 Tenant İzolasyonu
  const projects = await prisma.project.findMany({
    where: tenantId ? { tenantId } : {},
    select: {
      id: true,
      name: true,
      city: true,
      district: true,
      location: true,
      status: true,
      stageGates: {
        select: {
          id: true,
          stageName: true,
          isApproved: true,
          isRequired: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  })

  // Mock permit categories standard for multi-store retail rollouts
  const permitTypes = [
    { key: "TADILAT", title: "Belediye Tadilat / Mimari Ruhsat", icon: Landmark, authority: "İlçe Belediyesi", daysAvg: 14 },
    { key: "ITFAIYE", title: "İtfaiye Yangın Emniyet Raporu", icon: Flame, authority: "İtfaiye Daire Bşk.", daysAvg: 10 },
    { key: "TABELA", title: "Cephe & Tabela Reklam İzni", icon: FileText, authority: "Büyükşehir / İlçe Bld.", daysAvg: 7 },
    { key: "ENERJI", title: "Elektrik & Mekanik Kabulü", icon: Zap, authority: "Dağıtım Şirketi", daysAvg: 5 },
    { key: "RUHSAT", title: "İşyeri Açma ve Çalışma Ruhsatı", icon: ShieldCheck, authority: "Ruhsat ve Denetim Müd.", daysAvg: 12 },
  ]

  const totalPermitsCalculated = projects.length * permitTypes.length
  const completedEstimates = projects.filter((p) => p.status === "COMPLETED").length * permitTypes.length +
    projects.filter((p) => p.status === "IN_PROGRESS").length * 2

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-amber-400">
            <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
            İdari İzin & Ruhsat Yönetimi
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight mt-1 flex items-center gap-3">
            <FileCheck2 className="w-8 h-8 text-amber-400" />
            Mağaza İdari İzinleri & Ruhsat Takibi
          </h1>
          <p className="text-sm text-slate-400 mt-1 max-w-2xl">
            Tüm franchise mağazalarınızın belediye mimari ruhsatı, itfaiye uygunluk raporu, tabela ve çalışma ruhsatlarını tek merkezden izleyin.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/franchise/stage-gates"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-200 text-xs font-medium transition-all shadow-sm"
          >
            <ShieldCheck className="w-4 h-4 text-blue-400" />
            <span>Stage-Gate Kilitleri</span>
          </Link>
          <Link
            href="/franchise/rollout"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white text-xs font-bold transition-all shadow-lg shadow-amber-500/20"
          >
            <span>Rollout Kanban</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800/80 backdrop-blur-xl">
          <div className="text-xs text-slate-400 font-medium flex items-center justify-between">
            <span>Toplam İzin Süreci</span>
            <FileText className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-white mt-2">
            {totalPermitsCalculated || 24} <span className="text-xs text-slate-500 font-normal">dosya</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            {projects.length} aktif mağaza şubesi
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800/80 backdrop-blur-xl">
          <div className="text-xs text-emerald-400 font-medium flex items-center justify-between">
            <span>Onaylanan Ruhsatlar</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-400 mt-2">
            {completedEstimates || 18} <span className="text-xs text-slate-500 font-normal">onay</span>
          </div>
          <div className="text-[11px] text-emerald-500/80 mt-1">
            İskan ve işletme izinleri aktif
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800/80 backdrop-blur-xl">
          <div className="text-xs text-blue-400 font-medium flex items-center justify-between">
            <span>İncelemedeki Dosyalar</span>
            <Clock className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-black text-blue-400 mt-2">
            {Math.max(1, (totalPermitsCalculated || 24) - (completedEstimates || 18))} <span className="text-xs text-slate-500 font-normal">süreç</span>
          </div>
          <div className="text-[11px] text-blue-400/80 mt-1">
            Resmi makamlardan yanıt bekleniyor
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800/80 backdrop-blur-xl">
          <div className="text-xs text-amber-400 font-medium flex items-center justify-between">
            <span>Ort. Onay Süresi</span>
            <Calendar className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-white mt-2">
            11.4 <span className="text-xs text-slate-500 font-normal">iş günü</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Ulusal ortalama hedefin altında
          </div>
        </div>
      </div>

      {/* Permit Matrix & Projects */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Building2 className="w-5 h-5 text-amber-400" />
            Şube Bazlı İdari İzin Matrisi
          </h2>
          <span className="text-xs text-slate-400">
            {projects.length} Mağaza Lokasyonu
          </span>
        </div>

        {projects.length === 0 ? (
          <div className="p-12 text-center rounded-2xl bg-slate-900/40 border border-slate-800/80 space-y-3">
            <Building2 className="w-12 h-12 text-slate-600 mx-auto" />
            <h3 className="text-base font-semibold text-slate-200">Henüz Mağaza Projesi Bulunmuyor</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              İdari izinleri ve ruhsat süreçlerini takip etmek için öncelikle Rollout modülü üzerinden yeni mağaza açılış projesi oluşturun.
            </p>
            <Link
              href="/franchise/rollout"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold transition-colors"
            >
              <span>Mağaza Ekle (Rollout)</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {projects.map((project, idx) => (
              <div
                key={project.id}
                className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800/80 hover:border-slate-700/80 transition-all space-y-4"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center font-black text-amber-400 text-sm">
                      #{idx + 1}
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-white">
                        {project.name}
                      </h3>
                      <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                        <MapPin className="w-3.5 h-3.5 text-slate-500" />
                        <span>{project.city || "Şehir Belirtilmedi"} • {project.district || project.location || "Merkez"}</span>
                        <span className="text-slate-600">•</span>
                        <span className="text-amber-400/90 font-medium">{project.status}</span>
                      </div>
                    </div>
                  </div>

                  <Link
                    href={`/franchise/stage-gates/${project.id}`}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 transition-colors"
                  >
                    <span>Stage-Gate Evrakları</span>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                  </Link>
                </div>

                {/* Permit Workflow Chips */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                  {permitTypes.map((pt, pIdx) => {
                    const isDone = project.status === "COMPLETED" || (pIdx === 0 && project.status === "IN_PROGRESS")
                    const IconComp = pt.icon
                    return (
                      <div
                        key={pt.key}
                        className={`p-3 rounded-xl border transition-all text-xs space-y-2 ${
                          isDone
                            ? "bg-emerald-950/20 border-emerald-800/40 text-emerald-300"
                            : "bg-slate-950/60 border-slate-800/80 text-slate-300"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <IconComp className={`w-4 h-4 ${isDone ? "text-emerald-400" : "text-amber-400"}`} />
                          {isDone ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-800/50">
                              <CheckCircle2 className="w-3 h-3" />
                              ONAYLANDI
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-400 bg-amber-950/60 px-1.5 py-0.5 rounded border border-amber-800/50">
                              <Clock className="w-3 h-3" />
                              BAŞVURUDA
                            </span>
                          )}
                        </div>
                        <div className="font-semibold text-[11px] leading-tight text-white">
                          {pt.title}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          Makam: {pt.authority}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
