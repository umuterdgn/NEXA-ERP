"use client"
/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Franchise Stage-Gate İdari Onay ve Kilit Ekranı
 */

import { useState, useEffect, use } from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import {
  ShieldCheck,
  Lock,
  Unlock,
  FileText,
  Upload,
  CheckCircle2,
  AlertCircle,
  Building2,
  Calendar,
  Clock,
  ArrowLeft,
  ExternalLink,
  ChevronRight,
  UserCheck,
  Check,
  X,
  Sparkles,
  MapPin,
  RefreshCw,
} from "lucide-react"

interface StageGate {
  id: string
  stageName: string
  isRequired: boolean
  isApproved: boolean
  documentUrl: string | null
  approvedById: string | null
  approvedAt: string | null
}

interface ProjectDetail {
  id: string
  name: string
  title: string
  city: string | null
  district: string | null
  location: string | null
  progress: number
  status: string
  storeTemplate?: {
    id: string
    name: string
    estimatedDays: number
  } | null
}

const STAGE_METADATA: Record<
  string,
  {
    title: string
    subtitle: string
    requiredDocs: string
    unlocksPhase: string
  }
> = {
  KİRALAMA: {
    title: "1. Kiralama & Alan Tahsisi",
    subtitle: "Kira sözleşmesi, yer teslim protokolü ve mülk sahibi onayları",
    requiredDocs: "İmzalı Kira Kontratı, Tapu/Tahsis Belgesi",
    unlocksPhase: "AVM & Mimari Proje Onay Fazı",
  },
  AVM_ONAYI: {
    title: "2. AVM & Ruhsat Onayı",
    subtitle: "AVM teknik şartnamesi, mimari elektrik ve statik uygulama projesi",
    requiredDocs: "AVM Teknik Onay Yazısı, Mimari Proje Onay Belgesi",
    unlocksPhase: "Kaba & İnce İnşaat Başlangıç Fazı",
  },
  KABA_YAPI: {
    title: "3. Kaba & İnce İnşaat İzni",
    subtitle: "Şantiye başlama tutanağı, taşeron sözleşmeleri ve İSG dosyası",
    requiredDocs: "Şantiye Giriş İzni, İSG Risk Değerlendirme Raporu",
    unlocksPhase: "İtfaiye & Ruhsat Denetim Fazı",
  },
  İTFAİYE_ONAYI: {
    title: "4. İtfaiye & Yangın Uygunluğu",
    subtitle: "Sprinkler testi, yangın algılama ve itfaiye onaylı ruhsat uygunluk raporu",
    requiredDocs: "İtfaiye Yangın Raporu, İskan/İşyeri Açma Ruhsatı",
    unlocksPhase: "Merkez Kurumsal Açılış Fazı",
  },
  AÇILIŞ: {
    title: "5. Kurumsal Açılış Yetkisi",
    subtitle: "Merkez denetimi, Punch List QA tamamlama ve kurumsal faaliyete başlama izni",
    requiredDocs: "Bölge Müdürü QA Onay Tutanağı, Merkez Faaliyet İzni",
    unlocksPhase: "Mağaza Resmi Satış & Faaliyet Başlangıcı",
  },
}

