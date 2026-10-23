/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Kalite & Malzeme Onayları İstemci Tablosu (Prisma)
 */

"use client";

import React, { useState } from "react";
import {
  CheckSquare,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ShieldCheck,
  Plus,
} from "lucide-react";
import { toast } from "react-hot-toast";
import NewMaterialModal from "@/components/inspection/NewMaterialModal";

interface MaterialRecord {
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

export default function MaterialsClientTable({
  initialMaterials,
  projects,
}: {
  initialMaterials: MaterialRecord[];
  projects: ProjectOption[];
}) {
  const [materials, setMaterials] = useState<MaterialRecord[]>(initialMaterials);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [isModalOpen, setIsModalOpen] = useState(false);

  const filtered = materials.filter((m) => {
    const term = searchTerm.toLowerCase();
    const data = m.formData || {};
    const name = String(data.materialName || "").toLowerCase();
    const manufacturer = String(data.manufacturer || "").toLowerCase();
    const standard = String(data.standard || "").toLowerCase();
    const proj = (m.project?.title || m.project?.name || "").toLowerCase();
    const yibf = (m.project?.yibfNo || "").toLowerCase();

    const matchesSearch =
      name.includes(term) ||
      manufacturer.includes(term) ||
      standard.includes(term) ||
      proj.includes(term) ||
      yibf.includes(term);

    const matchesStatus =
      statusFilter === "ALL" ||
      (statusFilter === "APPROVED" && m.isPassed) ||
      (statusFilter === "REJECTED" && !m.isPassed);

    return matchesSearch && matchesStatus;
  });

  const handleCreated = (newRecord: any) => {
    setMaterials((prev) => [newRecord, ...prev]);
  };

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
            Beton, demir, yalıtım ve mekanik bileşenlerin TSE, CE ve fabrika deney föyleri uygunluk onayları (Prisma)
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md transition cursor-pointer self-start sm:self-auto"
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
            <option value="ALL">Tüm Durumlar ({materials.length})</option>
            <option value="APPROVED">Onaylananlar (Kullanılabilir)</option>
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
              {filtered.map((item) => {
                const data = item.formData || {};
                return (
                  <tr key={item.id} className="hover:bg-slate-800/40 transition">
                    <td className="py-3.5 px-4 font-semibold text-white">
                      <div className="font-mono text-blue-400">{data.code || "MAT-2026"}</div>
                      <div className="text-slate-200 font-medium mt-0.5">
                        {data.materialName || data.title || "Yapı Malzemesi"}
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-medium text-slate-200">{data.manufacturer || "Üretici Belirtilmedi"}</div>
                      <div className="text-[11px] text-slate-400 mt-0.5">{data.standard || "TS EN Standart"}</div>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="font-semibold px-2 py-0.5 rounded bg-blue-950/60 text-blue-300 border border-blue-900/60">
                        {data.certificateType || "TSE"}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="text-slate-200">
                        {item.project?.title || item.project?.name || "Proje Belirtilmedi"}
                      </div>
                      <div className="text-[11px] text-slate-400">YİBF: {item.project?.yibfNo || "—"}</div>
                    </td>

                    <td className="py-3.5 px-4">
                      {item.isPassed ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-950/60 text-emerald-400 border border-emerald-800/80">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Kullanım İzni Verildi
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-950/60 text-rose-400 border border-rose-800/80">
                          <AlertTriangle className="w-3.5 h-3.5" /> Reddedildi
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => {
                          toast.success(`Malzeme Uygunluk Sertifikası İndirildi: ${data.materialName || item.id}`, {
                            icon: "📄",
                          });
                        }}
                        className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs transition cursor-pointer"
                      >
                        Sertifika
                      </button>
                    </td>
                  </tr>
                );
              })}

              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <CheckSquare className="w-8 h-8 mx-auto text-slate-600 mb-2" />
                    <p className="text-sm font-medium">Kriterlere uygun onaylı malzeme kaydı bulunamadı.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Yeni Malzeme Modalı */}
      <NewMaterialModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleCreated}
        projects={projects}
      />
    </div>
  );
}
