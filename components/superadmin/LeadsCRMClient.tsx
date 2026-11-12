"use client";
/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Super Admin Satış & Leads CRM Bileşeni (Kanban + DataGrid + Tenant Onboarding)
 */

import React, { useState, useEffect, useCallback } from "react";
import {
  Users,
  Sparkles,
  Phone,
  Mail,
  Building2,
  Search,
  RefreshCw,
  LayoutGrid,
  Table as TableIcon,
  CheckCircle2,
  Clock,
  PhoneCall,
  Presentation,
  XCircle,
  UserPlus,
  Trash2,
  StickyNote,
  Loader2,
  ArrowRight,
  Calendar,
  TrendingUp,
} from "lucide-react";
import toast from "react-hot-toast";
import {
  getDemoRequests,
  updateDemoRequestStatus,
  deleteDemoRequest,
} from "@/actions/super-admin/leads";
import CreateTenantModal, {
  CreateTenantInitialData,
} from "@/components/superadmin/CreateTenantModal";

export interface DemoRequestItem {
  id: string;
  companyName: string;
  contactName: string;
  email: string;
  phone: string | null;
  employeeCount: string | null;
  status: string;
  notes: string | null;
  createdAt: string | Date;
}

type LeadStatus = "NEW" | "CONTACTED" | "DEMO_DONE" | "CONVERTED" | "REJECTED";

const STATUS_COLUMNS: {
  key: LeadStatus;
  label: string;
  shortLabel: string;
  badgeClass: string;
  borderClass: string;
  headerBg: string;
  icon: any;
}[] = [
  {
    key: "NEW",
    label: "Yeni Talep",
    shortLabel: "Yeni",
    badgeClass: "bg-cyan-500/15 text-cyan-300 border-cyan-500/30",
    borderClass: "border-cyan-500/30",
    headerBg: "from-cyan-500/15 to-transparent",
    icon: Sparkles,
  },
  {
    key: "CONTACTED",
    label: "Arandı / İletişim",
    shortLabel: "Arandı",
    badgeClass: "bg-amber-500/15 text-amber-300 border-amber-500/30",
    borderClass: "border-amber-500/30",
    headerBg: "from-amber-500/15 to-transparent",
    icon: PhoneCall,
  },
  {
    key: "DEMO_DONE",
    label: "Demo Yapıldı",
    shortLabel: "Demo Yapıldı",
    badgeClass: "bg-purple-500/15 text-purple-300 border-purple-500/30",
    borderClass: "border-purple-500/30",
    headerBg: "from-purple-500/15 to-transparent",
    icon: Presentation,
  },
  {
    key: "CONVERTED",
    label: "Müşteri Oldu",
    shortLabel: "Müşteri Oldu",
    badgeClass: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
    borderClass: "border-emerald-500/30",
    headerBg: "from-emerald-500/15 to-transparent",
    icon: CheckCircle2,
  },
  {
    key: "REJECTED",
    label: "Olumsuz / İptal",
    shortLabel: "Red",
    badgeClass: "bg-rose-500/15 text-rose-300 border-rose-500/30",
    borderClass: "border-rose-500/30",
    headerBg: "from-rose-500/15 to-transparent",
    icon: XCircle,
  },
];

