"use client"
/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * This code is the property of NXA Software.
 */

import { useState, useEffect } from "react"
import { toast } from "react-hot-toast"
import { FileText, Upload, Plus, X, Download, Trash2 } from "lucide-react"

interface LabTest {
  id: string
  title: string
  documentNo: string
  sampleType: string
  testType: string | null
  result: string | null
  testResult: string
  testDate: string
  imageUrl: string | null
  notes: string | null
  project: {
    id: string
    name: string
    title: string
  }
}

export default function LabTestsPage() {
  const [labTests, setLabTests] = useState<LabTest[]>([])
  const [projects, setProjects] = useState<any[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  
  const [formData, setFormData] = useState({
    title: "",
    documentNo: "",
    sampleType: "BETON",
    testType: "7_GUN",
    result: "",
    testResult: "PASS",
    testDate: "",
    notes: "",
    projectId: "",
    file: null as File | null
  })

  useEffect(() => {
    fetchLabTests()
    fetchProjects()
  }, [])

  const fetchLabTests = async () => {
    try {
      const response = await fetch('/api/lab-tests')
      const data = await response.json()
      setLabTests(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Failed to fetch lab tests:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchProjects = async () => {
    try {
      const response = await fetch('/api/admin/projects')
      const data = await response.json()
      setProjects(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Failed to fetch projects:', error)
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFormData({ ...formData, file: e.target.files[0] })
    }
  }

  const uploadToCloudinary = async (file: File): Promise<string> => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('upload_preset', process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || 'ml_default')

    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'your-cloud-name'
    const uploadResponse = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
      method: 'POST',
      body: formData
    })

    const uploadData = await uploadResponse.json()
    
    if (!uploadData.secure_url) {
      throw new Error('Dosya yüklenemedi')
    }

    return uploadData.secure_url
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.title || !formData.documentNo || !formData.testDate || !formData.projectId) {
      toast.error("Zorunlu alanları doldurun")
      return
    }

    setSubmitting(true)
    setUploading(true)

    try {
      // Upload image if selected
      let uploadedImageUrl = null
      if (formData.file) {
        uploadedImageUrl = await uploadToCloudinary(formData.file)
      }

      // Save to database via API
      const response = await fetch('/api/lab-tests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: formData.title,
          documentNo: formData.documentNo,
          sampleType: formData.sampleType,
          testType: formData.testType,
          result: formData.result || null,
          testResult: formData.testResult,
          testDate: formData.testDate,
          imageUrl: uploadedImageUrl,
          notes: formData.notes || null,
          projectId: formData.projectId
        })
      })

      if (response.ok) {
        toast.success("Laboratuvar testi başarıyla kaydedildi")
        setIsModalOpen(false)
        resetForm()
        fetchLabTests()
      } else {
        const errorData = await response.json()
        toast.error(errorData.error || "Kayıt sırasında hata oluştu")
      }
    } catch (error) {
      console.error('Submit error:', error)
      toast.error("Bir hata oluştu")
    } finally {
      setSubmitting(false)
      setUploading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      title: "",
      documentNo: "",
      sampleType: "BETON",
      testType: "7_GUN",
      result: "",
      testResult: "PASS",
      testDate: "",
      notes: "",
      projectId: "",
      file: null as File | null
    })
    setImageUrl(null)
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('tr-TR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })
  }

  const getSampleTypeBadge = (type: string) => {
    const typeMap = {
      'BETON': { bg: 'bg-blue-500/20', text: 'text-blue-400', label: 'Beton' },
      'DONATI': { bg: 'bg-purple-500/20', text: 'text-purple-400', label: 'Donatı' },
      'TOPRAK': { bg: 'bg-amber-500/20', text: 'text-amber-400', label: 'Toprak' },
      'DIGER': { bg: 'bg-slate-500/20', text: 'text-slate-400', label: 'Diğer' }
    }
    const t = typeMap[type as keyof typeof typeMap] || typeMap['DIGER']
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium ${t.bg} ${t.text}`}>
        {t.label}
      </span>
    )
  }

  const getTestResultBadge = (result: string) => {
    const resultMap = {
      'PASS': { bg: 'bg-green-500/20', text: 'text-green-400', label: 'Geçti' },
      'FAIL': { bg: 'bg-red-500/20', text: 'text-red-400', label: 'Kaldı' },
      'PENDING': { bg: 'bg-yellow-500/20', text: 'text-yellow-400', label: 'Bekliyor' }
    }
    const r = resultMap[result as keyof typeof resultMap] || resultMap['PENDING']
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium ${r.bg} ${r.text}`}>
        {r.label}
      </span>
    )
  }

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <div className="text-slate-400">Yükleniyor...</div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <FileText className="w-8 h-8 text-blue-400" />
            Numune ve Karot Sonuçları
          </h1>
          <p className="text-slate-400 mt-1">Laboratuvar test sonuçları ve numune kayıtları</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors"
        >
          <Plus className="w-5 h-5" />
          Yeni Test Ekle
        </button>
      </div>

      {/* Lab Tests Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {labTests.length > 0 ? (
          labTests.map((test) => (
            <div key={test.id} className="bg-slate-900/50 backdrop-blur-lg rounded-2xl border border-slate-800 p-4 hover:border-slate-700 transition-all">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-slate-800 rounded-xl">
                    <FileText className="w-6 h-6 text-slate-400" />
                  </div>
                  <div>
                    <h3 className="text-white font-medium">{test.title}</h3>
                    <p className="text-slate-400 text-sm">{test.documentNo}</p>
                  </div>
                </div>
                {getTestResultBadge(test.testResult)}
              </div>
              
              <div className="space-y-2 mb-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-400">Numune Tipi:</span>
                  {getSampleTypeBadge(test.sampleType)}
                </div>
                {test.testType && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-400">Test Tipi:</span>
                    <span className="text-white">{test.testType === '7_GUN' ? '7 Gün' : test.testType === '28_GUN' ? '28 Gün' : 'Karot'}</span>
                  </div>
                )}
                {test.result && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-400">Sonuç:</span>
                    <span className="text-white font-medium">{test.result}</span>
                  </div>
                )}
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-400">Test Tarihi:</span>
                  <span className="text-white">{formatDate(test.testDate)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-400">Proje:</span>
                  <span className="text-white text-xs">{test.project?.name || test.project?.title || '-'}</span>
                </div>
              </div>

              {test.imageUrl && (
                <div className="flex items-center gap-2 pt-3 border-t border-slate-800">
                  <a 
                    href={test.imageUrl} 
                    target="_blank"
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-slate-800 text-slate-300 rounded-lg hover:bg-slate-700 transition-colors text-sm"
                  >
                    <Download className="w-4 h-4" />
                    Görüntüle
                  </a>
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="col-span-full text-center py-16 bg-slate-900/50 backdrop-blur-lg rounded-2xl border border-slate-800">
            <FileText className="w-16 h-16 mx-auto mb-4 text-slate-600" />
            <h3 className="text-xl font-semibold text-white mb-2">Henüz test kaydı yok</h3>
            <p className="text-slate-400">Yeni test eklemek için butona tıklayın</p>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 rounded-2xl p-6 max-w-2xl w-full border border-slate-800 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-white">Yeni Laboratuvar Testi Ekle</h3>
              <button
                onClick={() => {
                  setIsModalOpen(false)
                  resetForm()
                }}
                className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-slate-400 mb-2">Test Başlığı *</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Örn: C25 Beton Dayanım Testi"
                    className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm text-slate-400 mb-2">Belge No *</label>
                  <input
                    type="text"
                    value={formData.documentNo}
                    onChange={(e) => setFormData({ ...formData, documentNo: e.target.value })}
                    placeholder="Örn: LAB-2024-001"
                    className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm text-slate-400 mb-2">Numune Tipi *</label>
                  <select
                    value={formData.sampleType}
                    onChange={(e) => setFormData({ ...formData, sampleType: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-blue-500 transition-colors"
                  >
                    <option value="BETON">Beton</option>
                    <option value="DONATI">Donatı</option>
                    <option value="TOPRAK">Toprak</option>
                    <option value="DIGER">Diğer</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm text-slate-400 mb-2">Test Tipi</label>
                  <select
                    value={formData.testType}
                    onChange={(e) => setFormData({ ...formData, testType: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-blue-500 transition-colors"
                  >
                    <option value="7_GUN">7 Gün</option>
                    <option value="28_GUN">28 Gün</option>
                    <option value="KAROT">Karot</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm text-slate-400 mb-2">Sonuç (Dayanım Değeri)</label>
                  <input
                    type="text"
                    value={formData.result}
                    onChange={(e) => setFormData({ ...formData, result: e.target.value })}
                    placeholder="Örn: 32 MPa"
                    className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-sm text-slate-400 mb-2">Test Sonucu *</label>
                  <select
                    value={formData.testResult}
                    onChange={(e) => setFormData({ ...formData, testResult: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-blue-500 transition-colors"
                  >
                    <option value="PASS">Geçti</option>
                    <option value="FAIL">Kaldı</option>
                    <option value="PENDING">Bekliyor</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm text-slate-400 mb-2">Test Tarihi *</label>
                  <input
                    type="date"
                    value={formData.testDate}
                    onChange={(e) => setFormData({ ...formData, testDate: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-blue-500 transition-colors"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm text-slate-400 mb-2">Proje *</label>
                  <select
                    value={formData.projectId}
                    onChange={(e) => setFormData({ ...formData, projectId: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-blue-500 transition-colors"
                    required
                  >
                    <option value="">Proje Seçin</option>
                    {projects.map((project) => (
                      <option key={project.id} value={project.id}>
                        {project.name || project.title}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-2">Notlar</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Ek notlar..."
                  rows={3}
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-2">Görsel Yükle</label>
                <input
                  type="file"
                  onChange={handleFileSelect}
                  accept="image/*"
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-blue-500 transition-colors"
                />
                {formData.file && (
                  <p className="text-green-400 text-sm mt-2">{formData.file.name}</p>
                )}
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false)
                    resetForm()
                  }}
                  className="flex-1 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-xl transition-colors"
                  disabled={submitting}
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Kaydediliyor...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-5 h-5" />
                      <span>Kaydet</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
