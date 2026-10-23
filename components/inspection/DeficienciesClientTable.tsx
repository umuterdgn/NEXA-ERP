/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Saha Kusur & Eksiklikleri İstemci Tablosu (Prisma)
 */

"use client";

import React, { useState } from "react";
import {
  FileWarning,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  Calendar,
  AlertCircle,
  Plus,
  ShieldCheck,
} from "lucide-react";
import { toast } from "react-hot-toast";
import NewDeficiencyModal from "@/components/inspection/NewDeficiencyModal";
import { resolveNCR } from "@/app/actions/inspection-core";

interface DeficiencyRecord {
  id: string;
  reportNo: string;
  projectId: string;
  description: string;
  deadline: string | Date;
  status: string;
  createdAt: string | Date;
  project?: {
    id: string;
    title: string | null;
    name?: string | null;
    yibfNo?: string | null;
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

export default function DeficienciesClientTable({
  initialDeficiencies,
  projects,
}: {
  initialDeficiencies: DeficiencyRecord[];
  projects: ProjectOption[];
}) {
  const [items, setItems] = useState<DeficiencyRecord[]>(initialDeficiencies);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [isModalOpen, setIsModalOpen] = useState(false);

  const filtered = items.filter((d) => {
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      d.reportNo.toLowerCase().includes(term) ||
      d.description.toLowerCase().includes(term) ||
      (d.project?.title && d.project.title.toLowerCase().includes(term)) ||
      (d.project?.yibfNo && d.project.yibfNo.toLowerCase().includes(term));

    const matchesStatus = statusFilter === "ALL" || d.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleCreated = (newRecord: any) => {
    setItems((prev) => [newRecord, ...prev]);
  };

  const handleResolve = async (id: string) => {
    try {
      const res = await resolveNCR(id, "VERIFIED");
      if (!res.success) {
        toast.error(res.error || "İşlem başarısız.");
        return;
      }
      toast.success("Eksiklik Başarıyla Giderildi ve Onaylandı!");
      setItems((prev) =>
        prev.map((item) => (item.id === id ? { ...item, status: "VERIFIED" } : item))
      );
    } catch {
      toast.error("Hata oluştu.");
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Üst Başlık */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800/80 pb-5">
        <div>
          <div className="flex items-center gap-2 text-blue-400 text-xs font-semibold uppercase tracking-wider mb-1">
            <FileWarning className="w-4 h-4" />
            <span>Saha Kusur Listesi & Punch List</span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Saha Kusur & Eksiklikleri</h1>
          <p className="text-slate-400 text-sm mt-0.5">
            Geçici kabul öncesi ve imalat esnasında saptanan fiziksel eksikliklerin takibi (Prisma)
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md transition cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Yeni Kusur Kaydet</span>
        </button>
      </div>

      {/* Arama ve Filtre */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Kusur No, Açıklama veya Proje ara..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-900/80 border border-slate-800 rounded-lg pl-9 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-400 shrink-0" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-900/80 border border-slate-800 rounded-lg px-3 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500 transition"
          >
            <option value="ALL">Tüm Durumlar ({items.length})</option>
            <option value="OPEN">Açık / Düzeltilmemiş</option>
            <option value="VERIFIED">Onaylandı & Kapandı</option>
          </select>
        </div>
      </div>

      {/* Kusur Listesi */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {filtered.map((item) => (
          <div
            key={item.id}
            className="rounded-xl border border-slate-800 bg-slate-900/70 p-4 flex flex-col justify-between hover:border-slate-700 transition space-y-3 shadow-sm"
          >
            <div>
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-blue-950/60 text-blue-400 border border-blue-900/70">
                  {item.reportNo}
                </span>

                {item.status === "OPEN" ? (
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-950/80 text-rose-300 border border-rose-800">
                    AÇIK KUSUR
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950/80 text-emerald-300 border border-emerald-800">
                    GİDERİLDİ
                  </span>
                )}
              </div>

              <h2 className="text-sm font-bold text-white line-clamp-2">
                {item.description}
              </h2>
              <div className="text-slate-400 text-xs mt-1">
                {item.project?.title || item.project?.name || "Proje Bilgisi Yok"}{" "}
                {item.project?.yibfNo ? `(YİBF: ${item.project.yibfNo})` : ""}
              </div>

              <div className="mt-3 pt-3 border-t border-slate-800/80 space-y-1.5 text-[11px] text-slate-300">
                <div className="flex items-center gap-1.5 text-slate-400">
                  <Calendar className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  <span>Termin: {new Date(item.deadline).toLocaleDateString("tr-TR")}</span>
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
              <div>
                {item.status === "OPEN" ? (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-rose-400">
                    <Clock className="w-3.5 h-3.5" /> Düzeltme Bekliyor
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-400">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Kapandı
                  </span>
                )}
              </div>

              {item.status === "OPEN" && (
                <button
                  onClick={() => handleResolve(item.id)}
                  className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition cursor-pointer"
                >
                  Kapat
                </button>
              )}
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="col-span-full py-12 text-center text-slate-400 rounded-xl border border-slate-800 bg-slate-900/60">
            <FileWarning className="w-8 h-8 mx-auto text-slate-600 mb-2" />
            <p className="text-sm font-medium">Kriterlere uygun saha kusuru bulunamadı.</p>
          </div>
        )}
      </div>

      {/* Yeni Kusur Modalı */}
      <NewDeficiencyModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleCreated}
        projects={projects}
      />
    </div>
  );
}