export default function LeadsCRMClient() {
  const [leads, setLeads] = useState<DemoRequestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"kanban" | "table">("kanban");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Onboarding Modal State
  const [isTenantModalOpen, setIsTenantModalOpen] = useState(false);
  const [selectedLeadForOnboarding, setSelectedLeadForOnboarding] =
    useState<CreateTenantInitialData | null>(null);

  // Notes Modal State
  const [notesLead, setNotesLead] = useState<DemoRequestItem | null>(null);
  const [notesInput, setNotesInput] = useState("");

  const fetchLeads = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getDemoRequests();
      if (res.success && res.leads) {
        setLeads(res.leads as DemoRequestItem[]);
      } else {
        toast.error(res.error || "Demo talepleri alınamadı.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Veriler yüklenirken hata oluştu.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchLeads();
  }, [fetchLeads]);

  const handleStatusChange = async (id: string, newStatus: LeadStatus) => {
    setUpdatingId(id);
    try {
      const res = await updateDemoRequestStatus(id, newStatus);
      if (res.success) {
        toast.success("Talep durumu güncellendi.");
        setLeads((prev) =>
          prev.map((l) => (l.id === id ? { ...l, status: newStatus } : l))
        );
      } else {
        toast.error(res.error || "Durum güncellenemedi.");
      }
    } catch {
      toast.error("Durum değiştirilemedi.");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleSaveNotes = async () => {
    if (!notesLead) return;
    setUpdatingId(notesLead.id);
    try {
      const res = await updateDemoRequestStatus(
        notesLead.id,
        notesLead.status as LeadStatus,
        notesInput
      );
      if (res.success) {
        toast.success("Görüşme notları kaydedildi.");
        setLeads((prev) =>
          prev.map((l) => (l.id === notesLead.id ? { ...l, notes: notesInput } : l))
        );
        setNotesLead(null);
      } else {
        toast.error(res.error || "Notlar kaydedilemedi.");
      }
    } catch {
      toast.error("Notlar kaydedilemedi.");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDelete = async (id: string, companyName: string) => {
    if (!confirm(`${companyName} demo talebini silmek istediğinize emin misiniz?`)) {
      return;
    }
    setUpdatingId(id);
    try {
      const res = await deleteDemoRequest(id);
      if (res.success) {
        toast.success("Demo talebi silindi.");
        setLeads((prev) => prev.filter((l) => l.id !== id));
      } else {
        toast.error(res.error || "Silinemedi.");
      }
    } catch {
      toast.error("Silme işlemi başarısız.");
    } finally {
      setUpdatingId(null);
    }
  };

  const openOnboardingModal = (lead: DemoRequestItem) => {
    setSelectedLeadForOnboarding({
      companyName: lead.companyName,
      contactName: lead.contactName,
      email: lead.email,
      phone: lead.phone || undefined,
      leadId: lead.id,
    });
    setIsTenantModalOpen(true);
  };

  const filteredLeads = leads.filter((lead) => {
    const matchesStatus = statusFilter === "ALL" || lead.status === statusFilter;
    const q = searchTerm.toLowerCase().trim();
    const matchesSearch =
      !q ||
      lead.companyName.toLowerCase().includes(q) ||
      lead.contactName.toLowerCase().includes(q) ||
      lead.email.toLowerCase().includes(q) ||
      (lead.phone && lead.phone.toLowerCase().includes(q));
    return matchesStatus && matchesSearch;
  });

  // Metrics
  const totalLeads = leads.length;
  const newCount = leads.filter((l) => l.status === "NEW").length;
  const activePipelineCount = leads.filter(
    (l) => l.status === "CONTACTED" || l.status === "DEMO_DONE"
  ).length;
  const convertedCount = leads.filter((l) => l.status === "CONVERTED").length;
  const conversionRate =
    totalLeads > 0 ? ((convertedCount / totalLeads) * 100).toFixed(1) : "0.0";

  const getStatusMeta = (status: string) =>
    STATUS_COLUMNS.find((c) => c.key === status) || STATUS_COLUMNS[0];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-cyan-400 uppercase tracking-wider mb-1">
            <Sparkles className="h-3.5 w-3.5" />
            <span>B2B SaaS Satış & Pipeline</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Demo Talepleri & Leads CRM
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Ana sayfadan gelen kurumsal demo taleplerini takip edin, görüşme süreçlerini yönetin ve tek
            tıkla Tenant hesabı açın.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* View Toggle */}
          <div className="inline-flex rounded-xl border border-slate-800 bg-slate-900 p-1">
            <button
              type="button"
              onClick={() => setViewMode("kanban")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                viewMode === "kanban"
                  ? "bg-purple-600/25 text-purple-300 border border-purple-500/30"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              <span>Kanban</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("table")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                viewMode === "table"
                  ? "bg-purple-600/25 text-purple-300 border border-purple-500/30"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <TableIcon className="h-3.5 w-3.5" />
              <span>DataGrid</span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => void fetchLeads()}
            disabled={loading}
            className="flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900 px-3.5 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800 hover:text-white transition-colors cursor-pointer"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Yenile</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setSelectedLeadForOnboarding(null);
              setIsTenantModalOpen(true);
            }}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 px-4 py-2 text-xs font-bold text-white shadow-lg shadow-purple-600/20 hover:from-purple-500 hover:to-pink-500 transition-all cursor-pointer"
          >
            <Building2 className="h-3.5 w-3.5" />
            <span>Yeni Tenant Kur</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span>Toplam Demo Talebi</span>
            <Users className="h-4 w-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-black text-white">{totalLeads}</div>
          <div className="text-[11px] text-slate-500 mt-1">Tüm zamanlar B2B Leads</div>
        </div>

        <div className="rounded-2xl border border-cyan-500/20 bg-slate-900/70 p-4">
          <div className="flex items-center justify-between text-xs text-cyan-300 mb-2">
            <span>Bekleyen Yeni Talep</span>
            <Clock className="h-4 w-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-black text-white">{newCount}</div>
          <div className="text-[11px] text-cyan-400/70 mt-1">Hemen aranması gerekenler</div>
        </div>

        <div className="rounded-2xl border border-purple-500/20 bg-slate-900/70 p-4">
          <div className="flex items-center justify-between text-xs text-purple-300 mb-2">
            <span>Aktif Görüşme & Demo</span>
            <Presentation className="h-4 w-4 text-purple-400" />
          </div>
          <div className="text-2xl font-black text-white">{activePipelineCount}</div>
          <div className="text-[11px] text-purple-400/70 mt-1">İletişime geçildi & Demo</div>
        </div>

        <div className="rounded-2xl border border-emerald-500/20 bg-slate-900/70 p-4">
          <div className="flex items-center justify-between text-xs text-emerald-300 mb-2">
            <span>Müşteriye Dönüşüm</span>
            <TrendingUp className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-white">{convertedCount}</span>
            <span className="text-xs font-bold text-emerald-400">%{conversionRate}</span>
          </div>
          <div className="text-[11px] text-emerald-400/70 mt-1">Aktif Tenant kurulumu</div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between rounded-2xl border border-slate-800 bg-slate-900/60 p-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Firma adı, yetkili, e-posta veya telefon ile ara..."
            className="w-full rounded-xl border border-slate-800 bg-slate-950 pl-10 pr-4 py-2 text-sm text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
          />
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => setStatusFilter("ALL")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              statusFilter === "ALL"
                ? "bg-slate-800 text-white border border-slate-700"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Tümü ({leads.length})
          </button>
          {STATUS_COLUMNS.map((col) => {
            const count = leads.filter((l) => l.status === col.key).length;
            return (
              <button
                key={col.key}
                type="button"
                onClick={() => setStatusFilter(col.key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                  statusFilter === col.key
                    ? col.badgeClass + " border"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                {col.shortLabel} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
          <span className="text-sm">Demo talepleri yükleniyor...</span>
        </div>
      ) : viewMode === "kanban" ? (
        /* KANBAN VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4 items-start">
          {STATUS_COLUMNS.filter(
            (col) => statusFilter === "ALL" || col.key === statusFilter
          ).map((col) => {
            const colLeads = filteredLeads.filter((l) => l.status === col.key);
            const ColIcon = col.icon;

            return (
              <div
                key={col.key}
                className={`rounded-2xl border ${col.borderClass} bg-slate-900/50 flex flex-col max-h-[75vh]`}
              >
                {/* Column Header */}
                <div
                  className={`p-3.5 border-b border-slate-800/80 bg-gradient-to-b ${col.headerBg} rounded-t-2xl flex items-center justify-between`}
                >
                  <div className="flex items-center gap-2">
                    <ColIcon className="h-4 w-4 text-slate-200" />
                    <span className="text-xs font-bold text-white uppercase tracking-wide">
                      {col.label}
                    </span>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[11px] font-bold border ${col.badgeClass}`}
                  >
                    {colLeads.length}
                  </span>
                </div>

                {/* Column Cards */}
                <div className="p-2.5 space-y-2.5 overflow-y-auto flex-1">
                  {colLeads.length === 0 ? (
                    <div className="py-8 text-center text-xs text-slate-600">
                      Bu aşamada kayıt yok
                    </div>
                  ) : (
                    colLeads.map((lead) => (
                      <div
                        key={lead.id}
                        className="rounded-xl border border-slate-800 bg-slate-950/90 p-3.5 space-y-3 hover:border-slate-700 transition-all shadow-sm"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h3 className="text-sm font-bold text-white leading-snug">
                              {lead.companyName}
                            </h3>
                            <p className="text-xs text-cyan-400 font-medium mt-0.5">
                              {lead.contactName}
                            </p>
                          </div>
                          {lead.employeeCount && (
                            <span className="shrink-0 rounded-md bg-slate-800 px-2 py-0.5 text-[10px] font-semibold text-slate-300 border border-slate-700">
                              {lead.employeeCount} kişi
                            </span>
                          )}
                        </div>

                        <div className="space-y-1 text-[11px] text-slate-400">
                          <div className="flex items-center gap-1.5 truncate">
                            <Mail className="h-3 w-3 text-slate-500 shrink-0" />
                            <span className="truncate">{lead.email}</span>
                          </div>
                          {lead.phone && (
                            <div className="flex items-center gap-1.5">
                              <Phone className="h-3 w-3 text-slate-500 shrink-0" />
                              <span>{lead.phone}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-1.5 text-slate-500">
                            <Calendar className="h-3 w-3 shrink-0" />
                            <span>
                              {new Date(lead.createdAt).toLocaleDateString("tr-TR", {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                              })}
                            </span>
                          </div>
                        </div>

                        {lead.notes && (
                          <div className="rounded-lg bg-slate-900 p-2 text-[11px] text-slate-300 border border-slate-800/80 line-clamp-2">
                            {lead.notes}
                          </div>
                        )}

                        {/* Status Selector & Actions */}
                        <div className="pt-2 border-t border-slate-800/80 space-y-2">
                          <div className="flex items-center gap-1.5">
                            <select
                              value={lead.status}
                              disabled={updatingId === lead.id}
                              onChange={(e) =>
                                void handleStatusChange(lead.id, e.target.value as LeadStatus)
                              }
                              className="flex-1 rounded-lg border border-slate-800 bg-slate-900 px-2 py-1 text-[11px] text-slate-200 focus:border-cyan-500 focus:outline-none"
                            >
                              {STATUS_COLUMNS.map((s) => (
                                <option key={s.key} value={s.key}>
                                  {s.label}
                                </option>
                              ))}
                            </select>

                            <button
                              type="button"
                              onClick={() => {
                                setNotesLead(lead);
                                setNotesInput(lead.notes || "");
                              }}
                              title="Not Ekle / Düzenle"
                              className="p-1.5 rounded-lg border border-slate-800 bg-slate-900 text-slate-400 hover:text-white hover:border-slate-700 cursor-pointer"
                            >
                              <StickyNote className="h-3.5 w-3.5" />
                            </button>

                            <button
                              type="button"
                              onClick={() => void handleDelete(lead.id, lead.companyName)}
                              disabled={updatingId === lead.id}
                              title="Sil"
                              className="p-1.5 rounded-lg border border-slate-800 bg-slate-900 text-slate-400 hover:text-rose-400 hover:border-rose-500/30 cursor-pointer"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>

                          {/* ADIM 4: Hesap Oluştur (Tenant Kur) Butonu */}
                          {lead.status !== "CONVERTED" ? (
                            <button
                              type="button"
                              onClick={() => openOnboardingModal(lead)}
                              className="w-full flex items-center justify-center gap-1.5 rounded-lg bg-gradient-to-r from-emerald-600/90 to-cyan-600/90 hover:from-emerald-500 hover:to-cyan-500 px-2.5 py-1.5 text-[11px] font-bold text-white shadow-sm transition-all cursor-pointer"
                            >
                              <UserPlus className="h-3.5 w-3.5" />
                              <span>Hesap Oluştur (Tenant Kur)</span>
                            </button>
                          ) : (
                            <div className="w-full flex items-center justify-center gap-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-1.5 text-[11px] font-bold text-emerald-400">
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              <span>Tenant Kuruldu ✓</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* DATAGRID / TABLE VIEW */
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/60 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  <th className="p-4">Firma & Ölçek</th>
                  <th className="p-4">Yetkili & İletişim</th>
                  <th className="p-4">Durum</th>
                  <th className="p-4">Notlar</th>
                  <th className="p-4">Tarih</th>
                  <th className="p-4 text-right">Onboarding & İşlem</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 text-sm">
                {filteredLeads.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-12 text-center text-slate-500">
                      Kriterlere uygun demo talebi bulunamadı.
                    </td>
                  </tr>
                ) : (
                  filteredLeads.map((lead) => {
                    const meta = getStatusMeta(lead.status);
                    return (
                      <tr key={lead.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="p-4">
                          <div className="font-bold text-white">{lead.companyName}</div>
                          {lead.employeeCount && (
                            <span className="inline-block mt-1 rounded bg-slate-800 px-2 py-0.5 text-[11px] text-slate-300 border border-slate-700">
                              {lead.employeeCount} Personel
                            </span>
                          )}
                        </td>
                        <td className="p-4">
                          <div className="font-medium text-cyan-300">{lead.contactName}</div>
                          <div className="text-xs text-slate-400">{lead.email}</div>
                          {lead.phone && <div className="text-xs text-slate-500">{lead.phone}</div>}
                        </td>
                        <td className="p-4">
                          <select
                            value={lead.status}
                            disabled={updatingId === lead.id}
                            onChange={(e) =>
                              void handleStatusChange(lead.id, e.target.value as LeadStatus)
                            }
                            className={`rounded-lg border px-2.5 py-1.5 text-xs font-bold bg-slate-950 focus:outline-none ${meta.badgeClass}`}
                          >
                            {STATUS_COLUMNS.map((s) => (
                              <option key={s.key} value={s.key} className="bg-slate-900 text-white">
                                {s.label}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="p-4 max-w-xs">
                          <div className="flex items-center gap-2">
                            <p className="text-xs text-slate-300 truncate max-w-[180px]">
                              {lead.notes || <span className="text-slate-600">-</span>}
                            </p>
                            <button
                              type="button"
                              onClick={() => {
                                setNotesLead(lead);
                                setNotesInput(lead.notes || "");
                              }}
                              className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
                              title="Notu Düzenle"
                            >
                              <StickyNote className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                        <td className="p-4 text-xs text-slate-400 whitespace-nowrap">
                          {new Date(lead.createdAt).toLocaleDateString("tr-TR")}
                        </td>
                        <td className="p-4 text-right">
                          <div className="inline-flex items-center gap-2">
                            {lead.status !== "CONVERTED" ? (
                              <button
                                type="button"
                                onClick={() => openOnboardingModal(lead)}
                                className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 px-3 py-1.5 text-xs font-bold text-white shadow-md transition-all cursor-pointer"
                              >
                                <UserPlus className="h-3.5 w-3.5" />
                                <span>Hesap Oluştur (Tenant Kur)</span>
                              </button>
                            ) : (
                              <span className="inline-flex items-center gap-1 rounded-xl bg-emerald-500/15 border border-emerald-500/30 px-3 py-1.5 text-xs font-bold text-emerald-400">
                                <CheckCircle2 className="h-3.5 w-3.5" />
                                <span>Tenant Kuruldu</span>
                              </span>
                            )}

                            <button
                              type="button"
                              onClick={() => void handleDelete(lead.id, lead.companyName)}
                              disabled={updatingId === lead.id}
                              className="p-2 rounded-xl border border-slate-800 text-slate-400 hover:text-rose-400 hover:border-rose-500/30 transition-colors cursor-pointer"
                              title="Sil"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Notes Edit Modal */}
      {notesLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-950 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-white">Görüşme Notları</h3>
                <p className="text-xs text-cyan-400">{notesLead.companyName}</p>
              </div>
              <button
                type="button"
                onClick={() => setNotesLead(null)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>
            <textarea
              rows={5}
              value={notesInput}
              onChange={(e) => setNotesInput(e.target.value)}
              placeholder="Satış görüşmesi detayları, teklif tutarı, demo tarihi..."
              className="w-full rounded-xl border border-slate-800 bg-slate-900 p-3 text-sm text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setNotesLead(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 bg-slate-900 hover:bg-slate-800 border border-slate-800 cursor-pointer"
              >
                İptal
              </button>
              <button
                type="button"
                onClick={() => void handleSaveNotes()}
                disabled={updatingId === notesLead.id}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-cyan-600 hover:bg-cyan-500 cursor-pointer"
              >
                Kaydet
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADIM 4: Kurumsal Onboarding (CreateTenantModal) */}
      <CreateTenantModal
        isOpen={isTenantModalOpen}
        onClose={() => {
          setIsTenantModalOpen(false);
          setSelectedLeadForOnboarding(null);
        }}
        onSuccess={() => {
          void fetchLeads();
        }}
        initialData={selectedLeadForOnboarding}
      />
    </div>
  );
}

