/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Franchise Portal - Bakım Onarım Talepleri (Helpdesk & Facility Management)
 */

import React from "react"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import Link from "next/link"
import {
  Headphones,
  Wrench,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Plus,
  ArrowRight,
  Flame,
  Zap,
  Building2,
  Calendar,
  Filter,
  Search,
  SlidersHorizontal
} from "lucide-react"

export const dynamic = "force-dynamic"

export default async function FranchiseHelpdeskPage() {
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
    },
    take: 20,
  })

  // Mock facility & maintenance tickets
  const sampleTickets = [
    {
      id: "TKT-1042",
      storeName: projects[0]?.name || "Kadıköy Çarşı Şubesi",
      category: "Endüstriyel Soğutma",
      issue: "Reyon sütlük dolabında sıcaklık +8°C üzerine çıktı (Gaz basıncı düşüklüğü)",
      priority: "CRITICAL",
      status: "OPEN",
      technician: "Atlas Soğutma Servisi",
      slaHours: 2,
      createdAt: "Bugün 14:20",
    },
    {
      id: "TKT-1039",
      storeName: projects[1]?.name || "Bakırköy Marmara Forum AVM",
      category: "İklimlendirme (HVAC)",
      issue: "VAV havalandırma ünitesinde hava debisi yetersiz, sesli çalışma",
      priority: "HIGH",
      status: "IN_PROGRESS",
      technician: "Daikin Kurumsal Servis",
      slaHours: 12,
      createdAt: "Dün 18:45",
    },
    {
      id: "TKT-1035",
      storeName: projects[2]?.name || "Ankara Tunalı Hilmi Şubesi",
      category: "Elektrik & Aydınlatma",
      issue: "Vitrin aydınlatma trafosu sigortası periyodik atıyor",
      priority: "NORMAL",
      status: "RESOLVED",
      technician: "Nexa İç Bakım Ekibi",
      slaHours: 24,
      createdAt: "22.10.2026",
    },
  ]

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-amber-400">
            <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
            Tesis Yönetimi & Teknik Servis
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight mt-1 flex items-center gap-3">
            <Headphones className="w-8 h-8 text-amber-400" />
            Mağaza Bakım Onarım Talepleri (Helpdesk)
          </h1>
          <p className="text-sm text-slate-400 mt-1 max-w-2xl">
            Tüm şubelerden gelen soğutma, HVAC, jeneratör, POS ve otomatik kepenk arıza bildirimlerini SLA süreleriyle takip edin.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/franchise/logistics/rma"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-200 text-xs font-medium transition-all shadow-sm"
          >
            <AlertTriangle className="w-4 h-4 text-red-400" />
            <span>Hasarlı Teslimat (RMA)</span>
          </Link>
          <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white text-xs font-bold transition-all shadow-lg shadow-amber-500/20">
            <Plus className="w-4 h-4" />
            <span>Yeni Arıza Bildirimi</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800/80 backdrop-blur-xl">
          <div className="text-xs text-red-400 font-medium flex items-center justify-between">
            <span>Kritik Arızalar (Acil)</span>
            <Flame className="w-4 h-4 text-red-400" />
          </div>
          <div className="text-2xl font-black text-red-400 mt-2">
            1 <span className="text-xs text-slate-500 font-normal">şube</span>
          </div>
          <div className="text-[11px] text-red-400/80 mt-1">
            2 saat SLA taahhüdü aktif
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800/80 backdrop-blur-xl">
          <div className="text-xs text-amber-400 font-medium flex items-center justify-between">
            <span>İşlemdeki Talepler</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-white mt-2">
            4 <span className="text-xs text-slate-500 font-normal">talep</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Teknisyen yönlendirildi
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800/80 backdrop-blur-xl">
          <div className="text-xs text-emerald-400 font-medium flex items-center justify-between">
            <span>Bu Ay Çözülenler</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-400 mt-2">
            28 <span className="text-xs text-slate-500 font-normal">ariza</span>
          </div>
          <div className="text-[11px] text-emerald-500/80 mt-1">
            %96 SLA başarı oranı
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800/80 backdrop-blur-xl">
          <div className="text-xs text-blue-400 font-medium flex items-center justify-between">
            <span>Ortalama Çözüm Süresi</span>
            <Wrench className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-black text-white mt-2">
            4.2 <span className="text-xs text-slate-500 font-normal">saat</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Zincir hedefinin altında
          </div>
        </div>
      </div>

      {/* Ticket List */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <Wrench className="w-5 h-5 text-amber-400" />
          Açık Bakım Onarım Talepleri
        </h2>

        <div className="space-y-3">
          {sampleTickets.map((t) => (
            <div
              key={t.id}
              className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800/80 hover:border-slate-700/80 transition-all space-y-3"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                <div className="flex items-center gap-3">
                  <span className="font-mono font-bold text-amber-400 text-xs">{t.id}</span>
                  <span className="text-white font-bold text-sm">{t.storeName}</span>
                  <span className="text-slate-500">•</span>
                  <span className="text-xs text-slate-400">{t.category}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                      t.priority === "CRITICAL"
                        ? "bg-red-950/60 text-red-400 border-red-800/50"
                        : t.priority === "HIGH"
                        ? "bg-amber-950/60 text-amber-400 border-amber-800/50"
                        : "bg-slate-800 text-slate-300 border-slate-700"
                    }`}
                  >
                    Öncelik: {t.priority}
                  </span>
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                      t.status === "RESOLVED"
                        ? "bg-emerald-950/60 text-emerald-400 border-emerald-800/50"
                        : "bg-blue-950/60 text-blue-400 border-blue-800/50"
                    }`}
                  >
                    {t.status === "RESOLVED" ? "TAMAMLANDI" : t.status === "IN_PROGRESS" ? "SERVİS YOLDA" : "YENİ TALEP"}
                  </span>
                </div>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">
                {t.issue}
              </p>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 text-xs text-slate-400">
                <div className="flex items-center gap-4">
                  <span>Atanan Servis: <strong className="text-white">{t.technician}</strong></span>
                  <span>Bildirim: <strong className="text-white">{t.createdAt}</strong></span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-amber-400 font-semibold">Hedef SLA: {t.slaHours} Saat</span>
                  <button className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold transition-colors">
                    Servis Güncelle
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
