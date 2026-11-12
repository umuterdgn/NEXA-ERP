"use client";
/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Super Admin Müşteri (Tenant) & Abonelik Yönetimi
 */

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Building2,
  Plus,
  Search,
  RefreshCw,
  Loader2,
  ShieldCheck,
  PauseCircle,
  PlayCircle,
  ExternalLink,
  Users,
  FolderKanban,
  Crown,
  Sliders,
} from "lucide-react";
import toast from "react-hot-toast";
import CreateTenantModal from "@/components/superadmin/CreateTenantModal";

interface TenantRow {
  id: string;
  slug?: string | null;
  name: string;
  domain?: string | null;
  type: string;
  subscriptionPlan: string;
  isTrial: boolean;
  status: string;
  licenses: number;
  maxUsers: number;
  usedLicenses: number;
  projectCount: number;
  createdAt: string;
}

const PLAN_BADGE: Record<string, string> = {
  STARTER: "bg-slate-700/60 text-slate-200 border-slate-600",
  PROFESSIONAL: "bg-blue-500/15 text-blue-300 border-blue-500/30",
  ENTERPRISE: "bg-purple-500/15 text-purple-300 border-purple-500/30",
};

export default function TenantsManagementClient() {
  const [tenants, setTenants] = useState<TenantRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [planFilter, setPlanFilter] = useState("ALL");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const fetchTenants = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/superadmin/tenants");
      const data = await res.json();
      if (data.success) {
        setTenants(data.tenants || []);
      } else {
        toast.error(data.error || "Müşteriler yüklenemedi.");
      }
    } catch {
      toast.error("Müşteri listesi alınamadı.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchTenants();
  }, [fetchTenants]);

  const handleToggleStatus = async (tenant: TenantRow) => {
    const nextStatus = tenant.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE";
    setTogglingId(tenant.id);
    try {
      const res = await fetch("/api/superadmin/tenants", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: tenant.id, status: nextStatus }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success(
          `${tenant.name} ${nextStatus === "ACTIVE" ? "aktif edildi" : "askıya alındı"}.`
        );
        setTenants((prev) =>
          prev.map((t) => (t.id === tenant.id ? { ...t, status: nextStatus } : t))
        );
      } else {
        toast.error(data.error || "Durum güncellenemedi.");
      }
    } catch {
      toast.error("İşlem başarısız.");
    } finally {
      setTogglingId(null);
    }
  };

  const filtered = tenants.filter((t) => {
    const matchesPlan = planFilter === "ALL" || t.subscriptionPlan === planFilter;
    const q = searchTerm.toLowerCase().trim();
    const matchesSearch =
      !q ||
      t.name.toLowerCase().includes(q) ||
      (t.slug && t.slug.toLowerCase().includes(q)) ||
      (t.domain && t.domain.toLowerCase().includes(q));
    return matchesPlan && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-purple-400 uppercase tracking-wider mb-1">
            <Crown className="h-3.5 w-3.5" />
            <span>Multi-Tenant Abonelik & Paket Yönetimi</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Müşteri (Tenant) Yönetimi
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            SaaS kiracı firmaları, lisans kotaları, abonelik paketleri ve modül yetkileri.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => void fetchTenants()}
            disabled={loading}
            className="flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900 px-3.5 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800 hover:text-white transition-colors cursor-pointer"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Yenile</span>
          </button>

          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 px-4 py-2 text-xs font-bold text-white shadow-lg shadow-purple-600/20 hover:from-purple-500 hover:to-pink-500 transition-all cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Yeni Firma (Tenant) Kur</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between rounded-2xl border border-slate-800 bg-slate-900/60 p-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Firma adı, slug veya domain ara..."
            className="w-full rounded-xl border border-slate-800 bg-slate-950 pl-10 pr-4 py-2 text-sm text-white placeholder-slate-500 focus:border-purple-500 focus:outline-none"
          />
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {["ALL", "STARTER", "PROFESSIONAL", "ENTERPRISE"].map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPlanFilter(p)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                planFilter === p
                  ? "bg-purple-600/25 text-purple-300 border border-purple-500/30"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              {p === "ALL" ? `Tümü (${tenants.length})` : p}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-purple-400" />
          <span className="text-sm">Müşteri firmalar yükleniyor...</span>
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/60 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  <th className="p-4">Firma / Slug</th>
                  <th className="p-4">Abonelik Paketi</th>
                  <th className="p-4">Kullanıcı / Proje</th>
                  <th className="p-4">Durum</th>
                  <th className="p-4">Kayıt Tarihi</th>
                  <th className="p-4 text-right">Yönetim</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-12 text-center text-slate-500">
                      Kayıtlı tenant bulunamadı.
                    </td>
                  </tr>
                ) : (
                  filtered.map((t) => (
                    <tr key={t.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-500/15 border border-purple-500/20 text-purple-400">
                            <Building2 className="h-4 w-4" />
                          </div>
                          <div>
                            <div className="font-bold text-white">{t.name}</div>
                            <div className="text-xs text-slate-400">
                              {t.slug ? `/${t.slug}/login` : t.domain || "-"}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <span
                          className={`inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 text-xs font-bold ${
                            PLAN_BADGE[t.subscriptionPlan] || PLAN_BADGE.STARTER
                          }`}
                        >
                          {t.subscriptionPlan}
                        </span>
                        {t.isTrial && (
                          <span className="ml-2 rounded bg-amber-500/15 px-2 py-0.5 text-[10px] font-bold text-amber-300 border border-amber-500/30">
                            14G DEMO
                          </span>
                        )}
                      </td>
                      <td className="p-4 text-xs text-slate-300">
                        <div className="flex items-center gap-3">
                          <span className="flex items-center gap-1">
                            <Users className="h-3.5 w-3.5 text-cyan-400" />
                            {t.usedLicenses} / {t.maxUsers || t.licenses}
                          </span>
                          <span className="flex items-center gap-1">
                            <FolderKanban className="h-3.5 w-3.5 text-purple-400" />
                            {t.projectCount} Proje
                          </span>
                        </div>
                      </td>
                      <td className="p-4">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold border ${
                            t.status === "ACTIVE"
                              ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                              : "bg-rose-500/15 text-rose-400 border-rose-500/30"
                          }`}
                        >
                          <ShieldCheck className="h-3 w-3" />
                          {t.status === "ACTIVE" ? "AKTİF" : "ASKIDA"}
                        </span>
                      </td>
                      <td className="p-4 text-xs text-slate-400">
                        {new Date(t.createdAt).toLocaleDateString("tr-TR")}
                      </td>
                      <td className="p-4 text-right">
                        <div className="inline-flex items-center gap-2">
                          <Link
                            href={`/superadmin/tenants/${t.id}`}
                            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800/80 hover:bg-slate-700 px-3 py-1.5 text-xs font-semibold text-white transition-colors"
                          >
                            <Sliders className="h-3.5 w-3.5 text-cyan-400" />
                            <span>Detay & Limitler</span>
                            <ExternalLink className="h-3 w-3 text-slate-400" />
                          </Link>

                          <button
                            type="button"
                            disabled={togglingId === t.id}
                            onClick={() => void handleToggleStatus(t)}
                            className={`inline-flex items-center gap-1 rounded-xl border px-3 py-1.5 text-xs font-semibold transition-colors cursor-pointer ${
                              t.status === "ACTIVE"
                                ? "border-rose-500/30 bg-rose-500/10 text-rose-300 hover:bg-rose-500/20"
                                : "border-emerald-500/30 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20"
                            }`}
                          >
                            {t.status === "ACTIVE" ? (
                              <>
                                <PauseCircle className="h-3.5 w-3.5" />
                                <span>Askıya Al</span>
                              </>
                            ) : (
                              <>
                                <PlayCircle className="h-3.5 w-3.5" />
                                <span>Aktifleştir</span>
                              </>
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <CreateTenantModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => void fetchTenants()}
      />
    </div>
  );
}

