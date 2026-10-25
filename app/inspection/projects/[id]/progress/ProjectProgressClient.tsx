"use client"

/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Şantiye İlerleme Takibi (Progress Tracking), Keşif/Metraj (BoQ) ve Gantt Zaman Çizelgesi
 */

import { useState, useMemo, useTransition } from "react"
import Link from "next/link"
import { toast } from "react-hot-toast"
import {
  TrendingUp,
  BarChart3,
  Calendar,
  Layers,
  Plus,
  ArrowLeft,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileText,
  Search,
  Filter,
  Camera,
  Upload,
  X,
  Hammer,
  ChevronRight,
  Sparkles,
  Maximize2,
  RefreshCw,
  Building2,
  HardHat,
  BadgePercent,
  Download,
  Eye,
  SlidersHorizontal,
  ChevronDown,
  Info,
  Calculator
} from "lucide-react"
import {
  BoqItemWithLogs,
  ProgressSummary,
  updateBoqProgress,
  createBoqItem,
  seedInitialBoqItems,
  getProjectProgressData
} from "./actions"

interface ProjectProgressClientProps {
  projectId: string
  initialProject: any
  initialBoqItems: BoqItemWithLogs[]
  initialSummary: ProgressSummary
}

export default function ProjectProgressClient({
  projectId,
  initialProject,
  initialBoqItems,
  initialSummary,
}: ProjectProgressClientProps) {
  const [project, setProject] = useState(initialProject)
  const [boqItems, setBoqItems] = useState<BoqItemWithLogs[]>(initialBoqItems)
  const [summary, setSummary] = useState<ProgressSummary>(initialSummary)

  const [activeView, setActiveView] = useState<"ALL" | "TABLE" | "GANTT">("ALL")
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("ALL")

  // Modal States
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false)
  const [selectedBoqItem, setSelectedBoqItem] = useState<BoqItemWithLogs | null>(null)
  const [additionalQty, setAdditionalQty] = useState<string>("")
  const [progressNotes, setProgressNotes] = useState<string>("")
  const [attachmentUrl, setAttachmentUrl] = useState<string>("")
  const [isUploading, setIsUploading] = useState(false)
  const [isPending, startTransition] = useTransition()

  // New Item Modal
  const [isNewItemModalOpen, setIsNewItemModalOpen] = useState(false)
  const [newItemData, setNewItemData] = useState({
    pozNo: "",
    description: "",
    unit: "m3",
    plannedQuantity: "",
    unitPrice: "",
    startDate: new Date().toISOString().split("T")[0],
    endDate: new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0],
  })

  // Logs History Modal
  const [historyModalItem, setHistoryModalItem] = useState<BoqItemWithLogs | null>(null)

  // Refresh data helper
  const reloadData = async () => {
    const res = await getProjectProgressData(projectId)
    if (res.success && res.project) {
      setProject(res.project)
      setBoqItems(res.boqItems)
      setSummary(res.summary)
    }
  }

  // Handle Seeding Template if empty
  const handleSeedTemplate = async () => {
    toast.loading("Standart inşaat metraj şablonu yükleniyor...")
    const res = await seedInitialBoqItems(projectId)
    toast.dismiss()
    if (res.success) {
      toast.success("8 adet standart imalat pozu başarıyla eklendi!")
      await reloadData()
    } else {
      toast.error(res.error || "Şablon eklenemedi")
    }
  }

  // Handle File Upload for Attachment
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    try {
      const formData = new FormData()
      formData.append("file", file)

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      })

      if (res.ok) {
        const data = await res.json()
        if (data.url) {
          setAttachmentUrl(data.url)
          toast.success("Fotoğraf / ataşman başarıyla yüklendi")
        }
      } else {
        // Fallback to base64
        const reader = new FileReader()
        reader.onloadend = () => {
          setAttachmentUrl(reader.result as string)
        }
        reader.readAsDataURL(file)
      }
    } catch (err) {
      console.error(err)
      const reader = new FileReader()
      reader.onloadend = () => {
        setAttachmentUrl(reader.result as string)
      }
      reader.readAsDataURL(file)
    } finally {
      setIsUploading(false)
    }
  }

  // Open Update Progress Modal
  const handleOpenUpdateModal = (item: BoqItemWithLogs) => {
    setSelectedBoqItem(item)
    setAdditionalQty("")
    setProgressNotes("")
    setAttachmentUrl("")
    setIsUpdateModalOpen(true)
  }

  // Submit Progress Update
  const handleSubmitProgressUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedBoqItem) return

    const qty = parseFloat(additionalQty)
    if (isNaN(qty) || qty <= 0) {
      toast.error("Lütfen geçerli ve 0'dan büyük bir miktar girin")
      return
    }

    startTransition(async () => {
      const res = await updateBoqProgress({
        boqItemId: selectedBoqItem.id,
        additionalQuantity: qty,
        notes: progressNotes,
        attachmentUrl: attachmentUrl || undefined,
        createdByName: "Saha Şefi",
      })

      if (res.success) {
        toast.success(res.message || "İlerleme başarıyla kaydedildi!")
        setIsUpdateModalOpen(false)
        await reloadData()
      } else {
        toast.error(res.error || "Hata oluştu")
      }
    })
  }

  // Submit New Boq Item
  const handleCreateNewItem = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newItemData.pozNo || !newItemData.description) {
      toast.error("Poz No ve Açıklama zorunludur")
      return
    }

    startTransition(async () => {
      const res = await createBoqItem(projectId, {
        pozNo: newItemData.pozNo,
        description: newItemData.description,
        unit: newItemData.unit,
        plannedQuantity: parseFloat(newItemData.plannedQuantity) || 0,
        unitPrice: parseFloat(newItemData.unitPrice) || 0,
        startDate: newItemData.startDate,
        endDate: newItemData.endDate,
      })

      if (res.success) {
        toast.success("Yeni poz başarıyla eklendi!")
        setIsNewItemModalOpen(false)
        setNewItemData({
          pozNo: "",
          description: "",
          unit: "m3",
          plannedQuantity: "",
          unitPrice: "",
          startDate: new Date().toISOString().split("T")[0],
          endDate: new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0],
        })
        await reloadData()
      } else {
        toast.error(res.error || "Poz eklenirken hata oluştu")
      }
    })
  }

  // Filtered BoQ Items
  const filteredItems = useMemo(() => {
    return boqItems.filter((item) => {
      const q = searchQuery.toLowerCase()
      const matchesSearch =
        !q ||
        item.pozNo.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q)

      const ratio = item.plannedQuantity > 0 ? (item.actualQuantity / item.plannedQuantity) * 100 : 0
      let matchesStatus = true
      if (statusFilter === "COMPLETED") matchesStatus = ratio >= 100
      if (statusFilter === "IN_PROGRESS") matchesStatus = ratio > 0 && ratio < 100
      if (statusFilter === "NOT_STARTED") matchesStatus = ratio === 0

      return matchesSearch && matchesStatus
    })
  }, [boqItems, searchQuery, statusFilter])

  // Gantt Timeline Range Calculation
  const ganttTimeRange = useMemo(() => {
    let minDate = new Date().getTime()
    let maxDate = new Date().getTime() + 30 * 86400000

    boqItems.forEach((item) => {
      if (item.startDate) {
        const s = new Date(item.startDate).getTime()
        if (s < minDate) minDate = s
      }
      if (item.endDate) {
        const e = new Date(item.endDate).getTime()
        if (e > maxDate) maxDate = e
      }
    })

    // Padding
    minDate -= 5 * 86400000
    maxDate += 10 * 86400000
    const totalDays = Math.max(30, Math.ceil((maxDate - minDate) / (86400000)))

    return { minDate, maxDate, totalDays }
  }, [boqItems])

  // Currency Formatter
  const formatTRY = (num: number) => {
    return num.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " ₺"
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Top Navigation & Breadcrumb */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <Link
            href={`/inspection/projects/${projectId}`}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-blue-400">
              <Building2 className="w-3.5 h-3.5" />
              <span>{project?.name || project?.title || "Proje"}</span>
              <span className="text-slate-600">•</span>
              <span className="text-slate-400">Şantiye İlerleme & Keşif (BoQ)</span>
            </div>
            <h1 className="text-2xl lg:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
              İlerleme Takibi & İş Programı (Gantt)
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            href={`/inspection/projects/${projectId}/boq`}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-xl text-xs font-bold transition-all border border-slate-700 shadow-sm"
          >
            <Calculator className="w-4 h-4 text-blue-400" />
            <span>İnteraktif BoQ DataGrid</span>
          </Link>

          {boqItems.length === 0 && (
            <button
              onClick={handleSeedTemplate}
              className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-purple-950"
            >
              <Sparkles className="w-4 h-4" />
              <span>Standart Şantiye Şablonu Yükle</span>
            </button>
          )}

          <button
            onClick={() => setIsNewItemModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-950"
          >
            <Plus className="w-4 h-4" />
            <span>Yeni Poz / İmalat Ekle</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 1. ADIM 2: BÜYÜK FİZİKSEL İLERLEME ÇUBUĞU (HERO KPI CARD)                */}
      {/* ========================================================================= */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-blue-950/40 rounded-3xl border border-slate-800 p-6 lg:p-8 shadow-2xl relative overflow-hidden">
        {/* Glow ambient background */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        <div className="absolute bottom-0 left-1/3 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold mb-2">
                <BadgePercent className="w-4 h-4" />
                <span>Kümülatif Ağırlıklı Fiziki İlerleme</span>
              </div>
              <h2 className="text-xl lg:text-2xl font-bold text-white">
                Proje Genel Fiziksel Gerçekleşme Oranı
              </h2>
              <p className="text-slate-400 text-xs lg:text-sm mt-1 max-w-2xl">
                Tüm keşif kalemlerinin (BoQ) birim fiyat ve planlanan miktarları ağırlıklandırılarak hesaplanan reel şantiye fiziki ilerleme seviyesidir.
              </p>
            </div>

            {/* Giant Percentage Display */}
            <div className="flex items-baseline gap-2 bg-slate-950/70 border border-slate-800/80 px-6 py-4 rounded-2xl shadow-inner">
              <span className="text-4xl lg:text-5xl font-black tracking-tight text-white font-mono">
                %{summary.weightedProgress}
              </span>
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                {summary.weightedProgress >= 100
                  ? "Tamamlandı"
                  : summary.weightedProgress >= 70
                  ? "İleri Seviye"
                  : summary.weightedProgress >= 30
                  ? "Kaba Yapı / Aktif"
                  : "Başlangıç Aşaması"}
              </span>
            </div>
          </div>

          {/* Large Multi-Segment Gradient Progress Bar */}
          <div className="space-y-2">
            <div className="w-full bg-slate-950/80 rounded-2xl h-6 p-1 border border-slate-800 shadow-inner relative overflow-hidden">
              <div
                className="h-full rounded-xl bg-gradient-to-r from-blue-600 via-indigo-500 to-emerald-400 transition-all duration-1000 shadow-lg relative flex items-center justify-end pr-2"
                style={{ width: `${Math.min(100, Math.max(1, summary.weightedProgress))}%` }}
              >
                {summary.weightedProgress >= 8 && (
                  <span className="text-[10px] font-black text-white drop-shadow font-mono">
                    %{summary.weightedProgress}
                  </span>
                )}
              </div>
            </div>

            {/* Milestone Markers */}
            <div className="flex justify-between text-[11px] font-medium text-slate-500 px-1">
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-600" /> %0 Başlangıç
              </span>
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500" /> %25 Temel & Kazı
              </span>
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" /> %50 Kaba Yapı & Taşıyıcı
              </span>
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> %75 İnce & Cephe
              </span>
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> %100 Teslim
              </span>
            </div>
          </div>

          {/* 4 Metraj & Finansal Özet Kartları */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4 pt-2">
            <div className="bg-slate-950/60 border border-slate-800/80 p-4 rounded-2xl">
              <div className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-blue-400" />
                <span>Toplam Keşif Bedeli</span>
              </div>
              <div className="text-base lg:text-lg font-extrabold text-white mt-1 font-mono">
                {formatTRY(summary.totalPlannedAmount)}
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">Planlanan Sözleşme Metrajı</div>
            </div>

            <div className="bg-slate-950/60 border border-slate-800/80 p-4 rounded-2xl">
              <div className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Gerçekleşen İmalat Tutarı</span>
              </div>
              <div className="text-base lg:text-lg font-extrabold text-emerald-400 mt-1 font-mono">
                {formatTRY(summary.totalActualAmount)}
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">Sahada Onaylanan İmalatlar</div>
            </div>

            <div className="bg-slate-950/60 border border-slate-800/80 p-4 rounded-2xl">
              <div className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                <span>Kalan İmalat Bedeli</span>
              </div>
              <div className="text-base lg:text-lg font-extrabold text-amber-400 mt-1 font-mono">
                {formatTRY(summary.remainingAmount)}
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">Yapılacak Kalan Bütçe</div>
            </div>

            <div className="bg-slate-950/60 border border-slate-800/80 p-4 rounded-2xl">
              <div className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider flex items-center gap-1.5">
                <HardHat className="w-3.5 h-3.5 text-purple-400" />
                <span>Poz Dağılımı ({summary.totalCount})</span>
              </div>
              <div className="text-xs font-bold text-white mt-1.5 flex items-center gap-2">
                <span className="text-emerald-400">{summary.completedCount} Bitti</span>
                <span className="text-slate-600">•</span>
                <span className="text-blue-400">{summary.inProgressCount} Devam</span>
                <span className="text-slate-600">•</span>
                <span className="text-slate-400">{summary.notStartedCount} Bekliyor</span>
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">Metraj Kalem Durumları</div>
            </div>
          </div>
        </div>
      </div>

      {/* Control & View Filters Bar */}
      <div className="bg-slate-900 rounded-2xl p-4 border border-slate-800 flex flex-wrap items-center justify-between gap-4">
        {/* View Switcher Buttons */}
        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setActiveView("ALL")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeView === "ALL"
                ? "bg-blue-600 text-white shadow-md shadow-blue-950"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Tümü (Gantt + Tablo)</span>
          </button>

          <button
            onClick={() => setActiveView("GANTT")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeView === "GANTT"
                ? "bg-blue-600 text-white shadow-md shadow-blue-950"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Sadece Gantt Zaman Çizelgesi</span>
          </button>

          <button
            onClick={() => setActiveView("TABLE")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeView === "TABLE"
                ? "bg-blue-600 text-white shadow-md shadow-blue-950"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Sadece Metraj Tablosu</span>
          </button>
        </div>

        {/* Search & Status Filter */}
        <div className="flex items-center gap-3 flex-1 max-w-md">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500 w-4 h-4" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Poz no veya imalat ara..."
              className="w-full pl-9 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-blue-500"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-blue-500"
          >
            <option value="ALL">Tüm Durumlar</option>
            <option value="IN_PROGRESS">Devam Edenler</option>
            <option value="COMPLETED">Tamamlananlar</option>
            <option value="NOT_STARTED">Başlamayanlar</option>
          </select>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. ADIM 2: GANTT ÇİZELGESİ GÖRÜNÜMÜ                                       */}
      {/* ========================================================================= */}
      {(activeView === "ALL" || activeView === "GANTT") && (
        <div className="bg-slate-900 rounded-3xl border border-slate-800 overflow-hidden shadow-xl">
          <div className="p-5 border-b border-slate-800 flex flex-wrap items-center justify-between gap-4 bg-slate-900/80">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Calendar className="w-4 h-4 text-blue-400" />
                <span>İş Programı & Gantt Zaman Çizelgesi</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Başlangıç ve bitiş tarihlerine göre saha imalat takvimi ve fiili ilerleme durumu
              </p>
            </div>

            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1.5 text-slate-300">
                <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500" /> Tamamlandı (%100)
              </span>
              <span className="flex items-center gap-1.5 text-slate-300">
                <span className="w-2.5 h-2.5 rounded-sm bg-blue-500" /> Devam Ediyor
              </span>
              <span className="flex items-center gap-1.5 text-slate-300">
                <span className="w-2.5 h-2.5 rounded-sm bg-slate-700" /> Planlanan Süre
              </span>
            </div>
          </div>

          <div className="p-5 overflow-x-auto">
            {filteredItems.length === 0 ? (
              <div className="text-center py-10 text-slate-400 text-sm">
                Görüntülenecek takvim kaydı bulunamadı.
              </div>
            ) : (
              <div className="min-w-[850px] space-y-3">
                {filteredItems.map((item) => {
                  const sTime = item.startDate ? new Date(item.startDate).getTime() : ganttTimeRange.minDate
                  const eTime = item.endDate ? new Date(item.endDate).getTime() : sTime + 30 * 86400000

                  const offsetDays = Math.max(0, Math.floor((sTime - ganttTimeRange.minDate) / 86400000))
                  const durationDays = Math.max(2, Math.ceil((eTime - sTime) / 86400000))

                  const leftPercent = Math.min(95, Math.max(0, (offsetDays / ganttTimeRange.totalDays) * 100))
                  const widthPercent = Math.min(100 - leftPercent, Math.max(5, (durationDays / ganttTimeRange.totalDays) * 100))

                  const ratio = item.plannedQuantity > 0 ? Math.min(100, Math.round((item.actualQuantity / item.plannedQuantity) * 100)) : 0
                  const isDone = ratio >= 100

                  return (
                    <div
                      key={item.id}
                      className="grid grid-cols-12 gap-3 items-center py-2 px-3 rounded-xl hover:bg-slate-800/40 transition-colors border border-transparent hover:border-slate-800"
                    >
                      {/* Left: Info */}
                      <div className="col-span-4 pr-2">
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-mono font-bold text-blue-400">
                            {item.pozNo}
                          </span>
                          <span className="text-xs font-semibold text-white truncate max-w-[220px]" title={item.description}>
                            {item.description}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-slate-500 mt-0.5 font-mono">
                          <span>
                            {item.startDate ? new Date(item.startDate).toLocaleDateString("tr-TR") : "Başlangıç belirsiz"}
                          </span>
                          <span>-</span>
                          <span>
                            {item.endDate ? new Date(item.endDate).toLocaleDateString("tr-TR") : "Bitiş belirsiz"}
                          </span>
                          <span>({durationDays} gün)</span>
                        </div>
                      </div>

                      {/* Right: Gantt Bar Track */}
                      <div className="col-span-8 relative h-7 bg-slate-950/80 rounded-lg p-0.5 border border-slate-800/60 overflow-hidden">
                        {/* Time span bar */}
                        <div
                          className="absolute top-1 bottom-1 rounded-md bg-slate-800/90 border border-slate-700/80 overflow-hidden flex items-center"
                          style={{
                            left: `${leftPercent}%`,
                            width: `${widthPercent}%`,
                          }}
                        >
                          {/* Inner actual progress fill */}
                          <div
                            className={`h-full transition-all rounded-sm ${
                              isDone
                                ? "bg-emerald-500"
                                : ratio > 0
                                ? "bg-gradient-to-r from-blue-600 to-indigo-500"
                                : "bg-transparent"
                            }`}
                            style={{ width: `${ratio}%` }}
                          />

                          {/* Progress label inside or over */}
                          <span className="absolute left-2 text-[10px] font-bold text-white drop-shadow font-mono whitespace-nowrap">
                            %{ratio} ({item.actualQuantity} / {item.plannedQuantity} {item.unit})
                          </span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. ADIM 2 & 3: AKTİVİTE VE METRAJ LİSTESİ (BoQ TABLOSU / DATAGRID)        */}
      {/* ========================================================================= */}
      {(activeView === "ALL" || activeView === "TABLE") && (
        <div className="bg-slate-900 rounded-3xl border border-slate-800 overflow-hidden shadow-xl">
          <div className="p-5 border-b border-slate-800 flex flex-wrap items-center justify-between gap-4 bg-slate-900/80">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-emerald-400" />
                <span>Aktivite ve Keşif / Metraj Listesi (BoQ Tablosu)</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Şantiye pozları, birim fiyatlar, planlanan ve gerçekleşen metraj değerleri
              </p>
            </div>

            <div className="text-xs text-slate-400">
              Listelenen: <strong className="text-white">{filteredItems.length}</strong> / {boqItems.length} Poz
            </div>
          </div>

          <div className="w-full overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
            <table className="w-full min-w-[950px] text-left text-sm">
              <thead className="bg-slate-950/80 text-[11px] font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Poz No</th>
                  <th className="py-3 px-4">İmalat / İş Tanımı</th>
                  <th className="py-3 px-3 text-center">Birim</th>
                  <th className="py-3 px-4 text-right">Birim Fiyat</th>
                  <th className="py-3 px-4 text-right">Planlanan</th>
                  <th className="py-3 px-4 text-right">Gerçekleşen</th>
                  <th className="py-3 px-4 text-right">Kalan</th>
                  <th className="py-3 px-4 text-center">İlerleme %</th>
                  <th className="py-3 px-4 text-right">İşlem</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-xs">
                {filteredItems.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-slate-400">
                      <Layers className="w-8 h-8 mx-auto mb-2 text-slate-600" />
                      Aranan kriterlere uygun metraj pozu bulunamadı.
                    </td>
                  </tr>
                ) : (
                  filteredItems.map((item) => {
                    const ratio = item.plannedQuantity > 0 ? (item.actualQuantity / item.plannedQuantity) * 100 : 0
                    const remaining = Math.max(0, item.plannedQuantity - item.actualQuantity)
                    const isDone = ratio >= 100
                    const totalLineAmount = item.plannedQuantity * item.unitPrice

                    return (
                      <tr key={item.id} className="hover:bg-slate-800/40 transition-colors">
                        {/* Poz No */}
                        <td className="py-3.5 px-4 font-mono font-bold text-blue-400 whitespace-nowrap">
                          {item.pozNo}
                        </td>

                        {/* Description */}
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-white leading-snug">
                            {item.description}
                          </div>
                          <div className="text-[10px] text-slate-500 mt-0.5 flex items-center gap-2">
                            <span>Tutar: {formatTRY(totalLineAmount)}</span>
                            {item.progressLogs.length > 0 && (
                              <button
                                onClick={() => setHistoryModalItem(item)}
                                className="text-emerald-400 hover:underline flex items-center gap-0.5"
                              >
                                <Eye className="w-2.5 h-2.5" />
                                {item.progressLogs.length} Saha Girişi
                              </button>
                            )}
                          </div>
                        </td>

                        {/* Unit */}
                        <td className="py-3.5 px-3 text-center whitespace-nowrap font-mono text-slate-300">
                          <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[11px] font-bold">
                            {item.unit}
                          </span>
                        </td>

                        {/* Unit Price */}
                        <td className="py-3.5 px-4 text-right font-mono font-semibold text-slate-300 whitespace-nowrap">
                          {formatTRY(item.unitPrice)}
                        </td>

                        {/* Planned Quantity */}
                        <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-200 whitespace-nowrap">
                          {item.plannedQuantity.toLocaleString("tr-TR")} {item.unit}
                        </td>

                        {/* Actual Quantity */}
                        <td className="py-3.5 px-4 text-right font-mono font-extrabold text-emerald-400 whitespace-nowrap">
                          {item.actualQuantity.toLocaleString("tr-TR")} {item.unit}
                        </td>

                        {/* Remaining */}
                        <td className="py-3.5 px-4 text-right font-mono text-slate-400 whitespace-nowrap">
                          {remaining.toLocaleString("tr-TR")} {item.unit}
                        </td>

                        {/* Progress Bar & Percentage */}
                        <td className="py-3.5 px-4 text-center whitespace-nowrap">
                          <div className="w-28 mx-auto space-y-1">
                            <div className="flex items-center justify-between text-[10px] font-mono">
                              <span className={isDone ? "text-emerald-400 font-bold" : "text-slate-300"}>
                                %{Math.round(ratio * 10) / 10}
                              </span>
                              <span className="text-slate-500 text-[9px]">
                                {isDone ? "Tamam" : "Devam"}
                              </span>
                            </div>
                            <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
                              <div
                                className={`h-full rounded-full transition-all ${
                                  isDone
                                    ? "bg-emerald-400"
                                    : ratio > 0
                                    ? "bg-blue-500"
                                    : "bg-transparent"
                                }`}
                                style={{ width: `${Math.min(100, Math.max(0, ratio))}%` }}
                              />
                            </div>
                          </div>
                        </td>

                        {/* Action: İlerleme Gir */}
                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          <button
                            onClick={() => handleOpenUpdateModal(item)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition-all shadow-md shadow-blue-950"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>İlerleme Gir</span>
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
      )}

      {/* ========================================================================= */}
      {/* 4. ADIM 3: SAHADAN İLERLEME GİRİŞİ MODAL                                  */}
      {/* ========================================================================= */}
      {isUpdateModalOpen && selectedBoqItem && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 rounded-3xl border border-slate-800 max-w-xl w-full p-6 shadow-2xl relative">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                  <Hammer className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Sahadan İlerleme Girişi</h3>
                  <p className="text-xs text-slate-400">
                    Gerçekleşen imalat miktarını ve saha görselini sisteme işleyin
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsUpdateModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitProgressUpdate} className="space-y-4 mt-5">
              {/* Poz Bilgi Kartı */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-blue-400 px-2 py-0.5 rounded bg-blue-500/10 border border-blue-500/20">
                    {selectedBoqItem.pozNo}
                  </span>
                  <span className="text-xs text-slate-400 font-mono">
                    Birim Fiyat: {formatTRY(selectedBoqItem.unitPrice)}
                  </span>
                </div>
                <div className="text-sm font-bold text-white">
                  {selectedBoqItem.description}
                </div>
                <div className="flex items-center justify-between text-xs text-slate-400 pt-1 border-t border-slate-900 font-mono">
                  <span>
                    Planlanan: <strong className="text-white">{selectedBoqItem.plannedQuantity} {selectedBoqItem.unit}</strong>
                  </span>
                  <span>
                    Mevcut Gerçekleşen: <strong className="text-emerald-400">{selectedBoqItem.actualQuantity} {selectedBoqItem.unit}</strong>
                  </span>
                </div>
              </div>

              {/* Bugün Yapılan Miktar Girişi */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Bugün Sahada Yapılan / Eklenen Miktar ({selectedBoqItem.unit}) *
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="Örn: 50"
                    value={additionalQty}
                    onChange={(e) => setAdditionalQty(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white text-base font-bold focus:outline-none focus:border-emerald-500 font-mono"
                    autoFocus
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 font-mono">
                    {selectedBoqItem.unit}
                  </span>
                </div>

                {/* Live Preview of New Total */}
                {additionalQty && parseFloat(additionalQty) > 0 && (
                  <div className="mt-2 p-2.5 rounded-xl bg-emerald-950/30 border border-emerald-800/40 text-xs text-emerald-300 flex items-center justify-between font-mono">
                    <span>
                      Yeni Toplam:{" "}
                      <strong>
                        {(selectedBoqItem.actualQuantity + parseFloat(additionalQty)).toLocaleString("tr-TR")} {selectedBoqItem.unit}
                      </strong>
                    </span>
                    <span>
                      Yeni İlerleme: %
                      {Math.min(
                        100,
                        Math.round(
                          ((selectedBoqItem.actualQuantity + parseFloat(additionalQty)) /
                            selectedBoqItem.plannedQuantity) *
                            1000
                        ) / 10
                      )}
                    </span>
                  </div>
                )}
              </div>

              {/* İlerleme Notu */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  İlerleme / İmalat Notu
                </label>
                <textarea
                  rows={2}
                  placeholder="Örn: A Blok 3. kat döşeme ve kiriş betonu döküldü..."
                  value={progressNotes}
                  onChange={(e) => setProgressNotes(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-blue-500 placeholder-slate-600 leading-relaxed"
                />
              </div>

              {/* Ataşman / Fotoğraf Yükleme */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Saha Ataşmanı & Fotoğraf (Opsiyonel)
                </label>
                <div className="flex items-center gap-3">
                  <label className="flex-1 cursor-pointer flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-950 border border-dashed border-slate-700 hover:border-slate-500 text-slate-400 hover:text-white text-xs transition-all">
                    <Camera className="w-4 h-4 text-emerald-400" />
                    <span>Fotoğraf veya Tutanak Seç</span>
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>

                  {isUploading && (
                    <RefreshCw className="w-4 h-4 animate-spin text-emerald-400 flex-shrink-0" />
                  )}

                  {attachmentUrl && !isUploading && (
                    <a
                      href={attachmentUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-emerald-400 hover:underline flex items-center gap-1 font-medium flex-shrink-0"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Yüklendi
                    </a>
                  )}
                </div>
              </div>

              {/* Modal Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsUpdateModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={isPending || isUploading}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-all shadow-md shadow-emerald-950 disabled:opacity-50 flex items-center gap-2"
                >
                  {isPending ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  )}
                  <span>İlerlemeyi Onayla & Veritabanına Yaz</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. YENİ POZ EKLEME MODAL                                                  */}
      {/* ========================================================================= */}
      {isNewItemModalOpen && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 rounded-3xl border border-slate-800 max-w-lg w-full p-6 shadow-2xl relative">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-blue-400" />
                <span>Yeni Keşif/Metraj Pozu Ekle</span>
              </h3>
              <button
                onClick={() => setIsNewItemModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateNewItem} className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Poz No *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Örn: 15.120.1001"
                    value={newItemData.pozNo}
                    onChange={(e) => setNewItemData({ ...newItemData, pozNo: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs font-mono focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Birim *
                  </label>
                  <select
                    value={newItemData.unit}
                    onChange={(e) => setNewItemData({ ...newItemData, unit: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-blue-500"
                  >
                    <option value="m3">m³</option>
                    <option value="Ton">Ton</option>
                    <option value="m2">m²</option>
                    <option value="Adet">Adet</option>
                    <option value="mt">Metre (mt)</option>
                    <option value="kg">kg</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  İmalat / İş Tanımı *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Örn: C35/45 Hazır Beton Dökümü"
                  value={newItemData.description}
                  onChange={(e) => setNewItemData({ ...newItemData, description: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Planlanan Miktar *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="1000"
                    value={newItemData.plannedQuantity}
                    onChange={(e) =>
                      setNewItemData({ ...newItemData, plannedQuantity: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs font-mono focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Birim Fiyat (₺) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="3500"
                    value={newItemData.unitPrice}
                    onChange={(e) => setNewItemData({ ...newItemData, unitPrice: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs font-mono focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Başlangıç Tarihi
                  </label>
                  <input
                    type="date"
                    value={newItemData.startDate}
                    onChange={(e) => setNewItemData({ ...newItemData, startDate: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Bitiş Tarihi
                  </label>
                  <input
                    type="date"
                    value={newItemData.endDate}
                    onChange={(e) => setNewItemData({ ...newItemData, endDate: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsNewItemModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition-all shadow-md shadow-blue-950"
                >
                  Pozu Ekle
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 6. GEÇMİŞ SAHA İLERLEME LOGLARI MODAL                                    */}
      {/* ========================================================================= */}
      {historyModalItem && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 rounded-3xl border border-slate-800 max-w-lg w-full p-6 shadow-2xl relative">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Clock className="w-4 h-4 text-emerald-400" />
                  <span>Saha İlerleme Geçmişi</span>
                </h3>
                <p className="text-xs text-slate-400 font-mono mt-0.5">
                  {historyModalItem.pozNo} - {historyModalItem.description}
                </p>
              </div>
              <button
                onClick={() => setHistoryModalItem(null)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="max-h-80 overflow-y-auto space-y-2 mt-4 pr-1">
              {historyModalItem.progressLogs.length === 0 ? (
                <div className="text-center py-8 text-slate-500 text-xs">
                  Henüz kayıtlı bir saha ilerleme logu bulunmuyor.
                </div>
              ) : (
                historyModalItem.progressLogs.map((log) => (
                  <div
                    key={log.id}
                    className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-start justify-between gap-3 text-xs"
                  >
                    <div>
                      <div className="flex items-center gap-2 font-mono font-bold text-emerald-400">
                        <span>+{log.quantityAdded} {historyModalItem.unit}</span>
                        <span className="text-[10px] text-slate-500">
                          ({new Date(log.createdAt).toLocaleDateString("tr-TR", {
                            day: "numeric",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          })})
                        </span>
                      </div>
                      {log.notes && (
                        <p className="text-slate-300 text-[11px] mt-1 leading-relaxed">
                          {log.notes}
                        </p>
                      )}
                      <div className="text-[10px] text-slate-500 mt-1">
                        Kayıt: {log.createdByName || "Saha Personeli"}
                      </div>
                    </div>

                    {log.attachmentUrl && (
                      <a
                        href={log.attachmentUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-blue-400 text-[10px] flex items-center gap-1 flex-shrink-0"
                      >
                        <Camera className="w-3 h-3" />
                        <span>Ataşman</span>
                      </a>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
