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
  Loader2,
  X,
  ExternalLink,
  ChevronRight,
  TrendingDown,
  TrendingUp,
} from "lucide-react"
import {
  getRolloutProjectById,
  getRolloutExpenses,
  createRolloutExpense,
  deleteRolloutExpense,
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

  const [project, setProject] = useState<any | null>(null)
  const [expenses, setExpenses] = useState<ExpenseItem[]>([])
  const [summary, setSummary] = useState<ExpenseSummary>({
    totalBudget: 0,
    totalSpent: 0,
    remaining: 0,
    burnPercentage: 0,
  })
  const [loading, setLoading] = useState(true)

  // Modal State
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
      }

      const expRes = await getRolloutExpenses(projectId)
      if (expRes.success) {
        setExpenses(expRes.expenses || [])
        if (expRes.summary) {
          setSummary(expRes.summary)
        }
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

      {/* CANLI BÜTÇE İLERLEME ÇUBUĞU (Progress Bar) */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
              <Coins className="w-4 h-4 text-amber-400" />
              <span>Şube Kurulum Bütçesi & Harcama Durumu</span>
            </span>
            <div className="text-lg font-bold text-white mt-1">
              Bütçe Tüketimi: <span className={isBudgetExceeded ? "text-rose-400" : "text-emerald-400"}>%{summary.burnPercentage}</span>
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
              <strong className={`text-sm ${isBudgetExceeded ? "text-rose-400 font-extrabold" : "text-emerald-400"}`}>
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
            <span>Dikkat: Bu şube için belirlenen kurulum bütçesi {Math.abs(summary.remaining).toLocaleString("tr-TR")} ₺ aşılmıştır!</span>
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
          <div className={`text-2xl font-bold mt-2 font-mono ${isBudgetExceeded ? "text-rose-400" : "text-emerald-400"}`}>
            {summary.remaining.toLocaleString("tr-TR")} ₺
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Kullanılabilir Bakiye</div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
          <div className="text-xs text-purple-400 flex items-center justify-between">
            <span>Şube Sorumluları</span>
            <User className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-sm font-bold text-white mt-2 truncate">
            {project?.regionalManagerId || "Bölge Müdürü Atandı"}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5 truncate">
            {project?.branchManagerId || "Şube Müdürü Atandı"}
          </div>
        </div>
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
    </div>
  )
}
