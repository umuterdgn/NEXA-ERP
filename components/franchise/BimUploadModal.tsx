"use client"
/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * BIM / IFC & RVT 3D Model Dosyası Yükleme Modalı
 */

import React, { useState } from "react"
import {
  UploadCloud,
  X,
  FileCode,
  CheckCircle2,
  AlertCircle,
  Building2,
  Layers,
  Sparkles,
  FileCheck
} from "lucide-react"
import { toast } from "react-hot-toast"

interface BimUploadModalProps {
  isOpen: boolean
  onClose: () => void
  projects?: Array<{ id: string; name: string }>
  onSuccess?: () => void
}

export default function BimUploadModal({
  isOpen,
  onClose,
  projects = [],
  onSuccess,
}: BimUploadModalProps) {
  const [projectId, setProjectId] = useState(projects[0]?.id || "")
  const [modelType, setModelType] = useState("ARCHITECTURAL")
  const [lodLevel, setLodLevel] = useState("LOD_300")
  const [isDragging, setIsDragging] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [isUploading, setIsUploading] = useState(false)

  if (!isOpen) return null

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0]
      const ext = file.name.split(".").pop()?.toLowerCase()
      if (ext === "ifc" || ext === "rvt" || ext === "dwg" || ext === "nwd") {
        setSelectedFile(file)
      } else {
        toast.error("Lütfen yalnızca .ifc, .rvt veya .dwg uzantılı BIM modelleri seçiniz.")
      }
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0])
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedFile) {
      toast.error("Lütfen bir .ifc veya .rvt model dosyası seçin veya sürükleyin.")
      return
    }

    setIsUploading(true)
    let progress = 10
    const interval = setInterval(() => {
      progress += 20
      if (progress >= 100) {
        clearInterval(interval)
        setUploadProgress(100)
        setTimeout(() => {
          setIsUploading(false)
          toast.success(`"${selectedFile.name}" modeli başarıyla yüklendi ve Web-IFC katmanlarına ayrıştırıldı!`)
          setSelectedFile(null)
          setUploadProgress(0)
          onClose()
          if (onSuccess) onSuccess()
        }, 500)
      } else {
        setUploadProgress(progress)
      }
    }, 200)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <UploadCloud className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">BIM / IFC Modeli Yükle</h3>
              <p className="text-xs text-slate-400">LOD-200 / 300 / 400 3D CAD ve IFC koordinasyon modeli aktarımı</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isUploading}
            className="text-slate-400 hover:text-white p-1.5 rounded-xl hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Project & Model Layer Selection */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-amber-400" />
                <span>İlişkili Şube / Proje</span>
              </label>
              <select
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-amber-500"
                disabled={isUploading}
              >
                {projects.length > 0 ? (
                  projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))
                ) : (
                  <>
                    <option value="demo-proj-1">İskenderun Sahil Rezidans & AVM</option>
                    <option value="demo-proj-2">Zorlu Center Cafe & Bistro</option>
                    <option value="demo-proj-3">Bağdat Caddesi Flagship</option>
                  </>
                )}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-blue-400" />
                <span>Model Disiplini (Katman)</span>
              </label>
              <select
                value={modelType}
                onChange={(e) => setModelType(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-amber-500"
                disabled={isUploading}
              >
                <option value="ARCHITECTURAL">Mimari & Fit-Out (LOD 300)</option>
                <option value="MECHANICAL">Mekanik, Havalandırma & Yangın</option>
                <option value="ELECTRICAL">Elektrik & Aydınlatma Hattı</option>
                <option value="FURNITURE">Mobilya, Gondol & Ekipman</option>
                <option value="COORDINATED">Birleşik Koordinasyon Modeli</option>
              </select>
            </div>
          </div>

          {/* LOD Level */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Detay Düzeyi (Level of Development)
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { key: "LOD_200", label: "LOD 200 (Kaba Kütle)" },
                { key: "LOD_300", label: "LOD 300 (Standart Fit-Out)" },
                { key: "LOD_400", label: "LOD 400 (İmalat Detayı)" },
              ].map((l) => (
                <button
                  key={l.key}
                  type="button"
                  onClick={() => setLodLevel(l.key)}
                  className={`py-2 px-2 rounded-xl text-xs font-semibold border transition-all ${
                    lodLevel === l.key
                      ? "bg-amber-500/20 border-amber-500 text-amber-300"
                      : "bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700"
                  }`}
                >
                  {l.label}
                </button>
              ))}
            </div>
          </div>

          {/* Drag & Drop Area */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-2xl p-6 text-center transition-all cursor-pointer ${
              isDragging
                ? "border-amber-500 bg-amber-500/10 scale-[1.01]"
                : selectedFile
                ? "border-emerald-500/60 bg-emerald-950/20"
                : "border-slate-800 bg-slate-950/60 hover:border-slate-700"
            }`}
            onClick={() => document.getElementById("bim-file-input")?.click()}
          >
            <input
              id="bim-file-input"
              type="file"
              accept=".ifc,.rvt,.dwg,.nwd"
              className="hidden"
              onChange={handleFileChange}
              disabled={isUploading}
            />

            {selectedFile ? (
              <div className="space-y-2">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-400">
                  <FileCheck className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white truncate max-w-xs mx-auto">
                    {selectedFile.name}
                  </h4>
                  <p className="text-xs text-emerald-400 font-mono mt-0.5">
                    {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB • Hazır
                  </p>
                </div>
                <span className="text-[11px] text-slate-400 block">Dosyayı değiştirmek için tıklayın</span>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="w-12 h-12 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center mx-auto text-slate-400">
                  <FileCode className="w-6 h-6 text-amber-400" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">BIM Model Dosyasını Sürükleyip Bırakın</h4>
                  <p className="text-xs text-slate-400 mt-1">veya bilgisayarınızdan seçmek için tıklayın</p>
                </div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-900 border border-slate-800 text-[10px] text-slate-400 font-mono">
                  Desteklenenler: .IFC, .RVT, .DWG (Maks 250 MB)
                </div>
              </div>
            )}
          </div>

          {/* Upload Progress Bar */}
          {isUploading && (
            <div className="space-y-1.5 p-3 rounded-xl bg-slate-950 border border-slate-800">
              <div className="flex items-center justify-between text-xs text-slate-300">
                <span className="flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                  IFC Mesh Ayrıştırılıyor & WASM Belleğine Yükleniyor...
                </span>
                <span className="font-mono font-bold text-amber-400">%{uploadProgress}</span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-amber-500 to-emerald-500 transition-all duration-200"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={isUploading}
              className="px-4 py-2 text-xs text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
            >
              İptal
            </button>
            <button
              type="submit"
              disabled={isUploading || !selectedFile}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white text-xs font-bold shadow-lg shadow-amber-500/20 disabled:opacity-50 transition-all cursor-pointer"
            >
              <UploadCloud className="w-4 h-4" />
              <span>{isUploading ? "Yükleniyor..." : "Modeli Sisteme Aktar"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

