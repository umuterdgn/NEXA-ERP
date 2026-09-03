"use client"
/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * This code is the property of NXA Software.
 */


import { useState, useEffect } from "react"
import { toast } from "react-hot-toast"
import ConfirmModal from "@/components/ConfirmModal"

export default function EquipmentsPage() {
  const [equipments, setEquipments] = useState<any[]>([])
  const [projects, setProjects] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [editingEquipment, setEditingEquipment] = useState<any>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; id: string | null }>({ isOpen: false, id: null })
  
  const [formData, setFormData] = useState({
    name: "",
    type: "DIGER",
    status: "AKTIF",
    plateOrSerialNo: "",
    nextMaintenance: "",
    projectId: ""
  })

  useEffect(() => {
    fetchEquipments()
    fetchProjects()
  }, [])

  const fetchEquipments = async () => {
    try {
      const response = await fetch("/api/admin/equipments")
      if (response.ok) {
        const data = await response.json()
        console.error("Gelen Veri (Equipments):", data)
        setEquipments(Array.isArray(data) ? data : [])
      }
    } catch (error) {
      console.error("Failed to fetch equipments:", error)
      toast.error("Demirbaşlar yüklenirken hata oluştu")
    } finally {
      setIsLoading(false)
    }
  }

  const fetchProjects = async () => {
    try {
      const response = await fetch("/api/admin/projects")
      if (response.ok) {
        const data = await response.json()
        console.error("Gelen Veri (Projects):", data)
        setProjects(Array.isArray(data) ? data : [])
      }
    } catch (error) {
      console.error("Failed to fetch projects:", error)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name) {
      toast.error("Demirbaş adı zorunludur")
      return
    }

    setIsSubmitting(true)
    try {
      const url = editingEquipment ? "/api/admin/equipments" : "/api/admin/equipments"
      const method = editingEquipment ? "PUT" : "POST"
      const payload = editingEquipment ? { ...formData, id: editingEquipment.id } : formData

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      })

      if (response.ok) {
        toast.success(editingEquipment ? "Demirbaş başarıyla güncellendi" : "Demirbaş başarıyla eklendi")
        fetchEquipments()
        closeModal()
      } else {
        toast.error(editingEquipment ? "Demirbaş güncellenirken hata oluştu" : "Demirbaş eklenirken hata oluştu")
      }
    } catch (error) {
      toast.error(editingEquipment ? "Demirbaş güncellenirken hata oluştu" : "Demirbaş eklenirken hata oluştu")
    } finally {
      setIsSubmitting(false)
    }
  }

  const openModal = () => {
    setEditingEquipment(null)
    setFormData({
      name: "",
      type: "DIGER",
      status: "AKTIF",
      plateOrSerialNo: "",
      nextMaintenance: "",
      projectId: ""
    })
    setIsModalOpen(true)
  }

  const openEditModal = (equipment: any) => {
    setEditingEquipment(equipment)
    setFormData({
      name: equipment.name || "",
      type: equipment.type || "DIGER",
      status: equipment.status || "AKTIF",
      plateOrSerialNo: equipment.plateOrSerialNo || "",
      nextMaintenance: equipment.nextMaintenance ? new Date(equipment.nextMaintenance).toISOString().split('T')[0] : "",
      projectId: equipment.projectId || ""
    })
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setEditingEquipment(null)
    setFormData({
      name: "",
      type: "DIGER",
      status: "AKTIF",
      plateOrSerialNo: "",
      nextMaintenance: "",
      projectId: ""
    })
  }

  const handleDelete = async (id: string) => {
    setDeleteConfirm({ isOpen: true, id })
  }

  const confirmDelete = async () => {
    if (!deleteConfirm.id) return

    try {
      const response = await fetch(`/api/admin/equipments?id=${deleteConfirm.id}`, {
        method: "DELETE"
      })
      if (response.ok) {
        toast.success("Demirbaş başarıyla silindi")
        fetchEquipments()
      } else {
        toast.error("Demirbaş silinirken hata oluştu")
      }
    } catch (error) {
      toast.error("Demirbaş silinirken hata oluştu")
    }
  }

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "ARAC": return "Araç"
      case "IS_MAKINESI": return "İş Makinesi"
      case "ELEKTRONIK": return "Elektronik"
      case "DIGER": return "Diğer"
      default: return type
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "AKTIF": return "Aktif"
      case "BAKIMDA": return "Bakımda"
      case "ARIZALI": return "Arızalı"
      default: return status
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "AKTIF": return "bg-green-900/50 text-green-400"
      case "BAKIMDA": return "bg-yellow-900/50 text-yellow-400"
      case "ARIZALI": return "bg-red-900/50 text-red-400"
      default: return "bg-slate-900/50 text-slate-400"
    }
  }

  if (isLoading) {
    return (
      <div className="lg:mt-0 mt-16">
        <div className="text-white">Yükleniyor...</div>
      </div>
    )
  }

  return (
    <div className="lg:mt-0 mt-16 p-6">
      <div className="flex flex-wrap gap-4 justify-between items-center mb-8">
        <h1 className="text-2xl lg:text-3xl font-bold text-white">
          Demirbaş Yönetimi
        </h1>
        <button
          onClick={openModal}
          className="w-full md:w-auto px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-colors whitespace-nowrap"
        >
          Yeni Demirbaş Ekle
        </button>
      </div>

      {/* Equipments Table */}
      <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
        <div className="w-full overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
          <table className="w-full min-w-max">
            <thead className="bg-slate-800">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-medium text-slate-300">Adı</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-slate-300">Tipi</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-slate-300">Plaka/Seri No</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-slate-300">Durumu</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-slate-300">Bakım Tarihi</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-slate-300">Proje/Şantiye</th>
                <th className="px-6 py-3 text-right text-sm font-medium text-slate-300">İşlemler</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {equipments.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                    Demirbaş kaydı bulunamadı
                  </td>
                </tr>
              ) : (
                (Array.isArray(equipments) ? equipments : []).map((equipment) => (
                  <tr key={equipment.id}>
                    <td className="px-6 py-4 text-sm text-white font-medium">{equipment.name}</td>
                    <td className="px-6 py-4 text-sm text-slate-400">{getTypeLabel(equipment.type)}</td>
                    <td className="px-6 py-4 text-sm text-slate-400">{equipment.plateOrSerialNo || "-"}</td>
                    <td className="px-6 py-4 text-sm">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(equipment.status)}`}>
                        {getStatusLabel(equipment.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-400">
                      {equipment.nextMaintenance 
                        ? new Date(equipment.nextMaintenance).toLocaleDateString("tr-TR")
                        : "-"
                      }
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-400">
                      {equipment.project?.name || equipment.project?.title || "-"}
                    </td>
                    <td className="px-6 py-4 text-sm text-right space-x-2">
                      <button
                        onClick={() => openEditModal(equipment)}
                        className="text-blue-400 hover:text-blue-300"
                      >
                        Düzenle
                      </button>
                      <button
                        onClick={() => handleDelete(equipment.id)}
                        className="text-red-400 hover:text-red-300"
                      >
                        Sil
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-slate-900 rounded-xl p-6 border border-slate-800 w-full max-w-lg mx-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-semibold text-white mb-6">
              {editingEquipment ? "Demirbaş Düzenle" : "Yeni Demirbaş Ekle"}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Demirbaş Adı *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-slate-500"
                  placeholder="Demirbaş adı..."
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Tipi</label>
                <select
                  name="type"
                  value={formData.type}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                >
                  <option value="ARAC">Araç</option>
                  <option value="IS_MAKINESI">İş Makinesi</option>
                  <option value="ELEKTRONIK">Elektronik</option>
                  <option value="DIGER">Diğer</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Plaka/Seri No</label>
                <input
                  type="text"
                  name="plateOrSerialNo"
                  value={formData.plateOrSerialNo}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-slate-500"
                  placeholder="Plaka veya seri numarası..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Durumu</label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                >
                  <option value="AKTIF">Aktif</option>
                  <option value="BAKIMDA">Bakımda</option>
                  <option value="ARIZALI">Arızalı</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Sonraki Bakım Tarihi</label>
                <input
                  type="date"
                  name="nextMaintenance"
                  value={formData.nextMaintenance}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Proje/Şantiye</label>
                <select
                  name="projectId"
                  value={formData.projectId}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                >
                  <option value="">Proje Seçin</option>
                  {(Array.isArray(projects) ? projects : []).map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.name || project.title}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors"
                  disabled={isSubmitting}
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-colors"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Kaydediliyor..." : "Kaydet"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm({ isOpen: false, id: null })}
        onConfirm={confirmDelete}
        title="Demirbaşı Sil"
        message="Bu demirbaşı silmek istediğinize emin misiniz? Bu işlem geri alınamaz."
        confirmText="Sil"
        cancelText="İptal"
        type="danger"
      />
    </div>
  );
}
