"use client"
/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Nexa ERP - Gelişmiş Akordiyon (Collapsible) & Hızlı Aramalı Sidebar (Yan Menü)
 */

import { useState, useEffect, useMemo } from "react"
import { Link, usePathname } from "@/i18n/routing"
import Image from "next/image"
import { signOut, useSession } from "next-auth/react"
import { useTranslations } from "next-intl"
import NotificationBell from "@/components/NotificationBell"
import ThemeToggle from "@/components/ThemeToggle"
import { usePwaInstall } from "@/hooks/use-pwa-install"
import { isMenuItemAllowed } from "@/lib/utils/module-permissions"
import { 
  LayoutDashboard, 
  FileText, 
  Newspaper,
  Archive, 
  DollarSign, 
  Building2, 
  FolderKanban, 
  TrendingUp, 
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
  ChevronDown,
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
  Layers,
  FileBadge,
  Construction,
  XCircle,
  Landmark,
  Gavel,
  Navigation,
  QrCode,
  Receipt,
  PackageCheck,
  TestTube2,
  Radio,
  Camera,
  RefreshCw,
  Hammer,
  X,
  BookOpen,
} from "lucide-react"

interface MenuItem {
  href: string
  label: string
  icon: any
  category: string
}

// Kategori İkon Haritası
const getCategoryIcon = (category: string) => {
  switch (category) {
    case "ANA MENÜ":
      return LayoutDashboard
    case "İNSAN KAYNAKLARI":
      return Users
    case "TAŞERON YÖNETİMİ":
      return HardHat
    case "FİNANS & TEDARİK":
      return DollarSign
    case "PROJE YÖNETİMİ":
      return FolderKanban
    case "YAPI DENETİM & KONTROL":
      return ShieldCheck
    case "YAPI DENETİM & KALİTE":
    case "KALİTE GÜVENCE (QA/QC)":
      return Award
    case "İSG & RİSK YÖNETİMİ":
      return ShieldAlert
    case "SAHA & OPERASYON":
      return ClipboardList
    case "İLETİŞİM & OPERASYON":
      return Radio
    case "SİSTEM & AYARLAR":
      return Settings
    case "TAŞERON PORTALI":
      return HardHat
    case "FRANCHISE & ROLLOUT":
      return Building2
    case "SAHA & RAPORLAMA":
      return ClipboardList
    default:
      return FolderKanban
  }
}

// Taşeron Kısıtlı Menü Listesi (Finans, Kasa, Sözleşmeler, Satınalma tamamen gizlenir)
const subcontractorMenuItems: MenuItem[] = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, category: "TAŞERON PORTALI" },
  { href: "/admin/map", label: "Şantiye Haritası", icon: Map, category: "TAŞERON PORTALI" },
  { href: "/admin/bim", label: "3D Modeller (Kusurlar)", icon: Box, category: "TAŞERON PORTALI" },
  { href: "/admin/subcontractor-inspections", label: "İş Kanıtı / Hakediş", icon: ShieldCheck, category: "TAŞERON PORTALI" },
]

// Yapı Denetim Yalıtılmış Menü Listesi (Kasa, Finans, İK, Bordro, Hakediş GİZLENİR!)
const inspectorMenuItems: MenuItem[] = [
  { href: "/dashboard", label: "Yapı Denetim Dashboard", icon: LayoutDashboard, category: "YAPI DENETİM & KONTROL" },
  { href: "/admin/projects", label: "Denetlenen Yapılar", icon: Building2, category: "YAPI DENETİM & KONTROL" },
  { href: "/admin/samples", label: "Karot / Numune Takip", icon: TestTube, category: "YAPI DENETİM & KONTROL" },
  { href: "/admin/forms", label: "Dinamik Denetim Formları", icon: ClipboardCheck, category: "YAPI DENETİM & KONTROL" },
  { href: "/yibf", label: "Bakanlık e-YİBF Sistemi", icon: Building2, category: "YAPI DENETİM & KONTROL" },
  { href: "/admin/inspection/reinforcement", label: "Demir & Kalıp Kontrol", icon: Hammer, category: "YAPI DENETİM & KONTROL" },
  { href: "/admin/inspection/timelapse", label: "Saha Kamerası (Timelapse)", icon: Camera, category: "YAPI DENETİM & KONTROL" },
  { href: "/admin/inspection/attachment", label: "Ataşman & Delil Kayıtları", icon: FileCheck, category: "YAPI DENETİM & KONTROL" },
  { href: "/admin/qa-qc/materials", label: "Malzeme Onayları (QA)", icon: CheckSquare, category: "KALİTE GÜVENCE (QA/QC)" },
  { href: "/admin/qa-qc/ncr", label: "Uygunsuzluk & DÖF (NCR)", icon: XCircle, category: "KALİTE GÜVENCE (QA/QC)" },
  { href: "/admin/deficiencies", label: "Saha Eksiklikleri", icon: AlertTriangle, category: "KALİTE GÜVENCE (QA/QC)" },
  { href: "/map", label: "Denetim Haritası", icon: Map, category: "SAHA & RAPORLAMA" },
  { href: "/dispatch", label: "Mühendis Görev Dağıtımı", icon: Users, category: "SAHA & RAPORLAMA" },
  { href: "/admin/reports", label: "Saha Denetim Raporları", icon: ClipboardList, category: "SAHA & RAPORLAMA" },
]

