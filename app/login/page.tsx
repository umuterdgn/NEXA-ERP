"use client"
/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Nexa ERP - Enterprise Unified Login Page
 * Dual Mode: Müteahhit & Şantiye Girişi / Yapı Denetim Girişi
 */

import React, { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  Building2,
  ShieldCheck,
  Mail,
  Lock,
  ArrowRight,
  Eye,
  EyeOff,
  Sparkles,
  Bot,
  FlaskConical,
  HardHat,
  Loader2,
  CheckCircle2,
  AlertCircle
} from "lucide-react"

export default function LoginPage() {
  const router = useRouter()
  const [loginMode, setLoginMode] = useState<"contractor" | "inspection">("contractor")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [loginSuccess, setLoginSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) {
      setError("Lütfen e-posta / kullanıcı adı ve şifrenizi giriniz.")
      return
    }

    setIsLoading(true)
    setError("")

    try {
      const result = await signIn("credentials", {
        email: email.trim(),
        password: password,
        redirect: false
      })

      if (result?.error) {
        setError("Geçersiz e-posta veya şifre. Lütfen bilgilerinizi kontrol edin.")
        setIsLoading(false)
        return
      }

      setLoginSuccess(true)

      // Fetch user session to determine authoritative role
      let targetPath = loginMode === "inspection" ? "/dashboard" : "/admin"
      try {
        const sessionRes = await fetch("/api/auth/session")
        if (sessionRes.ok) {
          const sessionData = await sessionRes.json()
          const role = sessionData?.user?.role

          if (role === "INSPECTOR" || role === "AUDITOR") {
            targetPath = "/dashboard"
          } else if (role === "SUBCONTRACTOR") {
            targetPath = "/subcontractor"
          } else if (role === "WORKER" || role === "STAFF") {
            targetPath = "/personnel"
          } else if (role === "SITE_MANAGER" || role === "ADMIN" || role === "SUPER_ADMIN") {
            targetPath = "/admin"
          }
        }
      } catch (err) {
        console.error("Session fetch error:", err)
      }

      router.push(targetPath)
      router.refresh()
    } catch (err) {
      console.error("Login submission error:", err)
      setError("Giriş yapılırken bir sunucu hatası oluştu.")
      setIsLoading(false)
    }
  }

  const handleQuickDemo = (demoType: "admin" | "site_manager" | "subcontractor" | "worker" | "inspector") => {
    setError("")
    if (demoType === "admin") {
      setLoginMode("contractor")
      setEmail("admin@nexa.com")
      setPassword("123456")
    } else if (demoType === "site_manager") {
      setLoginMode("contractor")
      setEmail("sefi@nexa.com")
      setPassword("123456")
    } else if (demoType === "subcontractor") {
      setLoginMode("contractor")
      setEmail("taseron@nexa.com")
      setPassword("123456")
    } else if (demoType === "worker") {
      setLoginMode("contractor")
      setEmail("personel@nexa.com")
      setPassword("123456")
    } else if (demoType === "inspector") {
      setLoginMode("inspection")
      setEmail("denetim@nexa.com")
      setPassword("123456")
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col justify-center items-center px-4 py-8 relative overflow-hidden selection:bg-cyan-500 selection:text-slate-950">
      {/* Background Glows & Architectural Grid */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(14,165,233,0.15),rgba(255,255,255,0))] pointer-events-none" />
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-cyan-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main Container */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-lg z-10"
      >
        {/* Brand Logo & Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-3 group">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 via-cyan-500 to-indigo-600 p-0.5 shadow-xl shadow-cyan-500/20 group-hover:shadow-cyan-500/40 transition-all">
              <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
                <span className="text-2xl font-black bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">
                  N
                </span>
              </div>
            </div>
            <div className="text-left">
              <span className="text-2xl font-black tracking-tight text-white flex items-center gap-1.5">
                NEXA <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">ERP</span>
              </span>
              <p className="text-[11px] text-slate-400 font-medium tracking-wide">YENİ NESİL ŞANTİYE & DENETİM PLATFORMU</p>
            </div>
          </Link>
        </div>

        {/* Dual Mode Switcher Tabs */}
        <div className="grid grid-cols-2 p-1.5 bg-slate-900/90 rounded-2xl border border-slate-800 shadow-xl mb-6 backdrop-blur-md">
          {/* Müteahhit Girişi */}
          <button
            type="button"
            onClick={() => {
              setLoginMode("contractor")
              setError("")
            }}
            className={`relative flex items-center justify-center gap-2.5 py-3 px-4 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
              loginMode === "contractor"
                ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-600/30 border border-blue-400/30"
                : "text-slate-400 hover:text-white hover:bg-slate-800/50"
            }`}
          >
            <Building2 className={`w-4 h-4 ${loginMode === "contractor" ? "text-white" : "text-blue-400"}`} />
            <span>Müteahhit Girişi</span>
          </button>

          {/* Yapı Denetim Girişi */}
          <button
            type="button"
            onClick={() => {
              setLoginMode("inspection")
              setError("")
            }}
            className={`relative flex items-center justify-center gap-2.5 py-3 px-4 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
              loginMode === "inspection"
                ? "bg-gradient-to-r from-cyan-600 to-teal-600 text-white shadow-lg shadow-cyan-600/30 border border-cyan-400/30"
                : "text-slate-400 hover:text-white hover:bg-slate-800/50"
            }`}
          >
            <ShieldCheck className={`w-4 h-4 ${loginMode === "inspection" ? "text-white" : "text-cyan-400"}`} />
            <span>Yapı Denetim</span>
          </button>
        </div>

        {/* Form Card */}
        <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative">
          {/* Mode Sub-Badge & Description */}
          <div className="mb-6 pb-4 border-b border-slate-800 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                {loginMode === "contractor" ? "Müteahhit & Şantiye Portalı" : "Yapı Denetim OS & e-YİBF"}
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                {loginMode === "contractor"
                  ? "Admin, Şantiye Şefi, Taşeron ve Personel girişi"
                  : "Bakanlık e-YİBF, Numune/Karot ve Kalite Kontrol"}
              </p>
            </div>
            <span
              className={`px-2.5 py-1 rounded-full text-[11px] font-semibold border ${
                loginMode === "contractor"
                  ? "bg-blue-500/10 text-blue-400 border-blue-500/30"
                  : "bg-cyan-500/10 text-cyan-400 border-cyan-500/30"
              }`}
            >
              {loginMode === "contractor" ? "ERP / Şantiye" : "e-YİBF Aktif"}
            </span>
          </div>

          {/* Error Message */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-5 p-3.5 bg-red-950/60 border border-red-500/40 rounded-xl text-red-300 text-xs flex items-center gap-2.5"
              >
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                <span>{error}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* E-posta veya Kullanıcı Adı */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                E-posta veya Kullanıcı Adı
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={loginMode === "contractor" ? "admin@nexa.com veya kullanici.adi" : "denetim@nexa.com"}
                  className="w-full pl-10 pr-4 py-3 bg-slate-950/80 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 text-sm transition-all"
                  required
                />
              </div>
            </div>

            {/* Şifre */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Şifre
                </label>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-11 py-3 bg-slate-950/80 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 text-sm transition-all"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3.5 text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading || loginSuccess}
              className={`w-full py-3.5 px-4 rounded-xl font-bold text-sm text-white shadow-xl flex items-center justify-center gap-2 transition-all cursor-pointer ${
                loginMode === "contractor"
                  ? "bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-500 hover:to-indigo-500 shadow-blue-600/30"
                  : "bg-gradient-to-r from-cyan-600 via-teal-600 to-cyan-700 hover:from-cyan-500 hover:to-teal-500 shadow-cyan-600/30"
              } disabled:opacity-60 disabled:cursor-not-allowed`}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>Kimlik Doğrulanıyor...</span>
                </>
              ) : loginSuccess ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                  <span>Giriş Başarılı, Yönlendiriliyorsunuz...</span>
                </>
              ) : (
                <>
                  <span>{loginMode === "contractor" ? "Müteahhit Portalına Giriş Yap" : "Yapı Denetim Portalına Giriş Yap"}</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Credentials */}
          <div className="mt-6 pt-5 border-t border-slate-800">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 text-center mb-3">
              Hızlı Demo Hesapları
            </p>
            {loginMode === "contractor" ? (
              <div className="grid grid-cols-2 gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => handleQuickDemo("admin")}
                  className="p-2 bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 rounded-lg text-slate-300 hover:text-white transition-all text-left flex items-center gap-2"
                >
                  <Building2 className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                  <span className="truncate">Yönetici (Admin)</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickDemo("site_manager")}
                  className="p-2 bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 rounded-lg text-slate-300 hover:text-white transition-all text-left flex items-center gap-2"
                >
                  <HardHat className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span className="truncate">Şantiye Şefi</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickDemo("subcontractor")}
                  className="p-2 bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 rounded-lg text-slate-300 hover:text-white transition-all text-left flex items-center gap-2"
                >
                  <Sparkles className="w-3.5 h-3.5 text-orange-400 shrink-0" />
                  <span className="truncate">Taşeron Portalı</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickDemo("worker")}
                  className="p-2 bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 rounded-lg text-slate-300 hover:text-white transition-all text-left flex items-center gap-2"
                >
                  <HardHat className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span className="truncate">Saha Personeli</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => handleQuickDemo("inspector")}
                  className="p-2.5 bg-slate-800/80 hover:bg-slate-800 border border-cyan-500/30 rounded-lg text-slate-200 hover:text-white transition-all flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-cyan-400 shrink-0" />
                    <span className="font-medium">Yapı Denetim Uzmanı (denetim@nexa.com)</span>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-mono">123456</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-xs text-slate-500">
          <span>© 2026 Nexa ERP Platformu. Tüm hakları saklıdır.</span>
          <span className="mx-2">•</span>
          <Link href="/" className="hover:text-slate-300 transition-colors">
            Ana Sayfa
          </Link>
        </div>
      </motion.div>
    </div>
  )
}