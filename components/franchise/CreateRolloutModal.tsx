"use client"

import { useState, useTransition } from "react"
import { Store, X, Loader2, Plus, Building2, MapPin, DollarSign, UserCheck } from "lucide-react"
import { createRolloutProject } from "@/app/actions/franchise"

interface CreateRolloutModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
  regionalManagers?: Array<{ id: string; name: string }>
  branchManagers?: Array<{ id: string; name: string }>
}

export default function CreateRolloutModal({
  isOpen,
  onClose,
  onSuccess,
  regionalManagers = [],
  branchManagers = [],
}: CreateRolloutModalProps) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    name: "",
    city: "İstanbul",
    locationType: "STREET", // "STREET" | "MALL" | "KIOSK"
    budget: "",
    regionalManagerId: "",
    branchManagerId: "",
  })

  if (!isOpen) return null

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)

    if (!formData.name.trim()) {
      setError("Lütfen mağaza / proje adını giriniz.")
      return
    }
    if (!formData.city.trim()) {
      setError("Lütfen şehir bilgisini giriniz.")
      return
    }

    startTransition(async () => {
      try {
        const payload = new FormData()
        payload.append("name", formData.name.trim())
        payload.append("city", formData.city.trim())
        payload.append("locationType", formData.locationType)
        if (formData.budget) {
          payload.append("budget", formData.budget)
          payload.append("totalBudget", formData.budget)
        }
        if (formData.regionalManagerId) {
          payload.append("regionalManagerId", formData.regionalManagerId)
        }
        if (formData.branchManagerId) {
          payload.append("branchManagerId", formData.branchManagerId)
        }

        const res = await createRolloutProject(payload)
        if (!res.success) {
          setError(res.error || "Mağaza projesi oluşturulamadı.")
          return
        }

        // Formu sıfırla ve kapat
        setFormData({
          name: "",
          city: "İstanbul",
          locationType: "STREET",
          budget: "",
          regionalManagerId: "",
          branchManagerId: "",
        })
        onClose()
        if (onSuccess) onSuccess()
      } catch (err: any) {
        setError(err.message || "Beklenmedik bir hata oluştu.")
      }
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 space-y-5 shadow-2xl relative max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Başlığı */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Store className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Yeni Mağaza Açılışı</h3>
              <p className="text-xs text-slate-400">Rollout projesi oluşturun ve idari kilitleri başlatın</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Hata Mesajı */}
        {error && (
          <div className="p-3 rounded-xl bg-red-950/60 border border-red-800 text-xs text-red-300">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Proje / Mağaza Adı */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Proje / Mağaza Adı <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              name="name"
              placeholder="Örn: Kadıköy Moda Cadde Şubesi"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3.5 py-2.5 text-xs bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-colors"
              required
              disabled={isPending}
            />
          </div>

          {/* Şehir ve Lokasyon Tipi */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Şehir <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                name="city"
                placeholder="Örn: İstanbul, Ankara, İzmir"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                className="w-full px-3.5 py-2.5 text-xs bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-colors"
                required
                disabled={isPending}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Lokasyon Tipi <span className="text-rose-500">*</span>
              </label>
              <select
                name="locationType"
                value={formData.locationType}
                onChange={(e) => setFormData({ ...formData, locationType: e.target.value })}
                className="w-full px-3.5 py-2.5 text-xs bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-amber-500 transition-colors"
                disabled={isPending}
              >
                <option value="STREET">Cadde Mağazası (Dükkan)</option>
                <option value="MALL">AVM İçi Mağaza</option>
                <option value="KIOSK">Kiosk / Stand</option>
              </select>
            </div>
          </div>

          {/* Tahmini Kurulum Bütçesi */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Tahmini Kurulum Bütçesi (₺) <span className="text-slate-500 text-[10px]">(Opsiyonel)</span>
            </label>
            <input
              type="number"
              name="budget"
              placeholder="Örn: 2500000"
              value={formData.budget}
              onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
              className="w-full px-3.5 py-2.5 text-xs bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-colors"
              disabled={isPending}
            />
          </div>

          {/* Yönetici Atamaları (Bölge ve Şube Müdürleri) */}
          {(regionalManagers.length > 0 || branchManagers.length > 0) && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              {regionalManagers.length > 0 && (
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Bölge Müdürü <span className="text-slate-500 text-[10px]">(Opsiyonel)</span>
                  </label>
                  <select
                    name="regionalManagerId"
                    value={formData.regionalManagerId}
                    onChange={(e) => setFormData({ ...formData, regionalManagerId: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-amber-500 transition-colors"
                    disabled={isPending}
                  >
                    <option value="">Atama Yapma (Boş)</option>
                    {regionalManagers.map((rm) => (
                      <option key={rm.id} value={rm.id}>
                        {rm.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {branchManagers.length > 0 && (
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Şube Müdürü <span className="text-slate-500 text-[10px]">(Opsiyonel)</span>
                  </label>
                  <select
                    name="branchManagerId"
                    value={formData.branchManagerId}
                    onChange={(e) => setFormData({ ...formData, branchManagerId: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-amber-500 transition-colors"
                    disabled={isPending}
                  >
                    <option value="">Atama Yapma (Boş)</option>
                    {branchManagers.map((bm) => (
                      <option key={bm.id} value={bm.id}>
                        {bm.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          )}

          {/* Butonlar */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={isPending}
              className="px-4 py-2.5 text-xs text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
            >
              İptal
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold shadow-lg shadow-amber-600/20 disabled:opacity-50 transition-all cursor-pointer"
            >
              {isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Kaydediliyor...</span>
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  <span>Mağaza Projesini Başlat</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
