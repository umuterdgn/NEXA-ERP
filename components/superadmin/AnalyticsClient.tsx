"use client";
/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Super Admin Web Trafiği & Analitik Bileşeni
 */

import React, { useState, useEffect, useCallback } from "react";
import {
  TrendingUp,
  Globe,
  Eye,
  Users,
  MousePointerClick,
  Monitor,
  Smartphone,
  Tablet,
  Bot,
  RefreshCw,
  Loader2,
  ArrowUpRight,
  Clock,
  Building2,
} from "lucide-react";
import toast from "react-hot-toast";
import { getWebTrafficAnalytics } from "@/actions/super-admin/analytics";

interface AnalyticsData {
  totalViews: number;
  views24h: number;
  views7d: number;
  views30d: number;
  totalLeads: number;
  convertedLeads: number;
  totalTenants: number;
  leadConversionRate: string;
  topPages: { path: string; count: number }[];
  topReferers: { source: string; count: number }[];
  deviceCounts: { Desktop: number; Mobile: number; Tablet: number; Bot: number };
  dailyTrend: { date: string; views: number }[];
  recentLogs: {
    id: string;
    path: string;
    referer: string;
    userAgent: string;
    createdAt: string;
  }[];
}

export default function AnalyticsClient() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getWebTrafficAnalytics();
      if (res.success && res.analytics) {
        setData(res.analytics);
      } else {
        toast.error(res.error || "Analitik verileri alınamadı.");
      }
    } catch {
      toast.error("Trafik verileri yüklenirken hata oluştu.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchAnalytics();
  }, [fetchAnalytics]);

  const maxTrend = data
    ? Math.max(...data.dailyTrend.map((d) => d.views), 1)
    : 1;

  const totalDevices = data
    ? data.deviceCounts.Desktop +
      data.deviceCounts.Mobile +
      data.deviceCounts.Tablet +
      data.deviceCounts.Bot
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-purple-400 uppercase tracking-wider mb-1">
            <Globe className="h-3.5 w-3.5" />
            <span>B2B SaaS Telemetri & Dönüşüm</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Web Trafiği & Analitik
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Pazarlama sayfalarının ziyaretçi trafiği, referans kaynakları ve demo dönüşüm oranları.
          </p>
        </div>

        <button
          type="button"
          onClick={() => void fetchAnalytics()}
          disabled={loading}
          className="inline-flex items-center gap-2 self-start rounded-xl border border-slate-800 bg-slate-900 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800 hover:text-white transition-colors cursor-pointer"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          <span>Verileri Yenile</span>
        </button>
      </div>

      {loading || !data ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-purple-400" />
          <span className="text-sm">Trafik analitiği hesaplanıyor...</span>
        </div>
      ) : (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
              <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                <span>Son 24 Saat Ziyaret</span>
                <Eye className="h-4 w-4 text-cyan-400" />
              </div>
              <div className="text-2xl font-black text-white">{data.views24h}</div>
              <div className="text-[11px] text-slate-500 mt-1">
                Son 7 gün: {data.views7d} | Toplam: {data.totalViews}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
              <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                <span>30 Günlük Trafik</span>
                <TrendingUp className="h-4 w-4 text-purple-400" />
              </div>
              <div className="text-2xl font-black text-white">{data.views30d}</div>
              <div className="text-[11px] text-purple-400/70 mt-1">Organik & Doğrudan Erişim</div>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
              <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                <span>Lead Dönüşüm Oranı</span>
                <MousePointerClick className="h-4 w-4 text-emerald-400" />
              </div>
              <div className="text-2xl font-black text-emerald-400">%{data.leadConversionRate}</div>
              <div className="text-[11px] text-slate-500 mt-1">
                {data.totalLeads} demo talebi / 30g trafik
              </div>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
              <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                <span>Aktif Tenant / Müşteri</span>
                <Building2 className="h-4 w-4 text-amber-400" />
              </div>
              <div className="text-2xl font-black text-white">{data.totalTenants}</div>
              <div className="text-[11px] text-amber-400/70 mt-1">
                Lead'den dönüşen: {data.convertedLeads}
              </div>
            </div>
          </div>

          {/* 7-Day Trend + Device Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-8 rounded-2xl border border-slate-800 bg-slate-900/70 p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-base font-bold text-white">Son 7 Gün Sayfa Görüntüleme</h2>
                  <p className="text-xs text-slate-400">Günlük ziyaretçi yoğunluğu trendi</p>
                </div>
                <span className="text-xs font-semibold text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 px-2.5 py-1 rounded-lg">
                  Canlı Veri
                </span>
              </div>

              <div className="flex items-end gap-3 h-48 pt-4">
                {data.dailyTrend.map((day, idx) => {
                  const pct = Math.max(Math.round((day.views / maxTrend) * 100), 6);
                  return (
                    <div key={idx} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                      <span className="text-xs font-bold text-slate-300">{day.views}</span>
                      <div className="w-full max-w-[44px] bg-slate-800/80 rounded-t-xl h-36 flex items-end overflow-hidden p-1">
                        <div
                          className="w-full rounded-t-lg bg-gradient-to-t from-blue-600 via-cyan-500 to-cyan-300 transition-all duration-500"
                          style={{ height: `${pct}%` }}
                        />
                      </div>
                      <span className="text-[11px] text-slate-400">{day.date}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="lg:col-span-4 rounded-2xl border border-slate-800 bg-slate-900/70 p-6 space-y-5">
              <div>
                <h2 className="text-base font-bold text-white">Cihaz Dağılımı</h2>
                <p className="text-xs text-slate-400">Ziyaretçi platform segmentasyonu</p>
              </div>

              <div className="space-y-3">
                {[
                  {
                    label: "Masaüstü (Desktop)",
                    count: data.deviceCounts.Desktop,
                    icon: Monitor,
                    color: "bg-cyan-500",
                  },
                  {
                    label: "Mobil (Mobile)",
                    count: data.deviceCounts.Mobile,
                    icon: Smartphone,
                    color: "bg-purple-500",
                  },
                  {
                    label: "Tablet",
                    count: data.deviceCounts.Tablet,
                    icon: Tablet,
                    color: "bg-emerald-500",
                  },
                  {
                    label: "Bot / Tarayıcı",
                    count: data.deviceCounts.Bot,
                    icon: Bot,
                    color: "bg-slate-500",
                  },
                ].map((dev) => {
                  const pct = totalDevices > 0 ? Math.round((dev.count / totalDevices) * 100) : 0;
                  const Icon = dev.icon;
                  return (
                    <div key={dev.label} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="flex items-center gap-2 text-slate-300">
                          <Icon className="h-3.5 w-3.5 text-slate-400" />
                          {dev.label}
                        </span>
                        <span className="font-bold text-white">
                          {dev.count} (%{pct})
                        </span>
                      </div>
                      <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
                        <div className={`h-full rounded-full ${dev.color}`} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Top Pages & Referrers */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6">
              <h2 className="text-base font-bold text-white mb-4">En Çok Ziyaret Edilen Sayfalar</h2>
              {data.topPages.length === 0 ? (
                <p className="text-xs text-slate-500 py-6 text-center">Henüz trafik kaydı yok.</p>
              ) : (
                <div className="space-y-2.5">
                  {data.topPages.map((p) => (
                    <div
                      key={p.path}
                      className="flex items-center justify-between rounded-xl border border-slate-800/80 bg-slate-950/60 px-3.5 py-2.5 text-xs"
                    >
                      <span className="font-mono text-cyan-300 flex items-center gap-1.5">
                        <ArrowUpRight className="h-3.5 w-3.5 text-slate-500" />
                        {p.path}
                      </span>
                      <span className="font-bold text-white">{p.count} görüntüleme</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6">
              <h2 className="text-base font-bold text-white mb-4">Referans & Trafik Kaynakları</h2>
              {data.topReferers.length === 0 ? (
                <p className="text-xs text-slate-500 py-6 text-center">Henüz referans kaydı yok.</p>
              ) : (
                <div className="space-y-2.5">
                  {data.topReferers.map((r) => (
                    <div
                      key={r.source}
                      className="flex items-center justify-between rounded-xl border border-slate-800/80 bg-slate-950/60 px-3.5 py-2.5 text-xs"
                    >
                      <span className="text-slate-200 font-medium">{r.source}</span>
                      <span className="font-bold text-purple-300">{r.count} ziyaret</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Recent Live Traffic Logs */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 overflow-hidden">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Clock className="h-4 w-4 text-cyan-400" />
                <span>Son Ziyaretçi Hareketleri</span>
              </h2>
              <span className="text-xs text-slate-400">Son 20 kayıt</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-950/50 text-slate-400">
                    <th className="p-3.5">Sayfa Yolu</th>
                    <th className="p-3.5">Kaynak / Referer</th>
                    <th className="p-3.5">Tarayıcı / Cihaz</th>
                    <th className="p-3.5">Zaman</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/70">
                  {data.recentLogs.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="p-8 text-center text-slate-500">
                        Henüz trafik kaydı oluşmadı. Ana sayfa ziyaret edildikçe burada görünecektir.
                      </td>
                    </tr>
                  ) : (
                    data.recentLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-800/30">
                        <td className="p-3.5 font-mono text-cyan-300">{log.path}</td>
                        <td className="p-3.5 text-slate-300">{log.referer}</td>
                        <td className="p-3.5 text-slate-400 max-w-xs truncate">{log.userAgent}</td>
                        <td className="p-3.5 text-slate-400 whitespace-nowrap">
                          {new Date(log.createdAt).toLocaleString("tr-TR")}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

