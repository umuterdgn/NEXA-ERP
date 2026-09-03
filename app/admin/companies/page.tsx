"use client"
/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * This code is the property of NXA Software.
 */

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { toast } from "react-hot-toast"
import { Building2, Plus, Edit, Trash2, Users, X } from "lucide-react"

export default function CompaniesPage() {
  const router = useRouter()
  const { data: session, status } = useSession()
  
  const [companies, setCompanies] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [selectedCompany, setSelectedCompany] = useState<any>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [formData, setFormData] = useState({
    name: "",
    type: "SUBCONTRACTOR",
    contactName: "",
    phone: "",
    email: "",
    taxNumber: "",
    taxOffice: ""
  })

  // Role-based access control
  useEffect(() => {
    if (status === "loading") return
    
    const userRole = session?.user?.role
    const isAdmin = userRole === "SUPER_ADMIN" || userRole === "ADMIN"
    
    if (!isAdmin) {
      router.push("/admin/dashboard")
      toast.error("Bu sayfaya erişim yetkiniz yok")
    }
  }, [status, session, router])

  useEffect(() => {
    const userRole = session?.user?.role
    const isAdmin = userRole === "SUPER_ADMIN" || userRole === "ADMIN"
    
    if (!isAdmin) return
    
    fetchCompanies()
  }, [session])

  const fetchCompanies = async () => {
    try {
      const response = await fetch("/api/admin/companies")
      const data = await response.json()
      setCompanies(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error("Failed to fetch companies:", error)
      toast.error("Firmalar yüklenirken hata oluştu")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name.trim()) {
      toast.error("Firma adı zorunludur")
      return
    }

    setIsSubmitting(true)

    try {
      const url = isEditing ? `/api/admin/companies/${selectedCompany.id}` : "/api/admin/companies"
      const method = isEditing ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        toast.success(isEditing ? "Firma güncellendi" : "Firma eklendi")
        setIsModalOpen(false)
        resetForm()
        fetchCompanies()
      } else {
        throw new Error("İşlem başarısız")
      }
    } catch (error) {
      console.error("Company save error:", error)
      toast.error("İşlem sırasında hata oluştu")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEdit = (company: any) => {
    setSelectedCompany(company)
    setFormData({
      name: company.name,
      type: company.type,
      contactName: company.contactName || "",
      phone: company.phone || "",
      email: company.email || "",
      taxNumber: company.taxNumber || "",
      taxOffice: company.taxOffice || ""
    })
    setIsEditing(true)
    setIsModalOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm("Bu firmayı silmek istediğinize emin misiniz?")) {
      return
    }

    try {
      const response = await fetch(`/api/admin/companies/${id}`, { method: "DELETE" })
      
      if (response.ok) {
        toast.success("Firma silindi")
        fetchCompanies()
      } else {
        throw new Error("Silme işlemi başarısız")
      }
    } catch (error) {
      console.error("Delete error:", error)
      toast.error("Silme işlemi sırasında hata oluştu")
    }
  }

  const resetForm = () => {
    setFormData({
      name: "",
      type: "SUBCONTRACTOR",
      contactName: "",
      phone: "",
      email: "",
      taxNumber: "",
      taxOffice: ""
    })
    setIsEditing(false)
    setSelectedCompany(null)
  }

  const getCompanyTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      MAIN_CONTRACTOR: "Ana Firma",
      SUBCONTRACTOR: "Taşeron",
      SUPPLIER: "Tedarikçi",
      CLIENT: "Müşteri"
    }
    return labels[type] || type
  }

  const getCompanyTypeBadge = (type: string) => {
    const badges: Record<string, { bg: string; text: string }> = {
      MAIN_CONTRACTOR: { bg: "bg-blue-500/20", text: "text-blue-400" },
      SUBCONTRACTOR: { bg: "bg-purple-500/20", text: "text-purple-400" },
      SUPPLIER: { bg: "bg-green-500/20", text: "text-green-400" },
      CLIENT: { bg: "bg-orange-500/20", text: "text-orange-400" }
    }
    const badge = badges[type] || badges.SUBCONTRACTOR
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium ${badge.bg} ${badge.text}`}>
        {getCompanyTypeLabel(type)}
      </span>
    )
  }

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="text-center py-12 text-slate-400">Yükleniyor...</div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="flex flex-wrap gap-4 justify-between items-center mb-8">
        <h1 className="text-2xl lg:text-3xl font-bold text-white">
          Firma Yönetimi
        </h1>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors whitespace-nowrap"
        >
          <Plus className="w-5 h-5" />
          Yeni Firma Ekle
        </button>
      </div>

      <div className="bg-slate-900/50 backdrop-blur-lg rounded-2xl border border-slate-800 overflow-hidden">
        <div className="w-full overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
          <table className="w-full min-w-max">
            <thead>
              <tr className="border-b border-slate-800">
                <th className="text-left px-6 py-4 text-slate-400 font-medium text-sm">Firma Adı</th>
                <th className="text-left px-6 py-4 text-slate-400 font-medium text-sm">Tip</th>
                <th className="text-left px-6 py-4 text-slate-400 font-medium text-sm">İletişim Kişisi</th>
                <th className="text-left px-6 py-4 text-slate-400 font-medium text-sm">Telefon</th>
                <th className="text-left px-6 py-4 text-slate-400 font-medium text-sm">Personel Sayısı</th>
                <th className="text-left px-6 py-4 text-slate-400 font-medium text-sm">İşlemler</th>
              </tr>
            </thead>
            <tbody>
              {companies.map((company) => (
                <tr key={company.id} className="border-b border-slate-800 hover:bg-slate-800/50 transition-colors">
                  <td className="px-6 py-4 text-white font-medium">{company.name}</td>
                  <td className="px-6 py-4">{getCompanyTypeBadge(company.type)}</td>
                  <td className="px-6 py-4 text-slate-300">{company.contactName || "-"}</td>
                  <td className="px-6 py-4 text-slate-300">{company.phone || "-"}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-slate-300">
                      <Users className="w-4 h-4" />
                      {company._count?.personnel || 0}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleEdit(company)}
                        className="inline-flex items-center justify-center px-3 py-1.5 bg-amber-600 text-white text-xs rounded-md hover:bg-amber-700 transition-colors"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(company.id)}
                        className="inline-flex items-center justify-center px-3 py-1.5 bg-red-600 text-white text-xs rounded-md hover:bg-red-700 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {companies.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                    Henüz firma kaydı yok
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 rounded-2xl border border-slate-800 w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-slate-800">
              <h2 className="text-xl font-bold text-white">
                {isEditing ? "Firma Düzenle" : "Yeni Firma Ekle"}
              </h2>
              <button
                onClick={() => {
                  setIsModalOpen(false)
                  resetForm()
                }}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-slate-400 text-sm mb-2">Firma Adı *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-slate-400 text-sm mb-2">Firma Tipi</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="SUBCONTRACTOR">Taşeron</option>
                  <option value="SUPPLIER">Tedarikçi</option>
                  <option value="CLIENT">Müşteri</option>
                  <option value="MAIN_CONTRACTOR">Ana Firma</option>
                </select>
              </div>
              <div>
                <label className="block text-slate-400 text-sm mb-2">İletişim Kişisi</label>
                <input
                  type="text"
                  value={formData.contactName}
                  onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-slate-400 text-sm mb-2">Telefon</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-slate-400 text-sm mb-2">E-posta</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-slate-400 text-sm mb-2">Vergi No</label>
                <input
                  type="text"
                  value={formData.taxNumber}
                  onChange={(e) => setFormData({ ...formData, taxNumber: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-slate-400 text-sm mb-2">Vergi Dairesi</label>
                <input
                  type="text"
                  value={formData.taxOffice}
                  onChange={(e) => setFormData({ ...formData, taxOffice: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                />
              </div>
            </form>
            <div className="p-6 border-t border-slate-800 flex justify-end gap-3">
              <button
                onClick={() => {
                  setIsModalOpen(false)
                  resetForm()
                }}
                className="px-4 py-2 text-slate-400 hover:text-white transition-colors"
              >
                İptal
              </button>
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? "Kaydediliyor..." : "Kaydet"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
