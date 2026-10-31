"use client"
/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * This code is the property of NXA Software.
 */


import { useState, useEffect } from "react"
import { toast } from "react-hot-toast"

type TabType = "about" | "services" | "projects"

export default function AdminCMSPage() {
  const [activeTab, setActiveTab] = useState<TabType>("about")
  const [isLoading, setIsLoading] = useState(false)

  return (
    <div className="lg:mt-0 mt-16">
      <h1 className="text-2xl lg:text-3xl font-bold text-white mb-8">
        İçerik Yönetimi
      </h1>

      {/* Tabs */}
      <div className="flex space-x-4 mb-8 border-b border-slate-800">
        <button
          onClick={() => setActiveTab("about")}
          className={`px-6 py-3 font-medium transition-colors ${
            activeTab === "about"
              ? "text-blue-400 border-b-2 border-blue-400"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          Hakkımızda
        </button>
        <button
          onClick={() => setActiveTab("services")}
          className={`px-6 py-3 font-medium transition-colors ${
            activeTab === "services"
              ? "text-blue-400 border-b-2 border-blue-400"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          Hizmetler
        </button>
        <button
          onClick={() => setActiveTab("projects")}
          className={`px-6 py-3 font-medium transition-colors ${
            activeTab === "projects"
              ? "text-blue-400 border-b-2 border-blue-400"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          Projeler
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === "about" && <AboutSection />}
      {activeTab === "services" && <ServicesSection />}
      {activeTab === "projects" && <ProjectsSection />}
    </div>
  )
}

function AboutSection() {
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    videoUrl: ""
  })
  const [isSaving, setIsSaving] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchAbout() {
      try {
        const response = await fetch("/api/admin/about")
        if (response.ok) {
          const data = await response.json()
          if (data) {
            setFormData({
              title: data.title || "",
              content: data.content || "",
              videoUrl: data.videoUrl || ""
            })
          }
        }
      } catch (error) {
        console.error("Failed to fetch about content:", error)
      } finally {
        setIsLoading(false)
      }
    }
    fetchAbout()
  }, [])

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const response = await fetch("/api/admin/about", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      })
      if (response.ok) {
        toast.success("✅ Hakkımızda içeriği güncellendi")
        setFormData({
          title: "",
          content: "",
          videoUrl: ""
        })
      } else {
        toast.error("İçerik güncellenirken hata oluştu")
      }
    } catch (error) {
      toast.error("Hata oluştu")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="bg-slate-900 rounded-xl p-6 border border-slate-800">
      <h2 className="text-xl font-semibold text-white mb-6">Hakkımızda İçeriği</h2>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Başlık
          </label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-slate-500"
            placeholder="Hakkımızda"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            İçerik
          </label>
          <textarea
            value={formData.content}
            onChange={(e) => setFormData({ ...formData, content: e.target.value })}
            rows={6}
            className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-slate-500"
            placeholder="Şirket hakkında bilgi..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Video URL
          </label>
          <input
            type="text"
            value={formData.videoUrl}
            onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value })}
            className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-slate-500"
            placeholder="/about-video.mp4"
          />
        </div>

        <button
          onClick={handleSave}
          disabled={isSaving}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-colors disabled:opacity-50"
        >
          {isSaving ? "Kaydediliyor..." : "Kaydet"}
        </button>
      </div>
    </div>
  )
}

function ServicesSection() {
  const [services, setServices] = useState<any[]>([])
  const [isEditing, setIsEditing] = useState(false)
  const [editingService, setEditingService] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchServices()
  }, [])

  const fetchServices = async () => {
    try {
      const response = await fetch("/api/admin/services")
      if (response.ok) {
        const data = await response.json()
        setServices(data)
      }
    } catch (error) {
      console.error("Failed to fetch services:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleAdd = () => {
    setEditingService({
      id: "",
      title: "",
      description: "",
      images: [""],
      threeDModelUrl: ""
    })
    setIsEditing(true)
  }

  const handleEdit = (service: any) => {
    setEditingService(service)
    setIsEditing(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Bu hizmeti silmek istediğinize emin misiniz?")) return
    
    try {
      const response = await fetch(`/api/admin/services/${id}`, {
        method: "DELETE"
      })
      if (response.ok) {
        toast.success("✅ Hizmet silindi")
        fetchServices()
      } else {
        toast.error("Hizmet silinirken hata oluştu")
      }
    } catch (error) {
      toast.error("Hata oluştu")
    }
  }

  return (
    <div>
      <div className="flex flex-wrap gap-4 justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-white">Hizmetler</h2>
        <button
          onClick={handleAdd}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-colors whitespace-nowrap"
        >
          Yeni Hizmet Ekle
        </button>
      </div>

      {isEditing ? (
        <ServiceForm
          service={editingService}
          onSave={(service: any) => {
            fetchServices()
            setIsEditing(false)
            setEditingService(null)
          }}
          onCancel={() => {
            setIsEditing(false)
            setEditingService(null)
          }}
        />
      ) : (
        <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
          <div className="w-full overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
            <table className="w-full min-w-max">
              <thead className="bg-slate-800">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-medium text-slate-300">Başlık</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-slate-300">Açıklama</th>
                  <th className="px-6 py-3 text-right text-sm font-medium text-slate-300">İşlemler</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {services.map((service: any) => (
                  <tr key={service.id}>
                    <td className="px-6 py-4 text-sm text-white">{service.title}</td>
                    <td className="px-6 py-4 text-sm text-slate-400 truncate max-w-xs">{service.description}</td>
                    <td className="px-6 py-4 text-right text-sm space-x-2">
                      <button
                        onClick={() => handleEdit(service)}
                        className="text-blue-400 hover:text-blue-300"
                      >
                        Düzenle
                      </button>
                      <button
                        onClick={() => handleDelete(service.id)}
                        className="text-red-400 hover:text-red-300"
                      >
                        Sil
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

function ServiceForm({ service, onSave, onCancel }: any) {
  const [formData, setFormData] = useState({
    ...service,
    threeDModelUrl: service.threeDModelUrl || ""
  })
  const [isUploading, setIsUploading] = useState(false)

  const uploadFile = async (file: File): Promise<string> => {
    // Dosya boyutu kontrolü (10 MB sınırı)
    const maxSize = 10 * 1024 * 1024 // 10 MB
    if (file.size > maxSize) {
      toast.error("Dosya boyutu çok yüksek! Lütfen 10MB altı bir dosya yükleyin.")
      throw new Error('Dosya boyutu çok yüksek (max 10 MB)')
    }
    
    const formData = new FormData()
    formData.append('file', file)
    
    try {
      const response = await fetch('/api/admin/upload', {
        method: 'POST',
        body: formData
      })
      
      if (!response.ok) {
        const data = await response.json()
        console.error("🚨 DETAYLI YÜKLEME HATASI:", data)
        throw new Error(data.error || 'Dosya yüklenemedi')
      }
      
      const data = await response.json()
      console.log("Cloudinary Linki:", data.url)
      return data.url
    } catch (error: any) {
      console.error("🚨 DETAYLI YÜKLEME HATASI:", error)
      throw error
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsUploading(true)
    
    try {
      // Boş string'leri filtrele
      const cleanedData = {
        ...formData,
        images: formData.images.filter((img: string) => img && img.trim() !== ''),
        threeDModelUrl: formData.threeDModelUrl || null
      }
      
      console.log("Gönderilecek Temizlenmiş Veri (Service):", cleanedData)
      
      const response = await fetch("/api/admin/services", {
        method: formData.id ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cleanedData)
      })
      if (response.ok) {
        toast.success(formData.id ? "✅ Hizmet güncellendi" : "✅ Hizmet başarıyla eklendi")
        onSave(formData)
      } else {
        toast.error("Hizmet kaydedilirken hata oluştu")
      }
    } catch (error) {
      toast.error("Hata oluştu")
    } finally {
      setIsUploading(false)
    }
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    try {
      const uploadPromises = Array.from(files).slice(0, 5).map(file => uploadFile(file))
      const urls = await Promise.all(uploadPromises)
      setFormData((prev: any) => ({
        ...prev,
        images: [...prev.images, ...urls].slice(0, 5)
      }))
    } catch (error: any) {
      console.error("🚨 DETAYLI GÖRSEL YÜKLEME HATASI:", error)
      toast.error(error.message || 'Görseller yüklenirken hata oluştu')
    }
  }

  const handle3DModelUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      const url = await uploadFile(file)
      setFormData((prev: any) => ({ ...prev, threeDModelUrl: url }))
    } catch (error: any) {
      console.error("🚨 DETAYLI 3D MODEL YÜKLEME HATASI:", error)
      toast.error(error.message || '3D model yüklenirken hata oluştu')
    }
  }

  return (
    <div className="bg-slate-900 rounded-xl p-6 border border-slate-800">
      <h3 className="text-lg font-semibold text-white mb-6">
        {formData.id ? "Hizmet Düzenle" : "Yeni Hizmet"}
      </h3>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">Başlık</label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">Açıklama</label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={4}
            className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">Görseller (Dosya yükle - max 5)</label>
          <input
            type="file"
            multiple
            accept="image/png, image/jpeg, image/webp"
            onChange={handleImageUpload}
            className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
          />
          {formData.images.length > 0 && (
            <div className="mt-2 space-y-1">
              {formData.images.map((url: any, idx: any) => (
                <div key={idx} className="flex items-center gap-2 text-sm text-slate-400">
                  <span className="truncate">{url}</span>
                  <button
                    type="button"
                    onClick={() => setFormData((prev: any) => ({ ...prev, images: prev.images.filter((_: any, i: any) => i !== idx) }))}
                    className="text-red-400 hover:text-red-300"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">3D Model (.glb / .gltf) - Dosya yükle</label>
          <input
            type="file"
            accept=".glb,.gltf"
            onChange={handle3DModelUpload}
            className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
          />
          {formData.threeDModelUrl && (
            <div className="mt-2 text-sm text-slate-400 truncate">
              {formData.threeDModelUrl}
              <button
                type="button"
                onClick={() => setFormData((prev: any) => ({ ...prev, threeDModelUrl: "" }))}
                className="ml-2 text-red-400 hover:text-red-300"
              >
                ×
              </button>
            </div>
          )}
        </div>

        <div className="flex space-x-4">
          <button
            type="submit"
            disabled={isUploading}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-colors disabled:opacity-50"
          >
            {isUploading ? "Kaydediliyor..." : "Kaydet"}
          </button>
          <button
            type="button"
            onClick={onCancel}
            disabled={isUploading}
            className="px-6 py-2 bg-slate-700 text-slate-200 rounded-lg hover:bg-slate-600 transition-colors disabled:opacity-50"
          >
            İptal
          </button>
        </div>
      </form>
    </div>
  )
}

function ProjectsSection() {
  const [projects, setProjects] = useState<any[]>([])
  const [isEditing, setIsEditing] = useState(false)
  const [editingProject, setEditingProject] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchProjects()
  }, [])

  const fetchProjects = async () => {
    try {
      const response = await fetch("/api/admin/cms/projects")
      if (response.ok) {
        const data = await response.json()
        setProjects(Array.isArray(data) ? data : [])
      }
    } catch (error) {
      console.error("Failed to fetch cms projects:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleAdd = () => {
    setEditingProject({
      id: "",
      title: "",
      description: "",
      images: [""],
      threeDModelUrl: "",
      name: "",
      status: "ETUT",
      companyId: "",
      startDate: "",
      endDate: ""
    })
    setIsEditing(true)
  }

  const handleEdit = (project: any) => {
    setEditingProject(project)
    setIsEditing(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Bu projeyi silmek istediğinize emin misiniz?")) return
    
    try {
      const response = await fetch(`/api/admin/cms/projects/${id}`, {
        method: "DELETE"
      })
      if (response.ok) {
        toast.success("✅ Proje silindi")
        fetchProjects()
      } else {
        toast.error("Proje silinirken hata oluştu")
      }
    } catch (error) {
      toast.error("Hata oluştu")
    }
  }

  return (
    <div>
      <div className="flex flex-wrap gap-4 justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-white">Projeler</h2>
        <button
          onClick={handleAdd}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-colors whitespace-nowrap"
        >
          Yeni Proje Ekle
        </button>
      </div>

      {isEditing ? (
        <ProjectForm
          project={editingProject}
          onSave={(project: any) => {
            fetchProjects()
            setIsEditing(false)
            setEditingProject(null)
          }}
          onCancel={() => {
            setIsEditing(false)
            setEditingProject(null)
          }}
        />
      ) : (
        <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
          <div className="w-full overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
            <table className="w-full min-w-max">
              <thead className="bg-slate-800">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-medium text-slate-300">Başlık</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-slate-300">Açıklama</th>
                  <th className="px-6 py-3 text-right text-sm font-medium text-slate-300">İşlemler</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {(projects || []).map((project: any) => (
                <tr key={project.id}>
                  <td className="px-6 py-4 text-sm text-white">{project.title}</td>
                  <td className="px-6 py-4 text-sm text-slate-400 truncate max-w-xs">{project.description}</td>
                  <td className="px-6 py-4 text-right text-sm space-x-2">
                    <button
                      onClick={() => handleEdit(project)}
                      className="text-blue-400 hover:text-blue-300"
                    >
                      Düzenle
                    </button>
                    <button
                      onClick={() => handleDelete(project.id)}
                      className="text-red-400 hover:text-red-300"
                    >
                      Sil
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>
      )}
    </div>
  )
}

function ProjectForm({ project, onSave, onCancel }: any) {
  const [formData, setFormData] = useState({
    ...project,
    threeDModelUrl: project.threeDModelUrl || "",
    name: project.name || project.title || "",
    status: project.status || "ETUT",
    companyId: project.companyId || "",
    startDate: project.startDate || "",
    endDate: project.endDate || ""
  })
  const [isUploading, setIsUploading] = useState(false)

  const uploadFile = async (file: File): Promise<string> => {
    // Dosya boyutu kontrolü (10 MB sınırı)
    const maxSize = 10 * 1024 * 1024 // 10 MB
    if (file.size > maxSize) {
      toast.error("Dosya boyutu çok yüksek! Lütfen 10MB altı bir dosya yükleyin.")
      throw new Error('Dosya boyutu çok yüksek (max 10 MB)')
    }
    
    const formData = new FormData()
    formData.append('file', file)
    
    try {
      const response = await fetch('/api/admin/upload', {
        method: 'POST',
        body: formData
      })
      
      if (!response.ok) {
        const data = await response.json()
        console.error("🚨 DETAYLI YÜKLEME HATASI:", data)
        throw new Error(data.error || 'Dosya yüklenemedi')
      }
      
      const data = await response.json()
      console.log("Cloudinary Linki:", data.url)
      return data.url
    } catch (error: any) {
      console.error("🚨 DETAYLI YÜKLEME HATASI:", error)
      throw error
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsUploading(true)
    
    try {
      // Boş string'leri filtrele
      const cleanedData = {
        ...formData,
        images: formData.images.filter((img: string) => img && img.trim() !== ''),
        threeDModelUrl: formData.threeDModelUrl || null
      }
      
      console.log("Gönderilecek Temizlenmiş Veri:", cleanedData)
      
      const response = await fetch("/api/admin/cms/projects", {
        method: formData.id ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cleanedData)
      })
      if (response.ok) {
        toast.success(formData.id ? "✅ Proje güncellendi" : "✅ Proje başarıyla eklendi")
        onSave(formData)
      } else {
        toast.error("Proje kaydedilirken hata oluştu")
      }
    } catch (error) {
      toast.error("Hata oluştu")
    } finally {
      setIsUploading(false)
    }
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    try {
      const uploadPromises = Array.from(files).slice(0, 5).map(file => uploadFile(file))
      const urls = await Promise.all(uploadPromises)
      setFormData((prev: any) => ({
        ...prev,
        images: [...prev.images, ...urls].slice(0, 5)
      }))
    } catch (error: any) {
      console.error("🚨 DETAYLI GÖRSEL YÜKLEME HATASI:", error)
      toast.error(error.message || 'Görseller yüklenirken hata oluştu')
    }
  }

  const handle3DModelUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      const url = await uploadFile(file)
      setFormData((prev: any) => ({ ...prev, threeDModelUrl: url }))
    } catch (error: any) {
      console.error("🚨 DETAYLI 3D MODEL YÜKLEME HATASI:", error)
      toast.error(error.message || '3D model yüklenirken hata oluştu')
    }
  }

  return (
    <div className="bg-slate-900 rounded-xl p-6 border border-slate-800">
      <h3 className="text-lg font-semibold text-white mb-6">
        {formData.id ? "Proje Düzenle" : "Yeni Proje"}
      </h3>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">Başlık</label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">Açıklama</label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={4}
            className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">Görseller (Dosya yükle - max 5)</label>
          <input
            type="file"
            multiple
            accept="image/png, image/jpeg, image/webp"
            onChange={handleImageUpload}
            className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
          />
          {formData.images.length > 0 && (
            <div className="mt-2 space-y-1">
              {formData.images.map((url: any, idx: any) => (
                <div key={idx} className="flex items-center gap-2 text-sm text-slate-400">
                  <span className="truncate">{url}</span>
                  <button
                    type="button"
                    onClick={() => setFormData((prev: any) => ({ ...prev, images: prev.images.filter((_: any, i: any) => i !== idx) }))}
                    className="text-red-400 hover:text-red-300"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">3D Model (.glb / .gltf) - Dosya yükle</label>
          <input
            type="file"
            accept=".glb,.gltf"
            onChange={handle3DModelUpload}
            className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
          />
          {formData.threeDModelUrl && (
            <div className="mt-2 text-sm text-slate-400 truncate">
              {formData.threeDModelUrl}
              <button
                type="button"
                onClick={() => setFormData((prev: any) => ({ ...prev, threeDModelUrl: "" }))}
                className="ml-2 text-red-400 hover:text-red-300"
              >
                ×
              </button>
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">Proje Adı (ERP)</label>
          <input
            type="text"
            value={formData.name || formData.title}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-slate-500"
            placeholder="Proje adı"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">Durum</label>
          <select
            value={formData.status || "ETUT"}
            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
            className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
          >
            <option value="ETUT">Etüt</option>
            <option value="CIZIM">Çizim</option>
            <option value="SAHA">Saha</option>
            <option value="TAMAMLANDI">Tamamlandı</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">Başlangıç Tarihi</label>
          <input
            type="date"
            value={formData.startDate}
            onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
            className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">Bitiş Tarihi</label>
          <input
            type="date"
            value={formData.endDate}
            onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
            className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
          />
        </div>

        <div className="flex space-x-4">
          <button
            type="submit"
            disabled={isUploading}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-colors disabled:opacity-50"
          >
            {isUploading ? "Kaydediliyor..." : "Kaydet"}
          </button>
          <button
            type="button"
            onClick={onCancel}
            disabled={isUploading}
            className="px-6 py-2 bg-slate-700 text-slate-200 rounded-lg hover:bg-slate-600 transition-colors disabled:opacity-50"
          >
            İptal
          </button>
        </div>
      </form>
    </div>
  )
}