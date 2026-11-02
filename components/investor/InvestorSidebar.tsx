"use client"

/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Yatırımcı Portalı Yan Menüsü (Executive Read-Only Sidebar)
 * Yalnızca 4 Menü Öğesi: "Genel Bakış", "3D Proje İkizi", "Finansal Özet", "Saha Galerisi"
 * Ayarlar, Görevler veya formlar kesinlikle OLMASIN.
 */

import React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  Box,
  TrendingUp,
  Image as ImageIcon,
  Building2,
  ShieldCheck,
  LogOut,
  Sparkles,
} from "lucide-react"
import { signOut } from "next-auth/react"

interface NavItem {
  title: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  badge?: string
}

const NAV_ITEMS: NavItem[] = [
  {
    title: "Genel Bakış",
    href: "/investor/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "3D Proje İkizi",
    href: "/investor/3d-twin",
    icon: Box,
    badge: "BIM",
  },
  {
    title: "Finansal Özet",
    href: "/investor/finance",
    icon: TrendingUp,
  },
  {
    title: "Saha Galerisi",
    href: "/investor/gallery",
    icon: ImageIcon,
    badge: "Canlı",
  },
]

export default function InvestorSidebar() {
  const pathname = usePathname()

  // Aktif rota kontrolü (hem locale önekli hem öneksiz rotalarla uyumlu)
  const isItemActive = (href: string) => {
    if (href === "/investor/dashboard") {
      return (
        pathname.endsWith("/investor/dashboard") ||
        pathname.endsWith("/investor") ||
        pathname.endsWith("/dashboard")
      )
    }
    return pathname.includes(href.replace("/investor", "")) || pathname.includes(href)
  }

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col flex-shrink-0 min-h-screen select-none">
      {/* Portalı & Şirket Başlığı */}
      <div className="p-5 border-b border-slate-800/80 bg-slate-950/60">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500/20 via-blue-500/20 to-indigo-500/20 border border-amber-500/30 text-amber-400 flex items-center justify-center shadow-lg shadow-amber-500/10">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-sm tracking-wider bg-gradient-to-r from-amber-200 via-white to-slate-200 bg-clip-text text-transparent">
                NEXA ERP
              </span>
              <span className="text-[9px] uppercase font-bold px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20">
                VIP
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium">Yatırımcı Portalı</p>
          </div>
        </div>

        {/* Read-Only Güvenlik Rozeti */}
        <div className="mt-4 px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 flex items-center gap-2 text-[11px] text-slate-400">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
          <span className="truncate">Salt Okunur (Read-Only)</span>
        </div>
      </div>

      {/* Navigasyon Bağlantıları (SADECE 4 BAŞLIK) */}
      <nav className="flex-1 p-3 space-y-1.5 overflow-y-auto">
        <div className="px-3 py-1.5 text-[10px] uppercase font-bold text-slate-500 tracking-wider">
          Portföy Raporları
        </div>

        {NAV_ITEMS.map((item) => {
          const active = isItemActive(item.href)
          const Icon = item.icon

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all group ${
                active
                  ? "bg-gradient-to-r from-amber-500/15 via-blue-600/20 to-indigo-600/20 text-white border border-amber-500/30 shadow-md shadow-amber-500/5 font-bold"
                  : "text-slate-400 hover:text-white hover:bg-slate-800/60 border border-transparent"
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon
                  className={`w-4 h-4 transition-transform group-hover:scale-110 ${
                    active ? "text-amber-400" : "text-slate-400"
                  }`}
                />
                <span>{item.title}</span>
              </div>

              {item.badge && (
                <span
                  className={`text-[9px] uppercase font-mono px-1.5 py-0.5 rounded font-bold ${
                    active
                      ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                      : "bg-slate-800 text-slate-400"
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </Link>
          )
        })}
      </nav>

      {/* Alt Bilgi & Çıkış */}
      <div className="p-4 border-t border-slate-800/80 bg-slate-950/60 space-y-3">
        <div className="px-2 py-1.5 rounded-xl bg-slate-900/80 border border-slate-800/80">
          <p className="text-[10px] text-slate-500 uppercase font-mono">Aktif Yatırım</p>
          <p className="text-xs font-bold text-white truncate mt-0.5">Nexa Plaza & Rezidans</p>
          <p className="text-[10px] text-slate-400">Blok A-B Karma Yaşam</p>
        </div>

        <button
          type="button"
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-rose-400 hover:text-white bg-rose-500/10 hover:bg-rose-600 border border-rose-500/20 transition-all cursor-pointer"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Güvenli Çıkış</span>
        </button>
      </div>
    </aside>
  )
}
