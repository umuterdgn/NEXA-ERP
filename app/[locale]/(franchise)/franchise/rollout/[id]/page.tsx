"use client"
/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Franchise Şube Detay & Kurulum Bütçesi / Gider Takibi (RolloutExpense)
 * Toplam Bütçe vs Harcanan Tutar, Canlı İlerleme Çubuğu (Progress Bar) ve Kalan Limit.
 */

import { useState, useEffect } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import {
  Store,
  MapPin,
  Coins,
  Receipt,
  Plus,
  Trash2,
  RefreshCw,
  ArrowLeft,
  ShieldCheck,
  Camera,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Layers,
  Building2,
  User,
  Users,
  UserCheck,
  UserPlus,
  Phone,
  Mail,
  Edit3,
  Check,
  Loader2,
  X,
  ExternalLink,
  ChevronRight,
  TrendingDown,
  TrendingUp,
  Sparkles,
} from "lucide-react"
import {
  getRolloutProjectById,
  getRolloutExpenses,
  createRolloutExpense,
  deleteRolloutExpense,
  updateRolloutProjectTeam,
  getFranchisePersonnelAndSubcontractors,
} from "@/app/actions/franchise"

interface ExpenseItem {
  id: string
  rolloutProjectId: string
  title: string
  amount: number
  category: "INSAAT" | "MOBILYA" | "IT_DONANIM" | "RESMI_HARC" | string
  receiptUrl?: string | null
  createdAt: string | Date
}

interface ExpenseSummary {
  totalBudget: number
  totalSpent: number
  remaining: number
  burnPercentage: number
}

const CATEGORY_MAP: Record<string, { label: string; badge: string; color: string }> = {
  INSAAT: { label: "Kaba & İnce İnşaat", badge: "bg-blue-950/60 text-blue-300 border-blue-800", color: "text-blue-400" },
  MOBILYA: { label: "OFCI & Mağaza Mobilya", badge: "bg-purple-950/60 text-purple-300 border-purple-800", color: "text-purple-400" },
  IT_DONANIM: { label: "IT & Kasa Donanımı", badge: "bg-indigo-950/60 text-indigo-300 border-indigo-800", color: "text-indigo-400" },
  RESMI_HARC: { label: "İdari Harç & Ruhsat", badge: "bg-amber-950/60 text-amber-300 border-amber-800", color: "text-amber-400" },
}

