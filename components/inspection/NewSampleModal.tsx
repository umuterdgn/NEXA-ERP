/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Yeni Numune Alma / QR Kod Kayıt Modalı
 */

"use client";

import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { X, FlaskConical, QrCode, Check, AlertTriangle, Building, Calendar, Layers, Loader2 } from "lucide-react";
import { toast } from "react-hot-toast";
import { createCoreSample } from "@/app/actions/inspection-core";
import { getProjectsForSelection } from "@/app/actions/inspection";

const sampleSchema = z.object({
  projectId: z.string().min(1, "Lütfen bir proje seçiniz."),
  location: z.string().min(3, "Numune alınan elemanı/katı belirtiniz (Örn: 4. Kat Kolon & Kiriş)."),
  qrCode: z.string().optional(),
  pourDate: z.string().min(1, "Beton döküm tarihi zorunludur."),
  concreteClass: z.string().min(1, "Beton sınıfı seçiniz."),
});

type SampleFormValues = z.infer<typeof sampleSchema>;

interface NewSampleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (createdSample: any) => void;
}

export default function NewSampleModal({ isOpen, onClose, onSuccess }: NewSampleModalProps) {
  const [projects, setProjects] = useState<Array<{ id: string; name: string | null; title: string; yibfNo: string | null }>>([]);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<SampleFormValues>({
    resolver: zodResolver(sampleSchema),
    defaultValues: {
      location: "",
      qrCode: "",
      pourDate: new Date().toISOString().split("T")[0],
      concreteClass: "C30/37",
      projectId: "",
    },
  });

  useEffect(() => {
    if (isOpen) {
      setLoadingProjects(true);
      getProjectsForSelection()
        .then((res) => {
          if (res.success && res.data) setProjects(res.data);
        })
        .finally(() => setLoadingProjects(false));
    } else {
      reset();
    }
  }, [isOpen, reset]);

  if (!isOpen) return null;

  const onSubmit = async (values: SampleFormValues) => {
    setIsSubmitting(true);
    try {
      const res = await createCoreSample({
        projectId: values.projectId,
        location: `${values.location} (${values.concreteClass})`,
        qrCode: values.qrCode || undefined,
        pourDate: values.pourDate,
        concreteClass: values.concreteClass,
      });

      if (res.success) {
        toast.success("Numune QR Barkodu Başarıyla Oluşturuldu!", { icon: "🧪" });
        reset();
        onClose();
        if (onSuccess) onSuccess(res.data);
      } else {
        toast.error(res.error || "Numune oluşturulamadı.");
      }
    } catch (err: any) {
      toast.error(err.message || "Hata oluştu.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl overflow-hidden">
        {/* Modal Başlığı */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600/20 border border-blue-500/30 text-blue-400">
              <FlaskConical className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">Yeni Numune Alma & QR Eşleme</h2>
              <p className="text-xs text-slate-400">Taze beton dökümünden silindir/küp numune kaydı</p>
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
              <span>Denetlenen Proje *</span>
              {loadingProjects && <span className="text-[10px] text-blue-400">Yükleniyor...</span>}
            </label>
            <select
              {...register("projectId")}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500 transition"
            >
              <option value="">-- Proje Seçiniz --</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title || p.name} {p.yibfNo ? `(YİBF: ${p.yibfNo})` : ""}
                </option>
              ))}
            </select>
            {errors.projectId && (
              <p className="text-[11px] text-rose-400 mt-1 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" /> {errors.projectId.message}
              </p>
            )}
          </div>

          {/* Lokasyon / Yapı Elemanı */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Numunenin Alındığı Eleman & Kat *
            </label>
            <input
              type="text"
              placeholder="Örn: 4. Kat Tabliye Kiriş Betonu / P101 Perdesi"
              {...register("location")}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition"
            />
            {errors.location && (
              <p className="text-[11px] text-rose-400 mt-1 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" /> {errors.location.message}
              </p>
            )}
          </div>

          {/* Beton Sınıfı & Döküm Tarihi (2 Kolon) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Tasarım Beton Sınıfı *
              </label>
              <select
                {...register("concreteClass")}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500 transition"
              >
                <option value="C25/30">C25/30 (≥ 25 MPa)</option>
                <option value="C30/37">C30/37 (≥ 30 MPa)</option>
                <option value="C35/45">C35/45 (≥ 35 MPa)</option>
                <option value="C40/50">C40/50 (≥ 40 MPa)</option>
                <option value="C50/60">C50/60 (≥ 50 MPa)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Döküm Tarihi *
              </label>
              <input
                type="date"
                {...register("pourDate")}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500 transition"
              />
            </div>
          </div>

          {/* Özel QR Kod (Opsiyonel) */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1 flex items-center gap-1.5">
              <QrCode className="w-3.5 h-3.5 text-slate-400" />
              <span>QR Kod Barkod No (Opsiyonel)</span>
            </label>
            <input
              type="text"
              placeholder="Boş bırakılırsa otomatik üretilir (Örn: NXA-SPL-2026-1045)"
              {...register("qrCode")}
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
                  <span>Numuneyi Kaydet</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
