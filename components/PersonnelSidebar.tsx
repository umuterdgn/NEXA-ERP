"use client"
/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * This code is the property of NXA Software.
 */


import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { signOut, useSession } from "next-auth/react"
import { usePwaInstall } from "@/hooks/use-pwa-install"
import { 
  Home,
  User,
  QrCode,
  Clock,
  Wallet,
  Package,
  ShieldAlert,
  Calendar,
  Bell,
  LogOut,
  Menu,
  X,
  ChevronDown,
  ClipboardList,
  ClipboardCheck,
  ShoppingCart,
  Download,
  Truck,
  MessageSquare,
  Camera,
  Receipt,
  Siren,
  Box,
  CheckSquare,
  AlertTriangle,
  BookOpen
} from "lucide-react"

export default function PersonnelSidebar({
  isCollapsed,
  setIsCollapsed,
}: {
  isCollapsed: boolean
  setIsCollapsed: React.Dispatch<React.SetStateAction<boolean>>
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({})
  const pathname = usePathname()
  const sessionContext = useSession()
  const session = sessionContext?.data
  const status = sessionContext?.status
  const { isInstallable, promptInstall } = usePwaInstall()

  const toggleGroup = (groupId: string) => {
    setOpenGroups((prev) => ({
      ...prev,
      [groupId]: !prev[groupId],
    }))
  }

  const userRole = ((session?.user?.role as string) || "").toUpperCase()
  // Roles that have access to engineering & field supervision tools
  const isEngineerOrManager =
    !userRole || ["ENGINEER", "SITE_MANAGER", "STAFF", "ADMIN", "SUPER_ADMIN", "PROJECT_MANAGER"].includes(userRole)

  interface NavItem {
    href: string
    label: string
    icon: React.ComponentType<{ className?: string }>
  }

  interface NavGroup {
    id: string
    title: string
    emoji: string
    items: NavItem[]
  }

  const isDriver = userRole === "DRIVER"

  const navGroups: NavGroup[] = isDriver
    ? [
        {
          id: "driver-ops",
          title: "Sefer & Operasyon",
          emoji: "🚚",
          items: [
            { href: "/personnel", label: "Aktif Seferlerim (GPS)", icon: Truck },
            { href: "/personnel/chat", label: "Şantiye Chat / İletişim", icon: MessageSquare },
            { href: "/personnel/expenses", label: "Yakıt & Masraflar", icon: Receipt },
          ],
        },
        {
          id: "account",
          title: "Hesap",
          emoji: "⚙️",
          items: [
            { href: "/personnel/profile", label: "Profil ve Ayarlar", icon: User },
          ],
        },
      ]
    : [
        {
          id: "field-ops",
          title: "Saha Operasyonları",
          emoji: "🏗️",
          items: [
            ...(isEngineerOrManager
              ? [{ href: "/personnel/bim-viewer", label: "3D BIM & AR Navigasyon", icon: Box }]
              : []),
            ...(isEngineerOrManager
              ? [{ href: "/personnel/daily-journal", label: "Şantiye Günlüğü (Jurnal)", icon: BookOpen }]
              : []),
            { href: "/personnel/forms", label: "Dinamik Denetim Formları", icon: ClipboardCheck },
            ...(isEngineerOrManager
              ? [{ href: "/personnel/ncr-request", label: "Saha Revizyon (DÖF) Aç", icon: AlertTriangle }]
              : []),
            ...(isEngineerOrManager
              ? [{ href: "/personnel/subcontractor-approvals", label: "Taşeron İş Kabulleri", icon: CheckSquare }]
              : []),
            { href: "/personnel/camera", label: "Saha Kamerası (İlerleme)", icon: Camera },
          ],
        },
        {
          id: "logistics",
          title: "Lojistik & Malzeme",
          emoji: "📦",
          items: [
            { href: "/personnel/deliveries", label: "Malzeme Kabul & Teslimat", icon: Truck },
            { href: "/personnel/qr-consume", label: "Malzeme Tüketimi (QR)", icon: QrCode },
            { href: "/personnel/requests", label: "Malzeme Talepleri", icon: ShoppingCart },
            { href: "/personnel/equipment", label: "Zimmetli Ekipmanlar", icon: Package },
          ],
        },
        {
          id: "hr-finance",
          title: "İK & Finans",
          emoji: "💰",
          items: [
            { href: "/personnel/qr-checkin", label: "QR Giriş/Çıkış", icon: QrCode },
            { href: "/personnel/attendance", label: "Mesai Geçmişi", icon: Clock },
            { href: "/personnel/leave", label: "İzin Yönetimi", icon: Calendar },
            { href: "/personnel/salary", label: "Maaş ve Avans", icon: Wallet },
            { href: "/personnel/expenses", label: "Masraf & Fiş Bildirimi", icon: Receipt },
          ],
        },
        {
          id: "communication-safety",
          title: "İletişim & İSG",
          emoji: "⚠️",
          items: [
            { href: "/personnel/chat", label: "Mesajlar / Şantiye Chat", icon: MessageSquare },
            { href: "/personnel/isg", label: "İSG Bildirimleri", icon: ShieldAlert },
            { href: "/personnel/tasks", label: "Görevlerim / İş Emirleri", icon: ClipboardList },
            { href: "/personnel/audits", label: "Denetim Raporları", icon: ClipboardCheck },
            { href: "/personnel/announcements", label: "Duyurular ve Belgeler", icon: Bell },
          ],
        },
        {
          id: "account",
          title: "Hesap",
          emoji: "⚙️",
          items: [
            { href: "/personnel", label: "Ana Sayfa", icon: Home },
            { href: "/personnel/profile", label: "Profil ve Ayarlar", icon: User },
          ],
        },
      ]

  return (
    <>
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 z-40 p-4">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setIsOpen(true)}
            className="text-slate-900 dark:text-white p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
          >
            <Menu className="w-6 h-6" />
          </button>
          <h1 className="text-slate-900 dark:text-white font-semibold">Şantiye Asistanı</h1>
          <div className="w-10"></div>
        </div>
      </div>

      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-[9990]"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full z-[9999] lg:z-40 transition-all duration-300 ${
          isOpen ? "translate-x-0 w-72" : "-translate-x-full lg:translate-x-0"
        } ${isCollapsed ? "lg:w-20" : "lg:w-64"} w-72 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800`}
      >
        <div className={`flex h-full flex-col ${isCollapsed ? "p-3" : "p-4 sm:p-6"}`}>
          {/* Header */}
          <div className={`mb-4 flex items-center ${isCollapsed ? "justify-center" : "justify-between"}`}>
            {!isCollapsed && (
              <div>
                <h1 className="text-lg font-bold text-slate-900 dark:text-white">Şantiye Asistanı</h1>
                <p className="text-xs text-slate-600 dark:text-slate-400">Nexa ERP</p>
              </div>
            )}
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="hidden h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:text-white lg:flex"
              title={isCollapsed ? "Genişlet" : "Daralt"}
            >
              {isCollapsed ? <ChevronDown className="h-5 w-5 rotate-180" /> : <ChevronDown className="h-5 w-5" />}
            </button>
          </div>

          {/* User Profile Section */}
          {!isCollapsed && (
            <div className="mb-4 rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800/50">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-slate-200 dark:bg-slate-700 rounded-full flex items-center justify-center">
                  <User className="w-6 h-6 text-slate-600 dark:text-slate-300" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-slate-900 dark:text-white font-medium truncate">{session?.user?.name || "Personel"}</p>
                  <p className="text-slate-600 dark:text-slate-400 text-xs truncate">Saha Mühendisi</p>
                </div>
              </div>
            </div>
          )}

          {/* Navigation */}
          <nav className="flex-1 space-y-2 overflow-y-auto overflow-x-hidden pr-1">
            {navGroups.map((group) => {
              const isGroupOpen = Boolean(openGroups[group.id])
              const hasActiveItem = group.items.some((item) => pathname === item.href)

              if (isCollapsed) {
                // Collapsed sidebar (Desktop only): icon-only mode with tooltips
                return (
                  <div key={group.id} className="space-y-1 py-1">
                    <div
                      className="flex justify-center py-1 text-sm select-none border-b border-slate-100 dark:border-slate-800/80 mb-1"
                      title={group.title}
                    >
                      <span className="opacity-80">{group.emoji}</span>
                    </div>
                    {group.items.map((item) => {
                      const isActive = pathname === item.href
                      const Icon = item.icon
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          className={`flex h-10 w-10 mx-auto items-center justify-center rounded-lg transition-colors ${
                            isActive
                              ? "bg-blue-600 text-white shadow-md shadow-blue-600/30"
                              : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                          }`}
                          title={item.label}
                        >
                          <Icon className="h-5 w-5 shrink-0" />
                        </Link>
                      )
                    })}
                  </div>
                )
              }

              // Normal / Mobile sidebar: Collapsible accordion category
              return (
                <div
                  key={group.id}
                  className="rounded-xl border border-slate-200/70 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/40 overflow-hidden transition-all"
                >
                  {/* Category Header Button */}
                  <button
                    type="button"
                    onClick={() => toggleGroup(group.id)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 text-xs font-semibold transition-all select-none ${
                      isGroupOpen
                        ? "bg-slate-100 dark:bg-slate-800/70 text-slate-900 dark:text-white"
                        : "text-slate-600 dark:text-slate-400 hover:bg-slate-100/60 dark:hover:bg-slate-800/40 hover:text-slate-900 dark:hover:text-slate-200"
                    }`}
                    aria-expanded={isGroupOpen}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-sm shrink-0">{group.emoji}</span>
                      <span className="truncate">{group.title}</span>
                      {hasActiveItem && (
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0 animate-pulse" />
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-slate-200/70 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                        {group.items.length}
                      </span>
                      <ChevronDown
                        className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${
                          isGroupOpen ? "rotate-0 text-slate-600 dark:text-slate-200" : "-rotate-90"
                        }`}
                      />
                    </div>
                  </button>

                  {/* Accordion Body */}
                  {isGroupOpen && (
                    <div className="space-y-1 p-1.5 pt-1 border-t border-slate-100 dark:border-slate-800/60 animate-in fade-in duration-150">
                      {group.items.map((item) => {
                        const isActive = pathname === item.href
                        const Icon = item.icon
                        return (
                          <Link
                            key={item.href}
                            href={item.href}
                            onClick={() => setIsOpen(false)}
                            className={`flex min-h-[40px] items-center gap-3 rounded-lg px-3 text-xs font-medium transition-colors ${
                              isActive
                                ? "bg-blue-600 text-white shadow-sm shadow-blue-600/30 font-semibold"
                                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
                            }`}
                          >
                            <Icon className={`h-4 w-4 shrink-0 ${isActive ? "text-white" : "text-slate-400 dark:text-slate-400"}`} />
                            <span className="truncate">{item.label}</span>
                          </Link>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })}
          </nav>

          {/* Footer */}
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
              onClick={() => signOut({ callbackUrl: '/login' })}
              className={`flex min-h-[44px] w-full items-center rounded-lg bg-red-600 px-4 py-3 text-white transition-colors hover:bg-red-500 ${
                isCollapsed ? "justify-center" : "gap-3 text-left"
              }`}
              title={isCollapsed ? "Çıkış Yap" : undefined}
            >
              <LogOut className="h-5 w-5 shrink-0" />
              {!isCollapsed && <span>Çıkış Yap</span>}
            </button>
          </div>

          {/* Close Button (Mobile Only) */}
          <button
            onClick={() => setIsOpen(false)}
            className="lg:hidden absolute top-4 right-4 text-slate-900 dark:text-white p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
      </aside>
    </>
  )
}
