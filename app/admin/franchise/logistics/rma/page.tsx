"use client"
/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Franchise Kusurlu Teslimatlar & Hasar Yönetim Merkezi (RMA)
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
} from "lucide-react"

interface DeliveryIssueItem {
  id: string
  goodsReceiptId: string
  issueType: "DAMAGED" | "WRONG_ITEM" | "MISSING_PARTS" | string
  description: string
  photoUrls: string[]
  status: "REPORTED" | "REPLACEMENT_SENT" | "RESOLVED" | string
  createdAt: string
  materialName: string
  orderedQuantity: number
  deliveredQuantity: number
  waybillNo: string
  project: {
    id?: string
    name: string
    city?: string | null
    district?: string | null
  }
  supplier: {
    id?: string
    name: string
    email?: string
    phone?: string
  }
}

export default function FranchiseRMALogisticsPage() {
  const [issues, setIssues] = useState<DeliveryIssueItem[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string>("ALL")
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedPhotoModal, setSelectedPhotoModal] = useState<string | null>(null)
  const [sendingEmailId, setSendingEmailId] = useState<string | null>(null)
  const [emailNotification, setEmailNotification] = useState<string | null>(null)

  const fetchData = async () => {
    try {
      setLoading(true)
      const url = new URL("/api/franchise/logistics/rma", window.location.origin)
      if (statusFilter !== "ALL") url.searchParams.set("status", statusFilter)

      const res = await fetch(url.toString())
      const data = await res.json()
      if (data.issues) {
        setIssues(data.issues)
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

  // Single-Click RMA Email Send
  const handleSendRMAEmail = async (issue: DeliveryIssueItem) => {
    try {
      setSendingEmailId(issue.id)
      setEmailNotification(null)

      const res = await fetch("/api/franchise/logistics/rma/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          issueId: issue.id,
          supplierEmail: issue.supplier?.email || "tedarikci@nexa.com",
          supplierName: issue.supplier?.name || "Kurumsal Tedarikçi",
          materialName: issue.materialName,
          waybillNo: issue.waybillNo,
          issueType: issue.issueType,
          description: issue.description,
        }),
      })

      const data = await res.json()
      if (res.ok) {
        setEmailNotification(data.message)
        // Optimistic update
        setIssues((prev) =>
          prev.map((i) => (i.id === issue.id ? { ...i, status: "REPLACEMENT_SENT" } : i))
        )
      } else {
        alert(data.error || "E-posta gönderilemedi.")
      }
    } catch (err) {
      console.error(err)
    } finally {
      setSendingEmailId(null)
    }
  }

  // Quick Resolve
  const handleResolveIssue = async (id: string) => {
    try {
      setIssues((prev) =>
        prev.map((i) => (i.id === id ? { ...i, status: "RESOLVED" } : i))
      )
      await fetch("/api/franchise/logistics/rma", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: "RESOLVED" }),
      })
    } catch (err) {
      console.error(err)
      fetchData()
    }
  }

  // Filtered List
  const filteredIssues = issues.filter((item) => {
    const q = searchQuery.toLowerCase()
    return (
      item.materialName.toLowerCase().includes(q) ||
      item.waybillNo.toLowerCase().includes(q) ||
      item.description.toLowerCase().includes(q) ||
      (item.project?.name || "").toLowerCase().includes(q) ||
      (item.supplier?.name || "").toLowerCase().includes(q)
    )
  })

  // Metrics
  const totalCount = issues.length
  const reportedCount = issues.filter((i) => i.status === "REPORTED").length
  const replacementCount = issues.filter((i) => i.status === "REPLACEMENT_SENT").length
  const resolvedCount = issues.filter((i) => i.status === "RESOLVED").length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-red-400 mb-1">
            <PackageX className="w-4 h-4" />
            <span>Sevkiyat Hasar Yönetimi & İade (RMA)</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            Kusurlu Teslimatlar Merkezi
          </h1>
          <p className="text-sm text-slate-400">
            Sahadan girilen hasarlı, yanlış veya eksik teslimat tutanaklarını fotoğraflarıyla inceleyin ve tedarikçiye tek tıkla resmi RMA iade e-postası gönderin.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchData}
            disabled={loading}
            className="p-2 rounded-lg bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
            title="Yenile"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="text-xs text-slate-400 flex items-center justify-between">
            <span>Toplam Hasarlı Teslimat</span>
            <AlertTriangle className="w-4 h-4 text-slate-500" />
          </div>
          <div className="text-2xl font-bold text-white mt-2">{totalCount}</div>
          <div className="text-[11px] text-slate-500 mt-1">Sahadan Gelen Tutanak</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="text-xs text-red-400 flex items-center justify-between">
            <span>RMA Bekleyen (REPORTED)</span>
            <Clock className="w-4 h-4 text-red-400" />
          </div>
          <div className="text-2xl font-bold text-red-400 mt-2">{reportedCount}</div>
          <div className="text-[11px] text-slate-500 mt-1">Tedarikçiye Bildirim Bekliyor</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="text-xs text-blue-400 flex items-center justify-between">
            <span>Yeni Ürün Yolda</span>
            <Truck className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-bold text-blue-400 mt-2">{replacementCount}</div>
          <div className="text-[11px] text-slate-500 mt-1">RMA Gönderildi / Sevk Edildi</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="text-xs text-emerald-400 flex items-center justify-between">
            <span>Çözümlenen / Kapatılan</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-emerald-400 mt-2">{resolvedCount}</div>
          <div className="text-[11px] text-slate-500 mt-1">İade & Değişim Tamamlandı</div>
        </div>
      </div>

      {/* Email Success Banner */}
      {emailNotification && (
        <div className="p-3.5 bg-blue-950/60 border border-blue-800 rounded-xl text-xs text-blue-300 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Mail className="w-4 h-4 text-blue-400 shrink-0" />
            <span>{emailNotification}</span>
          </div>
          <button onClick={() => setEmailNotification(null)} className="text-slate-400 hover:text-white">
            ✕
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-900/60 border border-slate-800/80 rounded-xl p-3">
        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <div className="relative w-full sm:w-72">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="İrsaliye no, malzeme adı veya mağaza ara..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Status Tabs */}
          <div className="flex items-center p-0.5 bg-slate-950 border border-slate-800 rounded-lg">
            <button
              onClick={() => setStatusFilter("ALL")}
              className={`px-2.5 py-1 text-xs rounded-md font-medium transition-colors ${
                statusFilter === "ALL" ? "bg-slate-800 text-white" : "text-slate-400 hover:text-white"
              }`}
            >
              Tümü
            </button>
            <button
              onClick={() => setStatusFilter("REPORTED")}
              className={`px-2.5 py-1 text-xs rounded-md font-medium transition-colors ${
                statusFilter === "REPORTED" ? "bg-red-950/60 text-red-300" : "text-slate-400 hover:text-white"
              }`}
            >
              RMA Bekleyen ({reportedCount})
            </button>
            <button
              onClick={() => setStatusFilter("REPLACEMENT_SENT")}
              className={`px-2.5 py-1 text-xs rounded-md font-medium transition-colors ${
                statusFilter === "REPLACEMENT_SENT" ? "bg-blue-950/60 text-blue-300" : "text-slate-400 hover:text-white"
              }`}
            >
              Değişim Sevk ({replacementCount})
            </button>
            <button
              onClick={() => setStatusFilter("RESOLVED")}
              className={`px-2.5 py-1 text-xs rounded-md font-medium transition-colors ${
                statusFilter === "RESOLVED" ? "bg-emerald-950/60 text-emerald-300" : "text-slate-400 hover:text-white"
              }`}
            >
              Çözüldü ({resolvedCount})
            </button>
          </div>
        </div>

        <div className="text-xs text-slate-400">
          Listelenen: <span className="font-semibold text-white">{filteredIssues.length}</span> Tutanak
        </div>
      </div>

      {/* Delivery Issues List */}
      <div className="space-y-4">
        {filteredIssues.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-10 text-center space-y-3">
            <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
            <h3 className="text-sm font-semibold text-white">Hasarlı Teslimat Kaydı Yok</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Seçilen filtrelerde raporlanmış herhangi bir hasarlı ürün veya sevkiyat kusuru bulunmuyor.
            </p>
          </div>
        ) : (
          filteredIssues.map((issue) => {
            let typeBadge = "bg-red-950/60 border-red-800 text-red-400"
            let typeLabel = "FİZİKİ HASAR (DAMAGED)"
            if (issue.issueType === "WRONG_ITEM") {
              typeBadge = "bg-amber-950/60 border-amber-800 text-amber-400"
              typeLabel = "YANLIŞ ÜRÜN (WRONG ITEM)"
            } else if (issue.issueType === "MISSING_PARTS") {
              typeBadge = "bg-purple-950/60 border-purple-800 text-purple-400"
              typeLabel = "EKSİK PARÇA (MISSING PARTS)"
            }

            return (
              <div
                key={issue.id}
                className="bg-slate-900/80 border border-slate-800 hover:border-slate-700/80 rounded-xl p-5 transition-all space-y-4"
              >
                {/* Issue Header */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 border-b border-slate-800/80 pb-3.5">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${typeBadge}`}>
                        {typeLabel}
                      </span>
                      <span className="text-xs font-mono text-slate-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                        İrsaliye: {issue.waybillNo}
                      </span>
                      {issue.status === "REPORTED" && (
                        <span className="text-[10px] font-bold text-red-400 bg-red-950/60 border border-red-800 px-2 py-0.5 rounded">
                          RMA BEKLİYOR
                        </span>
                      )}
                      {issue.status === "REPLACEMENT_SENT" && (
                        <span className="text-[10px] font-bold text-blue-400 bg-blue-950/60 border border-blue-800 px-2 py-0.5 rounded flex items-center gap-1">
                          <Truck className="w-3 h-3" /> DEĞİŞİM SEVK EDİLDİ
                        </span>
                      )}
                      {issue.status === "RESOLVED" && (
                        <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-800 px-2 py-0.5 rounded flex items-center gap-1">
                          <Check className="w-3 h-3" /> ÇÖZÜLDÜ
                        </span>
                      )}
                    </div>

                    <h3 className="text-base font-bold text-white mt-2">{issue.materialName}</h3>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400 mt-1">
                      <span className="flex items-center gap-1">
                        <Building2 className="w-3.5 h-3.5 text-slate-500" />
                        <span>Mağaza: {issue.project?.name}</span>
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Truck className="w-3.5 h-3.5 text-slate-500" />
                        <span>Tedarikçi: {issue.supplier?.name}</span>
                      </span>
                      <span>•</span>
                      <span className="text-slate-400">
                        Teslim Alınan: {issue.deliveredQuantity} / {issue.orderedQuantity} Adet
                      </span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2 self-end sm:self-center">
                    {issue.status === "REPORTED" && (
                      <button
                        onClick={() => handleSendRMAEmail(issue)}
                        disabled={sendingEmailId === issue.id}
                        className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-semibold transition-colors shadow-sm"
                        title="Tedarikçiye resmi RMA iade maili gönder"
                      >
                        <Mail className="w-3.5 h-3.5" />
                        <span>
                          {sendingEmailId === issue.id ? "Gönderiliyor..." : "Tedarikçiye RMA Bildirimi At"}
                        </span>
                      </button>
                    )}

                    {issue.status === "REPLACEMENT_SENT" && (
                      <button
                        onClick={() => handleResolveIssue(issue.id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600/80 hover:bg-emerald-600 text-white text-xs font-semibold transition-colors"
                        title="Değişim tamamlandı olarak kapat"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Kusuru Kapat (Çözüldü)</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Description & Photo Evidences */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                  {/* Defect Description */}
                  <div className="md:col-span-2 space-y-1.5">
                    <span className="font-semibold text-slate-400 uppercase tracking-wider text-[11px]">
                      Saha Kabul Hasar Tutanak Açıklaması:
                    </span>
                    <p className="text-slate-200 bg-slate-950 p-3 rounded-lg border border-slate-800/80 leading-relaxed">
                      {issue.description}
                    </p>
                  </div>

                  {/* Photo Evidences */}
                  <div className="space-y-1.5">
                    <span className="font-semibold text-slate-400 uppercase tracking-wider text-[11px]">
                      Fotoğraflı Kanıtlar ({issue.photoUrls?.length || 0}):
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {issue.photoUrls && issue.photoUrls.length > 0 ? (
                        issue.photoUrls.map((url, idx) => (
                          <div
                            key={idx}
                            onClick={() => setSelectedPhotoModal(url)}
                            className="w-16 h-16 rounded-lg bg-slate-950 border border-slate-800 overflow-hidden cursor-pointer group relative"
                          >
                            <img
                              src={url}
                              alt="Hasar Görseli"
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                              <ImageIcon className="w-4 h-4 text-white" />
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-slate-600 italic">Fotoğraf eklenmemiş</div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Lightbox Photo Preview */}
      {selectedPhotoModal && (
        <div
          onClick={() => setSelectedPhotoModal(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md cursor-pointer"
        >
          <div className="relative max-w-3xl max-h-[85vh] rounded-xl overflow-hidden border border-slate-700 bg-slate-950 p-2">
            <img
              src={selectedPhotoModal}
              alt="Hasarlı Ürün Fotoğrafı"
              className="max-w-full max-h-[80vh] object-contain rounded-lg"
            />
            <div className="text-center text-xs text-slate-400 mt-2">
              Kapatmak için herhangi bir yere tıklayın
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
