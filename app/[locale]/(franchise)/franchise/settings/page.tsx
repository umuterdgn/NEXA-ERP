/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Franchise Portal - Firma & Marka Ayarları
 */

import React from "react"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import Link from "next/link"
import {
  Settings,
  Building2,
  Palette,
  ShieldCheck,
  Save,
  CheckCircle2,
  Percent,
  Clock,
  Sparkles,
  Sliders,
  DollarSign,
  Image as ImageIcon
} from "lucide-react"

export const dynamic = "force-dynamic"

export default async function FranchiseSettingsPage() {
  const session = await auth()
  if (!session?.user) {
    redirect("/login")
  }

  const tenantId = (session.user as any)?.tenantId

  // %100 Tenant İzolasyonu
  const tenant = tenantId
    ? await prisma.tenant.findUnique({
        where: { id: tenantId },
        select: {
          id: true,
          name: true,
          slug: true,
          type: true,
          logoUrl: true,
          primaryColor: true,
          isWhiteLabelActive: true,
          subscriptionStatus: true,
          createdAt: true,
        },
      })
    : null

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-amber-400">
            <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
            Sistem & Konfigürasyon
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight mt-1 flex items-center gap-3">
            <Settings className="w-8 h-8 text-amber-400" />
            Franchise Marka & Portal Ayarları
          </h1>
          <p className="text-sm text-slate-400 mt-1 max-w-2xl">
            Zincir mağazalarınız için kurumsal kimlik, logo, royalty komisyon oranları ve standart açılış sürelerini yapılandırın.
          </p>
        </div>

        <button className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white text-xs font-bold transition-all shadow-lg shadow-amber-500/20">
          <Save className="w-4 h-4" />
          <span>Değişiklikleri Kaydet</span>
        </button>
      </div>

      {/* Form Cards */}
      <div className="space-y-6">
        {/* Kurumsal Marka & White-Label */}
        <div className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800/80 space-y-5">
          <h2 className="text-base font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
            <Building2 className="w-5 h-5 text-amber-400" />
            Kurumsal Kimlik & White-Label Bilgileri
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Franchise Firma / Marka Adı</label>
              <input
                type="text"
                defaultValue={tenant?.name || "Global Coffee & Retail Chain"}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Sistem Alan Adı / Slug</label>
              <input
                type="text"
                disabled
                defaultValue={tenant?.slug || "global-retail"}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/60 border border-slate-800 text-slate-400 text-xs font-mono cursor-not-allowed"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Logo Görsel URL</label>
              <input
                type="text"
                defaultValue={tenant?.logoUrl || ""}
                placeholder="https://example.com/logo.png"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Kurumsal Marka Rengi (HEX)</label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  defaultValue={tenant?.primaryColor || "#F59E0B"}
                  className="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-mono focus:outline-none focus:border-amber-500"
                />
                <div
                  className="h-9 w-9 rounded-xl border border-slate-700 shrink-0"
                  style={{ backgroundColor: tenant?.primaryColor || "#F59E0B" }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Royalty ve Finans Parametreleri */}
        <div className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800/80 space-y-5">
          <h2 className="text-base font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
            <Percent className="w-5 h-5 text-amber-400" />
            Royalty Komisyon & Ticari Kurallar
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Standart Royalty Oranı (%)</label>
              <input
                type="number"
                defaultValue={4.0}
                step="0.5"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-mono focus:outline-none focus:border-amber-500"
              />
              <span className="text-[10px] text-slate-400">Aylık brüt ciro üzerinden</span>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Ulusal Reklam Katılım Payı (%)</label>
              <input
                type="number"
                defaultValue={1.0}
                step="0.5"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-mono focus:outline-none focus:border-amber-500"
              />
              <span className="text-[10px] text-slate-400">Pazarlama fonu havuzu</span>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Hedef Fit-Out Süresi (Gün)</label>
              <input
                type="number"
                defaultValue={45}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-mono focus:outline-none focus:border-amber-500"
              />
              <span className="text-[10px] text-slate-400">Anahtar teslim ortalama</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
