/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * This code is the property of NXA Software.
 */

"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

interface BillingClientProps {
  initialBillings: any[]
  subcontractors: { id: string; name: string }[]
  projects: { id: string; name: string; contractValue: number }[]
}

export default function BillingClient({ initialBillings, subcontractors, projects }: BillingClientProps) {
  const router = useRouter()
  const [billings, setBillings] = useState(initialBillings)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [formData, setFormData] = useState({
    projectId: "",
    subcontractorId: "",
    periodMonth: new Date().getMonth() + 1,
    periodYear: new Date().getFullYear(),
    totalAmount: 0,
    notes: ""
  })
  const [isCalculating, setIsCalculating] = useState(false)
  const [calculationResult, setCalculationResult] = useState<any>(null)

  const statusColors = {
    DRAFT: "bg-yellow-500/20 text-yellow-400",
    PENDING_APPROVAL: "bg-blue-500/20 text-blue-400",
    APPROVED: "bg-green-500/20 text-green-400",
    PAID: "bg-purple-500/20 text-purple-400"
  }

  const statusLabels = {
    DRAFT: "Taslak",
    PENDING_APPROVAL: "Onay Bekliyor",
    APPROVED: "Onaylandı",
    PAID: "Ödendi"
  }

  const handleCalculate = async () => {
    if (!formData.projectId || !formData.subcontractorId) {
      alert("Lütfen proje ve taşeron seçin")
      return
    }

    setIsCalculating(true)
    try {
      const response = await fetch("/api/progress-billing/calculate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: formData.projectId,
          subcontractorId: formData.subcontractorId,
          periodMonth: formData.periodMonth,
          periodYear: formData.periodYear
        })
      })

      if (response.ok) {
        const result = await response.json()
        setCalculationResult(result)
        setFormData(prev => ({ ...prev, totalAmount: result.estimatedAmount }))
      }
    } catch (error) {
      console.error("Calculation error:", error)
      alert("Hesaplama hatası")
    } finally {
      setIsCalculating(false)
    }
  }

  const handleCreate = async () => {
    try {
      const response = await fetch("/api/progress-billing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        const newBilling = await response.json()
        setBillings([newBilling, ...billings])
        setShowCreateModal(false)
        setFormData({
          projectId: "",
          subcontractorId: "",
          periodMonth: new Date().getMonth() + 1,
          periodYear: new Date().getFullYear(),
          totalAmount: 0,
          notes: ""
        })
        setCalculationResult(null)
        router.refresh()
      }
    } catch (error) {
      console.error("Create error:", error)
      alert("Hakediş oluşturma hatası")
    }
  }

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/progress-billing/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus })
      })

      if (response.ok) {
        setBillings(billings.map(b => b.id === id ? { ...b, status: newStatus } : b))
        router.refresh()
      }
    } catch (error) {
      console.error("Status change error:", error)
      alert("Durum güncelleme hatası")
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Hakediş Yönetimi</h1>
          <p className="text-slate-400 mt-1">Taşeron ödemelerini ve hakedişleri yönetin</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-colors"
        >
          + Yeni Hakediş Oluştur
        </button>
      </div>

      {/* KPI Kartları */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
          <div className="text-slate-400 text-sm">Toplam Hakediş</div>
          <div className="text-2xl font-bold text-white mt-2">{billings.length}</div>
        </div>
        <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
          <div className="text-slate-400 text-sm">Onay Bekleyen</div>
          <div className="text-2xl font-bold text-blue-400 mt-2">
            {billings.filter(b => b.status === "PENDING_APPROVAL").length}
          </div>
        </div>
        <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
          <div className="text-slate-400 text-sm">Toplam Tutar</div>
          <div className="text-2xl font-bold text-green-400 mt-2">
            ₺{billings.reduce((sum, b) => sum + b.totalAmount, 0).toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
          </div>
        </div>
        <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
          <div className="text-slate-400 text-sm">Ödenen Tutar</div>
          <div className="text-2xl font-bold text-purple-400 mt-2">
            ₺{billings.filter(b => b.status === "PAID").reduce((sum, b) => sum + b.totalAmount, 0).toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
          </div>
        </div>
      </div>

      {/* Hakediş Tablosu */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
        <div className="w-full overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
          <table className="w-full min-w-max">
            <thead className="bg-slate-900/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Proje
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Taşeron
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Dönem
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Tutar
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Durum
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Tarih
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-slate-400 uppercase tracking-wider">
                  İşlemler
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {billings.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
                    Henüz hakediş kaydı bulunmuyor
                  </td>
                </tr>
              ) : (
                billings.map((billing) => (
                  <tr key={billing.id} className="hover:bg-slate-700/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-white">{billing.project.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-slate-300">{billing.subcontractor.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-slate-300">
                        {billing.periodMonth}/{billing.periodYear}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-white">
                        ₺{billing.totalAmount.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${statusColors[billing.status as keyof typeof statusColors]}`}>
                        {statusLabels[billing.status as keyof typeof statusLabels]}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-slate-400">
                        {new Date(billing.createdAt).toLocaleDateString("tr-TR")}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-2">
                        <a
                          href={`/admin/billing/${billing.id}`}
                          className="text-blue-400 hover:text-blue-300 text-sm"
                        >
                          Detay
                        </a>
                        {billing.status === "PENDING_APPROVAL" && (
                          <button
                            onClick={() => handleStatusChange(billing.id, "APPROVED")}
                            className="text-green-400 hover:text-green-300 text-sm"
                          >
                            Onayla
                          </button>
                        )}
                        {billing.status === "APPROVED" && (
                          <button
                            onClick={() => handleStatusChange(billing.id, "PAID")}
                            className="text-purple-400 hover:text-purple-300 text-sm"
                          >
                            Ödendi İşaretle
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
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-slate-900 rounded-xl border border-slate-700 p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-white">Yeni Hakediş Oluştur</h3>
              <button
                onClick={() => {
                  setShowCreateModal(false)
                  setFormData({
                    projectId: "",
                    subcontractorId: "",
                    periodMonth: new Date().getMonth() + 1,
                    periodYear: new Date().getFullYear(),
                    totalAmount: 0,
                    notes: ""
                  })
                  setCalculationResult(null)
                }}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-white mb-2">Proje</label>
                  <select
                    value={formData.projectId}
                    onChange={(e) => setFormData({ ...formData, projectId: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="">Seçin</option>
                    {projects.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-2">Taşeron</label>
                  <select
                    value={formData.subcontractorId}
                    onChange={(e) => setFormData({ ...formData, subcontractorId: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="">Seçin</option>
                    {subcontractors.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-white mb-2">Ay</label>
                  <select
                    value={formData.periodMonth}
                    onChange={(e) => setFormData({ ...formData, periodMonth: parseInt(e.target.value) })}
                    className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  >
                    {Array.from({ length: 12 }, (_, i) => (
                      <option key={i + 1} value={i + 1}>{i + 1}. Ay</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-2">Yıl</label>
                  <input
                    type="number"
                    value={formData.periodYear}
                    onChange={(e) => setFormData({ ...formData, periodYear: parseInt(e.target.value) })}
                    className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                    min="2020"
                    max="2030"
                  />
                </div>
              </div>

              <button
                onClick={handleCalculate}
                disabled={isCalculating || !formData.projectId || !formData.subcontractorId}
                className="w-full px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isCalculating ? "Hesaplanıyor..." : "📊 DailyProgress'tan Hesapla"}
              </button>

              {calculationResult && (
                <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
                  <h4 className="text-sm font-medium text-white mb-2">Hesaplama Sonucu</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-slate-400">Günlük Rapor Sayısı:</span>
                      <span className="text-white ml-2">{calculationResult.dailyProgressCount}</span>
                    </div>
                    <div>
                      <span className="text-slate-400">Ortalama Tamamlanma:</span>
                      <span className="text-white ml-2">%{calculationResult.avgCompletion}</span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-slate-400">Önerilen Tutar:</span>
                      <span className="text-green-400 ml-2 font-medium">
                        ₺{calculationResult.estimatedAmount.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-white mb-2">Tutar (₺)</label>
                <input
                  type="number"
                  value={formData.totalAmount}
                  onChange={(e) => setFormData({ ...formData, totalAmount: parseFloat(e.target.value) || 0 })}
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  step="0.01"
                  min="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">Notlar</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500 resize-none"
                  placeholder="Hakediş ile ilgili notlar..."
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => {
                    setShowCreateModal(false)
                    setFormData({
                      projectId: "",
                      subcontractorId: "",
                      periodMonth: new Date().getMonth() + 1,
                      periodYear: new Date().getFullYear(),
                      totalAmount: 0,
                      notes: ""
                    })
                    setCalculationResult(null)
                  }}
                  className="flex-1 px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition-colors"
                >
                  İptal
                </button>
                <button
                  onClick={handleCreate}
                  disabled={!formData.projectId || !formData.subcontractorId || formData.totalAmount <= 0}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Oluştur
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
