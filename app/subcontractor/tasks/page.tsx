"use client"
/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Subcontractor Active Tasks & Site Instructions Page
 */

import React, { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  ClipboardList,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Filter,
  Search,
  ArrowLeft,
  ChevronRight,
  ExternalLink,
  Camera,
  RefreshCw,
  Building2,
  FileText,
  AlertCircle,
  Paperclip
} from "lucide-react"
import { getSubcontractorTasks, updateSiteInstructionStatus } from "./actions"
import { toast } from "react-hot-toast"

interface InstructionItem {
  id: string
  projectId: string
  title: string
  description: string
  priority: string
  status: string
  attachments: string[]
  createdAt: string
  project?: {
    id: string
    name?: string | null
    title?: string | null
  } | null
}

export default function SubcontractorTasksPage() {
  const router = useRouter()
  const [tasks, setTasks] = useState<InstructionItem[]>([])
  const [loading, setLoading] = useState(true)
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [activeFilter, setActiveFilter] = useState<string>("ALL")
  const [searchQuery, setSearchQuery] = useState<string>("")

  const loadTasks = async () => {
    setLoading(true)
    try {
      const res = await getSubcontractorTasks()
      if (res.success && res.instructions) {
        setTasks(res.instructions as any)
      } else {
        toast.error("Görevler yüklenirken bir problem oluştu.")
      }
    } catch (err) {
      console.error("Tasks error:", err)
      toast.error("Görevler yüklenemedi.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadTasks()
  }, [])

  const handleStatusChange = async (instructionId: string, newStatus: string) => {
    setUpdatingId(instructionId)
    try {
      const res = await updateSiteInstructionStatus(instructionId, newStatus)
      if (res.success) {
        toast.success(`Görev durumu güncellendi: ${newStatus}`)
        setTasks((prev) =>
          prev.map((t) => (t.id === instructionId ? { ...t, status: newStatus } : t))
        )
      } else {
        toast.error(res.error || "Durum güncellenemedi.")
      }
    } catch (err) {
      toast.error("İşlem gerçekleştirilemedi.")
    } finally {
      setUpdatingId(null)
    }
  }

  // Filter tasks
  const filteredTasks = tasks.filter((task) => {
    const matchesFilter =
      activeFilter === "ALL" ||
      task.status.toUpperCase() === activeFilter.toUpperCase()

    const matchesSearch =
      task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (task.project?.name || "").toLowerCase().includes(searchQuery.toLowerCase())

    return matchesFilter && matchesSearch
  })

  // KPI calculations
  const totalCount = tasks.length
  const urgentCount = tasks.filter((t) => t.priority.toUpperCase() === "URGENT" && t.status !== "CLOSED").length
  const inProgressCount = tasks.filter((t) => t.status === "IN_PROGRESS").length
  const resolvedCount = tasks.filter((t) => t.status === "RESOLVED" || t.status === "CLOSED").length

  const getPriorityBadge = (priority: string) => {
    const p = priority.toUpperCase()
    if (p === "URGENT") {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-500/20 text-red-400 border border-red-500/30">
          <AlertCircle className="w-3 h-3" />
          Acil
        </span>
      )
    }
    if (p === "LOW") {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-500/20 text-slate-300 border border-slate-500/30">
          Düşük
        </span>
      )
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-400 border border-amber-500/30">
        Normal
      </span>
    )
  }

  const getStatusBadge = (status: string) => {
    const s = status.toUpperCase()
    switch (s) {
      case "OPEN":
        return <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">Açık / Bekliyor</span>
      case "IN_PROGRESS":
        return <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-blue-500/20 text-blue-400 border border-blue-500/30">İşlemde</span>
      case "RESOLVED":
        return <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">Çözüldü / İnceleniyor</span>
      case "CLOSED":
        return <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-purple-500/20 text-purple-400 border border-purple-500/30">Kapatıldı</span>
      default:
        return <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-500/20 text-slate-300">{status}</span>
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-6 lg:p-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <button
            onClick={() => router.push("/subcontractor")}
            className="flex items-center gap-2 text-sm text-orange-400 hover:text-orange-300 mb-2 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            Portala Dön
          </button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-500/20 border border-orange-500/30 flex items-center justify-center text-orange-400">
              <ClipboardList className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                Görevlerim & Şantiye Talimatları
              </h1>
              <p className="text-xs sm:text-sm text-slate-400">
                Şantiye şefliği ve yapı denetim tarafından firmanıza atanmış teknik talimatlar
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadTasks}
            disabled={loading}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 flex items-center gap-2 transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-orange-400" : ""}`} />
            Yenile
          </button>
          <Link
            href="/subcontractor/proofs/new"
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white text-xs font-semibold shadow-lg shadow-orange-600/20 flex items-center gap-2 transition"
          >
            <Camera className="w-3.5 h-3.5" />
            İş Kanıtı Yükle
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
            <span>Toplam Görev</span>
            <ClipboardList className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-bold text-white">{totalCount}</div>
          <p className="text-[11px] text-slate-500 mt-1">Atanmış iş emirleri</p>
        </div>

        <div className="bg-red-950/20 border border-red-900/40 rounded-2xl p-4">
          <div className="flex items-center justify-between text-red-400 text-xs mb-2">
            <span>Acil Müdahale</span>
            <AlertTriangle className="w-4 h-4 text-red-400" />
          </div>
          <div className="text-2xl font-bold text-red-400">{urgentCount}</div>
          <p className="text-[11px] text-red-300/70 mt-1">Öncelikli revizyonlar</p>
        </div>

        <div className="bg-blue-950/20 border border-blue-900/40 rounded-2xl p-4">
          <div className="flex items-center justify-between text-blue-400 text-xs mb-2">
            <span>İşlemde Olanlar</span>
            <Clock className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-bold text-blue-400">{inProgressCount}</div>
          <p className="text-[11px] text-blue-300/70 mt-1">Sahada devam eden</p>
        </div>

        <div className="bg-emerald-950/20 border border-emerald-900/40 rounded-2xl p-4">
          <div className="flex items-center justify-between text-emerald-400 text-xs mb-2">
            <span>Tamamlanan / Çözülen</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-emerald-400">{resolvedCount}</div>
          <p className="text-[11px] text-emerald-300/70 mt-1">Onaylanan imalatlar</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 mb-6 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Görev başlığı, açıklama veya proje ara..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-orange-500 transition"
          />
        </div>

        {/* Status Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          {[
            { id: "ALL", label: "Tümü" },
            { id: "OPEN", label: "Açık" },
            { id: "IN_PROGRESS", label: "İşlemde" },
            { id: "RESOLVED", label: "Çözüldü" },
            { id: "CLOSED", label: "Kapalı" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveFilter(tab.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition ${
                activeFilter === tab.id
                  ? "bg-orange-600 text-white shadow-md shadow-orange-600/30"
                  : "bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-800"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tasks List */}
      {loading ? (
        <div className="py-20 text-center">
          <RefreshCw className="w-8 h-8 text-orange-400 animate-spin mx-auto mb-3" />
          <p className="text-slate-400 text-sm">Görevler yükleniyor...</p>
        </div>
      ) : filteredTasks.length === 0 ? (
        <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-12 text-center">
          <ClipboardList className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-white mb-1">
            {searchQuery || activeFilter !== "ALL"
              ? "Kriterlere uygun görev bulunamadı"
              : "Henüz atanmış bir görev bulunmuyor"}
          </h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            {searchQuery || activeFilter !== "ALL"
              ? "Arama veya filtre kriterlerinizi değiştirerek tekrar deneyebilirsiniz."
              : "Şantiye yönetimi yeni bir iş emri veya talimat açtığında burada listelenecektir."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredTasks.map((task) => (
            <div
              key={task.id}
              className="bg-slate-900/80 hover:bg-slate-900 border border-slate-800 hover:border-slate-700/80 rounded-2xl p-4 sm:p-5 transition group"
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                {/* Task Details */}
                <div className="flex-1 space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    {getPriorityBadge(task.priority)}
                    {getStatusBadge(task.status)}
                    <span className="text-xs text-slate-400 flex items-center gap-1.5 ml-1">
                      <Building2 className="w-3.5 h-3.5 text-slate-500" />
                      {task.project?.name || task.project?.title || "Merkez Şantiye"}
                    </span>
                    <span className="text-slate-600">•</span>
                    <span className="text-xs text-slate-500">
                      {new Date(task.createdAt).toLocaleDateString("tr-TR", {
                        day: "numeric",
                        month: "long",
                        year: "numeric"
                      })}
                    </span>
                  </div>

                  <h3 className="text-base font-semibold text-white group-hover:text-orange-400 transition">
                    {task.title}
                  </h3>

                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-3xl">
                    {task.description}
                  </p>

                  {/* Attachments if any */}
                  {task.attachments && task.attachments.length > 0 && (
                    <div className="flex items-center gap-2 pt-1">
                      <span className="text-[11px] text-slate-400 flex items-center gap-1">
                        <Paperclip className="w-3 h-3 text-slate-500" />
                        Ekler ({task.attachments.length}):
                      </span>
                      {task.attachments.map((att, idx) => (
                        <a
                          key={idx}
                          href={att}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[11px] text-orange-400 hover:underline inline-flex items-center gap-1 bg-slate-800/80 px-2 py-0.5 rounded-lg border border-slate-700/60"
                        >
                          Ek {idx + 1}
                          <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                      ))}
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2 pt-2 lg:pt-0 border-t border-slate-800/60 lg:border-t-0 shrink-0">
                  {task.status === "OPEN" && (
                    <button
                      onClick={() => handleStatusChange(task.id, "IN_PROGRESS")}
                      disabled={updatingId === task.id}
                      className="px-3 py-1.5 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-500/30 text-xs font-semibold transition"
                    >
                      {updatingId === task.id ? "İşleniyor..." : "İşleme Al"}
                    </button>
                  )}

                  {task.status === "IN_PROGRESS" && (
                    <button
                      onClick={() => handleStatusChange(task.id, "RESOLVED")}
                      disabled={updatingId === task.id}
                      className="px-3 py-1.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 text-xs font-semibold transition flex items-center gap-1.5"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      {updatingId === task.id ? "İşleniyor..." : "Tamamlandı / Çözüldü"}
                    </button>
                  )}

                  <Link
                    href={`/subcontractor/proofs/new?instructionId=${task.id}`}
                    className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium transition flex items-center gap-1.5"
                  >
                    <Camera className="w-3.5 h-3.5 text-orange-400" />
                    <span>Kanıt Yükle</span>
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
