"use client"
/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * This code is the property of NXA Software.
 */


import { useState, useEffect } from "react"
import { toast } from "react-hot-toast"
import { History, FileText, Clock, User, X, Download } from "lucide-react"

export default function AdminArchivePage() {
  const [archives, setArchives] = useState<any[]>([])
  const [projects, setProjects] = useState<any[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [dateRange, setDateRange] = useState({ start: "", end: "" })
  const [sortBy, setSortBy] = useState<"date-asc" | "date-desc">("date-desc")
  const [isLoading, setIsLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [tempFile, setTempFile] = useState<File | null>(null)
  const [modalProjectId, setModalProjectId] = useState("")
  const [modalDocumentName, setModalDocumentName] = useState("")
  const [isVersionModalOpen, setIsVersionModalOpen] = useState(false)
  const [selectedArchive, setSelectedArchive] = useState<any>(null)

  useEffect(() => {
    fetchArchives()
    fetchProjects()
  }, [])

  const fetchArchives = async () => {
    try {
      const response = await fetch("/api/admin/archive")
      if (response.ok) {
        const data = await response.json()
        setArchives(data)
      }
    } catch (error) {
      console.error("Failed to fetch archives:", error)
    } finally {
      setIsLoading(false)
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

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.type !== "application/pdf") {
      toast.error("Sadece PDF dosyaları yüklenebilir")
      return
    }

    setTempFile(file)
    setModalProjectId("")
    setModalDocumentName("")
    setIsModalOpen(true)
    // Reset file input
    e.target.value = ""
  }

  const handleConfirmUpload = async () => {
    if (!tempFile) {
      toast.error("Lütfen bir dosya seçin")
      return
    }

    setIsUploading(true)
    setIsModalOpen(false)
    
    try {
      const formData = new FormData()
      formData.append("file", tempFile)
      formData.append("projectId", modalProjectId)
      formData.append("documentName", modalDocumentName)

      const response = await fetch("/api/admin/archive", {
        method: "POST",
        body: formData
      })

      if (response.ok) {
        const newArchive = await response.json()
        fetchArchives()
        toast.success("Dosya başarıyla arşive eklendi")
      } else {
        toast.error("Dosya yüklenirken hata oluştu")
      }
    } catch (error) {
      toast.error("Dosya yüklenirken hata oluştu")
    } finally {
      setIsUploading(false)
      setTempFile(null)
      setModalProjectId("")
      setModalDocumentName("")
    }
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setTempFile(null)
    setModalProjectId("")
    setModalDocumentName("")
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Bu arşiv kaydını silmek istediğinize emin misiniz?")) return

    try {
      const response = await fetch(`/api/admin/archive/${id}`, {
        method: "DELETE"
      })
      if (response.ok) {
        fetchArchives()
        toast.success("Arşiv kaydı başarıyla silindi")
      } else {
        toast.error("Silme işlemi sırasında bir hata oluştu")
      }
    } catch (error) {
      toast.error("Silme işlemi sırasında bir hata oluştu")
    }
  }

  const filteredArchives = archives
    .filter(archive => 
      archive.projectName.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .filter(archive => {
      if (!dateRange.start && !dateRange.end) return true
      const archiveDate = new Date(archive.uploadedAt)
      if (dateRange.start && archiveDate < new Date(dateRange.start)) return false
      if (dateRange.end && archiveDate > new Date(dateRange.end)) return false
      return true
    })
    .sort((a, b) => {
      const dateA = new Date(a.uploadedAt)
      const dateB = new Date(b.uploadedAt)
      return sortBy === "date-asc" 
        ? dateA.getTime() - dateB.getTime()
        : dateB.getTime() - dateA.getTime()
    })

  return (
    <div className="lg:mt-0 mt-16">
      <h1 className="text-2xl lg:text-3xl font-bold text-white mb-8">
        Arşiv Yönetimi
      </h1>

      {/* Upload Section */}
      <div className="bg-slate-900 rounded-xl p-6 border border-slate-800 mb-6">
        <h2 className="text-xl font-semibold text-white mb-4">PDF Yükle</h2>
        <div className="flex items-center space-x-4">
          <input
            type="file"
            accept=".pdf"
            onChange={handleFileUpload}
            disabled={isUploading}
            className="flex-1 text-white"
          />
          {isUploading && (
            <span className="text-slate-400">Yükleniyor...</span>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="bg-slate-900 rounded-xl p-6 border border-slate-800 mb-6">
        <div className="grid md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Proje Adı Ara
            </label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-slate-500"
              placeholder="Proje adı..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Başlangıç Tarihi
            </label>
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
              className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Bitiş Tarihi
            </label>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
              className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Sıralama
            </label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as "date-asc" | "date-desc")}
              className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
            >
              <option value="date-desc">Tarih (Yeniden Eskiye)</option>
              <option value="date-asc">Tarih (Eskiden Yeniye)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Archive List */}
      <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
        <div className="w-full overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
          <table className="w-full min-w-max">
            <thead className="bg-slate-800">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-medium text-slate-300">İlgili Proje</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-slate-300">Dosya Adı</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-slate-300">Yükleme Tarihi</th>
                <th className="px-6 py-3 text-right text-sm font-medium text-slate-300">İşlemler</th>
              </tr>
            </thead>
          <tbody className="divide-y divide-slate-800">
            {filteredArchives.map((archive) => (
              <tr key={archive.id}>
                <td className="px-6 py-4 text-sm text-white">
                  {archive.project ? (
                    <span className="bg-blue-900/50 text-blue-400 px-2 py-1 rounded-full text-xs">
                      {archive.project.name || archive.project.title}
                    </span>
                  ) : (
                    <span className="bg-slate-700 text-slate-400 px-2 py-1 rounded-full text-xs">
                      Genel Evrak
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 text-sm text-slate-400">
                  {archive.documentName || archive.fileName}
                </td>
                <td className="px-6 py-4 text-sm text-slate-400">
                  {new Date(archive.uploadedAt).toLocaleDateString("tr-TR")}
                </td>
                <td className="px-6 py-4 text-right text-sm space-x-2">
                  <button
                    onClick={() => {
                      setSelectedArchive(archive)
                      setIsVersionModalOpen(true)
                    }}
                    className="text-purple-400 hover:text-purple-300 flex items-center gap-1"
                  >
                    <History className="w-4 h-4" />
                    Versiyonlar
                  </button>
                  <a
                    href={archive.driveUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:text-blue-300"
                  >
                    İndir
                  </a>
                  <button
                    onClick={() => handleDelete(archive.id)}
                    className="text-red-400 hover:text-red-300"
                  >
                    Sil
                  </button>
                </td>
              </tr>
            ))}
            {filteredArchives.length === 0 && (
              <tr>
                <td colSpan={4} className="px-6 py-12 text-center text-slate-400">
                  Arşiv kaydı bulunamadı
                </td>
              </tr>
            )}
          </tbody>
        </table>
        </div>
      </div>

      {/* Version History Modal */}
      {isVersionModalOpen && selectedArchive && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-slate-900 rounded-xl p-6 border border-slate-800 w-full max-w-lg mx-4 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-white flex items-center gap-2">
                <History className="w-5 h-5 text-purple-400" />
                Versiyon Geçmişi
              </h3>
              <button
                onClick={() => {
                  setIsVersionModalOpen(false)
                  setSelectedArchive(null)
                }}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="mb-4 pb-4 border-b border-slate-800">
              <p className="text-white font-medium">{selectedArchive.documentName || selectedArchive.fileName}</p>
              <p className="text-slate-400 text-sm">{selectedArchive.project?.name || selectedArchive.project?.title || 'Genel Evrak'}</p>
            </div>

            <div className="space-y-3">
              {/* Mock version data */}
              <div className="bg-green-900/20 rounded-lg p-4 border border-green-500/30">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-green-400 font-medium">v3 (AKTİF)</span>
                  <span className="text-xs text-slate-400">{new Date().toLocaleDateString('tr-TR')}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-300 mb-2">
                  <User className="w-4 h-4" />
                  <span>Yükleyen: Ahmet</span>
                </div>
                <div className="text-sm text-slate-400">Değişim: Kolon Kesitleri</div>
                <div className="flex gap-2 mt-3">
                  <a
                    href={selectedArchive.driveUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 px-3 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-500"
                  >
                    <Download className="w-3 h-3" />
                    İndir
                  </a>
                </div>
              </div>

              <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-slate-400 font-medium">v2 (Eski)</span>
                  <span className="text-xs text-slate-500">{new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toLocaleDateString('tr-TR')}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-400 mb-2">
                  <User className="w-4 h-4" />
                  <span>Yükleyen: Mehmet</span>
                </div>
                <div className="text-sm text-slate-500">Değişim: Temel Projesi</div>
              </div>

              <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-slate-400 font-medium">v1 (Eski)</span>
                  <span className="text-xs text-slate-500">{new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toLocaleDateString('tr-TR')}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-400 mb-2">
                  <User className="w-4 h-4" />
                  <span>Yükleyen: Ayşe</span>
                </div>
                <div className="text-sm text-slate-500">İlk yükleme</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-slate-900 rounded-xl p-6 border border-slate-800 w-full max-w-md mx-4 shadow-2xl">
            <h3 className="text-xl font-semibold text-white mb-4">Proje Seçin</h3>
            <input
              type="text"
              value={modalDocumentName}
              onChange={(e) => setModalDocumentName(e.target.value)}
              className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-slate-500 mb-4"
              placeholder="Evrak Adı / Açıklaması"
            />
            <select
              value={modalProjectId}
              onChange={(e) => setModalProjectId(e.target.value)}
              className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white mb-4"
            >
              <option value="">Proje Seçin</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name || project.title}
                </option>
              ))}
            </select>
            <div className="flex justify-end space-x-3">
              <button
                onClick={closeModal}
                className="px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors"
              >
                İptal
              </button>
              <button
                onClick={handleConfirmUpload}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-colors"
              >
                Yükle
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
