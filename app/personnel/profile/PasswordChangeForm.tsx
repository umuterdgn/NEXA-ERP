/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * This code is the property of NXA Software.
 */

"use client"

import { useState } from "react"
import { Shield, Lock, Save } from "lucide-react"
import { changePassword } from "./actions"

export default function PasswordChangeForm() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")

  async function handleSubmit(formData: FormData) {
    setIsSubmitting(true)
    setError("")
    try {
      const result = await changePassword(formData)
      if (result?.error) {
        setError(result.error)
        setIsSubmitting(false)
      }
    } catch (error) {
      console.error("Şifre değiştirilirken hata:", error)
      setError("Şifre değiştirilirken bir hata oluştu")
      setIsSubmitting(false)
    }
  }

  return (
    <div className="bg-gradient-to-br from-purple-600/10 to-blue-600/10 border border-purple-500/30 rounded-2xl p-6">
      <div className="flex items-center gap-3 mb-6">
        <Shield className="w-5 h-5 text-purple-400" />
        <h3 className="text-lg font-semibold text-white">Hesap Güvenliği</h3>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-900/30 border border-red-500/50 rounded-lg text-red-400 text-sm">
          {error}
        </div>
      )}

      <form action={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm text-slate-400 mb-2">Mevcut Şifre</label>
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
            <input
              type="password"
              name="currentPassword"
              required
              className="w-full pl-12 pr-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-purple-500 transition-colors"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm text-slate-400 mb-2">Yeni Şifre</label>
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
            <input
              type="password"
              name="newPassword"
              required
              minLength={6}
              className="w-full pl-12 pr-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-purple-500 transition-colors"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm text-slate-400 mb-2">Yeni Şifre Tekrar</label>
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
            <input
              type="password"
              name="confirmPassword"
              required
              minLength={6}
              className="w-full pl-12 pr-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-purple-500 transition-colors"
            />
          </div>
        </div>

        <div>
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-500 disabled:bg-purple-700 disabled:cursor-not-allowed text-white rounded-xl transition-colors font-medium"
          >
            <Save className="w-4 h-4" />
            {isSubmitting ? "Değiştiriliyor..." : "Şifreyi Değiştir"}
          </button>
        </div>
      </form>
    </div>
  )
}
