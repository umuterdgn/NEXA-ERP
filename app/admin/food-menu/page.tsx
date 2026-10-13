"use client"
/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Proje Bazlı Yemek Menüsü Yönetimi
 */

import React, { useState, useEffect, useCallback } from "react"
import { 
  Upload, 
  Calendar, 
  Utensils, 
  Trash2, 
  FileSpreadsheet, 
  Pencil, 
  X, 
  CheckCircle, 
  Building2, 
  ChevronDown,
  Plus,
  AlertCircle,
  Loader2,
  CalendarDays,
  Sparkles
} from "lucide-react"
import { uploadMenuExcel, updateFoodMenu, createFoodMenu, deleteFoodMenuAction } from "./actions"
import { toast } from "react-hot-toast"

interface ProjectItem {
  id: string
  title?: string | null
  name?: string | null
  city?: string | null
}

interface MenuItem {
  id: string
  date: string
  items: string
  projectId: string
  project?: {
    id: string
    title?: string | null
    name?: string | null
  }
}

export default function FoodMenuPage() {
  const [projects, setProjects] = useState<ProjectItem[]>([])
  const [selectedProjectId, setSelectedProjectId] = useState<string>("")
  const [loadingProjects, setLoadingProjects] = useState(true)

  const [menus, setMenus] = useState<MenuItem[]>([])
  const [loadingMenus, setLoadingMenus] = useState(false)
  const [isUploading, setIsUploading] = useState(false)

  // Edit State
  const [editingMenu, setEditingMenu] = useState<{ id: string; items: string } | null>(null)
  const [editItems, setEditItems] = useState("")

  // New Menu Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [newDate, setNewDate] = useState(new Date().toISOString().split("T")[0])
  const [newItems, setNewItems] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Fetch Projects on Mount
  useEffect(() => {
    let isActive = true
    const fetchProjects = async () => {
      try {
        const response = await fetch("/api/admin/projects")
        if (response.ok && isActive) {
          const data: ProjectItem[] = await response.json()
          setProjects(data)
          // Default to first project if available
          if (data.length > 0) {
            setSelectedProjectId(data[0].id)
          }
        }
      } catch (err) {
        console.error("Projeler yüklenirken hata:", err)
      } finally {
        if (isActive) setLoadingProjects(false)
      }
    }

    void fetchProjects()
    return () => { isActive = false }
  }, [])

  // Fetch Menus for Selected Project
  const fetchMenus = useCallback(async (projId: string) => {
    if (!projId) {
      setMenus([])
      return
    }
    setLoadingMenus(true)
    try {
      const response = await fetch(`/api/admin/food-menu?projectId=${encodeURIComponent(projId)}`)
      if (response.ok) {
        const data = await response.json()
        setMenus(data.menus || [])
      } else {
        setMenus([])
      }
    } catch (error) {
      console.error("Menüler alınamadı:", error)
      toast.error("Menüler yüklenirken hata oluştu")
    } finally {
      setLoadingMenus(false)
    }
  }, [])

  useEffect(() => {
    if (selectedProjectId) {
      void fetchMenus(selectedProjectId)
    } else {
      setMenus([])
    }
  }, [selectedProjectId, fetchMenus])

  // Handle Excel File Upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!selectedProjectId) {
      toast.error("Lütfen önce bir proje seçiniz!")
      return
    }

    setIsUploading(true)
    const formData = new FormData()
    formData.append("file", file)
    formData.append("projectId", selectedProjectId)

    try {
      const result = await uploadMenuExcel(formData)
      if (result.success) {
        toast.success(`Seçili proje için ${result.count} günlük menü başarıyla yüklendi!`)
        fetchMenus(selectedProjectId)
      } else {
        toast.error(result.error || "Yükleme başarısız")
      }
    } catch (error) {
      console.error("Upload error:", error)
      toast.error("Dosya yüklenirken hata oluştu")
    } finally {
      setIsUploading(false)
      // Reset input value so same file can be reselected
      e.target.value = ""
    }
  }

  // Handle Delete Menu
  const handleDelete = async (id: string) => {
    if (!confirm("Bu menüyü silmek istediğinize emin misiniz?")) return

    try {
      const res = await deleteFoodMenuAction(id)
      if (res.success) {
        toast.success("Menü silindi")
        fetchMenus(selectedProjectId)
      } else {
        toast.error(res.error || "Silme başarısız")
      }
    } catch (error) {
      console.error("Delete error:", error)
      toast.error("Silme hatası")
    }
  }

  // Handle Edit Menu
  const handleEdit = (menu: MenuItem) => {
    setEditingMenu({ id: menu.id, items: menu.items })
    setEditItems(menu.items)
  }

  const handleSaveEdit = async () => {
    if (!editingMenu) return

    try {
      const result = await updateFoodMenu(editingMenu.id, editItems)
      if (result.success) {
        toast.success("Menü güncellendi")
        setEditingMenu(null)
        setEditItems("")
        fetchMenus(selectedProjectId)
      } else {
        toast.error(result.error || "Güncelleme başarısız")
      }
    } catch (error) {
      console.error("Update error:", error)
      toast.error("Güncelleme hatası")
    }
  }

  // Handle Manual Add Menu
  const handleCreateManualMenu = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedProjectId) {
      toast.error("Lütfen önce bir proje seçiniz")
      return
    }
    if (!newDate || !newItems.trim()) {
      toast.error("Tarih ve menü içeriği zorunludur")
      return
    }

    setIsSubmitting(true)
    try {
      const result = await createFoodMenu(selectedProjectId, newDate, newItems)
      if (result.success) {
        toast.success("Menü başarıyla eklendi")
        setIsAddModalOpen(false)
        setNewItems("")
        fetchMenus(selectedProjectId)
      } else {
        toast.error(result.error || "Menü eklenemedi")
      }
    } catch (err) {
      console.error("Manual add error:", err)
      toast.error("Menü eklenirken hata oluştu")
    } finally {
      setIsSubmitting(false)
    }
  }

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString("tr-TR", { 
        weekday: "short",
        day: "2-digit", 
        month: "2-digit", 
        year: "numeric" 
      })
    } catch {
      return dateString
    }
  }

  const selectedProject = projects.find(p => p.id === selectedProjectId)
  const selectedProjectName = selectedProject?.title || selectedProject?.name || "Seçili Şantiye"

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Top Header & Project Selector Component */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-orange-500/20 text-orange-400 border border-orange-500/30 flex items-center justify-center">
                <Utensils className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                  Proje Bazlı Yemek Menüsü
                </h1>
                <p className="text-xs text-slate-400">
                  Şantiye personeli için günlük yemek çizelgesi ve toplu Excel yükleme
                </p>
              </div>
            </div>
          </div>

          {/* Project Selector (Açılır Menü) */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="relative min-w-[260px] bg-slate-800/90 border border-slate-700 rounded-xl px-3.5 py-2 shadow-sm hover:border-slate-600 transition">
              <div className="flex items-center gap-2 mb-0.5">
                <Building2 className="w-4 h-4 text-orange-400 shrink-0" />
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Şantiye / Proje Seçiniz
                </span>
              </div>
              <div className="flex items-center justify-between">
                <select
                  value={selectedProjectId}
                  onChange={(e) => setSelectedProjectId(e.target.value)}
                  disabled={loadingProjects}
                  className="w-full bg-transparent text-sm font-semibold text-white focus:outline-none cursor-pointer appearance-none pr-6"
                >
                  <option value="" disabled className="bg-slate-900 text-slate-400">
                    -- Lütfen Proje Seçiniz --
                  </option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id} className="bg-slate-900 text-white">
                      {p.title || p.name} {p.city ? `(${p.city})` : ""}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 text-slate-400 pointer-events-none absolute right-3 bottom-2.5" />
              </div>
            </div>

            {/* Manual Add Button */}
            <button
              onClick={() => {
                if (!selectedProjectId) {
                  toast.error("Lütfen önce bir proje seçiniz!")
                  return
                }
                setIsAddModalOpen(true)
              }}
              disabled={!selectedProjectId}
              className="flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-xl transition text-sm font-semibold shadow-lg shadow-blue-600/20 whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              Tekil Menü Ekle
            </button>
          </div>
        </div>

        {/* Selected Project Status Banner */}
        {selectedProjectId ? (
          <div className="mt-4 pt-3.5 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-300">
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Aktif Proje: <strong className="text-white font-semibold">{selectedProjectName}</strong>
            </span>
            <span className="font-mono text-slate-400">
              Kayıtlı Menü: <strong className="text-white">{menus.length} Gün</strong>
            </span>
          </div>
        ) : (
          <div className="mt-4 pt-3.5 border-t border-slate-800/80 flex items-center gap-2 text-xs text-amber-400 bg-amber-500/10 p-2.5 rounded-lg border border-amber-500/20">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>Excel yüklemek ve mevcut menüleri görüntülemek için lütfen yukarıdan bir proje seçiniz.</span>
          </div>
        )}
      </div>

      {/* Upload Section (Excel) */}
      <div className={`bg-slate-900 border border-slate-800 rounded-2xl p-6 transition-opacity ${!selectedProjectId ? "opacity-50 pointer-events-none" : ""}`}>
        <div className="flex items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <FileSpreadsheet className="w-6 h-6 text-green-400" />
            <div>
              <h2 className="text-lg sm:text-xl font-semibold text-white">Toplu Excel Menü Yükleme</h2>
              <p className="text-xs text-slate-400">
                Seçili şantiye (<span className="text-green-400 font-medium">{selectedProjectName}</span>) için menü tablosu yükleyin
              </p>
            </div>
          </div>
        </div>

        <div className="bg-slate-800/50 border border-slate-700/80 rounded-xl p-4 mb-4">
          <p className="text-slate-300 text-xs sm:text-sm mb-1.5">
            <strong className="text-white">Excel Formatı:</strong> A Sütunu: Tarih (GG.AA.YYYY), B Sütunu: Yemek Listesi
          </p>
          <p className="text-slate-400 text-xs font-mono">
            Örnek: A2: "14.10.2026" | B2: "Mercimek Çorbası, Orman Kebabı, Pirinç Pilavı, Cacık"
          </p>
        </div>

        <div>
          <label className="block w-full">
            <div className={`flex items-center justify-center gap-3 px-6 py-4 rounded-xl cursor-pointer transition-all font-medium shadow-lg ${
              !selectedProjectId 
                ? "bg-slate-800 text-slate-500 cursor-not-allowed"
                : "bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white shadow-emerald-600/20"
            }`}>
              {isUploading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Excel İşleniyor ve Menüler Kaydediliyor...
                </>
              ) : (
                <>
                  <Upload className="w-5 h-5" />
                  <span>{selectedProjectId ? `"${selectedProjectName}" İçin Excel Dosyası Seç (.xlsx, .xls)` : "Önce Proje Seçiniz"}</span>
                </>
              )}
            </div>
            <input
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileUpload}
              disabled={isUploading || !selectedProjectId}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {/* Menus Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <Calendar className="w-6 h-6 text-blue-400" />
            <div>
              <h2 className="text-lg sm:text-xl font-semibold text-white">Mevcut Menüler</h2>
              <p className="text-xs text-slate-400">
                {selectedProjectId ? `"${selectedProjectName}" şantiyesine ait kayıtlı yemek listesi` : "Proje seçilmedi"}
              </p>
            </div>
          </div>
          {selectedProjectId && (
            <span className="text-xs px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 font-mono">
              {menus.length} Kayıt
            </span>
          )}
        </div>

        {!selectedProjectId ? (
          <div className="py-12 flex flex-col items-center justify-center text-center text-slate-400">
            <AlertCircle className="w-10 h-10 text-amber-400 mb-2" />
            <p className="text-sm font-medium text-white mb-1">Henüz Proje Seçilmedi</p>
            <p className="text-xs text-slate-400 max-w-sm">
              Yemek menülerini incelemek veya yeni menü girmek için lütfen sayfanın üst kısmındaki menüden bir proje seçiniz.
            </p>
          </div>
        ) : loadingMenus ? (
          <div className="py-12 flex flex-col items-center justify-center text-center text-slate-400">
            <Loader2 className="w-8 h-8 text-blue-400 animate-spin mb-2" />
            <p className="text-xs">Menüler yükleniyor...</p>
          </div>
        ) : (
          <div className="w-full overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-slate-700">
            <table className="w-full min-w-[600px]">
              <thead>
                <tr className="border-b border-slate-800 text-xs text-slate-400 uppercase tracking-wider">
                  <th className="text-left py-3.5 px-4 font-semibold w-48">Tarih</th>
                  <th className="text-left py-3.5 px-4 font-semibold">Günün Menüsü</th>
                  <th className="text-right py-3.5 px-4 font-semibold w-28">İşlemler</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-sm">
                {menus.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="text-center py-10 text-slate-500">
                      <Utensils className="w-8 h-8 mx-auto text-slate-600 mb-2" />
                      Bu proje için henüz menü girilmedi. Excel yükleyebilir veya "Tekil Menü Ekle" butonunu kullanabilirsiniz.
                    </td>
                  </tr>
                ) : (
                  menus.map((menu) => (
                    <tr key={menu.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3.5 px-4 font-medium text-white whitespace-nowrap">
                        <span className="flex items-center gap-2">
                          <CalendarDays className="w-4 h-4 text-blue-400 shrink-0" />
                          {formatDate(menu.date)}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-200">
                        {editingMenu?.id === menu.id ? (
                          <input
                            type="text"
                            value={editItems}
                            onChange={(e) => setEditItems(e.target.value)}
                            className="w-full px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500 text-sm"
                            autoFocus
                          />
                        ) : (
                          <div className="flex flex-wrap gap-1.5">
                            {menu.items.split(/[,;\n]/).map((item, idx) => {
                              const trimmed = item.trim()
                              if (!trimmed) return null
                              return (
                                <span 
                                  key={idx}
                                  className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-200 text-xs border border-slate-700/60"
                                >
                                  {trimmed}
                                </span>
                              )
                            })}
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {editingMenu?.id === menu.id ? (
                            <>
                              <button
                                onClick={handleSaveEdit}
                                title="Kaydet"
                                className="p-1.5 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 rounded-lg transition"
                              >
                                <CheckCircle className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => {
                                  setEditingMenu(null)
                                  setEditItems("")
                                }}
                                title="İptal"
                                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={() => handleEdit(menu)}
                                title="Düzenle"
                                className="p-1.5 text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 rounded-lg transition"
                              >
                                <Pencil className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDelete(menu.id)}
                                title="Sil"
                                className="p-1.5 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Manual Add Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl relative">
            <button
              onClick={() => setIsAddModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2.5 mb-4">
              <Utensils className="w-5 h-5 text-orange-400" />
              <h3 className="text-lg font-bold text-white">Yeni Yemek Menüsü Ekle</h3>
            </div>

            <p className="text-xs text-slate-400 mb-4">
              Proje: <strong className="text-white">{selectedProjectName}</strong>
            </p>

            <form onSubmit={handleCreateManualMenu} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Tarih
                </label>
                <input
                  type="date"
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Yemekler (Virgülle veya satır satır ayırınız)
                </label>
                <textarea
                  value={newItems}
                  onChange={(e) => setNewItems(e.target.value)}
                  placeholder="Örn: Ezogelin Çorba, Kuru Fasulye, Pirinç Pilavı, Turşu"
                  rows={3}
                  required
                  className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-blue-500 placeholder-slate-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-sm text-slate-400 hover:text-white transition"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-semibold transition disabled:opacity-50 flex items-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Kaydediliyor...
                    </>
                  ) : (
                    "Kaydet"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
