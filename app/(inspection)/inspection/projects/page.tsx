/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Denetlenen Yapılar & Projeler Portföyü (Yapı Denetim Modülü)
 */

"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Building2,
  Search,
  Filter,
  MapPin,
  Calendar,
  Layers,
  ArrowRight,
  ShieldCheck,
  UserCheck,
  CheckCircle2,
  Clock,
  AlertTriangle,
  FileText
} from "lucide-react";
import { toast } from "react-hot-toast";

interface InspectedProject {
  id: string;
  name: string;
  yibfNo: string;
  permitNo: string;
  permitDate: string;
  municipality: string;
  contractor: string;
  totalArea: string;
  currentFloor: string;
  progressPercent: number;
  engineers: {
    static: string;
    architect: string;
    mechanical: string;
    electric: string;
  };
  status: "ACTIVE" | "PENDING_VISE" | "COMPLETED";
}

const mockProjects: InspectedProject[] = [
  {
    id: "proj-1",
    name: "Mavi Vadi Konutları A Blok",
    yibfNo: "2024-001",
    permitNo: "2024/842-R",
    permitDate: "15.02.2024",
    municipality: "Kadıköy Belediyesi",
    contractor: "Akdeniz İnşaat Taah. Ltd.",
    totalArea: "12.500 m²",
    currentFloor: "4. Kat Tabliye Donatısı",
    progressPercent: 42,
    engineers: {
      static: "Umut Erdoğan (İnş. Müh.)",
      architect: "Zeynep Arslan (Y. Mimar)",
      mechanical: "Caner Yurt (Mak. Müh.)",
      electric: "Burak Kaya (Elk. Müh.)"
    },
    status: "ACTIVE"
  },
  {
    id: "proj-2",
    name: "Kuzey Plaza Ticaret Merkezi",
    yibfNo: "2024-002",
    permitNo: "2023/1109-R",
    permitDate: "08.11.2023",
    municipality: "Ümraniye Belediyesi",
    contractor: "Yüksel Proje İnşaat A.Ş.",
    totalArea: "28.400 m²",
    currentFloor: "18. Kat Çelik Çatı Makası",
    progressPercent: 78,
    engineers: {
      static: "Ahmet Yılmaz (Statik Müh.)",
      architect: "Elif Soyer (Mimar)",
      mechanical: "Murat Güven (Mak. Müh.)",
      electric: "Selim Çetin (Elk. Müh.)"
    },
    status: "ACTIVE"
  },
  {
    id: "proj-3",
    name: "Boğaziçi Yaşam Evleri C Blok",
    yibfNo: "2024-003",
    permitNo: "2024/204-R",
    permitDate: "20.06.2024",
    municipality: "Üsküdar Belediyesi",
    contractor: "Boğaziçi Yapı San. Tic.",
    totalArea: "8.600 m²",
    currentFloor: "Bodrum 1. Kat Perde Betonu",
    progressPercent: 15,
    engineers: {
      static: "Mehmet Demir (Kontrol Müh.)",
      architect: "Aylin Kurt (Mimar)",
      mechanical: "Deniz Er (Mak. Müh.)",
      electric: "Kemal Tan (Elk. Müh.)"
    },
    status: "PENDING_VISE"
  }
];

