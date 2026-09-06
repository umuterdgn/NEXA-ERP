/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * This code is the property of NXA Software.
 */

"use client"

import { useState } from "react"
import { Building2, Users, HardDrive, MessageSquare, Plus, Settings, PauseCircle, MoreHorizontal, CheckCircle, XCircle } from "lucide-react"

export default function SuperAdminDashboardPage() {
  const [isModalOpen, setIsModalOpen] = useState(false)

  // Mock data for tenants
  const tenants = [
    { id: 1, name: "ABC İnşaat Ltd.", type: "Müteahhit", diskUsage: "45GB", diskTotal: "100GB", status: "Aktif" },
    { id: 2, name: "Yapı Denetim A.Ş.", type: "Yapı Denetim", diskUsage: "32GB", diskTotal: "100GB", status: "Aktif" },
    { id: 3, name: "Delta Mühendislik", type: "Müteahhit", diskUsage: "78GB", diskTotal: "100GB", status: "Aktif" },
    { id: 4, name: "Omega Yapı", type: "Müteahhit", diskUsage: "15GB", diskTotal: "100GB", status: "Pasif" },
    { id: 5, name: "Star Denetim", type: "Yapı Denetim", diskUsage: "52GB", diskTotal: "100GB", status: "Aktif" },
  ]

  // Mock stats
  const stats = [
    { title: "Toplam Firma", value: "24", icon: Building2, color: "from-blue-600 to-cyan-600" },
    { title: "Aktif Kullanıcı", value: "156", icon: Users, color: "from-purple-600 to-pink-600" },
    { title: "Depolama Kullanımı", value: "1.2TB", icon: HardDrive, color: "from-emerald-600 to-green-600" },
    { title: "Bekleyen Destek", value: "8", icon: MessageSquare, color: "from-amber-600 to-orange-600" },
  ]

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              Super Admin Dashboard
            </h1>
            <p className="text-slate-400 mt-2">Nexa ERP Platform Yönetim Paneli</p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 rounded-lg text-white font-medium transition-all shadow-lg shadow-purple-600/20"
          >
            <Plus className="w-5 h-5" />
            Yeni Firma Oluştur
          </button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => (
            <div key={index} className="bg-slate-900 rounded-2xl p-6 border border-slate-800 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-white/5 to-transparent rounded-full blur-3xl"></div>
              <div className="relative z-10">
                <div className={`p-3 bg-gradient-to-r ${stat.color} rounded-xl w-fit mb-4`}>
                  <stat.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-slate-400 text-sm mb-1">{stat.title}</h3>
                <p className="text-3xl font-bold text-white">{stat.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Tenants Table */}
        <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden">
          <div className="p-6 border-b border-slate-800">
            <h2 className="text-xl font-semibold text-white">Sistemdeki Firmalar</h2>
            <p className="text-slate-400 text-sm mt-1">Tüm tenant firmaların yönetimi</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-800/50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Firma Adı</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Firma Tipi</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Disk Kullanımı</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Durum</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Hızlı İşlemler</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {tenants.map((tenant) => (
                  <tr key={tenant.id} className="hover:bg-slate-800/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-gradient-to-r from-purple-600/20 to-pink-600/20 rounded-lg">
                          <Building2 className="w-5 h-5 text-purple-400" />
                        </div>
                        <span className="text-white font-medium">{tenant.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-3 py-1 rounded-full text-xs font-medium bg-slate-800 text-slate-300">
                        {tenant.type}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 w-32 h-2 bg-slate-800 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-blue-600 to-cyan-600 rounded-full"
                            style={{ width: `${(parseInt(tenant.diskUsage) / parseInt(tenant.diskTotal)) * 100}%` }}
                          />
                        </div>
                        <span className="text-sm text-slate-400">{tenant.diskUsage} / {tenant.diskTotal}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {tenant.status === "Aktif" ? (
                          <CheckCircle className="w-4 h-4 text-green-400" />
                        ) : (
                          <XCircle className="w-4 h-4 text-red-400" />
                        )}
                        <span className={`text-sm ${tenant.status === "Aktif" ? "text-green-400" : "text-red-400"}`}>
                          {tenant.status}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button className="p-2 hover:bg-slate-800 rounded-lg transition-colors" title="Askıya Al">
                          <PauseCircle className="w-4 h-4 text-slate-400 hover:text-yellow-400" />
                        </button>
                        <button className="p-2 hover:bg-slate-800 rounded-lg transition-colors" title="Ayarlar">
                          <Settings className="w-4 h-4 text-slate-400 hover:text-blue-400" />
                        </button>
                        <button className="p-2 hover:bg-slate-800 rounded-lg transition-colors" title="Daha Fazla">
                          <MoreHorizontal className="w-4 h-4 text-slate-400 hover:text-white" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* New Company Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
          <div className="relative bg-slate-900 rounded-2xl border border-slate-800 w-full max-w-lg p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-white">Yeni Firma Oluştur</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
              >
                <XCircle className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            <form className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Firma Adı</label>
                <input
                  type="text"
                  placeholder="Örn: ABC İnşaat Ltd."
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Yönetici Email</label>
                <input
                  type="email"
                  placeholder="admin@firma.com"
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Yönetici Şifre</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Firma Tipi</label>
                <select className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent">
                  <option value="">Seçiniz</option>
                  <option value="contractor">Müteahhit</option>
                  <option value="inspection">Yapı Denetim</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Başlangıç Kotası (GB)</label>
                <input
                  type="number"
                  placeholder="100"
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-4 py-3 bg-slate-800 hover:bg-slate-700 rounded-lg text-white font-medium transition-colors"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 rounded-lg text-white font-medium transition-all"
                >
                  Firma Oluştur
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}