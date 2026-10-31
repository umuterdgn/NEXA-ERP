/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * This code is the property of NXA Software.
 */

"use client"

import { useState, useEffect } from "react"
import { Calculator, Plus, TrendingUp, Clock, CheckCircle, X, Calendar, FileText } from "lucide-react"
import { createProgressPayment, updateProgressPaymentStatus, getProgressPayments } from "./actions"
import { toast } from "react-hot-toast"

interface ProgressPayment {
  id: string
  title: string
  description: string | null
  quantity: number
  unit: string
  unitPrice: number | null
  totalPrice: number | null
  status: string
  date: Date
  createdAt: Date
}

const STATUS_LABELS: Record<string, string> = {
  BEKLIYOR: "Bekliyor",
  ONAYLANDI: "Onaylandı",
  ODENDI: "Ödendi"
}

const STATUS_COLORS: Record<string, string> = {
  BEKLIYOR: "bg-yellow-500/20 text-yellow-400 border-yellow-500/50",
  ONAYLANDI: "bg-blue-500/20 text-blue-400 border-blue-500/50",
  ODENDI: "bg-green-500/20 text-green-400 border-green-500/50"
}

export default function ProgressPaymentsPage() {
  const [payments, setPayments] = useState<ProgressPayment[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    quantity: "",
    unit: "",
    unitPrice: "",
    date: ""
  })

  useEffect(() => {
    fetchPayments()
  }, [])

  const fetchPayments = async () => {
    const result = await getProgressPayments()
    if (result.success) {
      setPayments(result.progressPayments || [])
    }
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    const formDataObj = new FormData()
    Object.entries(formData).forEach(([key, value]) => {
      formDataObj.append(key, value)
    })

    const result = await createProgressPayment(formDataObj)
    if (result.success) {
      toast.success("Hakediş oluşturuldu")
      setIsModalOpen(false)
      setFormData({
        title: "",
        description: "",
        quantity: "",
        unit: "",
        unitPrice: "",
        date: ""
      })
      fetchPayments()
    } else {
      toast.error(result.error || "Oluşturma başarısız")
    }
  }

  const handleStatusChange = async (id: string, newStatus: string) => {
    const result = await updateProgressPaymentStatus(id, newStatus)
    if (result.success) {
      toast.success("Durum güncellendi")
      fetchPayments()
    } else {
      toast.error(result.error || "Güncelleme başarısız")
    }
  }

  const formatCurrency = (amount: number | null) => {
    if (amount === null) return "-"
    return new Intl.NumberFormat("tr-TR", {
      style: "currency",
      currency: "TRY"
    }).format(amount)
  }

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("tr-TR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric"
    })
  }

  // Calculate summary stats
  const totalAmount = payments.reduce((sum, p) => sum + (p.totalPrice || 0), 0)
  const pendingAmount = payments
    .filter(p => p.status === "BEKLIYOR")
    .reduce((sum, p) => sum + (p.totalPrice || 0), 0)
  const collectedAmount = payments
    .filter(p => p.status === "ODENDI")
    .reduce((sum, p) => sum + (p.totalPrice || 0), 0)

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Hakediş ve Metraj</h1>
          <p className="text-slate-400">Taşeron hakediş takibi</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white rounded-xl font-medium shadow-lg shadow-blue-500/30 transition-all"
        >
          <Plus className="w-5 h-5" />
          Yeni Metraj Gir
        </button>
      </div>

      {/* Summary Widgets */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-blue-500/20 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-blue-400" />
            </div>
            <span className="text-slate-400 text-sm">Toplam Hakediş</span>
          </div>
          <p className="text-2xl font-bold text-white">{formatCurrency(totalAmount)}</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-yellow-500/20 rounded-xl flex items-center justify-center">
              <Clock className="w-5 h-5 text-yellow-400" />
            </div>
            <span className="text-slate-400 text-sm">Onay Bekleyen</span>
          </div>
          <p className="text-2xl font-bold text-white">{formatCurrency(pendingAmount)}</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-green-500/20 rounded-xl flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-green-400" />
            </div>
            <span className="text-slate-400 text-sm">Tahsil Edilen</span>
          </div>
          <p className="text-2xl font-bold text-white">{formatCurrency(collectedAmount)}</p>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-800">
                <th className="text-left py-4 px-6 text-slate-400 font-medium text-sm">Başlık</th>
                <th className="text-left py-4 px-6 text-slate-400 font-medium text-sm">Metraj</th>
                <th className="text-left py-4 px-6 text-slate-400 font-medium text-sm">Birim Fiyat</th>
                <th className="text-left py-4 px-6 text-slate-400 font-medium text-sm">Toplam</th>
                <th className="text-left py-4 px-6 text-slate-400 font-medium text-sm">Tarih</th>
                <th className="text-left py-4 px-6 text-slate-400 font-medium text-sm">Durum</th>
                <th className="text-left py-4 px-6 text-slate-400 font-medium text-sm">İşlemler</th>
              </tr>
            </thead>
            <tbody>
              {payments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-500">
                    Henüz hakediş kaydı yok
                  </td>
                </tr>
              ) : (
                payments.map((payment) => (
                  <tr key={payment.id} className="border-b border-slate-800 hover:bg-slate-800/50 transition-colors">
                    <td className="py-4 px-6">
                      <div>
                        <p className="text-white font-medium">{payment.title}</p>
                        {payment.description && (
                          <p className="text-slate-400 text-sm mt-1 line-clamp-1">{payment.description}</p>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-6 text-slate-300">
                      {payment.quantity} {payment.unit}
                    </td>
                    <td className="py-4 px-6 text-slate-300">
                      {formatCurrency(payment.unitPrice)}
                    </td>
                    <td className="py-4 px-6 text-white font-medium">
                      {formatCurrency(payment.totalPrice)}
                    </td>
                    <td className="py-4 px-6 text-slate-300">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-slate-500" />
                        {formatDate(payment.date)}
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className={`px-3 py-1 text-xs font-medium rounded-lg border ${STATUS_COLORS[payment.status]}`}>
                        {STATUS_LABELS[payment.status]}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2">
                        {payment.status === "BEKLIYOR" && (
                          <button
                            onClick={() => handleStatusChange(payment.id, "ONAYLANDI")}
                            className="px-3 py-1.5 bg-blue-600/20 text-blue-400 hover:bg-blue-600 hover:text-white rounded-lg text-sm transition-colors"
                          >
                            Onayla
                          </button>
                        )}
                        {payment.status === "ONAYLANDI" && (
                          <button
                            onClick={() => handleStatusChange(payment.id, "ODENDI")}
                            className="px-3 py-1.5 bg-green-600/20 text-green-400 hover:bg-green-600 hover:text-white rounded-lg text-sm transition-colors"
                          >
                            Ödendi
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-lg">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">Yeni Metraj Gir</h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-slate-300 text-sm mb-2">Başlık *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
                  placeholder="Örn: B Blok 3. Kat Boya İşlemi"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-300 text-sm mb-2">Açıklama</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 resize-none"
                  placeholder="İş detayları"
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 text-sm mb-2">Miktar *</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
                    placeholder="150"
                    required
                  />
                </div>

                <div>
                  <label className="block text-slate-300 text-sm mb-2">Birim *</label>
                  <input
                    type="text"
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
                    placeholder="m2"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 text-sm mb-2">Birim Fiyat (TL)</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.unitPrice}
                  onChange={(e) => setFormData({ ...formData, unitPrice: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
                  placeholder="120"
                />
              </div>

              <div>
                <label className="block text-slate-300 text-sm mb-2">Tarih</label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-4 py-3 bg-slate-800 text-white rounded-xl hover:bg-slate-700 transition-colors"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-500 hover:to-purple-500 transition-all font-medium"
                >
                  Kaydet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