export default function InspectedProjectsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const filteredProjects = mockProjects.filter(p => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.yibfNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.municipality.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.contractor.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "ALL" || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Üst Başlık */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800/80 pb-5">
        <div>
          <div className="flex items-center gap-2 text-blue-400 text-xs font-semibold uppercase tracking-wider mb-1">
            <Building2 className="w-4 h-4" />
            <span>Denetim Portföyü & Yapı Kütüğü</span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Denetlenen Yapılar ve Projeler</h1>
          <p className="text-slate-400 text-sm mt-0.5">
            Yapı Denetim kuruluşunun uhdesindeki ruhsatlı şantiyeler, mühendis kadrosu ve vize seviyeleri
          </p>
        </div>

        <Link
          href="/yibf"
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-sm transition cursor-pointer self-start sm:self-auto"
        >
          <FileText className="w-4 h-4" />
          <span>Bakanlık e-YİBF Listesi</span>
        </Link>
      </div>

      {/* Arama ve Filtre */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Proje Adı, YİBF No, Ruhsat No, Müteahhit veya İlçe ara..."
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
            <option value="ALL">Tüm Projeler</option>
            <option value="ACTIVE">Aktif Denetimde</option>
            <option value="PENDING_VISE">Vize Bekleyenler</option>
            <option value="COMPLETED">Tamamlananlar</option>
          </select>
        </div>
      </div>

      {/* Proje Kartları Izgarası */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {filteredProjects.map((project) => (
          <div
            key={project.id}
            className="rounded-xl border border-slate-800 bg-slate-900/70 p-5 flex flex-col justify-between hover:border-slate-700 transition space-y-4"
          >
            <div>
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-blue-950/60 text-blue-400 border border-blue-900/70">
                  YİBF: {project.yibfNo}
                </span>

                {project.status === "ACTIVE" && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Aktif İnşaat
                  </span>
                )}
                {project.status === "PENDING_VISE" && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-400">
                    <Clock className="w-3.5 h-3.5" /> Vize Bekliyor
                  </span>
                )}
              </div>

              <h2 className="text-base font-bold text-white tracking-tight">{project.name}</h2>
              <div className="text-slate-400 text-xs flex items-center gap-1.5 mt-1">
                <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                <span>{project.municipality}</span>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800/80 space-y-2 text-xs">
                <div className="flex items-center justify-between text-slate-300">
                  <span className="text-slate-500">Müteahhit:</span>
                  <span className="font-medium text-slate-200 truncate max-w-[180px]">{project.contractor}</span>
                </div>
                <div className="flex items-center justify-between text-slate-300">
                  <span className="text-slate-500">Ruhsat Bilgisi:</span>
                  <span className="font-mono">{project.permitNo} ({project.permitDate})</span>
                </div>
                <div className="flex items-center justify-between text-slate-300">
                  <span className="text-slate-500">İnşaat Alanı:</span>
                  <span className="font-semibold text-white">{project.totalArea}</span>
                </div>
                <div className="flex items-center justify-between text-slate-300">
                  <span className="text-slate-500">Mevcut Seviye:</span>
                  <span className="text-blue-400 font-medium">{project.currentFloor}</span>
                </div>
              </div>

              {/* Denetçi Kadrosu */}
              <div className="mt-4 pt-3 border-t border-slate-800/80">
                <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                  Denetçi Mühendis Heyeti
                </div>
                <div className="space-y-1 text-[11px] text-slate-300">
                  <div><span className="text-slate-500">Statik:</span> {project.engineers.static}</div>
                  <div><span className="text-slate-500">Mimari:</span> {project.engineers.architect}</div>
                  <div><span className="text-slate-500">Mekanik:</span> {project.engineers.mechanical}</div>
                </div>
              </div>
            </div>

            <div>
              {/* İlerleme Çubuğu */}
              <div className="mb-3">
                <div className="flex items-center justify-between text-[11px] font-medium mb-1">
                  <span className="text-slate-400">Genel Yapı Seviyesi</span>
                  <span className="text-white font-bold">%{project.progressPercent}</span>
                </div>
                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-blue-600 h-full rounded-full transition-all"
                    style={{ width: `${project.progressPercent}%` }}
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2 border-t border-slate-800/80">
                <Link
                  href="/inspection/forms"
                  className="flex-1 py-1.5 text-center rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition"
                >
                  Tutanaklar
                </Link>
                <Link
                  href="/inspection/core-samples"
                  className="flex-1 py-1.5 text-center rounded-lg bg-blue-600/20 hover:bg-blue-600/40 text-blue-400 hover:text-blue-200 border border-blue-700/50 text-xs font-semibold transition"
                >
                  Karot & Numune
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
