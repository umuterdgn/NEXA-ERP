"use client";

/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Inspection Sidebar Component - Role-Isolated Building Inspection Terminal
 * 
 * RBAC Kuralları:
 * - INSPECTOR (Saha Denetçisi): Operasyonel, AI, Dijital Proje, Bakanlık ve Kalite modüllerini görür. Kasa, Finans, Muhasebe ve Personel GİZLENİR.
 * - INSPECTION_ADMIN (Yapı Denetim Patronu): Tüm modüllere ek olarak Kuruluş Yönetimi & Finans modüllerini görür.
 */

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { usePwaInstall } from "@/hooks/use-pwa-install";
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
  Route,
  PenTool,
  Sparkles,
  ScanText,
  Plane,
  Layers,
  Pencil,
  History,
  FolderArchive,
  LogOut,
  Menu,
  X,
  ChevronDown,
  ShieldCheck,
  Download,
  DollarSign,
  Landmark,
  Wallet,
  UserCheck,
  FileSignature,
} from "lucide-react";

interface NavItem {
  href: string;
  label: string;
  icon: any;
  badge?: string;
  badgeColor?: string;
}

interface NavSection {
  title: string;
  adminOnly?: boolean;
  items: NavItem[];
}

// Kategorik Menü Yapısı
const navSections: NavSection[] = [
  // 1. YAPI DENETİM & KONTROL
  {
    title: "YAPI DENETİM & KONTROL",
    items: [
      { href: "/inspection/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { href: "/inspection/projects", label: "Denetlenen Yapılar / Projeler", icon: Building2 },
      { href: "/inspection/forms", label: "Dinamik Denetim Formları", icon: ClipboardCheck },
      { href: "/inspection/form-builder", label: "Dinamik Form Oluşturucu", icon: PenTool, badge: "YENİ", badgeColor: "bg-blue-500/20 text-blue-300 border-blue-500/40" },
      { href: "/inspection/core-samples", label: "Karot & Numune QR Takip", icon: FlaskConical },
      { href: "/inspection/reinforcement", label: "Demir & Kalıp Kontrol (Vize)", icon: Construction },
      { href: "/inspection/attachment", label: "Ataşman & Delil Kayıtları", icon: FileCheck },
      { href: "/inspection/deficiencies", label: "Saha Kusur & Eksiklikleri", icon: FileWarning },
    ],
  },

  // 2. YAPAY ZEKA & İLERİ TEKNOLOJİ [YENİ KATEGORİ]
  {
    title: "YAPAY ZEKA & İLERİ TEKNOLOJİ",
    items: [
      { href: "/inspection/ai-vision", label: "AI Görsel Analiz & Hasar Tespit", icon: Sparkles, badge: "AI", badgeColor: "bg-purple-500/20 text-purple-300 border-purple-500/40" },
      { href: "/inspection/ocr", label: "Akıllı Evrak Denetimi (OCR)", icon: ScanText, badge: "OCR", badgeColor: "bg-cyan-500/20 text-cyan-300 border-cyan-500/40" },
      { href: "/inspection/drone", label: "Hava & Drone Gözlem", icon: Plane, badge: "İHA", badgeColor: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40" },
    ],
  },

  // 3. DİJİTAL PROJE & ARŞİV [YENİ KATEGORİ]
  {
    title: "DİJİTAL PROJE & ARŞİV",
    items: [
      { href: "/inspection/blueprints", label: "Dijital Projeler / Çizimler", icon: Layers },
      { href: "/inspection/sketch", label: "Serbest Çizim / Plan", icon: Pencil },
      { href: "/inspection/revisions", label: "Proje Revizyonları", icon: History },
      { href: "/inspection/archive", label: "Ruhsat & Dijital Evrak Arşivi", icon: FolderArchive },
    ],
  },

  // 4. BAKANLIK & OPERASYON
  {
    title: "BAKANLIK & OPERASYON",
    items: [
      { href: "/inspection/yibf", label: "Bakanlık e-YİBF Sistemi", icon: Building },
      { href: "/inspection/map", label: "GIS Denetim Haritası", icon: Map },
      { href: "/inspection/dispatch", label: "Görev Dağıtımı & Rota Optimizasyonu", icon: Route },
    ],
  },

  // 5. KALİTE & KURULUŞ
  {
    title: "KALİTE & KURULUŞ",
    items: [
      { href: "/inspection/materials", label: "Kalite: Malzeme Onayları", icon: CheckSquare },
      { href: "/inspection/ncr", label: "Uygunsuzluk & DÖF (NCR)", icon: AlertTriangle },
    ],
  },

  // 6. KURULUŞ YÖNETİMİ & FİNANS (SADECE INSPECTION_ADMIN ve ADMIN görür, INSPECTOR'dan GİZLENİR!)
  {
    title: "KURULUŞ YÖNETİMİ & FİNANS",
    adminOnly: true,
    items: [
      { href: "/admin/finance", label: "Kasa & Finans", icon: DollarSign },
      { href: "/admin/finance/documents", label: "Çek / Senet & Teminat", icon: Landmark },
      { href: "/admin/billing", label: "Muhasebe & Hakediş", icon: Wallet },
      { href: "/admin/personnel", label: "Denetçi & Personel Takibi", icon: UserCheck },
      { href: "/admin/contracts", label: "Hizmet Sözleşmeleri", icon: FileSignature },
    ],
  },
];

export default function InspectionSidebar({
  isCollapsed,
  setIsCollapsed,
}: {
  isCollapsed: boolean;
  setIsCollapsed: React.Dispatch<React.SetStateAction<boolean>>;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const sessionContext = useSession();
  const session = sessionContext?.data;
  const { isInstallable, promptInstall } = usePwaInstall();

  const userRole = session?.user?.role as string;
  const isInspectionAdmin =
    userRole === "INSPECTION_ADMIN" || userRole === "ADMIN" || userRole === "SUPER_ADMIN";

  // RBAC İzolasyonu: Admin olmayan kullanıcılardan adminOnly kategorilerini filtrele
  const visibleSections = navSections.filter(
    (sec) => !sec.adminOnly || (sec.adminOnly && isInspectionAdmin)
  );

  const isItemActive = (href: string) => {
    if (pathname === href) return true;
    if (href === "/inspection/dashboard" && (pathname === "/dashboard" || pathname === "/inspection/dashboard")) {
      return true;
    }
    if (href === "/inspection/yibf" && (pathname === "/yibf" || pathname === "/inspection/yibf" || pathname.startsWith("/yibf/"))) {
      return true;
    }
    if (href === "/inspection/map" && (pathname === "/map" || pathname === "/inspection/map")) {
      return true;
    }
    if (href === "/inspection/dispatch" && (pathname === "/dispatch" || pathname === "/inspection/dispatch")) {
      return true;
    }
    return pathname.startsWith(href + "/");
  };

  return (
    <>
      {/* Mobil Üst Başlık */}
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
            <div className="w-8 h-8 rounded-lg bg-blue-700 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-white font-semibold text-sm">Yapı Denetim Portalı</h1>
          </div>
          <div className="w-10" />
        </div>
      </div>

      {/* Mobil Arka Plan Karartması */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/70 z-[9990]"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sol Kenar Menüsü (Sidebar) */}
      <aside
        className={`fixed top-0 left-0 h-full z-[9999] transition-all duration-300 ${
          isOpen ? "translate-x-0 w-72" : "-translate-x-full lg:translate-x-0"
        } ${isCollapsed ? "lg:w-20" : "lg:w-64"} w-72 bg-slate-900 border-r border-slate-800 flex flex-col`}
      >
        <div className={`flex h-full flex-col ${isCollapsed ? "p-3" : "p-4 sm:p-5"}`}>
          {/* Üst Logo ve Başlık */}
          <div className={`mb-3 flex items-center ${isCollapsed ? "justify-center" : "justify-between"}`}>
            {!isCollapsed && (
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-700 text-white shadow-sm">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div>
                  <h1 className="text-sm font-bold text-white tracking-tight">Yapı Denetim OS</h1>
                  <p className="text-[11px] text-slate-400 font-medium">Bakanlık e-YİBF Terminali</p>
                </div>
              </div>
            )}

            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="hidden h-8 w-8 items-center justify-center rounded-lg border border-slate-700/60 bg-slate-800 text-slate-300 transition-colors hover:bg-slate-700 hover:text-white lg:flex cursor-pointer"
              title={isCollapsed ? "Genişlet" : "Daralt"}
              aria-label={isCollapsed ? "Genişlet" : "Daralt"}
            >
              {isCollapsed ? <ChevronDown className="h-4 w-4 rotate-180" /> : <ChevronDown className="h-4 w-4" />}
            </button>
          </div>

          {/* Kullanıcı Yetki & Profil Kartı */}
          {!isCollapsed && (
            <div className="mb-3 rounded-xl border border-slate-800 bg-slate-950/70 p-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-800 border border-slate-700 text-blue-400 font-bold text-xs">
                  {session?.user?.name ? session.user.name.charAt(0).toUpperCase() : "D"}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-semibold text-white">
                    {session?.user?.name || "Yapı Denetçisi"}
                  </p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${
                        isInspectionAdmin
                          ? "bg-amber-950/40 text-amber-300 border-amber-800/60"
                          : "bg-blue-950/40 text-blue-300 border-blue-800/60"
                      }`}
                    >
                      {isInspectionAdmin ? "Patron / Yönetici" : "Saha Denetçisi"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Navigasyon Bağlantıları (Kategorik Gruplama) */}
          <nav className="flex-1 space-y-4 overflow-y-auto overflow-x-hidden pr-1 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
            {visibleSections.map((section, sIndex) => (
              <div key={section.title} className="space-y-1">
                {/* Kategori Başlığı */}
                {!isCollapsed ? (
                  <div className="px-3 pt-1 pb-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block border-t border-slate-800/80 pt-2">
                      {section.title}
                    </span>
                  </div>
                ) : (
                  sIndex > 0 && <div className="border-t border-slate-800/80 my-2" />
                )}

                {/* Kategori Öğeleri */}
                {section.items.map((item) => {
                  const active = isItemActive(item.href);
                  const Icon = item.icon;

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setIsOpen(false)}
                      className={`flex min-h-[36px] items-center rounded-lg text-xs font-medium transition-colors ${
                        active
                          ? "bg-blue-700 text-white shadow-sm"
                          : "text-slate-300 hover:bg-slate-800/80 hover:text-white"
                      } ${isCollapsed ? "justify-center px-0" : "justify-start gap-2.5 px-3 py-1.5"}`}
                      title={isCollapsed ? item.label : undefined}
                    >
                      <Icon className={`h-4 w-4 shrink-0 ${active ? "text-white" : "text-slate-400"}`} />
                      {!isCollapsed && (
                        <div className="flex items-center justify-between flex-1 min-w-0">
                          <span className="truncate">{item.label}</span>
                          {item.badge && (
                            <span
                              className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ml-1.5 shrink-0 ${
                                item.badgeColor || "bg-blue-500/20 text-blue-300 border-blue-500/40"
                              }`}
                            >
                              {item.badge}
                            </span>
                          )}
                        </div>
                      )}
                    </Link>
                  );
                })}
              </div>
            ))}
          </nav>

          {/* Alt Aksiyon Butonları */}
          <div className="mt-3 border-t border-slate-800 pt-3 space-y-2">
            {isInstallable && (
              <button
                type="button"
                onClick={() => void promptInstall()}
                className={`flex min-h-[36px] w-full items-center justify-center gap-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700/60 px-3 py-2 text-xs font-medium text-slate-200 transition-colors cursor-pointer ${
                  isCollapsed ? "px-2" : "text-left"
                }`}
                title={isCollapsed ? "Uygulamayı Yükle" : undefined}
              >
                <Download className="h-4 w-4 shrink-0 text-slate-400" />
                {!isCollapsed && <span>PWA Uygulamayı Yükle</span>}
              </button>
            )}

            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className={`flex min-h-[36px] w-full items-center rounded-lg bg-slate-800 hover:bg-rose-900/60 border border-slate-700/60 hover:border-rose-700/60 px-3 py-2 text-xs font-medium text-slate-300 hover:text-rose-200 transition-colors cursor-pointer ${
                isCollapsed ? "justify-center" : "gap-2.5 text-left"
              }`}
              title={isCollapsed ? "Çıkış Yap" : undefined}
            >
              <LogOut className="h-4 w-4 shrink-0" />
              {!isCollapsed && <span>Güvenli Çıkış</span>}
            </button>
          </div>

          {/* Mobil Kapatma Butonu */}
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
  );
}
