"use client"
/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * This code is the property of NXA Software.
 */


import { useState } from "react"
import dynamic from "next/dynamic"
import { Upload, X } from "lucide-react"

const AnnotatableFloorPlanViewer = dynamic(
  () => import("@/components/AnnotatableFloorPlanViewer"),
  { ssr: false, loading: () => <div className="w-full h-[600px] bg-slate-900 animate-pulse rounded-xl flex items-center justify-center">CAD Yükleniyor...</div> }
)

export default function DrawPage() {
  const [fileUrl, setFileUrl] = useState<string | null>(null)
  const [fileName, setFileName] = useState<string>("")

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const url = URL.createObjectURL(file)
      setFileUrl(url)
      setFileName(file.name)
    }
  }

  const handleClearFile = () => {
    if (fileUrl) {
      URL.revokeObjectURL(fileUrl)
    }
    setFileUrl(null)
    setFileName("")
  }

  return (
    <div className="h-screen flex flex-col bg-slate-900">
      {/* Header */}
      <div className="bg-slate-800 border-b border-slate-700 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-white">Serbest Çizim / Plan</h1>
            <p className="text-slate-400 text-sm mt-1">DWG/DXF dosyalarını görüntüleyin ve üzerine çizim yapın</p>
          </div>
          <div className="flex items-center gap-4">
            {!fileUrl ? (
              <div className="flex items-center gap-2">
                <label className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg cursor-pointer transition-colors">
                  <Upload className="w-5 h-5" />
                  <span>Dosya Yükle</span>
                  <input
                    type="file"
                    accept=".dwg,.dxf"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </label>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <span className="text-slate-300 text-sm">{fileName}</span>
                <button
                  onClick={handleClearFile}
                  className="p-2 bg-red-600 hover:bg-red-500 text-white rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Viewer Container */}
      <div className="flex-1 relative">
        {!fileUrl ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <Upload className="w-16 h-16 text-slate-600 mx-auto mb-4" />
              <p className="text-slate-400 text-lg">DWG veya DXF dosyası yükleyin</p>
              <p className="text-slate-500 text-sm mt-2">Dosyalar tarayıcınızda işlenir, sunucuya gönderilmez</p>
            </div>
          </div>
        ) : (
          <AnnotatableFloorPlanViewer key={fileUrl} fileUrl={fileUrl} />
        )}
      </div>
    </div>
  )
}
