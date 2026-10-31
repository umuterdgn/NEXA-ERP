/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * This code is the property of NXA Software.
 */

import { Calendar, CheckCircle, Clock, XCircle, Search, Filter, FileText } from "lucide-react"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import LeavePageClient from "./LeavePageClient"

// Tarih formatlama (dd.MM.yyyy)
function formatDate(date: Date): string {
  const day = String(date.getDate()).padStart(2, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const year = date.getFullYear()
  return `${day}.${month}.${year}`
}

// İzin türü Türkçe karşılığı
function getLeaveTypeLabel(type: string): string {
  const typeLabels: Record<string, string> = {
    ANNUAL: "Yıllık İzin",
    EXCUSE: "Mazeret İzni",
    SICK: "Hastalık İzni",
    UNPAID: "Ücretsiz İzin"
  }
  return typeLabels[type] || type
}

// İzin türü rengi
function getLeaveTypeColor(type: string): string {
  const typeColors: Record<string, string> = {
    ANNUAL: "text-blue-400",
    EXCUSE: "text-purple-400",
    SICK: "text-green-400",
    UNPAID: "text-amber-400"
  }
  return typeColors[type] || "text-slate-400"
}

// Durum Türkçe karşılığı ve rengi
function getStatusConfig(status: string) {
  const statusConfigs: Record<string, { label: string; color: string; icon: any }> = {
    PENDING: { label: "Bekliyor", color: "text-amber-400 bg-amber-500/20", icon: Clock },
    APPROVED: { label: "Onaylandı", color: "text-green-400 bg-green-500/20", icon: CheckCircle },
    REJECTED: { label: "Reddedildi", color: "text-red-400 bg-red-500/20", icon: XCircle }
  }
  return statusConfigs[status] || { label: status, color: "text-slate-400 bg-slate-500/20", icon: Clock }
}

async function getLeaveData(userId: string) {
  const personel = await prisma.personel.findFirst({
    where: { userId },
    select: { id: true }
  })

  if (!personel) {
    return { 
      leaveRequests: [], 
      leaveSummary: { totalDays: 30, usedDays: 0, remainingDays: 30, pendingDays: 0 } 
    }
  }

  // Bu yılın başlangıcı
  const currentYear = new Date().getFullYear()
  const yearStart = new Date(currentYear, 0, 1)
  const yearEnd = new Date(currentYear, 11, 31)

  // İzin taleplerini çek
  const leaveRequests = await prisma.leaveRequest.findMany({
    where: {
      personelId: personel.id,
      startDate: { gte: yearStart, lte: yearEnd }
    },
    orderBy: {
      startDate: "desc"
    }
  })

  // İzin bakiyesini hesapla
  const totalDays = 30 // Standart yıllık izin hakkı
  const usedDays = leaveRequests
    .filter((req: any) => req.status === "APPROVED")
    .reduce((sum: number, req: any) => sum + req.days, 0)
  const pendingDays = leaveRequests
    .filter((req: any) => req.status === "PENDING")
    .reduce((sum: number, req: any) => sum + req.days, 0)
  const remainingDays = totalDays - usedDays - pendingDays

  return {
    leaveRequests,
    leaveSummary: {
      totalDays,
      usedDays,
      remainingDays: Math.max(0, remainingDays),
      pendingDays
    }
  }
}

export default async function LeavePage() {
  const session = await auth()
  
  if (!session) {
    redirect("/login")
  }

  const { leaveRequests, leaveSummary } = await getLeaveData(session.user.id)


  return (
    <LeavePageClient>
      <div className="p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">İzin Yönetimi</h1>
          <p className="text-slate-400">Yıllık izinlerinizi yönetin ve taleplerinizi takip edin</p>
        </div>

        {/* Leave Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-gradient-to-br from-blue-600/20 to-blue-700/20 border border-blue-500/30 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-2">
              <Calendar className="w-5 h-5 text-blue-400" />
              <p className="text-blue-300 text-sm">Toplam İzin</p>
            </div>
            <p className="text-3xl font-bold text-white">{leaveSummary.totalDays} gün</p>
            <p className="text-blue-300/60 text-xs mt-1">Yıllık hak</p>
          </div>

          <div className="bg-gradient-to-br from-green-600/20 to-green-700/20 border border-green-500/30 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-2">
              <CheckCircle className="w-5 h-5 text-green-400" />
              <p className="text-green-300 text-sm">Kullanılan</p>
            </div>
            <p className="text-3xl font-bold text-white">{leaveSummary.usedDays} gün</p>
            <p className="text-green-300/60 text-xs mt-1">Bu yıl</p>
          </div>

          <div className="bg-gradient-to-br from-emerald-600/20 to-teal-700/20 border border-emerald-500/30 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-2">
              <Calendar className="w-5 h-5 text-emerald-400" />
              <p className="text-emerald-300 text-sm">Kalan</p>
            </div>
            <p className="text-3xl font-bold text-white">{leaveSummary.remainingDays} gün</p>
            <p className="text-emerald-300/60 text-xs mt-1">Kullanılabilir</p>
          </div>

          <div className="bg-gradient-to-br from-amber-600/20 to-orange-700/20 border border-amber-500/30 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-2">
              <Clock className="w-5 h-5 text-amber-400" />
              <p className="text-amber-300 text-sm">Bekleyen</p>
            </div>
            <p className="text-3xl font-bold text-white">{leaveSummary.pendingDays} gün</p>
            <p className="text-amber-300/60 text-xs mt-1">Onay bekliyor</p>
          </div>
        </div>

        {/* Search and New Request Button */}
        <div className="mb-6 flex items-center gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="İzin talebi ara..."
              className="w-full pl-12 pr-4 py-3 bg-slate-900 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>
          <button className="flex items-center gap-2 px-4 py-3 bg-slate-900 border border-slate-800 rounded-xl text-slate-300 hover:bg-slate-800 transition-colors">
            <Filter className="w-4 h-4" />
            <span className="text-sm">Filtrele</span>
          </button>
        </div>

      {/* Leave Requests Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        <div className="p-6 border-b border-slate-800 flex items-center gap-3">
          <FileText className="w-5 h-5 text-slate-400" />
          <h2 className="text-lg font-semibold text-white">İzin Talepleri</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-800/50">
                <th className="px-6 py-4 text-left text-sm font-medium text-slate-400">İzin Türü</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-slate-400">Başlangıç</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-slate-400">Bitiş</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-slate-400">Gün Sayısı</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-slate-400">Gerekçe</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-slate-400">Durum</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {leaveRequests.map((request: any) => {
                const status = getStatusConfig(request.status)
                const StatusIcon = status.icon
                return (
                  <tr key={request.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="px-6 py-4">
                      <span className={`font-medium ${getLeaveTypeColor(request.type)}`}>
                        {getLeaveTypeLabel(request.type)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-white">{formatDate(new Date(request.startDate))}</td>
                    <td className="px-6 py-4 text-white">{formatDate(new Date(request.endDate))}</td>
                    <td className="px-6 py-4 text-white font-semibold">{request.days} gün</td>
                    <td className="px-6 py-4 text-slate-300">{request.reason || "-"}</td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs flex items-center gap-1 w-fit ${status.color}`}>
                        <StatusIcon className="w-3 h-3" />
                        {status.label}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="p-4 border-t border-slate-800 flex items-center justify-between">
          <p className="text-slate-400 text-sm">Toplam {leaveRequests.length} talep</p>
          <div className="flex items-center gap-2">
            <button className="px-3 py-1 bg-slate-800 hover:bg-slate-700 rounded text-slate-300 text-sm transition-colors">
              Önceki
            </button>
            <button className="px-3 py-1 bg-blue-600 rounded text-white text-sm">
              1
            </button>
            <button className="px-3 py-1 bg-slate-800 hover:bg-slate-700 rounded text-slate-300 text-sm transition-colors">
              Sonraki
            </button>
          </div>
        </div>
      </div>
    </div>
    </LeavePageClient>
  )
}
