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
import { Users, Plus, Edit, Trash2, X, Building2 } from "lucide-react"

export default function MyTeamPage() {
  const router = useRouter()
  const { data: session, status } = useSession()
  
  const [personnel, setPersonnel] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [selectedPerson, setSelectedPerson] = useState<any>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [userCompanyId, setUserCompanyId] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    name: "",
    personnelNo: "",
    tcNo: "",
    age: "",
    birthDate: "",
    gender: "",
    phone: "",
    email: "",
    department: "",
    position: "",
    currentSite: "",
    hireDate: "",
    salary: "",
    gunlukYevmiye: ""
  })

  // Role-based access control - only subcontractors can access this page
  useEffect(() => {
    if (status === "loading") return
    
    const userRole = session?.user?.role as string
    const isSubcontractor = userRole === "SUBCONTRACTOR"
    
    if (!isSubcontractor) {
      router.push("/admin/dashboard")
      toast.error("Bu sayfaya sadece taşeronlar erişebilir")
    }
  }, [status, session, router])

  useEffect(() => {
    const userRole = session?.user?.role as string
    const isSubcontractor = userRole === "SUBCONTRACTOR"
    
    if (!isSubcontractor) return
    
    // Get user's company ID from session or fetch it
    const companyId = (session?.user as any)?.companyId
    if (companyId) {
      setUserCompanyId(companyId)
      fetchPersonnel(companyId)
    } else {
      // If no companyId in session, try to fetch from API
      fetchUserCompanyId()
    }
  }, [session])

  const fetchUserCompanyId = async () => {
    try {
      const response = await fetch("/api/admin/my-team/company-id")
      if (response.ok) {
        const data = await response.json()
        setUserCompanyId(data.companyId)
        if (data.companyId) {
          fetchPersonnel(data.companyId)
        }
      }
    } catch (error) {
      console.error("Failed to fetch company ID:", error)
    }
  }

  const fetchPersonnel = async (companyId: string) => {
    try {
      const response = await fetch(`/api/admin/my-team?companyId=${companyId}`)
      const data = await response.json()
      setPersonnel(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error("Failed to fetch personnel:", error)
      toast.error("Personel listesi yüklenirken hata oluştu")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name.trim()) {
      toast.error("Personel adı zorunludur")
      return
    }

    setIsSubmitting(true)

    try {
      const url = isEditing ? `/api/admin/my-team/${selectedPerson.id}` : "/api/admin/my-team"
      const method = isEditing ? "PUT" : "POST"

      const payload = {
        ...formData,
        companyId: userCompanyId, // Automatically set to subcontractor's company
        age: formData.age ? parseInt(formData.age) : null,
        salary: formData.salary ? parseFloat(formData.salary) : null,
        gunlukYevmiye: formData.gunlukYevmiye ? parseFloat(formData.gunlukYevmiye) : null
      }

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      })

      if (response.ok) {
        toast.success(isEditing ? "Personel güncellendi" : "Personel eklendi")
        setIsModalOpen(false)
        resetForm()
        if (userCompanyId) fetchPersonnel(userCompanyId)
      } else {
        throw new Error("İşlem başarısız")
      }
    } catch (error) {
      console.error("Personnel save error:", error)
      toast.error("İşlem sırasında hata oluştu")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEdit = (person: any) => {
    setSelectedPerson(person)
    setFormData({
      name: person.name,
      personnelNo: person.personnelNo || "",
      tcNo: person.tcNo || "",
      age: person.age?.toString() || "",
      birthDate: person.birthDate ? person.birthDate.split('T')[0] : "",
      gender: person.gender || "",
      phone: person.phone || "",
      email: person.email || "",
      department: person.department || "",
      position: person.position || "",
      currentSite: person.currentSite || "",
      hireDate: person.hireDate ? person.hireDate.split('T')[0] : "",
      salary: person.salary?.toString() || "",
      gunlukYevmiye: person.gunlukYevmiye?.toString() || ""
    })
    setIsEditing(true)
    setIsModalOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm("Bu personeli silmek istediğinize emin misiniz?")) {
      return
    }

    try {
      const response = await fetch(`/api/admin/my-team/${id}`, { method: "DELETE" })
      
      if (response.ok) {
        toast.success("Personel silindi")
        if (userCompanyId) fetchPersonnel(userCompanyId)
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
      personnelNo: "",
      tcNo: "",
      age: "",
      birthDate: "",
      gender: "",
      phone: "",
      email: "",
      department: "",
      position: "",
      currentSite: "",
      hireDate: "",
      salary: "",
      gunlukYevmiye: ""
    })
    setIsEditing(false)
    setSelectedPerson(null)
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
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <Users className="w-8 h-8 text-purple-400" />
            Benim Ekibim
          </h1>
          <p className="text-slate-400 mt-1">Firmanızın personel yönetimi</p>
        </div>
        <button
          onClick={() => {
            resetForm()
            setIsModalOpen(true)
          }}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg transition-colors whitespace-nowrap"
        >
          <Plus className="w-5 h-5" />
          Yeni Personel Ekle
        </button>
      </div>

      <div className="bg-slate-900/50 backdrop-blur-lg rounded-2xl border border-slate-800 overflow-hidden">
        <div className="w-full overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
          <table className="w-full min-w-max">
            <thead>
              <tr className="border-b border-slate-800">
                <th className="text-left px-6 py-4 text-slate-400 font-medium text-sm">Personel No</th>
                <th className="text-left px-6 py-4 text-slate-400 font-medium text-sm">Ad Soyad</th>
                <th className="text-left px-6 py-4 text-slate-400 font-medium text-sm">Departman</th>
                <th className="text-left px-6 py-4 text-slate-400 font-medium text-sm">Görev</th>
                <th className="text-left px-6 py-4 text-slate-400 font-medium text-sm">Şantiye</th>
                <th className="text-left px-6 py-4 text-slate-400 font-medium text-sm">Durum</th>
                <th className="text-left px-6 py-4 text-slate-400 font-medium text-sm">İşlemler</th>
              </tr>
            </thead>
            <tbody>
              {personnel.map((person) => (
                <tr key={person.id} className="border-b border-slate-800 hover:bg-slate-800/50 transition-colors">
                  <td className="px-6 py-4 text-slate-300">{person.personnelNo || "-"}</td>
                  <td className="px-6 py-4 text-white font-medium">{person.name}</td>
                  <td className="px-6 py-4 text-slate-300">{person.department}</td>
                  <td className="px-6 py-4 text-slate-300">{person.position || "-"}</td>
                  <td className="px-6 py-4 text-slate-300">{person.currentSite}</td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      person.status === "ACTIVE" 
                        ? "bg-green-500/20 text-green-400" 
                        : "bg-red-500/20 text-red-400"
                    }`}>
                      {person.status === "ACTIVE" ? "Aktif" : "Pasif"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleEdit(person)}
                        className="inline-flex items-center justify-center px-3 py-1.5 bg-amber-600 text-white text-xs rounded-md hover:bg-amber-700 transition-colors"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(person.id)}
                        className="inline-flex items-center justify-center px-3 py-1.5 bg-red-600 text-white text-xs rounded-md hover:bg-red-700 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {personnel.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                    Henüz personel kaydı yok
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
          <div className="bg-slate-900 rounded-2xl border border-slate-800 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-slate-800 sticky top-0 bg-slate-900 z-10">
              <h2 className="text-xl font-bold text-white">
                {isEditing ? "Personel Düzenle" : "Yeni Personel Ekle"}
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-400 text-sm mb-2">Ad Soyad *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-400 text-sm mb-2">Personel No</label>
                  <input
                    type="text"
                    value={formData.personnelNo}
                    onChange={(e) => setFormData({ ...formData, personnelNo: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 text-sm mb-2">TC Kimlik No</label>
                  <input
                    type="text"
                    value={formData.tcNo}
                    onChange={(e) => setFormData({ ...formData, tcNo: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 text-sm mb-2">Yaş</label>
                  <input
                    type="number"
                    value={formData.age}
                    onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 text-sm mb-2">Doğum Tarihi</label>
                  <input
                    type="date"
                    value={formData.birthDate}
                    onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 text-sm mb-2">Cinsiyet</label>
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-500"
                  >
                    <option value="">Seçiniz</option>
                    <option value="MALE">Erkek</option>
                    <option value="FEMALE">Kadın</option>
                    <option value="OTHER">Diğer</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 text-sm mb-2">Telefon</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 text-sm mb-2">E-posta</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 text-sm mb-2">Departman *</label>
                  <input
                    type="text"
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-400 text-sm mb-2">Görev/Ünvan</label>
                  <input
                    type="text"
                    value={formData.position}
                    onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 text-sm mb-2">Mevcut Şantiye *</label>
                  <input
                    type="text"
                    value={formData.currentSite}
                    onChange={(e) => setFormData({ ...formData, currentSite: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-400 text-sm mb-2">İşe Giriş Tarihi *</label>
                  <input
                    type="date"
                    value={formData.hireDate}
                    onChange={(e) => setFormData({ ...formData, hireDate: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-400 text-sm mb-2">Maaş</label>
                  <input
                    type="number"
                    value={formData.salary}
                    onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 text-sm mb-2">Günlük Yevmiye</label>
                  <input
                    type="number"
                    value={formData.gunlukYevmiye}
                    onChange={(e) => setFormData({ ...formData, gunlukYevmiye: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>
            </form>
            <div className="p-6 border-t border-slate-800 flex justify-end gap-3 sticky bottom-0 bg-slate-900">
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
                className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
