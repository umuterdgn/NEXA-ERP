"use client"
/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * This code is the property of NXA Software.
 */


import { useState, useEffect } from "react"
import { Truck, Clock, MapPin, Phone, CheckCircle, AlertCircle, Plus, Calendar, X, Route, Users, Zap } from "lucide-react"
import toast from "react-hot-toast"

interface LogisticsItem {
  id: string
  title: string
  type: string
  location: string
  supplierName?: string
  driverContact?: string
  status: "Planlandı" | "Yolda" | "Şantiyede" | "Tamamlandı" | "İptal"
  scheduledAt: Date
  notes?: string
}

export default function LogisticsPage() {
  const [items, setItems] = useState<LogisticsItem[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    title: "",
    type: "BETON",
    location: "",
    supplierName: "",
    driverContact: "",
    scheduledAt: "",
    notes: ""
  })

  useEffect(() => {
    fetchItems()
  }, [])

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
        setFormData({ title: "", type: "BETON", location: "", supplierName: "", driverContact: "", scheduledAt: "", notes: "" })
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
      case "Planlandı":
        return "bg-slate-500/20 text-slate-400 border-slate-500/50"
      case "Yolda":
        return "bg-blue-500/20 text-blue-400 border-blue-500/50"
      case "Şantiyede":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/50"
      case "Tamamlandı":
        return "bg-green-500/20 text-green-400 border-green-500/50"
      case "İptal":
        return "bg-red-500/20 text-red-400 border-red-500/50"
      default:
        return "bg-slate-500/20 text-slate-400 border-slate-500/50"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Tamamlandı":
        return <CheckCircle className="w-4 h-4 text-green-400" />
      case "İptal":
        return <AlertCircle className="w-4 h-4 text-red-400" />
      default:
        return <Clock className="w-4 h-4 text-yellow-400" />
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

  const handleStatusChange = (itemId: string, newStatus: string) => {
    setItems(items.map(item =>
      item.id === itemId ? { ...item, status: newStatus as any } : item
    ))
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
        {/* AI Route Optimization Card */}
        <div className="bg-gradient-to-br from-purple-900/20 to-blue-900/20 rounded-xl p-6 border border-purple-500/30">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center">
              <Route className="w-6 h-6 text-purple-400" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white">AI Görev Dağıtımı ve Rota Optimizasyonu</h2>
              <p className="text-slate-400 text-sm">Akıllı rota planlama</p>
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
              <div className="flex items-center justify-between mb-2">
                <span className="text-slate-400 text-sm">Orijinal Tahmini Yol</span>
                <span className="text-2xl font-bold text-red-400">118 km</span>
              </div>
              <div className="w-full bg-slate-700 rounded-full h-2">
                <div className="bg-red-500 h-2 rounded-full" style={{ width: '100%' }} />
              </div>
            </div>

            <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
              <div className="flex items-center justify-between mb-2">
                <span className="text-slate-400 text-sm">AI Rota Önerisi</span>
                <span className="text-2xl font-bold text-green-400">76 km</span>
              </div>
              <div className="w-full bg-slate-700 rounded-full h-2">
                <div className="bg-green-500 h-2 rounded-full" style={{ width: '64%' }} />
              </div>
              <p className="text-green-400 text-sm mt-2">Görevleri yeniden sıralayarak toplam mesafeyi düşürebilirim</p>
            </div>

            <button className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white rounded-lg transition-colors font-medium">
              <Zap className="w-5 h-5" />
              Rotayı Optimize Et ve Ekiplere Bildir
            </button>
          </div>
        </div>

        {/* Personnel Workload Card */}
        <div className="bg-gradient-to-br from-orange-900/20 to-amber-900/20 rounded-xl p-6 border border-orange-500/30">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-orange-500/20 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-orange-400" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white">Personel İş Yükü</h2>
              <p className="text-slate-400 text-sm">Günlük kapasite analizi</p>
            </div>
          </div>

          <div className="space-y-3">
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
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="font-medium text-white truncate">{item.title}</h4>
                    <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${getTypeColor(item.type)} flex-shrink-0`}>
                      {item.type.replace("_", " ")}
                    </span>
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
                  <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium border ${getStatusBadge(item.status)}`}>
                    {getStatusIcon(item.status)}
                    {item.status}
                  </span>

                  <select
                    value={item.status}
                    onChange={(e) => handleStatusChange(item.id, e.target.value)}
                    className="px-3 py-1 bg-slate-900 border border-slate-700 rounded-lg text-white text-xs focus:outline-none focus:border-blue-500"
                  >
                    <option value="Planlandı">Planlandı</option>
                    <option value="Yolda">Yolda</option>
                    <option value="Şantiyede">Şantiyede</option>
                    <option value="Tamamlandı">Tamamlandı</option>
                    <option value="İptal">İptal</option>
                  </select>
                </div>
              </div>
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
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Tedarikçi</label>
                <input
                  type="text"
                  value={formData.supplierName}
                  onChange={(e) => setFormData({ ...formData, supplierName: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  placeholder="Örn: Çimşa"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">İletişim</label>
                <input
                  type="text"
                  value={formData.driverContact}
                  onChange={(e) => setFormData({ ...formData, driverContact: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  placeholder="Örn: 0555 123 4567"
                />
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
    </div>
  )
}
