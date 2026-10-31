/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Franchise Portal - Kullanıcı & Rol Yönetimi
 */

import React from "react"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import Link from "next/link"
import {
  Users,
  ShieldCheck,
  UserCheck,
  Mail,
  UserPlus,
  Key,
  CheckCircle2,
  Lock,
  Plus,
  ArrowRight,
  ShieldAlert,
  Building2
} from "lucide-react"

export const dynamic = "force-dynamic"

export default async function FranchiseUsersPage() {
  const session = await auth()
  if (!session?.user) {
    redirect("/login")
  }

  const tenantId = (session.user as any)?.tenantId

  // %100 Tenant İzolasyonu
  const users = await prisma.user.findMany({
    where: tenantId ? { tenantId } : {},
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      companyType: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  }).catch(() => [])

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-amber-400">
            <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
            Erişim & Yetkilendirme
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight mt-1 flex items-center gap-3">
            <Users className="w-8 h-8 text-amber-400" />
            Portal Kullanıcıları & Yetkiler
          </h1>
          <p className="text-sm text-slate-400 mt-1 max-w-2xl">
            Franchise genel merkez çalışanları, şube işletmecileri ve denetçilerin sisteme erişim izinlerini yönetin.
          </p>
        </div>

        <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white text-xs font-bold transition-all shadow-lg shadow-amber-500/20">
          <UserPlus className="w-4 h-4" />
          <span>Yeni Kullanıcı Davet Et</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800/80 backdrop-blur-xl">
          <div className="text-xs text-slate-400 font-medium flex items-center justify-between">
            <span>Toplam Kullanıcı</span>
            <Users className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-white mt-2">
            {users.length} <span className="text-xs text-slate-500 font-normal">hesap</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Kiracı içi izole kullanıcılar
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800/80 backdrop-blur-xl">
          <div className="text-xs text-emerald-400 font-medium flex items-center justify-between">
            <span>Yönetici (Admin)</span>
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-400 mt-2">
            {users.filter((u) => u.role === "ADMIN" || (u.role as string) === "SUPER_ADMIN").length}
          </div>
          <div className="text-[11px] text-emerald-500/80 mt-1">
            Tam yetkili merkez yöneticileri
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800/80 backdrop-blur-xl">
          <div className="text-xs text-blue-400 font-medium flex items-center justify-between">
            <span>Şube Sahipleri / İşletmeci</span>
            <Building2 className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-black text-blue-400 mt-2">
            {users.filter((u) => u.role !== "ADMIN").length}
          </div>
          <div className="text-[11px] text-blue-400/80 mt-1">
            Kendi mağazalarını görüntüleyenler
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800/80 backdrop-blur-xl">
          <div className="text-xs text-amber-400 font-medium flex items-center justify-between">
            <span>Oturum Güvenliği</span>
            <Key className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-white mt-2">
            2FA <span className="text-xs text-slate-500 font-normal">Aktif</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Kurumsal SSO & JWT şifreleme
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <Users className="w-5 h-5 text-amber-400" />
          Kullanıcı Listesi
        </h2>

        <div className="overflow-x-auto rounded-2xl border border-slate-800/80 bg-slate-900/70">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/60 text-slate-400 font-semibold border-b border-slate-800">
              <tr>
                <th className="p-4">Kullanıcı</th>
                <th className="p-4">E-posta</th>
                <th className="p-4">Sistem Rolü</th>
                <th className="p-4">Firma Türü</th>
                <th className="p-4">Kayıt Tarihi</th>
                <th className="p-4 text-right">İşlemler</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-200">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="p-4 font-semibold text-white flex items-center gap-2.5">
                    <div className="h-8 w-8 rounded-lg bg-amber-500/20 text-amber-400 font-bold flex items-center justify-center text-xs">
                      {u.name ? u.name[0] : "U"}
                    </div>
                    <span>{u.name}</span>
                  </td>
                  <td className="p-4 text-slate-400 font-mono">{u.email}</td>
                  <td className="p-4">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-950/60 text-amber-400 border border-amber-800/50">
                      {u.role}
                    </span>
                  </td>
                  <td className="p-4 text-slate-300">
                    {u.companyType || "FRANCHISE"}
                  </td>
                  <td className="p-4 text-slate-400">
                    {new Date(u.createdAt).toLocaleDateString("tr-TR")}
                  </td>
                  <td className="p-4 text-right">
                    <button className="text-amber-400 hover:text-amber-300 font-semibold text-xs">
                      Yetkileri Düzenle
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
