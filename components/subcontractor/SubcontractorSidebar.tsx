"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { signOut, useSession } from "next-auth/react"
import { usePwaInstall } from "@/hooks/use-pwa-install"
import {
  Home,
  ClipboardList,
  FileText,
  DollarSign,
  ShieldAlert,
  LogOut,
  Menu,
  X,
  ChevronDown,
  Building2,
  Download,
} from "lucide-react"

export default function SubcontractorSidebar({
  isCollapsed,
  setIsCollapsed,
}: {
  isCollapsed: boolean
  setIsCollapsed: React.Dispatch<React.SetStateAction<boolean>>
}) {
  const [isOpen, setIsOpen] = useState(false)
  const pathname = usePathname()
  const sessionContext = useSession()
  const session = sessionContext?.data
  const status = sessionContext?.status
  const { isInstallable, promptInstall } = usePwaInstall()

  const navItems = [
    { href: "/subcontractor", label: "Ana Sayfa", icon: Home },
    { href: "/subcontractor/tasks", label: "Görevlerim", icon: ClipboardList },
    { href: "/subcontractor/report", label: "Günlük Rapor Gir", icon: FileText },
    { href: "/subcontractor/billing", label: "Hakedişlerim", icon: DollarSign },
    { href: "/subcontractor/audits", label: "Denetim Sonuçlarım", icon: ShieldAlert },
  ]

  return (
    <>
      <div className="lg:hidden fixed top-0 left-0 right-0 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 z-40 p-4">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setIsOpen(true)}
            className="text-slate-900 dark:text-white p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
            aria-label="Menüyü aç"
          >
            <Menu className="w-6 h-6" />
          </button>
          <h1 className="text-slate-900 dark:text-white font-semibold">Taşeron Portalı</h1>
          <div className="w-10" />
        </div>
      </div>

      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}

      <aside
        className={`fixed top-0 left-0 h-full z-50 transition-all duration-300 ${
          isOpen ? "translate-x-0 w-72" : "-translate-x-full lg:translate-x-0"
        } ${isCollapsed ? "lg:w-20" : "lg:w-64"} w-72 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800`}
      >
        <div className={`flex h-full flex-col ${isCollapsed ? "p-3" : "p-4 sm:p-6"}`}>
          <div className={`mb-4 flex items-center ${isCollapsed ? "justify-center" : "justify-between"}`}>
            {!isCollapsed && (
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-red-600">
                  <Building2 className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h1 className="text-lg font-bold text-slate-900 dark:text-white">Taşeron Portalı</h1>
                  <p className="text-xs text-slate-600 dark:text-slate-400">Mahir Bakay Mühendislik</p>
                </div>
              </div>
            )}

            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="hidden h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:text-white lg:flex"
              title={isCollapsed ? "Genişlet" : "Daralt"}
              aria-label={isCollapsed ? "Genişlet" : "Daralt"}
            >
              {isCollapsed ? <ChevronDown className="h-5 w-5 rotate-180" /> : <ChevronDown className="h-5 w-5" />}
            </button>
          </div>

          {!isCollapsed && (
            <div className="mb-4 rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800/50">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-200 dark:bg-slate-700">
                  <Building2 className="h-6 w-6 text-slate-600 dark:text-slate-300" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-slate-900 dark:text-white font-medium">{session?.user?.name || "Taşeron"}</p>
                  <p className="truncate text-xs text-slate-600 dark:text-slate-400">Saha İşçisi</p>
                </div>
              </div>
            </div>
          )}

          <nav className="flex-1 space-y-1 overflow-y-auto overflow-x-hidden">
            {navItems.map((item) => {
              const isActive = pathname === item.href
              const Icon = item.icon

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  className={`flex min-h-[44px] items-center rounded-lg transition-colors ${
                    isActive
                      ? "bg-orange-50 font-medium text-orange-600 dark:bg-slate-800 dark:text-white"
                      : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                  } ${isCollapsed ? "justify-center px-0" : "justify-start gap-3 px-4"}`}
                  title={isCollapsed ? item.label : undefined}
                >
                  <Icon className="h-5 w-5 shrink-0" />
                  <span className={`${isCollapsed ? "hidden" : "truncate"}`}>{item.label}</span>
                </Link>
              )
            })}
          </nav>

          <div className="mt-4 border-t border-slate-200 pt-6 pb-safe dark:border-slate-800">
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
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className={`flex min-h-[44px] w-full items-center rounded-lg bg-red-600 px-4 py-3 text-white transition-colors hover:bg-red-500 ${
                isCollapsed ? "justify-center" : "gap-3 text-left"
              }`}
              title={isCollapsed ? "Çıkış Yap" : undefined}
            >
              <LogOut className="h-5 w-5 shrink-0" />
              {!isCollapsed && <span>Çıkış Yap</span>}
            </button>
          </div>

          <button
            onClick={() => setIsOpen(false)}
            className="lg:hidden absolute top-4 right-4 text-slate-900 dark:text-white p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
            aria-label="Menüyü kapat"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
      </aside>
    </>
  )
}
