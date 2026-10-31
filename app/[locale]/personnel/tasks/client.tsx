/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * This code is the property of NXA Software.
 */

"use client"

import { useState } from "react"
import { ClipboardList, Building2, AlertCircle, Clock, CheckCircle, FileText } from "lucide-react"
import { toast } from "react-hot-toast"

type TaskStatus = "TODO" | "IN_PROGRESS" | "REVIEW" | "DONE"
type TaskPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT"

interface WorkOrder {
  id: string
  title: string
  description: string | null
  status: TaskStatus
  priority: TaskPriority
  dueDate: Date | null
  createdAt: Date
  project: {
    id: string
    title: string
  }
}

interface PersonnelTasksClientProps {
  workOrders: WorkOrder[]
}

const STATUS_LABELS: Record<TaskStatus, string> = {
  TODO: "Yapılacak",
  IN_PROGRESS: "Devam Ediyor",
  REVIEW: "Kontrol Bekliyor",
  DONE: "Tamamlandı"
}

const STATUS_COLORS: Record<TaskStatus, string> = {
  TODO: "bg-slate-500/20 text-slate-400 border-slate-500/50",
  IN_PROGRESS: "bg-blue-500/20 text-blue-400 border-blue-500/50",
  REVIEW: "bg-yellow-500/20 text-yellow-400 border-yellow-500/50",
  DONE: "bg-green-500/20 text-green-400 border-green-500/50"
}

const PRIORITY_COLORS: Record<TaskPriority, string> = {
  LOW: "bg-slate-500/20 text-slate-400 border-slate-500/50",
  MEDIUM: "bg-blue-500/20 text-blue-400 border-blue-500/50",
  HIGH: "bg-orange-500/20 text-orange-400 border-orange-500/50",
  URGENT: "bg-red-500/20 text-red-400 border-red-500/50"
}

const PRIORITY_LABELS: Record<TaskPriority, string> = {
  LOW: "Düşük",
  MEDIUM: "Orta",
  HIGH: "Yüksek",
  URGENT: "Acil"
}

export function PersonnelTasksClient({ workOrders }: PersonnelTasksClientProps) {
  const [orders, setOrders] = useState<WorkOrder[]>(workOrders)

  const handleStatusChange = async (id: string, newStatus: TaskStatus) => {
    try {
      const response = await fetch("/api/admin/work-orders/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: newStatus })
      })

      if (response.ok) {
        toast.success("Durum güncellendi")
        setOrders(orders.map(order => 
          order.id === id ? { ...order, status: newStatus } : order
        ))
      } else {
        toast.error("Güncelleme başarısız")
      }
    } catch (error) {
      console.error("Update status error:", error)
      toast.error("Güncelleme hatası")
    }
  }

  const formatDate = (date: Date | null) => {
    if (!date) return "Belirtilmemiş"
    return new Date(date).toLocaleDateString("tr-TR", { 
      day: "2-digit", 
      month: "2-digit", 
      year: "numeric" 
    })
  }

  const isOverdue = (dueDate: Date | null) => {
    if (!dueDate) return false
    return new Date(dueDate) < new Date()
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white mb-2">Görevlerim</h1>
        <p className="text-slate-400">Size atanan iş emirleri</p>
      </div>

      {orders.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center">
          <ClipboardList className="w-16 h-16 text-slate-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">Henüz göreviniz yok</h3>
          <p className="text-slate-400">Size atanan iş emri bulunmuyor.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {orders.map((order) => (
            <div key={order.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 hover:border-slate-700 transition-colors">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-white mb-2">{order.title}</h3>
                  <div className="flex items-center gap-2 mb-2">
                    <Building2 className="w-4 h-4 text-slate-500" />
                    <span className="text-slate-400 text-sm">{order.project.title}</span>
                  </div>
                </div>
                <span className={`px-3 py-1 text-xs font-medium rounded-lg border ${PRIORITY_COLORS[order.priority]}`}>
                  {PRIORITY_LABELS[order.priority]}
                </span>
              </div>

              {order.description && (
                <p className="text-slate-400 text-sm mb-4 line-clamp-3">{order.description}</p>
              )}

              <div className="flex items-center gap-2 mb-4 text-sm">
                <Clock className="w-4 h-4 text-slate-500" />
                <span className={isOverdue(order.dueDate) ? "text-red-400" : "text-slate-400"}>
                  Son Tarih: {formatDate(order.dueDate)}
                </span>
                {isOverdue(order.dueDate) && (
                  <AlertCircle className="w-4 h-4 text-red-400" />
                )}
              </div>

              <div className="flex items-center gap-2 mb-4">
                <span className={`px-3 py-1 text-xs font-medium rounded-lg border ${STATUS_COLORS[order.status]}`}>
                  {STATUS_LABELS[order.status]}
                </span>
              </div>

              <div className="space-y-2">
                <label className="text-slate-400 text-xs">Durumu Güncelle:</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => handleStatusChange(order.id, "IN_PROGRESS")}
                    disabled={order.status === "IN_PROGRESS" || order.status === "REVIEW" || order.status === "DONE"}
                    className={`px-3 py-2 text-sm rounded-lg transition-colors ${
                      order.status === "IN_PROGRESS" || order.status === "REVIEW" || order.status === "DONE"
                        ? "bg-slate-800 text-slate-600 cursor-not-allowed"
                        : "bg-blue-600/20 text-blue-400 hover:bg-blue-600 hover:text-white"
                    }`}
                  >
                    Devam Et
                  </button>
                  <button
                    onClick={() => handleStatusChange(order.id, "REVIEW")}
                    disabled={order.status === "REVIEW" || order.status === "DONE"}
                    className={`px-3 py-2 text-sm rounded-lg transition-colors ${
                      order.status === "REVIEW" || order.status === "DONE"
                        ? "bg-slate-800 text-slate-600 cursor-not-allowed"
                        : "bg-yellow-600/20 text-yellow-400 hover:bg-yellow-600 hover:text-white"
                    }`}
                  >
                    Kontrol Bekle
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
