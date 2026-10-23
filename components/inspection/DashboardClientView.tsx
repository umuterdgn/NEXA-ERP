/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Yapı Denetim Portalı Dashboard İstemci Görünümü (Prisma Canlı Veri)
 */

"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Building,
  ClipboardCheck,
  AlertTriangle,
  FileText,
  TrendingUp,
  Users,
  CheckCircle,
  Clock,
  Zap,
  Lightbulb,
  Bot,
  FlaskConical,
  MapPin,
  ShieldCheck,
  Construction,
} from "lucide-react";
import { toast } from "react-hot-toast";
import TwoFactorModal from "@/components/rpa/TwoFactorModal";

interface DashboardProps {
  stats: {
    activeBuildings: number;
    totalForms: number;
    openNcrs: number;
    totalSamples: number;
  };
  recentInspections: any[];
  criticalAlerts: any[];
}

export default function DashboardClientView({
  stats,
  recentInspections,
  criticalAlerts,
}: DashboardProps) {
  const [syncingYibf, setSyncingYibf] = useState(false);
  const [twoFactorModalOpen, setTwoFactorModalOpen] = useState(false);
  const [activeRpaSessionId, setActiveRpaSessionId] = useState("");

  const handleSyncYibf = async () => {
    setSyncingYibf(true);
    try {
      const res = await fetch("/api/yibf/rpa-sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.requiresTwoFactor || data.status === "AWAITING_2FA") {
          setActiveRpaSessionId(data.sessionId);
          setTwoFactorModalOpen(true);
        } else {
          toast.success(data.message || "Bakanlık e-YİBF sistemiyle senkronize edildi!", {
            icon: "🏛️",
          });
        }
      } else {
        toast.error("YİBF senkronizasyonu başlatılamadı.");
      }
    } catch {
      toast.error("Bakanlık botuna ulaşılamadı.");
    } finally {
      setSyncingYibf(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Header */}
      <div className="bg-slate-900 border-b border-slate-800 px-6 py-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Yapı Denetim Terminali</h1>
            <p className="text-slate-400 text-sm mt-0.5">
              4708 Sayılı Kanun Kapsamında Saha Muayene & e-YİBF Yönetim Sistemi (Prisma Veritabanı)
            </p>
          </div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <Link
              href="/inspection/core-samples"
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 border border-cyan-500/30 transition-all hover:border-cyan-400"
            >
              <FlaskConical className="w-4 h-4 text-cyan-400" />
              <span>Karot & Numune</span>
            </Link>

            <button
              onClick={handleSyncYibf}
              disabled={syncingYibf}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white shadow-md active:scale-95 transition-all disabled:opacity-50 cursor-pointer"
            >
              <Bot className={`w-4 h-4 text-amber-300 ${syncingYibf ? "animate-spin" : ""}`} />
              <span>{syncingYibf ? "Senkronize Ediliyor..." : "YİBF Senkronize Et"}</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
          {/* Aktif Yapılar */}
          <Link
            href="/inspection/projects"
            className="bg-slate-900 rounded-xl border border-slate-800 p-5 hover:border-blue-500/50 transition-all shadow-sm block"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 bg-blue-600/20 rounded-lg flex items-center justify-center">
                <Building className="w-5 h-5 text-blue-400" />
              </div>
              <span className="text-xs text-blue-400 bg-blue-900/30 px-2 py-0.5 rounded-full">Prisma DB</span>
            </div>
            <h3 className="text-2xl font-bold text-white mb-0.5">{stats.activeBuildings}</h3>
            <p className="text-slate-400 text-xs">Ruhsatlı Denetim Projesi</p>
          </Link>

          {/* Gerçekleşen Kontroller */}
          <Link
            href="/inspection/forms"
            className="bg-slate-900 rounded-xl border border-slate-800 p-5 hover:border-emerald-500/50 transition-all shadow-sm block"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 bg-emerald-600/20 rounded-lg flex items-center justify-center">
                <ClipboardCheck className="w-5 h-5 text-emerald-400" />
              </div>
              <span className="text-xs text-emerald-400 bg-emerald-900/30 px-2 py-0.5 rounded-full">Onaylı</span>
            </div>
            <h3 className="text-2xl font-bold text-white mb-0.5">{stats.totalForms}</h3>
            <p className="text-slate-400 text-xs">Düzenlenen Denetim Tutanağı</p>
          </Link>

          {/* Açık DÖF & Kusurlar */}
          <Link
            href="/inspection/ncr"
            className="bg-slate-900 rounded-xl border border-slate-800 p-5 hover:border-rose-500/50 transition-all shadow-sm block"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 bg-rose-600/20 rounded-lg flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-rose-400" />
              </div>
              <span className="text-xs text-rose-400 bg-rose-900/30 px-2 py-0.5 rounded-full">Termin Bekliyor</span>
            </div>
            <h3 className="text-2xl font-bold text-rose-400 mb-0.5">{stats.openNcrs}</h3>
            <p className="text-slate-400 text-xs">Açık Uygunsuzluk & DÖF</p>
          </Link>

          {/* Karot & Numune */}
          <Link
            href="/inspection/core-samples"
            className="bg-slate-900 rounded-xl border border-slate-800 p-5 hover:border-cyan-500/50 transition-all shadow-sm block"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 bg-cyan-600/20 rounded-lg flex items-center justify-center">
                <FlaskConical className="w-5 h-5 text-cyan-400" />
              </div>
              <span className="text-xs text-cyan-400 bg-cyan-900/30 px-2 py-0.5 rounded-full">Kırım Takip</span>
            </div>
            <h3 className="text-2xl font-bold text-white mb-0.5">{stats.totalSamples}</h3>
            <p className="text-slate-400 text-xs">Kayıtlı Beton Numunesi</p>
          </Link>
        </div>

        {/* İstatistikler ve Son Tutanaklar */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Son Tutanaklar Tablosu */}
          <div className="lg:col-span-2 bg-slate-900 rounded-xl border border-slate-800 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-400" />
                <span>Son Düzenlenen Denetim Tutanakları</span>
              </h2>
              <Link
                href="/inspection/forms"
                className="text-xs text-blue-400 hover:text-blue-300 font-semibold"
              >
                Tümünü Gör →
              </Link>
            </div>

            <div className="space-y-2.5">
              {recentInspections.map((f: any) => (
                <div
                  key={f.id}
                  className="flex items-center justify-between p-3 bg-slate-950/70 rounded-lg border border-slate-800/80 hover:border-slate-700 transition"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-white font-medium text-xs truncate">
                      {f.formData?.title || f.formType}
                    </p>
                    <p className="text-slate-400 text-[11px] truncate mt-0.5">
                      {f.project?.title || f.project?.name || "Proje"} • Denetçi: {f.inspector?.name || "Denetçi"}
                    </p>
                  </div>

                  <div className="flex items-center gap-2.5 shrink-0 ml-3">
                    <span className="text-[11px] text-slate-400">
                      {new Date(f.createdAt).toLocaleDateString("tr-TR")}
                    </span>
                    {f.isPassed ? (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950/80 text-emerald-400 border border-emerald-800">
                        UYGUN
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-950/80 text-rose-400 border border-rose-800">
                        KUSURLU
                      </span>
                    )}
                  </div>
                </div>
              ))}

              {recentInspections.length === 0 && (
                <div className="py-8 text-center text-slate-500 text-xs">
                  Henüz denetim tutanağı kaydedilmemiş.
                </div>
              )}
            </div>
          </div>

          {/* Kritik Uyarılar & DÖF */}
          <div className="bg-slate-900 rounded-xl border border-slate-800 p-5 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-400" />
                  <span>Kritik DÖF & Kusurlar</span>
                </h2>
                <Link
                  href="/inspection/ncr"
                  className="text-xs text-rose-400 hover:text-rose-300 font-semibold"
                >
                  DÖF Paneli →
                </Link>
              </div>

              <div className="space-y-2.5">
                {criticalAlerts.map((n: any) => (
                  <div
                    key={n.id}
                    className="p-3 rounded-lg border border-rose-900/50 bg-rose-950/20 text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[10px] font-bold text-rose-300">
                        {n.reportNo}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        Termin: {new Date(n.deadline).toLocaleDateString("tr-TR")}
                      </span>
                    </div>
                    <p className="text-slate-200 line-clamp-2">{n.description}</p>
                    <div className="text-[10px] text-slate-400 pt-0.5">
                      Proje: {n.project?.title || n.project?.name || "Bilinmiyor"}
                    </div>
                  </div>
                ))}

                {criticalAlerts.length === 0 && (
                  <div className="py-8 text-center text-slate-500 text-xs">
                    Aktif açık kusur kaydı bulunmuyor.
                  </div>
                )}
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800">
              <Link
                href="/inspection/ncr"
                className="w-full py-2 rounded-lg bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-700/50 text-xs font-semibold block text-center transition"
              >
                Yeni Uygunsuzluk / DÖF Tutanağı Aç
              </Link>
            </div>
          </div>
        </div>

        {/* Hızlı Erişim Butonları */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Link
            href="/yibf"
            className="bg-blue-600 hover:bg-blue-500 text-white p-4 rounded-xl transition-all flex items-center gap-3 font-semibold text-xs shadow-md"
          >
            <Building className="w-5 h-5 shrink-0" />
            <span>Bakanlık e-YİBF Sistemi</span>
          </Link>

          <Link
            href="/inspection/forms"
            className="bg-emerald-600 hover:bg-emerald-500 text-white p-4 rounded-xl transition-all flex items-center gap-3 font-semibold text-xs shadow-md"
          >
            <ClipboardCheck className="w-5 h-5 shrink-0" />
            <span>Yeni Tutanak Başlat</span>
          </Link>

          <Link
            href="/inspection/reinforcement"
            className="bg-amber-600 hover:bg-amber-500 text-white p-4 rounded-xl transition-all flex items-center gap-3 font-semibold text-xs shadow-md"
          >
            <Construction className="w-5 h-5 shrink-0" />
            <span>Demir & Kalıp Kontrol</span>
          </Link>

          <Link
            href="/reports"
            className="bg-purple-600 hover:bg-purple-500 text-white p-4 rounded-xl transition-all flex items-center gap-3 font-semibold text-xs shadow-md"
          >
            <FileText className="w-5 h-5 shrink-0" />
            <span>Resmi PDF Raporlama</span>
          </Link>
        </div>
      </div>

      <TwoFactorModal
        isOpen={twoFactorModalOpen}
        onClose={() => setTwoFactorModalOpen(false)}
        sessionId={activeRpaSessionId}
        onSuccess={() => {
          toast.success("e-YİBF Oturumu Doğrulandı!", { icon: "✅" });
          setTwoFactorModalOpen(false);
        }}
      />
    </div>
  );
}
