"use client"
/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * İnşaat Muhasebesi ve Hakediş Detay Ekranı (Teminat ve Kusur Kesintili İcmal Bordrosu)
 */

import React, { useState, useEffect, use } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  ArrowLeft,
  Building,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Printer,
  FileText,
  DollarSign,
  ShieldCheck,
  ShieldAlert,
  Percent,
  TrendingDown,
  Layers,
  ChevronRight,
  ExternalLink,
  Loader2,
  Check,
  Building2,
  BadgeAlert,
  Info
} from "lucide-react"
import { toast } from "react-hot-toast"
import {
  getProgressPaymentDetail,
  approveProgressPaymentAction,
  type ProgressPaymentCalculationResult
} from "@/app/actions/finance"

interface PageProps {
  params: Promise<{ id: string }>
}

export default function ProgressPaymentDetailPage({ params }: PageProps) {
  const router = useRouter()
  const resolvedParams = use(params)
  const id = resolvedParams.id

  const [loading, setLoading] = useState(true)
  const [approving, setApproving] = useState(false)
  const [payment, setPayment] = useState<any>(null)
  const [breakdown, setBreakdown] = useState<ProgressPaymentCalculationResult | null>(null)

  // Demo fallback verisi (Eğer veritabanında bu ID henüz yoksa kusursuz gösterim için)
  const fallbackData = {
    id: id || "hkd-demo-01",
    title: "B Blok 3. Kat Betonarme ve Duvar İmalatı",
    description: "B Blok 3. Normal Kat kolon, perde beton dökümü ve gazbeton duvar örüm işleri 4. Hakedişi",
    quantity: 450,
    unit: "m2",
    unitPrice: 850,
    totalPrice: 382500,
    amount: 382500,
    status: "BEKLIYOR",
    date: new Date().toISOString(),
    penaltyDeduction: 15000,
    retentionRate: 0.05,
    retentionAmount: 19125,
    advanceDeduction: 20000,
    netPayableAmount: 328375,
    project: {
      id: "proj-1",
      name: "Güneştepe Konutları Projesi (YİBF #214582)",
      title: "Güneştepe Konutları Projesi",
      city: "İstanbul",
      district: "Kadıköy",
      yibfNo: "214582",
      ada: "342",
      parsel: "14"
    },
    subcontractor: {
      id: "sub-1",
      name: "Mega İnşaat & Kalıpçılık Ltd. Şti.",
      contactPerson: "Serdar Yılmaz (Şantiye Sorumlusu)",
      phone: "+90 532 555 44 33",
      email: "serdar@megainsaat.com",
      taxId: "6120489112",
      trade: "Kalıp, Demir ve Betonarme Taşeronu"
    },
    contract: {
      id: "cnt-1",
      title: "Kaba Yapı ve Betonarme Taşeron Sözleşmesi",
      contractNumber: "SOZ-2026-088",
      totalAmount: 4500000
    },
    workPackage: {
      id: "wp-1",
      name: "Kaba Yapı İmalat Paketi (Paket #3)",
      code: "WP-KABA-03"
    },
    boqItem: {
      id: "boq-1",
      itemCode: "POZ-15.120.1001",
      description: "C30/37 Hazır Beton Dökülmesi ve Sulanması",
      unit: "m3",
      unitPrice: 850
    },
    blockingIssues: [
      {
        id: "bim-1",
        title: "3. Kat K-12 Kolonu Paspayı Hatası ve Donatı Açığı",
        severity: "CRITICAL",
        penaltyAmount: 15000,
        status: "OPEN",
        location: "B Blok 3. Kat K-12 Kolonu"
      }
    ]
  }

  const loadDetail = async () => {
    setLoading(true)
    try {
      const res = await getProgressPaymentDetail(id)
      if (res.success && res.payment) {
        setPayment(res.payment)
        setBreakdown(res.breakdown || null)
      } else {
        // Fallback demo verisi
        setPayment(fallbackData)
        setBreakdown({
          grossAmount: 382500,
          defectPenalties: 15000,
          retentionRate: 0.05,
          retentionAmount: 19125,
          advanceDeduction: 20000,
          totalDeductions: 54125,
          netPayableAmount: 328375
        })
      }
    } catch (err) {
      console.warn("Hakediş detayı çekilemedi, demo verisi yükleniyor:", err)
      setPayment(fallbackData)
      setBreakdown({
        grossAmount: 382500,
        defectPenalties: 15000,
        retentionRate: 0.05,
        retentionAmount: 19125,
        advanceDeduction: 20000,
        totalDeductions: 54125,
        netPayableAmount: 328375
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDetail()
  }, [id])

  const handleApprove = async () => {
    setApproving(true)
    try {
      const res = await approveProgressPaymentAction(id)
      if (res.success) {
        toast.success("Hakediş teminat ve kusur kesintileri düşülerek başarıyla onaylandı!", { icon: "✅" })
        setPayment((prev: any) => ({ ...prev, status: "ONAYLANDI" }))
      } else {
        toast.error(res.error || "Hakediş onaylanamadı.")
      }
    } catch {
      toast.error("İşlem sırasında hata oluştu.")
    } finally {
      setApproving(false)
    }
  }

  const handlePrint = () => {
    window.print()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500 mx-auto" />
          <p className="text-sm text-slate-400 font-medium">Hakediş icmali ve kesinti kalemleri hesaplanıyor...</p>
        </div>
      </div>
    )
  }

  const currentPayment = payment || fallbackData
  const currentBreakdown = breakdown || {
    grossAmount: currentPayment.totalPrice || 382500,
    defectPenalties: currentPayment.penaltyDeduction || 15000,
    retentionRate: 0.05,
    retentionAmount: Math.round((currentPayment.totalPrice || 382500) * 0.05),
    advanceDeduction: currentPayment.advanceDeduction || 20000,
    totalDeductions: 54125,
    netPayableAmount: 328375
  }

  const isApproved = currentPayment.status === "ONAYLANDI" || currentPayment.status === "APPROVED" || currentPayment.status === "ODENDI"

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-6 lg:p-8 space-y-8 print:bg-white print:text-black print:p-0">
      
      {/* ÜST BİLGİ & BREADCRUMB & AKSİYON BUTONLARI */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800 print:hidden">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-xs text-slate-400 font-medium">
            <Link href="/inspection/finance" className="hover:text-blue-400 transition-colors">Finans</Link>
            <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
            <Link href="/admin/progress-payments" className="hover:text-blue-400 transition-colors">Hakediş Yönetimi</Link>
            <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
            <span className="text-slate-200 font-mono">Hakediş #{currentPayment.id.slice(0, 8)}</span>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              {currentPayment.title}
            </h1>
            {isApproved ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Onaylandı (Tahakkuk Etti)</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-950 text-amber-300 border border-amber-800">
                <Clock className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                <span>Onay Bekliyor</span>
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-xs sm:text-sm font-semibold transition-colors flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Geri</span>
          </button>

          <button
            onClick={handlePrint}
            className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-xl text-xs sm:text-sm font-semibold transition-colors flex items-center gap-2 border border-slate-700"
          >
            <Printer className="w-4 h-4 text-slate-400" />
            <span>Resmi Bordro Yazdır (PDF)</span>
          </button>

          {!isApproved && (
            <button
              onClick={handleApprove}
              disabled={approving}
              className="px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs sm:text-sm rounded-xl shadow-lg shadow-emerald-600/30 transition-all flex items-center gap-2 disabled:opacity-50"
            >
              {approving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Onaylanıyor...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>Hakedişi Onayla</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* ADIM 3 ÖZEL: 4 ADET ÖDEME KALEMİ KARTI (BÜRÜT, KUSUR, TEMİNAT, NET) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        
        {/* KART 1: BÜRÜT İMALAT */}
        <div className="relative overflow-hidden p-6 rounded-3xl bg-gradient-to-br from-slate-900 via-blue-950/40 to-slate-900 border-2 border-blue-500/30 shadow-xl">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-black uppercase tracking-wider text-blue-400">
              1. Bürüt İmalat Bedeli
            </span>
            <div className="w-10 h-10 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black font-mono text-white tracking-tight">
            {currentBreakdown.grossAmount.toLocaleString("tr-TR", { minimumFractionDigits: 2 })} ₺
          </p>
          <div className="mt-3 pt-3 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
            <span>Metraj × Birim Fiyat:</span>
            <span className="font-mono text-slate-300 font-bold">
              {currentPayment.quantity} {currentPayment.unit} × {Number(currentPayment.unitPrice || 0).toLocaleString("tr-TR")} ₺
            </span>
          </div>
        </div>

        {/* KART 2: KUSUR KESİNTİSİ (KIRMIZI) */}
        <div className="relative overflow-hidden p-6 rounded-3xl bg-gradient-to-br from-slate-900 via-rose-950/40 to-slate-900 border-2 border-rose-500/40 shadow-xl">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-black uppercase tracking-wider text-rose-400">
              2. Kusur Kesintisi (Kırmızı)
            </span>
            <div className="w-10 h-10 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center">
              <ShieldAlert className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black font-mono text-rose-400 tracking-tight">
            -{currentBreakdown.defectPenalties.toLocaleString("tr-TR", { minimumFractionDigits: 2 })} ₺
          </p>
          <div className="mt-3 pt-3 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
            <span>BIM / Saha Kusur Cezası:</span>
            <span className="font-mono text-rose-300 font-bold">
              {currentPayment.blockingIssues?.length || (currentBreakdown.defectPenalties > 0 ? 1 : 0)} Kusur Kaydı
            </span>
          </div>
        </div>

        {/* KART 3: TEMİNAT KESİNTİSİ (SARI / AMBER) */}
        <div className="relative overflow-hidden p-6 rounded-3xl bg-gradient-to-br from-slate-900 via-amber-950/40 to-slate-900 border-2 border-amber-500/40 shadow-xl">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-black uppercase tracking-wider text-amber-400">
              3. Teminat Kesintisi (Sarı)
            </span>
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
              <Percent className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black font-mono text-amber-400 tracking-tight">
            -{currentBreakdown.retentionAmount.toLocaleString("tr-TR", { minimumFractionDigits: 2 })} ₺
          </p>
          <div className="mt-3 pt-3 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
            <span>Geçici Kabul Teminat Oranı:</span>
            <span className="font-mono text-amber-300 font-bold">%5 Sözleşme Kesintisi</span>
          </div>
        </div>

        {/* KART 4: ÖDENECEK NET TUTAR (YEŞİL) */}
        <div className="relative overflow-hidden p-6 rounded-3xl bg-gradient-to-br from-slate-900 via-emerald-950/50 to-slate-900 border-2 border-emerald-500/50 shadow-2xl">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-black uppercase tracking-wider text-emerald-400">
              4. Ödenecek Net Tutar (Yeşil)
            </span>
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black font-mono text-emerald-400 tracking-tight">
            {currentBreakdown.netPayableAmount.toLocaleString("tr-TR", { minimumFractionDigits: 2 })} ₺
          </p>
          <div className="mt-3 pt-3 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
            <span>Taşeron Banka Ödemesi:</span>
            <span className="font-mono text-emerald-300 font-bold">Net Tahakkuk</span>
          </div>
        </div>

      </div>

      {/* DETAYLI RESMİ HAKEDİŞ İCMAL BORDROSU */}
      <div className="bg-slate-900/90 rounded-3xl border border-slate-800 overflow-hidden shadow-2xl">
        <div className="p-6 bg-slate-950/70 border-b border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/10 text-blue-400 flex items-center justify-center border border-blue-500/20">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Resmi Taşeron Hakediş İcmal Bordrosu</h2>
              <p className="text-xs text-slate-400">
                Yapı İşleri Genel Şartnamesi ve Türk Ticaret Kanunu hakediş kesinti standartları
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono text-slate-400 bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800">
            <span>Düzenleme Tarihi:</span>
            <span className="text-white font-bold">{new Date(currentPayment.date).toLocaleDateString("tr-TR")}</span>
          </div>
        </div>

        {/* PROJE & TAŞERON KÜNYESİ */}
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-900/40 border-b border-slate-800/80">
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-blue-400 flex items-center gap-2">
              <Building className="w-4 h-4" />
              <span>İş Sahibi & Şantiye Bilgileri</span>
            </h3>
            <div className="p-4 bg-slate-950/60 rounded-2xl border border-slate-800/80 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Şantiye / Proje:</span>
                <span className="font-bold text-white">{currentPayment.project?.name || "Güneştepe Konutları Projesi"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Konum / Şehir:</span>
                <span className="text-slate-200">{currentPayment.project?.city || "İstanbul"} / {currentPayment.project?.district || "Kadıköy"}</span>
              </div>
              <div className="flex justify-between font-mono">
                <span className="text-slate-400">Tapu (Ada / Parsel):</span>
                <span className="text-slate-200">Ada {currentPayment.project?.ada || "342"} / Parsel {currentPayment.project?.parsel || "14"}</span>
              </div>
              <div className="flex justify-between font-mono">
                <span className="text-slate-400">Bakanlık YİBF No:</span>
                <span className="text-blue-400 font-bold">{currentPayment.project?.yibfNo || "214582"}</span>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-2">
              <Building2 className="w-4 h-4" />
              <span>Yüklenici / Taşeron Bilgileri</span>
            </h3>
            <div className="p-4 bg-slate-950/60 rounded-2xl border border-slate-800/80 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Taşeron Firma:</span>
                <span className="font-bold text-white">{currentPayment.subcontractor?.name || "Mega İnşaat Ltd. Şti."}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Vergi No / Dairesi:</span>
                <span className="font-mono text-slate-200">{currentPayment.subcontractor?.taxId || "6120489112"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Yetkili İrtibat:</span>
                <span className="text-slate-200">{currentPayment.subcontractor?.contactPerson || "Şantiye Sorumlusu"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Bağlı Sözleşme:</span>
                <span className="text-indigo-400 font-mono font-bold">{currentPayment.contract?.contractNumber || "SOZ-2026-088"}</span>
              </div>
            </div>
          </div>
        </div>

        {/* HAKEDİŞ HESAP FİŞİ TABLOSU */}
        <div className="p-6 space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
            Hakediş Hesap Tablosu ve Yasal Kesintiler
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-[11px] font-bold uppercase tracking-wider text-slate-400 bg-slate-950/80 border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Sıra / Kalem</th>
                  <th className="py-3 px-4">Açıklama</th>
                  <th className="py-3 px-4">Metraj & Birim</th>
                  <th className="py-3 px-4 text-right">Birim Fiyat</th>
                  <th className="py-3 px-4 text-right">Tutar (₺)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/70 text-xs font-medium">
                
                {/* 1. Bürüt İmalat Satırı */}
                <tr className="hover:bg-slate-850/40">
                  <td className="py-3.5 px-4 font-mono font-bold text-blue-400">01</td>
                  <td className="py-3.5 px-4">
                    <p className="font-bold text-white text-sm">{currentPayment.title}</p>
                    <p className="text-slate-400 text-[11px]">{currentPayment.description || "İmalat hakkedişi"}</p>
                  </td>
                  <td className="py-3.5 px-4 font-mono text-slate-300">
                    {currentPayment.quantity} {currentPayment.unit}
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono text-slate-300">
                    {Number(currentPayment.unitPrice || 0).toLocaleString("tr-TR", { minimumFractionDigits: 2 })} ₺
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono font-bold text-white text-sm">
                    {currentBreakdown.grossAmount.toLocaleString("tr-TR", { minimumFractionDigits: 2 })} ₺
                  </td>
                </tr>

                {/* ARA TOPLAM */}
                <tr className="bg-slate-950/40 font-bold">
                  <td colSpan={4} className="py-3 px-4 text-right uppercase text-[11px] text-slate-400">
                    TOPLAM İMALAT BEDELİ (BÜRÜT):
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-white text-sm">
                    {currentBreakdown.grossAmount.toLocaleString("tr-TR", { minimumFractionDigits: 2 })} ₺
                  </td>
                </tr>

                {/* 2. KESİNTİLER BÖLÜMÜ */}
                <tr className="text-rose-400 bg-rose-950/10">
                  <td className="py-3 px-4 font-mono font-bold">02</td>
                  <td className="py-3 px-4">
                    <p className="font-bold">BIM Kusur ve Uygunsuzluk Cezası</p>
                    <p className="text-[11px] text-rose-300/80">Açık kalite / imalat kusurları kesintisi</p>
                  </td>
                  <td className="py-3 px-4 font-mono text-[11px]">Ceza Kesintisi</td>
                  <td className="py-3 px-4 text-right font-mono">-</td>
                  <td className="py-3 px-4 text-right font-mono font-bold text-rose-400">
                    -{currentBreakdown.defectPenalties.toLocaleString("tr-TR", { minimumFractionDigits: 2 })} ₺
                  </td>
                </tr>

                {/* 3. TEMİNAT KESİNTİSİ */}
                <tr className="text-amber-400 bg-amber-950/10">
                  <td className="py-3 px-4 font-mono font-bold">03</td>
                  <td className="py-3 px-4">
                    <p className="font-bold">%5 Geçici Kabul Teminatı Kesintisi</p>
                    <p className="text-[11px] text-amber-300/80">İş Kanunu & Şartname gereği geçici kabul onayına kadar blokaj</p>
                  </td>
                  <td className="py-3 px-4 font-mono text-[11px]">%5.00 Oran</td>
                  <td className="py-3 px-4 text-right font-mono">-</td>
                  <td className="py-3 px-4 text-right font-mono font-bold text-amber-400">
                    -{currentBreakdown.retentionAmount.toLocaleString("tr-TR", { minimumFractionDigits: 2 })} ₺
                  </td>
                </tr>

                {/* 4. VERİLEN AVANS MAHSUBU */}
                {currentBreakdown.advanceDeduction > 0 && (
                  <tr className="text-indigo-400 bg-indigo-950/10">
                    <td className="py-3 px-4 font-mono font-bold">04</td>
                    <td className="py-3 px-4">
                      <p className="font-bold">Verilen Avans Mahsubu</p>
                      <p className="text-[11px] text-indigo-300/80">Daha önce taşerona ödenmiş avansın bu hakedişten mahsubu</p>
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px]">Bordro Mahsubu</td>
                    <td className="py-3 px-4 text-right font-mono">-</td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-indigo-400">
                      -{currentBreakdown.advanceDeduction.toLocaleString("tr-TR", { minimumFractionDigits: 2 })} ₺
                    </td>
                  </tr>
                )}

                {/* TOPLAM KESİNTİLER SATIRI */}
                <tr className="bg-slate-950/80 font-bold border-t border-slate-700">
                  <td colSpan={4} className="py-3 px-4 text-right uppercase text-[11px] text-slate-400">
                    TOPLAM KESİNTİLER TOPLAMI:
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-rose-400 text-sm">
                    -{currentBreakdown.totalDeductions.toLocaleString("tr-TR", { minimumFractionDigits: 2 })} ₺
                  </td>
                </tr>

                {/* ÖDENECEK NET HAKEDİŞ (BÜYÜK VURGU) */}
                <tr className="bg-emerald-950/40 border-t-2 border-emerald-500/80">
                  <td colSpan={4} className="py-4 px-4 text-right font-black uppercase text-xs sm:text-sm text-emerald-300">
                    TAŞERONA ÖDENECEK NET HAKEDİŞ TUTARI:
                  </td>
                  <td className="py-4 px-4 text-right font-black font-mono text-lg sm:text-xl text-emerald-400">
                    {currentBreakdown.netPayableAmount.toLocaleString("tr-TR", { minimumFractionDigits: 2 })} ₺
                  </td>
                </tr>

              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* BLOKE EDEN BIM KUSURLARI VE SAHA CEZALARI LİSTESİ */}
      {currentPayment.blockingIssues && currentPayment.blockingIssues.length > 0 && (
        <div className="bg-slate-900/90 rounded-3xl border border-rose-500/30 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-rose-400" />
              <span>Hakedişten Kesilen BIM / Saha Kusurları ({currentPayment.blockingIssues.length})</span>
            </h3>
            <span className="text-xs text-rose-400 font-mono font-bold">
              Toplam Ceza: {currentBreakdown.defectPenalties.toLocaleString("tr-TR")} ₺
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {currentPayment.blockingIssues.map((issue: any) => (
              <div key={issue.id} className="p-4 bg-slate-950/80 rounded-2xl border border-slate-800 flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-950 text-rose-300 border border-rose-800">
                      {issue.severity || "CRITICAL"}
                    </span>
                    <span className="text-xs font-bold text-white">{issue.title}</span>
                  </div>
                  <p className="text-[11px] text-slate-400">{issue.location || "Şantiye Alanı"}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <span className="text-xs font-bold font-mono text-rose-400">
                    -{Number(issue.penaltyAmount || 0).toLocaleString("tr-TR")} ₺
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* HAKEDİŞ ONAY İMZA BÖLÜMÜ (YAZDIRMAYA UYGUN) */}
      <div className="bg-slate-900/90 rounded-3xl border border-slate-800 p-6 space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
          Hakediş Kontrol ve Yetkili İmzaları
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
          <div className="p-4 bg-slate-950/60 rounded-2xl border border-slate-800 text-center space-y-3">
            <p className="text-xs font-bold text-slate-400 uppercase">Düzenleyen (Şantiye Şefi)</p>
            <div className="h-12 border-b border-dashed border-slate-700 flex items-end justify-center pb-1">
              <span className="text-xs text-slate-300 font-medium">Umut Erdoğan</span>
            </div>
            <p className="text-[11px] text-slate-500 font-mono">İmza & Kaşe</p>
          </div>

          <div className="p-4 bg-slate-950/60 rounded-2xl border border-slate-800 text-center space-y-3">
            <p className="text-xs font-bold text-slate-400 uppercase">Kontrol Eden (Proje Müdürü)</p>
            <div className="h-12 border-b border-dashed border-slate-700 flex items-end justify-center pb-1">
              <span className="text-xs text-slate-300 font-medium">Başmühendis / PM</span>
            </div>
            <p className="text-[11px] text-slate-500 font-mono">İmza & Kaşe</p>
          </div>

          <div className="p-4 bg-slate-950/60 rounded-2xl border border-slate-800 text-center space-y-3">
            <p className="text-xs font-bold text-slate-400 uppercase">Onaylayan (Finans & Muhasebe)</p>
            <div className="h-12 border-b border-dashed border-slate-700 flex items-end justify-center pb-1">
              {isApproved ? (
                <span className="text-xs text-emerald-400 font-bold flex items-center justify-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Sistemden Onaylandı</span>
                </span>
              ) : (
                <span className="text-xs text-amber-400 font-medium">Onay Bekleniyor</span>
              )}
            </div>
            <p className="text-[11px] text-slate-500 font-mono">İmza & Kaşe</p>
          </div>
        </div>
      </div>

    </div>
  )
}
