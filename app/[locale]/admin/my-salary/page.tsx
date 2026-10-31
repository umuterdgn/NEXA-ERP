"use client"
/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * This code is the property of NXA Software.
 */

import { Wallet, Calendar, DollarSign, TrendingUp, CheckCircle, AlertCircle } from "lucide-react"

export default function MySalaryPage() {
  const salaryData = [
    { id: "P001", period: "Ocak 2026", baseSalary: 15000, bonus: 2500, advance: 0, netSalary: 17500, status: "Paid" },
    { id: "P002", period: "Şubat 2026", baseSalary: 15000, bonus: 3000, advance: 2000, netSalary: 16000, status: "Paid" },
    { id: "P003", period: "Mart 2026", baseSalary: 15000, bonus: 2000, advance: 0, netSalary: 17000, status: "Paid" },
    { id: "P004", period: "Nisan 2026", baseSalary: 15000, bonus: 3500, advance: 1000, netSalary: 17500, status: "Pending" },
  ]

  return (
    <div className="lg:mt-0 mt-16">
      <div className="mb-6">
        <h1 className="text-2xl lg:text-3xl font-bold text-white flex items-center gap-3">
          <Wallet className="w-8 h-8 text-blue-400" />
          Maaş ve Avans
        </h1>
        <p className="text-slate-400 mt-1">Maaş geçmişi ve avans talepleri</p>
      </div>

      <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-slate-800/50 border-b border-slate-700">
              <th className="text-left p-4 text-slate-300 font-medium">Dönem</th>
              <th className="text-left p-4 text-slate-300 font-medium">Temel Maaş</th>
              <th className="text-left p-4 text-slate-300 font-medium">Prim</th>
              <th className="text-left p-4 text-slate-300 font-medium">Avans</th>
              <th className="text-left p-4 text-slate-300 font-medium">Net Maaş</th>
              <th className="text-left p-4 text-slate-300 font-medium">Durum</th>
            </tr>
          </thead>
          <tbody>
            {salaryData.map((salary) => (
              <tr key={salary.id} className="border-b border-slate-800 hover:bg-slate-800/30 transition-colors">
                <td className="p-4 text-white flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  {salary.period}
                </td>
                <td className="p-4 text-slate-300 flex items-center gap-2">
                  <DollarSign className="w-4 h-4" />
                  ₺{salary.baseSalary.toLocaleString()}
                </td>
                <td className="p-4 text-green-400 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  ₺{salary.bonus.toLocaleString()}
                </td>
                <td className="p-4 text-slate-300">
                  {salary.advance > 0 ? `₺${salary.advance.toLocaleString()}` : "-"}
                </td>
                <td className="p-4 text-white font-medium">
                  ₺{salary.netSalary.toLocaleString()}
                </td>
                <td className="p-4">
                  <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${
                    salary.status === "Paid" 
                      ? "bg-green-500/20 text-green-400" 
                      : "bg-yellow-500/20 text-yellow-400"
                  }`}>
                    {salary.status === "Paid" && <CheckCircle className="w-3 h-3" />}
                    {salary.status === "Pending" && <AlertCircle className="w-3 h-3" />}
                    {salary.status === "Paid" ? "Ödendi" : "Beklemede"}
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
