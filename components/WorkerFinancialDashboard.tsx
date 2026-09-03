"use client"
/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * This code is the property of NXA Software.
 */


import { useState, useEffect } from "react"
import { toast } from "react-hot-toast"

interface Worker {
  id: string
  firstName: string
  lastName: string
  dailyWage: number
  monthlyBankPayment: number
  records: Array<{
    id: string
    date: string
    dayMultiplier: number
  }>
  payments: Array<{
    id: string
    amount: number
    type: string
    description: string | null
    date: string
  }>
}

interface WorkerFinancialDashboardProps {
  worker: Worker
}

export default function WorkerFinancialDashboard({ worker }: WorkerFinancialDashboardProps) {
  const [isUpdatingWage, setIsUpdatingWage] = useState(false)
  const [isAddingPayment, setIsAddingPayment] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalType, setModalType] = useState<"AVANS" | "PRIM">("AVANS")
  const [wageForm, setWageForm] = useState({
    dailyWage: worker.dailyWage || 0,
    monthlyBankPayment: worker.monthlyBankPayment || 0
  })
  const [paymentForm, setPaymentForm] = useState({
    amount: "",
    type: "AVANS",
    description: ""
  })

  // Calculate financial summary with new formula
  const fullDays = worker.records.filter(r => r.dayMultiplier === 1).length
  const halfDays = worker.records.filter(r => r.dayMultiplier === 0.5).length
  const toplamHakedis = (fullDays * (worker.dailyWage || 0)) + (halfDays * ((worker.dailyWage || 0) / 2))
  const totalBonus = worker.payments.filter(p => p.type === "PRIM").reduce((sum, p) => sum + p.amount, 0)
  const totalAdvance = worker.payments.filter(p => p.type === "AVANS").reduce((sum, p) => sum + p.amount, 0)
  const totalCashPayment = worker.payments.filter(p => p.type === "ELDEN").reduce((sum, p) => sum + p.amount, 0)
  const kesintilerToplami = (worker.monthlyBankPayment || 0) + totalAdvance + totalCashPayment
  const eklemeler = totalBonus
  const netOdenecek = toplamHakedis - kesintilerToplami + eklemeler

  const handleUpdateWage = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const response = await fetch(`/api/admin/workers/${worker.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(wageForm)
      })

      if (response.ok) {
        toast.success("Ücret bilgileri güncellendi")
        setIsUpdatingWage(false)
        window.location.reload()
      } else {
        toast.error("Güncellenirken hata oluştu")
      }
    } catch (error) {
      toast.error("Güncellenirken hata oluştu")
    }
  }

  const handleAddPayment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!paymentForm.amount) {
      toast.error("Tutar girin")
      return
    }

    try {
      const response = await fetch("/api/admin/worker-payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: parseFloat(paymentForm.amount),
          type: modalType,
          description: paymentForm.description,
          workerId: worker.id
        })
      })

      if (response.ok) {
        toast.success(modalType === "AVANS" ? "Avans eklendi" : "Prim eklendi")
        setPaymentForm({ amount: "", type: "AVANS", description: "" })
        setIsModalOpen(false)
        window.location.reload()
      } else {
        toast.error("Ödeme eklenirken hata oluştu")
      }
    } catch (error) {
      toast.error("Ödeme eklenirken hata oluştu")
    }
  }

  const handleDeletePayment = async (paymentId: string) => {
    try {
      const response = await fetch(`/api/admin/worker-payments/${paymentId}`, {
        method: "DELETE"
      })

      if (response.ok) {
        toast.success("Ödeme silindi")
        window.location.reload()
      } else {
        toast.error("Silinirken hata oluştu")
      }
    } catch (error) {
      toast.error("Silinirken hata oluştu")
    }
  }

  return (
    <div className="space-y-6">
      {/* Large Earnings Dashboard */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-8 border border-slate-700">
        <h3 className="text-2xl font-bold text-white mb-6">Hakediş Paneli</h3>
        
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-slate-800/50 rounded-xl p-5 border border-slate-700">
            <p className="text-slate-400 text-sm mb-2">Toplam Hakediş</p>
            <p className="text-3xl font-bold text-white">₺{toplamHakedis.toFixed(2)}</p>
            <p className="text-slate-500 text-xs mt-1">{fullDays} tam gün, {halfDays} yarım gün</p>
          </div>
          
          <div className="bg-green-900/20 rounded-xl p-5 border border-green-900/50">
            <p className="text-green-400 text-sm mb-2">+ Eklemeler (Primler)</p>
            <p className="text-3xl font-bold text-green-400">₺{eklemeler.toFixed(2)}</p>
          </div>
          
          <div className="bg-red-900/20 rounded-xl p-5 border border-red-900/50">
            <p className="text-red-400 text-sm mb-2">- Kesintiler Toplamı</p>
            <p className="text-3xl font-bold text-red-400">₺{kesintilerToplami.toFixed(2)}</p>
          </div>
          
          <div className="bg-blue-900/20 rounded-xl p-5 border border-blue-900/50">
            <p className="text-blue-400 text-sm mb-2">NET ÖDENECEK</p>
            <p className="text-3xl font-bold text-blue-400">₺{netOdenecek.toFixed(2)}</p>
          </div>
        </div>
        
        {/* HESAP EKSTRESİ (BORDRO) Table */}
        <div className="bg-slate-800 rounded-2xl p-6 border-2 border-emerald-600 mt-6">
          <h4 className="text-xl font-bold text-white mb-4 text-center">HESAP EKSTRESİ (BORDRO)</h4>
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-700">
                <th className="py-3 px-4 text-slate-400 font-medium">Kalem</th>
                <th className="py-3 px-4 text-slate-400 font-medium text-right">Tutar (₺)</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-slate-700">
                <td className="py-3 px-4 text-white">Tam Gün Hakedişi ({fullDays} gün × ₺{worker.dailyWage?.toFixed(2)})</td>
                <td className="py-3 px-4 text-white text-right">₺{(fullDays * (worker.dailyWage || 0)).toFixed(2)}</td>
              </tr>
              <tr className="border-b border-slate-700">
                <td className="py-3 px-4 text-white">Yarım Gün Hakedişi ({halfDays} gün × ₺{((worker.dailyWage || 0) / 2).toFixed(2)})</td>
                <td className="py-3 px-4 text-white text-right">₺{(halfDays * ((worker.dailyWage || 0) / 2)).toFixed(2)}</td>
              </tr>
              <tr className="border-b border-slate-700 bg-green-900/10">
                <td className="py-3 px-4 text-green-400 font-bold">TOPLAM HAKEDİŞ</td>
                <td className="py-3 px-4 text-green-400 font-bold text-right">₺{toplamHakedis.toFixed(2)}</td>
              </tr>
              <tr className="border-b border-slate-700">
                <td className="py-3 px-4 text-white">Banka Ödemesi</td>
                <td className="py-3 px-4 text-red-400 text-right">-₺{(worker.monthlyBankPayment || 0).toFixed(2)}</td>
              </tr>
              <tr className="border-b border-slate-700">
                <td className="py-3 px-4 text-white">Avans</td>
                <td className="py-3 px-4 text-red-400 text-right">-₺{totalAdvance.toFixed(2)}</td>
              </tr>
              <tr className="border-b border-slate-700">
                <td className="py-3 px-4 text-white">Elden Alınanlar</td>
                <td className="py-3 px-4 text-red-400 text-right">-₺{totalCashPayment.toFixed(2)}</td>
              </tr>
              <tr className="border-b border-slate-700 bg-red-900/10">
                <td className="py-3 px-4 text-red-400 font-bold">KESİNTİLER TOPLAMI</td>
                <td className="py-3 px-4 text-red-400 font-bold text-right">-₺{kesintilerToplami.toFixed(2)}</td>
              </tr>
              <tr className="border-b border-slate-700">
                <td className="py-3 px-4 text-white">Primler</td>
                <td className="py-3 px-4 text-green-400 text-right">+₺{totalBonus.toFixed(2)}</td>
              </tr>
              <tr className="bg-emerald-900/20">
                <td className="py-4 px-4 text-emerald-400 font-bold text-lg">NET ÖDENECEK (Nakit Bakiye)</td>
                <td className="py-4 px-4 text-emerald-400 font-bold text-lg text-right">₺{netOdenecek.toFixed(2)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Quick Action Buttons */}
        <div className="grid grid-cols-2 gap-4 mt-6">
          <button
            onClick={() => {
              setModalType("AVANS")
              setIsModalOpen(true)
            }}
            className="px-6 py-4 bg-yellow-600 text-white rounded-xl hover:bg-yellow-500 transition-colors font-semibold text-lg"
          >
            + Avans Ekle
          </button>
          <button
            onClick={() => {
              setModalType("PRIM")
              setIsModalOpen(true)
            }}
            className="px-6 py-4 bg-green-600 text-white rounded-xl hover:bg-green-500 transition-colors font-semibold text-lg"
          >
            + Prim Ekle
          </button>
        </div>
      </div>

      {/* Payment Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-slate-900 rounded-xl p-6 border border-slate-800 w-full max-w-lg mx-4 shadow-2xl">
            <h3 className="text-xl font-semibold text-white mb-6">
              {modalType === "AVANS" ? "Avans Ekle" : "Prim Ekle"}
            </h3>
            
            <form onSubmit={handleAddPayment} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Tutar (₺)</label>
                <input
                  type="number"
                  step="0.01"
                  value={paymentForm.amount}
                  onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value, type: modalType })}
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white text-lg"
                  placeholder="0.00"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Açıklama</label>
                <input
                  type="text"
                  value={paymentForm.description}
                  onChange={(e) => setPaymentForm({ ...paymentForm, description: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                  placeholder="Opsiyonel açıklama"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false)
                    setPaymentForm({ amount: "", type: "AVANS", description: "" })
                  }}
                  className="flex-1 px-4 py-3 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-colors"
                >
                  Kaydet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Wage Settings Card */}
      <div className="bg-slate-900 rounded-xl p-6 border border-slate-800">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-white">Ücret Bilgileri</h3>
          {!isUpdatingWage && (
            <button
              onClick={() => setIsUpdatingWage(true)}
              className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-colors text-sm"
            >
              Düzenle
            </button>
          )}
        </div>

        {isUpdatingWage ? (
          <form onSubmit={handleUpdateWage} className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Günlük Yevmiye (₺)</label>
              <input
                type="number"
                step="0.01"
                value={wageForm.dailyWage}
                onChange={(e) => setWageForm({ ...wageForm, dailyWage: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Banka Ödemesi (₺)</label>
              <input
                type="number"
                step="0.01"
                value={wageForm.monthlyBankPayment}
                onChange={(e) => setWageForm({ ...wageForm, monthlyBankPayment: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
              />
            </div>
            <div className="col-span-2 flex gap-2 mt-2">
              <button
                type="button"
                onClick={() => setIsUpdatingWage(false)}
                className="flex-1 px-3 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors"
              >
                İptal
              </button>
              <button
                type="submit"
                className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-colors"
              >
                Kaydet
              </button>
            </div>
          </form>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-800 rounded-lg p-4">
              <p className="text-slate-400 text-sm">Günlük Yevmiye</p>
              <p className="text-2xl font-bold text-white">₺{worker.dailyWage?.toFixed(2) || "0.00"}</p>
            </div>
            <div className="bg-slate-800 rounded-lg p-4">
              <p className="text-slate-400 text-sm">Banka Ödemesi</p>
              <p className="text-2xl font-bold text-white">₺{worker.monthlyBankPayment?.toFixed(2) || "0.00"}</p>
            </div>
          </div>
        )}
      </div>

      {/* Payments Section */}
      <div className="bg-slate-900 rounded-xl p-6 border border-slate-800">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-white">Ödemeler</h3>
          {!isAddingPayment && (
            <button
              onClick={() => setIsAddingPayment(true)}
              className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-colors text-sm"
            >
              + Ödeme Ekle
            </button>
          )}
        </div>

        {isAddingPayment && (
          <form onSubmit={handleAddPayment} className="bg-slate-800 rounded-lg p-4 mb-4 space-y-3">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Tutar (₺)</label>
                <input
                  type="number"
                  step="0.01"
                  value={paymentForm.amount}
                  onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Tür</label>
                <select
                  value={paymentForm.type}
                  onChange={(e) => setPaymentForm({ ...paymentForm, type: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                >
                  <option value="AVANS">Avans</option>
                  <option value="ELDEN">Elden Ödeme</option>
                  <option value="PRIM">Prim</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Açıklama</label>
              <input
                type="text"
                value={paymentForm.description}
                onChange={(e) => setPaymentForm({ ...paymentForm, description: e.target.value })}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                placeholder="Opsiyonel açıklama"
              />
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setIsAddingPayment(false)}
                className="flex-1 px-3 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-500 transition-colors"
              >
                İptal
              </button>
              <button
                type="submit"
                className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-colors"
              >
                Kaydet
              </button>
            </div>
          </form>
        )}

        {worker.payments.length === 0 ? (
          <div className="text-center text-slate-500 py-8">
            Henüz ödeme kaydı yok
          </div>
        ) : (
          <div className="space-y-2">
            {worker.payments.map((payment) => (
              <div
                key={payment.id}
                className={`bg-slate-800 rounded-lg p-4 flex justify-between items-center border ${
                  payment.type === "PRIM" ? "border-green-900/50" : "border-slate-700"
                }`}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                      payment.type === "PRIM" ? "bg-green-900/50 text-green-400" :
                      payment.type === "AVANS" ? "bg-yellow-900/50 text-yellow-400" :
                      "bg-blue-900/50 text-blue-400"
                    }`}>
                      {payment.type}
                    </span>
                    <span className="text-white font-medium">₺{payment.amount.toFixed(2)}</span>
                  </div>
                  {payment.description && (
                    <p className="text-slate-400 text-sm mt-1">{payment.description}</p>
                  )}
                  <p className="text-slate-500 text-xs mt-1">
                    {new Date(payment.date).toLocaleDateString("tr-TR")}
                  </p>
                </div>
                <button
                  onClick={() => handleDeletePayment(payment.id)}
                  className="text-slate-400 hover:text-red-400 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Attendance Records Summary */}
      <div className="bg-slate-900 rounded-xl p-6 border border-slate-800">
        <h3 className="text-lg font-semibold text-white mb-4">Son Yoklama Kayıtları</h3>
        {worker.records.length === 0 ? (
          <div className="text-center text-slate-500 py-8">
            Henüz yoklama kaydı yok
          </div>
        ) : (
          <div className="space-y-2">
            {worker.records.slice(0, 10).map((record) => (
              <div
                key={record.id}
                className="bg-slate-800 rounded-lg p-3 flex justify-between items-center"
              >
                <span className="text-white">{new Date(record.date).toLocaleDateString("tr-TR")}</span>
                <span className={`px-2 py-1 rounded text-sm ${
                  record.dayMultiplier === 1 ? "bg-green-900/50 text-green-400" : "bg-yellow-900/50 text-yellow-400"
                }`}>
                  {record.dayMultiplier === 1 ? "Tam Gün" : "Yarım Gün"}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
