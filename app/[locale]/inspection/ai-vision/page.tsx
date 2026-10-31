"use client"
/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * This code is the property of NXA Software.
 */

import { useState, useRef } from "react"
import { Scan, Upload, X, AlertTriangle, CheckCircle, AlertCircle, Loader2, ArrowRight } from "lucide-react"

interface Detection {
  id: string
  severity: "critical" | "warning" | "success"
  title: string
  description: string
}

export default function AIVisionPage() {
  const [uploadedImage, setUploadedImage] = useState<string | null>(null)
  const [isScanning, setIsScanning] = useState(false)
  const [analysisResults, setAnalysisResults] = useState<Detection[] | null>(null)
  const [dragActive, setDragActive] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0])
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0])
    }
  }

  const handleFile = (file: File) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      setUploadedImage(e.target?.result as string)
      setAnalysisResults(null)
      startAnalysis()
    }
    reader.readAsDataURL(file)
  }

  const startAnalysis = async () => {
    setIsScanning(true)
    
    // Simulate AI processing (2-3 seconds)
    await new Promise(resolve => setTimeout(resolve, 2500))
    
    // Mock analysis results
    const mockResults: Detection[] = [
      {
        id: "1",
        severity: "critical",
        title: "Kolon Etriye Aralığı",
        description: "Kolon etriye aralıkları projede 10cm olması gerekirken fotoğrafta 15cm olarak ölçüldü."
      },
      {
        id: "2",
        severity: "warning",
        title: "Paspayı Mesafesi",
        description: "Paspayı mesafesi standartların (2.5cm) altında görünüyor."
      },
      {
        id: "3",
        severity: "success",
        title: "Donatı Çapı",
        description: "Kullanılan donatı çapı (Φ16) proje değerleri ile uyuşuyor."
      },
      {
        id: "4",
        severity: "warning",
        title: "Kalıp Destekleri",
        description: "Bazı kalıp desteklerinde yetersizlik tespit edildi."
      }
    ]
    
    setAnalysisResults(mockResults)
    setIsScanning(false)
  }

  const resetUpload = () => {
    setUploadedImage(null)
    setAnalysisResults(null)
    setIsScanning(false)
  }

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case "critical":
        return <AlertTriangle className="w-5 h-5 text-red-500" />
      case "warning":
        return <AlertCircle className="w-5 h-5 text-orange-500" />
      case "success":
        return <CheckCircle className="w-5 h-5 text-green-500" />
      default:
        return null
    }
  }

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case "critical":
        return "bg-red-500/20 text-red-400 border-red-500/30"
      case "warning":
        return "bg-orange-500/20 text-orange-400 border-orange-500/30"
      case "success":
        return "bg-green-500/20 text-green-400 border-green-500/30"
      default:
        return "bg-slate-500/20 text-slate-400 border-slate-500/30"
    }
  }

  const getSeverityLabel = (severity: string) => {
    switch (severity) {
      case "critical":
        return "Kritik"
      case "warning":
        return "Uyarı"
      case "success":
        return "Onay"
      default:
        return ""
    }
  }

  return (
    <div className="lg:mt-0 mt-16">
      <div className="mb-6">
        <h1 className="text-2xl lg:text-3xl font-bold text-white flex items-center gap-3">
          <Scan className="w-8 h-8 text-blue-400" />
          AI Görsel Analiz
        </h1>
        <p className="text-slate-400 mt-1">Yapay zeka destekli görsel kalite kontrolü</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Side - Upload Area */}
        <div className="space-y-4">
          {!uploadedImage ? (
            <div
              className={`border-2 border-dashed rounded-xl p-12 text-center transition-all ${
                dragActive
                  ? "border-blue-500 bg-blue-500/10"
                  : "border-slate-700 hover:border-slate-600 bg-slate-900"
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <div className="flex flex-col items-center gap-4">
                <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center">
                  <Upload className="w-8 h-8 text-slate-400" />
                </div>
                <div>
                  <p className="text-white font-medium mb-2">Fotoğrafı sürükleyip bırakın</p>
                  <p className="text-slate-400 text-sm mb-4">veya</p>
                  <label className="cursor-pointer">
                    <span className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors inline-block">
                      Dosya Seçin
                    </span>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileSelect}
                      accept="image/*"
                      className="hidden"
                    />
                  </label>
                </div>
                <p className="text-slate-500 text-xs">PNG, JPG, WEBP (Maks 10MB)</p>
              </div>
            </div>
          ) : (
            <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
              <div className="relative">
                {uploadedImage && (
                  <img src={uploadedImage} alt="Uploaded" className="w-full h-64 object-cover" />
                )}
                
                {/* Scanning Animation Overlay */}
                {isScanning && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <div className="text-center">
                      <div className="relative w-24 h-24 mx-auto mb-4">
                        <div className="absolute inset-0 border-4 border-blue-500 rounded-full animate-ping" />
                        <div className="absolute inset-0 border-4 border-blue-500 rounded-full animate-spin" style={{ animationDuration: '2s' }} />
                        <Scan className="absolute inset-0 m-auto w-8 h-8 text-blue-400 animate-pulse" />
                      </div>
                      <p className="text-white font-medium">Yapay zeka fotoğrafı inceliyor...</p>
                      <p className="text-slate-400 text-sm mt-1">Görüntü işleme simülasyonu</p>
                    </div>
                  </div>
                )}

                {/* Remove Button */}
                {!isScanning && (
                  <button
                    onClick={resetUpload}
                    className="absolute top-4 right-4 p-2 bg-slate-900/80 hover:bg-slate-800 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5 text-white" />
                  </button>
                )}
              </div>

              {!isScanning && !analysisResults && (
                <div className="p-4">
                  <button
                    onClick={startAnalysis}
                    className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    <Scan className="w-5 h-5" />
                    Analizi Başlat
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Side - Analysis Results */}
        <div className="bg-slate-900 rounded-xl border border-slate-800 p-6">
          <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
            <Scan className="w-6 h-6 text-blue-400" />
            Analiz Sonuçları
          </h2>

          {!analysisResults ? (
            <div className="text-center py-16">
              <Scan className="w-16 h-16 mx-auto mb-4 text-slate-600" />
              <p className="text-slate-400">
                {isScanning ? "Analiz yapılıyor..." : "Analiz sonuçları burada görüntülenecek"}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {analysisResults.map((detection) => (
                <div
                  key={detection.id}
                  className={`p-4 rounded-lg border ${
                    detection.severity === "critical"
                      ? "bg-red-500/10 border-red-500/30"
                      : detection.severity === "warning"
                      ? "bg-orange-500/10 border-orange-500/30"
                      : "bg-green-500/10 border-green-500/30"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {getSeverityIcon(detection.severity)}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-white font-medium">{detection.title}</h3>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${getSeverityBadge(detection.severity)}`}>
                          {getSeverityLabel(detection.severity)}
                        </span>
                      </div>
                      <p className="text-slate-400 text-sm">{detection.description}</p>
                    </div>
                  </div>
                </div>
              ))}

              {/* Create Deficiency Record Button */}
              <div className="pt-4 border-t border-slate-700">
                <button className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white rounded-lg transition-colors flex items-center justify-center gap-2">
                  <AlertTriangle className="w-5 h-5" />
                  Bu Sonuçlarla Eksiklik Kaydı Oluştur
                  <ArrowRight className="w-5 h-5" />
                </button>
                <p className="text-slate-500 text-xs text-center mt-2">
                  Şimdilik demo modunda aktif değildir
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
