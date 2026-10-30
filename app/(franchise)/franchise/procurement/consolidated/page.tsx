"use client"
/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Franchise Konsolide Satınalma ve Toplu İhale Paneli
 * %100 Tenant İzolasyonu ile ConsolidatedTender Modeline Bağlıdır.
 */

import { useState, useEffect } from "react"
import Link from "next/link"
import {
  ShoppingCart,
  Layers,
  Building2,
  Package,
  Plus,
  RefreshCw,
  CheckCircle2,
  Clock,
  TrendingDown,
  ArrowRight,
  Filter,
  Check,
  Search,
  Sparkles,
  Send,
  ExternalLink,
  X,
  Loader2,
  FileText,
  BadgeCheck,
} from "lucide-react"
import {
  getConsolidatedTenders,
  createConsolidatedTender,
  updateConsolidatedTenderStatus,
} from "@/app/actions/franchise"

interface ConsolidatedTenderItem {
  id: string
  title: string
  status: string
  createdAt: string | Date
}

export default function ConsolidatedProcurementPage() {
  const [tenders, setTenders] = useState<ConsolidatedTenderItem[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("ALL")
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [newPackageTitle, setNewPackageTitle] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null)
  const [formError, setFormError] = useState<string | null>(null)

  const fetchData = async () => {
    try {
      setLoading(true)
      const res = await getConsolidatedTenders()
      if (res.success && res.tenders) {
        setTenders(res.tenders)
      } else {
        const apiRes = await fetch("/api/franchise/procurement/consolidated")
        const apiData = await apiRes.json()
        if (apiData.tenders) {
          setTenders(apiData.tenders)
        }
      }
    } catch (err) {
      console.error("Failed to load consolidated procurement", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  // Toplu İhale Paketi Oluşturma
  const handleCreatePackage = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)

    if (!newPackageTitle.trim()) {
      setFormError("Lütfen bir ihale paketi başlığı giriniz.")
      return
    }

    try {
      setIsSubmitting(true)
      const res = await createConsolidatedTender(newPackageTitle.trim())
      if (!res.success) {
        setFormError(res.error || "İhale paketi oluşturulamadı.")
        return
      }

      setActionSuccessMsg(`"${newPackageTitle}" başarıyla oluşturuldu ve teklif toplamaya açıldı.`)
      setNewPackageTitle("")
      setIsModalOpen(false)
      await fetchData()

      setTimeout(() => setActionSuccessMsg(null), 5000)
    } catch (err: any) {
      setFormError(err.message || "İhale oluşturulurken hata meydana geldi.")
    } finally {
      setIsSubmitting(false)
    }
  }

  // İhale Durumunu Değiştirme
  const handleToggleStatus = async (id: string, currentStatus: string) => {
    try {
      const nextStatus = currentStatus === "ACTIVE" ? "COMPLETED" : "ACTIVE"
      await updateConsolidatedTenderStatus(id, nextStatus)
      await fetchData()
    } catch (err) {
      console.error("Status update error", err)
    }
  }

  // Filtreleme
  const filteredTenders = tenders.filter((t) => {
    const matchesSearch = t.title.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === "ALL" || t.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const activeCount = tenders.filter((t) => t.status === "ACTIVE").length
  const completedCount = tenders.filter((t) => t.status !== "ACTIVE").length

  return (
    <div className="w-full space-y-6 pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-amber-400 mb-1">
            <ShoppingCart className="w-4 h-4" />
            <span>Merkezi Satınalma & Tedarik Zinciri</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            Konsolide Satınalma & Toplu İhaleler
          </h1>
          <p className="text-sm text-slate-400">
            Tüm franchise ve şube açılışlarının malzeme ihtiyaçlarını tek çatı altında ihale paketlerine dönüştürün.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          <button
            onClick={fetchData}
            disabled={loading}
            className="p-2 rounded-lg bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 transition-colors"
            title="Yenile"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>

          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold transition-all shadow-md shadow-amber-600/20"
          >
            <Plus className="w-4 h-4" />
            <span>Toplu İhale Paketi Oluştur</span>
          </button>
        </div>
      </div>

      {/* Success Notification */}
      {actionSuccessMsg && (
        <div className="p-3.5 bg-emerald-950/60 border border-emerald-800 text-emerald-300 text-xs rounded-xl flex items-center justify-between animate-in fade-in">
          <span className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            {actionSuccessMsg}
          </span>
          <button onClick={() => setActionSuccessMsg(null)} className="text-emerald-400 hover:text-white">
            ✕
          </button>
        </div>
      )}

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
          <div className="text-xs text-slate-400 flex items-center justify-between">
            <span>Toplam İhale Paketi</span>
            <Layers className="w-4 h-4 text-slate-500" />
          </div>
          <div className="text-2xl font-bold text-white mt-2">{tenders.length}</div>
          <div className="text-[11px] text-slate-500 mt-1">Konsolide Tedarik Havuzu</div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
          <div className="text-xs text-amber-400 flex items-center justify-between">
            <span>Aktif İhale Paketleri</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-amber-400 mt-2">{activeCount}</div>
          <div className="text-[11px] text-slate-500 mt-1">Teklif Toplama Aşamasında</div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
          <div className="text-xs text-emerald-400 flex items-center justify-between">
            <span>Sonuçlanan İhaleler</span>
            <BadgeCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-emerald-400 mt-2">{completedCount}</div>
          <div className="text-[11px] text-slate-500 mt-1">Sözleşmeye Bağlanmış</div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-900/60 border border-slate-800/80 rounded-xl p-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="İhale başlığı ara..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-amber-500"
          >
            <option value="ALL">Tüm Durumlar ({tenders.length})</option>
            <option value="ACTIVE">Aktif İhaleler ({activeCount})</option>
            <option value="COMPLETED">Tamamlanan ({completedCount})</option>
          </select>
        </div>
      </div>

      {/* Empty State: data.length === 0 */}
      {!loading && tenders.length === 0 ? (
        <div className="bg-slate-900/60 rounded-2xl border border-dashed border-slate-800 p-12 text-center max-w-xl mx-auto space-y-4 shadow-xl my-6">
          <div className="w-16 h-16 rounded-2xl bg-slate-800/80 border border-slate-700/60 flex items-center justify-center mx-auto text-slate-400 shadow-inner">
            <ShoppingCart className="w-8 h-8 text-amber-400" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-white">Henüz Konsolide İhale Yok</h3>
            <p className="text-sm text-slate-400">
              Şube veya mağaza projeleriniz için oluşturulmuş herhangi bir toplu satınalma ihale paketi bulunamadı.
            </p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-amber-600 hover:bg-amber-500 text-white rounded-lg transition-colors text-xs font-semibold shadow-lg shadow-amber-600/20"
          >
            <Plus className="w-4 h-4" />
            <span>İlk İhale Paketini Oluştur</span>
          </button>
        </div>
      ) : (
        /* Tenders List Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTenders.map((tender) => {
            const isActive = tender.status === "ACTIVE"
            const dateStr = new Date(tender.createdAt).toLocaleDateString("tr-TR", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })

            return (
              <div
                key={tender.id}
                className="bg-slate-900/80 border border-slate-800 hover:border-amber-700/60 rounded-xl p-5 transition-all hover:shadow-xl space-y-4 flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${
                        isActive
                          ? "bg-amber-950/60 text-amber-300 border-amber-800/60"
                          : "bg-emerald-950/60 text-emerald-300 border-emerald-800/60"
                      }`}
                    >
                      {isActive ? "Teklife Açık (Aktif)" : "Sonuçlandı"}
                    </span>
                    <span className="text-[11px] text-slate-500 font-mono">{dateStr}</span>
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-white line-clamp-2">{tender.title}</h3>
                    <p className="text-xs text-slate-400 mt-1">
                      Konsolide Kurumsal Satınalma İhalesi
                    </p>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between">
                  <button
                    onClick={() => handleToggleStatus(tender.id, tender.status)}
                    className={`text-xs px-3 py-1.5 rounded-lg font-semibold transition-colors ${
                      isActive
                        ? "bg-slate-800 hover:bg-emerald-900/50 text-slate-300 hover:text-emerald-300 border border-slate-700 hover:border-emerald-700"
                        : "bg-slate-800 hover:bg-amber-900/50 text-slate-300 hover:text-amber-300 border border-slate-700 hover:border-amber-700"
                    }`}
                  >
                    {isActive ? "İhaleyi Tamamla" : "Yeniden Aç"}
                  </button>

                  <span className="text-xs text-amber-400 font-medium flex items-center gap-1">
                    Aktif Paket <CheckCircle2 className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* MODAL: Toplu İhale Paketi Oluştur */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-amber-500" />
                <h3 className="text-base font-bold text-white">Toplu İhale Paketi Oluştur</h3>
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

            <form onSubmit={handleCreatePackage} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  İhale Paketi Başlığı <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Örn: 2026 Q4 Mağaza Seramik & Vitrifiye Konsolide İhalesi"
                  value={newPackageTitle}
                  onChange={(e) => setNewPackageTitle(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                  required
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Bu ihale paketi kiracınıza ait tüm şubeler için konsolide olarak yayınlanacaktır.
                </p>
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
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold shadow-md shadow-amber-600/20 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Oluşturuluyor...</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-3.5 h-3.5" />
                      <span>İhaleyi Başlat</span>
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
