"use client"
/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * This code is the property of NXA Software.
 */


import { useState, useEffect } from "react"
import { toast } from "react-hot-toast"

export default function CRMPage() {
  const [companies, setCompanies] = useState<any[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [editingCompany, setEditingCompany] = useState<any>(null)
  
  const [formData, setFormData] = useState({
    name: "",
    type: "MUSTERI",
    contactName: "",
    phone: "",
    email: "",
    taxNumber: "",
    taxOffice: ""
  })

  useEffect(() => {
    fetchCompanies()
  }, [])

  const fetchCompanies = async () => {
    try {
      const response = await fetch("/api/admin/crm")
      if (response.ok) {
        const data = await response.json()
        setCompanies(data)
      }
    } catch (error) {
      console.error("Failed to fetch companies:", error)
      toast.error("Firmalar yüklenirken hata oluştu")
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name || !formData.type) {
      toast.error("Firma adı ve tipi zorunludur")
      return
    }

    setIsSubmitting(true)
    try {
      const url = editingCompany 
        ? `/api/admin/crm/${editingCompany.id}`
        : "/api/admin/crm"
      const method = editingCompany ? "PATCH" : "POST"

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        toast.success(editingCompany ? "Firma başarıyla güncellendi" : "Firma başarıyla eklendi")
        fetchCompanies()
        closeModal()
      } else {
        toast.error(editingCompany ? "Firma güncellenirken hata oluştu" : "Firma eklenirken hata oluştu")
      }
    } catch (error) {
      toast.error(editingCompany ? "Firma güncellenirken hata oluştu" : "Firma eklenirken hata oluştu")
    } finally {
      setIsSubmitting(false)
    }
  }

  const openModal = () => {
    setEditingCompany(null)
    setFormData({
      name: "",
      type: "MUSTERI",
      contactName: "",
      phone: "",
      email: "",
      taxNumber: "",
      taxOffice: ""
    })
    setIsModalOpen(true)
  }

  const openEditModal = (company: any) => {
    setEditingCompany(company)
    setFormData({
      name: company.name || "",
      type: company.type || "MUSTERI",
      contactName: company.contactName || "",
      phone: company.phone || "",
      email: company.email || "",
      taxNumber: company.taxNumber || "",
      taxOffice: company.taxOffice || ""
    })
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setEditingCompany(null)
    setFormData({
      name: "",
      type: "MUSTERI",
      contactName: "",
      phone: "",
      email: "",
      taxNumber: "",
      taxOffice: ""
    })
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Bu firmayı silmek istediğinize emin misiniz?")) {
      return
    }

    try {
      const response = await fetch(`/api/admin/crm/${id}`, {
        method: "DELETE"
      })

      if (response.ok) {
        toast.success("Firma başarıyla silindi")
        fetchCompanies()
      } else {
        toast.error("Firma silinirken hata oluştu")
      }
    } catch (error) {
      toast.error("Firma silinirken hata oluştu")
    }
  }

  const getCompanyTypeLabel = (type: string) => {
    switch (type) {
      case "MUSTERI": return "Müşteri"
      case "TASERON": return "Taşeron"
      case "TEDARIKCI": return "Tedarikçi"
      default: return type
    }
  }

  const getCompanyTypeColor = (type: string) => {
    switch (type) {
      case "MUSTERI": return "bg-blue-900/50 text-blue-400"
      case "TASERON": return "bg-yellow-900/50 text-yellow-400"
      case "TEDARIKCI": return "bg-purple-900/50 text-purple-400"
      default: return "bg-slate-900/50 text-slate-400"
    }
  }

  return (
    <div className="lg:mt-0 mt-16">
      <div className="flex flex-wrap gap-4 justify-between items-center mb-8">
        <h1 className="text-2xl lg:text-3xl font-bold text-white">
          Firma ve Müşteri Yönetimi
        </h1>
        <button
          onClick={openModal}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-colors whitespace-nowrap"
        >
          Yeni Firma Ekle
        </button>
      </div>

      {/* Companies Table */}
      <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
        <div className="w-full overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
          <table className="w-full min-w-max">
          <thead className="bg-slate-800">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-medium text-slate-300">Firma Adı</th>
              <th className="px-6 py-3 text-left text-sm font-medium text-slate-300">Tipi</th>
              <th className="px-6 py-3 text-left text-sm font-medium text-slate-300">Yetkili</th>
              <th className="px-6 py-3 text-left text-sm font-medium text-slate-300">Telefon</th>
              <th className="px-6 py-3 text-right text-sm font-medium text-slate-300">İşlemler</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {isLoading ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                  Yükleniyor...
                </td>
              </tr>
            ) : companies.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                  Firma kaydı bulunamadı
                </td>
              </tr>
            ) : (
              companies.map((company) => (
                <tr key={company.id}>
                  <td className="px-6 py-4 text-sm text-white font-medium">{company.name}</td>
                  <td className="px-6 py-4 text-sm">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCompanyTypeColor(company.type)}`}>
                      {getCompanyTypeLabel(company.type)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-400">{company.contactName || "-"}</td>
                  <td className="px-6 py-4 text-sm text-slate-400">{company.phone || "-"}</td>
                  <td className="px-6 py-4 text-right text-sm space-x-2">
                    <button 
                      onClick={() => openEditModal(company)}
                      className="text-blue-400 hover:text-blue-300"
                    >
                      Düzenle
                    </button>
                    <button 
                      onClick={() => handleDelete(company.id)}
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
              {editingCompany ? "Firma Düzenle" : "Yeni Firma Ekle"}
            </h3>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Firma Adı *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-slate-500"
                  placeholder="Firma adı..."
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Firma Tipi *
                </label>
                <select
                  name="type"
                  value={formData.type}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                  required
                >
                  <option value="MUSTERI">Müşteri</option>
                  <option value="TASERON">Taşeron</option>
                  <option value="TEDARIKCI">Tedarikçi</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Yetkili Kişi
                </label>
                <input
                  type="text"
                  name="contactName"
                  value={formData.contactName}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-slate-500"
                  placeholder="Yetkili kişi..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Telefon
                </label>
                <input
                  type="text"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-slate-500"
                  placeholder="Telefon..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  E-posta
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-slate-500"
                  placeholder="E-posta..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Vergi Dairesi
                </label>
                <input
                  type="text"
                  name="taxOffice"
                  value={formData.taxOffice}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-slate-500"
                  placeholder="Vergi dairesi..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Vergi No
                </label>
                <input
                  type="text"
                  name="taxNumber"
                  value={formData.taxNumber}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-slate-500"
                  placeholder="Vergi numarası..."
                />
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
    </div>
  )
}
