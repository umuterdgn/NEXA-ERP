"use client"
/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * This code is the property of NXA Software.
 */

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { signOut } from "next-auth/react"
import WeatherWidget from "@/components/ui/WeatherWidget"
import { 
  Building2,
  Calendar,
  ClipboardList,
  ShieldAlert,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Settings,
  LogOut
} from "lucide-react"

export default function SubcontractorDashboard() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)

  // Mock data - will be fetched from API
  const [projectName, setProjectName] = useState("Merkez Plaza Projesi")
  const [recentAudits, setRecentAudits] = useState([
    {
      id: "1",
      title: "A Blok 3. Kat Kalıp Denetimi",
      type: "QUALITY",
      score: 85,
      status: "PASSED",
      date: "2024-01-15",
      notes: "Kalıp işçiliği genel olarak iyi, bazı düzeltmeler gerekiyor."
    },
    {
      id: "2",
      title: "İSG Ekipman Kontrolü",
      type: "OHS",
      score: 45,
      status: "FAILED",
      date: "2024-01-14",
      notes: "KKD eksikleri tespit edildi, derhal düzeltilmeli."
    }
  ])

  useEffect(() => {
    // Fetch subcontractor data from API
    setLoading(false)
  }, [])

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PASSED":
        return <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-xs font-medium">BAŞARILI</span>
      case "FAILED":
        return <span className="px-3 py-1 bg-red-500/20 text-red-400 rounded-full text-xs font-medium">BAŞARISIZ</span>
      case "ACTION_REQUIRED":
        return <span className="px-3 py-1 bg-yellow-500/20 text-yellow-400 rounded-full text-xs font-medium">EYLEM GEREKİYOR</span>
      default:
        return <span className="px-3 py-1 bg-slate-500/20 text-slate-400 rounded-full text-xs font-medium">{status}</span>
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 p-6">
      {/* Header */}
      <div className="bg-gradient-to-br from-orange-900/50 to-slate-900 rounded-3xl p-6 lg:p-8 mb-6 border border-orange-800">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl flex items-center justify-center shadow-lg shadow-orange-500/30">
              <Building2 className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold text-white mb-1">
                Hoş Geldin, Taşeron
              </h1>
              <div className="flex items-center gap-2 text-orange-200">
                <span className="text-sm">{projectName}</span>
              </div>
            </div>
          </div>
          <div className="flex gap-3">
            <button 
              onClick={() => router.push('/subcontractor/profile')}
              className="p-3 bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors border border-slate-700"
            >
              <Settings className="w-5 h-5 text-slate-400" />
            </button>
            <button 
              onClick={() => signOut({ callbackUrl: '/login' })}
              className="p-3 bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors border border-slate-700"
            >
              <LogOut className="w-5 h-5 text-red-400" />
            </button>
          </div>
        </div>
      </div>

      {/* Weather Widget */}
      <div className="mb-6">
        <WeatherWidget city="İskenderun" />
      </div>

      {/* Quick Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {/* Daily Report */}
        <button
          onClick={() => router.push('/subcontractor/report')}
          className="bg-gradient-to-br from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 rounded-2xl p-6 transition-all shadow-lg shadow-orange-500/30 group"
        >
          <div className="flex flex-col items-center text-center gap-4">
            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <ClipboardList className="w-8 h-8 text-white" />
            </div>
            <div>
              <h3 className="text-white font-bold text-lg">Günlük Rapor Gir</h3>
              <p className="text-orange-100 text-sm">Saha ilerlemesini kaydet</p>
            </div>
          </div>
        </button>

        {/* Tasks */}
        <button
          onClick={() => router.push('/subcontractor/tasks')}
          className="bg-slate-900 border border-slate-800 rounded-2xl p-6 hover:border-orange-500/50 transition-colors"
        >
          <div className="flex flex-col items-center text-center gap-4">
            <div className="w-16 h-16 bg-orange-500/20 rounded-2xl flex items-center justify-center">
              <Calendar className="w-8 h-8 text-orange-400" />
            </div>
            <div>
              <h3 className="text-white font-bold text-lg">Görevlerim</h3>
              <p className="text-slate-400 text-sm">Atanan işleri görüntüle</p>
            </div>
          </div>
        </button>

        {/* Audit Results */}
        <button
          onClick={() => router.push('/subcontractor/audits')}
          className="bg-slate-900 border border-slate-800 rounded-2xl p-6 hover:border-orange-500/50 transition-colors"
        >
          <div className="flex flex-col items-center text-center gap-4">
            <div className="w-16 h-16 bg-orange-500/20 rounded-2xl flex items-center justify-center">
              <ShieldAlert className="w-8 h-8 text-orange-400" />
            </div>
            <div>
              <h3 className="text-white font-bold text-lg">Denetim Sonuçlarım</h3>
              <p className="text-slate-400 text-sm">Kalite ve İSG raporları</p>
            </div>
          </div>
        </button>
      </div>

      {/* Recent Audits */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-white flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-orange-400" />
            Son Denetim Sonuçları
          </h2>
          <button 
            onClick={() => router.push('/subcontractor/audits')}
            className="text-orange-400 text-sm hover:text-orange-300 transition-colors"
          >
            Tümünü Gör →
          </button>
        </div>

        <div className="space-y-4">
          {recentAudits.map((audit) => (
            <div
              key={audit.id}
              className="p-4 bg-slate-800/50 rounded-xl border border-slate-700 hover:border-orange-500/50 transition-colors"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="text-white font-medium">{audit.title}</h3>
                  <p className="text-slate-400 text-sm">{audit.date}</p>
                </div>
                {getStatusBadge(audit.status)}
              </div>
              <div className="flex items-center gap-4 mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-slate-400 text-sm">Puan:</span>
                  <span className={`font-bold ${audit.score >= 70 ? 'text-green-400' : audit.score >= 50 ? 'text-yellow-400' : 'text-red-400'}`}>
                    {audit.score}/100
                  </span>
                </div>
              </div>
              {audit.notes && (
                <p className="text-slate-400 text-sm">{audit.notes}</p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
