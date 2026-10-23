/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Yeni Dinamik Denetim Formu & Tutanak Başlatma Modalı
 */

"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { X, ClipboardCheck, Building2, CheckCircle2, AlertTriangle, Loader2, FileText } from "lucide-react";
import { toast } from "react-hot-toast";
import { submitInspectionForm } from "@/app/actions/inspection-core";

const formSchema = z.object({
  projectId: z.string().min(1, "Proje seçimi zorunludur."),
  formType: z.string().min(1, "Form tipi seçiniz."),
  title: z.string().min(5, "Tutanak başlığı en az 5 karakter olmalıdır."),
  isPassed: z.boolean(),
  notes: z.string().min(5, "Denetim notları en az 5 karakter olmalıdır."),
});

type FormData = z.infer<typeof formSchema>;

interface ProjectOption {
  id: string;
  title: string | null;
  name?: string | null;
  yibfNo?: string | null;
}

interface NewInspectionFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newForm: any) => void;
  projects?: ProjectOption[];
}

export default function NewInspectionFormModal({
  isOpen,
  onClose,
  onSuccess,
  projects = [],
}: NewInspectionFormModalProps) {
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      projectId: projects[0]?.id || "",
      formType: "KALITE",
      title: "",
      isPassed: true,
      notes: "",
    },
  });

  const isPassed = watch("isPassed");

  if (!isOpen) return null;

  const onSubmit = async (data: FormData) => {
    setSubmitting(true);
    try {
      const res = await submitInspectionForm({
        projectId: data.projectId,
        formType: data.formType,
        isPassed: data.isPassed,
        formData: {
          title: data.title,
          notes: data.notes,
          submittedAt: new Date().toISOString(),
          checklistVerified: true,
        },
      });

      if (!res.success) {
        toast.error(res.error || "Form kaydedilemedi.");
        return;
      }

      toast.success("Denetim Tutanağı Başarıyla Kaydedildi!");
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
            <div className="w-9 h-9 rounded-xl bg-blue-950/80 border border-blue-800/80 flex items-center justify-center text-blue-400">
              <ClipboardCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">Yeni Denetim Tutanağı</h3>
              <p className="text-xs text-slate-400">Saha muayene ve kalite kontrol formu düzenle</p>
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
              İlgili Denetim Projesi <span className="text-blue-400">*</span>
            </label>
            <div className="relative">
              <Building2 className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <select
                {...register("projectId")}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
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

          {/* Form Tipi */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Form / Tutanak Tipi <span className="text-blue-400">*</span>
            </label>
            <select
              {...register("formType")}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
            >
              <option value="KALITE">Kalite & Malzeme Uygunluk Tutanağı</option>
              <option value="DEMIR_VIZE">Demir & Donatı Kontrol Vizesi</option>
              <option value="BETON_DOKUM">Beton Döküm İzin Tutanağı</option>
              <option value="KALIP_ISKELE">Kalıp & İskele Muayenesi</option>
              <option value="ISG">İş Sağlığı ve Güvenliği (İSG)</option>
              <option value="CEVRE">Çevre & Atık Yönetimi</option>
            </select>
            {errors.formType && (
              <p className="text-[11px] text-rose-400 mt-1">{errors.formType.message}</p>
            )}
          </div>

          {/* Başlık */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Tutanak Başlığı <span className="text-blue-400">*</span>
            </label>
            <div className="relative">
              <FileText className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                {...register("title")}
                placeholder="Örn: 3. Kat Kolon Donatı ve Paspayı Muayenesi"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
              />
            </div>
            {errors.title && (
              <p className="text-[11px] text-rose-400 mt-1">{errors.title.message}</p>
            )}
          </div>

          {/* Uygunluk Durumu Seçimi */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Denetim Neticesi / Karar <span className="text-blue-400">*</span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setValue("isPassed", true)}
                className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg border text-xs font-semibold transition cursor-pointer ${
                  isPassed
                    ? "bg-emerald-950/80 border-emerald-500 text-emerald-300 ring-1 ring-emerald-500"
                    : "bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-800"
                }`}
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>UYGUN (Geçti)</span>
              </button>

              <button
                type="button"
                onClick={() => setValue("isPassed", false)}
                className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg border text-xs font-semibold transition cursor-pointer ${
                  !isPassed
                    ? "bg-rose-950/80 border-rose-500 text-rose-300 ring-1 ring-rose-500"
                    : "bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-800"
                }`}
              >
                <AlertTriangle className="w-4 h-4" />
                <span>KUSURLU (Red)</span>
              </button>
            </div>
          </div>

          {/* Denetçi Notları */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Saha Gözlem Notları ve Karar Gerekçesi <span className="text-blue-400">*</span>
            </label>
            <textarea
              rows={3}
              {...register("notes")}
              placeholder="Şantiyede yapılan ölçümler, standart sapmalar ve şantiye şefine iletilen talimatlar..."
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs text-white focus:outline-none focus:border-blue-500 placeholder-slate-600"
            />
            {errors.notes && (
              <p className="text-[11px] text-rose-400 mt-1">{errors.notes.message}</p>
            )}
          </div>

          {/* Butonlar */}
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
              className="flex items-center gap-2 px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md transition disabled:opacity-50 cursor-pointer"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Kaydediliyor...</span>
                </>
              ) : (
                <>
                  <ClipboardCheck className="w-3.5 h-3.5" />
                  <span>Tutanağı Kaydet</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
