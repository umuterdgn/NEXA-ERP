"use client"
/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * This code is the property of NXA Software.
 */


import { useState, useEffect } from "react"
import Link from "next/link"
import toast from "react-hot-toast"

export default function AdminStockPage() {
  const [stocks, setStocks] = useState<any[]>([])
  const [isAdding, setIsAdding] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchStocks()
  }, [])

  const fetchStocks = async () => {
    try {
      const response = await fetch("/api/admin/stock")
      if (response.ok) {
        const data = await response.json()
        setStocks(data)
      }
    } catch (error) {
      console.error("Failed to fetch stocks:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const calculateStock = (stock: any) => {
    const inTotal = stock.transactions
      ?.filter((t: any) => t.type === "IN")
      .reduce((sum: number, t: any) => sum + t.quantity, 0) || 0
    const outTotal = stock.transactions
      ?.filter((t: any) => t.type === "OUT")
      .reduce((sum: number, t: any) => sum + t.quantity, 0) || 0
    return inTotal - outTotal
  }

  return (
    <div className="lg:mt-0 mt-16">
      <h1 className="text-2xl lg:text-3xl font-bold text-white mb-8">
        Stok Yönetimi
      </h1>

      {/* Add Stock Button */}
      <div className="mb-6">
        <button
          onClick={() => setIsAdding(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-colors"
        >
          Yeni Stok Kalemi Ekle
        </button>
      </div>

      {/* Stock List */}
      <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-800">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-medium text-slate-300">Stok Adı</th>
              <th className="px-6 py-3 text-left text-sm font-medium text-slate-300">Birim</th>
              <th className="px-6 py-3 text-left text-sm font-medium text-slate-300">Mevcut Miktar</th>
              <th className="px-6 py-3 text-right text-sm font-medium text-slate-300">İşlemler</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {isLoading ? (
              <tr>
                <td colSpan={4} className="px-6 py-12 text-center text-slate-400">
                  Yükleniyor...
                </td>
              </tr>
            ) : stocks.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-12 text-center text-slate-400">
                  Stok kaydı bulunamadı
                </td>
              </tr>
            ) : (
              stocks.map((stock) => (
                <tr key={stock.id}>
                  <td className="px-6 py-4 text-sm font-medium text-white">{stock.name}</td>
                  <td className="px-6 py-4 text-sm text-slate-400">{stock.unit}</td>
                  <td className="px-6 py-4 text-sm text-white font-medium">
                    {calculateStock(stock)} {stock.unit}
                  </td>
                  <td className="px-6 py-4 text-right text-sm space-x-2">
                    <Link
                      href={`/admin/stock/${stock.id}`}
                      className="text-green-400 hover:text-green-300"
                    >
                      Defteri Gör
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Add Stock Modal */}
      {isAdding && (
        <AddStockModal
          onClose={() => setIsAdding(false)}
          onSave={(newStock: any) => {
            fetchStocks()
            setIsAdding(false)
          }}
        />
      )}
    </div>
  )
}

function AddStockModal({ onClose, onSave }: any) {
  const [formData, setFormData] = useState({
    name: "",
    unit: ""
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const response = await fetch("/api/admin/stock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      })
      if (response.ok) {
        const newStock = await response.json()
        toast.success("Stok kalemi başarıyla eklendi")
        onSave(newStock)
      } else {
        toast.error("Hata oluştu")
      }
    } catch (error) {
      toast.error("Hata oluştu")
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-slate-900 rounded-2xl max-w-md w-full p-6 border border-slate-800">
        <h2 className="text-2xl font-bold text-white mb-6">Yeni Stok Kalemi</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Stok Adı *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-slate-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Birim *</label>
            <select
              value={formData.unit}
              onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
              className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
              required
            >
              <option value="">Birim Seçin</option>
              <option value="ADET">Adet</option>
              <option value="KG">Kilogram (kg)</option>
              <option value="TON">Ton</option>
              <option value="M">Metre (m)</option>
              <option value="M2">Metrekare (m²)</option>
              <option value="M3">Metreküp (m³)</option>
              <option value="LT">Litre (lt)</option>
              <option value="PAKET">Paket</option>
            </select>
          </div>

          <div className="flex space-x-4">
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-colors"
            >
              Kaydet
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-slate-700 text-slate-200 rounded-lg hover:bg-slate-600 transition-colors"
            >
              İptal
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}