"use client"
/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * This code is the property of NXA Software.
 */


import { useState, useEffect } from "react"
import { Shield, User, Package, PenTool, Calendar, CheckCircle, Search } from "lucide-react"

interface Personnel {
  id: string
  name: string
  role?: string
  department: string
  personnelNo: string
}

interface PPEDelivery {
  id: string
  equipment: string[]
  signature: string
  date: string
  status: string
  personel: {
    id: string
    name: string
    personnelNo: string
    department: string
  }
}

export default function PPEFormsPage() {
  const [selectedWorker, setSelectedWorker] = useState("")
  const [selectedEquipment, setSelectedEquipment] = useState<string[]>([])
  const [signature, setSignature] = useState("")
  const [workers, setWorkers] = useState<Personnel[]>([])
  const [deliveries, setDeliveries] = useState<PPEDelivery[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  const equipment = [
    { id: 1, name: "Güvenlik Bareti", icon: "🪖", category: "Baş Koruma" },
    { id: 2, name: "Gözlük", icon: "🥽", category: "Göz Koruma" },
    { id: 3, name: "Kulaklık", icon: "🎧", category: "Kulak Koruma" },
    { id: 4, name: "Eldiven", icon: "🧤", category: "El Koruma" },
    { id: 5, name: "Güvenlik Ayakkabısı", icon: "👢", category: "Ayak Koruma" },
    { id: 6, name: "Yelek", icon: "🦺", category: "Görünürlük" },
    { id: 7, name: "Solunum Maskesi", icon: "😷", category: "Solunum Koruma" },
    { id: 8, name: "Emniyet Kemeri", icon: "🔗", category: "Düşme Koruma" }
  ]

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [workersRes, deliveriesRes] = await Promise.all([
        fetch('/api/admin/personnel'),
        fetch('/api/admin/ppe-deliveries')
      ])
      
      if (workersRes.ok) {
        const workersData = await workersRes.json()
        setWorkers(workersData)
      }
      
      if (deliveriesRes.ok) {
        const deliveriesData = await deliveriesRes.json()
        const normalizedDeliveries = Array.isArray(deliveriesData)
          ? deliveriesData.map((delivery: any) => {
              let parsedEquipment = []
              if (Array.isArray(delivery.equipment)) {
                parsedEquipment = delivery.equipment
              } else if (typeof delivery.equipment === 'string') {
                try {
                  parsedEquipment = JSON.parse(delivery.equipment)
                  if (!Array.isArray(parsedEquipment)) parsedEquipment = [parsedEquipment]
                } catch (e) {
                  parsedEquipment = String(delivery.equipment).split(',').map((s: string) => s.trim())
                }
              }

              return {
                ...delivery,
                equipment: Array.isArray(parsedEquipment) ? parsedEquipment : []
              }
            })
          : []
        setDeliveries(normalizedDeliveries)
      }
    } catch (error) {
      console.error('Failed to fetch data:', error)
    } finally {
      setLoading(false)
    }
  }

  const toggleEquipment = (equipmentId: number) => {
    setSelectedEquipment(prev =>
      prev.includes(equipmentId.toString())
        ? prev.filter(id => id !== equipmentId.toString())
        : [...prev, equipmentId.toString()]
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    
    try {
      const equipmentNames = selectedEquipment.map(id => 
        equipment.find(eq => eq.id === parseInt(id))?.name
      ).filter(Boolean)

      const response = await fetch('/api/admin/ppe-deliveries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          equipment: equipmentNames,
          signature,
          personelId: selectedWorker
        })
      })

      if (response.ok) {
        setSelectedWorker('')
        setSelectedEquipment([])
        setSignature('')
        fetchData()
      }
    } catch (error) {
      console.error('Failed to submit delivery:', error)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white flex items-center gap-3">
          <Shield className="w-8 h-8 text-blue-400" />
          KKD Dijital Zimmet Sistemi
        </h1>
        <p className="text-slate-400 mt-1">Kişisel Koruyucu Donanım teslimatı ve dijital imza takibi</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Delivery Form */}
        <div className="bg-slate-800/50 backdrop-blur-lg rounded-xl border border-slate-700 p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Package className="w-5 h-5 text-blue-400" />
            Yeni Teslimat Oluştur
          </h3>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Worker Selection */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2 flex items-center gap-2">
                <User className="w-4 h-4" />
                Personel Seçimi *
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <select
                  value={selectedWorker}
                  onChange={(e) => setSelectedWorker(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500 appearance-none cursor-pointer"
                  required
                >
                  <option value="">Personel Seçin...</option>
                  {workers.map(worker => (
                    <option key={worker.id} value={worker.id}>
                      {worker.name} - {worker.role || 'Personel'} ({worker.department})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Equipment Selection */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Ekipman Seçimi *</label>
              <div className="grid grid-cols-2 gap-2">
                {equipment.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => toggleEquipment(item.id)}
                    className={`p-3 rounded-lg border-2 transition-all text-left ${
                      selectedEquipment.includes(item.id.toString())
                        ? 'border-blue-500 bg-blue-500/20'
                        : 'border-slate-600 bg-slate-700/50 hover:border-slate-500'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{item.icon}</span>
                      <div>
                        <div className="text-sm font-medium text-white">{item.name}</div>
                        <div className="text-xs text-slate-400">{item.category}</div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Digital Signature */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2 flex items-center gap-2">
                <PenTool className="w-4 h-4" />
                Dijital İmza *
              </label>
              <div className="bg-slate-700 border-2 border-slate-600 rounded-lg p-4">
                <input
                  type="text"
                  value={signature}
                  onChange={(e) => setSignature(e.target.value)}
                  className="w-full bg-transparent text-white text-lg focus:outline-none placeholder-slate-500"
                  placeholder="İmzanızı buraya yazın..."
                  required
                />
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Bu imza, ekipman teslimatını onaylamanızı temsil eder.
              </p>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <CheckCircle className="w-5 h-5" />
              {submitting ? 'Gönderiliyor...' : 'Teslimatı Onayla'}
            </button>
          </form>
        </div>

        {/* Recent Deliveries */}
        <div className="bg-slate-800/50 backdrop-blur-lg rounded-xl border border-slate-700 p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-400" />
            Son Teslimatlar
          </h3>

          {loading ? (
            <div className="text-center text-slate-400 py-8">Yükleniyor...</div>
          ) : (
            <div className="space-y-3">
              {deliveries.map((delivery) => {
                let parsedEquipment = []
                if (Array.isArray(delivery.equipment)) {
                  parsedEquipment = delivery.equipment
                } else if (typeof delivery.equipment === 'string') {
                  try {
                    parsedEquipment = JSON.parse(delivery.equipment)
                    if (!Array.isArray(parsedEquipment)) parsedEquipment = [parsedEquipment]
                  } catch (e) {
                    parsedEquipment = String(delivery.equipment).split(',').map((s: string) => s.trim())
                  }
                }

                return (
                  <div key={delivery.id} className="p-4 bg-slate-900/50 rounded-lg border border-slate-700">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-slate-400" />
                        <span className="font-medium text-white">{delivery.personel.name}</span>
                      </div>
                      <span className="text-xs text-slate-400 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(delivery.date).toLocaleDateString('tr-TR')}
                      </span>
                    </div>

                    <div className="mb-3">
                      <div className="text-xs text-slate-400 mb-1">Teslim Edilen Ekipmanlar:</div>
                      <div className="flex flex-wrap gap-1">
                        {Array.isArray(parsedEquipment) && parsedEquipment.map((item: string, idx: number) => (
                          <span
                            key={idx}
                            className="text-xs px-2 py-1 bg-blue-500/20 text-blue-400 rounded-full"
                          >
                            {item}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-slate-700">
                      <div className="flex items-center gap-2">
                        <PenTool className="w-3 h-3 text-slate-400" />
                        <span className="text-xs text-slate-400">İmza:</span>
                        <span className="text-xs font-medium text-white">{delivery.signature}</span>
                      </div>
                      <span className="text-xs px-2 py-1 bg-green-500/20 text-green-400 rounded-full flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" />
                        {delivery.status}
                      </span>
                    </div>
                  </div>
                )
              })}
              {deliveries.length === 0 && (
                <div className="text-center text-slate-400 py-8">Henüz teslimat yok</div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
        <div className="bg-slate-800/50 backdrop-blur-lg rounded-xl border border-slate-700 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
              <Package className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <div className="text-xl font-bold text-white">{deliveries.length}</div>
              <div className="text-xs text-slate-400">Toplam Teslimat</div>
            </div>
          </div>
        </div>
        <div className="bg-slate-800/50 backdrop-blur-lg rounded-xl border border-slate-700 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
              <User className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <div className="text-xl font-bold text-white">{workers.length}</div>
              <div className="text-xs text-slate-400">Personel Sayısı</div>
            </div>
          </div>
        </div>
        <div className="bg-slate-800/50 backdrop-blur-lg rounded-xl border border-slate-700 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-yellow-500/20 flex items-center justify-center">
              <Shield className="w-5 h-5 text-yellow-400" />
            </div>
            <div>
              <div className="text-xl font-bold text-white">8</div>
              <div className="text-xs text-slate-400">Ekipman Tipi</div>
            </div>
          </div>
        </div>
        <div className="bg-slate-800/50 backdrop-blur-lg rounded-xl border border-slate-700 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <div className="text-xl font-bold text-white">{deliveries.length > 0 ? '100%' : '0%'}</div>
              <div className="text-xs text-slate-400">İmza Oranı</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
