/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Saha Kusur & Eksiklikleri (Punch List) Terminali (Yapı Denetim Modülü)
 */

"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  FileWarning,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  MapPin,
  Calendar,
  AlertCircle,
  Plus
} from "lucide-react";
import { toast } from "react-hot-toast";

interface DeficiencyItem {
  id: string;
  code: string;
  title: string;
  projectName: string;
  yibfNo: string;
  location: string;
  category: "KABA_YAPI" | "INCE_YAPI" | "MEKANIK" | "ELEKTRIK" | "YALITIM";
  severity: "URGENT" | "NORMAL" | "LOW";
  status: "OPEN" | "FIXED" | "VERIFIED";
  reportedDate: string;
}

const mockDeficiencies: DeficiencyItem[] = [
  {
    id: "1",
    code: "DEF-2026-301",
    title: "Yangın Merdiveni Basamak Genişliği ve Korkuluk Eksikliği",
    projectName: "Kuzey Plaza Ticaret Merkezi",
    yibfNo: "2024-002",
    location: "B Blok 14. Kat Yangın Holü",
    category: "INCE_YAPI",
    severity: "URGENT",
    status: "OPEN",
    reportedDate: "2026-10-22"
  },
  {
    id: "2",
    code: "DEF-2026-302",
    title: "Döşeme Betonu Segregasyon Bölgesi Tamir Harcı Uygulaması",
    projectName: "Mavi Vadi Konutları A Blok",
    yibfNo: "2024-001",
    location: "2. Kat Salon Bölgesi",
    category: "KABA_YAPI",
    severity: "NORMAL",
    status: "FIXED",
    reportedDate: "2026-10-18"
  },
  {
    id: "3",
    code: "DEF-2026-303",
    title: "Kazan Dairesi Yangın Damperi Sinyalizasyon Hattı",
    projectName: "Boğaziçi Yaşam Evleri C Blok",
    yibfNo: "2024-003",
    location: "Bodrum 2 Mekanik Oda",
    category: "MEKANIK",
    severity: "NORMAL",
    status: "VERIFIED",
    reportedDate: "2026-10-12"
  }
];

export default function DeficienciesPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const filtered = mockDeficiencies.filter(d => {
    const matchesSearch =
      d.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.projectName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.location.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "ALL" || d.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

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
            Geçici kabul öncesi ve imalat esnasında saptanan fiziksel eksikliklerin takibi
          </p>
        </div>

        <button
          onClick={() => toast.success("Yeni Kusur Bildirimi Modalı Açıldı", { icon: "📌" })}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-sm transition cursor-pointer self-start sm:self-auto"
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
            placeholder="Kusur No, Başlık, Proje veya Lokasyon ara..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-900/80 border border-slate-800 rounded-lg pl-9 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-400 shrink-0" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-900/80 border border-slate-800 rounded-lg px-3 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
          >
            <option value="ALL">Tüm Durumlar</option>
            <option value="OPEN">Açık / Düzeltilmemiş</option>
            <option value="FIXED">Müteahhit Düzeltti</option>
            <option value="VERIFIED">Denetçi Tarafından Onaylandı</option>
          </select>
        </div>
      </div>

      {/* Kusur Listesi */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {filtered.map((item) => (
          <div
            key={item.id}
            className="rounded-xl border border-slate-800 bg-slate-900/70 p-4 flex flex-col justify-between hover:border-slate-700 transition space-y-3"
          >
            <div>
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-blue-950/60 text-blue-400 border border-blue-900/70">
                  {item.code}
                </span>

                {item.severity === "URGENT" && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-950/80 text-rose-300 border border-rose-800">
                    ACİL
                  </span>
                )}
                {item.severity === "NORMAL" && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
                    NORMAL
                  </span>
                )}
              </div>

              <h2 className="text-sm font-bold text-white line-clamp-2">{item.title}</h2>
              <div className="text-slate-400 text-xs mt-1">{item.projectName}</div>

              <div className="mt-3 pt-3 border-t border-slate-800/80 space-y-1.5 text-[11px] text-slate-300">
                <div className="flex items-center gap-1.5 text-slate-400">
                  <MapPin className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                  <span>{item.location}</span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-400">
                  <Calendar className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  <span>Kayıt: {item.reportedDate}</span>
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
              <div>
                {item.status === "OPEN" && (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-rose-400">
                    <Clock className="w-3.5 h-3.5" /> Düzeltme Bekliyor
                  </span>
                )}
                {item.status === "FIXED" && (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-400">
                    <AlertCircle className="w-3.5 h-3.5" /> Denetçi Onayı Bekliyor
                  </span>
                )}
                {item.status === "VERIFIED" && (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-400">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Onaylandı & Kapandı
                  </span>
                )}
              </div>

              <button
                onClick={() => toast.success(`Kusur Detayı Açıldı: ${item.code}`, { icon: "🔍" })}
                className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs transition cursor-pointer"
              >
                Ayrıntı
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
