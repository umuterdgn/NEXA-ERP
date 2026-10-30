"use client"

import { useState, useTransition } from "react"
import { Box, X, Loader2, Plus, DollarSign } from "lucide-react"
import { createConceptTemplate } from "@/app/actions/franchise"

interface CreateTemplateModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

export default function CreateTemplateModal({
  isOpen,
  onClose,
  onSuccess,
}: CreateTemplateModalProps) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    name: "",
    baseBudget: "1850000",
  })

  if (!isOpen) return null

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)

    if (!formData.name.trim()) {
      setError("Lütfen şablon / konsept adını giriniz.")
      return
    }
    const budgetNum = parseFloat(formData.baseBudget)
    if (!budgetNum || budgetNum <= 0) {
      setError("Lütfen geçerli bir taban bütçe giriniz.")
      return
    }

    startTransition(async () => {
      try {
        const payload = new FormData()
        payload.append("name", formData.name.trim())
        payload.append("baseBudget", formData.baseBudget)

        const res = await createConceptTemplate(payload)
        if (!res.success) {
          setError(res.error || "Şablon oluşturulamadı.")
          return
        }

        setFormData({
          name: "",
          baseBudget: "1850000",
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
        className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 space-y-5 shadow-2xl relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Box className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Yeni Şablon Tanımla</h3>
              <p className="text-xs text-slate-400">Standart konsept ve taban bütçe oluşturun</p>
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

        {/* Error message */}
        {error && (
          <div className="p-3 rounded-xl bg-red-950/60 border border-red-800 text-xs text-red-300">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Şablon / Konsept Adı <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              name="name"
              placeholder="Örn: 500m² Cadde Mağazası veya AVM Kiosk"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3.5 py-2.5 text-xs bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-colors"
              required
              disabled={isPending}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Taban Kurulum Bütçesi (₺) <span className="text-rose-500">*</span>
            </label>
            <input
              type="number"
              name="baseBudget"
              placeholder="Örn: 1850000"
              value={formData.baseBudget}
              onChange={(e) => setFormData({ ...formData, baseBudget: e.target.value })}
              className="w-full px-3.5 py-2.5 text-xs bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-colors"
              required
              disabled={isPending}
            />
          </div>

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
                  <span>Şablonu Kaydet</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
