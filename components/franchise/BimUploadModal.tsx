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
  FileCheck,
  Loader2,
  Tag
} from "lucide-react"
import { toast } from "react-hot-toast"
import { useRouter } from "next/navigation"

interface BimUploadModalProps {
  isOpen: boolean
  onClose: () => void
  projects?: Array<{ id: string; name?: string | null }>
  onSuccess?: () => void
}

export default function BimUploadModal({
  isOpen,
  onClose,
  projects = [],
  onSuccess,
}: BimUploadModalProps) {
  const router = useRouter()
  const [modelName, setModelName] = useState("")
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
      if (ext === "ifc" || ext === "rvt" || ext === "dwg" || ext === "nwd" || ext === "glb" || ext === "gltf") {
        setSelectedFile(file)
        if (!modelName) {
          setModelName(file.name.replace(/\.[^/.]+$/, ""))
        }
      } else {
        toast.error("Lütfen yalnızca .ifc, .rvt, .glb veya .dwg uzantılı BIM modelleri seçiniz.")
      }
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      setSelectedFile(file)
      if (!modelName) {
        setModelName(file.name.replace(/\.[^/.]+$/, ""))
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!modelName.trim()) {
      toast.error("Lütfen bir BIM model adı girin.")
      return
    }
    if (!selectedFile) {
      toast.error("Lütfen bir .ifc veya .rvt model dosyası seçin veya sürükleyin.")
      return
    }

    setIsUploading(true)
    setUploadProgress(20)

    try {
      const ext = selectedFile.name.split(".").pop()?.toLowerCase() || "ifc"

      // Backend API'sine veriyi gönder
      const payload = {
        name: modelName.trim(),
        fileName: selectedFile.name,
        fileType: ext,
        projectId: projectId || projects[0]?.id || "default",
        discipline: modelType,
        lodLevel,
        fileUrl: `/uploads/bim/${Date.now()}-${selectedFile.name}`,
      }

      setUploadProgress(60)

      const res = await fetch("/api/franchise/bim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || "Model yüklenirken bir hata oluştu")
      }

      setUploadProgress(100)
      toast.success(`"${modelName}" 3D BIM modeli başarıyla sisteme yüklendi ve işlendi!`)

      // Formu sıfırla
      setModelName("")
      setSelectedFile(null)
      setUploadProgress(0)

      // Veritabanı ve ekranı anında yenile
      router.refresh()
      if (onSuccess) onSuccess()
      onClose()
    } catch (err: any) {
      console.error("[BimUploadModal Submit Error]:", err)
      toast.error(err?.message || "BIM modeli yüklenirken hata oluştu.")
    } finally {
      setIsUploading(false)
    }
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
          {/* Model Adı */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-amber-400" />
              <span>Model Adı & Versiyon</span>
            </label>
            <input
              type="text"
              required
              value={modelName}
              onChange={(e) => setModelName(e.target.value)}
              placeholder="Örn: Flagship Cadde Mağazası - Mimari & Tesisat v2"
              className="w-full px-3.5 py-2.5 text-xs bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:border-amber-500"
              disabled={isUploading}
            />
          </div>

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
                      {p.name || "Şube / Proje"}
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
                <span>Katman (Disiplin)</span>
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
              accept=".ifc,.rvt,.dwg,.nwd,.glb,.gltf"
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
                  <h4 className="text-xs font-bold text-slate-200">
                    IFC / RVT / GLB Dosyasını Buraya Sürükleyin
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    veya bilgisayarınızdan seçmek için tıklayın (Maksimum 250 MB)
                  </p>
                </div>
                <div className="flex items-center justify-center gap-1.5 pt-1 text-[10px] text-slate-500 font-mono">
                  <span className="px-1.5 py-0.5 bg-slate-800 rounded">.IFC</span>
                  <span className="px-1.5 py-0.5 bg-slate-800 rounded">.RVT</span>
                  <span className="px-1.5 py-0.5 bg-slate-800 rounded">.GLB</span>
                  <span className="px-1.5 py-0.5 bg-slate-800 rounded">.DWG</span>
                </div>
              </div>
            )}
          </div>

          {/* Upload Progress Bar */}
          {isUploading && (
            <div className="space-y-1.5 bg-slate-950 p-3 rounded-xl border border-slate-800">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-300 font-medium flex items-center gap-1.5">
                  <Loader2 className="w-3.5 h-3.5 text-amber-400 animate-spin" />
                  IFC Modeli İşleniyor ve Yükleniyor...
                </span>
                <span className="text-amber-400 font-mono font-bold">%{uploadProgress}</span>
              </div>
              <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-gradient-to-r from-amber-500 to-amber-400 h-full transition-all duration-300 rounded-full"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={isUploading}
              className="px-4 py-2.5 rounded-xl border border-slate-800 text-xs font-semibold text-slate-300 hover:bg-slate-800 transition-colors"
            >
              Vazgeç
            </button>
            <button
              type="submit"
              disabled={isUploading}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white text-xs font-bold transition-all shadow-lg shadow-amber-500/20 disabled:opacity-50 cursor-pointer"
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Kaydediliyor...</span>
                </>
              ) : (
                <>
                  <UploadCloud className="w-4 h-4" />
                  <span>Modeli Veritabanına Kaydet</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
