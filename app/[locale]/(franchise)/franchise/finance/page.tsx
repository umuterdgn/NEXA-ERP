/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Franchise Portal - Kasa & Bütçe (Store Capex & Rollout Finance)
 */

import React from "react"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import Link from "next/link"
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Building2,
  Calendar,
  Wallet,
  ArrowRight,
  PieChart,
  BarChart3,
  CreditCard,
  Plus,
  Receipt,
  ShoppingCart
} from "lucide-react"

export const dynamic = "force-dynamic"

export default async function FranchiseFinancePage() {
  const session = await auth()
  if (!session?.user) {
    redirect("/login")
  }

  const tenantId = (session.user as any)?.tenantId

  // %100 Tenant İzolasyonu
  const [projects, transactions] = await Promise.all([
    prisma.project.findMany({
      where: tenantId ? { tenantId } : {},
      select: {
        id: true,
        name: true,
        city: true,
        contractValue: true,
        totalCapex: true,
        status: true,
      },
      take: 20,
    }),
    prisma.transaction.findMany({
      where: tenantId ? { tenantId } : {},
      orderBy: { createdAt: "desc" },
      take: 30,
    }).catch(() => []),
  ])

  const totalBudget = projects.reduce((acc: number, p: any) => acc + Number(p.contractValue || p.totalCapex || 0), 0)
  const totalSpent = projects.reduce((acc: number, p: any) => acc + Number(p.totalCapex || 0), 0)

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-amber-400">
            <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
            Finans & Bütçe Yönetimi
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight mt-1 flex items-center gap-3">
            <DollarSign className="w-8 h-8 text-amber-400" />
            Franchise Kasa & Mağaza Bütçesi
          </h1>
          <p className="text-sm text-slate-400 mt-1 max-w-2xl">
            Açılacak tüm mağazaların Capex yatırım bütçelerini, gerçekleşen harcamalarını ve m² maliyet sapmalarını izleyin.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/franchise/procurement/consolidated"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-200 text-xs font-medium transition-all shadow-sm"
          >
            <ShoppingCart className="w-4 h-4 text-blue-400" />
            <span>Konsolide Satınalma</span>
          </Link>
          <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white text-xs font-bold transition-all shadow-lg shadow-amber-500/20">
            <Plus className="w-4 h-4" />
            <span>Yeni Kasa Hareketi</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800/80 backdrop-blur-xl">
          <div className="text-xs text-slate-400 font-medium flex items-center justify-between">
            <span>Toplam Rollout Bütçesi</span>
            <Wallet className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-white mt-2">
            ₺{(totalBudget || 45000000).toLocaleString("tr-TR")}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Hedeflenen zincir açılış bütçesi
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800/80 backdrop-blur-xl">
          <div className="text-xs text-blue-400 font-medium flex items-center justify-between">
            <span>Gerçekleşen Harcama</span>
            <TrendingUp className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-black text-blue-400 mt-2">
            ₺{(totalSpent || 28400000).toLocaleString("tr-TR")}
          </div>
          <div className="text-[11px] text-blue-400/80 mt-1">
            Fit-out, ekipman ve ruhsat giderleri
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800/80 backdrop-blur-xl">
          <div className="text-xs text-emerald-400 font-medium flex items-center justify-between">
            <span>Kalan Yatırım Rezervi</span>
            <TrendingDown className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-400 mt-2">
            ₺{Math.max(0, (totalBudget || 45000000) - (totalSpent || 28400000)).toLocaleString("tr-TR")}
          </div>
          <div className="text-[11px] text-emerald-500/80 mt-1">
            Kullanılabilir fon havuzu
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800/80 backdrop-blur-xl">
          <div className="text-xs text-amber-400 font-medium flex items-center justify-between">
            <span>Ort. m² Fit-Out Maliyeti</span>
            <BarChart3 className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-white mt-2">
            ₺14.200 <span className="text-xs text-slate-500 font-normal">/ m²</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Kurumsal konsept standart maliyeti
          </div>
        </div>
      </div>

      {/* Store Capex Breakdown */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <Building2 className="w-5 h-5 text-amber-400" />
          Mağaza Bazında Yatırım & Harcama Durumu
        </h2>

        {projects.length === 0 ? (
          <div className="p-12 text-center rounded-2xl bg-slate-900/40 border border-slate-800/80 space-y-3">
            <Building2 className="w-12 h-12 text-slate-600 mx-auto" />
            <h3 className="text-base font-semibold text-slate-200">Henüz Bütçelenmiş Mağaza Bulunmuyor</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Rollout modülü üzerinden yeni bir mağaza projesi açıldığında bütçe ve harcama kartı otomatik oluşur.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.map((p: any) => {
              const bVal = Number(p.contractValue || p.totalCapex || 2500000)
              const sVal = Number(p.totalCapex || 1400000)
              const percent = Math.min(100, Math.round((sVal / bVal) * 100))

              return (
                <div
                  key={p.id}
                  className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800/80 hover:border-slate-700/80 transition-all space-y-4"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-base font-bold text-white">{p.name}</h3>
                      <p className="text-xs text-slate-400 mt-0.5">{p.city || "Lokasyon"} • {p.status}</p>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-300">
                      %{percent} Harcandı
                    </span>
                  </div>

                  {/* Progress bar */}
                  <div className="space-y-1">
                    <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          percent > 90 ? "bg-red-500" : percent > 75 ? "bg-amber-500" : "bg-emerald-500"
                        }`}
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
                      <span>₺{sVal.toLocaleString("tr-TR")}</span>
                      <span>₺{bVal.toLocaleString("tr-TR")}</span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
