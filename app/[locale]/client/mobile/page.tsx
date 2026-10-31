"use client"
/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * This code is the property of NXA Software.
 */

import { useState } from "react"
import { Home, FileText, Camera, User, Bell, FolderKanban, DollarSign, AlertTriangle, X, Upload, Image as ImageIcon } from "lucide-react"
import { useSession } from "next-auth/react"
import { toast } from "react-hot-toast"

export const dynamic = 'force-dynamic'

export default function ContractorMobilePage() {
  const [activeTab, setActiveTab] = useState("home")
  const [uploadModalOpen, setUploadModalOpen] = useState(false)
  const session = useSession()
  
  const userName = session?.data?.user?.name || "Müteahhit"

  if (session?.status === "loading") {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-white">Yükleniyor...</div>
      </div>
    )
  }

  const contractorData = {
    pendingPayment: 120000,
    openDeficiencies: 3,
    criticalDeficiencies: 2
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const handleUploadEvidence = () => {
    setUploadModalOpen(true)
  }

  const handleCameraCapture = () => {
    toast.success("Kamera açılıyor... (Demo)")
    setUploadModalOpen(false)
  }

  const handleGallerySelect = () => {
    toast.success("Galeri açılıyor... (Demo)")
    setUploadModalOpen(false)
  }

  return (
    <div className="min-h-screen bg-slate-900 pb-24">
      {/* Mobile Container */}
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="sticky top-0 bg-slate-900/95 backdrop-blur-sm border-b border-slate-800 p-4 z-50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm">Hoş Geldiniz,</p>
              <h1 className="text-xl font-bold text-white">
                {userName} Bey
              </h1>
            </div>
            <button className="p-2 rounded-lg bg-slate-800 text-slate-400 hover:text-white transition-colors relative">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 space-y-6">
          {/* Financial Summary Cards */}
          <div className="grid grid-cols-1 gap-4">
            <div className="bg-gradient-to-br from-green-600 to-emerald-600 rounded-2xl p-6 text-white shadow-lg">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-green-100 text-sm">Onay Bekleyen Hakedişim</h3>
                <DollarSign className="w-5 h-5 opacity-80" />
              </div>
              <p className="text-3xl font-bold">{formatCurrency(contractorData.pendingPayment)}</p>
              <p className="text-green-100 text-sm mt-1">Son güncelleme: Bugün</p>
            </div>

            <div className="bg-gradient-to-br from-red-600 to-rose-600 rounded-2xl p-6 text-white shadow-lg">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-red-100 text-sm">Açık Eksikliklerim</h3>
                <AlertTriangle className="w-5 h-5 opacity-80" />
              </div>
              <div className="flex items-baseline gap-2">
                <p className="text-3xl font-bold">{contractorData.openDeficiencies}</p>
                <span className="text-red-100">Eksiklik</span>
              </div>
              <p className="text-red-100 text-sm mt-1">
                {contractorData.criticalDeficiencies} Kritik Eksik
              </p>
            </div>
          </div>

          {/* Quick Access Areas */}
          <div className="grid grid-cols-2 gap-4">
            <a
              href="/client/projects"
              className="bg-slate-800 rounded-2xl p-6 text-center hover:bg-slate-700 transition-colors active:scale-95"
            >
              <FolderKanban className="w-10 h-10 mx-auto mb-3 text-blue-400" />
              <p className="text-white font-medium">Projelerim</p>
              <p className="text-slate-400 text-sm mt-1">4 Aktif Proje</p>
            </a>
            <a
              href="/client/payments"
              className="bg-slate-800 rounded-2xl p-6 text-center hover:bg-slate-700 transition-colors active:scale-95"
            >
              <DollarSign className="w-10 h-10 mx-auto mb-3 text-green-400" />
              <p className="text-white font-medium">Hakedişlerim</p>
              <p className="text-slate-400 text-sm mt-1">Son Ödeme: 15 Ağu</p>
            </a>
          </div>

          {/* Recent Activity */}
          <div>
            <h3 className="text-white font-semibold mb-4">Son Aktiviteler</h3>
            <div className="space-y-3">
              <div className="bg-slate-800 rounded-xl p-4 flex items-center gap-4">
                <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-green-400" />
                </div>
                <div className="flex-1">
                  <p className="text-white font-medium">Hakediş talebi gönderildi</p>
                  <p className="text-slate-400 text-sm">İskenderun TOKİ - ₺120,000</p>
                </div>
              </div>
              <div className="bg-slate-800 rounded-xl p-4 flex items-center gap-4">
                <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                  <ImageIcon className="w-5 h-5 text-blue-400" />
                </div>
                <div className="flex-1">
                  <p className="text-white font-medium">Fotoğraf kanıtı yüklendi</p>
                  <p className="text-slate-400 text-sm">B Blok - Beton dökümü</p>
                </div>
              </div>
              <div className="bg-slate-800 rounded-xl p-4 flex items-center gap-4">
                <div className="w-10 h-10 bg-red-500/20 rounded-lg flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-red-400" />
                </div>
                <div className="flex-1">
                  <p className="text-white font-medium">Yeni eksiklik bildirimi</p>
                  <p className="text-slate-400 text-sm">C Blok - Paspayı sorunu</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Upload Modal */}
      {uploadModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end justify-center">
          <div className="bg-slate-800 rounded-t-3xl w-full max-w-md p-6 animate-slide-up">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-white">Kanıt Yükle</h3>
              <button
                onClick={() => setUploadModalOpen(false)}
                className="p-2 rounded-lg bg-slate-700 text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <button
                onClick={handleCameraCapture}
                className="w-full flex items-center gap-4 p-4 bg-blue-600 hover:bg-blue-500 rounded-xl text-white transition-colors"
              >
                <Camera className="w-8 h-8" />
                <div className="text-left">
                  <p className="font-medium">Kamerayı Aç</p>
                  <p className="text-sm text-blue-100">Yeni fotoğraf çek</p>
                </div>
              </button>
              
              <button
                onClick={handleGallerySelect}
                className="w-full flex items-center gap-4 p-4 bg-slate-700 hover:bg-slate-600 rounded-xl text-white transition-colors"
              >
                <Upload className="w-8 h-8" />
                <div className="text-left">
                  <p className="font-medium">Galeriden Seç</p>
                  <p className="text-sm text-slate-300">Mevcut fotoğraf yükle</p>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Navigation Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-slate-900/95 backdrop-blur-sm border-t border-slate-800 z-50">
        <div className="max-w-md mx-auto">
          <div className="flex items-center justify-around p-3">
            <button
              onClick={() => setActiveTab("home")}
              className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-colors ${
                activeTab === "home" ? "text-blue-400" : "text-slate-400"
              }`}
            >
              <Home className="w-6 h-6" />
              <span className="text-xs">Anasayfa</span>
            </button>
            <button
              onClick={() => setActiveTab("documents")}
              className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-colors ${
                activeTab === "documents" ? "text-blue-400" : "text-slate-400"
              }`}
            >
              <FileText className="w-6 h-6" />
              <span className="text-xs">Evraklar</span>
            </button>
            
            {/* Center FAB Button */}
            <button
              onClick={handleUploadEvidence}
              className="relative -top-6 bg-gradient-to-br from-blue-600 to-purple-600 p-4 rounded-full shadow-lg hover:shadow-xl transition-all active:scale-95"
            >
              <Camera className="w-7 h-7 text-white" />
            </button>
            
            <button
              onClick={() => setActiveTab("notifications")}
              className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-colors relative ${
                activeTab === "notifications" ? "text-blue-400" : "text-slate-400"
              }`}
            >
              <Bell className="w-6 h-6" />
              <span className="absolute top-1 right-2 w-2 h-2 bg-red-500 rounded-full"></span>
              <span className="text-xs">Bildirimler</span>
            </button>
            <button
              onClick={() => setActiveTab("profile")}
              className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-colors ${
                activeTab === "profile" ? "text-blue-400" : "text-slate-400"
              }`}
            >
              <User className="w-6 h-6" />
              <span className="text-xs">Profil</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
