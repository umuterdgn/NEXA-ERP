"use client";

/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Nexa ERP - Kurumsal B2B Enterprise Giriş Terminali
 * Çift Modlu: Müteahhit & Şantiye Portalı / Yapı Denetim Kuruluşu Portalı
 * Minimalist, dikkat dağıtmayan, güven veren kurumsal kimlik.
 */

import React, { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
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
} from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [loginMode, setLoginMode] = useState<"contractor" | "inspection">("contractor");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [loginSuccess, setLoginSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Lütfen e-posta / kullanıcı adı ve şifrenizi giriniz.");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const result = await signIn("credentials", {
        email: email.trim(),
        password: password,
        redirect: false,
      });

      if (result?.error) {
        setError("Geçersiz e-posta veya şifre. Lütfen bilgilerinizi kontrol ediniz.");
        setIsLoading(false);
        return;
      }

      setLoginSuccess(true);

      // Kullanıcı oturumundaki role bilgisine göre KESİN DİNAMİK YÖNLENDİRME (Adım 1)
      let targetPath = "/admin";
      try {
        const sessionRes = await fetch("/api/auth/session");
        if (sessionRes.ok) {
          const sessionData = await sessionRes.json();
          const role = (sessionData?.user?.role as string)?.toUpperCase() || "";

          switch (role) {
            // 1. INSPECTION_ADMIN veya INSPECTOR (Yapı Denetim) ➔ /inspection/dashboard
            case "INSPECTION_ADMIN":
            case "INSPECTOR":
            case "AUDITOR":
              targetPath = "/inspection/dashboard";
              break;

            // 2. SUBCONTRACTOR ➔ /subcontractor
            case "SUBCONTRACTOR":
              targetPath = "/subcontractor";
              break;

            // 3. ENGINEER, SITE_MANAGER veya PERSONNEL ➔ /personnel/dashboard
            case "ENGINEER":
            case "SITE_MANAGER":
            case "PERSONNEL":
            case "STAFF":
            case "WORKER":
              targetPath = "/personnel/dashboard";
              break;

            // 4. SUPPLIER ➔ /supplier
            case "SUPPLIER":
              targetPath = "/supplier";
              break;

            // 5. Departman Yöneticileri
            case "HR_MANAGER":
              targetPath = "/admin/personel";
              break;
            case "FINANCE_MANAGER":
              targetPath = "/admin/finance";
              break;
            case "PROCUREMENT_MANAGER":
              targetPath = "/admin/procurement";
              break;
            case "EQUIPMENT_MANAGER":
              targetPath = "/admin/equipments";
              break;
            case "ISG_EXPERT":
              targetPath = "/admin/personel/alerts";
              break;

            // 6. ADMIN veya MANAGER ➔ /admin
            case "ADMIN":
            case "SUPER_ADMIN":
            case "MANAGER":
            case "PROJECT_MANAGER":
            case "MUTEAHHIT":
            default:
              targetPath = "/admin";
              break;
          }
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
    }
  };

  const handleQuickDemo = (demoType: "admin" | "site_manager" | "engineer" | "subcontractor" | "worker" | "inspector" | "inspection_admin") => {
    setError("");
    if (demoType === "admin") {
      setLoginMode("contractor");
      setEmail("admin@nexa.com");
      setPassword("demo123");
    } else if (demoType === "site_manager") {
      setLoginMode("contractor");
      setEmail("sef@nexa.com");
      setPassword("demo123");
    } else if (demoType === "engineer") {
      setLoginMode("contractor");
      setEmail("muhendis@nexa.com");
      setPassword("demo123");
    } else if (demoType === "subcontractor") {
      setLoginMode("contractor");
      setEmail("taseron@nexa.com");
      setPassword("demo123");
    } else if (demoType === "worker") {
      setLoginMode("contractor");
      setEmail("personel@nexa.com");
      setPassword("demo123");
    } else if (demoType === "inspector") {
      setLoginMode("inspection");
      setEmail("denetci@nexa.com");
      setPassword("demo123");
    } else if (demoType === "inspection_admin") {
      setLoginMode("inspection");
      setEmail("denetim@nexa.com");
      setPassword("demo123");
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center px-4 py-10 selection:bg-blue-600 selection:text-white">
      {/* Ana Form Konteyneri */}
      <div className="w-full max-w-md">
        {/* Kurumsal Logo & Başlık */}
        <div className="text-center mb-8">
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
              <p className="text-xs text-slate-400 font-medium">İnşaat & Yapı Denetim Yönetim Sistemi</p>
            </div>
          </Link>
        </div>

        {/* Portal Modu Seçici (Kurumsal Segmented Control) */}
        <div className="grid grid-cols-2 p-1 bg-slate-900 rounded-xl border border-slate-800 mb-5">
          <button
            type="button"
            onClick={() => {
              setLoginMode("contractor");
              setError("");
            }}
            className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              loginMode === "contractor"
                ? "bg-slate-800 text-white shadow-sm border border-slate-700/60"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>Müteahhit / Şantiye</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setLoginMode("inspection");
              setError("");
            }}
            className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              loginMode === "inspection"
                ? "bg-slate-800 text-white shadow-sm border border-slate-700/60"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Yapı Denetim Portalı</span>
          </button>
        </div>

        {/* Giriş Kartı */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 sm:p-7 shadow-lg">
          {/* Kart Başlığı */}
          <div className="mb-5 pb-4 border-b border-slate-800">
            <h2 className="text-base font-semibold text-white">
              {loginMode === "contractor" ? "Müteahhit Girişi" : "Yapı Denetim Girişi"}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              {loginMode === "contractor"
                ? "Yönetim, şantiye şefliği, taşeron ve saha personeli erişimi"
                : "Bakanlık e-YİBF, numune denetimi ve hakediş kontrolü"}
            </p>
          </div>

          {/* Hata Bildirimi */}
          {error && (
            <div className="mb-4 p-3 bg-rose-950/40 border border-rose-800/60 rounded-lg text-rose-300 text-xs flex items-center gap-2">
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
                    loginMode === "contractor"
                      ? "admin@nexa.com veya kullanici.adi"
                      : "denetim@nexa.com veya denetim.patron@nexa.com"
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
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Giriş Butonu (Geçişsiz Kurumsal Mavi) */}
            <button
              type="submit"
              disabled={isLoading || loginSuccess}
              className="w-full mt-2 py-2.5 px-4 rounded-lg font-semibold text-xs text-white bg-blue-700 hover:bg-blue-800 active:bg-blue-900 transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
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
                  <span>{loginMode === "contractor" ? "Müteahhit Portalına Giriş Yap" : "Yapı Denetim Portalına Giriş Yap"}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </form>

          {/* Hızlı Demo Hesapları */}
          <div className="mt-6 pt-4 border-t border-slate-800">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block mb-2.5 text-center">
              Kurumsal Test Hesapları
            </span>

            {loginMode === "contractor" ? (
              <div className="grid grid-cols-2 gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => handleQuickDemo("admin")}
                  className="p-2 bg-slate-950/70 hover:bg-slate-800 border border-slate-800 rounded-lg text-slate-300 hover:text-white transition-colors text-left flex items-center gap-2"
                >
                  <Building2 className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                  <span className="truncate">Yönetici (Admin)</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickDemo("engineer")}
                  className="p-2 bg-slate-950/70 hover:bg-slate-800 border border-slate-800 rounded-lg text-slate-300 hover:text-white transition-colors text-left flex items-center gap-2"
                >
                  <HardHat className="w-3.5 h-3.5 text-orange-400 shrink-0" />
                  <span className="truncate">Saha Mühendisi</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickDemo("site_manager")}
                  className="p-2 bg-slate-950/70 hover:bg-slate-800 border border-slate-800 rounded-lg text-slate-300 hover:text-white transition-colors text-left flex items-center gap-2"
                >
                  <HardHat className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span className="truncate">Şantiye Şefi</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickDemo("subcontractor")}
                  className="p-2 bg-slate-950/70 hover:bg-slate-800 border border-slate-800 rounded-lg text-slate-300 hover:text-white transition-colors text-left flex items-center gap-2"
                >
                  <Briefcase className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                  <span className="truncate">Taşeron Portalı</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickDemo("worker")}
                  className="p-2 bg-slate-950/70 hover:bg-slate-800 border border-slate-800 rounded-lg text-slate-300 hover:text-white transition-colors text-left flex items-center gap-2 col-span-2 sm:col-span-1"
                >
                  <Users className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span className="truncate">Saha Personeli</span>
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => handleQuickDemo("inspection_admin")}
                  className="p-2.5 bg-slate-950/70 hover:bg-slate-800 border border-slate-800 rounded-lg text-slate-200 hover:text-white transition-colors flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-blue-400 shrink-0" />
                    <div>
                      <span className="font-semibold block">Yapı Denetim Patronu (Yönetici)</span>
                      <span className="text-[10px] text-slate-400">denetim.patron@nexa.com</span>
                    </div>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono border border-slate-700/50">
                    123456
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => handleQuickDemo("inspector")}
                  className="p-2.5 bg-slate-950/70 hover:bg-slate-800 border border-slate-800 rounded-lg text-slate-200 hover:text-white transition-colors flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-slate-400 shrink-0" />
                    <div>
                      <span className="font-semibold block">Saha Denetçisi (Kontrol Müh.)</span>
                      <span className="text-[10px] text-slate-400">denetim@nexa.com</span>
                    </div>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono border border-slate-700/50">
                    123456
                  </span>
                </button>
              </div>
            )}
          </div>
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