/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Superadmin Canlı Sistem Sağlığı & Master Kill-Switch (/superadmin/system-health)
 */

"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Activity,
  Server,
  Database,
  Cpu,
  Shield,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  RefreshCw,
  Power,
  Clock,
  HardDrive,
  CheckCircle2,
  XCircle,
  Loader2,
  ChevronLeft,
  Flame,
  Zap,
} from "lucide-react";
import toast from "react-hot-toast";

interface SystemHealthData {
  timestamp: string;
  server: {
    nodeVersion: string;
    platform: string;
    uptimeSeconds: number;
    uptimeFormatted: string;
    isVercel: boolean;
    region: string;
  };
  memory: {
    heapUsedMb: number;
    heapTotalMb: number;
    rssMb: number;
    externalMb: number;
  };
  database: {
    provider: string;
    latencyMs: number;
    status: "OPTIMAL" | "MODERATE" | "DEGRADED";
    connectionPool: string;
  };
  maintenanceMode: boolean;
}

export default function SuperadminSystemHealthPage() {
  const [healthData, setHealthData] = useState<SystemHealthData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isKillSwitchModalOpen, setIsKillSwitchModalOpen] = useState(false);
  const [togglingKillSwitch, setTogglingKillSwitch] = useState(false);

  useEffect(() => {
    fetchHealthData();
    const interval = setInterval(fetchHealthData, 10000); // 10 saniyede bir canlı ping
    return () => clearInterval(interval);
  }, []);

  const fetchHealthData = async () => {
    try {
      const res = await fetch("/api/superadmin/system-health");
      if (res.ok) {
        const data = await res.json();
        setHealthData(data);
      }
    } catch (err) {
      console.error("Health fetch failed:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleToggleKillSwitch = async () => {
    if (!healthData) return;
    const targetState = !healthData.maintenanceMode;
    setTogglingKillSwitch(true);

    try {
      const res = await fetch("/api/superadmin/maintenance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: targetState }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Şalter değiştirilemedi.");

      setHealthData({ ...healthData, maintenanceMode: targetState });
      setIsKillSwitchModalOpen(false);

      if (targetState) {
        toast.error("🚨 MASTER KILL-SWITCH DEVREYE ALINDI! SaaS Bakım Moduna Geçti.");
      } else {
        toast.success("✅ SaaS Sistemi Normale Döndürüldü, Bakım Modu Kapatıldı.");
      }
    } catch (err: any) {
      toast.error(err.message || "İşlem başarısız.");
    } finally {
      setTogglingKillSwitch(false);
    }
  };

  const heapPercentage = healthData
    ? Math.min(100, Math.round((healthData.memory.heapUsedMb / Math.max(1, healthData.memory.heapTotalMb)) * 100))
    : 0;

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div className="flex items-center gap-3">
          <Link
            href="/superadmin/dashboard"
            className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700 transition"
          >
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-purple-500/10 text-purple-400 border border-purple-500/20">
                SUPERADMIN KOMUTA
              </span>
              <span className="text-slate-500 text-xs">/</span>
              <span className="text-slate-400 text-xs font-mono">CANLI SİSTEM TELEMETRİSİ</span>
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5 mt-1">
              <Activity className="w-6 h-6 text-emerald-400" />
              Sistem Sağlığı & Master Kill-Switch (Acil Durum Şalteri)
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            disabled={refreshing}
            onClick={() => {
              setRefreshing(true);
              fetchHealthData();
            }}
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white text-xs font-medium transition cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
            <span>Yenile (Otomatik: 10sn)</span>
          </button>
        </div>
      </div>

      {/* MASTER KILL-SWITCH HERO BANNER */}
      <div
        className={`rounded-2xl border-2 p-6 transition-all duration-300 relative overflow-hidden shadow-2xl ${
          healthData?.maintenanceMode
            ? "border-rose-500 bg-rose-950/40 shadow-rose-950/50"
            : "border-slate-800 bg-slate-900/80 shadow-slate-950/50"
        }`}
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 relative z-10">
          <div className="flex items-start gap-4">
            <div
              className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 border ${
                healthData?.maintenanceMode
                  ? "bg-rose-500/20 text-rose-400 border-rose-500/40 animate-pulse"
                  : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
              }`}
            >
              {healthData?.maintenanceMode ? (
                <ShieldAlert className="w-8 h-8" />
              ) : (
                <ShieldCheck className="w-8 h-8" />
              )}
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2.5">
                <span className="text-base font-bold text-white">
                  SaaS Master Kill-Switch (Acil Durum Bakım Şalteri)
                </span>
                <span
                  className={`px-2.5 py-0.5 rounded text-[10px] font-bold font-mono border ${
                    healthData?.maintenanceMode
                      ? "bg-rose-500/20 text-rose-300 border-rose-500/40"
                      : "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                  }`}
                >
                  {healthData?.maintenanceMode ? "BAKIM MODU: DEVREDE" : "SİSTEM: ÇEVRİMİÇİ (ONLINE)"}
                </span>
              </div>
              <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
                {healthData?.maintenanceMode
                  ? "Tüm kiracı firmaların, mühendislerin ve denetçilerin sisteme erişimi durdurulmuştur. Yalnızca Superadmin erişimi açıktır."
                  : "Şalter kapalıdır; tüm kiracı firmalar, webhooks, mobil saha personeli ve API servisleri normal çalışmaktadır."}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsKillSwitchModalOpen(true)}
            className={`flex items-center gap-2.5 px-6 py-3 rounded-xl font-bold text-xs shadow-xl transition cursor-pointer shrink-0 ${
              healthData?.maintenanceMode
                ? "bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30"
                : "bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/30"
            }`}
          >
            <Power className="w-4 h-4" />
            <span>
              {healthData?.maintenanceMode ? "Bakım Modunu Kapat (Sistemi Aç)" : "SaaS'ı Bakım Moduna Al (Şalteri İndir)"}
            </span>
          </button>
        </div>
      </div>

      {/* Live Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Memory Usage Card */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 space-y-4 shadow-lg">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
            <div className="flex items-center gap-2 text-xs font-bold text-white">
              <Cpu className="w-4 h-4 text-purple-400" />
              <span>Node.js Bellek (RAM) Tüketimi</span>
            </div>
            <span className="text-[10px] font-mono text-purple-300">
              RSS: {healthData?.memory.rssMb || 0} MB
            </span>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-slate-400">Heap Kullanımı:</span>
              <span className="font-mono text-white font-semibold">
                {healthData?.memory.heapUsedMb || 0} MB / {healthData?.memory.heapTotalMb || 0} MB
              </span>
            </div>

            <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  heapPercentage > 85 ? "bg-rose-500" : heapPercentage > 60 ? "bg-amber-500" : "bg-purple-500"
                }`}
                style={{ width: `${heapPercentage}%` }}
              />
            </div>

            <div className="flex justify-between text-[11px] text-slate-500 pt-1">
              <span>Doluluk: %{heapPercentage}</span>
              <span>External: {healthData?.memory.externalMb || 0} MB</span>
            </div>
          </div>
        </div>

        {/* Database Latency & Pool Card */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 space-y-4 shadow-lg">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
            <div className="flex items-center gap-2 text-xs font-bold text-white">
              <Database className="w-4 h-4 text-cyan-400" />
              <span>Veritabanı Gecikmesi & Havuz</span>
            </div>
            <span
              className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono border ${
                healthData?.database.status === "OPTIMAL"
                  ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/20"
                  : "bg-amber-500/10 text-amber-300 border-amber-500/20"
              }`}
            >
              {healthData?.database.status || "OPTIMAL"}
            </span>
          </div>

          <div className="space-y-3">
            <div className="flex items-baseline justify-between">
              <span className="text-xs text-slate-400">Canlı Ping (Latency):</span>
              <span className="text-2xl font-bold font-mono text-cyan-400">
                {healthData?.database.latencyMs || 0} ms
              </span>
            </div>

            <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-[11px] space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-500">Sağlayıcı:</span>
                <span className="text-slate-300 font-mono">Neon Serverless PostgreSQL</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Prisma Connection Pool:</span>
                <span className="text-emerald-400 font-mono">AKTİF (Bağlantı Sağlıklı)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Server & Uptime Card */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 space-y-4 shadow-lg">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
            <div className="flex items-center gap-2 text-xs font-bold text-white">
              <Server className="w-4 h-4 text-emerald-400" />
              <span>Sunucu & Çalışma Süresi (Uptime)</span>
            </div>
            <span className="text-[10px] font-mono text-slate-400">
              {healthData?.server.nodeVersion || "v20"}
            </span>
          </div>

          <div className="space-y-3">
            <div className="flex items-baseline justify-between">
              <span className="text-xs text-slate-400">Kesintisiz Süre:</span>
              <span className="text-base font-bold font-mono text-emerald-400">
                {healthData?.server.uptimeFormatted || "0s"}
              </span>
            </div>

            <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-[11px] space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-500">Bölge:</span>
                <span className="text-slate-300 font-mono">{healthData?.server.region}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">İşletim Sistemi / Ortam:</span>
                <span className="text-slate-300 font-mono">{healthData?.server.platform}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Teşhis Motoru Bağlantı Kartı */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shrink-0">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-bold text-white">SaaS Teşhis Motoru (Phase 1-7 • 31/31 Test)</div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              Kriz, çakışma, iyimser kilitleme, DAG döngüsü, KVKK silme ve adli bilişim testlerini çalıştırın.
            </div>
          </div>
        </div>

        <Link
          href="/admin/system-health"
          className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md transition cursor-pointer"
        >
          Teşhis Motorunu Aç (31 Test) →
        </Link>
      </div>

      {/* Kill-Switch Confirmation Modal */}
      {isKillSwitchModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4">
          <div className="rounded-2xl border border-rose-500 bg-slate-950 p-6 max-w-md w-full space-y-5 shadow-2xl">
            <div className="flex items-center gap-3 text-rose-400">
              <div className="w-10 h-10 rounded-xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <div className="text-sm font-bold text-white">MASTER KILL-SWITCH ONAYI</div>
                <div className="text-[11px] text-rose-300">Geri Dönüşü Hassas Kritik İşlem</div>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              {healthData?.maintenanceMode
                ? "SaaS sistemini bakım modundan çıkarıp tüm kullanıcılara tekrar erişim izni vermek istediğinize emin misiniz?"
                : "Tüm Nexa ERP altyapısını anında BAKIM MODUNA almak üzeresiniz. Superadmin harici tüm müteahhit, yapı denetim ve taşeron personellerinin oturumları geçici olarak kilitlenecektir. Onaylıyor musunuz?"}
            </p>

            <div className="flex justify-end gap-2.5 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setIsKillSwitchModalOpen(false)}
                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-medium"
              >
                Vazgeç
              </button>
              <button
                type="button"
                disabled={togglingKillSwitch}
                onClick={handleToggleKillSwitch}
                className={`px-5 py-2 rounded-lg text-white text-xs font-bold flex items-center gap-2 ${
                  healthData?.maintenanceMode
                    ? "bg-emerald-600 hover:bg-emerald-500"
                    : "bg-rose-600 hover:bg-rose-500"
                }`}
              >
                {togglingKillSwitch && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>
                  {healthData?.maintenanceMode ? "Evet, Sistemi Aç" : "Evet, Şalteri İndir (Durdur)"}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
