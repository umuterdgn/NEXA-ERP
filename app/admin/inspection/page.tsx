"use client"
/**
 * 
 * Developer: Umut Erdoğan
 * This code is the property of NXA Software.
 */


import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Building2, TestTube, FileText, Plus, CheckCircle, XCircle, Clock, AlertTriangle, X, Edit, Upload, Trash2, Sparkles } from "lucide-react"
import AIAssistantModal from "@/components/AIAssistantModal"

export default function InspectionPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState("samples")
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isKarotModalOpen, setIsKarotModalOpen] = useState(false)
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [selectedTest, setSelectedTest] = useState<any>(null)
  const [showToast, setShowToast] = useState(false)
  const [updating, setUpdating] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [projects, setProjects] = useState<any[]>([])
  const [concreteTests, setConcreteTests] = useState<any[]>([])
  const [karotTests, setKarotTests] = useState<any[]>([])
  const [karotFormData, setKarotFormData] = useState({
    location: "",
    element: "",
    strength: "",
    testDate: "",
    projectId: "",
    reportFile: null as File | null,
    aiWeatherContext: "",
    aiExpertAdvice: ""
  })
  const [isKarotUpdateModalOpen, setIsKarotUpdateModalOpen] = useState(false)
  const [selectedKarot, setSelectedKarot] = useState<any>(null)
  const [karotUpdateFormData, setKarotUpdateFormData] = useState({
    strength: "",
    status: "BEKLIYOR",
    reportFile: null as File | null
  })
  const [sampleFormData, setSampleFormData] = useState({
    castDate: "",
    concreteClass: "",
    element: "",
    waybillNo: "",
    projectId: ""
  })
  const [updateFormData, setUpdateFormData] = useState({
    day7Result: "",
    day28Result: "",
    status: "BEKLIYOR",
    reportFile: null as File | null
  })
  const [editFormData, setEditFormData] = useState({
    concreteClass: "",
    element: "",
    waybillNo: "",
    castDate: ""
  })
  const [isAIAssistantOpen, setIsAIAssistantOpen] = useState(false)

  useEffect(() => {
    fetchProjects()
    fetchConcreteTests()
    fetchKarotTests()
  }, [])

  const fetchProjects = async () => {
    try {
      const response = await fetch("/api/admin/projects")
      const data = await response.json()
      setProjects(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error("Failed to fetch projects:", error)
    }
  }

  const fetchConcreteTests = async () => {
    try {
      const response = await fetch("/api/inspection/concrete")
      const data = await response.json()
      setConcreteTests(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error("Failed to fetch concrete tests:", error)
    }
  }

  const fetchKarotTests = async () => {
    try {
      const response = await fetch("/api/inspection/core")
      const data = await response.json()
      setKarotTests(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error("Failed to fetch karot tests:", error)
    }
  }

  const getStatusBadge = (status: string) => {
    const statusMap = {
      'GECTI': { bg: 'bg-green-500/20', text: 'text-green-400', label: 'Geçti', icon: CheckCircle },
      'KALDI': { bg: 'bg-red-500/20', text: 'text-red-400', label: 'Kaldı', icon: XCircle },
      'BEKLIYOR': { bg: 'bg-yellow-500/20', text: 'text-yellow-400', label: 'Bekliyor', icon: Clock },
      'KAROT_ISTENDI': { bg: 'bg-orange-500/20', text: 'text-orange-400', label: 'Karot İstendi', icon: AlertTriangle }
    }
    const s = statusMap[status as keyof typeof statusMap] || statusMap['BEKLIYOR']
    const Icon = s.icon
    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${s.bg} ${s.text}`}>
        <Icon className="w-3.5 h-3.5" />
        {s.label}
      </span>
    )
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('tr-TR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })
  }

  const handleUpdateClick = (test: any) => {
    setSelectedTest(test)
    setUpdateFormData({
      day7Result: test.day7Result?.toString() || "",
      day28Result: test.day28Result?.toString() || "",
      status: test.status,
      reportFile: null
    })
    setIsUpdateModalOpen(true)
  }

  const handleKarotUpdateClick = (karot: any) => {
    setSelectedKarot(karot)
    setKarotUpdateFormData({
      strength: karot.strength?.replace(" MPa", "") || "",
      status: karot.status === "ONAYLANDI" ? "GECTI" : "BEKLIYOR",
      reportFile: null
    })
    setIsKarotUpdateModalOpen(true)
  }

  const handleDelete = async (id: string, type: 'concrete' | 'karot') => {
    if (!window.confirm("Bu kaydı silmek istediğinize emin misiniz?")) {
      return
    }

    try {
      const endpoint = type === 'concrete' ? '/api/inspection/concrete' : '/api/inspection/core'
      const response = await fetch(`${endpoint}/${id}`, { method: 'DELETE' })
      
      if (!response.ok) {
        throw new Error('Silme işlemi başarısız')
      }

      if (type === 'concrete') {
        fetchConcreteTests()
      } else {
        fetchKarotTests()
      }
      
      setShowToast(true)
      setTimeout(() => setShowToast(false), 3000)
    } catch (error) {
      console.error('Delete error:', error)
      alert('Silme işlemi sırasında hata oluştu')
    }
  }

  const handleEditClick = (test: any) => {
    setSelectedTest(test)
    setEditFormData({
      concreteClass: test.concreteClass || "",
      element: test.element || "",
      waybillNo: test.waybillNo || "",
      castDate: test.castDate ? new Date(test.castDate).toISOString().split('T')[0] : ""
    })
    setIsEditModalOpen(true)
  }

  const handleEditSubmit = async () => {
    if (!selectedTest) return

    try {
      const response = await fetch(`/api/inspection/concrete/${selectedTest.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editFormData)
      })

      if (!response.ok) {
        throw new Error('Güncelleme başarısız')
      }

      fetchConcreteTests()
      setIsEditModalOpen(false)
      setShowToast(true)
      setTimeout(() => setShowToast(false), 3000)
    } catch (error) {
      console.error('Edit error:', error)
      alert('Güncelleme sırasında hata oluştu')
    }
  }

  const handleAIResult = (data: any) => {
    // Populate karot form with AI result
    setKarotFormData({
      location: data.location || "",
      element: "",
      strength: "",
      testDate: new Date().toISOString().split('T')[0],
      projectId: "",
      reportFile: null,
      aiWeatherContext: data.weatherContext || "",
      aiExpertAdvice: data.expertAdvice || ""
    })
    setIsKarotModalOpen(true)
  }

  const handleKarotUpdateSubmit = async () => {
    if (!selectedKarot) return

    setUpdating(true)

    try {
      let reportUrl = selectedKarot.reportUrl

      // Upload report file if provided
      if (karotUpdateFormData.reportFile) {
        const uploadFormData = new FormData()
        uploadFormData.append('file', karotUpdateFormData.reportFile)
        uploadFormData.append('upload_preset', process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || 'ml_default')

        const uploadResponse = await fetch(`https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`, {
          method: 'POST',
          body: uploadFormData
        })

        const uploadData = await uploadResponse.json()

        if (uploadData.secure_url) {
          reportUrl = uploadData.secure_url
        }
      }

      // Update karot test
      const updateResponse = await fetch(`/api/inspection/core/${selectedKarot.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          strength: karotUpdateFormData.strength ? parseFloat(karotUpdateFormData.strength) : null,
          status: karotUpdateFormData.status,
          reportUrl
        })
      })

      if (updateResponse.ok) {
        setIsKarotUpdateModalOpen(false)
        setShowToast(true)
        setTimeout(() => setShowToast(false), 3000)
        router.refresh()
      }
    } catch (error) {
      console.error('Karot update error:', error)
      alert('Bir hata oluştu')
    } finally {
      setUpdating(false)
    }
  }

  const handleUpdateSubmit = async () => {
    if (!selectedTest) return

    setUploading(true)

    try {
      let reportUrl = selectedTest.reportUrl

      // Upload report file if provided
      if (updateFormData.reportFile) {
        const uploadFormData = new FormData()
        uploadFormData.append('file', updateFormData.reportFile)
        uploadFormData.append('upload_preset', process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || 'ml_default')

        const uploadResponse = await fetch(`https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`, {
          method: 'POST',
          body: uploadFormData
        })

        const uploadData = await uploadResponse.json()

        if (uploadData.secure_url) {
          reportUrl = uploadData.secure_url
        }
      }

      // Update concrete test
      const updateResponse = await fetch(`/api/inspection/concrete/${selectedTest.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          day7Result: updateFormData.day7Result ? parseFloat(updateFormData.day7Result) : null,
          day28Result: updateFormData.day28Result ? parseFloat(updateFormData.day28Result) : null,
          status: updateFormData.status,
          reportUrl
        })
      })

      if (updateResponse.ok) {
        setIsUpdateModalOpen(false)
        setShowToast(true)
        setTimeout(() => setShowToast(false), 3000)
        router.refresh()
      }
    } catch (error) {
      console.error('Update error:', error)
      alert('Bir hata oluştu')
    } finally {
      setUpdating(false)
    }
  }

  const getTestWarning = (castDate: string, day7Result: number | null, day28Result: number | null) => {
    const cast = new Date(castDate)
    const now = new Date()
    const daysSinceCast = Math.floor((now.getTime() - cast.getTime()) / (1000 * 60 * 60 * 24))

    if (daysSinceCast >= 7 && day7Result === null) {
      return <span className="text-red-400 text-xs font-medium">⚠️ Uyarı: 7. Gün Kırım Zamanı Geldi!</span>
    }
    if (daysSinceCast >= 28 && day28Result === null) {
      return <span className="text-red-400 text-xs font-medium">⚠️ Uyarı: 28. Gün Kırım Zamanı Geldi!</span>
    }
    if (daysSinceCast >= 7 && day7Result !== null && daysSinceCast < 28 && day28Result === null) {
      return <span className="text-yellow-400 text-xs font-medium">⏰ 28. Gün Bekleniyor</span>
    }
    return null
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <Building2 className="w-8 h-8 text-blue-400" />
            Laboratuvar ve Evrak Asistanı
          </h1>
          <p className="text-slate-400 mt-1">Beton numune takibi, karot sonuçları ve evrak yönetimi</p>
        </div>
        {activeTab === "samples" && (
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors"
          >
            <Plus className="w-5 h-5" />
            Yeni Numune Ekle
          </button>
        )}
        {activeTab === "core" && (
          <div className="flex gap-2">
            <button 
              onClick={() => setIsAIAssistantOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white rounded-lg transition-colors"
            >
              <Sparkles className="w-5 h-5" />
              AI Asistan ile Raporla
            </button>
            <button 
              onClick={() => setIsKarotModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors"
            >
              <Plus className="w-5 h-5" />
              Yeni Karot Ekle
            </button>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="bg-slate-900/50 backdrop-blur-lg rounded-2xl border border-slate-800 overflow-hidden">
        {/* Tab Headers */}
        <div className="flex border-b border-slate-800">
          <button
            onClick={() => setActiveTab("samples")}
            className={`flex-1 px-6 py-4 font-medium transition-colors ${
              activeTab === "samples"
                ? "text-blue-400 border-b-2 border-blue-400 bg-slate-800/50"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <TestTube className="w-4 h-4" />
              7/28 Gün Numuneleri
            </div>
          </button>
          <button
            onClick={() => setActiveTab("core")}
            className={`flex-1 px-6 py-4 font-medium transition-colors ${
              activeTab === "core"
                ? "text-blue-400 border-b-2 border-blue-400 bg-slate-800/50"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <Building2 className="w-4 h-4" />
              Karot Sonuçları
            </div>
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === "samples" && (
            <div className="space-y-4">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-800">
                      <th className="text-left px-4 py-3 text-slate-400 font-medium text-sm">Beton Tarihi</th>
                      <th className="text-left px-4 py-3 text-slate-400 font-medium text-sm">Dökülen Yer (Eleman)</th>
                      <th className="text-left px-4 py-3 text-slate-400 font-medium text-sm">Sınıf</th>
                      <th className="text-left px-4 py-3 text-slate-400 font-medium text-sm">İrsaliye No</th>
                      <th className="text-left px-4 py-3 text-slate-400 font-medium text-sm">7. Gün Sonucu</th>
                      <th className="text-left px-4 py-3 text-slate-400 font-medium text-sm">28. Gün Sonucu</th>
                      <th className="text-left px-4 py-3 text-slate-400 font-medium text-sm">Durum</th>
                      <th className="text-left px-4 py-3 text-slate-400 font-medium text-sm">İşlemler</th>
                    </tr>
                  </thead>
                  <tbody>
                    {concreteTests.map((test) => (
                      <tr key={test.id} className="border-b border-slate-800 hover:bg-slate-800/50 transition-colors">
                        <td className="px-4 py-3 text-white text-sm">{formatDate(test.castDate)}</td>
                        <td className="px-4 py-3 text-white font-medium text-sm">{test.element}</td>
                        <td className="px-4 py-3 text-slate-300 text-sm">{test.concreteClass}</td>
                        <td className="px-4 py-3 text-slate-400 text-sm">{test.waybillNo || '-'}</td>
                        <td className="px-4 py-3 text-white text-sm">
                          {test.day7Result ? `${test.day7Result} MPa` : '-'}
                          {getTestWarning(test.castDate, test.day7Result, test.day28Result)}
                        </td>
                        <td className="px-4 py-3 text-white text-sm">
                          {test.day28Result ? `${test.day28Result} MPa` : '-'}
                        </td>
                        <td className="px-4 py-3">{getStatusBadge(test.status)}</td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {test.reportUrl && (
                              <a
                                href={test.reportUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center justify-center px-3 py-1.5 bg-slate-700 text-slate-200 text-xs rounded-md hover:bg-slate-600 transition-colors"
                              >
                                📄 Rapor
                              </a>
                            )}
                            <button
                              onClick={() => handleEditClick(test)}
                              className="inline-flex items-center justify-center px-3 py-1.5 bg-amber-600 text-white text-xs rounded-md hover:bg-amber-700 transition-colors"
                            >
                              ⚙️ Düzenle
                            </button>
                            <button
                              onClick={() => handleUpdateClick(test)}
                              className="inline-flex items-center justify-center px-3 py-1.5 bg-blue-600 text-white text-xs rounded-md hover:bg-blue-700 transition-colors"
                            >
                              ✏️ Sonuç Gir
                            </button>
                            <button
                              onClick={() => handleDelete(test.id, 'concrete')}
                              className="inline-flex items-center justify-center px-3 py-1.5 bg-red-600 text-white text-xs rounded-md hover:bg-red-700 transition-colors"
                            >
                              🗑️ Sil
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === "core" && (
            <div className="space-y-4">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-800">
                      <th className="text-left px-4 py-3 text-slate-400 font-medium text-sm">Konum</th>
                      <th className="text-left px-4 py-3 text-slate-400 font-medium text-sm">Test Tarihi</th>
                      <th className="text-left px-4 py-3 text-slate-400 font-medium text-sm">Dayanım</th>
                      <th className="text-left px-4 py-3 text-slate-400 font-medium text-sm">Sonuç</th>
                      <th className="text-left px-4 py-3 text-slate-400 font-medium text-sm">Durum</th>
                      <th className="text-left px-4 py-3 text-slate-400 font-medium text-sm">İşlemler</th>
                    </tr>
                  </thead>
                  <tbody>
                    {karotTests.map((core: any) => (
                      <tr key={core.id} className="border-b border-slate-800 hover:bg-slate-800/50 transition-colors">
                        <td className="px-4 py-3 text-white font-medium text-sm">{core.location}</td>
                        <td className="px-4 py-3 text-slate-300 text-sm">{formatDate(core.testDate)}</td>
                        <td className="px-4 py-3 text-white text-sm">{core.strength}</td>
                        <td className="px-4 py-3">
                          {core.result === 'GEÇTI' ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-green-500/20 text-green-400">
                              <CheckCircle className="w-3.5 h-3.5" />
                              Geçti
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-yellow-500/20 text-yellow-400">
                              <Clock className="w-3.5 h-3.5" />
                              Bekliyor
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {core.status === 'ONAYLANDI' ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-blue-500/20 text-blue-400">
                              Onaylandı
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-slate-500/20 text-slate-400">
                              Bekliyor
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {core.reportUrl && (
                              <a
                                href={core.reportUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center justify-center px-3 py-1.5 bg-slate-700 text-slate-200 text-xs rounded-md hover:bg-slate-600 transition-colors"
                              >
                                📄 Rapor
                              </a>
                            )}
                            <button
                              onClick={() => handleKarotUpdateClick(core)}
                              className="inline-flex items-center justify-center px-3 py-1.5 bg-blue-600 text-white text-xs rounded-md hover:bg-blue-700 transition-colors"
                            >
                              ✏️ Sonuç Gir
                            </button>
                            <button
                              onClick={() => handleDelete(core.id, 'karot')}
                              className="inline-flex items-center justify-center px-3 py-1.5 bg-red-600 text-white text-xs rounded-md hover:bg-red-700 transition-colors"
                            >
                              🗑️ Sil
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal for New Sample */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 rounded-2xl border border-slate-800 w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-slate-800">
              <h2 className="text-xl font-bold text-white">Yeni Numune Ekle</h2>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-slate-400 text-sm mb-2">Proje Seçin</label>
                <select 
                  value={sampleFormData.projectId}
                  onChange={(e) => setSampleFormData({ ...sampleFormData, projectId: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="">Seçiniz</option>
                  {projects.map((proj) => (
                    <option key={proj.id} value={proj.id}>{proj.name || proj.title}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-slate-400 text-sm mb-2">Döküm Tarihi</label>
                <input 
                  type="date" 
                  value={sampleFormData.castDate}
                  onChange={(e) => setSampleFormData({ ...sampleFormData, castDate: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-slate-400 text-sm mb-2">Beton Sınıfı</label>
                <select 
                  value={sampleFormData.concreteClass}
                  onChange={(e) => setSampleFormData({ ...sampleFormData, concreteClass: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="">Seçiniz</option>
                  <option value="C20">C20</option>
                  <option value="C25">C25</option>
                  <option value="C30">C30</option>
                  <option value="C35">C35</option>
                  <option value="C40">C40</option>
                  <option value="C45">C45</option>
                </select>
              </div>
              <div>
                <label className="block text-slate-400 text-sm mb-2">Dökülen Yer (Eleman)</label>
                <input 
                  type="text" 
                  placeholder="Örn: A Blok - 1. Kat Kolonları"
                  value={sampleFormData.element}
                  onChange={(e) => setSampleFormData({ ...sampleFormData, element: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-slate-400 text-sm mb-2">İrsaliye No</label>
                <input 
                  type="text" 
                  placeholder="Örn: IRS-2024-001"
                  value={sampleFormData.waybillNo}
                  onChange={(e) => setSampleFormData({ ...sampleFormData, waybillNo: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
            <div className="p-6 border-t border-slate-800 flex justify-end gap-3">
              <button 
                onClick={() => {
                  setIsModalOpen(false)
                  setSampleFormData({ castDate: "", concreteClass: "", element: "", waybillNo: "", projectId: "" })
                }}
                className="px-4 py-2 text-slate-400 hover:text-white transition-colors"
              >
                İptal
              </button>
              <button 
                onClick={async () => {
                  if (!sampleFormData.projectId || !sampleFormData.castDate || !sampleFormData.concreteClass) {
                    alert("Lütfen proje, tarih ve beton sınıfı seçin")
                    return
                  }
                  setUploading(true)
                  try {
                    // Save sample data (API endpoint to be created)
                    console.log("Sample data:", sampleFormData)
                    setIsModalOpen(false)
                    setSampleFormData({ castDate: "", concreteClass: "", element: "", waybillNo: "", projectId: "" })
                    setShowToast(true)
                    setTimeout(() => setShowToast(false), 3000)
                  } catch (error) {
                    console.error('Sample save error:', error)
                    alert('Bir hata oluştu')
                  } finally {
                    setUploading(false)
                  }
                }}
                disabled={updating}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {updating ? 'Kaydediliyor...' : 'Kaydet'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal for New Karot */}
      {isKarotModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 rounded-2xl border border-slate-800 w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-slate-800">
              <h2 className="text-xl font-bold text-white">Yeni Karot Ekle</h2>
              <button 
                onClick={() => setIsKarotModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-slate-400 text-sm mb-2">Proje Seçin</label>
                <select 
                  value={karotFormData.projectId || ""}
                  onChange={(e) => setKarotFormData({ ...karotFormData, projectId: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="">Seçiniz</option>
                  {projects.map((proj) => (
                    <option key={proj.id} value={proj.id}>{proj.name || proj.title}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-slate-400 text-sm mb-2">Konum</label>
                <input 
                  type="text" 
                  placeholder="Örn: A Blok - Kat 3"
                  value={karotFormData.location}
                  onChange={(e) => setKarotFormData({ ...karotFormData, location: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-slate-400 text-sm mb-2">Eleman</label>
                <input 
                  type="text" 
                  placeholder="Örn: Kolon, Kiriş"
                  value={karotFormData.element}
                  onChange={(e) => setKarotFormData({ ...karotFormData, element: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-slate-400 text-sm mb-2">Dayanım Sonucu (MPa)</label>
                <input 
                  type="number" 
                  placeholder="Örn: 32"
                  value={karotFormData.strength}
                  onChange={(e) => setKarotFormData({ ...karotFormData, strength: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-slate-400 text-sm mb-2">Test Tarihi</label>
                <input 
                  type="date" 
                  value={karotFormData.testDate}
                  onChange={(e) => setKarotFormData({ ...karotFormData, testDate: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-slate-400 text-sm mb-2">Laboratuvar Raporu (PDF/Görsel)</label>
                <input 
                  type="file" 
                  accept=".pdf,image/*"
                  onChange={(e) => setKarotFormData({ ...karotFormData, reportFile: e.target.files?.[0] || null })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                />
                {karotFormData.reportFile && (
                  <p className="text-green-400 text-sm mt-2">{karotFormData.reportFile.name}</p>
                )}
              </div>
              
              {/* AI Insight Boxes */}
              {karotFormData.aiWeatherContext && (
                <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-amber-500/20 rounded-lg">
                      <span className="text-amber-400 text-lg">🌡️</span>
                    </div>
                    <div>
                      <h4 className="text-amber-400 font-medium text-sm mb-1">Hava Durumu Notu</h4>
                      <p className="text-slate-300 text-sm">{karotFormData.aiWeatherContext}</p>
                    </div>
                  </div>
                </div>
              )}
              
              {karotFormData.aiExpertAdvice && (
                <div className="bg-indigo-500/10 border border-indigo-500/30 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-indigo-500/20 rounded-lg">
                      <span className="text-indigo-400 text-lg">✨</span>
                    </div>
                    <div>
                      <h4 className="text-indigo-400 font-medium text-sm mb-1">AI Uzman Tavsiyesi</h4>
                      <p className="text-slate-300 text-sm">{karotFormData.aiExpertAdvice}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div className="p-6 border-t border-slate-800 flex justify-end gap-3">
              <button 
                onClick={() => setIsKarotModalOpen(false)}
                className="px-4 py-2 text-slate-400 hover:text-white transition-colors"
              >
                İptal
              </button>
              <button 
                onClick={async () => {
                  if (!karotFormData.location || !karotFormData.element) {
                    alert("Lütfen konum ve eleman girin")
                    return
                  }
                  setUploading(true)
                  try {
                    let reportUrl = null
                    if (karotFormData.reportFile) {
                      const uploadFormData = new FormData()
                      uploadFormData.append('file', karotFormData.reportFile)
                      uploadFormData.append('upload_preset', process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || 'ml_default')
                      const uploadResponse = await fetch(`https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`, {
                        method: 'POST',
                        body: uploadFormData
                      })
                      const uploadData = await uploadResponse.json()
                      if (uploadData.secure_url) {
                        reportUrl = uploadData.secure_url
                      }
                    }
                    // Save karot data (API endpoint to be created)
                    console.log("Karot data:", { ...karotFormData, reportUrl })
                    setIsKarotModalOpen(false)
                    setKarotFormData({ location: "", element: "", strength: "", testDate: "", projectId: "", reportFile: null, aiWeatherContext: "", aiExpertAdvice: "" })
                    setShowToast(true)
                    setTimeout(() => setShowToast(false), 3000)
                  } catch (error) {
                    console.error('Karot save error:', error)
                    alert('Bir hata oluştu')
                  } finally {
                    setUploading(false)
                  }
                }}
                disabled={updating}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {updating ? 'Kaydediliyor...' : 'Kaydet'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal for Update Karot Results */}
      {isKarotUpdateModalOpen && selectedKarot && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 rounded-2xl border border-slate-800 w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-slate-800">
              <h2 className="text-xl font-bold text-white">Karot Sonuçlarını Güncelle</h2>
              <button 
                onClick={() => setIsKarotUpdateModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-slate-800 rounded-lg p-3 mb-4">
                <p className="text-slate-400 text-sm">{selectedKarot.location}</p>
                <p className="text-white font-medium">{formatDate(selectedKarot.testDate)}</p>
              </div>
              
              <div>
                <label className="block text-slate-400 text-sm mb-2">Dayanım Sonucu (MPa)</label>
                <input 
                  type="number" 
                  step="0.1"
                  value={karotUpdateFormData.strength}
                  onChange={(e) => setKarotUpdateFormData({ ...karotUpdateFormData, strength: e.target.value })}
                  placeholder="Örn: 32"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-slate-400 text-sm mb-2">Sonuç/Durum</label>
                <select 
                  value={karotUpdateFormData.status}
                  onChange={(e) => setKarotUpdateFormData({ ...karotUpdateFormData, status: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="BEKLIYOR">Bekliyor</option>
                  <option value="GECTI">Geçti</option>
                  <option value="KALDI">Kaldı</option>
                </select>
              </div>
              
              <div>
                <label className="block text-slate-400 text-sm mb-2">Resmi Rapor (PDF/Görsel)</label>
                <input 
                  type="file" 
                  accept=".pdf,image/*"
                  onChange={(e) => setKarotUpdateFormData({ ...karotUpdateFormData, reportFile: e.target.files?.[0] || null })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                />
                {karotUpdateFormData.reportFile && (
                  <p className="text-green-400 text-sm mt-2">{karotUpdateFormData.reportFile.name}</p>
                )}
                {selectedKarot.reportUrl && !karotUpdateFormData.reportFile && (
                  <p className="text-slate-400 text-sm mt-2">Mevcut rapor: <a href={selectedKarot.reportUrl} target="_blank" className="text-blue-400 hover:text-blue-300">Görüntüle</a></p>
                )}
              </div>
            </div>
            <div className="p-6 border-t border-slate-800 flex justify-end gap-3">
              <button 
                onClick={() => setIsKarotUpdateModalOpen(false)}
                className="px-4 py-2 text-slate-400 hover:text-white transition-colors"
              >
                İptal
              </button>
              <button 
                onClick={handleKarotUpdateSubmit}
                disabled={updating}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {updating ? 'Güncelleniyor...' : 'Güncelle'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal for Update Concrete Test Results */}
      {isUpdateModalOpen && selectedTest && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 rounded-2xl border border-slate-800 w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-slate-800">
              <h2 className="text-xl font-bold text-white">Numune Sonuçlarını Güncelle</h2>
              <button 
                onClick={() => setIsUpdateModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-slate-800 rounded-lg p-3 mb-4">
                <p className="text-slate-400 text-sm">{selectedTest.element}</p>
                <p className="text-white font-medium">{selectedTest.concreteClass} - {formatDate(selectedTest.castDate)}</p>
              </div>
              
              <div>
                <label className="block text-slate-400 text-sm mb-2">7. Gün Kırım Sonucu (MPa)</label>
                <input 
                  type="number" 
                  step="0.1"
                  value={updateFormData.day7Result}
                  onChange={(e) => setUpdateFormData({ ...updateFormData, day7Result: e.target.value })}
                  placeholder="Örn: 28.5"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-slate-400 text-sm mb-2">28. Gün Kırım Sonucu (MPa)</label>
                <input 
                  type="number" 
                  step="0.1"
                  value={updateFormData.day28Result}
                  onChange={(e) => setUpdateFormData({ ...updateFormData, day28Result: e.target.value })}
                  placeholder="Örn: 38.5"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-slate-400 text-sm mb-2">Durum</label>
                <select 
                  value={updateFormData.status}
                  onChange={(e) => setUpdateFormData({ ...updateFormData, status: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="BEKLIYOR">Bekliyor</option>
                  <option value="GECTI">Geçti</option>
                  <option value="KALDI">Kaldı</option>
                  <option value="KAROT_ISTENDI">Karot İstendi</option>
                </select>
              </div>
              
              <div>
                <label className="block text-slate-400 text-sm mb-2">Laboratuvar Raporu</label>
                <input 
                  type="file" 
                  accept=".pdf,image/*"
                  onChange={(e) => setUpdateFormData({ ...updateFormData, reportFile: e.target.files?.[0] || null })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                />
                {updateFormData.reportFile && (
                  <p className="text-green-400 text-sm mt-2">{updateFormData.reportFile.name}</p>
                )}
                {selectedTest.reportUrl && !updateFormData.reportFile && (
                  <p className="text-slate-400 text-sm mt-2">Mevcut rapor: <a href={selectedTest.reportUrl} target="_blank" className="text-blue-400 hover:text-blue-300">Görüntüle</a></p>
                )}
              </div>
            </div>
            <div className="p-6 border-t border-slate-800 flex justify-end gap-3">
              <button 
                onClick={() => setIsUpdateModalOpen(false)}
                className="px-4 py-2 text-slate-400 hover:text-white transition-colors"
              >
                İptal
              </button>
              <button 
                onClick={handleUpdateSubmit}
                disabled={updating}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {updating ? 'Güncelleniyor...' : 'Güncelle'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal for Edit Basic Info */}
      {isEditModalOpen && selectedTest && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 rounded-2xl border border-slate-800 w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-slate-800">
              <h2 className="text-xl font-bold text-white">Temel Bilgileri Düzenle</h2>
              <button 
                onClick={() => setIsEditModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-slate-400 text-sm mb-2">Beton Sınıfı</label>
                <select 
                  value={editFormData.concreteClass}
                  onChange={(e) => setEditFormData({ ...editFormData, concreteClass: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="">Seçiniz</option>
                  <option value="C20">C20</option>
                  <option value="C25">C25</option>
                  <option value="C30">C30</option>
                  <option value="C35">C35</option>
                  <option value="C40">C40</option>
                  <option value="C45">C45</option>
                </select>
              </div>
              <div>
                <label className="block text-slate-400 text-sm mb-2">Dökülen Yer (Eleman)</label>
                <input 
                  type="text" 
                  value={editFormData.element}
                  onChange={(e) => setEditFormData({ ...editFormData, element: e.target.value })}
                  placeholder="Örn: A Blok - 1. Kat Kolonları"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-slate-400 text-sm mb-2">İrsaliye No</label>
                <input 
                  type="text" 
                  value={editFormData.waybillNo}
                  onChange={(e) => setEditFormData({ ...editFormData, waybillNo: e.target.value })}
                  placeholder="Örn: IRS-2024-001"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-slate-400 text-sm mb-2">Döküm Tarihi</label>
                <input 
                  type="date" 
                  value={editFormData.castDate}
                  onChange={(e) => setEditFormData({ ...editFormData, castDate: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
            <div className="p-6 border-t border-slate-800 flex justify-end gap-3">
              <button 
                onClick={() => setIsEditModalOpen(false)}
                className="px-4 py-2 text-slate-400 hover:text-white transition-colors"
              >
                İptal
              </button>
              <button 
                onClick={handleEditSubmit}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-lg transition-colors"
              >
                Güncelle
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {showToast && (
        <div className="fixed bottom-4 right-4 bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg z-50 flex items-center gap-2">
          <CheckCircle className="w-5 h-5" />
          Numune sonuçları güncellendi
        </div>
      )}

      {/* AI Assistant Modal */}
      <AIAssistantModal
        isOpen={isAIAssistantOpen}
        onClose={() => setIsAIAssistantOpen(false)}
        onResult={handleAIResult}
      />
    </div>
  )
}
