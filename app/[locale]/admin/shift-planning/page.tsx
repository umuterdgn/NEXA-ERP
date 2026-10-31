"use client"
/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * This code is the property of NXA Software.
 */

import { Clock, Calendar, Users } from "lucide-react"

export default function ShiftPlanningPage() {
  const shiftData = [
    { id: "S001", name: "Sabah Vardiyası", time: "08:00 - 17:00", personnel: 12, project: "İskenderun TOKİ" },
    { id: "S002", name: "Akşam Vardiyası", time: "17:00 - 02:00", personnel: 8, project: "Arsuz Konutları" },
    { id: "S003", name: "Gece Vardiyası", time: "02:00 - 08:00", personnel: 5, project: "Dörtyol Sitesi" },
    { id: "S004", name: "Sabat Vardiyası", time: "08:00 - 17:00", personnel: 10, project: "Erzin Proje" },
  ]

  return (
    <div className="lg:mt-0 mt-16">
      <div className="mb-6">
        <h1 className="text-2xl lg:text-3xl font-bold text-white flex items-center gap-3">
          <Clock className="w-8 h-8 text-blue-400" />
          Vardiya Planlaması
        </h1>
        <p className="text-slate-400 mt-1">Personel vardiya ve çalışma programı</p>
      </div>

      <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-slate-800/50 border-b border-slate-700">
              <th className="text-left p-4 text-slate-300 font-medium">Vardiya No</th>
              <th className="text-left p-4 text-slate-300 font-medium">Vardiya Adı</th>
              <th className="text-left p-4 text-slate-300 font-medium">Saat Aralığı</th>
              <th className="text-left p-4 text-slate-300 font-medium">Personel Sayısı</th>
              <th className="text-left p-4 text-slate-300 font-medium">Proje</th>
            </tr>
          </thead>
          <tbody>
            {shiftData.map((shift) => (
              <tr key={shift.id} className="border-b border-slate-800 hover:bg-slate-800/30 transition-colors">
                <td className="p-4 text-white font-medium">{shift.id}</td>
                <td className="p-4 text-white">{shift.name}</td>
                <td className="p-4 text-slate-300 flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  {shift.time}
                </td>
                <td className="p-4 text-slate-300 flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  {shift.personnel}
                </td>
                <td className="p-4 text-slate-300">{shift.project}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
