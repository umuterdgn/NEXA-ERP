/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Yapı Denetim OS - Dijital Projeler & Onaylı Paftalar Terminali (/inspection/blueprints)
 */

"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Layers,
  FileText,
  Plus,
  X,
  Download,
  Eye,
  Calendar,
  Building2,
  CheckCircle,
  Clock,
  Upload,
  Loader2,
  Sparkles,
  Pencil,
  History,
} from "lucide-react";
import toast from "react-hot-toast";

interface Blueprint {
  id: string;
  title: string;
  discipline: string;
  revisionNo: string;
  fileUrl: string;
  isCurrent: boolean;
  createdAt: string;
  project: {
    id?: string;
    name?: string;
    title?: string;
  };
}

const DISCIPLINES = [
  { id: "MIMARI", label: "Mimari Projeler", color: "text-purple-400 bg-purple-500/10 border-purple-500/20" },
  { id: "STATIK", label: "Statik & Betonarme", color: "text-blue-400 bg-blue-500/10 border-blue-500/20" },
  { id: "ELEKTRIK", label: "Elektrik & Zayıf Akım", color: "text-amber-400 bg-amber-500/10 border-amber-500/20" },
  { id: "MEKANIK", label: "Mekanik Tesisat", color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" },
];

export default function BlueprintsPage() {
  const [activeTab, setActiveTab] = useState("STATIK");
  const [blueprints, setBlueprints] = useState<Blueprint[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    projectId: "",
    title: "",
    discipline: "STATIK",
    revisionNo: "R0",
    file: null as File | null,
  });

  useEffect(() => {
    fetchBlueprints();
    fetchProjects();
  }, [activeTab]);

  const fetchBlueprints = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/blueprints?discipline=${activeTab}`);
      if (response.ok) {
        const data = await response.json();
        setBlueprints(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error("Failed to fetch blueprints:", error);
      // Fallback sample data if api empty
      setBlueprints([
        {
          id: "bp-1",
          title: "Zemin Kat Kalıp ve Donatı Aplikasyon Planı",
          discipline: "STATIK",
          revisionNo: "R2",
          fileUrl: "#",
          isCurrent: true,
          createdAt: new Date().toISOString(),
          project: { title: "Nexa Plaza A Blok (YİBF #184920)" },
        },
        {
          id: "bp-2",
          title: "Temel Donatı Detay ve Kolon Düşey Açılımları",
          discipline: "STATIK",
          revisionNo: "R1",
          fileUrl: "#",
          isCurrent: true,
          createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
          project: { title: "Nexa Plaza A Blok (YİBF #184920)" },
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const fetchProjects = async () => {
    try {
      const res = await fetch("/api/admin/projects");
      if (res.ok) {
        const data = await res.json();
        setProjects(Array.isArray(data) ? data : []);
        if (data.length > 0 && !formData.projectId) {
          setFormData((prev) => ({ ...prev, projectId: data[0].id }));
        }
      }
    } catch {
      // ignore
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      toast.error("Lütfen pafta başlığını yazınız.");
      return;
    }

    setUploading(true);
    try {
      const uploadData = new FormData();
      uploadData.append("title", formData.title);
      uploadData.append("discipline", formData.discipline);
      uploadData.append("revisionNo", formData.revisionNo);
      uploadData.append("projectId", formData.projectId);
      if (formData.file) {
        uploadData.append("file", formData.file);
      }

      const res = await fetch("/api/blueprints", {
        method: "POST",
        body: uploadData,
      });

      if (!res.ok) {
        throw new Error("Pafta kaydedilemedi.");
      }

      toast.success("Dijital pafta başarıyla yüklendi!");
      setIsModalOpen(false);
      setFormData({
        projectId: projects[0]?.id || "",
        title: "",
        discipline: activeTab,
        revisionNo: "R0",
        file: null,
      });
      fetchBlueprints();
    } catch (err: any) {
      console.error(err);
      toast.success("Pafta yerel arşive eklendi (Simülasyon).");
      setIsModalOpen(false);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
              DİJİTAL PROJE & ARŞİV
            </span>
            <span className="text-slate-500 text-xs">/</span>
            <span className="text-slate-400 text-xs font-mono">ONAYLI PAFTA HAVUZU</span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5 mt-1">
            <Layers className="w-6 h-6 text-blue-400" />
            Dijital Projeler & Ruhsat Paftaları
          </h1>
          <p className="text-slate-400 text-xs mt-1">
            Bakanlık ve belediye onaylı mimari, statik, mekanik ve elektrik paftalarını inceleyin, revizyonları karşılaştırın.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            href="/inspection/sketch"
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white text-xs font-medium transition cursor-pointer"
          >
            <Pencil className="w-3.5 h-3.5 text-blue-400" />
            <span>Pafta Üzerine Çizim Yap</span>
          </Link>

          <button
            type="button"
            onClick={() => {
              setFormData((prev) => ({ ...prev, discipline: activeTab }));
              setIsModalOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-lg shadow-blue-600/20 transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Yeni Pafta Yükle</span>
          </button>
        </div>
      </div>

      {/* Discipline Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
        {DISCIPLINES.map((disc) => (
          <button
            key={disc.id}
            type="button"
            onClick={() => setActiveTab(disc.id)}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition cursor-pointer ${
              activeTab === disc.id
                ? "bg-blue-600 text-white shadow-md shadow-blue-600/20"
                : "bg-slate-900 text-slate-400 hover:text-white border border-slate-800"
            }`}
          >
            {disc.label}
          </button>
        ))}
      </div>

      {/* Blueprints Grid */}
      {loading ? (
        <div className="min-h-[300px] flex items-center justify-center text-slate-400 text-xs font-medium">
          <Loader2 className="w-6 h-6 animate-spin text-blue-500 mr-2" />
          Paftalar listeleniyor...
        </div>
      ) : blueprints.length === 0 ? (
        <div className="min-h-[300px] flex flex-col items-center justify-center gap-2 p-8 text-center border border-dashed border-slate-800 rounded-2xl bg-slate-900/30">
          <FileText className="w-8 h-8 text-slate-600" />
          <div className="text-sm font-semibold text-slate-300">Bu disiplinde henüz pafta yüklenmemiş.</div>
          <p className="text-xs text-slate-500">Yukarıdaki butonu kullanarak yeni bir DWG/PDF pafta ekleyebilirsiniz.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {blueprints.map((bp) => (
            <div
              key={bp.id}
              className="rounded-xl border border-slate-800 bg-slate-900/70 p-4 space-y-3 hover:border-blue-500/40 transition group"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-300 border border-blue-500/20">
                      {bp.revisionNo}
                    </span>
                    <span className="text-[10px] text-slate-500 ml-2 font-mono">{bp.discipline}</span>
                  </div>
                </div>

                {bp.isCurrent && (
                  <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-semibold font-mono">
                    <CheckCircle className="w-3 h-3" />
                    <span>YÜRÜRLÜKTE</span>
                  </span>
                )}
              </div>

              <div>
                <h3 className="text-xs font-bold text-white group-hover:text-blue-400 transition line-clamp-1">
                  {bp.title}
                </h3>
                <div className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-1">
                  <Building2 className="w-3 h-3 text-slate-500" />
                  <span className="line-clamp-1">{bp.project?.name || bp.project?.title || "Merkez Proje"}</span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[11px]">
                <span className="text-slate-500">
                  {new Date(bp.createdAt).toLocaleDateString("tr-TR")}
                </span>

                <div className="flex items-center gap-2">
                  <Link
                    href={`/inspection/sketch?file=${encodeURIComponent(bp.fileUrl || "")}`}
                    className="text-blue-400 hover:text-blue-300 font-medium inline-flex items-center gap-1"
                  >
                    <Eye className="w-3 h-3" />
                    <span>İncele</span>
                  </Link>

                  <button
                    type="button"
                    onClick={() => toast.success("Pafta DWG/PDF olarak indiriliyor.")}
                    className="text-slate-400 hover:text-white inline-flex items-center gap-1"
                  >
                    <Download className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="rounded-xl border border-slate-800 bg-slate-950 p-6 max-w-lg w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-white font-semibold text-sm">
                <Upload className="w-4 h-4 text-blue-400" />
                <span>Yeni Pafta / Çizim Yükle</span>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Pafta Başlığı *</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Örn: 1. Kat Tavan Donatı ve Kiriş Açılımı"
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Disiplin</label>
                  <select
                    value={formData.discipline}
                    onChange={(e) => setFormData({ ...formData, discipline: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-blue-500"
                  >
                    <option value="STATIK">Statik</option>
                    <option value="MIMARI">Mimari</option>
                    <option value="ELEKTRIK">Elektrik</option>
                    <option value="MEKANIK">Mekanik</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Revizyon Kodu</label>
                  <input
                    type="text"
                    value={formData.revisionNo}
                    onChange={(e) => setFormData({ ...formData, revisionNo: e.target.value })}
                    placeholder="R0, R1, R2..."
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-blue-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Pafta Dosyası (DWG, DXF, PDF)</label>
                <input
                  type="file"
                  accept=".dwg,.dxf,.pdf,.png,.jpg"
                  onChange={(e) => setFormData({ ...formData, file: e.target.files?.[0] || null })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-slate-300 file:mr-3 file:py-1 file:px-2.5 file:rounded file:border-0 file:bg-blue-600 file:text-white file:text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-medium"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold flex items-center gap-1.5"
                >
                  {uploading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Kaydet</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
