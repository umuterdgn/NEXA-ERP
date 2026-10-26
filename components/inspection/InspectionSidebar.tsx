"use client"
/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Inspection Sidebar Component - 1:1 Match with Admin Sidebar Design
 */

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { signOut, useSession } from "next-auth/react"
import NotificationBell from "@/components/NotificationBell"
import { usePwaInstall } from "@/hooks/use-pwa-install"
import { isMenuItemAllowed } from "@/lib/utils/module-permissions"
import { 
  LayoutDashboard, 
  Archive, 
  DollarSign, 
  Building2, 
  FolderKanban, 
  Users, 
  ClipboardList, 
  Calculator, 
  Box, 
  TestTube, 
  FileCheck, 
  ClipboardCheck, 
  AlertTriangle, 
  Map, 
  History, 
  ScanText, 
  Plane, 
  ChevronLeft, 
  ChevronRight, 
  Download, 
  LogOut, 
  FileWarning, 
  Paperclip, 
  ImagePlus, 
  PenTool, 
  PencilRuler, 
  Construction, 
  XCircle, 
  Landmark, 
  Receipt,
  Search,
  CheckSquare,
  FileSignature,
  Files,
  Settings
} from "lucide-react"

interface MenuItem {
  href: string
  label: string
  icon: any
  category: string
}

const menuItems: MenuItem[] = [
  // ANA MENÜ
  { href: "/inspection/dashboard", label: "Dashboard", icon: LayoutDashboard, category: "ANA MENÜ" },

  // PERSONEL YÖNETİMİ
  { href: "/inspection/personnel", label: "Personeller", icon: Users, category: "PERSONEL YÖNETİMİ" },

  // FİNANS & TEDARİK
  { href: "/inspection/finance", label: "Kasa & Finans", icon: DollarSign, category: "FİNANS & TEDARİK" },
  { href: "/inspection/finance/expenses", label: "Masraf & Fiş Onayı", icon: Receipt, category: "FİNANS & TEDARİK" },
  { href: "/inspection/finance/cheques", label: "Çek / Senet & Teminat", icon: Landmark, category: "FİNANS & TEDARİK" },

  // PROJE YÖNETİMİ
  { href: "/inspection/projects", label: "Projeler", icon: FolderKanban, category: "PROJE YÖNETİMİ" },
  { href: "/inspection/crm", label: "CRM / Firmalar", icon: Building2, category: "PROJE YÖNETİMİ" },
  { href: "/inspection/bim", label: "BIM & 3D Modeller", icon: Box, category: "PROJE YÖNETİMİ" },
  { href: "/inspection/boq", label: "Keşif & Metraj (BoQ)", icon: Calculator, category: "PROJE YÖNETİMİ" },

  // YAPI DENETİM & KONTROL
  { href: "/inspection/forms", label: "Dinamik Denetim Formları", icon: ClipboardCheck, category: "YAPI DENETİM & KONTROL" },
  { href: "/inspection/form-builder", label: "Dinamik Form Oluşturucu", icon: PencilRuler, category: "YAPI DENETİM & KONTROL" },
  { href: "/inspection/inspection/reports/create", label: "Hasar Tespit & Rapor", icon: FileWarning, category: "YAPI DENETİM & KONTROL" },
  { href: "/inspection/samples", label: "Numune & Karot Takip", icon: TestTube, category: "YAPI DENETİM & KONTROL" },
  { href: "/inspection/reinforcement", label: "Demir & Kalıp Kontrol", icon: Construction, category: "YAPI DENETİM & KONTROL" },
  { href: "/inspection/attachment", label: "Ataşman & Delil Kayıtları", icon: Paperclip, category: "YAPI DENETİM & KONTROL" },
  { href: "/inspection/documents", label: "Ruhsat & Evrak Arşivi", icon: Archive, category: "YAPI DENETİM & KONTROL" },
  { href: "/inspection/archive", label: "Dijital Evrak Arşivi", icon: Files, category: "YAPI DENETİM & KONTROL" },
  { href: "/inspection/ocr", label: "Akıllı Evrak Denetimi (OCR)", icon: ScanText, category: "YAPI DENETİM & KONTROL" },
  { href: "/inspection/reports", label: "Saha Raporları", icon: ClipboardList, category: "YAPI DENETİM & KONTROL" },
  { href: "/inspection/ai-vision", label: "AI Görsel Analiz", icon: ImagePlus, category: "YAPI DENETİM & KONTROL" },
  { href: "/inspection/revisions", label: "Proje Revizyonları", icon: History, category: "YAPI DENETİM & KONTROL" },
  { href: "/inspection/routes", label: "Rota Optimizasyonu", icon: Map, category: "YAPI DENETİM & KONTROL" },
  { href: "/inspection/drone", label: "Hava & Drone Gözlem", icon: Plane, category: "YAPI DENETİM & KONTROL" },
  { href: "/inspection/blueprints", label: "Dijital Projeler / Çizimler", icon: PenTool, category: "YAPI DENETİM & KONTROL" },
  { href: "/inspection/sketch", label: "Serbest Çizim / Plan", icon: PencilRuler, category: "YAPI DENETİM & KONTROL" },
  { href: "/inspection/inspections", label: "Denetim Kayıtları", icon: ClipboardCheck, category: "YAPI DENETİM & KONTROL" },
  { href: "/inspection/deficiencies", label: "Saha Kusur & Eksiklikleri", icon: AlertTriangle, category: "YAPI DENETİM & KONTROL" },

  // KALİTE & KURULUŞ
  { href: "/inspection/materials", label: "Malzeme Onayları", icon: CheckSquare, category: "KALİTE & KURULUŞ" },
  { href: "/inspection/ncr", label: "Uygunsuzluk & DÖF (NCR)", icon: XCircle, category: "KALİTE & KURULUŞ" },
  { href: "/inspection/contracts", label: "Sözleşmeler", icon: FileSignature, category: "KALİTE & KURULUŞ" },

  // SİSTEM & AYARLAR
  { href: "/inspection/settings", label: "Kurumsal Marka & Ayarlar", icon: Settings, category: "SİSTEM & AYARLAR" },
]

