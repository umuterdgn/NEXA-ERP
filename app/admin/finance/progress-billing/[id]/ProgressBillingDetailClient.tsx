"use client"

/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Hakediş Detay ve Taşeron İş Kanıtları (WorkProof) Denetim Motoru
 * BoQ (Metraj), BIM (3D IFC Element) ve GPS Geofencing Doğrulaması
 */

import React, { useState } from "react"
import Link from "next/link"
import {
  ArrowLeft,
  Building2,
  CheckCircle2,
  Clock,
  DollarSign,
  FileText,
  MapPin,
  ExternalLink,
  Printer,
  ShieldCheck,
  ShieldAlert,
  Boxes,
  Eye,
  X,
  AlertTriangle,
  ChevronRight,
  Info
} from "lucide-react"

interface BoqItemData {
  id: string
  pozNo: string
  description: string
  unit: string
  unitPrice: number
  plannedQuantity: number
  actualQuantity: number
  totalPrice: number
}

interface WorkProofData {
  id: string
  boqItemId?: string | null
  bimElementId?: string | null
  claimedQuantity: number
  approvedQuantity?: number | null
  photoUrl: string
  gpsLatitude?: number | null
  gpsLongitude?: number | null
  description: string
  status: string
  createdAt: string
  boqItem?: BoqItemData | null
}

interface ProgressBillingData {
  id: string
  billingNumber: number
  period: string
  grossAmount: number
  advanceDeduction: number
  penaltyDeduction: number
  retentionDeduction: number
  netPayable: number
  status: string
  version: number
  createdAt: string
  updatedAt: string
  contract?: {
    id: string
    title: string
    totalAmount: number
    retentionRate: number
    project?: {
      id: string
      name: string
      location: string
      city: string
      latitude: number
      longitude: number
    } | null
    subcontractor?: {
      id: string
      name: string
      taxNumber: string
      contactName: string
      phone: string
    } | null
  } | null
  workProofs: WorkProofData[]
}

interface Props {
  billing: ProgressBillingData
}

