"use client";

/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * White-Label (Firmaya Özel) Multi-Tenant Login İstemci Bileşeni
 * 
 * Özellikler:
 * - Müteahhit/Denetim sekme seçicileri tamamen kaldırılmıştır (Tekil ve sade giriş).
 * - Firmanın kendi kurumsal logoUrl ve themeColor renk kodunu dinamik uygular.
 * - Arka planda gizlice companyId değerini kimlik doğrulama payload'una ekler.
 */

import React, { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Mail,
  Lock,
  ArrowRight,
  Eye,
  EyeOff,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Building2,
  Shield,
} from "lucide-react";

interface TenantCompany {
  id: string;
  name: string;
  slug: string | null;
  logoUrl: string | null;
  themeColor: string | null;
  companyType?: string | null;
}

interface TenantLoginClientProps {
  company: TenantCompany;
}

export default function TenantLoginClient({ company }: TenantLoginClientProps) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [loginSuccess, setLoginSuccess] = useState(false);

  // Firmanın özel kurumsal rengi (Varsayılan: Güven veren kurumsal lacivert #1d4ed8)
  const brandColor = company.themeColor?.trim() || "#1d4ed8";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Lütfen e-posta / kullanıcı adı ve şifrenizi giriniz.");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      // Kimlik doğrulama isteğine gizlice companyId değerini ekle
      const result = await signIn("credentials", {
        email: email.trim(),
        password: password,
        companyId: company.id, // Çoklu Kiracı (Tenant) İzolasyon Kilidi
        redirect: false,
      });

      if (result?.error) {
        setError("Geçersiz e-posta veya şifre, ya da hesabınız bu kurumsal firmaya yetkili değil.");
        setIsLoading(false);
        return;
      }

      setLoginSuccess(true);

      // Kullanıcının rolüne göre doğru portala yönlendir
      let targetPath = "/admin";
      try {
        const sessionRes = await fetch("/api/auth/session");
        if (sessionRes.ok) {
          const sessionData = await sessionRes.json();
          const role = ((sessionData?.user?.role as string) || "").toUpperCase();

          if (role === "DRIVER") {
            targetPath = "/personnel";
          } else if (role === "SECURITY") {
            targetPath = "/admin/procurement/logistics";
          } else if (role === "WORKER" || role === "STAFF") {
            targetPath = "/personnel";
          } else if (role === "INSPECTION_ADMIN" || role === "INSPECTOR" || role === "AUDITOR") {
            targetPath = "/dashboard";
          } else if (role === "SUBCONTRACTOR") {
            targetPath = "/subcontractor";
          } else if (role === "SUPPLIER") {
            targetPath = "/supplier";
          } else if (role === "HR_MANAGER") {
            targetPath = "/admin/personel";
          } else if (role === "FINANCE_MANAGER") {
            targetPath = "/admin/finance";
          } else if (role === "PROCUREMENT_MANAGER") {
            targetPath = "/admin/procurement";
          } else if (role === "EQUIPMENT_MANAGER") {
            targetPath = "/admin/equipments";
          } else if (role === "ISG_EXPERT") {
            targetPath = "/admin/personel/alerts";
          } else if (role === "SUPER_ADMIN" || role === "ADMIN") {
            targetPath = "/admin";
          } else {
            targetPath = "/admin";
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

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center px-4 py-10 selection:bg-blue-600 selection:text-white">
      <div className="w-full max-w-md">
        {/* Giriş Kartı */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-7 sm:p-8 shadow-xl">
          {/* 1. Firmanın Kurumsal Logosu & Başlığı (Nexa ERP yerine firmanın kendi kimliği) */}
          <div className="text-center mb-6 pb-6 border-b border-slate-800 flex flex-col items-center">
            {company.logoUrl ? (
              <div className="mb-3 max-h-16 flex items-center justify-center p-2 rounded-xl bg-slate-950/60 border border-slate-800/80">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={company.logoUrl}
                  alt={company.name}
                  className="max-h-12 max-w-[220px] object-contain"
                />
              </div>
            ) : (
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center text-white font-black text-xl mb-3 shadow-md"
                style={{ backgroundColor: brandColor }}
              >
                {company.name.substring(0, 2).toUpperCase()}
              </div>
            )}

            <h1 className="text-lg font-bold text-white tracking-tight">{company.name}</h1>
            <p className="text-xs text-slate-400 mt-0.5">Kurumsal Yönetim & Şantiye Portalı</p>
          </div>

          {/* Hata Bildirimi */}
          {error && (
            <div className="mb-4 p-3 bg-rose-950/40 border border-rose-800/60 rounded-lg text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* 2. Sadeleştirilmiş Login Formu (Sadece E-Posta ve Şifre) */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* E-Posta veya Kullanıcı Adı */}
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
                  placeholder="ad.soyad@firma.com veya kullanici.adi"
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-1 text-xs transition-colors"
                  style={{
                    borderColor: "var(--tw-border-opacity)",
                  }}
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
                  className="w-full pl-9 pr-10 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-1 text-xs transition-colors"
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

            {/* Giriş Butonu (Firmanın Kendi themeColor Renginde) */}
            <button
              type="submit"
              disabled={isLoading || loginSuccess}
              style={{ backgroundColor: brandColor }}
              className="w-full mt-3 py-3 px-4 rounded-lg font-semibold text-xs text-white hover:opacity-95 active:opacity-90 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>Kimlik Doğrulanıyor...</span>
                </>
              ) : loginSuccess ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-white" />
                  <span>Giriş Başarılı, Yönlendiriliyorsunuz...</span>
                </>
              ) : (
                <>
                  <span>Giriş Yap</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </form>

          {/* Güvenlik Rozeti ve Kiracı Kodu */}
          <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
            <div className="flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-emerald-400" />
              <span>Multi-Tenant Güvenli Giriş</span>
            </div>
            <span className="font-mono text-[10px] bg-slate-950 px-2 py-0.5 rounded border border-slate-800 text-slate-400">
              TENANT: {company.slug || company.id.substring(0, 8)}
            </span>
          </div>
        </div>

        {/* Kurumsal Alt Bilgi */}
        <div className="mt-8 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
          <span>Powered by</span>
          <span className="font-semibold text-slate-400">NEXA ERP</span>
          <span>•</span>
          <Link href="/login" className="text-slate-400 hover:text-slate-200 transition-colors">
            Genel Portal
          </Link>
        </div>
      </div>
    </div>
  );
}
