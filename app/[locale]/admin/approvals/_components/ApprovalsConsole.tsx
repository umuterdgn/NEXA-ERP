"use client"
/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Merkezi Onay Bekleyenler Konsolu (Pending Approvals Console)
 * Kademeli Onay Zinciri: Saha Mühendisi (1. Kademe) -> Şantiye Şefi / Proje Müdürü (2. Kademe)
 */

import { useState } from "react"
import Link from "next/link"
import toast from "react-hot-toast"
import {
  CheckSquare,
  Clock,
  CheckCircle2,
  XCircle,
  Building2,
  Paperclip,
  DollarSign,
  Calendar,
  Layers,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Lock,
  Unlock,
  Eye,
  Search,
  Filter,
  User,
  ExternalLink,
  ChevronRight,
  TrendingUp,
  Receipt,
  FileSpreadsheet,
  Wallet,
  Sparkles,
} from "lucide-react"
import {
  approveWorkProof,
  rejectWorkProof,
  reviewLeaveRequest,
  reviewExpenseClaim,
  reviewProgressBilling,
} from "@/app/actions/approvals"
import { isEngineerRole, isManagerRole } from "@/lib/roles"

interface CurrentUser {
  id: string
  name: string
  role: string
}

interface WorkProofItem {
  id: string
  contractId: string
  subcontractorId: string
  title: string
  description: string | null
  imageUrl: string
  status: string
  engineerStatus: string
  managerStatus: string
  engineerId: string | null
  managerId: string | null
  createdAt: string | Date
  engineerName?: string | null
  managerName?: string | null
  contract?: {
    id: string
    title?: string | null
    amount?: number | null
    project?: {
      id: string
      name?: string | null
      title?: string | null
      city?: string | null
      district?: string | null
    } | null
  } | null
  subcontractor?: {
    id: string
    name: string
    contactName?: string | null
    phone?: string | null
  } | null
}

interface LeaveRequestItem {
  id: string
  userId: string | null
  personelId: string | null
  leaveType: string | null
  startDate: string | Date
  endDate: string | Date
  totalDays: number | null
  days: number | null
  reason: string | null
  status: string
  createdAt: string | Date
  personel?: {
    id: string
    name: string
    department?: string | null
    position?: string | null
  } | null
  user?: {
    id: string
    name: string
    email: string
  } | null
}

interface ExpenseClaimItem {
  id: string
  userId: string
  projectId: string | null
  expenseType: string
  amount: number
  receiptUrl: string
  description: string | null
  status: string
  createdAt: string | Date
  user?: {
    id: string
    name: string
    email: string
  } | null
}

interface ProgressBillingItem {
  id: string
  contractId: string | null
  billingNumber: number
  grossAmount: number
  advanceDeduction: number
  penaltyDeduction: number
  retentionDeduction: number
  netPayable: number
  status: string
  createdAt: string | Date
  contract?: {
    id: string
    project?: {
      id: string
      name?: string | null
      title?: string | null
    } | null
    subcontractor?: {
      id: string
      name: string
    } | null
  } | null
}

interface ApprovalRequestItem {
  id: string
  title: string
  requestType: string
  requestedBy: string
  amount: number | null
  notes: string | null
  status: string
  createdAt: string | Date
  project?: {
    id: string
    name?: string | null
    title?: string | null
  } | null
}

