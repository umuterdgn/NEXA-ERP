/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * This code is the property of NXA Software.
 */

"use client"

import { useState } from "react"
import { XCircle } from "lucide-react"
import { createAdvanceRequest } from "./actions"

interface AdvanceRequestModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function AdvanceRequestModal({ isOpen, onClose }: AdvanceRequestModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (!isOpen) return null

  async function handleSubmit(formData: FormData) {
    setIsSubmitting(true)
    try {
      await createAdvanceRequest(formData)
    } catch (error) {
      console.error("Avans talebi oluşturulurken hata:", error)
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 rounded-2xl p-6 max-w-md w-full border border-slate-800">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-white">Yeni Avans Talebi</h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <XCircle className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        <form action={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-slate-400 mb-2">Tutar (₺)</label>
            <input
              type="number"
              name="amount"
              placeholder="5000"
              step="0.01"
              min="0"
              className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
              required
            />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-2">Talep Tarihi</label>
            <input
              type="date"
              name="date"
              className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-blue-500 transition-colors"
              required
            />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-2">Gerekçe</label>
            <textarea
              name="reason"
              placeholder="Avans talebinizin nedenini açıklayın..."
              rows={3}
              className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors resize-none"
            />
          </div>
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-700 disabled:cursor-not-allowed text-white rounded-xl transition-colors font-medium"
          >
            {isSubmitting ? "Gönderiliyor..." : "Talep Gönder"}
          </button>
        </form>
      </div>
    </div>
  )
}
