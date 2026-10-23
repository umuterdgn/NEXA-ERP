"use client"
/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Inspection Sidebar Component - Isolated for Building Inspectors & Auditors
 */

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { signOut, useSession } from "next-auth/react"
import { usePwaInstall } from "@/hooks/use-pwa-install"
import {
  LayoutDashboard,
  Building2,
  Building,
  FlaskConical,
  ClipboardCheck,
  CheckSquare,
  AlertTriangle,
  Construction,
  FileCheck,
  FileWarning,
  Map,
  Users,
  FileText,
  Bot,
  LogOut,
  Menu,
  X,
  ChevronDown,
  ShieldCheck,
  Download,
} from "lucide-react"

export default function InspectionSidebar({
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
  const { isInstallable, promptInstall } = usePwaInstall()

  // Yalıtılmış Yapı Denetim Menüsü: Kasa, Finans, İK veya Hakediş ASLA YER ALMAZ!
  const navItems = [
    { href: "/dashboard", label: "Yapı Denetim Dashboard", icon: LayoutDashboard },
    { href: "/admin/projects", label: "Denetlenen Yapılar / Projeler", icon: Building2 },
    { href: "/admin/samples", label: "Karot & Numune Takip", icon: FlaskConical },
    { href: "/admin/forms", label: "Dinamik Denetim Formları", icon: ClipboardCheck },
    { href: "/yibf", label: "Bakanlık e-YİBF Sistemi", icon: Building },
    { href: "/admin/inspection/reinforcement", label: "Demir & Kalıp Kontrol (Vize)", icon: Construction },
    { href: "/admin/inspection/attachment", label: "Ataşman & Delil Kayıtları", icon: FileCheck },
    { href: "/admin/qa-qc/materials", label: "Kalite: Malzeme Onayları", icon: CheckSquare },
    { href: "/admin/qa-qc/ncr", label: "Uygunsuzluk & DÖF (NCR)", icon: AlertTriangle },
    { href: "/admin/deficiencies", label: "Saha Kusur & Eksiklikleri", icon: FileWarning },
    { href: "/map", label: "GIS Denetim Haritası", icon: Map },
    { href: "/dispatch", label: "Mühendis Görev Dağıtımı", icon: Users },
    { href: "/admin/reports", label: "Saha Denetim Raporları", icon: FileText },
    { href: "/admin/settings/integrations", label: "Bakanlık e-YİBF Botu", icon: Bot },
  ]

  return (
    <>
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 bg-slate-900 border-b border-slate-800 z-40 p-4">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setIsOpen(true)}
            className="text-white p-2 hover:bg-slate-800 rounded-lg"
            aria-label="Menüyü aç"
          >
            <Menu className="w-6 h-6" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-white font-semibold text-sm">Yapı Denetim Portalı</h1>
          </div>
          <div className="w-10" />
        </div>
      </div>

      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-xs z-[9990]"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full z-[9999] transition-all duration-300 ${
          isOpen ? "translate-x-0 w-72" : "-translate-x-full lg:translate-x-0"
        } ${isCollapsed ? "lg:w-20" : "lg:w-64"} w-72 bg-slate-900 border-r border-slate-800 flex flex-col`}
      >
        <div className={`flex h-full flex-col ${isCollapsed ? "p-3" : "p-4 sm:p-5"}`}>
          {/* Header */}
          <div className={`mb-4 flex items-center ${isCollapsed ? "justify-center" : "justify-between"}`}>
            {!isCollapsed && (
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 shadow-lg shadow-cyan-500/20">
                  <ShieldCheck className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h1 className="text-base font-bold text-white tracking-tight">Yapı Denetim</h1>
                  <p className="text-[11px] text-cyan-400 font-medium">Bakanlık e-YİBF Modülü</p>
                </div>
              </div>
            )}

            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="hidden h-9 w-9 items-center justify-center rounded-lg border border-slate-700 bg-slate-800 text-slate-300 transition-colors hover:bg-slate-700 hover:text-white lg:flex cursor-pointer"
              title={isCollapsed ? "Genişlet" : "Daralt"}
              aria-label={isCollapsed ? "Genişlet" : "Daralt"}
            >
              {isCollapsed ? <ChevronDown className="h-5 w-5 rotate-180" /> : <ChevronDown className="h-5 w-5" />}
            </button>
          </div>

          {/* User Profile Section */}
          {!isCollapsed && (
            <div className="mb-4 rounded-xl border border-cyan-500/30 bg-gradient-to-r from-cyan-950/40 to-slate-800/60 p-3">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-cyan-600/20 border border-cyan-500/40 text-cyan-300 font-bold">
                  {session?.user?.name ? session.user.name.charAt(0).toUpperCase() : "D"}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-white">{session?.user?.name || "Yapı Denetçisi"}</p>
                  <p className="truncate text-[11px] text-cyan-300">Denetçi / Kontrol Müh.</p>
                </div>
              </div>
            </div>
          )}

          {/* Navigation Links */}
          <nav className="flex-1 space-y-1 overflow-y-auto overflow-x-hidden pr-1 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
            {navItems.map((item) => {
              const isActive = pathname === item.href
              const Icon = item.icon

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  className={`flex min-h-[42px] items-center rounded-lg text-sm transition-all ${
                    isActive
                      ? "bg-gradient-to-r from-cyan-600 to-blue-600 font-medium text-white shadow-md shadow-cyan-600/20"
                      : "text-slate-300 hover:bg-slate-800 hover:text-white"
                  } ${isCollapsed ? "justify-center px-0" : "justify-start gap-3 px-3 py-2"}`}
                  title={isCollapsed ? item.label : undefined}
                >
                  <Icon className="h-4 w-4 shrink-0 text-cyan-400 group-hover:text-cyan-300" />
                  <span className={`${isCollapsed ? "hidden" : "truncate"}`}>{item.label}</span>
                </Link>
              )
            })}
          </nav>

          {/* Footer Actions */}
          <div className="mt-4 border-t border-slate-800 pt-4 pb-safe space-y-2">
            {isInstallable && (
              <button
                type="button"
                onClick={() => void promptInstall()}
                className={`flex min-h-[40px] w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 px-3 py-2 text-xs font-semibold text-white shadow-md shadow-cyan-600/20 transition-colors hover:from-cyan-500 hover:to-blue-500 cursor-pointer ${
                  isCollapsed ? "px-2" : "text-left"
                }`}
                title={isCollapsed ? "Uygulamayı Yükle" : undefined}
              >
                <Download className="h-4 w-4 shrink-0" />
                {!isCollapsed && <span>PWA Uygulamayı Yükle</span>}
              </button>
            )}

            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className={`flex min-h-[40px] w-full items-center rounded-lg bg-red-600/80 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-red-500 cursor-pointer ${
                isCollapsed ? "justify-center" : "gap-3 text-left"
              }`}
              title={isCollapsed ? "Çıkış Yap" : undefined}
            >
              <LogOut className="h-4 w-4 shrink-0" />
              {!isCollapsed && <span>Çıkış Yap</span>}
            </button>
          </div>

          {/* Mobile Close Button */}
          <button
            onClick={() => setIsOpen(false)}
            className="lg:hidden absolute top-4 right-4 text-slate-400 hover:text-white p-2 rounded-lg"
            aria-label="Menüyü kapat"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </aside>
    </>
  )
}
