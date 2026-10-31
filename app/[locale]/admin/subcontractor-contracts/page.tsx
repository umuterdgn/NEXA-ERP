"use client"
/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * This code is the property of NXA Software.
 */

import { FileText, DollarSign, Calendar, CheckCircle, AlertCircle } from "lucide-react"

export default function SubcontractorContractsPage() {
  const contractData = [
    { id: "C001", company: "Yılmaz Kalıp", type: "Birim Fiyat", value: "₺1,250,000", startDate: "2024-01-15", endDate: "2024-12-31", status: "Active" },
    { id: "C002", company: "Kaya Demir", type: "Toplam Fiyat", value: "₺980,000", startDate: "2024-02-01", endDate: "2024-11-30", status: "Active" },
    { id: "C003", company: "Öz Beton", type: "Birim Fiyat", value: "₺2,100,000", startDate: "2024-03-01", endDate: "2025-02-28", status: "Active" },
    { id: "C004", company: "Şahin İnşaat", type: "Toplam Fiyat", value: "₺750,000", startDate: "2024-04-01", endDate: "2024-10-31", status: "Expiring" },
    { id: "C005", company: "Mert Malzeme", type: "Birim Fiyat", value: "₺1,500,000", startDate: "2024-05-01", endDate: "2025-04-30", status: "Draft" },
  ]

  return (
    <div className="lg:mt-0 mt-16">
      <div className="mb-6">
        <h1 className="text-2xl lg:text-3xl font-bold text-white flex items-center gap-3">
          <FileText className="w-8 h-8 text-blue-400" />
          Taşeron Sözleşmeleri
        </h1>
        <p className="text-slate-400 mt-1">Taşeron sözleşme yönetimi ve takibi</p>
      </div>

      <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-slate-800/50 border-b border-slate-700">
              <th className="text-left p-4 text-slate-300 font-medium">Sözleşme No</th>
              <th className="text-left p-4 text-slate-300 font-medium">Firma</th>
              <th className="text-left p-4 text-slate-300 font-medium">Tür</th>
              <th className="text-left p-4 text-slate-300 font-medium">Değer</th>
              <th className="text-left p-4 text-slate-300 font-medium">Başlangıç</th>
              <th className="text-left p-4 text-slate-300 font-medium">Bitiş</th>
              <th className="text-left p-4 text-slate-300 font-medium">Durum</th>
            </tr>
          </thead>
          <tbody>
            {contractData.map((contract) => (
              <tr key={contract.id} className="border-b border-slate-800 hover:bg-slate-800/30 transition-colors">
                <td className="p-4 text-white font-medium">{contract.id}</td>
                <td className="p-4 text-white">{contract.company}</td>
                <td className="p-4 text-slate-300">{contract.type}</td>
                <td className="p-4 text-slate-300 flex items-center gap-2">
                  <DollarSign className="w-4 h-4" />
                  {contract.value}
                </td>
                <td className="p-4 text-slate-300 flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  {contract.startDate}
                </td>
                <td className="p-4 text-slate-300">{contract.endDate}</td>
                <td className="p-4">
                  <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${
                    contract.status === "Active" 
                      ? "bg-green-500/20 text-green-400" 
                      : contract.status === "Expiring"
                      ? "bg-yellow-500/20 text-yellow-400"
                      : "bg-slate-500/20 text-slate-400"
                  }`}>
                    {contract.status === "Active" && <CheckCircle className="w-3 h-3" />}
                    {contract.status === "Expiring" && <AlertCircle className="w-3 h-3" />}
                    {contract.status}
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
