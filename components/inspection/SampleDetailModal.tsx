/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Karot / Numune Detay ve Kırım Testi Sonuç Giriş Modalı
 */

"use client";

import React, { useState } from "react";
import { X, FlaskConical, QrCode, CheckCircle2, AlertTriangle, Clock, Printer, Loader2, Building, Calendar, Layers } from "lucide-react";
import { toast } from "react-hot-toast";
import { updateCoreSampleStatus } from "@/app/actions/inspection-core";

interface SampleDetailModalProps {
  sample: any | null;
  isOpen: boolean;
  onClose: () => void;
  onStatusUpdated?: (updated: any) => void;
}

export default function SampleDetailModal({
  sample,
  isOpen,
  onClose,
  onStatusUpdated,
}: SampleDetailModalProps) {
  const [strengthInput, setStrengthInput] = useState<string>("");
  const [isUpdating, setIsUpdating] = useState(false);

  if (!isOpen || !sample) return null;

  const handleSaveResult = async (statusOverride?: string) => {
    const val = parseFloat(strengthInput);
    if (isNaN(val) && !statusOverride) {
      toast.error("Lütfen geçerli bir basınç dayanım değeri (MPa) giriniz.");
      return;
    }

    setIsUpdating(true);
    try {
      const finalStatus = statusOverride || (val >= 30 ? "PASSED" : "FAILED");
      const res = await updateCoreSampleStatus(sample.id, finalStatus, isNaN(val) ? undefined : val);

      if (res.success) {
        toast.success(`Kırım Deney Sonucu Kaydedildi: ${val || ""} MPa (${finalStatus === "PASSED" ? "Uygun" : "Red"})`, {
          icon: finalStatus === "PASSED" ? "✅" : "⚠️",
        });
        if (onStatusUpdated) onStatusUpdated(res.data);
        onClose();
      } else {
        toast.error(res.error || "Sonuç kaydedilemedi.");
      }
    } catch (err: any) {
      toast.error(err.message || "Hata oluştu.");
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl overflow-hidden flex flex-col">
        {/* Modal Başlığı */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/70">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600/20 border border-blue-500/30 text-blue-400">
              <FlaskConical className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-blue-950/70 text-blue-400 border border-blue-900/80">
                  {sample.qrCode}
                </span>
                <span className="text-xs text-slate-400">Beton Numunesi</span>
              </div>
              <h2 className="text-sm font-bold text-white tracking-tight mt-0.5">{sample.location}</h2>
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

        {/* Modal Gövdesi */}
        <div className="p-6 space-y-4">
          <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-950/60 flex items-center justify-between text-xs">
            <div>
              <span className="text-slate-400 block text-[11px]">Bağlı Proje</span>
              <span className="font-semibold text-white mt-0.5 block">
                {sample.project?.title || sample.project?.name || "Proje Bilgisi Yok"}
              </span>
            </div>
            <div className="text-right">
              <span className="text-slate-400 block text-[11px]">Döküm Tarihi</span>
              <span className="font-mono text-slate-200 mt-0.5 block">
                {sample.pourDate ? new Date(sample.pourDate).toLocaleDateString("tr-TR") : "—"}
              </span>
            </div>
          </div>

          {/* Mevcut Sonuç */}
          <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/40 space-y-2">
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Mevcut Test Durumu
            </div>
            <div className="flex items-center justify-between">
              <div>
                {sample.status === "PASSED" && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-950/70 text-emerald-400 border border-emerald-800">
                    <CheckCircle2 className="w-4 h-4" /> Dayanım Şartnameye Uygun (Geçti)
                  </span>
                )}
                {sample.status === "FAILED" && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-950/70 text-rose-400 border border-rose-800">
                    <AlertTriangle className="w-4 h-4" /> Yetersiz Dayanım (Red)
                  </span>
                )}
                {sample.status !== "PASSED" && sample.status !== "FAILED" && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-950/70 text-amber-400 border border-amber-800">
                    <Clock className="w-4 h-4" /> Laboratuvar Kırımı Bekleniyor
                  </span>
                )}
              </div>

              {(sample.strengthResult !== null && sample.strengthResult !== undefined) && (
                <div className="text-right">
                  <span className="font-mono text-lg font-bold text-white">{sample.strengthResult} MPa</span>
                </div>
              )}
            </div>
          </div>

          {/* Yeni Basınç Dayanımı Girişi */}
          <div className="p-4 rounded-xl border border-blue-900/60 bg-blue-950/20 space-y-3">
            <label className="block text-xs font-bold text-blue-300">
              Laboratuvar Kırım Basınç Dayanımı Girişi (MPa)
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                step="0.1"
                placeholder="Örn: 33.5"
                value={strengthInput}
                onChange={(e) => setStrengthInput(e.target.value)}
                className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2 text-xs text-white placeholder-slate-500 font-mono focus:outline-none focus:border-blue-500"
              />
              <span className="text-xs text-slate-400 font-semibold">MPa</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              C30 sınıfı için sınır değer ≥ 30.0 MPa'dır. Değer 30'un altındaysa sistem otomatik olarak RED kaydı açar.
            </p>
          </div>
        </div>

        {/* Modal Alt Aksiyonları */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-800 bg-slate-950/70">
          <button
            type="button"
            onClick={() => toast.success(`Laboratuvar Kırım Föyü Yazdırıldı: ${sample.qrCode}`, { icon: "🖨️" })}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 transition"
          >
            <Printer className="w-3.5 h-3.5 text-blue-400" />
            <span>Kırım Föyü</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 transition"
            >
              Kapat
            </button>
            <button
              type="button"
              onClick={() => handleSaveResult()}
              disabled={isUpdating || !strengthInput}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md transition disabled:opacity-50 cursor-pointer"
            >
              {isUpdating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
              <span>Sonucu Kaydet</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
