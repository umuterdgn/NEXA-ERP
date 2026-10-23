/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Yeni Uygunsuzluk & DÖF (NCR) Tutanağı Açılış Modalı
 */

"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { X, AlertTriangle, Calendar, Building2, FileText, Loader2 } from "lucide-react";
import { toast } from "react-hot-toast";
import { createNCR } from "@/app/actions/inspection-core";

const ncrSchema = z.object({
  projectId: z.string().min(1, "Proje seçimi zorunludur."),
  reportNo: z.string().optional(),
  description: z.string().min(10, "Kusur ve uygunsuzluk açıklaması en az 10 karakter olmalıdır."),
  deadline: z.string().min(1, "Düzeltici faaliyet termin tarihi zorunludur."),
});

type NcrFormData = z.infer<typeof ncrSchema>;

interface ProjectOption {
  id: string;
  title: string | null;
  name?: string | null;
  yibfNo?: string | null;
}

interface NewNCRModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newNcr: any) => void;
  projects?: ProjectOption[];
}

export default function NewNCRModal({
  isOpen,
  onClose,
  onSuccess,
  projects = [],
}: NewNCRModalProps) {
  const [submitting, setSubmitting] = useState(false);

  const defaultDate = new Date();
  defaultDate.setDate(defaultDate.getDate() + 7);
  const defaultDeadline = defaultDate.toISOString().split("T")[0];

  const defaultReportNo = `NCR-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<NcrFormData>({
    resolver: zodResolver(ncrSchema),
    defaultValues: {
      reportNo: defaultReportNo,
      deadline: defaultDeadline,
      description: "",
      projectId: projects[0]?.id || "",
    },
  });

  if (!isOpen) return null;

  const onSubmit = async (data: NcrFormData) => {
    setSubmitting(true);
    try {
      const res = await createNCR({
        projectId: data.projectId,
        reportNo: data.reportNo || defaultReportNo,
        description: data.description,
        deadline: new Date(data.deadline),
      });

      if (!res.success || !res.data) {
        toast.error(res.error || "DÖF oluşturulamadı.");
        return;
      }

      toast.success(`DÖF Tutanağı Başarıyla Açıldı: ${res.data.reportNo}`);
      onSuccess(res.data);
      reset();
      onClose();
    } catch (err: any) {
      toast.error(err.message || "Beklenmeyen bir hata oluştu.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Başlığı */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-rose-950/80 border border-rose-800/80 flex items-center justify-center text-rose-400">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">Yeni Uygunsuzluk & DÖF Aç</h3>
              <p className="text-xs text-slate-400">Saha kusur ve imalat hatası tutanağı oluştur</p>
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

        {/* Modal Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4 overflow-y-auto">
          {/* Proje Seçimi */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              İlgili Denetim Projesi / Yapı <span className="text-rose-400">*</span>
            </label>
            <div className="relative">
              <Building2 className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <select
                {...register("projectId")}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
              >
                <option value="">-- Proje Seçiniz --</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title || p.name || p.id} {p.yibfNo ? `(YİBF: ${p.yibfNo})` : ""}
                  </option>
                ))}
              </select>
            </div>
            {errors.projectId && (
              <p className="text-[11px] text-rose-400 mt-1">{errors.projectId.message}</p>
            )}
          </div>

          {/* DÖF Rapor Numarası ve Termin Tarihi */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                DÖF Tutanağı No
              </label>
              <div className="relative">
                <FileText className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  {...register("reportNo")}
                  placeholder="NCR-2026-..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500 font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Düzeltme Termini <span className="text-rose-400">*</span>
              </label>
              <div className="relative">
                <Calendar className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="date"
                  {...register("deadline")}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
                />
              </div>
              {errors.deadline && (
                <p className="text-[11px] text-rose-400 mt-1">{errors.deadline.message}</p>
              )}
            </div>
          </div>

          {/* Açıklama & Kusur Detayı */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Uygunsuzluk ve Kusur Açıklaması <span className="text-rose-400">*</span>
            </label>
            <textarea
              rows={4}
              {...register("description")}
              placeholder="Şantiyede tespit edilen imalat hatasını, statik proje uyumsuzluğunu veya mevzuat kusurunu detaylıca açıklayınız..."
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs text-white focus:outline-none focus:border-rose-500 placeholder-slate-600"
            />
            {errors.description && (
              <p className="text-[11px] text-rose-400 mt-1">{errors.description.message}</p>
            )}
          </div>

          {/* Aksiyon Butonları */}
          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
            >
              İptal
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-2 px-5 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shadow-md transition disabled:opacity-50 cursor-pointer"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Kaydediliyor...</span>
                </>
              ) : (
                <>
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>DÖF Başlat & Kaydet</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
