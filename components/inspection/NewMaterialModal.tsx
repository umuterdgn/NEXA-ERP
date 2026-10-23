/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Yeni Malzeme Onayı Başvuru Modalı
 */

"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { X, CheckSquare, Building2, FileText, CheckCircle2, AlertTriangle, Loader2 } from "lucide-react";
import { toast } from "react-hot-toast";
import { submitInspectionForm } from "@/app/actions/inspection-core";

const materialSchema = z.object({
  projectId: z.string().min(1, "Proje seçimi zorunludur."),
  materialName: z.string().min(3, "Malzeme adı en az 3 karakter olmalıdır."),
  manufacturer: z.string().min(2, "Üretici firma zorunludur."),
  standard: z.string().min(2, "Standart / Norm bilgisi zorunludur."),
  certificateType: z.string().min(1, "Sertifika türü seçiniz."),
  isPassed: z.boolean(),
  notes: z.string().optional(),
});

type MaterialFormData = z.infer<typeof materialSchema>;

interface ProjectOption {
  id: string;
  title: string | null;
  name?: string | null;
  yibfNo?: string | null;
}

interface NewMaterialModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newRecord: any) => void;
  projects?: ProjectOption[];
}

export default function NewMaterialModal({
  isOpen,
  onClose,
  onSuccess,
  projects = [],
}: NewMaterialModalProps) {
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<MaterialFormData>({
    resolver: zodResolver(materialSchema),
    defaultValues: {
      projectId: projects[0]?.id || "",
      materialName: "",
      manufacturer: "",
      standard: "TS EN 206 / TS 13515",
      certificateType: "TSE",
      isPassed: true,
      notes: "",
    },
  });

  const isPassed = watch("isPassed");

  if (!isOpen) return null;

  const onSubmit = async (data: MaterialFormData) => {
    setSubmitting(true);
    try {
      const code = `MAT-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`;

      const res = await submitInspectionForm({
        projectId: data.projectId,
        formType: "KALITE",
        isPassed: data.isPassed,
        formData: {
          code,
          materialName: data.materialName,
          manufacturer: data.manufacturer,
          standard: data.standard,
          certificateType: data.certificateType,
          notes: data.notes || "Girdi kalite kontrol onaylandı.",
          date: new Date().toISOString().split("T")[0],
        },
      });

      if (!res.success) {
        toast.error(res.error || "Malzeme onayı kaydedilemedi.");
        return;
      }

      toast.success(`Malzeme Onayı Başarıyla Kaydedildi: ${data.materialName}`);
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
            <div className="w-9 h-9 rounded-xl bg-blue-950/80 border border-blue-800/80 flex items-center justify-center text-blue-400">
              <CheckSquare className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">Yeni Malzeme Onayı</h3>
              <p className="text-xs text-slate-400">TSE / CE sertifikalı girdi malzeme vizesi</p>
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

          {/* Malzeme Adı */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Malzeme Tanımı / Cinsi <span className="text-blue-400">*</span>
            </label>
            <input
              type="text"
              {...register("materialName")}
              placeholder="Örn: C30/37 Hazır Beton veya B420C Donatı Demiri"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
            />
            {errors.materialName && (
              <p className="text-[11px] text-rose-400 mt-1">{errors.materialName.message}</p>
            )}
          </div>

          {/* Üretici ve Standart */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Üretici Firma <span className="text-blue-400">*</span>
              </label>
              <input
                type="text"
                {...register("manufacturer")}
                placeholder="Örn: Çimsa, İçdaş, BTM..."
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
              />
              {errors.manufacturer && (
                <p className="text-[11px] text-rose-400 mt-1">{errors.manufacturer.message}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Sertifika / Belge Türü <span className="text-blue-400">*</span>
              </label>
              <select
                {...register("certificateType")}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
              >
                <option value="TSE">TSE Uygunluk Belgesi</option>
                <option value="CE">CE Sertifikası</option>
                <option value="ISO">ISO Kalite Standardı</option>
                <option value="LAB_TEST">Akredite Lab Test Föyü</option>
              </select>
            </div>
          </div>

          {/* Standart / Norm */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              İlgili Türk Standardı / Norm <span className="text-blue-400">*</span>
            </label>
            <input
              type="text"
              {...register("standard")}
              placeholder="Örn: TS EN 206 / TS 708:2016"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
            />
            {errors.standard && (
              <p className="text-[11px] text-rose-400 mt-1">{errors.standard.message}</p>
            )}
          </div>

          {/* Uygunluk Durumu */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Denetim Kararı <span className="text-blue-400">*</span>
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
                <span>KULLANILABİLİR (Onay)</span>
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
                <span>REDDEDİLDİ (Kullanılamaz)</span>
              </button>
            </div>
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
                  <CheckSquare className="w-3.5 h-3.5" />
                  <span>Malzeme Onayını Kaydet</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
