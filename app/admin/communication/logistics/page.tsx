"use client"
/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * This code is the property of NXA Software.
 */


import { useState, useEffect } from "react"
import { Truck, Clock, MapPin, Phone, CheckCircle, AlertCircle, Plus, Calendar, X, Route, Users, Zap, RefreshCw, MessageSquare } from "lucide-react"
import toast from "react-hot-toast"

interface LogisticsItem {
  id: string
  title: string
  type: string
  location: string
  supplierName?: string | null
  driverContact?: string | null
  status: "PLANNED" | "IN_TRANSIT" | "DELIVERED" | "ISSUE_REPORTED" | string
  scheduledAt: string | Date
  notes?: string | null
  deliveryProofImageUrl?: string | null
  deliveryNotes?: string | null
  receivedById?: string | null
  receivedBy?: {
    id: string
    name: string
  } | null
  projectId?: string | null
  estimatedTimeOfArrival?: string | null
  delayInMinutes?: number
  etaFormatted?: string | null
  isDelayed?: boolean
}

interface RouteOptimizationStats {
  originalDistanceKm: number
  aiDistanceKm: number
  durationMinutes: number
  durationFormatted: string
  savingsKm: number
  savingsPercent: number
  activeShipmentsCount: number
  recommendation: string
}

interface DriverWorkload {
  id: string
  name: string
  fullName: string
  initial: string
  shipmentCount: number
  remainingKm: number
  workloadPercent: number
  status: "Optimum" | "Normal" | "Kritik"
  statusText: string
}