export default function InspectionSidebar({
  isCollapsed,
  setIsCollapsed,
}: {
  isCollapsed: boolean
  setIsCollapsed: React.Dispatch<React.SetStateAction<boolean>>
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null)
  const pathname = usePathname()
  const { isInstallable, promptInstall } = usePwaInstall()
  const { data: session } = useSession()

  // White-Label Kurumsal Marka Bilgisi
  const isWhiteLabelActive = Boolean((session?.user as any)?.isWhiteLabelActive)
  const tenantLogoUrl = (session?.user as any)?.logoUrl as string | undefined
  const tenantCompanyName = (session?.user as any)?.companyName || (session?.user as any)?.name

  useEffect(() => {
    // 1. URL'den aktif proje ID'sini al
    const match = pathname?.match(/\/inspection\/projects\/([^\/]+)/)
    if (match && match[1] && match[1] !== "new") {
      setActiveProjectId(match[1])
      try {
        localStorage.setItem("nexa_active_project_id", match[1])
      } catch {}
    } else {
      // 2. LocalStorage'dan al
      try {
        const saved = localStorage.getItem("nexa_active_project_id")
        if (saved) {
          setActiveProjectId(saved)
          return
        }
      } catch {}
      // 3. API'den ilk projeyi çek
      fetch("/api/admin/projects?limit=1")
        .then((res) => res.json())
        .then((data) => {
          const list = Array.isArray(data) ? data : data?.projects
          if (list && list.length > 0 && list[0]?.id) {
            setActiveProjectId(list[0].id)
          }
        })
        .catch(() => {})
    }
  }, [pathname])

  const boqHref = activeProjectId ? `/inspection/projects/${activeProjectId}/boq` : "/inspection/projects"
  const bimHref = activeProjectId ? `/inspection/projects/${activeProjectId}/bim` : "/inspection/projects"

  const userRole = (session?.user as any)?.role as string | undefined
  const isInspectionAdmin = userRole === "INSPECTION_ADMIN" || userRole === "SUPER_ADMIN" || userRole === "ADMIN"

  // Saha denetçisi (INSPECTOR/AUDITOR) için Finans, CRM, Personeller ve Sözleşmeler gizlenir
  const roleFilteredMenuItems = menuItems.filter((item) => {
    if (isInspectionAdmin) return true

    if (item.category === "FİNANS & TEDARİK") return false
    if (item.category === "PERSONEL YÖNETİMİ") return false
    if (item.href === "/inspection/crm" || item.label.includes("CRM")) return false
    if (item.href === "/inspection/contracts" || item.label.includes("Sözleşme")) return false

    return true
  })

  const sessionEnabledModules = (session?.user as any)?.enabledModules as string[] | undefined

  // Multi-Tenant SaaS Modül İzinleri Filtresi (Kapalı modüller menüde tamamen gizlenir)
  const moduleFilteredItems = roleFilteredMenuItems.filter((item) =>
    isMenuItemAllowed(item, sessionEnabledModules, userRole)
  )

  const effectiveMenuItems = moduleFilteredItems.map((item) => {
    if (item.label === "Keşif & Metraj (BoQ)") {
      return { ...item, href: boqHref }
    }
    if (item.label === "BIM & 3D Modeller") {
      return { ...item, href: bimHref }
    }
    return item
  })

  // Group items by category
  const groupedMenuItems = effectiveMenuItems.reduce((acc, item) => {
    const category = item.category
    if (!acc[category]) {
      acc[category] = []
    }
    acc[category].push(item)
    return acc
  }, {} as Record<string, MenuItem[]>)

  // Filter items based on search
  const filteredMenuItems = effectiveMenuItems.filter((item) => {
    if (!searchQuery.trim()) return true
    const query = searchQuery.toLowerCase()
    return (
      item.label.toLowerCase().includes(query) ||
      item.category.toLowerCase().includes(query)
    )
  })

  // Group filtered items
  const groupedFilteredItems = filteredMenuItems.reduce((acc, item) => {
    const category = item.category
    if (!acc[category]) {
      acc[category] = []
    }
    acc[category].push(item)
    return acc
  }, {} as Record<string, MenuItem[]>)

  const categories = Object.keys(searchQuery.trim() ? groupedFilteredItems : groupedMenuItems)

  return (
    <>
      {/* Mobile Header */}
      <div className="fixed left-0 right-0 top-0 z-40 border-b border-slate-800 bg-slate-900 px-4 pb-safe pt-safe lg:hidden">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => setIsOpen(true)}
            className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg p-2 text-white transition-colors hover:bg-slate-800"
            aria-label="Menüyü aç"
          >
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          
          <div className="flex items-center gap-2">
            {isWhiteLabelActive && tenantLogoUrl ? (
              <img
                src={tenantLogoUrl}
                alt={tenantCompanyName || "Şirket Logosu"}
                className="max-h-7 max-w-[130px] object-contain"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = "none"
                }}
              />
            ) : (
              <h1 className="font-semibold text-white">Yapı Denetim Portalı</h1>
            )}
          </div>

          <div className="w-11" aria-hidden="true" />
        </div>
      </div>

      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-[9990] bg-black/50 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 z-[9999] h-full transition-all duration-300 ${
          isOpen ? "translate-x-0 w-64" : "-translate-x-full lg:translate-x-0"
        } ${isCollapsed ? "lg:w-20" : "lg:w-64"} w-[85vw] max-w-[320px] border-r border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900`}
      >
        <div className={`flex h-full flex-col ${isCollapsed ? "p-3" : "p-4 sm:p-6"}`}>
          {/* Header */}
          <div className="mb-6">
            <div className={`mb-4 flex items-center ${isCollapsed ? "justify-center" : "justify-between"}`}>
              {!isCollapsed ? (
                <div>
                  {isWhiteLabelActive && tenantLogoUrl ? (
                    <div className="mb-1">
                      <img
                        src={tenantLogoUrl}
                        alt={tenantCompanyName || "Kurumsal Logo"}
                        className="max-h-10 max-w-[160px] object-contain"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = "none"
                        }}
                      />
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        {tenantCompanyName || "Yapı Denetim Kuruluşu"}
                      </p>
                    </div>
                  ) : (
                    <div>
                      <h1 className="mb-1 text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-tenant" />
                        <span>Yapı Denetim</span>
                      </h1>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        Saha & Denetim Terminali
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                isWhiteLabelActive && tenantLogoUrl ? (
                  <img
                    src={tenantLogoUrl}
                    alt="Logo"
                    className="h-8 w-8 object-contain rounded-md"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = "none"
                    }}
                  />
                ) : (
                  <div className="h-8 w-8 rounded-lg bg-tenant/10 border border-tenant/20 flex items-center justify-center font-black text-tenant">
                    YD
                  </div>
                )
              )}
              <div className="flex items-center gap-3">
                {!isCollapsed && <NotificationBell />}
                <button
                  type="button"
                  onClick={() => setIsCollapsed(!isCollapsed)}
                  className="hidden h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:text-white lg:flex"
                  title={isCollapsed ? "Genişlet" : "Daralt"}
                >
                  {isCollapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
                </button>
              </div>
            </div>

            {!isCollapsed && (
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-600 dark:text-slate-400" />
                <input
                  type="text"
                  placeholder="Menü ara..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="min-h-[44px] w-full rounded-lg border border-slate-200 bg-slate-100 pl-10 pr-4 text-slate-900 transition-all placeholder:text-slate-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500/50 dark:border-slate-700 dark:bg-slate-800/50 dark:text-white dark:placeholder:text-slate-400"
                />
              </div>
            )}
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 overflow-y-auto overflow-x-hidden pr-2">
            {categories.map((category) => {
              const items = searchQuery.trim() ? groupedFilteredItems[category] : groupedMenuItems[category]
              if (!items || items.length === 0) return null

              return (
                <div key={category}>
                  {/* Category Header */}
                  {!isCollapsed && (
                    <div className="mt-6 mb-2 px-4 text-xs font-bold uppercase text-gray-500 dark:text-gray-400">
                      {category}
                    </div>
                  )}

                  {/* Menu Items */}
                  <div className="space-y-1">
                    {items.map((item) => {
                      const isActive =
                        pathname === item.href ||
                        (item.label === "Keşif & Metraj (BoQ)" && pathname?.includes("/boq")) ||
                        (item.label === "BIM & 3D Modeller" && pathname?.includes("/bim")) ||
                        (item.label === "Projeler" && pathname === "/inspection/projects")
                      const Icon = item.icon
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => setIsOpen(false)}
                          className={`flex min-h-[40px] items-center rounded-lg transition-colors ${
                            isActive
                              ? "bg-tenant/15 font-semibold text-tenant border-l-2 border-tenant dark:bg-slate-800 dark:text-tenant"
                              : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                          } gap-3 px-3 py-2`}
                          title={isCollapsed ? item.label : undefined}
                        >
                          <Icon className="h-4 w-4 shrink-0" />
                          {!isCollapsed && <span className="text-sm">{item.label}</span>}
                        </Link>
                      )
                    })}
                  </div>
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
              type="button"
              onClick={() => signOut({ callbackUrl: "/login" })}
              className={`flex min-h-[44px] w-full items-center gap-3 rounded-lg bg-red-600 px-4 py-3 text-white transition-colors hover:bg-red-500 ${
                isCollapsed ? "justify-center" : "text-left"
              }`}
              title={isCollapsed ? "Çıkış Yap" : undefined}
            >
              <LogOut className="h-5 w-5 shrink-0" />
              {!isCollapsed && <span>Çıkış Yap</span>}
            </button>
          </div>

          {/* Close Button (Mobile Only) */}
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="absolute right-4 top-4 flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg p-2 text-white transition-colors hover:bg-slate-800 lg:hidden"
            aria-label="Menüyü kapat"
          >
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </aside>
    </>
  )
}
