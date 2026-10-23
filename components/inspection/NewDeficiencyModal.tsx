/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Yeni Saha Kusuru & Eksiklik Bildirim Modalı
 */

"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { X, FileWarning, Building2, Calendar, MapPin, Loader2 } from "lucide-react";
import { toast } from "react-hot-toast";
import { createNCR } from "@/app/actions/inspection-core";

const deficiencySchema = z.object({
  projectId: z.string().min(1, "Proje seçimi zorunludur."),
  title: z.string().min(5, "Kusur başlığı en az 5 karakter olmalıdır."),
  location: z.string().min(2, "Şantiye içi lokasyon zorunludur."),
  deadline: z.string().min(1, "Termin tarihi zorunludur."),
  description: z.string().min(5, "Eksiklik açıklaması en az 5 karakter olmalıdır."),
});

type FormData = z.infer<typeof deficiencySchema>;

interface ProjectOption {
  id: string;
  title: string | null;
  name?: string | null;
  yibfNo?: string | null;
}

interface NewDeficiencyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newRecord: any) => void;
  projects?: ProjectOption[];
}

export default function NewDeficiencyModal({
  isOpen,
  onClose,
  onSuccess,
  projects = [],
}: NewDeficiencyModalProps) {
  const [submitting, setSubmitting] = useState(false);

  const defaultDate = new Date();
  defaultDate.setDate(defaultDate.getDate() + 5);
  const defaultDeadline = defaultDate.toISOString().split("T")[0];

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(deficiencySchema),
    defaultValues: {
      projectId: projects[0]?.id || "",
      title: "",
      location: "",
      deadline: defaultDeadline,
      description: "",
    },
  });

  if (!isOpen) return null;

  const onSubmit = async (data: FormData) => {
    setSubmitting(true);
    try {
      const reportNo = `DEF-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`;
      const combinedDescription = `[${data.location}] ${data.title} - ${data.description}`;

      const res = await createNCR({
        projectId: data.projectId,
        reportNo,
        description: combinedDescription,
        deadline: new Date(data.deadline),
      });

      if (!res.success) {
        toast.error(res.error || "Kusur kaydı oluşturulamadı.");
        return;
      }

      toast.success(`Saha Kusuru Başarıyla Kaydedildi: ${reportNo}`);
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
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-950/80 border border-amber-800/80 flex items-center justify-center text-amber-400">
              <FileWarning className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">Yeni Saha Kusuru Kaydet</h3>
              <p className="text-xs text-slate-400">Şantiye içi fiziksel imalat eksiklik bildirimi</p>
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
          {/* Proje */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              İlgili Denetim Projesi <span className="text-amber-400">*</span>
            </label>
            <div className="relative">
              <Building2 className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <select
                {...register("projectId")}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
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

          {/* Kusur Başlığı */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Kusur & Eksiklik Başlığı <span className="text-amber-400">*</span>
            </label>
            <input
              type="text"
              {...register("title")}
              placeholder="Örn: 3. Kat Kolon Segregasyonu veya Korkuluk Eksikliği"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
            />
            {errors.title && (
              <p className="text-[11px] text-rose-400 mt-1">{errors.title.message}</p>
            )}
          </div>

          {/* Lokasyon ve Termin */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Şantiye İçi Lokasyon <span className="text-amber-400">*</span>
              </label>
              <div className="relative">
                <MapPin className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  {...register("location")}
                  placeholder="Örn: B Blok 2. Kat Salon"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>
              {errors.location && (
                <p className="text-[11px] text-rose-400 mt-1">{errors.location.message}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Düzeltme Termini <span className="text-amber-400">*</span>
              </label>
              <div className="relative">
                <Calendar className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="date"
                  {...register("deadline")}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>
          </div>

          {/* Açıklama */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Eksiklik Açıklaması & Talimat <span className="text-amber-400">*</span>
            </label>
            <textarea
              rows={3}
              {...register("description")}
              placeholder="Şantiye şefine ve taşerona iletilecek düzeltici imalat detayı..."
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs text-white focus:outline-none focus:border-amber-500 placeholder-slate-600"
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
              className="flex items-center gap-2 px-5 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold shadow-md transition disabled:opacity-50 cursor-pointer"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Kaydediliyor...</span>
                </>
              ) : (
                <>
                  <FileWarning className="w-3.5 h-3.5" />
                  <span>Kusuru Kaydet</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
