"use client"
/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * This code is the property of NXA Software.
 */


import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { toast } from "react-hot-toast"

export default function InventoryDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [inventory, setInventory] = useState<any>(null)
  const [workers, setWorkers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false)
  const [assignForm, setAssignForm] = useState({
    workerId: "",
    quantity: "",
    notes: ""
  })
  const [stockQuantity, setStockQuantity] = useState("")

  useEffect(() => {
    fetchInventory()
    fetchWorkers()
  }, [params.id])

  const fetchInventory = async () => {
    try {
      const response = await fetch(`/api/admin/inventory/${params.id}`)
      if (response.ok) {
        const data = await response.json()
        setInventory(data)
      } else {
        toast.error("Malzeme bulunamadı")
        router.push("/admin/inventory")
      }
    } catch (error) {
      console.error("Failed to fetch inventory:", error)
      toast.error("Malzeme bilgileri yüklenirken hata oluştu")
    } finally {
      setLoading(false)
    }
  }

  const fetchWorkers = async () => {
    try {
      const response = await fetch("/api/admin/workers")
      if (response.ok) {
        const data = await response.json()
        setWorkers(data)
      }
    } catch (error) {
      console.error("Failed to fetch workers:", error)
    }
  }

  const handleStockOperation = async (operation: "add" | "remove") => {
    if (!stockQuantity || !inventory) {
      toast.error("Miktar girin")
      return
    }

    const quantity = parseFloat(stockQuantity)
    const newQuantity = operation === "add" 
      ? inventory.quantity + quantity
      : inventory.quantity - quantity

    if (newQuantity < 0) {
      toast.error("Stok negatif olamaz")
      return
    }

    setIsSubmitting(true)
    try {
      const response = await fetch(`/api/admin/inventory/${inventory.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          quantity: newQuantity,
          operationType: operation,
          changeAmount: quantity
        })
      })

      if (response.ok) {
        toast.success(
          operation === "add" 
            ? `Stok başarıyla eklendi (+${quantity})` 
            : `Stok başarıyla düşüldü (-${quantity})`
        )
        fetchInventory()
        setStockQuantity("")
      } else {
        toast.error("Stok işlemi başarısız")
      }
    } catch (error) {
      toast.error("Stok işlemi başarısız")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleAssignSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!inventory || !assignForm.workerId || !assignForm.quantity) {
      toast.error("Personel ve miktar zorunludur")
      return
    }

    setIsSubmitting(true)
    try {
      const response = await fetch(`/api/admin/inventory/${inventory.id}/assignments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workerId: assignForm.workerId,
          quantity: parseInt(assignForm.quantity),
          notes: assignForm.notes
        })
      })

      if (response.ok) {
        toast.success("Malzeme başarıyla zimmetlendi")
        fetchInventory()
        setIsAssignModalOpen(false)
        setAssignForm({ workerId: "", quantity: "", notes: "" })
      } else {
        const errorData = await response.json()
        toast.error(errorData.error || "Zimmetleme işlemi başarısız")
      }
    } catch (error) {
      toast.error("Zimmetleme işlemi başarısız")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleReturnAssignment = async (assignmentId: string) => {
    if (!inventory) return

    setIsSubmitting(true)
    try {
      const response = await fetch(`/api/admin/inventory/${inventory.id}/assignments`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assignmentId })
      })

      if (response.ok) {
        toast.success("Zimmet başarıyla iade alındı")
        fetchInventory()
      } else {
        toast.error("Zimmet iadesi başarısız")
      }
    } catch (error) {
      toast.error("Zimmet iadesi başarısız")
    } finally {
      setIsSubmitting(false)
    }
  }

  const calculateAvailableQuantity = () => {
    if (!inventory) return 0
    const assignedQuantity = inventory.assignments?.reduce((sum: number, assignment: any) => sum + assignment.quantity, 0) || 0
    return inventory.quantity - assignedQuantity
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-white">Yükleniyor...</div>
      </div>
    )
  }

  if (!inventory) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-white">Malzeme bulunamadı</div>
      </div>
    )
  }

  const availableQuantity = calculateAvailableQuantity()

  return (
    <div className="min-h-screen bg-slate-950 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link
            href="/admin/inventory"
            className="px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition-colors"
          >
            ← Ambara Dön
          </Link>
          <h1 className="text-3xl font-bold text-white">{inventory.name}</h1>
        </div>

        {/* Main Grid */}
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          {/* Card 1: Malzeme Künyesi & Zimmet Durumu */}
          <div className="bg-slate-900 rounded-xl p-6 border border-slate-800">
            <h2 className="text-xl font-semibold text-white mb-4">Malzeme Künyesi</h2>
            
            <div className="space-y-3 mb-6">
              <div className="flex justify-between">
                <span className="text-slate-400">Kategori:</span>
                <span className="text-white">{inventory.category || "-"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Lokasyon:</span>
                <span className="text-white">{inventory.location || "-"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Toplam Stok:</span>
                <span className="text-emerald-400 font-bold">{inventory.quantity} {inventory.unit}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Kullanılabilir:</span>
                <span className="text-blue-400 font-bold">{availableQuantity} {inventory.unit}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Proje:</span>
                <span className="text-white">{inventory.project?.name || "-"}</span>
              </div>
            </div>

            <div className="border-t border-slate-700 pt-4">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-lg font-medium text-white">Aktif Zimmetler</h3>
                <button
                  onClick={() => setIsAssignModalOpen(true)}
                  className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-colors text-sm"
                >
                  + Yeni Zimmet
                </button>
              </div>
              
              {inventory.assignments && inventory.assignments.length === 0 ? (
                <div className="text-center py-4 text-slate-500">
                  Aktif zimmet bulunmuyor
                </div>
              ) : (
                <div className="space-y-2">
                  {inventory.assignments?.map((assignment: any) => (
                    <div key={assignment.id} className="bg-slate-800 rounded-lg p-3 border border-slate-700 flex justify-between items-center">
                      <div>
                        <div className="text-white font-medium">
                          {assignment.worker?.firstName} {assignment.worker?.lastName}
                        </div>
                        <div className="text-slate-400 text-sm">
                          {assignment.quantity} {inventory.unit} - {new Date(assignment.assignedAt).toLocaleDateString("tr-TR")}
                        </div>
                      </div>
                      <button
                        onClick={() => handleReturnAssignment(assignment.id)}
                        disabled={isSubmitting}
                        className="px-3 py-1.5 bg-orange-600 text-white rounded-lg hover:bg-orange-500 transition-colors text-sm"
                      >
                        İade Al
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Card 2: Hızlı Stok İşlemi */}
          <div className="bg-slate-900 rounded-xl p-6 border border-slate-800">
            <h2 className="text-xl font-semibold text-white mb-4">Hızlı Stok İşlemi</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">Miktar</label>
                <input
                  type="number"
                  value={stockQuantity}
                  onChange={(e) => setStockQuantity(e.target.value)}
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-white"
                  placeholder="Miktar girin..."
                  step="0.01"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => handleStockOperation("add")}
                  disabled={isSubmitting}
                  className="px-4 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-500 transition-colors font-medium"
                >
                  ➕ Stok Ekle
                </button>
                <button
                  onClick={() => handleStockOperation("remove")}
                  disabled={isSubmitting}
                  className="px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-500 transition-colors font-medium"
                >
                  ➖ Stok Düş
                </button>
              </div>

              <div className="bg-slate-800 rounded-lg p-4">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 text-sm">Güncel Stok:</span>
                  <span className="text-emerald-400 font-bold text-lg">{inventory.quantity} {inventory.unit}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Card 3: Malzeme Tarihçesi */}
        <div className="bg-slate-900 rounded-xl p-6 border border-slate-800">
          <h2 className="text-xl font-semibold text-white mb-4">Malzeme Tarihçesi</h2>
          
          {inventory.history && inventory.history.length === 0 ? (
            <div className="text-center py-8 text-slate-400">
              Tarihçe kaydı bulunmuyor
            </div>
          ) : (
            <div className="space-y-4">
              {inventory.history?.map((history: any) => (
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
                          {history.quantity} {inventory.unit}
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

      {/* Assignment Modal */}
      {isAssignModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-slate-900 rounded-xl p-6 border border-slate-800 w-full max-w-lg mx-4 shadow-2xl">
            <h3 className="text-xl font-semibold text-white mb-4">Yeni Zimmet Oluştur</h3>
            
            <div className="bg-slate-800 rounded-lg p-4 mb-4">
              <div className="flex justify-between items-center">
                <span className="text-slate-400 text-sm">Kullanılabilir Miktar:</span>
                <span className="text-blue-400 font-bold">{availableQuantity} {inventory.unit}</span>
              </div>
            </div>

            <form onSubmit={handleAssignSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">İşçi Seçin *</label>
                <select
                  value={assignForm.workerId}
                  onChange={(e) => setAssignForm({ ...assignForm, workerId: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                  required
                >
                  <option value="">İşçi Seçin</option>
                  {workers.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.firstName} {w.lastName} - {w.team}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Miktar *</label>
                <input
                  type="number"
                  value={assignForm.quantity}
                  onChange={(e) => setAssignForm({ ...assignForm, quantity: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                  placeholder={`Max: ${availableQuantity}`}
                  max={availableQuantity}
                  min="1"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Not (Opsiyonel)</label>
                <input
                  type="text"
                  value={assignForm.notes}
                  onChange={(e) => setAssignForm({ ...assignForm, notes: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                  placeholder="Seri no veya açıklama"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setIsAssignModalOpen(false)
                    setAssignForm({ workerId: "", quantity: "", notes: "" })
                  }}
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
    </div>
  )
}