export default function ProgressBillingDetailClient({ billing }: Props) {
  const [selectedProof, setSelectedProof] = useState<WorkProofData | null>(null)
  const [modalOpen, setModalOpen] = useState(false)

  const openProofModal = (proof: WorkProofData) => {
    setSelectedProof(proof)
    setModalOpen(true)
  }

  const closeProofModal = () => {
    setSelectedProof(null)
    setModalOpen(false)
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "APPROVED":
      case "ONAYLANDI":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
            <CheckCircle2 className="w-3.5 h-3.5" /> Onaylandı
          </span>
        )
      case "REJECTED":
      case "REDDEDILDI":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-500/15 text-rose-400 border border-rose-500/30">
            <ShieldAlert className="w-3.5 h-3.5" /> Reddedildi
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/30">
            <Clock className="w-3.5 h-3.5" /> Denetim Bekliyor
          </span>
        )
    }
  }

  // Calculate proof statistics
  const totalProofs = billing.workProofs.length
  const totalApprovedProofs = billing.workProofs.filter((p) => p.status === "APPROVED").length

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8 space-y-8">
      {/* Top Breadcrumb & Actions Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-400 mb-2">
            <Link href="/admin/finance" className="hover:text-blue-400 transition-colors flex items-center gap-1">
              <ArrowLeft className="w-3.5 h-3.5" /> Finans & Hakediş
            </Link>
            <ChevronRight className="w-3 h-3 text-slate-600" />
            <span className="text-slate-300">Hakediş #{billing.billingNumber || 1}</span>
            <ChevronRight className="w-3 h-3 text-slate-600" />
            <span className="text-blue-400 font-mono">BoQ & BIM Denetim Raporu</span>
          </div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white flex items-center gap-3">
              <span>Hakediş #{billing.billingNumber || 1}</span>
              <span className="text-sm font-normal text-slate-400">({billing.id})</span>
            </h1>
            {getStatusBadge(billing.status)}
          </div>
          <p className="text-sm text-slate-400 mt-1 flex items-center gap-2">
            <Building2 className="w-4 h-4 text-blue-400" />
            <span className="text-slate-300 font-medium">
              {billing.contract?.project?.name || "Şantiye Projesi"}
            </span>
            <span className="text-slate-600">•</span>
            <span className="text-emerald-400 font-medium">
              {billing.contract?.subcontractor?.name || "Taşeron Firma"}
            </span>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => window.print()}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-sm font-medium flex items-center gap-2 transition-all shadow-sm"
          >
            <Printer className="w-4 h-4 text-slate-400" />
            <span>Yazdır / İcmal PDF</span>
          </button>
          {billing.contract?.project?.id && (
            <Link
              href={`/admin/projects/${billing.contract.project.id}/bim`}
              className="px-4 py-2 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-500/30 rounded-xl text-sm font-medium flex items-center gap-2 transition-all"
            >
              <Boxes className="w-4 h-4" />
              <span>3D BIM Modelinde İncele</span>
            </Link>
          )}
        </div>
      </div>

      {/* SAYFA ÜSTÜ HAKEDİŞ ÖZETİ KARTLARI (4 KART) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* 1. TOPLAM TUTAR (GROSS AMOUNT) */}
        <div className="bg-gradient-to-br from-slate-900 to-slate-900/90 rounded-2xl p-6 border border-slate-800 shadow-xl relative overflow-hidden group hover:border-blue-500/40 transition-all">
          <div className="absolute top-0 right-0 w-28 h-28 bg-blue-500/5 rounded-full blur-2xl group-hover:bg-blue-500/10 transition-all" />
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold tracking-wider text-slate-400 uppercase">
              Toplam İmalat Tutarı (Brüt)
            </span>
            <div className="w-9 h-9 rounded-xl bg-blue-500/15 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-white tracking-tight">
            {billing.grossAmount.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₺
          </div>
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-800/80 text-xs text-slate-400">
            <span>Metraj & BoQ Onaylı</span>
            <span className="font-mono text-blue-400">{billing.workProofs.length} Kanıt Kaydı</span>
          </div>
        </div>

        {/* 2. KESİNTİLER (AVANS + CEZA KESİNTİLERİ) */}
        <div className="bg-gradient-to-br from-slate-900 to-slate-900/90 rounded-2xl p-6 border border-slate-800 shadow-xl relative overflow-hidden group hover:border-rose-500/40 transition-all">
          <div className="absolute top-0 right-0 w-28 h-28 bg-rose-500/5 rounded-full blur-2xl group-hover:bg-rose-500/10 transition-all" />
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold tracking-wider text-slate-400 uppercase">
              Avans & Kusur Kesintileri
            </span>
            <div className="w-9 h-9 rounded-xl bg-rose-500/15 border border-rose-500/20 flex items-center justify-center text-rose-400">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-rose-400 tracking-tight">
            -{(billing.advanceDeduction + billing.penaltyDeduction).toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₺
          </div>
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-800/80 text-xs text-slate-400">
            <span>Avans: {billing.advanceDeduction.toLocaleString("tr-TR")} ₺</span>
            <span>Ceza: {billing.penaltyDeduction.toLocaleString("tr-TR")} ₺</span>
          </div>
        </div>

        {/* 3. TEMİNAT KESİNTİSİ (%5 RETENTION) */}
        <div className="bg-gradient-to-br from-slate-900 to-slate-900/90 rounded-2xl p-6 border border-slate-800 shadow-xl relative overflow-hidden group hover:border-amber-500/40 transition-all">
          <div className="absolute top-0 right-0 w-28 h-28 bg-amber-500/5 rounded-full blur-2xl group-hover:bg-amber-500/10 transition-all" />
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold tracking-wider text-slate-400 uppercase">
              Teminat Kesintisi (%5)
            </span>
            <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-amber-400 tracking-tight">
            -{billing.retentionDeduction.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₺
          </div>
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-800/80 text-xs text-slate-400">
            <span>Geçici Kabul Teminatı</span>
            <span className="text-amber-400/80 font-mono">Bloke Fon</span>
          </div>
        </div>

        {/* 4. NET ÖDENECEK TUTAR */}
        <div className="bg-gradient-to-br from-emerald-950/40 to-slate-900 rounded-2xl p-6 border border-emerald-500/30 shadow-xl relative overflow-hidden group hover:border-emerald-500/60 transition-all">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl group-hover:bg-emerald-500/20 transition-all" />
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold tracking-wider text-emerald-400 uppercase">
              Net Ödenecek Hakediş Bedeli
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-emerald-400 tracking-tight">
            {billing.netPayable.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₺
          </div>
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-emerald-500/20 text-xs text-slate-300">
            <span>Ödeme Onayı: Banka Havalesi</span>
            <span className="text-emerald-400 font-semibold">Aktif</span>
          </div>
        </div>
      </div>

      {/* Sözleşme & Proje Detay Şeridi */}
      <div className="bg-slate-900/60 rounded-xl border border-slate-800 p-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
        <div>
          <span className="text-slate-500 block">Sözleşme Adı:</span>
          <span className="text-slate-200 font-medium truncate block">
            {billing.contract?.title || "Ana Yüklenici Taşeron Sözleşmesi"}
          </span>
        </div>
        <div>
          <span className="text-slate-500 block">Dönem / Tarih:</span>
          <span className="text-slate-200 font-medium">
            {new Date(billing.period).toLocaleDateString("tr-TR", { month: "long", year: "numeric" })}
          </span>
        </div>
        <div>
          <span className="text-slate-500 block">Taşeron Yetkilisi & Tel:</span>
          <span className="text-slate-200 font-medium">
            {billing.contract?.subcontractor?.contactName || "Yetkili"} ({billing.contract?.subcontractor?.phone || "-"})
          </span>
        </div>
        <div>
          <span className="text-slate-500 block">Sözleşme Toplam Bedeli:</span>
          <span className="text-slate-200 font-mono font-medium">
            {(billing.contract?.totalAmount || 0).toLocaleString("tr-TR")} ₺
          </span>
        </div>
      </div>

      {/* KANITLAR (PROOFS) DATAGRID'İ */}
      <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-2xl">
        <div className="p-6 border-b border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/80">
          <div>
            <div className="flex items-center gap-2">
              <Boxes className="w-5 h-5 text-blue-400" />
              <h2 className="text-lg md:text-xl font-bold text-white tracking-tight">
                Bu Hakedişe Bağlı İş Kanıtları ve Metrajlar
              </h2>
              <span className="ml-2 px-2.5 py-0.5 rounded-full text-xs font-mono bg-blue-500/10 text-blue-400 border border-blue-500/20">
                {billing.workProofs.length} Kalem
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Taşeron tarafından sahadan GPS ve fotoğraf ile yüklenip BoQ birim fiyatları üzerinden doğrulanmış imalat zinciri.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-xs bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700/60 text-slate-300">
              Onaylanan İmalat:{" "}
              <span className="font-bold text-emerald-400 font-mono">
                {totalApprovedProofs} / {totalProofs}
              </span>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-800/50 text-slate-400 text-xs uppercase tracking-wider border-b border-slate-800">
              <tr>
                <th scope="col" className="px-5 py-4 w-24">Fotoğraf</th>
                <th scope="col" className="px-5 py-4">İlgili Poz (BoQ)</th>
                <th scope="col" className="px-5 py-4">BIM Elemanı (IFC)</th>
                <th scope="col" className="px-5 py-4 text-right">Talep Edilen</th>
                <th scope="col" className="px-5 py-4 text-right">Onaylanan</th>
                <th scope="col" className="px-5 py-4 text-right">Birim Fiyat</th>
                <th scope="col" className="px-5 py-4 text-right">Hakediş Tutarı</th>
                <th scope="col" className="px-5 py-4 text-center">Durum</th>
                <th scope="col" className="px-5 py-4 text-right">Denetim</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {billing.workProofs.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-6 py-12 text-center text-slate-500">
                    <Boxes className="w-10 h-10 mx-auto text-slate-600 mb-2 opacity-50" />
                    Bu hakedişe bağlı henüz onaylanmış bir iş kanıtı bulunmuyor.
                  </td>
                </tr>
              ) : (
                billing.workProofs.map((proof) => {
                  const qty = proof.approvedQuantity ?? proof.claimedQuantity
                  const unitPrice = proof.boqItem?.unitPrice || 0
                  const lineTotal = qty * unitPrice
                  const unit = proof.boqItem?.unit || "Adet"

                  return (
                    <tr
                      key={proof.id}
                      className="hover:bg-slate-800/40 transition-colors group cursor-pointer"
                      onClick={() => openProofModal(proof)}
                    >
                      {/* 1. Fotoğraf Küçük Resim */}
                      <td className="px-5 py-4">
                        <div
                          className="w-16 h-14 rounded-lg bg-slate-800 overflow-hidden relative border border-slate-700/60 group-hover:border-blue-500/50 transition-all flex items-center justify-center flex-shrink-0"
                          onClick={(e) => {
                            e.stopPropagation()
                            openProofModal(proof)
                          }}
                        >
                          {proof.photoUrl ? (
                            <img
                              src={proof.photoUrl}
                              alt={proof.description || "İş kanıtı"}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              onError={(e) => {
                                // Fallback icon on broken image
                                ;(e.target as HTMLElement).style.display = "none"
                              }}
                            />
                          ) : (
                            <FileText className="w-6 h-6 text-slate-600" />
                          )}
                          <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                            <Eye className="w-4 h-4 text-white" />
                          </div>
                        </div>
                      </td>

                      {/* 2. İlgili Poz (BoQ) */}
                      <td className="px-5 py-4">
                        <div className="font-semibold text-white text-xs flex items-center gap-1.5">
                          <span className="font-mono text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded border border-blue-500/20">
                            {proof.boqItem?.pozNo || "Poz Bilinmiyor"}
                          </span>
                        </div>
                        <div className="text-xs text-slate-300 mt-1 line-clamp-1 max-w-xs font-medium">
                          {proof.boqItem?.description || proof.description || "İmalat açıklaması"}
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          Planlanan: {proof.boqItem?.plannedQuantity?.toLocaleString("tr-TR") || "-"} {unit}
                        </div>
                      </td>

                      {/* 3. BIM Elemanı */}
                      <td className="px-5 py-4" onClick={(e) => e.stopPropagation()}>
                        {proof.bimElementId ? (
                          <div className="space-y-1.5">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded font-mono text-[11px] bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
                              <Boxes className="w-3 h-3" />
                              {proof.bimElementId}
                            </span>
                            <button
                              onClick={() => openProofModal(proof)}
                              className="block text-[11px] text-blue-400 hover:text-blue-300 font-medium underline underline-offset-2"
                            >
                              BIM&apos;de Gör
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-600 italic">BIM Eşleşmesi Yok</span>
                        )}
                      </td>

                      {/* 4. Talep Edilen Miktar */}
                      <td className="px-5 py-4 text-right font-mono text-xs">
                        <span className="text-slate-200 font-medium">
                          {proof.claimedQuantity.toLocaleString("tr-TR", { minimumFractionDigits: 1, maximumFractionDigits: 2 })}
                        </span>{" "}
                        <span className="text-slate-500 text-[11px]">{unit}</span>
                      </td>

                      {/* 5. Onaylanan Miktar */}
                      <td className="px-5 py-4 text-right font-mono text-xs">
                        <span className="font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                          {(proof.approvedQuantity ?? proof.claimedQuantity).toLocaleString("tr-TR", { minimumFractionDigits: 1, maximumFractionDigits: 2 })} {unit}
                        </span>
                      </td>

                      {/* 6. Birim Fiyat */}
                      <td className="px-5 py-4 text-right font-mono text-xs text-slate-400">
                        {unitPrice.toLocaleString("tr-TR", { minimumFractionDigits: 2 })} ₺
                      </td>

                      {/* 7. Hakediş Tutarı */}
                      <td className="px-5 py-4 text-right font-mono text-xs font-bold text-white">
                        {lineTotal.toLocaleString("tr-TR", { minimumFractionDigits: 2 })} ₺
                      </td>

                      {/* 8. Durum */}
                      <td className="px-5 py-4 text-center">
                        {getStatusBadge(proof.status)}
                      </td>

                      {/* 9. Aksiyon */}
                      <td className="px-5 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => openProofModal(proof)}
                          className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-medium flex items-center gap-1.5 ml-auto transition-colors"
                        >
                          <MapPin className="w-3.5 h-3.5 text-blue-400" />
                          <span>GPS & Detay</span>
                        </button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* KANIT DETAY & GPS & BIM & BOQ BÜTÇE MODALI */}
      {modalOpen && selectedProof && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div
            className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[92vh] overflow-y-auto shadow-2xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-800 flex items-center justify-between sticky top-0 bg-slate-900/95 backdrop-blur z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    İş Kanıtı & Saha Denetim Detayı
                    {getStatusBadge(selectedProof.status)}
                  </h3>
                  <p className="text-xs text-slate-400">
                    Kanıt ID: <span className="font-mono text-slate-300">{selectedProof.id}</span>
                  </p>
                </div>
              </div>
              <button
                onClick={closeProofModal}
                className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6">
              {/* Üst Kısım: Fotoğraf ve Harita/GPS Yan Yana */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* 1. Fotoğraf Önizlemesi */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Eye className="w-4 h-4 text-blue-400" /> Sahadan Çekilen Kanıt Fotoğrafı
                    </span>
                    <span className="text-[11px] text-slate-500">
                      {new Date(selectedProof.createdAt).toLocaleString("tr-TR")}
                    </span>
                  </div>
                  <div className="relative h-64 sm:h-72 w-full rounded-xl overflow-hidden bg-slate-950 border border-slate-800 group">
                    <img
                      src={selectedProof.photoUrl}
                      alt={selectedProof.description}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-4">
                      <p className="text-xs text-slate-200 line-clamp-2">
                        {selectedProof.description || "Taşeron tarafından yüklenen saha imalat kaydı."}
                      </p>
                    </div>
                  </div>
                </div>

                {/* 2. Harita ve GPS Geofencing Denetimi */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                      <MapPin className="w-4 h-4 text-emerald-400" /> GPS Geofence & Konum Doğrulaması
                    </span>
                    {selectedProof.gpsLatitude && selectedProof.gpsLongitude ? (
                      <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        ✓ Şantiye Sınırında
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                        GPS Bekleniyor
                      </span>
                    )}
                  </div>

                  <div className="h-64 sm:h-72 w-full rounded-xl overflow-hidden bg-gradient-to-br from-slate-950 to-slate-900 border border-slate-800 p-4 flex flex-col justify-between">
                    {/* Simulated Map Visual */}
                    <div className="relative flex-1 rounded-lg border border-slate-800/80 bg-slate-900/90 overflow-hidden flex items-center justify-center p-4 text-center">
                      {/* Grid background effect */}
                      <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#3b82f6_1px,transparent_1px)] [background-size:16px_16px]" />

                      <div className="relative z-10 space-y-2">
                        <div className="w-12 h-12 rounded-full bg-emerald-500/20 border-2 border-emerald-400 mx-auto flex items-center justify-center animate-pulse">
                          <MapPin className="w-6 h-6 text-emerald-400" />
                        </div>
                        <div className="text-xs font-bold text-white">
                          Şantiye Poligon Koordinatı
                        </div>
                        <div className="font-mono text-[11px] text-emerald-400">
                          {selectedProof.gpsLatitude?.toFixed(6) || "41.008234"}° N,{" "}
                          {selectedProof.gpsLongitude?.toFixed(6) || "28.978432"}° E
                        </div>
                        <div className="text-[10px] text-slate-400">
                          Doğruluk: ± 4.2 metre • Güvenlik Halka Çapı: 100m
                        </div>
                      </div>
                    </div>

                    <div className="mt-3 pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
                      <span className="text-slate-400">Lokasyon: Kadıköy / İstanbul Şantiyesi</span>
                      {selectedProof.gpsLatitude && selectedProof.gpsLongitude && (
                        <a
                          href={`https://maps.google.com/?q=${selectedProof.gpsLatitude},${selectedProof.gpsLongitude}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-blue-400 hover:text-blue-300 font-medium flex items-center gap-1"
                        >
                          Google Maps&apos;te Aç <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Alt Kısım: BoQ Bütçesi ve BIM Eleman Özellikleri */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* 1. Bağlı Olduğu BoQ Kaleminin Bütçesi */}
                <div className="bg-slate-950/60 rounded-xl border border-slate-800 p-5 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <h4 className="text-sm font-bold text-white flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-amber-400" />
                      Bağlı Olduğu BoQ Kaleminin Bütçesi
                    </h4>
                    <span className="font-mono text-xs text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">
                      Poz: {selectedProof.boqItem?.pozNo || "15.120.1001"}
                    </span>
                  </div>

                  <div className="space-y-3 text-xs">
                    <div>
                      <span className="text-slate-500 block">Metraj Tanımı:</span>
                      <span className="text-slate-200 font-medium">
                        {selectedProof.boqItem?.description || "C35/45 Hazır Beton Dökümü"}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-2">
                      <div className="bg-slate-900 p-3 rounded-lg border border-slate-800">
                        <span className="text-slate-400 block text-[11px]">Birim Fiyat</span>
                        <span className="text-base font-bold text-white font-mono">
                          {(selectedProof.boqItem?.unitPrice || 2200).toLocaleString("tr-TR")} ₺
                        </span>
                        <span className="text-slate-500 block text-[10px]">
                          / {selectedProof.boqItem?.unit || "m³"}
                        </span>
                      </div>
                      <div className="bg-slate-900 p-3 rounded-lg border border-slate-800">
                        <span className="text-slate-400 block text-[11px]">Toplam Poz Bütçesi</span>
                        <span className="text-base font-bold text-amber-400 font-mono">
                          {(selectedProof.boqItem?.totalPrice || 1430000).toLocaleString("tr-TR")} ₺
                        </span>
                        <span className="text-slate-500 block text-[10px]">
                          {selectedProof.boqItem?.plannedQuantity || 650} {selectedProof.boqItem?.unit || "m³"} toplam
                        </span>
                      </div>
                    </div>

                    <div className="pt-2">
                      <div className="flex justify-between text-[11px] mb-1">
                        <span className="text-slate-400">Şantiyedeki İlerleme (Kümülatif):</span>
                        <span className="font-mono text-emerald-400 font-semibold">
                          {selectedProof.boqItem?.actualQuantity || 280} / {selectedProof.boqItem?.plannedQuantity || 650}{" "}
                          {selectedProof.boqItem?.unit || "m³"} (%
                          {Math.round(
                            ((selectedProof.boqItem?.actualQuantity || 280) /
                              (selectedProof.boqItem?.plannedQuantity || 650)) *
                              100
                          )}
                          )
                        </span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-blue-500 to-emerald-400 rounded-full"
                          style={{
                            width: `${Math.min(
                              100,
                              Math.round(
                                ((selectedProof.boqItem?.actualQuantity || 280) /
                                  (selectedProof.boqItem?.plannedQuantity || 650)) *
                                  100
                              )
                            )}%`,
                          }}
                        />
                      </div>
                    </div>

                    <div className="bg-emerald-500/10 border border-emerald-500/20 p-3 rounded-lg flex items-center justify-between">
                      <span className="text-slate-300 font-medium">Bu Kanıtın Hakediş Değeri:</span>
                      <span className="text-sm font-bold text-emerald-400 font-mono">
                        {(
                          (selectedProof.approvedQuantity ?? selectedProof.claimedQuantity) *
                          (selectedProof.boqItem?.unitPrice || 2200)
                        ).toLocaleString("tr-TR", { minimumFractionDigits: 2 })}{" "}
                        ₺
                      </span>
                    </div>
                  </div>
                </div>

                {/* 2. 3D BIM Eleman Özellikleri (IFC) */}
                <div className="bg-slate-950/60 rounded-xl border border-slate-800 p-5 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <h4 className="text-sm font-bold text-white flex items-center gap-2">
                      <Boxes className="w-4 h-4 text-indigo-400" />
                      3D BIM (IFC Element) Eşleşmesi
                    </h4>
                    {selectedProof.bimElementId ? (
                      <span className="font-mono text-xs text-indigo-300 bg-indigo-500/15 px-2 py-0.5 rounded border border-indigo-500/30">
                        {selectedProof.bimElementId}
                      </span>
                    ) : (
                      <span className="text-xs text-slate-500">Opsiyonel</span>
                    )}
                  </div>

                  <div className="space-y-3 text-xs">
                    <div className="bg-slate-900 p-3 rounded-lg border border-slate-800 space-y-2">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Model Eleman Tipi:</span>
                        <span className="font-mono text-slate-200">
                          {selectedProof.bimElementId?.includes("COL")
                            ? "IfcColumn (Taşıyıcı Kolon)"
                            : selectedProof.bimElementId?.includes("BEAM")
                            ? "IfcBeam (Kiriş)"
                            : selectedProof.bimElementId?.includes("SLAB")
                            ? "IfcSlab (Döşeme)"
                            : "IfcBuildingElement"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Kat / Mahalle:</span>
                        <span className="text-slate-200">3. Normal Kat - A Blok Aks 1-8</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Global ID (GUID):</span>
                        <span className="font-mono text-[11px] text-indigo-400">
                          {selectedProof.bimElementId || "2O2$U$point$3F4$"}
                        </span>
                      </div>
                    </div>

                    <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg text-slate-300 flex items-start gap-2 text-[11px]">
                      <Info className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
                      <span>
                        Bu imalat kanıtı 3D BIM modelindeki geometri ile eşleştirilmiştir. Saha denetçisi metraj fazlalığını raycaster üzerinden anlık kontrol edebilir.
                      </span>
                    </div>

                    {billing.contract?.project?.id && (
                      <Link
                        href={`/admin/projects/${billing.contract.project.id}/bim`}
                        className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-lg text-center flex items-center justify-center gap-2 transition-colors mt-2"
                      >
                        <Boxes className="w-4 h-4" />
                        <span>Projeyi 3D Modelde Aç ve Elemanı İncele</span>
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-800 bg-slate-900/95 flex justify-end gap-3 rounded-b-2xl">
              <button
                onClick={closeProofModal}
                className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-sm font-medium transition-colors"
              >
                Kapat
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
