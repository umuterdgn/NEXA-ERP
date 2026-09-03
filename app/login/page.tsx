"use client"
/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * This code is the property of NXA Software.
 */

import { motion } from "framer-motion"
import { useState } from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Building, ShieldCheck, ArrowLeft } from "lucide-react"

export default function LoginPage() {
  const router = useRouter()
  const [selectedType, setSelectedType] = useState<"contractor" | "inspection" | null>(null)
  const [activeTab, setActiveTab] = useState<"admin" | "worker">("admin")
  const [adminFormData, setAdminFormData] = useState({
    email: "",
    password: ""
  })
  const [workerFormData, setWorkerFormData] = useState({
    username: "",
    password: ""
  })
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleAdminSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      const result = await signIn("credentials", {
        email: adminFormData.email,
        password: adminFormData.password,
        redirect: false
      })

      if (result?.error) {
        setError("Geçersiz e-posta veya şifre")
      } else {
        router.push("/admin")
        router.refresh()
      }
    } catch (error) {
      setError("Giriş yapılırken bir hata oluştu")
    } finally {
      setIsLoading(false)
    }
  }

  const handleWorkerSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      const result = await signIn("credentials", {
        email: workerFormData.username,
        password: workerFormData.password,
        redirect: false
      })

      if (result?.error) {
        setError("Geçersiz kullanıcı adı veya şifre")
      } else {
        router.push(selectedType === "inspection" ? "/admin/inspection" : "/personnel")
        router.refresh()
      }
    } catch (error) {
      setError("Giriş yapılırken bir hata oluştu")
    } finally {
      setIsLoading(false)
    }
  }

  const handleAdminChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAdminFormData(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleWorkerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setWorkerFormData(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  if (!selectedType) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center px-4 relative overflow-hidden">
        {/* Background decorative elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl" />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-4xl relative z-10"
        >
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-white mb-3">
              Nexa ERP
            </h1>
            <p className="text-slate-300 text-lg">
              Mahir Bakay Mühendislik Yönetim Sistemi
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Contractor Card */}
            <motion.button
              onClick={() => setSelectedType("contractor")}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="bg-gradient-to-br from-blue-600/20 to-blue-700/20 backdrop-blur-lg rounded-2xl p-8 border border-blue-500/30 hover:border-blue-400/50 transition-all shadow-2xl group"
            >
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="w-20 h-20 bg-blue-600/20 rounded-full flex items-center justify-center group-hover:bg-blue-600/30 transition-all">
                  <Building className="w-10 h-10 text-blue-400" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white mb-2">
                    Müteahhit / Yüklenici
                  </h2>
                  <p className="text-slate-300">
                    İnşaat projeleri, personel yönetimi ve operasyonel süreçler için
                  </p>
                </div>
              </div>
            </motion.button>

            {/* Inspection Card */}
            <motion.button
              onClick={() => setSelectedType("inspection")}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="bg-gradient-to-br from-purple-600/20 to-purple-700/20 backdrop-blur-lg rounded-2xl p-8 border border-purple-500/30 hover:border-purple-400/50 transition-all shadow-2xl group"
            >
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="w-20 h-20 bg-purple-600/20 rounded-full flex items-center justify-center group-hover:bg-purple-600/30 transition-all">
                  <ShieldCheck className="w-10 h-10 text-purple-400" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white mb-2">
                    Yapı Denetim OS
                  </h2>
                  <p className="text-slate-300">
                    Yapı denetim firmaları, YİBF yönetimi ve denetim kayıtları için
                  </p>
                </div>
              </div>
            </motion.button>
          </div>

          <div className="mt-8 text-center">
            <a
              href="/"
              className="text-slate-400 hover:text-white transition-colors text-sm"
            >
              Ana Sayfaya Dön
            </a>
          </div>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white flex flex-col lg:flex-row">
      {/* Left Side - Branding (Desktop Only) */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-900 via-purple-900 to-slate-900 p-12 flex-col justify-center items-center relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-20 left-20 w-64 h-64 bg-blue-500/20 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-20 w-64 h-64 bg-purple-500/20 rounded-full blur-3xl" />
        </div>
        
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
          className="relative z-10 text-center"
        >
          <h1 className="text-5xl font-bold text-white mb-4">
            Şantiyenizi Geleceğe Taşıyın
          </h1>
          <p className="text-xl text-blue-100 mb-8">
            Nexa ERP ile tüm operasyonlarınızı yapay zeka gücüyle tek merkezden yönetin
          </p>
          <div className="flex items-center justify-center gap-4">
            <div className="w-12 h-1 bg-blue-400 rounded-full" />
            <p className="text-blue-200 text-sm">Yapay Zeka Destekli</p>
            <div className="w-12 h-1 bg-purple-400 rounded-full" />
          </div>
        </motion.div>
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-white">
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
          className="w-full max-w-md"
        >
          <button
            onClick={() => setSelectedType(null)}
            className="flex items-center gap-2 text-slate-400 hover:text-slate-600 transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">Geri Dön</span>
          </button>

          <div className="text-center mb-8">
            <div className="w-16 h-16 mx-auto mb-4 bg-blue-100 rounded-full flex items-center justify-center">
              {selectedType === "contractor" ? (
                <Building className="w-8 h-8 text-blue-600" />
              ) : (
                <ShieldCheck className="w-8 h-8 text-purple-600" />
              )}
            </div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">
              {selectedType === "contractor" ? "Müteahhit Girişi" : "Yapı Denetim Girişi"}
            </h1>
            <p className="text-slate-500">
              {selectedType === "contractor"
                ? "Nexa ERP - İnşaat Yönetim Sistemi"
                : "Nexa ERP - Yapı Denetim Sistemi"}
            </p>
          </div>

          {/* Tabs */}
          <div className="flex mb-6 bg-slate-100 rounded-lg p-1">
            <button
              onClick={() => setActiveTab("admin")}
              className={`flex-1 py-2 px-4 rounded-md transition-all ${
                activeTab === "admin"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              Yönetici Girişi
            </button>
            <button
              onClick={() => setActiveTab("worker")}
              className={`flex-1 py-2 px-4 rounded-md transition-all ${
                activeTab === "worker"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              Personel Girişi
            </button>
          </div>

          {/* Admin Form */}
          {activeTab === "admin" && (
            <form onSubmit={handleAdminSubmit} className="space-y-6">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-2">
                  E-posta
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  required
                  value={adminFormData.email}
                  onChange={handleAdminChange}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="admin@nexa.com"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-2">
                  Şifre
                </label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  required
                  value={adminFormData.password}
                  onChange={handleAdminChange}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="••••••••"
                />
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-lg font-medium hover:from-blue-500 hover:to-purple-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
              >
                {isLoading ? "Giriş Yapılıyor..." : "Giriş Yap"}
              </button>
            </form>
          )}

          {/* Worker Form */}
          {activeTab === "worker" && (
            <form onSubmit={handleWorkerSubmit} className="space-y-6">
              <div>
                <label htmlFor="username" className="block text-sm font-medium text-slate-700 mb-2">
                  Kullanıcı Adı
                </label>
                <input
                  type="text"
                  id="username"
                  name="username"
                  required
                  value={workerFormData.username}
                  onChange={handleWorkerChange}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="ahmet.yilmaz"
                />
              </div>

              <div>
                <label htmlFor="workerPassword" className="block text-sm font-medium text-slate-700 mb-2">
                  Şifre
                </label>
                <input
                  type="password"
                  id="workerPassword"
                  name="password"
                  required
                  value={workerFormData.password}
                  onChange={handleWorkerChange}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="••••••••"
                />
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-green-600 to-green-700 text-white py-3 rounded-lg font-medium hover:from-green-500 hover:to-green-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
              >
                {isLoading ? "Giriş Yapılıyor..." : "Görevlerime Git"}
              </button>
            </form>
          )}

          <div className="mt-6 text-center">
            <a
              href="/"
              className="text-slate-400 hover:text-slate-600 transition-colors text-sm"
            >
              Ana Sayfaya Dön
            </a>
          </div>
        </motion.div>
      </div>
    </div>
  )
}