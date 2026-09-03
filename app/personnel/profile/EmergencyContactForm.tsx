/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * This code is the property of NXA Software.
 */

"use client"

import { useState } from "react"
import { AlertCircle, Save } from "lucide-react"
import { updateEmergencyContact } from "./actions"

interface EmergencyContactFormProps {
  currentData: {
    name: string
    relationship: string
    phone: string
  }
}

export default function EmergencyContactForm({ currentData }: EmergencyContactFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(formData: FormData) {
    setIsSubmitting(true)
    try {
      await updateEmergencyContact(formData)
    } catch (error) {
      console.error("Acil durun bilgileri güncellenirken hata:", error)
      setIsSubmitting(false)
    }
  }

  return (
    <form action={handleSubmit} className="mt-4 space-y-3">
      <div>
        <label className="block text-sm text-slate-400 mb-2">Ad Soyad</label>
        <input
          type="text"
          name="name"
          defaultValue={currentData.name}
          className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-red-500 transition-colors"
        />
      </div>
      <div>
        <label className="block text-sm text-slate-400 mb-2">Yakınlık</label>
        <input
          type="text"
          name="relation"
          defaultValue={currentData.relationship}
          className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-red-500 transition-colors"
        />
      </div>
      <div>
        <label className="block text-sm text-slate-400 mb-2">Telefon</label>
        <input
          type="tel"
          name="phone"
          defaultValue={currentData.phone}
          className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-red-500 transition-colors"
        />
      </div>
      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full flex items-center justify-center gap-2 py-3 bg-red-600 hover:bg-red-500 disabled:bg-red-700 disabled:cursor-not-allowed text-white rounded-xl transition-colors font-medium"
      >
        <Save className="w-4 h-4" />
        {isSubmitting ? "Kaydediliyor..." : "Kaydet"}
      </button>
    </form>
  )
}
