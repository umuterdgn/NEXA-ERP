/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * This code is the property of NXA Software.
 */

"use client"

import { useState } from "react"
import { CreditCard, Save } from "lucide-react"
import { updateBankInfo } from "./actions"

interface BankInfoFormProps {
  currentData: {
    bankName: string
    iban: string
  }
}

export default function BankInfoForm({ currentData }: BankInfoFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(formData: FormData) {
    setIsSubmitting(true)
    try {
      await updateBankInfo(formData)
    } catch (error) {
      console.error("Banka bilgileri güncellenirken hata:", error)
      setIsSubmitting(false)
    }
  }

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
      <div className="flex items-center gap-3 mb-6">
        <CreditCard className="w-5 h-5 text-slate-400" />
        <h3 className="text-lg font-semibold text-white">Banka Bilgileri</h3>
      </div>

      <form action={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2">
          <label className="block text-sm text-slate-400 mb-2">Banka Adı</label>
          <input
            type="text"
            name="bankName"
            defaultValue={currentData.bankName}
            placeholder="Örn: Garanti BBVA"
            className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-blue-500 transition-colors"
          />
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm text-slate-400 mb-2">IBAN</label>
          <input
            type="text"
            name="iban"
            defaultValue={currentData.iban}
            placeholder="TR00 0000 0000 0000 0000 0000 00"
            className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-blue-500 transition-colors uppercase"
          />
        </div>

        <div className="md:col-span-2">
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-500 disabled:bg-green-700 disabled:cursor-not-allowed text-white rounded-xl transition-colors font-medium"
          >
            <Save className="w-4 h-4" />
            {isSubmitting ? "Kaydediliyor..." : "Kaydet"}
          </button>
        </div>
      </form>
    </div>
  )
}
