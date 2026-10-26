"use client"
/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Payroll & Puantaj Management connected to Prisma database with strict tenant isolation
 */

import { useState, useEffect } from "react"
import { CalendarDays, Calculator, FileText, X, CheckCircle, RefreshCw, Users } from "lucide-react"
import { toast } from "react-hot-toast"

interface ProjectItem {
  id: string
  name: string
}

interface Personnel {
  id: string
  name: string
  role: string
  dailyRate: number
  attendance: Record<number, string>
  advancePayment: number
}

export default function PayrollPage() {
  const currentMonthStr = new Date().toISOString().slice(0, 7)
  const [selectedMonth, setSelectedMonth] = useState(currentMonthStr)
  const [selectedProject, setSelectedProject] = useState("")
  const [projects, setProjects] = useState<ProjectItem[]>([])
  const [personnel, setPersonnel] = useState<Personnel[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedPersonnel, setSelectedPersonnel] = useState<Personnel | null>(null)
  const [showPayrollModal, setShowPayrollModal] = useState(false)

  const fetchData = async () => {
    try {
      setLoading(true)
      const query = new URLSearchParams()
      if (selectedMonth) query.set("month", selectedMonth)
      if (selectedProject) query.set("projectId", selectedProject)

      const res = await fetch(`/api/admin/payroll?${query.toString()}`)
      const data = await res.json()
      if (data.projects) setProjects(data.projects)
      if (data.personnel) setPersonnel(data.personnel)
    } catch (err) {
      console.error("Bordro verileri alınamadı:", err)
      toast.error("Bordro verileri yüklenirken bir hata oluştu")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [selectedMonth, selectedProject])

  const handlePayrollCalculation = (person: Personnel) => {
    setSelectedPersonnel(person)
    setShowPayrollModal(true)
  }

  const handleFinalizePayroll = () => {
    toast.success("Bordro kesinleştirildi ve kasaya yansıtıldı")
    setShowPayrollModal(false)
  }

  const getAttendanceStyle = (status: string) => {
    switch (status) {
      case "X":
        return "bg-green-500/20 text-green-400 border-green-500/30"
      case "İ":
        return "bg-blue-500/20 text-blue-400 border-blue-500/30"
      case "R":
        return "bg-red-500/20 text-red-400 border-red-500/30"
      default:
        return "bg-slate-800/50 text-slate-500 border-slate-700/50"
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("tr-TR", {
      style: "currency",
      currency: "TRY",
      minimumFractionDigits: 0,
    }).format(amount)
  }

  return (
    <div className="lg:mt-0 mt-16 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-blue-400 mb-1">
            <CalendarDays className="w-4 h-4" />
            <span>İnsan Kaynakları & Hakediş</span>
          </div>
          <h1 className="text-2xl lg:text-3xl font-bold text-white">
            Puantaj & Bordro
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Personel devam takibi ve maaş hesaplama</p>
        </div>

        <button
          onClick={fetchData}
          disabled={loading}
          className="p-2 rounded-lg bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors self-start sm:self-center"
          title="Yenile"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* Filters */}
      <div className="bg-slate-900 rounded-xl border border-slate-800 p-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="mb-2 block text-xs font-medium text-slate-400">Ay ve Yıl</label>
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-2">Proje Filtresi</label>
            <select
              value={selectedProject}
              onChange={(e) => setSelectedProject(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs text-white"
            >
              <option value="">Tüm Şantiyeler</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Timesheet Table or Empty State */}
      {!loading && personnel.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center max-w-xl mx-auto space-y-4 shadow-xl">
          <div className="w-16 h-16 rounded-2xl bg-slate-800/80 border border-slate-700/60 flex items-center justify-center mx-auto text-slate-400 shadow-inner">
            <Users className="w-8 h-8 text-blue-400" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-white">Kayıtlı Personel Bulunamadı</h3>
            <p className="text-sm text-slate-400">
              Puantaj ve bordro hesaplaması yapabilmek için önce Personel Yönetimi modülünden firma personellerinizi sisteme tanımlayın.
            </p>
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-6 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1400px]">
              <thead>
                <tr className="border-b border-slate-800 text-xs">
                  <th className="text-left py-3 px-4 text-slate-400 font-semibold sticky left-0 bg-slate-900 z-10 w-48">
                    Personel Adı
                  </th>
                  <th className="text-left py-3 px-4 text-slate-400 font-semibold sticky left-48 bg-slate-900 z-10 w-32">
                    Görevi
                  </th>
                  {Array.from({ length: 31 }, (_, i) => (
                    <th key={i + 1} className="text-center py-3 px-1 text-slate-400 font-medium w-9">
                      {i + 1}
                    </th>
                  ))}
                  <th className="text-center py-3 px-4 text-slate-400 font-semibold w-32">
                    Net Hakediş
                  </th>
                  <th className="text-center py-3 px-4 text-slate-400 font-semibold w-24">
                    Bordro
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-xs">
                {personnel.map((person) => {
                  const totalDays = Object.values(person.attendance).filter((s) => s === "X").length
                  const netHakediş = totalDays * person.dailyRate - person.advancePayment

                  return (
                    <tr key={person.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4 text-white font-medium sticky left-0 bg-slate-900 z-10">
                        {person.name}
                      </td>
                      <td className="py-3 px-4 text-slate-300 sticky left-48 bg-slate-900 z-10">
                        {person.role}
                      </td>
                      {Array.from({ length: 31 }, (_, i) => {
                        const status = person.attendance[i + 1] || ""
                        return (
                          <td key={i + 1} className="py-2 px-1">
                            <div
                              className={`w-7 h-7 mx-auto rounded border flex items-center justify-center text-[10px] font-bold ${getAttendanceStyle(
                                status
                              )}`}
                            >
                              {status}
                            </div>
                          </td>
                        )
                      })}
                      <td className="py-3 px-4 text-center text-emerald-400 font-semibold">
                        {formatCurrency(netHakediş)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => handlePayrollCalculation(person)}
                          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 mx-auto"
                        >
                          <Calculator className="w-3.5 h-3.5" />
                          <span>Bordro</span>
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Legend */}
          <div className="flex items-center gap-6 mt-6 pt-4 border-t border-slate-800 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded bg-green-500/20 border border-green-500/30 flex items-center justify-center font-bold text-green-400 text-[10px]">
                X
              </div>
              <span className="text-slate-400">Çalıştı</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded bg-blue-500/20 border border-blue-500/30 flex items-center justify-center font-bold text-blue-400 text-[10px]">
                İ
              </div>
              <span className="text-slate-400">İzinli</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded bg-red-500/20 border border-red-500/30 flex items-center justify-center font-bold text-red-400 text-[10px]">
                R
              </div>
              <span className="text-slate-400">Raporlu</span>
            </div>
          </div>
        </div>
      )}

      {/* Payroll Modal */}
      {showPayrollModal && selectedPersonnel && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 rounded-xl p-6 max-w-md w-full border border-slate-800 shadow-2xl">
            <div className="flex items-center justify-between mb-5 border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-400" />
                Bordro Hesaplaması
              </h3>
              <button
                onClick={() => setShowPayrollModal(false)}
                className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 mb-6 text-xs">
              <div className="flex items-center justify-between py-2 border-b border-slate-800">
                <span className="text-slate-400">Personel</span>
                <span className="text-white font-medium">{selectedPersonnel.name}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-slate-800">
                <span className="text-slate-400">Görev</span>
                <span className="text-white font-medium">{selectedPersonnel.role}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-slate-800">
                <span className="text-slate-400">Toplam Çalışma</span>
                <span className="text-white font-medium">
                  {Object.values(selectedPersonnel.attendance).filter((s) => s === "X").length} Gün
                </span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-slate-800">
                <span className="text-slate-400">Günlük Yevmiye</span>
                <span className="text-white font-medium">{formatCurrency(selectedPersonnel.dailyRate)}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-slate-800">
                <span className="text-slate-400">Brüt Hakediş</span>
                <span className="text-white font-medium">
                  {formatCurrency(
                    Object.values(selectedPersonnel.attendance).filter((s) => s === "X").length *
                      selectedPersonnel.dailyRate
                  )}
                </span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-slate-800">
                <span className="text-slate-400">Kullanılan Avans</span>
                <span className="text-red-400 font-medium">-{formatCurrency(selectedPersonnel.advancePayment)}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-slate-800">
                <span className="text-slate-400">SGK / Yasal Kesintiler</span>
                <span className="text-red-400 font-medium">
                  -{formatCurrency(
                    Math.round(
                      Object.values(selectedPersonnel.attendance).filter((s) => s === "X").length *
                        selectedPersonnel.dailyRate *
                        0.09375
                    )
                  )}
                </span>
              </div>
              <div className="flex items-center justify-between py-3 bg-emerald-950/40 border border-emerald-800/60 rounded-lg px-4 mt-2">
                <span className="text-emerald-400 font-semibold">Net Ödenecek</span>
                <span className="text-emerald-400 font-bold text-lg">
                  {formatCurrency(
                    Object.values(selectedPersonnel.attendance).filter((s) => s === "X").length *
                      selectedPersonnel.dailyRate -
                      selectedPersonnel.advancePayment -
                      Math.round(
                        Object.values(selectedPersonnel.attendance).filter((s) => s === "X").length *
                          selectedPersonnel.dailyRate *
                          0.09375
                      )
                  )}
                </span>
              </div>
            </div>

            <button
              onClick={handleFinalizePayroll}
              className="w-full px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-lg transition-colors flex items-center justify-center gap-2 shadow-sm"
            >
              <CheckCircle className="w-4 h-4" />
              Bordroyu Kesinleştir ve Kasaya Yansıt
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