export default function ApprovalsConsole({
  workProofs: initialWorkProofs,
  leaveRequests: initialLeaveRequests,
  expenseClaims: initialExpenseClaims,
  progressBillings: initialProgressBillings,
  approvalRequests: initialApprovalRequests,
  currentUser,
}: {
  workProofs: WorkProofItem[]
  leaveRequests: LeaveRequestItem[]
  expenseClaims: ExpenseClaimItem[]
  progressBillings: ProgressBillingItem[]
  approvalRequests: ApprovalRequestItem[]
  currentUser: CurrentUser
}) {
  const [activeTab, setActiveTab] = useState<"ALL" | "PROOFS" | "EXPENSES" | "LEAVES" | "BILLINGS" | "LEGACY">("ALL")
  const [searchQuery, setSearchQuery] = useState("")
  const [workProofs, setWorkProofs] = useState<WorkProofItem[]>(initialWorkProofs)
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequestItem[]>(initialLeaveRequests)
  const [expenseClaims, setExpenseClaims] = useState<ExpenseClaimItem[]>(initialExpenseClaims)
  const [progressBillings, setProgressBillings] = useState<ProgressBillingItem[]>(initialProgressBillings)
  const [approvalRequests, setApprovalRequests] = useState<ApprovalRequestItem[]>(initialApprovalRequests)

  const [processingId, setProcessingId] = useState<string | null>(null)
  const [previewImage, setPreviewImage] = useState<string | null>(null)
  const [rejectModal, setRejectModal] = useState<{
    isOpen: boolean
    type: "PROOF" | "LEAVE" | "EXPENSE" | "BILLING" | null
    id: string | null
    title: string
    reason: string
  }>({
    isOpen: false,
    type: null,
    id: null,
    title: "",
    reason: "",
  })

  const currentRole = currentUser?.role || "STAFF"
  const isEngineer = isEngineerRole(currentRole)
  const isManager = isManagerRole(currentRole)

  // Calculations
  const pendingProofsCount = workProofs.filter((w) => w.status === "PENDING").length
  const pendingLeavesCount = leaveRequests.filter((l) => l.status === "PENDING").length
  const pendingExpensesCount = expenseClaims.filter((e) => e.status === "PENDING").length
  const pendingBillingsCount = progressBillings.filter((b) => b.status === "PENDING_APPROVAL" || b.status === "DRAFT").length
  const pendingLegacyCount = approvalRequests.filter((a) => a.status === "PENDING").length

  const totalPending = pendingProofsCount + pendingLeavesCount + pendingExpensesCount + pendingBillingsCount + pendingLegacyCount

  // Total pending financial impact
  const totalFinancialAmount =
    expenseClaims.reduce((s, e) => s + (e.amount || 0), 0) +
    progressBillings.reduce((s, b) => s + (b.netPayable || 0), 0) +
    approvalRequests.reduce((s, a) => s + (a.amount || 0), 0)

  // WorkProof Approval Handler
  const handleApproveWorkProof = async (proof: WorkProofItem) => {
    try {
      setProcessingId(proof.id)
      const res = await approveWorkProof(proof.id)
      if (res.success) {
        toast.success(res.message || "İş kanıtı onaylandı!")
        // Update local state
        setWorkProofs((prev) =>
          prev.map((item) => {
            if (item.id === proof.id) {
              const nextEng = isEngineer && !isManager ? "APPROVED" : item.engineerStatus
              const nextMgr = isManager ? "APPROVED" : item.managerStatus
              const isFull = (nextEng === "APPROVED" || item.engineerStatus === "APPROVED") && nextMgr === "APPROVED"
              return {
                ...item,
                engineerStatus: nextEng,
                managerStatus: nextMgr,
                status: isFull ? "APPROVED" : item.status,
              }
            }
            return item
          })
        )
      } else {
        toast.error(res.error || "Onaylama başarısız.")
      }
    } catch {
      toast.error("Bir hata oluştu.")
    } finally {
      setProcessingId(null)
    }
  }

  // General Rejection Confirm
  const handleConfirmReject = async () => {
    if (!rejectModal.id || !rejectModal.type) return
    const { id, type, reason } = rejectModal

    try {
      setProcessingId(id)
      if (type === "PROOF") {
        const res = await rejectWorkProof(id, reason)
        if (res.success) {
          toast.success(res.message || "İş kanıtı reddedildi.")
          setWorkProofs((prev) => prev.filter((p) => p.id !== id))
        } else {
          toast.error(res.error || "İşlem başarısız.")
        }
      } else if (type === "LEAVE") {
        const res = await reviewLeaveRequest(id, "REJECTED", reason)
        if (res.success) {
          toast.success("İzin talebi reddedildi.")
          setLeaveRequests((prev) => prev.filter((l) => l.id !== id))
        } else {
          toast.error(res.error || "İşlem başarısız.")
        }
      } else if (type === "EXPENSE") {
        const res = await reviewExpenseClaim(id, "REJECTED")
        if (res.success) {
          toast.success("Masraf talebi reddedildi.")
          setExpenseClaims((prev) => prev.filter((e) => e.id !== id))
        } else {
          toast.error(res.error || "İşlem başarısız.")
        }
      }
      setRejectModal({ isOpen: false, type: null, id: null, title: "", reason: "" })
    } catch {
      toast.error("İşlem sırasında hata oluştu.")
    } finally {
      setProcessingId(null)
    }
  }

  // Quick Action for Leaves
  const handleApproveLeave = async (id: string) => {
    try {
      setProcessingId(id)
      const res = await reviewLeaveRequest(id, "APPROVED")
      if (res.success) {
        toast.success("İzin talebi onaylandı.")
        setLeaveRequests((prev) => prev.filter((l) => l.id !== id))
      } else {
        toast.error(res.error || "Hata oluştu.")
      }
    } finally {
      setProcessingId(null)
    }
  }

  // Quick Action for Expenses
  const handleApproveExpense = async (id: string) => {
    try {
      setProcessingId(id)
      const res = await reviewExpenseClaim(id, "APPROVED")
      if (res.success) {
        toast.success("Masraf fişi onaylandı.")
        setExpenseClaims((prev) => prev.filter((e) => e.id !== id))
      } else {
        toast.error(res.error || "Hata oluştu.")
      }
    } finally {
      setProcessingId(null)
    }
  }

  // Quick Action for Billings
  const handleApproveBilling = async (id: string) => {
    try {
      setProcessingId(id)
      const res = await reviewProgressBilling(id, "APPROVED")
      if (res.success) {
        toast.success("Hakediş onaylandı.")
        setProgressBillings((prev) => prev.filter((b) => b.id !== id))
      } else {
        toast.error(res.error || "Hata oluştu.")
      }
    } finally {
      setProcessingId(null)
    }
  }

  return (
    <div className="space-y-6">
      {/* Top Banner & KPI Stat Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Toplam Bekleyen
            </span>
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
          </div>
          <div className="flex items-baseline justify-between mt-3">
            <span className="text-3xl font-black text-white font-mono">{totalPending}</span>
            <span className="text-xs text-amber-400 font-medium">Onay Konsolu</span>
          </div>
        </div>

        <div className="bg-slate-900/80 border border-cyan-900/40 rounded-2xl p-4 flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4" /> Kademeli İş Kanıtı
            </span>
            <span className="text-[10px] text-cyan-500 font-mono">2 Aşamalı</span>
          </div>
          <div className="flex items-baseline justify-between mt-3">
            <span className="text-3xl font-black text-cyan-300 font-mono">{pendingProofsCount}</span>
            <span className="text-xs text-slate-400">Taşeron İmalat</span>
          </div>
        </div>

        <div className="bg-slate-900/80 border border-emerald-900/40 rounded-2xl p-4 flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
              <Receipt className="w-4 h-4" /> Masraflar & Fişler
            </span>
            <span className="text-[10px] text-emerald-500 font-mono">Saha / Yakıt</span>
          </div>
          <div className="flex items-baseline justify-between mt-3">
            <span className="text-3xl font-black text-emerald-300 font-mono">{pendingExpensesCount}</span>
            <span className="text-xs text-slate-400">Fiş Kontrolü</span>
          </div>
        </div>

        <div className="bg-slate-900/80 border border-purple-900/40 rounded-2xl p-4 flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-purple-400 uppercase tracking-wider flex items-center gap-1.5">
              <Calendar className="w-4 h-4" /> Personel İzinleri
            </span>
            <span className="text-[10px] text-purple-500 font-mono">İK Takip</span>
          </div>
          <div className="flex items-baseline justify-between mt-3">
            <span className="text-3xl font-black text-purple-300 font-mono">{pendingLeavesCount}</span>
            <span className="text-xs text-slate-400">İş Günü Hesabı</span>
          </div>
        </div>

        <div className="bg-slate-900/80 border border-amber-900/40 rounded-2xl p-4 flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
              <Wallet className="w-4 h-4" /> Bekleyen Finansal
            </span>
            <span className="text-[10px] text-amber-500 font-mono">TRY</span>
          </div>
          <div className="flex items-baseline justify-between mt-3">
            <span className="text-2xl font-black text-amber-300 font-mono">
              ₺{totalFinancialAmount.toLocaleString("tr-TR")}
            </span>
            <span className="text-xs text-slate-500">Kümülatif</span>
          </div>
        </div>
      </div>

      {/* Role Notice & Authorization Indicator */}
      <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-blue-600/20 text-blue-400 border border-blue-500/30 flex items-center justify-center font-bold">
            <User className="w-4 h-4" />
          </div>
          <div>
            <span className="text-slate-400">Aktif Kullanıcı Yetkisi:</span>{" "}
            <strong className="text-white font-mono">{currentUser.name}</strong>{" "}
            <span className="px-2 py-0.5 rounded bg-blue-950/80 border border-blue-800 text-blue-300 font-semibold ml-1 text-[11px]">
              {currentRole}
            </span>
          </div>
        </div>

        <div className="text-slate-400 flex items-center gap-2">
          {isEngineer && (
            <span className="text-cyan-400 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> 1. Kademe (Saha Mühendisi) Teknik Onay Yetkili
            </span>
          )}
          {isManager && (
            <span className="text-emerald-400 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" /> 2. Kademe (Şantiye Şefi / Proje Müdürü) Nihai Onay & Hakediş Yetkili
            </span>
          )}
        </div>
      </div>

      {/* Tabs and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex gap-2 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab("ALL")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === "ALL"
                ? "bg-blue-600 text-white shadow-sm"
                : "bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800"
            }`}
          >
            <span>Tüm Talepler</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-black/40 font-mono">
              {totalPending}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("PROOFS")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === "PROOFS"
                ? "bg-cyan-600 text-white shadow-sm"
                : "bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800"
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>İş Kanıtları (Kademeli)</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-black/40 font-mono">
              {pendingProofsCount}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("EXPENSES")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === "EXPENSES"
                ? "bg-emerald-600 text-white shadow-sm"
                : "bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800"
            }`}
          >
            <Receipt className="w-3.5 h-3.5" />
            <span>Masraflar & Fişler</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-black/40 font-mono">
              {pendingExpensesCount}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("LEAVES")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === "LEAVES"
                ? "bg-purple-600 text-white shadow-sm"
                : "bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800"
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>İzin Talepleri</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-black/40 font-mono">
              {pendingLeavesCount}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("BILLINGS")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === "BILLINGS"
                ? "bg-amber-600 text-white shadow-sm"
                : "bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800"
            }`}
          >
            <Wallet className="w-3.5 h-3.5" />
            <span>Hakedişler</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-black/40 font-mono">
              {pendingBillingsCount}
            </span>
          </button>
        </div>

        <div className="relative min-w-[200px]">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Başlık, taşeron veya personel ara..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-950 border border-slate-800 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>

      {/* SECTION 1: Kademeli Onaylı İş Kanıtları (WorkProof) */}
      {(activeTab === "ALL" || activeTab === "PROOFS") && (
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden shadow-lg space-y-3 p-4 sm:p-5">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-cyan-400" />
              <div>
                <h3 className="text-sm font-bold text-white">Taşeron İş Kanıtları (Multi-Tier WorkProof)</h3>
                <p className="text-[11px] text-slate-400">
                  1. Kademe: Saha Mühendisi Teknik Onayı &bull; 2. Kademe: Şantiye Şefi Onayı (Onaylanınca Otomatik Hakedişe İşlenir)
                </p>
              </div>
            </div>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-cyan-950/80 border border-cyan-800 text-cyan-300">
              {pendingProofsCount} Bekleyen
            </span>
          </div>

          {workProofs.filter((w) => w.status === "PENDING").length === 0 ? (
            <div className="py-10 text-center text-slate-500 text-xs">
              Bekleyen taşeron iş kanıtı bulunmuyor.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {workProofs
                .filter((w) => w.status === "PENDING")
                .map((proof) => {
                  const engineerApproved = proof.engineerStatus === "APPROVED"
                  const managerApproved = proof.managerStatus === "APPROVED"

                  // Manager button rule:
                  // "engineerStatus onaylanmadan, Şantiye Şefinin onay butonu aktif olmasın (Disabled)"
                  const isManagerButtonDisabled = !engineerApproved

                  return (
                    <div
                      key={proof.id}
                      className="bg-slate-950/80 border border-slate-800 hover:border-slate-700/80 rounded-xl p-4 transition-all shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4"
                    >
                      {/* Left: Info & Photo thumbnail */}
                      <div className="flex items-start gap-4 flex-1">
                        {proof.imageUrl && (
                          <div
                            onClick={() => setPreviewImage(proof.imageUrl)}
                            className="relative w-20 h-20 rounded-lg overflow-hidden bg-slate-900 border border-slate-800 shrink-0 cursor-pointer group"
                            title="Fotoğrafı büyüt"
                          >
                            <img
                              src={proof.imageUrl}
                              alt={proof.title}
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-200"
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                              <Eye className="w-4 h-4" />
                            </div>
                          </div>
                        )}

                        <div className="space-y-1.5 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h4 className="text-sm font-bold text-white">{proof.title}</h4>
                            {proof.subcontractor && (
                              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-900 border border-slate-800 text-slate-300 flex items-center gap-1">
                                <Building2 className="w-3 h-3 text-amber-400" />
                                {proof.subcontractor.name}
                              </span>
                            )}
                          </div>

                          {proof.description && (
                            <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                              {proof.description}
                            </p>
                          )}

                          <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500 pt-1">
                            {proof.contract?.project && (
                              <span>
                                Proje:{" "}
                                <strong className="text-slate-300">
                                  {proof.contract.project.title || proof.contract.project.name}
                                </strong>
                              </span>
                            )}
                            <span>
                              Tarih:{" "}
                              <span className="text-slate-400 font-mono">
                                {new Date(proof.createdAt).toLocaleDateString("tr-TR")}
                              </span>
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Middle: 2-Tier Visual Status Chain */}
                      <div className="flex items-center gap-2 shrink-0 bg-slate-900/90 border border-slate-800 p-2.5 rounded-xl">
                        {/* Tier 1: Saha Mühendisi */}
                        <div className="flex flex-col items-center min-w-[120px] text-center">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                            1. Saha Mühendisi
                          </span>
                          <div className="mt-1">
                            {engineerApproved ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-950/80 border border-emerald-800 text-emerald-300">
                                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                                Onaylandı
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-950/80 border border-amber-800 text-amber-300">
                                <Clock className="w-3 h-3 text-amber-400" />
                                Bekliyor
                              </span>
                            )}
                          </div>
                          {proof.engineerName && (
                            <span className="text-[10px] text-slate-500 mt-0.5 truncate max-w-[110px]">
                              {proof.engineerName}
                            </span>
                          )}
                        </div>

                        <ChevronRight className="w-4 h-4 text-slate-600 shrink-0" />

                        {/* Tier 2: Şantiye Şefi */}
                        <div className="flex flex-col items-center min-w-[120px] text-center">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                            2. Şantiye Şefi
                          </span>
                          <div className="mt-1">
                            {managerApproved ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-950/80 border border-emerald-800 text-emerald-300">
                                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                                Onaylandı
                              </span>
                            ) : isManagerButtonDisabled ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-900 border border-slate-800 text-slate-500">
                                <Lock className="w-3 h-3 text-slate-600" />
                                Kilitli
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-950/80 border border-amber-800 text-amber-300">
                                <Clock className="w-3 h-3 text-amber-400" />
                                Onay Bekliyor
                              </span>
                            )}
                          </div>
                          {proof.managerName && (
                            <span className="text-[10px] text-slate-500 mt-0.5 truncate max-w-[110px]">
                              {proof.managerName}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Right: Actions */}
                      <div className="flex items-center gap-2 shrink-0">
                        {/* Mühendis Onay Butonu */}
                        {isEngineer && !engineerApproved && (
                          <button
                            disabled={processingId === proof.id}
                            onClick={() => handleApproveWorkProof(proof)}
                            className="px-3 py-2 text-xs font-semibold bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg shadow-sm transition-all flex items-center gap-1.5"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>1. Teknik Onayı Ver</span>
                          </button>
                        )}

                        {/* Şantiye Şefi Onay Butonu */}
                        {isManager && (
                          <button
                            disabled={isManagerButtonDisabled || processingId === proof.id}
                            onClick={() => handleApproveWorkProof(proof)}
                            title={
                              isManagerButtonDisabled
                                ? "Saha Mühendisi (STAFF) ilk onayı vermeden Şantiye Şefi onayı tamamlanamaz."
                                : "2. Onayı tamamla ve taşeronun hakedişine yansıt"
                            }
                            className={`px-3.5 py-2 text-xs font-semibold rounded-lg shadow-sm transition-all flex items-center gap-1.5 ${
                              isManagerButtonDisabled
                                ? "bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed opacity-60"
                                : "bg-emerald-600 hover:bg-emerald-500 text-white"
                            }`}
                          >
                            {isManagerButtonDisabled ? (
                              <>
                                <Lock className="w-3.5 h-3.5 text-slate-500" />
                                <span>2. Onay (Müh. Bekleniyor)</span>
                              </>
                            ) : (
                              <>
                                <Sparkles className="w-3.5 h-3.5 text-emerald-200" />
                                <span>2. Onayla (Hakedişe Yansıt)</span>
                              </>
                            )}
                          </button>
                        )}

                        {/* Reddet Butonu */}
                        <button
                          disabled={processingId === proof.id}
                          onClick={() =>
                            setRejectModal({
                              isOpen: true,
                              type: "PROOF",
                              id: proof.id,
                              title: proof.title,
                              reason: "",
                            })
                          }
                          className="px-3 py-2 text-xs font-medium text-slate-400 hover:text-red-400 bg-slate-900 hover:bg-red-950/40 border border-slate-800 hover:border-red-800/40 rounded-lg transition-all"
                        >
                          Reddet
                        </button>
                      </div>
                    </div>
                  )
                })}
            </div>
          )}
        </div>
      )}

      {/* SECTION 2: Masraflar & Fişler (ExpenseClaim) */}
      {(activeTab === "ALL" || activeTab === "EXPENSES") && (
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden shadow-lg space-y-3 p-4 sm:p-5">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
            <div className="flex items-center gap-2">
              <Receipt className="w-5 h-5 text-emerald-400" />
              <div>
                <h3 className="text-sm font-bold text-white">Saha Masrafları & Yakıt/Malzeme Fişleri</h3>
                <p className="text-[11px] text-slate-400">
                  Personel portalından yüklenen fiş ve fatura onayları
                </p>
              </div>
            </div>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-emerald-950/80 border border-emerald-800 text-emerald-300">
              {pendingExpensesCount} Bekleyen
            </span>
          </div>

          {expenseClaims.filter((e) => e.status === "PENDING").length === 0 ? (
            <div className="py-8 text-center text-slate-500 text-xs">
              Bekleyen masraf talebi bulunmuyor.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {expenseClaims
                .filter((e) => e.status === "PENDING")
                .map((claim) => (
                  <div
                    key={claim.id}
                    className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 space-y-3 flex flex-col justify-between"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-blue-950/80 border border-blue-800 text-blue-300">
                          {claim.expenseType === "FUEL"
                            ? "⛽ Yakıt"
                            : claim.expenseType === "MATERIAL"
                            ? "📦 Malzeme"
                            : claim.expenseType === "FOOD"
                            ? "🍲 Yemek"
                            : claim.expenseType}
                        </span>
                        <span className="text-base font-black text-emerald-400 font-mono">
                          ₺{claim.amount.toLocaleString("tr-TR")}
                        </span>
                      </div>

                      <div className="text-xs text-slate-300">
                        <p className="font-semibold">{claim.user?.name || "Personel"}</p>
                        <p className="text-slate-400 text-[11px] mt-0.5 line-clamp-2">
                          {claim.description || "Açıklama belirtilmedi."}
                        </p>
                      </div>

                      {claim.receiptUrl && (
                        <div
                          onClick={() => setPreviewImage(claim.receiptUrl)}
                          className="flex items-center gap-2 p-2 bg-slate-900 border border-slate-800 rounded-lg cursor-pointer hover:border-slate-700 transition-colors"
                        >
                          <img
                            src={claim.receiptUrl}
                            alt="Fiş"
                            className="w-10 h-10 object-cover rounded shrink-0 bg-slate-950"
                          />
                          <div className="text-[11px] text-blue-400 flex items-center gap-1">
                            <Eye className="w-3.5 h-3.5" />
                            <span>Fiş Fotoğrafını Görüntüle</span>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-900">
                      <button
                        onClick={() =>
                          setRejectModal({
                            isOpen: true,
                            type: "EXPENSE",
                            id: claim.id,
                            title: `${claim.user?.name} - ₺${claim.amount}`,
                            reason: "",
                          })
                        }
                        className="px-2.5 py-1 text-xs text-slate-400 hover:text-red-400"
                      >
                        Reddet
                      </button>
                      <button
                        onClick={() => handleApproveExpense(claim.id)}
                        disabled={processingId === claim.id}
                        className="px-3 py-1 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg shadow-sm"
                      >
                        Onayla & Öde
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      )}

      {/* SECTION 3: İzin Talepleri (LeaveRequest) */}
      {(activeTab === "ALL" || activeTab === "LEAVES") && (
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden shadow-lg space-y-3 p-4 sm:p-5">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-purple-400" />
              <div>
                <h3 className="text-sm font-bold text-white">Personel İzin Talepleri (4857 Sayılı Kanun Uyumlu)</h3>
                <p className="text-[11px] text-slate-400">
                  Resmi tatil ve hafta sonu düşülmüş net iş günü hesaplı izinler
                </p>
              </div>
            </div>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-purple-950/80 border border-purple-800 text-purple-300">
              {pendingLeavesCount} Bekleyen
            </span>
          </div>

          {leaveRequests.filter((l) => l.status === "PENDING").length === 0 ? (
            <div className="py-8 text-center text-slate-500 text-xs">
              Bekleyen personel izin talebi bulunmuyor.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950/70 border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="py-2.5 px-3">Personel</th>
                    <th className="py-2.5 px-3">İzin Türü</th>
                    <th className="py-2.5 px-3">Tarih Aralığı</th>
                    <th className="py-2.5 px-3 text-center">İş Günü</th>
                    <th className="py-2.5 px-3">Gerekçe</th>
                    <th className="py-2.5 px-3 text-right">İşlem</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {leaveRequests
                    .filter((l) => l.status === "PENDING")
                    .map((leave) => (
                      <tr key={leave.id} className="hover:bg-slate-800/30 transition-colors">
                        <td className="py-2.5 px-3">
                          <span className="font-bold text-white block">
                            {leave.personel?.name || leave.user?.name || "Personel"}
                          </span>
                          <span className="text-[10px] text-slate-500">
                            {leave.personel?.position || leave.personel?.department || "Saha Ekibi"}
                          </span>
                        </td>
                        <td className="py-2.5 px-3">
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-purple-950/80 border border-purple-800 text-purple-300">
                            {leave.leaveType || "YILLIK İZİN"}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 font-mono text-slate-300">
                          {new Date(leave.startDate).toLocaleDateString("tr-TR")} &rarr;{" "}
                          {new Date(leave.endDate).toLocaleDateString("tr-TR")}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <span className="font-bold text-emerald-400 font-mono text-sm">
                            {leave.totalDays || leave.days || 1} Gün
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-slate-400 max-w-xs truncate">
                          {leave.reason || "Mazeret / Yıllık hak ediş"}
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleApproveLeave(leave.id)}
                              disabled={processingId === leave.id}
                              className="px-2.5 py-1 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg"
                            >
                              Onayla
                            </button>
                            <button
                              onClick={() =>
                                setRejectModal({
                                  isOpen: true,
                                  type: "LEAVE",
                                  id: leave.id,
                                  title: `${leave.personel?.name || "Personel"} İzni`,
                                  reason: "",
                                })
                              }
                              className="px-2 py-1 text-xs text-slate-400 hover:text-red-400"
                            >
                              Reddet
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* SECTION 4: Hakedişler (ProgressBilling) */}
      {(activeTab === "ALL" || activeTab === "BILLINGS") && (
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden shadow-lg space-y-3 p-4 sm:p-5">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
            <div className="flex items-center gap-2">
              <Wallet className="w-5 h-5 text-amber-400" />
              <div>
                <h3 className="text-sm font-bold text-white">Taşeron Hakediş Talepleri (Progress Billing)</h3>
                <p className="text-[11px] text-slate-400">
                  Avans, ceza ve teminat kesintileri mahsup edilmiş net hakediş ödemeleri
                </p>
              </div>
            </div>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-amber-950/80 border border-amber-800 text-amber-300">
              {pendingBillingsCount} Bekleyen
            </span>
          </div>

          {progressBillings.filter((b) => b.status === "PENDING_APPROVAL" || b.status === "DRAFT").length === 0 ? (
            <div className="py-8 text-center text-slate-500 text-xs">
              Bekleyen hakediş onayı bulunmuyor.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {progressBillings
                .filter((b) => b.status === "PENDING_APPROVAL" || b.status === "DRAFT")
                .map((billing) => (
                  <div
                    key={billing.id}
                    className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex flex-col justify-between space-y-3"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-white">
                          #{billing.billingNumber}. Ara Hakediş
                        </span>
                        <span className="text-base font-black text-amber-300 font-mono">
                          ₺{billing.netPayable.toLocaleString("tr-TR")}
                        </span>
                      </div>

                      <div className="mt-2 space-y-1 text-xs text-slate-400">
                        <p>
                          Taşeron:{" "}
                          <strong className="text-slate-200">
                            {billing.contract?.subcontractor?.name || "Kayıtlı Taşeron"}
                          </strong>
                        </p>
                        <p>
                          Proje:{" "}
                          <strong className="text-slate-300">
                            {billing.contract?.project?.title || billing.contract?.project?.name || "Şantiye"}
                          </strong>
                        </p>
                        <p className="text-[11px] text-slate-500">
                          Brüt: ₺{billing.grossAmount.toLocaleString("tr-TR")} &bull; Kesintiler: ₺
                          {(
                            billing.advanceDeduction +
                            billing.penaltyDeduction +
                            billing.retentionDeduction
                          ).toLocaleString("tr-TR")}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-900">
                      <Link
                        href="/admin/billing"
                        className="px-2.5 py-1 text-xs text-slate-400 hover:text-slate-200"
                      >
                        Detayı Gör
                      </Link>
                      <button
                        onClick={() => handleApproveBilling(billing.id)}
                        disabled={processingId === billing.id}
                        className="px-3 py-1 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg shadow-sm"
                      >
                        Hakedişi Onayla
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      )}

      {/* Lightbox Modal for Photo Preview */}
      {previewImage && (
        <div
          onClick={() => setPreviewImage(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md cursor-pointer animate-in fade-in duration-150"
        >
          <div className="relative max-w-3xl max-h-[90vh] overflow-hidden rounded-2xl border border-slate-800">
            <img src={previewImage} alt="Delil Önizleme" className="w-full h-full object-contain" />
            <button
              onClick={() => setPreviewImage(null)}
              className="absolute top-3 right-3 text-white bg-black/60 p-2 rounded-full hover:bg-black/80"
            >
              <XCircle className="w-6 h-6" />
            </button>
          </div>
        </div>
      )}

      {/* Rejection Modal with Reason Input */}
      {rejectModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-400" />
                <span>Talebi Reddet</span>
              </h3>
              <button
                onClick={() => setRejectModal({ isOpen: false, type: null, id: null, title: "", reason: "" })}
                className="text-slate-500 hover:text-white"
              >
                <XCircle className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-400">
              <strong className="text-slate-200">"{rejectModal.title}"</strong> başlıklı talebi reddetmek üzeresiniz. Lütfen red gerekçesini belirtiniz:
            </p>

            <textarea
              rows={3}
              placeholder="Örn: Saha imalatı teknik şartnameye uygun değildir. Kolon paspayları düzeltilmelidir..."
              value={rejectModal.reason}
              onChange={(e) => setRejectModal({ ...rejectModal, reason: e.target.value })}
              className="w-full p-2.5 text-xs bg-slate-950 border border-slate-800 rounded-lg text-white placeholder-slate-600 focus:outline-none focus:border-red-500 leading-relaxed"
            />

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setRejectModal({ isOpen: false, type: null, id: null, title: "", reason: "" })}
                className="px-3 py-1.5 text-xs text-slate-400 hover:text-white bg-slate-800 rounded-lg"
              >
                Vazgeç
              </button>
              <button
                type="button"
                onClick={handleConfirmReject}
                className="px-4 py-1.5 text-xs font-semibold bg-red-600 hover:bg-red-500 text-white rounded-lg shadow-sm"
              >
                Reddi Onayla
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
