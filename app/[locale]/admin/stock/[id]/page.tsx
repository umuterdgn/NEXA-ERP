"use client"
/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * This code is the property of NXA Software.
 */


import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { toast } from "react-hot-toast"

export default function StockDetailPage({
  params
}: {
  params: Promise<{ id: string }>
}) {
  const [stock, setStock] = useState<any>(null)
  const [movements, setMovements] = useState<any[]>([])
  const [projects, setProjects] = useState<any[]>([])
  const [personnel, setPersonnel] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [resolvedParams, setResolvedParams] = useState<{ id: string } | null>(null)
  
  const [isEntryModalOpen, setIsEntryModalOpen] = useState(false)
  const [isExitModalOpen, setIsExitModalOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const [formData, setFormData] = useState({
    type: "GIRIS",
    quantity: "",
    description: "",
    date: "",
    projectId: "",
    personnelId: ""
  })

  const router = useRouter()

  useEffect(() => {
    const resolveParams = async () => {
      const p = await params
      setResolvedParams(p)
    }
    resolveParams()
  }, [params])

  const fetchStock = async () => {
    try {
      const response = await fetch(`/api/admin/stock/${resolvedParams?.id}`)
      if (response.ok) {
        const data = await response.json()
        setStock(data)
      }
    } catch (error) {
      console.error("Failed to fetch stock:", error)
    }
  }

  const fetchMovements = async () => {
    try {
      const response = await fetch(`/api/admin/stock/${resolvedParams?.id}/movements`)
      if (response.ok) {
        const data = await response.json()
        setMovements(data)
      }
    } catch (error) {
      console.error("Failed to fetch movements:", error)
    }
  }

  const fetchProjects = async () => {
    try {
      const response = await fetch("/api/admin/projects")
      if (response.ok) {
        const data = await response.json()
        setProjects(data)
      }
    } catch (error) {
      console.error("Failed to fetch projects:", error)
    }
  }

  const fetchPersonnel = async () => {
    try {
      const response = await fetch("/api/admin/personnel")
      if (response.ok) {
        const data = await response.json()
        setPersonnel(data)
      }
    } catch (error) {
      console.error("Failed to fetch personnel:", error)
    }
  }

  useEffect(() => {
    if (resolvedParams) {
      const fetchData = async () => {
        await Promise.all([fetchStock(), fetchMovements(), fetchProjects(), fetchPersonnel()])
        setLoading(false)
      }
      fetchData()
    }
  }, [resolvedParams])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.type || !formData.quantity) {
      toast.error("İşlem tipi ve miktar zorunludur")
      return
    }

    setIsSubmitting(true)
    try {
      const response = await fetch(`/api/admin/stock/${resolvedParams?.id}/movements`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        toast.success("Stok hareketi başarıyla eklendi")
        await Promise.all([fetchStock(), fetchMovements()])
        setIsEntryModalOpen(false)
        setIsExitModalOpen(false)
        setFormData({
          type: "GIRIS",
          quantity: "",
          description: "",
          date: "",
          projectId: "",
          personnelId: ""
        })
      } else {
        toast.error("Stok hareketi eklenirken hata oluştu")
      }
    } catch (error) {
      toast.error("Stok hareketi eklenirken hata oluştu")
    } finally {
      setIsSubmitting(false)
    }
  }

  const openEntryModal = () => {
    setFormData({
      type: "GIRIS",
      quantity: "",
      description: "",
      date: "",
      projectId: "",
      personnelId: ""
    })
    setIsEntryModalOpen(true)
  }

  const openExitModal = () => {
    setFormData({
      type: "CIKIS",
      quantity: "",
      description: "",
      date: "",
      projectId: "",
      personnelId: ""
    })
    setIsExitModalOpen(true)
  }

  const closeModals = () => {
    setIsEntryModalOpen(false)
    setIsExitModalOpen(false)
    setFormData({
      type: "GIRIS",
      quantity: "",
      description: "",
      date: "",
      projectId: "",
      personnelId: ""
    })
  }

  if (loading) {
    return (
      <div className="lg:mt-0 mt-16">
        <div className="text-white">Yükleniyor...</div>
      </div>
    )
  }

  if (!stock) {
    return (
      <div className="lg:mt-0 mt-16">
        <div className="text-white">Stok bulunamadı</div>
      </div>
    )
  }

  return (
    <div className="lg:mt-0 mt-16">
      <div className="mb-6">
        <Link
          href="/admin/stock"
          className="text-slate-400 hover:text-slate-200 text-sm"
        >
          ← Stok Listesine Dön
        </Link>
      </div>

      {/* Stock Info Card */}
      <div className="bg-slate-900 rounded-xl p-6 border border-slate-800 mb-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">{stock.name}</h1>
            <p className="text-slate-400 mb-1">Kod: {stock.code}</p>
            <p className="text-slate-400 mb-1">Birim: {stock.unit}</p>
          </div>
          <div className="text-right">
            <p className="text-slate-400 mb-1">Mevcut Miktar</p>
            <p className="text-4xl font-bold text-blue-400">
              {stock.quantity?.toLocaleString("tr-TR")} {stock.unit}
            </p>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex space-x-4 mb-8">
        <button
          onClick={openEntryModal}
          className="flex-1 px-6 py-4 bg-green-600 text-white rounded-xl hover:bg-green-500 transition-colors font-semibold text-lg"
        >
          Stok Girişi Yap
        </button>
        <button
          onClick={openExitModal}
          className="flex-1 px-6 py-4 bg-red-600 text-white rounded-xl hover:bg-red-500 transition-colors font-semibold text-lg"
        >
          Stok Çıkışı Yap
        </button>
      </div>

      {/* Movements Table */}
      <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
        <div className="p-6 border-b border-slate-800">
          <h2 className="text-xl font-semibold text-white">Stok Hareket Defteri</h2>
        </div>
        <table className="w-full">
          <thead className="bg-slate-800">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-medium text-slate-300">Tarih</th>
              <th className="px-6 py-3 text-left text-sm font-medium text-slate-300">İşlem Tipi</th>
              <th className="px-6 py-3 text-left text-sm font-medium text-slate-300">Miktar</th>
              <th className="px-6 py-3 text-left text-sm font-medium text-slate-300">Proje</th>
              <th className="px-6 py-3 text-left text-sm font-medium text-slate-300">Personel</th>
              <th className="px-6 py-3 text-left text-sm font-medium text-slate-300">Açıklama</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {movements.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                  Henüz stok hareketi yok
                </td>
              </tr>
            ) : (
              movements.map((movement) => (
                <tr key={movement.id}>
                  <td className="px-6 py-4 text-sm text-slate-400">
                    {new Date(movement.date).toLocaleDateString("tr-TR")}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      movement.type === "GIRIS" 
                        ? "bg-green-900/50 text-green-400" 
                        : "bg-red-900/50 text-red-400"
                    }`}>
                      {movement.type === "GIRIS" ? "Giriş" : "Çıkış"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm font-semibold text-white">
                    {movement.quantity.toLocaleString("tr-TR")} {stock.unit}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-400">
                    {movement.project?.name || movement.project?.title || "-"}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-400">
                    {movement.personel?.name || "-"}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-400">
                    {movement.description || "-"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Entry Modal */}
      {isEntryModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-slate-900 rounded-xl p-6 border border-slate-800 w-full max-w-lg mx-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-semibold text-white mb-6">Stok Girişi</h3>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">İşlem Tarihi</label>
                <input
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Miktar *</label>
                <input
                  type="number"
                  name="quantity"
                  value={formData.quantity}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-slate-500"
                  placeholder="Miktar..."
                  required
                  step="0.01"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Açıklama</label>
                <input
                  type="text"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-slate-500"
                  placeholder="Açıklama..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">İlgili Proje</label>
                <select
                  name="projectId"
                  value={formData.projectId}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                >
                  <option value="">Proje Seçin</option>
                  {projects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.name || project.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">İşlemi Yapan Personel</label>
                <select
                  name="personnelId"
                  value={formData.personnelId}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                >
                  <option value="">Personel Seçin</option>
                  {personnel.map((person) => (
                    <option key={person.id} value={person.id}>
                      {person.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={closeModals}
                  className="px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors"
                  disabled={isSubmitting}
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-500 transition-colors"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Kaydediliyor..." : "Kaydet"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Exit Modal */}
      {isExitModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-slate-900 rounded-xl p-6 border border-slate-800 w-full max-w-lg mx-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-semibold text-white mb-6">Stok Çıkışı</h3>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">İşlem Tarihi</label>
                <input
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Miktar *</label>
                <input
                  type="number"
                  name="quantity"
                  value={formData.quantity}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-slate-500"
                  placeholder="Miktar..."
                  required
                  step="0.01"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Açıklama</label>
                <input
                  type="text"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-slate-500"
                  placeholder="Açıklama..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">İlgili Proje</label>
                <select
                  name="projectId"
                  value={formData.projectId}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                >
                  <option value="">Proje Seçin</option>
                  {projects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.name || project.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">İşlemi Yapan Personel</label>
                <select
                  name="personnelId"
                  value={formData.personnelId}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                >
                  <option value="">Personel Seçin</option>
                  {personnel.map((person) => (
                    <option key={person.id} value={person.id}>
                      {person.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={closeModals}
                  className="px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors"
                  disabled={isSubmitting}
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-500 transition-colors"
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
