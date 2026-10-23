/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Denetlenen Yapılar & Projeler Portföyü İstemci Görünümü (Prisma)
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
  CheckCircle2,
  Clock,
  FileText,
} from "lucide-react";

interface ProjectRecord {
  id: string;
  name?: string | null;
  title: string;
  description?: string | null;
  yibfNo?: string | null;
  city?: string | null;
  district?: string | null;
  location?: string | null;
  status: string;
  progress: number;
  totalArea?: number | null;
  buildingClass?: string | null;
  yapiSinifi?: string | null;
  ada?: string | null;
  parsel?: string | null;
  createdAt: string | Date;
}

export default function ProjectsClientGrid({
  initialProjects,
}: {
  initialProjects: ProjectRecord[];
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const filteredProjects = initialProjects.filter((p) => {
    const term = searchTerm.toLowerCase();
    const title = (p.title || p.name || "").toLowerCase();
    const yibf = (p.yibfNo || "").toLowerCase();
    const loc = (p.location || `${p.city || ""} ${p.district || ""}`).toLowerCase();

    const matchesSearch =
      title.includes(term) ||
      yibf.includes(term) ||
      loc.includes(term);

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
            Yapı Denetim kuruluşunun uhdesindeki ruhsatlı şantiyeler, YİBF kütüğü ve vize seviyeleri (Prisma)
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
            placeholder="Proje Adı, YİBF No veya İlçe/Şehir ara..."
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
            <option value="ALL">Tüm Projeler ({initialProjects.length})</option>
            <option value="ACTIVE">Aktif Şantiyeler</option>
            <option value="PENDING">Vize Bekleyenler</option>
            <option value="COMPLETED">Tamamlananlar</option>
          </select>
        </div>
      </div>

      {/* Proje Kartları Izgarası */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredProjects.map((project) => {
          const locationText = project.location || [project.city, project.district].filter(Boolean).join(" / ") || "Konum Belirtilmemiş";
          const progressPercent = Math.min(100, Math.max(0, Math.round(project.progress || 0)));

          return (
            <div
              key={project.id}
              className="rounded-xl border border-slate-800 bg-slate-900/70 p-5 flex flex-col justify-between hover:border-slate-700 transition space-y-4 shadow-sm"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-blue-950/60 text-blue-400 border border-blue-900/70">
                    YİBF: {project.yibfNo || "—"}
                  </span>

                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400">
                    <CheckCircle2 className="w-3.5 h-3.5" /> {project.status}
                  </span>
                </div>

                <h2 className="text-base font-bold text-white tracking-tight">
                  {project.title || project.name}
                </h2>
                <div className="text-slate-400 text-xs flex items-center gap-1.5 mt-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  <span>{locationText}</span>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-800/80 space-y-2 text-xs">
                  <div className="flex items-center justify-between text-slate-300">
                    <span className="text-slate-500">Ada / Parsel:</span>
                    <span className="font-mono">
                      {project.ada && project.parsel ? `${project.ada} / ${project.parsel}` : "Ada/Parsel Kayıtsız"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-slate-300">
                    <span className="text-slate-500">Yapı Sınıfı:</span>
                    <span className="font-medium text-slate-200">{project.buildingClass || project.yapiSinifi || "3B"}</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-300">
                    <span className="text-slate-500">İnşaat Alanı:</span>
                    <span className="font-semibold text-white">
                      {project.totalArea ? `${project.totalArea.toLocaleString("tr-TR")} m²` : "—"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-slate-300">
                    <span className="text-slate-500">Kayıt Tarihi:</span>
                    <span className="text-slate-300">
                      {new Date(project.createdAt).toLocaleDateString("tr-TR")}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                {/* İlerleme Çubuğu */}
                <div className="mb-3">
                  <div className="flex items-center justify-between text-[11px] font-medium mb-1">
                    <span className="text-slate-400">Genel Yapı Seviyesi</span>
                    <span className="text-white font-bold">%{progressPercent}</span>
                  </div>
                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-blue-600 h-full rounded-full transition-all"
                      style={{ width: `${progressPercent}%` }}
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
          );
        })}

        {filteredProjects.length === 0 && (
          <div className="col-span-full py-12 text-center text-slate-400 rounded-xl border border-slate-800 bg-slate-900/60">
            <Building2 className="w-8 h-8 mx-auto text-slate-600 mb-2" />
            <p className="text-sm font-medium">Kayıtlı denetim projesi bulunamadı.</p>
          </div>
        )}
      </div>
    </div>
  );
}
