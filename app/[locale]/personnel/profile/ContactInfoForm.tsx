/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * This code is the property of NXA Software.
 */

"use client"

import { useState } from "react"
import { User, Mail, Phone, Save } from "lucide-react"
import { updateContactInfo } from "./actions"

interface ContactInfoFormProps {
  currentData: {
    email: string
    phone: string
  }
}

export default function ContactInfoForm({ currentData }: ContactInfoFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(formData: FormData) {
    setIsSubmitting(true)
    try {
      await updateContactInfo(formData)
    } catch (error) {
      console.error("İletişim bilgileri güncellenirken hata:", error)
      setIsSubmitting(false)
    }
  }

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
      <div className="flex items-center gap-3 mb-6">
        <User className="w-5 h-5 text-slate-400" />
        <h3 className="text-lg font-semibold text-white">İletişim Bilgileri</h3>
      </div>

      <form action={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-slate-400 mb-2">E-posta</label>
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
            <input
              type="email"
              name="email"
              defaultValue={currentData.email}
              className="w-full pl-12 pr-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-blue-500 transition-colors"
              required
            />
          </div>
        </div>
        <div>
          <label className="block text-sm text-slate-400 mb-2">Telefon</label>
          <div className="relative">
            <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
            <input
              type="tel"
              name="phone"
              defaultValue={currentData.phone}
              className="w-full pl-12 pr-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-blue-500 transition-colors"
              required
            />
          </div>
        </div>

        <div className="md:col-span-2">
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-700 disabled:cursor-not-allowed text-white rounded-xl transition-colors font-medium"
          >
            <Save className="w-4 h-4" />
            {isSubmitting ? "Kaydediliyor..." : "Kaydet"}
          </button>
        </div>
      </form>
    </div>
  )
}
