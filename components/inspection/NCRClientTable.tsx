/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Uygunsuzluk & DÖF (NCR) İstemci Tablo Bileşeni (CRUD + Modallar)
 */

"use client";

import React, { useState } from "react";
import {
  AlertTriangle,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  Calendar,
  ShieldAlert,
  FileWarning,
  Plus,
  Eye,
  Building2,
  ShieldCheck,
} from "lucide-react";
import { toast } from "react-hot-toast";
import NewNCRModal from "@/components/inspection/NewNCRModal";
import NCRDetailModal from "@/components/inspection/NCRDetailModal";

interface NCRRecord {
  id: string;
  reportNo: string;
  projectId: string;
  description: string;
  deadline: string | Date;
  status: string;
  photos?: string[];
  createdAt: string | Date;
  project?: {
    id: string;
    title: string | null;
    name?: string | null;
    yibfNo?: string | null;
    location?: string | null;
  } | null;
  creator?: {
    id: string;
    name: string | null;
    email: string | null;
  } | null;
}

interface ProjectOption {
  id: string;
  title: string | null;
  name?: string | null;
  yibfNo?: string | null;
}

export default function NCRClientTable({
  initialNcrs,
  projects,
}: {
  initialNcrs: NCRRecord[];
  projects: ProjectOption[];
}) {
  const [ncrs, setNcrs] = useState<NCRRecord[]>(initialNcrs);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [selectedNcr, setSelectedNcr] = useState<NCRRecord | null>(null);

  const filtered = ncrs.filter((n) => {
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      n.reportNo.toLowerCase().includes(term) ||
      n.description.toLowerCase().includes(term) ||
      (n.project?.title && n.project.title.toLowerCase().includes(term)) ||
      (n.project?.name && n.project.name.toLowerCase().includes(term)) ||
      (n.project?.yibfNo && n.project.yibfNo.toLowerCase().includes(term));
    const matchesStatus = statusFilter === "ALL" || n.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalCount = ncrs.length;
  const openCount = ncrs.filter((n) => n.status === "OPEN").length;
  const resolvedCount = ncrs.filter((n) => n.status === "RESOLVED" || n.status === "VERIFIED").length;

  const handleCreated = (newNcr: any) => {
    setNcrs((prev) => [newNcr, ...prev]);
  };

  const handleUpdated = (updatedNcr: any) => {
    setNcrs((prev) =>
      prev.map((n) => (n.id === updatedNcr.id ? { ...n, ...updatedNcr } : n))
    );
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "VERIFIED":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-950/80 text-emerald-400 border border-emerald-800">
            <ShieldCheck className="w-3.5 h-3.5" /> Doğrulandı (Kapatıldı)
          </span>
        );
      case "RESOLVED":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-950/80 text-blue-400 border border-blue-800">
            <CheckCircle2 className="w-3.5 h-3.5" /> Giderildi
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-950/80 text-rose-400 border border-rose-800">
            <Clock className="w-3.5 h-3.5" /> Açık Kusur
          </span>
        );
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Üst Başlık & Butonlar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800/80 pb-5">
        <div>
          <div className="flex items-center gap-2 text-rose-400 text-xs font-semibold uppercase tracking-wider mb-1">
            <AlertTriangle className="w-4 h-4" />
            <span>Kusur Tespiti & Düzeltici Önleyici Faaliyet (NCR)</span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Uygunsuzluk & DÖF</h1>
          <p className="text-slate-400 text-sm mt-0.5">
            Şantiyede tespit edilen imalat hataları, müteahhide tanınan terminler ve kapatma vizeleri (Prisma)
          </p>
        </div>

        <button
          onClick={() => setIsNewModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shadow-md transition cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Yeni DÖF Başlat</span>
        </button>
      </div>

      {/* KPI Kartları */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
          <div className="text-slate-400 text-xs font-medium">Toplam Açılan DÖF</div>
          <div className="text-2xl font-bold text-white mt-1">{totalCount} Adet</div>
          <div className="text-[11px] text-slate-400 mt-1">Veritabanı Kayıtlı</div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
          <div className="text-slate-400 text-xs font-medium">Açık / Termin Bekleyen</div>
          <div className="text-2xl font-bold text-rose-400 mt-1">{openCount} DÖF</div>
          <div className="text-[11px] text-rose-400/80 mt-1">Giderilme aşamasında</div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
          <div className="text-slate-400 text-xs font-medium">Giderilen / Kapatılan</div>
          <div className="text-2xl font-bold text-emerald-400 mt-1">{resolvedCount} DÖF</div>
          <div className="text-[11px] text-emerald-400/80 mt-1">Denetçi vizesi alındı</div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
          <div className="text-slate-400 text-xs font-medium">Bakanlığa Bildirilen</div>
          <div className="text-2xl font-bold text-amber-400 mt-1">0 Adet</div>
          <div className="text-[11px] text-emerald-400 mt-1">Şantiye içi giderildi</div>
        </div>
      </div>

      {/* Arama ve Filtre */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="DÖF Tutanağı No, Kusur Açıklaması veya Proje Adı ara..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-900/80 border border-slate-800 rounded-lg pl-9 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500 transition"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-400 shrink-0" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-900/80 border border-slate-800 rounded-lg px-3 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-rose-500 transition"
          >
            <option value="ALL">Tüm Durumlar ({ncrs.length})</option>
            <option value="OPEN">Açık Kusurlar</option>
            <option value="RESOLVED">Giderilenler</option>
            <option value="VERIFIED">Doğrulanmış (Kapanan)</option>
          </select>
        </div>
      </div>

      {/* DÖF Kart Listesi */}
      <div className="space-y-3">
        {filtered.map((item) => (
          <div
            key={item.id}
            className="rounded-xl border border-slate-800 bg-slate-900/70 p-4 hover:border-slate-700 transition space-y-3 shadow-sm"
          >
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div className="flex items-center gap-2.5 flex-wrap">
                <span className="font-mono text-xs font-semibold px-2.5 py-0.5 rounded bg-slate-800 text-rose-300 border border-slate-700">
                  {item.reportNo}
                </span>
                {getStatusBadge(item.status)}
                <span className="text-slate-300 text-xs font-medium">
                  {item.project?.title || item.project?.name || "Proje Bilgisi Yok"}
                  {item.project?.yibfNo ? ` (YİBF: ${item.project.yibfNo})` : ""}
                </span>
              </div>

              <div className="text-xs text-slate-400 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-500" />
                <span>Termin: {new Date(item.deadline).toLocaleDateString("tr-TR")}</span>
              </div>
            </div>

            <p className="text-slate-200 text-xs leading-relaxed bg-slate-950/60 p-3 rounded-lg border border-slate-800/80">
              {item.description}
            </p>

            <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
              <span className="text-slate-400">
                Açılış: {new Date(item.createdAt).toLocaleDateString("tr-TR")} • Denetçi:{" "}
                <strong className="text-slate-300">{item.creator?.name || "Saha Denetçisi"}</strong>
              </span>

              <button
                onClick={() => setSelectedNcr(item)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition cursor-pointer"
              >
                <Eye className="w-3.5 h-3.5 text-rose-400" />
                <span>İncele / Durum Değiştir</span>
              </button>
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="py-12 text-center text-slate-400 rounded-xl border border-slate-800 bg-slate-900/60">
            <AlertTriangle className="w-8 h-8 mx-auto text-slate-600 mb-2" />
            <p className="text-sm font-medium">Kriterlere uygun DÖF kaydı bulunamadı.</p>
          </div>
        )}
      </div>

      {/* Yeni DÖF Modalı */}
      <NewNCRModal
        isOpen={isNewModalOpen}
        onClose={() => setIsNewModalOpen(false)}
        onSuccess={handleCreated}
        projects={projects}
      />

      {/* Detay & Çözüm Modalı */}
      <NCRDetailModal
        ncr={selectedNcr}
        isOpen={!!selectedNcr}
        onClose={() => setSelectedNcr(null)}
        onStatusUpdated={handleUpdated}
      />
    </div>
  );
}
