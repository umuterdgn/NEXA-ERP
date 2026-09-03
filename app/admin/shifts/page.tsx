"use client"
/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * This code is the property of NXA Software.
 */

import { useState, useEffect } from "react"
import { Clock, Calendar, Users, CheckCircle, AlertCircle, Loader2 } from "lucide-react"

export default function ShiftsPage() {
  const [shiftData, setShiftData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchShifts()
  }, [])

  const fetchShifts = async () => {
    try {
      const response = await fetch('/api/admin/shifts')
      if (response.ok) {
        const data = await response.json()
        setShiftData(data)
      }
    } catch (error) {
      console.error('Failed to fetch shifts:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="p-6 h-screen flex flex-col items-center justify-center">
        <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
        <p className="text-slate-400 mt-4">Vardiya verileri yükleniyor...</p>
      </div>
    )
  }

  return (
    <div className="lg:mt-0 mt-16">
      <div className="mb-6">
        <h1 className="text-2xl lg:text-3xl font-bold text-white flex items-center gap-3">
          <Clock className="w-8 h-8 text-blue-400" />
          Vardiyalar
        </h1>
        <p className="text-slate-400 mt-1">Vardiya planlama ve yönetimi</p>
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
              <th className="text-left p-4 text-slate-300 font-medium">Durum</th>
            </tr>
          </thead>
          <tbody>
            {shiftData.length > 0 ? (
              shiftData.map((shift) => (
              <tr key={shift.id} className="border-b border-slate-800 hover:bg-slate-800/30 transition-colors">
                <td className="p-4 text-white font-medium">{shift.id}</td>
                <td className="p-4 text-white">{shift.name}</td>
                <td className="p-4 text-slate-300 flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  {shift.timeRange || shift.time}
                </td>
                <td className="p-4 text-slate-300 flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  {shift.personnelCount || shift.personnel}
                </td>
                <td className="p-4 text-slate-300">{shift.project?.name || shift.project || '-'}</td>
                <td className="p-4">
                  <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${
                    shift.status === "Active" 
                      ? "bg-green-500/20 text-green-400" 
                      : shift.status === "Scheduled"
                      ? "bg-blue-500/20 text-blue-400"
                      : "bg-yellow-500/20 text-yellow-400"
                  }`}>
                    {shift.status === "Active" && <CheckCircle className="w-3 h-3" />}
                    {shift.status === "Pending" && <AlertCircle className="w-3 h-3" />}
                    {shift.status}
                  </span>
                </td>
              </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="p-8 text-center text-slate-400">
                  <Clock className="w-12 h-12 mx-auto mb-3 text-slate-600" />
                  <p>Tanımlı vardiya bulunmuyor.</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
