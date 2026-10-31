/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * This code is the property of NXA Software.
 */

import { Clock, TrendingUp, Calendar, Filter, Download } from "lucide-react"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"

// Türkçe tarih formatlama
function formatTurkishDate(date: Date): string {
  const months = [
    "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran",
    "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"
  ]
  const days = ["Pazar", "Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi"]
  
  const day = date.getDate()
  const month = months[date.getMonth()]
  const year = date.getFullYear()
  const dayName = days[date.getDay()]
  
  return `${day} ${month} ${year} ${dayName}`
}

// Saat formatlama (HH:mm)
function formatTime(date: Date | null): string {
  if (!date) return "-"
  return date.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })
}

// Dakikayı saat formatına çevir
function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return `${hours} saat ${mins} dk`
}

// Projenin günlük mesai saatini dakikaya çevir
function getProjectDailyMinutes(shiftStart: string, shiftEnd: string): number {
  const [startHour, startMin] = shiftStart.split(":").map(Number)
  const [endHour, endMin] = shiftEnd.split(":").map(Number)
  
  const startMinutes = startHour * 60 + startMin
  const endMinutes = endHour * 60 + endMin
  
  return endMinutes - startMinutes
}

// İki tarih arasındaki farkı dakika olarak hesapla
function getMinutesDifference(start: Date, end: Date | null): number {
  if (!end) return 0
  return Math.floor((end.getTime() - start.getTime()) / 60000)
}

async function getAttendanceData(userId: string) {
  const personel = await prisma.personel.findFirst({
    where: { userId },
    select: { id: true }
  })

  if (!personel) {
    return { records: [], stats: { totalHours: 0, overtimeHours: 0, totalDays: 0, expectedHours: 0 } }
  }

  // Son 30 günün kayıtlarını çek
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const records = await prisma.attendanceRecord.findMany({
    where: {
      personelId: personel.id,
      date: { gte: thirtyDaysAgo }
    },
    include: {
      project: {
        select: {
          shiftStart: true,
          shiftEnd: true
        }
      }
    },
    orderBy: {
      date: "desc"
    }
  })

  // İstatistikleri hesapla
  let totalMinutes = 0
  let totalOvertimeMinutes = 0
  let totalDays = 0

  records.forEach(record => {
    if (record.checkIn && record.checkOut) {
      const workedMinutes = getMinutesDifference(record.checkIn, record.checkOut)
      const dailyMinutes = getProjectDailyMinutes(record.project.shiftStart, record.project.shiftEnd)
      
      totalMinutes += workedMinutes
      totalDays += record.dayMultiplier
      
      if (workedMinutes > dailyMinutes) {
        totalOvertimeMinutes += (workedMinutes - dailyMinutes)
      }
    }
  })

  const totalHours = Math.floor(totalMinutes / 60)
  const overtimeHours = Math.floor(totalOvertimeMinutes / 60)
  const expectedHours = Math.floor(totalDays * 9) // Ortalama 9 saat varsayılan

  return {
    records,
    stats: {
      totalHours,
      overtimeHours,
      totalDays,
      expectedHours
    }
  }
}

export default async function AttendancePage() {
  const session = await auth()
  
  if (!session) {
    redirect("/login")
  }

  const { records, stats } = await getAttendanceData(session.user.id)

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Mesai Geçmişi</h1>
        <p className="text-slate-400">Son 30 gün mesai kayıtlarınız</p>
      </div>

      {/* Summary Widgets */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        {/* Total Hours Widget */}
        <div className="bg-gradient-to-br from-blue-600/20 to-blue-700/20 border border-blue-500/30 rounded-2xl p-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-blue-500/30 rounded-xl flex items-center justify-center">
              <Clock className="w-7 h-7 text-blue-400" />
            </div>
            <div className="flex-1">
              <p className="text-blue-300 text-sm mb-1">Bu Ay Toplam Çalışma</p>
              <p className="text-3xl font-bold text-white">{stats.totalHours} saat</p>
              <p className="text-blue-300/60 text-sm mt-1">Hedef: {stats.expectedHours} saat</p>
            </div>
          </div>
        </div>

        {/* Overtime Widget */}
        <div className="bg-gradient-to-br from-amber-600/20 to-orange-700/20 border border-amber-500/30 rounded-2xl p-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-amber-500/30 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-7 h-7 text-amber-400" />
            </div>
            <div className="flex-1">
              <p className="text-amber-300 text-sm mb-1">Fazla Mesai</p>
              <p className="text-3xl font-bold text-white">{stats.overtimeHours} saat</p>
              <p className="text-amber-300/60 text-sm mt-1">{stats.totalDays} iş günü</p>
            </div>
          </div>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        {/* Table Header */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Calendar className="w-5 h-5 text-slate-400" />
            <h2 className="text-lg font-semibold text-white">Mesai Kayıtları</h2>
          </div>
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300 transition-colors">
              <Filter className="w-4 h-4" />
              <span className="text-sm">Filtrele</span>
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300 transition-colors">
              <Download className="w-4 h-4" />
              <span className="text-sm">Dışa Aktar</span>
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-800/50">
                <th className="px-6 py-4 text-left text-sm font-medium text-slate-400">Tarih</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-slate-400">Giriş Saati</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-slate-400">Çıkış Saati</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-slate-400">Toplam Süre</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-slate-400">Durum</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {records.map((record) => {
                const workedMinutes = record.checkIn && record.checkOut 
                  ? getMinutesDifference(record.checkIn, record.checkOut) 
                  : 0
                const dailyMinutes = getProjectDailyMinutes(record.project.shiftStart, record.project.shiftEnd)
                const isOvertime = workedMinutes > dailyMinutes
                const status = !record.checkOut ? "Devam Ediyor" : (isOvertime ? "Fazla Mesai" : "Tam Gün")
                const statusColor = !record.checkOut ? "text-blue-400" : (isOvertime ? "text-amber-400" : "text-green-400")
                
                return (
                  <tr key={record.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="px-6 py-4 text-white font-medium">{formatTurkishDate(record.date)}</td>
                    <td className="px-6 py-4 text-slate-300">{formatTime(record.checkIn)}</td>
                    <td className="px-6 py-4 text-slate-300">{!record.checkOut ? "Devam Ediyor" : formatTime(record.checkOut)}</td>
                    <td className="px-6 py-4 text-white font-semibold">{workedMinutes > 0 ? formatDuration(workedMinutes) : "-"}</td>
                    <td className="px-6 py-4">
                      <span className={`font-medium ${statusColor}`}>
                        {status}
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
          <p className="text-slate-400 text-sm">Toplam {records.length} kayıt</p>
          <div className="flex items-center gap-2">
            <button className="px-3 py-1 bg-slate-800 hover:bg-slate-700 rounded text-slate-300 text-sm transition-colors">
              Önceki
            </button>
            <button className="px-3 py-1 bg-blue-600 rounded text-white text-sm">
              1
            </button>
            <button className="px-3 py-1 bg-slate-800 hover:bg-slate-700 rounded text-slate-300 text-sm transition-colors">
              2
            </button>
            <button className="px-3 py-1 bg-slate-800 hover:bg-slate-700 rounded text-slate-300 text-sm transition-colors">
              Sonraki
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
