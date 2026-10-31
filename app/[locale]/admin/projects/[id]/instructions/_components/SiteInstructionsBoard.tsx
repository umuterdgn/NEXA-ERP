"use client"
/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Saha Talimatları Kanban Panosu (Site Instructions Board)
 */

import { useState } from "react"
import { useRouter } from "next/navigation"
import toast from "react-hot-toast"
import {
  Plus,
  Search,
  Filter,
  AlertCircle,
  Clock,
  CheckCircle2,
  XCircle,
  Building2,
  Paperclip,
  Trash2,
  MoveRight,
  User,
  ArrowRight,
  RotateCcw,
  ExternalLink,
  ChevronRight,
  ShieldAlert,
} from "lucide-react"
import {
  createSiteInstruction,
  updateSiteInstructionStatus,
  deleteSiteInstruction,
} from "@/app/actions/site-instructions"

type StatusType = "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED"
type PriorityType = "URGENT" | "NORMAL" | "LOW"

interface InstructionItem {
  id: string
  projectId: string
  createdById: string
  subcontractorId: string | null
  title: string
  description: string
  attachments: string[]
  priority: string
  status: string
  createdAt: Date | string
  creator?: {
    id: string
    name: string
    role: string
  } | null
  subcontractor?: {
    id: string
    name: string
    contactName: string | null
    phone: string | null
  } | null
}

interface SubcontractorOption {
  id: string
  name: string
  contactName: string | null
  phone: string | null
}

const COLUMNS: { id: StatusType; label: string; countColor: string; borderColor: string; badgeColor: string }[] = [
  {
    id: "OPEN",
    label: "Açık / Yeni Talimat",
    countColor: "bg-amber-500/20 text-amber-400 border-amber-500/30",
    borderColor: "border-amber-500/40",
    badgeColor: "bg-amber-950/60 border-amber-800 text-amber-300",
  },
  {
    id: "IN_PROGRESS",
    label: "Sahada İşlemde",
    countColor: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    borderColor: "border-blue-500/40",
    badgeColor: "bg-blue-950/60 border-blue-800 text-blue-300",
  },
  {
    id: "RESOLVED",
    label: "Çözüldü / İmal Edildi",
    countColor: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
    borderColor: "border-emerald-500/40",
    badgeColor: "bg-emerald-950/60 border-emerald-800 text-emerald-300",
  },
  {
    id: "CLOSED",
    label: "Kontrol Edildi & Kapatıldı",
    countColor: "bg-slate-500/20 text-slate-400 border-slate-500/30",
    borderColor: "border-slate-500/40",
    badgeColor: "bg-slate-900 border-slate-700 text-slate-400",
  },
]

const PRIORITY_CONFIG: Record<string, { label: string; badge: string; icon: any }> = {
  URGENT: {
    label: "ACİL",
    badge: "bg-red-950/80 border-red-800 text-red-300",
    icon: AlertCircle,
  },
  NORMAL: {
    label: "Normal",
    badge: "bg-blue-950/80 border-blue-800 text-blue-300",
    icon: Clock,
  },
  LOW: {
    label: "Düşük",
    badge: "bg-slate-900 border-slate-700 text-slate-400",
    icon: Clock,
  },
}

