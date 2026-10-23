/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Kalite & Malzeme Onayları Terminali (Yapı Denetim Modülü)
 */

"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  CheckSquare,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ShieldCheck,
  FileCheck2,
  FileText,
  Plus
} from "lucide-react";
import { toast } from "react-hot-toast";

interface MaterialApproval {
  id: string;
  code: string;
  materialName: string;
  manufacturer: string;
  standard: string;
  certificateType: "TSE" | "CE" | "ISO" | "LAB_TEST";
  projectName: string;
  yibfNo: string;
  status: "APPROVED" | "UNDER_REVIEW" | "REJECTED";
  approvalDate: string;
}

const mockMaterials: MaterialApproval[] = [
  {
    id: "1",
    code: "MAT-2026-051",
    materialName: "C30/37 Hazır Beton (S3 Kıvam, Dmax=22mm)",
    manufacturer: "Çimsa Çimento Sanayi A.Ş.",
    standard: "TS EN 206 / TS 13515",
    certificateType: "TSE",
    projectName: "Mavi Vadi Konutları A Blok",
    yibfNo: "2024-001",
    status: "APPROVED",
    approvalDate: "2026-10-10"
  },
  {
    id: "2",
    code: "MAT-2026-052",
    materialName: "B420C Nervürlü Beton Donatı Çeliği (Ø8-Ø32)",
    manufacturer: "İçdaş Çelik Enerji Tersane A.Ş.",
    standard: "TS 708:2016",
    certificateType: "TSE",
    projectName: "Mavi Vadi Konutları A Blok",
    yibfNo: "2024-001",
    status: "APPROVED",
    approvalDate: "2026-09-28"
  },
  {
    id: "3",
    code: "MAT-2026-053",
    materialName: "Bitümlü Su Yalıtım Membranı (4mm Polyester Keçeli)",
    manufacturer: "BTM Yalıtım Sanayi Tic.",
    standard: "TS EN 13707",
    certificateType: "CE",
    projectName: "Boğaziçi Yaşam Evleri C Blok",
    yibfNo: "2024-003",
    status: "UNDER_REVIEW",
    approvalDate: "2026-10-22"
  }
];

export default function MaterialsApprovalPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const filtered = mockMaterials.filter(m => {
    const matchesSearch =
      m.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.materialName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.manufacturer.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.projectName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "ALL" || m.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Üst Başlık */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800/80 pb-5">
        <div>
          <div className="flex items-center gap-2 text-blue-400 text-xs font-semibold uppercase tracking-wider mb-1">
            <CheckSquare className="w-4 h-4" />
            <span>Şantiye Girdi Kontrolü & Sertifikasyon</span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Kalite: Malzeme Onayları</h1>
          <p className="text-slate-400 text-sm mt-0.5">
            Beton, demir, yalıtım ve mekanik bileşenlerin TSE, CE ve fabrika deney föyleri uygunluk onayları
          </p>
        </div>

        <button
          onClick={() => toast.success("Yeni Malzeme Onay Talebi Başlatıldı", { icon: "📦" })}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-sm transition cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Yeni Malzeme Onayı</span>
        </button>
      </div>

      {/* Arama ve Filtre */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Malzeme Adı, Üretici, Standart veya Proje ara..."
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
            <option value="APPROVED">Onaylananlar (Kullanılabilir)</option>
            <option value="UNDER_REVIEW">İnceleme Aşamasında</option>
            <option value="REJECTED">Reddedilenler</option>
          </select>
        </div>
      </div>

      {/* Malzeme Tablosu */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Kod / Malzeme Adı</th>
                <th className="py-3 px-4">Üretici Firma / Standart</th>
                <th className="py-3 px-4">Sertifika Türü</th>
                <th className="py-3 px-4">Proje / YİBF</th>
                <th className="py-3 px-4">Durum</th>
                <th className="py-3 px-4 text-right">Eylem</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {filtered.map((item) => (
                <tr key={item.id} className="hover:bg-slate-800/40 transition">
                  <td className="py-3.5 px-4 font-semibold text-white">
                    <div className="font-mono text-blue-400">{item.code}</div>
                    <div className="text-slate-200 font-medium mt-0.5">{item.materialName}</div>
                  </td>

                  <td className="py-3.5 px-4">
                    <div className="font-medium text-slate-200">{item.manufacturer}</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">{item.standard}</div>
                  </td>

                  <td className="py-3.5 px-4">
                    <span className="font-semibold px-2 py-0.5 rounded bg-blue-950/60 text-blue-300 border border-blue-900/60">
                      {item.certificateType}
                    </span>
                  </td>

                  <td className="py-3.5 px-4">
                    <div className="text-slate-200">{item.projectName}</div>
                    <div className="text-[11px] text-slate-400">YİBF: {item.yibfNo}</div>
                  </td>

                  <td className="py-3.5 px-4">
                    {item.status === "APPROVED" && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-950/60 text-emerald-400 border border-emerald-800/80">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Kullanım İzni Verildi
                      </span>
                    )}
                    {item.status === "UNDER_REVIEW" && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-950/60 text-amber-400 border border-amber-800/80">
                        <Clock className="w-3.5 h-3.5" /> Laboratuvar İncelemesinde
                      </span>
                    )}
                    {item.status === "REJECTED" && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-950/60 text-rose-400 border border-rose-800/80">
                        <AlertTriangle className="w-3.5 h-3.5" /> Reddedildi
                      </span>
                    )}
                  </td>

                  <td className="py-3.5 px-4 text-right">
                    <button
                      onClick={() => toast.success(`Malzeme Sertifikası Görüntülendi: ${item.code}`, { icon: "📄" })}
                      className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs transition cursor-pointer"
                    >
                      Sertifika
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
