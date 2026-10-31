"use client"
/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Franchise Punch List (QA ve Eksiklik Denetimi) Paneli
 */

import { useState, useEffect } from "react"
import Link from "next/link"
import {
  ClipboardCheck,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Filter,
  Plus,
  RefreshCw,
  Search,
  Building2,
  User,
  Hammer,
  Image as ImageIcon,
  Check,
  ArrowRight,
  Trash2,
  ExternalLink,
  ChevronRight,
  AlertOctagon,
  Calendar,
} from "lucide-react"

interface PunchItem {
  id: string
  projectId: string
  inspectorId: string
  subcontractorId: string
  defectDesc: string
  photoUrl: string | null
  deadline: string
  status: "OPEN" | "FIXED" | "VERIFIED"
  createdAt: string
  project?: {
    id: string
    name: string
    city: string | null
    district: string | null
  }
}

interface ProjectOption {
  id: string
  name: string
  city: string | null
}

export default function FranchisePunchListPage() {
  const [punchList, setPunchList] = useState<PunchItem[]>([])
  const [projects, setProjects] = useState<ProjectOption[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string>("ALL")
  const [selectedProjectId, setSelectedProjectId] = useState<string>("ALL")
  const [searchQuery, setSearchQuery] = useState("")
  const [currentTime, setCurrentTime] = useState<Date>(new Date())

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedPhotoModal, setSelectedPhotoModal] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [newDefect, setNewDefect] = useState({
    projectId: "",
    inspectorId: "Bölge Müdürü (Ahmet Yılmaz)",
    subcontractorId: "",
    defectDesc: "",
    photoUrl: "",
    deadline: "",
  })

  // Canlı sayaç için her 1 saniyede bir saati güncelle
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      // 1. Kusurları çek
      const url = new URL("/api/franchise/punch-list", window.location.origin)
      if (statusFilter !== "ALL") url.searchParams.set("status", statusFilter)
      if (selectedProjectId !== "ALL") url.searchParams.set("projectId", selectedProjectId)

      const res = await fetch(url.toString())
      const data = await res.json()
      if (data.punchLists) {
        setPunchList(data.punchLists)
      }

      // 2. Projeleri çek (modal ve filtre için)
      const projRes = await fetch("/api/admin/projects")
      const projData = await projRes.json()
      const list = Array.isArray(projData) ? projData : projData?.projects || []
      setProjects(list)
      if (list.length > 0 && !newDefect.projectId) {
        setNewDefect((prev) => ({ ...prev, projectId: list[0].id }))
      }
    } catch (err) {
      console.error("Punch list load error", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [statusFilter, selectedProjectId])

  // Status Change (OPEN -> FIXED -> VERIFIED)
  const handleUpdateStatus = async (id: string, newStatus: string) => {
    try {
      // Optimistic update
      setPunchList((prev) =>
        prev.map((item) => (item.id === id ? { ...item, status: newStatus as any } : item))
      )

      await fetch("/api/franchise/punch-list", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: newStatus }),
      })
    } catch (err) {
      console.error("Status update error", err)
      fetchData()
    }
  }

  // Delete defect
  const handleDeleteDefect = async (id: string) => {
    if (!confirm("Bu kusur kaydını silmek istediğinize emin misiniz?")) return
    try {
      setPunchList((prev) => prev.filter((item) => item.id !== id))
      await fetch(`/api/franchise/punch-list?id=${id}`, { method: "DELETE" })
    } catch (err) {
      console.error("Delete defect error", err)
      fetchData()
    }
  }

  // Create Defect
  const handleCreateDefect = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newDefect.projectId || !newDefect.defectDesc || !newDefect.deadline) {
      alert("Lütfen tüm zorunlu alanları doldurun.")
      return
    }

    try {
      setIsSubmitting(true)
      const res = await fetch("/api/franchise/punch-list", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newDefect),
      })

      if (res.ok) {
        setIsModalOpen(false)
        setNewDefect({
          projectId: projects[0]?.id || "",
          inspectorId: "Bölge Müdürü (Ahmet Yılmaz)",
          subcontractorId: "",
          defectDesc: "",
          photoUrl: "",
          deadline: "",
        })
        fetchData()
      }
    } catch (err) {
      console.error("Create defect error", err)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Countdown Helper
  const getCountdown = (deadlineStr: string) => {
    const deadline = new Date(deadlineStr).getTime()
    const now = currentTime.getTime()
    const diff = deadline - now

    if (diff <= 0) {
      const pastSeconds = Math.abs(Math.floor(diff / 1000))
      const days = Math.floor(pastSeconds / 86400)
      const hours = Math.floor((pastSeconds % 86400) / 3600)
      return {
        expired: true,
        text: days > 0 ? `${days} gün ${hours} sa gecikti` : `${hours} saat gecikti`,
      }
    }

    const totalSeconds = Math.floor(diff / 1000)
    const days = Math.floor(totalSeconds / 86400)
    const hours = Math.floor((totalSeconds % 86400) / 3600)
    const minutes = Math.floor((totalSeconds % 3600) / 60)
    const seconds = totalSeconds % 60

    if (days > 0) {
      return { expired: false, text: `${days}g ${hours}s ${minutes}d kaldı` }
    }
    return { expired: false, text: `${hours}s ${minutes}d ${seconds}sn kaldı` }
  }

  // Filtered List
  const filteredList = punchList.filter((item) => {
    const matchesSearch =
      item.defectDesc.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.subcontractorId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.project?.name || "").toLowerCase().includes(searchQuery.toLowerCase())
    return matchesSearch
  })

  // Metric counts
  const totalCount = punchList.length
  const openCount = punchList.filter((i) => i.status === "OPEN").length
  const fixedCount = punchList.filter((i) => i.status === "FIXED").length
  const verifiedCount = punchList.filter((i) => i.status === "VERIFIED").length
  const expiredCount = punchList.filter(
    (i) => i.status === "OPEN" && new Date(i.deadline).getTime() < currentTime.getTime()
  ).length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-purple-400 mb-1">
            <ClipboardCheck className="w-4 h-4" />
            <span>Kurumsal QA ve Açılış Öncesi Denetim</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            Punch List (Kusur & Eksiklik Yönetimi)
          </h1>
          <p className="text-sm text-slate-400">
            Bölge müdürlerinin girdiği kusurları, fotoğraflı kanıtları ve geri sayım sayaçlarıyla (Deadline) takip edin.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchData}
            disabled={loading}
            className="p-2 rounded-lg bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
            title="Yenile"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>

          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium transition-colors shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Yeni Kusur Kaydı Ekle</span>
          </button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="text-xs text-slate-400 flex items-center justify-between">
            <span>Toplam Kusur</span>
            <ClipboardCheck className="w-4 h-4 text-slate-500" />
          </div>
          <div className="text-2xl font-bold text-white mt-2">{totalCount}</div>
          <div className="text-[11px] text-slate-500 mt-1">Kayıtlı Eksiklik</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="text-xs text-amber-400 flex items-center justify-between">
            <span>Açık Kusurlar</span>
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-amber-400 mt-2">{openCount}</div>
          <div className="text-[11px] text-slate-500 mt-1">Düzeltme Bekleyen</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="text-xs text-blue-400 flex items-center justify-between">
            <span>Düzeltildi (FIXED)</span>
            <Clock className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-bold text-blue-400 mt-2">{fixedCount}</div>
          <div className="text-[11px] text-slate-500 mt-1">Merkez Onayı Bekliyor</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="text-xs text-emerald-400 flex items-center justify-between">
            <span>Doğrulandı (VERIFIED)</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-emerald-400 mt-2">{verifiedCount}</div>
          <div className="text-[11px] text-slate-500 mt-1">Kapatılan Kusurlar</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 col-span-2 md:col-span-1">
          <div className="text-xs text-red-400 flex items-center justify-between">
            <span>Süresi Dolan</span>
            <AlertOctagon className="w-4 h-4 text-red-400" />
          </div>
          <div className="text-2xl font-bold text-red-400 mt-2">{expiredCount}</div>
          <div className="text-[11px] text-slate-500 mt-1">Gecikmiş İmalat Alarmları</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-900/60 border border-slate-800/80 rounded-xl p-3">
        <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
          {/* Search Input */}
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Kusur, taşeron veya mağaza ara..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Project Filter */}
          <select
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
            className="px-3 py-1.5 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-blue-500"
          >
            <option value="ALL">Tüm Mağazalar</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.city || "Genel"})
              </option>
            ))}
          </select>

          {/* Status Tabs */}
          <div className="flex items-center p-0.5 bg-slate-950 border border-slate-800 rounded-lg">
            <button
              onClick={() => setStatusFilter("ALL")}
              className={`px-2.5 py-1 text-xs rounded-md font-medium transition-colors ${
                statusFilter === "ALL" ? "bg-slate-800 text-white" : "text-slate-400 hover:text-white"
              }`}
            >
              Tümü
            </button>
            <button
              onClick={() => setStatusFilter("OPEN")}
              className={`px-2.5 py-1 text-xs rounded-md font-medium transition-colors ${
                statusFilter === "OPEN" ? "bg-amber-600/30 text-amber-300" : "text-slate-400 hover:text-white"
              }`}
            >
              Açık ({openCount})
            </button>
            <button
              onClick={() => setStatusFilter("FIXED")}
              className={`px-2.5 py-1 text-xs rounded-md font-medium transition-colors ${
                statusFilter === "FIXED" ? "bg-blue-600/30 text-blue-300" : "text-slate-400 hover:text-white"
              }`}
            >
              Düzeltildi ({fixedCount})
            </button>
            <button
              onClick={() => setStatusFilter("VERIFIED")}
              className={`px-2.5 py-1 text-xs rounded-md font-medium transition-colors ${
                statusFilter === "VERIFIED" ? "bg-emerald-600/30 text-emerald-300" : "text-slate-400 hover:text-white"
              }`}
            >
              Doğrulandı ({verifiedCount})
            </button>
          </div>
        </div>

        <div className="text-xs text-slate-400">
          Listelenen: <span className="font-semibold text-white">{filteredList.length}</span> Kusur
        </div>
      </div>

      {/* Defects List */}
      <div className="space-y-3">
        {filteredList.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-10 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center mx-auto text-slate-500">
              <ClipboardCheck className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-semibold text-white">Kusur Kaydı Bulunamadı</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Seçilen kriterlerde herhangi bir kusur veya eksiklik kaydı bulunmuyor.
            </p>
          </div>
        ) : (
          filteredList.map((item) => {
            const countdown = getCountdown(item.deadline)

            return (
              <div
                key={item.id}
                className="bg-slate-900/80 border border-slate-800 hover:border-slate-700/80 rounded-xl p-4 transition-all space-y-3.5"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  {/* Left: Photo Thumbnail + Description */}
                  <div className="flex items-start gap-3.5">
                    {/* Defect Photo Thumbnail */}
                    {item.photoUrl ? (
                      <div
                        onClick={() => setSelectedPhotoModal(item.photoUrl)}
                        className="w-16 h-16 sm:w-20 sm:h-20 rounded-lg overflow-hidden bg-slate-950 border border-slate-800 shrink-0 cursor-pointer relative group"
                      >
                        <img
                          src={item.photoUrl}
                          alt="Kusur Fotoğrafı"
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                          <ImageIcon className="w-4 h-4 text-white" />
                        </div>
                      </div>
                    ) : (
                      <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-lg bg-slate-950 border border-slate-800 flex flex-col items-center justify-center text-slate-600 shrink-0">
                        <ImageIcon className="w-5 h-5 mb-1" />
                        <span className="text-[9px]">Görsel Yok</span>
                      </div>
                    )}

                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        {/* Store Badge */}
                        <span className="text-[10px] font-bold text-blue-400 bg-blue-950/60 border border-blue-800/60 px-2 py-0.5 rounded">
                          {item.project?.name || "Mağaza"}
                        </span>

                        {/* Status Badge */}
                        {item.status === "OPEN" && (
                          <span className="text-[10px] font-bold text-amber-400 bg-amber-950/60 border border-amber-800/60 px-2 py-0.5 rounded flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                            AÇIK KUSUR
                          </span>
                        )}
                        {item.status === "FIXED" && (
                          <span className="text-[10px] font-bold text-blue-400 bg-blue-950/60 border border-blue-800/60 px-2 py-0.5 rounded flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
                            DÜZELTİLDİ (ONAY BEKLİYOR)
                          </span>
                        )}
                        {item.status === "VERIFIED" && (
                          <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-2 py-0.5 rounded flex items-center gap-1">
                            <Check className="w-3 h-3" />
                            DOĞRULANDI / KAPATILDI
                          </span>
                        )}
                      </div>

                      <h3 className="text-sm font-semibold text-white pt-0.5">{item.defectDesc}</h3>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400 pt-1">
                        <span className="flex items-center gap-1">
                          <User className="w-3.5 h-3.5 text-slate-500" />
                          <span>Denetçi: {item.inspectorId}</span>
                        </span>
                        <span className="flex items-center gap-1">
                          <Hammer className="w-3.5 h-3.5 text-slate-500" />
                          <span>Taşeron: {item.subcontractorId}</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Countdown Timer & Action Buttons */}
                  <div className="flex flex-col sm:items-end gap-2.5 shrink-0 pt-2 sm:pt-0">
                    {/* Countdown Badge */}
                    <div
                      className={`px-3 py-1.5 rounded-lg border text-xs font-mono font-semibold flex items-center gap-1.5 ${
                        item.status === "VERIFIED"
                          ? "bg-slate-950 border-slate-800 text-slate-500"
                          : countdown.expired
                          ? "bg-red-950/80 border-red-800 text-red-300 animate-pulse"
                          : "bg-slate-950 border-slate-800 text-blue-400"
                      }`}
                      title={`Son Tarih: ${new Date(item.deadline).toLocaleString("tr-TR")}`}
                    >
                      <Clock className="w-3.5 h-3.5 shrink-0" />
                      <span>{item.status === "VERIFIED" ? "Tamamlandı" : countdown.text}</span>
                    </div>

                    {/* Action Flow Buttons */}
                    <div className="flex items-center gap-1.5">
                      {item.status === "OPEN" && (
                        <button
                          onClick={() => handleUpdateStatus(item.id, "FIXED")}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-600/80 hover:bg-blue-600 text-white text-xs font-medium transition-colors"
                          title="Taşeron düzeltmeyi tamamladı"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Düzeltildi Olarak İşaretle</span>
                        </button>
                      )}

                      {item.status === "FIXED" && (
                        <button
                          onClick={() => handleUpdateStatus(item.id, "VERIFIED")}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600/80 hover:bg-emerald-600 text-white text-xs font-medium transition-colors"
                          title="Bölge müdürü kusurun giderildiğini onaylar"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Doğrula & Kapat (QA)</span>
                        </button>
                      )}

                      {item.status === "VERIFIED" && (
                        <button
                          onClick={() => handleUpdateStatus(item.id, "OPEN")}
                          className="px-2.5 py-1 text-xs rounded-lg bg-slate-800 text-slate-400 hover:text-white"
                          title="Tekrar Aç"
                        >
                          Tekrar Aç
                        </button>
                      )}

                      <button
                        onClick={() => handleDeleteDefect(item.id)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-slate-800 transition-colors"
                        title="Sil"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* New Defect Entry Modal (Bölge Müdürü Girişi) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-2xl animate-in fade-in duration-200">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-purple-400" />
                <span>Bölge Müdürü Kusur / Punch Girişi</span>
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateDefect} className="space-y-3.5">
              {/* Project Select */}
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-300">Mağaza / Proje *</label>
                <select
                  value={newDefect.projectId}
                  onChange={(e) => setNewDefect({ ...newDefect, projectId: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-blue-500"
                  required
                >
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.city || "Genel"})
                    </option>
                  ))}
                </select>
              </div>

              {/* Defect Description */}
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-300">Kusur Açıklaması *</label>
                <textarea
                  value={newDefect.defectDesc}
                  onChange={(e) => setNewDefect({ ...newDefect, defectDesc: e.target.value })}
                  placeholder="Örn: Tabela rengi kurumsal standart dışı veya kasa arkası aydınlatma trafosu arızalı..."
                  rows={3}
                  className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-200 placeholder-slate-600 focus:outline-none focus:border-blue-500"
                  required
                />
              </div>

              {/* Subcontractor and Inspector */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-300">Sorumlu Taşeron</label>
                  <input
                    type="text"
                    value={newDefect.subcontractorId}
                    onChange={(e) => setNewDefect({ ...newDefect, subcontractorId: e.target.value })}
                    placeholder="Örn: Alsefa Tabela Ltd."
                    className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-200 placeholder-slate-600 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-300">Denetleyen Bölge Md.</label>
                  <input
                    type="text"
                    value={newDefect.inspectorId}
                    onChange={(e) => setNewDefect({ ...newDefect, inspectorId: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Photo URL */}
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-300">Kusur Fotoğrafı (URL)</label>
                <input
                  type="text"
                  value={newDefect.photoUrl}
                  onChange={(e) => setNewDefect({ ...newDefect, photoUrl: e.target.value })}
                  placeholder="https://images.unsplash.com/... veya dosya linki"
                  className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-200 placeholder-slate-600 focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Deadline */}
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-300">
                  Düzeltme Son Tarih & Saat (Deadline) *
                </label>
                <input
                  type="datetime-local"
                  value={newDefect.deadline}
                  onChange={(e) => setNewDefect({ ...newDefect, deadline: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 text-xs rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold transition-colors"
                >
                  {isSubmitting ? "Kaydediliyor..." : "Kusuru Kaydet & Geri Sayımı Başlat"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Photo Lightbox Preview Modal */}
      {selectedPhotoModal && (
        <div
          onClick={() => setSelectedPhotoModal(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md cursor-pointer"
        >
          <div className="relative max-w-3xl max-h-[85vh] rounded-xl overflow-hidden border border-slate-700 bg-slate-950 p-2">
            <img
              src={selectedPhotoModal}
              alt="Kusur Detay Görseli"
              className="max-w-full max-h-[80vh] object-contain rounded-lg"
            />
            <div className="text-center text-xs text-slate-400 mt-2">
              Kapatmak için herhangi bir yere tıklayın
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
