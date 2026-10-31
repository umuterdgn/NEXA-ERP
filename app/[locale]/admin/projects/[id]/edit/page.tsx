"use client"
/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * This code is the property of NXA Software.
 */


import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { toast } from "react-hot-toast"
import dynamic from 'next/dynamic'

// Leaflet SSR'da hata verdiği için dynamic import kullanıyoruz
const MapLocationPicker = dynamic(() => import('@/components/MapLocationPicker'), { ssr: false })

export default function EditProjectPage({
  params
}: {
  params: Promise<{ id: string }>
}) {
  const router = useRouter()
  const [projectId, setProjectId] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [companies, setCompanies] = useState<{ id: string; name: string }[]>([])

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    status: "ETUT",
    companyId: "",
    startDate: "",
    endDate: "",
    category: "",
    city: "",
    district: "",
    mintika: "",
    ada: "",
    parsel: "",
    pafta: "",
    yapiSinifi: "",
    clientName: "",
    siteManager: "",
    engineer: "",
    architect: "",
    shiftStart: "08:00",
    shiftEnd: "17:00",
    latitude: null as number | null,
    longitude: null as number | null,
    geofenceRadius: 100,
    mapUrl: ""
  })

  const fetchProject = useCallback(async (id: string) => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/admin/projects/${id}`)
      if (response.ok) {
        const project = await response.json()
        setFormData({
          name: project.name || project.title || "",
          description: project.description || "",
          status: project.status || "ETUT",
          companyId: project.companyId || "",
          startDate: project.startDate ? new Date(project.startDate).toISOString().split('T')[0] : "",
          endDate: project.endDate ? new Date(project.endDate).toISOString().split('T')[0] : "",
          category: project.category || "",
          city: project.city || "",
          district: project.district || "",
          mintika: project.mintika || "",
          ada: project.ada || "",
          parsel: project.parsel || "",
          pafta: project.pafta || "",
          yapiSinifi: project.yapiSinifi || "",
          clientName: project.clientName || "",
          siteManager: project.siteManager || "",
          engineer: project.engineer || "",
          architect: project.architect || "",
          shiftStart: project.shiftStart || "08:00",
          shiftEnd: project.shiftEnd || "17:00",
          latitude: project.latitude || null,
          longitude: project.longitude || null,
          geofenceRadius: project.geofenceRadius || 100,
          mapUrl: project.mapUrl || ""
        })
      } else {
        toast.error("Proje bulunamadı")
        router.push("/admin/projects")
      }
    } catch {
      console.error("Failed to fetch project")
      toast.error("Proje yüklenirken hata oluştu")
    } finally {
      setIsLoading(false)
    }
  }, [router])

  const fetchCompanies = useCallback(async () => {
    try {
      const response = await fetch("/api/admin/crm")
      if (response.ok) {
        const data = await response.json()
        setCompanies(data)
      }
    } catch {
      console.error("Failed to fetch companies")
    }
  }, [])

  useEffect(() => {
    const init = async () => {
      const resolvedParams = await params
      setProjectId(resolvedParams.id)
      await fetchProject(resolvedParams.id)
      await fetchCompanies()
    }

    void init()
  }, [fetchCompanies, fetchProject, params])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSave = async () => {
    if (!formData.name || !formData.status) {
      toast.error("Proje adı ve durumu zorunludur")
      return
    }

    if (!projectId) {
      toast.error("Proje ID bulunamadı")
      return
    }

    setIsSubmitting(true)
    try {
      const response = await fetch(`/api/admin/projects/${projectId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        toast.success("Proje başarıyla güncellendi")
        router.push(`/admin/projects/${projectId}`)
      } else {
        const errorData = await response.json()
        toast.error(`Proje güncellenirken hata: ${errorData.details || errorData.error || "Bilinmeyen hata"}`)
      }
    } catch {
      toast.error("Proje güncellenirken hata oluştu")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-white">Yükleniyor...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950">
      <div className="max-w-7xl mx-auto p-4 md:p-6 lg:p-8">
        
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold text-white">🏝️ Projeyi Düzenle</h1>
          <div className="flex gap-4">
             <button onClick={() => router.back()} className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg">İptal</button>
             <button onClick={handleSave} disabled={isSubmitting} className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg shadow-lg disabled:opacity-50">
               {isSubmitting ? "Kaydediliyor..." : "💾 Değişiklikleri Kaydet"}
             </button>
          </div>
        </div>

        {/* ANA GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* SOL SÜTUN (FORM ALANLARI) */}
          <div className="lg:col-span-7 flex flex-col gap-6">
            
            {/* KART 1: Temel Bilgiler */}
            <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-sm">
              <h2 className="text-lg font-semibold text-white mb-4 border-b border-slate-700 pb-2">Temel Bilgiler</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-300 mb-2">Proje Adı *</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                    placeholder="Proje adını girin"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-300 mb-2">Proje Açıklaması</label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white resize-none h-24"
                    placeholder="Proje açıklamasını girin"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Firma</label>
                  <select
                    name="companyId"
                    value={formData.companyId}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                  >
                    <option value="">Firma Seçin</option>
                    {companies.map((company) => (
                      <option key={company.id} value={company.id}>{company.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Durum</label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                  >
                    <option value="ETUT">Etüt</option>
                    <option value="CIZIM">Çizim</option>
                    <option value="SAHA">Saha</option>
                    <option value="TAMAMLANDI">Tamamlandı</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Kategori</label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                  >
                    <option value="">Kategori Seçin</option>
                    <option value="Güçlendirme">Güçlendirme</option>
                    <option value="Paket İş">Paket İş</option>
                    <option value="Kentsel Dönüşüm">Kentsel Dönüşüm</option>
                    <option value="Performans Analizi">Performans Analizi</option>
                    <option value="Danışmanlık">Danışmanlık</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Başlangıç Tarihi</label>
                  <input
                    type="date"
                    name="startDate"
                    value={formData.startDate}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Bitiş Tarihi</label>
                  <input
                    type="date"
                    name="endDate"
                    value={formData.endDate}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                  />
                </div>
              </div>
            </div>

            {/* KART 2: Künye & Personel */}
            <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-sm">
              <h2 className="text-lg font-semibold text-white mb-4 border-b border-slate-700 pb-2">Künye ve Görevliler</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Şantiye Şefi</label>
                  <input
                    type="text"
                    name="siteManager"
                    value={formData.siteManager}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                    placeholder="Şantiye şefi adı"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Sorumlu Mühendis</label>
                  <input
                    type="text"
                    name="engineer"
                    value={formData.engineer}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                    placeholder="Sorumlu mühendis adı"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-300 mb-2">Mimar</label>
                  <input
                    type="text"
                    name="architect"
                    value={formData.architect}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                    placeholder="Mimar adı"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Müşteri Adı</label>
                  <input
                    type="text"
                    name="clientName"
                    value={formData.clientName}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                    placeholder="Müşteri adı"
                  />
                </div>
              </div>
            </div>

            {/* KART 3: Mesai Saatleri */}
            <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-sm">
              <h2 className="text-lg font-semibold text-white mb-4 border-b border-slate-700 pb-2">Mesai Düzeni</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Mesai Başlangıç</label>
                  <input
                    type="time"
                    name="shiftStart"
                    value={formData.shiftStart}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Mesai Bitiş</label>
                  <input
                    type="time"
                    name="shiftEnd"
                    value={formData.shiftEnd}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                  />
                </div>
              </div>
            </div>

          </div>

          {/* SAĞ SÜTUN (HARİTA VE ADRES) */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            
            {/* KART 4: Adres Bilgileri */}
            <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-sm">
              <h2 className="text-lg font-semibold text-white mb-4 border-b border-slate-700 pb-2">Konum ve Tapu Bilgileri</h2>
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-slate-300 mb-2">İl</label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                    placeholder="İl"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-slate-300 mb-2">İlçe</label>
                  <input
                    type="text"
                    name="district"
                    value={formData.district}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                    placeholder="İlçe"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Mahalle Adı</label>
                  <input
                    type="text"
                    name="mintika"
                    value={formData.mintika}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                    placeholder="Mahalle Adı"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Ada</label>
                  <input
                    type="text"
                    name="ada"
                    value={formData.ada}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                    placeholder="Ada"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-slate-300 mb-2">Parsel</label>
                  <input
                    type="text"
                    name="parsel"
                    value={formData.parsel}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                    placeholder="Parsel"
                  />
                </div>
              </div>

              {/* HARİTA (GEOFENCE) BİLEŞENİ */}
              <div className="mt-4">
                <div className="flex items-center justify-between mb-2">
                   <label className="block text-sm font-medium text-slate-300">Sanal Çit (Geofence) Alanı</label>
                   <span className="text-xs text-amber-400 font-medium">Opsiyonel</span>
                </div>
                <p className="text-xs text-slate-400 mb-3">Personel puantajı için şantiye merkezini haritadan seçin. (Daha sonra ayarlayabilirsiniz).</p>
                
                <MapLocationPicker 
                  latitude={formData.latitude} 
                  longitude={formData.longitude} 
                  radius={formData.geofenceRadius || 100} 
                  onChange={(lat, lng, rad) => setFormData({ ...formData, latitude: lat, longitude: lng, geofenceRadius: rad })} 
                />
              </div>
            </div>

          </div>

        </div>
      </div>
    </div>
  )
}
