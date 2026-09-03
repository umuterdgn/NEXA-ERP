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
  Smartphone
} from "lucide-react"

interface ModulePreview {
  title: string
  description: string
  features: string[]
  icon: any
  category: "construction" | "inspection" | "shared"
}

const modulePreviews: Record<string, ModulePreview> = {
  "/admin": {
    title: "Dashboard",
    description: "Tüm projelerinizi tek ekrandan yönetin. KPI'lar, grafikler ve özet istatistiklerle anlık durum takibi.",
    features: ["Gerçek zamanlı KPI göstergeleri", "Proje ilerleme grafikleri", "Personel özet istatistikleri", "Finansal özetler"],
    icon: LayoutDashboard,
    category: "shared"
  },
  "/admin/routes": {
    title: "Rota Optimizasyonu",
    description: "Yapı denetim rotalarını AI ile optimize edin. En kısa ve en verimli denetim rotalarını otomatik hesaplayın.",
    features: ["AI tabanlı rota hesaplama", "Yakıt tasarrufu analizi", "Zaman yönetimi optimizasyonu", "GPS takip entegrasyonu"],
    icon: Route,
    category: "inspection"
  },
  "/admin/smart-documents": {
    title: "Akıllı Evrak Denetimi (OCR)",
    description: "Kağıt evrakları dijitalleştirin. OCR teknolojisi ile belgeleri otomatik okuyun ve arşivleyin.",
    features: ["OCR ile otomatik metin okuma", "Akıllı belge sınıflandırma", "Arama ve filtreleme", "Bulut depolama entegrasyonu"],
    icon: ScanText,
    category: "shared"
  },
  "/admin/isg/near-miss": {
    title: "Ramak Kala Bildirimi",
    description: "İş kazalarını önleyin. Ramak kala olayları anlık bildirin ve analiz edin.",
    features: ["Anlık olay bildirimi", "Fotoğraf ve kanıt ekleme", "AI tabanlı risk analizi", "Önleyici eylem önerileri"],
    icon: AlertTriangle,
    category: "shared"
  },
  "/admin/ai-assistant": {
    title: "AI Asistan",
    description: "Yapay zeka ile projelerinizi analiz edin. Sorularınızı yanıtlayın ve öneriler alın.",
    features: ["Doğal dil sorguları", "Proje analizi", "Risk tahminleme", "Otomatik rapor oluşturma"],
    icon: Bot,
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
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-purple-600/10" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
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
              className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/30 rounded-full px-4 py-2 mb-6"
            >
              <Zap className="w-4 h-4 text-blue-400" />
              <span className="text-blue-300 text-sm font-medium">Yapay Zeka Destekli Şantiye Yönetimi</span>
            </motion.div>
            
            <h1 className="text-5xl md:text-7xl font-bold text-white mb-6">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-cyan-400 to-purple-400">
                Nexa ERP
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-slate-300 mb-8 max-w-3xl mx-auto">
              Şantiye & Denetim Asistanı - İnşaat ve Yapı Denetim firmaları için tüm operasyonlarınızı tek platformda yönetin
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link
                href="/login"
                className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-cyan-600 text-white px-8 py-4 rounded-lg font-semibold hover:from-blue-500 hover:to-cyan-500 transition-all duration-300 shadow-lg hover:shadow-blue-500/25"
              >
                Demo Başlat
                <ArrowRight className="w-5 h-5" />
              </Link>
              <div className="flex items-center gap-2 text-slate-400">
                <Star className="w-5 h-5 text-yellow-400" />
                <span className="text-sm">20+ Modül • AI Destekli • Mobil Uyumlu</span>
              </div>
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
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-600/20 to-purple-600/20 rounded-xl flex items-center justify-center">
                    <currentPreview.icon className="w-8 h-8 text-blue-400" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold text-white mb-2">{currentPreview.title}</h3>
                    <p className="text-slate-400">{currentPreview.description}</p>
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
                </div>
              </div>

              <div className="p-6">
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
