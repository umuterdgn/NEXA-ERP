"use client"
/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * This code is the property of NXA Software.
 */


import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { signOut, useSession } from "next-auth/react"
import { useTheme } from "next-themes"
import NotificationBell from "@/components/NotificationBell"
import { usePwaInstall } from "@/hooks/use-pwa-install"
import { 
  LayoutDashboard, 
  FileText, 
  Archive, 
  DollarSign, 
  Building2, 
  FolderKanban, 
  Users, 
  ClipboardList, 
  Settings,
  Calculator,
  ShoppingCart,
  Box,
  FileSearch,
  TestTube,
  Hammer,
  FileCheck,
  CheckCircle,
  AlertOctagon,
  ClipboardCheck,
  AlertTriangle,
  MapPin,
  Map,
  Shield,
  MessageSquare,
  Truck,
  Bell,
  Megaphone,
  History,
  FileText as FileLogIcon,
  CheckSquare,
  Wallet,
  Clock,
  Bot,
  Sun,
  Moon,
  Search,
  Calendar,
  ShieldAlert,
  ShieldCheck,
  TrendingDown,
  UserCheck,
  Utensils,
  PackageSearch,
  Wrench,
  FileSignature,
  Pen,
  Scan,
  GitCompare,
  Route,
  PieChart,
  ScanText,
  Plane,
  CalendarDays,
  BarChart,
  ChevronLeft,
  ChevronRight,
  Download
} from "lucide-react"

