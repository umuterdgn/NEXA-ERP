"use client"
/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * This code is the property of NXA Software.
 */

import { motion } from "framer-motion"
import { useState } from "react"
import Link from "next/link"
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
  Download,
  ArrowRight,
  Star,
  Zap,
  Building,
  ShieldCheck as ShieldCheckIcon,
  Target,
  TrendingUp,
  Smartphone,
  Camera,
  Eye,
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
  XCircle,
  HardHat
} from "lucide-react"

interface ModulePreview {
  title: string
  description: string
  features: string[]
  icon: any
  category: "construction" | "inspection" | "shared"
  stats?: {
    value1: string
    label1: string
    value2: string
    label2: string
    value3: string
    label3: string
  }
  activities?: string[]
  tasks?: Array<{ label: string; count: string; color: string }>
  chartData?: number[]
}

const modulePreviews: Record<string, ModulePreview> = {
  "/admin": {
    title: "Dashboard",
    description: "Tüm projelerinizi tek ekrandan yönetin. KPI'lar, grafikler ve özet istatistiklerle anlık durum takibi.",
    features: ["Gerçek zamanlı KPI göstergeleri", "Proje ilerleme grafikleri", "Personel özet istatistikleri", "Finansal özetler"],
    icon: LayoutDashboard,
    category: "shared",
    stats: {
      value1: "24",
      label1: "Aktif Proje",
      value2: "156",
      label2: "Personel",
      value3: "89%",
      label3: "Verimlilik"
    },
    activities: ["Proje oluşturuldu", "Personel atandı", "Rapor tamamlandı"],
    tasks: [
      { label: "Onay bekleyen", count: "5", color: "text-orange-400" },
      { label: "Süre aşan", count: "2", color: "text-red-400" },
      { label: "Tamamlanan", count: "23", color: "text-green-400" }
    ],
    chartData: [40, 65, 45, 80, 55, 90, 70, 85, 60, 75, 50, 95]
  },
  "/admin/ai-assistant": {
    title: "AI Asistan & AI Görsel Analiz",
    description: "Yapay zeka ile projelerinizi analiz edin. Görsel tespit, risk tahminleme ve otomatik raporlama.",
    features: ["Doğal dil sorguları", "Görsel hasar tespiti", "Risk tahminleme", "Otomatik rapor oluşturma"],
    icon: Bot,
    category: "inspection",
    stats: {
      value1: "1,247",
      label1: "AI Analizi",
      value2: "98.5%",
      label2: "Doğruluk",
      value3: "45",
      label3: "Risk Tespiti"
    },
    activities: ["AI tespit tamamlandı", "Risk analizi yapıldı", "Otomatik rapor"],
    tasks: [
      { label: "Bekleyen analiz", count: "12", color: "text-orange-400" },
      { label: "Yüksek risk", count: "3", color: "text-red-400" },
      { label: "Çözülen", count: "89", color: "text-green-400" }
    ],
    chartData: [60, 75, 85, 90, 80, 95, 88, 92, 78, 85, 90, 95]
  },
  "/admin/drone-maps": {
    title: "Hava & Drone Gözlem",
    description: "Drone ile şantiyeleri havadan izleyin. 360° görüntü, ilerleme takibi ve harita entegrasyonu.",
    features: ["360° havadan görüntü", "İlerleme takibi", "GPS harita entegrasyonu", "Otomatik fotoğraf çekimi"],
    icon: Plane,
    category: "inspection",
    stats: {
      value1: "47",
      label1: "Uçuş",
      value2: "12.5km²",
      label2: "Tarım Alanı",
      value3: "2,340",
      label3: "Fotoğraf"
    },
    activities: ["Drone uçuşu tamamlandı", "Harita güncellendi", "İlerleme raporu"],
    tasks: [
      { label: "Planlanan uçuş", count: "8", color: "text-orange-400" },
      { label: "İptal edilen", count: "1", color: "text-red-400" },
      { label: "Tamamlanan", count: "39", color: "text-green-400" }
    ],
    chartData: [30, 45, 60, 75, 80, 85, 90, 88, 92, 95, 90, 85]
  },
  "/admin/smart-documents": {
    title: "Akıllı Evrak Denetimi (OCR)",
    description: "Kağıt evrakları dijitalleştirin. OCR teknolojisi ile belgeleri otomatik okuyun ve arşivleyin.",
    features: ["OCR ile otomatik metin okuma", "Akıllı belge sınıflandırma", "Arama ve filtreleme", "Bulut depolama entegrasyonu"],
    icon: ScanText,
    category: "shared",
    stats: {
      value1: "3,456",
      label1: "Belge",
      value2: "99.2%",
      label2: "OCR Başarı",
      value3: "892",
      label3: "Arşivlenen"
    },
    activities: ["Belge tarandı", "OCR tamamlandı", "Arşivlendi"],
    tasks: [
      { label: "Bekleyen tarama", count: "45", color: "text-orange-400" },
      { label: "Hatalı OCR", count: "8", color: "text-red-400" },
      { label: "Onaylanan", count: "3,403", color: "text-green-400" }
    ],
    chartData: [50, 60, 70, 80, 85, 90, 88, 92, 94, 96, 98, 99]
  },
  "/admin/isg": {
    title: "İSG Dashboard & Analiz",
    description: "İş sağlığı ve güvenliğini yönetin. Risk analizi, kaza önleme ve KKD takibi.",
    features: ["Risk analizi dashboard", "Kaza önleme önerileri", "KKD zimmet takibi", "Ramak kala bildirimi"],
    icon: MapPin,
    category: "inspection",
    stats: {
      value1: "0",
      label1: "Kaza",
      value2: "23",
      label2: "Ramak Kala",
      value3: "156",
      label3: "KKD Zimmet"
    },
    activities: ["Risk analizi yapıldı", "KKD dağıtıldı", "Eğitim tamamlandı"],
    tasks: [
      { label: "Yüksek risk", count: "5", color: "text-red-400" },
      { label: "Orta risk", count: "12", color: "text-orange-400" },
      { label: "Düşük risk", count: "45", color: "text-green-400" }
    ],
    chartData: [80, 75, 70, 65, 60, 55, 50, 45, 40, 35, 30, 25]
  },
  "/admin/payroll": {
    title: "Puantaj & Bordro",
    description: "Personel puantajını ve bordrosunu yönetin. Otomatik hesaplama, mesai takibi ve maaş ödemeleri.",
    features: ["Otomatik puantaj hesaplama", "Mesai takibi", "Maaş hesaplama", "Bordro raporları"],
    icon: CalendarDays,
    category: "construction",
    stats: {
      value1: "156",
      label1: "Personel",
      value2: "2,450",
      label2: "Saat",
      value3: "₺1.2M",
      label3: "Toplam Ödeme"
    },
    activities: ["Puantaj girildi", "Mesai hesaplandı", "Bordro onaylandı"],
    tasks: [
      { label: "Onay bekleyen", count: "23", color: "text-orange-400" },
      { label: "Eksik puantaj", count: "8", color: "text-red-400" },
      { label: "Ödenen", count: "125", color: "text-green-400" }
    ],
    chartData: [70, 75, 80, 85, 90, 88, 92, 94, 90, 85, 80, 75]
  },
  "/admin/routes": {
    title: "Rota Optimizasyonu",
    description: "Yapı denetim rotalarını AI ile optimize edin. En kısa ve en verimli denetim rotalarını otomatik hesaplayın.",
    features: ["AI tabanlı rota hesaplama", "Yakıt tasarrufu analizi", "Zaman yönetimi optimizasyonu", "GPS takip entegrasyonu"],
    icon: Route,
    category: "inspection",
    stats: {
      value1: "89",
      label1: "Rota",
      value2: "23%",
      label2: "Yakıt Tasarrufu",
      value3: "156h",
      label3: "Zaman Kazancı"
    },
    activities: ["Rota hesaplandı", "Optimizasyon yapıldı", "GPS takip"],
    tasks: [
      { label: "Planlanan rota", count: "12", color: "text-orange-400" },
      { label: "İptal edilen", count: "2", color: "text-red-400" },
      { label: "Tamamlanan", count: "75", color: "text-green-400" }
    ],
    chartData: [50, 55, 60, 65, 70, 75, 80, 85, 90, 88, 92, 95]
  },
  "/admin/isg/near-miss": {
    title: "Ramak Kala Bildirimi",
    description: "İş kazalarını önleyin. Ramak kala olayları anlık bildirin ve analiz edin.",
    features: ["Anlık olay bildirimi", "Fotoğraf ve kanıt ekleme", "AI tabanlı risk analizi", "Önleyici eylem önerileri"],
    icon: AlertTriangle,
    category: "shared"
  },
  "/admin/billing": {
    title: "Hakediş Yönetimi",
    description: "Taşeron ödemelerini ve hakedişleri otomatik hesaplayın. Kesintileri ve cezaları yönetin.",
    features: ["Otomatik hakediş hesaplama", "Kesinti ve ceza yönetimi", "Onay akışları", "Finansal raporlama"],
    icon: Wallet,
    category: "construction"
  },
  "/admin/inspection": {
    title: "Numune & Karot Takip",
    description: "Beton numunelerini ve karot örneklerini takip edin. Laboratuvar sonuçlarını yönetin.",
    features: ["Numune takip sistemi", "Laboratuvar entegrasyonu", "Sonuç analizi", "Kalite kontrol raporları"],
    icon: TestTube,
    category: "inspection"
  },
  "/admin/inspection/reinforcement": {
    title: "Demir & Kalıp Kontrol",
    description: "Donatı ve kalıp kontrollerini dijitalleştirin. Fotoğraflı kanıt zinciri oluşturun.",
    features: ["Mobil kontrol uygulaması", "Fotoğraflı kanıt zinciri", "GPS konum doğrulama", "Otomatik raporlama"],
    icon: Hammer,
    category: "inspection"
  },
  "/admin/personnel": {
    title: "Personel Takibi",
    description: "Tüm personelinizi tek yerden yönetin. Puantaj, maaş ve performans takibi.",
    features: ["Personel kartları", "Puantaj sistemi", "Maaş hesaplama", "Performans analizi"],
    icon: Users,
    category: "construction"
  },
  "/admin/finance": {
    title: "Kasa & Finans",
    description: "Şirket finansını yönetin. Gelir-gider takibi, bütçe planlama ve raporlama.",
    features: ["Gelir-gider takibi", "Bütçe yönetimi", "Finansal raporlar", "Tahsilat takibi"],
    icon: DollarSign,
    category: "construction"
  },
  "/admin/inventory": {
    title: "Ambar & Karekod",
    description: "Stok yönetimini dijitalleştirin. Karekod sistemi ile malzeme takibi.",
    features: ["Karekod sistemi", "Stok takibi", "Malzeme talepleri", "Otomatik bildirimler"],
    icon: PackageSearch,
    category: "construction"
  },
  "/admin/projects": {
    title: "Projeler",
    description: "Tüm projelerinizi yönetin. Proje detayları, ekip atamaları ve ilerleme takibi.",
    features: ["Proje yönetimi", "Ekip atamaları", "İlerleme takibi", "Doküman yönetimi"],
    icon: FolderKanban,
    category: "shared"
  }
}

