"use client"
/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Franchise Kusurlu Teslimatlar & Hasar Yönetim Merkezi (RMA)
 * %100 Tenant İzolasyonu ile RmaRequest Modeline Bağlıdır.
 */

import { useState, useEffect } from "react"
import Link from "next/link"
import {
  AlertTriangle,
  Mail,
  Send,
  CheckCircle2,
  Clock,
  RefreshCw,
  Search,
  Filter,
  Image as ImageIcon,
  Building2,
  Truck,
  ArrowRight,
  Plus,
  ExternalLink,
  ShieldAlert,
  FileText,
  X,
  PackageX,
  Check,
  Loader2,
  Store,
} from "lucide-react"
import {
  getRmaRequests,
  createRmaRequest,
  updateRmaRequestStatus,
} from "@/app/actions/franchise"

interface RmaItem {
  id: string
  storeName: string
  itemName: string
  status: "REPORTED" | "SHIPPED" | "RESOLVED" | string
  createdAt: string | Date
}

export default function FranchiseRMALogisticsPage() {
  const [issues, setIssues] = useState<RmaItem[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string>("ALL")
  const [searchQuery, setSearchQuery] = useState("")
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    storeName: "",
    itemName: "",
    status: "REPORTED",
  })

  const fetchData = async () => {
    try {
      setLoading(true)
      const res = await getRmaRequests(statusFilter)
      if (res.success && res.rmaRequests) {
        setIssues(res.rmaRequests)
      } else {
        const url = new URL("/api/franchise/logistics/rma", window.location.origin)
        if (statusFilter !== "ALL") url.searchParams.set("status", statusFilter)
        const apiRes = await fetch(url.toString())
        const apiData = await apiRes.json()
        if (apiData.rmaRequests) {
          setIssues(apiData.rmaRequests)
        }
      }
    } catch (err) {
      console.error("Failed to fetch delivery issues", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [statusFilter])

  // Yeni RMA Tutanak Bildirimi
  const handleCreateRMA = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)

    if (!formData.storeName.trim()) {
      setFormError("Lütfen mağaza / şantiye adını giriniz.")
      return
    }
    if (!formData.itemName.trim()) {
      setFormError("Lütfen kusurlu ürün adını giriniz.")
      return
    }

    try {
      setIsSubmitting(true)
      const res = await createRmaRequest({
        storeName: formData.storeName.trim(),
        itemName: formData.itemName.trim(),
        status: formData.status,
      })

      if (!res.success) {
        setFormError(res.error || "RMA kaydı oluşturulamadı.")
        return
      }

      setIsModalOpen(false)
      setFormData({ storeName: "", itemName: "", status: "REPORTED" })
      await fetchData()
    } catch (err: any) {
      setFormError(err.message || "RMA bildirimi yapılırken hata oluştu.")
    } finally {
      setIsSubmitting(false)
    }
  }

  // RMA Statüsü Güncelleme
  const handleUpdateStatus = async (id: string, newStatus: string) => {
    try {
      await updateRmaRequestStatus(id, newStatus)
      await fetchData()
    } catch (err) {
      console.error("RMA status update failed", err)
    }
  }

  // Arama ve Filtreleme
  const filteredIssues = issues.filter((issue) => {
    const matchesSearch =
      issue.storeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      issue.itemName.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === "ALL" || issue.status === statusFilter
    return matchesSearch && matchesStatus
  })

  // Metrikler
  const totalCount = issues.length
  const reportedCount = issues.filter((i) => i.status === "REPORTED").length
  const shippedCount = issues.filter((i) => i.status === "SHIPPED").length
  const resolvedCount = issues.filter((i) => i.status === "RESOLVED").length

  return (
    <div className="w-full space-y-6 pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-rose-400 mb-1">
            <PackageX className="w-4 h-4" />
            <span>Franchise Lojistik & Hasarlı Malzeme Takibi</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            Hasarlı Teslimat & RMA Bildirim Merkezi
          </h1>
          <p className="text-sm text-slate-400">
            Şantiyelere ulaşan kusurlu, kırık veya eksik kurumsal sevkiyatları kayıt altına alın ve yönetin.
          </p>
        </div>

        {/* Top Actions */}
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
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold transition-all shadow-md shadow-rose-600/20"
          >
            <Plus className="w-4 h-4" />
            <span>Yeni Tutanak / RMA Bildir</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
          <div className="text-xs text-slate-400 flex items-center justify-between">
            <span>Toplam Tutanak</span>
            <AlertTriangle className="w-4 h-4 text-slate-500" />
          </div>
          <div className="text-2xl font-bold text-white mt-2">{totalCount}</div>
          <div className="text-[11px] text-slate-500 mt-1">Açılan Kusur Dosyası</div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
          <div className="text-xs text-rose-400 flex items-center justify-between">
            <span>Kusur Bildirildi</span>
            <Clock className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl font-bold text-rose-400 mt-2">{reportedCount}</div>
          <div className="text-[11px] text-slate-500 mt-1">Tedarikçi Aksiyonu Bekleniyor</div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
          <div className="text-xs text-amber-400 flex items-center justify-between">
            <span>Yedek Parça Yolda</span>
            <Truck className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-amber-400 mt-2">{shippedCount}</div>
          <div className="text-[11px] text-slate-500 mt-1">Sevkiyat Aşaması</div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
          <div className="text-xs text-emerald-400 flex items-center justify-between">
            <span>Tamamlandı & Çözüldü</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-emerald-400 mt-2">{resolvedCount}</div>
          <div className="text-[11px] text-slate-500 mt-1">Kusursuz Teslim Alındı</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-900/60 border border-slate-800/80 rounded-xl p-3">
        <div className="relative w-full sm:w-72">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Mağaza veya malzeme ara..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-rose-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-rose-500"
          >
            <option value="ALL">Tüm Durumlar ({issues.length})</option>
            <option value="REPORTED">Bildirildi ({reportedCount})</option>
            <option value="SHIPPED">Yedek Yolda ({shippedCount})</option>
            <option value="RESOLVED">Çözüldü ({resolvedCount})</option>
          </select>
        </div>
      </div>

      {/* Empty State: data.length === 0 */}
      {!loading && issues.length === 0 ? (
        <div className="bg-slate-900/60 rounded-2xl border border-dashed border-slate-800 p-12 text-center max-w-xl mx-auto space-y-4 shadow-xl my-6">
          <div className="w-16 h-16 rounded-2xl bg-slate-800/80 border border-slate-700/60 flex items-center justify-center mx-auto text-slate-400 shadow-inner">
            <PackageX className="w-8 h-8 text-rose-400" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-white">Hasarlı Teslimat / RMA Kaydı Bulunmuyor</h3>
            <p className="text-sm text-slate-400">
              Şantiyelerinizden bildirilen herhangi bir kusurlu ürün veya hasarlı sevkiyat kaydı bulunamadı.
            </p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg transition-colors text-xs font-semibold shadow-lg shadow-rose-600/20"
          >
            <Plus className="w-4 h-4" />
            <span>Yeni Hasar Tutanağı Oluştur</span>
          </button>
        </div>
      ) : (
        /* Issues Table / Cards */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredIssues.map((issue) => {
            const dateStr = new Date(issue.createdAt).toLocaleDateString("tr-TR", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })

            let statusBadge = {
              label: "Bildirildi (İncelemede)",
              bg: "bg-rose-950/60 text-rose-300 border-rose-800/60",
            }
            if (issue.status === "SHIPPED") {
              statusBadge = {
                label: "Yedek Parça Yolda",
                bg: "bg-amber-950/60 text-amber-300 border-amber-800/60",
              }
            } else if (issue.status === "RESOLVED") {
              statusBadge = {
                label: "Çözümlendi",
                bg: "bg-emerald-950/60 text-emerald-300 border-emerald-800/60",
              }
            }

            return (
              <div
                key={issue.id}
                className="bg-slate-900/80 border border-slate-800 hover:border-rose-700/60 rounded-xl p-5 transition-all hover:shadow-xl space-y-4 flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${statusBadge.bg}`}
                    >
                      {statusBadge.label}
                    </span>
                    <span className="text-[11px] text-slate-500 font-mono">{dateStr}</span>
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-white line-clamp-1">{issue.itemName}</h3>
                    <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-1">
                      <Store className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                      <span>{issue.storeName}</span>
                    </div>
                  </div>
                </div>

                {/* Status Action Buttons */}
                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
                  <select
                    value={issue.status}
                    onChange={(e) => handleUpdateStatus(issue.id, e.target.value)}
                    className="text-xs bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-slate-300 focus:outline-none focus:border-rose-500"
                  >
                    <option value="REPORTED">Bildirildi</option>
                    <option value="SHIPPED">Yedek Yolda</option>
                    <option value="RESOLVED">Çözüldü</option>
                  </select>

                  <span className="text-xs text-slate-500 flex items-center gap-1">
                    <ShieldAlert className="w-3.5 h-3.5 text-slate-400" />
                    <span>RMA Kaydı</span>
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* MODAL: Yeni Tutanak / RMA Bildir */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-rose-500" />
                <h3 className="text-base font-bold text-white">Yeni Hasar / RMA Tutanağı</h3>
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

            <form onSubmit={handleCreateRMA} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Mağaza / Şantiye Adı <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Örn: Beşiktaş Çarşı Şubesi"
                  value={formData.storeName}
                  onChange={(e) => setFormData({ ...formData, storeName: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-rose-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Kusurlu / Hasarlı Malzeme Adı <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Örn: 60x120 Granit Seramik (2 Palet Kırık)"
                  value={formData.itemName}
                  onChange={(e) => setFormData({ ...formData, itemName: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-rose-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Başlangıç Statüsü
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-white focus:outline-none focus:border-rose-500"
                >
                  <option value="REPORTED">Bildirildi (İncelemede)</option>
                  <option value="SHIPPED">Yedek Parça Yolda</option>
                  <option value="RESOLVED">Çözüldü & İkame Edildi</option>
                </select>
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
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shadow-md shadow-rose-600/20 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Kaydediliyor...</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-3.5 h-3.5" />
                      <span>Tutanağı Kaydet</span>
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
