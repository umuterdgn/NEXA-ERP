"use client";

/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Inspection Sidebar Component - Role-Isolated Building Inspection Terminal
 * 
 * RBAC Kuralları:
 * - INSPECTOR (Saha Denetçisi): Sadece operasyonel modülleri görür. Kasa, Finans, Muhasebe ve Personel GİZLENİR.
 * - INSPECTION_ADMIN (Yapı Denetim Patronu): Operasyonel modüllere ek olarak Kasa, Muhasebe, Personel ve Sözleşmeler modüllerini görür.
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
  FileText,
  Bot,
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
  category?: "operational" | "management";
}

// 1. Operasyonel Modüller (Hem INSPECTOR hem INSPECTION_ADMIN görür)
const operationalNavItems: NavItem[] = [
  { href: "/dashboard", label: "Yapı Denetim Dashboard", icon: LayoutDashboard, category: "operational" },
  { href: "/inspection/projects", label: "Denetlenen Yapılar / Projeler", icon: Building2, category: "operational" },
  { href: "/inspection/core-samples", label: "Karot & Numune QR Takip", icon: FlaskConical, category: "operational" },
  { href: "/inspection/forms", label: "Dinamik Denetim Formları", icon: ClipboardCheck, category: "operational" },
  { href: "/yibf", label: "Bakanlık e-YİBF Sistemi", icon: Building, category: "operational" },
  { href: "/inspection/yibf-sync", label: "e-YİBF Senkronizasyon", icon: Bot, category: "operational" },
  { href: "/inspection/reinforcement", label: "Demir & Kalıp Kontrol (Vize)", icon: Construction, category: "operational" },
  { href: "/inspection/attachment", label: "Ataşman & Delil Kayıtları", icon: FileCheck, category: "operational" },
  { href: "/inspection/materials", label: "Kalite: Malzeme Onayları", icon: CheckSquare, category: "operational" },
  { href: "/inspection/ncr", label: "Uygunsuzluk & DÖF (NCR)", icon: AlertTriangle, category: "operational" },
  { href: "/inspection/deficiencies", label: "Saha Kusur & Eksiklikleri", icon: FileWarning, category: "operational" },
  { href: "/map", label: "GIS Denetim Haritası", icon: Map, category: "operational" },
  { href: "/dispatch", label: "Mühendis Görev Dağıtımı", icon: Users, category: "operational" },
  { href: "/reports", label: "Saha Denetim Raporları", icon: FileText, category: "operational" },
];

// 2. Yönetimsel, Finans & Personel Modülleri (SADECE INSPECTION_ADMIN ve ADMIN görür, INSPECTOR'dan GİZLENİR!)
const managementNavItems: NavItem[] = [
  { href: "/admin/finance", label: "Kasa & Finans", icon: DollarSign, category: "management" },
  { href: "/admin/finance/documents", label: "Çek / Senet & Teminat", icon: Landmark, category: "management" },
  { href: "/admin/billing", label: "Muhasebe & Hakediş", icon: Wallet, category: "management" },
  { href: "/admin/personnel", label: "Denetçi & Personel Takibi", icon: UserCheck, category: "management" },
  { href: "/admin/contracts", label: "Hizmet Sözleşmeleri", icon: FileSignature, category: "management" },
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

  // Görev 4 Yetki İzolasyonu:
  // if (role === 'INSPECTOR'): Sadece Operasyonel modüller
  // if (role === 'INSPECTION_ADMIN'): Operasyonel modüller + Kasa, Muhasebe, Personel ve Sözleşmeler
  const navItems: NavItem[] = isInspectionAdmin
    ? [...operationalNavItems, ...managementNavItems]
    : operationalNavItems;

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
          <div className={`mb-4 flex items-center ${isCollapsed ? "justify-center" : "justify-between"}`}>
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
            <div className="mb-4 rounded-xl border border-slate-800 bg-slate-950/70 p-3">
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

          {/* Navigasyon Bağlantıları */}
          <nav className="flex-1 space-y-1 overflow-y-auto overflow-x-hidden pr-1 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
            {navItems.map((item, index) => {
              const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href + "/"));
              const Icon = item.icon;

              // Yönetimsel modüller başlığı (Sadece INSPECTION_ADMIN için ve ilk yönetim öğesinde)
              const isFirstManagement =
                isInspectionAdmin &&
                item.category === "management" &&
                (index === 0 || navItems[index - 1].category !== "management");

              return (
                <React.Fragment key={item.href}>
                  {isFirstManagement && !isCollapsed && (
                    <div className="pt-3 pb-1.5 px-3">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block border-t border-slate-800/80 pt-2">
                        Kuruluş Yönetimi & Finans
                      </span>
                    </div>
                  )}

                  <Link
                    href={item.href}
                    onClick={() => setIsOpen(false)}
                    className={`flex min-h-[38px] items-center rounded-lg text-xs font-medium transition-colors ${
                      isActive
                        ? "bg-blue-700 text-white shadow-sm"
                        : "text-slate-300 hover:bg-slate-800/80 hover:text-white"
                    } ${isCollapsed ? "justify-center px-0" : "justify-start gap-2.5 px-3 py-2"}`}
                    title={isCollapsed ? item.label : undefined}
                  >
                    <Icon className={`h-4 w-4 shrink-0 ${isActive ? "text-white" : "text-slate-400"}`} />
                    <span className={`${isCollapsed ? "hidden" : "truncate"}`}>{item.label}</span>
                  </Link>
                </React.Fragment>
              );
            })}
          </nav>

          {/* Alt Aksiyon Butonları */}
          <div className="mt-4 border-t border-slate-800 pt-3 space-y-2">
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