const navItems = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, category: "ANA MENÜ" },
  { href: "/admin/map", label: "Şantiye Haritası", icon: Map, category: "ANA MENÜ" },
  { href: "/admin/personnel", label: "Personel Takibi", icon: Users, category: "İNSAN KAYNAKLARI" },
  { href: "/admin/payroll", label: "Puantaj & Bordro", icon: CalendarDays, category: "İNSAN KAYNAKLARI" },
  { href: "/admin/shifts", label: "Vardiya Planlaması", icon: Clock, category: "İNSAN KAYNAKLARI" },
  { href: "/admin/audits", label: "Taşeron Denetimleri", icon: ShieldAlert, category: "TAŞERON YÖNETİMİ" },
  { href: "/admin/billing", label: "Hakediş Yönetimi", icon: Wallet, category: "TAŞERON YÖNETİMİ" },
  { href: "/admin/subcontractors/contracts", label: "Taşeron Sözleşmeleri", icon: FileSignature, category: "TAŞERON YÖNETİMİ" },
  { href: "/admin/subcontractors/documents", label: "İSG ve Evrak Takibi", icon: ShieldCheck, category: "TAŞERON YÖNETİMİ" },
  { href: "/admin/subcontractors/deductions", label: "Kesintiler ve Cezalar", icon: TrendingDown, category: "TAŞERON YÖNETİMİ" },
  { href: "/admin/finance", label: "Kasa & Finans", icon: DollarSign, category: "FİNANS & TEDARİK" },
  { href: "/admin/inventory", label: "Ambar & Karekod", icon: PackageSearch, category: "FİNANS & TEDARİK" },
  { href: "/admin/equipments", label: "Demirbaş", icon: Wrench, category: "FİNANS & TEDARİK" },
  { href: "/admin/contracts", label: "Sözleşmeler", icon: FileSignature, category: "FİNANS & TEDARİK" },
  { href: "/admin/progress-payments", label: "Hakediş ve Metraj", icon: Calculator, category: "FİNANS & TEDARİK" },
  { href: "/admin/procurement", label: "Satınalma & Talepler", icon: ShoppingCart, category: "FİNANS & TEDARİK" },
  { href: "/admin/collection-risk", label: "Tahsilat Risk AI", icon: PieChart, category: "FİNANS & TEDARİK" },
  { href: "/admin/projects", label: "Projeler", icon: FolderKanban, category: "PROJE YÖNETİMİ" },
  { href: "/admin/crm", label: "CRM / Firmalar", icon: Building2, category: "PROJE YÖNETİMİ" },
  { href: "/admin/bim", label: "BIM & 3D Modeller", icon: Box, category: "PROJE YÖNETİMİ" },
  { href: "/admin/inspection/reports/create", label: "Hasar Tespit & Rapor", icon: FileSearch, category: "YAPI DENETİM & KONTROL" },
  { href: "/admin/inspection", label: "Numune & Karot Takip", icon: TestTube, category: "YAPI DENETİM & KONTROL" },
  { href: "/admin/inspection/reinforcement", label: "Demir & Kalıp Kontrol", icon: Hammer, category: "YAPI DENETİM & KONTROL" },
  { href: "/admin/inspection/attachment", label: "Ataşman & Delil", icon: FileCheck, category: "YAPI DENETİM & KONTROL" },
  { href: "/admin/inspection/documents", label: "Ruhsat & Evrak Arşivi", icon: Archive, category: "YAPI DENETİM & KONTROL" },
  { href: "/admin/documents", label: "Dijital Evrak Arşivi", icon: FileText, category: "YAPI DENETİM & KONTROL" },
  { href: "/admin/smart-documents", label: "Akıllı Evrak Denetimi (OCR)", icon: ScanText, category: "YAPI DENETİM & KONTROL" },
  { href: "/admin/reports", label: "Saha Raporları", icon: ClipboardList, category: "YAPI DENETİM & KONTROL" },
  { href: "/admin/ai-assistant", label: "AI Asistan", icon: Bot, category: "YAPI DENETİM & KONTROL" },
  { href: "/admin/ai-vision", label: "AI Görsel Analiz", icon: Scan, category: "YAPI DENETİM & KONTROL" },
  { href: "/admin/revisions", label: "Proje Revizyonları", icon: GitCompare, category: "YAPI DENETİM & KONTROL" },
  { href: "/admin/routes", label: "Rota Optimizasyonu", icon: Route, category: "YAPI DENETİM & KONTROL" },
  { href: "/admin/drone-maps", label: "Hava & Drone Gözlem", icon: Plane, category: "YAPI DENETİM & KONTROL" },
  { href: "/admin/blueprints", label: "Dijital Projeler / Çizimler", icon: FileText, category: "YAPI DENETİM & KONTROL" },
  { href: "/admin/blueprints/draw", label: "Serbest Çizim / Plan", icon: Pen, category: "YAPI DENETİM & KONTROL" },
  { href: "/admin/qa-qc/materials", label: "Malzeme Onayları", icon: CheckCircle, category: "YAPI DENETİM & KALİTE" },
  { href: "/admin/qa-qc/ncr", label: "Uygunsuzluk & DÖF", icon: AlertOctagon, category: "YAPI DENETİM & KALİTE" },
  { href: "/admin/inspections", label: "Denetim Kayıtları", icon: ClipboardCheck, category: "YAPI DENETİM & KONTROL" },
  { href: "/admin/deficiencies", label: "Saha Eksiklikleri", icon: AlertTriangle, category: "YAPI DENETİM & KONTROL" },
  { href: "/admin/isg", label: "İSG Dashboard & Analiz", icon: MapPin, category: "İSG & Risk Yönetimi" },
  { href: "/admin/isg/master-plan", label: "Vaziyet ve Risk Planı", icon: Map, category: "İSG & Risk Yönetimi" },
  { href: "/admin/isg/certificates", label: "Evrak & Sertifikalar", icon: FileText, category: "İSG & Risk Yönetimi" },
  { href: "/admin/isg/near-miss", label: "Ramak Kala Bildirimi", icon: AlertTriangle, category: "İSG & Risk Yönetimi" },
  { href: "/admin/isg/ppe-forms", label: "KKD Zimmet Formları", icon: Shield, category: "İSG & Risk Yönetimi" },
  { href: "/admin/cms", label: "İçerik Yönetimi", icon: FileText, category: "İLETİŞİM & OPERASYON" },
  { href: "/admin/tasks", label: "Görevler & Takvim", icon: Calendar, category: "İLETİŞİM & OPERASYON" },
  { href: "/admin/work-orders", label: "İş Emirleri (Kanban)", icon: ClipboardList, category: "İLETİŞİM & OPERASYON" },
  { href: "/admin/communication/chat", label: "İç Haberleşme", icon: MessageSquare, category: "İLETİŞİM & OPERASYON" },
  { href: "/admin/communication/logistics", label: "Lojistik & Randevu Ağı", icon: Truck, category: "İLETİŞİM & OPERASYON" },
  { href: "/admin/users", label: "Kullanıcılar", icon: Users, category: "İLETİŞİM & SİSTEM" },
  { href: "/admin/logs", label: "Sistem Logları", icon: FileLogIcon, category: "İLETİŞİM & SİSTEM" },
  { href: "/admin/audit-logs", label: "İşlem Geçmişi", icon: History, category: "İLETİŞİM & SİSTEM" },
  { href: "/admin/notifications", label: "Bildirimler", icon: Bell, category: "İLETİŞİM & SİSTEM" },
  { href: "/admin/announcements", label: "Duyuru Yönetimi", icon: Megaphone, category: "İLETİŞİM & SİSTEM" },
  { href: "/admin/ayarlar", label: "Ayarlar", icon: Settings, category: "İLETİŞİM & SİSTEM" }
]

