"use client"
/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * This code is the property of NXA Software.
 * Akıllı Proje Ekleme Modülü - Çevre ve Şehircilik Bakanlığı (YİBF) RPA Entegrasyonu
 */

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { toast } from "react-hot-toast"
import dynamic from 'next/dynamic'
import {
  Search,
  CheckCircle2,
  Loader2,
  Bot,
  Sparkles,
  FileText,
  ExternalLink,
  ShieldCheck,
  Building,
  Layers,
  Calendar,
  Clock,
  ArrowRight,
  ShieldAlert
} from "lucide-react"
import TwoFactorModal from "@/components/rpa/TwoFactorModal"

// Leaflet SSR'da hata verdiği için dynamic import kullanıyoruz
const MapLocationPicker = dynamic(() => import('@/components/MapLocationPicker'), { ssr: false })

interface ScrapedYibfDocument {
  documentType: string
  documentDate: string
  externalUrl?: string | null
}

export default function NewProjectPage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [companies, setCompanies] = useState<{ id: string; name: string }[]>([])
  
  // YİBF RPA Otomasyon State'leri
  const [yibfNumber, setYibfNumber] = useState("")
  const [isFetchingData, setIsFetchingData] = useState(false)
  const [twoFactorModalOpen, setTwoFactorModalOpen] = useState(false)
  const [activeRpaSessionId, setActiveRpaSessionId] = useState("")
  const [lastSyncedYibf, setLastSyncedYibf] = useState<string | null>(null)
  const [yibfDocuments, setYibfDocuments] = useState<ScrapedYibfDocument[]>([])

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    status: "SAHA",
    companyId: "",
    startDate: "",
    endDate: "",
    category: "",
    city: "",
    district: "",
    mintika: "",
    ada: "",
    parsel: "",
    pafta: "",
    yapiSinifi: "",
    buildingClass: "",
    totalArea: "" as string | number,
    totalConstructionArea: "" as string | number,
    yibfNo: "",
    clientName: "",
    siteManager: "",
    engineer: "",
    architect: "",
    shiftStart: "08:00",
    shiftEnd: "17:00",
    latitude: null as number | null,
    longitude: null as number | null,
    geofenceRadius: 100,
    mapUrl: ""
  })

  useEffect(() => {
    let isActive = true

    const loadCompanies = async () => {
      try {
        const response = await fetch("/api/admin/crm")
        if (!response.ok || !isActive) return

        const data = await response.json()
        if (isActive) {
          setCompanies(data)
        }
      } catch {
        if (isActive) {
          console.error("Failed to fetch companies")
        }
      }
    }

    void loadCompanies()

    return () => {
      isActive = false
    }
  }, [])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  // RPA verilerini form alanlarına otomatik doldurma fonksiyonu
  const applyScrapedData = (data: any) => {
    if (!data) return

    const effectiveNo = data.yibfNo || yibfNumber
    const areaVal = data.totalConstructionArea || data.totalArea || ""

    setFormData(prev => ({
      ...prev,
      name: data.name || data.title || prev.name,
      description: prev.description || `${data.name || ''} - Çevre ve Şehircilik Bakanlığı YİBF #${effectiveNo} denetimli yapı projesi.`,
      ada: data.ada || prev.ada,
      parsel: data.parsel || prev.parsel,
      pafta: data.pafta || prev.pafta,
      yapiSinifi: data.buildingClass || data.yapiSinifi || prev.yapiSinifi,
      buildingClass: data.buildingClass || data.yapiSinifi || prev.buildingClass,
      totalArea: areaVal || prev.totalArea,
      totalConstructionArea: areaVal || prev.totalConstructionArea,
      city: data.city || prev.city || "İstanbul",
      district: data.district || prev.district,
      mintika: data.mintika || prev.mintika,
      yibfNo: effectiveNo,
      clientName: data.contractor || prev.clientName,
      status: prev.status || "SAHA",
    }))

    if (Array.isArray(data.documents) && data.documents.length > 0) {
      setYibfDocuments(data.documents)
    }

    setLastSyncedYibf(effectiveNo)

    toast.success(
      `YİBF #${effectiveNo} verileri ve ${data.documents?.length || 0} resmi tutanak forma başarıyla aktarıldı!`,
      { icon: "🏛️", duration: 5500 }
    )
  }

  // YİBF RPA Sorgusu Başlatma
  const handleYIBFQuery = async () => {
    const cleanYibf = yibfNumber.trim()
    if (!cleanYibf || cleanYibf.length < 5) {
      toast.error("Lütfen geçerli bir YİBF numarası girin (Örn: 214582)")
      return
    }

    setIsFetchingData(true)

    try {
      const res = await fetch("/api/yibf/rpa-sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ yibfNo: cleanYibf }),
      })

      const json = await res.json()

      if (!res.ok || !json.success) {
        toast.error(json.error || "RPA senkronizasyon oturumu başlatılamadı.")
        return
      }

      if (json.requiresTwoFactor || json.status === "AWAITING_2FA") {
        setActiveRpaSessionId(json.sessionId)
        setTwoFactorModalOpen(true)
        toast("E-Devlet SMS/Mobil 2FA Güvenlik Onayı Gerekiyor", { icon: "🔐" })
      } else if (json.data) {
        applyScrapedData(json.data)
      } else {
        toast.success("RPA sorgusu tamamlandı.")
      }
    } catch (err: any) {
      console.error("YİBF query error:", err)
      toast.error("RPA servisine bağlanırken hata oluştu.")
    } finally {
      setIsFetchingData(false)
    }
  }

  const handleSave = async () => {
    if (!formData.name || !formData.status) {
      toast.error("Proje adı ve durumu zorunludur")
      return
    }

    setIsSubmitting(true)
    try {
      const payload = {
        ...formData,
        yibfNo: formData.yibfNo || yibfNumber || null,
        yibfDocuments: yibfDocuments,
      }

      const response = await fetch("/api/admin/projects", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      })

      if (response.ok) {
        const savedProject = await response.json()
        toast.success(`"${savedProject.title || savedProject.name}" projesi ve ${yibfDocuments.length} resmi tutanak başarıyla kaydedildi!`, {
          icon: "🚀"
        })
        router.push("/inspection/projects")
        router.refresh()
      } else {
        const errorData = await response.json()
        toast.error(`Proje oluşturulurken hata: ${errorData.details || errorData.error || "Bilinmeyen hata"}`)
      }
    } catch {
      toast.error("Proje oluşturulurken hata oluştu")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="max-w-7xl mx-auto p-4 md:p-6 lg:p-8 space-y-8">
        
        {/* ÜST BAŞLIK & KAYDET BUTONLARI */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-blue-950/60 text-blue-400 border border-blue-800/60 mb-2">
              <Sparkles className="w-3.5 h-3.5 text-blue-400" />
              <span>NEXA Yapay Zeka & Otonom RPA Mimarisi</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
              <span>🏢 Yeni Proje (Şantiye) Ekle</span>
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl font-medium transition-colors"
            >
              İptal
            </button>
            <button
              onClick={handleSave}
              disabled={isSubmitting}
              className="px-6 py-2.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-500 hover:to-indigo-500 text-white font-bold rounded-xl shadow-lg shadow-blue-600/30 disabled:opacity-50 transition-all flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Kaydediliyor...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>💾 Projeyi Kaydet</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* 1. ADIM: "YİBF NO İLE OTOMATİK DOLDUR" BÜYÜK RPA HERO MODÜLÜ */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-blue-950/30 to-indigo-950/40 border-2 border-blue-500/30 p-6 sm:p-8 shadow-2xl">
          <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-red-950/60 text-red-300 border border-red-800/60 mb-2">
                  <ShieldCheck className="w-3.5 h-3.5 text-red-400" />
                  <span>T.C. ÇEVRE, ŞEHİRCİLİK VE İKLİM DEĞİŞİKLİĞİ BAKANLIĞI • PLAYWRIGHT RPA</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2.5">
                  <Bot className="w-7 h-7 text-blue-400 animate-pulse" />
                  <span>YİBF No ile Otomatik Doldur</span>
                </h2>
                <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
                  Bakanlık Yapı Denetim Portalına (e-YİBF / E-Devlet) 2FA destekli Playwright botuyla bağlanarak proje künyesini, Ada/Parsel/Pafta tapu bilgilerini, yapı sınıfını ve tüm onaylanmış resmi tutanakları tek tuşla kazıyın.
                </p>
              </div>

              {lastSyncedYibf && (
                <div className="flex items-center gap-2 px-4 py-2 bg-emerald-950/60 border border-emerald-600/50 rounded-2xl text-emerald-300 text-xs font-semibold self-start md:self-auto">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <span>YİBF #{lastSyncedYibf} Bakanlık Onaylı Verisi Çekildi</span>
                </div>
              )}
            </div>

            {/* BÜYÜK INPUT & RPA AKSİYON BUTONU */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3 pt-2">
              <div className="md:col-span-8 relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Building className="h-5 w-5 text-blue-400" />
                </div>
                <input
                  type="text"
                  value={yibfNumber}
                  onChange={(e) => setYibfNumber(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault()
                      handleYIBFQuery()
                    }
                  }}
                  placeholder="YİBF Numarasını Girin (Örn: 214582 veya 2451009)..."
                  disabled={isFetchingData}
                  className="w-full pl-12 pr-4 py-4 bg-slate-950/90 border-2 border-blue-500/40 rounded-2xl text-white font-mono text-base sm:text-lg font-bold placeholder-slate-500 focus:outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-500/20 shadow-inner transition-all disabled:opacity-50"
                />
              </div>

              <div className="md:col-span-4">
                <button
                  type="button"
                  onClick={handleYIBFQuery}
                  disabled={isFetchingData || !yibfNumber.trim()}
                  className="w-full h-full min-h-[56px] px-6 py-3.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-sm sm:text-base rounded-2xl shadow-xl shadow-blue-600/30 hover:shadow-indigo-600/40 active:scale-98 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2.5"
                >
                  {isFetchingData ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>RPA Botu Bağlanıyor & Kazınıyor...</span>
                    </>
                  ) : (
                    <>
                      <Bot className="w-5 h-5 text-blue-200" />
                      <span>Bakanlıktan Otomatik Çek (RPA Bot)</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* ÇEKİLEN RESMİ TUTANAKLAR & DENETİM KAYITLARI VİTRİNİ */}
            {yibfDocuments.length > 0 && (
              <div className="pt-4 border-t border-slate-800/80 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-emerald-400" />
                    <h3 className="text-sm font-bold text-white">
                      Bakanlıktan Çekilen Resmi Tutanaklar ve Denetim Kayıtları ({yibfDocuments.length} Evrak)
                    </h3>
                  </div>
                  <span className="text-[11px] text-slate-400 font-medium hidden sm:inline">
                    Kaydet butonuna basıldığında YibfDocument tablosuna yazılacaktır.
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 max-h-60 overflow-y-auto pr-1">
                  {yibfDocuments.map((doc, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl flex items-start justify-between gap-2 hover:border-blue-500/40 transition-colors"
                    >
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                          <span className="text-xs font-bold text-slate-200 truncate">
                            {doc.documentType}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-slate-400 font-mono">
                          <Calendar className="w-3 h-3 text-slate-500" />
                          <span>{new Date(doc.documentDate).toLocaleDateString("tr-TR")}</span>
                        </div>
                      </div>

                      {doc.externalUrl && (
                        <a
                          href={doc.externalUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1 text-slate-400 hover:text-blue-400 rounded-lg hover:bg-slate-800 transition-colors flex-shrink-0"
                          title="Bakanlık Evrakını Görüntüle"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ANA GRID: FORM VE HARİTA SÜTUNLARI */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* SOL SÜTUN (FORM ALANLARI) */}
          <div className="lg:col-span-7 flex flex-col gap-6">
            
            {/* KART 1: Temel Bilgiler */}
            <div className="bg-slate-900/90 p-6 rounded-2xl border border-slate-800 shadow-sm space-y-4">
              <h2 className="text-lg font-bold text-white border-b border-slate-800 pb-3 flex items-center justify-between">
                <span>Temel Bilgiler</span>
                {formData.yibfNo && (
                  <span className="text-xs font-mono font-semibold text-blue-400 bg-blue-950/60 px-2.5 py-1 rounded-lg border border-blue-900/60">
                    YİBF #{formData.yibfNo}
                  </span>
                )}
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Proje Adı *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-slate-500 text-sm"
                    placeholder="Örn: Güneştepe Konutları Projesi"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    YİBF Numarası
                  </label>
                  <input
                    type="text"
                    name="yibfNo"
                    value={formData.yibfNo}
                    onChange={handleInputChange}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-white font-mono text-sm placeholder-slate-500"
                    placeholder="Örn: 214582"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Firma
                  </label>
                  <select
                    name="companyId"
                    value={formData.companyId}
                    onChange={handleInputChange}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-white text-sm"
                  >
                    <option value="">Firma Seçin</option>
                    {companies.map((company) => (
                      <option key={company.id} value={company.id}>{company.name}</option>
                    ))}
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Proje Açıklaması
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-white resize-none h-20 text-sm placeholder-slate-500"
                    placeholder="Proje ve şantiye kapsamı açıklaması"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Proje Durumu
                  </label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-white text-sm"
                  >
                    <option value="SAHA">Saha (Aktif Şantiye)</option>
                    <option value="ETUT">Etüt</option>
                    <option value="CIZIM">Çizim</option>
                    <option value="TAMAMLANDI">Tamamlandı</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Kategori
                  </label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-white text-sm"
                  >
                    <option value="">Kategori Seçin</option>
                    <option value="Konut & Rezidans">Konut & Rezidans</option>
                    <option value="Kentsel Dönüşüm">Kentsel Dönüşüm</option>
                    <option value="Güçlendirme">Güçlendirme</option>
                    <option value="Ticari & AVM">Ticari & AVM</option>
                    <option value="Paket İş">Paket İş</option>
                    <option value="Performans Analizi">Performans Analizi</option>
                    <option value="Danışmanlık">Danışmanlık</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Başlangıç Tarihi
                  </label>
                  <input
                    type="date"
                    name="startDate"
                    value={formData.startDate}
                    onChange={handleInputChange}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-white text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Bitiş Tarihi
                  </label>
                  <input
                    type="date"
                    name="endDate"
                    value={formData.endDate}
                    onChange={handleInputChange}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-white text-sm"
                  />
                </div>
              </div>
            </div>

            {/* KART 2: Künye & Personel */}
            <div className="bg-slate-900/90 p-6 rounded-2xl border border-slate-800 shadow-sm space-y-4">
              <h2 className="text-lg font-bold text-white border-b border-slate-800 pb-3">Künye ve Görevliler</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">Şantiye Şefi</label>
                  <input
                    type="text"
                    name="siteManager"
                    value={formData.siteManager}
                    onChange={handleInputChange}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-white text-sm"
                    placeholder="Şantiye şefi adı"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">Sorumlu Mühendis</label>
                  <input
                    type="text"
                    name="engineer"
                    value={formData.engineer}
                    onChange={handleInputChange}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-white text-sm"
                    placeholder="Sorumlu mühendis adı"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">Mimar</label>
                  <input
                    type="text"
                    name="architect"
                    value={formData.architect}
                    onChange={handleInputChange}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-white text-sm"
                    placeholder="Mimar adı"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">Müşteri / Müteahhit Adı</label>
                  <input
                    type="text"
                    name="clientName"
                    value={formData.clientName}
                    onChange={handleInputChange}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-white text-sm"
                    placeholder="Müşteri veya Müteahhit adı"
                  />
                </div>
              </div>
            </div>

            {/* KART 3: Mesai Düzeni */}
            <div className="bg-slate-900/90 p-6 rounded-2xl border border-slate-800 shadow-sm space-y-4">
              <h2 className="text-lg font-bold text-white border-b border-slate-800 pb-3">Mesai Düzeni</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">Mesai Başlangıç</label>
                  <input
                    type="time"
                    name="shiftStart"
                    value={formData.shiftStart}
                    onChange={handleInputChange}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-white text-sm font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">Mesai Bitiş</label>
                  <input
                    type="time"
                    name="shiftEnd"
                    value={formData.shiftEnd}
                    onChange={handleInputChange}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-white text-sm font-mono"
                  />
                </div>
              </div>
            </div>

          </div>

          {/* SAĞ SÜTUN (TAPU, METREKARE VE HARİTA) */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            
            {/* KART 4: Konum ve Tapu Bilgileri (YİBF Tarafından Otomatik Doldurulan Alanlar) */}
            <div className="bg-slate-900/90 p-6 rounded-2xl border border-slate-800 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h2 className="text-lg font-bold text-white">Tapu & Alan Bilgileri</h2>
                <span className="text-[11px] font-semibold text-blue-400 bg-blue-950/60 px-2 py-0.5 rounded border border-blue-900/50">
                  YİBF Senkron
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">İl</label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-white text-sm"
                    placeholder="İl"
                  />
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">İlçe</label>
                  <input
                    type="text"
                    name="district"
                    value={formData.district}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-white text-sm"
                    placeholder="İlçe"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">Mahalle / Mevkii</label>
                  <input
                    type="text"
                    name="mintika"
                    value={formData.mintika}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-white text-sm"
                    placeholder="Mahalle Adı"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">Ada *</label>
                  <input
                    type="text"
                    name="ada"
                    value={formData.ada}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-white font-mono text-sm"
                    placeholder="Ada No"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">Parsel *</label>
                  <input
                    type="text"
                    name="parsel"
                    value={formData.parsel}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-white font-mono text-sm"
                    placeholder="Parsel No"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">Pafta</label>
                  <input
                    type="text"
                    name="pafta"
                    value={formData.pafta}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-white font-mono text-sm"
                    placeholder="Pafta No"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">Yapı Sınıfı</label>
                  <input
                    type="text"
                    name="yapiSinifi"
                    value={formData.yapiSinifi || formData.buildingClass}
                    onChange={(e) => {
                      setFormData({
                        ...formData,
                        yapiSinifi: e.target.value,
                        buildingClass: e.target.value
                      })
                    }}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-white font-mono text-sm"
                    placeholder="Örn: 3B veya IV-A"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Toplam İnşaat Alanı (m²) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    name="totalConstructionArea"
                    value={formData.totalConstructionArea || formData.totalArea}
                    onChange={(e) => {
                      setFormData({
                        ...formData,
                        totalConstructionArea: e.target.value,
                        totalArea: e.target.value
                      })
                    }}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-white font-mono text-sm"
                    placeholder="Örn: 6450.75"
                  />
                </div>
              </div>

              {/* HARİTA (GEOFENCE) BİLEŞENİ */}
              <div className="mt-6 pt-4 border-t border-slate-800">
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    Sanal Çit (Geofence) Alanı
                  </label>
                  <span className="text-[11px] text-amber-400 font-semibold bg-amber-950/40 px-2 py-0.5 rounded border border-amber-900/50">
                    Opsiyonel
                  </span>
                </div>
                <p className="text-xs text-slate-400 mb-3">
                  Personel puantajı ve BLE konumlandırması için şantiye merkezini haritadan seçin.
                </p>
                
                <MapLocationPicker 
                  latitude={formData.latitude} 
                  longitude={formData.longitude} 
                  radius={formData.geofenceRadius || 100} 
                  onChange={(lat, lng, rad) => setFormData({ ...formData, latitude: lat, longitude: lng, geofenceRadius: rad })} 
                />
              </div>
            </div>

          </div>

        </div>
      </div>

      {/* E-DEVLET 2FA GÜVENLİK ONAY MODALI */}
      <TwoFactorModal
        isOpen={twoFactorModalOpen}
        onClose={() => setTwoFactorModalOpen(false)}
        sessionId={activeRpaSessionId}
        onSuccess={(data) => {
          applyScrapedData(data)
        }}
      />
    </div>
  )
}