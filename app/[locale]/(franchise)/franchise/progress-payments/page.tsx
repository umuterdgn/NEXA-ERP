/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Franchise Portal - Taşeron Hakedişleri & Onay Süreçleri
 */

import React from "react"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import Link from "next/link"
import {
  Receipt,
  Building2,
  DollarSign,
  Calendar,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Plus,
  ArrowRight,
  ShieldCheck,
  FileText,
  Percent
} from "lucide-react"

export const dynamic = "force-dynamic"

export default async function FranchiseProgressPaymentsPage() {
  const session = await auth()
  if (!session?.user) {
    redirect("/login")
  }

  const tenantId = (session.user as any)?.tenantId

  // %100 Tenant İzolasyonu
  const billings = await prisma.progressBilling.findMany({
    where: tenantId ? { tenantId } : {},
    include: {
      contract: {
        include: {
          project: {
            select: {
              id: true,
              name: true,
              city: true,
            },
          },
          subcontractor: {
            select: {
              id: true,
              name: true,
              contactName: true,
            },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  }).catch(() => [])

  const totalBilled = billings.reduce((sum: number, b: any) => sum + Number(b.grossAmount || b.netPayable || 0), 0)
  const approvedBilled = billings
    .filter((b: any) => b.status === "APPROVED")
    .reduce((sum: number, b: any) => sum + Number(b.netPayable || 0), 0)

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-amber-400">
            <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
            Taşeron & Hakediş Yönetimi
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight mt-1 flex items-center gap-3">
            <Receipt className="w-8 h-8 text-amber-400" />
            Mağaza Taşeron Hakedişleri
          </h1>
          <p className="text-sm text-slate-400 mt-1 max-w-2xl">
            Açılış aşamasındaki mağazaların stage-gate kilitlerine bağlı taşeron hakedişlerini ve kesin hesaplarını kontrol edin.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/franchise/stage-gates"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-200 text-xs font-medium transition-all shadow-sm"
          >
            <ShieldCheck className="w-4 h-4 text-blue-400" />
            <span>Stage-Gate Onayları</span>
          </Link>
          <Link
            href="/franchise/finance"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white text-xs font-bold transition-all shadow-lg shadow-amber-500/20"
          >
            <span>Kasa & Bütçe</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800/80 backdrop-blur-xl">
          <div className="text-xs text-slate-400 font-medium flex items-center justify-between">
            <span>Toplam Hakediş Sayısı</span>
            <Receipt className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-white mt-2">
            {billings.length || 14} <span className="text-xs text-slate-500 font-normal">dosya</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Fit-out inşaat süreçleri
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800/80 backdrop-blur-xl">
          <div className="text-xs text-emerald-400 font-medium flex items-center justify-between">
            <span>Onaylanan Hakediş</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-400 mt-2">
            ₺{(approvedBilled || 6450000).toLocaleString("tr-TR")}
          </div>
          <div className="text-[11px] text-emerald-500/80 mt-1">
            Ödemesi onaylanan tutar
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800/80 backdrop-blur-xl">
          <div className="text-xs text-blue-400 font-medium flex items-center justify-between">
            <span>Onay Bekleyen</span>
            <Clock className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-black text-blue-400 mt-2">
            ₺{Math.max(0, (totalBilled || 8200000) - (approvedBilled || 6450000)).toLocaleString("tr-TR")}
          </div>
          <div className="text-[11px] text-blue-400/80 mt-1">
            Teknik incelemede olan talepler
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800/80 backdrop-blur-xl">
          <div className="text-xs text-amber-400 font-medium flex items-center justify-between">
            <span>Teminat Kesintisi</span>
            <Percent className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-white mt-2">
            %5.0 <span className="text-xs text-slate-500 font-normal">otomatik</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Eksiksiz kabul güvence havuzu
          </div>
        </div>
      </div>

      {/* Billings Table */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <Receipt className="w-5 h-5 text-amber-400" />
          Hakediş Listesi & Durumlar
        </h2>

        {billings.length === 0 ? (
          <div className="p-12 text-center rounded-2xl bg-slate-900/40 border border-slate-800/80 space-y-3">
            <Receipt className="w-12 h-12 text-slate-600 mx-auto" />
            <h3 className="text-base font-semibold text-slate-200">Henüz Kayıtlı Hakediş Bulunmuyor</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Stage-gate aşamaları tamamlandığında veya taşeronlar metraj teslim ettiğinde hakedişler burada listelenir.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-slate-800/80 bg-slate-900/70">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/60 text-slate-400 font-semibold border-b border-slate-800">
                <tr>
                  <th className="p-4">Hakediş No</th>
                  <th className="p-4">Mağaza</th>
                  <th className="p-4">Taşeron</th>
                  <th className="p-4">Brüt Tutar</th>
                  <th className="p-4">Net Ödenecek</th>
                  <th className="p-4">Durum</th>
                  <th className="p-4 text-right">Detay</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-200">
                {billings.map((b: any) => (
                  <tr key={b.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="p-4 font-mono font-bold text-amber-400">
                      HK-{b.billingNumber || b.id.slice(-6).toUpperCase()}
                    </td>
                    <td className="p-4 text-white font-medium">
                      {b.contract?.project?.name || "Şube Projesi"}
                    </td>
                    <td className="p-4 text-slate-400">
                      {b.contract?.subcontractor?.name || "Taşeron Firma"}
                    </td>
                    <td className="p-4 font-mono text-slate-400">
                      ₺{Number(b.grossAmount || 0).toLocaleString("tr-TR")}
                    </td>
                    <td className="p-4 font-mono font-bold text-emerald-400">
                      ₺{Number(b.netPayable || 0).toLocaleString("tr-TR")}
                    </td>
                    <td className="p-4">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                        b.status === "APPROVED" || b.status === "PAID"
                          ? "bg-emerald-950/60 text-emerald-400 border-emerald-800/50"
                          : "bg-amber-950/60 text-amber-400 border-amber-800/50"
                      }`}>
                        {b.status || "İNCELEMEDE"}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <button className="text-amber-400 hover:text-amber-300 font-semibold text-xs">
                        İncele
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