// Franchise / Rollout Menü Listesi (companyType === 'FRANCHISE')
const franchiseMenuItems: MenuItem[] = [
  { href: "/franchise/dashboard", label: "AI Risk Radarı & Özet", icon: Bot, category: "FRANCHISE & ROLLOUT" },
  { href: "/franchise/rollout-map", label: "Rollout Haritası", icon: Map, category: "FRANCHISE & ROLLOUT" },
  { href: "/franchise/rollout", label: "Rollout Takip (Kanban)", icon: FolderKanban, category: "FRANCHISE & ROLLOUT" },
  { href: "/admin/projects", label: "Mağazalar (Projeler)", icon: Building2, category: "FRANCHISE & ROLLOUT" },
  { href: "/franchise/templates", label: "Konsept Şablonları", icon: Box, category: "FRANCHISE & ROLLOUT" },
  { href: "/franchise/stage-gates", label: "İdari İzinler", icon: ShieldCheck, category: "FRANCHISE & ROLLOUT" },
  { href: "/franchise/procurement/consolidated", label: "Konsolide Satınalma", icon: ShoppingCart, category: "FRANCHISE & ROLLOUT" },
  { href: "/admin/procurement/logistics", label: "OFCI Lojistik", icon: Truck, category: "FRANCHISE & ROLLOUT" },
  { href: "/franchise/logistics/rma", label: "Hasarlı Teslimat (RMA)", icon: AlertTriangle, category: "FRANCHISE & ROLLOUT" },
  { href: "/franchise/punch-list", label: "Punch List (QA)", icon: ClipboardCheck, category: "FRANCHISE & ROLLOUT" },
]

