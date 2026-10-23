"use client"
/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Franchise Dijital Devir-Teslim (Handover & As-Built) Arşiv Ekranı
 */

import { useState, useEffect } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import {
  FolderArchive,
  FileText,
  Shield,
  BookOpen,
  Image as ImageIcon,
  PenTool,
  Share2,
  Copy,
  Plus,
  RefreshCw,
  ExternalLink,
  Trash2,
  CheckCircle2,
  ArrowLeft,
  Building2,
  Download,
  Check,
  MapPin,
  Lock,
} from "lucide-react"

interface HandoverDoc {
  id: string
  projectId: string
  documentType: "WARRANTY" | "MANUAL" | "AS_BUILT_DRAWING" | "PANEL_PHOTO" | string
  title: string
  fileUrl: string
  uploadedAt: string
}

interface ProjectInfo {
  id: string
  name: string
  title: string
  city: string | null
  district: string | null
  status: string
  grossAreaSqm: number | null
}

const TYPE_CONFIG: Record<
  string,
  { label: string; icon: any; color: string; badge: string }
> = {
  WARRANTY: {
    label: "Garanti Belgesi",
    icon: Shield,
    color: "text-emerald-400",
    badge: "bg-emerald-950/70 border-emerald-800 text-emerald-300",
  },
  MANUAL: {
    label: "Kullanım Kılavuzu",
    icon: BookOpen,
    color: "text-blue-400",
    badge: "bg-blue-950/70 border-blue-800 text-blue-300",
  },
  AS_BUILT_DRAWING: {
    label: "As-Built Kesin Çizim",
    icon: PenTool,
    color: "text-purple-400",
    badge: "bg-purple-950/70 border-purple-800 text-purple-300",
  },
  PANEL_PHOTO: {
    label: "Pano & Saha Fotoğrafı",
    icon: ImageIcon,
    color: "text-amber-400",
    badge: "bg-amber-950/70 border-amber-800 text-amber-300",
  },
}

