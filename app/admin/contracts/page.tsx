"use client"
/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * This code is the property of NXA Software.
 */


import { useState, useEffect } from "react"
import { toast } from "react-hot-toast"

export default function ContractsPage() {
  const [contracts, setContracts] = useState<any[]>([])
  const [projects, setProjects] = useState<any[]>([])
  const [workers, setWorkers] = useState<any[]>([])
  const [templates, setTemplates] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  
  // Modal states
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false)
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false)
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false)
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const [generateFormData, setGenerateFormData] = useState({
    templateId: "",
    projectId: "",
    workerId: ""
  })
  
  const [uploadFormData, setUploadFormData] = useState({
    title: "",
    projectId: "",
    workerId: "",
    file: null as File | null
  })
  
  const [templateFormData, setTemplateFormData] = useState({
    name: "",
    content: ""
  })
  
  const [previewData, setPreviewData] = useState({
    title: "",
    content: "",
    projectId: "",
    workerId: "",
    templateId: ""
  })

  useEffect(() => {
    fetchContracts()
    fetchProjects()
    fetchWorkers()
    fetchTemplates()
  }, [])

  const fetchContracts = async () => {
    try {
      const response = await fetch("/api/admin/contracts")
      if (response.ok) {
        const data = await response.json()
        setContracts(data)
      }
    } catch (error) {
      console.error("Failed to fetch contracts:", error)
      toast.error("Sözleşmeler yüklenirken hata oluştu")
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

  const fetchWorkers = async () => {
    try {
      const response = await fetch("/api/admin/workers")
      if (response.ok) {
        const data = await response.json()
        setWorkers(data)
      }
    } catch (error) {
      console.error("Failed to fetch workers:", error)
    }
  }

  const fetchTemplates = async () => {
    try {
      const response = await fetch("/api/admin/contract-templates")
      if (response.ok) {
        const data = await response.json()
        setTemplates(data)
      }
    } catch (error) {
      console.error("Failed to fetch templates:", error)
    }
  }

  const handleGenerateInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setGenerateFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleUploadInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setUploadFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null
    setUploadFormData(prev => ({ ...prev, file }))
  }

  const handleGenerateContract = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!generateFormData.templateId || !generateFormData.projectId) {
      toast.error("Şablon ve proje seçiniz")
      return
    }

    setIsSubmitting(true)
    try {
      // 1. Şablon içeriğini al
      const template = templates.find(t => t.id === generateFormData.templateId)
      const project = projects.find(p => p.id === generateFormData.projectId)
      const worker = workers.find(w => w.id === generateFormData.workerId)

      if (!template || !project) {
        toast.error("Şablon veya proje bulunamadı")
        return
      }

      // 2. Değişkenleri değiştir
      let content = template.content
      const replacements: { [key: string]: string } = {
        "{{PERSONEL_ADI}}": worker ? `${worker.firstName} ${worker.lastName}` : "",
        "{{PROJE_ADI}}": project.name || project.title || "",
        "{{TARİH}}": new Date().toLocaleDateString("tr-TR"),
        "{{KIMLIK_NO}}": worker ? worker.username || "" : "",
        "{{BAŞLANGIÇ_TARİHİ}}": project.startDate ? new Date(project.startDate).toLocaleDateString("tr-TR") : "",
        "{{BİTİŞ_TARİHİ}}": project.endDate ? new Date(project.endDate).toLocaleDateString("tr-TR") : "",
        "{{FİRMA_ADI}}": "Mahir Bakay Mühendislik",
        "{{ADI_SOYADI}}": worker ? `${worker.firstName} ${worker.lastName}` : "",
      }

      Object.entries(replacements).forEach(([key, value]) => {
        content = content.replace(new RegExp(key, "g"), value)
      })

      // 3. Preview modal'a geç
      setPreviewData({
        title: `${template.name} - ${worker ? `${worker.firstName} ${worker.lastName}` : project.name}`,
        content: content,
        projectId: generateFormData.projectId,
        workerId: generateFormData.workerId || "",
        templateId: generateFormData.templateId
      })
      
      closeGenerateModal()
      setIsPreviewModalOpen(true)
      
    } catch (error) {
      console.error("Contract generation error:", error)
      toast.error("Sözleşme oluşturulurken hata oluştu")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSaveAndDownloadPDF = async () => {
    setIsSubmitting(true)
    try {
      // Dynamically import html2pdf only in the browser
      const html2pdf = (await import('html2pdf.js')).default
      
      const element = document.createElement("div")
      element.innerHTML = `
        <div style="font-family: Arial, sans-serif; padding: 40px; max-width: 800px; margin: 0 auto; background: white;">
          <div style="text-align: center; margin-bottom: 40px; border-bottom: 2px solid #333; padding-bottom: 20px;">
            <h1 style="margin: 0; color: #333; font-size: 24px;">MAHIR BAKAY MÜHENDİSLİK</h1>
            <p style="margin: 5px 0; color: #666; font-size: 14px;">İnşaat ve Mühendislik Hizmetleri</p>
          </div>
          
          <div style="margin-bottom: 30px;">
            <h2 style="color: #333; margin-bottom: 10px; font-size: 18px;">${previewData.title}</h2>
            <p style="color: #666; font-size: 12px;">
              Tarih: ${new Date().toLocaleDateString("tr-TR")}
            </p>
          </div>
          
          <div style="line-height: 1.6; color: #333; white-space: pre-wrap; font-size: 12px;">
            ${previewData.content}
          </div>
          
          <div style="margin-top: 60px; border-top: 1px solid #ccc; padding-top: 20px;">
            <div style="display: flex; justify-content: space-between;">
              <div style="text-align: center;">
                <p style="margin: 0; font-weight: bold; font-size: 12px;">İmza</p>
                <p style="margin: 5px 0; border-bottom: 1px solid #333; width: 200px;">&nbsp;</p>
              </div>
              <div style="text-align: center;">
                <p style="margin: 0; font-weight: bold; font-size: 12px;">Kaşe</p>
                <p style="margin: 5px 0; border-bottom: 1px solid #333; width: 200px;">&nbsp;</p>
              </div>
            </div>
          </div>
        </div>
      `

      const opt = {
        margin: 10,
        filename: `${previewData.title.replace(/\s+/g, "_")}.pdf`,
        image: { type: "jpeg" as const, quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: "mm" as const, format: "a4" as const, orientation: "portrait" as const }
      }

      // Generate PDF
      await html2pdf().set(opt).from(element).save()
      
      // Save to database using the same content
      try {
        const response = await fetch("/api/admin/contracts", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            title: previewData.title,
            type: "GENERATED",
            content: previewData.content, // Save the edited content
            fileUrl: "generated_pdf", // We'll use the content for future generation
            projectId: previewData.projectId,
            workerId: previewData.workerId,
            templateId: previewData.templateId
          })
        })

        if (response.ok) {
          toast.success("Sözleşme arşive kaydedildi")
          fetchContracts()
          closePreviewModal()
        } else {
          toast.error("Sözleşme kaydedilirken hata oluştu")
        }
      } catch (error) {
        toast.error("Sözleşme kaydedilirken hata oluştu")
      }
      
      toast.success("PDF indirildi")
    } catch (error) {
      console.error("PDF generation error:", error)
      toast.error("PDF oluşturulurken hata oluştu")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleUploadContract = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!uploadFormData.title || !uploadFormData.file) {
      toast.error("Başlık ve dosya zorunludur")
      return
    }

    setIsSubmitting(true)
    try {
      // Dosyayı base64'e çevir
      const reader = new FileReader()
      reader.onloadend = async () => {
        const base64String = reader.result as string
        
        try {
          const response = await fetch("/api/admin/contracts", {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              title: uploadFormData.title,
              type: "UPLOADED",
              fileUrl: base64String,
              projectId: uploadFormData.projectId || null,
              workerId: uploadFormData.workerId || null
            })
          })

          if (response.ok) {
            toast.success("Sözleşme başarıyla yüklendi")
            fetchContracts()
            closeUploadModal()
          } else {
            toast.error("Sözleşme yüklenirken hata oluştu")
          }
        } catch (error) {
          toast.error("Sözleşme yüklenirken hata oluştu")
        }
      }
      reader.readAsDataURL(uploadFormData.file!)
      
    } catch (error) {
      console.error("Contract upload error:", error)
      toast.error("Sözleşme yüklenirken hata oluştu")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDownloadContract = async (contract: any) => {
    try {
      if (contract.type === "GENERATED" && contract.content) {
        // Generate PDF from content for generated contracts
        const html2pdf = (await import('html2pdf.js')).default
        
        const element = document.createElement("div")
        element.innerHTML = `
          <div style="font-family: Arial, sans-serif; padding: 40px; max-width: 800px; margin: 0 auto; background: white;">
            <div style="text-align: center; margin-bottom: 40px; border-bottom: 2px solid #333; padding-bottom: 20px;">
              <h1 style="margin: 0; color: #333; font-size: 24px;">MAHIR BAKAY MÜHENDİSLİK</h1>
              <p style="margin: 5px 0; color: #666; font-size: 14px;">İnşaat ve Mühendislik Hizmetleri</p>
            </div>
            
            <div style="margin-bottom: 30px;">
              <h2 style="color: #333; margin-bottom: 10px; font-size: 18px;">${contract.title}</h2>
              <p style="color: #666; font-size: 12px;">
                Tarih: ${new Date(contract.createdAt).toLocaleDateString("tr-TR")}
              </p>
            </div>
            
            <div style="line-height: 1.6; color: #333; white-space: pre-wrap; font-size: 12px;">
              ${contract.content}
            </div>
            
            <div style="margin-top: 60px; border-top: 1px solid #ccc; padding-top: 20px;">
              <div style="display: flex; justify-content: space-between;">
                <div style="text-align: center;">
                  <p style="margin: 0; font-weight: bold; font-size: 12px;">İmza</p>
                  <p style="margin: 5px 0; border-bottom: 1px solid #333; width: 200px;">&nbsp;</p>
                </div>
                <div style="text-align: center;">
                  <p style="margin: 0; font-weight: bold; font-size: 12px;">Kaşe</p>
                  <p style="margin: 5px 0; border-bottom: 1px solid #333; width: 200px;">&nbsp;</p>
                </div>
              </div>
            </div>
          </div>
        `

        const opt = {
          margin: 10,
          filename: `${contract.title.replace(/\s+/g, "_")}.pdf`,
          image: { type: "jpeg" as const, quality: 0.98 },
          html2canvas: { scale: 2 },
          jsPDF: { unit: "mm" as const, format: "a4" as const, orientation: "portrait" as const }
        }

        await html2pdf().set(opt).from(element).save()
        toast.success("PDF indirildi")
      } else if (contract.fileUrl) {
        // Download uploaded files directly
        const link = document.createElement("a")
        link.href = contract.fileUrl
        link.download = `${contract.title.replace(/\s+/g, "_")}.pdf`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        toast.success("PDF indirildi")
      } else {
        toast.error("Dosya bulunamadı")
      }
    } catch (error) {
      console.error("Download error:", error)
      toast.error("PDF indirilirken hata oluştu")
    }
  }

  const handleDeleteContract = async (contractId: string) => {
    if (!confirm("Bu sözleşmeyi silmek istediğinize emin misiniz?")) return

    try {
      const response = await fetch(`/api/admin/contracts/${contractId}`, {
        method: "DELETE"
      })

      if (response.ok) {
        toast.success("Sözleşme silindi")
        fetchContracts()
      } else {
        toast.error("Sözleşme silinirken hata oluştu")
      }
    } catch (error) {
      toast.error("Sözleşme silinirken hata oluştu")
    }
  }

  const handleCreateTemplate = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!templateFormData.name || !templateFormData.content) {
      toast.error("Şablon adı ve içeriği zorunludur")
      return
    }

    setIsSubmitting(true)
    try {
      const response = await fetch("/api/admin/contract-templates", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          name: templateFormData.name,
          content: templateFormData.content
        })
      })

      if (response.ok) {
        toast.success("Şablon başarıyla eklendi")
        fetchTemplates()
        closeTemplateModal()
      } else {
        toast.error("Şablon eklenirken hata oluştu")
      }
    } catch (error) {
      toast.error("Şablon eklenirken hata oluştu")
    } finally {
      setIsSubmitting(false)
    }
  }

  const openGenerateModal = () => {
    setGenerateFormData({
      templateId: "",
      projectId: "",
      workerId: ""
    })
    setIsGenerateModalOpen(true)
  }

  const closeGenerateModal = () => {
    setIsGenerateModalOpen(false)
    setGenerateFormData({
      templateId: "",
      projectId: "",
      workerId: ""
    })
  }

  const openUploadModal = () => {
    setUploadFormData({
      title: "",
      projectId: "",
      workerId: "",
      file: null
    })
    setIsUploadModalOpen(true)
  }

  const closeUploadModal = () => {
    setIsUploadModalOpen(false)
    setUploadFormData({
      title: "",
      projectId: "",
      workerId: "",
      file: null
    })
  }

  const openTemplateModal = () => {
    setTemplateFormData({
      name: "",
      content: ""
    })
    setIsTemplateModalOpen(true)
  }

  const closeTemplateModal = () => {
    setIsTemplateModalOpen(false)
    setTemplateFormData({
      name: "",
      content: ""
    })
  }

  const openPreviewModal = () => {
    setIsPreviewModalOpen(true)
  }

  const closePreviewModal = () => {
    setIsPreviewModalOpen(false)
    setPreviewData({
      title: "",
      content: "",
      projectId: "",
      workerId: "",
      templateId: ""
    })
  }

  if (isLoading) {
    return (
      <div className="lg:mt-0 mt-16">
        <div className="text-white">Yükleniyor...</div>
      </div>
    )
  }

  return (
    <div className="lg:mt-0 mt-16">
      <div className="flex flex-wrap gap-4 justify-between items-center mb-8">
        <h1 className="text-2xl lg:text-3xl font-bold text-white">
          📄 Sözleşme Yönetimi
        </h1>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <button
          onClick={openGenerateModal}
          className="flex items-center justify-center gap-3 px-6 py-4 bg-blue-600 text-white rounded-xl hover:bg-blue-500 transition-colors font-medium"
        >
          <span className="text-2xl">📄</span>
          Yeni Sözleşme Oluştur
        </button>
        <button
          onClick={openUploadModal}
          className="flex items-center justify-center gap-3 px-6 py-4 bg-green-600 text-white rounded-xl hover:bg-green-500 transition-colors font-medium"
        >
          <span className="text-2xl">☁️</span>
          Dışarıdan Sözleşme Yükle
        </button>
        <button
          onClick={openTemplateModal}
          className="flex items-center justify-center gap-3 px-6 py-4 bg-purple-600 text-white rounded-xl hover:bg-purple-500 transition-colors font-medium"
        >
          <span className="text-2xl">⚙️</span>
          Şablon Yönetimi
        </button>
      </div>

      {/* Contracts Table */}
      <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
        <div className="w-full overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
          <table className="w-full min-w-max">
            <thead className="bg-slate-800">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-white">Sözleşme Adı</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-white">Tipi</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-white">İlgili Proje</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-white">Personel</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-white">Tarih</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-white">İşlemler</th>
              </tr>
            </thead>
            <tbody>
              {contracts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                    Henüz sözleşme yok
                  </td>
                </tr>
              ) : (
                contracts.map((contract) => (
                  <tr key={contract.id} className="border-t border-slate-800 hover:bg-slate-800/50">
                    <td className="px-6 py-4 text-white">{contract.title}</td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        contract.type === "GENERATED" 
                          ? "bg-blue-900/30 text-blue-400" 
                          : "bg-green-900/30 text-green-400"
                      }`}>
                        {contract.type === "GENERATED" ? "Sistem Üretimi" : "Dışarıdan Yükleme"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-300">
                      {contract.project?.name || contract.project?.title || "-"}
                    </td>
                    <td className="px-6 py-4 text-slate-300">
                      {contract.worker ? `${contract.worker.firstName} ${contract.worker.lastName}` : "-"}
                    </td>
                    <td className="px-6 py-4 text-slate-400 text-sm">
                      {new Date(contract.createdAt).toLocaleDateString("tr-TR")}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleDownloadContract(contract)}
                          className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-colors text-sm"
                        >
                          İndir
                        </button>
                        <button
                          onClick={() => handleDeleteContract(contract.id)}
                          className="px-3 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-500 transition-colors text-sm"
                        >
                          Sil
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Generate Contract Modal */}
      {isGenerateModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-slate-900 rounded-xl p-6 border border-slate-800 w-full max-w-lg mx-4 shadow-2xl">
            <h3 className="text-xl font-semibold text-white mb-6">📄 Yeni Sözleşme Oluştur</h3>
            
            <form onSubmit={handleGenerateContract} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Şablon Seç *</label>
                <select
                  name="templateId"
                  value={generateFormData.templateId}
                  onChange={handleGenerateInputChange}
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                  required
                >
                  <option value="">Şablon Seçin</option>
                  {templates.length === 0 ? (
                    <option value="" disabled>Henüz şablon yok - önce şablon oluşturun</option>
                  ) : (
                    templates.map((template) => (
                      <option key={template.id} value={template.id}>
                        {template.name}
                      </option>
                    ))
                  )}
                </select>
                {templates.length === 0 && (
                  <p className="text-xs text-orange-400 mt-2">
                    ⚠️ Henüz şablon yok. "Şablon Yönetimi" butonuna tıklayarak yeni şablon oluşturun.
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Proje Seç *</label>
                <select
                  name="projectId"
                  value={generateFormData.projectId}
                  onChange={handleGenerateInputChange}
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
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

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Personel Seç (Opsiyonel)</label>
                <select
                  name="workerId"
                  value={generateFormData.workerId}
                  onChange={handleGenerateInputChange}
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                >
                  <option value="">Personel Seçin</option>
                  {workers.map((worker) => (
                    <option key={worker.id} value={worker.id}>
                      {worker.firstName} {worker.lastName}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={closeGenerateModal}
                  className="flex-1 px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors"
                  disabled={isSubmitting}
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-colors"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Oluşturuluyor..." : "Oluştur"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Upload Contract Modal */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-slate-900 rounded-xl p-6 border border-slate-800 w-full max-w-lg mx-4 shadow-2xl">
            <h3 className="text-xl font-semibold text-white mb-6">☁️ Dışarıdan Sözleşme Yükle</h3>
            
            <form onSubmit={handleUploadContract} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Sözleşme Adı *</label>
                <input
                  type="text"
                  name="title"
                  value={uploadFormData.title}
                  onChange={handleUploadInputChange}
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">İlgili Proje (Opsiyonel)</label>
                <select
                  name="projectId"
                  value={uploadFormData.projectId}
                  onChange={handleUploadInputChange}
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
                <label className="block text-sm font-medium text-slate-300 mb-2">İlgili Personel (Opsiyonel)</label>
                <select
                  name="workerId"
                  value={uploadFormData.workerId}
                  onChange={handleUploadInputChange}
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                >
                  <option value="">Personel Seçin</option>
                  {workers.map((worker) => (
                    <option key={worker.id} value={worker.id}>
                      {worker.firstName} {worker.lastName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Dosya (PDF, JPG, PNG) *</label>
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={handleFileChange}
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                  required
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={closeUploadModal}
                  className="flex-1 px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors"
                  disabled={isSubmitting}
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-500 transition-colors"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Yükleniyor..." : "Yükle"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Template Management Modal */}
      {isTemplateModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-slate-900 rounded-xl p-6 border border-slate-800 w-full max-w-2xl mx-4 shadow-2xl">
            <h3 className="text-xl font-semibold text-white mb-6">⚙️ Yeni Şablon Ekle</h3>
            
            <form onSubmit={handleCreateTemplate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Şablon Adı *</label>
                <input
                  type="text"
                  name="name"
                  value={templateFormData.name}
                  onChange={(e) => setTemplateFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                  placeholder="Örn: İSG Tutanağı, Özlük Formu"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Şablon İçeriği *</label>
                <textarea
                  name="content"
                  value={templateFormData.content}
                  onChange={(e) => setTemplateFormData(prev => ({ ...prev, content: e.target.value }))}
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white resize-none"
                  rows={12}
                  placeholder="Sözleşmenin ana metni..."
                  required
                />
                <p className="text-xs text-slate-400 mt-2">
                  💡 Kopya Çekebileceğiniz Değişkenler: {`{{PERSONEL_ADI}}`}, {`{{PROJE_ADI}}`}, {`{{TARİH}}`}, {`{{KIMLIK_NO}}`}, {`{{BAŞLANGIÇ_TARİHİ}}`}, {`{{BİTİŞ_TARİHİ}}`}, {`{{FİRMA_ADI}}`}
                </p>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={closeTemplateModal}
                  className="flex-1 px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors"
                  disabled={isSubmitting}
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-500 transition-colors"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Ekleniyor..." : "Ekle"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Preview & Edit Modal */}
      {isPreviewModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-slate-900 rounded-xl p-6 border border-slate-800 w-full max-w-4xl mx-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-semibold text-white mb-6">📝 Sözleşme Önizleme ve Düzenle</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Sözleşme Başlığı</label>
                <input
                  type="text"
                  value={previewData.title}
                  onChange={(e) => setPreviewData(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Sözleşme İçeriği</label>
                <textarea
                  value={previewData.content}
                  onChange={(e) => setPreviewData(prev => ({ ...prev, content: e.target.value }))}
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white resize-none"
                  rows={20}
                />
                <p className="text-xs text-slate-400 mt-2">
                  💡 Bu alanda istediğiniz gibi düzenleme yapabilirsiniz. Türkçe karakterler düzgün görünecektir.
                </p>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={closePreviewModal}
                  className="flex-1 px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors"
                  disabled={isSubmitting}
                >
                  İptal
                </button>
                <button
                  type="button"
                  onClick={handleSaveAndDownloadPDF}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-500 transition-colors"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "İndiriliyor..." : "💾 Kaydet ve PDF İndir"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}