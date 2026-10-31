"use client"
/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * This code is the property of NXA Software.
 */

import { Clock, Calendar, MapPin, CheckCircle, AlertCircle, Timer } from "lucide-react"

export default function MyAttendancePage() {
  const attendanceData = [
    { id: "A001", date: "2026-01-15", checkIn: "08:05", checkOut: "17:15", location: "İskenderun TOKİ", hours: 9.17, status: "Present" },
    { id: "A002", date: "2026-01-16", checkIn: "08:00", checkOut: "17:00", location: "İskenderun TOKİ", hours: 9.00, status: "Present" },
    { id: "A003", date: "2026-01-17", checkIn: "08:30", checkOut: "17:30", location: "Arsuz Konutları", hours: 9.00, status: "Present" },
    { id: "A004", date: "2026-01-18", checkIn: "-", checkOut: "-", location: "-", hours: 0, status: "Absent" },
    { id: "A005", date: "2026-01-19", checkIn: "08:10", checkOut: "17:20", location: "Dörtyol Sitesi", hours: 9.17, status: "Present" },
  ]

  return (
    <div className="lg:mt-0 mt-16">
      <div className="mb-6">
        <h1 className="text-2xl lg:text-3xl font-bold text-white flex items-center gap-3">
          <Clock className="w-8 h-8 text-blue-400" />
          Mesai Geçmişim
        </h1>
        <p className="text-slate-400 mt-1">Yoklama ve mesai kayıtları</p>
      </div>

      <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-slate-800/50 border-b border-slate-700">
              <th className="text-left p-4 text-slate-300 font-medium">Tarih</th>
              <th className="text-left p-4 text-slate-300 font-medium">Giriş</th>
              <th className="text-left p-4 text-slate-300 font-medium">Çıkış</th>
              <th className="text-left p-4 text-slate-300 font-medium">Konum</th>
              <th className="text-left p-4 text-slate-300 font-medium">Çalışma Saati</th>
              <th className="text-left p-4 text-slate-300 font-medium">Durum</th>
            </tr>
          </thead>
          <tbody>
            {attendanceData.map((attendance) => (
              <tr key={attendance.id} className="border-b border-slate-800 hover:bg-slate-800/30 transition-colors">
                <td className="p-4 text-white flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  {attendance.date}
                </td>
                <td className="p-4 text-slate-300">
                  {attendance.checkIn !== "-" ? attendance.checkIn : "-"}
                </td>
                <td className="p-4 text-slate-300">
                  {attendance.checkOut !== "-" ? attendance.checkOut : "-"}
                </td>
                <td className="p-4 text-slate-300 flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  {attendance.location}
                </td>
                <td className="p-4 text-white flex items-center gap-2">
                  <Timer className="w-4 h-4" />
                  {attendance.hours > 0 ? `${attendance.hours.toFixed(2)} saat` : "-"}
                </td>
                <td className="p-4">
                  <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${
                    attendance.status === "Present" 
                      ? "bg-green-500/20 text-green-400" 
                      : "bg-red-500/20 text-red-400"
                  }`}>
                    {attendance.status === "Present" && <CheckCircle className="w-3 h-3" />}
                    {attendance.status === "Absent" && <AlertCircle className="w-3 h-3" />}
                    {attendance.status === "Present" ? "Hazır" : "Yok"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
