/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Ataşman & Delil Kayıtları Terminali (Yapı Denetim Modülü)
 */

"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  FileCheck,
  Search,
  Filter,
  Camera,
  MapPin,
  Calendar,
  Download,
  Plus,
  CheckCircle2,
  FileImage,
  Layers,
  ArrowUpRight
} from "lucide-react";
import { toast } from "react-hot-toast";

interface AttachmentRecord {
  id: string;
  code: string;
  title: string;
  yibfNo: string;
  projectName: string;
  category: "GIZLI_IMALAT" | "DONATI_FOTO" | "HAFRIYAT_KAZI" | "IKSA_KAZIK" | "YALITIM";
  photoCount: number;
  recordedBy: string;
  date: string;
  gpsCoords: string;
  verified: boolean;
}

const mockAttachments: AttachmentRecord[] = [
  {
    id: "1",
    code: "ATS-2026-101",
    title: "Radye Temel Altı Su Yalıtımı ve Membran Bindirme Delili",
    yibfNo: "2024-001",
    projectName: "Mavi Vadi Konutları A Blok",
    category: "YALITIM",
    photoCount: 6,
    recordedBy: "Umut Erdoğan (İnş. Müh.)",
    date: "2026-10-14",
    gpsCoords: "40.9821° K, 29.0432° D",
    verified: true
  },
  {
    id: "2",
    code: "ATS-2026-102",
    title: "Fore Kazık Donatı Kafesi İndirme ve Betonlama Ataşmanı",
    yibfNo: "2024-002",
    projectName: "Kuzey Plaza Ticaret Merkezi",
    category: "IKSA_KAZIK",
    photoCount: 12,
    recordedBy: "Ahmet Yılmaz (Statik Müh.)",
    date: "2026-10-18",
    gpsCoords: "41.0254° K, 29.1120° D",
    verified: true
  },
  {
    id: "3",
    code: "ATS-2026-103",
    title: "3. Kat Tabliye Elektrik Borulama & Gizli İmalat Tutanak Delili",
    yibfNo: "2024-001",
    projectName: "Mavi Vadi Konutları A Blok",
    category: "GIZLI_IMALAT",
    photoCount: 8,
    recordedBy: "Burak Kaya (Elk. Müh.)",
    date: "2026-10-21",
    gpsCoords: "40.9822° K, 29.0434° D",
    verified: true
  }
];

export default function AttachmentPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");

  const filtered = mockAttachments.filter(a => {
    const matchesSearch =
      a.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.projectName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === "ALL" || a.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Üst Başlık */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800/80 pb-5">
        <div>
          <div className="flex items-center gap-2 text-blue-400 text-xs font-semibold uppercase tracking-wider mb-1">
            <FileCheck className="w-4 h-4" />
            <span>Kapanan İmalatlar ve Hukuki Saha Delilleri</span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Ataşman & Delil Kayıtları</h1>
          <p className="text-slate-400 text-sm mt-0.5">
            Zaman damgalı, GPS koordinatlı fotoğraflar ve hakedişe esas ataşman defteri kayıtları
          </p>
        </div>

        <button
          onClick={() => toast.success("Fotoğraflı Ataşman Kaydı Ekleme Modalı Açıldı", { icon: "📸" })}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-sm transition cursor-pointer self-start sm:self-auto"
        >
          <Camera className="w-4 h-4" />
          <span>Yeni Ataşman Ekle</span>
        </button>
      </div>

      {/* Arama ve Filtre */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Ataşman Kodu, Başlık veya Proje ara..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-900/80 border border-slate-800 rounded-lg pl-9 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-400 shrink-0" />
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-slate-900/80 border border-slate-800 rounded-lg px-3 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
          >
            <option value="ALL">Tüm Kategoriler</option>
            <option value="GIZLI_IMALAT">Gizli İmalatlar</option>
            <option value="YALITIM">Su / Isı Yalıtımı</option>
            <option value="IKSA_KAZIK">İksa & Fore Kazık</option>
            <option value="DONATI_FOTO">Donatı & Kalıp</option>
          </select>
        </div>
      </div>

      {/* Ataşman Listesi */}
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
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Doğrulandı
                </span>
              </div>

              <h2 className="text-sm font-bold text-white line-clamp-2">{item.title}</h2>
              <div className="text-slate-400 text-xs mt-1">{item.projectName} (YİBF: {item.yibfNo})</div>

              <div className="mt-3 pt-3 border-t border-slate-800/80 space-y-1.5 text-[11px] text-slate-300">
                <div className="flex items-center gap-1.5 text-slate-400">
                  <MapPin className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                  <span>GPS: {item.gpsCoords}</span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-400">
                  <Calendar className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  <span>Tarih: {item.date}</span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-400">
                  <FileImage className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span>{item.photoCount} Adet Yüksek Çözünürlüklü Fotoğraf</span>
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
              <span className="text-[11px] text-slate-400">{item.recordedBy}</span>
              <button
                onClick={() => toast.success(`Ataşman Dosyası İndirildi: ${item.code}`, { icon: "📥" })}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs transition cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-blue-400" />
                <span>PDF İndir</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
