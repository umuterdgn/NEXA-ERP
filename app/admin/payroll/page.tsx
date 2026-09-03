"use client"
/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * This code is the property of NXA Software.
 */

import { useState } from "react"
import { CalendarDays, Calculator, FileText, X, CheckCircle } from "lucide-react"
import { toast } from "react-hot-toast"

interface Personnel {
  id: string
  name: string
  role: string
  dailyRate: number
  attendance: Record<number, "X" | "İ" | "R" | "">
  advancePayment: number
}

export default function PayrollPage() {
  const [selectedMonth, setSelectedMonth] = useState("2026-08")
  const [selectedProject, setSelectedProject] = useState("")
  const [selectedPersonnel, setSelectedPersonnel] = useState<Personnel | null>(null)
  const [showPayrollModal, setShowPayrollModal] = useState(false)

  const projects = [
    { id: "1", name: "İskenderun TOKİ Projesi" },
    { id: "2", name: "Arsuz Konutları" },
    { id: "3", name: "Dörtyol Sitesi" },
    { id: "4", name: "Erzin Proje" }
  ]

  const personnel: Personnel[] = [
    {
      id: "1",
      name: "Ahmet Usta",
      role: "Demirci",
      dailyRate: 2000,
      advancePayment: 10000,
      attendance: {
        1: "X", 2: "X", 3: "X", 4: "X", 5: "X", 6: "", 7: "",
        8: "X", 9: "X", 10: "X", 11: "X", 12: "X", 13: "", 14: "",
        15: "X", 16: "X", 17: "X", 18: "İ", 19: "X", 20: "", 21: "",
        22: "X", 23: "X", 24: "X", 25: "X", 26: "X", 27: "", 28: "",
        29: "X", 30: "X", 31: "X"
      }
    },
    {
      id: "2",
      name: "Mehmet Demir",
      role: "Betoncu",
      dailyRate: 1800,
      advancePayment: 5000,
      attendance: {
        1: "X", 2: "X", 3: "X", 4: "X", 5: "X", 6: "", 7: "",
        8: "X", 9: "X", 10: "R", 11: "X", 12: "X", 13: "", 14: "",
        15: "X", 16: "X", 17: "X", 18: "X", 19: "X", 20: "", 21: "",
        22: "X", 23: "X", 24: "X", 25: "X", 26: "X", 27: "", 28: "",
        29: "X", 30: "X", 31: "X"
      }
    },
    {
      id: "3",
      name: "Ali Kaya",
      role: "Kalıpçı",
      dailyRate: 1900,
      advancePayment: 8000,
      attendance: {
        1: "X", 2: "X", 3: "X", 4: "X", 5: "X", 6: "", 7: "",
        8: "X", 9: "X", 10: "X", 11: "X", 12: "X", 13: "", 14: "",
        15: "X", 16: "X", 17: "X", 18: "X", 19: "X", 20: "", 21: "",
        22: "X", 23: "X", 24: "X", 25: "X", 26: "X", 27: "", 28: "",
        29: "X", 30: "X", 31: "X"
      }
    },
    {
      id: "4",
      name: "Hasan Öztürk",
      role: "Duvarcı",
      dailyRate: 1700,
      advancePayment: 3000,
      attendance: {
        1: "X", 2: "X", 3: "X", 4: "X", 5: "X", 6: "", 7: "",
        8: "X", 9: "X", 10: "X", 11: "X", 12: "X", 13: "", 14: "",
        15: "X", 16: "X", 17: "X", 18: "X", 19: "X", 20: "", 21: "",
        22: "X", 23: "X", 24: "X", 25: "X", 26: "X", 27: "", 28: "",
        29: "X", 30: "X", 31: "X"
      }
    }
  ]

  const handlePayrollCalculation = (person: Personnel) => {
    const totalDays = Object.values(person.attendance).filter(status => status === "X").length
    const grossSalary = totalDays * person.dailyRate
    void grossSalary

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
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
      minimumFractionDigits: 0
    }).format(amount)
  }

  return (
    <div className="lg:mt-0 mt-16">
      <div className="mb-6">
        <h1 className="text-2xl lg:text-3xl font-bold text-white flex items-center gap-3">
          <CalendarDays className="w-8 h-8 text-blue-400" />
          Puantaj & Bordro
        </h1>
        <p className="text-slate-400 mt-1">Personel devam takibi ve maaş hesaplama</p>
      </div>

      {/* Filters */}
      <div className="bg-slate-900 rounded-xl border border-slate-800 p-6 mb-6">
        <div className="mobile-form-row md:grid md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-300">Ay ve Yıl</label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="2026-08">Ağustos 2026</option>
              <option value="2026-09">Eylül 2026</option>
              <option value="2026-10">Ekim 2026</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Proje Seçin</label>
            <select
              value={selectedProject}
              onChange={(e) => setSelectedProject(e.target.value)}
              className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
            >
              <option value="">Proje seçin...</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Timesheet Table */}
      <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">
        <div className="mobile-table-shell">
          <table className="w-full min-w-[2000px]">
            <thead>
              <tr className="border-b border-slate-700">
                <th className="text-left py-3 px-4 text-slate-300 font-medium sticky left-0 bg-slate-900 z-10 w-48">
                  Personel Adı
                </th>
                <th className="text-left py-3 px-4 text-slate-300 font-medium sticky left-48 bg-slate-900 z-10 w-32">
                  Görevi
                </th>
                {Array.from({ length: 31 }, (_, i) => (
                  <th key={i + 1} className="text-center py-3 px-2 text-slate-300 font-medium w-10">
                    {i + 1}
                  </th>
                ))}
                <th className="text-center py-3 px-4 text-slate-300 font-medium w-32">
                  Net Hakediş
                </th>
                <th className="text-center py-3 px-4 text-slate-300 font-medium w-24">
                  Bordro
                </th>
              </tr>
            </thead>
            <tbody>
              {personnel.map((person) => {
                const totalDays = Object.values(person.attendance).filter(status => status === "X").length
                const netHakediş = totalDays * person.dailyRate - person.advancePayment

                return (
                  <tr key={person.id} className="border-b border-slate-800 hover:bg-slate-800/50">
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
                          <div className={`w-8 h-8 mx-auto rounded border flex items-center justify-center text-xs font-bold ${getAttendanceStyle(status)}`}>
                            {status}
                          </div>
                        </td>
                      )
                    })}
                    <td className="py-3 px-4 text-center text-green-400 font-semibold">
                      {formatCurrency(netHakediş)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => handlePayrollCalculation(person)}
                        className="px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm transition-colors flex items-center gap-2 mx-auto"
                      >
                        <Calculator className="w-4 h-4" />
                        Bordro
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-6 mt-6 pt-4 border-t border-slate-700">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-green-500/20 border border-green-500/30 flex items-center justify-center text-xs font-bold text-green-400">X</div>
            <span className="text-slate-400 text-sm">Çalıştı</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-xs font-bold text-blue-400">İ</div>
            <span className="text-slate-400 text-sm">İzinli</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-red-500/20 border border-red-500/30 flex items-center justify-center text-xs font-bold text-red-400">R</div>
            <span className="text-slate-400 text-sm">Raporlu</span>
          </div>
        </div>
      </div>

      {/* Payroll Modal */}
      {showPayrollModal && selectedPersonnel && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 rounded-xl p-6 max-w-md w-full border border-slate-800">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-400" />
                Bordro Hesaplaması
              </h3>
              <button
                onClick={() => setShowPayrollModal(false)}
                className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <div className="space-y-4 mb-6">
              <div className="flex items-center justify-between py-3 border-b border-slate-700">
                <span className="text-slate-400">Personel</span>
                <span className="text-white font-medium">{selectedPersonnel.name}</span>
              </div>
              <div className="flex items-center justify-between py-3 border-b border-slate-700">
                <span className="text-slate-400">Görev</span>
                <span className="text-white font-medium">{selectedPersonnel.role}</span>
              </div>
              <div className="flex items-center justify-between py-3 border-b border-slate-700">
                <span className="text-slate-400">Toplam Çalışma</span>
                <span className="text-white font-medium">
                  {Object.values(selectedPersonnel.attendance).filter(status => status === "X").length} Gün
                </span>
              </div>
              <div className="flex items-center justify-between py-3 border-b border-slate-700">
                <span className="text-slate-400">Günlük Yevmiye</span>
                <span className="text-white font-medium">{formatCurrency(selectedPersonnel.dailyRate)}</span>
              </div>
              <div className="flex items-center justify-between py-3 border-b border-slate-700">
                <span className="text-slate-400">Brüt Maaş</span>
                <span className="text-white font-medium">
                  {formatCurrency(Object.values(selectedPersonnel.attendance).filter(status => status === "X").length * selectedPersonnel.dailyRate)}
                </span>
              </div>
              <div className="flex items-center justify-between py-3 border-b border-slate-700">
                <span className="text-slate-400">Kullanılan Avans</span>
                <span className="text-red-400 font-medium">-{formatCurrency(selectedPersonnel.advancePayment)}</span>
              </div>
              <div className="flex items-center justify-between py-3 border-b border-slate-700">
                <span className="text-slate-400">SGK/Kesintiler</span>
                <span className="text-red-400 font-medium">
                  -{formatCurrency(Math.round((Object.values(selectedPersonnel.attendance).filter(status => status === "X").length * selectedPersonnel.dailyRate) * 0.09375))}
                </span>
              </div>
              <div className="flex items-center justify-between py-4 bg-green-500/10 rounded-lg px-4">
                <span className="text-green-400 font-semibold">Net Ödenecek</span>
                <span className="text-green-400 font-bold text-xl">
                  {formatCurrency(
                    (Object.values(selectedPersonnel.attendance).filter(status => status === "X").length * selectedPersonnel.dailyRate) - 
                    selectedPersonnel.advancePayment - 
                    Math.round((Object.values(selectedPersonnel.attendance).filter(status => status === "X").length * selectedPersonnel.dailyRate) * 0.09375)
                  )}
                </span>
              </div>
            </div>

            <button
              onClick={handleFinalizePayroll}
              className="w-full px-6 py-3 bg-green-600 hover:bg-green-500 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <CheckCircle className="w-5 h-5" />
              Bordroyu Kesinleştir ve Kasaya Yansıt
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
