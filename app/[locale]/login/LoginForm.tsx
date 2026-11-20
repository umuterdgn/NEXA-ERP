"use client";

/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Nexa ERP - Kurumsal B2B Enterprise Giriş Terminali (White-Label & 3-İşletme RBAC Destekli)
 */

import React, { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Building2,
  ShieldCheck,
  Mail,
  Lock,
  ArrowRight,
  Eye,
  EyeOff,
  HardHat,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Briefcase,
  Users,
  Store,
  Truck,
  FlaskConical,
  KeyRound,
} from "lucide-react";
import { getDefaultWebRoute, type SystemRole, type TenantType } from "@/lib/rbac/permissions";
import {
  DEMO_ACCOUNT_PASSWORD,
  DEMO_TABS,
  getDemoAccountsByTenantType,
  type DemoAccountDefinition,
} from "@/lib/demo-accounts";

export interface TenantData {
  id: string;
  name: string;
  slug: string | null;
  logoUrl: string | null;
  type: string;
  primaryColor: string | null;
  isWhiteLabelActive?: boolean;
}

interface LoginFormProps {
  tenant: TenantData | null;
}

function getInitials(name: string) {
  if (!name) return "NX";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

function renderRoleIcon(role: SystemRole) {
  switch (role) {
    case "ADMIN":
      return <Building2 className="w-4 h-4 text-blue-400 shrink-0" />;
    case "SITE_MANAGER":
      return <HardHat className="w-4 h-4 text-amber-400 shrink-0" />;
    case "ENGINEER":
      return <HardHat className="w-4 h-4 text-orange-400 shrink-0" />;
    case "WORKER":
      return <Users className="w-4 h-4 text-emerald-400 shrink-0" />;
    case "DRIVER":
      return <Truck className="w-4 h-4 text-cyan-400 shrink-0" />;
    case "SUBCONTRACTOR":
      return <Briefcase className="w-4 h-4 text-indigo-400 shrink-0" />;
    case "INSPECTION_ADMIN":
      return <ShieldCheck className="w-4 h-4 text-blue-400 shrink-0" />;
    case "INSPECTOR":
      return <ShieldCheck className="w-4 h-4 text-sky-400 shrink-0" />;
    case "LAB_TECH":
      return <FlaskConical className="w-4 h-4 text-teal-400 shrink-0" />;
    case "FRANCHISE_ADMIN":
      return <Store className="w-4 h-4 text-rose-400 shrink-0" />;
    case "FRANCHISEE":
      return <Store className="w-4 h-4 text-amber-400 shrink-0" />;
    default:
      return <Users className="w-4 h-4 text-slate-400 shrink-0" />;
  }
}

export default function LoginForm({ tenant }: LoginFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tenantParam = searchParams ? searchParams.get("tenant") : null;

  // Tenant tipine göre giriş modunu belirle
  const isInspectionTenant =
    tenant?.type === "INSPECTION" || tenant?.type === "YAPI_DENETIM";
  const isContractorTenant =
    tenant?.type === "MAIN_CONTRACTOR" ||
    tenant?.type === "MUTEAHHIT" ||
    tenant?.type === "CONTRACTOR";
  const isFranchiseTenant = tenant?.type === "FRANCHISE";

  // Eğer belirli bir tenant tipi varsa sekmeleri gizle
  const shouldHideTabs =
    isInspectionTenant || isContractorTenant || isFranchiseTenant;

  const initialTenantType: TenantType = isFranchiseTenant
    ? "FRANCHISE"
    : isInspectionTenant
    ? "INSPECTION"
    : "CONTRACTOR";

  const [loginMode, setLoginMode] = useState<
    "contractor" | "inspection" | "franchise"
  >(
    initialTenantType === "FRANCHISE"
      ? "franchise"
      : initialTenantType === "INSPECTION"
      ? "inspection"
      : "contractor"
  );
  const [demoTab, setDemoTab] = useState<TenantType>(initialTenantType);
  const [activeDemoKey, setActiveDemoKey] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [loginSuccess, setLoginSuccess] = useState(false);

  const primaryColor = tenant?.primaryColor || "#2563eb";

  const authenticateAndRedirect = async (
    loginEmail: string,
    loginPassword: string
  ) => {
    if (!loginEmail || !loginPassword) {
      setError("Lütfen e-posta / kullanıcı adı ve şifrenizi giriniz.");
      return;
    }

    setIsLoading(true);
    setError("");
    setLoginSuccess(false);

    try {
      const result = await signIn("credentials", {
        email: loginEmail.trim(),
        password: loginPassword,
        redirect: false,
      });

      if (!result || result.error) {
        setError(
          "Geçersiz e-posta veya şifre. Lütfen bilgilerinizi kontrol ediniz."
        );
        setIsLoading(false);
        setActiveDemoKey(null);
        return;
      }

      setLoginSuccess(true);

      // Kullanıcı oturumundaki role ve tenant bilgisine göre KESİN DİNAMİK YÖNLENDİRME
      let targetPath =
        isFranchiseTenant || tenant?.type === "FRANCHISE"
          ? "/franchise"
          : isInspectionTenant
          ? "/inspection"
          : "/admin";
      try {
        const sessionRes = await fetch("/api/auth/session", {
          cache: "no-store",
        });
        if (sessionRes.ok) {
          const sessionData = await sessionRes.json();
          const role = (sessionData?.user?.role as string)?.toUpperCase() || "";
          const sessionTenantType = sessionData?.user?.tenantType as
            | string
            | undefined;

          targetPath = getDefaultWebRoute(role, sessionTenantType || tenant?.type);
        }
      } catch (err) {
        console.error("Session sorgulama hatası:", err);
      }

      router.push(targetPath);
      router.refresh();
    } catch (err) {
      console.error("Giriş işlemi hatası:", err);
      setError("Giriş yapılırken bir sunucu hatası oluştu.");
      setIsLoading(false);
      setActiveDemoKey(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setActiveDemoKey(null);
    await authenticateAndRedirect(email, password);
  };

  const handleQuickDemoLogin = async (acc: DemoAccountDefinition) => {
    if (isLoading || loginSuccess) return;
    setActiveDemoKey(acc.key);
    setDemoTab(acc.tenantType);
    setLoginMode(
      acc.tenantType === "FRANCHISE"
        ? "franchise"
        : acc.tenantType === "INSPECTION"
        ? "inspection"
        : "contractor"
    );
    setEmail(acc.email);
    setPassword(acc.password);
    await authenticateAndRedirect(acc.email, acc.password);
  };

  const visibleDemoAccounts = getDemoAccountsByTenantType(demoTab);
  const activeTabMeta = DEMO_TABS.find((t) => t.type === demoTab);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center px-4 py-10 selection:bg-blue-600 selection:text-white">
      {/* Ana Form Konteyneri */}
      <div className="w-full max-w-[480px]">
        {/* Kurumsal Logo & Başlık (White-Label Dinamik Header) */}
        <div className="text-center mb-7">
          {tenant ? (
            /* Tenant Özel White-Label Başlığı */
            <div className="flex flex-col items-center">
              {tenant.logoUrl ? (
                <div className="mb-3 max-h-20 flex items-center justify-center p-2 rounded-2xl bg-slate-900/60 border border-slate-800">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={tenant.logoUrl}
                    alt={tenant.name}
                    className="max-h-16 max-w-[240px] w-auto object-contain"
                  />
                </div>
              ) : (
                <div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center text-white font-extrabold text-2xl shadow-xl mb-3 border border-white/10"
                  style={{
                    backgroundColor: primaryColor,
                    boxShadow: `0 12px 28px -6px ${primaryColor}55`,
                  }}
                >
                  {getInitials(tenant.name)}
                </div>
              )}

              <h1 className="text-2xl font-bold tracking-tight text-white mb-2">
                {tenant.name}
              </h1>

              {/* Kurumsal Giriş Portalı Badge */}
              <div
                className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border text-xs font-semibold shadow-sm"
                style={{
                  backgroundColor: `${primaryColor}15`,
                  borderColor: `${primaryColor}40`,
                  color: "#ffffff",
                }}
              >
                <span
                  className="w-2 h-2 rounded-full animate-pulse"
                  style={{ backgroundColor: primaryColor }}
                />
                <span>
                  {isFranchiseTenant
                    ? "Franchise & Zincir Mağaza Portalı: "
                    : isInspectionTenant
                    ? "Yapı Denetim Portalı: "
                    : "Kurumsal Giriş Portalı: "}
                  <strong className="text-white">{tenant.name}</strong>
                </span>
              </div>
            </div>
          ) : (
            /* Standart Nexa ERP Başlığı */
            <Link href="/" className="inline-flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-blue-500 font-bold text-lg shadow-sm">
                NX
              </div>
              <div className="text-left">
                <span className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                  NEXA ERP
                  <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700/60">
                    Enterprise
                  </span>
                </span>
                <p className="text-xs text-slate-400 font-medium">
                  Müteahhit, Yapı Denetim & Franchise İşletim Sistemi
                </p>
              </div>
            </Link>
          )}
        </div>

        {/* Portal Modu Seçici Sekmeler (Eğer Tenant Belirtilmişse TAMAMEN GİZLENİR) */}
        {!shouldHideTabs && (
          <div className="grid grid-cols-3 p-1 bg-slate-900 rounded-xl border border-slate-800 mb-5 gap-1">
            <button
              type="button"
              onClick={() => {
                setLoginMode("contractor");
                setDemoTab("CONTRACTOR");
                setError("");
              }}
              className={`flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                loginMode === "contractor"
                  ? "bg-slate-800 text-white shadow-sm border border-slate-700/60"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Building2 className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">Müteahhit</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setLoginMode("inspection");
                setDemoTab("INSPECTION");
                setError("");
              }}
              className={`flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                loginMode === "inspection"
                  ? "bg-slate-800 text-white shadow-sm border border-slate-700/60"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">Yapı Denetim</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setLoginMode("franchise");
                setDemoTab("FRANCHISE");
                setError("");
              }}
              className={`flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                loginMode === "franchise"
                  ? "bg-slate-800 text-white shadow-sm border border-slate-700/60"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Store className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">Franchise</span>
            </button>
          </div>
        )}

        {/* Giriş Kartı */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 sm:p-7 shadow-lg">
          {/* Kart Başlığı */}
          <div className="mb-5 pb-4 border-b border-slate-800">
            <h2 className="text-base font-semibold text-white">
              {isFranchiseTenant || loginMode === "franchise"
                ? "Franchise Merkez & Şube Portalı"
                : loginMode === "contractor"
                ? "Müteahhit & Şantiye Portalı"
                : "Yapı Denetim & Laboratuvar Portalı"}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              {isFranchiseTenant || loginMode === "franchise"
                ? "Rollout takibi, mağaza kurulumu, şube paneli ve punch list yönetimi"
                : loginMode === "contractor"
                ? "Yönetim, şantiye şefliği, mühendislik, taşeron ve saha personeli erişimi"
                : "Bakanlık e-YİBF, saha denetimi, karot/numune ve hakediş kontrolü"}
            </p>
          </div>

          {/* Hata Bildirimi */}
          {error && (
            <div
              role="alert"
              data-testid="login-error-alert"
              className="mb-4 p-3 bg-rose-950/40 border border-rose-800/60 rounded-lg text-rose-300 text-xs flex items-center gap-2"
            >
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Giriş Formu */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* E-posta veya Kullanıcı Adı */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Kurumsal E-posta veya Kullanıcı Adı
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  type="text"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={
                    isFranchiseTenant || loginMode === "franchise"
                      ? "demo.franchise@nxerp.com.tr"
                      : loginMode === "contractor"
                      ? "demo.admin@nxerp.com.tr"
                      : "demo.denetim@nxerp.com.tr"
                  }
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 text-xs transition-colors"
                  required
                />
              </div>
            </div>

            {/* Şifre */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Şifre
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-10 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 text-xs transition-colors"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Şifreyi gizle" : "Şifreyi göster"}
                  className="absolute right-3 top-2.5 text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Giriş Butonu (Dinamik tenant.primaryColor desteği) */}
            <button
              type="submit"
              disabled={isLoading || loginSuccess}
              style={{
                backgroundColor: primaryColor,
              }}
              className="w-full mt-2 py-2.5 px-4 rounded-lg font-semibold text-xs text-white hover:brightness-110 active:brightness-95 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Kimlik Doğrulanıyor...</span>
                </>
              ) : loginSuccess ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Giriş Yapıldı, Yönlendiriliyorsunuz...</span>
                </>
              ) : (
                <>
                  <span>
                    {loginMode === "franchise"
                      ? "Franchise Portalına Giriş Yap"
                      : loginMode === "inspection"
                      ? "Yapı Denetim Portalına Giriş Yap"
                      : "Müteahhit Portalına Giriş Yap"}
                  </span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </form>

          {/* 3 Sekmeli Demo Hızlı Giriş Paneli - Tenant parametresi içeren sayfalarda tamamen gizlenir */}
          {!tenantParam && !tenant && (
            <div
              data-testid="demo-quick-login-panel"
              className="mt-6 pt-5 border-t border-slate-800/90"
            >
              <div className="flex items-center justify-between gap-2 mb-3">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-300">
                  Demo Hızlı Giriş
                </span>
                <span className="inline-flex items-center gap-1 text-[10px] text-slate-400 bg-slate-950 px-2 py-0.5 rounded-md border border-slate-800 font-mono">
                  <KeyRound className="w-3 h-3 text-blue-400" />
                  {DEMO_ACCOUNT_PASSWORD}
                </span>
              </div>

              {/* 3 İşletme Tipi Sekmesi */}
              <div
                role="tablist"
                aria-label="Demo İşletme Tipi Sekmeleri"
                className="grid grid-cols-3 gap-1 p-1 bg-slate-950 rounded-xl border border-slate-800 mb-2.5"
              >
                {DEMO_TABS.map((tab) => {
                  const isActive = demoTab === tab.type;
                  return (
                    <button
                      key={tab.type}
                      type="button"
                      role="tab"
                      aria-selected={isActive}
                      data-testid={`demo-tab-${tab.type}`}
                      onClick={() => {
                        setDemoTab(tab.type);
                        setLoginMode(
                          tab.type === "FRANCHISE"
                            ? "franchise"
                            : tab.type === "INSPECTION"
                            ? "inspection"
                            : "contractor"
                        );
                        setError("");
                      }}
                      className={`py-1.5 px-2 rounded-lg text-[11px] font-semibold transition-all cursor-pointer truncate ${
                        isActive
                          ? "bg-blue-600/20 text-blue-300 border border-blue-500/40 shadow-sm"
                          : "text-slate-400 hover:text-slate-200 border border-transparent"
                      }`}
                    >
                      {tab.label}
                    </button>
                  );
                })}
              </div>

              {activeTabMeta && (
                <p className="text-[11px] text-slate-400 mb-2.5 px-0.5">
                  {activeTabMeta.description} • Rol seçtiğinizde otomatik giriş yapılır
                </p>
              )}

              {/* Seçili İşletme Tipi Rolleri */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {visibleDemoAccounts.map((acc) => {
                  const isBtnLoading = isLoading && activeDemoKey === acc.key;
                  return (
                    <button
                      key={acc.key}
                      type="button"
                      data-testid={`demo-login-${acc.key}`}
                      disabled={isLoading || loginSuccess}
                      onClick={() => handleQuickDemoLogin(acc)}
                      className="group p-2.5 bg-slate-950/80 hover:bg-slate-800/90 border border-slate-800 hover:border-slate-700 rounded-xl text-left transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed flex items-start justify-between gap-2"
                    >
                      <div className="flex items-start gap-2.5 min-w-0">
                        <div className="mt-0.5 p-1.5 rounded-lg bg-slate-900 border border-slate-800 group-hover:border-slate-700">
                          {isBtnLoading ? (
                            <Loader2 className="w-4 h-4 text-blue-400 animate-spin shrink-0" />
                          ) : (
                            renderRoleIcon(acc.role)
                          )}
                        </div>
                        <div className="min-w-0">
                          <span className="text-xs font-semibold text-slate-100 block truncate">
                            {acc.label}
                          </span>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-900 text-slate-300 border border-slate-800 font-medium truncate">
                              {acc.shortBadge}
                            </span>
                            <span className="text-[10px] text-slate-500 font-mono truncate">
                              {acc.defaultWebRoute}
                            </span>
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Kurumsal Alt Bilgi */}
        <div className="mt-8 text-center text-xs text-slate-500">
          <span>© 2026 NEXA Software. Tüm hakları saklıdır.</span>
          <span className="mx-2">•</span>
          <Link href="/" className="hover:text-slate-300 transition-colors">
            Ana Sayfa
          </Link>
        </div>
      </div>
    </div>
  );
}
