"use client"
/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Lojistik / Yeni Randevu Oluşturma Modalı
 */

import React, { useState, useEffect } from "react"
import { X, Truck } from "lucide-react"
import toast from "react-hot-toast"
import { getDriversForSelect } from "@/app/actions/logistics"

export interface CreateLogisticsModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

export default function CreateLogisticsModal({
  isOpen,
  onClose,
  onSuccess,
}: CreateLogisticsModalProps) {
  const [submitting, setSubmitting] = useState(false)
  const [drivers, setDrivers] = useState<Array<{ id: string; name: string }>>([])
  const [driverTab, setDriverTab] = useState<"INTERNAL" | "EXTERNAL">("INTERNAL")
  const [selectedDriverId, setSelectedDriverId] = useState<string>("")
  const [externalDriverName, setExternalDriverName] = useState<string>("")
  const [externalDriverPhone, setExternalDriverPhone] = useState<string>("")

  const [formData, setFormData] = useState({
    title: "",
    type: "BETON",
    location: "",
    supplierName: "",
    driverContact: "",
    scheduledAt: "",
    notes: "",
    status: "PLANNED",
  })

  useEffect(() => {
    if (isOpen) {
      loadDrivers()
    }
  }, [isOpen])

  const loadDrivers = async () => {
    try {
      const data = await getDriversForSelect()
      if (Array.isArray(data)) {
        setDrivers(data)
      }
    } catch (err) {
      console.error("Failed to load drivers for select:", err)
    }
  }

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.title || !formData.location || !formData.scheduledAt) {
      toast.error("Lütfen zorunlu alanları doldurun")
      return
    }

    setSubmitting(true)
    try {
      const response = await fetch("/api/admin/logistics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          driverName: formData.supplierName || "Şoför Atanmadı",
          timeSlot: "GÜN BOYU",
          vehiclePlate: "34-NX-1001",
        }),
      })

      if (response.ok) {
        toast.success("Randevu başarıyla oluşturuldu")
        onClose()
        setFormData({
          title: "",
          type: "BETON",
          location: "",
          supplierName: "",
          driverContact: "",
          scheduledAt: "",
          notes: "",
          status: "PLANNED",
        })
        setSelectedDriverId("")
        setExternalDriverName("")
        setExternalDriverPhone("")
        onSuccess?.()
      } else {
        toast.error("Randevu oluşturulurken hata oluştu")
      }
    } catch (error) {
      console.error("Failed to create logistics:", error)
      toast.error("Bir hata oluştu")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      {/* Dialog veya ana form kapsayıcısının (container) Tailwind class'ları: max-h-[85vh] overflow-y-auto */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 w-full max-w-md max-h-[85vh] overflow-y-auto flex flex-col relative shadow-2xl">
        <div className="flex items-center justify-between p-4 border-b border-slate-700 sticky top-0 bg-slate-800 z-20">
          <h3 className="text-lg font-semibold text-white">Yeni Randevu</h3>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-slate-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 flex flex-col justify-between">
          <div className="p-4 space-y-4">
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

            {/* Şoför Atama (İç Şoför / Dış Şoför İki Sekmeli Yapı) */}
            <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                  <Truck className="w-4 h-4 text-blue-400" />
                  <span>Şoför ve Sürücü Ataması *</span>
                </label>
                <div className="flex bg-slate-900 p-0.5 rounded-lg border border-slate-800">
                  <button
                    type="button"
                    onClick={() => {
                      setDriverTab("INTERNAL")
                      if (selectedDriverId) {
                        const d = drivers.find((x) => x.id === selectedDriverId)
                        if (d) setFormData((p) => ({ ...p, supplierName: d.name }))
                      }
                    }}
                    className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all ${
                      driverTab === "INTERNAL"
                        ? "bg-blue-600 text-white shadow-sm"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    İç Şoför (Kayıtlı)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setDriverTab("EXTERNAL")
                      setFormData((p) => ({
                        ...p,
                        supplierName: externalDriverName,
                        driverContact: externalDriverPhone,
                      }))
                    }}
                    className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all ${
                      driverTab === "EXTERNAL"
                        ? "bg-blue-600 text-white shadow-sm"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    Dış Şoför (Misafir)
                  </button>
                </div>
              </div>

              {driverTab === "INTERNAL" ? (
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Kayıtlı Şoför Seçin
                  </label>
                  <select
                    value={selectedDriverId}
                    onChange={(e) => {
                      const dId = e.target.value
                      setSelectedDriverId(dId)
                      const d = drivers.find((x) => x.id === dId)
                      if (d) {
                        setFormData((prev) => ({
                          ...prev,
                          supplierName: d.name,
                        }))
                      }
                    }}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-xs focus:outline-none focus:border-blue-500 font-medium"
                  >
                    <option value="">-- Kayıtlı Şoför Seçiniz --</option>
                    {drivers.map((driver) => (
                      <option key={driver.id} value={driver.id}>
                        {driver.name}
                      </option>
                    ))}
                  </select>
                  {selectedDriverId && (
                    <p className="text-[11px] text-emerald-400 font-mono mt-1.5">
                      Atanan Şoför: {formData.supplierName}
                    </p>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Dış Şoför Adı Soyadı *
                    </label>
                    <input
                      type="text"
                      value={externalDriverName}
                      onChange={(e) => {
                        setExternalDriverName(e.target.value)
                        setFormData((prev) => ({ ...prev, supplierName: e.target.value }))
                      }}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-xs focus:outline-none focus:border-blue-500"
                      placeholder="Örn: Hasan Yılmaz"
                      required={driverTab === "EXTERNAL"}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Telefon Numarası *
                    </label>
                    <input
                      type="tel"
                      value={externalDriverPhone}
                      onChange={(e) => {
                        setExternalDriverPhone(e.target.value)
                        setFormData((prev) => ({ ...prev, driverContact: e.target.value }))
                      }}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-xs focus:outline-none focus:border-blue-500 font-mono"
                      placeholder="+90 532 XXX XX XX"
                      required={driverTab === "EXTERNAL"}
                    />
                  </div>
                </div>
              )}
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

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Başlangıç Durumu</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
              >
                <option value="PLANNED">Planlandı</option>
                <option value="IN_TRANSIT">Yolda</option>
                <option value="DELIVERED">Teslim Alındı</option>
                <option value="ISSUE_REPORTED">Sorunlu / Eksik</option>
              </select>
            </div>
          </div>

          {/* Formun en altındaki "Kaydet / Gönder" butonunun sticky bottom-0 bg-gray-900 p-4 border-t border-gray-800 class'ları */}
          <div className="sticky bottom-0 bg-gray-900 p-4 border-t border-gray-800 flex gap-3 z-20">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 bg-slate-700 text-white font-medium rounded-lg hover:bg-slate-600 transition-colors"
            >
              İptal
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 px-4 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-blue-900/30"
            >
              {submitting ? "Kaydediliyor..." : "Kaydet"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
