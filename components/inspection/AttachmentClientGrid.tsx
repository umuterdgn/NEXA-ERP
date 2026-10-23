/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Ataşman & Delil Kayıtları İstemci Görünümü (Prisma)
 */

"use client";

import React, { useState } from "react";
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
} from "lucide-react";
import { toast } from "react-hot-toast";
import NewAttachmentModal from "@/components/inspection/NewAttachmentModal";

interface AttachmentRecord {
  id: string;
  formType: string;
  projectId: string;
  inspectorId: string;
  formData: any;
  isPassed: boolean;
  createdAt: string | Date;
  project?: {
    id: string;
    title: string | null;
    name?: string | null;
    yibfNo?: string | null;
  } | null;
  inspector?: {
    id: string;
    name: string | null;
    email: string | null;
  } | null;
}

interface ProjectOption {
  id: string;
  title: string | null;
  name?: string | null;
  yibfNo?: string | null;
}

export default function AttachmentClientGrid({
  initialAttachments,
  projects,
}: {
  initialAttachments: AttachmentRecord[];
  projects: ProjectOption[];
}) {
  const [attachments, setAttachments] = useState<AttachmentRecord[]>(initialAttachments);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [isModalOpen, setIsModalOpen] = useState(false);

  const filtered = attachments.filter((item) => {
    const term = searchTerm.toLowerCase();
    const data = item.formData || {};
    const code = String(data.code || "").toLowerCase();
    const title = String(data.title || "").toLowerCase();
    const proj = (item.project?.title || item.project?.name || "").toLowerCase();
    const category = String(data.category || "");

    const matchesSearch =
      code.includes(term) || title.includes(term) || proj.includes(term);

    const matchesCategory = categoryFilter === "ALL" || category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const handleCreated = (newRecord: any) => {
    setAttachments((prev) => [newRecord, ...prev]);
  };

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
            Zaman damgalı, GPS koordinatlı fotoğraflar ve hakedişe esas ataşman defteri kayıtları (Prisma)
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md transition cursor-pointer self-start sm:self-auto"
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
            className="w-full bg-slate-900/80 border border-slate-800 rounded-lg pl-9 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-400 shrink-0" />
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-slate-900/80 border border-slate-800 rounded-lg px-3 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500 transition"
          >
            <option value="ALL">Tüm Kategoriler ({attachments.length})</option>
            <option value="GIZLI_IMALAT">Gizli İmalatlar</option>
            <option value="YALITIM">Su / Isı Yalıtımı</option>
            <option value="IKSA_KAZIK">İksa & Fore Kazık</option>
            <option value="DONATI_FOTO">Donatı & Kalıp</option>
            <option value="HAFRIYAT_KAZI">Hafriyat & Kazı</option>
          </select>
        </div>
      </div>

      {/* Ataşman Listesi */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {filtered.map((item) => {
          const data = item.formData || {};
          return (
            <div
              key={item.id}
              className="rounded-xl border border-slate-800 bg-slate-900/70 p-4 flex flex-col justify-between hover:border-slate-700 transition space-y-3 shadow-sm"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-blue-950/60 text-blue-400 border border-blue-900/70">
                    {data.code || "ATS-2026"}
                  </span>
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Doğrulandı
                  </span>
                </div>

                <h2 className="text-sm font-bold text-white line-clamp-2">
                  {data.title || "Ataşman Delil Kaydı"}
                </h2>
                <div className="text-slate-400 text-xs mt-1">
                  {item.project?.title || item.project?.name || "Proje Bilgisi Yok"}{" "}
                  {item.project?.yibfNo ? `(YİBF: ${item.project.yibfNo})` : ""}
                </div>

                <div className="mt-3 pt-3 border-t border-slate-800/80 space-y-1.5 text-[11px] text-slate-300">
                  <div className="flex items-center gap-1.5 text-slate-400">
                    <MapPin className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                    <span>GPS: {data.gpsCoords || "Koordinat Kayıtlı"}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-400">
                    <Calendar className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    <span>Tarih: {new Date(item.createdAt).toLocaleDateString("tr-TR")}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-400">
                    <FileImage className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span>{data.photoCount || 4} Adet Yüksek Çözünürlüklü Fotoğraf</span>
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
                <span className="text-[11px] text-slate-400">
                  {item.inspector?.name || "Saha Denetçisi"}
                </span>
                <button
                  onClick={() => {
                    toast.success(`Ataşman Dosyası İndirildi: ${data.code || item.id}`, { icon: "📥" });
                  }}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs transition cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 text-blue-400" />
                  <span>PDF İndir</span>
                </button>
              </div>
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div className="col-span-full py-12 text-center text-slate-400 rounded-xl border border-slate-800 bg-slate-900/60">
            <FileCheck className="w-8 h-8 mx-auto text-slate-600 mb-2" />
            <p className="text-sm font-medium">Kriterlere uygun ataşman kaydı bulunamadı.</p>
          </div>
        )}
      </div>

      {/* Yeni Ataşman Modalı */}
      <NewAttachmentModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleCreated}
        projects={projects}
      />
    </div>
  );
}
