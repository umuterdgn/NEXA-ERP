/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Uygunsuzluk & DÖF (Non-Conformance Report) Terminali (Yapı Denetim Modülü)
 */

"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  Calendar,
  ShieldAlert,
  FileWarning,
  Plus
} from "lucide-react";
import { toast } from "react-hot-toast";

interface NcrRecord {
  id: string;
  ncrCode: string;
  title: string;
  description: string;
  yibfNo: string;
  projectName: string;
  severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  deadline: string;
  status: "OPEN" | "IN_PROGRESS" | "CLOSED" | "ESCALATED";
  reportedBy: string;
}

const mockNcrs: NcrRecord[] = [
  {
    id: "1",
    ncrCode: "NCR-2026-014",
    title: "Zemin Kat P102 Perdesinde Paspayı Yetersizliği ve Donatı Açığı",
    description: "Kalıp sökümü sonrasında paspayı takozu kullanılmadığı için donatı demirleri dışarıdan görünür vaziyette tespit edildi.",
    yibfNo: "2024-003",
    projectName: "Boğaziçi Yaşam Evleri C Blok",
    severity: "CRITICAL",
    deadline: "2026-10-26",
    status: "OPEN",
    reportedBy: "Mehmet Demir (Kontrol Müh.)"
  },
  {
    id: "2",
    ncrCode: "NCR-2026-015",
    title: "Kiriş Donatısında Etriye Sıklaştırma Aralığı Uyuşmazlığı",
    description: "K204 kirişinin mesnet bölgesinde statik projede 8 cm öngörülen etriye aralığı sahada 16 cm olarak bağlandı.",
    yibfNo: "2024-001",
    projectName: "Mavi Vadi Konutları A Blok",
    severity: "HIGH",
    deadline: "2026-10-24",
    status: "IN_PROGRESS",
    reportedBy: "Umut Erdoğan (Statik Denetçi)"
  },
  {
    id: "3",
    ncrCode: "NCR-2026-016",
    title: "Bodrum Kat Çevre Drenaj Hattı Eğim Hatası",
    description: "Temel drenaj borusunda ters eğim tespit edildi. Düzeltici faaliyet olarak kırmataş yatağı yenilendi.",
    yibfNo: "2024-002",
    projectName: "Kuzey Plaza Ticaret Merkezi",
    severity: "MEDIUM",
    deadline: "2026-10-15",
    status: "CLOSED",
    reportedBy: "Caner Yurt (Mak. Müh.)"
  }
];

export default function NcrPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const filtered = mockNcrs.filter(n => {
    const matchesSearch =
      n.ncrCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      n.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      n.projectName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "ALL" || n.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getSeverityBadge = (sev: NcrRecord["severity"]) => {
    switch (sev) {
      case "CRITICAL":
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-950/80 text-rose-300 border border-rose-800">KRİTİK KUSUR</span>;
      case "HIGH":
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-orange-950/80 text-orange-300 border border-orange-800">YÜKSEK</span>;
      case "MEDIUM":
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-950/80 text-amber-300 border border-amber-800">ORTA</span>;
      case "LOW":
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-950/80 text-blue-300 border border-blue-800">DÜŞÜK</span>;
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Üst Başlık */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800/80 pb-5">
        <div>
          <div className="flex items-center gap-2 text-rose-400 text-xs font-semibold uppercase tracking-wider mb-1">
            <AlertTriangle className="w-4 h-4" />
            <span>Kusur Tespiti & Düzeltici Önleyici Faaliyet</span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Uygunsuzluk & DÖF (NCR)</h1>
          <p className="text-slate-400 text-sm mt-0.5">
            Şantiyede tespit edilen imalat hataları, müteahhide tanınan terminler ve DÖF kapatma vizeleri
          </p>
        </div>

        <button
          onClick={() => toast.success("Yeni Uygunsuzluk / DÖF Tutanağı Başlatıldı", { icon: "⚠️" })}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shadow-sm transition cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Yeni DÖF Aç</span>
        </button>
      </div>

      {/* KPI Kartları */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
          <div className="text-slate-400 text-xs font-medium">Toplam Açılan DÖF</div>
          <div className="text-2xl font-bold text-white mt-1">16 Adet</div>
          <div className="text-[11px] text-slate-400 mt-1">2026 yılı geneli</div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
          <div className="text-slate-400 text-xs font-medium">Açık / Termin Bekleyen</div>
          <div className="text-2xl font-bold text-rose-400 mt-1">3 DÖF</div>
          <div className="text-[11px] text-rose-400/80 mt-1">1 tanesi kritik seviyede</div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
          <div className="text-slate-400 text-xs font-medium">Düzeltilen & Kapatılan</div>
          <div className="text-2xl font-bold text-emerald-400 mt-1">13 DÖF</div>
          <div className="text-[11px] text-emerald-400/80 mt-1">%81 başarıyla giderildi</div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
          <div className="text-slate-400 text-xs font-medium">Bakanlığa Bildirilen</div>
          <div className="text-2xl font-bold text-amber-400 mt-1">0 Adet</div>
          <div className="text-[11px] text-emerald-400 mt-1">Yerel uzlaşmayla çözüldü</div>
        </div>
      </div>

      {/* Arama ve Filtre */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="DÖF Kodu, Başlık veya Proje ara..."
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
            <option value="OPEN">Açık Olanlar</option>
            <option value="IN_PROGRESS">Düzeltme Aşamasında</option>
            <option value="CLOSED">Giderildi (Kapatıldı)</option>
          </select>
        </div>
      </div>

      {/* DÖF Listesi */}
      <div className="space-y-3">
        {filtered.map((item) => (
          <div
            key={item.id}
            className="rounded-xl border border-slate-800 bg-slate-900/70 p-4 hover:border-slate-700 transition space-y-2.5"
          >
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-slate-800 text-blue-400 border border-slate-700">
                  {item.ncrCode}
                </span>
                {getSeverityBadge(item.severity)}
                <span className="text-slate-400 text-xs">{item.projectName} (YİBF: {item.yibfNo})</span>
              </div>

              <div>
                {item.status === "OPEN" && (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-rose-400">
                    <Clock className="w-3.5 h-3.5" /> Termin: {item.deadline}
                  </span>
                )}
                {item.status === "IN_PROGRESS" && (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-400">
                    <Clock className="w-3.5 h-3.5" /> Düzeltiliyor
                  </span>
                )}
                {item.status === "CLOSED" && (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-400">
                    <CheckCircle2 className="w-3.5 h-3.5" /> DÖF Başarıyla Kapatıldı
                  </span>
                )}
              </div>
            </div>

            <h2 className="text-sm font-bold text-white">{item.title}</h2>
            <p className="text-slate-300 text-xs leading-relaxed">{item.description}</p>

            <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
              <span className="text-slate-400">Tespit Eden: {item.reportedBy}</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => toast.success(`DÖF Tutanağı Yazdırıldı: ${item.ncrCode}`, { icon: "🖨️" })}
                  className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition cursor-pointer"
                >
                  Yazdır
                </button>
                {item.status !== "CLOSED" && (
                  <button
                    onClick={() => toast.success(`DÖF Kapatma Denetimi Başlatıldı: ${item.ncrCode}`, { icon: "✅" })}
                    className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-semibold transition cursor-pointer"
                  >
                    Kusuru Kapat
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
