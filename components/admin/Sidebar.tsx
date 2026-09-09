"use client"
/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * This code is the property of NXA Software.
 */

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { signOut } from "next-auth/react"
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
  Search,
  Calendar,
  CalendarClock,
  ShieldAlert,
  ShieldCheck,
  TrendingDown,
  UserCheck,
  Utensils,
  PackageSearch,
  Wrench,
  FileSignature,
  Pen,
  ScanText,
  Plane,
  CalendarDays,
  PieChart,
  ChevronLeft,
  ChevronRight,
  Download,
  LogOut,
  Briefcase,
  HardHat,
  FileWarning,
  Paperclip,
  Files,
  ImagePlus,
  PenTool,
  PencilRuler,
  Award,
  Activity,
  FileBadge,
  Construction,
  XCircle
} from "lucide-react"

interface MenuItem {
  href: string
  label: string
  icon: any
  category: string
}

const menuItems: MenuItem[] = [
  // ANA MENÜ
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, category: "ANA MENÜ" },
  { href: "/admin/map", label: "Şantiye Haritası", icon: Map, category: "ANA MENÜ" },
  
  // İNSAN KAYNAKLARI
  { href: "/admin/personel", label: "Personeller", icon: Users, category: "İNSAN KAYNAKLARI" },
  { href: "/admin/personnel", label: "Personel Takibi", icon: UserCheck, category: "İNSAN KAYNAKLARI" },
  { href: "/admin/attendance", label: "Puantaj & Mesai", icon: Clock, category: "İNSAN KAYNAKLARI" },
  { href: "/admin/payroll", label: "Puantaj & Bordro", icon: Calculator, category: "İNSAN KAYNAKLARI" },
  { href: "/admin/shifts", label: "Vardiya Planlaması", icon: CalendarClock, category: "İNSAN KAYNAKLARI" },
  { href: "/admin/approvals", label: "Onay Bekleyenler", icon: CheckSquare, category: "İNSAN KAYNAKLARI" },
  { href: "/admin/food-menu", label: "Yemek Menüsü", icon: Utensils, category: "İNSAN KAYNAKLARI" },
  
  // TAŞERON YÖNETİMİ
  { href: "/admin/audits", label: "Taşeron Denetimleri", icon: ShieldAlert, category: "TAŞERON YÖNETİMİ" },
  { href: "/admin/billing", label: "Hakediş Yönetimi", icon: Wallet, category: "TAŞERON YÖNETİMİ" },
  { href: "/admin/subcontractors/contracts", label: "Taşeron Sözleşmeleri", icon: FileSignature, category: "TAŞERON YÖNETİMİ" },
  { href: "/admin/subcontractors/documents", label: "İSG ve Evrak Takibi", icon: ShieldCheck, category: "TAŞERON YÖNETİMİ" },
  { href: "/admin/subcontractors/deductions", label: "Kesintiler ve Cezalar", icon: TrendingDown, category: "TAŞERON YÖNETİMİ" },
  
  // FİNANS & TEDARİK
  { href: "/admin/finance", label: "Kasa & Finans", icon: DollarSign, category: "FİNANS & TEDARİK" },
  { href: "/admin/inventory", label: "Ambar & Karekod", icon: PackageSearch, category: "FİNANS & TEDARİK" },
  { href: "/admin/equipments", label: "Demirbaş", icon: Wrench, category: "FİNANS & TEDARİK" },
  { href: "/admin/contracts", label: "Sözleşmeler", icon: FileSignature, category: "FİNANS & TEDARİK" },
  { href: "/admin/progress-payments", label: "Hakediş ve Metraj", icon: Calculator, category: "FİNANS & TEDARİK" },
  { href: "/admin/procurement", label: "Satınalma & Talepler", icon: ShoppingCart, category: "FİNANS & TEDARİK" },
  { href: "/admin/collection-risk", label: "Tahsilat Risk AI", icon: PieChart, category: "FİNANS & TEDARİK" },
  
  // PROJE YÖNETİMİ
  { href: "/admin/projects", label: "Projeler", icon: FolderKanban, category: "PROJE YÖNETİMİ" },
  { href: "/admin/crm", label: "CRM / Firmalar", icon: Building2, category: "PROJE YÖNETİMİ" },
  { href: "/admin/bim", label: "BIM & 3D Modeller", icon: Box, category: "PROJE YÖNETİMİ" },
  
  // YAPI DENETİM & KONTROL
  { href: "/admin/inspection/reports/create", label: "Hasar Tespit & Rapor", icon: FileWarning, category: "YAPI DENETİM & KONTROL" },
  { href: "/admin/inspection", label: "Numune & Karot Takip", icon: TestTube, category: "YAPI DENETİM & KONTROL" },
  { href: "/admin/inspection/reinforcement", label: "Demir & Kalıp Kontrol", icon: Construction, category: "YAPI DENETİM & KONTROL" },
  { href: "/admin/inspection/attachment", label: "Ataşman & Delil", icon: Paperclip, category: "YAPI DENETİM & KONTROL" },
  { href: "/admin/inspection/documents", label: "Ruhsat & Evrak Arşivi", icon: Archive, category: "YAPI DENETİM & KONTROL" },
  { href: "/admin/documents", label: "Dijital Evrak Arşivi", icon: Files, category: "YAPI DENETİM & KONTROL" },
  { href: "/admin/smart-documents", label: "Akıllı Evrak Denetimi (OCR)", icon: ScanText, category: "YAPI DENETİM & KONTROL" },
  { href: "/admin/reports", label: "Saha Raporları", icon: ClipboardList, category: "YAPI DENETİM & KONTROL" },
  { href: "/admin/ai-assistant", label: "AI Asistan", icon: Bot, category: "YAPI DENETİM & KONTROL" },
  { href: "/admin/ai-vision", label: "AI Görsel Analiz", icon: ImagePlus, category: "YAPI DENETİM & KONTROL" },
  { href: "/admin/revisions", label: "Proje Revizyonları", icon: History, category: "YAPI DENETİM & KONTROL" },
  { href: "/admin/routes", label: "Rota Optimizasyonu", icon: Map, category: "YAPI DENETİM & KONTROL" },
  { href: "/admin/drone-maps", label: "Hava & Drone Gözlem", icon: Plane, category: "YAPI DENETİM & KONTROL" },
  { href: "/admin/blueprints", label: "Dijital Projeler / Çizimler", icon: PenTool, category: "YAPI DENETİM & KONTROL" },
  { href: "/admin/blueprints/draw", label: "Serbest Çizim / Plan", icon: PencilRuler, category: "YAPI DENETİM & KONTROL" },
  { href: "/admin/inspections", label: "Denetim Kayıtları", icon: ClipboardCheck, category: "YAPI DENETİM & KONTROL" },
  { href: "/admin/deficiencies", label: "Saha Eksiklikleri", icon: AlertTriangle, category: "YAPI DENETİM & KONTROL" },
  
  // YAPI DENETİM & KALİTE
  { href: "/admin/qa-qc/materials", label: "Malzeme Onayları", icon: CheckSquare, category: "YAPI DENETİM & KALİTE" },
  { href: "/admin/qa-qc/ncr", label: "Uygunsuzluk & DÖF", icon: XCircle, category: "YAPI DENETİM & KALİTE" },
  
  // İSG & RİSK YÖNETİMİ
  { href: "/admin/isg", label: "İSG Dashboard & Analiz", icon: Activity, category: "İSG & RİSK YÖNETİMİ" },
  { href: "/admin/isg/master-plan", label: "Vaziyet ve Risk Planı", icon: MapPin, category: "İSG & RİSK YÖNETİMİ" },
  { href: "/admin/isg/certificates", label: "Evrak & Sertifikalar", icon: FileBadge, category: "İSG & RİSK YÖNETİMİ" },
  { href: "/admin/isg/near-miss", label: "Ramak Kala Bildirimi", icon: AlertOctagon, category: "İSG & RİSK YÖNETİMİ" },
  { href: "/admin/isg/ppe-forms", label: "KKD Zimmet Formları", icon: UserCheck, category: "İSG & RİSK YÖNETİMİ" },
  
  // İLETİŞİM & OPERASYON
  { href: "/admin/cms", label: "İçerik Yönetimi", icon: FileText, category: "İLETİŞİM & OPERASYON" },
  { href: "/admin/tasks", label: "Görevler & Takvim", icon: Calendar, category: "İLETİŞİM & OPERASYON" },
  { href: "/admin/work-orders", label: "İş Emirleri (Kanban)", icon: ClipboardList, category: "İLETİŞİM & OPERASYON" },
  { href: "/admin/communication/chat", label: "İç Haberleşme", icon: MessageSquare, category: "İLETİŞİM & OPERASYON" },
  { href: "/admin/communication/logistics", label: "Lojistik & Randevu Ağı", icon: Truck, category: "İLETİŞİM & OPERASYON" },
  
  // SİSTEM & AYARLAR
  { href: "/admin/users", label: "Kullanıcılar", icon: Users, category: "SİSTEM & AYARLAR" },
  { href: "/admin/logs", label: "Sistem Logları", icon: FileLogIcon, category: "SİSTEM & AYARLAR" },
  { href: "/admin/audit-logs", label: "İşlem Geçmişi", icon: History, category: "SİSTEM & AYARLAR" },
  { href: "/admin/notifications", label: "Bildirimler", icon: Bell, category: "SİSTEM & AYARLAR" },
  { href: "/admin/announcements", label: "Duyuru Yönetimi", icon: Megaphone, category: "SİSTEM & AYARLAR" },
  { href: "/admin/ayarlar", label: "Ayarlar", icon: Settings, category: "SİSTEM & AYARLAR" },
]

