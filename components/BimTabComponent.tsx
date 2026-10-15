"use client"
/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Interactive 3D BIM (IFC) Tab Component with AR & UploadThing
 */

import { useState, useEffect } from "react"
import dynamic from "next/dynamic"
import { useRouter } from "next/navigation"
import { toast } from "react-hot-toast"
import { QRCodeSVG } from "qrcode.react"
import { UploadDropzone } from "@/lib/uploadthing"
import { updateProjectBimModel } from "@/app/actions/project"

// Import the existing interactive 3D BIM Viewer with ssr: false
const BimViewer = dynamic(
  () => import("@/app/admin/projects/[id]/_components/BimViewer"),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-[600px] bg-slate-900 rounded-xl border border-slate-700 flex flex-col items-center justify-center">
        <div className="w-12 h-12 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin mb-3"></div>
        <p className="text-slate-300 text-sm font-medium">3D BIM Görüntüleyici Hazırlanıyor...</p>
      </div>
    ),
  }
)

interface BimTabComponentProps {
  project: {
    id: string
    name?: string | null
    title?: string | null
    bimModelUrl?: string | null
    ifcModelUrl?: string | null
    [key: string]: any
  }
}

export function BimTabComponent({ project }: BimTabComponentProps) {
  const router = useRouter()
  const [bimUrl, setBimUrl] = useState<string | null>(
    project.bimModelUrl || project.ifcModelUrl || null
  )
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [showARModal, setShowARModal] = useState(false)

  // Keep state synced if project props change
  useEffect(() => {
    if (project.bimModelUrl || project.ifcModelUrl) {
      setBimUrl(project.bimModelUrl || project.ifcModelUrl || null)
    }
  }, [project.bimModelUrl, project.ifcModelUrl])

  const isMobileDevice = () => {
    if (typeof window === "undefined") return false
    return (
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
      window.innerWidth < 768
    )
  }

  const getARUrl = () => {
    const query = bimUrl ? `?url=${encodeURIComponent(bimUrl)}` : ""
    if (typeof window !== "undefined") {
      return `${window.location.origin}/ar/${project.id}${query}`
    }
    return `/ar/${project.id}${query}`
  }

  const handleOpenAR = () => {
    if (isMobileDevice()) {
      window.location.href = getARUrl()
    } else {
      setShowARModal(true)
    }
  }

  return (
    <div className="w-full space-y-4">
      {/* Tab Header with Title & Action Buttons */}
      <div className="flex flex-wrap justify-between items-center gap-3">
        <div>
          <h3 className="text-lg font-semibold text-white">3D BIM Modeli</h3>
          <p className="text-xs text-slate-400">Projenin 3D Yapı Bilgi Modellemesi ve dijital ikiz görünümü</p>
        </div>

        <div className="flex items-center gap-2">
          {/* Her zaman görünür Force/Test 3D Viewer & AR Butonu */}
          <button
            onClick={() => {
              setBimUrl("/sample.ifc")
              toast.success("Örnek IFC modeli devrede! 3D Viewer açılıyor...")
            }}
            className="px-3 py-1.5 bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 hover:text-amber-200 rounded-lg text-xs font-semibold border border-amber-500/40 transition-all flex items-center gap-1.5 shadow-[0_0_12px_rgba(245,158,11,0.2)] active:scale-95"
            title="Model yüklenmemiş olsa bile 3D ve AR modülünü test edin"
          >
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            <span>⚡ 3D Viewer'ı Zorla Aç (Test)</span>
          </button>

          {bimUrl && (
            <>
              {/* Neon AR Button */}
              <button
                onClick={handleOpenAR}
                className="relative group overflow-hidden px-4 py-2 bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white rounded-lg font-semibold text-sm shadow-[0_0_20px_rgba(6,182,212,0.5)] hover:shadow-[0_0_30px_rgba(6,182,212,0.8)] border border-cyan-300/40 transition-all flex items-center gap-2 transform hover:scale-[1.02] active:scale-[0.98]"
              >
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-300 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyan-400 shadow-[0_0_8px_#22d3ee]"></span>
                </span>
                <svg className="w-4 h-4 text-cyan-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                <span>AR ile Sahada Gör</span>
              </button>

              {/* Modeli Değiştir Button */}
              <button
                onClick={() => setBimUrl(null)}
                className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg text-sm font-medium border border-slate-700 transition-colors flex items-center gap-1.5"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                Modeli Değiştir
              </button>
            </>
          )}
        </div>
      </div>

      {/* Main View: 3D BIM Viewer vs UploadDropzone */}
      {bimUrl ? (
        <div className="relative w-full h-[600px] rounded-xl overflow-hidden border border-gray-700 bg-slate-900 shadow-2xl">
          {/* Eski çalışan 3D Viewer bileşeni */}
          <BimViewer url={bimUrl} ifcUrl={bimUrl} projectId={project.id} />

          {/* Floating Action Overlay with high visibility & z-50 */}
          <div className="absolute top-4 right-4 z-50 flex items-center gap-2">
            <button
              onClick={handleOpenAR}
              className="px-3.5 py-2 bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white rounded-lg text-xs font-bold shadow-[0_0_20px_rgba(6,182,212,0.8)] border border-cyan-300/60 transition-all flex items-center gap-2 backdrop-blur-md transform hover:scale-105 active:scale-95"
            >
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-300 animate-ping"></span>
              <span>📱 AR ile Sahada Gör</span>
            </button>

            <button
              onClick={() => setBimUrl(null)}
              className="bg-red-600/90 hover:bg-red-600 text-white px-3.5 py-2 rounded-lg text-xs font-semibold shadow-lg transition-colors flex items-center gap-1.5 backdrop-blur-md hover:scale-105"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              Modeli Değiştir
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-8 shadow-xl">
          <div className="flex flex-col items-center justify-center py-6 max-w-xl mx-auto text-center">
            <div className="w-16 h-16 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 mb-4 shadow-lg shadow-blue-500/10">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <h4 className="text-white text-base font-semibold mb-1">
              IFC / 3D BIM Modeli Yükleyin
            </h4>
            <p className="text-slate-400 text-xs mb-4 max-w-md">
              Projenin 3D modelini görüntülemek için .ifc formatındaki model dosyasını sürükleyip bırakın veya seçin (Maks 128MB).
            </p>

            {/* Quick Bypass Action Banner */}
            <div className="mb-6 flex items-center gap-2 p-2 px-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs">
              <span>💡 Dosya yüklemeden denemek ister misiniz?</span>
              <button
                type="button"
                onClick={() => {
                  setBimUrl("/sample.ifc")
                  toast.success("Örnek IFC modeli yüklendi!")
                }}
                className="underline hover:text-white font-medium"
              >
                Örnek Modeli Başlat (/sample.ifc)
              </button>
            </div>

            <div className="w-full">
              <UploadDropzone
                endpoint="bimModelUploader"
                onUploadBegin={(fileName) => {
                  setIsUploading(true)
                  console.log("Upload başladı, dosya:", fileName)
                  toast.loading("Dosya yükleniyor...", { id: "bim-upload" })
                }}
                onUploadProgress={(progress) => {
                  setUploadProgress(progress)
                }}
                onClientUploadComplete={async (res) => {
                  setIsUploading(false)
                  toast.dismiss("bim-upload")
                  console.log("Upload Başarılı, ham yanıt:", res)

                  const resolvedUrl =
                    (res && res.length > 0 && res[0].url) ||
                    (res && res.length > 0 && (res[0] as any).serverData?.url) ||
                    (res && res.length > 0 && (res[0] as any).ufsUrl) ||
                    (res && res[0]?.key ? `https://utfs.io/f/${res[0].key}` : null)

                  if (res && res.length > 0 && resolvedUrl) {
                    setBimUrl(resolvedUrl) // State anında güncellenmeli!
                    alert("Model başarıyla yüklendi! 3D ortam hazırlanıyor...")

                    try {
                      const updateRes = await updateProjectBimModel(project.id, resolvedUrl)
                      if (updateRes.success) {
                        toast.success("BIM modeli başarıyla kaydedildi!")
                        router.refresh()
                      }
                    } catch (e) {
                      console.error("Veritabanı güncelleme hatası:", e)
                    }
                  } else {
                    // Bypass mechanism: Prompt user for manual/test URL
                    const wantManual = window.confirm(
                      "URL okunamadı. Örnek test modeli (/sample.ifc) ile 3D BIM Viewer'ı zorla açmak ister misiniz?"
                    )
                    if (wantManual) {
                      const enteredUrl = window.prompt(
                        "Kullanmak istediğiniz IFC model URL'sini girin:",
                        "/sample.ifc"
                      )
                      const testUrl = enteredUrl && enteredUrl.trim() ? enteredUrl.trim() : "/sample.ifc"
                      setBimUrl(testUrl)
                      toast.success("Test modeli yüklendi! 3D ortam hazırlanıyor...")
                    } else {
                      alert("Yükleme tamamlandı ancak dosya URL'si alınamadı.")
                    }
                  }
                }}
                onUploadError={(error: Error) => {
                  setIsUploading(false)
                  toast.dismiss("bim-upload")
                  console.error("UploadThing Error:", error)
                  const wantBypass = window.confirm(
                    `Yükleme hatası: ${error.message}\n\nTest amacıyla örnek IFC modeli (/sample.ifc) ile 3D Viewer'ı açmak ister misiniz?`
                  )
                  if (wantBypass) {
                    setBimUrl("/sample.ifc")
                    toast.success("Örnek IFC modeli devrede! 3D Viewer açılıyor...")
                  } else {
                    alert(`Hata: ${error.message}`)
                  }
                }}
              />
            </div>

            {isUploading && (
              <div className="mt-4 flex items-center justify-center gap-2 text-cyan-400 text-sm font-medium animate-pulse">
                <div className="w-4 h-4 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
                <span>Yükleniyor (%{uploadProgress}), lütfen bekleyin...</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* AR QR Code Modal for Desktop */}
      {showARModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="relative bg-slate-900 border border-cyan-500/30 rounded-2xl p-6 sm:p-8 max-w-md w-full shadow-[0_0_50px_rgba(6,182,212,0.25)] text-center animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => setShowARModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-800 transition-colors"
            >
              ✕
            </button>

            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-bold tracking-wider uppercase mb-3">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
              Artırılmış Gerçeklik (AR)
            </div>

            <h3 className="text-xl font-bold text-white mb-1">
              AR ile Sahada Canlandır
            </h3>
            <p className="text-xs text-slate-400 mb-6 max-w-xs mx-auto">
              {project.name || project.title} projesinin 3D BIM modelini şantiye sahasında 1:1 ölçekte kameranızla görüntüleyin.
            </p>

            <div className="relative group p-4 bg-white rounded-2xl shadow-2xl mx-auto w-fit mb-5 border-4 border-cyan-400/40">
              <QRCodeSVG
                value={getARUrl()}
                size={220}
                level="H"
                includeMargin={false}
              />
            </div>

            <div className="bg-slate-800/80 rounded-xl p-3 border border-slate-700/60 mb-5">
              <p className="text-xs font-medium text-cyan-300 flex items-center justify-center gap-1.5 mb-1">
                <span>📷</span> Cihazınızın kamerasıyla okutarak modeli sahada canlandırın.
              </p>
              <p className="text-[11px] text-slate-400">
                iOS veya Android telefonunuzun kamerasını yukarıdaki QR koda doğrultun.
              </p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(getARUrl())
                  toast.success("AR bağlantısı panoya kopyalandı!")
                }}
                className="flex-1 py-2.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-medium border border-slate-700 transition-colors flex items-center justify-center gap-1.5"
              >
                <span>🔗</span> Bağlantıyı Kopyala
              </button>

              <button
                onClick={() => {
                  window.open(getARUrl(), "_blank")
                }}
                className="flex-1 py-2.5 px-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-cyan-600/30 transition-all flex items-center justify-center gap-1.5"
              >
                <span>🚀</span> Yeni Sekmede Aç
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default BimTabComponent