export default function SiteInstructionsBoard({
  projectId,
  initialInstructions,
  subcontractors,
  currentUserRole,
}: {
  projectId: string
  initialInstructions: InstructionItem[]
  subcontractors: SubcontractorOption[]
  currentUserRole?: string
}) {
  const router = useRouter()
  const [instructions, setInstructions] = useState<InstructionItem[]>(initialInstructions)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedPriority, setSelectedPriority] = useState<string>("ALL")
  const [selectedSubcontractor, setSelectedSubcontractor] = useState<string>("ALL")
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  // KPI Calculations
  const totalCount = instructions.length
  const openCount = instructions.filter((i) => i.status === "OPEN").length
  const inProgressCount = instructions.filter((i) => i.status === "IN_PROGRESS").length
  const resolvedCount = instructions.filter((i) => i.status === "RESOLVED").length
  const closedCount = instructions.filter((i) => i.status === "CLOSED").length
  const urgentCount = instructions.filter((i) => i.priority === "URGENT" && i.status !== "CLOSED").length

  // Filter Logic
  const filteredInstructions = instructions.filter((item) => {
    const matchesSearch =
      searchQuery === "" ||
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.subcontractor?.name && item.subcontractor.name.toLowerCase().includes(searchQuery.toLowerCase()))

    const matchesPriority = selectedPriority === "ALL" || item.priority === selectedPriority
    const matchesSub = selectedSubcontractor === "ALL" || item.subcontractorId === selectedSubcontractor

    return matchesSearch && matchesPriority && matchesSub
  })

  // Status Change Handler
  const handleStatusChange = async (instructionId: string, newStatus: StatusType) => {
    try {
      setUpdatingId(instructionId)
      const res = await updateSiteInstructionStatus(instructionId, newStatus)
      if (res.success) {
        setInstructions((prev) =>
          prev.map((item) => (item.id === instructionId ? { ...item, status: newStatus } : item))
        )
        toast.success(`Talimat "${COLUMNS.find((c) => c.id === newStatus)?.label}" aşamasına taşındı.`)
      } else {
        toast.error(res.error || "Durum güncellenemedi.")
      }
    } catch {
      toast.error("Bir hata oluştu.")
    } finally {
      setUpdatingId(null)
    }
  }

  // Delete Handler
  const handleDelete = async (instructionId: string) => {
    if (!window.confirm("Bu saha talimatını silmek istediğinize emin misiniz?")) return
    try {
      const res = await deleteSiteInstruction(instructionId)
      if (res.success) {
        setInstructions((prev) => prev.filter((i) => i.id !== instructionId))
        toast.success("Saha talimatı silindi.")
      } else {
        toast.error(res.error || "Silinemedi.")
      }
    } catch {
      toast.error("Silme hatası.")
    }
  }

  return (
    <div className="space-y-6">
      {/* KPI Cards Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5 flex flex-col justify-between">
          <span className="text-[11px] font-medium text-slate-400">Toplam Talimat</span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-xl font-bold text-white font-mono">{totalCount}</span>
            <span className="text-[10px] text-slate-500">Kayıtlı</span>
          </div>
        </div>

        <div className="bg-slate-900/80 border border-amber-900/40 rounded-xl p-3.5 flex flex-col justify-between">
          <span className="text-[11px] font-medium text-amber-400">Açık / Yeni</span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-xl font-bold text-amber-300 font-mono">{openCount}</span>
            <span className="text-[10px] text-amber-500/70">Bekliyor</span>
          </div>
        </div>

        <div className="bg-slate-900/80 border border-blue-900/40 rounded-xl p-3.5 flex flex-col justify-between">
          <span className="text-[11px] font-medium text-blue-400">Sahada İşlemde</span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-xl font-bold text-blue-300 font-mono">{inProgressCount}</span>
            <span className="text-[10px] text-blue-500/70">Aktif İmalat</span>
          </div>
        </div>

        <div className="bg-slate-900/80 border border-emerald-900/40 rounded-xl p-3.5 flex flex-col justify-between">
          <span className="text-[11px] font-medium text-emerald-400">Çözüldü / İmal Edildi</span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-xl font-bold text-emerald-300 font-mono">{resolvedCount}</span>
            <span className="text-[10px] text-emerald-500/70">Kontrol Bekliyor</span>
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5 flex flex-col justify-between">
          <span className="text-[11px] font-medium text-slate-400">Kapatıldı</span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-xl font-bold text-slate-300 font-mono">{closedCount}</span>
            <span className="text-[10px] text-slate-500">Tamamlandı</span>
          </div>
        </div>

        <div className="bg-slate-900/80 border border-red-900/40 rounded-xl p-3.5 flex flex-col justify-between">
          <span className="text-[11px] font-medium text-red-400 flex items-center gap-1">
            <ShieldAlert className="w-3.5 h-3.5" /> Acil Revizyon
          </span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-xl font-bold text-red-300 font-mono">{urgentCount}</span>
            <span className="text-[10px] text-red-500/70">Kritik</span>
          </div>
        </div>
      </div>

      {/* Filter and Action Bar */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1">
          {/* Search Box */}
          <div className="relative flex-1 min-w-[220px]">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Talimat, revizyon konusu, taşeron ara..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Priority Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-slate-500 whitespace-nowrap">Öncelik:</span>
            <select
              value={selectedPriority}
              onChange={(e) => setSelectedPriority(e.target.value)}
              className="px-2.5 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-300 focus:outline-none focus:border-blue-500"
            >
              <option value="ALL">Tüm Öncelikler</option>
              <option value="URGENT">🚨 Acil (URGENT)</option>
              <option value="NORMAL">Normal</option>
              <option value="LOW">Düşük</option>
            </select>
          </div>

          {/* Subcontractor Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-slate-500 whitespace-nowrap">Taşeron:</span>
            <select
              value={selectedSubcontractor}
              onChange={(e) => setSelectedSubcontractor(e.target.value)}
              className="px-2.5 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-300 focus:outline-none focus:border-blue-500 max-w-[200px]"
            >
              <option value="ALL">Tüm Taşeronlar</option>
              {subcontractors.map((sub) => (
                <option key={sub.id} value={sub.id}>
                  {sub.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Add Instruction Button */}
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="px-4 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white rounded-lg shadow-sm hover:shadow transition-all flex items-center justify-center gap-1.5 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Yeni Saha Talimatı (DÖF)</span>
        </button>
      </div>

      {/* Kanban Board 4 Columns */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 items-start">
        {COLUMNS.map((col) => {
          const colItems = filteredInstructions.filter((i) => i.status === col.id)

          return (
            <div
              key={col.id}
              className={`bg-slate-900/60 border border-slate-800/80 rounded-xl overflow-hidden flex flex-col min-h-[500px] transition-all`}
            >
              {/* Column Header */}
              <div
                className={`p-3.5 border-b border-slate-800 flex items-center justify-between bg-slate-900/90`}
              >
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${col.borderColor.replace("border-", "bg-")}`} />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">{col.label}</h3>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-xs font-mono font-semibold ${col.countColor}`}>
                  {colItems.length}
                </span>
              </div>

              {/* Column Cards Container */}
              <div className="p-3 space-y-3 flex-1 overflow-y-auto max-h-[calc(100vh-320px)]">
                {colItems.length === 0 ? (
                  <div className="py-12 text-center text-slate-600 text-xs border border-dashed border-slate-800/60 rounded-lg">
                    Bu aşamada talimat yok
                  </div>
                ) : (
                  colItems.map((item) => {
                    const priorityConfig = PRIORITY_CONFIG[item.priority] || PRIORITY_CONFIG.NORMAL
                    const PriorityIcon = priorityConfig.icon

                    return (
                      <div
                        key={item.id}
                        className={`bg-slate-950/90 border border-slate-800 hover:border-slate-700 rounded-lg p-3.5 space-y-2.5 transition-all shadow-sm hover:shadow-md group`}
                      >
                        {/* Card Header: Priority & Date */}
                        <div className="flex items-center justify-between gap-2">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold border ${priorityConfig.badge}`}
                          >
                            <PriorityIcon className="w-3 h-3" />
                            {priorityConfig.label}
                          </span>

                          <span className="text-[10px] text-slate-500 font-mono">
                            {new Date(item.createdAt).toLocaleDateString("tr-TR", {
                              day: "2-digit",
                              month: "short",
                            })}
                          </span>
                        </div>

                        {/* Title & Description */}
                        <div>
                          <h4 className="text-xs font-bold text-white group-hover:text-blue-300 transition-colors">
                            {item.title}
                          </h4>
                          <p className="text-[11px] text-slate-400 mt-1 line-clamp-3 leading-relaxed whitespace-pre-line">
                            {item.description}
                          </p>
                        </div>

                        {/* Subcontractor Assignment */}
                        {item.subcontractor && (
                          <div className="flex items-center gap-1.5 px-2 py-1 bg-slate-900 border border-slate-800/80 rounded text-[11px] text-slate-300">
                            <Building2 className="w-3 h-3 text-amber-400 shrink-0" />
                            <span className="truncate font-medium">{item.subcontractor.name}</span>
                          </div>
                        )}

                        {/* Creator Tag */}
                        <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 border-t border-slate-900">
                          <span className="flex items-center gap-1 text-slate-400">
                            <User className="w-3 h-3 text-slate-500" />
                            {item.creator?.name || "Saha Mühendisi"}
                          </span>

                          {item.attachments && item.attachments.length > 0 && (
                            <span className="flex items-center gap-1 text-blue-400 bg-blue-950/40 px-1.5 py-0.5 rounded border border-blue-900/40">
                              <Paperclip className="w-2.5 h-2.5" />
                              {item.attachments.length} Ek
                            </span>
                          )}
                        </div>

                        {/* Attachments list (if any) */}
                        {item.attachments && item.attachments.length > 0 && (
                          <div className="space-y-1 pt-1">
                            {item.attachments.map((url, idx) => (
                              <a
                                key={idx}
                                href={url}
                                target="_blank"
                                rel="noreferrer"
                                className="block truncate text-[10px] text-blue-400 hover:underline hover:text-blue-300 flex items-center gap-1"
                              >
                                <ExternalLink className="w-2.5 h-2.5" />
                                Ek Pafta / Fotoğraf {idx + 1}
                              </a>
                            ))}
                          </div>
                        )}

                        {/* Card Workflow Transition Buttons */}
                        <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between gap-1">
                          <div className="flex items-center gap-1">
                            {col.id === "OPEN" && (
                              <button
                                disabled={updatingId === item.id}
                                onClick={() => handleStatusChange(item.id, "IN_PROGRESS")}
                                className="px-2 py-1 text-[10px] font-semibold bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 rounded flex items-center gap-1 transition-all"
                              >
                                <span>İşleme Al</span>
                                <ArrowRight className="w-2.5 h-2.5" />
                              </button>
                            )}

                            {col.id === "IN_PROGRESS" && (
                              <>
                                <button
                                  disabled={updatingId === item.id}
                                  onClick={() => handleStatusChange(item.id, "RESOLVED")}
                                  className="px-2 py-1 text-[10px] font-semibold bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 rounded flex items-center gap-1 transition-all"
                                >
                                  <CheckCircle2 className="w-2.5 h-2.5" />
                                  <span>Çözüldü</span>
                                </button>
                                <button
                                  disabled={updatingId === item.id}
                                  onClick={() => handleStatusChange(item.id, "OPEN")}
                                  className="px-1.5 py-1 text-[10px] text-slate-400 hover:text-slate-200"
                                  title="Açık durumuna geri çek"
                                >
                                  <RotateCcw className="w-2.5 h-2.5" />
                                </button>
                              </>
                            )}

                            {col.id === "RESOLVED" && (
                              <>
                                <button
                                  disabled={updatingId === item.id}
                                  onClick={() => handleStatusChange(item.id, "CLOSED")}
                                  className="px-2 py-1 text-[10px] font-semibold bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/30 rounded flex items-center gap-1 transition-all"
                                >
                                  <span>Kapat & Arşivle</span>
                                  <CheckCircle2 className="w-2.5 h-2.5" />
                                </button>
                                <button
                                  disabled={updatingId === item.id}
                                  onClick={() => handleStatusChange(item.id, "IN_PROGRESS")}
                                  className="px-1.5 py-1 text-[10px] text-amber-400 hover:text-amber-300"
                                  title="Yetersiz, sahada revize et"
                                >
                                  <RotateCcw className="w-2.5 h-2.5" />
                                </button>
                              </>
                            )}

                            {col.id === "CLOSED" && (
                              <button
                                disabled={updatingId === item.id}
                                onClick={() => handleStatusChange(item.id, "OPEN")}
                                className="px-2 py-1 text-[10px] text-slate-400 hover:text-slate-200 border border-slate-800 rounded flex items-center gap-1"
                              >
                                <RotateCcw className="w-2.5 h-2.5" />
                                <span>Yeniden Aç</span>
                              </button>
                            )}
                          </div>

                          <button
                            onClick={() => handleDelete(item.id)}
                            className="p-1 text-slate-600 hover:text-red-400 transition-colors"
                            title="Talimatı Sil"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* "Yeni Saha Talimatı / DÖF Girişi" Modal */}
      {isAddModalOpen && (
        <AddInstructionModal
          projectId={projectId}
          subcontractors={subcontractors}
          onClose={() => setIsAddModalOpen(false)}
          onSuccess={(newInst) => {
            setInstructions((prev) => [newInst, ...prev])
            setIsAddModalOpen(false)
          }}
        />
      )}
    </div>
  )
}

/**
 * Yeni Saha Talimatı Modal Formu
 */
function AddInstructionModal({
  projectId,
  subcontractors,
  onClose,
  onSuccess,
}: {
  projectId: string
  subcontractors: SubcontractorOption[]
  onClose: () => void
  onSuccess: (newInst: InstructionItem) => void
}) {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    priority: "NORMAL" as PriorityType,
    subcontractorId: "",
    attachmentInput: "",
    attachments: [] as string[],
  })
  const [submitting, setSubmitting] = useState(false)

  const handleAddAttachment = () => {
    if (!formData.attachmentInput.trim()) return
    setFormData((prev) => ({
      ...prev,
      attachments: [...prev.attachments, prev.attachmentInput.trim()],
      attachmentInput: "",
    }))
  }

  const handleRemoveAttachment = (idx: number) => {
    setFormData((prev) => ({
      ...prev,
      attachments: prev.attachments.filter((_, i) => i !== idx),
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.title.trim() || !formData.description.trim()) {
      toast.error("Lütfen başlık ve açıklama alanlarını doldurunuz.")
      return
    }

    try {
      setSubmitting(true)
      const res = await createSiteInstruction({
        projectId,
        title: formData.title,
        description: formData.description,
        priority: formData.priority,
        subcontractorId: formData.subcontractorId || undefined,
        attachments: formData.attachments,
      })

      if (res.success && res.data) {
        toast.success(res.message || "Saha talimatı açıldı.")
        // Enrich with sub info for immediate rendering
        const sub = subcontractors.find((s) => s.id === formData.subcontractorId) || null
        onSuccess({
          ...res.data,
          subcontractor: sub,
        })
      } else {
        toast.error(res.error || "Hata oluştu.")
      }
    } catch {
      toast.error("Talimat oluşturulurken hata oluştu.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl space-y-4">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <Plus className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Yeni Saha Talimatı (Site Instruction) & DÖF</h3>
              <p className="text-[11px] text-slate-400">
                Saha revizyonu, imalat düzeltmesi veya taşeron iş emri oluşturun
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <XCircle className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-4">
          {/* Title */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300">Talimat / Revizyon Konusu *</label>
            <input
              type="text"
              placeholder="Örn: Mimari Revizyon - A Blok Kapı Genişletmesi veya 2. Kat Kolon Paspayı Düzeltmesi"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-white placeholder-slate-600 focus:outline-none focus:border-blue-500"
              required
            />
          </div>

          {/* Priority & Subcontractor */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">Öncelik Derecesi *</label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value as PriorityType })}
                className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-white focus:outline-none focus:border-blue-500"
              >
                <option value="NORMAL">Normal Öncelik</option>
                <option value="URGENT">🚨 Acil (Durdurucu İmalat / Revizyon)</option>
                <option value="LOW">Düşük (Rutin)</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">Atanan Taşeron</label>
              <select
                value={formData.subcontractorId}
                onChange={(e) => setFormData({ ...formData, subcontractorId: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-white focus:outline-none focus:border-blue-500"
              >
                <option value="">-- Taşeron Seçiniz (Opsiyonel) --</option>
                {subcontractors.map((sub) => (
                  <option key={sub.id} value={sub.id}>
                    {sub.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300">Açıklama & Teknik Talimat Detayları *</label>
            <textarea
              rows={4}
              placeholder="Şantiye aksları, kot bilgisi, revizyon sebebi, yapılması gereken düzeltici faaliyet ve taşeronun uyması gereken teknik şartlar..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 leading-relaxed"
              required
            />
          </div>

          {/* Attachments / Paftalar */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <Paperclip className="w-3.5 h-3.5 text-slate-400" />
              <span>Çizim, Pafta veya Fotoğraf Ekleri (URL)</span>
            </label>
            <div className="flex gap-2">
              <input
                type="url"
                placeholder="https://... (Çizim, PDF veya fotoğraf linki)"
                value={formData.attachmentInput}
                onChange={(e) => setFormData({ ...formData, attachmentInput: e.target.value })}
                className="flex-1 px-3 py-1.5 text-xs bg-slate-950 border border-slate-800 rounded-lg text-white placeholder-slate-600 focus:outline-none focus:border-blue-500"
              />
              <button
                type="button"
                onClick={handleAddAttachment}
                className="px-3 py-1.5 text-xs bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors"
              >
                Ekle
              </button>
            </div>

            {formData.attachments.length > 0 && (
              <div className="space-y-1">
                {formData.attachments.map((att, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between px-2.5 py-1 text-xs bg-slate-950 border border-slate-800 rounded text-slate-300"
                  >
                    <span className="truncate max-w-[380px]">{att}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveAttachment(idx)}
                      className="text-slate-500 hover:text-red-400"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Modal Actions */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white bg-slate-800/60 hover:bg-slate-800 rounded-lg transition-colors"
            >
              Vazgeç
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white rounded-lg shadow transition-all disabled:opacity-50 flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{submitting ? "Oluşturuluyor..." : "Talimatı Yayınla"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
