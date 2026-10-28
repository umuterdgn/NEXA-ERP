"use client"
/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Franchise Konsolide Satınalma ve Toplu İhale Paneli
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
} from "lucide-react"

interface PurchaseRequestItem {
  id: string
  projectId: string
  materialName: string
  quantity: number
  unit: string
  status: string
  project?: {
    id: string
    name: string
    city: string | null
    district: string | null
  }
}

interface ConsolidatedPackage {
  id: string
  title: string
  status: string
  createdAt: string
  requests: PurchaseRequestItem[]
}

export default function ConsolidatedProcurementPage() {
  const [consolidatedList, setConsolidatedList] = useState<ConsolidatedPackage[]>([])
  const [openRequests, setOpenRequests] = useState<PurchaseRequestItem[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<"PACKAGES" | "GROUP_BUILDER">("PACKAGES")
  const [selectedRequestIds, setSelectedRequestIds] = useState<string[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [newPackageTitle, setNewPackageTitle] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null)

  const fetchData = async () => {
    try {
      setLoading(true)
      const res = await fetch("/api/franchise/procurement/consolidated")
      const data = await res.json()
      if (data.consolidatedList) setConsolidatedList(data.consolidatedList)
      if (data.openRequests) setOpenRequests(data.openRequests)
    } catch (err) {
      console.error("Failed to load consolidated procurement", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  // Material Grouping: Group scattered requests by exact material name
  const groupedRequests = openRequests.reduce((acc, req) => {
    const key = req.materialName.trim()
    if (!acc[key]) {
      acc[key] = {
        materialName: key,
        unit: req.unit,
        totalQuantity: 0,
        requests: [],
      }
    }
    acc[key].totalQuantity += req.quantity
    acc[key].requests.push(req)
    return acc
  }, {} as Record<string, { materialName: string; unit: string; totalQuantity: number; requests: PurchaseRequestItem[] }>)

  // Select/Deselect all requests of a material group
  const handleToggleGroup = (requests: PurchaseRequestItem[]) => {
    const ids = requests.map((r) => r.id)
    const allSelected = ids.every((id) => selectedRequestIds.includes(id))

    if (allSelected) {
      setSelectedRequestIds((prev) => prev.filter((id) => !ids.includes(id)))
    } else {
      setSelectedRequestIds((prev) => Array.from(new Set([...prev, ...ids])))
    }
  }

  // Create Consolidated Package
  const handleCreatePackage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newPackageTitle || selectedRequestIds.length === 0) {
      alert("Lütfen başlık girin ve en az bir talep seçin.")
      return
    }

    try {
      setIsSubmitting(true)
      const res = await fetch("/api/franchise/procurement/consolidated", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newPackageTitle,
          requestIds: selectedRequestIds,
        }),
      })

      if (res.ok) {
        setIsModalOpen(false)
        setNewPackageTitle("")
        setSelectedRequestIds([])
        setActionSuccessMsg("Toplu ihale paketi başarıyla oluşturuldu ve tedarikçilere açıldı!")
        setActiveTab("PACKAGES")
        fetchData()
      }
    } catch (err) {
      console.error(err)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Calculate Metrics
  const totalPackages = consolidatedList.length
  const totalConsolidatedStores = new Set(
    consolidatedList.flatMap((pkg) => pkg.requests.map((r) => r.projectId))
  ).size
  const pendingRequestsCount = openRequests.length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-blue-400 mb-1">
            <Layers className="w-4 h-4" />
            <span>Merkezi Satınalma ve Toplu İhale</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            Konsolide Satınalma Portalı
          </h1>
          <p className="text-sm text-slate-400">
            Farklı mağazalardan gelen ortak malzeme taleplerini tek çatı altında toplayarak ölçek ekonomisiyle toplu ihale açın.
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

          <button
            onClick={() => {
              if (selectedRequestIds.length === 0) {
                setActiveTab("GROUP_BUILDER")
                alert("Lütfen önce aşağıdan birleştirmek istediğiniz malzeme taleplerini seçin.")
                return
              }
              setIsModalOpen(true)
            }}
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-colors shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Toplu İhale Paketi Oluştur ({selectedRequestIds.length})</span>
          </button>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="text-xs text-slate-400 flex items-center justify-between">
            <span>Aktif Toplu İhale</span>
            <Layers className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-bold text-white mt-2">{totalPackages}</div>
          <div className="text-[11px] text-slate-500 mt-1">Konsolide Tedarik Paketi</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="text-xs text-amber-400 flex items-center justify-between">
            <span>Dağınık Talepler</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-amber-400 mt-2">{pendingRequestsCount}</div>
          <div className="text-[11px] text-slate-500 mt-1">Birleştirme Bekleyen</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="text-xs text-emerald-400 flex items-center justify-between">
            <span>Kapsanan Mağaza</span>
            <Building2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-emerald-400 mt-2">{totalConsolidatedStores}</div>
          <div className="text-[11px] text-slate-500 mt-1">Merkezi Tedarik Ağı</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="text-xs text-purple-400 flex items-center justify-between">
            <span>Ölçek Avantajı</span>
            <TrendingDown className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-bold text-purple-400 mt-2">~%22 Tasarruf</div>
          <div className="text-[11px] text-slate-500 mt-1">Toplu Alım İskontosu</div>
        </div>
      </div>

      {/* Success Notification */}
      {actionSuccessMsg && (
        <div className="p-3.5 bg-emerald-950/60 border border-emerald-800 rounded-xl text-xs text-emerald-300 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{actionSuccessMsg}</span>
          </div>
          <button onClick={() => setActionSuccessMsg(null)} className="text-slate-400 hover:text-white">
            ✕
          </button>
        </div>
      )}

      {/* View Tabs */}
      <div className="flex items-center border-b border-slate-800 gap-6 text-xs font-semibold">
        <button
          onClick={() => setActiveTab("PACKAGES")}
          className={`pb-3 transition-colors relative ${
            activeTab === "PACKAGES" ? "text-blue-400" : "text-slate-400 hover:text-white"
          }`}
        >
          <span>Aktif Konsolide İhaleler ({consolidatedList.length})</span>
          {activeTab === "PACKAGES" && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500"></span>
          )}
        </button>

        <button
          onClick={() => setActiveTab("GROUP_BUILDER")}
          className={`pb-3 transition-colors relative flex items-center gap-1.5 ${
            activeTab === "GROUP_BUILDER" ? "text-blue-400" : "text-slate-400 hover:text-white"
          }`}
        >
          <span>Şantiye Taleplerini Birleştir</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-500/20 text-amber-300 font-bold">
            {Object.keys(groupedRequests).length} Malzeme Grubu
          </span>
          {activeTab === "GROUP_BUILDER" && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500"></span>
          )}
        </button>
      </div>

      {/* TAB 1: Consolidated Packages */}
      {activeTab === "PACKAGES" && (
        <div className="space-y-4">
          {consolidatedList.length === 0 ? (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-10 text-center space-y-3">
              <Package className="w-10 h-10 text-slate-600 mx-auto" />
              <h3 className="text-sm font-semibold text-white">Henüz Konsolide İhale Yok</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                "Şantiye Taleplerini Birleştir" sekmesinden farklı mağazaların aynı tip siparişlerini tek bir ihale paketine dönüştürün.
              </p>
              <button
                onClick={() => setActiveTab("GROUP_BUILDER")}
                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-xs text-white font-medium inline-flex items-center gap-1.5"
              >
                <span>Talepleri İncele & Birleştir</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            consolidatedList.map((pkg) => {
              const totalQuantity = pkg.requests.reduce((sum, r) => sum + r.quantity, 0)
              const unit = pkg.requests[0]?.unit || "Adet"
              const storeNames = Array.from(new Set(pkg.requests.map((r) => r.project?.name || "Mağaza")))

              return (
                <div
                  key={pkg.id}
                  className="bg-slate-900/80 border border-slate-800 hover:border-slate-700 rounded-xl p-5 transition-all space-y-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3.5">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-bold text-white">{pkg.title}</h3>
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-blue-950 text-blue-400 border border-blue-800">
                          {pkg.status === "TENDER_ACTIVE" ? "İHALE AÇIK" : pkg.status}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-400 mt-1">
                        <Clock className="w-3.5 h-3.5 text-slate-500" />
                        <span>Oluşturulma: {new Date(pkg.createdAt).toLocaleDateString("tr-TR")}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => alert(`"${pkg.title}" için tedarikçilere RFQ ihale şartnamesi gönderildi.`)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-500/30 text-xs font-semibold transition-colors"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>Tedarikçilere İhale Teklifi Gönder (RFQ)</span>
                      </button>
                    </div>
                  </div>

                  {/* Summary Metric Box */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg">
                      <span className="text-slate-400">Toplam Konsolide Miktar</span>
                      <div className="text-sm font-bold text-emerald-400 mt-1">
                        {totalQuantity} {unit}
                      </div>
                    </div>

                    <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg">
                      <span className="text-slate-400">Birleştirilen Şantiye / Mağaza</span>
                      <div className="text-sm font-bold text-white mt-1">
                        {storeNames.length} Farklı Lokasyon
                      </div>
                    </div>

                    <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg">
                      <span className="text-slate-400">Bağlı Talep Sayısı</span>
                      <div className="text-sm font-bold text-blue-400 mt-1">
                        {pkg.requests.length} Adet Şantiye Siparişi
                      </div>
                    </div>
                  </div>

                  {/* Store Distribution Chips */}
                  <div className="space-y-1.5">
                    <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                      Konsolide Edilen Mağazalar ve Miktarları:
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {pkg.requests.map((r) => (
                        <div
                          key={r.id}
                          className="px-2.5 py-1 bg-slate-950 border border-slate-800/90 rounded-md text-xs flex items-center gap-1.5 text-slate-300"
                        >
                          <Building2 className="w-3 h-3 text-slate-500" />
                          <span className="font-semibold">{r.project?.name || "Mağaza"}</span>
                          <span className="text-blue-400">
                            ({r.quantity} {r.unit})
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>
      )}

      {/* TAB 2: Group Builder (Dağınık Talepleri Birleştir) */}
      {activeTab === "GROUP_BUILDER" && (
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>Ortak Malzeme Algoritması (Farklı Mağazaların Talepleri)</span>
              </h2>
              <p className="text-xs text-slate-400">
                Sistem aynı tip malzeme taleplerini otomatik grupladı. İhale açmak istediğiniz grupları seçin.
              </p>
            </div>

            <div className="text-xs text-slate-300">
              Seçilen Talep: <span className="font-bold text-blue-400">{selectedRequestIds.length}</span> Adet
            </div>
          </div>

          <div className="space-y-3">
            {Object.keys(groupedRequests).length === 0 ? (
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-10 text-center text-slate-500 text-xs">
                Şu anda birleştirilmeyi bekleyen açık şantiye talebi bulunmuyor.
              </div>
            ) : (
              Object.entries(groupedRequests).map(([materialName, group]) => {
                const groupIds = group.requests.map((r) => r.id)
                const isGroupSelected = groupIds.every((id) => selectedRequestIds.includes(id))

                return (
                  <div
                    key={materialName}
                    className={`bg-slate-900/80 border rounded-xl p-4 transition-all space-y-3 ${
                      isGroupSelected ? "border-blue-600/70 bg-blue-950/20" : "border-slate-800 hover:border-slate-700"
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <input
                          type="checkbox"
                          checked={isGroupSelected}
                          onChange={() => handleToggleGroup(group.requests)}
                          className="w-4 h-4 mt-0.5 rounded border-slate-700 text-blue-600 focus:ring-0 bg-slate-950 cursor-pointer"
                        />
                        <div>
                          <h3 className="text-sm font-bold text-white">{materialName}</h3>
                          <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                            <span className="font-semibold text-emerald-400">
                              Toplam {group.totalQuantity} {group.unit}
                            </span>
                            <span>•</span>
                            <span>{group.requests.length} Farklı Mağaza Talebi</span>
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          handleToggleGroup(group.requests)
                          setNewPackageTitle(`${materialName} Toplu Konsolide Tedariği`)
                          setIsModalOpen(true)
                        }}
                        className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-colors self-end sm:self-center"
                      >
                        Bu Malzemeyi İhaleye Çıkar
                      </button>
                    </div>

                    {/* Breakdown per store */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 border-t border-slate-800/80 text-xs">
                      {group.requests.map((req) => (
                        <div
                          key={req.id}
                          className="bg-slate-950 border border-slate-800 p-2 rounded flex items-center justify-between"
                        >
                          <div className="flex items-center gap-1.5 truncate">
                            <Building2 className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                            <span className="truncate text-slate-300 font-medium">{req.project?.name}</span>
                          </div>
                          <span className="font-bold text-blue-400 shrink-0 ml-2">
                            {req.quantity} {req.unit}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      )}

      {/* Create Consolidated Package Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl animate-in fade-in duration-200">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-blue-400" />
                <span>Konsolide İhale Paketi Başlat</span>
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white p-1">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreatePackage} className="space-y-3.5">
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-300">İhale Paketi Başlığı *</label>
                <input
                  type="text"
                  value={newPackageTitle}
                  onChange={(e) => setNewPackageTitle(e.target.value)}
                  placeholder="Örn: Kasım Ayı Yeni Açılışlar Mobilya Tedariği"
                  className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-200 placeholder-slate-600 focus:outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg text-xs space-y-1 text-slate-400">
                <div className="flex items-center justify-between text-slate-200 font-semibold">
                  <span>Birleştirilecek Talep Sayısı:</span>
                  <span className="text-blue-400">{selectedRequestIds.length} Adet Sipariş</span>
                </div>
                <p className="text-[11px]">
                  Tüm seçili şantiyelerin siparişleri tek bir konsolide ihale şartnamesinde birleştirilecektir.
                </p>
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
                  {isSubmitting ? "Oluşturuluyor..." : "Toplu İhaleyi Başlat"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