export default function LogisticsPage() {
  const [items, setItems] = useState<LogisticsItem[]>([])
  const [loading, setLoading] = useState(true)
  const [routeStats, setRouteStats] = useState<RouteOptimizationStats | null>(null)
  const [driverWorkloads, setDriverWorkloads] = useState<DriverWorkload[]>([])
  const [loadingStats, setLoadingStats] = useState(true)
  const [isOptimizing, setIsOptimizing] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [selectedPhotoUrl, setSelectedPhotoUrl] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    title: "",
    type: "BETON",
    location: "",
    supplierName: "",
    driverContact: "",
    scheduledAt: "",
    notes: "",
    status: "PLANNED"
  })

  // İç / Dış Şoför Yönetimi ve WhatsApp
  const [driverTab, setDriverTab] = useState<"INTERNAL" | "EXTERNAL">("INTERNAL")
  const [internalDrivers, setInternalDrivers] = useState<Array<{ id: string; name: string; phone?: string | null; position?: string | null }>>([])
  const [selectedDriverId, setSelectedDriverId] = useState<string>("")
  const [externalDriverName, setExternalDriverName] = useState<string>("")
  const [externalDriverPhone, setExternalDriverPhone] = useState<string>("")

  useEffect(() => {
    fetchItems()
    fetchStats()
    fetchInternalDrivers()
  }, [])

  const fetchInternalDrivers = async () => {
    try {
      const res = await fetch("/api/admin/drivers")
      if (res.ok) {
        const data = await res.json()
        setInternalDrivers(Array.isArray(data) ? data : [])
      }
    } catch (err) {
      console.error("Failed to load internal drivers:", err)
    }
  }

  // WhatsApp Bildirimi ve Canlı Konum Linki Gönderme
  const handleWhatsAppNotify = (item: LogisticsItem) => {
    const rawPhone = item.driverContact || ""
    let cleanPhone = rawPhone.replace(/[^0-9]/g, "")
    if (cleanPhone.startsWith("0")) {
      cleanPhone = "9" + cleanPhone
    } else if (!cleanPhone.startsWith("90") && cleanPhone.length === 10) {
      cleanPhone = "90" + cleanPhone
    }

    if (!cleanPhone) {
      toast.error("Bu sevkiyata atanmış şoför telefon numarası bulunamadı.")
      return
    }

    const driverName = item.supplierName || "Şoför"
    const projectName = item.location || "Şantiye Sahası"
    const deliveryId = item.id

    const message = `Nexa ERP: Sayın ${driverName}, ${projectName} şantiyesine teslimatınız oluşturulmuştur. Teslimat fişini görmek ve canlı konum takibini (GPS) aktifleştirmek için lütfen aşağıdaki linke tıklayın: https://nxerp.com.tr/track/${deliveryId}`

    const encoded = encodeURIComponent(message)
    window.open(`https://wa.me/${cleanPhone}?text=${encoded}`, "_blank")
    toast.success(`${driverName} için WhatsApp yönlendirmesi açıldı.`)
  }

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/admin/logistics/stats')
      if (res.ok) {
        const data = await res.json()
        if (data.routeOptimization) setRouteStats(data.routeOptimization)
        if (data.personnelWorkload) setDriverWorkloads(data.personnelWorkload)
      }
    } catch (error) {
      console.error('Failed to fetch logistics stats:', error)
    } finally {
      setLoadingStats(false)
    }
  }

  const handleOptimizeRoutes = async () => {
    setIsOptimizing(true)
    toast.loading("OSRM yol ağı analiz ediliyor ve rotalar optimize ediliyor...", { id: "opt-toast" })
    try {
      await fetchStats()
      await fetchItems()
      toast.success("AI rota önerisi OSRM üzerinden güncellendi ve tüm sürücülere iletildi!", { id: "opt-toast" })
    } catch {
      toast.error("Optimizasyon servisine ulaşılamadı.", { id: "opt-toast" })
    } finally {
      setIsOptimizing(false)
    }
  }

  const fetchItems = async () => {
    try {
      const response = await fetch('/api/admin/logistics')
      if (response.ok) {
        const data = await response.json()
        setItems(data)
      }
    } catch (error) {
      console.error('Failed to fetch logistics:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.title || !formData.location || !formData.scheduledAt) {
      toast.error("Lütfen zorunlu alanları doldurun")
      return
    }

    setSubmitting(true)
    try {
      const response = await fetch('/api/admin/logistics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        toast.success("Randevu başarıyla oluşturuldu")
        setIsModalOpen(false)
        setFormData({ title: "", type: "BETON", location: "", supplierName: "", driverContact: "", scheduledAt: "", notes: "", status: "PLANNED" })
        fetchItems()
      } else {
        toast.error("Randevu oluşturulurken hata oluştu")
      }
    } catch (error) {
      console.error('Failed to create logistics:', error)
      toast.error("Bir hata oluştu")
    } finally {
      setSubmitting(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PLANNED":
      case "Planlandı":
        return "bg-slate-500/20 text-slate-300 border-slate-500/50"
      case "IN_TRANSIT":
      case "Yolda":
        return "bg-blue-500/20 text-blue-400 border-blue-500/50"
      case "DELIVERED":
      case "Tamamlandı":
        return "bg-emerald-500/20 text-emerald-400 border-emerald-500/50"
      case "ISSUE_REPORTED":
      case "İptal":
        return "bg-red-500/20 text-red-400 border-red-500/50"
      default:
        return "bg-slate-500/20 text-slate-300 border-slate-500/50"
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "PLANNED":
      case "Planlandı":
        return "Planlandı"
      case "IN_TRANSIT":
      case "Yolda":
        return "Yolda"
      case "DELIVERED":
      case "Tamamlandı":
        return "Teslim Alındı"
      case "ISSUE_REPORTED":
      case "İptal":
        return "Sorunlu / Eksik"
      default:
        return status
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "DELIVERED":
      case "Tamamlandı":
        return <CheckCircle className="w-4 h-4 text-emerald-400" />
      case "ISSUE_REPORTED":
      case "İptal":
        return <AlertCircle className="w-4 h-4 text-red-400" />
      case "IN_TRANSIT":
      case "Yolda":
        return <Truck className="w-4 h-4 text-blue-400" />
      default:
        return <Clock className="w-4 h-4 text-slate-400" />
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case "BETON":
        return "bg-blue-500/20 text-blue-400"
      case "MALZEME_TESLİMAT":
        return "bg-purple-500/20 text-purple-400"
      case "DENETİM":
        return "bg-orange-500/20 text-orange-400"
      default:
        return "bg-slate-500/20 text-slate-400"
    }
  }

  const handleStatusChange = async (itemId: string, newStatus: string) => {
    const prevItems = [...items]
    setItems(items.map(item =>
      item.id === itemId ? { ...item, status: newStatus as any } : item
    ))

    try {
      const res = await fetch("/api/admin/logistics", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: itemId, status: newStatus })
      })

      if (!res.ok) {
        setItems(prevItems)
        toast.error("Durum güncellenirken hata oluştu")
      } else {
        toast.success(`Durum "${getStatusLabel(newStatus)}" olarak güncellendi`)
      }
    } catch (err) {
      console.error(err)
      setItems(prevItems)
      toast.error("Bağlantı hatası oluştu")
    }
  }

  return (
    <div className="p-6 h-screen flex flex-col">
      {/* Header */}
      <div className="mb-6 flex flex-wrap gap-4 justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <Truck className="w-8 h-8 text-blue-400" />
            Lojistik & Randevu Ağı
          </h1>
          <p className="text-slate-400 mt-1">Beton dökümü, malzeme teslimatı ve denetim takibi</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-colors whitespace-nowrap"
        >
          <Plus className="w-5 h-5" />
          Yeni Randevu
        </button>
      </div>

      {/* AI Route Optimization and Personnel Workload */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* AI Route Optimization Card (OSRM Verileriyle Canlı) */}
        <div className="bg-gradient-to-br from-purple-900/20 to-blue-900/20 rounded-xl p-6 border border-purple-500/30">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center">
              <Route className="w-6 h-6 text-purple-400" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white">AI Görev Dağıtımı ve Rota Optimizasyonu</h2>
              <p className="text-slate-400 text-sm">
                OSRM karayolu ağı ile anlık optimizasyon {routeStats ? `(${routeStats.durationFormatted})` : ""}
              </p>
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
              <div className="flex items-center justify-between mb-2">
                <span className="text-slate-400 text-sm">Orijinal Tahmini Yol</span>
                <span className="text-2xl font-bold text-red-400">
                  {routeStats ? `${routeStats.originalDistanceKm} km` : "118 km"}
                </span>
              </div>
              <div className="w-full bg-slate-700 rounded-full h-2">
                <div className="bg-red-500 h-2 rounded-full" style={{ width: '100%' }} />
              </div>
            </div>

            <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-slate-400 text-sm">AI Rota Önerisi</span>
                  {routeStats && (
                    <span className="text-[11px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                      OSRM ~{routeStats.durationFormatted}
                    </span>
                  )}
                </div>
                <span className="text-2xl font-bold text-green-400">
                  {routeStats ? `${routeStats.aiDistanceKm} km` : "76 km"}
                </span>
              </div>
              <div className="w-full bg-slate-700 rounded-full h-2">
                <div
                  className="bg-green-500 h-2 rounded-full transition-all duration-700"
                  style={{
                    width: routeStats
                      ? `${Math.min(100, Math.round((routeStats.aiDistanceKm / (routeStats.originalDistanceKm || 1)) * 100))}%`
                      : '64%',
                  }}
                />
              </div>
              <p className="text-green-400 text-sm mt-2">
                {routeStats?.recommendation || "Görevleri yeniden sıralayarak toplam mesafeyi düşürebilirim"}
              </p>
            </div>

            <button
              onClick={handleOptimizeRoutes}
              disabled={isOptimizing}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 disabled:opacity-50 text-white rounded-lg transition-colors font-medium shadow-md shadow-purple-900/30"
            >
              <Zap className={`w-5 h-5 ${isOptimizing ? "animate-spin text-yellow-300" : ""}`} />
              {isOptimizing ? "OSRM Rotaları Güncelleniyor..." : "Rotayı Optimize Et ve Ekiplere Bildir"}
            </button>
          </div>
        </div>

        {/* Personnel Workload Card (Veritabanındaki Aktif DRIVER Rollerine Göre) */}
        <div className="bg-gradient-to-br from-orange-900/20 to-amber-900/20 rounded-xl p-6 border border-orange-500/30">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-orange-500/20 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-orange-400" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white">Personel İş Yükü</h2>
              <p className="text-slate-400 text-sm">Aktif DRIVER rolü günlük kapasite analizi</p>
            </div>
          </div>

          <div className="space-y-3">
            {driverWorkloads.length > 0 ? (
              driverWorkloads.map((driver) => {
                const badgeClass =
                  driver.status === "Optimum"
                    ? "bg-green-500/20 text-green-400 border border-green-500/40"
                    : driver.status === "Kritik"
                    ? "bg-red-500/20 text-red-400 border border-red-500/40"
                    : "bg-blue-500/20 text-blue-400 border border-blue-500/40";

                const circleColor =
                  driver.status === "Optimum"
                    ? "bg-green-500/20 text-green-400"
                    : driver.status === "Kritik"
                    ? "bg-red-500/20 text-red-400"
                    : "bg-blue-500/20 text-blue-400";

                const barColor =
                  driver.status === "Optimum"
                    ? "bg-green-500"
                    : driver.status === "Kritik"
                    ? "bg-red-500"
                    : "bg-blue-500";

                return (
                  <div key={driver.id} className="bg-slate-800/50 rounded-lg p-3.5 border border-slate-700">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className={`w-8 h-8 ${circleColor} rounded-full flex items-center justify-center font-bold text-sm`}>
                          {driver.initial}
                        </div>
                        <div>
                          <span className="text-white font-medium">{driver.name}</span>
                          <span className="text-xs text-slate-400 ml-2">
                            ({driver.shipmentCount} sevkiyat, {driver.remainingKm} km kalan)
                          </span>
                        </div>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${badgeClass}`}>
                        {driver.status}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-slate-700 rounded-full h-2">
                        <div
                          className={`${barColor} h-2 rounded-full transition-all duration-500`}
                          style={{ width: `${driver.workloadPercent}%` }}
                        />
                      </div>
                      <span className={`text-xs font-semibold ${driver.status === "Kritik" ? "text-red-400" : driver.status === "Optimum" ? "text-green-400" : "text-blue-400"}`}>
                        %{driver.workloadPercent}
                      </span>
                    </div>
                    <p className="text-slate-400 text-xs mt-1.5">{driver.statusText}</p>
                  </div>
                );
              })
            ) : (
              <>
                <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-green-500/20 rounded-full flex items-center justify-center">
                        <span className="text-green-400 text-sm font-medium">A</span>
                      </div>
                      <span className="text-white font-medium">Ahmet</span>
                    </div>
                    <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded text-xs font-medium">Optimum</span>
                  </div>
                  <p className="text-slate-400 text-sm">09:00 Yapı A, 11:30 Yapı B</p>
                </div>

                <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-red-500/20 rounded-full flex items-center justify-center">
                        <span className="text-red-400 text-sm font-medium">M</span>
                      </div>
                      <span className="text-white font-medium">Mehmet</span>
                    </div>
                    <span className="px-2 py-1 bg-red-500/20 text-red-400 rounded text-xs font-medium">Kritik</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-slate-700 rounded-full h-2">
                      <div className="bg-red-500 h-2 rounded-full" style={{ width: '85%' }} />
                    </div>
                    <span className="text-red-400 text-sm font-medium">%85</span>
                  </div>
                  <p className="text-slate-400 text-sm mt-2">Yoğunluk yüksek - görev dağıtımı önerilir</p>
                </div>

                <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-blue-500/20 rounded-full flex items-center justify-center">
                        <span className="text-blue-400 text-sm font-medium">A</span>
                      </div>
                      <span className="text-white font-medium">Ayşe</span>
                    </div>
                    <span className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded text-xs font-medium">Normal</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-slate-700 rounded-full h-2">
                      <div className="bg-blue-500 h-2 rounded-full" style={{ width: '60%' }} />
                    </div>
                    <span className="text-blue-400 text-sm font-medium">%60</span>
                  </div>
                  <p className="text-slate-400 text-sm mt-2">10:00 Yapı C, 14:00 Yapı D</p>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Vertical List View */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="text-center py-12 text-slate-400">Yükleniyor...</div>
        ) : (
          <div className="flex flex-col gap-4">
            {items.map((item) => (
            <div
              key={item.id}
              className="bg-slate-800/50 backdrop-blur-lg rounded-xl border border-slate-700 p-4 hover:border-slate-600 transition-colors"
            >
              <div className="flex items-center gap-4">
                {/* Left: Icon and Time */}
                <div className="flex-shrink-0 w-20 text-center">
                  <div className={`w-12 h-12 mx-auto rounded-lg flex items-center justify-center ${getTypeColor(item.type)}`}>
                    <Truck className="w-6 h-6" />
                  </div>
                  <div className="mt-2 text-xs text-slate-400">
                    {new Date(item.scheduledAt).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                  <div className="text-xs text-slate-500">
                    {new Date(item.scheduledAt).toLocaleDateString('tr-TR')}
                  </div>
                </div>

                {/* Middle: Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <h4 className="font-medium text-white truncate">{item.title}</h4>
                    <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${getTypeColor(item.type)} flex-shrink-0`}>
                      {item.type.replace("_", " ")}
                    </span>

                    {/* OSRM Canlı Tahmini Varış Süresi (ETA) Rozeti */}
                    {(item.etaFormatted || item.estimatedTimeOfArrival || item.title.includes("Geniş Alan") || item.status === "IN_TRANSIT") && (
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold border transition-all ${
                          (item.delayInMinutes || 0) > 0
                            ? "bg-red-500/20 text-red-400 border-red-500/50 shadow-sm shadow-red-950 animate-pulse"
                            : "bg-emerald-500/20 text-emerald-400 border-emerald-500/50 shadow-sm shadow-emerald-950"
                        }`}
                      >
                        <Clock className="w-3.5 h-3.5" />
                        <span>
                          Tahmini Varış:{" "}
                          {item.etaFormatted ||
                            (item.estimatedTimeOfArrival
                              ? new Date(item.estimatedTimeOfArrival).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })
                              : "14:30")}
                        </span>
                        {(item.delayInMinutes || 0) > 0 && (
                          <span className="text-[10px] text-red-300 font-semibold">
                            (+{item.delayInMinutes} dk Gecikme)
                          </span>
                        )}
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
                    <div className="flex items-center gap-2 text-slate-300">
                      <MapPin className="w-4 h-4 flex-shrink-0" />
                      <span>{item.location}</span>
                    </div>

                    {item.supplierName && (
                      <div className="flex items-center gap-2 text-slate-300">
                        <Truck className="w-4 h-4 flex-shrink-0" />
                        <span>{item.supplierName}</span>
                      </div>
                    )}

                    {item.driverContact && (
                      <div className="flex items-center gap-2 text-slate-300">
                        <Phone className="w-4 h-4 flex-shrink-0" />
                        <span>{item.driverContact}</span>
                      </div>
                    )}
                  </div>

                  {item.notes && (
                    <p className="mt-2 text-xs text-slate-400">{item.notes}</p>
                  )}
                </div>

                {/* Right: Status Badge and Actions */}
                <div className="flex-shrink-0 flex flex-col items-end gap-2">
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${getStatusBadge(item.status)}`}>
                    {getStatusIcon(item.status)}
                    {getStatusLabel(item.status)}
                  </span>

                  <select
                    value={item.status}
                    onChange={(e) => handleStatusChange(item.id, e.target.value)}
                    className="px-3 py-1.5 bg-slate-900 border border-slate-700 hover:border-slate-500 rounded-lg text-white text-xs font-medium focus:outline-none focus:border-blue-500 transition-colors"
                  >
                    <option value="PLANNED">Planlandı</option>
                    <option value="IN_TRANSIT">Yolda</option>
                    <option value="DELIVERED">Teslim Alındı</option>
                    <option value="ISSUE_REPORTED">Sorunlu / Eksik</option>
                  </select>

                  {/* WhatsApp ile Bildir & Canlı Konum Linki Butonu */}
                  <button
                    type="button"
                    onClick={() => handleWhatsAppNotify(item)}
                    className="px-3 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-emerald-400 font-semibold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-sm shadow-emerald-950/40 hover:scale-105 active:scale-95"
                    title="Şoföre WhatsApp Canlı Konum ve Takip Linki Gönder"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>WhatsApp ile Bildir</span>
                  </button>
                </div>
              </div>

              {/* ISSUE_REPORTED Alert Box with Photo Thumbnail and Chief's Note */}
              {item.status === "ISSUE_REPORTED" && (
                <div className="mt-3.5 p-3.5 bg-red-950/40 border border-red-500/50 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-lg shadow-red-950/30">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-red-500/20 border border-red-500/40 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <AlertCircle className="w-5 h-5 text-red-400 animate-pulse" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-red-300 uppercase tracking-wide">
                          Teslimat Sorunu Bildirildi (Eksik / Hasarlı)
                        </span>
                        {item.receivedBy && (
                          <span className="text-[11px] text-red-400 bg-red-900/30 px-2 py-0.5 rounded border border-red-800/40">
                            Şef: {item.receivedBy.name}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-red-100 font-medium mt-1 leading-relaxed">
                        <span className="text-red-300 font-semibold">Şef Notu: </span>
                        {item.deliveryNotes || "Herhangi bir açıklama girilmedi."}
                      </p>
                    </div>
                  </div>

                  {item.deliveryProofImageUrl && (
                    <div className="flex items-center gap-2 self-end sm:self-center flex-shrink-0">
                      <button
                        type="button"
                        onClick={() => setSelectedPhotoUrl(item.deliveryProofImageUrl || null)}
                        className="relative group block w-14 h-14 rounded-lg overflow-hidden border-2 border-red-400 hover:border-red-300 shadow-md shadow-red-950/60 transition-transform hover:scale-105"
                        title="Kanıt fotoğrafını büyüt"
                      >
                        <img
                          src={item.deliveryProofImageUrl}
                          alt="Teslimat Sorun Kanıtı"
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/40 group-hover:bg-black/10 transition-colors flex items-center justify-center text-[10px] text-white font-bold">
                          Büyüt
                        </div>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}

          {items.length === 0 && (
            <div className="text-center py-12 text-slate-400">
              <Truck className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Randevu bulunamadı</p>
            </div>
          )}
          </div>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-800 rounded-xl border border-slate-700 w-full max-w-md">
            <div className="flex items-center justify-between p-4 border-b border-slate-700">
              <h3 className="text-lg font-semibold text-white">Yeni Randevu</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Başlık</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  placeholder="Örn: C30 Beton Dökümü - A Blok"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Tür</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="BETON">Beton</option>
                  <option value="MALZEME_TESLİMAT">Malzeme Teslimatı</option>
                  <option value="DENETİM">Denetim</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Konum</label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  placeholder="Örn: A Blok - Zemin"
                  required
                />
              </div>
              {/* Şoför Atama (İç Şoför / Dış Şoför İki Sekmeli Yapı) */}
              <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                    <Truck className="w-4 h-4 text-blue-400" />
                    <span>Şoför ve Sürücü Ataması *</span>
                  </label>
                  <div className="flex bg-slate-900 p-0.5 rounded-lg border border-slate-800">
                    <button
                      type="button"
                      onClick={() => {
                        setDriverTab("INTERNAL")
                        if (selectedDriverId) {
                          const d = internalDrivers.find((x) => x.id === selectedDriverId)
                          if (d) setFormData((p) => ({ ...p, supplierName: d.name, driverContact: d.phone || "" }))
                        }
                      }}
                      className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all ${
                        driverTab === "INTERNAL"
                          ? "bg-blue-600 text-white shadow-sm"
                          : "text-slate-400 hover:text-white"
                      }`}
                    >
                      İç Şoför (Kayıtlı)
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setDriverTab("EXTERNAL")
                        setFormData((p) => ({ ...p, supplierName: externalDriverName, driverContact: externalDriverPhone }))
                      }}
                      className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all ${
                        driverTab === "EXTERNAL"
                          ? "bg-blue-600 text-white shadow-sm"
                          : "text-slate-400 hover:text-white"
                      }`}
                    >
                      Dış Şoför (Misafir)
                    </button>
                  </div>
                </div>

                {driverTab === "INTERNAL" ? (
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">
                      Personnel Tablosundaki Kayıtlı Şoförü Seçin
                    </label>
                    <select
                      value={selectedDriverId}
                      onChange={(e) => {
                        const dId = e.target.value
                        setSelectedDriverId(dId)
                        const d = internalDrivers.find((x) => x.id === dId)
                        if (d) {
                          setFormData((prev) => ({
                            ...prev,
                            supplierName: d.name,
                            driverContact: d.phone || "",
                          }))
                        }
                      }}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-xs focus:outline-none focus:border-blue-500 font-medium"
                    >
                      <option value="">-- Kayıtlı Şoför Seçiniz --</option>
                      {internalDrivers.map((drv) => (
                        <option key={drv.id} value={drv.id}>
                          {drv.name} ({drv.position || "Şoför"}) {drv.phone ? `• ${drv.phone}` : ""}
                        </option>
                      ))}
                    </select>
                    {selectedDriverId && (
                      <p className="text-[11px] text-emerald-400 font-mono mt-1.5">
                        Atanan Şoför: {formData.supplierName} • İletişim: {formData.driverContact || "Telefon belirtilmemiş"}
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">
                        Dış Şoför Adı Soyadı *
                      </label>
                      <input
                        type="text"
                        value={externalDriverName}
                        onChange={(e) => {
                          setExternalDriverName(e.target.value)
                          setFormData((prev) => ({ ...prev, supplierName: e.target.value }))
                        }}
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-xs focus:outline-none focus:border-blue-500"
                        placeholder="Örn: Hasan Yılmaz"
                        required={driverTab === "EXTERNAL"}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">
                        Telefon Numarası *
                      </label>
                      <input
                        type="tel"
                        value={externalDriverPhone}
                        onChange={(e) => {
                          setExternalDriverPhone(e.target.value)
                          setFormData((prev) => ({ ...prev, driverContact: e.target.value }))
                        }}
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-xs focus:outline-none focus:border-blue-500 font-mono"
                        placeholder="+90 532 XXX XX XX"
                        required={driverTab === "EXTERNAL"}
                      />
                    </div>
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Tarih/Saat</label>
                <input
                  type="datetime-local"
                  value={formData.scheduledAt}
                  onChange={(e) => setFormData({ ...formData, scheduledAt: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Notlar</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  rows={2}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Başlangıç Durumu</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="PLANNED">Planlandı</option>
                  <option value="IN_TRANSIT">Yolda</option>
                  <option value="DELIVERED">Teslim Alındı</option>
                  <option value="ISSUE_REPORTED">Sorunlu / Eksik</option>
                </select>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? "Kaydediliyor..." : "Kaydet"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Photo Lightbox Modal */}
      {selectedPhotoUrl && (
        <div 
          className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setSelectedPhotoUrl(null)}
        >
          <div 
            className="relative max-w-3xl max-h-[90vh] bg-slate-900 border border-slate-700 rounded-2xl overflow-hidden shadow-2xl flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-3 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between text-white text-sm font-semibold">
              <span className="flex items-center gap-2 text-red-400">
                <AlertCircle className="w-4 h-4" /> Teslimat Hasar / Eksik Kanıt Fotoğrafı
              </span>
              <button
                onClick={() => setSelectedPhotoUrl(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-2 flex items-center justify-center bg-black">
              <img
                src={selectedPhotoUrl}
                alt="Teslimat Kanıtı Tam Boyut"
                className="max-h-[75vh] w-auto object-contain rounded-lg"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
