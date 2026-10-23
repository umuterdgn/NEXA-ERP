/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Dinamik Denetim Formları & Vize Tutanakları (Yapı Denetim Modülü)
 */

"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ClipboardCheck,
  Search,
  Filter,
  Plus,
  FileCheck2,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileText,
  UserCheck,
  Building,
  Calendar,
  ExternalLink,
  PenTool,
  Printer
} from "lucide-react";
import { toast } from "react-hot-toast";

interface InspectionFormItem {
  id: string;
  formNumber: string;
  formType: "DEMIR_VIZE" | "BETON_DOKUM" | "KALIP_ISKELE" | "ISG_DENETIM" | "TESISAT_KONTROL";
  title: string;
  yibfNo: string;
  projectName: string;
  inspectorName: string;
  date: string;
  signatureCount: number;
  maxSignatures: number;
  status: "DRAFT" | "PENDING_SIGNATURE" | "APPROVED" | "REVISION_REQUESTED";
}

const mockForms: InspectionFormItem[] = [
  {
    id: "1",
    formNumber: "FRM-2026-081",
    formType: "DEMIR_VIZE",
    title: "Donatı & Demir Vizesi Kontrol Formu (4. Kat Tabliye)",
    yibfNo: "2024-001",
    projectName: "Mavi Vadi Konutları A Blok",
    inspectorName: "Umut Erdoğan (İnş. Müh.)",
    date: "2026-10-23",
    signatureCount: 3,
    maxSignatures: 3,
    status: "APPROVED"
  },
  {
    id: "2",
    formNumber: "FRM-2026-082",
    formType: "BETON_DOKUM",
    title: "Beton Döküm İzin & Numune Alma Tutanağı",
    yibfNo: "2024-001",
    projectName: "Mavi Vadi Konutları A Blok",
    inspectorName: "Umut Erdoğan (İnş. Müh.)",
    date: "2026-10-22",
    signatureCount: 2,
    maxSignatures: 3,
    status: "PENDING_SIGNATURE"
  },
  {
    id: "3",
    formNumber: "FRM-2026-083",
    formType: "KALIP_ISKELE",
    title: "Ahşap & Çelik Kalıp Güvenlik Muayene Formu",
    yibfNo: "2024-002",
    projectName: "Kuzey Plaza Ticaret Merkezi",
    inspectorName: "Ahmet Yılmaz (Statik Müh.)",
    date: "2026-10-21",
    signatureCount: 3,
    maxSignatures: 3,
    status: "APPROVED"
  },
  {
    id: "4",
    formNumber: "FRM-2026-084",
    formType: "ISG_DENETIM",
    title: "Saha İSG & Çevre Tedbirleri Haftalık Uygunluk Formu",
    yibfNo: "2024-003",
    projectName: "Boğaziçi Yaşam Evleri C Blok",
    inspectorName: "Mehmet Demir (Kontrol Müh.)",
    date: "2026-10-20",
    signatureCount: 1,
    maxSignatures: 3,
    status: "REVISION_REQUESTED"
  },
  {
    id: "5",
    formNumber: "FRM-2026-085",
    formType: "TESISAT_KONTROL",
    title: "Sıhhi Tesisat ve Yangın Kolon Basınç Sızdırmazlık Tutanağı",
    yibfNo: "2024-004",
    projectName: "Ataköy Marina Residance B Blok",
    inspectorName: "Ayşe Kaya (Mimar Denetçi)",
    date: "2026-10-18",
    signatureCount: 0,
    maxSignatures: 2,
    status: "DRAFT"
  }
];

