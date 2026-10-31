/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * This code is the property of NXA Software.
 */

"use client"

import { useState } from "react"
import { Plus, XCircle } from "lucide-react"
import { createISGReport } from "./actions"

export default function NewISGReportButton() {
  const [showModal, setShowModal] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(formData: FormData) {
    setIsSubmitting(true)
    try {
      await createISGReport(formData)
    } catch (error) {
      console.error("İSG bildirimi gönderilirken hata:", error)
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="flex items-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-500 text-white rounded-xl transition-colors font-medium"
      >
        <Plus className="w-5 h-5" />
        Yeni Bildirim
      </button>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 rounded-2xl p-6 max-w-md w-full border border-slate-800">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-white">İSG Bildirimi</h3>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
              >
                <XCircle className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <form action={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm text-slate-400 mb-2">Olay Türü</label>
                <select 
                  name="type"
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-red-500 transition-colors"
                  required
                >
                  <option value="TEHLIKE">Tehlike</option>
                  <option value="KAZA_TUTANAGI">Kaza Tutanağı</option>
                  <option value="EKSIK_DOKUM">Eksik Doküman</option>
                </select>
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-2">Tarih</label>
                <input
                  type="date"
                  name="date"
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-red-500 transition-colors"
                  required
                />
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-2">Konum</label>
                <input
                  type="text"
                  name="location"
                  placeholder="Örn: Bina A - 3. Kat"
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-red-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-2">Açıklama</label>
                <textarea
                  name="description"
                  placeholder="Olayı detaylı açıklayın..."
                  rows={3}
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-red-500 transition-colors resize-none"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 bg-red-600 hover:bg-red-500 disabled:bg-red-700 disabled:cursor-not-allowed text-white rounded-xl transition-colors font-medium"
              >
                {isSubmitting ? "Gönderiliyor..." : "Bildir"}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
