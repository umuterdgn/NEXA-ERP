"use client"

/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Şantiye Malzeme Kabul Terminali (Mobile QR & Barcode Material Receiving)
 * - Kocaman "📷 Kamerayı Aç ve İrsaliye/QR Okut" Butonu
 * - MobileQRScanner Entegrasyonu
 * - scanAndReceiveMaterial Server Action Tetikleyicisi
 * - Eşleşmeyen ürünler için otomatik manuel kayıt formu
 */

import React, { useState } from "react"
import MobileQRScanner from "@/components/logistics/MobileQRScanner"
import { scanAndReceiveMaterial, createManualInventoryItem } from "@/app/actions/inventory"
import {
  Camera,
  PackageCheck,
  CheckCircle2,
  AlertTriangle,
  Boxes,
  Truck,
  PlusCircle,
  Clock,
  ArrowRight,
  ShieldCheck,
  Scan,
  Sparkles,
  QrCode,
  Building2,
  RefreshCw,
  Loader2,
} from "lucide-react"
import { toast } from "react-hot-toast"

interface RecentReceivedItem {
  id: string
  materialName: string
  code: string
  quantity: number
  unit: string
  zone: string
  timestamp: string
  status: "MATCHED" | "MANUAL"
}

export default function MaterialReceivePage() {
  const [isScannerOpen, setIsScannerOpen] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [lastScannedCode, setLastScannedCode] = useState<string | null>(null)

  // Son Teslim Alınanlar Listesi
  const [recentItems, setRecentItems] = useState<RecentReceivedItem[]>([
    {
      id: "rec-1",
      materialName: "500 Torba Çimento (Portland)",
      code: "QR-CIM-500",
      quantity: 500,
      unit: "Torba",
      zone: "Ana Depo (MAIN_WAREHOUSE)",
      timestamp: "Bugün 10:45",
      status: "MATCHED",
    },
    {
      id: "rec-2",
      materialName: "B420C Nervürlü Donatı Çeliği Ø16",
      code: "QR-DEMIR-C30",
      quantity: 18,
      unit: "Ton",
      zone: "Demir Stok Sahası",
      timestamp: "Bugün 09:15",
      status: "MATCHED",
    },
    {
      id: "rec-3",
      materialName: "18mm Plywood Kalıp Paneli",
      code: "QR-KALIP-PLY",
      quantity: 250,
      unit: "m²",
      zone: "Kalıp Ambarı",
      timestamp: "Dün 16:30",
      status: "MATCHED",
    },
  ])

  // Eşleşmeyen Ürün İçin Manuel Kayıt Formu State'i
  const [showManualForm, setShowManualForm] = useState(false)
  const [manualForm, setManualForm] = useState({
    materialName: "",
    qrCode: "",
    quantity: 100,
    unit: "Adet",
    category: "Genel Şantiye Malzemesi",
    currentZone: "MAIN_WAREHOUSE",
    notes: "",
  })
  const [isSavingManual, setIsSavingManual] = useState(false)

  // ADIM 3: QR Kod Okutulduğunda Server Action Tetikleme
  const handleScanSuccess = async (decodedText: string) => {
    setLastScannedCode(decodedText)
    setIsProcessing(true)

    try {
      const res = await scanAndReceiveMaterial(decodedText)

      if (res.matched && res.success) {
        // EŞLEŞTİ: Başarı bildirimi ve stok güncelleme
        toast.success(res.message, {
          icon: "✅",
          duration: 5000,
        })

        // Listeye ekle
        setRecentItems((prev) => [
          {
            id: `rec-${Date.now()}`,
            materialName: res.item?.materialName || res.item?.name || "Kabul Edilen Malzeme",
            code: decodedText,
            quantity: res.quantityAdded || res.item?.quantity || 1,
            unit: res.item?.unit || "Birim",
            zone: res.item?.currentZone || "MAIN_WAREHOUSE",
            timestamp: "Az Önce",
            status: "MATCHED",
          },
          ...prev,
        ])
        setShowManualForm(false)
      } else {
        // EŞLEŞMEDİ: "Sisteme kayıtlı olmayan ürün, manuel kayıt açın" uyarısı ve boş form
        toast.error(res.message, {
          icon: "⚠️",
          duration: 6000,
        })

        setManualForm((prev) => ({
          ...prev,
          qrCode: decodedText,
          materialName: "",
        }))
        setShowManualForm(true)
      }
    } catch (err: any) {
      toast.error(err?.message || "Malzeme kabulü sırasında hata oluştu.")
    } finally {
      setIsProcessing(false)
    }
  }

  // Manuel Form Kaydet
  const handleSaveManualItem = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!manualForm.materialName.trim()) {
      toast.error("Lütfen malzeme adını giriniz.")
      return
    }

    setIsSavingManual(true)
    try {
      const res = await createManualInventoryItem({
        materialName: manualForm.materialName,
        qrCode: manualForm.qrCode,
        quantity: manualForm.quantity,
        unit: manualForm.unit,
        category: manualForm.category,
        currentZone: manualForm.currentZone,
        notes: manualForm.notes,
      })

      if (res.success) {
        toast.success(res.message || "Malzeme başarıyla kaydedildi!", {
          icon: "🎉",
          duration: 5000,
        })
        setRecentItems((prev) => [
          {
            id: `rec-${Date.now()}`,
            materialName: manualForm.materialName,
            code: manualForm.qrCode || "MANUEL",
            quantity: manualForm.quantity,
            unit: manualForm.unit,
            zone: manualForm.currentZone,
            timestamp: "Az Önce",
            status: "MANUAL",
          },
          ...prev,
        ])
        setShowManualForm(false)
        setManualForm({
          materialName: "",
          qrCode: "",
          quantity: 100,
          unit: "Adet",
          category: "Genel Şantiye Malzemesi",
          currentZone: "MAIN_WAREHOUSE",
          notes: "",
        })
      } else {
        toast.error(res.error || "Malzeme kaydedilemedi.")
      }
    } catch (error: any) {
      toast.error(error?.message || "Beklenmedik bir hata oluştu.")
    } finally {
      setIsSavingManual(false)
    }
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto p-4 sm:p-6 pb-20">
      {/* Üst Bilgi Başlığı */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900 border border-slate-800 p-5 rounded-3xl shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold">
              Şantiye Lojistik & Depo
            </span>
            <span className="text-xs text-slate-400 font-mono">• Mobil Kabul Terminali</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <span>Mobil Malzeme Kabul Terminali</span>
          </h1>
          <p className="text-xs text-slate-400">
            Gelen irsaliye, çimento, demir ve kalıp barkodlarını kamera ile tarayarak saniyeler içinde şantiye envanterine kaydedin.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
          <span>Kamera & Barkod Aktif</span>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* ADIM 3: EN TEPEDE KOCAMAN, DİKKAT ÇEKİCİ BUTON                      */}
      {/* ==================================================================== */}
      <div className="relative group">
        <div className="absolute -inset-1 bg-gradient-to-r from-emerald-600 via-teal-500 to-cyan-500 rounded-3xl blur-md opacity-70 group-hover:opacity-100 transition duration-500 animate-pulse" />
        <button
          type="button"
          onClick={() => setIsScannerOpen(true)}
          className="relative w-full py-8 px-6 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-500 hover:to-teal-500 text-white rounded-3xl shadow-2xl flex flex-col sm:flex-row items-center justify-center gap-4 transition-all active:scale-[0.99] cursor-pointer border-2 border-emerald-300/40"
        >
          <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white shadow-inner flex-shrink-0 animate-bounce">
            <Camera className="w-9 h-9" />
          </div>
          <div className="text-center sm:text-left space-y-1">
            <span className="text-lg sm:text-2xl font-black tracking-wide flex items-center justify-center sm:justify-start gap-2">
              <span>📷 Kamerayı Aç ve İrsaliye/QR Okut</span>
              <Sparkles className="w-6 h-6 text-amber-300" />
            </span>
            <p className="text-xs sm:text-sm text-emerald-100 font-medium">
              Telefonun kamerasını başlatır, QR/barkodu otomatik tarar ve depoya işler
            </p>
          </div>
        </button>
      </div>

      {/* İşleniyor Bildirimi */}
      {isProcessing && (
        <div className="bg-slate-900 border border-emerald-500/40 rounded-2xl p-4 flex items-center justify-center gap-3 animate-pulse text-emerald-300 text-xs font-bold font-mono">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>QR Kod ({lastScannedCode}) Doğrulanıyor ve Envanter Güncelleniyor...</span>
        </div>
      )}

      {/* ==================================================================== */}
      {/* ADIM 3: EŞLEŞMEYEN ÜRÜNLER İÇİN MANUEL KAYIT FORMU                   */}
      {/* ==================================================================== */}
      {showManualForm && (
        <div className="bg-slate-900 border-2 border-amber-500/50 rounded-3xl p-6 space-y-5 shadow-2xl animate-in fade-in duration-300">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/30 text-amber-400 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <span>Sisteme Kayıtlı Olmayan Ürün Tespit Edildi</span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono font-bold">
                    Manuel Kayıt
                  </span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Okutulan kod ({manualForm.qrCode}) veritabanında bulunamadı. Lütfen malzeme bilgilerini girerek kabul işlemini tamamlayın.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowManualForm(false)}
              className="text-slate-400 hover:text-white text-xs font-semibold px-2.5 py-1 rounded-lg hover:bg-slate-800 transition"
            >
              Kapat
            </button>
          </div>

          <form onSubmit={handleSaveManualItem} className="space-y-4 pt-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Malzeme Adı & Tanımı *</label>
                <input
                  type="text"
                  required
                  placeholder="Örn: 500 Torba Çimento, C30 Katkılı"
                  value={manualForm.materialName}
                  onChange={(e) => setManualForm({ ...manualForm, materialName: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Okutulan QR / Barkod Kodu</label>
                <input
                  type="text"
                  readOnly
                  value={manualForm.qrCode}
                  className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-amber-300 font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Teslim Alınan Miktar *</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={manualForm.quantity}
                  onChange={(e) => setManualForm({ ...manualForm, quantity: Number(e.target.value) })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Birim (Ölçü) *</label>
                <select
                  value={manualForm.unit}
                  onChange={(e) => setManualForm({ ...manualForm, unit: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="Torba">Torba</option>
                  <option value="Ton">Ton</option>
                  <option value="m²">m² (Metrekare)</option>
                  <option value="m³">m³ (Metreküp)</option>
                  <option value="Palet">Palet</option>
                  <option value="Adet">Adet</option>
                  <option value="mt">mt (Metre)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Teslim Edilecek Şantiye Bölgesi</label>
                <select
                  value={manualForm.currentZone}
                  onChange={(e) => setManualForm({ ...manualForm, currentZone: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="MAIN_WAREHOUSE">Ana Şantiye Deposu</option>
                  <option value="DEMIR_STOK_SAHASI">Demir & Çelik Stok Sahası</option>
                  <option value="KALIP_AMBARI">Kalıp & İskele Deposu</option>
                  <option value="A_BLOK_ZEMIN">A Blok Zemin Kat İçi</option>
                  <option value="B_BLOK_BODRUM">B Blok Bodrum Depo</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">İrsaliye / İrsaliye No Notu</label>
                <input
                  type="text"
                  placeholder="Örn: İrsaliye No: IRS-98124, Akçansa Çimento"
                  value={manualForm.notes}
                  onChange={(e) => setManualForm({ ...manualForm, notes: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3">
              <button
                type="button"
                onClick={() => setShowManualForm(false)}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
              >
                Vazgeç
              </button>
              <button
                type="submit"
                disabled={isSavingManual}
                className="px-6 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/30 flex items-center gap-2 transition cursor-pointer disabled:opacity-50"
              >
                {isSavingManual ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Envantere Kaydediliyor...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-200" />
                    <span>Malzemeyi Kaydet ve Depoya Al</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ==================================================================== */}
      {/* SON TESLİM ALINAN MALZEMELER LİSTESİ                                 */}
      {/* ==================================================================== */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-sm space-y-3 p-5">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center">
              <PackageCheck className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-white">
                Son Kabul Edilen Malzeme Hareketleri
              </h2>
              <p className="text-xs text-slate-400">
                Mobil QR/Barkod ile depoya girişi yapılan son irsaliyeler
              </p>
            </div>
          </div>

          <span className="text-xs font-mono text-slate-400 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800">
            {recentItems.length} Kayıt
          </span>
        </div>

        <div className="divide-y divide-slate-800/60 font-mono text-xs">
          {recentItems.map((item) => (
            <div
              key={item.id}
              className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-slate-850/50 rounded-xl px-2 transition"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center text-emerald-400 flex-shrink-0">
                  <QrCode className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-bold text-white font-sans text-sm">
                    {item.materialName}
                  </p>
                  <div className="flex items-center gap-2 text-[11px] text-slate-400 font-mono mt-0.5">
                    <span className="text-blue-400 font-semibold">{item.code}</span>
                    <span>•</span>
                    <span>{item.zone}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-4 text-right">
                <div>
                  <p className="font-extrabold text-emerald-400 text-sm">
                    +{item.quantity.toLocaleString("tr-TR")} {item.unit}
                  </p>
                  <p className="text-[10px] text-slate-500 flex items-center gap-1 justify-end">
                    <Clock className="w-3 h-3" />
                    {item.timestamp}
                  </p>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 font-sans font-bold">
                  Depoda
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ADIM 2: Mobil QR Okuyucu Modalı */}
      <MobileQRScanner
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScanSuccess={handleScanSuccess}
        title="Şantiye İrsaliye & Malzeme Kabul Kamerası"
        description="Gelen çimento, demir ve kalıp barkodunu/QR etiketini taratın"
      />
    </div>
  )
}
