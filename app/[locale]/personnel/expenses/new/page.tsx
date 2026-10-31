"use client"
/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Masraf & Yakıt Fişi Giriş Formu (/personnel/expenses/new)
 */

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  Receipt,
  ArrowLeft,
  Camera,
  Upload,
  Fuel,
  Hammer,
  Utensils,
  DollarSign,
  Building2,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Image as ImageIcon,
} from "lucide-react"

export default function NewExpensePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [projects, setProjects] = useState<Array<{ id: string; name: string; city: string | null }>>([])

  const [formData, setFormData] = useState({
    projectId: "",
    expenseType: "FUEL",
    amount: "",
    description: "",
    receiptUrl: "",
  })

  const [previewImage, setPreviewImage] = useState<string | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  useEffect(() => {
    // Fetch user projects
    fetch("/api/projects")
      .then((res) => res.json())
      .then((data) => {
        if (data.projects) {
          setProjects(data.projects)
          if (data.projects.length > 0) {
            setFormData((prev) => ({ ...prev, projectId: data.projects[0].id }))
          }
        }
      })
      .catch((err) => console.error("Projects error:", err))
  }, [])

  // Handle direct file input (Camera or Gallery)
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onloadend = () => {
      const base64 = reader.result as string
      setPreviewImage(base64)
      setFormData((prev) => ({ ...prev, receiptUrl: base64 }))
    }
    reader.readAsDataURL(file)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg(null)

    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      setErrorMsg("Lütfen geçerli bir harcama tutarı giriniz.")
      return
    }

    if (!formData.receiptUrl) {
      setErrorMsg("Lütfen fiş veya faturanın fotoğrafını yükleyiniz.")
      return
    }

    try {
      setLoading(true)
      const res = await fetch("/api/finance/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      const data = await res.json()
      if (res.ok) {
        router.push("/personnel/expenses?success=1")
      } else {
        setErrorMsg(data.error || "Masraf kaydedilemedi.")
      }
    } catch (err: any) {
      setErrorMsg("Bağlantı hatası: Sunucuya ulaşılamadı.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
        <Link
          href="/personnel/expenses"
          className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Masraf Listesine Dön</span>
        </Link>
        <span className="text-xs text-slate-400">Saha Harcamaları Formu</span>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400 mb-1">
            <Receipt className="w-4 h-4" />
            <span>Personel Masraf & Fiş Bildirimi</span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">
            Yeni Masraf / Yakıt Fişi Girişi
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Sahada yaptığınız yakıt, malzeme veya yemek harcamalarının fişini yükleyin; onaylandığında hesabınıza yatırılsın.
          </p>
        </div>

        {errorMsg && (
          <div className="p-3 bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800 rounded-xl flex items-center gap-2 text-xs text-red-600 dark:text-red-300">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Project Selector */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-blue-500" />
              <span>İlgili Şantiye / Proje *</span>
            </label>
            <select
              value={formData.projectId}
              onChange={(e) => setFormData({ ...formData, projectId: e.target.value })}
              className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
              required
            >
              <option value="">Şantiye Seçiniz</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} {p.city ? `(${p.city})` : ""}
                </option>
              ))}
            </select>
          </div>

          {/* Expense Type Buttons */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Masraf Kategorisi *
            </label>
            <div className="grid grid-cols-3 gap-2 text-xs">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, expenseType: "FUEL" })}
                className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition-all ${
                  formData.expenseType === "FUEL"
                    ? "bg-blue-600 text-white border-blue-600 shadow-md"
                    : "bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-400"
                }`}
              >
                <Fuel className="w-5 h-5" />
                <span className="font-semibold">Yakıt (Mazot)</span>
              </button>

              <button
                type="button"
                onClick={() => setFormData({ ...formData, expenseType: "MATERIAL" })}
                className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition-all ${
                  formData.expenseType === "MATERIAL"
                    ? "bg-blue-600 text-white border-blue-600 shadow-md"
                    : "bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-400"
                }`}
              >
                <Hammer className="w-5 h-5" />
                <span className="font-semibold">Acil Nalburiye</span>
              </button>

              <button
                type="button"
                onClick={() => setFormData({ ...formData, expenseType: "FOOD" })}
                className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition-all ${
                  formData.expenseType === "FOOD"
                    ? "bg-blue-600 text-white border-blue-600 shadow-md"
                    : "bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-400"
                }`}
              >
                <Utensils className="w-5 h-5" />
                <span className="font-semibold">Yemek & Kumanya</span>
              </button>
            </div>
          </div>

          {/* Amount (₺) */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
              <DollarSign className="w-3.5 h-3.5 text-emerald-500" />
              <span>Fiş / Fatura Tutarı (₺ KDV Dahil) *</span>
            </label>
            <div className="relative">
              <input
                type="number"
                step="0.01"
                placeholder="Örn: 1450.50"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                className="w-full pl-9 pr-4 py-2.5 text-sm bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white font-mono font-bold placeholder-slate-400 focus:outline-none focus:border-blue-500"
                required
              />
              <span className="absolute left-3.5 top-3 text-slate-400 font-bold text-xs">₺</span>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Açıklama / Harcama Nedeni
            </label>
            <textarea
              rows={2}
              placeholder="Örn: Şantiye jeneratörü için 40 litre motorin alındı."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Receipt Image / Camera Capture */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-between">
              <span>Fiş / Fatura Görseli *</span>
              <span className="text-[10px] text-slate-400 font-normal">Kamera veya Galeri</span>
            </label>

            {previewImage ? (
              <div className="relative rounded-xl overflow-hidden border border-slate-300 dark:border-slate-700 bg-slate-950 max-h-56 flex items-center justify-center p-2 group">
                <img
                  src={previewImage}
                  alt="Fiş Önizleme"
                  className="max-h-52 object-contain rounded-lg"
                />
                <button
                  type="button"
                  onClick={() => {
                    setPreviewImage(null)
                    setFormData((prev) => ({ ...prev, receiptUrl: "" }))
                  }}
                  className="absolute top-2 right-2 px-2.5 py-1 rounded-lg bg-black/75 text-white text-[11px] font-semibold hover:bg-red-600 transition-colors"
                >
                  Değiştir
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {/* Direct Camera Button */}
                <label className="flex flex-col items-center justify-center gap-2 p-5 border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-blue-500 dark:hover:border-blue-500 rounded-xl bg-slate-50 dark:bg-slate-950/50 cursor-pointer transition-colors group text-center">
                  <div className="p-2.5 rounded-full bg-blue-100 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform">
                    <Camera className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                    Kamera ile Çek
                  </span>
                  <span className="text-[10px] text-slate-400">Fişi anında fotoğrafla</span>
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>

                {/* File Upload Button */}
                <label className="flex flex-col items-center justify-center gap-2 p-5 border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-blue-500 dark:hover:border-blue-500 rounded-xl bg-slate-50 dark:bg-slate-950/50 cursor-pointer transition-colors group text-center">
                  <div className="p-2.5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 group-hover:scale-110 transition-transform">
                    <Upload className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                    Dosya / Galeri Seç
                  </span>
                  <span className="text-[10px] text-slate-400">PDF, JPG, PNG yükle</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>
              </div>
            )}
          </div>

          {/* Submit Button */}
          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-3">
            <Link
              href="/personnel/expenses"
              className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-semibold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            >
              İptal
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-md shadow-blue-600/30 flex items-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Kaydediliyor...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Masraf Bildirimini Gönder</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
