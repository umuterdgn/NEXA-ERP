/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Yeni Donatı & Kalıp Vize Muayenesi Modal Bileşeni (React Hook Form + Zod)
 */

"use client";

import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { X, Construction, Check, AlertTriangle, Building, Layers, Ruler, ShieldCheck, Loader2 } from "lucide-react";
import { toast } from "react-hot-toast";
import { createVisa, getProjectsForSelection } from "@/app/actions/inspection";

const visaSchema = z.object({
  projectId: z.string().min(1, "Lütfen bir proje seçiniz."),
  elementName: z.string().min(3, "Eleman adı en az 3 karakter olmalıdır (Örn: 4. Kat Tabliye & Kiriş)."),
  reinforcementDetails: z.string().min(3, "Donatı detaylarını belirtiniz (Örn: Ø14, Ø16 (B420C))."),
  coverSpace: z.number().min(0.5, "Paspayı en az 0.5 cm olmalıdır.").max(15, "Paspayı en fazla 15 cm olabilir."),
  formworkStatus: z.string().min(1, "Kalıp durumu seçiniz."),
  visaNo: z.string().optional(),
});

type VisaFormValues = z.infer<typeof visaSchema>;

interface NewVisaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (createdVisa: any) => void;
}

export default function NewVisaModal({ isOpen, onClose, onSuccess }: NewVisaModalProps) {
  const [projects, setProjects] = useState<Array<{ id: string; name: string | null; title: string; yibfNo: string | null }>>([]);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<VisaFormValues>({
    resolver: zodResolver(visaSchema),
    defaultValues: {
      coverSpace: 3.0,
      formworkStatus: "Şakülünde",
      elementName: "",
      reinforcementDetails: "",
      projectId: "",
      visaNo: "",
    },
  });

  useEffect(() => {
    if (isOpen) {
      setLoadingProjects(true);
      getProjectsForSelection()
        .then((res) => {
          if (res.success && res.data) {
            setProjects(res.data);
          }
        })
        .finally(() => setLoadingProjects(false));
    } else {
      reset();
    }
  }, [isOpen, reset]);

  if (!isOpen) return null;

  const onSubmit = async (values: VisaFormValues) => {
    setIsSubmitting(true);
    try {
      const result = await createVisa({
        projectId: values.projectId,
        elementName: values.elementName,
        reinforcementDetails: values.reinforcementDetails,
        coverSpace: values.coverSpace,
        formworkStatus: values.formworkStatus,
        visaNo: values.visaNo || undefined,
      });

      if (result.success) {
        toast.success("Demir & Kalıp Vize Tutanağı Başarıyla Kaydedildi!", { icon: "✅" });
        reset();
        onClose();
        if (onSuccess) onSuccess(result.data);
      } else {
        toast.error(result.error || "Vize tutanağı kaydedilemedi.");
      }
    } catch (err: any) {
      toast.error(err.message || "Beklenmedik bir hata oluştu.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl overflow-hidden">
        {/* Modal Başlığı */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600/20 border border-blue-500/30 text-blue-400">
              <Construction className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">Yeni Demir & Kalıp Vize Muayenesi</h2>
              <p className="text-xs text-slate-400">Beton döküm öncesi statik uygunluk tutanağı kaydı</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Formu */}
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
          {/* Proje Seçimi */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
              <span>Denetlenen Proje / Yapı *</span>
              {loadingProjects && <span className="text-[10px] text-blue-400 flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin" /> Projeler Yükleniyor...</span>}
            </label>
            <div className="relative">
              <select
                {...register("projectId")}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500 transition"
              >
                <option value="">-- Proje Seçiniz --</option>
                {projects.map((proj) => (
                  <option key={proj.id} value={proj.id}>
                    {proj.title || proj.name} {proj.yibfNo ? `(YİBF: ${proj.yibfNo})` : ""}
                  </option>
                ))}
              </select>
            </div>
            {errors.projectId && (
              <p className="text-[11px] text-rose-400 mt-1 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" /> {errors.projectId.message}
              </p>
            )}
          </div>

          {/* Eleman Adı & Kat */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Yapı Elemanı & Kat Konumu *
            </label>
            <input
              type="text"
              placeholder="Örn: 4. Kat Tabliye & Kiriş Donatıları veya Bodrum Perde P101-P104"
              {...register("elementName")}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition"
            />
            {errors.elementName && (
              <p className="text-[11px] text-rose-400 mt-1 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" /> {errors.elementName.message}
              </p>
            )}
          </div>

          {/* Donatı Detayları & Çaplar */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Donatı Çapları & Çelik Sınıfı *
            </label>
            <input
              type="text"
              placeholder="Örn: Ø14, Ø16, Ø20 (B420C) / Etriye: Ø8/10cm"
              {...register("reinforcementDetails")}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition"
            />
            {errors.reinforcementDetails && (
              <p className="text-[11px] text-rose-400 mt-1 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" /> {errors.reinforcementDetails.message}
              </p>
            )}
          </div>

          {/* Paspayı ve Kalıp Durumu (2 Kolon) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Ruler className="w-3.5 h-3.5 text-blue-400" />
                <span>Paspayı Mesafesi (cm) *</span>
              </label>
              <input
                type="number"
                step="0.1"
                placeholder="3.0"
                {...register("coverSpace", { valueAsNumber: true })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition font-mono"
              />
              {errors.coverSpace && (
                <p className="text-[11px] text-rose-400 mt-1 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" /> {errors.coverSpace.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Kalıp Durumu & Şakül *</span>
              </label>
              <select
                {...register("formworkStatus")}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500 transition"
              >
                <option value="Şakülünde">Şakülünde & Rijit (Uygun)</option>
                <option value="Kusurlu">Kusurlu / Eğim Var</option>
                <option value="Takviye Gerekli">Ek Destek & Takviye Gerekli</option>
                <option value="Temizlik Bekliyor">Kalıp İçi Talaş/Pislik Var</option>
              </select>
              {errors.formworkStatus && (
                <p className="text-[11px] text-rose-400 mt-1 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" /> {errors.formworkStatus.message}
                </p>
              )}
            </div>
          </div>

          {/* Opsiyonel Vize Numarası */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">
              Özel Vize Numarası (Opsiyonel)
            </label>
            <input
              type="text"
              placeholder="Boş bırakılırsa sistem otomatik atayacaktır (Örn: VIZE-2026-045)"
              {...register("visaNo")}
              className="w-full bg-slate-950/60 border border-slate-800/80 rounded-lg px-3.5 py-2 text-xs text-slate-300 placeholder-slate-600 focus:outline-none focus:border-blue-500 font-mono transition"
            />
          </div>

          {/* Alt Aksiyon Butonları */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 transition"
            >
              İptal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md transition disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Kaydediliyor...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>Vize Tutanağını Kaydet</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
