/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * This code is the property of NXA Software.
 */

import { ShieldAlert, AlertTriangle, MapPin, Calendar, Camera, CheckCircle, Clock, XCircle, Search } from "lucide-react"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import NewISGReportButton from "./NewISGReportButton"

// Tür konfigürasyonu
function getTypeConfig(type: string) {
  const typeConfigs: Record<string, { label: string; color: string; icon: any }> = {
    TEHLIKE: { label: "Tehlike", color: "bg-amber-500/20 text-amber-400 border-amber-500/30", icon: AlertTriangle },
    KAZA_TUTANAGI: { label: "Kaza Tutanağı", color: "bg-red-500/20 text-red-400 border-red-500/30", icon: AlertTriangle },
    EKSIK_DOKUM: { label: "Eksik Doküman", color: "bg-orange-500/20 text-orange-400 border-orange-500/30", icon: AlertTriangle }
  }
  return typeConfigs[type] || { label: type, color: "bg-slate-500/20 text-slate-400 border-slate-500/30", icon: AlertTriangle }
}

// Durum konfigürasyonu
function getStatusConfig(status: string) {
  const statusConfigs: Record<string, { label: string; color: string; icon: any }> = {
    ACIL: { label: "Acil", color: "text-red-400 bg-red-500/20", icon: Clock },
    INCELEMEDE: { label: "İnceleniyor", color: "text-blue-400 bg-blue-500/20", icon: Clock },
    COZULDU: { label: "Çözüldü", color: "text-green-400 bg-green-500/20", icon: CheckCircle }
  }
  return statusConfigs[status] || { label: status, color: "text-slate-400 bg-slate-500/20", icon: Clock }
}

// Tarih formatlama (dd.MM.yyyy)
function formatDate(date: Date): string {
  const day = String(date.getDate()).padStart(2, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const year = date.getFullYear()
  return `${day}.${month}.${year}`
}

async function getISGData(userId: string) {
  const personel = await prisma.personel.findFirst({
    where: { userId },
    select: { id: true }
  })

  if (!personel) {
    return {
      incidentReports: [],
      stats: { total: 0, kaza: 0, tehlike: 0, cozuldu: 0 }
    }
  }

  // Personelin İSG bildirimlerini çek
  const reports = await prisma.isgReport.findMany({
    where: {
      personelId: personel.id
    },
    orderBy: {
      createdAt: "desc"
    }
  })

  // Bildirimleri formatla
  const incidentReports = reports.map((report: any) => ({
    id: report.id,
    type: report.type.toLowerCase(),
    title: report.description?.substring(0, 50) + (report.description?.length > 50 ? "..." : "") || "-",
    location: report.location || "-",
    date: formatDate(new Date(report.createdAt)),
    status: report.status.toLowerCase()
  }))

  // İstatistikleri hesapla
  const total = incidentReports.length
  const kaza = incidentReports.filter((r: any) => r.type === "kaza_tutanagi").length
  const tehlike = incidentReports.filter((r: any) => r.type === "tehlike").length
  const cozuldu = incidentReports.filter((r: any) => r.status === "cozuldu").length

  return {
    incidentReports,
    stats: { total, kaza, tehlike, cozuldu }
  }
}

export default async function ISGPage() {
  const session = await auth()
  
  if (!session) {
    redirect("/login")
  }

  const { incidentReports, stats } = await getISGData(session.user.id)

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">İSG Bildirimleri</h1>
        <p className="text-slate-400">Tehlike, kaza ve ramak kala olaylarını bildirin</p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-gradient-to-br from-blue-600/20 to-blue-700/20 border border-blue-500/30 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-2">
            <ShieldAlert className="w-5 h-5 text-blue-400" />
            <p className="text-blue-300 text-sm">Toplam Bildirim</p>
          </div>
          <p className="text-3xl font-bold text-white">{stats.total}</p>
        </div>

        <div className="bg-gradient-to-br from-red-600/20 to-red-700/20 border border-red-500/30 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-2">
            <AlertTriangle className="w-5 h-5 text-red-400" />
            <p className="text-red-300 text-sm">Kaza</p>
          </div>
          <p className="text-3xl font-bold text-white">{stats.kaza}</p>
        </div>

        <div className="bg-gradient-to-br from-amber-600/20 to-orange-700/20 border border-amber-500/30 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-2">
            <AlertTriangle className="w-5 h-5 text-amber-400" />
            <p className="text-amber-300 text-sm">Tehlike</p>
          </div>
          <p className="text-3xl font-bold text-white">{stats.tehlike}</p>
        </div>

        <div className="bg-gradient-to-br from-green-600/20 to-green-700/20 border border-green-500/30 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-2">
            <CheckCircle className="w-5 h-5 text-green-400" />
            <p className="text-green-300 text-sm">Çözüldü</p>
          </div>
          <p className="text-3xl font-bold text-white">{stats.cozuldu}</p>
        </div>
      </div>

      {/* Search and New Report Button */}
      <div className="mb-6 flex items-center gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Bildirim ara..."
            className="w-full pl-12 pr-4 py-3 bg-slate-900 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
          />
        </div>
        <NewISGReportButton />
      </div>

      {/* Incident Reports List */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        <div className="p-6 border-b border-slate-800 flex items-center gap-3">
          <ShieldAlert className="w-5 h-5 text-slate-400" />
          <h2 className="text-lg font-semibold text-white">Bildirim Geçmişi</h2>
        </div>

        <div className="divide-y divide-slate-800">
          {incidentReports.map((report: any) => {
            const type = getTypeConfig(report.type.toUpperCase())
            const TypeIcon = type.icon
            const status = getStatusConfig(report.status.toUpperCase())
            const StatusIcon = status.icon
            return (
              <div key={report.id} className="p-6 hover:bg-slate-800/30 transition-colors">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                      <h3 className="text-lg font-semibold text-white">{report.title}</h3>
                      <span className={`px-2 py-1 rounded-full text-xs border flex items-center gap-1 ${type.color}`}>
                        <TypeIcon className="w-3 h-3" />
                        {type.label}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs flex items-center gap-1 ${status.color}`}>
                        <StatusIcon className="w-3 h-3" />
                        {status.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-slate-400">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        <span>{report.location}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        <span>{report.date}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

    </div>
  )
}
