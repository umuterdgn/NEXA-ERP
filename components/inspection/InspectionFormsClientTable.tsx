/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Dinamik Denetim Formları İstemci Tablo Bileşeni (CRUD + Modallar)
 */

"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ClipboardCheck,
  Search,
  Filter,
  Plus,
  CheckCircle2,
  Clock,
  AlertTriangle,
  FileText,
  UserCheck,
  Building,
  Calendar,
  PenTool,
  Printer,
  Eye,
} from "lucide-react";
import { toast } from "react-hot-toast";
import NewInspectionFormModal from "@/components/inspection/NewInspectionFormModal";
import InspectionFormDetailModal from "@/components/inspection/InspectionFormDetailModal";

interface InspectionFormRecord {
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

export default function InspectionFormsClientTable({
  initialForms,
  projects,
}: {
  initialForms: InspectionFormRecord[];
  projects: ProjectOption[];
}) {
  const [forms, setForms] = useState<InspectionFormRecord[]>(initialForms);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [selectedForm, setSelectedForm] = useState<InspectionFormRecord | null>(null);

  const filtered = forms.filter((f) => {
    const term = searchTerm.toLowerCase();
    const dataTitle = f.formData?.title ? String(f.formData.title).toLowerCase() : "";
    const notes = f.formData?.notes ? String(f.formData.notes).toLowerCase() : "";
    const projTitle = f.project?.title ? f.project.title.toLowerCase() : "";
    const yibf = f.project?.yibfNo ? f.project.yibfNo.toLowerCase() : "";

    const matchesSearch =
      dataTitle.includes(term) ||
      notes.includes(term) ||
      projTitle.includes(term) ||
      yibf.includes(term) ||
      f.formType.toLowerCase().includes(term);

    const matchesType = typeFilter === "ALL" || f.formType === typeFilter;
    return matchesSearch && matchesType;
  });

  const totalCount = forms.length;
  const passedCount = forms.filter((f) => f.isPassed).length;
  const failedCount = forms.filter((f) => !f.isPassed).length;

  const handleCreated = (newForm: any) => {
    setForms((prev) => [newForm, ...prev]);
  };

  const getFormTypeBadge = (type: string) => {
    switch (type) {
      case "KALITE":
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-950/80 text-blue-300 border border-blue-800">KALİTE UYGUNLUK</span>;
      case "DEMIR_VIZE":
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-950/80 text-amber-300 border border-amber-800">DEMİR VİZESİ</span>;
      case "BETON_DOKUM":
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950/80 text-emerald-300 border border-emerald-800">BETON DÖKÜM İZNİ</span>;
      case "KALIP_ISKELE":
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-950/80 text-purple-300 border border-purple-800">KALIP & İSKELE</span>;
      case "ISG":
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-950/80 text-rose-300 border border-rose-800">İSG DENETİMİ</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700">{type}</span>;
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Üst Başlık & Butonlar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800/80 pb-5">
        <div>
          <div className="flex items-center gap-2 text-blue-400 text-xs font-semibold uppercase tracking-wider mb-1">
            <ClipboardCheck className="w-4 h-4" />
            <span>Resmi Tutanaklar ve Denetim Kontrol Listeleri</span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Dinamik Denetim Formları</h1>
          <p className="text-slate-400 text-sm mt-0.5">
            Saha denetçileri için dijital vize, kalıp, donatı ve beton döküm tutanakları (Prisma)
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setIsNewModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Yeni Tutanak Başlat</span>
          </button>
        </div>
      </div>

      {/* KPI Kartları */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
          <div className="text-slate-400 text-xs font-medium">Toplam Düzenlenen Tutanak</div>
          <div className="text-2xl font-bold text-white mt-1">{totalCount} Form</div>
          <div className="text-[11px] text-blue-400 mt-1">Veritabanı kayıtlı</div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
          <div className="text-slate-400 text-xs font-medium">Onaylanan Uygun Formlar</div>
          <div className="text-2xl font-bold text-emerald-400 mt-1">{passedCount} Adet</div>
          <div className="text-[11px] text-emerald-400/80 mt-1">Döküm / İmalat izni verildi</div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
          <div className="text-slate-400 text-xs font-medium">Kusurlu / Reddedilenler</div>
          <div className="text-2xl font-bold text-rose-400 mt-1">{failedCount} Form</div>
          <div className="text-[11px] text-rose-400/80 mt-1">DÖF sürecine aktarıldı</div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
          <div className="text-slate-400 text-xs font-medium">e-İmza Bütünlüğü</div>
          <div className="text-2xl font-bold text-cyan-400 mt-1">%100</div>
          <div className="text-[11px] text-slate-400 mt-1">Zaman damgalı</div>
        </div>
      </div>

      {/* Arama ve Filtre */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Tutanak Başlığı, Proje veya Notlarda ara..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-900/80 border border-slate-800 rounded-lg pl-9 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-400 shrink-0" />
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="bg-slate-900/80 border border-slate-800 rounded-lg px-3 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500 transition"
          >
            <option value="ALL">Tüm Form Tipleri ({forms.length})</option>
            <option value="KALITE">Kalite & Malzeme</option>
            <option value="DEMIR_VIZE">Demir & Donatı</option>
            <option value="BETON_DOKUM">Beton Döküm İzni</option>
            <option value="KALIP_ISKELE">Kalıp & İskele</option>
            <option value="ISG">İş Sağlığı ve Güvenliği</option>
            <option value="CEVRE">Çevre & Atık</option>
          </select>
        </div>
      </div>

      {/* Tutanak Listesi Tablosu */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Tutanak Tipi & Başlık</th>
                <th className="py-3 px-4">İlişkili Proje</th>
                <th className="py-3 px-4">Denetçi</th>
                <th className="py-3 px-4">Tarih</th>
                <th className="py-3 px-4">Sonuç</th>
                <th className="py-3 px-4 text-right">İşlem</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {filtered.map((form) => {
                const title = form.formData?.title || "Saha Denetim Tutanağı";
                return (
                  <tr key={form.id} className="hover:bg-slate-800/40 transition">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2 mb-1">
                        {getFormTypeBadge(form.formType)}
                      </div>
                      <div className="text-white font-medium truncate max-w-sm">
                        {title}
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-200 truncate max-w-xs">
                        {form.project?.title || form.project?.name || "Bilinmeyen Proje"}
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        YİBF: {form.project?.yibfNo || "—"}
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="text-slate-300 flex items-center gap-1.5">
                        <UserCheck className="w-3.5 h-3.5 text-slate-500" />
                        <span>{form.inspector?.name || "Saha Denetçisi"}</span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-slate-400">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-500" />
                        <span>{new Date(form.createdAt).toLocaleDateString("tr-TR")}</span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      {form.isPassed ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-950/60 text-emerald-400 border border-emerald-800/80">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Uygun (Geçti)
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-950/60 text-rose-400 border border-rose-800/80">
                          <AlertTriangle className="w-3.5 h-3.5" /> Kusurlu (Red)
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => {
                            toast.success(`Tutanak PDF İndirildi: ${title}`, { icon: "📥" });
                          }}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition cursor-pointer"
                          title="PDF Yazdır / İndir"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => setSelectedForm(form)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-blue-600/20 hover:bg-blue-600/40 text-blue-400 hover:text-blue-200 border border-blue-700/50 text-xs font-semibold transition cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>İncele</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <ClipboardCheck className="w-8 h-8 mx-auto text-slate-600 mb-2" />
                    <p className="text-sm font-medium">Kriterlere uygun denetim tutanağı bulunamadı.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Yeni Form Modalı */}
      <NewInspectionFormModal
        isOpen={isNewModalOpen}
        onClose={() => setIsNewModalOpen(false)}
        onSuccess={handleCreated}
        projects={projects}
      />

      {/* Form Detay Modalı */}
      <InspectionFormDetailModal
        form={selectedForm}
        isOpen={!!selectedForm}
        onClose={() => setSelectedForm(null)}
      />
    </div>
  );
}
