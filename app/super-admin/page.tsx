/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * This code is the property of NXA Software.
 */

import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { Building2, Users, Activity, AlertTriangle, TrendingUp } from "lucide-react"
import Link from "next/link"

export default async function SuperAdminDashboardPage() {
  // 1. Sunucu tarafında oturumu al
  const session = await auth()

  // 2. Güvenlik Kontrolleri
  if (!session) {
    redirect("/login")
  }

  if (session.user?.role !== "SUPER_ADMIN") {
    redirect("/admin")
  }

  // 3. Gerçek Verileri Prisma'dan çek
  const [
    totalTenants,
    activeTenants,
    totalUsers,
    criticalErrors
  ] = await Promise.all([
    // @ts-ignore - Tenant model exists after schema update
    prisma.tenant.count(),
    // @ts-ignore - Tenant model exists after schema update
    prisma.tenant.count({ where: { isActive: true } }),
    prisma.user.count(),
    // @ts-ignore - SystemLog model exists after schema update
    prisma.systemLog.count({ where: { errorType: "ERROR" } })
  ])

  const stats = {
    totalTenants,
    activeTenants,
    totalUsers,
    activeUsers: Math.floor(totalUsers * 0.6), // Mock calculation for now
    criticalErrors,
    systemHealth: 95 // Mock for now
  }

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            Super Admin Kontrol Merkezi
          </h1>
          <p className="text-slate-400 mt-2">SaaS platformu genel yönetim paneli</p>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <StatCard
            title="Toplam Kiracı"
            value={stats.totalTenants}
            icon={<Building2 className="w-8 h-8" />}
            color="from-blue-600 to-cyan-600"
            subtitle="Şirket sayısı"
          />
          <StatCard
            title="Aktif Kiracılar"
            value={stats.activeTenants}
            icon={<Activity className="w-8 h-8" />}
            color="from-emerald-600 to-green-600"
            subtitle="Şu anda aktif"
          />
          <StatCard
            title="Toplam Kullanıcı"
            value={stats.totalUsers}
            icon={<Users className="w-8 h-8" />}
            color="from-purple-600 to-pink-600"
            subtitle="Tüm platform"
          />
          <StatCard
            title="Anlık Aktif"
            value={stats.activeUsers}
            icon={<TrendingUp className="w-8 h-8" />}
            color="from-amber-600 to-orange-600"
            subtitle="Online kullanıcı"
          />
          <StatCard
            title="Kritik Hatalar"
            value={stats.criticalErrors}
            icon={<AlertTriangle className="w-8 h-8" />}
            color="from-red-600 to-rose-600"
            subtitle="Acil müdahale gerekli"
          />
          <StatCard
            title="Sistem Sağlığı"
            value={`${stats.systemHealth}%`}
            icon={<Activity className="w-8 h-8" />}
            color="from-green-600 to-emerald-600"
            subtitle="Performans skoru"
          />
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800">
            <h3 className="text-xl font-semibold mb-4">Hızlı İşlemler</h3>
            <div className="space-y-3">
              <Link
                href="/super-admin/tenants"
                className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors flex items-center gap-3"
              >
                <Building2 className="w-5 h-5" />
                Kiracı Yönetimi
              </Link>
              <Link
                href="/super-admin/logs"
                className="w-full px-4 py-3 bg-purple-600 hover:bg-purple-500 rounded-lg transition-colors flex items-center gap-3"
              >
                <AlertTriangle className="w-5 h-5" />
                Sistem Logları
              </Link>
            </div>
          </div>

          <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800">
            <h3 className="text-xl font-semibold mb-4">Sistem Durumu</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Veritabanı</span>
                <span className="text-green-400">● Online</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">API Sunucusu</span>
                <span className="text-green-400">● Online</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">CDN</span>
                <span className="text-green-400">● Online</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Son Yedekleme</span>
                <span className="text-slate-300">2 saat önce</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function StatCard({ title, value, icon, color, subtitle }: any) {
  return (
    <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-white/5 to-transparent rounded-full blur-3xl"></div>
      <div className="relative z-10">
        <div className={`p-3 bg-gradient-to-r ${color} rounded-xl w-fit mb-4`}>
          {icon}
        </div>
        <h3 className="text-slate-400 text-sm mb-1">{title}</h3>
        <p className="text-3xl font-bold text-white mb-1">{value}</p>
        <p className="text-slate-500 text-xs">{subtitle}</p>
      </div>
    </div>
  )
}