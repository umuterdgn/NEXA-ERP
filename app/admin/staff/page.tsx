"use client"
/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * This code is the property of NXA Software.
 */


import { useState, useEffect } from "react"
import toast from "react-hot-toast"

export default function AdminStaffPage() {
  const [staff, setStaff] = useState<any[]>([])
  const [selectedStaff, setSelectedStaff] = useState<any>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterType, setFilterType] = useState<"all" | "unpaid" | "insurance">("all")
  const [isAdding, setIsAdding] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchStaff()
  }, [searchTerm, filterType])

  const fetchStaff = async () => {
    try {
      const params = new URLSearchParams()
      if (searchTerm) params.append("search", searchTerm)
      if (filterType !== "all") params.append("filter", filterType)
      
      const response = await fetch(`/api/admin/staff?${params.toString()}`)
      if (response.ok) {
        const data = await response.json()
        setStaff(data)
      }
    } catch (error) {
      console.error("Failed to fetch staff:", error)
    } finally {
      setIsLoading(false)
    }
  }


  return (
    <div>
      <h1 className="text-3xl font-bold text-slate-900 mb-8">
        Personel Yönetimi
      </h1>

      {/* Filters */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 mb-6">
        <div className="grid md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Ara</label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Personel adı..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Filtre</label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as any)}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Tümü</option>
              <option value="unpaid">Maaşı Ödenmeyenler</option>
              <option value="insurance">Sigortası Yaklaşanlar</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={() => setIsAdding(true)}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-colors"
            >
              Yeni Personel Ekle
            </button>
          </div>
        </div>
      </div>

      {/* Staff List */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-medium text-slate-700">Ad Soyad</th>
              <th className="px-6 py-3 text-left text-sm font-medium text-slate-700">Birim</th>
              <th className="px-6 py-3 text-left text-sm font-medium text-slate-700">Şantiye</th>
              <th className="px-6 py-3 text-left text-sm font-medium text-slate-700">Durum</th>
              <th className="px-6 py-3 text-right text-sm font-medium text-slate-700">İşlemler</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {isLoading ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                  Yükleniyor...
                </td>
              </tr>
            ) : staff.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                  Personel bulunamadı
                </td>
              </tr>
            ) : (
              staff.map((person) => {
                const hasUnpaid = person.payments?.some((p: any) => !p.isPaid)
                const insuranceExpiring = person.insurance && 
                  new Date(person.insurance.nextRenewalDate) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)

                return (
                  <tr key={person.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 text-sm font-medium text-slate-900">{person.name}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{person.department}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{person.currentSite}</td>
                    <td className="px-6 py-4 text-sm">
                      <div className="flex space-x-2">
                        {hasUnpaid && (
                          <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs">
                            Maaş Bekliyor
                          </span>
                        )}
                        {insuranceExpiring && (
                          <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs">
                            Sigorta Yaklaşıyor
                          </span>
                        )}
                        {!hasUnpaid && !insuranceExpiring && (
                          <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                            Normal
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right text-sm">
                      <button
                        onClick={() => setSelectedStaff(person)}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        Detaylar
                      </button>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Staff Detail Modal */}
      {selectedStaff && (
        <StaffDetailModal
          staff={selectedStaff}
          onClose={() => setSelectedStaff(null)}
          onUpdate={(updatedStaff: any) => {
            setStaff(staff.map(s => s.id === updatedStaff.id ? updatedStaff : s))
            setSelectedStaff(updatedStaff)
          }}
        />
      )}

      {/* Add Staff Modal */}
      {isAdding && (
        <AddStaffModal
          onClose={() => setIsAdding(false)}
          onSave={(newStaff: any) => {
            fetchStaff()
            setIsAdding(false)
          }}
        />
      )}
    </div>
  )
}

function StaffDetailModal({ staff, onClose, onUpdate }: any) {
  const [activeTab, setActiveTab] = useState<"info" | "history" | "payments" | "insurance">("info")

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        <div className="p-6 border-b border-slate-200 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-slate-900">{staff.name}</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-200">
          <button
            onClick={() => setActiveTab("info")}
            className={`px-6 py-3 font-medium transition-colors ${
              activeTab === "info"
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Bilgiler
          </button>
          <button
            onClick={() => setActiveTab("history")}
            className={`px-6 py-3 font-medium transition-colors ${
              activeTab === "history"
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Şantiye Geçmişi
          </button>
          <button
            onClick={() => setActiveTab("payments")}
            className={`px-6 py-3 font-medium transition-colors ${
              activeTab === "payments"
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Ödemeler
          </button>
          <button
            onClick={() => setActiveTab("insurance")}
            className={`px-6 py-3 font-medium transition-colors ${
              activeTab === "insurance"
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Sigorta
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
          {activeTab === "info" && (
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Yaş</label>
                <div className="text-slate-900">{staff.age}</div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Doğum Tarihi</label>
                <div className="text-slate-900">{new Date(staff.birthDate).toLocaleDateString("tr-TR")}</div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Birim</label>
                <div className="text-slate-900">{staff.department}</div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Mevcut Şantiye</label>
                <div className="text-slate-900">{staff.currentSite}</div>
              </div>
            </div>
          )}

          {activeTab === "history" && (
            <div>
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Şantiye Geçmişi</h3>
              {staff.siteHistory?.length > 0 ? (
                <table className="w-full">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-sm font-medium text-slate-700">Şantiye</th>
                      <th className="px-4 py-2 text-left text-sm font-medium text-slate-700">Başlangıç</th>
                      <th className="px-4 py-2 text-left text-sm font-medium text-slate-700">Bitiş</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {staff.siteHistory.map((history: any) => (
                      <tr key={history.id}>
                        <td className="px-4 py-3 text-sm text-slate-900">{history.siteName}</td>
                        <td className="px-4 py-3 text-sm text-slate-600">
                          {new Date(history.startDate).toLocaleDateString("tr-TR")}
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-600">
                          {history.endDate ? new Date(history.endDate).toLocaleDateString("tr-TR") : "Aktif"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="text-slate-500 text-center py-8">Şantiye geçmişi bulunamadı</p>
              )}
            </div>
          )}

          {activeTab === "payments" && (
            <div>
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Ödeme Geçmişi</h3>
              {staff.payments?.length > 0 ? (
                <table className="w-full">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-sm font-medium text-slate-700">Tür</th>
                      <th className="px-4 py-2 text-left text-sm font-medium text-slate-700">Tutar</th>
                      <th className="px-4 py-2 text-left text-sm font-medium text-slate-700">Durum</th>
                      <th className="px-4 py-2 text-left text-sm font-medium text-slate-700">Tarih</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {staff.payments.map((payment: any) => (
                      <tr key={payment.id}>
                        <td className="px-4 py-3 text-sm text-slate-900">
                          {payment.type === "SALARY" ? "Maaş" : 
                           payment.type === "BONUS" ? "Prim" : "Döner Sermaye"}
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-900 font-medium">
                          ₺{payment.amount.toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            payment.isPaid
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}>
                            {payment.isPaid ? "Ödendi" : "Bekliyor"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-600">
                          {new Date(payment.date).toLocaleDateString("tr-TR")}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="text-slate-500 text-center py-8">Ödeme kaydı bulunamadı</p>
              )}
            </div>
          )}

          {activeTab === "insurance" && (
            <div>
              {staff.insurance ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Başlangıç Tarihi</label>
                    <div className="text-slate-900">
                      {new Date(staff.insurance.startDate).toLocaleDateString("tr-TR")}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Yenileme Periyodu</label>
                    <div className="text-slate-900">{staff.insurance.renewalPeriod} ay</div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Sonraki Yenileme</label>
                    <div className="text-slate-900">
                      {new Date(staff.insurance.nextRenewalDate).toLocaleDateString("tr-TR")}
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-slate-500 text-center py-8">Sigorta kaydı bulunamadı</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function AddStaffModal({ onClose, onSave }: any) {
  const [formData, setFormData] = useState({
    name: "",
    age: "",
    birthDate: "",
    department: "",
    currentSite: ""
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const response = await fetch("/api/admin/staff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          age: parseInt(formData.age),
          birthDate: new Date(formData.birthDate)
        })
      })
      if (response.ok) {
        const newStaff = await response.json()
        toast.success("Personel başarıyla eklendi")
        onSave(newStaff)
      } else {
        toast.error("Hata oluştu")
      }
    } catch (error) {
      toast.error("Hata oluştu")
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl max-w-md w-full p-6">
        <h2 className="text-2xl font-bold text-slate-900 mb-6">Yeni Personel</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Ad Soyad *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Yaş *</label>
            <input
              type="number"
              value={formData.age}
              onChange={(e) => setFormData({ ...formData, age: e.target.value })}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Doğum Tarihi *</label>
            <input
              type="date"
              value={formData.birthDate}
              onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Birim *</label>
            <input
              type="text"
              value={formData.department}
              onChange={(e) => setFormData({ ...formData, department: e.target.value })}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Mevcut Şantiye *</label>
            <input
              type="text"
              value={formData.currentSite}
              onChange={(e) => setFormData({ ...formData, currentSite: e.target.value })}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
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
              className="flex-1 px-4 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition-colors"
            >
              İptal
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}