export default function StageGatesProjectPage() {
  const params = useParams()
  const router = useRouter()
  const projectId = params?.projectId as string

  const [project, setProject] = useState<ProjectDetail | null>(null)
  const [stages, setStages] = useState<StageGate[]>([])
  const [loading, setLoading] = useState(true)
  const [updatingGateId, setUpdatingGateId] = useState<string | null>(null)
  const [docModalGate, setDocModalGate] = useState<StageGate | null>(null)
  const [newDocUrl, setNewDocUrl] = useState("")
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: "success" | "error" } | null>(null)

  const fetchData = async () => {
    try {
      setLoading(true)
      // 1. Proje Stage Gates
      const res = await fetch(`/api/franchise/stage-gates?projectId=${projectId}`)
      const data = await res.json()
      if (data.stages) {
        setStages(data.stages)
      }

      // 2. Proje Genel Bilgisi
      const projRes = await fetch(`/api/admin/projects`)
      const projData = await projRes.json()
      const list = Array.isArray(projData) ? projData : projData?.projects || []
      const found = list.find((p: any) => p.id === projectId)
      if (found) {
        setProject(found)
      }
    } catch (err) {
      console.error("Failed to load stage gate data", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (projectId) {
      fetchData()
    }
  }, [projectId])

  // Handle Approve / Revoke Stage
  const handleToggleApproval = async (gate: StageGate, approve: boolean) => {
    try {
      setUpdatingGateId(gate.id)
      setStatusMessage(null)

      const res = await fetch("/api/franchise/stage-gates", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: gate.id,
          isApproved: approve,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        setStatusMessage({ text: data.error || "Aşama güncellenemedi", type: "error" })
        return
      }

      setStatusMessage({
        text: approve
          ? `"${gate.stageName}" aşaması başarıyla onaylandı ve sonraki fazın kilidi açıldı!`
          : `"${gate.stageName}" onayı geri alındı.`,
        type: "success",
      })

      // Reload
      fetchData()
    } catch (err: any) {
      setStatusMessage({ text: err.message || "İşlem sırasında hata oluştu", type: "error" })
    } finally {
      setUpdatingGateId(null)
    }
  }

  // Handle Document Attach
  const handleSaveDocument = async () => {
    if (!docModalGate) return
    try {
      setUpdatingGateId(docModalGate.id)
      const res = await fetch("/api/franchise/stage-gates", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: docModalGate.id,
          documentUrl: newDocUrl || null,
        }),
      })

      if (res.ok) {
        setStatusMessage({ text: "Belge başarıyla güncellendi.", type: "success" })
        setDocModalGate(null)
        setNewDocUrl("")
        fetchData()
      }
    } catch (err) {
      console.error("Save doc error", err)
    } finally {
      setUpdatingGateId(null)
    }
  }

  // Compute approval progress
  const totalCount = stages.length
  const approvedCount = stages.filter((s) => s.isApproved).length
  const approvalPercent = totalCount > 0 ? Math.round((approvedCount / totalCount) * 100) : 0

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Top Navigation */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <Link
          href="/admin/franchise/rollout"
          className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Rollout Paneline Dön</span>
        </Link>

        <div className="flex items-center gap-2">
          <Link
            href="/admin/franchise/punch-list"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 text-xs font-medium transition-colors"
          >
            <span>Punch List (QA)</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
          <button
            onClick={fetchData}
            disabled={loading}
            className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
            title="Yenile"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Project Overview Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-blue-400 uppercase tracking-wider mb-1">
              <Building2 className="w-4 h-4" />
              <span>{project?.storeTemplate?.name || "Kurumsal Franchise Mağazası"}</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-white">
              {project?.name || project?.title || "Mağaza İdari İzin & Kilit Yönetimi"}
            </h1>
            <p className="text-xs text-slate-400 flex items-center gap-1 mt-1">
              <MapPin className="w-3.5 h-3.5 text-slate-500" />
              {project?.location || `${project?.city || "Türkiye"} / ${project?.district || ""}`}
            </p>
          </div>

          {/* Overall Approval Metric */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 min-w-[200px] text-right">
            <div className="text-[11px] text-slate-400">İdari Faz Onayı (Stage-Gate)</div>
            <div className="text-xl font-bold text-white mt-1">
              {approvedCount} / {totalCount} Onaylandı
            </div>
            <div className="text-[11px] text-blue-400 mt-0.5">
              %{approvalPercent} İdari İlerleme
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-1.5">
          <div className="h-2 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-800/80">
            <div
              className="h-full bg-blue-500 rounded-full transition-all duration-500"
              style={{ width: `${approvalPercent}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Status Alert Notification */}
      {statusMessage && (
        <div
          className={`p-3.5 rounded-xl border text-xs flex items-center justify-between ${
            statusMessage.type === "success"
              ? "bg-emerald-950/60 border-emerald-800 text-emerald-300"
              : "bg-red-950/60 border-red-800 text-red-300"
          }`}
        >
          <div className="flex items-center gap-2">
            {statusMessage.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
            )}
            <span>{statusMessage.text}</span>
          </div>
          <button
            onClick={() => setStatusMessage(null)}
            className="text-slate-400 hover:text-white ml-2"
          >
            ✕
          </button>
        </div>
      )}

      {/* Stage Gates Stepper & Cards */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-blue-400" />
            <span>Aşama Kilitleri & İdari Onay Zinciri</span>
          </h2>
          <span className="text-xs text-slate-400">
            Bir sonraki inşaat fazı, önceki fazın idari onayı verilmeden açılamaz.
          </span>
        </div>

        <div className="space-y-3">
          {stages.map((gate, index) => {
            const meta = STAGE_METADATA[gate.stageName] || {
              title: gate.stageName,
              subtitle: "İdari ve operasyonel faz",
              requiredDocs: "Resmi belge ve izinler",
              unlocksPhase: "Sonraki İnşaat Fazı",
            }

            // Stage-Gate Kilit Kuralı:
            // Birinci aşama daima kilit açmaya uygundur.
            // Diğer aşamalar için, kendisinden önceki tüm aşamaların isApproved === true olması gerekir.
            const isUnlocked =
              index === 0 || stages.slice(0, index).every((prev) => prev.isApproved)

            return (
              <div
                key={gate.id}
                className={`relative rounded-xl border transition-all ${
                  gate.isApproved
                    ? "bg-slate-900/90 border-emerald-900/40 shadow-sm"
                    : isUnlocked
                    ? "bg-slate-900 border-blue-900/40"
                    : "bg-slate-950/60 border-slate-800/60 opacity-70"
                } p-5 space-y-4`}
              >
                {/* Gate Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-start gap-3">
                    {/* Status Icon */}
                    <div
                      className={`p-2.5 rounded-lg shrink-0 mt-0.5 ${
                        gate.isApproved
                          ? "bg-emerald-950 border border-emerald-800 text-emerald-400"
                          : isUnlocked
                          ? "bg-blue-950 border border-blue-800 text-blue-400"
                          : "bg-slate-900 border border-slate-800 text-slate-500"
                      }`}
                    >
                      {gate.isApproved ? (
                        <CheckCircle2 className="w-5 h-5" />
                      ) : isUnlocked ? (
                        <Unlock className="w-5 h-5" />
                      ) : (
                        <Lock className="w-5 h-5" />
                      )}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold text-white">{meta.title}</h3>
                        {gate.isApproved ? (
                          <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-emerald-950 text-emerald-400 border border-emerald-800">
                            ONAYLANDI
                          </span>
                        ) : isUnlocked ? (
                          <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-blue-950 text-blue-400 border border-blue-800">
                            ONAY BEKLİYOR
                          </span>
                        ) : (
                          <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-slate-900 text-slate-500 border border-slate-800">
                            KİLİTLİ
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 mt-1">{meta.subtitle}</p>
                    </div>
                  </div>

                  {/* Actions (Approve / Revoke / Lock) */}
                  <div className="flex items-center gap-2 self-end sm:self-center">
                    {/* Document Button */}
                    <button
                      onClick={() => {
                        setDocModalGate(gate)
                        setNewDocUrl(gate.documentUrl || "")
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 hover:border-slate-700 text-xs text-slate-300 transition-colors"
                    >
                      <FileText className="w-3.5 h-3.5 text-blue-400" />
                      <span>{gate.documentUrl ? "Belgeyi Görüntüle" : "Belge Ekle"}</span>
                    </button>

                    {/* Approve / Revoke Button */}
                    {gate.isApproved ? (
                      <button
                        onClick={() => handleToggleApproval(gate, false)}
                        disabled={updatingGateId === gate.id}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-red-950/40 hover:text-red-300 text-slate-400 text-xs font-medium transition-colors"
                        title="Onayı Geri Al"
                      >
                        <X className="w-3.5 h-3.5" />
                        <span>Onayı Kaldır</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => handleToggleApproval(gate, true)}
                        disabled={!isUnlocked || updatingGateId === gate.id}
                        className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                          isUnlocked
                            ? "bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
                            : "bg-slate-900 border border-slate-800 text-slate-600 cursor-not-allowed"
                        }`}
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>
                          {updatingGateId === gate.id
                            ? "Onaylanıyor..."
                            : isUnlocked
                            ? "Onayla & Kilidi Aç"
                            : "Önceki Faz Onayı Gerekli"}
                        </span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Sub details: required docs and unlocks */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-slate-800/80 text-xs">
                  <div className="flex items-center gap-2 text-slate-400">
                    <span className="font-semibold text-slate-300">Gerekli Evrak:</span>
                    <span className="truncate">{meta.requiredDocs}</span>
                  </div>

                  <div className="flex items-center gap-2 text-slate-400 sm:justify-end">
                    <span className="font-semibold text-slate-300">Açılan Faz:</span>
                    <span className="text-blue-400 truncate">{meta.unlocksPhase}</span>
                  </div>
                </div>

                {/* Attached Document Preview if exists */}
                {gate.documentUrl && (
                  <div className="bg-slate-950 border border-slate-800/90 rounded-lg p-2.5 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 text-slate-300 truncate">
                      <FileText className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span className="truncate font-mono text-[11px] text-slate-400">
                        {gate.documentUrl}
                      </span>
                    </div>
                    <a
                      href={gate.documentUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:text-blue-300 text-xs font-medium flex items-center gap-1 shrink-0 ml-2"
                    >
                      <span>Aç</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Document Upload / Edit Modal */}
      {docModalGate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-400" />
                <span>Ruhsat / Kontrat Belgesi Ekle</span>
              </h3>
              <button
                onClick={() => setDocModalGate(null)}
                className="text-slate-400 hover:text-white p-1"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-400">
              <span className="font-semibold text-white">"{docModalGate.stageName}"</span> aşaması için
              onay belgesi, ruhsat veya kontrat linkini girin.
            </p>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300">Belge Bağlantısı (URL)</label>
              <input
                type="text"
                value={newDocUrl}
                onChange={(e) => setNewDocUrl(e.target.value)}
                placeholder="Örn: https://storage.nexa.com/contracts/ruhsat-cevahir.pdf"
                className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-200 placeholder-slate-600 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setDocModalGate(null)}
                className="px-3.5 py-2 text-xs rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700"
              >
                İptal
              </button>
              <button
                onClick={handleSaveDocument}
                disabled={updatingGateId === docModalGate.id}
                className="px-4 py-2 text-xs rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700"
              >
                Kaydet
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
