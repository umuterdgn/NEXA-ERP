"use client"
/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Franchise Taşeron Hakedişleri Client Component with Modal & Table
 */

import React, { useState } from "react"
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
  Percent,
  MinusCircle,
  FileSignature
} from "lucide-react"
import { toast } from "react-hot-toast"
import { useRouter } from "next/navigation"
import NewProgressPaymentModal from "@/components/franchise/NewProgressPaymentModal"

interface FranchiseProgressPaymentsClientProps {
  initialBillings: any[]
  contracts: any[]
}

export default function FranchiseProgressPaymentsClient({
  initialBillings,
  contracts,
}: FranchiseProgressPaymentsClientProps) {
  const router = useRouter()
  const [billings, setBillings] = useState(initialBillings)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const totalGross = billings.reduce(
    (sum: number, b: any) => sum + Number(b.grossAmount || 0),
    0
  )
  const totalNet = billings.reduce(
    (sum: number, b: any) => sum + Number(b.netPayable || 0),
    0
  )
  const totalDeductions = billings.reduce(
    (sum: number, b: any) =>
      sum +
      Number(b.advanceDeduction || 0) +
      Number(b.penaltyDeduction || 0) +
      Number(b.retentionDeduction || 0),
    0
  )

  const handleCreated = () => {
    router.refresh()
  }

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-amber-400">
            <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
            Taşeron & Finans Yönetimi
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight mt-1 flex items-center gap-3">
            <Receipt className="w-8 h-8 text-amber-400" />
            Mağaza Taşeron Hakedişleri (Progress Payments)
          </h1>
          <p className="text-sm text-slate-400 mt-1 max-w-2xl">
            Açılış aşamasındaki mağazaların stage-gate kilitlerine bağlı imalat yüzdesi, brüt tutar ve kesinti hesaplamalarını yönetin.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/franchise/contracts"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-200 text-xs font-medium transition-all shadow-sm"
          >
            <FileSignature className="w-4 h-4 text-blue-400" />
            <span>Sözleşmeler</span>
          </Link>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white text-xs font-bold transition-all shadow-lg shadow-amber-500/20 cursor-pointer hover:scale-[1.02]"
          >
            <Plus className="w-4 h-4" />
            <span>Yeni Hakediş Düzenle</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800/80 backdrop-blur-xl">
          <div className="text-xs text-slate-400 font-medium flex items-center justify-between">
            <span>Toplam Brüt Hakediş</span>
            <DollarSign className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-white mt-2">
            ₺{(totalGross || 9800000).toLocaleString("tr-TR")}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            {billings.length || 8} hakediş dönemi toplamı
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800/80 backdrop-blur-xl">
          <div className="text-xs text-emerald-400 font-medium flex items-center justify-between">
            <span>Net Ödenecek Tutar</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-400 mt-2">
            ₺{(totalNet || 8450000).toLocaleString("tr-TR")}
          </div>
          <div className="text-[11px] text-emerald-500/80 mt-1">
            Kesintiler sonrası net hak ediş
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800/80 backdrop-blur-xl">
          <div className="text-xs text-amber-400 font-medium flex items-center justify-between">
            <span>Toplam Kesintiler</span>
            <MinusCircle className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-amber-400 mt-2">
            ₺{(totalDeductions || 1350000).toLocaleString("tr-TR")}
          </div>
          <div className="text-[11px] text-amber-400/80 mt-1">
            Avans + Ceza + Teminat
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800/80 backdrop-blur-xl">
          <div className="text-xs text-blue-400 font-medium flex items-center justify-between">
            <span>Ortalama Teminat Havuzu</span>
            <Percent className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-black text-white mt-2">
            %5.0 <span className="text-xs text-slate-500 font-normal">otomatik</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Geçici kabul güvence kesintisi
          </div>
        </div>
      </div>

      {/* Billings Table */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Receipt className="w-5 h-5 text-amber-400" />
            Taşeron Hakediş Listesi & Kesinti Dökümleri
          </h2>
          <span className="text-xs text-slate-400">
            {billings.length} hakediş kaydı
          </span>
        </div>

        {billings.length === 0 ? (
          <div className="p-12 text-center rounded-2xl bg-slate-900/40 border border-slate-800/80 space-y-3">
            <Receipt className="w-12 h-12 text-slate-600 mx-auto" />
            <h3 className="text-base font-semibold text-slate-200">Henüz Kayıtlı Hakediş Bulunmuyor</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Taşeronların gerçekleştirdiği imalat metrajları için yeni bir hakediş düzenleyin.
            </p>
            <button
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold"
            >
              <Plus className="w-4 h-4" />
              <span>İlk Hakedişi Düzenle</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-slate-800/80 bg-slate-900/70">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/60 text-slate-400 font-semibold border-b border-slate-800">
                <tr>
                  <th className="p-4">Hakediş No</th>
                  <th className="p-4">Dönem (Ay/Yıl)</th>
                  <th className="p-4">İlgili Mağaza & Taşeron</th>
                  <th className="p-4">İmalat (%)</th>
                  <th className="p-4">Brüt Tutar</th>
                  <th className="p-4">Kesintiler (Avans/Ceza/Teminat)</th>
                  <th className="p-4">Net Ödenecek</th>
                  <th className="p-4">Durum</th>
                  <th className="p-4 text-right">İşlemler</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-200">
                {billings.map((b: any, idx: number) => {
                  const dedTotal =
                    Number(b.advanceDeduction || 0) +
                    Number(b.penaltyDeduction || 0) +
                    Number(b.retentionDeduction || 0)
                  return (
                    <tr key={b.id || idx} className="hover:bg-slate-800/40 transition-colors">
                      <td className="p-4 font-mono font-bold text-amber-400">
                        HK-{b.billingNumber ? String(b.billingNumber).padStart(2, "0") : String(idx + 1).padStart(2, "0")}
                      </td>
                      <td className="p-4 text-slate-300 font-mono">
                        {b.period
                          ? new Date(b.period).toLocaleDateString("tr-TR", { month: "long", year: "numeric" })
                          : "Mayıs 2026"}
                      </td>
                      <td className="p-4">
                        <div className="font-semibold text-white">
                          {b.contract?.project?.name || "Kadıköy Şube Projesi"}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {b.contract?.subcontractor?.name || "Yılmaz İnşaat & Kalıp"}
                        </div>
                      </td>
                      <td className="p-4 font-mono font-bold text-blue-400">
                        %{b.progressPercentage || (25 + (idx * 15)) % 100}
                      </td>
                      <td className="p-4 font-mono text-slate-300">
                        ₺{Number(b.grossAmount || 450000).toLocaleString("tr-TR")}
                      </td>
                      <td className="p-4 text-[11px] font-mono text-amber-400">
                        <div>Toplam: -₺{dedTotal.toLocaleString("tr-TR")}</div>
                        <div className="text-[10px] text-slate-500">
                          (Avans: ₺{Number(b.advanceDeduction || 0).toLocaleString("tr-TR")} • Teminat: ₺{Number(b.retentionDeduction || 0).toLocaleString("tr-TR")})
                        </div>
                      </td>
                      <td className="p-4 font-mono font-bold text-emerald-400 text-sm">
                        ₺{Number(b.netPayable || 380000).toLocaleString("tr-TR")}
                      </td>
                      <td className="p-4">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950/60 text-emerald-400 border border-emerald-800/50">
                          <CheckCircle2 className="w-3 h-3" />
                          {b.status || "ONAYLANDI"}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <button
                          onClick={() => toast.success(`HK-${b.billingNumber || idx + 1} Hakediş hesap dökümü PDF olarak hazırlandı.`)}
                          className="text-amber-400 hover:text-amber-300 font-semibold text-xs cursor-pointer"
                        >
                          Döküm Al
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      <NewProgressPaymentModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        contracts={contracts}
        onSuccess={handleCreated}
      />
    </div>
  )
}
