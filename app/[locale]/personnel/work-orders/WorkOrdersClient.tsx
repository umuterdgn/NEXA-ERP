"use client"
/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Field Personnel Work Orders Client Component
 * Mobile-first responsive card layout with real-time status actions
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
  Tag
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
  const [activeTab, setActiveTab] = useState<"ALL" | "IN_PROGRESS" | "TODO" | "DONE">("ALL")
  const [searchQuery, setSearchQuery] = useState("")
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  // Status update handler
  const handleStatusChange = async (taskId: string, newStatus: string) => {
    setUpdatingId(taskId)
    try {
      const res = await updateWorkOrderStatus(taskId, newStatus)
      if (res.success) {
        toast.success(res.message || "Görev durumu güncellendi!", {
          icon: newStatus === "DONE" ? "✅" : "⚡"
        })

        // Optimistically update local state
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
    if (!dateVal || status === "DONE" || status === "COMPLETED") return false
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
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div
          onClick={() => setActiveTab("ALL")}
          className={`p-3.5 rounded-xl border transition cursor-pointer ${
            activeTab === "ALL"
              ? "bg-slate-900 border-blue-500/50 shadow-md shadow-blue-500/10"
              : "bg-gray-900/60 border-gray-800 hover:border-gray-700"
          }`}
        >
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-medium">Toplam İş Emri</span>
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
            <span className="text-[11px] font-medium">Devam Edenler</span>
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
            <span className="text-[11px] font-medium">Yapılacaklar</span>
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
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    {order.status === "TODO" && (
                      <>
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
                          <span>⚡ Göreve Başla</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleStatusChange(order.id, "DONE")}
                          disabled={isTaskUpdating}
                          className="flex-1 py-2 px-3 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-emerald-300 font-bold text-xs flex items-center justify-center gap-1.5 transition disabled:opacity-50"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Tamamlandı</span>
                        </button>
                      </>
                    )}

                    {order.status === "IN_PROGRESS" && (
                      <>
                        <button
                          type="button"
                          onClick={() => handleStatusChange(order.id, "DONE")}
                          disabled={isTaskUpdating}
                          className="flex-1 py-2 px-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-md shadow-emerald-600/20 flex items-center justify-center gap-1.5 transition disabled:opacity-50"
                        >
                          {isTaskUpdating ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          )}
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
                      </>
                    )}

                    {(order.status === "DONE" || order.status === "COMPLETED") && (
                      <div className="w-full flex items-center justify-between gap-2 bg-emerald-500/10 border border-emerald-500/30 rounded-xl px-3 py-1.5 text-xs text-emerald-400 font-medium">
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
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
