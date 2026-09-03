"use client"
/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * This code is the property of NXA Software.
 */

import Link from "next/link"
import { usePathname } from "next/navigation"
import { usePwaInstall } from "@/hooks/use-pwa-install"
import { LayoutDashboard, Building2, AlertTriangle, ArrowLeft, Shield, ChevronLeft, ChevronRight, Download } from "lucide-react"

export default function SuperAdminSidebar({
  isCollapsed,
  setIsCollapsed,
}: {
  isCollapsed: boolean
  setIsCollapsed: React.Dispatch<React.SetStateAction<boolean>>
}) {
  const pathname = usePathname()
  const { isInstallable, promptInstall } = usePwaInstall()

  const menuItems = [
    {
      href: "/super-admin",
      label: "Dashboard",
      icon: LayoutDashboard,
    },
    {
      href: "/super-admin/tenants",
      label: "Kiracı Yönetimi",
      icon: Building2,
    },
    {
      href: "/super-admin/logs",
      label: "Sistem Logları",
      icon: AlertTriangle,
    },
  ]

  return (
    <aside
      className={`fixed left-0 top-0 z-50 h-full transition-all duration-300 ${
        isCollapsed ? "lg:w-20" : "lg:w-64"
      } w-64 border-r border-slate-800 bg-slate-900`}
    >
      <div className="flex h-full flex-col p-4">
        <div className={`mb-4 flex items-center ${isCollapsed ? "justify-center" : "justify-between"}`}>
          {!isCollapsed && (
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 p-2">
                <Shield className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-white">Super Admin</h1>
                <p className="text-xs text-slate-400">NXA Platform</p>
              </div>
            </div>
          )}
          <button
            type="button"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hidden h-9 w-9 items-center justify-center rounded-lg border border-slate-700 bg-slate-800 text-slate-300 transition-colors hover:bg-slate-700 hover:text-white lg:flex"
            title={isCollapsed ? "Genişlet" : "Daralt"}
          >
            {isCollapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
          </button>
        </div>

        <nav className="flex-1 space-y-2 overflow-y-auto overflow-x-hidden">
          {menuItems.map((item) => {
            const isActive = pathname === item.href
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex min-h-[44px] items-center rounded-lg transition-colors ${
                  isActive
                    ? "border border-purple-500/30 bg-purple-600/20 text-purple-400"
                    : "text-slate-300 hover:bg-slate-800 hover:text-white"
                } ${isCollapsed ? "justify-center px-0" : "justify-start gap-3 px-4"}`}
                title={isCollapsed ? item.label : undefined}
              >
                <Icon className="h-5 w-5 shrink-0" />
                <span className={`${isCollapsed ? "hidden" : "font-medium"}`}>{item.label}</span>
              </Link>
            )
          })}
        </nav>

        <div className="mt-4 border-t border-slate-800 pt-4">
          {isInstallable && (
            <button
              type="button"
              onClick={() => void promptInstall()}
              className={`mb-3 flex min-h-[44px] w-full items-center justify-center gap-3 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-3 text-white shadow-lg shadow-blue-600/20 transition-colors hover:from-blue-500 hover:to-indigo-500 ${
                isCollapsed ? "px-2" : "text-left"
              }`}
              title={isCollapsed ? "Uygulamayı Yükle" : undefined}
            >
              <Download className="h-5 w-5 shrink-0" />
              {!isCollapsed && <span>Uygulamayı Yükle</span>}
            </button>
          )}
          <Link
            href="/admin"
            className={`flex min-h-[44px] items-center rounded-lg text-slate-400 transition-colors hover:bg-slate-800 hover:text-white ${
              isCollapsed ? "justify-center px-0" : "gap-3 px-4"
            }`}
            title={isCollapsed ? "Normal Admin&apos;e Dön" : undefined}
          >
            <ArrowLeft className="h-5 w-5 shrink-0" />
            {!isCollapsed && <span className="font-medium">Normal Admin&apos;e Dön</span>}
          </Link>
        </div>
      </div>
    </aside>
  )
}
