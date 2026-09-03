/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * This code is the property of NXA Software.
 */

import { prisma } from "@/lib/prisma"
import Link from "next/link"

export const dynamic = 'force-dynamic'

export default async function LogsPage() {
  const logs = await prisma.systemLog.findMany({
    orderBy: { createdAt: 'desc' },
    take: 100 // Son 100 log
  })

  const getActionColor = (action: string) => {
    if (action.includes("EKLENDI")) return "bg-green-900/50 text-green-400"
    if (action.includes("GUNCELLENDI")) return "bg-blue-900/50 text-blue-400"
    if (action.includes("SILINDI")) return "bg-red-900/50 text-red-400"
    return "bg-slate-900/50 text-slate-400"
  }

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Header */}
      <div className="bg-slate-900 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <Link 
                href="/admin" 
                className="text-slate-400 hover:text-white text-sm mb-2 inline-block"
              >
                ← Panele Dön
              </Link>
              <h1 className="text-3xl font-bold text-white">
                Sistem Logları
              </h1>
              <p className="text-slate-400 mt-1">
                Tüm sistem işlemlerinin izlendiği audit trail
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Search Bar */}
        <div className="mb-6">
          <input
            type="text"
            placeholder="Log ara... (İşlem tipi, kullanıcı veya detaylar)"
            className="w-full px-4 py-3 bg-slate-900 border border-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-slate-500"
          />
        </div>

        {/* Logs Table */}
        <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-800">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-medium text-slate-300">Tarih/Saat</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-slate-300">Kullanıcı</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-slate-300">İşlem Tipi</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-slate-300">Detaylar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-slate-500">
                    Henüz log kaydı yok
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-800/50 transition-colors">
                    <td className="px-6 py-4 text-sm text-slate-400">
                      {new Date(log.createdAt).toLocaleString("tr-TR", {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit'
                      })}
                    </td>
                    <td className="px-6 py-4 text-sm text-white font-medium">
                      {log.user}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getActionColor(log.action)}`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-400">
                      {log.details}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Stats */}
        <div className="mt-6 grid grid-cols-4 gap-4">
          <div className="bg-slate-900 rounded-lg p-4 border border-slate-800">
            <p className="text-slate-400 text-sm mb-1">Toplam Log</p>
            <p className="text-2xl font-bold text-white">{logs.length}</p>
          </div>
          <div className="bg-slate-900 rounded-lg p-4 border border-slate-800">
            <p className="text-slate-400 text-sm mb-1">Ekleme İşlemleri</p>
            <p className="text-2xl font-bold text-green-400">
              {logs.filter(l => l.action.includes("EKLENDI")).length}
            </p>
          </div>
          <div className="bg-slate-900 rounded-lg p-4 border border-slate-800">
            <p className="text-slate-400 text-sm mb-1">Güncelleme İşlemleri</p>
            <p className="text-2xl font-bold text-blue-400">
              {logs.filter(l => l.action.includes("GUNCELLENDI")).length}
            </p>
          </div>
          <div className="bg-slate-900 rounded-lg p-4 border border-slate-800">
            <p className="text-slate-400 text-sm mb-1">Silme İşlemleri</p>
            <p className="text-2xl font-bold text-red-400">
              {logs.filter(l => l.action.includes("SILINDI")).length}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
