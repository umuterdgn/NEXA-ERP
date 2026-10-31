"use client"
/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * This code is the property of NXA Software.
 */

import { useEffect, useState } from "react"
import { Home, MessageCircle, Bell, User, Map, Bot, ClipboardList, Users, DollarSign, FileText, ChevronRight, Sun, Moon } from "lucide-react"
import { useTheme } from "next-themes"
import { useSession } from "next-auth/react"

export default function MobileDashboardPage() {
  const [activeTab, setActiveTab] = useState("home")
  const { theme, setTheme } = useTheme()
  const { data: session } = useSession()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const quickActions = [
    { id: "map", label: "Şantiye Haritası", icon: Map, color: "bg-blue-500", href: "/admin/map" },
    { id: "ai", label: "AI Asistan", icon: Bot, color: "bg-purple-500", href: "/admin/ai-assistant" },
    { id: "reports", label: "Sabah Raporları", icon: ClipboardList, color: "bg-green-500", href: "/admin/reports" },
    { id: "personnel", label: "Personel Durumu", icon: Users, color: "bg-orange-500", href: "/admin/personel" }
  ]

  const financialData = {
    cashBalance: 2450000,
    pendingPayments: 890000,
    todayRevenue: 125000
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return "Günaydın"
    if (hour < 18) return "İyi günler"
    return "İyi akşamlar"
  }

  return (
    <div className="min-h-screen bg-slate-900 pb-20">
      {/* Mobile Container */}
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="sticky top-0 bg-slate-900/95 backdrop-blur-sm border-b border-slate-800 p-4 z-50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm">{getGreeting()},</p>
              <h1 className="text-xl font-bold text-white">
                {session?.user?.name || "Yönetici"} Bey
              </h1>
            </div>
            <div className="flex items-center gap-3">
              {mounted && (
                <button
                  onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                  className="p-2 rounded-lg bg-slate-800 text-slate-400 hover:text-white transition-colors"
                >
                  {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                </button>
              )}
              <button className="p-2 rounded-lg bg-slate-800 text-slate-400 hover:text-white transition-colors relative">
                <Bell className="w-5 h-5" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 space-y-6">
          {/* Financial Summary Card */}
          <div className="bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl p-6 text-white shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Günün Özeti</h2>
              <DollarSign className="w-6 h-6 opacity-80" />
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-blue-100">Kasa Durumu</span>
                <span className="text-xl font-bold">{formatCurrency(financialData.cashBalance)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-blue-100">Bekleyen Hakedişler</span>
                <span className="text-xl font-bold">{formatCurrency(financialData.pendingPayments)}</span>
              </div>
              <div className="flex justify-between items-center pt-3 border-t border-white/20">
                <span className="text-blue-100">Bugün Tahsilat</span>
                <span className="text-lg font-semibold">{formatCurrency(financialData.todayRevenue)}</span>
              </div>
            </div>
          </div>

          {/* Quick Access Grid */}
          <div>
            <h3 className="text-white font-semibold mb-4">Hızlı Erişim</h3>
            <div className="grid grid-cols-2 gap-4">
              {quickActions.map((action) => (
                <a
                  key={action.id}
                  href={action.href}
                  className={`${action.color} rounded-2xl p-6 text-white shadow-lg hover:opacity-90 transition-opacity active:scale-95`}
                >
                  <div className="flex flex-col items-center text-center">
                    <action.icon className="w-10 h-10 mb-3" />
                    <span className="font-medium">{action.label}</span>
                  </div>
                </a>
              ))}
            </div>
          </div>

          {/* Recent Activity */}
          <div>
            <h3 className="text-white font-semibold mb-4">Son Aktiviteler</h3>
            <div className="space-y-3">
              <div className="bg-slate-800 rounded-xl p-4 flex items-center gap-4">
                <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                  <FileText className="w-5 h-5 text-green-400" />
                </div>
                <div className="flex-1">
                  <p className="text-white font-medium">Yeni hakediş onaylandı</p>
                  <p className="text-slate-400 text-sm">Yılmaz İnşaat - ₺450,000</p>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-500" />
              </div>
              <div className="bg-slate-800 rounded-xl p-4 flex items-center gap-4">
                <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                  <Bot className="w-5 h-5 text-blue-400" />
                </div>
                <div className="flex-1">
                  <p className="text-white font-medium">AI risk analizi tamamlandı</p>
                  <p className="text-slate-400 text-sm">4 yüksek riskli cari tespit edildi</p>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-500" />
              </div>
              <div className="bg-slate-800 rounded-xl p-4 flex items-center gap-4">
                <div className="w-10 h-10 bg-orange-500/20 rounded-lg flex items-center justify-center">
                  <ClipboardList className="w-5 h-5 text-orange-400" />
                </div>
                <div className="flex-1">
                  <p className="text-white font-medium">Sabah raporu eklendi</p>
                  <p className="text-slate-400 text-sm">İskenderun TOKİ - 42 personel</p>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-500" />
              </div>
            </div>
          </div>
        </div>
      </div>

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
              onClick={() => setActiveTab("messages")}
              className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-colors ${
                activeTab === "messages" ? "text-blue-400" : "text-slate-400"
              }`}
            >
              <MessageCircle className="w-6 h-6" />
              <span className="text-xs">İletişim</span>
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