export default function RolloutProjectDetailPage() {
  const params = useParams()
  const projectId = (params?.id || "") as string

  // Tabs: EXPENSES | TEAM
  const [activeTab, setActiveTab] = useState<"EXPENSES" | "TEAM">("EXPENSES")

  const [project, setProject] = useState<any | null>(null)
  const [expenses, setExpenses] = useState<ExpenseItem[]>([])
  const [summary, setSummary] = useState<ExpenseSummary>({
    totalBudget: 0,
    totalSpent: 0,
    remaining: 0,
    burnPercentage: 0,
  })
  const [loading, setLoading] = useState(true)

  // Ekip / Yetkili Listeleri ve Modal State
  const [managersList, setManagersList] = useState<{
    regionalManagers: any[]
    branchManagers: any[]
  }>({
    regionalManagers: [],
    branchManagers: [],
  })
  const [isTeamModalOpen, setIsTeamModalOpen] = useState(false)
  const [isSavingTeam, setIsSavingTeam] = useState(false)
  const [teamFormError, setTeamFormError] = useState<string | null>(null)
  const [teamFormData, setTeamFormData] = useState({
    regionalManagerId: "",
    branchManagerId: "",
  })

  // Expense Modal State
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [formError, setFormError] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    title: "",
    amount: "",
    category: "INSAAT",
    receiptUrl: "",
  })

  const fetchData = async () => {
    if (!projectId) return
    try {
      setLoading(true)
      const projRes = await getRolloutProjectById(projectId)
      if (projRes.success && projRes.project) {
        setProject(projRes.project)
        setTeamFormData({
          regionalManagerId: projRes.project.regionalManagerId || projRes.project.regionalManager?.id || "",
          branchManagerId: projRes.project.branchManagerId || projRes.project.branchManager?.id || "",
        })
      }

      const expRes = await getRolloutExpenses(projectId)
      if (expRes.success) {
        setExpenses(expRes.expenses || [])
        if (expRes.summary) {
          setSummary(expRes.summary)
        }
      }

      // Bölge ve Şube Müdürleri listesini yükle
      const staffRes = await getFranchisePersonnelAndSubcontractors()
      if (staffRes.success) {
        setManagersList({
          regionalManagers: staffRes.regionalManagers || [],
          branchManagers: staffRes.branchManagers || [],
        })
      }
    } catch (err) {
      console.error("Proje verisi yüklenemedi", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [projectId])

  // Proje Ekibi Güncelleme (Bölge ve Şube Müdürü Atama)
  const handleSaveTeam = async (e: React.FormEvent) => {
    e.preventDefault()
    setTeamFormError(null)

    try {
      setIsSavingTeam(true)
      const res = await updateRolloutProjectTeam({
        projectId,
        regionalManagerId: teamFormData.regionalManagerId || null,
        branchManagerId: teamFormData.branchManagerId || null,
      })

      if (!res.success) {
        setTeamFormError(res.error || "Ekip yetkilileri güncellenemedi.")
        return
      }

      setIsTeamModalOpen(false)
      await fetchData()
    } catch (err: any) {
      setTeamFormError(err.message || "Hata oluştu.")
    } finally {
      setIsSavingTeam(false)
    }
  }

  const handleCreateExpense = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)

    if (!formData.title.trim()) {
      setFormError("Lütfen harcama başlığını giriniz.")
      return
    }
    const amountVal = parseFloat(formData.amount)
    if (isNaN(amountVal) || amountVal <= 0) {
      setFormError("Geçerli bir harcama tutarı giriniz.")
      return
    }

    try {
      setIsSubmitting(true)
      const res = await createRolloutExpense({
        rolloutProjectId: projectId,
        title: formData.title.trim(),
        amount: amountVal,
        category: formData.category,
        receiptUrl: formData.receiptUrl.trim() || null,
      })

      if (!res.success) {
        setFormError(res.error || "Gider kaydedilemedi.")
        return
      }

      setIsModalOpen(false)
      setFormData({ title: "", amount: "", category: "INSAAT", receiptUrl: "" })
      await fetchData()
    } catch (err: any) {
      setFormError(err.message || "Hata oluştu.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteExpense = async (id: string) => {
    try {
      setDeletingId(id)
      await deleteRolloutExpense(id)
      await fetchData()
    } finally {
      setDeletingId(null)
    }
  }

  // Progress Bar Renk Belirleme (Harcanan oranına göre)
  const isBudgetExceeded = summary.remaining < 0
  const progressColor = isBudgetExceeded
    ? "bg-rose-500 shadow-rose-500/50"
    : summary.burnPercentage >= 85
    ? "bg-amber-500 shadow-amber-500/50"
    : "bg-emerald-500 shadow-emerald-500/50"

  return (
    <div className="w-full space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 mb-1">
            <Link href="/franchise/rollout" className="hover:text-amber-400 transition-colors flex items-center gap-1">
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Rollout Listesi</span>
            </Link>
            <span>•</span>
            <span className="text-amber-400">{project?.city || "Türkiye"}</span>
            <span>•</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] bg-slate-900 border border-slate-800 text-slate-300">
              {project?.locationType === "MALL"
                ? "AVM İçi Mağaza"
                : project?.locationType === "KIOSK"
                ? "Kiosk / Stand"
                : "Cadde Mağazası"}
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            {project?.name || "Şube Projesi"}
          </h1>
          <p className="text-sm text-slate-400">
            Şube kurulum bütçesi, faturalı harcama girişleri ve gerçek zamanlı kalan bütçe takibi.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          <Link
            href={`/franchise/rollout/${projectId}/work-proofs`}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 hover:border-purple-600/50 text-slate-200 text-xs font-semibold transition-all"
          >
            <Camera className="w-4 h-4 text-purple-400" />
            <span>İş Kanıtları ({project?.workProofs?.length || 0})</span>
          </Link>

          <Link
            href="/franchise/stage-gates"
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 hover:border-amber-600/50 text-slate-200 text-xs font-semibold transition-all"
          >
            <ShieldCheck className="w-4 h-4 text-amber-400" />
            <span>Stage-Gate Kilitleri</span>
          </Link>

          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-all shadow-md shadow-emerald-600/20"
          >
            <Plus className="w-4 h-4" />
            <span>Yeni Fatura / Gider Ekle</span>
          </button>
        </div>
      </div>

      {/* SEKMELER (Tabs): Bütçe & Harcama Takibi vs Proje Ekibi & Yetkililer */}
      <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
        <button
          onClick={() => setActiveTab("EXPENSES")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === "EXPENSES"
              ? "bg-slate-800 text-white border border-slate-700 shadow-md"
              : "text-slate-400 hover:text-white hover:bg-slate-900/60"
          }`}
        >
          <Coins className="w-4 h-4 text-amber-400" />
          <span>Kurulum Bütçesi & Harcama Takibi</span>
          <span className="px-2 py-0.5 rounded-full text-[10px] bg-slate-900 border border-slate-800 text-slate-300 font-mono">
            {expenses.length} Fatura
          </span>
        </button>

        <button
          onClick={() => setActiveTab("TEAM")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === "TEAM"
              ? "bg-purple-950/70 text-purple-200 border border-purple-800 shadow-md shadow-purple-950/40"
              : "text-slate-400 hover:text-white hover:bg-slate-900/60"
          }`}
        >
          <ShieldCheck className="w-4 h-4 text-purple-400" />
          <span>Proje Ekibi & Yetkililer</span>
          <span
            className={`px-2 py-0.5 rounded-full text-[10px] border font-bold ${
              project?.regionalManager || project?.regionalManagerId
                ? "bg-emerald-950/60 text-emerald-300 border-emerald-800"
                : "bg-amber-950/60 text-amber-300 border-amber-800"
            }`}
          >
            {(project?.regionalManager || project?.regionalManagerId ? 1 : 0) +
              (project?.branchManager || project?.branchManagerId ? 1 : 0)}{" "}
            / 2 Atandı
          </span>
        </button>
      </div>

      {/* ==================================================================== */}
      {/* SEKME 1: BÜTÇE & HARCAMALAR                                         */}
      {/* ==================================================================== */}
      {activeTab === "EXPENSES" && (
        <div className="space-y-6 animate-in fade-in duration-150">
          {/* CANLI BÜTÇE İLERLEME ÇUBUĞU (Progress Bar) */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                  <Coins className="w-4 h-4 text-amber-400" />
                  <span>Şube Kurulum Bütçesi & Harcama Durumu</span>
                </span>
                <div className="text-lg font-bold text-white mt-1">
                  Bütçe Tüketimi:{" "}
                  <span className={isBudgetExceeded ? "text-rose-400" : "text-emerald-400"}>
                    %{summary.burnPercentage}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-4 text-xs font-mono">
                <div className="text-right">
                  <span className="text-slate-400 block text-[10px]">Toplam Bütçe</span>
                  <strong className="text-white text-sm">{summary.totalBudget.toLocaleString("tr-TR")} ₺</strong>
                </div>
                <div className="text-right">
                  <span className="text-slate-400 block text-[10px]">Harcanan</span>
                  <strong className="text-amber-400 text-sm">{summary.totalSpent.toLocaleString("tr-TR")} ₺</strong>
                </div>
                <div className="text-right">
                  <span className="text-slate-400 block text-[10px]">Kalan Limit</span>
                  <strong
                    className={`text-sm ${
                      isBudgetExceeded ? "text-rose-400 font-extrabold" : "text-emerald-400"
                    }`}
                  >
                    {summary.remaining.toLocaleString("tr-TR")} ₺
                  </strong>
                </div>
              </div>
            </div>

            {/* Canlı İlerleme Çubuğu */}
            <div className="w-full h-3 bg-slate-950 rounded-full overflow-hidden p-0.5 border border-slate-800">
              <div
                className={`h-full rounded-full transition-all duration-500 shadow-md ${progressColor}`}
                style={{ width: `${Math.min(100, summary.burnPercentage)}%` }}
              ></div>
            </div>

            {isBudgetExceeded && (
              <div className="p-3 bg-rose-950/60 border border-rose-800 text-rose-300 text-xs rounded-xl flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>
                  Dikkat: Bu şube için belirlenen kurulum bütçesi{" "}
                  {Math.abs(summary.remaining).toLocaleString("tr-TR")} ₺ aşılmıştır!
                </span>
              </div>
            )}
          </div>

          {/* KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
              <div className="text-xs text-slate-400 flex items-center justify-between">
                <span>Toplam Kurulum Bütçesi</span>
                <Building2 className="w-4 h-4 text-slate-500" />
              </div>
              <div className="text-2xl font-bold text-white mt-2 font-mono">
                {summary.totalBudget.toLocaleString("tr-TR")} ₺
              </div>
              <div className="text-[11px] text-slate-500 mt-1">Tahsis Edilen Sermaye</div>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
              <div className="text-xs text-amber-400 flex items-center justify-between">
                <span>Toplam Harcanan Tutar</span>
                <Receipt className="w-4 h-4 text-amber-400" />
              </div>
              <div className="text-2xl font-bold text-amber-400 mt-2 font-mono">
                {summary.totalSpent.toLocaleString("tr-TR")} ₺
              </div>
              <div className="text-[11px] text-slate-500 mt-1">{expenses.length} Adet Fatura</div>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
              <div className="text-xs text-emerald-400 flex items-center justify-between">
                <span>Kalan Bütçe Limiti</span>
                <Coins className="w-4 h-4 text-emerald-400" />
              </div>
              <div
                className={`text-2xl font-bold mt-2 font-mono ${
                  isBudgetExceeded ? "text-rose-400" : "text-emerald-400"
                }`}
              >
                {summary.remaining.toLocaleString("tr-TR")} ₺
              </div>
              <div className="text-[11px] text-slate-500 mt-1">Kullanılabilir Bakiye</div>
            </div>

            <button
              onClick={() => setActiveTab("TEAM")}
              className="bg-slate-900/80 border border-slate-800 hover:border-purple-600/60 rounded-xl p-4 text-left transition-all group"
            >
              <div className="text-xs text-purple-400 flex items-center justify-between">
                <span>Şube Sorumluları</span>
                <Users className="w-4 h-4 text-purple-400 group-hover:scale-110 transition-transform" />
              </div>
              <div className="text-sm font-bold text-white mt-2 truncate flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-purple-400"></span>
                <span>{project?.regionalManager?.name || project?.regionalManagerId || "Bölge Müdürü Bekleniyor"}</span>
              </div>
              <div className="text-[11px] text-slate-400 mt-1 truncate flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-blue-400"></span>
                <span>{project?.branchManager?.name || project?.branchManagerId || "Şube Müdürü Bekleniyor"}</span>
              </div>
            </button>
          </div>

          {/* Expenses Table Header */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Receipt className="w-4 h-4 text-emerald-400" />
                  <span>Giderler & Harcama Faturaları ({expenses.length})</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Tüm harcama kalemleri doğrudan kurulum bütçesinden düşülmektedir.
                </p>
              </div>

              <button
                onClick={() => setIsModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Fatura Ekle</span>
              </button>
            </div>

            {/* Expenses List */}
            {expenses.length === 0 ? (
              <div className="p-10 text-center text-slate-500 text-xs">
                Bu şube için henüz girilmiş bir harcama faturası bulunmuyor.
              </div>
            ) : (
              <div className="divide-y divide-slate-800/80">
                {expenses.map((expense) => {
                  const cat = CATEGORY_MAP[expense.category] || {
                    label: expense.category,
                    badge: "bg-slate-800 text-slate-300",
                    color: "text-slate-300",
                  }
                  const dateStr = new Date(expense.createdAt).toLocaleDateString("tr-TR", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })

                  return (
                    <div
                      key={expense.id}
                      className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 hover:bg-slate-950/40 transition-colors"
                    >
                      <div className="flex items-start gap-3">
                        <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-400">
                          <Receipt className="w-4 h-4 text-emerald-400" />
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-white">{expense.title}</h4>
                          <div className="flex items-center gap-2 mt-1">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${cat.badge}`}>
                              {cat.label}
                            </span>
                            <span className="text-[11px] text-slate-500 font-mono">{dateStr}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 self-end sm:self-center">
                        <div className="text-right">
                          <span className="text-base font-bold text-white font-mono">
                            {expense.amount.toLocaleString("tr-TR")} ₺
                          </span>
                        </div>

                        {expense.receiptUrl && (
                          <a
                            href={expense.receiptUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="p-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-400 hover:text-white"
                            title="Fatura Görseli"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        )}

                        <button
                          onClick={() => handleDeleteExpense(expense.id)}
                          disabled={deletingId === expense.id}
                          className="p-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-500 hover:text-rose-400 hover:border-rose-900 transition-colors"
                          title="Sil"
                        >
                          {deletingId === expense.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Trash2 className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* SEKME 2: PROJE EKİBİ & YETKİLİLER (ADIM 2)                            */}
      {/* ==================================================================== */}
      {activeTab === "TEAM" && (
        <div className="space-y-6 animate-in fade-in duration-150">
          {/* Ekip Bilgilendirme Banner */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-purple-950/70 border border-purple-800 text-purple-300">
                  <Users className="w-5 h-5" />
                </span>
                <h3 className="text-lg font-bold text-white">Mağaza Proje Yönetim Ekibi</h3>
              </div>
              <p className="text-xs text-slate-400 max-w-2xl">
                Bu şantiye projesinin saha denetimini üstlenen Bölge Müdürü ve mağaza operasyonundan sorumlu
                Şube Müdürü. Atanan yöneticiler sadece kendi yetki alanındaki proje ve iş kanıtlarını yönetebilir.
              </p>
            </div>

            <button
              onClick={() => setIsTeamModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow-lg shadow-purple-600/20 transition-all shrink-0"
            >
              <UserPlus className="w-4 h-4" />
              <span>Ekip Yetkililerini Ata / Değiştir</span>
            </button>
          </div>

          {/* Profil Kartları Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 1. BÖLGE MÜDÜRÜ PROFİL KARTI */}
            {(() => {
              const rm = project?.regionalManager
              const isAssigned = Boolean(rm?.name || project?.regionalManagerId)
              const name = rm?.name || project?.regionalManagerId || "Henüz Atanmadı"
              const email = rm?.email || (isAssigned ? "bolge.muduru@nexa-franchise.com" : "-")
              const phone = rm?.phone || (isAssigned ? "+90 532 555 01 22" : "-")

              return (
                <div
                  className={`rounded-2xl border transition-all p-6 space-y-5 flex flex-col justify-between ${
                    isAssigned
                      ? "bg-slate-900/90 border-slate-800 shadow-xl"
                      : "bg-slate-900/40 border-dashed border-purple-900/60 shadow-md"
                  }`}
                >
                  <div className="space-y-4">
                    {/* Role Header Badge */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-purple-950/80 border border-purple-800 text-purple-300 flex items-center gap-1.5">
                          <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />
                          <span>BÖLGE MÜDÜRÜ</span>
                        </span>
                        <span className="text-[11px] text-slate-500">Rollout Saha Denetimi</span>
                      </div>

                      {isAssigned ? (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950/70 border border-emerald-800 text-emerald-300 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                          <span>Atandı</span>
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-950/70 border border-amber-800 text-amber-300">
                          Atama Bekliyor
                        </span>
                      )}
                    </div>

                    {/* Profile Header & Avatar */}
                    <div className="flex items-start gap-4">
                      <div
                        className={`w-14 h-14 rounded-2xl flex items-center justify-center font-bold text-lg border shrink-0 ${
                          isAssigned
                            ? "bg-purple-950/60 border-purple-800 text-purple-300 shadow-inner"
                            : "bg-slate-950 border-slate-800 text-slate-600"
                        }`}
                      >
                        {isAssigned ? (
                          name
                            .split(" ")
                            .map((n: string) => n[0])
                            .slice(0, 2)
                            .join("")
                            .toUpperCase()
                        ) : (
                          <User className="w-6 h-6 text-slate-600" />
                        )}
                      </div>

                      <div className="space-y-1">
                        <h4 className="text-base font-bold text-white flex items-center gap-2">
                          <span>{name}</span>
                          {isAssigned && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                        </h4>
                        <p className="text-xs text-slate-400">
                          {isAssigned
                            ? "Saha İnceleme, Hakediş & Taşeron İş Kanıtı Onay Yetkilisi"
                            : "Bu şube için henüz bir Bölge Müdürü atanmamıştır."}
                        </p>
                      </div>
                    </div>

                    {/* Profile Info Details */}
                    {isAssigned ? (
                      <div className="p-3.5 bg-slate-950/80 rounded-xl border border-slate-800 space-y-2.5 text-xs">
                        <div className="flex items-center justify-between text-slate-400">
                          <span className="flex items-center gap-1.5">
                            <Phone className="w-3.5 h-3.5 text-purple-400" />
                            <span>Telefon:</span>
                          </span>
                          <a
                            href={`tel:${phone}`}
                            className="font-mono text-white hover:text-purple-300 transition-colors"
                          >
                            {phone}
                          </a>
                        </div>

                        <div className="flex items-center justify-between text-slate-400">
                          <span className="flex items-center gap-1.5">
                            <Mail className="w-3.5 h-3.5 text-purple-400" />
                            <span>E-Posta:</span>
                          </span>
                          <a
                            href={`mailto:${email}`}
                            className="font-mono text-white hover:text-purple-300 transition-colors"
                          >
                            {email}
                          </a>
                        </div>

                        <div className="flex items-center justify-between text-slate-400 pt-1 border-t border-slate-900">
                          <span>Yetki Rolü:</span>
                          <span className="font-mono text-purple-300 text-[11px]">
                            {rm?.role || "REGIONAL_MANAGER"}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="p-3.5 bg-amber-950/30 rounded-xl border border-amber-900/40 text-xs text-amber-300/90 space-y-1">
                        <div className="font-semibold flex items-center gap-1.5">
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                          <span>Onay Süreçleri İçin Atama Gerekli</span>
                        </div>
                        <p className="text-[11px] text-amber-400/80">
                          Taşeronların sunduğu iş kanıtlarının (Work Proof) hakedişe aktarılabilmesi için önce Bölge Müdürü onayı şarttır.
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Profile Action Button */}
                  <div className="pt-2">
                    {isAssigned ? (
                      <button
                        onClick={() => setIsTeamModalOpen(true)}
                        className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold flex items-center justify-center gap-2 transition-colors border border-slate-700"
                      >
                        <Edit3 className="w-3.5 h-3.5 text-purple-400" />
                        <span>Yetkiliyi Değiştir</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => setIsTeamModalOpen(true)}
                        className="w-full py-2.5 px-4 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold flex items-center justify-center gap-2 transition-all shadow-md shadow-purple-600/20"
                      >
                        <UserPlus className="w-4 h-4" />
                        <span>Bölge Müdürü Ata</span>
                      </button>
                    )}
                  </div>
                </div>
              )
            })()}

            {/* 2. ŞUBE MÜDÜRÜ PROFİL KARTI */}
            {(() => {
              const bm = project?.branchManager
              const isAssigned = Boolean(bm?.name || project?.branchManagerId)
              const name = bm?.name || project?.branchManagerId || "Henüz Atanmadı"
              const email = bm?.email || (isAssigned ? "sube.muduru@nexa-franchise.com" : "-")
              const phone = bm?.phone || (isAssigned ? "+90 533 444 02 33" : "-")

              return (
                <div
                  className={`rounded-2xl border transition-all p-6 space-y-5 flex flex-col justify-between ${
                    isAssigned
                      ? "bg-slate-900/90 border-slate-800 shadow-xl"
                      : "bg-slate-900/40 border-dashed border-blue-900/60 shadow-md"
                  }`}
                >
                  <div className="space-y-4">
                    {/* Role Header Badge */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-950/80 border border-blue-800 text-blue-300 flex items-center gap-1.5">
                          <Store className="w-3.5 h-3.5 text-blue-400" />
                          <span>ŞUBE MÜDÜRÜ</span>
                        </span>
                        <span className="text-[11px] text-slate-500">Mağaza Operasyonu</span>
                      </div>

                      {isAssigned ? (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950/70 border border-emerald-800 text-emerald-300 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                          <span>Atandı</span>
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-950/70 border border-amber-800 text-amber-300">
                          Atama Bekliyor
                        </span>
                      )}
                    </div>

                    {/* Profile Header & Avatar */}
                    <div className="flex items-start gap-4">
                      <div
                        className={`w-14 h-14 rounded-2xl flex items-center justify-center font-bold text-lg border shrink-0 ${
                          isAssigned
                            ? "bg-blue-950/60 border-blue-800 text-blue-300 shadow-inner"
                            : "bg-slate-950 border-slate-800 text-slate-600"
                        }`}
                      >
                        {isAssigned ? (
                          name
                            .split(" ")
                            .map((n: string) => n[0])
                            .slice(0, 2)
                            .join("")
                            .toUpperCase()
                        ) : (
                          <User className="w-6 h-6 text-slate-600" />
                        )}
                      </div>

                      <div className="space-y-1">
                        <h4 className="text-base font-bold text-white flex items-center gap-2">
                          <span>{name}</span>
                          {isAssigned && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                        </h4>
                        <p className="text-xs text-slate-400">
                          {isAssigned
                            ? "Mağaza Açılış Operasyonu, Personel Oryantasyonu & Anahtar Teslimi"
                            : "Bu mağaza için henüz bir Şube Müdürü tanımlanmamıştır."}
                        </p>
                      </div>
                    </div>

                    {/* Profile Info Details */}
                    {isAssigned ? (
                      <div className="p-3.5 bg-slate-950/80 rounded-xl border border-slate-800 space-y-2.5 text-xs">
                        <div className="flex items-center justify-between text-slate-400">
                          <span className="flex items-center gap-1.5">
                            <Phone className="w-3.5 h-3.5 text-blue-400" />
                            <span>Telefon:</span>
                          </span>
                          <a
                            href={`tel:${phone}`}
                            className="font-mono text-white hover:text-blue-300 transition-colors"
                          >
                            {phone}
                          </a>
                        </div>

                        <div className="flex items-center justify-between text-slate-400">
                          <span className="flex items-center gap-1.5">
                            <Mail className="w-3.5 h-3.5 text-blue-400" />
                            <span>E-Posta:</span>
                          </span>
                          <a
                            href={`mailto:${email}`}
                            className="font-mono text-white hover:text-blue-300 transition-colors"
                          >
                            {email}
                          </a>
                        </div>

                        <div className="flex items-center justify-between text-slate-400 pt-1 border-t border-slate-900">
                          <span>Yetki Rolü:</span>
                          <span className="font-mono text-blue-300 text-[11px]">
                            {bm?.role || "BRANCH_MANAGER"}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="p-3.5 bg-blue-950/30 rounded-xl border border-blue-900/40 text-xs text-blue-300/90 space-y-1">
                        <div className="font-semibold flex items-center gap-1.5">
                          <Store className="w-3.5 h-3.5 text-blue-400" />
                          <span>Açılış Hazırlıkları İçin Atama Gerekli</span>
                        </div>
                        <p className="text-[11px] text-blue-400/80">
                          Şube anahtar teslimi, punch-list eksikliklerinin yerinde tespiti ve personel oryantasyonu için bir şube müdürü atayınız.
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Profile Action Button */}
                  <div className="pt-2">
                    {isAssigned ? (
                      <button
                        onClick={() => setIsTeamModalOpen(true)}
                        className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold flex items-center justify-center gap-2 transition-colors border border-slate-700"
                      >
                        <Edit3 className="w-3.5 h-3.5 text-blue-400" />
                        <span>Yetkiliyi Değiştir</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => setIsTeamModalOpen(true)}
                        className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center justify-center gap-2 transition-all shadow-md shadow-blue-600/20"
                      >
                        <UserPlus className="w-4 h-4" />
                        <span>Şube Müdürü Ata</span>
                      </button>
                    )}
                  </div>
                </div>
              )
            })()}
          </div>

          {/* Yetki Matrisi ve Görev Paylaşımı Bilgi Kutusu */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 space-y-3">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Operasyonel Yetki Matrisi & Rollout İş Akışı</span>
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-slate-400">
              <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80">
                <span className="font-bold text-purple-300 block mb-1">1. Bölge Müdürü Sahada</span>
                Taşeronların yüklediği imalat fotoğraflarını inceler, şartnameye uygunsa 1. Kademe Saha Onayını verir.
              </div>
              <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80">
                <span className="font-bold text-blue-300 block mb-1">2. Şube Müdürü Hazırlıkta</span>
                İnşaat bitiminde punch-list eksiklerini kontrol eder, personel işe alımlarını ve anahtar teslimini yönetir.
              </div>
              <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80">
                <span className="font-bold text-emerald-300 block mb-1">3. Genel Merkez (HQ) Hakediş</span>
                Bölge onayını alan iş kanıtlarına son onay verilir ve muhasebe hakediş tahakkuku tamamlanır.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Yeni Fatura / Gider Ekle */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Receipt className="w-5 h-5 text-emerald-500" />
                <h3 className="text-base font-bold text-white">Yeni Gider / Fatura Ekle</h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {formError && (
              <div className="p-3 rounded-lg bg-red-950/50 border border-red-800 text-xs text-red-300">
                {formError}
              </div>
            )}

            <form onSubmit={handleCreateExpense} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Harcama Başlığı / Fatura Kalemi <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Örn: 3 Fazlı Pano & Aydınlatma Rayları"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Fatura Tutarı (₺) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  placeholder="Örn: 85000"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Harcama Kategorisi
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="INSAAT">Kaba & İnce İnşaat (İmalat)</option>
                  <option value="MOBILYA">OFCI & Mağaza Mobilya</option>
                  <option value="IT_DONANIM">IT & Kasa / Donanım</option>
                  <option value="RESMI_HARC">İdari Harç & Ruhsat</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Fatura / Makbuz Belge Linki (Opsiyonel)
                </label>
                <input
                  type="url"
                  placeholder="https://..."
                  value={formData.receiptUrl}
                  onChange={(e) => setFormData({ ...formData, receiptUrl: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
                >
                  Vazgeç
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md shadow-emerald-600/20 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Kaydediliyor...</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-3.5 h-3.5" />
                      <span>Gideri Bütçeden Düş</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Proje Ekibi & Yetkili Atama (Bölge & Şube Müdürü) */}
      {isTeamModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-purple-400" />
                <h3 className="text-base font-bold text-white">Proje Ekibi Yetkililerini Ata</h3>
              </div>
              <button
                onClick={() => setIsTeamModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {teamFormError && (
              <div className="p-3 rounded-lg bg-red-950/50 border border-red-800 text-xs text-red-300">
                {teamFormError}
              </div>
            )}

            <form onSubmit={handleSaveTeam} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Bölge Müdürü Ata
                </label>
                <select
                  value={teamFormData.regionalManagerId}
                  onChange={(e) =>
                    setTeamFormData({ ...teamFormData, regionalManagerId: e.target.value })
                  }
                  className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-white focus:outline-none focus:border-purple-500"
                >
                  <option value="">-- Henüz Atanmadı / Seçilmedi --</option>
                  {managersList.regionalManagers.map((rm) => (
                    <option key={rm.id} value={rm.id}>
                      {rm.name} ({rm.email || rm.role})
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-slate-500 mt-1">
                  Sistemdeki rolü REGIONAL_MANAGER olan kullanıcılar listelenir.
                </p>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Şube Müdürü Ata
                </label>
                <select
                  value={teamFormData.branchManagerId}
                  onChange={(e) =>
                    setTeamFormData({ ...teamFormData, branchManagerId: e.target.value })
                  }
                  className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="">-- Henüz Atanmadı / Seçilmedi --</option>
                  {managersList.branchManagers.map((bm) => (
                    <option key={bm.id} value={bm.id}>
                      {bm.name} ({bm.email || bm.role})
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-slate-500 mt-1">
                  Sistemdeki rolü BRANCH_MANAGER olan kullanıcılar listelenir.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-purple-950/30 border border-purple-900/40 text-[11px] text-purple-300/90 space-y-1">
                <strong>Yetki Koruması:</strong> Atanan Bölge Müdürü sisteme giriş yaptığında yalnızca kendi bölgesine atanmış bu mağaza projelerini ve taşeron iş kanıtlarını görüntüleyebilir.
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsTeamModalOpen(false)}
                  className="px-4 py-2 text-xs text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
                >
                  Vazgeç
                </button>
                <button
                  type="submit"
                  disabled={isSavingTeam}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow-md shadow-purple-600/20 disabled:opacity-50"
                >
                  {isSavingTeam ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Kaydediliyor...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Atamaları Kaydet</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
