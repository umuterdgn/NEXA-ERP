"use client"
/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * This code is the property of NXA Software.
 */


import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { toast } from "react-hot-toast"
import Link from "next/link"
import { Plus, X, FileText, Shield, AlertTriangle, Search, Loader2, Building2, Sparkles, CheckCircle2, MapPin, RotateCw, Building } from "lucide-react"
import { createInspectionProject } from "@/lib/actions/project"

export const dynamic = 'force-dynamic'

type ViewMode = "list" | "kanban"

export default function ProjectsPage() {
  const router = useRouter()
  const [projects, setProjects] = useState<any[]>([])
  const [companies, setCompanies] = useState<any[]>([])
  const [viewMode, setViewMode] = useState<ViewMode>("list")
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("Tüm Projeler")
  const [isYibfModalOpen, setIsYibfModalOpen] = useState(false)
  const [isQueryingYibf, setIsQueryingYibf] = useState(false)
  const [yibfQuerySuccess, setYibfQuerySuccess] = useState(false)
  const [yibfSubmitting, setYibfSubmitting] = useState(false)
  const [yibfFormData, setYibfFormData] = useState({
    yibfNo: "",
    projectName: "",
    contractorName: "",
    yambisNo: "",
    city: "",
    district: "",
    ada: "",
    parsel: "",
    totalArea: "",
    floorCount: "",
    buildingClass: "",
    uydsStatus: "",
    supervisor: "",
    riskScore: "50",
    healthScore: "85",
  })

  useEffect(() => {
    fetchProjects()
    fetchCompanies()
  }, [])

  const fetchProjects = async () => {
    try {
      const response = await fetch("/api/admin/projects", { cache: 'no-store' })
      if (!response.ok) {
        setProjects([])
        return
      }

      const data = await response.json().catch(() => [])
      setProjects(Array.isArray(data) ? data : (data.projects || []))
    } catch (error) {
      console.error("Failed to fetch projects:", error)
      setProjects([])
      toast.error("Projeler yüklenirken hata oluştu")
    } finally {
      setIsLoading(false)
    }
  }

  const fetchCompanies = async () => {
    try {
      const response = await fetch("/api/admin/crm")
      if (response.ok) {
        const data = await response.json()
        setCompanies(data)
      }
    } catch (error) {
      console.error("Failed to fetch companies:", error)
    }
  }

  const handleStatusChange = async (projectId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/admin/projects/${projectId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ status: newStatus })
      })

      if (response.ok) {
        toast.success("Proje durumu güncellendi")
        fetchProjects()
      } else {
        toast.error("Durum güncellenirken hata oluştu")
      }
    } catch (error) {
      toast.error("Durum güncellenirken hata oluştu")
    }
  }

  const handleDelete = async (projectId: string) => {
    if (!confirm("Bu projeyi silmek istediğinize emin misiniz?")) return

    try {
      const response = await fetch(`/api/admin/projects/${projectId}`, {
        method: "DELETE"
      })

      if (response.ok) {
        toast.success("Proje başarıyla silindi")
        fetchProjects()
      } else {
        toast.error("Proje silinirken hata oluştu")
      }
    } catch (error) {
      toast.error("Proje silinirken hata oluştu")
    }
  }

  const handleQueryYibf = async (sampleNo?: string) => {
    const targetNo = (sampleNo || yibfFormData.yibfNo).trim()
    if (!targetNo) {
      toast.error("Lütfen bir YİBF Numarası girin (Örn: 14582)")
      return
    }

    if (sampleNo) {
      setYibfFormData((prev) => ({ ...prev, yibfNo: sampleNo }))
    }

    try {
      setIsQueryingYibf(true)
      setYibfQuerySuccess(false)

      const response = await fetch(`/api/gov/yibf?yibfNo=${encodeURIComponent(targetNo)}`)
      const resData = await response.json()

      if (resData.success && resData.data) {
        const item = resData.data
        setYibfFormData((prev) => ({
          ...prev,
          yibfNo: item.yibfNo,
          projectName: item.projectName,
          contractorName: item.contractor?.name || "",
          yambisNo: item.contractor?.yambisNo || "",
          city: item.location?.city || "",
          district: item.location?.district || "",
          ada: item.location?.maksAda || "",
          parsel: item.location?.maksParsel || "",
          totalArea: String(item.details?.totalAreaSquareMeters || ""),
          floorCount: String(item.details?.floorCount || ""),
          buildingClass: item.details?.buildingClass || "",
          uydsStatus: item.uydsStatus || "RUHSAT_ALINDI",
        }))
        setYibfQuerySuccess(true)
        toast.success(`Bakanlık verileri çekildi: ${item.projectName}`)
      } else {
        toast.error(resData.error || "Bakanlık sorgusu başarısız oldu.")
      }
    } catch (err) {
      console.error("YİBF sorgu hatası:", err)
      toast.error("Bakanlık sistemine bağlanırken bir hata oluştu.")
    } finally {
      setIsQueryingYibf(false)
    }
  }

  const handleYibfSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!yibfFormData.yibfNo.trim() || !yibfFormData.projectName.trim()) {
      toast.error("Lütfen önce YİBF sorgusu yapın ve Proje Adını doğrulayın")
      return
    }

    setYibfSubmitting(true)
    try {
      // Server Action: Tenant Isolation (Yapı Denetim Firması bağlamında kilitli kayıt)
      const result = await createInspectionProject({
        yibfNo: yibfFormData.yibfNo,
        projectName: yibfFormData.projectName,
        contractorName: yibfFormData.contractorName,
        yambisNo: yibfFormData.yambisNo,
        city: yibfFormData.city || undefined,
        district: yibfFormData.district || undefined,
        ada: yibfFormData.ada || undefined,
        parsel: yibfFormData.parsel || undefined,
        totalArea: yibfFormData.totalArea ? parseFloat(yibfFormData.totalArea) : null,
        buildingClass: yibfFormData.buildingClass || undefined,
        uydsStatus: yibfFormData.uydsStatus || "RUHSAT_ALINDI",
      })

      if (result.success) {
        toast.success("Proje firmanızın denetim kütüğüne (Tenant) başarıyla kilitlendi!")
        setIsYibfModalOpen(false)
        setYibfQuerySuccess(false)
        setYibfFormData({
          yibfNo: "",
          projectName: "",
          contractorName: "",
          yambisNo: "",
          city: "",
          district: "",
          ada: "",
          parsel: "",
          totalArea: "",
          floorCount: "",
          buildingClass: "",
          uydsStatus: "",
          supervisor: "",
          riskScore: "50",
          healthScore: "85",
        })
        fetchProjects()
      } else {
        toast.error(result.error || "Proje kaydedilirken hata oluştu")
      }
    } catch (error: any) {
      console.error('Failed to add YİBF project:', error)
      toast.error(error?.message || "Proje kaydedilirken bir hata oluştu")
    } finally {
      setYibfSubmitting(false)
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "ETUT": return "Etüt"
      case "CIZIM": return "Çizim"
      case "SAHA": return "Saha"
      case "TAMAMLANDI": return "Tamamlandı"
      default: return status
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ETUT": return "bg-purple-900/50 text-purple-400"
      case "CIZIM": return "bg-blue-900/50 text-blue-400"
      case "SAHA": return "bg-orange-900/50 text-orange-400"
      case "TAMAMLANDI": return "bg-green-900/50 text-green-400"
      default: return "bg-slate-900/50 text-slate-400"
    }
  }

  const getProjectsByStatus = (status: string) => {
    return filteredProjects.filter(p => p.status === status)
  }

  const categories = ["Tüm Projeler", "Güçlendirme", "Paket İş", "Kentsel Dönüşüm", "Performans Analizi", "Danışmanlık"]

  const filteredProjects = (projects || []).filter(project => {
    const matchesSearch = 
      project.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.parsel?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.mintika?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.company?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.clientName?.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesCategory = selectedCategory === "Tüm Projeler" || project.category === selectedCategory
    
    return matchesSearch && matchesCategory
  })

  return (
    <div className="lg:mt-0 mt-16">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl lg:text-3xl font-bold text-white">
            Proje Yönetimi
          </h1>
          <div className="flex items-center space-x-3">
          <div className="flex bg-slate-800 rounded-lg p-1">
            <button
              onClick={() => setViewMode("list")}
              className={`px-3 py-1.5 rounded-md text-sm transition-colors ${
                viewMode === "list"
                  ? "bg-slate-700 text-white"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Liste
            </button>
            <button
              onClick={() => setViewMode("kanban")}
              className={`px-3 py-1.5 rounded-md text-sm transition-colors ${
                viewMode === "kanban"
                  ? "bg-slate-700 text-white"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Pano
            </button>
          </div>
          <button
            onClick={() => router.push("/inspection/projects/new")}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-colors"
          >
            Yeni Proje Ekle
          </button>
          <button
            onClick={() => {
              setIsYibfModalOpen(true)
              setYibfQuerySuccess(false)
            }}
            className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-lg transition-all shadow-md shadow-purple-600/20 flex items-center gap-2 font-medium"
          >
            <Building2 className="w-4 h-4" />
            YİBF İle Yeni Proje Ekle
          </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <input
            type="text"
            placeholder="Proje ara (Ad, Parsel, Mahalle Adı, Firma, Müşteri)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-slate-500"
          />
        </div>

        {/* Category Filter */}
        <div className="flex flex-wrap gap-2">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedCategory === category
                  ? "bg-blue-600 text-white"
                  : "bg-slate-800 text-slate-300 hover:bg-slate-700"
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        {/* List View */}
        {viewMode === "list" && (
          <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-700">
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Proje Adı</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Firma</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Durum</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Kategori</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Konum</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">İşlemler</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProjects.map((project) => (
                    <tr key={project.id} className="border-b border-slate-700 hover:bg-slate-700/50 transition-colors">
                      <td className="px-6 py-4">
                        <div>
                          <div className="font-medium text-white">{project.name}</div>
                          <div className="text-sm text-slate-400">{project.parsel && `Parsel: ${project.parsel}`}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-300">{project.company?.name || "-"}</td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(project.status)}`}>
                          {getStatusLabel(project.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-300">{project.category || "-"}</td>
                      <td className="px-6 py-4 text-slate-300">{project.city ? `${project.city}, ${project.district}` : "-"}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                          <Link
                            href={`/inspection/projects/${project.id}`}
                            className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm transition-colors"
                          >
                            Detay
                          </Link>
                          <button
                            onClick={() => handleDelete(project.id)}
                            className="px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white rounded-lg text-sm transition-colors"
                          >
                            Sil
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {filteredProjects.length === 0 && (
              <div className="text-center text-slate-500 text-sm py-8">
                Proje bulunamadı
              </div>
            )}
          </div>
        )}

        {/* Kanban View */}
        {viewMode === "kanban" && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {["ETUT", "CIZIM", "SAHA", "TAMAMLANDI"].map((status) => (
              <div key={status} className="bg-slate-800 rounded-xl border border-slate-700 p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-white">{getStatusLabel(status)}</h3>
                  <span className="text-sm text-slate-400">{getProjectsByStatus(status).length}</span>
                </div>
                <div className="space-y-3">
                  {getProjectsByStatus(status).map((project) => (
                    <div
                      key={project.id}
                      className="bg-slate-700 rounded-lg p-4 border border-slate-600 hover:border-slate-500 transition-colors cursor-pointer"
                      onClick={() => router.push(`/inspection/projects/${project.id}`)}
                    >
                      <div className="font-medium text-white mb-2">{project.name}</div>
                      <div className="text-sm text-slate-400 mb-2">{project.parsel && `Parsel: ${project.parsel}`}</div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-slate-500">{project.company?.name || "-"}</span>
                        <div className="flex gap-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleStatusChange(project.id, status === "ETUT" ? "CIZIM" : status === "CIZIM" ? "SAHA" : status === "SAHA" ? "TAMAMLANDI" : "ETUT")
                            }}
                            className="text-xs px-2 py-1 bg-slate-600 hover:bg-slate-500 text-white rounded"
                          >
                            İleri
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDelete(project.id)
                            }}
                            className="text-xs px-2 py-1 bg-red-600 hover:bg-red-500 text-white rounded"
                          >
                            Sil
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                  {getProjectsByStatus(status).length === 0 && (
                    <div className="text-center text-slate-500 text-sm py-8">
                      Proje yok
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* YİBF Modal */}
      {isYibfModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden my-8">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-900/80">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    YİBF İle Yeni Proje Ekle
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                      Bakanlık UYDS
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    T.C. Çevre ve Şehircilik Bakanlığı YİBF / UYDS Veri Çekme Motoru
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsYibfModalOpen(false)}
                className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Step 1: YİBF Sorgulama */}
              <div className="bg-slate-800/60 rounded-xl p-4 border border-slate-700/80">
                <label className="block text-xs font-bold uppercase tracking-wider text-purple-300 mb-2">
                  1. Adım: Bakanlık YİBF No Sorgula
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Building className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={yibfFormData.yibfNo}
                      onChange={(e) => setYibfFormData({ ...yibfFormData, yibfNo: e.target.value })}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault()
                          handleQueryYibf()
                        }
                      }}
                      className="w-full pl-9 pr-3 py-2.5 bg-slate-950 border border-slate-700 rounded-lg text-white font-mono text-sm focus:outline-none focus:border-purple-500"
                      placeholder="Örn: 14582 veya 34591"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => handleQueryYibf()}
                    disabled={isQueryingYibf || !yibfFormData.yibfNo.trim()}
                    className="px-4 py-2.5 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-medium rounded-lg transition-all flex items-center gap-2 shrink-0 cursor-pointer shadow-lg shadow-purple-600/20"
                  >
                    {isQueryingYibf ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Sorgulanıyor...</span>
                      </>
                    ) : (
                      <>
                        <Search className="w-4 h-4" />
                        <span>Sorgula</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Hızlı Test Senaryoları */}
                <div className="mt-3 flex items-center gap-2 flex-wrap">
                  <span className="text-[11px] text-slate-400">Hızlı Senaryolar:</span>
                  {["14582", "34591", "78214"].map((no) => (
                    <button
                      key={no}
                      type="button"
                      onClick={() => handleQueryYibf(no)}
                      disabled={isQueryingYibf}
                      className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-900 hover:bg-slate-700 text-purple-300 border border-slate-700 transition-colors"
                    >
                      #{no}
                    </button>
                  ))}
                </div>
              </div>

              {/* Loading Animasyonu */}
              {isQueryingYibf && (
                <div className="p-4 rounded-xl bg-purple-950/40 border border-purple-500/30 flex items-center gap-3 animate-pulse">
                  <Loader2 className="w-6 h-6 text-purple-400 animate-spin shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-purple-200">
                      Loading (Bakanlık Sistemine Bağlanılıyor...)
                    </p>
                    <p className="text-xs text-purple-300/80">
                      UYDS Ruhsat, YAMBİS Müteahhit ve MAKS Kadastro verileri çekiliyor...
                    </p>
                  </div>
                </div>
              )}

              {/* Başarılı Sorgu Bildirimi */}
              {yibfQuerySuccess && !isQueryingYibf && (
                <div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-500/40 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-emerald-300 text-xs font-medium">
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                    <span>✓ Bakanlık Verileri Otomatik Olarak Dolduruldu (UYDS: {yibfFormData.uydsStatus})</span>
                  </div>
                  {yibfFormData.yambisNo && (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-900/60 text-emerald-200 border border-emerald-700/50">
                      YAMBİS: {yibfFormData.yambisNo}
                    </span>
                  )}
                </div>
              )}

              {/* Step 2: Form Alanları (Otomatik Dolan Veriler) */}
              <form onSubmit={handleYibfSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Proje Adı *
                  </label>
                  <input
                    type="text"
                    value={yibfFormData.projectName}
                    onChange={(e) => setYibfFormData({ ...yibfFormData, projectName: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-purple-500"
                    placeholder="Bakanlık sorgusu yapın veya yazın"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Müteahhit / Yüklenici Firma *
                  </label>
                  <input
                    type="text"
                    value={yibfFormData.contractorName}
                    onChange={(e) => setYibfFormData({ ...yibfFormData, contractorName: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-purple-500"
                    placeholder="Müteahhit Firma Unvanı"
                    required
                  />
                </div>

                {/* Ada / Parsel ve Toplam m2 */}
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Ada (MAKS)
                    </label>
                    <input
                      type="text"
                      value={yibfFormData.ada}
                      onChange={(e) => setYibfFormData({ ...yibfFormData, ada: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white text-sm font-mono focus:outline-none focus:border-purple-500"
                      placeholder="Ada"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Parsel (MAKS)
                    </label>
                    <input
                      type="text"
                      value={yibfFormData.parsel}
                      onChange={(e) => setYibfFormData({ ...yibfFormData, parsel: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white text-sm font-mono focus:outline-none focus:border-purple-500"
                      placeholder="Parsel"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Toplam Alan (m²)
                    </label>
                    <input
                      type="number"
                      value={yibfFormData.totalArea}
                      onChange={(e) => setYibfFormData({ ...yibfFormData, totalArea: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white text-sm font-mono focus:outline-none focus:border-purple-500"
                      placeholder="m²"
                    />
                  </div>
                </div>

                {/* İl / İlçe ve Yapı Sınıfı */}
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      İl
                    </label>
                    <input
                      type="text"
                      value={yibfFormData.city}
                      onChange={(e) => setYibfFormData({ ...yibfFormData, city: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-purple-500"
                      placeholder="İl"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      İlçe
                    </label>
                    <input
                      type="text"
                      value={yibfFormData.district}
                      onChange={(e) => setYibfFormData({ ...yibfFormData, district: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-purple-500"
                      placeholder="İlçe"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Yapı Sınıfı
                    </label>
                    <input
                      type="text"
                      value={yibfFormData.buildingClass}
                      onChange={(e) => setYibfFormData({ ...yibfFormData, buildingClass: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white text-sm font-mono focus:outline-none focus:border-purple-500"
                      placeholder="Örn: 4B"
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-4 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setIsYibfModalOpen(false)}
                    className="flex-1 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium rounded-lg transition-colors"
                  >
                    İptal
                  </button>
                  <button
                    type="submit"
                    disabled={yibfSubmitting || isQueryingYibf || !yibfFormData.projectName.trim()}
                    className="flex-1 px-4 py-2.5 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-medium rounded-lg transition-all shadow-lg shadow-purple-600/30 flex items-center justify-center gap-2"
                  >
                    {yibfSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Veritabanına Yazılıyor...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        <span>Kaydet (Projeyi Oluştur)</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}