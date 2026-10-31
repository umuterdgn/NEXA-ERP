"use client"
/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Reusable Create Task / Work Order Modal Component
 * Automatically populates Project and Personnel selects from Prisma via Server Actions
 */

import React, { useState, useEffect } from "react"
import { X, Loader2, Plus, Calendar, Building2, User, AlertCircle } from "lucide-react"
import { toast } from "react-hot-toast"
import { getProjectsForSelect, getPersonnelForSelect } from "@/app/actions/tasks"

interface ProjectOption {
  id: string
  title: string
  name?: string
}

interface PersonnelOption {
  id: string
  name: string
  role?: string
}

interface CreateTaskModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

export default function CreateTaskModal({
  isOpen,
  onClose,
  onSuccess
}: CreateTaskModalProps) {
  const [projects, setProjects] = useState<ProjectOption[]>([])
  const [personnel, setPersonnel] = useState<PersonnelOption[]>([])
  const [loadingOptions, setLoadingOptions] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    projectId: "",
    assignedTo: "",
    dueDate: "",
    priority: "MEDIUM"
  })

  // ADIM 2: UI Bileşenine Verileri Bağlama
  useEffect(() => {
    if (isOpen) {
      setLoadingOptions(true)
      Promise.all([getProjectsForSelect(), getPersonnelForSelect()])
        .then(([projData, personData]) => {
          setProjects(projData || [])
          setPersonnel(personData || [])
        })
        .catch((err) => {
          console.error("Error loading task select options:", err)
          toast.error("Proje ve personel listesi yüklenemedi.")
        })
        .finally(() => {
          setLoadingOptions(false)
        })
    }
  }, [isOpen])

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.title.trim()) {
      toast.error("Lütfen görev başlığını giriniz.")
      return
    }

    setSubmitting(true)
    try {
      const response = await fetch("/api/admin/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: formData.title.trim(),
          description: formData.description.trim() || null,
          projectId: formData.projectId || null,
          assignedTo: formData.assignedTo || null,
          dueDate: formData.dueDate ? new Date(formData.dueDate) : null,
          status: "TODO"
        })
      })

      if (response.ok) {
        toast.success("Yeni iş emri / görev başarıyla oluşturuldu!", { icon: "✅" })
        setFormData({
          title: "",
          description: "",
          projectId: "",
          assignedTo: "",
          dueDate: "",
          priority: "MEDIUM"
        })
        if (onSuccess) onSuccess()
        onClose()
      } else {
        const errData = await response.json().catch(() => ({}))
        toast.error(errData?.error || "Görev oluşturulamadı.")
      }
    } catch (err: any) {
      console.error("Task create error:", err)
      toast.error("İşlem sırasında bir hata oluştu.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-lg shadow-2xl relative animate-in fade-in zoom-in duration-200">
        <div className="flex items-center justify-between pb-4 border-b border-gray-800 mb-5">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30">
              <Plus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">Yeni İş Emri / Görev Ekle</h2>
              <p className="text-xs text-slate-400">Şantiye için yeni görev veya iş emri tanımlayın</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Görev Başlığı *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Örn: 2. Kat Kolon Demir Donatı Kontrolü"
              required
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Açıklama & Detaylar
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Görev kapsamında yapılması gereken imalat veya kontrol notları..."
              rows={3}
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 resize-none"
            />
          </div>

          {/* ADIM 3: Proje Seçimi Dropdown */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-blue-400" />
                Proje Seçiniz
              </span>
              {loadingOptions && <span className="text-[10px] text-blue-400 animate-pulse">Yükleniyor...</span>}
            </label>
            <select
              value={formData.projectId}
              onChange={(e) => setFormData({ ...formData, projectId: e.target.value })}
              disabled={loadingOptions}
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500 disabled:opacity-50"
            >
              <option value="">Proje seçiniz (Opsiyonel)</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title}
                </option>
              ))}
            </select>
          </div>

          {/* ADIM 3: Atanacak Personel Dropdown */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-emerald-400" />
                Atanacak Personel
              </span>
              {loadingOptions && <span className="text-[10px] text-emerald-400 animate-pulse">Yükleniyor...</span>}
            </label>
            <select
              value={formData.assignedTo}
              onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value })}
              disabled={loadingOptions}
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500 disabled:opacity-50"
            >
              <option value="">Atanacak personel seçiniz (Opsiyonel)</option>
              {personnel.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-orange-400" />
                Bitiş Tarihi
              </label>
              <input
                type="date"
                value={formData.dueDate}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Öncelik
              </label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500 font-medium"
              >
                <option value="LOW">Düşük</option>
                <option value="MEDIUM">Orta</option>
                <option value="HIGH">Yüksek</option>
                <option value="URGENT">Acil</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-800 mt-5">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2 rounded-xl bg-gray-800 hover:bg-gray-700 text-slate-300 text-xs font-medium transition"
            >
              İptal
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-blue-600/20 flex items-center gap-1.5 transition disabled:opacity-50"
            >
              {submitting ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Plus className="w-3.5 h-3.5" />
              )}
              <span>İş Emrini Oluştur</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
