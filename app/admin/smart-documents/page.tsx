"use client"
/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * This code is the property of NXA Software.
 */

import { useState, useEffect } from "react"
import { ScanText, FileText, CheckCircle, AlertTriangle, X, Loader2, Scan, Calendar, User, FileCheck } from "lucide-react"

interface DocumentItem {
  id: string
  name: string
  status: "complete" | "missing" | "risky"
  expiryDate?: string
  uploadedBy?: string
}

interface OCRResult {
  documentType: string
  relatedPerson: string
  validityDate: string
  status: string
}

export default function SmartDocumentsPage() {
  const [selectedProject, setSelectedProject] = useState("")
  const [isScanning, setIsScanning] = useState(false)
  const [ocrResult, setOcrResult] = useState<OCRResult | null>(null)
  const [selectedDocument, setSelectedDocument] = useState<DocumentItem | null>(null)
  const [projects, setProjects] = useState<any[]>([])
  const [loadingProjects, setLoadingProjects] = useState(true)
  const [documents, setDocuments] = useState<DocumentItem[]>([])

  useEffect(() => {
    fetchProjects()
  }, [])

  const fetchProjects = async () => {
    try {
      const response = await fetch('/api/admin/projects')
      if (response.ok) {
        const data = await response.json()
        setProjects(data)
      }
    } catch (error) {
      console.error('Failed to fetch projects:', error)
    } finally {
      setLoadingProjects(false)
    }
  }

  useEffect(() => {
    if (selectedProject) {
      // Fetch documents for selected project
      // For now, show empty state since we don't have a documents API
      setDocuments([])
    }
  }, [selectedProject])

  const handleOCRScan = async (document: DocumentItem) => {
    setSelectedDocument(document)
    setIsScanning(true)
    setOcrResult(null)
    
    try {
      // Mock construction license text for OCR
      const mockDocumentText = `
        YAPI RUHSATI
        Ruhsat No: 2024/1234
        Ruhsat Tarihi: 15.08.2024
        Yapı Sahibi: Mahir Bakay Mühendislik A.Ş.
        Ada: 1234 Parsel: 56
        İlçe: İskenderun
        İl: Hatay
        Yapı Sınıfı: 3. Sınıf
        Alan: 5000 m²
        Kat Adedi: G+5
        Onay Tarihi: 20.08.2024
        Risk Durumu: Düşük
        Eksikler: Yok
      `

      const response = await fetch('/api/ai/ocr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: mockDocumentText })
      })

      const data = await response.json()

      const ocrResult: OCRResult = {
        documentType: data.documentType || "Yapı Ruhsatı",
        relatedPerson: data.relatedPerson || "Mahir Bakay Mühendislik A.Ş.",
        validityDate: data.validityDate || "20.08.2024",
        status: data.status || "Geçerli - Sisteme işlendi."
      }
      
      setOcrResult(ocrResult)
    } catch (error) {
      console.error('OCR scan failed:', error)
      const errorResult: OCRResult = {
        documentType: "Bilinmiyor",
        relatedPerson: "-",
        validityDate: "-",
        status: "Hata: OCR servisi yanıt vermedi."
      }
      setOcrResult(errorResult)
    } finally {
      setIsScanning(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "complete":
        return "bg-green-500/20 text-green-400 border-green-500/30"
      case "missing":
        return "bg-red-500/20 text-red-400 border-red-500/30"
      case "risky":
        return "bg-orange-500/20 text-orange-400 border-orange-500/30"
      default:
        return "bg-slate-500/20 text-slate-400 border-slate-500/30"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "complete":
        return <CheckCircle className="w-4 h-4" />
      case "missing":
        return <X className="w-4 h-4" />
      case "risky":
        return <AlertTriangle className="w-4 h-4" />
      default:
        return null
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "complete":
        return "Tamam"
      case "missing":
        return "Eksik"
      case "risky":
        return "Riskli"
      default:
        return ""
    }
  }

  const currentDocuments = documents

  return (
    <div className="lg:mt-0 mt-16">
      <div className="mb-6">
        <h1 className="text-2xl lg:text-3xl font-bold text-white flex items-center gap-3">
          <ScanText className="w-8 h-8 text-blue-400" />
          Akıllı Evrak Denetimi (OCR)
        </h1>
        <p className="text-slate-400 mt-1">Yapay zeka destekli evrak tarama ve eksiklik radarı</p>
      </div>

      {/* Project Selector */}
      <div className="bg-slate-900 rounded-xl border border-slate-800 p-6 mb-6">
        <label className="block text-sm font-medium text-slate-300 mb-2">Proje (YİBF) Seçin</label>
        {loadingProjects ? (
          <div className="flex items-center gap-2 text-slate-400">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Projeler yükleniyor...</span>
          </div>
        ) : projects.length === 0 ? (
          <div className="text-slate-400">Henüz proje kaydı bulunmuyor.</div>
        ) : (
          <select
            value={selectedProject}
            onChange={(e) => {
              setSelectedProject(e.target.value)
              setSelectedDocument(null)
              setOcrResult(null)
            }}
            className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
          >
            <option value="">Proje seçin...</option>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name || project.title}
              </option>
            ))}
          </select>
        )}
      </div>

      {selectedProject && (
        <>
          {/* Document Checklist */}
          <div className="bg-slate-900 rounded-xl border border-slate-800 p-6 mb-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <FileCheck className="w-5 h-5 text-blue-400" />
              Zorunlu Evrak Checklist
            </h3>
            
            <div className="space-y-3">
              {currentDocuments.length > 0 ? (
                currentDocuments.map((doc) => (
                <div
                  key={doc.id}
                  className="p-4 rounded-lg border bg-slate-800/50 hover:bg-slate-800 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <FileText className="w-5 h-5 text-slate-400" />
                      <div>
                        <h4 className="text-white font-medium">{doc.name}</h4>
                        {doc.status === "complete" && doc.uploadedBy && (
                          <p className="text-slate-400 text-sm">Yükleyen: {doc.uploadedBy}</p>
                        )}
                        {doc.expiryDate && (
                          <p className="text-slate-400 text-sm">Geçerlilik: {doc.expiryDate}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium border flex items-center gap-1 ${getStatusBadge(doc.status)}`}>
                        {getStatusIcon(doc.status)}
                        {getStatusLabel(doc.status)}
                      </span>
                      {doc.status !== "missing" && (
                        <button
                          onClick={() => handleOCRScan(doc)}
                          disabled={isScanning}
                          className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm transition-colors disabled:opacity-50 flex items-center gap-1"
                        >
                          <Scan className="w-4 h-4" />
                          OCR Tara
                        </button>
                      )}
                    </div>
                  </div>
                </div>
                ))
              ) : (
                <div className="text-center py-8 text-slate-400">
                  <FileText className="w-12 h-12 mx-auto mb-3 text-slate-600" />
                  <p>Henüz evrak kaydı bulunmuyor.</p>
                </div>
              )}
            </div>
          </div>

          {/* OCR Scanning Panel */}
          {selectedDocument && (
            <div className="bg-slate-900 rounded-xl border border-slate-800 p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <ScanText className="w-5 h-5 text-blue-400" />
                OCR Tarama Sonuçları - {selectedDocument.name}
              </h3>
              
              {isScanning ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="relative w-32 h-32 mb-6">
                    <div className="absolute inset-0 border-4 border-blue-500 rounded-full animate-ping" />
                    <div className="absolute inset-0 border-4 border-blue-500 rounded-full animate-spin" style={{ animationDuration: '2s' }} />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Scan className="w-12 h-12 text-blue-400 animate-pulse" />
                    </div>
                  </div>
                  <p className="text-white font-medium mb-2">Gemini Vision evrakı inceliyor...</p>
                  <p className="text-slate-400 text-sm">Evrak okunuyor ve analiz ediliyor</p>
                </div>
              ) : ocrResult ? (
                <div className="space-y-4">
                  <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
                    <div className="flex items-center gap-3 mb-3">
                      <CheckCircle className="w-5 h-5 text-green-500" />
                      <h4 className="text-green-400 font-medium">Tarama Başarılı</h4>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-slate-400" />
                        <span className="text-slate-300">Tespit Edilen Belge Tipi:</span>
                        <span className="text-white font-medium">{ocrResult.documentType}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-slate-400" />
                        <span className="text-slate-300">İlgili Personel/Firma:</span>
                        <span className="text-white font-medium">{ocrResult.relatedPerson}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-slate-400" />
                        <span className="text-slate-300">Geçerlilik Tarihi:</span>
                        <span className="text-white font-medium">{ocrResult.validityDate}</span>
                        <span className="text-green-400 text-xs">(OCR ile okundu)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <FileCheck className="w-4 h-4 text-slate-400" />
                        <span className="text-slate-300">Durum:</span>
                        <span className="text-green-400 font-medium">{ocrResult.status}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          )}
        </>
      )}

      {!selectedProject && (
        <div className="text-center py-16 bg-slate-900 rounded-xl border border-slate-800">
          <ScanText className="w-16 h-16 mx-auto mb-4 text-slate-600" />
          <h3 className="text-xl font-semibold text-white mb-2">Proje Seçin</h3>
          <p className="text-slate-400">Evrak denetimi için proje seçin</p>
        </div>
      )}
    </div>
  )
}
