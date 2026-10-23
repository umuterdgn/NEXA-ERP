/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Dinamik Denetim Tutanağı Görüntüleme & İnceleme Modalı
 */

"use client";

import React from "react";
import {
  X,
  ClipboardCheck,
  Building2,
  Calendar,
  UserCheck,
  CheckCircle2,
  AlertTriangle,
  Printer,
  FileText,
} from "lucide-react";
import { toast } from "react-hot-toast";

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

interface InspectionFormDetailModalProps {
  form: InspectionFormRecord | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function InspectionFormDetailModal({
  form,
  isOpen,
  onClose,
}: InspectionFormDetailModalProps) {
  if (!isOpen || !form) return null;

  const data = form.formData || {};

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-blue-400">
              <ClipboardCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-blue-400 uppercase">
                  {form.formType}
                </span>
                {form.isPassed ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-950/80 text-emerald-400 border border-emerald-800">
                    <CheckCircle2 className="w-3 h-3" /> Uygun (Geçti)
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-rose-950/80 text-rose-400 border border-rose-800">
                    <AlertTriangle className="w-3 h-3" /> Kusurlu (Red)
                  </span>
                )}
              </div>
              <h3 className="text-sm font-bold text-white mt-0.5 truncate max-w-sm">
                {data.title || "Denetim Tutanağı"}
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
            aria-label="Kapat"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 space-y-4 overflow-y-auto">
          {/* Proje ve Denetçi Bilgileri */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 text-xs">
            <div>
              <span className="text-slate-500 block text-[10px] uppercase font-bold">Denetim Projesi</span>
              <p className="font-semibold text-white mt-0.5">
                {form.project?.title || form.project?.name || "Bilinmeyen Proje"}
              </p>
              <p className="text-[11px] text-slate-400">YİBF No: {form.project?.yibfNo || "—"}</p>
            </div>

            <div>
              <span className="text-slate-500 block text-[10px] uppercase font-bold">Tutanak Düzenleyen</span>
              <p className="font-semibold text-slate-200 mt-0.5 flex items-center gap-1.5">
                <UserCheck className="w-3.5 h-3.5 text-blue-400" />
                {form.inspector?.name || "Saha Denetçisi"}
              </p>
              <p className="text-[11px] text-slate-400">
                Tarih: {new Date(form.createdAt).toLocaleDateString("tr-TR")}
              </p>
            </div>
          </div>

          {/* Saha Gözlem ve Karar Notları */}
          <div>
            <span className="text-slate-400 text-xs font-semibold block mb-1">
              Saha Gözlemleri & Notlar
            </span>
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 leading-relaxed min-h-[80px]">
              {data.notes || "Gözlem notu girilmemiş."}
            </div>
          </div>

          {/* Form JSON Verileri / Kontrol Listesi */}
          <div>
            <span className="text-slate-400 text-xs font-semibold block mb-1">
              Tutanak Dijital İmzalar & Metadata
            </span>
            <div className="p-3 rounded-lg bg-slate-950/90 border border-slate-800 text-[11px] font-mono text-slate-400 space-y-1">
              <div>• Form ID: {form.id}</div>
              <div>• Denetçi ID: {form.inspectorId}</div>
              <div>• Onay Durumu: {form.isPassed ? "KABUL EDİLDİ" : "REDDEDİLDİ"}</div>
              <div>• Düzenlenme Zamanı: {new Date(form.createdAt).toLocaleString("tr-TR")}</div>
            </div>
          </div>

          {/* Aksiyon Butonları */}
          <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
            <button
              onClick={() => {
                toast.success(`Tutanak PDF İndirildi: ${data.title || form.id}`, { icon: "📄" });
              }}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition"
            >
              <Printer className="w-3.5 h-3.5 text-blue-400" />
              <span>Resmi Tutanak Yazdır (PDF)</span>
            </button>

            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition"
            >
              Kapat
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