const menuItems: MenuItem[] = [
  // ANA MENÜ
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, category: "ANA MENÜ" },
  { href: "/admin/map", label: "Şantiye Haritası", icon: Map, category: "ANA MENÜ" },
  
  // İNSAN KAYNAKLARI
  { href: "/admin/personel", label: "Personeller", icon: Users, category: "İNSAN KAYNAKLARI" },
  { href: "/admin/personnel", label: "Personel Takibi", icon: UserCheck, category: "İNSAN KAYNAKLARI" },
  { href: "/admin/personel/alerts", label: "Süreli Evrak & İSG Alarmı", icon: AlertTriangle, category: "İNSAN KAYNAKLARI" },
  { href: "/admin/attendance", label: "Puantaj & Mesai", icon: Clock, category: "İNSAN KAYNAKLARI" },
  { href: "/admin/payroll", label: "Puantaj & Bordro", icon: Calculator, category: "İNSAN KAYNAKLARI" },
  { href: "/admin/shifts", label: "Vardiya Planlaması", icon: CalendarClock, category: "İNSAN KAYNAKLARI" },
  { href: "/admin/approvals", label: "Onay Bekleyenler", icon: CheckSquare, category: "İNSAN KAYNAKLARI" },
  { href: "/admin/food-menu", label: "Yemek Menüsü", icon: Utensils, category: "İNSAN KAYNAKLARI" },
  
  // TAŞERON YÖNETİMİ
  { href: "/admin/subcontractor-inspections", label: "İş Kanıtı Denetimi", icon: ShieldCheck, category: "TAŞERON YÖNETİMİ" },
  { href: "/admin/audits", label: "Taşeron Denetimleri", icon: ShieldAlert, category: "TAŞERON YÖNETİMİ" },
  { href: "/admin/billing", label: "Hakediş Yönetimi", icon: Wallet, category: "TAŞERON YÖNETİMİ" },
  { href: "/admin/subcontractors/contracts", label: "Taşeron Sözleşmeleri", icon: FileSignature, category: "TAŞERON YÖNETİMİ" },
  { href: "/admin/subcontractors/documents", label: "İSG ve Evrak Takibi", icon: ShieldCheck, category: "TAŞERON YÖNETİMİ" },
  { href: "/admin/subcontractors/deductions", label: "Kesintiler ve Cezalar", icon: TrendingDown, category: "TAŞERON YÖNETİMİ" },
  
  // FİNANS & TEDARİK
  { href: "/admin/finance", label: "Kasa & Finans", icon: DollarSign, category: "FİNANS & TEDARİK" },
  { href: "/admin/finance/expenses", label: "Masraf & Fiş Onayı", icon: Receipt, category: "FİNANS & TEDARİK" },
  { href: "/admin/finance/documents", label: "Çek / Senet & Teminat", icon: Landmark, category: "FİNANS & TEDARİK" },
  { href: "/admin/inventory", label: "Ambar & Karekod", icon: PackageSearch, category: "FİNANS & TEDARİK" },
  { href: "/admin/equipments", label: "Demirbaş", icon: Wrench, category: "FİNANS & TEDARİK" },
  { href: "/admin/contracts", label: "Sözleşmeler", icon: FileSignature, category: "FİNANS & TEDARİK" },
  { href: "/admin/progress-payments", label: "Hakediş ve Metraj", icon: Calculator, category: "FİNANS & TEDARİK" },
  { href: "/admin/procurement", label: "Satınalma & Talepler", icon: ShoppingCart, category: "FİNANS & TEDARİK" },
  { href: "/admin/procurement/logistics", label: "Kapı Güvenlik & Lojistik", icon: Truck, category: "FİNANS & TEDARİK" },
  { href: "/admin/procurement/receiving", label: "Malzeme Kabul & Tesellüm", icon: PackageCheck, category: "FİNANS & TEDARİK" },
  { href: "/admin/logistics/map", label: "Lojistik Canlı Harita", icon: Navigation, category: "FİNANS & TEDARİK" },
  { href: "/admin/inventory/qr-scanner", label: "QR Mikro Tüketim", icon: QrCode, category: "FİNANS & TEDARİK" },
  { href: "/admin/ai-assistant", label: "AI Tahsilat & Risk Asistanı", icon: Bot, category: "FİNANS & TEDARİK" },
  { href: "/admin/collection-risk", label: "Tahsilat Risk AI", icon: PieChart, category: "FİNANS & TEDARİK" },
  
  // PROJE YÖNETİMİ
  { href: "/admin/projects", label: "Projeler", icon: FolderKanban, category: "PROJE YÖNETİMİ" },
  { href: "/admin/progress", label: "İlerleyiş", icon: TrendingUp, category: "PROJE YÖNETİMİ" },
  { href: "/admin/project-control-center", label: "Proje Kontrol Merkezi (Master)", icon: Layers, category: "PROJE YÖNETİMİ" },
  { href: "/admin/crm", label: "CRM / Firmalar", icon: Building2, category: "PROJE YÖNETİMİ" },
  { href: "/admin/bim", label: "BIM & 3D Modeller", icon: Box, category: "PROJE YÖNETİMİ" },
  { href: "/admin/boq", label: "Keşif & Metraj (BoQ)", icon: Calculator, category: "PROJE YÖNETİMİ" },
  
  // YAPI DENETİM & KONTROL
  { href: "/admin/forms", label: "Dinamik Denetim Formları", icon: ClipboardCheck, category: "YAPI DENETİM & KONTROL" },
  { href: "/admin/forms/builder", label: "Dinamik Form Oluşturucu", icon: PencilRuler, category: "YAPI DENETİM & KONTROL" },
  { href: "/admin/inspection/reports/create", label: "Hasar Tespit & Rapor", icon: FileWarning, category: "YAPI DENETİM & KONTROL" },
  { href: "/admin/samples", label: "Numune & Karot Takip", icon: TestTube, category: "YAPI DENETİM & KONTROL" },
  { href: "/admin/inspection/reinforcement", label: "Demir & Kalıp Kontrol", icon: Hammer, category: "YAPI DENETİM & KONTROL" },
  { href: "/admin/inspection/timelapse", label: "Saha Kamerası (Timelapse)", icon: Camera, category: "YAPI DENETİM & KONTROL" },
  { href: "/admin/inspection/attachment", label: "Ataşman & Delil", icon: Paperclip, category: "YAPI DENETİM & KONTROL" },
  { href: "/admin/inspection/documents", label: "Ruhsat & Evrak Arşivi", icon: Archive, category: "YAPI DENETİM & KONTROL" },
  { href: "/admin/documents", label: "Dijital Evrak Arşivi", icon: Files, category: "YAPI DENETİM & KONTROL" },
  { href: "/admin/smart-documents", label: "Akıllı Evrak Denetimi (OCR)", icon: ScanText, category: "YAPI DENETİM & KONTROL" },
  { href: "/admin/reports", label: "Saha Raporları", icon: ClipboardList, category: "YAPI DENETİM & KONTROL" },
  { href: "/admin/ai-vision", label: "AI Görsel Analiz", icon: ImagePlus, category: "YAPI DENETİM & KONTROL" },
  { href: "/admin/revisions", label: "Proje Revizyonları", icon: History, category: "YAPI DENETİM & KONTROL" },
  { href: "/admin/routes", label: "Rota Optimizasyonu", icon: Navigation, category: "YAPI DENETİM & KONTROL" },
  { href: "/admin/drone-maps", label: "Hava & Drone Gözlem", icon: Plane, category: "YAPI DENETİM & KONTROL" },
  { href: "/admin/blueprints", label: "Dijital Projeler / Çizimler", icon: PenTool, category: "YAPI DENETİM & KONTROL" },
  { href: "/admin/blueprints/draw", label: "Serbest Çizim / Plan", icon: PencilRuler, category: "YAPI DENETİM & KONTROL" },
  { href: "/admin/inspections", label: "Denetim Kayıtları", icon: ClipboardCheck, category: "YAPI DENETİM & KONTROL" },
  { href: "/admin/deficiencies", label: "Saha Eksiklikleri", icon: AlertTriangle, category: "YAPI DENETİM & KONTROL" },
  
  // YAPI DENETİM & KALİTE
  { href: "/admin/qa-qc/materials", label: "Malzeme Onayları", icon: CheckSquare, category: "YAPI DENETİM & KALİTE" },
  { href: "/admin/qa-qc/ncr", label: "Uygunsuzluk & DÖF", icon: XCircle, category: "YAPI DENETİM & KALİTE" },
  { href: "/admin/qa-qc/concrete-casting", label: "Beton Döküm Tutanağı (QA)", icon: TestTube2, category: "YAPI DENETİM & KALİTE" },
  
  // İSG & RİSK YÖNETİMİ
  { href: "/admin/isg", label: "İSG Dashboard & Analiz", icon: Activity, category: "İSG & RİSK YÖNETİMİ" },
  { href: "/admin/isg/master-plan", label: "Vaziyet ve Risk Planı", icon: MapPin, category: "İSG & RİSK YÖNETİMİ" },
  { href: "/admin/isg/certificates", label: "Evrak & Sertifikalar", icon: FileBadge, category: "İSG & RİSK YÖNETİMİ" },
  { href: "/admin/isg/near-miss", label: "Ramak Kala Bildirimi", icon: AlertOctagon, category: "İSG & RİSK YÖNETİMİ" },
  { href: "/admin/isg/ppe-forms", label: "KKD Zimmet Formları", icon: UserCheck, category: "İSG & RİSK YÖNETİMİ" },
  
  // SAHA & OPERASYON
  { href: "/admin/tasks", label: "İş Emirleri Merkezi", icon: ClipboardList, category: "SAHA & OPERASYON" },
  { href: "/admin/operations/journal", label: "Şantiye Jurnali (AI)", icon: BookOpen, category: "SAHA & OPERASYON" },
  { href: "/admin/communication/chat", label: "İç Haberleşme", icon: MessageSquare, category: "SAHA & OPERASYON" },
  { href: "/admin/communication/walkie-talkie", label: "Telsiz (PTT) & Şantiye Chat", icon: Radio, category: "SAHA & OPERASYON" },
  { href: "/admin/communication/logistics", label: "Lojistik & Randevu Ağı", icon: Truck, category: "SAHA & OPERASYON" },

  // SİSTEM & AYARLAR
  { href: "/admin/system-health", label: "Sistem Sağlığı & Check-up", icon: Activity, category: "SİSTEM & AYARLAR" },
  { href: "/admin/users", label: "Kullanıcılar", icon: Users, category: "SİSTEM & AYARLAR" },
  { href: "/admin/settings/offline-sync", label: "Cihaz ve Çevrimdışı Senkronizasyon (Offline Sync)", icon: RefreshCw, category: "SİSTEM & AYARLAR" },
  { href: "/admin/logs", label: "Sistem Logları", icon: FileLogIcon, category: "SİSTEM & AYARLAR" },
  { href: "/admin/audit-logs", label: "İşlem Geçmişi", icon: History, category: "SİSTEM & AYARLAR" },
  { href: "/admin/notifications", label: "Bildirimler", icon: Bell, category: "SİSTEM & AYARLAR" },
  { href: "/admin/announcements", label: "Duyuru Yönetimi", icon: Megaphone, category: "SİSTEM & AYARLAR" },
  { href: "/admin/ayarlar", label: "Ayarlar", icon: Settings, category: "SİSTEM & AYARLAR" },
  { href: "/admin/settings/integrations", label: "Bakanlık (YİBF) Entegrasyonu", icon: Bot, category: "SİSTEM & AYARLAR" },
]

