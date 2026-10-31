"use client"
/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * This code is the property of NXA Software.
 */


import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { toast } from "react-hot-toast"
import { Html5Qrcode } from "html5-qrcode"

export default function InventoryPage() {
  const router = useRouter()
  
  // Basit yetki kontrolü (İleride auth modülüne bağlanacak)
  const userPermissions: string[] = [] // Boş ise SUPER_ADMIN olarak kabul edilir
  const isAdmin = userPermissions.length === 0

  if (!isAdmin && !userPermissions.includes("INVENTORY")) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Erişim Engellendi</h1>
          <p className="text-slate-400 mb-6">Bu sayfayı görme yetkiniz yok.</p>
          <button
            onClick={() => router.push('/admin')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-colors"
          >
            Ana Sayfaya Dön
          </button>
        </div>
      </div>
    )
  }

  const [inventory, setInventory] = useState<any[]>([])
  const [equipment, setEquipment] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'materials' | 'equipment'>('materials')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isEquipmentModalOpen, setIsEquipmentModalOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isStockModalOpen, setIsStockModalOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<any>(null)
  
  const [formData, setFormData] = useState({
    name: "",
    category: "",
    quantity: "",
    unit: "",
    location: ""
  })

  const [equipmentFormData, setEquipmentFormData] = useState({
    name: "",
    type: "",
    serialNumber: "",
    category: ""
  })

  const [stockFormData, setStockFormData] = useState({
    operationType: "add",
    quantity: ""
  })

  const [isQrModalOpen, setIsQrModalOpen] = useState(false)
  const [qrScannedData, setQrScannedData] = useState("")
  const [isScanning, setIsScanning] = useState(false)
  const qrRef = useRef<Html5Qrcode | null>(null)
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false)
  const [personnel, setPersonnel] = useState<any[]>([])
  const [selectedPersonnelId, setSelectedPersonnelId] = useState("")
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false)
  const [inventoryHistory, setInventoryHistory] = useState<any[]>([])

  useEffect(() => {
    fetchInventory()
    fetchEquipment()
    fetchPersonnel()
  }, [])

  const fetchInventory = async () => {
    try {
      const response = await fetch("/api/admin/inventory")
      if (response.ok) {
        const data = await response.json()
        setInventory(data)
      }
    } catch (error) {
      console.error("Failed to fetch inventory:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchEquipment = async () => {
    try {
      const response = await fetch("/api/admin/equipments")
      if (response.ok) {
        const data = await response.json()
        setEquipment(data)
      }
    } catch (error) {
      console.error("Failed to fetch equipment:", error)
    }
  }

  const fetchPersonnel = async () => {
    try {
      const response = await fetch("/api/admin/personnel")
      if (response.ok) {
        const data = await response.json()
        setPersonnel(data)
      }
    } catch (error) {
      console.error("Failed to fetch personnel:", error)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name || !formData.quantity || !formData.unit) {
      toast.error("Malzeme adı, miktar ve birim zorunludur")
      return
    }

    setIsSubmitting(true)
    try {
      const response = await fetch("/api/admin/inventory", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        toast.success("Malzeme başarıyla eklendi")
        fetchInventory()
        closeModal()
      } else {
        toast.error("Malzeme eklenirken hata oluştu")
      }
    } catch (error) {
      toast.error("Malzeme eklenirken hata oluştu")
    } finally {
      setIsSubmitting(false)
    }
  }

  const openModal = () => {
    setFormData({
      name: "",
      category: "",
      quantity: "",
      unit: "",
      location: ""
    })
    setIsModalOpen(true)
  }

  const openEquipmentModal = () => {
    setEquipmentFormData({
      name: "",
      type: "",
      serialNumber: "",
      category: ""
    })
    setIsEquipmentModalOpen(true)
  }

  const closeEquipmentModal = () => {
    setIsEquipmentModalOpen(false)
    setEquipmentFormData({
      name: "",
      type: "",
      serialNumber: "",
      category: ""
    })
  }

  const handleBleScan = async () => {
    try {
      // Check if Web Bluetooth API is supported
      if (!navigator.bluetooth) {
        toast.error("Web Bluetooth API bu tarayıcıda desteklenmiyor. Lütfen Chrome veya Edge kullanın.")
        return
      }

      // Request device from user
      const device = await navigator.bluetooth.requestDevice({
        acceptAllDevices: true
      })

      // Use device.id or device.name as serial number
      const deviceId = device.id || device.name
      
      if (deviceId) {
        setEquipmentFormData({ ...equipmentFormData, serialNumber: deviceId })
        toast.success(`Cihaz tarandı: ${device.name || deviceId}`)
      }
    } catch (error) {
      console.error("BLE scan error:", error)
      if (error instanceof Error) {
        if (error.name === 'NotFoundError') {
          toast.error("Cihaz seçilmedi")
        } else if (error.message.includes('User cancelled')) {
          toast("İptal edildi")
        } else {
          toast.error(`BLE tarama hatası: ${error.message}`)
        }
      } else {
        toast.error("BLE tarama hatası oluştu")
      }
    }
  }

  const handleEquipmentSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!equipmentFormData.name || !equipmentFormData.serialNumber) {
      toast.error("Demirbaş adı ve seri numarası zorunludur")
      return
    }

    setIsSubmitting(true)
    try {
      const response = await fetch("/api/admin/equipments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(equipmentFormData)
      })

      if (response.ok) {
        toast.success("Demirbaş başarıyla eklendi")
        fetchEquipment()
        closeEquipmentModal()
      } else {
        toast.error("Demirbaş eklenirken hata oluştu")
      }
    } catch (error) {
      toast.error("Demirbaş eklenirken hata oluştu")
    } finally {
      setIsSubmitting(false)
    }
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setFormData({
      name: "",
      category: "",
      quantity: "",
      unit: "",
      location: ""
    })
  }

  const openStockModal = (item: any) => {
    setSelectedItem(item)
    setStockFormData({
      operationType: "add",
      quantity: ""
    })
    setIsStockModalOpen(true)
  }

  const closeStockModal = () => {
    setIsStockModalOpen(false)
    setSelectedItem(null)
    setStockFormData({
      operationType: "add",
      quantity: ""
    })
  }

  const handleStockSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!selectedItem || !stockFormData.quantity) {
      toast.error("Miktar zorunludur")
      return
    }

    setIsSubmitting(true)
    try {
      const quantity = parseFloat(stockFormData.quantity)
      const newQuantity = stockFormData.operationType === "add" 
        ? selectedItem.quantity + quantity
        : selectedItem.quantity - quantity

      if (newQuantity < 0) {
        toast.error("Stok negatif olamaz")
        setIsSubmitting(false)
        return
      }

      const response = await fetch(`/api/admin/inventory/${selectedItem.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          quantity: newQuantity,
          operationType: stockFormData.operationType,
          changeAmount: quantity
        })
      })

      if (response.ok) {
        toast.success(
          stockFormData.operationType === "add" 
            ? `Stok başarıyla eklendi (+${quantity})` 
            : `Stok başarıyla düşüldü (-${quantity})`
        )
        fetchInventory()
        router.refresh()
        closeStockModal()
      } else {
        toast.error("Stok işlemi başarısız")
      }
    } catch (error) {
      toast.error("Stok işlemi başarısız")
    } finally {
      setIsSubmitting(false)
    }
  }

  const startQrScanner = async () => {
    setIsQrModalOpen(true)
    setIsScanning(true)
    setQrScannedData("")

    try {
      const html5QrCode = new Html5Qrcode("qr-reader")
      qrRef.current = html5QrCode

      const config = { fps: 10, qrbox: { width: 250, height: 250 } }
      
      await html5QrCode.start(
        { facingMode: "environment" },
        config,
        (decodedText) => {
          setQrScannedData(decodedText)
          setIsScanning(false)
          html5QrCode.stop()
          toast.success(`QR kod okundu: ${decodedText}`)
        },
        (errorMessage) => {
          // Hataları görmezden gel (sürekli tarama sırasında)
        }
      )
    } catch (error) {
      console.error("QR scanner başlatılamadı:", error)
      toast.error("QR tarayıcı başlatılamadı")
      setIsScanning(false)
    }
  }

  const stopQrScanner = async () => {
    if (qrRef.current && isScanning) {
      try {
        await qrRef.current.stop()
      } catch (error) {
        console.error("QR tarayıcı durdurulamadı:", error)
      }
    }
    setIsQrModalOpen(false)
    setIsScanning(false)
    setQrScannedData("")
  }

  const handleManualQrInput = (e: React.FormEvent) => {
    e.preventDefault()
    if (qrScannedData.trim()) {
      toast.success(`Barkod girildi: ${qrScannedData}`)
      // Burada barkod ile ilgili stok çıkış işlemi yapılabilir
      // Şimdilik sadece simüle ediyoruz
      stopQrScanner()
    }
  }

  const openAssignModal = (item: any) => {
    setSelectedItem(item)
    setSelectedPersonnelId("")
    setIsAssignModalOpen(true)
  }

  const closeAssignModal = () => {
    setIsAssignModalOpen(false)
    setSelectedItem(null)
    setSelectedPersonnelId("")
  }

  const handleAssignSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!selectedItem || !selectedPersonnelId) {
      toast.error("Personel seçimi zorunludur")
      return
    }

    setIsSubmitting(true)
    try {
      const response = await fetch(`/api/admin/inventory/${selectedItem.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          assignedToId: selectedPersonnelId
        })
      })

      if (response.ok) {
        toast.success("Malzeme başarıyla zimmetlendi")
        fetchInventory()
        closeAssignModal()
      } else {
        toast.error("Zimmetleme işlemi başarısız")
      }
    } catch (error) {
      toast.error("Zimmetleme işlemi başarısız")
    } finally {
      setIsSubmitting(false)
    }
  }

  const openHistoryModal = async (item: any) => {
    setSelectedItem(item)
    setIsHistoryModalOpen(true)
    
    try {
      const response = await fetch(`/api/admin/inventory/${item.id}/history`)
      if (response.ok) {
        const data = await response.json()
        setInventoryHistory(data)
      }
    } catch (error) {
      console.error("Failed to fetch inventory history:", error)
      toast.error("Tarihçe yüklenirken hata oluştu")
    }
  }

  const closeHistoryModal = () => {
    setIsHistoryModalOpen(false)
    setSelectedItem(null)
    setInventoryHistory([])
  }

  if (isLoading) {
    return (
      <div className="lg:mt-0 mt-16">
        <div className="text-white">Yükleniyor...</div>
      </div>
    )
  }

  return (
    <div className="lg:mt-0 mt-16 p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
            Ambar & Karekod
          </h1>
          <p className="text-slate-400 mt-1">Sarf malzemeleri ve takipli demirbaş yönetimi</p>
        </div>
        <div className="flex gap-3">
          {activeTab === 'materials' ? (
            <button
              onClick={openModal}
              className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-500 hover:to-emerald-500 transition-all font-medium flex items-center gap-2 shadow-lg shadow-green-900/20"
            >
              ➕ Yeni Malzeme Ekle
            </button>
          ) : (
            <button
              onClick={openEquipmentModal}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-500 hover:to-indigo-500 transition-all font-medium flex items-center gap-2 shadow-lg shadow-blue-900/20"
            >
              ➕ Yeni Demirbaş Ekle
            </button>
          )}
          <button 
            onClick={startQrScanner}
            className="px-6 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-xl hover:from-cyan-500 hover:to-blue-500 transition-all font-medium flex items-center gap-2 shadow-lg shadow-cyan-900/20"
          >
            📷 QR ile Çıkış Yap
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveTab('materials')}
          className={`px-6 py-3 rounded-xl font-medium transition-all ${
            activeTab === 'materials'
              ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-900/20'
              : 'bg-slate-800/50 text-slate-400 hover:bg-slate-800 border border-slate-700/50'
          }`}
        >
          📦 Sarf Malzemeler
        </button>
        <button
          onClick={() => setActiveTab('equipment')}
          className={`px-6 py-3 rounded-xl font-medium transition-all ${
            activeTab === 'equipment'
              ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-900/20'
              : 'bg-slate-800/50 text-slate-400 hover:bg-slate-800 border border-slate-700/50'
          }`}
        >
          🔧 Takipli Demirbaşlar
        </button>
      </div>

      {/* Materials Tab */}
      {activeTab === 'materials' && (
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-700/50 shadow-lg">
          <h2 className="text-xl font-semibold text-white mb-6">Stoktaki Malzemeler</h2>
          
          {inventory.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              Henüz stok kaydı yok
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-700/50 bg-slate-900/50">
                    <th className="text-left py-4 px-4 text-slate-400 font-medium">Malzeme Adı</th>
                    <th className="text-left py-4 px-4 text-slate-400 font-medium">Miktar</th>
                    <th className="text-left py-4 px-4 text-slate-400 font-medium">Birim</th>
                    <th className="text-left py-4 px-4 text-slate-400 font-medium">Kategori</th>
                    <th className="text-left py-4 px-4 text-slate-400 font-medium">Lokasyon</th>
                    <th className="text-left py-4 px-4 text-slate-400 font-medium">Zimmetli</th>
                    <th className="text-left py-4 px-4 text-slate-400 font-medium">İşlemler</th>
                  </tr>
                </thead>
                <tbody>
                  {inventory.map((item) => (
                    <tr key={item.id} className="border-b border-slate-700/30 hover:bg-slate-700/30 transition-colors">
                      <td className="py-4 px-4 text-white font-medium">{item.name}</td>
                      <td className="py-4 px-4 text-white">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                          item.quantity > 10 ? 'bg-emerald-900/50 text-emerald-400' : 
                          item.quantity > 0 ? 'bg-yellow-900/50 text-yellow-400' : 
                          'bg-red-900/50 text-red-400'
                        }`}>
                          {item.quantity}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-white">{item.unit}</td>
                      <td className="py-4 px-4 text-white">{item.category || "-"}</td>
                      <td className="py-4 px-4 text-white">{item.location || "-"}</td>
                      <td className="py-4 px-4 text-white">
                        {item.assignments && item.assignments.length > 0 ? (
                          <div className="text-xs">
                            {item.assignments.map((assignment: any, idx: number) => (
                              <div key={assignment.id} className="flex items-center gap-1">
                                <span className="px-2 py-1 bg-blue-900/50 text-blue-400 rounded">
                                  {assignment.worker?.firstName} {assignment.worker?.lastName}
                                </span>
                                <span className="text-slate-400">({assignment.quantity})</span>
                                {idx < item.assignments.length - 1 && <span className="text-slate-600">, </span>}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span className="text-slate-500">-</span>
                        )}
                      </td>
                      <td className="py-4 px-4">
                        <Link
                          href={`/admin/inventory/${item.id}`}
                          className="px-4 py-2 bg-slate-700/50 text-white rounded-lg hover:bg-slate-700 transition-colors text-sm font-medium flex items-center gap-2 border border-slate-600/50"
                        >
                          🔍 İncele / Detay
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Equipment Tab */}
      {activeTab === 'equipment' && (
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-700/50 shadow-lg">
          <h2 className="text-xl font-semibold text-white mb-6">Takipli Demirbaşlar (BLE Hazırlığı)</h2>
          
          {equipment.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              Henüz demirbaş kaydı yok
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-700/50 bg-slate-900/50">
                    <th className="text-left py-4 px-4 text-slate-400 font-medium">Demirbaş Adı</th>
                    <th className="text-left py-4 px-4 text-slate-400 font-medium">Seri No / MAC</th>
                    <th className="text-left py-4 px-4 text-slate-400 font-medium">Tür</th>
                    <th className="text-left py-4 px-4 text-slate-400 font-medium">Kategori</th>
                    <th className="text-left py-4 px-4 text-slate-400 font-medium">Durum</th>
                    <th className="text-left py-4 px-4 text-slate-400 font-medium">Zimmetli</th>
                    <th className="text-left py-4 px-4 text-slate-400 font-medium">İşlemler</th>
                  </tr>
                </thead>
                <tbody>
                  {equipment.map((item) => (
                    <tr key={item.id} className="border-b border-slate-700/30 hover:bg-slate-700/30 transition-colors">
                      <td className="py-4 px-4 text-white font-medium">{item.name}</td>
                      <td className="py-4 px-4 text-white font-mono text-sm">{item.serialNumber}</td>
                      <td className="py-4 px-4 text-white">{item.type || "-"}</td>
                      <td className="py-4 px-4 text-white">{item.category || "-"}</td>
                      <td className="py-4 px-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          item.status === 'AVAILABLE' ? 'bg-emerald-900/50 text-emerald-400' :
                          item.status === 'ASSIGNED' ? 'bg-blue-900/50 text-blue-400' :
                          item.status === 'MAINTENANCE' ? 'bg-orange-900/50 text-orange-400' :
                          'bg-slate-700/50 text-slate-400'
                        }`}>
                          {item.status === 'AVAILABLE' ? 'Müsait' :
                           item.status === 'ASSIGNED' ? 'Zimmetli' :
                           item.status === 'MAINTENANCE' ? 'Bakımda' : item.status}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-white">
                        {item.assignedTo ? (
                          <span className="px-2 py-1 bg-blue-900/50 text-blue-400 rounded text-sm">
                            {item.assignedTo.name}
                          </span>
                        ) : (
                          <span className="text-slate-500">-</span>
                        )}
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex gap-2">
                          <button
                            onClick={() => openAssignModal(item)}
                            className="px-3 py-2 bg-blue-600/20 text-blue-400 rounded-lg hover:bg-blue-600/30 transition-colors text-sm font-medium border border-blue-600/30"
                          >
                            👤 Zimmetle
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

      {/* Add Item Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-700/50 w-full max-w-lg mx-4 shadow-2xl">
            <h3 className="text-xl font-semibold text-white mb-6">Yeni Malzeme Ekle</h3>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Malzeme Adı *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Kategori</label>
                <input
                  type="text"
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 text-white"
                  placeholder="Örn: Çimento, Demir vb."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Miktar *</label>
                  <input
                    type="number"
                    name="quantity"
                    value={formData.quantity}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 text-white"
                    required
                    step="0.01"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Birim *</label>
                  <select
                    name="unit"
                    value={formData.unit}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 text-white"
                    required
                  >
                    <option value="">Birim Seçin</option>
                    <option value="adet">Adet</option>
                    <option value="kg">Kg</option>
                    <option value="ton">Ton</option>
                    <option value="m">Metre</option>
                    <option value="m2">m²</option>
                    <option value="m3">m³</option>
                    <option value="litre">Litre</option>
                    <option value="paket">Paket</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Lokasyon</label>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 text-white"
                  placeholder="Örn: Ambar A1"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 px-4 py-3 bg-slate-700/50 text-white rounded-xl hover:bg-slate-700 transition-colors"
                  disabled={isSubmitting}
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-500 hover:to-emerald-500 transition-all"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Ekleniyor..." : "Ekle"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Equipment Modal */}
      {isEquipmentModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-700/50 w-full max-w-lg mx-4 shadow-2xl">
            <h3 className="text-xl font-semibold text-white mb-6">Yeni Demirbaş Ekle</h3>
            
            <form onSubmit={handleEquipmentSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Demirbaş Adı *</label>
                <input
                  type="text"
                  name="name"
                  value={equipmentFormData.name}
                  onChange={(e) => setEquipmentFormData({ ...equipmentFormData, name: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                  required
                  placeholder="Örn: Bosch Kırıcı Delici 1"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Seri No / MAC Adresi *</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    name="serialNumber"
                    value={equipmentFormData.serialNumber}
                    onChange={(e) => setEquipmentFormData({ ...equipmentFormData, serialNumber: e.target.value })}
                    className="flex-1 px-4 py-3 bg-slate-900/50 border border-slate-700/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-white font-mono"
                    required
                    placeholder="Örn: AA:BB:CC:DD:EE:FF veya SN123456"
                  />
                  <button
                    type="button"
                    onClick={handleBleScan}
                    className="px-4 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-xl hover:from-cyan-500 hover:to-blue-500 transition-all font-medium flex items-center gap-2 shadow-lg shadow-cyan-900/20"
                    title="BLE Cihaz Tara"
                  >
                    📡 BLE Tara
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Tür</label>
                <select
                  name="type"
                  value={equipmentFormData.type}
                  onChange={(e) => setEquipmentFormData({ ...equipmentFormData, type: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                >
                  <option value="">Tür Seçin</option>
                  <option value="ARAC">Araç</option>
                  <option value="IS_MAKINESI">İş Makinesi</option>
                  <option value="ELEKTRONIK">Elektronik</option>
                  <option value="DIGER">Diğer</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Kategori</label>
                <input
                  type="text"
                  name="category"
                  value={equipmentFormData.category}
                  onChange={(e) => setEquipmentFormData({ ...equipmentFormData, category: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                  placeholder="Örn: Hilti, Drone, Jeneratör vb."
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={closeEquipmentModal}
                  className="flex-1 px-4 py-3 bg-slate-700/50 text-white rounded-xl hover:bg-slate-700 transition-colors"
                  disabled={isSubmitting}
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-500 hover:to-indigo-500 transition-all"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Ekleniyor..." : "Ekle"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Stock Operation Modal */}
      {isStockModalOpen && selectedItem && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-slate-900 rounded-xl p-6 border border-slate-800 w-full max-w-md mx-4 shadow-2xl">
            <h3 className="text-xl font-semibold text-white mb-4">Stok İşlemi</h3>
            
            {/* Stock Info */}
            <div className="bg-slate-800 rounded-lg p-4 mb-6 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-slate-400 text-sm">Malzeme:</span>
                <span className="text-white font-medium">{selectedItem.name}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400 text-sm">Mevcut Stok:</span>
                <span className="text-emerald-400 font-bold">{selectedItem.quantity} {selectedItem.unit}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400 text-sm">Son İşlem Tarihi:</span>
                <span className="text-white text-sm">
                  {selectedItem.updatedAt 
                    ? new Date(selectedItem.updatedAt).toLocaleString("tr-TR")
                    : "Bilinmiyor"}
                </span>
              </div>
            </div>
            
            <form onSubmit={handleStockSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">İşlem Tipi</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setStockFormData({ ...stockFormData, operationType: "add" })}
                    className={`px-4 py-3 rounded-lg border-2 transition-colors ${
                      stockFormData.operationType === "add"
                        ? "border-green-500 bg-green-500/20 text-green-400"
                        : "border-slate-700 bg-slate-800 text-slate-400 hover:border-slate-600"
                    }`}
                  >
                    ➕ Stok Ekle
                  </button>
                  <button
                    type="button"
                    onClick={() => setStockFormData({ ...stockFormData, operationType: "remove" })}
                    className={`px-4 py-3 rounded-lg border-2 transition-colors ${
                      stockFormData.operationType === "remove"
                        ? "border-red-500 bg-red-500/20 text-red-400"
                        : "border-slate-700 bg-slate-800 text-slate-400 hover:border-slate-600"
                    }`}
                  >
                    ➖ Stok Düş
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Miktar *</label>
                <input
                  type="number"
                  value={stockFormData.quantity}
                  onChange={(e) => setStockFormData({ ...stockFormData, quantity: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-white"
                  required
                  step="0.01"
                  min="0"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={closeStockModal}
                  className="flex-1 px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors"
                  disabled={isSubmitting}
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className={`flex-1 px-4 py-2 text-white rounded-lg transition-colors ${
                    stockFormData.operationType === "add"
                      ? "bg-green-600 hover:bg-green-500"
                      : "bg-red-600 hover:bg-red-500"
                  }`}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "İşleniyor..." : stockFormData.operationType === "add" ? "Ekle" : "Düş"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QR Scanner Modal */}
      {isQrModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-slate-900 rounded-xl p-6 border border-slate-800 w-full max-w-lg mx-4 shadow-2xl">
            <h3 className="text-xl font-semibold text-white mb-4">QR / Barkod Tarayıcı</h3>
            
            <div className="space-y-4">
              {isScanning ? (
                <div className="bg-slate-800 rounded-lg p-4">
                  <div id="qr-reader" className="w-full" style={{ minHeight: "250px" }}></div>
                  <p className="text-center text-slate-400 mt-3">Kamerayı barkoda/QR koda yönlendirin...</p>
                </div>
              ) : qrScannedData ? (
                <div className="bg-emerald-900/20 border border-emerald-600 rounded-lg p-4">
                  <p className="text-emerald-400 font-medium mb-2">✅ Okunan Veri:</p>
                  <div className="flex items-center gap-2">
                    <p className="text-white text-lg break-all flex-1">{qrScannedData}</p>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(qrScannedData)
                        toast.success("Kopyalandı!")
                      }}
                      className="px-2 py-1 bg-emerald-600 text-white rounded hover:bg-emerald-500 transition-colors text-sm"
                      title="Kopyala"
                    >
                      📋
                    </button>
                  </div>
                </div>
              ) : (
                <div className="bg-slate-800 rounded-lg p-4">
                  <p className="text-center text-slate-400">Tarayıcı başlatılıyor...</p>
                </div>
              )}

              {!isScanning && !qrScannedData && (
                <form onSubmit={handleManualQrInput} className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Manuel Barkod No Gir</label>
                    <input
                      type="text"
                      value={qrScannedData}
                      onChange={(e) => setQrScannedData(e.target.value)}
                      className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                      placeholder="Barkod numarasını girin..."
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-colors"
                  >
                    İşlemi Başlat
                  </button>
                </form>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  onClick={stopQrScanner}
                  className="flex-1 px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors"
                >
                  Kapat
                </button>
                {qrScannedData && (
                  <button
                    onClick={() => {
                      toast.success("Stok çıkış formu dolduruluyor...")
                      // Burada ilgili malzemeyi bulup stok modalını açabiliriz
                      stopQrScanner()
                    }}
                    className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-500 transition-colors"
                  >
                    Çıkış Yap
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Assignment Modal */}
      {isAssignModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-slate-900 rounded-xl p-6 border border-slate-800 w-full max-w-lg mx-4 shadow-2xl">
            <h3 className="text-xl font-semibold text-white mb-4">👤 Malzeme Zimmetleme</h3>
            
            <div className="bg-slate-800 rounded-lg p-4 mb-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-slate-400 text-sm">Malzeme:</span>
                <span className="text-white font-medium">{selectedItem.name}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400 text-sm">Mevcut Stok:</span>
                <span className="text-emerald-400 font-bold">{selectedItem.quantity} {selectedItem.unit}</span>
              </div>
            </div>
            
            <form onSubmit={handleAssignSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Personel Seçin *</label>
                <select
                  value={selectedPersonnelId}
                  onChange={(e) => setSelectedPersonnelId(e.target.value)}
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                  required
                >
                  <option value="">Personel Seçin</option>
                  {personnel.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} - {p.department}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={closeAssignModal}
                  className="flex-1 px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors"
                  disabled={isSubmitting}
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-colors"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "İşleniyor..." : "Zimmetle"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* History Modal */}
      {isHistoryModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-slate-900 rounded-xl p-6 border border-slate-800 w-full max-w-2xl mx-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold text-white">📜 Malzeme Tarihçesi</h3>
              <button
                onClick={closeHistoryModal}
                className="text-slate-400 hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>
            
            <div className="bg-slate-800 rounded-lg p-4 mb-4">
              <div className="flex justify-between items-center">
                <span className="text-slate-400 text-sm">Malzeme:</span>
                <span className="text-white font-medium">{selectedItem.name}</span>
              </div>
              <div className="flex justify-between items-center mt-2">
                <span className="text-slate-400 text-sm">Mevcut Stok:</span>
                <span className="text-emerald-400 font-bold">{selectedItem.quantity} {selectedItem.unit}</span>
              </div>
            </div>
            
            {inventoryHistory.length === 0 ? (
              <div className="text-center py-8 text-slate-400">
                Tarihçe kaydı bulunmuyor
              </div>
            ) : (
              <div className="space-y-4">
                {inventoryHistory.map((history) => (
                  <div key={history.id} className="bg-slate-800 rounded-lg p-4 border border-slate-700">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          history.action === "CREATED" ? "bg-green-900/50 text-green-400" :
                          history.action === "STOCK_ADDED" ? "bg-blue-900/50 text-blue-400" :
                          history.action === "STOCK_REMOVED" ? "bg-red-900/50 text-red-400" :
                          history.action === "ASSIGNED" ? "bg-purple-900/50 text-purple-400" :
                          history.action === "UNASSIGNED" ? "bg-orange-900/50 text-orange-400" :
                          "bg-slate-700 text-slate-400"
                        }`}>
                          {history.action === "CREATED" ? "Oluşturuldu" :
                           history.action === "STOCK_ADDED" ? "Stok Eklendi" :
                           history.action === "STOCK_REMOVED" ? "Stok Düşüldü" :
                           history.action === "ASSIGNED" ? "Zimmetlendi" :
                           history.action === "UNASSIGNED" ? "Zimmet Kaldırıldı" :
                           history.action}
                        </span>
                        {history.quantity && (
                          <span className="text-white font-medium">
                            {history.quantity} {selectedItem.unit}
                          </span>
                        )}
                      </div>
                      <span className="text-slate-500 text-xs">
                        {new Date(history.createdAt).toLocaleString("tr-TR")}
                      </span>
                    </div>
                    <p className="text-slate-300 text-sm">{history.description}</p>
                    {history.personnel && (
                      <div className="mt-2 flex items-center gap-2">
                        <span className="text-slate-500 text-xs">Personel:</span>
                        <span className="text-white text-sm">{history.personnel.name}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