export default function StoreHandoverPage() {
  const params = useParams()
  const projectId = params?.id as string

  const [project, setProject] = useState<ProjectInfo | null>(null)
  const [documents, setDocuments] = useState<HandoverDoc[]>([])
  const [loading, setLoading] = useState(true)
  const [activeFilter, setActiveFilter] = useState<string>("ALL")
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedPhotoModal, setSelectedPhotoModal] = useState<string | null>(null)
  const [copiedLink, setCopiedLink] = useState(false)
  const [sharedLinkModal, setSharedLinkModal] = useState<string | null>(null)

  const [newDoc, setNewDoc] = useState({
    documentType: "WARRANTY",
    title: "",
    fileUrl: "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const fetchData = async () => {
    try {
      setLoading(true)
      const res = await fetch(`/api/franchise/projects/${projectId}/handover`)
      const data = await res.json()
      if (data.project) setProject(data.project)
      if (data.documents) setDocuments(data.documents)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (projectId) {
      fetchData()
    }
  }, [projectId])

  // Tek tıkla "İşletmeye Paylaş (Generate Link)" butonu
  const handleGenerateShareLink = () => {
    const generatedUrl = `${window.location.origin}/handover/share/${projectId}?token=nx_${Math.random()
      .toString(36)
      .slice(2, 10)}`
    setSharedLinkModal(generatedUrl)
    navigator.clipboard.writeText(generatedUrl)
    setCopiedLink(true)
    setTimeout(() => setCopiedLink(false), 4000)
  }

  // Create Handover Document
  const handleCreateDocument = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newDoc.title || !newDoc.fileUrl) return

    try {
      setIsSubmitting(true)
      const res = await fetch(`/api/franchise/projects/${projectId}/handover`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newDoc),
      })

      if (res.ok) {
        setIsModalOpen(false)
        setNewDoc({ documentType: "WARRANTY", title: "", fileUrl: "" })
        fetchData()
      }
    } catch (err) {
      console.error(err)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Delete Document
  const handleDeleteDoc = async (docId: string) => {
    if (!confirm("Bu devir-teslim belgesini silmek istediğinize emin misiniz?")) return
    try {
      setDocuments((prev) => prev.filter((d) => d.id !== docId))
      await fetch(`/api/franchise/projects/${projectId}/handover?docId=${docId}`, {
        method: "DELETE",
      })
    } catch (err) {
      console.error(err)
      fetchData()
    }
  }

  const filteredDocs =
    activeFilter === "ALL"
      ? documents
      : documents.filter((d) => d.documentType === activeFilter)

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Top Breadcrumb & Nav */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <Link
          href="/admin/franchise/rollout-map"
          className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Rollout Haritasına Dön</span>
        </Link>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleGenerateShareLink}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-colors shadow-sm"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>{copiedLink ? "Link Panoya Kopyalandı!" : "İşletmeye Paylaş (Generate Link)"}</span>
          </button>

          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-200 text-xs font-medium transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Yeni Belge Yükle</span>
          </button>
        </div>
      </div>

      {/* Project Overview Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-blue-400 uppercase tracking-wider mb-1">
              <FolderArchive className="w-4 h-4" />
              <span>Dijital Devir-Teslim & As-Built Kütüphanesi</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-white">
              {project?.name || project?.title || "Mağaza Devir-Teslim Arşivi"}
            </h1>
            <p className="text-xs text-slate-400 flex items-center gap-1 mt-1">
              <MapPin className="w-3.5 h-3.5 text-slate-500" />
              {project?.city} • {project?.district || "Merkez"} • {project?.grossAreaSqm || 120} m²
            </p>
          </div>

          <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 min-w-[200px] text-right">
            <span className="text-[11px] text-slate-400">Arşivlenen Evrak</span>
            <div className="text-lg font-bold text-white mt-0.5">{documents.length} Adet Belge / Çizim</div>
            <span className="text-[10px] text-emerald-400">İşletme Teslimine Hazır</span>
          </div>
        </div>
      </div>

      {/* Share Link Info Banner if clicked */}
      {sharedLinkModal && (
        <div className="p-4 bg-blue-950/60 border border-blue-800 rounded-xl space-y-2 text-xs">
          <div className="flex items-center justify-between text-blue-300 font-semibold">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-blue-400" />
              İşletme Ekibi İçin Güvenli Devir-Teslim Bağlantısı Üretildi:
            </span>
            <button onClick={() => setSharedLinkModal(null)} className="text-slate-400 hover:text-white">
              ✕
            </button>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={sharedLinkModal}
              className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded text-slate-300 font-mono text-[11px]"
            />
            <button
              onClick={() => {
                navigator.clipboard.writeText(sharedLinkModal)
                setCopiedLink(true)
                setTimeout(() => setCopiedLink(false), 3000)
              }}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded font-medium shrink-0 flex items-center gap-1"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedLink ? "Kopyalandı" : "Kopyala"}</span>
            </button>
          </div>
          <p className="text-[11px] text-slate-400">
            Bu bağlantıyı alan mağaza müdürleri ve işletme teknisyenleri; şifre gerekmeksizin garanti belgelerini, pano şemalarını ve kılavuzları mobil cihazlarından anında inceleyebilir.
          </p>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2 p-1 bg-slate-900 border border-slate-800 rounded-xl text-xs">
        <button
          onClick={() => setActiveFilter("ALL")}
          className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
            activeFilter === "ALL" ? "bg-blue-600 text-white" : "text-slate-400 hover:text-white"
          }`}
        >
          Tüm Belgeler ({documents.length})
        </button>
        <button
          onClick={() => setActiveFilter("WARRANTY")}
          className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
            activeFilter === "WARRANTY" ? "bg-emerald-600 text-white" : "text-slate-400 hover:text-white"
          }`}
        >
          Garanti Belgeleri ({documents.filter((d) => d.documentType === "WARRANTY").length})
        </button>
        <button
          onClick={() => setActiveFilter("MANUAL")}
          className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
            activeFilter === "MANUAL" ? "bg-blue-600 text-white" : "text-slate-400 hover:text-white"
          }`}
        >
          Kullanım Kılavuzları ({documents.filter((d) => d.documentType === "MANUAL").length})
        </button>
        <button
          onClick={() => setActiveFilter("AS_BUILT_DRAWING")}
          className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
            activeFilter === "AS_BUILT_DRAWING" ? "bg-purple-600 text-white" : "text-slate-400 hover:text-white"
          }`}
        >
          As-Built Çizimleri ({documents.filter((d) => d.documentType === "AS_BUILT_DRAWING").length})
        </button>
        <button
          onClick={() => setActiveFilter("PANEL_PHOTO")}
          className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
            activeFilter === "PANEL_PHOTO" ? "bg-amber-600 text-white" : "text-slate-400 hover:text-white"
          }`}
        >
          Pano & Saha Fotoğrafları ({documents.filter((d) => d.documentType === "PANEL_PHOTO").length})
        </button>
      </div>

      {/* Documents Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredDocs.length === 0 ? (
          <div className="col-span-full bg-slate-900 border border-slate-800 rounded-xl p-10 text-center text-slate-500 text-xs">
            Bu kategoride yüklenmiş devir-teslim belgesi bulunmuyor.
          </div>
        ) : (
          filteredDocs.map((doc) => {
            const cfg = TYPE_CONFIG[doc.documentType] || TYPE_CONFIG.WARRANTY
            const Icon = cfg.icon
            const isPhoto =
              doc.documentType === "PANEL_PHOTO" ||
              doc.fileUrl.match(/\.(jpeg|jpg|gif|png|webp)/i)

            return (
              <div
                key={doc.id}
                className="bg-slate-900/80 border border-slate-800 hover:border-slate-700 rounded-xl overflow-hidden transition-all flex flex-col justify-between"
              >
                {/* Image preview for photos */}
                {isPhoto && (
                  <div
                    onClick={() => setSelectedPhotoModal(doc.fileUrl)}
                    className="w-full h-36 bg-slate-950 overflow-hidden cursor-pointer relative group border-b border-slate-800"
                  >
                    <img
                      src={doc.fileUrl}
                      alt={doc.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white text-xs gap-1">
                      <ImageIcon className="w-4 h-4" />
                      <span>Büyüt</span>
                    </div>
                  </div>
                )}

                <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${cfg.badge}`}>
                        {cfg.label}
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">
                        {new Date(doc.uploadedAt).toLocaleDateString("tr-TR")}
                      </span>
                    </div>

                    <h3 className="text-xs font-bold text-white line-clamp-2 pt-1">{doc.title}</h3>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-xs">
                    <a
                      href={doc.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:text-blue-300 flex items-center gap-1 font-semibold"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Belgeyi İncele</span>
                    </a>

                    <button
                      onClick={() => handleDeleteDoc(doc.id)}
                      className="p-1 rounded text-slate-500 hover:text-red-400 transition-colors"
                      title="Sil"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Upload Document Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl animate-in fade-in duration-200">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <FolderArchive className="w-4 h-4 text-blue-400" />
                <span>Devir-Teslim Belgesi Ekle</span>
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white p-1">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateDocument} className="space-y-3.5">
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-300">Belge / Arşiv Türü *</label>
                <select
                  value={newDoc.documentType}
                  onChange={(e) => setNewDoc({ ...newDoc, documentType: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-blue-500"
                >
                  <option value="WARRANTY">Garanti Belgesi (WARRANTY)</option>
                  <option value="MANUAL">Kullanım Kılavuzu (MANUAL)</option>
                  <option value="AS_BUILT_DRAWING">As-Built Kesin Uygulama Çizimi (.dwg / .pdf)</option>
                  <option value="PANEL_PHOTO">Pano & Saha Fotoğrafı (PANEL_PHOTO)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-300">Belge Başlığı *</label>
                <input
                  type="text"
                  value={newDoc.title}
                  onChange={(e) => setNewDoc({ ...newDoc, title: e.target.value })}
                  placeholder="Örn: Mitsubishi VRF Klima Garanti Belgesi"
                  className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-200 placeholder-slate-600 focus:outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-300">Dosya Bağlantısı (URL / Bulut) *</label>
                <input
                  type="text"
                  value={newDoc.fileUrl}
                  onChange={(e) => setNewDoc({ ...newDoc, fileUrl: e.target.value })}
                  placeholder="https://... veya dosya linki"
                  className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-200 placeholder-slate-600 focus:outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3.5 py-2 text-xs rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 text-xs rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold"
                >
                  {isSubmitting ? "Kaydediliyor..." : "Arşive Ekle"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Photo Lightbox */}
      {selectedPhotoModal && (
        <div
          onClick={() => setSelectedPhotoModal(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md cursor-pointer"
        >
          <div className="relative max-w-3xl max-h-[85vh] rounded-xl overflow-hidden border border-slate-700 bg-slate-950 p-2">
            <img
              src={selectedPhotoModal}
              alt="Handover Görseli"
              className="max-w-full max-h-[80vh] object-contain rounded-lg"
            />
          </div>
        </div>
      )}
    </div>
  )
}