export default function AdminSidebar({
  isCollapsed,
  setIsCollapsed,
  companyType: propCompanyType,
  sidebarWidth: propSidebarWidth,
  setSidebarWidth: propSetSidebarWidth,
}: {
  isCollapsed: boolean
  setIsCollapsed: React.Dispatch<React.SetStateAction<boolean>>
  companyType?: string
  sidebarWidth?: number
  setSidebarWidth?: React.Dispatch<React.SetStateAction<number>>
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [internalWidth, setInternalWidth] = useState<number>(260)
  const [isResizing, setIsResizing] = useState(false)

  const currentWidth = propSidebarWidth ?? internalWidth
  const setWidth = propSetSidebarWidth ?? setInternalWidth

  // Sayfa açıldığında localStorage'dan genişliği yükle
  useEffect(() => {
    try {
      const savedWidth = localStorage.getItem("nexa_sidebar_width")
      if (savedWidth) {
        const parsed = parseInt(savedWidth, 10)
        if (!isNaN(parsed) && parsed >= 240 && parsed <= 480) {
          setWidth(parsed)
        }
      }
    } catch {}
  }, [setWidth])

  // Fare sürükleme olayları (Resizer / Drag Handle - 240px min, 480px max)
  useEffect(() => {
    if (!isResizing) return

    const handleMouseMove = (e: MouseEvent) => {
      const newWidth = Math.max(240, Math.min(480, e.clientX))
      setWidth(newWidth)
      try {
        localStorage.setItem("nexa_sidebar_width", String(newWidth))
      } catch {}
    }

    const handleMouseUp = () => {
      setIsResizing(false)
      document.body.style.cursor = ""
      document.body.style.userSelect = ""
    }

    document.body.style.cursor = "col-resize"
    document.body.style.userSelect = "none"

    window.addEventListener("mousemove", handleMouseMove)
    window.addEventListener("mouseup", handleMouseUp)

    return () => {
      window.removeEventListener("mousemove", handleMouseMove)
      window.removeEventListener("mouseup", handleMouseUp)
      document.body.style.cursor = ""
      document.body.style.userSelect = ""
    }
  }, [isResizing, setWidth])

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault()
    setIsResizing(true)
  }

  const [activeProjectId, setActiveProjectId] = useState<string | null>(null)
  const pathname = usePathname()
  const { isInstallable, promptInstall } = usePwaInstall()
  const { data: session } = useSession()
  const t = useTranslations("Sidebar")

  const getLocalizedLabel = (item: MenuItem) => {
    if (item.href === "/admin" || item.label === "Dashboard" || item.label === "Gösterge Paneli") {
      return t("dashboard")
    }
    if (item.href === "/admin/projects" || item.label === "Projeler") {
      return t("projects")
    }
    if (item.href === "/admin/boq" || item.label === "Keşif & Metraj (BoQ)") {
      return t("boq")
    }
    return item.label
  }

  useEffect(() => {
    const match = pathname?.match(/\/admin\/projects\/([^\/]+)/)
    if (match && match[1] && match[1] !== "new") {
      setActiveProjectId(match[1])
      try {
        localStorage.setItem("nexa_active_project_id", match[1])
      } catch {}
    } else {
      try {
        const saved = localStorage.getItem("nexa_active_project_id")
        if (saved) {
          setActiveProjectId(saved)
          return
        }
      } catch {}
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

  const stageGateHref = activeProjectId ? `/franchise/stage-gates/${activeProjectId}` : "/franchise/stage-gates"

  const userRole = (session?.user as any)?.role as string
  const userCompanyType = propCompanyType || (session?.user as any)?.companyType as string | undefined
  const isFranchise = userCompanyType === "FRANCHISE"
  const isSubcontractor = userRole === "SUBCONTRACTOR"
  const isInspector = userRole === "INSPECTOR" || userRole === "AUDITOR"

  const isWhiteLabelActive = Boolean((session?.user as any)?.isWhiteLabelActive)
  const tenantLogoUrl = (session?.user as any)?.logoUrl as string | undefined
  const tenantCompanyName = (session?.user as any)?.companyName || (session?.user as any)?.name

  let rawMenuItems = menuItems
  if (isFranchise) {
    rawMenuItems = franchiseMenuItems
  } else if (isSubcontractor) {
    rawMenuItems = subcontractorMenuItems
  } else if (isInspector) {
    rawMenuItems = inspectorMenuItems
  } else if (userRole === "ACCOUNTANT") {
    rawMenuItems = menuItems.filter(item =>
      item.href === "/admin" ||
      item.href === "/admin/finance" ||
      item.href === "/admin/finance/expenses" ||
      item.href === "/admin/finance/documents" ||
      item.href === "/admin/billing" ||
      item.href === "/admin/progress-payments"
    )
  } else if (userRole === "HR_STAFF") {
    rawMenuItems = menuItems.filter(item =>
      item.href === "/admin" ||
      item.href === "/admin/personel" ||
      item.href === "/admin/attendance" ||
      item.href === "/admin/leave" ||
      item.href === "/admin/personnel-documents" ||
      item.href === "/admin/shifts"
    )
  } else if (userRole === "PURCHASING_STAFF") {
    rawMenuItems = menuItems.filter(item =>
      item.href === "/admin" ||
      item.href === "/admin/procurement" ||
      item.href === "/franchise/procurement/consolidated" ||
      item.href === "/admin/contracts" ||
      item.href === "/admin/inventory" ||
      item.href === "/admin/inventory/qr-scanner" ||
      item.href === "/admin/procurement/logistics"
    )
  } else if (userRole === "HR_MANAGER") {
    rawMenuItems = menuItems.filter(item => 
      item.category === "İNSAN KAYNAKLARI" || 
      (item.category === "ANA MENÜ" && item.href === "/admin")
    )
  } else if (userRole === "FINANCE_MANAGER") {
    rawMenuItems = menuItems.filter(item =>
      item.category === "FİNANS & TEDARİK" ||
      item.href === "/admin/billing" ||
      item.href === "/admin/progress-payments" ||
      (item.category === "ANA MENÜ" && item.href === "/admin")
    )
  } else if (userRole === "PROCUREMENT_MANAGER") {
    rawMenuItems = menuItems.filter(item =>
      item.href === "/admin/procurement" ||
      item.href === "/admin/procurement/logistics" ||
      item.href === "/admin/logistics/map" ||
      item.href === "/admin/inventory/qr-scanner" ||
      item.href === "/admin/inventory" ||
      item.href === "/admin/inventory/qr-scanner" ||
      item.href === "/admin/equipments" ||
      item.href === "/admin/contracts" ||
      (item.category === "ANA MENÜ" && item.href === "/admin")
    )
  } else if (userRole === "EQUIPMENT_MANAGER") {
    rawMenuItems = menuItems.filter(item =>
      item.href === "/admin/equipments" ||
      item.href === "/admin/procurement/logistics" ||
      item.href === "/admin/logistics/map" ||
      item.href === "/admin/inventory/qr-scanner" ||
      item.href === "/admin/inventory" ||
      item.href === "/admin/map" ||
      (item.category === "ANA MENÜ" && item.href === "/admin")
    )
  } else if (userRole === "ISG_EXPERT") {
    rawMenuItems = menuItems.filter(item =>
      item.href === "/admin/personel/alerts" ||
      item.href === "/admin/subcontractors/documents" ||
      item.href === "/admin/audits" ||
      item.href === "/admin/deficiencies" ||
      item.href === "/admin/samples" ||
      item.href === "/admin/map" ||
      (item.category === "ANA MENÜ" && item.href === "/admin")
    )
  } else if (userRole === "SECURITY") {
    rawMenuItems = [
      {
        href: "/admin/procurement/logistics",
        label: "Kapı Güvenlik & Lojistik Takvimi",
        icon: Truck,
        category: "KAPI GÜVENLİK",
      },
    ]
  }

  const sessionEnabledModules = (session?.user as any)?.enabledModules as string[] | undefined

  const moduleFilteredItems = rawMenuItems.filter((item) =>
    isMenuItemAllowed(item, sessionEnabledModules, userRole)
  )

  const effectiveMenuItems = moduleFilteredItems.map((item) => {
    if (item.label === "İdari İzinler" && activeProjectId) {
      return { ...item, href: stageGateHref }
    }
    return item
  })

  // Aktif sayfanın bulunduğu kategoriyi tespit et
  const activeCategory = useMemo(() => {
    const activeItem = effectiveMenuItems.find((item) => {
      if (item.href === "/admin") return pathname === "/admin"
      return pathname === item.href || (pathname && pathname.startsWith(item.href) && item.href !== "/admin")
    })
    return activeItem?.category || "ANA MENÜ"
  }, [pathname, effectiveMenuItems])

  // Akordiyon (Collapsible) state'i: Varsayılan olarak aktif sayfanın kategorisi açık
  const [openCategories, setOpenCategories] = useState<Record<string, boolean>>({
    [activeCategory]: true,
    "ANA MENÜ": true,
  })

  // Sayfa değiştikçe aktif kategoriyi otomatik genişlet
  useEffect(() => {
    if (activeCategory) {
      setOpenCategories((prev) => ({
        ...prev,
        [activeCategory]: true,
      }))
    }
  }, [activeCategory])

  const toggleCategory = (category: string) => {
    setOpenCategories((prev) => ({
      ...prev,
      [category]: !prev[category],
    }))
  }

  // Arama filtresi (Search Bar)
  const filteredMenuItems = useMemo(() => {
    if (!searchQuery.trim()) return effectiveMenuItems
    const query = searchQuery.toLowerCase().trim()
    return effectiveMenuItems.filter((item) => {
      const labelMatch = item.label.toLowerCase().includes(query)
      const localizedMatch = getLocalizedLabel(item).toLowerCase().includes(query)
      const categoryMatch = item.category.toLowerCase().includes(query)
      const hrefMatch = item.href.toLowerCase().includes(query)
      return labelMatch || localizedMatch || categoryMatch || hrefMatch
    })
  }, [effectiveMenuItems, searchQuery])

  // Gruplanmış menü öğeleri
  const groupedItems = useMemo(() => {
    return filteredMenuItems.reduce((acc, item) => {
      const category = item.category
      if (!acc[category]) {
        acc[category] = []
      }
      acc[category].push(item)
      return acc
    }, {} as Record<string, MenuItem[]>)
  }, [filteredMenuItems])

  const categories = Object.keys(groupedItems)

  return (
    <>
      {/* Mobile Header */}
      <div className="fixed left-0 right-0 top-0 z-30 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 pb-safe pt-safe md:hidden">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => setIsOpen(true)}
            className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg p-2 text-slate-900 dark:text-white transition-colors hover:bg-slate-100 dark:hover:bg-slate-800"
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
              <h1 className="font-semibold text-slate-900 dark:text-white">
                {isSubcontractor ? "Taşeron Portalı" : "Nexa ERP"}
              </h1>
            )}
          </div>

          <div className="flex items-center gap-2">
            <ThemeToggle variant="ios" />
            <NotificationBell />
          </div>
        </div>
      </div>

      {/* Mobile Backdrop (Overlay) */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden transition-opacity"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        style={{
          width: isCollapsed ? undefined : `${currentWidth}px`,
        }}
        className={`fixed inset-y-0 left-0 transform transition-transform duration-300 z-50 ${
          isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        } ${isCollapsed ? "md:w-20" : "md:w-64"} w-64 max-w-[85vw] border-r border-slate-200 bg-white dark:border-slate-800 dark:bg-[#111827] flex flex-col`}
      >
        {/* Drag Handle / Resizer */}
        {!isCollapsed && (
          <div
            onMouseDown={handleMouseDown}
            className={`hidden lg:flex absolute -right-1.5 top-0 w-3 h-full cursor-col-resize items-center justify-center z-50 select-none group/resizer hover:bg-blue-500/10 transition-colors ${
              isResizing ? "bg-blue-500/20" : ""
            }`}
            title="Sidebar Genişliğini Ayarla (240px - 480px)"
          >
            <div
              className={`w-1 rounded-full transition-all ${
                isResizing
                  ? "bg-blue-500 h-24"
                  : "bg-slate-300 dark:bg-slate-700 h-8 group-hover/resizer:bg-blue-500 group-hover/resizer:h-14"
              }`}
            />
          </div>
        )}

        <div className={`flex h-full flex-col ${isCollapsed ? "p-3" : "p-4 sm:p-5"}`}>
          {/* Header */}
          <div className="mb-4">
            <div className={`mb-3 flex items-center ${isCollapsed ? "justify-center" : "justify-between"}`}>
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
                        {tenantCompanyName || (isSubcontractor ? "Taşeron Portalı" : "Yönetim Paneli")}
                      </p>
                    </div>
                  ) : (
                    <div>
                      <h1 className="mb-0.5 text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-tenant" />
                        <span>{isSubcontractor ? "Taşeron Portalı" : "Nexa ERP"}</span>
                      </h1>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {isSubcontractor ? "Korumalı Saha Paneli" : "Şantiye & Saha Yönetimi"}
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
                    N
                  </div>
                )
              )}
              <div className="flex items-center gap-2">
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

            {/* ADIM 1: Hızlı Menü Arama (Search Bar) */}
            {!isCollapsed && (
              <div className="relative mt-2">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
                <input
                  type="text"
                  placeholder="Hızlı Menü Arama (Örn: Beton...)"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="min-h-[40px] w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-8 text-xs text-slate-900 transition-all placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-slate-800 dark:bg-slate-950/70 dark:text-white dark:placeholder:text-slate-500 dark:focus:border-blue-500 dark:focus:bg-slate-950"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors"
                    title="Aramayı Temizle"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            )}
          </div>

          {/* ADIM 1: Akordiyon (Collapsible) Navigation Listesi */}
          <nav className="flex-1 space-y-2 overflow-y-auto overflow-x-hidden pr-1.5 scrollbar-thin scrollbar-thumb-slate-700/40">
            {categories.length === 0 && searchQuery.trim() && (
              <div className="p-4 text-center text-xs text-slate-400 space-y-2 mt-4">
                <p>"{searchQuery}" ile eşleşen modül bulunamadı.</p>
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="px-3 py-1 rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white text-[11px] font-semibold transition-all"
                >
                  Aramayı Temizle
                </button>
              </div>
            )}

            {categories.map((category) => {
              const items = groupedItems[category]
              if (!items || items.length === 0) return null

              const isOpenCategory = searchQuery.trim() ? true : Boolean(openCategories[category])
              const CategoryIcon = getCategoryIcon(category)
              const hasActiveChild = items.some(
                (item) => pathname === item.href || (pathname && pathname.startsWith(item.href) && item.href !== "/admin")
              )

              return (
                <div key={category} className="rounded-xl overflow-hidden transition-all">
                  {/* Category Header (Akordiyon Açma/Kapama Butonu) */}
                  {!isCollapsed ? (
                    <button
                      type="button"
                      onClick={() => toggleCategory(category)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all text-left select-none ${
                        hasActiveChild
                          ? "text-blue-600 dark:text-blue-400 bg-blue-500/10 dark:bg-blue-500/15"
                          : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-200"
                      }`}
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        <CategoryIcon className={`h-4 w-4 shrink-0 ${hasActiveChild ? "text-blue-500" : "text-slate-400"}`} />
                        <span className="tracking-wider uppercase text-[11px] font-bold truncate">
                          {category}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0 ml-2">
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-semibold">
                          {items.length}
                        </span>
                        <ChevronDown
                          className={`h-3.5 w-3.5 text-slate-400 transition-transform duration-200 ${
                            isOpenCategory ? "rotate-0" : "-rotate-90"
                          }`}
                        />
                      </div>
                    </button>
                  ) : (
                    <div className="my-2 border-t border-slate-200 dark:border-slate-800" />
                  )}

                  {/* Menu Items (Akordiyon İçeriği) */}
                  {(isOpenCategory || isCollapsed) && (
                    <div className={`space-y-0.5 mt-1 ${!isCollapsed ? "pl-2 border-l border-slate-200 dark:border-slate-800/80 ml-2.5 mb-2" : ""}`}>
                      {items.map((item) => {
                        const isActive = pathname === item.href || (item.label === "Keşif & Metraj (BoQ)" && pathname?.includes("/boq"))
                        const Icon = item.icon
                        const displayLabel = getLocalizedLabel(item)
                        return (
                          <Link
                            key={item.href}
                            href={item.href}
                            onClick={() => setIsOpen(false)}
                            className={`flex min-h-[36px] items-center rounded-lg transition-all ${
                              isActive
                                ? "bg-blue-600 text-white font-semibold shadow-md shadow-blue-600/20 dark:bg-blue-600 dark:text-white"
                                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800/70 dark:hover:text-white"
                            } gap-2.5 px-2.5 py-1.5 text-xs`}
                            title={isCollapsed ? displayLabel : undefined}
                          >
                            <Icon className={`h-4 w-4 shrink-0 ${isActive ? "text-white" : "text-slate-400"}`} />
                            {!isCollapsed && <span className="truncate">{displayLabel}</span>}
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
          <div className="mt-3 border-t border-slate-200 pt-3 pb-safe dark:border-slate-800">
            {/* iOS Tarzı Zarif Tema Switch (Güneş / Ay) */}
            <div className={`mb-3 flex items-center ${isCollapsed ? "justify-center" : "justify-between px-1"} py-1`}>
              {!isCollapsed && (
                <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                  Görünüm
                </span>
              )}
              <ThemeToggle variant="ios" />
            </div>

            {isInstallable && (
              <button
                type="button"
                onClick={() => void promptInstall()}
                className={`mb-2.5 flex min-h-[40px] w-full items-center justify-center gap-2.5 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 px-3 py-2 text-white shadow-lg shadow-blue-600/20 transition-colors hover:from-blue-500 hover:to-indigo-500 text-xs font-bold ${
                  isCollapsed ? "px-2" : "text-left"
                }`}
                title={isCollapsed ? "Uygulamayı Yükle" : undefined}
              >
                <Download className="h-4 w-4 shrink-0" />
                {!isCollapsed && <span>Uygulamayı Yükle</span>}
              </button>
            )}
            <button
              type="button"
              onClick={() => signOut({ callbackUrl: '/login' })}
              className={`flex min-h-[40px] w-full items-center gap-2.5 rounded-lg bg-red-600 px-3 py-2 text-white transition-colors hover:bg-red-500 text-xs font-bold ${
                isCollapsed ? "justify-center" : "text-left"
              }`}
              title={isCollapsed ? "Çıkış Yap" : undefined}
            >
              <LogOut className="h-4 w-4 shrink-0" />
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
