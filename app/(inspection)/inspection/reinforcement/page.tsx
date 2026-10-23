/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Demir & Kalıp Kontrol (Vize) Terminali (Yapı Denetim Modülü)
 */

"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Construction,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Camera,
  FileCheck,
  ShieldCheck,
  Printer,
  Plus
} from "lucide-react";
import { toast } from "react-hot-toast";

interface ReinforcementInspection {
  id: string;
  vizeNo: string;
  projectName: string;
  yibfNo: string;
  floorElement: string;
  barDiameters: string;
  stirrupSpacing: string;
  coverThickness: string;
  formworkStatus: "OK" | "DEFECT";
  vizeStatus: "APPROVED" | "PENDING" | "REJECTED";
  inspectorName: string;
  date: string;
}

const mockReinforcements: ReinforcementInspection[] = [
  {
    id: "1",
    vizeNo: "VIZE-2026-041",
    projectName: "Mavi Vadi Konutları A Blok",
    yibfNo: "2024-001",
    floorElement: "4. Kat Tabliye & Kiriş Donatıları",
    barDiameters: "Ø14, Ø16, Ø20 (B420C)",
    stirrupSpacing: "10 cm (Sıklaştırma), 15 cm (Gövde)",
    coverThickness: "3.5 cm (Paspayı Takozları Tam)",
    formworkStatus: "OK",
    vizeStatus: "APPROVED",
    inspectorName: "Umut Erdoğan (Statik Denetçi)",
    date: "2026-10-23"
  },
  {
    id: "2",
    vizeNo: "VIZE-2026-042",
    projectName: "Kuzey Plaza Ticaret Merkezi",
    yibfNo: "2024-002",
    floorElement: "19. Kat Kolon & Çekirdek Perde Aplikasyonu",
    barDiameters: "Ø25, Ø28 (B420C)",
    stirrupSpacing: "8 cm (Sıklaştırma)",
    coverThickness: "4.0 cm",
    formworkStatus: "OK",
    vizeStatus: "PENDING",
    inspectorName: "Ahmet Yılmaz (Statik Müh.)",
    date: "2026-10-22"
  },
  {
    id: "3",
    vizeNo: "VIZE-2026-043",
    projectName: "Boğaziçi Yaşam Evleri C Blok",
    yibfNo: "2024-003",
    floorElement: "Zemin Kat P101-P103 Perdeleri",
    barDiameters: "Ø12, Ø16",
    stirrupSpacing: "Eksik çiroz ve aralık hatası",
    coverThickness: "1.5 cm (Yetersiz paspayı)",
    formworkStatus: "DEFECT",
    vizeStatus: "REJECTED",
    inspectorName: "Mehmet Demir (Kontrol Müh.)",
    date: "2026-10-21"
  }
];