export default function AdminSidebar({
  isCollapsed,
  setIsCollapsed,
}: {
  isCollapsed: boolean
  setIsCollapsed: React.Dispatch<React.SetStateAction<boolean>>
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const pathname = usePathname()
  const { isInstallable, promptInstall } = usePwaInstall()

  // Group items by category
  const groupedMenuItems = menuItems.reduce((acc, item) => {
    const category = item.category
    if (!acc[category]) {
      acc[category] = []
    }
    acc[category].push(item)
    return acc
  }, {} as Record<string, MenuItem[]>)

  // Filter items based on search
  const filteredMenuItems = menuItems.filter(item => {
    if (!searchQuery.trim()) return true
    const query = searchQuery.toLowerCase()
    return item.label.toLowerCase().includes(query) || 
           item.category.toLowerCase().includes(query)
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
          <h1 className="font-semibold text-white">Nexa ERP</h1>
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
                  <h1 className="mb-1 text-xl font-bold text-slate-900 dark:text-white">Nexa ERP</h1>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Şantiye & Denetim Asistanı</p>
                </div>
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
                      const isActive = pathname === item.href
                      const Icon = item.icon
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => setIsOpen(false)}
                          className={`flex min-h-[40px] items-center rounded-lg transition-colors ${
                            isActive
                              ? "bg-blue-100 font-medium text-blue-600 dark:bg-slate-700 dark:text-blue-400"
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
              onClick={() => signOut({ callbackUrl: '/login' })}
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
