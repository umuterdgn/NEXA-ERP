/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * This code is the property of NXA Software.
 */

"use client"

import { useState } from "react"
import { AlertTriangle, XCircle } from "lucide-react"
import { reportEquipmentIssue } from "./actions"

interface ReportEquipmentButtonProps {
  equipment: any[]
}

export default function ReportEquipmentButton({ equipment }: ReportEquipmentButtonProps) {
  const [showModal, setShowModal] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(formData: FormData) {
    setIsSubmitting(true)
    try {
      await reportEquipmentIssue(formData)
    } catch (error) {
      console.error("Arıza bildirimi gönderilirken hata:", error)
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="flex items-center gap-2 px-4 py-3 bg-red-600 hover:bg-red-500 text-white rounded-xl transition-colors"
      >
        <AlertTriangle className="w-4 h-4" />
        <span className="text-sm">Arıza Bildir</span>
      </button>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 rounded-2xl p-6 max-w-md w-full border border-slate-800">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-white">Ekipman Arıza Bildirimi</h3>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
              >
                <XCircle className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <form action={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm text-slate-400 mb-2">Ekipman Seçin</label>
                <select 
                  name="assignmentId"
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-blue-500 transition-colors"
                  required
                >
                  {equipment.map(e => (
                    <option key={e.id} value={e.id}>{e.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-2">Arıza Türü</label>
                <select 
                  name="issueType"
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-blue-500 transition-colors"
                  required
                >
                  <option value="mechanical">Mekanik Arıza</option>
                  <option value="electrical">Elektrik Arızası</option>
                  <option value="software">Yazılım Sorunu</option>
                  <option value="physical">Fiziksel Hasar</option>
                  <option value="other">Diğer</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-2">Açıklama</label>
                <textarea
                  name="description"
                  placeholder="Arızayı detaylı açıklayın..."
                  rows={3}
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors resize-none"
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
