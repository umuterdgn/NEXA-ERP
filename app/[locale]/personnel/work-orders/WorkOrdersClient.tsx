"use client"
/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Field Personnel Work Orders Client Component
 * Mobile-first responsive card layout with proof capture (Camera) and rejection reason modal
 */

import React, { useState } from "react"
import { useRouter } from "next/navigation"
import {
  ClipboardList,
  CheckCircle2,
  Clock,
  PlayCircle,
  RotateCcw,
  AlertTriangle,
  Building2,
  Calendar,
  Search,
  Filter,
  ArrowLeft,
  RefreshCw,
  Loader2,
  Check,
  Flame,
  Hourglass,
  Tag,
  Camera,
  X,
  Upload,
  Ban,
  ExternalLink,
  ShieldCheck,
  AlertOctagon
} from "lucide-react"
import { toast } from "react-hot-toast"
import { updateWorkOrderStatus, WorkOrderItem } from "@/app/actions/tasks"

interface WorkOrdersClientProps {
  initialWorkOrders: WorkOrderItem[]
  userName: string
}

export default function WorkOrdersClient({
  initialWorkOrders,
  userName
}: WorkOrdersClientProps) {
  const router = useRouter()
  const [workOrders, setWorkOrders] = useState<WorkOrderItem[]>(initialWorkOrders)
  const [activeTab, setActiveTab] = useState<"ALL" | "IN_PROGRESS" | "TODO" | "DONE" | "REJECTED">("ALL")
  const [searchQuery, setSearchQuery] = useState("")
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  // Complete Modal State (Kamera Kanıtı)
  const [completeModalTask, setCompleteModalTask] = useState<WorkOrderItem | null>(null)
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [uploadedPhotoUrl, setUploadedPhotoUrl] = useState<string | null>(null)
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false)
  const [isSubmittingComplete, setIsSubmittingComplete] = useState(false)

  // Reject Modal State (Gerekçe Bildirimi)
  const [rejectModalTask, setRejectModalTask] = useState<WorkOrderItem | null>(null)
  const [rejectionReason, setRejectionReason] = useState("")
  const [isSubmittingReject, setIsSubmittingReject] = useState(false)

  // General Status update handler (for TODO / IN_PROGRESS transitions)
  const handleStatusChange = async (taskId: string, newStatus: string) => {
    setUpdatingId(taskId)
    try {
      const res = await updateWorkOrderStatus(taskId, newStatus)
      if (res.success) {
        toast.success(res.message || "Görev durumu güncellendi!", {
          icon: newStatus === "COMPLETED" || newStatus === "DONE" ? "✅" : "⚡"
        })

        setWorkOrders((prev) =>
          prev.map((item) =>
            item.id === taskId ? { ...item, status: newStatus } : item
          )
        )
        router.refresh()
      } else {
        toast.error(res.error || "Durum güncellenirken bir hata oluştu.")
      }
    } catch (err: any) {
      console.error("Status update error:", err)
      toast.error("İşlem sırasında bağlantı hatası oluştu.")
    } finally {
      setUpdatingId(null)
    }
  }

  // Complete Modal Handlers
  const openCompleteModal = (task: WorkOrderItem) => {
    setCompleteModalTask(task)
    setPhotoFile(null)
    setPhotoPreview(null)
    setUploadedPhotoUrl(null)
    setIsUploadingPhoto(false)
  }

  const closeCompleteModal = () => {
    if (isSubmittingComplete) return
    setCompleteModalTask(null)
    setPhotoFile(null)
    setPhotoPreview(null)
    setUploadedPhotoUrl(null)
    setIsUploadingPhoto(false)
  }

  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 20 * 1024 * 1024) {
      toast.error("Fotoğraf boyutu 20MB'den küçük olmalıdır.")
      return
    }

    setPhotoFile(file)
    const localPreview = URL.createObjectURL(file)
    setPhotoPreview(localPreview)
    setIsUploadingPhoto(true)

    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("sourceModule", "PERSONNEL_TASK_COMPLETION")
      formData.append("category", "TASK_PROOF")
      if (completeModalTask?.projectId) {
        formData.append("projectId", completeModalTask.projectId)
      }

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      })

      if (!res.ok) {
        throw new Error("Yükleme başarısız oldu")
      }

      const data = await res.json()
      if (data.url) {
        setUploadedPhotoUrl(data.url)
        toast.success("Fotoğraf kanıtı yüklendi!")
      } else {
        throw new Error(data.error || "Sunucudan URL alınamadı")
      }
    } catch (err: any) {
      console.error("Photo upload error:", err)
      toast.error("Fotoğraf yüklenemedi. Lütfen tekrar deneyin.")
      setUploadedPhotoUrl(null)
    } finally {
      setIsUploadingPhoto(false)
    }
  }

  const handleFinishTask = async () => {
    if (!completeModalTask) return
    if (!uploadedPhotoUrl) {
      toast.error("Lütfen önce yapılan işin fotoğrafını yükleyin!")
      return
    }

    setIsSubmittingComplete(true)
    try {
      const res = await updateWorkOrderStatus(
        completeModalTask.id,
        "COMPLETED",
        uploadedPhotoUrl
      )

      if (res.success) {
        toast.success(res.message || "Görev başarıyla tamamlandı!", { icon: "📸" })
        setWorkOrders((prev) =>
          prev.map((item) =>
            item.id === completeModalTask.id
              ? {
                  ...item,
                  status: "COMPLETED",
                  completionPhoto: uploadedPhotoUrl
                }
              : item
          )
        )
        closeCompleteModal()
        router.refresh()
      } else {
        toast.error(res.error || "İşlem tamamlanamadı.")
      }
    } catch (err) {
      console.error("Task completion submit error:", err)
      toast.error("Bağlantı hatası oluştu.")
    } finally {
      setIsSubmittingComplete(false)
    }
  }

  // Reject Modal Handlers
  const openRejectModal = (task: WorkOrderItem) => {
    setRejectModalTask(task)
    setRejectionReason("")
  }

  const closeRejectModal = () => {
    if (isSubmittingReject) return
    setRejectModalTask(null)
    setRejectionReason("")
  }

  const handleRejectTask = async () => {
    if (!rejectModalTask) return
    const reason = rejectionReason.trim()
    if (!reason) {
      toast.error("Lütfen bu görevi neden tamamlayamadığınızı belirtin.")
      return
    }

    setIsSubmittingReject(true)
    try {
      const res = await updateWorkOrderStatus(
        rejectModalTask.id,
        "REJECTED",
        undefined,
        reason
      )

      if (res.success) {
        toast.success(res.message || "Görev iade edildi / reddedildi.", { icon: "ℹ️" })
        setWorkOrders((prev) =>
          prev.map((item) =>
            item.id === rejectModalTask.id
              ? {
                  ...item,
                  status: "REJECTED",
                  rejectionReason: reason
                }
              : item
          )
        )
        closeRejectModal()
        router.refresh()
      } else {
        toast.error(res.error || "İşlem tamamlanamadı.")
      }
    } catch (err) {
      console.error("Task rejection submit error:", err)
      toast.error("Bağlantı hatası oluştu.")
    } finally {
      setIsSubmittingReject(false)
    }
  }

  const handleRefresh = () => {
    setRefreshing(true)
    router.refresh()
    setTimeout(() => {
      setRefreshing(false)
      toast.success("Görev listesi yenilendi.")
    }, 600)
  }

  // Filter tasks
  const filteredOrders = workOrders.filter((item) => {
    // Tab filter
    if (activeTab === "TODO" && item.status !== "TODO") return false
    if (activeTab === "IN_PROGRESS" && item.status !== "IN_PROGRESS") return false
    if (activeTab === "DONE" && item.status !== "DONE" && item.status !== "COMPLETED") return false
    if (activeTab === "REJECTED" && item.status !== "REJECTED") return false

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      const titleMatch = item.title.toLowerCase().includes(q)
      const descMatch = (item.description || "").toLowerCase().includes(q)
      const projectMatch = (item.projectName || "").toLowerCase().includes(q)
      return titleMatch || descMatch || projectMatch
    }

    return true
  })

  // Statistics counters
  const totalCount = workOrders.length
  const inProgressCount = workOrders.filter((o) => o.status === "IN_PROGRESS").length
  const todoCount = workOrders.filter((o) => o.status === "TODO").length
  const doneCount = workOrders.filter(
    (o) => o.status === "DONE" || o.status === "COMPLETED"
  ).length
  const rejectedCount = workOrders.filter((o) => o.status === "REJECTED").length

  const formatDate = (dateVal: Date | string | null) => {
    if (!dateVal) return null
    try {
      const d = new Date(dateVal)
      return d.toLocaleDateString("tr-TR", {
        day: "numeric",
        month: "long",
        year: "numeric"
      })
    } catch {
      return null
    }
  }

  const isOverdue = (dateVal: Date | string | null, status: string) => {
    if (!dateVal || status === "DONE" || status === "COMPLETED" || status === "REJECTED") return false
    try {
      const d = new Date(dateVal)
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      return d.getTime() < today.getTime()
    } catch {
      return false
    }
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-800">
        <div>
          <button
            type="button"
            onClick={() => router.push("/personnel")}
            className="inline-flex items-center gap-1.5 text-xs text-orange-400 hover:text-orange-300 font-medium mb-2 transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Personel Portalı
          </button>
          <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-gradient-to-br from-blue-600/30 to-indigo-600/30 text-blue-400 border border-blue-500/30 shadow-lg shadow-blue-500/10">
              <ClipboardList className="w-5 h-5" />
            </span>
            Görevlerim / İş Emirleri
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Sayın <strong className="text-slate-200">{userName}</strong>, şantiyede size atanan iş emirleri ve günlük görevler
          </p>
        </div>

        <button
          type="button"
          onClick={handleRefresh}
          disabled={refreshing}
          className="self-start sm:self-auto px-3.5 py-2 rounded-xl bg-gray-900 border border-gray-800 text-slate-300 hover:text-white transition flex items-center gap-2 text-xs font-semibold"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin text-blue-400" : ""}`} />
          <span>Yenile</span>
        </button>
      </div>

      {/* Stats Counters Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div
          onClick={() => setActiveTab("ALL")}
          className={`p-3.5 rounded-xl border transition cursor-pointer ${
            activeTab === "ALL"
              ? "bg-slate-900 border-blue-500/50 shadow-md shadow-blue-500/10"
              : "bg-gray-900/60 border-gray-800 hover:border-gray-700"
          }`}
        >
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-medium">Toplam</span>
            <ClipboardList className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-xl font-extrabold text-white font-mono">{totalCount}</div>
        </div>

        <div
          onClick={() => setActiveTab("IN_PROGRESS")}
          className={`p-3.5 rounded-xl border transition cursor-pointer ${
            activeTab === "IN_PROGRESS"
              ? "bg-slate-900 border-blue-500/50 shadow-md shadow-blue-500/10"
              : "bg-gray-900/60 border-gray-800 hover:border-gray-700"
          }`}
        >
          <div className="flex items-center justify-between text-blue-400 mb-1">
            <span className="text-[11px] font-medium">Devam Eden</span>
            <PlayCircle className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-xl font-extrabold text-blue-400 font-mono">{inProgressCount}</div>
        </div>

        <div
          onClick={() => setActiveTab("TODO")}
          className={`p-3.5 rounded-xl border transition cursor-pointer ${
            activeTab === "TODO"
              ? "bg-slate-900 border-blue-500/50 shadow-md shadow-blue-500/10"
              : "bg-gray-900/60 border-gray-800 hover:border-gray-700"
          }`}
        >
          <div className="flex items-center justify-between text-amber-400 mb-1">
            <span className="text-[11px] font-medium">Yapılacak</span>
            <Hourglass className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-xl font-extrabold text-amber-400 font-mono">{todoCount}</div>
        </div>

        <div
          onClick={() => setActiveTab("DONE")}
          className={`p-3.5 rounded-xl border transition cursor-pointer ${
            activeTab === "DONE"
              ? "bg-slate-900 border-blue-500/50 shadow-md shadow-blue-500/10"
              : "bg-gray-900/60 border-gray-800 hover:border-gray-700"
          }`}
        >
          <div className="flex items-center justify-between text-emerald-400 mb-1">
            <span className="text-[11px] font-medium">Tamamlanan</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-xl font-extrabold text-emerald-400 font-mono">{doneCount}</div>
        </div>

        <div
          onClick={() => setActiveTab("REJECTED")}
          className={`p-3.5 rounded-xl border transition cursor-pointer col-span-2 sm:col-span-1 ${
            activeTab === "REJECTED"
              ? "bg-slate-900 border-rose-500/50 shadow-md shadow-rose-500/10"
              : "bg-gray-900/60 border-gray-800 hover:border-gray-700"
          }`}
        >
          <div className="flex items-center justify-between text-rose-400 mb-1">
            <span className="text-[11px] font-medium">İade / Reddedilen</span>
            <Ban className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-xl font-extrabold text-rose-400 font-mono">{rejectedCount}</div>
        </div>
      </div>

      {/* Search and Tabs Filter */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-gray-900/80 p-3 rounded-2xl border border-gray-800">
        {/* Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 sm:pb-0">
          <button
            type="button"
            onClick={() => setActiveTab("ALL")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 ${
              activeTab === "ALL"
                ? "bg-blue-600 text-white shadow-md shadow-blue-600/30"
                : "text-slate-400 hover:text-white hover:bg-gray-800"
            }`}
          >
            Tümü ({totalCount})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("IN_PROGRESS")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 flex items-center gap-1 ${
              activeTab === "IN_PROGRESS"
                ? "bg-blue-600 text-white shadow-md shadow-blue-600/30"
                : "text-slate-400 hover:text-white hover:bg-gray-800"
            }`}
          >
            <span>Devam Eden</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-blue-950 text-blue-300">
              {inProgressCount}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("TODO")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 flex items-center gap-1 ${
              activeTab === "TODO"
                ? "bg-blue-600 text-white shadow-md shadow-blue-600/30"
                : "text-slate-400 hover:text-white hover:bg-gray-800"
            }`}
          >
            <span>Yapılacak</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-amber-950 text-amber-300">
              {todoCount}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("DONE")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 flex items-center gap-1 ${
              activeTab === "DONE"
                ? "bg-blue-600 text-white shadow-md shadow-blue-600/30"
                : "text-slate-400 hover:text-white hover:bg-gray-800"
            }`}
          >
            <span>Tamamlanan</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-950 text-emerald-300">
              {doneCount}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("REJECTED")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 flex items-center gap-1 ${
              activeTab === "REJECTED"
                ? "bg-rose-600 text-white shadow-md shadow-rose-600/30"
                : "text-slate-400 hover:text-white hover:bg-gray-800"
            }`}
          >
            <span>Reddedilen</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-rose-950 text-rose-300">
              {rejectedCount}
            </span>
          </button>
        </div>

        {/* Search */}
        <div className="relative min-w-[220px]">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Görev veya şantiye ara..."
            className="w-full bg-slate-950 border border-gray-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>

      {/* Work Orders List (Cards Grid) */}
      {filteredOrders.length === 0 ? (
        <div className="bg-gray-900 rounded-2xl p-12 border border-gray-800 text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-blue-500/10 text-blue-400 flex items-center justify-center mx-auto border border-blue-500/20">
            <ClipboardList className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">
              {searchQuery ? "Arama kriterine uygun görev bulunamadı" : "Henüz Size Atanmış Bir İş Emri Yok"}
            </h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto mt-1 leading-relaxed">
              {searchQuery
                ? `"${searchQuery}" ifadesiyle eşleşen görev bulunamadı. Arama terimini değiştirebilirsiniz.`
                : "Şantiye şefiniz veya merkez ofis size yeni bir görev ya da iş emri atadığında burada anlık olarak listelenecektir."}
            </p>
          </div>
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="text-xs text-blue-400 hover:underline font-medium"
            >
              Aramayı Temizle
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredOrders.map((order) => {
            const isTaskUpdating = updatingId === order.id
            const overdue = isOverdue(order.dueDate, order.status)
            const formattedDueDate = formatDate(order.dueDate)
            const formattedCreatedDate = formatDate(order.createdAt)

            // Priority Badge Colors
            let priorityBadge = (
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-lg bg-blue-500/15 text-blue-300 border border-blue-500/30">
                Orta Öncelik
              </span>
            )
            const pUpper = (order.priority || "").toUpperCase()
            if (pUpper === "URGENT" || pUpper === "ACIL" || pUpper === "ACİL") {
              priorityBadge = (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-lg bg-rose-500/20 text-rose-400 border border-rose-500/40 animate-pulse">
                  <Flame className="w-3 h-3 text-rose-400" />
                  Acil Öncelik
                </span>
              )
            } else if (pUpper === "HIGH" || pUpper === "YUKSEK" || pUpper === "YÜKSEK") {
              priorityBadge = (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  <AlertTriangle className="w-3 h-3 text-amber-400" />
                  Yüksek
                </span>
              )
            } else if (pUpper === "LOW" || pUpper === "DUSUK" || pUpper === "DÜŞÜK") {
              priorityBadge = (
                <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-lg bg-slate-800 text-slate-400 border border-slate-700">
                  Düşük
                </span>
              )
            }

            // Status Badge Colors
            let statusBadge = (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 border border-slate-700 font-mono">
                ⏳ Yapılacak
              </span>
            )
            if (order.status === "IN_PROGRESS") {
              statusBadge = (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-lg bg-sky-500/20 text-sky-300 border border-sky-500/40 font-mono">
                  ⚡ Devam Ediyor
                </span>
              )
            } else if (order.status === "DONE" || order.status === "COMPLETED") {
              statusBadge = (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-mono">
                  ✅ Tamamlandı
                </span>
              )
            } else if (order.status === "REJECTED") {
              statusBadge = (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-lg bg-rose-500/20 text-rose-300 border border-rose-500/40 font-mono">
                  ❌ Reddedildi
                </span>
              )
            }

            return (
              <div
                key={order.id}
                className="bg-gray-900 rounded-2xl p-5 border border-gray-800 hover:border-gray-700 transition flex flex-col justify-between space-y-4 shadow-xl shadow-black/40 relative overflow-hidden"
              >
                {/* Top Ribbons */}
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-400 bg-slate-950 px-2.5 py-1 rounded-lg border border-gray-800">
                        <Building2 className="w-3 h-3 text-orange-400" />
                        <span className="truncate max-w-[150px]">{order.projectName}</span>
                      </span>
                      {priorityBadge}
                    </div>
                    {statusBadge}
                  </div>

                  {/* Title & Description */}
                  <div>
                    <h3 className="text-sm sm:text-base font-bold text-white tracking-tight leading-snug">
                      {order.title}
                    </h3>
                    {order.description && (
                      <p className="text-xs text-slate-300 mt-1.5 leading-relaxed whitespace-pre-line line-clamp-3">
                        {order.description}
                      </p>
                    )}
                  </div>
                </div>

                {/* Deadlines & Meta Info */}
                <div className="pt-3 border-t border-gray-800/80 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                    {formattedDueDate ? (
                      <div
                        className={`flex items-center gap-1.5 ${
                          overdue ? "text-rose-400 font-semibold" : "text-slate-400"
                        }`}
                      >
                        <Calendar className="w-3.5 h-3.5" />
                        <span>Bitiş: {formattedDueDate}</span>
                        {overdue && (
                          <span className="text-[10px] font-bold bg-rose-950 text-rose-300 px-1.5 py-0.5 rounded border border-rose-500/30">
                            Gecikmiş
                          </span>
                        )}
                      </div>
                    ) : (
                      <div className="text-slate-500 text-[11px] flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>Termin belirtilmemiş</span>
                      </div>
                    )}

                    {formattedCreatedDate && (
                      <div className="text-[11px] text-slate-500">
                        Veriliş: {formattedCreatedDate}
                      </div>
                    )}
                  </div>

                  {/* Action Buttons for Mobile / Desktop */}
                  <div className="space-y-2 pt-1">
                    {/* TODO Actions */}
                    {order.status === "TODO" && (
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleStatusChange(order.id, "IN_PROGRESS")}
                          disabled={isTaskUpdating}
                          className="flex-1 py-2 px-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs shadow-md shadow-blue-600/20 flex items-center justify-center gap-1.5 transition disabled:opacity-50"
                        >
                          {isTaskUpdating ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <PlayCircle className="w-3.5 h-3.5" />
                          )}
                          <span>⚡ Başla</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => openCompleteModal(order)}
                          disabled={isTaskUpdating}
                          className="flex-1 py-2 px-3 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-emerald-300 font-bold text-xs flex items-center justify-center gap-1.5 transition disabled:opacity-50"
                        >
                          <Camera className="w-3.5 h-3.5" />
                          <span>Tamamla</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => openRejectModal(order)}
                          disabled={isTaskUpdating}
                          className="py-2 px-3 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 font-semibold text-xs flex items-center justify-center gap-1.5 transition disabled:opacity-50"
                          title="Görevi iade et veya reddet"
                        >
                          <Ban className="w-3.5 h-3.5 text-rose-400" />
                          <span>İade Et</span>
                        </button>
                      </div>
                    )}

                    {/* IN_PROGRESS Actions */}
                    {order.status === "IN_PROGRESS" && (
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => openCompleteModal(order)}
                          disabled={isTaskUpdating}
                          className="flex-1 py-2 px-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-md shadow-emerald-600/20 flex items-center justify-center gap-1.5 transition disabled:opacity-50"
                        >
                          <Camera className="w-3.5 h-3.5" />
                          <span>✅ Görevi Tamamla</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleStatusChange(order.id, "TODO")}
                          disabled={isTaskUpdating}
                          className="py-2 px-3 rounded-xl bg-gray-800 hover:bg-gray-700 text-slate-300 font-semibold text-xs flex items-center justify-center gap-1.5 transition disabled:opacity-50"
                          title="Görevi beklemeye al"
                        >
                          <Hourglass className="w-3.5 h-3.5" />
                          <span>Duraklat</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => openRejectModal(order)}
                          disabled={isTaskUpdating}
                          className="py-2 px-3 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 font-semibold text-xs flex items-center justify-center gap-1.5 transition disabled:opacity-50"
                          title="Görevi iade et veya reddet"
                        >
                          <Ban className="w-3.5 h-3.5 text-rose-400" />
                          <span>İade Et</span>
                        </button>
                      </div>
                    )}

                    {/* REJECTED Details & Action */}
                    {order.status === "REJECTED" && (
                      <div className="space-y-2">
                        <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl p-3 text-xs text-rose-300 space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-rose-200 flex items-center gap-1.5">
                              <Ban className="w-3.5 h-3.5 text-rose-400" />
                              Görev İade Edildi / Reddedildi
                            </span>
                            <button
                              type="button"
                              onClick={() => handleStatusChange(order.id, "IN_PROGRESS")}
                              disabled={isTaskUpdating}
                              className="text-[11px] text-slate-300 hover:text-white underline transition"
                            >
                              Yeniden Başla
                            </button>
                          </div>
                          {order.rejectionReason && (
                            <p className="text-[11px] text-rose-300/90 bg-rose-950/40 p-2 rounded-lg border border-rose-900/50">
                              <strong className="text-rose-200">Gerekçe: </strong>
                              {order.rejectionReason}
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* DONE / COMPLETED Details & Action */}
                    {(order.status === "DONE" || order.status === "COMPLETED") && (
                      <div className="space-y-2">
                        <div className="w-full flex items-center justify-between gap-2 bg-emerald-500/10 border border-emerald-500/30 rounded-xl px-3 py-2 text-xs text-emerald-400 font-medium">
                          <span className="flex items-center gap-1.5">
                            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                            Bu iş emri başarıyla tamamlandı.
                          </span>
                          <button
                            type="button"
                            onClick={() => handleStatusChange(order.id, "IN_PROGRESS")}
                            disabled={isTaskUpdating}
                            className="text-[11px] text-slate-400 hover:text-white underline transition"
                          >
                            Yeniden Aç
                          </button>
                        </div>

                        {order.completionPhoto && (
                          <div className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-950/80 border border-gray-800">
                            <a
                              href={order.completionPhoto}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="relative group shrink-0"
                            >
                              <img
                                src={order.completionPhoto}
                                alt="Kanıt"
                                className="w-14 h-14 object-cover rounded-lg border border-gray-700 group-hover:scale-105 transition"
                              />
                            </a>
                            <div className="text-[11px] min-w-0">
                              <span className="font-bold text-slate-200 block truncate flex items-center gap-1">
                                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                                Saha Kanıt Fotoğrafı
                              </span>
                              <a
                                href={order.completionPhoto}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-400 hover:text-blue-300 underline flex items-center gap-1 mt-1 font-medium"
                              >
                                <span>Büyük Boyutta Aç</span>
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ======================================================== */}
      {/* ADIM 2: TAMAMLAMA MODALİ (KAMERA KANITI)                 */}
      {/* ======================================================== */}
      {completeModalTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-gray-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <Camera className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Görevi Tamamla (Kamera Kanıtı)</h3>
                  <p className="text-xs text-slate-400 truncate max-w-[260px] sm:max-w-[340px]">
                    {completeModalTask.title}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={closeCompleteModal}
                disabled={isSubmittingComplete}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-gray-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Warning / Prompt Requirement */}
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-3.5 text-xs text-blue-300 flex items-start gap-2.5">
              <Camera className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <strong className="text-white block">Lütfen yapılan işin fotoğrafını yükleyin</strong>
                <p className="text-blue-300/90 leading-relaxed">
                  Saha kalite kontrol standartları gereği tamamlanan her iş için fotoğraflı kanıt zorunludur.
                </p>
              </div>
            </div>

            {/* Photo Capture & Preview Area */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2">
                İş Tamamlama Kanıtı <span className="text-emerald-400">* (Zorunlu)</span>
              </label>

              {/* Mobile Back Camera File Input: accept="image/*" capture="environment" */}
              <input
                id="camera-proof-input"
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handlePhotoSelect}
                disabled={isUploadingPhoto || isSubmittingComplete}
                className="hidden"
              />

              {!photoPreview ? (
                <label
                  htmlFor="camera-proof-input"
                  className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-gray-700 hover:border-emerald-500 rounded-2xl cursor-pointer bg-slate-950/60 hover:bg-slate-900/60 transition group text-center space-y-3"
                >
                  <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20 group-hover:scale-110 transition">
                    <Camera className="w-7 h-7" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white">Fotoğraf Çek / Kamerayı Aç</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">Mobilde doğrudan arka kamerayı açar</p>
                  </div>
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-3.5 py-1.5 rounded-lg border border-emerald-500/30">
                    <Upload className="w-3.5 h-3.5" /> Fotoğraf Yükle
                  </span>
                </label>
              ) : (
                <div className="space-y-3">
                  <div className="relative rounded-2xl overflow-hidden border border-gray-700 bg-slate-950 aspect-video flex items-center justify-center">
                    <img
                      src={photoPreview}
                      alt="Kanıt Önizleme"
                      className="w-full h-full object-cover"
                    />

                    {isUploadingPhoto && (
                      <div className="absolute inset-0 bg-black/70 backdrop-blur-xs flex flex-col items-center justify-center gap-2 text-white">
                        <Loader2 className="w-7 h-7 animate-spin text-emerald-400" />
                        <span className="text-xs font-semibold">Fotoğraf yükleniyor, lütfen bekleyin...</span>
                      </div>
                    )}

                    {uploadedPhotoUrl && !isUploadingPhoto && (
                      <div className="absolute top-2 right-2 bg-emerald-600 text-white text-[11px] font-bold px-2.5 py-1 rounded-lg flex items-center gap-1 shadow-lg shadow-black/50">
                        <Check className="w-3.5 h-3.5" /> Kanıt Hazır
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <label
                      htmlFor="camera-proof-input"
                      className="text-blue-400 hover:text-blue-300 font-semibold cursor-pointer underline flex items-center gap-1"
                    >
                      <Camera className="w-3.5 h-3.5" /> Farklı Fotoğraf Çek
                    </label>

                    {uploadedPhotoUrl && (
                      <span className="text-emerald-400 font-medium flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> URL Doğrulandı
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-gray-800">
              <button
                type="button"
                onClick={closeCompleteModal}
                disabled={isSubmittingComplete}
                className="px-4 py-2.5 rounded-xl bg-gray-800 hover:bg-gray-700 text-slate-300 text-xs font-semibold transition"
              >
                İptal
              </button>
              <button
                type="button"
                onClick={handleFinishTask}
                disabled={!uploadedPhotoUrl || isUploadingPhoto || isSubmittingComplete}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold transition shadow-lg shadow-emerald-600/20 flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
                title={!uploadedPhotoUrl ? "Fotoğraf yüklenmeden görev bitirilemez" : "Görevi Bitir"}
              >
                {isSubmittingComplete ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="w-4 h-4" />
                )}
                <span>Görevi Bitir</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* ADIM 3: REDDETME MODALİ (GEREKÇE BİLDİRİMİ)             */}
      {/* ======================================================== */}
      {rejectModalTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-gray-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
                  <AlertOctagon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Görevi İade Et / Reddet</h3>
                  <p className="text-xs text-slate-400 truncate max-w-[260px] sm:max-w-[340px]">
                    {rejectModalTask.title}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={closeRejectModal}
                disabled={isSubmittingReject}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-gray-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Notice */}
            <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-3.5 text-xs text-rose-300">
              Bu görevi sahada tamamlayamıyorsanız lütfen nedenini detaylıca belirtin. Gerekçe şantiye şefine anlık olarak iletilecektir.
            </div>

            {/* Mandatory Textarea */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2">
                İade / Red Gerekçesi <span className="text-rose-400">* (Zorunlu)</span>
              </label>
              <textarea
                rows={4}
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Lütfen bu görevi neden tamamlayamadığınızı belirtin (Örn: Malzeme eksik, vinç arızalı)..."
                disabled={isSubmittingReject}
                className="w-full bg-slate-950 border border-gray-800 rounded-xl p-3.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500 resize-none leading-relaxed"
              />
              <div className="text-[11px] text-slate-500 mt-1.5 flex justify-between">
                <span>* Gerekçe belirtilmeden görev reddedilemez.</span>
                <span>{rejectionReason.trim().length} karakter</span>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-gray-800">
              <button
                type="button"
                onClick={closeRejectModal}
                disabled={isSubmittingReject}
                className="px-4 py-2.5 rounded-xl bg-gray-800 hover:bg-gray-700 text-slate-300 text-xs font-semibold transition"
              >
                Vazgeç
              </button>
              <button
                type="button"
                onClick={handleRejectTask}
                disabled={!rejectionReason.trim() || isSubmittingReject}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white text-xs font-bold transition shadow-lg shadow-rose-600/20 flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
                title={!rejectionReason.trim() ? "Lütfen gerekçe metni girin" : "Görevi Reddet"}
              >
                {isSubmittingReject ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Ban className="w-4 h-4" />
                )}
                <span>Reddet</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
