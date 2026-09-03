/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * This code is the property of NXA Software.
 */

"use client"

import { useState } from "react"
import { Upload, Calendar, Utensils, Trash2, FileSpreadsheet, Pencil, X, CheckCircle } from "lucide-react"
import { uploadMenuExcel, updateFoodMenu } from "./actions"
import { toast } from "react-hot-toast"

export default function FoodMenuPage() {
  const [isUploading, setIsUploading] = useState(false)
  const [menus, setMenus] = useState<any[]>([])
  const [editingMenu, setEditingMenu] = useState<{ id: string; items: string } | null>(null)
  const [editItems, setEditItems] = useState("")

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    const formData = new FormData()
    formData.append("file", file)

    try {
      const result = await uploadMenuExcel(formData)
      if (result.success) {
        toast.success(`Başarıyla ${result.count} menü yüklendi`)
        // Refresh menus
        fetchMenus()
      } else {
        toast.error(result.error || "Yükleme başarısız")
      }
    } catch (error) {
      console.error("Upload error:", error)
      toast.error("Dosya yüklenirken hata oluştu")
    } finally {
      setIsUploading(false)
    }
  }

  const fetchMenus = async () => {
    try {
      const response = await fetch("/api/admin/food-menu")
      const data = await response.json()
      setMenus(data.menus || [])
    } catch (error) {
      console.error("Fetch error:", error)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/admin/food-menu/${id}`, {
        method: "DELETE"
      })
      if (response.ok) {
        toast.success("Menü silindi")
        fetchMenus()
      } else {
        toast.error("Silme başarısız")
      }
    } catch (error) {
      console.error("Delete error:", error)
      toast.error("Silme hatası")
    }
  }

  const handleEdit = (menu: any) => {
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
        fetchMenus()
      } else {
        toast.error(result.error || "Güncelleme başarısız")
      }
    } catch (error) {
      console.error("Update error:", error)
      toast.error("Güncelleme hatası")
    }
  }

  // Fetch menus on mount
  useState(() => {
    fetchMenus()
  })

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("tr-TR", { day: "2-digit", month: "2-digit", year: "numeric" })
  }

  return (
    <div className="p-6">
      <div className="flex flex-wrap gap-4 justify-between items-center mb-8">
        <h1 className="text-2xl lg:text-3xl font-bold text-white">
          Yemek Menüsü
        </h1>
        <button
          onClick={() => console.log("openModal")}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-colors whitespace-nowrap"
        >
          Yeni Menü Ekle
        </button>
      </div>

      {/* Upload Section */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 mb-6">
        <div className="flex items-center gap-3 mb-4">
          <FileSpreadsheet className="w-6 h-6 text-green-400" />
          <h2 className="text-xl font-semibold text-white">Toplu Excel Yükle</h2>
        </div>

        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 mb-4">
          <p className="text-slate-300 text-sm mb-2">
            <strong className="text-white">Format:</strong> A Sütunu: Tarih (GG.AA.YYYY), B Sütunu: Menü
          </p>
          <p className="text-slate-400 text-xs">
            Örnek: A1: "22.08.2026", B1: "Köfte, Pilav, Salata, Ayva Tatlısı"
          </p>
        </div>

        <div className="flex items-center gap-4">
          <label className="flex-1">
            <div className="flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white rounded-xl cursor-pointer transition-all font-medium shadow-lg shadow-green-500/30">
              <Upload className="w-5 h-5" />
              {isUploading ? "Yükleniyor..." : "Excel Dosyası Seç"}
            </div>
            <input
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileUpload}
              disabled={isUploading}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {/* Menus Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <Calendar className="w-6 h-6 text-blue-400" />
          <h2 className="text-xl font-semibold text-white">Mevcut Menüler</h2>
        </div>

        <div className="w-full overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
          <table className="w-full min-w-max">
            <thead>
              <tr className="border-b border-slate-700">
                <th className="text-left py-3 px-4 text-slate-400 font-medium">Tarih</th>
                <th className="text-left py-3 px-4 text-slate-400 font-medium">Menü</th>
                <th className="text-right py-3 px-4 text-slate-400 font-medium">İşlemler</th>
              </tr>
            </thead>
            <tbody>
              {menus.length === 0 ? (
                <tr>
                  <td colSpan={3} className="text-center py-8 text-slate-500">
                    Henüz menü yüklenmedi
                  </td>
                </tr>
              ) : (
                menus.map((menu) => (
                  <tr key={menu.id} className="border-b border-slate-800 hover:bg-slate-800/50 transition-colors">
                    <td className="py-3 px-4 text-white">{formatDate(menu.date)}</td>
                    <td className="py-3 px-4 text-slate-300">
                      {editingMenu?.id === menu.id ? (
                        <input
                          type="text"
                          value={editItems}
                          onChange={(e) => setEditItems(e.target.value)}
                          className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                          autoFocus
                        />
                      ) : (
                        menu.items
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {editingMenu?.id === menu.id ? (
                          <>
                            <button
                              onClick={handleSaveEdit}
                              className="p-2 text-green-400 hover:text-green-300 hover:bg-green-500/10 rounded-lg transition-colors"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => {
                                setEditingMenu(null)
                                setEditItems("")
                              }}
                              className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => handleEdit(menu)}
                              className="p-2 text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 rounded-lg transition-colors"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(menu.id)}
                              className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
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
      </div>
    </div>
  )
}