export default function LandingPageClient() {
  const [selectedModule, setSelectedModule] = useState<string>("/admin")
  const [selectedCategory, setSelectedCategory] = useState<"all" | "construction" | "inspection">("all")
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)

  const currentPreview = modulePreviews[selectedModule] || modulePreviews["/admin"]

  // Render dynamic mockup content based on selected module
  const renderMockupContent = (module: string) => {
    switch (module) {
      // Dashboard/Statistics Template
      case "/admin":
      case "/admin/finance":
      case "/admin/isg":
      case "/admin/collection-risk":
      case "/admin/isg/dashboard":
        return (
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-blue-600/20 rounded-lg p-3 border border-blue-500/30">
                <div className="text-2xl font-bold text-blue-400 mb-1">24</div>
                <div className="text-xs text-slate-400">Aktif Proje</div>
              </div>
              <div className="bg-purple-600/20 rounded-lg p-3 border border-purple-500/30">
                <div className="text-2xl font-bold text-purple-400 mb-1">156</div>
                <div className="text-xs text-slate-400">Personel</div>
              </div>
              <div className="bg-green-600/20 rounded-lg p-3 border border-green-500/30">
                <div className="text-2xl font-bold text-green-400 mb-1">89%</div>
                <div className="text-xs text-slate-400">Verimlilik</div>
              </div>
            </div>
            <div className="bg-slate-800 rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-slate-400">İlerleme Grafiği</span>
                <span className="text-xs text-green-400">+12%</span>
              </div>
              <div className="flex gap-1 h-8">
                {[40, 65, 45, 80, 55, 90, 70, 85, 60, 75, 50, 95].map((height, i) => (
                  <motion.div
                    key={i}
                    initial={{ height: 0 }}
                    animate={{ height: `${height}%` }}
                    transition={{ duration: 0.5, delay: i * 0.05 }}
                    className="flex-1 bg-gradient-to-t from-blue-600 to-cyan-400 rounded-sm"
                    style={{ height: `${height}%` }}
                  />
                ))}
              </div>
            </div>
          </div>
        )

      // Map/Location Template
      case "/admin/map":
      case "/admin/routes":
      case "/admin/isg/master-plan":
      case "/admin/drone-maps":
        return (
          <div className="relative h-64 bg-slate-800 rounded-lg overflow-hidden">
            <div className="absolute inset-0 opacity-20" style={{
              backgroundImage: `
                linear-gradient(rgba(59, 130, 246, 0.1) 1px, transparent 1px),
                linear-gradient(90deg, rgba(59, 130, 246, 0.1) 1px, transparent 1px)
              `,
              backgroundSize: '20px 20px'
            }} />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="relative">
                <motion.div
                  animate={{ scale: [1, 1.5, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="absolute inset-0 bg-blue-500/30 rounded-full"
                />
                <MapPin className="w-8 h-8 text-blue-400 relative z-10" />
              </div>
              <div className="absolute top-8 left-12">
                <motion.div
                  animate={{ scale: [1, 1.3, 1] }}
                  transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
                  className="relative"
                >
                  <div className="absolute inset-0 bg-green-500/30 rounded-full" />
                  <MapPin className="w-6 h-6 text-green-400" />
                </motion.div>
              </div>
              <div className="absolute bottom-12 right-16">
                <motion.div
                  animate={{ scale: [1, 1.3, 1] }}
                  transition={{ duration: 2, repeat: Infinity, delay: 1 }}
                  className="relative"
                >
                  <div className="absolute inset-0 bg-red-500/30 rounded-full" />
                  <MapPin className="w-6 h-6 text-red-400" />
                </motion.div>
              </div>
            </div>
            <div className="absolute bottom-2 left-2 right-2 bg-slate-900/80 rounded-lg p-2">
              <div className="flex items-center gap-2 text-xs text-slate-300">
                <div className="w-2 h-2 bg-green-500 rounded-full" />
                <span>3 Aktif Lokasyon</span>
              </div>
            </div>
          </div>
        )

      // AI/Visual Analysis Template
      case "/admin/ai-assistant":
      case "/admin/ai-vision":
      case "/admin/smart-documents":
        return (
          <div className="space-y-3">
            <div className="relative h-48 bg-slate-800 rounded-lg overflow-hidden border-2 border-dashed border-slate-600">
              <div className="absolute inset-4 bg-slate-700/50 rounded" />
              <div className="absolute top-8 left-8 right-8 h-16 border-2 border-red-500/50 rounded bg-red-500/10">
                <div className="absolute -top-6 left-0 bg-red-500 text-white text-xs px-2 py-1 rounded">
                  Çatlak %87
                </div>
              </div>
              <div className="absolute bottom-8 left-12 right-12 h-12 border-2 border-yellow-500/50 rounded bg-yellow-500/10">
                <div className="absolute -top-6 left-0 bg-yellow-500 text-black text-xs px-2 py-1 rounded">
                  Risk %45
                </div>
              </div>
              <div className="absolute inset-0 flex items-center justify-center">
                <motion.div
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="text-center"
                >
                  <Scan className="w-12 h-12 text-blue-400 mx-auto mb-2" />
                  <div className="text-xs text-slate-400">Analiz Ediliyor...</div>
                </motion.div>
              </div>
            </div>
            <div className="bg-slate-800 rounded-lg p-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">AI Güven Skoru</span>
                <span className="text-green-400 font-semibold">94.5%</span>
              </div>
              <div className="mt-2 h-2 bg-slate-700 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: '94.5%' }}
                  transition={{ duration: 1 }}
                  className="h-full bg-gradient-to-r from-green-500 to-emerald-400"
                />
              </div>
            </div>
          </div>
        )

      // Kanban Template
      case "/admin/work-orders":
      case "/admin/tasks":
      case "/admin/projects":
      case "/admin/shifts":
        return (
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-slate-800 rounded-lg p-2">
              <div className="text-xs font-semibold text-slate-300 mb-2">Yapılacak</div>
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="bg-slate-700 rounded p-2 text-xs text-slate-300">
                    <div className="font-medium mb-1">Görev {i}</div>
                    <div className="text-slate-400">Yüksek öncelik</div>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-slate-800 rounded-lg p-2">
              <div className="text-xs font-semibold text-blue-400 mb-2">Devam Eden</div>
              <div className="space-y-2">
                {[1, 2].map((i) => (
                  <div key={i} className="bg-blue-600/20 rounded p-2 text-xs text-slate-300 border border-blue-500/30">
                    <div className="font-medium mb-1">Görev {i + 3}</div>
                    <div className="text-slate-400">İşleniyor</div>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-slate-800 rounded-lg p-2">
              <div className="text-xs font-semibold text-green-400 mb-2">Biten</div>
              <div className="space-y-2">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="bg-green-600/20 rounded p-2 text-xs text-slate-300 border border-green-500/30">
                    <div className="font-medium mb-1">Görev {i + 5}</div>
                    <div className="text-slate-400">Tamamlandı</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )

      // Modern Data Table Template
      case "/admin/personnel":
      case "/admin/personnel/tracking":
      case "/admin/billing":
      case "/admin/inventory":
      case "/admin/equipments":
      case "/admin/audits":
      case "/admin/subcontractors/contracts":
      case "/admin/subcontractors/deductions":
      case "/admin/contracts":
      case "/admin/progress-payments":
      case "/admin/procurement":
      case "/admin/crm":
      case "/admin/inspection":
      case "/admin/inspection/reinforcement":
      case "/admin/inspection/attachment":
      case "/admin/inspection/documents":
      case "/admin/documents":
      case "/admin/reports":
      case "/admin/inspections":
      case "/admin/deficiencies":
      case "/admin/isg/certificates":
      case "/admin/isg/ppe-forms":
      case "/admin/users":
        return (
          <div className="bg-slate-800 rounded-lg overflow-hidden">
            <div className="grid grid-cols-4 gap-2 p-2 bg-slate-700 text-xs font-semibold text-slate-300">
              <div>İsim</div>
              <div>Durum</div>
              <div>Tarih</div>
              <div>Tutar</div>
            </div>
            <div className="divide-y divide-slate-700">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="grid grid-cols-4 gap-2 p-2 text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-blue-600/20 rounded-full flex items-center justify-center">
                      <Users className="w-3 h-3 text-blue-400" />
                    </div>
                    <span className="text-slate-300">Öğe {i}</span>
                  </div>
                  <div>
                    <span className={`px-2 py-0.5 rounded-full text-xs ${i % 2 === 0 ? 'bg-green-600/20 text-green-400' : 'bg-yellow-600/20 text-yellow-400'}`}>
                      {i % 2 === 0 ? 'Aktif' : 'Beklemede'}
                    </span>
                  </div>
                  <div className="text-slate-400">2024-01-{10 + i}</div>
                  <div className="text-slate-300">₺{(i * 1250).toLocaleString()}</div>
                </div>
              ))}
            </div>
          </div>
        )

      // Chat/Log Template
      case "/admin/communication/chat":
      case "/admin/logs":
      case "/admin/audit-logs":
      case "/admin/notifications":
      case "/admin/announcements":
      case "/admin/cms":
        return (
          <div className="bg-slate-800 rounded-lg p-3 h-64 overflow-y-auto">
            <div className="space-y-3">
              <div className="flex gap-2">
                <div className="w-8 h-8 bg-blue-600/20 rounded-full flex items-center justify-center shrink-0">
                  <Users className="w-4 h-4 text-blue-400" />
                </div>
                <div className="bg-slate-700 rounded-lg p-2 text-xs text-slate-300 max-w-[80%]">
                  <div className="font-semibold mb-1">Ahmet Yılmaz</div>
                  <div>Proje durumu hakkında bilgi alabilir miyim?</div>
                  <div className="text-slate-500 text-[10px] mt-1">10:30</div>
                </div>
              </div>
              <div className="flex gap-2 justify-end">
                <div className="bg-blue-600/20 rounded-lg p-2 text-xs text-slate-300 max-w-[80%]">
                  <div>Proje %65 tamamlandı. Detayları dashboard'da görebilirsiniz.</div>
                  <div className="text-slate-500 text-[10px] mt-1">10:32</div>
                </div>
              </div>
              <div className="flex gap-2">
                <div className="w-8 h-8 bg-purple-600/20 rounded-full flex items-center justify-center shrink-0">
                  <Bot className="w-4 h-4 text-purple-400" />
                </div>
                <div className="bg-slate-700 rounded-lg p-2 text-xs text-slate-300 max-w-[80%]">
                  <div className="font-semibold mb-1">AI Asistan</div>
                  <div>Risk analizi tamamlandı. 2 kritik uyarı tespit edildi.</div>
                  <div className="text-slate-500 text-[10px] mt-1">10:35</div>
                </div>
              </div>
              <div className="flex gap-2">
                <div className="w-8 h-8 bg-green-600/20 rounded-full flex items-center justify-center shrink-0">
                  <FileLogIcon className="w-4 h-4 text-green-400" />
                </div>
                <div className="bg-slate-700 rounded-lg p-2 text-xs text-slate-300 max-w-[80%]">
                  <div className="font-semibold mb-1">Sistem Log</div>
                  <div className="text-slate-400">[INFO] Kullanıcı girişi başarılı</div>
                  <div className="text-slate-500 text-[10px] mt-1">10:40</div>
                </div>
              </div>
            </div>
          </div>
        )

      // Specialized Templates
      case "/admin/inspection/reports/create":
        return (
          <div className="space-y-3">
            <div className="bg-slate-800 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-2">
                <FileWarning className="w-5 h-5 text-red-400" />
                <span className="text-sm font-semibold text-white">Hasar Tespiti</span>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Kritik Hasar</span>
                  <span className="text-red-400">3</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Orta Risk</span>
                  <span className="text-yellow-400">7</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Düşük Risk</span>
                  <span className="text-green-400">12</span>
                </div>
              </div>
            </div>
            <div className="bg-slate-800 rounded-lg p-3">
              <div className="text-xs text-slate-400 mb-2">Son Raporlar</div>
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-2 text-xs text-slate-300">
                    <FileText className="w-4 h-4 text-blue-400" />
                    <span>Rapor-{i}.pdf</span>
                    <span className="text-slate-500 ml-auto">2d önce</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )

      case "/admin/blueprints":
      case "/admin/blueprints/draw":
        return (
          <div className="relative h-64 bg-slate-800 rounded-lg overflow-hidden">
            <div className="absolute inset-0 opacity-10" style={{
              backgroundImage: `
                linear-gradient(rgba(59, 130, 246, 0.3) 1px, transparent 1px),
                linear-gradient(90deg, rgba(59, 130, 246, 0.3) 1px, transparent 1px)
              `,
              backgroundSize: '10px 10px'
            }} />
            <div className="absolute inset-4 border-2 border-blue-500/30 rounded">
              <div className="absolute top-1/4 left-1/4 w-1/2 h-1/2 border-2 border-blue-400/50 rounded" />
              <div className="absolute top-1/3 left-1/3 w-1/3 h-1/3 border-2 border-purple-400/50 rounded" />
            </div>
            <div className="absolute bottom-2 left-2 bg-slate-900/80 rounded-lg p-2">
              <div className="flex items-center gap-2 text-xs text-slate-300">
                <PenTool className="w-4 h-4 text-blue-400" />
                <span>Çizim Modu</span>
              </div>
            </div>
          </div>
        )

      case "/admin/bim":
        return (
          <div className="space-y-3">
            <div className="relative h-48 bg-slate-800 rounded-lg overflow-hidden">
              <div className="absolute inset-0 flex items-center justify-center">
                <Box className="w-16 h-16 text-blue-400 opacity-50" />
              </div>
              <div className="absolute top-2 right-2 bg-slate-900/80 rounded-lg p-2">
                <div className="text-xs text-slate-300">3D Görünüm</div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-slate-800 rounded-lg p-2 text-center">
                <div className="text-lg font-bold text-blue-400">12</div>
                <div className="text-xs text-slate-400">Model</div>
              </div>
              <div className="bg-slate-800 rounded-lg p-2 text-center">
                <div className="text-lg font-bold text-purple-400">45</div>
                <div className="text-xs text-slate-400">Katman</div>
              </div>
            </div>
          </div>
        )

      case "/admin/revisions":
        return (
          <div className="space-y-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-slate-800 rounded-lg p-2 flex items-center gap-2">
                <GitCompare className="w-4 h-4 text-purple-400" />
                <div className="flex-1">
                  <div className="text-xs text-slate-300">Revizyon v{i}.0</div>
                  <div className="text-[10px] text-slate-500">{i} gün önce</div>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded ${i % 2 === 0 ? 'bg-green-600/20 text-green-400' : 'bg-blue-600/20 text-blue-400'}`}>
                  {i % 2 === 0 ? 'Onaylandı' : 'Beklemede'}
                </span>
              </div>
            ))}
          </div>
        )

      case "/admin/qa-qc/materials":
        return (
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-green-600/20 rounded-lg p-2 text-center border border-green-500/30">
                <div className="text-xl font-bold text-green-400">45</div>
                <div className="text-xs text-slate-400">Onaylı</div>
              </div>
              <div className="bg-yellow-600/20 rounded-lg p-2 text-center border border-yellow-500/30">
                <div className="text-xl font-bold text-yellow-400">12</div>
                <div className="text-xs text-slate-400">Beklemede</div>
              </div>
              <div className="bg-red-600/20 rounded-lg p-2 text-center border border-red-500/30">
                <div className="text-xl font-bold text-red-400">3</div>
                <div className="text-xs text-slate-400">Reddedildi</div>
              </div>
            </div>
            <div className="bg-slate-800 rounded-lg p-2">
              <div className="text-xs text-slate-400 mb-2">Son Malzeme Onayları</div>
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center justify-between text-xs">
                    <span className="text-slate-300">Malzeme {i}</span>
                    <span className={`px-2 py-0.5 rounded ${i === 1 ? 'bg-green-600/20 text-green-400' : 'bg-yellow-600/20 text-yellow-400'}`}>
                      {i === 1 ? 'Onaylandı' : 'İnceleniyor'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )

      case "/admin/qa-qc/ncr":
        return (
          <div className="space-y-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-slate-800 rounded-lg p-2 border-l-4 border-red-500">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold text-white">DÖF-{i}</span>
                  <span className="text-[10px] text-slate-400">{i}d önce</span>
                </div>
                <div className="text-xs text-slate-300">Uygunsuzluk tespit edildi</div>
              </div>
            ))}
          </div>
        )

      case "/admin/isg/near-miss":
        return (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-slate-800 rounded-lg p-2 border-l-4 border-orange-500">
                <div className="flex items-center gap-2 mb-1">
                  <AlertTriangle className="w-4 h-4 text-orange-400" />
                  <span className="text-xs font-semibold text-white">Ramak Kala #{i}</span>
                </div>
                <div className="text-xs text-slate-300">Potansiyel kaza riski</div>
              </div>
            ))}
          </div>
        )

      case "/admin/subcontractors/documents":
        return (
          <div className="space-y-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-slate-800 rounded-lg p-2 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-green-400" />
                <div className="flex-1">
                  <div className="text-xs text-slate-300">İSG Belgesi {i}</div>
                  <div className="text-[10px] text-slate-500">Geçerli: 2025-12-31</div>
                </div>
                <span className="text-xs text-green-400">✓</span>
              </div>
            ))}
          </div>
        )

      case "/admin/communication/logistics":
        return (
          <div className="space-y-3">
            <div className="bg-slate-800 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-2">
                <Truck className="w-5 h-5 text-blue-400" />
                <span className="text-sm font-semibold text-white">Lojistik Takibi</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="text-center">
                  <div className="text-lg font-bold text-blue-400">8</div>
                  <div className="text-xs text-slate-400">Aktif Araç</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-green-400">23</div>
                  <div className="text-xs text-slate-400">Teslimat</div>
                </div>
              </div>
            </div>
            <div className="bg-slate-800 rounded-lg p-2">
              <div className="text-xs text-slate-400 mb-2">Yaklaşan Teslimatlar</div>
              <div className="space-y-2">
                {[1, 2].map((i) => (
                  <div key={i} className="flex items-center gap-2 text-xs text-slate-300">
                    <PackageSearch className="w-4 h-4 text-purple-400" />
                    <span>Teslimat {i}</span>
                    <span className="text-slate-500 ml-auto">14:00</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )

      case "/admin/ayarlar":
        return (
          <div className="space-y-3">
            <div className="bg-slate-800 rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-slate-300">Bildirimler</span>
                <div className="w-8 h-4 bg-blue-600 rounded-full relative">
                  <div className="absolute right-0.5 top-0.5 w-3 h-3 bg-white rounded-full" />
                </div>
              </div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-slate-300">Otomatik Yedekleme</span>
                <div className="w-8 h-4 bg-blue-600 rounded-full relative">
                  <div className="absolute right-0.5 top-0.5 w-3 h-3 bg-white rounded-full" />
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-300">Karanlık Mod</span>
                <div className="w-8 h-4 bg-slate-600 rounded-full relative">
                  <div className="absolute left-0.5 top-0.5 w-3 h-3 bg-white rounded-full" />
                </div>
              </div>
            </div>
            <div className="bg-slate-800 rounded-lg p-3">
              <div className="text-xs text-slate-400 mb-2">Sistem Bilgisi</div>
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-300">Versiyon</span>
                  <span className="text-slate-400">2.4.1</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-300">Son Güncelleme</span>
                  <span className="text-slate-400">2024-01-15</span>
                </div>
              </div>
            </div>
          </div>
        )

      // Default fallback for any other modules
      default:
        return (
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-blue-600/20 rounded-lg p-3 border border-blue-500/30">
                <div className="text-2xl font-bold text-blue-400 mb-1">24</div>
                <div className="text-xs text-slate-400">Toplam</div>
              </div>
              <div className="bg-purple-600/20 rounded-lg p-3 border border-purple-500/30">
                <div className="text-2xl font-bold text-purple-400 mb-1">156</div>
                <div className="text-xs text-slate-400">Aktif</div>
              </div>
              <div className="bg-green-600/20 rounded-lg p-3 border border-green-500/30">
                <div className="text-2xl font-bold text-green-400 mb-1">89%</div>
                <div className="text-xs text-slate-400">Başarı</div>
              </div>
            </div>
            <div className="bg-slate-800 rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-slate-400">İstatistikler</span>
                <span className="text-xs text-green-400">+8%</span>
              </div>
              <div className="flex gap-1 h-8">
                {[40, 65, 45, 80, 55, 90, 70, 85, 60, 75, 50, 95].map((height, i) => (
                  <motion.div
                    key={i}
                    initial={{ height: 0 }}
                    animate={{ height: `${height}%` }}
                    transition={{ duration: 0.5, delay: i * 0.05 }}
                    className="flex-1 bg-gradient-to-t from-blue-600 to-cyan-400 rounded-sm"
                    style={{ height: `${height}%` }}
                  />
                ))}
              </div>
            </div>
          </div>
        )
    }
  }

  const filteredNavItems = navItems.filter(item => {
    if (selectedCategory === "all") return true
    const moduleInfo = modulePreviews[item.href]
    if (!moduleInfo) return true
    if (selectedCategory === "construction") return moduleInfo.category === "construction" || moduleInfo.category === "shared"
    if (selectedCategory === "inspection") return moduleInfo.category === "inspection" || moduleInfo.category === "shared"
    return true
  })

  const groupedNavItems = filteredNavItems.reduce((acc, item) => {
    const category = item.category || "DİĞER"
    if (!acc[category]) {
      acc[category] = []
    }
    acc[category].push(item)
    return acc
  }, {} as Record<string, typeof filteredNavItems>)

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Hero Section */}
      <section className="relative overflow-hidden border-b border-slate-800">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 via-purple-600/10 to-cyan-600/10" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/30 rounded-full px-4 py-2 mb-8"
            >
              <Zap className="w-4 h-4 text-blue-400" />
              <span className="text-blue-300 text-sm font-medium">Yapay Zeka Destekli Şantiye Yönetimi</span>
            </motion.div>
            
            <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-cyan-400 to-purple-400">
                Şantiyenizi Geleceğe Taşıyın
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-slate-300 mb-4 max-w-3xl mx-auto">
              İnşaat ve Yapı Denetim firmaları için tüm operasyonlarınızı tek platformda yönetin
            </p>
            <p className="text-lg text-slate-400 mb-8 max-w-2xl mx-auto">
              Müteahhitler için personel, finans ve taşeron yönetimi. Yapı denetim firmaları için YİBF, numune ve denetim kayıtları.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
              <Link
                href="/login"
                className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-cyan-600 text-white px-8 py-4 rounded-lg font-semibold hover:from-blue-500 hover:to-cyan-500 transition-all duration-300 shadow-lg hover:shadow-blue-500/25"
              >
                Ücretsiz Demo Başlat
                <ArrowRight className="w-5 h-5" />
              </Link>
              <div className="flex items-center gap-6 text-slate-400 text-sm">
                <div className="flex items-center gap-2">
                  <Star className="w-5 h-5 text-yellow-400" />
                  <span>20+ Modül</span>
                </div>
                <div className="flex items-center gap-2">
                  <Bot className="w-5 h-5 text-purple-400" />
                  <span>AI Destekli</span>
                </div>
                <div className="flex items-center gap-2">
                  <Smartphone className="w-5 h-5 text-green-400" />
                  <span>Mobil Uyumlu</span>
                </div>
              </div>
            </div>

            {/* Feature Cards for Construction vs Inspection */}
            <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="bg-blue-600/10 backdrop-blur-sm rounded-2xl p-6 border border-blue-500/30 hover:border-blue-400/50 transition-all"
              >
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 bg-blue-600/20 rounded-xl flex items-center justify-center">
                    <Building className="w-6 h-6 text-blue-400" />
                  </div>
                  <div className="text-left">
                    <h3 className="text-lg font-semibold text-white">Müteahhit Yönetimi</h3>
                    <p className="text-slate-400 text-sm">İnşaat firmaları için</p>
                  </div>
                </div>
                <ul className="text-left text-slate-300 text-sm space-y-2">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-blue-400" />
                    <span>Personel Takibi & Puantaj</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-blue-400" />
                    <span>Taşeron & Hakediş Yönetimi</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-blue-400" />
                    <span>Ambar & Finans Takibi</span>
                  </li>
                </ul>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.5 }}
                className="bg-purple-600/10 backdrop-blur-sm rounded-2xl p-6 border border-purple-500/30 hover:border-purple-400/50 transition-all"
              >
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 bg-purple-600/20 rounded-xl flex items-center justify-center">
                    <ShieldCheckIcon className="w-6 h-6 text-purple-400" />
                  </div>
                  <div className="text-left">
                    <h3 className="text-lg font-semibold text-white">Yapı Denetim Yönetimi</h3>
                    <p className="text-slate-400 text-sm">Denetim firmaları için</p>
                  </div>
                </div>
                <ul className="text-left text-slate-300 text-sm space-y-2">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-purple-400" />
                    <span>YİBF & Numune Takibi</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-purple-400" />
                    <span>Demir & Kalıp Kontrol</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-purple-400" />
                    <span>Rota Optimizasyonu & AI</span>
                  </li>
                </ul>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Interactive Demo Section */}
      <section className="py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              İnteraktif Modül Demo
            </h2>
            <p className="text-slate-400 max-w-2xl mx-auto">
              Sol menüden bir modül seçin, sistemimizin yeteneklerini keşfedin
            </p>
          </motion.div>

          {/* Category Filter */}
          <div className="flex justify-center gap-4 mb-8">
            <button
              onClick={() => setSelectedCategory("all")}
              className={`px-6 py-3 rounded-lg font-medium transition-all ${
                selectedCategory === "all"
                  ? "bg-blue-600 text-white"
                  : "bg-slate-800 text-slate-300 hover:bg-slate-700"
              }`}
            >
              Tüm Modüller
            </button>
            <button
              onClick={() => setSelectedCategory("construction")}
              className={`px-6 py-3 rounded-lg font-medium transition-all flex items-center gap-2 ${
                selectedCategory === "construction"
                  ? "bg-blue-600 text-white"
                  : "bg-slate-800 text-slate-300 hover:bg-slate-700"
              }`}
            >
              <Building className="w-4 h-4" />
              Müteahhit
            </button>
            <button
              onClick={() => setSelectedCategory("inspection")}
              className={`px-6 py-3 rounded-lg font-medium transition-all flex items-center gap-2 ${
                selectedCategory === "inspection"
                  ? "bg-purple-600 text-white"
                  : "bg-slate-800 text-slate-300 hover:bg-slate-700"
              }`}
            >
              <ShieldCheckIcon className="w-4 h-4" />
              Yapı Denetim
            </button>
          </div>

          {/* Demo Interface */}
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Sidebar */}
            <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden">
              <div className="p-4 border-b border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-600/20 rounded-lg flex items-center justify-center">
                    <LayoutDashboard className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <h3 className="text-white font-semibold">Nexa ERP</h3>
                    <p className="text-slate-400 text-xs">Modül Menüsü</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                  className="p-2 rounded-lg bg-slate-800 text-slate-400 hover:text-white transition-colors"
                >
                  {isSidebarCollapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
                </button>
              </div>

              <div className={`p-4 space-y-2 max-h-[600px] overflow-y-auto ${isSidebarCollapsed ? "px-2" : ""}`}>
                <div className="relative mb-4">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Modül ara..."
                    className={`w-full bg-slate-800 border border-slate-700 rounded-lg pl-10 pr-4 py-2 text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 transition-colors ${isSidebarCollapsed ? "hidden" : ""}`}
                  />
                </div>

                {Object.entries(groupedNavItems).map(([category, items]) => (
                  <div key={category}>
                    {!isSidebarCollapsed && (
                      <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 mt-4">
                        {category}
                      </h4>
                    )}
                    {items.map((item) => {
                      const Icon = item.icon
                      const isActive = selectedModule === item.href
                      return (
                        <button
                          key={item.href}
                          onClick={() => setSelectedModule(item.href)}
                          className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all ${
                            isActive
                              ? "bg-blue-600/20 text-blue-400 border border-blue-500/30"
                              : "text-slate-300 hover:bg-slate-800 hover:text-white"
                          } ${isSidebarCollapsed ? "justify-center px-2" : ""}`}
                          title={isSidebarCollapsed ? item.label : undefined}
                        >
                          <Icon className={`w-5 h-5 shrink-0 ${isActive ? "text-blue-400" : ""}`} />
                          {!isSidebarCollapsed && <span className="text-sm">{item.label}</span>}
                        </button>
                      )
                    })}
                  </div>
                ))}
              </div>
            </div>

            {/* Module Preview */}
            <div className="lg:col-span-2 bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden">
              <div className="p-6 border-b border-slate-800">
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="flex items-start gap-4"
                >
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.3 }}
                    className="w-16 h-16 bg-gradient-to-br from-blue-600/20 to-purple-600/20 rounded-xl flex items-center justify-center"
                  >
                    <currentPreview.icon className="w-8 h-8 text-blue-400" />
                  </motion.div>
                  <div className="flex-1">
                    <motion.h3
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3 }}
                      className="text-2xl font-bold text-white mb-2"
                    >
                      {currentPreview.title}
                    </motion.h3>
                    <motion.p
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: 0.1 }}
                      className="text-slate-400"
                    >
                      {currentPreview.description}
                    </motion.p>
                  </div>
                  <div className="flex gap-2">
                    {currentPreview.category === "construction" && (
                      <span className="px-3 py-1 bg-blue-600/20 text-blue-400 rounded-full text-xs font-medium">
                        Müteahhit
                      </span>
                    )}
                    {currentPreview.category === "inspection" && (
                      <span className="px-3 py-1 bg-purple-600/20 text-purple-400 rounded-full text-xs font-medium">
                        Yapı Denetim
                      </span>
                    )}
                    {currentPreview.category === "shared" && (
                      <span className="px-3 py-1 bg-green-600/20 text-green-400 rounded-full text-xs font-medium">
                        Ortak
                      </span>
                    )}
                  </div>
                </motion.div>
              </div>

              {/* Dashboard Mockup Preview */}
              <div className="p-6 bg-slate-800/30">
                <motion.div
                  key={selectedModule}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4 }}
                  className="bg-slate-900 rounded-xl border border-slate-700 p-4 mb-6"
                >
                  <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-700">
                    <div className="w-3 h-3 rounded-full bg-red-500" />
                    <div className="w-3 h-3 rounded-full bg-yellow-500" />
                    <div className="w-3 h-3 rounded-full bg-green-500" />
                    <div className="flex-1 bg-slate-800 rounded-lg px-3 py-1 ml-4">
                      <span className="text-xs text-slate-400">nexa-erp.com/{currentPreview.title.toLowerCase().replace(/ /g, '-')}</span>
                    </div>
                  </div>
                  
                  {/* Mockup Content */}
                  {renderMockupContent(selectedModule)}
                </motion.div>

                <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <Target className="w-5 h-5 text-blue-400" />
                  Öne Çıkan Özellikler
                </h4>
                <div className="grid sm:grid-cols-2 gap-4">
                  {currentPreview.features.map((feature, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.1 }}
                      className="flex items-start gap-3 p-4 bg-slate-800/50 rounded-lg border border-slate-700"
                    >
                      <CheckCircle className="w-5 h-5 text-green-400 shrink-0 mt-0.5" />
                      <span className="text-slate-300 text-sm">{feature}</span>
                    </motion.div>
                  ))}
                </div>

                <div className="mt-8 pt-6 border-t border-slate-800">
                  <Link
                    href="/login"
                    className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-blue-500 hover:to-purple-500 transition-all duration-300 shadow-lg"
                  >
                    Bu Modülü Dene
                    <ArrowRight className="w-5 h-5" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 border-t border-slate-800">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Neden Nexa ERP?
            </h2>
            <p className="text-slate-400 max-w-2xl mx-auto">
              İnşaat ve yapı denetim süreçlerinizi dijitalleştirin, verimliliğinizi artırın
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: Bot,
                title: "Yapay Zeka Destekli",
                description: "AI ile rota optimizasyonu, risk analizi ve akıllı öneriler"
              },
              {
                icon: Smartphone,
                title: "Mobil Uyumlu",
                description: "iOS ve Android uygulamaları ile sahada her zaman erişilebilir"
              },
              {
                icon: Shield,
                title: "Güvenli ve Ölçeklenebilir",
                description: "Bulut tabanlı altyapı ile verileriniz her zaman güvende"
              }
            ].map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="bg-slate-900/50 backdrop-blur-sm rounded-2xl p-8 border border-slate-800 hover:border-blue-500/50 transition-all duration-300"
              >
                <div className="w-14 h-14 bg-blue-600/20 rounded-xl flex items-center justify-center mb-6">
                  <feature.icon className="w-7 h-7 text-blue-400" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-3">{feature.title}</h3>
                <p className="text-slate-400">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 border-t border-slate-800">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
              Hemen Başlayın
            </h2>
            <p className="text-slate-400 mb-8 max-w-2xl mx-auto">
              14 günlük ücretsiz deneme ile Nexa ERP'nin gücünü keşfedin. Kredi kartı gerekmez.
            </p>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-lg font-semibold hover:from-blue-500 hover:to-purple-500 transition-all duration-300 shadow-lg hover:shadow-blue-500/25 text-lg"
            >
              Ücretsiz Demo Başlat
              <ArrowRight className="w-5 h-5" />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 border-t border-slate-800">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-slate-400 text-sm">
            © 2026 Nexa ERP. Tüm hakları saklıdır.
          </p>
        </div>
      </footer>
    </div>
  )
}
