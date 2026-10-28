"use client"
/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Franchise & Zincir Mağaza Portalı - Özel Navigasyon Menüsü (Sidebar)
 */

import React, { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { signOut, useSession } from "next-auth/react"
import NotificationBell from "@/components/NotificationBell"
import {
  LayoutDashboard,
  MapPin,
  Map,
  Kanban,
  ShieldCheck,
  Box,
  FileCheck2,
  ClipboardCheck,
  Boxes,
  FileSignature,
  Receipt,
  DollarSign,
  ShoppingCart,
  AlertTriangle,
  Building2,
  TrendingUp,
  Store,
  Headphones,
  Archive,
  Users,
  Calendar,
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Sparkles,
  ExternalLink,
  ShieldAlert
} from "lucide-react"

interface MenuItem {
  href: string
  label: string
  icon: any
  category: string
  badge?: string
}

const franchiseNavigation: MenuItem[] = [
  // ANA MENÜ
  { href: "/franchise/dashboard", label: "Dashboard", icon: LayoutDashboard, category: "ANA MENÜ" },
  { href: "/franchise/rollout-map", label: "Harita & Lokasyonlar", icon: MapPin, category: "ANA MENÜ" },

  // FRANCHISE & ROLLOUT (Core)
  { href: "/franchise/rollout-map", label: "Rollout Haritası", icon: Map, category: "FRANCHISE & ROLLOUT (Core)" },
  { href: "/franchise/rollout", label: "Rollout Takip (Kanban)", icon: Kanban, category: "FRANCHISE & ROLLOUT (Core)" },
  { href: "/franchise/stage-gates", label: "Stage-Gate Onayları", icon: ShieldCheck, category: "FRANCHISE & ROLLOUT (Core)" },
  { href: "/franchise/templates", label: "Konsept Şablonları", icon: Box, category: "FRANCHISE & ROLLOUT (Core)" },
  { href: "/franchise/permits", label: "İdari İzinler", icon: FileCheck2, category: "FRANCHISE & ROLLOUT (Core)" },
  { href: "/franchise/punch-list", label: "Punch List (QA)", icon: ClipboardCheck, category: "FRANCHISE & ROLLOUT (Core)" },

  // PROJE & TASARIM
  { href: "/franchise/bim", label: "BIM & 3D Modeller", icon: Boxes, category: "PROJE & TASARIM" },
  { href: "/franchise/contracts", label: "Taşeron Sözleşmeleri", icon: FileSignature, category: "PROJE & TASARIM" },
  { href: "/franchise/progress-payments", label: "Taşeron Hakedişleri", icon: Receipt, category: "PROJE & TASARIM" },

  // FİNANS & TEDARİK
  { href: "/franchise/finance", label: "Kasa & Bütçe", icon: DollarSign, category: "FİNANS & TEDARİK" },
  { href: "/franchise/procurement/consolidated", label: "Konsolide Satınalma", icon: ShoppingCart, category: "FİNANS & TEDARİK" },
  { href: "/franchise/logistics/rma", label: "Hasarlı Teslimat (RMA)", icon: AlertTriangle, category: "FİNANS & TEDARİK" },
  { href: "/franchise/crm", label: "Tedarikçi Firmalar (CRM)", icon: Building2, category: "FİNANS & TEDARİK" },

  // MAĞAZA YÖNETİMİ (Yeni Eklentiler)
  { href: "/franchise/stores/royalty", label: "Şube Ciro & Royalty", icon: TrendingUp, category: "MAĞAZA YÖNETİMİ", badge: "Yeni" },
  { href: "/franchise/stores/audits", label: "Mağaza Denetim & Gizli Müşteri", icon: Store, category: "MAĞAZA YÖNETİMİ", badge: "Yeni" },
  { href: "/franchise/stores/helpdesk", label: "Bakım Onarım (Helpdesk)", icon: Headphones, category: "MAĞAZA YÖNETİMİ", badge: "Yeni" },

  // ARŞİV & İK
  { href: "/franchise/documents", label: "Dijital Evrak (Kira/Ruhsat)", icon: Archive, category: "ARŞİV & İK" },
  { href: "/franchise/personnel", label: "Personel Takibi", icon: Users, category: "ARŞİV & İK" },
  { href: "/franchise/tasks", label: "Görevler & Takvim", icon: Calendar, category: "ARŞİV & İK" },

  // AYARLAR
  { href: "/franchise/settings", label: "Firma Ayarları", icon: Settings, category: "AYARLAR" },
  { href: "/franchise/users", label: "Kullanıcılar", icon: Users, category: "AYARLAR" },
]

export default function FranchiseSidebar({
  isCollapsed,
  setIsCollapsed,
}: {
  isCollapsed: boolean
  setIsCollapsed: (collapsed: boolean) => void
}) {
  const pathname = usePathname()
  const { data: session } = useSession()
  const [mobileOpen, setMobileOpen] = useState(false)

  // Oturum açan kullanıcının firma / marka bilgisi
  const user = session?.user as any
  const tenantName = user?.companyName || user?.name || "Franchise Portalı"
  const tenantLogo = user?.logoUrl || null

  const categories = Array.from(new Set(franchiseNavigation.map((i) => i.category)))

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 flex flex-col border-r border-slate-800/80 bg-slate-950/95 backdrop-blur-xl text-slate-100 transition-all duration-300 ${
          isCollapsed ? "w-20" : "w-64"
        } ${mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}
      >
        {/* Header / Logo */}
        <div className="flex h-16 items-center justify-between border-b border-slate-800/80 px-4">
          <div className="flex items-center gap-3 overflow-hidden">
            {tenantLogo ? (
              <img
                src={tenantLogo}
                alt={tenantName}
                className="h-9 w-9 rounded-xl object-contain bg-slate-900 border border-slate-800 p-1 shrink-0"
              />
            ) : (
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-amber-500 to-rose-600 font-extrabold text-white text-sm shadow-md shadow-amber-500/20 shrink-0">
                FR
              </div>
            )}
            {!isCollapsed && (
              <div className="truncate">
                <span className="block text-sm font-bold tracking-tight text-white truncate">
                  {tenantName}
                </span>
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse" />
                  Franchise Hub
                </span>
              </div>
            )}
          </div>

          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hidden lg:flex h-7 w-7 items-center justify-center rounded-lg border border-slate-800 bg-slate-900/60 hover:bg-slate-800 text-slate-400 hover:text-white transition"
            title={isCollapsed ? "Menüyü Genişlet" : "Menüyü Daralt"}
          >
            {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        </div>

        {/* Scrollable Navigation Menu */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6 scrollbar-thin scrollbar-thumb-slate-800">
          {categories.map((category) => {
            const items = franchiseNavigation.filter((i) => i.category === category)
            return (
              <div key={category} className="space-y-1">
                {!isCollapsed && (
                  <h3 className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                    {category}
                  </h3>
                )}
                {items.map((item, idx) => {
                  const Icon = item.icon
                  const isActive = pathname === item.href || (item.href !== "/franchise/dashboard" && pathname?.startsWith(item.href))

                  return (
                    <Link
                      key={`${item.href}-${idx}`}
                      href={item.href}
                      onClick={() => setMobileOpen(false)}
                      className={`group relative flex items-center gap-3 rounded-xl px-3 py-2 text-xs font-semibold transition-all ${
                        isActive
                          ? "bg-gradient-to-r from-amber-500/20 to-rose-500/10 text-amber-300 border border-amber-500/30 shadow-sm shadow-amber-950/40"
                          : "text-slate-300 hover:bg-slate-900 hover:text-white border border-transparent"
                      }`}
                      title={isCollapsed ? item.label : undefined}
                    >
                      <Icon
                        className={`h-4 w-4 shrink-0 transition-colors ${
                          isActive
                            ? "text-amber-400"
                            : "text-slate-400 group-hover:text-amber-400"
                        }`}
                      />

                      {!isCollapsed && (
                        <div className="flex flex-1 items-center justify-between overflow-hidden">
                          <span className="truncate">{item.label}</span>
                          {item.badge && (
                            <span className="ml-1.5 rounded-full bg-amber-500/20 border border-amber-500/30 px-1.5 py-0.2 text-[9px] font-bold text-amber-300">
                              {item.badge}
                            </span>
                          )}
                        </div>
                      )}

                      {/* Active indicator bar */}
                      {isActive && (
                        <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-1 rounded-r-full bg-amber-400" />
                      )}
                    </Link>
                  )
                })}
              </div>
            )
          })}
        </div>

        {/* Footer / User Profile & Logout */}
        <div className="border-t border-slate-800/80 p-3">
          <div className={`flex items-center ${isCollapsed ? "justify-center" : "justify-between"} gap-2`}>
            {!isCollapsed && (
              <div className="overflow-hidden">
                <span className="block truncate text-xs font-bold text-white">
                  {user?.name || "Yönetici"}
                </span>
                <span className="block truncate text-[10px] text-slate-400">
                  {user?.email || "franchise@nexa.com"}
                </span>
              </div>
            )}

            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-800 bg-slate-900 hover:bg-red-500/20 hover:border-red-500/30 text-slate-400 hover:text-red-400 transition"
              title="Güvenli Çıkış"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  )
}
