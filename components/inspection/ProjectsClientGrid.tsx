/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Denetlenen Yapılar & Projeler Portföyü İstemci Görünümü (Prisma + YİBF Entegrasyonu)
 */

"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Building2,
  Search,
  Filter,
  MapPin,
  CheckCircle2,
  FileText,
  Plus,
  X,
  Loader2,
  AlertCircle,
  Database,
  Globe,
  Radio,
} from "lucide-react";
import { createProjectFromYibf } from "@/app/actions/inspection-gov";

interface ProjectRecord {
  id: string;
  name?: string | null;
  title: string;
  description?: string | null;
  yibfNo?: string | null;
  city?: string | null;
  district?: string | null;
  location?: string | null;
  status?: string | null;
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
  const [projectsList, setProjectsList] = useState<ProjectRecord[]>(initialProjects);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [yibfInput, setYibfInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successResult, setSuccessResult] = useState<{ project?: ProjectRecord; govData?: unknown } | null>(null);

  const filteredProjects = projectsList.filter((p) => {
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

  const handleYibfSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!yibfInput.trim()) {
      setErrorMessage("Lütfen geçerli bir YİBF Numarası giriniz.");
      return;
    }

    setLoading(true);
    setErrorMessage(null);
    setSuccessResult(null);

    try {
      const res = await createProjectFromYibf(yibfInput.trim());
      if (!res.success) {
        setErrorMessage(res.error || "Proje sorgulanamadı.");
      } else {
        setSuccessResult(res);
        if (res.project) {
          setProjectsList((prev) => [res.project, ...prev]);
        }
        setTimeout(() => {
          setIsModalOpen(false);
          setYibfInput("");
          setSuccessResult(null);
        }, 1800);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Bakanlık API bağlantı hatası oluştu.";
      setErrorMessage(message);
    } finally {
      setLoading(false);
    }
  };

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

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setErrorMessage(null);
              setSuccessResult(null);
              setIsModalOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-sm transition cursor-pointer self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Yeni Proje Ekle (YİBF İle)</span>
          </button>

          <Link
            href="/yibf"
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-sm transition cursor-pointer self-start sm:self-auto"
          >
            <FileText className="w-4 h-4" />
            <span>Bakanlık e-YİBF Listesi</span>
          </Link>
        </div>
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
            <option value="ALL">Tüm Projeler ({projectsList.length})</option>
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

      {/* YİBF İle Otonom Proje Ekleme Modalı */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-950 p-6 shadow-2xl space-y-5">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-slate-800/80 pb-4">
              <div>
                <div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-1">
                  <Globe className="w-4 h-4" />
                  <span>Devlet Sistemleri Otonom Entegrasyonu</span>
                </div>
                <h3 className="text-lg font-bold text-white tracking-tight">Yeni Proje Ekle (YİBF)</h3>
                <p className="text-slate-400 text-xs mt-0.5">
                  UYDS, MAKS ve YAMBİS verileri tek tıkla çekilerek şantiye kütüğü oluşturulur.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form Body */}
            <form onSubmit={handleYibfSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="block text-xs font-medium text-slate-300">
                  YİBF Numarası <span className="text-emerald-400">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    placeholder="Örn: 1049283"
                    value={yibfInput}
                    onChange={(e) => setYibfInput(e.target.value)}
                    disabled={loading}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition font-mono tracking-wider disabled:opacity-50"
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-500">
                    e-Devlet Kütüğü
                  </div>
                </div>
                <div className="flex items-center gap-1.5 text-[11px] text-slate-400 pt-1">
                  <span className="text-slate-500">Hızlı Test YİBF No:</span>
                  {["1049283", "2084915", "3091824"].map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => setYibfInput(tag)}
                      className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono transition text-[10px]"
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>

              {/* Bilgi Kutusu */}
              <div className="p-3 rounded-lg border border-slate-800/80 bg-slate-900/50 space-y-1.5 text-xs">
                <div className="flex items-center gap-2 text-slate-300 font-medium">
                  <Database className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Otonom Sorgulanacak Bakanlık Servisleri:</span>
                </div>
                <ul className="text-slate-400 text-[11px] space-y-1 list-disc list-inside">
                  <li><strong className="text-slate-300">MAKS:</strong> Ada, Parsel, Pafta, UAVT Kodu, Harita Koordinatları</li>
                  <li><strong className="text-slate-300">YAMBİS:</strong> Müteahhit Sicil No, Firma Unvanı, Yetki Grubu</li>
                  <li><strong className="text-slate-300">UYDS:</strong> Ruhsat No, Taşıyıcı Sistem, Kat Adetleri, Yapı Sınıfı</li>
                </ul>
              </div>

              {/* Hata Mesajı */}
              {errorMessage && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-red-950/60 border border-red-900/80 text-red-400 text-xs animate-in fade-in">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Başarı Mesajı */}
              {successResult && (
                <div className="p-3 rounded-lg bg-emerald-950/60 border border-emerald-900/80 text-emerald-300 text-xs space-y-1 animate-in fade-in">
                  <div className="flex items-center gap-2 font-semibold">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Bakanlık Verisi Başarıyla Çekildi ve Kaydedildi!</span>
                  </div>
                  <p className="text-[11px] text-emerald-400/90 pl-6">
                    {successResult.project?.title} kütüğe aktarıldı.
                  </p>
                </div>
              )}

              {/* Modal Butonları */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800/80">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  disabled={loading}
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition disabled:opacity-50"
                >
                  Vazgeç
                </button>

                <button
                  type="submit"
                  disabled={loading || !yibfInput.trim()}
                  className="flex items-center gap-2 px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Sorgulanıyor & Kaydediliyor...</span>
                    </>
                  ) : (
                    <>
                      <Radio className="w-3.5 h-3.5" />
                      <span>Sorgula ve Ekle</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
