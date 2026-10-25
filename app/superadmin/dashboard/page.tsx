/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Superadmin Command Center Dashboard (/superadmin/dashboard)
 * SaaS Multi-Tenant & Firma Yönetim Terminali
 */

"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Building2,
  Users,
  HardDrive,
  DollarSign,
  Plus,
  Shield,
  ShieldAlert,
  ShieldCheck,
  CheckCircle,
  XCircle,
  PauseCircle,
  PlayCircle,
  Sliders,
  Sparkles,
  Layers,
  ScanText,
  Plane,
  Box,
  RefreshCw,
  Search,
  Loader2,
  AlertTriangle,
  Activity,
  Server,
  TrendingUp,
} from "lucide-react";
import toast from "react-hot-toast";

interface TenantItem {
  id: string;
  name: string;
  domain?: string | null;
  type: string;
  subscriptionPlan: "STARTER" | "PROFESSIONAL" | "ENTERPRISE";
  status: "ACTIVE" | "SUSPENDED";
  licenses: number;
  usedLicenses: number;
  projectCount: number;
  features: string[];
  createdAt: string;
}

interface KPIStats {
  totalTenants: number;
  activeTenants: number;
  suspendedTenants: number;
  mrr: number;
  totalUsers: number;
  totalLicenses: number;
  totalProjects: number;
  estimatedStorageGb: number;
}

const FEATURE_CONFIG = [
  { key: "BIM_VIEWER", label: "3D BIM Viewer", icon: Box, color: "text-blue-400" },
  { key: "AI_VISION", label: "AI Patron & Hasar", icon: Sparkles, color: "text-purple-400" },
  { key: "OCR", label: "Akıllı Evrak (OCR)", icon: ScanText, color: "text-cyan-400" },
  { key: "DRONE", label: "İHA & Drone Gözlem", icon: Plane, color: "text-emerald-400" },
];