export default function AdminSidebar({
  isCollapsed,
  setIsCollapsed,
}: {
  isCollapsed: boolean
  setIsCollapsed: React.Dispatch<React.SetStateAction<boolean>>
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [mounted, setMounted] = useState(false)
  const pathname = usePathname()
  const sessionContext = useSession()
  const session = sessionContext?.data
  const status = sessionContext?.status
  const { theme, setTheme } = useTheme()
  const { isInstallable, promptInstall } = usePwaInstall()

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => setMounted(true))
    return () => window.cancelAnimationFrame(frame)
  }, [])

  const isAdmin = session?.user?.role === "SUPER_ADMIN" || session?.user?.role === "ADMIN"
  const isPersonnel = session?.user?.role === "STAFF"
  const isSubcontractor = (session?.user?.role as string) === "SUBCONTRACTOR"
  const isClient = (session?.user?.role as string) === "CLIENT"
  const userPermissions = session?.user?.permissions || []

  const allNavItems = [
    { href: "/admin", label: "Dashboard", requiredPermission: "DASHBOARD", icon: LayoutDashboard, category: "ANA MENÜ", adminOnly: true },
    { href: "/admin/map", label: "Şantiye Haritası", requiredPermission: null, icon: Map, category: "ANA MENÜ", adminOnly: true },
    { href: "/admin/personnel", label: "Personel Takibi", requiredPermission: null, icon: Users, category: "İNSAN KAYNAKLARI" },
    { href: "/admin/payroll", label: "Puantaj & Bordro", requiredPermission: null, icon: CalendarDays, category: "İNSAN KAYNAKLARI" },
    { href: "/admin/shifts", label: "Vardiya Planlaması", requiredPermission: null, icon: Clock, category: "İNSAN KAYNAKLARI" },
    { href: "/admin/audits", label: "Taşeron Denetimleri", requiredPermission: null, icon: ShieldAlert, category: "TAŞERON YÖNETİMİ", contractorOnly: true },
    { href: "/admin/billing", label: "Hakediş Yönetimi", requiredPermission: null, icon: Wallet, category: "TAŞERON YÖNETİMİ", contractorOnly: true },
    { href: "/admin/subcontractors/contracts", label: "Taşeron Sözleşmeleri", requiredPermission: null, icon: FileSignature, category: "TAŞERON YÖNETİMİ", contractorOnly: true },
    { href: "/admin/subcontractors/documents", label: "İSG ve Evrak Takibi", requiredPermission: null, icon: ShieldCheck, category: "TAŞERON YÖNETİMİ", contractorOnly: true },
    { href: "/admin/subcontractors/deductions", label: "Kesintiler ve Cezalar", requiredPermission: null, icon: TrendingDown, category: "TAŞERON YÖNETİMİ", contractorOnly: true },
    { href: "/admin/personel", label: "Personeller", requiredPermission: "PERSONNEL", icon: Users, category: "İNSAN KAYNAKLARI", contractorOnly: true },
    { href: "/admin/attendance", label: "Puantaj & Mesai", requiredPermission: "ATTENDANCE", icon: UserCheck, category: "İNSAN KAYNAKLARI", contractorOnly: true },
    { href: "/admin/approvals", label: "Onay Bekleyenler", requiredPermission: null, icon: ClipboardCheck, category: "İNSAN KAYNAKLARI", contractorOnly: true },
    { href: "/admin/food-menu", label: "Yemek Menüsü", requiredPermission: null, icon: Utensils, category: "İNSAN KAYNAKLARI", contractorOnly: true },
    { href: "/admin/finance", label: "Kasa & Finans", requiredPermission: "FINANCE", icon: DollarSign, category: "FİNANS & TEDARİK", adminOnly: true },
    { href: "/admin/inventory", label: "Ambar & Karekod", requiredPermission: "INVENTORY", icon: PackageSearch, category: "FİNANS & TEDARİK", adminOnly: true },
    { href: "/admin/equipments", label: "Demirbaş", requiredPermission: null, icon: Wrench, category: "FİNANS & TEDARİK", adminOnly: true },
    { href: "/admin/contracts", label: "Sözleşmeler", requiredPermission: null, icon: FileSignature, category: "FİNANS & TEDARİK", adminOnly: true },
    { href: "/admin/progress-payments", label: "Hakediş ve Metraj", requiredPermission: null, icon: Calculator, category: "FİNANS & TEDARİK", subcontractorAllowed: true, adminOnly: true },
    { href: "/admin/procurement", label: "Satınalma & Talepler", requiredPermission: null, icon: ShoppingCart, category: "FİNANS & TEDARİK", adminOnly: true },
    { href: "/admin/collection-risk", label: "Tahsilat Risk AI", requiredPermission: null, icon: PieChart, category: "FİNANS & TEDARİK", adminOnly: true },
    { href: "/admin/projects", label: "Projeler", requiredPermission: "PROJECTS", icon: FolderKanban, category: "PROJE YÖNETİMİ" },
    { href: "/admin/crm", label: "CRM / Firmalar", requiredPermission: null, icon: Building2, category: "PROJE YÖNETİMİ", adminOnly: true },
    { href: "/admin/bim", label: "BIM & 3D Modeller", requiredPermission: null, icon: Box, category: "PROJE YÖNETİMİ", adminOnly: true },
    { href: "/admin/inspection/reports/create", label: "Hasar Tespit & Rapor", requiredPermission: null, icon: FileSearch, category: "YAPI DENETİM & KONTROL" },
    { href: "/admin/inspection", label: "Numune & Karot Takip", requiredPermission: null, icon: TestTube, category: "YAPI DENETİM & KONTROL" },
    { href: "/admin/inspection/reinforcement", label: "Demir & Kalıp Kontrol", requiredPermission: null, icon: Hammer, category: "YAPI DENETİM & KONTROL" },
    { href: "/admin/inspection/attachment", label: "Ataşman & Delil", requiredPermission: null, icon: FileCheck, category: "YAPI DENETİM & KONTROL" },
    { href: "/admin/inspection/documents", label: "Ruhsat & Evrak Arşivi", requiredPermission: null, icon: Archive, category: "YAPI DENETİM & KONTROL" },
    { href: "/admin/documents", label: "Dijital Evrak Arşivi", requiredPermission: null, icon: FileText, category: "YAPI DENETİM & KONTROL" },
    { href: "/admin/smart-documents", label: "Akıllı Evrak Denetimi (OCR)", requiredPermission: null, icon: ScanText, category: "YAPI DENETİM & KONTROL" },
    { href: "/admin/reports", label: "Saha Raporları", requiredPermission: null, icon: ClipboardList, category: "YAPI DENETİM & KONTROL" },
    { href: "/admin/ai-assistant", label: "AI Asistan", requiredPermission: null, icon: Bot, category: "YAPI DENETİM & KONTROL" },
    { href: "/admin/ai-vision", label: "AI Görsel Analiz", requiredPermission: null, icon: Scan, category: "YAPI DENETİM & KONTROL" },
    { href: "/admin/revisions", label: "Proje Revizyonları", requiredPermission: null, icon: GitCompare, category: "YAPI DENETİM & KONTROL" },
    { href: "/admin/routes", label: "Rota Optimizasyonu", requiredPermission: null, icon: Route, category: "YAPI DENETİM & KONTROL" },
    { href: "/admin/drone-maps", label: "Hava & Drone Gözlem", requiredPermission: null, icon: Plane, category: "YAPI DENETİM & KONTROL" },
    { href: "/admin/blueprints", label: "Dijital Projeler / Çizimler", requiredPermission: null, icon: FileText, category: "YAPI DENETİM & KONTROL" },
    { href: "/admin/blueprints/draw", label: "Serbest Çizim / Plan", requiredPermission: null, icon: Pen, category: "YAPI DENETİM & KONTROL" },
    { href: "/admin/qa-qc/materials", label: "Malzeme Onayları", requiredPermission: null, icon: CheckCircle, category: "YAPI DENETİM & KALİTE" },
    { href: "/admin/qa-qc/ncr", label: "Uygunsuzluk & DÖF", requiredPermission: null, icon: AlertOctagon, category: "YAPI DENETİM & KALİTE" },
    { href: "/admin/inspections", label: "Denetim Kayıtları", requiredPermission: null, icon: ClipboardCheck, category: "YAPI DENETİM & KONTROL" },
    { href: "/admin/deficiencies", label: "Saha Eksiklikleri", requiredPermission: null, icon: AlertTriangle, category: "YAPI DENETİM & KONTROL" },
    { href: "/admin/isg", label: "İSG Dashboard & Analiz", requiredPermission: null, icon: MapPin, category: "İSG & Risk Yönetimi" },
    { href: "/admin/isg/master-plan", label: "Vaziyet ve Risk Planı", requiredPermission: null, icon: Map, category: "İSG & Risk Yönetimi" },
    { href: "/admin/isg/certificates", label: "Evrak & Sertifikalar", requiredPermission: null, icon: FileText, category: "İSG & Risk Yönetimi" },
    { href: "/admin/isg/near-miss", label: "Ramak Kala Bildirimi", requiredPermission: null, icon: AlertTriangle, category: "İSG & Risk Yönetimi" },
    { href: "/admin/isg/ppe-forms", label: "KKD Zimmet Formları", requiredPermission: null, icon: Shield, category: "İSG & Risk Yönetimi" },
    { href: "/admin/cms", label: "İçerik Yönetimi", requiredPermission: null, icon: FileText, category: "İLETİŞİM & OPERASYON" },
    { href: "/admin/tasks", label: "Görevler & Takvim", requiredPermission: null, icon: Calendar, category: "İLETİŞİM & OPERASYON" },
    { href: "/admin/work-orders", label: "İş Emirleri (Kanban)", requiredPermission: null, icon: ClipboardList, category: "İLETİŞİM & OPERASYON" },
    { href: "/admin/communication/chat", label: "İç Haberleşme", requiredPermission: null, icon: MessageSquare, category: "İLETİŞİM & OPERASYON" },
    { href: "/admin/communication/logistics", label: "Lojistik & Randevu Ağı", requiredPermission: null, icon: Truck, category: "İLETİŞİM & OPERASYON" },
    { href: "/admin/users", label: "Kullanıcılar", requiredPermission: null, icon: Users, category: "İLETİŞİM & SİSTEM", adminOnly: true },
    { href: "/admin/logs", label: "Sistem Logları", requiredPermission: null, icon: FileLogIcon, category: "İLETİŞİM & SİSTEM", adminOnly: true },
    { href: "/admin/audit-logs", label: "İşlem Geçmişi", requiredPermission: null, icon: History, category: "İLETİŞİM & SİSTEM", adminOnly: true },
    { href: "/admin/notifications", label: "Bildirimler", requiredPermission: null, icon: Bell, category: "İLETİŞİM & SİSTEM" },
    { href: "/admin/announcements", label: "Duyuru Yönetimi", requiredPermission: null, icon: Megaphone, category: "İLETİŞİM & SİSTEM" },
    { href: "/admin/ayarlar", label: "Ayarlar", requiredPermission: null, icon: Settings, category: "İLETİŞİM & SİSTEM" },
    { href: "/admin/my-tasks", label: "Görevlerim", requiredPermission: null, icon: CheckSquare, personnelOnly: true, category: "PERSONEL" },
    { href: "/admin/my-salary", label: "Maaş/Avans", requiredPermission: null, icon: Wallet, personnelOnly: true, category: "PERSONEL" },
    { href: "/admin/my-attendance", label: "Mesai Geçmişim", requiredPermission: null, icon: Clock, personnelOnly: true, category: "PERSONEL" },
  ]

  // Yetki bazlı menü filtreleme
  const navItems = allNavItems.filter(item => {
    // Personnel sadece personnelOnly menüleri görür
    if (isPersonnel) {
      return item.personnelOnly === true
    }
    
    // Admin ve Super Admin personnelOnly menüleri görmemeli
    if (item.personnelOnly === true) {
      return false
    }
    
    // Contractor-only menüler (Taşeron Yönetimi, İnsan Kaynakları, Finans & Tedarık, Proje Yönetimi)
    // Sadece ADMIN, SUPER_ADMIN ve SUBCONTRACTOR görebilir, INSPECTOR göremez
    if (item.contractorOnly === true) {
      return isAdmin || isSubcontractor
    }
    
    // Admin-only menüler (Dashboard, Finance, Users, Logs)
    if (item.adminOnly === true) {
      return isAdmin
    }
    
    // Subcontractor-allowed menüler (Hakediş ve Metraj)
    if (item.subcontractorAllowed === true) {
      return isAdmin || isSubcontractor
    }
    
    // Client rolü için genel menüler (Projects, Drone Archive, etc.)
    if (isClient) {
      // Client sadece belirli menüleri görebilir
      const clientAllowedItems = [
        "/admin/projects",
        "/admin/calendar",
        "/admin/site-reports",
        "/admin/communication/chat"
      ]
      return clientAllowedItems.includes(item.href)
    }
    
    // Admin ve diğer roller için yetki kontrolü
    if (isAdmin) return true // Admin tüm diğer menüleri görür
    if (!item.requiredPermission) return true // Yetki gerektirmeyen menüler
    return userPermissions.includes(item.requiredPermission as string)
  })

  // Arama filtreleme
  const filteredNavItems = navItems.filter(item => {
    if (!searchQuery.trim()) return true
    const query = searchQuery.toLowerCase()
    return item.label.toLowerCase().includes(query) || 
           item.category.toLowerCase().includes(query)
  })

  // Group items by category
  const groupedNavItems = filteredNavItems.reduce((acc, item) => {
    const category = item.category || "DİĞER"
    if (!acc[category]) {
      acc[category] = []
    }
    acc[category].push(item)
    return acc
  }, {} as Record<string, typeof filteredNavItems>)

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
          <h1 className="font-semibold text-white">Şantiye Asistanı</h1>
          <div className="w-11" aria-hidden="true" />
        </div>
      </div>

      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 z-50 h-full transition-all duration-300 ${
          isOpen ? "translate-x-0 w-64" : "-translate-x-full lg:translate-x-0"
        } ${isCollapsed ? "lg:w-20" : "lg:w-64"} w-[85vw] max-w-[320px] border-r border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900`}
      >
        <div className={`flex h-full flex-col ${isCollapsed ? "p-3" : "p-4 sm:p-6"}`}>
          {/* Header */}
          <div className="mb-6">
            <div className={`mb-4 flex items-center ${isCollapsed ? "justify-center" : "justify-between"}`}>
              {!isCollapsed && (
                <div>
                  <h1 className="mb-1 text-xl font-bold text-slate-900 dark:text-white">Şantiye Asistanı</h1>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Mahir Bakay Mühendislik</p>
                </div>
              )}
              <div className="flex items-center gap-3">
                {!isCollapsed && mounted && (
                  <button
                    type="button"
                    onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                    className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg bg-slate-100 p-2 text-slate-600 transition-colors hover:bg-slate-200 hover:text-slate-900 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-white"
                    title={theme === 'dark' ? 'Açık Tema' : 'Koyu Tema'}
                  >
                    {mounted ? (theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />) : <div className="h-5 w-5" />}
                  </button>
                )}
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
          <nav className="flex-1 space-y-2 overflow-y-auto overflow-x-hidden">
            {Object.entries(groupedNavItems).map(([category, items]) => (
              <div key={category}>
                {!isCollapsed && (
                  <h3 className="mb-2 mt-6 text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-500">
                    {category}
                  </h3>
                )}
                {isCollapsed && <div className="mb-2 h-4" aria-hidden="true" />}
                {items.map((item) => {
                  const isActive = pathname === item.href
                  const Icon = item.icon
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setIsOpen(false)}
                      className={`flex min-h-[44px] items-center rounded-lg transition-colors ${
                        isActive
                          ? "bg-blue-50 font-medium text-blue-600 dark:bg-slate-800 dark:text-white"
                          : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                      } ${isCollapsed ? "justify-center px-0" : "justify-start gap-3 px-4"}`}
                      title={isCollapsed ? item.label : undefined}
                    >
                      <Icon className="h-5 w-5 shrink-0" />
                      <span className={`${isCollapsed ? "hidden" : "truncate"}`}>{item.label}</span>
                    </Link>
                  )
                })}
              </div>
            ))}
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
              onClick={() => signOut({ callbackUrl: '/login' })}
              className={`flex min-h-[44px] w-full items-center gap-3 rounded-lg bg-red-600 px-4 py-3 text-white transition-colors hover:bg-red-500 ${
                isCollapsed ? "justify-center" : "text-left"
              }`}
              title={isCollapsed ? "Çıkış Yap" : undefined}
            >
              <svg className="h-5 w-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
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
