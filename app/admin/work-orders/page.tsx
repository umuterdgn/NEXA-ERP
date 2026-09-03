/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * This code is the property of NXA Software.
 */

"use client"

import { useState, useEffect } from "react"
import { ClipboardList, Plus, User, AlertCircle, Calendar, Building2, X, CheckCircle, Clock, FileText } from "lucide-react"
import { createWorkOrder, updateWorkOrderStatus, getWorkOrders } from "./actions"
import { toast } from "react-hot-toast"

type TaskStatus = "TODO" | "IN_PROGRESS" | "REVIEW" | "DONE"
type TaskPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT"
type Department = "MIMARI" | "MEKANIK" | "ELEKTRIK" | "INSAAT" | "GENEL"

interface WorkOrder {
  id: string
  title: string
  description: string | null
  status: TaskStatus
  priority: TaskPriority
  department: Department
  projectId: string
  assignedToId: string | null
  dueDate: Date | null
  createdAt: Date
  project: {
    id: string
    title: string
  }
  assignedTo: {
    id: string
    name: string
  } | null
}

const STATUS_LABELS: Record<TaskStatus, string> = {
  TODO: "Yapılacaklar",
  IN_PROGRESS: "Devam Edenler",
  REVIEW: "Kontrol Bekleyenler",
  DONE: "Tamamlandı"
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

export default function WorkOrdersPage() {
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [projects, setProjects] = useState<any[]>([])
  const [personnel, setPersonnel] = useState<any[]>([])
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    projectId: "",
    assignedToId: "",
    department: "GENEL" as Department,
    priority: "MEDIUM" as TaskPriority,
    dueDate: ""
  })

  useEffect(() => {
    fetchWorkOrders()
    fetchProjects()
    fetchPersonnel()
  }, [])

  const fetchWorkOrders = async () => {
    const result = await getWorkOrders()
    if (result.success) {
      setWorkOrders(result.workOrders || [])
    }
  }

  const fetchProjects = async () => {
    try {
      const response = await fetch("/api/admin/projects")
      const data = await response.json()
      setProjects(data.projects || [])
    } catch (error) {
      console.error("Fetch projects error:", error)
    }
  }

  const fetchPersonnel = async () => {
    try {
      const response = await fetch("/api/admin/personnel")
      const data = await response.json()
      setPersonnel(data.personnel || [])
    } catch (error) {
      console.error("Fetch personnel error:", error)
    }
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    const formDataObj = new FormData()
    Object.entries(formData).forEach(([key, value]) => {
      formDataObj.append(key, value)
    })

    const result = await createWorkOrder(formDataObj)
    if (result.success) {
      toast.success("İş emri oluşturuldu")
      setIsModalOpen(false)
      setFormData({
        title: "",
        description: "",
        projectId: "",
        assignedToId: "",
        department: "GENEL",
        priority: "MEDIUM",
        dueDate: ""
      })
      fetchWorkOrders()
    } else {
      toast.error(result.error || "Oluşturma başarısız")
    }
  }

  const handleStatusChange = async (id: string, newStatus: TaskStatus) => {
    const result = await updateWorkOrderStatus(id, newStatus)
    if (result.success) {
      toast.success("Durum güncellendi")
      fetchWorkOrders()
    } else {
      toast.error(result.error || "Güncelleme başarısız")
    }
  }

  const getOrdersByStatus = (status: TaskStatus) => {
    return workOrders.filter(order => order.status === status)
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">İş Emirleri</h1>
          <p className="text-slate-400">Kanban Panosu</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white rounded-xl font-medium shadow-lg shadow-blue-500/30 transition-all"
        >
          <Plus className="w-5 h-5" />
          Yeni İş Emri
        </button>
      </div>

      {/* Kanban Board */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {(Object.keys(STATUS_LABELS) as TaskStatus[]).map((status) => (
          <div key={status} className="bg-slate-800/50 border border-slate-700 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-4">
              <div className={`w-3 h-3 rounded-full ${
                status === "TODO" ? "bg-slate-400" :
                status === "IN_PROGRESS" ? "bg-blue-400" :
                status === "REVIEW" ? "bg-yellow-400" :
                "bg-green-400"
              }`} />
              <h3 className="text-white font-semibold">{STATUS_LABELS[status]}</h3>
              <span className="text-slate-400 text-sm ml-auto">{getOrdersByStatus(status).length}</span>
            </div>

            <div className="space-y-3">
              {getOrdersByStatus(status).map((order) => (
                <div key={order.id} className="bg-slate-900 border border-slate-700 rounded-xl p-4 hover:border-slate-600 transition-colors">
                  <div className="flex items-start justify-between mb-3">
                    <h4 className="text-white font-medium text-sm">{order.title}</h4>
                    <span className={`px-2 py-1 text-xs font-medium rounded-lg border ${PRIORITY_COLORS[order.priority]}`}>
                      {PRIORITY_LABELS[order.priority]}
                    </span>
                  </div>

                  {order.description && (
                    <p className="text-slate-400 text-xs mb-3 line-clamp-2">{order.description}</p>
                  )}

                  <div className="flex items-center gap-2 mb-3 text-xs text-slate-500">
                    <Building2 className="w-3 h-3" />
                    <span>{order.project.title}</span>
                  </div>

                  {order.assignedTo && (
                    <div className="flex items-center gap-2 mb-3 text-xs text-slate-500">
                      <User className="w-3 h-3" />
                      <span>{order.assignedTo.name}</span>
                    </div>
                  )}

                  <select
                    value={order.status}
                    onChange={(e) => handleStatusChange(order.id, e.target.value as TaskStatus)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-xs focus:outline-none focus:border-blue-500"
                  >
                    <option value="TODO">Yapılacaklar</option>
                    <option value="IN_PROGRESS">Devam Ediyor</option>
                    <option value="REVIEW">Kontrol Bekliyor</option>
                    <option value="DONE">Tamamlandı</option>
                  </select>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Create Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-lg">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">Yeni İş Emri</h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-slate-300 text-sm mb-2">Başlık *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
                  placeholder="İş emri başlığı"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-300 text-sm mb-2">Açıklama</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 resize-none"
                  placeholder="İş emri açıklaması"
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-slate-300 text-sm mb-2">Proje *</label>
                <select
                  value={formData.projectId}
                  onChange={(e) => setFormData({ ...formData, projectId: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-blue-500"
                  required
                >
                  <option value="">Proje seçin</option>
                  {projects.map((project) => (
                    <option key={project.id} value={project.id}>{project.title}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-300 text-sm mb-2">Personel Ata</label>
                <select
                  value={formData.assignedToId}
                  onChange={(e) => setFormData({ ...formData, assignedToId: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="">Personel seçin</option>
                  {personnel.map((person) => (
                    <option key={person.id} value={person.id}>{person.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 text-sm mb-2">Departman</label>
                  <select
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value as Department })}
                    className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="Yönetim">Yönetim</option>
                    <option value="Saha Ekibi">Saha Ekibi</option>
                    <option value="Mühendislik">Mühendislik</option>
                    <option value="İSG & Kalite">İSG & Kalite</option>
                    <option value="Muhasebe & Finans">Muhasebe & Finans</option>
                    <option value="Taşeron">Taşeron</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 text-sm mb-2">Öncelik</label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value as TaskPriority })}
                    className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="LOW">Düşük</option>
                    <option value="MEDIUM">Orta</option>
                    <option value="HIGH">Yüksek</option>
                    <option value="URGENT">Acil</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 text-sm mb-2">Son Tarih</label>
                <input
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-4 py-3 bg-slate-800 text-white rounded-xl hover:bg-slate-700 transition-colors"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-500 hover:to-purple-500 transition-all font-medium"
                >
                  Oluştur
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
