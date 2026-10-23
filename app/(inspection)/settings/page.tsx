/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Yapı Denetim Kuruluşu & Sistem Ayarları (Yapı Denetim Modülü)
 */

"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Settings,
  Building,
  ShieldCheck,
  Bot,
  Bell,
  KeyRound,
  Save,
  CheckCircle2,
  Lock,
  Smartphone,
  ExternalLink
} from "lucide-react";
import { toast } from "react-hot-toast";

export default function InspectionSettingsPage() {
  const [companyInfo, setCompanyInfo] = useState({
    name: "NEXA Uluslararası Yapı Denetim Ltd. Şti.",
    licenseNo: "YDK-34-1842",
    taxNo: "6310842194",
    chamberNo: "IMO-34881",
    email: "denetim@nexa.com",
    phone: "+90 (216) 555 48 00",
    address: "Bağdat Caddesi No:284 D:6 Kadıköy / İstanbul"
  });

  const [botSettings, setBotSettings] = useState({
    autoSyncInterval: "30",
    enable2faAutoPrompt: true,
    autoApprovePassedTests: true,
    notifyEngineersOnSms: true
  });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("Yapı Denetim Kuruluş Ayarları Kaydedildi!", { icon: "💾" });
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-5xl mx-auto">
      {/* Üst Başlık */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800/80 pb-5">
        <div>
          <div className="flex items-center gap-2 text-blue-400 text-xs font-semibold uppercase tracking-wider mb-1">
            <Settings className="w-4 h-4" />
            <span>Sistem & Kuruluş Konfigürasyonu</span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Yapı Denetim Ayarları</h1>
          <p className="text-slate-400 text-sm mt-0.5">
            Bakanlık lisans bilgileri, e-YİBF bot parametreleri ve saha denetçi bildirim kuralları
          </p>
        </div>

        <Link
          href="/settings/notifications"
          className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-medium border border-slate-700 transition cursor-pointer self-start sm:self-auto"
        >
          <Bell className="w-4 h-4 text-amber-400" />
          <span>Bildirim Tercihleri</span>
        </Link>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Kuruluş Resmi Lisans Bilgileri */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 space-y-4">
          <div className="flex items-center gap-2 text-white font-semibold text-sm border-b border-slate-800/80 pb-3">
            <Building className="w-4 h-4 text-blue-400" />
            <span>Yapı Denetim Kuruluşu Resmi Kayıtları (4708 Sayılı Kanun)</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-slate-400 font-medium mb-1">Kuruluş Ünvanı</label>
              <input
                type="text"
                value={companyInfo.name}
                onChange={(e) => setCompanyInfo({ ...companyInfo, name: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-slate-400 font-medium mb-1">Bakanlık İzin Belge No</label>
              <input
                type="text"
                value={companyInfo.licenseNo}
                onChange={(e) => setCompanyInfo({ ...companyInfo, licenseNo: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 font-mono focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-slate-400 font-medium mb-1">Vergi Kimlik No / Dairesi</label>
              <input
                type="text"
                value={companyInfo.taxNo}
                onChange={(e) => setCompanyInfo({ ...companyInfo, taxNo: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 font-mono focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-slate-400 font-medium mb-1">İletişim E-Postası</label>
              <input
                type="email"
                value={companyInfo.email}
                onChange={(e) => setCompanyInfo({ ...companyInfo, email: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        {/* e-YİBF Bot & RPA Entegrasyon Ayarları */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 space-y-4">
          <div className="flex items-center gap-2 text-white font-semibold text-sm border-b border-slate-800/80 pb-3">
            <Bot className="w-4 h-4 text-emerald-400" />
            <span>e-YİBF RPA Otomasyon ve Senkronizasyon Tercihleri</span>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between py-2 border-b border-slate-800/60">
              <div>
                <div className="font-semibold text-white">Periyodik Otomatik e-YİBF Taraması</div>
                <div className="text-slate-400 text-[11px]">Bakanlık portalındaki yeni yapı atamalarını arka planda çeker</div>
              </div>
              <select
                value={botSettings.autoSyncInterval}
                onChange={(e) => setBotSettings({ ...botSettings, autoSyncInterval: e.target.value })}
                className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-slate-200 focus:outline-none focus:border-blue-500"
              >
                <option value="15">Her 15 Dakikada Bir</option>
                <option value="30">Her 30 Dakikada Bir</option>
                <option value="60">Her 1 Saatte Bir</option>
                <option value="0">Manuel (Sadece Düğmeyle)</option>
              </select>
            </div>

            <div className="flex items-center justify-between py-2 border-b border-slate-800/60">
              <div>
                <div className="font-semibold text-white">SMS İki Aşamalı Doğrulama (2FA) Otomatik Modalı</div>
                <div className="text-slate-400 text-[11px]">e-Devlet SMS kodu geldiğinde ekranda popup açar</div>
              </div>
              <input
                type="checkbox"
                checked={botSettings.enable2faAutoPrompt}
                onChange={(e) => setBotSettings({ ...botSettings, enable2faAutoPrompt: e.target.checked })}
                className="w-4 h-4 text-blue-600 rounded bg-slate-950 border-slate-800 cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between py-2">
              <div>
                <div className="font-semibold text-white">Numune Kırım Başarısında Otomatik Vize Bildirimi</div>
                <div className="text-slate-400 text-[11px]">28 günlük kırım dayanımı ≥ hedef olduğunda mühendise haber verilir</div>
              </div>
              <input
                type="checkbox"
                checked={botSettings.autoApprovePassedTests}
                onChange={(e) => setBotSettings({ ...botSettings, autoApprovePassedTests: e.target.checked })}
                className="w-4 h-4 text-blue-600 rounded bg-slate-950 border-slate-800 cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Kaydet Butonu */}
        <div className="flex justify-end">
          <button
            type="submit"
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md transition cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>Ayarları Kaydet</span>
          </button>
        </div>
      </form>
    </div>
  );
}