export default function ReinforcementPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const filtered = mockReinforcements.filter(r => {
    const matchesSearch =
      r.vizeNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.projectName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.floorElement.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "ALL" || r.vizeStatus === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Üst Başlık */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800/80 pb-5">
        <div>
          <div className="flex items-center gap-2 text-blue-400 text-xs font-semibold uppercase tracking-wider mb-1">
            <Construction className="w-4 h-4" />
            <span>Statik Proje Uygunluk & Döküm İzinleri</span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Demir & Kalıp Kontrol (Vize)</h1>
          <p className="text-slate-400 text-sm mt-0.5">
            Beton dökümü öncesinde donatı çapı, aralığı, paspayı ve kalıp rijitliği vize tutanakları
          </p>
        </div>

        <button
          onClick={() => toast.success("Yeni Donatı Vize Muayenesi Başlatıldı", { icon: "📏" })}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-sm transition cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Yeni Vize Muayenesi</span>
        </button>
      </div>

      {/* KPI Kartları */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
          <div className="text-slate-400 text-xs font-medium">Onaylanan Vizeler (Bu Ay)</div>
          <div className="text-2xl font-bold text-emerald-400 mt-1">26 Adet</div>
          <div className="text-[11px] text-emerald-400/80 mt-1">Beton dökümüne izin verildi</div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
          <div className="text-slate-400 text-xs font-medium">Saha Muayenesi Bekleyen</div>
          <div className="text-2xl font-bold text-amber-400 mt-1">4 Vize</div>
          <div className="text-[11px] text-amber-400/80 mt-1">Denetçi mühendis görevlendirildi</div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
          <div className="text-slate-400 text-xs font-medium">Reddedilen / Kusurlu</div>
          <div className="text-2xl font-bold text-rose-400 mt-1">2 Adet</div>
          <div className="text-[11px] text-rose-400/80 mt-1">Paspayı ve etriye düzeltmesi istendi</div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
          <div className="text-slate-400 text-xs font-medium">Paspayı Uygunluk Oranı</div>
          <div className="text-2xl font-bold text-white mt-1">%94.2</div>
          <div className="text-[11px] text-blue-400 mt-1">TS 500 & TBDY 2018 standartları</div>
        </div>
      </div>

      {/* Arama ve Filtre */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Vize No, Proje Adı veya Eleman ara..."
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
            <option value="ALL">Tüm Vizeler</option>
            <option value="APPROVED">Onaylananlar (Geçti)</option>
            <option value="PENDING">Muayene Bekleyenler</option>
            <option value="REJECTED">Reddedilenler</option>
          </select>
        </div>
      </div>

      {/* Vize Listesi Tablosu */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Vize No / Eleman</th>
                <th className="py-3 px-4">Proje / YİBF</th>
                <th className="py-3 px-4">Donatı & Etriye Detayı</th>
                <th className="py-3 px-4">Paspayı & Kalıp</th>
                <th className="py-3 px-4">Denetçi / Tarih</th>
                <th className="py-3 px-4">Vize Durumu</th>
                <th className="py-3 px-4 text-right">Eylem</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {filtered.map((item) => (
                <tr key={item.id} className="hover:bg-slate-800/40 transition">
                  <td className="py-3.5 px-4 font-semibold text-white">
                    <div className="font-mono text-blue-400">{item.vizeNo}</div>
                    <div className="text-slate-300 font-medium mt-0.5">{item.floorElement}</div>
                  </td>

                  <td className="py-3.5 px-4">
                    <div className="font-semibold text-slate-200">{item.projectName}</div>
                    <div className="text-[11px] text-slate-400">YİBF: {item.yibfNo}</div>
                  </td>

                  <td className="py-3.5 px-4">
                    <div className="text-slate-200 font-medium">{item.barDiameters}</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">{item.stirrupSpacing}</div>
                  </td>

                  <td className="py-3.5 px-4">
                    <div className="text-slate-200">{item.coverThickness}</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      Kalıp: {item.formworkStatus === "OK" ? "✅ Şakülünde & Temiz" : "❌ Kusurlu"}
                    </div>
                  </td>

                  <td className="py-3.5 px-4">
                    <div className="text-slate-300 font-medium">{item.inspectorName}</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">{item.date}</div>
                  </td>

                  <td className="py-3.5 px-4">
                    {item.vizeStatus === "APPROVED" && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-950/60 text-emerald-400 border border-emerald-800/80">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Döküm Onaylandı
                      </span>
                    )}
                    {item.vizeStatus === "PENDING" && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-950/60 text-amber-400 border border-amber-800/80">
                        <Clock className="w-3.5 h-3.5" /> Muayene Bekliyor
                      </span>
                    )}
                    {item.vizeStatus === "REJECTED" && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-950/60 text-rose-400 border border-rose-800/80">
                        <AlertTriangle className="w-3.5 h-3.5" /> Reddedildi (Döküm Yasak)
                      </span>
                    )}
                  </td>

                  <td className="py-3.5 px-4 text-right">
                    <button
                      onClick={() => toast.success(`Vize Tutanağı Açıldı: ${item.vizeNo}`, { icon: "📋" })}
                      className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs transition cursor-pointer"
                    >
                      Tutanağı Aç
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
