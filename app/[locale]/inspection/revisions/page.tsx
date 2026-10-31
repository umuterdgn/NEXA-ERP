"use client"
/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * This code is the property of NXA Software.
 */

import { useState, useRef } from "react"
import { GitCompare, Upload, X, Plus, Minus, Bell, ChevronLeft, ChevronRight } from "lucide-react"

interface Change {
  id: string
  type: "removed" | "added"
  description: string
}

export default function RevisionsPage() {
  const [revAImage, setRevAImage] = useState<string | null>(null)
  const [revBImage, setRevBImage] = useState<string | null>(null)
  const [sliderPosition, setSliderPosition] = useState(50)
  const [isComparing, setIsComparing] = useState(false)
  const [analysisResults, setAnalysisResults] = useState<Change[] | null>(null)
  const fileInputRefA = useRef<HTMLInputElement>(null)
  const fileInputRefB = useRef<HTMLInputElement>(null)
  const sliderRef = useRef<HTMLDivElement>(null)

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, version: "A" | "B") => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader()
      reader.onload = (event) => {
        if (version === "A") {
          setRevAImage(event.target?.result as string)
        } else {
          setRevBImage(event.target?.result as string)
        }
      }
      reader.readAsDataURL(e.target.files[0])
    }
  }

  const handleSliderMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!sliderRef.current) return
    const rect = sliderRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100))
    setSliderPosition(percentage)
  }

  const startComparison = () => {
    if (!revAImage || !revBImage) return
    setIsComparing(true)
    
    // Simulate analysis
    setTimeout(() => {
      const mockChanges: Change[] = [
        {
          id: "1",
          type: "removed",
          description: "B Aksı üzerindeki K102 kolonu yeni projede iptal edilmiş."
        },
        {
          id: "2",
          type: "added",
          description: "Dış cepheye ek izolasyon katmanı çizimi eklenmiş."
        },
        {
          id: "3",
          type: "removed",
          description: "Zemin kattaki otopark girişi konumu değiştirilmiş."
        },
        {
          id: "4",
          type: "added",
          description: "C Blok 3. kata ek asansör boşluğu eklendi."
        }
      ]
      setAnalysisResults(mockChanges)
      setIsComparing(false)
    }, 1500)
  }

  const resetComparison = () => {
    setRevAImage(null)
    setRevBImage(null)
    setSliderPosition(50)
    setAnalysisResults(null)
    setIsComparing(false)
  }

  return (
    <div className="lg:mt-0 mt-16">
      <div className="mb-6">
        <h1 className="text-2xl lg:text-3xl font-bold text-white flex items-center gap-3">
          <GitCompare className="w-8 h-8 text-blue-400" />
          Proje Revizyonları
        </h1>
        <p className="text-slate-400 mt-1">BIM ve proje revizyon karşılaştırması</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Rev A Upload */}
        <div className="bg-slate-900 rounded-xl border border-slate-800 p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <span className="w-8 h-8 bg-red-500/20 text-red-400 rounded-lg flex items-center justify-center font-bold">A</span>
            Eski Versiyon (Rev A)
          </h3>
          {!revAImage ? (
            <div
              className="border-2 border-dashed border-slate-700 rounded-lg p-8 text-center cursor-pointer hover:border-slate-600 transition-colors"
              onClick={() => fileInputRefA.current?.click()}
            >
              <Upload className="w-8 h-8 text-slate-500 mx-auto mb-3" />
              <p className="text-slate-400 text-sm">Dosya seçmek için tıklayın</p>
              <input
                ref={fileInputRefA}
                type="file"
                onChange={(e) => handleFileSelect(e, "A")}
                accept="image/*,.pdf"
                className="hidden"
              />
            </div>
          ) : (
            <div className="relative">
              <img src={revAImage} alt="Rev A" className="w-full h-48 object-cover rounded-lg" />
              <button
                onClick={() => setRevAImage(null)}
                className="absolute top-2 right-2 p-2 bg-slate-900/80 hover:bg-slate-800 rounded-lg"
              >
                <X className="w-4 h-4 text-white" />
              </button>
            </div>
          )}
        </div>

        {/* Rev B Upload */}
        <div className="bg-slate-900 rounded-xl border border-slate-800 p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <span className="w-8 h-8 bg-green-500/20 text-green-400 rounded-lg flex items-center justify-center font-bold">B</span>
            Yeni Versiyon (Rev B)
          </h3>
          {!revBImage ? (
            <div
              className="border-2 border-dashed border-slate-700 rounded-lg p-8 text-center cursor-pointer hover:border-slate-600 transition-colors"
              onClick={() => fileInputRefB.current?.click()}
            >
              <Upload className="w-8 h-8 text-slate-500 mx-auto mb-3" />
              <p className="text-slate-400 text-sm">Dosya seçmek için tıklayın</p>
              <input
                ref={fileInputRefB}
                type="file"
                onChange={(e) => handleFileSelect(e, "B")}
                accept="image/*,.pdf"
                className="hidden"
              />
            </div>
          ) : (
            <div className="relative">
              <img src={revBImage} alt="Rev B" className="w-full h-48 object-cover rounded-lg" />
              <button
                onClick={() => setRevBImage(null)}
                className="absolute top-2 right-2 p-2 bg-slate-900/80 hover:bg-slate-800 rounded-lg"
              >
                <X className="w-4 h-4 text-white" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Compare Button */}
      {revAImage && revBImage && !analysisResults && (
        <div className="mb-6">
          <button
            onClick={startComparison}
            disabled={isComparing}
            className="w-full px-6 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl transition-colors flex items-center justify-center gap-3 font-medium disabled:opacity-50"
          >
            <GitCompare className="w-5 h-5" />
            {isComparing ? "Analiz yapılıyor..." : "Karşılaştırmayı Başlat"}
          </button>
        </div>
      )}

      {/* Comparison Slider */}
      {revAImage && revBImage && (
        <div className="bg-slate-900 rounded-xl border border-slate-800 p-6 mb-6">
          <h3 className="text-lg font-semibold text-white mb-4">Görsel Karşılaştırma</h3>
          <div
            ref={sliderRef}
            className="relative w-full h-96 bg-slate-800 rounded-lg overflow-hidden cursor-ew-resize"
            onMouseMove={handleSliderMove}
          >
            {/* Rev A (Background) */}
            <img
              src={revAImage}
              alt="Rev A"
              className="absolute inset-0 w-full h-full object-cover"
            />
            
            {/* Rev B (Foreground with clip) */}
            <div
              className="absolute inset-0 overflow-hidden"
              style={{ width: `${sliderPosition}%` }}
            >
              <img
                src={revBImage}
                alt="Rev B"
                className="absolute inset-0 w-full h-full object-cover"
                style={{ left: `-${100 - sliderPosition}%` }}
              />
            </div>

            {/* Slider Handle */}
            <div
              className="absolute top-0 bottom-0 w-1 bg-white shadow-lg"
              style={{ left: `${sliderPosition}%` }}
            >
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center">
                <ChevronLeft className="w-5 h-5 text-slate-800" />
                <ChevronRight className="w-5 h-5 text-slate-800" />
              </div>
            </div>

            {/* Labels */}
            <div className="absolute bottom-4 left-4 px-3 py-1 bg-red-500/80 text-white rounded-lg text-sm font-medium">
              Rev A
            </div>
            <div className="absolute bottom-4 right-4 px-3 py-1 bg-green-500/80 text-white rounded-lg text-sm font-medium">
              Rev B
            </div>
          </div>
        </div>
      )}

      {/* Analysis Results */}
      {analysisResults && (
        <div className="bg-slate-900 rounded-xl border border-slate-800 p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <GitCompare className="w-5 h-5 text-blue-400" />
            Analiz Raporu
          </h3>
          
          <div className="space-y-3 mb-6">
            {analysisResults.map((change) => (
              <div
                key={change.id}
                className={`p-4 rounded-lg border ${
                  change.type === "removed"
                    ? "bg-red-500/10 border-red-500/30"
                    : "bg-green-500/10 border-green-500/30"
                }`}
              >
                <div className="flex items-start gap-3">
                  {change.type === "removed" ? (
                    <Minus className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                  ) : (
                    <Plus className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                  )}
                  <div>
                    <span className={`font-medium ${
                      change.type === "removed" ? "text-red-400" : "text-green-400"
                    }`}>
                      {change.type === "removed" ? "Kaldırılanlar" : "Eklenenler"}
                    </span>
                    <p className="text-slate-400 text-sm mt-1">{change.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Notify Personnel Button */}
          <button className="w-full px-6 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white rounded-xl transition-colors flex items-center justify-center gap-3 font-medium">
            <Bell className="w-5 h-5" />
            Güncel Projeyi Sahaya (Personellere) Bildir
          </button>
          <p className="text-slate-500 text-xs text-center mt-2">
            Şimdilik demo modunda aktif değildir
          </p>

          {/* Reset Button */}
          <button
            onClick={resetComparison}
            className="w-full mt-4 px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl transition-colors"
          >
            Yeni Karşılaştırma
          </button>
        </div>
      )}
    </div>
  )
}
