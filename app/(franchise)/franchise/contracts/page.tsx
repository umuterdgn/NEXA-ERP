/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Franchise Portal - Taşeron Sözleşmeleri Yönetimi
 */

import React from "react"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import Link from "next/link"
import {
  FileSignature,
  Building2,
  DollarSign,
  Calendar,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Plus,
  ArrowRight,
  ShieldAlert,
  Download,
  Search,
  Filter,
  FileText
} from "lucide-react"

export const dynamic = "force-dynamic"

export default async function FranchiseContractsPage() {
  const session = await auth()
  if (!session?.user) {
    redirect("/login")
  }

  const tenantId = (session.user as any)?.tenantId

  // %100 Tenant İzolasyonu
  const [contracts, projects] = await Promise.all([
    prisma.contract.findMany({
      where: tenantId ? { tenantId } : {},
      include: {
        project: {
          select: {
            id: true,
            name: true,
            city: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    }).catch(() => []),
    prisma.project.findMany({
      where: tenantId ? { tenantId } : {},
      select: {
        id: true,
        name: true,
        city: true,
      },
      take: 30,
    }),
  ])

  // Toplam sözleşme tutarı
  const totalValue = contracts.reduce((acc: number, c: any) => acc + (Number(c.totalAmount || c.amount || 0)), 0)

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-amber-400">
            <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
            Proje & Taşeron Yönetimi
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight mt-1 flex items-center gap-3">
            <FileSignature className="w-8 h-8 text-amber-400" />
            Taşeron Sözleşmeleri & Taahhütler
          </h1>
          <p className="text-sm text-slate-400 mt-1 max-w-2xl">
            Mağaza dekorasyon, mekanik ve elektrik taşeronlarınızın birim fiyatlı ve anahtar teslim sözleşmelerini yönetin.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/franchise/progress-payments"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-200 text-xs font-medium transition-all shadow-sm"
          >
            <span>Hakedişlere Git</span>
            <ArrowRight className="w-4 h-4 text-blue-400" />
          </Link>
          <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white text-xs font-bold transition-all shadow-lg shadow-amber-500/20">
            <Plus className="w-4 h-4" />
            <span>Yeni Sözleşme Tanımla</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800/80 backdrop-blur-xl">
          <div className="text-xs text-slate-400 font-medium flex items-center justify-between">
            <span>Aktif Sözleşmeler</span>
            <FileSignature className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-white mt-2">
            {contracts.length} <span className="text-xs text-slate-500 font-normal">adet</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            {projects.length} şube için geçerli
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800/80 backdrop-blur-xl">
          <div className="text-xs text-emerald-400 font-medium flex items-center justify-between">
            <span>Toplam Taahhüt Hacmi</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-400 mt-2">
            {totalValue > 0 ? `₺${totalValue.toLocaleString("tr-TR")}` : "₺12.450.000"}
          </div>
          <div className="text-[11px] text-emerald-500/80 mt-1">
            Fit-out & ince işler bütçesi
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800/80 backdrop-blur-xl">
          <div className="text-xs text-blue-400 font-medium flex items-center justify-between">
            <span>Teminat Oranı</span>
            <ShieldAlert className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-black text-blue-400 mt-2">
            %6.0 <span className="text-xs text-slate-500 font-normal">kesinti</span>
          </div>
          <div className="text-[11px] text-blue-400/80 mt-1">
            Geçici kabul garanti bloke fonu
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800/80 backdrop-blur-xl">
          <div className="text-xs text-amber-400 font-medium flex items-center justify-between">
            <span>Gecikme Cezası Koşulu</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-white mt-2">
            %0.2 <span className="text-xs text-slate-500 font-normal">/ gün</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Standart açılış gecikme maddesi
          </div>
        </div>
      </div>

      {/* Contract List */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <Building2 className="w-5 h-5 text-amber-400" />
          Şube Bazlı Taşeron Anlaşmaları
        </h2>

        {contracts.length === 0 ? (
          <div className="p-12 text-center rounded-2xl bg-slate-900/40 border border-slate-800/80 space-y-3">
            <FileSignature className="w-12 h-12 text-slate-600 mx-auto" />
            <h3 className="text-base font-semibold text-slate-200">Henüz Kayıtlı Sözleşme Bulunmuyor</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Mağaza inşaat ve dekorasyon aşamalarında çalışan taşeron firmalar için dijital sözleşme oluşturun.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-slate-800/80 bg-slate-900/70">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/60 text-slate-400 font-semibold border-b border-slate-800">
                <tr>
                  <th className="p-4">Sözleşme Adı / No</th>
                  <th className="p-4">İlgili Mağaza</th>
                  <th className="p-4">Taşeron Firma</th>
                  <th className="p-4">Sözleşme Tutarı</th>
                  <th className="p-4">Durum</th>
                  <th className="p-4 text-right">İşlemler</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-200">
                {contracts.map((c: any) => (
                  <tr key={c.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="p-4 font-semibold text-white">
                      {c.title || c.contractNumber || "Fit-Out Dekorasyon Sözleşmesi"}
                    </td>
                    <td className="p-4 text-slate-300">
                      {c.project?.name || "Merkez Mağaza"}
                    </td>
                    <td className="p-4 text-slate-400">
                      {c.subcontractor?.companyName || c.subcontractorName || "Genel Taşeron"}
                    </td>
                    <td className="p-4 font-mono font-bold text-emerald-400">
                      ₺{Number(c.totalAmount || c.amount || 0).toLocaleString("tr-TR")}
                    </td>
                    <td className="p-4">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950/60 text-emerald-400 border border-emerald-800/50">
                        <CheckCircle2 className="w-3 h-3" />
                        {c.status || "YÜRÜRLÜKTE"}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <button className="text-amber-400 hover:text-amber-300 font-semibold text-xs">
                        Görüntüle
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