export default function DynamicFormsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [selectedType, setSelectedType] = useState("ALL");

  const filteredForms = mockForms.filter(f => {
    const matchesSearch =
      f.formNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.projectName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.yibfNo.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "ALL" || f.status === statusFilter;
    const matchesType = selectedType === "ALL" || f.formType === selectedType;
    return matchesSearch && matchesStatus && matchesType;
  });

  const getStatusBadge = (status: InspectionFormItem["status"]) => {
    switch (status) {
      case "APPROVED":
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-950/60 text-emerald-400 border border-emerald-800/80"><CheckCircle2 className="w-3.5 h-3.5" /> Onaylandı & İmzalandı</span>;
      case "PENDING_SIGNATURE":
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-950/60 text-amber-400 border border-amber-800/80"><Clock className="w-3.5 h-3.5" /> İmzalar Bekleniyor</span>;
      case "REVISION_REQUESTED":
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-950/60 text-rose-400 border border-rose-800/80"><AlertCircle className="w-3.5 h-3.5" /> Revizyon Talebi Var</span>;
      case "DRAFT":
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-800 text-slate-300 border border-slate-700"><FileText className="w-3.5 h-3.5" /> Taslak</span>;
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Üst Başlık & Aksiyon Butonu */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800/80 pb-5">
        <div>
          <div className="flex items-center gap-2 text-blue-400 text-xs font-semibold uppercase tracking-wider mb-1">
            <ClipboardCheck className="w-4 h-4" />
            <span>Resmi Tutanaklar ve Denetim Kontrol Listeleri</span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Dinamik Denetim Formları</h1>
          <p className="text-slate-400 text-sm mt-0.5">
            Saha denetçileri için dijital vize, kalıp, donatı ve beton döküm tutanakları (e-İmza Destekli)
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            href="/admin/forms/builder"
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-medium border border-slate-700 transition cursor-pointer"
          >
            <PenTool className="w-4 h-4 text-blue-400" />
            <span>Form Şablon Tasarlayıcı</span>
          </Link>

          <button
            onClick={() => toast.success("Yeni Vize / Denetim Formu Sihirbazı Açılıyor...", { icon: "📝" })}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-sm transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Yeni Tutanak Başlat</span>
          </button>
        </div>
      </div>

      {/* KPI Kartları */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
          <div className="text-slate-400 text-xs font-medium">Bu Ay Düzenlenen Tutanak</div>
          <div className="text-2xl font-bold text-white mt-1">48 Form</div>
          <div className="text-[11px] text-emerald-400 mt-1">Bakanlık arşivine kaydedildi</div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
          <div className="text-slate-400 text-xs font-medium">Onaylanan Demir Vizeleri</div>
          <div className="text-2xl font-bold text-blue-400 mt-1">22 Adet</div>
          <div className="text-[11px] text-blue-400/80 mt-1">Döküm izni verildi</div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
          <div className="text-slate-400 text-xs font-medium">İmza Bekleyen Tutanaklar</div>
          <div className="text-2xl font-bold text-amber-400 mt-1">5 Form</div>
          <div className="text-[11px] text-amber-400/80 mt-1">Şantiye Şefi & Denetçi</div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
          <div className="text-slate-400 text-xs font-medium">Revizyon Talepleri</div>
          <div className="text-2xl font-bold text-rose-400 mt-1">2 Form</div>
          <div className="text-[11px] text-rose-400/80 mt-1">Eksik donatı / kalıp hatası</div>
        </div>
      </div>

      {/* Arama ve Filtreler */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Form No, Tutanak Başlığı, Proje veya YİBF ara..."
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
            <option value="APPROVED">Onaylananlar</option>
            <option value="PENDING_SIGNATURE">İmza Bekleyenler</option>
            <option value="REVISION_REQUESTED">Revizyon Talepleri</option>
            <option value="DRAFT">Taslaklar</option>
          </select>

          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="bg-slate-900/80 border border-slate-800 rounded-lg px-3 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
          >
            <option value="ALL">Tüm Form Tipleri</option>
            <option value="DEMIR_VIZE">Demir & Donatı Vizesi</option>
            <option value="BETON_DOKUM">Beton Döküm İzni</option>
            <option value="KALIP_ISKELE">Kalıp & İskele</option>
            <option value="ISG_DENETIM">İSG & Çevre</option>
            <option value="TESISAT_KONTROL">Mekanik & Tesisat</option>
          </select>
        </div>
      </div>

      {/* Form Listesi Tablosu */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Form No / Tutanak Adı</th>
                <th className="py-3 px-4">İlişkili Proje / YİBF</th>
                <th className="py-3 px-4">Sorumlu Denetçi</th>
                <th className="py-3 px-4">Tarih</th>
                <th className="py-3 px-4">İmza Durumu</th>
                <th className="py-3 px-4">Durum</th>
                <th className="py-3 px-4 text-right">İşlem</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {filteredForms.map((form) => (
                <tr key={form.id} className="hover:bg-slate-800/40 transition">
                  <td className="py-3.5 px-4">
                    <div className="font-mono text-xs font-semibold text-blue-400 flex items-center gap-2">
                      <FileText className="w-3.5 h-3.5 text-slate-400" />
                      <span>{form.formNumber}</span>
                    </div>
                    <div className="text-white font-medium mt-1 truncate max-w-sm">
                      {form.title}
                    </div>
                  </td>

                  <td className="py-3.5 px-4">
                    <div className="font-semibold text-slate-200 truncate max-w-xs">{form.projectName}</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">YİBF No: {form.yibfNo}</div>
                  </td>

                  <td className="py-3.5 px-4">
                    <div className="text-slate-300 flex items-center gap-1.5">
                      <UserCheck className="w-3.5 h-3.5 text-slate-500" />
                      <span>{form.inspectorName}</span>
                    </div>
                  </td>

                  <td className="py-3.5 px-4 text-slate-400">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-500" />
                      <span>{form.date}</span>
                    </div>
                  </td>

                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-1.5 font-medium">
                      <span className={form.signatureCount === form.maxSignatures ? "text-emerald-400" : "text-amber-400"}>
                        {form.signatureCount} / {form.maxSignatures} İmza
                      </span>
                    </div>
                    <div className="w-24 bg-slate-800 h-1.5 rounded-full overflow-hidden mt-1">
                      <div
                        className={`h-full rounded-full ${form.signatureCount === form.maxSignatures ? "bg-emerald-500" : "bg-amber-500"}`}
                        style={{ width: `${(form.signatureCount / form.maxSignatures) * 100}%` }}
                      />
                    </div>
                  </td>

                  <td className="py-3.5 px-4">
                    {getStatusBadge(form.status)}
                  </td>

                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => toast.success(`Tutanak PDF İndirildi: ${form.formNumber}`, { icon: "📥" })}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition cursor-pointer"
                        title="PDF Yazdır / İndir"
                      >
                        <Printer className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => toast.success(`Tutanak Görüntüleniyor: ${form.title}`, { icon: "📋" })}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-blue-600/20 hover:bg-blue-600/40 text-blue-400 hover:text-blue-200 border border-blue-700/50 text-xs font-semibold transition cursor-pointer"
                      >
                        <span>İncele</span>
                      </button>
                    </div>
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
