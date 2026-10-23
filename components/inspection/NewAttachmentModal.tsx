/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Yeni Ataşman & Saha Delil Kaydı Ekleme Modalı
 */

"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { X, Camera, Building2, MapPin, Loader2, Layers } from "lucide-react";
import { toast } from "react-hot-toast";
import { submitInspectionForm } from "@/app/actions/inspection-core";

const attachmentSchema = z.object({
  projectId: z.string().min(1, "Proje seçimi zorunludur."),
  title: z.string().min(5, "Ataşman başlığı en az 5 karakter olmalıdır."),
  category: z.string().min(1, "Kategori seçiniz."),
  gpsCoords: z.string().optional(),
  notes: z.string().optional(),
});

type FormData = z.infer<typeof attachmentSchema>;

interface ProjectOption {
  id: string;
  title: string | null;
  name?: string | null;
  yibfNo?: string | null;
}

interface NewAttachmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newRecord: any) => void;
  projects?: ProjectOption[];
}

export default function NewAttachmentModal({
  isOpen,
  onClose,
  onSuccess,
  projects = [],
}: NewAttachmentModalProps) {
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(attachmentSchema),
    defaultValues: {
      projectId: projects[0]?.id || "",
      title: "",
      category: "GIZLI_IMALAT",
      gpsCoords: "40.9901° K, 29.0292° D",
      notes: "",
    },
  });

  if (!isOpen) return null;

  const onSubmit = async (data: FormData) => {
    setSubmitting(true);
    try {
      const code = `ATS-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`;

      const res = await submitInspectionForm({
        projectId: data.projectId,
        formType: "ATASMAN",
        isPassed: true,
        formData: {
          code,
          title: data.title,
          category: data.category,
          gpsCoords: data.gpsCoords || "GPS Kaydedildi",
          notes: data.notes || "Fotoğraflı hukuki ataşman delili onaylandı.",
          photoCount: Math.floor(4 + Math.random() * 8),
          date: new Date().toISOString().split("T")[0],
        },
      });

      if (!res.success) {
        toast.error(res.error || "Ataşman kaydedilemedi.");
        return;
      }

      toast.success(`Ataşman Kaydı Başarıyla Oluşturuldu: ${code}`);
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
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">Yeni Ataşman & Delil Kaydı</h3>
              <p className="text-xs text-slate-400">Gizli imalat, yalıtım ve donatı fotoğraf ataşmanı</p>
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

          {/* Başlık */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Ataşman Başlığı <span className="text-blue-400">*</span>
            </label>
            <input
              type="text"
              {...register("title")}
              placeholder="Örn: Radye Temel Altı Membran Bindirme Delili"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
            />
            {errors.title && (
              <p className="text-[11px] text-rose-400 mt-1">{errors.title.message}</p>
            )}
          </div>

          {/* Kategori ve GPS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                İmalat Kategorisi <span className="text-blue-400">*</span>
              </label>
              <select
                {...register("category")}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
              >
                <option value="GIZLI_IMALAT">Gizli İmalatlar</option>
                <option value="YALITIM">Su / Isı Yalıtımı</option>
                <option value="IKSA_KAZIK">İksa & Fore Kazık</option>
                <option value="DONATI_FOTO">Donatı & Kalıp</option>
                <option value="HAFRIYAT_KAZI">Hafriyat & Kazı</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                GPS Koordinatları
              </label>
              <div className="relative">
                <MapPin className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  {...register("gpsCoords")}
                  placeholder="40.9901° K, 29.0292° D"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 font-mono"
                />
              </div>
            </div>
          </div>

          {/* Açıklama / Notlar */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Hukuki Delil Notları
            </label>
            <textarea
              rows={3}
              {...register("notes")}
              placeholder="Kapanan imalat öncesi yapılan kontrol notları ve fotoğrafların teknik içeriği..."
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs text-white focus:outline-none focus:border-blue-500 placeholder-slate-600"
            />
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
              className="flex items-center gap-2 px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md transition disabled:opacity-50 cursor-pointer"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Kaydediliyor...</span>
                </>
              ) : (
                <>
                  <Camera className="w-3.5 h-3.5" />
                  <span>Ataşmanı Kaydet</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
