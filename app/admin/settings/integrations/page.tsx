/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Bakanlık (YİBF/UDS) ve Dış Sistem Entegrasyonları Ayar Ekranı
 * AES-256 Güvenli Şifreleme ile E-Devlet Kimlik Bilgisi Yönetimi
 */

"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Building2,
  ShieldCheck,
  Lock,
  KeyRound,
  Eye,
  EyeOff,
  RefreshCw,
  Save,
  CheckCircle2,
  AlertTriangle,
  Bot,
  ExternalLink,
  Cloud,
  FileText,
  Clock,
  Sparkles,
  ArrowRight,
  ChevronRight
} from "lucide-react";
import { toast } from "react-hot-toast";
import TwoFactorModal from "@/components/rpa/TwoFactorModal";

export default function IntegrationsSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testingRpa, setTestingRpa] = useState(false);

  // Form State
  const [tcKimlik, setTcKimlik] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isActive, setIsActive] = useState(true);
  const [autoSync, setAutoSync] = useState("DAILY");
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  // 2FA Modal State (Adım 4)
  const [twoFactorModalOpen, setTwoFactorModalOpen] = useState(false);
  const [activeSessionId, setActiveSessionId] = useState("");

  // Load existing settings
  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/integrations/yibf");
      if (res.ok) {
        const data = await res.json();
        setTcKimlik(data.tcKimlik || "");
        setIsActive(data.isActive !== undefined ? data.isActive : true);
        setAutoSync(data.autoSync || "DAILY");
        if (data.hasPassword) {
          setPassword("••••••••••••");
        }
        if (data.lastUpdated) {
          setLastUpdated(new Date(data.lastUpdated).toLocaleDateString("tr-TR"));
        }
      }
    } catch (err) {
      console.error("fetchSettings err:", err);
      toast.error("Entegrasyon ayarları yüklenemedi.");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const res = await fetch("/api/admin/integrations/yibf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tcKimlik,
          password: password.includes("•") ? undefined : password,
          isActive,
          autoSync,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success("E-Devlet bilgileri AES-256 ile şifrelenerek kaydedildi!", {
          icon: "🔒",
        });
        fetchSettings();
      } else {
        toast.error(data.error || "Ayarlar kaydedilemedi.");
      }
    } catch (err) {
      toast.error("Bağlantı hatası oluştu.");
    } finally {
      setSaving(false);
    }
  };

  // Test RPA Sync and trigger 2FA Modal (Adım 4)
  const handleTestRpa = async () => {
    setTestingRpa(true);
    try {
      const res = await fetch("/api/yibf/rpa-sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        if (data.requiresTwoFactor || data.status === "AWAITING_2FA") {
          setActiveSessionId(data.sessionId);
          setTwoFactorModalOpen(true);
        } else {
          toast.success("YİBF verileri başarıyla senkronize edildi!", { icon: "✅" });
        }
      } else {
        toast.error(data.error || "RPA botu başlatılamadı.");
      }
    } catch (err) {
      toast.error("RPA servisine ulaşılamadı.");
    } finally {
      setTestingRpa(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white selection:bg-cyan-500/30 p-4 sm:p-8">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Breadcrumb & Navigation */}
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
          <Link href="/admin" className="hover:text-white transition-colors">
            Yönetim
          </Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <Link href="/admin/ayarlar" className="hover:text-white transition-colors">
            Ayarlar
          </Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-cyan-400">Bakanlık (YİBF/UDS) Entegrasyonu</span>
        </div>

        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-cyan-400 tracking-wider uppercase mb-1">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
              <span>Dış Sistemler & Resmi Kurum Köprüleri</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white flex items-center gap-3">
              <Building2 className="w-8 h-8 text-cyan-400" />
              <span>Bakanlık (YİBF/UDS) Entegrasyonu</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Çevre ve Şehircilik Bakanlığı e-YİBF sistemine E-Devlet 2FA destekli otonom RPA bağlantısı
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/samples"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 transition-all hover:border-cyan-500/50"
            >
              <span>Karot & Numuneler</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* MAIN INTEGRATION CARD: Bakanlık (YİBF/UDS) Entegrasyonu (Adım 3) */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
          <div className="absolute right-0 top-0 w-80 h-80 bg-cyan-600/5 rounded-full blur-3xl pointer-events-none" />

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-red-600/20 to-red-950/40 border border-red-500/40 text-red-400 flex items-center justify-center shadow-lg">
                <Bot className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold text-white">Çevre ve Şehircilik Bakanlığı (e-YİBF Botu)</h2>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                    2FA ETKİLEŞİMLİ RPA
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Ulusal Yapı Denetim Sistemi (UDS) şantiye verilerini, ruhsat vizelerini ve yapı alanlarını otomatik senkronize eder.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">Entegrasyon Durumu:</span>
              <span
                className={`px-3 py-1 rounded-full text-xs font-bold ${
                  isActive
                    ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                    : "bg-slate-800 text-slate-400"
                }`}
              >
                {isActive ? "Aktif" : "Devre Dışı"}
              </span>
            </div>
          </div>

          {/* Form Content */}
          <form onSubmit={handleSave} className="mt-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* TC Kimlik No */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2">
                  Yetkili Denetçi / Kurum T.C. Kimlik No *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <KeyRound className="w-4 h-4 text-cyan-400" />
                  </div>
                  <input
                    type="text"
                    maxLength={11}
                    value={tcKimlik}
                    onChange={(e) => setTcKimlik(e.target.value)}
                    placeholder="11 haneli T.C. Kimlik Numarası"
                    className="w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500 text-sm font-mono tracking-wide shadow-inner"
                    required
                  />
                </div>
                <p className="text-[11px] text-slate-500 mt-1.5">
                  E-Devlet kapısına giriş yapacak yetkili yapı denetçisinin kimlik numarası.
                </p>
              </div>

              {/* E-Devlet Şifresi */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2">
                  E-Devlet Giriş Şifresi *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <Lock className="w-4 h-4 text-cyan-400" />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="E-Devlet Şifresi"
                    className="w-full pl-10 pr-11 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500 text-sm font-mono tracking-wide shadow-inner"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500 hover:text-slate-300 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-[11px] text-slate-500 mt-1.5">
                  Şifreniz AES-256 ile anında şifrelenir, veritabanında asla düz metin saklanmaz.
                </p>
              </div>
            </div>

            {/* Sync Settings */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2">
                  Otomatik Senkronizasyon Periyodu
                </label>
                <select
                  value={autoSync}
                  onChange={(e) => setAutoSync(e.target.value)}
                  className="w-full px-3.5 py-3 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-cyan-500"
                >
                  <option value="MANUAL">Yalnızca Manuel (Butonla)</option>
                  <option value="DAILY">Her Gece 02:00 (Otomatik Güncelle)</option>
                  <option value="HOURLY">Her 6 Saatte Bir</option>
                  <option value="WEEKLY">Haftalık (Pazartesi Günleri)</option>
                </select>
              </div>

              <div className="flex items-center justify-between p-4 bg-slate-950 rounded-xl border border-slate-800">
                <div>
                  <div className="text-sm font-semibold text-white">Botun Çalışmasına İzin Ver</div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    Aktif edildiğinde YİBF kontrol panellerinde otomatik tetiklenebilir
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-600" />
                </label>
              </div>
            </div>

            {/* Security Notice Callout (Adım 3) */}
            <div className="p-4 bg-gradient-to-r from-cyan-950/40 via-slate-950 to-blue-950/30 border border-cyan-800/40 rounded-2xl flex items-start gap-3.5">
              <ShieldCheck className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
              <div className="text-xs leading-relaxed text-slate-300">
                <strong className="text-cyan-300 font-semibold block mb-0.5">
                  AES-256 Askeri Düzey Donanımsal Şifreleme Standardı:
                </strong>
                Girdiğiniz e-Devlet şifresi ve T.C. kimlik numarası veritabanında asla düz metin olarak tutulmaz.
                Sistem şifreleme anahtarı (Hardware Enclave / Secret Vault) ile şifrelenir ve sadece yetkili
                Playwright RPA oturumu başlatılırken hafızada geçici olarak çözülür.
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-800">
              <div className="text-xs text-slate-500">
                {lastUpdated ? `Son güncelleme: ${lastUpdated}` : "Henüz kimlik bilgisi kaydedilmedi"}
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto">
                {/* 2FA Etkileşimli Test Butonu */}
                <button
                  type="button"
                  onClick={handleTestRpa}
                  disabled={testingRpa}
                  className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-cyan-500/30 transition-all active:scale-95 disabled:opacity-50"
                >
                  <Bot className={`w-4 h-4 text-cyan-400 ${testingRpa ? "animate-spin" : ""}`} />
                  <span>{testingRpa ? "RPA Başlatılıyor..." : "Bağlantıyı Test Et (2FA)"}</span>
                </button>

                {/* Kaydet Butonu */}
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white shadow-lg shadow-blue-500/20 active:scale-95 transition-all disabled:opacity-50"
                >
                  {saving ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Kaydediliyor...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>AES-256 ile Kaydet</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* Supplementary External Integration Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Google Drive / Bulut Belge Arşivi */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-3">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center">
                <Cloud className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-400">
                BULUT ARŞİV
              </span>
            </div>
            <h3 className="text-base font-bold text-white">Google Drive / Bulut Doküman Deposu</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Resmi yapı ruhsatları, statik hesap raporları ve karot kırım tutanaklarının otomatik yedeklenmesi.
            </p>
            <div className="pt-2">
              <Link
                href="/admin/ayarlar"
                className="inline-flex items-center gap-1.5 text-xs text-cyan-400 hover:text-cyan-300 font-semibold"
              >
                <span>Klasör Ayarlarını Düzenle</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Meteoroloji Genel Müdürlüğü (MGM) Hava Durumu */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-3">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-amber-600/20 text-amber-400 flex items-center justify-center">
                <Sparkles className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400">
                BAĞLI (API)
              </span>
            </div>
            <h3 className="text-base font-bold text-white">MGM Şantiye Hava Durumu Servisi</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Beton döküm günlerinde don riski ve aşırı sıcaklık uyarıları şantiye koordinatlarına göre otonom çekilir.
            </p>
            <div className="pt-2">
              <span className="text-xs text-slate-500 font-mono">OpenWeather & MGM Sensor Bridge v1.2</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2FA Pop-up Modal (Adım 4) */}
      <TwoFactorModal
        isOpen={twoFactorModalOpen}
        onClose={() => setTwoFactorModalOpen(false)}
        sessionId={activeSessionId}
        onSuccess={() => {
          toast.success("RPA Botu E-Devlet üzerinden verileri başarıyla senkronize etti!");
        }}
      />
    </div>
  );
}