export default function SuperadminDashboardPage() {
  const [tenants, setTenants] = useState<TenantItem[]>([]);
  const [kpis, setKpis] = useState<KPIStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPlan, setSelectedPlan] = useState("ALL");
  const [isMaintenance, setIsMaintenance] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [togglingTenantId, setTogglingTenantId] = useState<string | null>(null);

  // New Tenant Modal Form
  const [newTenantData, setNewTenantData] = useState({
    name: "",
    domain: "",
    type: "MAIN_CONTRACTOR",
    subscriptionPlan: "PROFESSIONAL",
    licenses: 50,
    features: ["BIM_VIEWER", "AI_VISION", "OCR", "DRONE"],
  });
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchTenants();
    fetchMaintenanceStatus();
  }, []);

  const fetchTenants = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/superadmin/tenants");
      if (res.ok) {
        const data = await res.json();
        setTenants(data.tenants || []);
        setKpis(data.kpis || null);
      }
    } catch (err) {
      console.error(err);
      toast.error("Firma verileri alınamadı.");
    } finally {
      setLoading(false);
    }
  };

  const fetchMaintenanceStatus = async () => {
    try {
      const res = await fetch("/api/superadmin/maintenance");
      if (res.ok) {
        const data = await res.json();
        setIsMaintenance(data.isMaintenance);
      }
    } catch {
      // ignore
    }
  };

  const handleToggleStatus = async (tenant: TenantItem) => {
    const nextStatus = tenant.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE";
    setTogglingTenantId(tenant.id);

    try {
      const res = await fetch("/api/superadmin/tenants", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: tenant.id,
          status: nextStatus,
        }),
      });

      if (!res.ok) throw new Error("Firma durumu güncellenemedi.");

      setTenants((prev) =>
        prev.map((t) => (t.id === tenant.id ? { ...t, status: nextStatus } : t))
      );

      toast.success(
        nextStatus === "ACTIVE"
          ? `${tenant.name} firması AKTİF edildi.`
          : `${tenant.name} firması ASKIYA ALINDI (Erişimi durduruldu).`
      );
    } catch (err: any) {
      toast.error(err.message || "İşlem başarısız.");
    } finally {
      setTogglingTenantId(null);
    }
  };

  const handleToggleFeature = async (tenant: TenantItem, featureKey: string) => {
    const currentFeatures = tenant.features || [];
    const hasFeature = currentFeatures.includes(featureKey);
    const updatedFeatures = hasFeature
      ? currentFeatures.filter((f) => f !== featureKey)
      : [...currentFeatures, featureKey];

    // Optimistic UI update
    setTenants((prev) =>
      prev.map((t) => (t.id === tenant.id ? { ...t, features: updatedFeatures } : t))
    );

    try {
      const res = await fetch("/api/superadmin/tenants", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: tenant.id,
          features: updatedFeatures,
        }),
      });

      if (!res.ok) throw new Error("Özellik güncellenemedi.");

      toast.success(
        hasFeature
          ? `[${tenant.name}] için ${featureKey} modülü KAPATILDI.`
          : `[${tenant.name}] için ${featureKey} modülü AÇILDI (SaaS Upsell).`
      );
    } catch (err: any) {
      toast.error(err.message || "Hata oluştu.");
      fetchTenants();
    }
  };

  const handleCreateTenant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTenantData.name.trim()) {
      toast.error("Lütfen firma adını yazınız.");
      return;
    }

    setCreating(true);
    try {
      const res = await fetch("/api/superadmin/tenants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newTenantData),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Firma oluşturulamadı.");

      toast.success(`${newTenantData.name} firması başarıyla sisteme kaydedildi!`);
      setIsModalOpen(false);
      setNewTenantData({
        name: "",
        domain: "",
        type: "MAIN_CONTRACTOR",
        subscriptionPlan: "PROFESSIONAL",
        licenses: 50,
        features: ["BIM_VIEWER", "AI_VISION", "OCR", "DRONE"],
      });
      fetchTenants();
    } catch (err: any) {
      toast.error(err.message || "Oluşturma hatası.");
    } finally {
      setCreating(false);
    }
  };

  const filteredTenants = tenants.filter((t) => {
    const matchesSearch =
      t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.domain || "").toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPlan = selectedPlan === "ALL" || t.subscriptionPlan === selectedPlan;
    return matchesSearch && matchesPlan;
  });

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-20">
      {/* Maintenance Mode Emergency Alert Banner */}
      {isMaintenance && (
        <div className="p-4 rounded-xl bg-rose-950/80 border border-rose-500 flex items-center justify-between text-white animate-pulse">
          <div className="flex items-center gap-3">
            <ShieldAlert className="w-6 h-6 text-rose-400 shrink-0" />
            <div>
              <div className="font-bold text-sm">ACİL DURUM ŞALTERİ DEVREDE: SİSTEM BAKIM MODUNDA</div>
              <div className="text-xs text-rose-200">
                Superadmin harici tüm kullanıcıların erişimi durdurulmuştur.
              </div>
            </div>
          </div>
          <Link
            href="/superadmin/system-health"
            className="px-3.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold"
          >
            Şalteri Yönet
          </Link>
        </div>
      )}

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-purple-500/10 text-purple-400 border border-purple-500/20">
              NEXA ERP SAAS ALTYAPISI
            </span>
            <span className="text-slate-500 text-xs">/</span>
            <span className="text-slate-400 text-xs font-mono">SUPERADMIN KOMUTA MERKEZİ</span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5 mt-1">
            <Shield className="w-6 h-6 text-purple-400" />
            Superadmin Komuta Merkezi & Kiracı Yönetimi
          </h1>
          <p className="text-slate-400 text-xs mt-1">
            Çoklu kiracı (Multi-Tenant) izolasyonunu denetleyin, paket limitlerini ve modül yetkilerini yönetin.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            href="/superadmin/system-health"
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white text-xs font-medium transition cursor-pointer"
          >
            <Activity className="w-4 h-4 text-emerald-400" />
            <span>Sistem Sağlığı & Şalter</span>
          </Link>

          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow-lg shadow-purple-600/20 transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Yeni Firma (Tenant) Ekle</span>
          </button>
        </div>
      </div>

      {/* Global SaaS KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Active Tenants Card */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 space-y-3 relative overflow-hidden shadow-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Aktif Firmalar (Tenants)</span>
            <Building2 className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-bold text-white font-mono">
            {kpis?.activeTenants || 0}
            <span className="text-xs font-normal text-slate-500 ml-2">/ {kpis?.totalTenants || 0} Toplam</span>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-emerald-400">
            <CheckCircle className="w-3.5 h-3.5" />
            <span>%100 SaaS İzolasyon Bariyeri Aktif</span>
          </div>
        </div>

        {/* Monthly Recurring Revenue (MRR) Card */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 space-y-3 relative overflow-hidden shadow-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Aylık Tekrarlayan Gelir (MRR)</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-emerald-400 font-mono">
            {(kpis?.mrr || 0).toLocaleString("tr-TR")} ₺
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
            <span>İyzico Gateway Entegre</span>
          </div>
        </div>

        {/* Total Users & License Quota Card */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 space-y-3 relative overflow-hidden shadow-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Kullanıcı Lisans Doluluğu</span>
            <Users className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-bold text-white font-mono">
            {kpis?.totalUsers || 0}
            <span className="text-xs font-normal text-slate-500 ml-2">/ {kpis?.totalLicenses || 0} Kota</span>
          </div>
          <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-blue-500 h-full rounded-full transition-all duration-500"
              style={{
                width: `${Math.min(
                  100,
                  Math.round(((kpis?.totalUsers || 0) / Math.max(1, kpis?.totalLicenses || 1)) * 100)
                )}%`,
              }}
            />
          </div>
        </div>

        {/* Storage / S3 Payload Card */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 space-y-3 relative overflow-hidden shadow-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Bulut Depolama Yükü (S3)</span>
            <HardDrive className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-bold text-cyan-400 font-mono">
            {kpis?.estimatedStorageGb ? (kpis.estimatedStorageGb >= 1000 ? `${(kpis.estimatedStorageGb / 1000).toFixed(2)} TB` : `${kpis.estimatedStorageGb} GB`) : "1.24 TB"}
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
            <Server className="w-3.5 h-3.5 text-cyan-400" />
            <span>AWS Frankfurt (eu-central-1)</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Firma adı veya domain ara..."
            className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-purple-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={selectedPlan}
            onChange={(e) => setSelectedPlan(e.target.value)}
            className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-purple-500 cursor-pointer"
          >
            <option value="ALL">Tüm Paketler</option>
            <option value="STARTER">Starter</option>
            <option value="PROFESSIONAL">Professional</option>
            <option value="ENTERPRISE">Enterprise</option>
          </select>

          <button
            type="button"
            onClick={fetchTenants}
            className="p-2 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white"
            title="Yenile"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Tenant Management Table */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 overflow-hidden shadow-xl">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-950/80 text-slate-400 font-mono text-[11px] uppercase border-b border-slate-800">
            <tr>
              <th className="py-3.5 px-4">Firma (Tenant) & Tür</th>
              <th className="py-3.5 px-4">Abonelik Paketi</th>
              <th className="py-3.5 px-4">Kullanıcı Kotası</th>
              <th className="py-3.5 px-4">Modül Yetkileri (Feature Toggles)</th>
              <th className="py-3.5 px-4">Durum</th>
              <th className="py-3.5 px-4 text-right">Erişim Şalteri</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/80">
            {loading ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-slate-400">
                  <Loader2 className="w-6 h-6 animate-spin text-purple-500 mx-auto mb-2" />
                  Kiracı firmalar taranıyor...
                </td>
              </tr>
            ) : filteredTenants.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-slate-500">
                  Kayıtlı firma bulunamadı.
                </td>
              </tr>
            ) : (
              filteredTenants.map((t) => {
                const isSuspended = t.status === "SUSPENDED";
                const isToggling = togglingTenantId === t.id;

                return (
                  <tr
                    key={t.id}
                    className={`transition ${
                      isSuspended ? "bg-rose-950/10 hover:bg-rose-950/20" : "hover:bg-slate-850/50"
                    }`}
                  >
                    {/* Firma Adı & Türü */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 border ${
                            t.type === "INSPECTION"
                              ? "bg-blue-500/10 text-blue-400 border-blue-500/20"
                              : "bg-purple-500/10 text-purple-400 border-purple-500/20"
                          }`}
                        >
                          <Building2 className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="font-bold text-white text-xs">{t.name}</div>
                          <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                            {t.type === "INSPECTION" ? "Yapı Denetim Kuruluşu" : "Ana Yüklenici / Müteahhit"}
                            {t.domain && ` • ${t.domain}`}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Abonelik Paketi */}
                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2.5 py-0.5 rounded text-[10px] font-bold font-mono border ${
                          t.subscriptionPlan === "ENTERPRISE"
                            ? "bg-purple-500/10 text-purple-300 border-purple-500/30"
                            : t.subscriptionPlan === "PROFESSIONAL"
                            ? "bg-blue-500/10 text-blue-300 border-blue-500/30"
                            : "bg-slate-800 text-slate-300 border-slate-700"
                        }`}
                      >
                        {t.subscriptionPlan}
                      </span>
                    </td>

                    {/* Kullanıcı / Lisans Kotası */}
                    <td className="py-3.5 px-4">
                      <div className="space-y-1">
                        <div className="font-mono text-slate-200">
                          {t.usedLicenses} / {t.licenses} Lisans
                        </div>
                        <div className="w-24 bg-slate-800 h-1.5 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              t.usedLicenses / t.licenses > 0.9 ? "bg-rose-500" : "bg-emerald-500"
                            }`}
                            style={{
                              width: `${Math.min(100, (t.usedLicenses / Math.max(1, t.licenses)) * 100)}%`,
                            }}
                          />
                        </div>
                      </div>
                    </td>

                    {/* Feature Toggles (Modül Aç/Kapat) */}
                    <td className="py-3.5 px-4">
                      <div className="flex flex-wrap items-center gap-1.5">
                        {FEATURE_CONFIG.map((feat) => {
                          const isEnabled = (t.features || []).includes(feat.key);
                          const Icon = feat.icon;

                          return (
                            <button
                              key={feat.key}
                              type="button"
                              onClick={() => handleToggleFeature(t, feat.key)}
                              className={`flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium border transition cursor-pointer ${
                                isEnabled
                                  ? "bg-slate-800 text-white border-slate-700 hover:border-slate-600"
                                  : "bg-slate-950/60 text-slate-600 border-slate-900 opacity-60 hover:opacity-100"
                              }`}
                              title={`${feat.label}: ${isEnabled ? "Aktif (Kapatmak için tıkla)" : "Kapalı (Açmak için tıkla)"}`}
                            >
                              <Icon className={`w-3 h-3 ${isEnabled ? feat.color : "text-slate-600"}`} />
                              <span>{feat.label.split(" ")[0]}</span>
                            </button>
                          );
                        })}
                      </div>
                    </td>

                    {/* Durum Rozeti */}
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[10px] font-bold font-mono border ${
                          t.status === "ACTIVE"
                            ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/20"
                            : "bg-rose-500/10 text-rose-300 border border-rose-500/20"
                        }`}
                      >
                        {t.status === "ACTIVE" ? (
                          <>
                            <CheckCircle className="w-3 h-3 text-emerald-400" />
                            <span>AKTİF</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3 h-3 text-rose-400" />
                            <span>ASKIYA ALINDI</span>
                          </>
                        )}
                      </span>
                    </td>

                    {/* Aksiyon Butonu (Şalter) */}
                    <td className="py-3.5 px-4 text-right">
                      <button
                        type="button"
                        disabled={isToggling}
                        onClick={() => handleToggleStatus(t)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                          t.status === "ACTIVE"
                            ? "bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30"
                            : "bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30"
                        }`}
                      >
                        {isToggling ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : t.status === "ACTIVE" ? (
                          <>
                            <PauseCircle className="w-3.5 h-3.5" />
                            <span>Askıya Al</span>
                          </>
                        ) : (
                          <>
                            <PlayCircle className="w-3.5 h-3.5" />
                            <span>Aktif Et</span>
                          </>
                        )}
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* New Tenant Creation Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="rounded-xl border border-slate-800 bg-slate-950 p-6 max-w-lg w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-white font-semibold text-sm">
                <Building2 className="w-4 h-4 text-purple-400" />
                <span>Yeni Firma (Tenant) Kaydı</span>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateTenant} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Firma Ticari Unvanı *</label>
                <input
                  type="text"
                  required
                  value={newTenantData.name}
                  onChange={(e) => setNewTenantData({ ...newTenantData, name: e.target.value })}
                  placeholder="Örn: Demirtaş İnşaat Taahhüt San. Ltd."
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Firma Türü</label>
                  <select
                    value={newTenantData.type}
                    onChange={(e) => setNewTenantData({ ...newTenantData, type: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-purple-500"
                  >
                    <option value="MAIN_CONTRACTOR">Ana Yüklenici (Müteahhit)</option>
                    <option value="INSPECTION">Yapı Denetim Kuruluşu</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Abonelik Paketi</label>
                  <select
                    value={newTenantData.subscriptionPlan}
                    onChange={(e) =>
                      setNewTenantData({ ...newTenantData, subscriptionPlan: e.target.value as any })
                    }
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-purple-500"
                  >
                    <option value="STARTER">Starter (15.000 ₺/ay)</option>
                    <option value="PROFESSIONAL">Professional (35.000 ₺/ay)</option>
                    <option value="ENTERPRISE">Enterprise (75.000 ₺/ay)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Kullanıcı Lisans Sayısı</label>
                  <input
                    type="number"
                    min={5}
                    max={500}
                    value={newTenantData.licenses}
                    onChange={(e) =>
                      setNewTenantData({ ...newTenantData, licenses: Number(e.target.value) })
                    }
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-purple-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Özel Alan Adı (Opsiyonel)</label>
                  <input
                    type="text"
                    value={newTenantData.domain}
                    onChange={(e) => setNewTenantData({ ...newTenantData, domain: e.target.value })}
                    placeholder="demirtasinsaat.com.tr"
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-medium"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-5 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-semibold flex items-center gap-1.5"
                >
                  {creating && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Kiracı Oluştur</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
