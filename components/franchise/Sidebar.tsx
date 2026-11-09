"use client"
/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Franchise & Zincir Mağaza Portalı - Özel Navigasyon Menüsü (Sidebar)
 * Akordiyon (Collapsible) Kategori Mimarisi
 */

import React, { useState, useEffect } from "react"
import { Link, usePathname } from "@/i18n/routing"
import { signOut, useSession } from "next-auth/react"
import { useTranslations } from "next-intl"
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
  ChevronDown,
  LogOut,
  Menu,
  X,
} from "lucide-react"

interface MenuItem {
  href: string
  labelKey: string
  icon: any
  categoryKey: string
  hasBadge?: boolean
}

const franchiseNavigation: MenuItem[] = [
  // ANA MENÜ
  { href: "/franchise/dashboard", labelKey: "dashboard", icon: LayoutDashboard, categoryKey: "mainMenu" },
  { href: "/franchise/rollout-map", labelKey: "locations", icon: MapPin, categoryKey: "mainMenu" },

  // FRANCHISE & ROLLOUT (Core)
  { href: "/franchise/rollout/board", labelKey: "rolloutBoard", icon: Kanban, categoryKey: "core" },
  { href: "/franchise/rollout/ffe", labelKey: "rolloutFfe", icon: Box, categoryKey: "core" },
  { href: "/franchise/rollout/legal", labelKey: "rolloutLegal", icon: FileCheck2, categoryKey: "core" },
  { href: "/franchise/rollout/punch-list", labelKey: "punchList", icon: ClipboardCheck, categoryKey: "core" },
  { href: "/franchise/rollout-map", labelKey: "rolloutMap", icon: Map, categoryKey: "core" },
  { href: "/franchise/stage-gates", labelKey: "stageGates", icon: ShieldCheck, categoryKey: "core" },
  { href: "/franchise/templates", labelKey: "templates", icon: Boxes, categoryKey: "core" },

  // PROJE & TASARIM
  { href: "/franchise/bim", labelKey: "bim", icon: Boxes, categoryKey: "projectDesign" },
  { href: "/franchise/contracts", labelKey: "contracts", icon: FileSignature, categoryKey: "projectDesign" },
  { href: "/franchise/progress-payments", labelKey: "progressPayments", icon: Receipt, categoryKey: "projectDesign" },
  { href: "/franchise/subcontractor-audits", labelKey: "subcontractorAudits", icon: ShieldCheck, categoryKey: "projectDesign" },

  // FİNANS & TEDARİK
  { href: "/franchise/finance", labelKey: "finance", icon: DollarSign, categoryKey: "financeProcurement" },
  { href: "/franchise/procurement/consolidated", labelKey: "consolidatedProcurement", icon: ShoppingCart, categoryKey: "financeProcurement" },
  { href: "/franchise/logistics/rma", labelKey: "rma", icon: AlertTriangle, categoryKey: "financeProcurement" },
  { href: "/franchise/crm", labelKey: "crm", icon: Building2, categoryKey: "financeProcurement" },

  // MAĞAZA YÖNETİMİ
  { href: "/franchise/stores/royalty", labelKey: "storeRoyalty", icon: TrendingUp, categoryKey: "storeManagement", hasBadge: true },
  { href: "/franchise/stores/audits", labelKey: "storeAudits", icon: Store, categoryKey: "storeManagement", hasBadge: true },
  { href: "/franchise/stores/helpdesk", labelKey: "helpdesk", icon: Headphones, categoryKey: "storeManagement", hasBadge: true },

  // ARŞİV & İK
  { href: "/franchise/documents", labelKey: "documents", icon: Archive, categoryKey: "archiveHr" },
  { href: "/franchise/personnel", labelKey: "personnel", icon: Users, categoryKey: "archiveHr" },
  { href: "/franchise/tasks", labelKey: "tasks", icon: Calendar, categoryKey: "archiveHr" },

  // AYARLAR
  { href: "/franchise/settings", labelKey: "companySettings", icon: Settings, categoryKey: "settings" },
  { href: "/franchise/users", labelKey: "users", icon: Users, categoryKey: "settings" },
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
  const t = useTranslations("FranchiseModule.sidebar")

  // Oturum açan kullanıcının firma / marka bilgisi
  const user = session?.user as any
  const tenantName = user?.companyName || user?.name || "Franchise Portalı"
  const tenantLogo = user?.logoUrl || null

  const categoryKeys = Array.from(new Set(franchiseNavigation.map((i) => i.categoryKey)))

  // Aktif sayfanın bulunduğu kategoriyi tespit et
  const activeNavItem = franchiseNavigation.find(
    (item) => pathname === item.href || (item.href !== "/franchise/dashboard" && pathname?.startsWith(item.href))
  )
  const initialActiveCategory = activeNavItem?.categoryKey || "core"

  // Akordiyon (Collapsible) State: Sadece aktif sayfanın kategorisi varsayılan olarak açık
  const [openCategories, setOpenCategories] = useState<Record<string, boolean>>({
    [initialActiveCategory]: true,
  })

  // Sayfa değiştikçe aktif olan kategoriyi otomatik aç
  useEffect(() => {
    if (activeNavItem?.categoryKey) {
      setOpenCategories((prev) => ({
        ...prev,
        [activeNavItem.categoryKey]: true,
      }))
    }
  }, [pathname, activeNavItem?.categoryKey])

  const toggleCategory = (catKey: string) => {
    setOpenCategories((prev) => ({
      ...prev,
      [catKey]: !prev[catKey],
    }))
  }

  return (
    <>
      {/* Mobile Top Bar */}
      <div className="fixed top-0 left-0 right-0 z-30 flex h-14 items-center justify-between border-b border-slate-800 bg-slate-950/90 backdrop-blur-md px-4 md:hidden">
        <button
          type="button"
          onClick={() => setMobileOpen(!mobileOpen)}
          className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg p-2 text-slate-300 hover:bg-slate-900 transition"
          aria-label={mobileOpen ? "Menüyü kapat" : "Menüyü aç"}
        >
          {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
        <div className="flex items-center gap-2">
          {tenantLogo && (
            <img
              src={tenantLogo}
              alt={tenantName}
              className="h-7 w-7 rounded-lg object-contain bg-slate-900 border border-slate-800 p-0.5"
            />
          )}
          <span className="text-xs font-bold text-white tracking-wide truncate max-w-[160px]">{tenantName}</span>
        </div>
        <div className="w-10" />
      </div>

      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden transition-opacity"
          aria-hidden="true"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed inset-y-0 left-0 transform transition-transform duration-300 z-50 flex flex-col border-r border-slate-800/80 bg-slate-950/95 backdrop-blur-xl text-slate-100 ${
          isCollapsed ? "md:w-20" : "md:w-64"
        } w-64 max-w-[85vw] ${mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}`}
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

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="hidden lg:flex h-7 w-7 items-center justify-center rounded-lg border border-slate-800 bg-slate-900/60 hover:bg-slate-800 text-slate-400 hover:text-white transition"
              title={isCollapsed ? t("expandMenu") : t("collapseMenu")}
            >
              {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {/* Scrollable Navigation Menu (Accordion Layout) */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-4 scrollbar-thin scrollbar-thumb-slate-800">
          {categoryKeys.map((catKey) => {
            const items = franchiseNavigation.filter((i) => i.categoryKey === catKey)
            const isOpen = !!openCategories[catKey]
            const hasActivePage = items.some(
              (i) => pathname === i.href || (i.href !== "/franchise/dashboard" && pathname?.startsWith(i.href))
            )

            return (
              <div
                key={catKey}
                className={`rounded-xl transition-all duration-200 ${
                  hasActivePage && !isCollapsed
                    ? "bg-slate-900/40 border border-amber-500/20 p-1"
                    : "border border-transparent"
                }`}
              >
                {/* Accordion Category Header Button */}
                {!isCollapsed ? (
                  <button
                    type="button"
                    onClick={() => toggleCategory(catKey)}
                    className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider text-slate-400 hover:text-slate-200 hover:bg-slate-900/70 transition group select-none"
                  >
                    <div className="flex items-center gap-1.5 truncate">
                      <span className={hasActivePage ? "text-amber-400 font-extrabold" : "text-slate-400"}>
                        {t(catKey)}
                      </span>
                      {hasActivePage && (
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse shrink-0" />
                      )}
                    </div>
                    <ChevronDown
                      className={`w-3.5 h-3.5 shrink-0 transition-transform duration-200 text-slate-500 group-hover:text-slate-300 ${
                        isOpen ? "rotate-0 text-amber-400" : "-rotate-90"
                      }`}
                    />
                  </button>
                ) : (
                  <div className="h-1 bg-slate-850 rounded-full my-2 mx-2" />
                )}

                {/* Sub-Items List (Collapsible) */}
                {(isOpen || isCollapsed) && (
                  <div className={`space-y-1 mt-1 ${!isCollapsed ? "pl-1" : ""}`}>
                    {items.map((item, idx) => {
                      const Icon = item.icon
                      const label = t(item.labelKey)
                      const isActive =
                        pathname === item.href ||
                        (item.href !== "/franchise/dashboard" && pathname?.startsWith(item.href))

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
                          title={isCollapsed ? label : undefined}
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
                              <span className="truncate">{label}</span>
                              {item.hasBadge && (
                                <span className="ml-1.5 rounded-full bg-amber-500/20 border border-amber-500/30 px-1.5 py-0.2 text-[9px] font-bold text-amber-300">
                                  {t("badgeNew")}
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
                )}
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
                  {user?.name || t("admin")}
                </span>
                <span className="block truncate text-[10px] text-slate-400">
                  {user?.email || "franchise@nexa.com"}
                </span>
              </div>
            )}

            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-800 bg-slate-900 hover:bg-red-500/20 hover:border-red-500/30 text-slate-400 hover:text-red-400 transition"
              title={t("logout")}
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  )
}
