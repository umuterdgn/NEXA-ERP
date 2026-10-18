"use client"

import React, { useState, useEffect, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import * as XLSX from "xlsx"
import {
  FileSpreadsheet,
  UploadCloud,
  Download,
  Plus,
  Layers,
  DollarSign,
  TrendingUp,
  Search,
  Filter,
  ArrowLeft,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  FolderKanban
} from "lucide-react"
import { toast } from "react-hot-toast"

interface WorkPackageItem {
  id: string
  pozNo: string | null
  code: string | null
  name: string
  categoryKey: string | null
  unit: string | null
  unitPrice: number
  plannedQuantity: number
  completedQuantity: number
  totalBudget: number | null
  status: string
  subcontractorName: string | null
}

export default function ProjectBoqPage() {
  const params = useParams()
  const router = useRouter()
  const projectId = params?.id as string

  const [projectName, setProjectName] = useState<string>("Proje Keşif & Metraj (BoQ)")
  const [workPackages, setWorkPackages] = useState<WorkPackageItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isUploading, setIsUploading] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("ALL")

  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (projectId) {
      fetchBoqItems()
    }
  }, [projectId])

  const fetchBoqItems = async () => {
    setIsLoading(true)
    try {
      const res = await fetch(`/api/admin/projects/${projectId}/boq`)
      if (res.ok) {
        const data = await res.json()
        if (data.project?.name || data.project?.title) {
          setProjectName(data.project.name || data.project.title)
        }
        setWorkPackages(Array.isArray(data.workPackages) ? data.workPackages : [])
      }
    } catch (err) {
      console.error("BoQ verileri yüklenemedi:", err)
      toast.error("Veriler alınırken hata oluştu")
    } finally {
      setIsLoading(false)
    }
  }

  // 1. Excel Dosyasını Oku ve Ayrıştır (xlsx)
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    try {
      const arrayBuffer = await file.arrayBuffer()
      const workbook = XLSX.read(arrayBuffer, { type: "array" })

      // İlk çalışma sayfasını al
      const firstSheetName = workbook.SheetNames[0]
      const worksheet = workbook.Sheets[firstSheetName]

      // JSON formatına dönüştür
      const rawRows: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: "" })

      if (rawRows.length === 0) {
        toast.error("Seçilen Excel dosyasında veri satırı bulunamadı!")
        return
      }

      // Sütun isimlerini esnek normalize et:
      // Poz No, İmalat Adı, Kategori (statik/mimari vb), Birim, Birim Fiyat, Planlanan Metraj
      const parsedItems = rawRows.map((row) => {
        const keys = Object.keys(row)
        const findVal = (targets: string[]) => {
          const matchKey = keys.find((k) =>
            targets.some((t) => k.trim().toLowerCase().includes(t.toLowerCase()))
          )
          return matchKey ? row[matchKey] : ""
        }

        const pozNo = String(findVal(["poz no", "pozno", "poz", "kod", "code"])).trim()
        const name = String(findVal(["imalat", "ad", "kalem", "isim", "paket", "açıklama", "name"])).trim()
        const categoryKey = String(findVal(["kategori", "disiplin", "grup", "category"])).trim()
        const unit = String(findVal(["birim", "unit"])).trim() || "adet"
        const unitPriceStr = findVal(["fiyat", "birim fiyat", "unitprice", "tutar"])
        const plannedQuantityStr = findVal(["metraj", "miktar", "planlanan", "quantity"])

        const unitPrice = parseFloat(String(unitPriceStr).replace(",", ".")) || 0
        const plannedQuantity = parseFloat(String(plannedQuantityStr).replace(",", ".")) || 0

        return {
          pozNo,
          name: name || `İmalat ${pozNo || "Pozu"}`,
          categoryKey: categoryKey || "statik",
          unit,
          unitPrice,
          plannedQuantity
        }
      }).filter((item) => item.name || item.pozNo)

      if (parsedItems.length === 0) {
        toast.error("Excel dosyasında beklenen sütunlar (Poz No, İmalat Adı vb.) bulunamadı.")
        return
      }

      // 2. API'ye Bulk Gönder (Prisma createMany)
      const res = await fetch(`/api/admin/projects/${projectId}/boq`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: parsedItems })
      })

      const result = await res.json()

      if (res.ok) {
        toast.success(`🎉 ${result.count || parsedItems.length} adet poz başarıyla içe aktarıldı!`, {
          duration: 5000,
          icon: "📊"
        })
        await fetchBoqItems()
      } else {
        toast.error(result.error || "Pozlar içe aktarılırken hata oluştu")
      }
    } catch (err: any) {
      console.error("Excel okuma hatası:", err)
      toast.error("Excel dosyası okunurken hata: " + (err?.message || "Geçersiz dosya"))
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }
  }

  // Örnek Excel Şablonu İndir
  const handleDownloadSample = () => {
    const sampleData = [
      {
        "Poz No": "15.150.1005",
        "İmalat Adı": "C30/37 Hazır Beton Dökülmesi (Temel ve Döşeme)",
        "Kategori": "statik",
        "Birim": "m3",
        "Birim Fiyat": 2450,
        "Planlanan Metraj": 1500
      },
      {
        "Poz No": "15.160.1002",
        "İmalat Adı": "Nervürlü Çelik Donatı İmalatı ve Yerine Konulması (Ø8-Ø12)",
        "Kategori": "statik",
        "Birim": "ton",
        "Birim Fiyat": 32000,
        "Planlanan Metraj": 120
      },
      {
        "Poz No": "15.220.1001",
        "İmalat Adı": "Gazbeton Duvar Örülmesi (15cm)",
        "Kategori": "mimari",
        "Birim": "m2",
        "Birim Fiyat": 480,
        "Planlanan Metraj": 3500
      },
      {
        "Poz No": "18.100.1003",
        "İmalat Adı": "Kablo Kanalı ve Trifaze Tesisat Hattı Çekilmesi",
        "Kategori": "elektrik",
        "Birim": "mt",
        "Birim Fiyat": 175,
        "Planlanan Metraj": 4200
      },
      {
        "Poz No": "17.140.1008",
        "İmalat Adı": "PPRC Sıhhi Tesisat Borulama ve Kolektör Montajı",
        "Kategori": "mekanik",
        "Birim": "mt",
        "Birim Fiyat": 220,
        "Planlanan Metraj": 1800
      }
    ]

    const worksheet = XLSX.utils.json_to_sheet(sampleData)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, "Ornek_BoQ")
    XLSX.writeFile(workbook, "Nexa_Ornek_Poz_Sablonu.xlsx")
    toast.success("Örnek Excel şablonu indirildi!")
  }

  // Hesaplamalar
  const totalBudget = workPackages.reduce((sum, wp) => sum + (wp.totalBudget || (wp.unitPrice * wp.plannedQuantity)), 0)
  const categoryStats = workPackages.reduce((acc, wp) => {
    const cat = wp.categoryKey || "statik"
    acc[cat] = (acc[cat] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const filteredItems = workPackages.filter((wp) => {
    const matchesSearch =
      (wp.pozNo && wp.pozNo.toLowerCase().includes(searchQuery.toLowerCase())) ||
      wp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (wp.subcontractorName && wp.subcontractorName.toLowerCase().includes(searchQuery.toLowerCase()))

    const matchesCategory = selectedCategory === "ALL" || (wp.categoryKey || "statik").toLowerCase() === selectedCategory.toLowerCase()

    return matchesSearch && matchesCategory
  })

  return (
    <div className="space-y-8 p-4 md:p-8">
      {/* Üst Navigasyon & Başlık */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div className="flex items-center gap-4">
          <Link
            href={`/admin/projects/${projectId}`}
            className="p-2.5 rounded-2xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-all border border-slate-700"
            title="Projeye Dön"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-md bg-blue-500/10 text-blue-400 border border-blue-500/20">
                Keşif & Metraj (BoQ)
              </span>
              <span className="text-xs text-slate-500">•</span>
              <span className="text-xs text-slate-400">{projectName}</span>
            </div>
            <h1 className="text-2xl font-black text-white tracking-wide mt-1 flex items-center gap-2.5">
              <span>İş Paketleri & Keşif Pozları</span>
              <FileSpreadsheet className="w-6 h-6 text-emerald-400" />
            </h1>
          </div>
        </div>

        {/* Aksiyon Butonları */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Gizli Excel File Input */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept=".xlsx, .xls, .csv"
            className="hidden"
          />

          <button
            onClick={handleDownloadSample}
            className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-semibold transition-all border border-slate-700 flex items-center gap-1.5 cursor-pointer"
            title="Örnek kolon başlıkları içeren Excel indir"
          >
            <Download className="w-4 h-4 text-slate-400" />
            <span>Şablon İndir</span>
          </button>

          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-2 cursor-pointer border border-emerald-400/30 disabled:opacity-50"
            title="Excel dosyasından pozları otomatik içe aktar"
          >
            {isUploading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Yükleniyor...</span>
              </>
            ) : (
              <>
                <UploadCloud className="w-4 h-4 text-emerald-100" />
                <span>📁 Excel'den Poz Yükle</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* İstatistik Özet Kartları */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-slate-900/60 backdrop-blur-md border border-slate-800/80 rounded-2xl p-5 shadow-xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Toplam Poz Sayısı</span>
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center border border-blue-500/20">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-black text-white">{workPackages.length}</p>
          <p className="text-xs text-slate-400 mt-1">İş paketi ve imalat kalemi</p>
        </div>

        <div className="bg-slate-900/60 backdrop-blur-md border border-slate-800/80 rounded-2xl p-5 shadow-xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Toplam Keşif Bedeli</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-black text-emerald-400">
            ₺{totalBudget.toLocaleString("tr-TR", { maximumFractionDigits: 0 })}
          </p>
          <p className="text-xs text-slate-400 mt-1">Planlanan toplam bütçe</p>
        </div>

        <div className="bg-slate-900/60 backdrop-blur-md border border-slate-800/80 rounded-2xl p-5 shadow-xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Statik & Kaba Yapı</span>
            <div className="w-8 h-8 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center border border-cyan-500/20">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-black text-cyan-400">{categoryStats["statik"] || 0}</p>
          <p className="text-xs text-slate-400 mt-1">Beton, demir, kalıp pozları</p>
        </div>

        <div className="bg-slate-900/60 backdrop-blur-md border border-slate-800/80 rounded-2xl p-5 shadow-xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Mimari & Tesisat</span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center border border-amber-500/20">
              <FolderKanban className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-black text-amber-400">
            {(categoryStats["mimari"] || 0) + (categoryStats["elektrik"] || 0) + (categoryStats["mekanik"] || 0)}
          </p>
          <p className="text-xs text-slate-400 mt-1">İnce işler & mekanik/elektrik</p>
        </div>
      </div>

      {/* Arama & Kategori Filtreleri */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900/40 p-4 rounded-2xl border border-slate-800">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
          <input
            type="text"
            placeholder="Poz No, İmalat Adı veya Taşeron Ara..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-800/80 border border-slate-700 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {[
            { id: "ALL", label: "Tümü" },
            { id: "statik", label: "Statik" },
            { id: "mimari", label: "Mimari" },
            { id: "elektrik", label: "Elektrik" },
            { id: "mekanik", label: "Mekanik" }
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                selectedCategory === cat.id
                  ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                  : "bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* BoQ Pozları Tablosu */}
      <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 rounded-2xl overflow-hidden shadow-2xl">
        {isLoading ? (
          <div className="py-20 text-center text-slate-400 flex flex-col items-center justify-center gap-3">
            <RefreshCw className="w-8 h-8 text-blue-400 animate-spin" />
            <p className="text-sm font-medium">Pozlar yükleniyor...</p>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="py-20 text-center text-slate-400 flex flex-col items-center justify-center gap-3">
            <FileSpreadsheet className="w-12 h-12 text-slate-600" />
            <p className="text-base font-semibold text-slate-300">Henüz poz kaydı bulunmuyor.</p>
            <p className="text-xs text-slate-500 max-w-md">
              Yukarıdaki <strong>"📁 Excel'den Poz Yükle"</strong> butonuna basarak Poz No, İmalat Adı, Kategori, Birim, Birim Fiyat ve Planlanan Metraj sütunlarını içeren Excel dosyanızı tek tıkla yükleyebilirsiniz.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-800/70 border-b border-slate-700 text-slate-300 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-3.5 px-4">Poz No</th>
                  <th className="py-3.5 px-4">İmalat Kalemi Adı</th>
                  <th className="py-3.5 px-4">Kategori</th>
                  <th className="py-3.5 px-4 text-center">Birim</th>
                  <th className="py-3.5 px-4 text-right">Planlanan Metraj</th>
                  <th className="py-3.5 px-4 text-right">Birim Fiyat</th>
                  <th className="py-3.5 px-4 text-right">Toplam Tutar</th>
                  <th className="py-3.5 px-4 text-center">Durum</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredItems.map((wp) => {
                  const itemBudget = wp.totalBudget || wp.unitPrice * wp.plannedQuantity
                  const cat = (wp.categoryKey || "statik").toLowerCase()

                  return (
                    <tr key={wp.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-cyan-300">
                        {wp.pozNo || wp.code || "-"}
                      </td>
                      <td className="py-3 px-4 font-medium text-white max-w-md truncate">
                        {wp.name}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2.5 py-1 rounded-md text-[11px] font-semibold uppercase ${
                            cat === "statik"
                              ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30"
                              : cat === "mimari"
                              ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                              : cat === "elektrik"
                              ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                              : "bg-purple-500/20 text-purple-300 border border-purple-500/30"
                          }`}
                        >
                          {wp.categoryKey || "Statik"}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center font-mono text-slate-300">
                        {wp.unit || "m3"}
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-slate-100">
                        {wp.plannedQuantity.toLocaleString("tr-TR")}
                      </td>
                      <td className="py-3 px-4 text-right font-medium text-slate-300">
                        ₺{wp.unitPrice.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-emerald-400">
                        ₺{itemBudget.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
                          {wp.status || "PLANNED"}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
