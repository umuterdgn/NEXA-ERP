/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Donatı & Kalıp Vize Tutanağı Detay ve Onay/Red Modalı (Read / Update)
 */

"use client";

import React, { useState } from "react";
import {
  X,
  Construction,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Printer,
  ShieldCheck,
  Building,
  UserCheck,
  Calendar,
  Ruler,
  Layers,
  FileText,
  Loader2
} from "lucide-react";
import { toast } from "react-hot-toast";
import { updateVisaStatus } from "@/app/actions/inspection";

interface VisaDetailModalProps {
  visa: any | null;
  isOpen: boolean;
  onClose: () => void;
  onStatusUpdated?: (updatedVisa: any) => void;
}

export default function VisaDetailModal({
  visa,
  isOpen,
  onClose,
  onStatusUpdated,
}: VisaDetailModalProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");

  if (!isOpen || !visa) return null;

  const handleApprove = async () => {
    setIsUpdating(true);
    try {
      const res = await updateVisaStatus(visa.id, "APPROVED");
      if (res.success) {
        toast.success("Vize Onaylandı! Beton Döküm İzni Verildi.", { icon: "✅" });
        if (onStatusUpdated) onStatusUpdated(res.data);
        onClose();
      } else {
        toast.error(res.error || "Onay işlemi başarısız.");
      }
    } catch (err: any) {
      toast.error(err.message || "Hata oluştu.");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      toast.error("Lütfen red / kusur gerekçesini belirtiniz.");
      return;
    }
    setIsUpdating(true);
    try {
      const res = await updateVisaStatus(visa.id, "REJECTED", rejectionReason);
      if (res.success) {
        toast.error("Vize Reddedildi! Kusur bildirimi kaydedildi.", { icon: "🚫" });
        if (onStatusUpdated) onStatusUpdated(res.data);
        onClose();
      } else {
        toast.error(res.error || "Red işlemi başarısız.");
      }
    } catch (err: any) {
      toast.error(err.message || "Hata oluştu.");
    } finally {
      setIsUpdating(false);
      setRejecting(false);
    }
  };

  const getStatusDisplay = (status: string) => {
    switch (status) {
      case "APPROVED":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-950/70 text-emerald-400 border border-emerald-800">
            <CheckCircle2 className="w-4 h-4" /> Beton Döküm İzni Verildi (Onaylı)
          </span>
        );
      case "REJECTED":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-950/70 text-rose-400 border border-rose-800">
            <AlertTriangle className="w-4 h-4" /> Vize Reddedildi (Döküm Yasak)
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-950/70 text-amber-400 border border-amber-800">
            <Clock className="w-4 h-4" /> Muayene & Karar Bekliyor
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Başlığı */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/70">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600/20 border border-blue-500/30 text-blue-400">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-blue-950/70 text-blue-400 border border-blue-900/80">
                  {visa.visaNo}
                </span>
                <span className="text-xs text-slate-400">Resmi Vize Tutanağı</span>
              </div>
              <h2 className="text-base font-bold text-white tracking-tight mt-0.5">{visa.elementName}</h2>
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
        <div className="p-6 space-y-5 overflow-y-auto flex-1">
          {/* Durum Banner */}
          <div className="flex items-center justify-between p-3.5 rounded-xl border border-slate-800 bg-slate-950/60">
            <div>
              <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider mb-1">
                Muayene Sonuç Durumu
              </div>
              {getStatusDisplay(visa.status)}
            </div>
            <div className="text-right">
              <div className="text-[11px] font-medium text-slate-400">Düzenlenme Tarihi</div>
              <div className="text-xs font-semibold text-slate-200 mt-0.5">
                {new Date(visa.createdAt).toLocaleDateString("tr-TR", {
                  day: "2-digit",
                  month: "long",
                  year: "numeric",
                })}
              </div>
            </div>
          </div>

          {/* Reddetme Gerekçesi Varsa Göster */}
          {visa.rejectionReason && (
            <div className="p-3.5 rounded-xl border border-rose-900/70 bg-rose-950/30 text-xs">
              <div className="font-bold text-rose-300 flex items-center gap-1.5 mb-1">
                <AlertTriangle className="w-4 h-4 text-rose-400" />
                <span>Kusur & Reddedilme Gerekçesi</span>
              </div>
              <p className="text-rose-200/90 leading-relaxed">{visa.rejectionReason}</p>
            </div>
          )}

          {/* Proje ve Denetçi Bilgileri */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/40 space-y-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-blue-400 uppercase tracking-wider">
                <Building className="w-4 h-4" />
                <span>Yapı / Şantiye Bilgisi</span>
              </div>
              <div className="text-sm font-bold text-white">
                {visa.project?.title || visa.project?.name || "Bilinmeyen Proje"}
              </div>
              <div className="text-xs text-slate-400">
                YİBF No: <span className="font-mono text-slate-200">{visa.project?.yibfNo || "—"}</span>
              </div>
              {visa.project?.location && (
                <div className="text-xs text-slate-400 truncate">Konum: {visa.project.location}</div>
              )}
            </div>

            <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/40 space-y-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 uppercase tracking-wider">
                <UserCheck className="w-4 h-4" />
                <span>Sorumlu Denetçi Mühendis</span>
              </div>
              <div className="text-sm font-bold text-white">
                {visa.inspector?.name || "Saha Denetçisi"}
              </div>
              <div className="text-xs text-slate-400">
                Yetki: <span className="text-slate-200">{visa.inspector?.role || "INSPECTOR"}</span>
              </div>
              <div className="text-xs text-slate-400 truncate">
                İletişim: {visa.inspector?.email || "denetim@nexa.com"}
              </div>
            </div>
          </div>

          {/* Teknik Muayene Ölçümleri */}
          <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/50 space-y-3">
            <div className="text-xs font-bold text-white flex items-center gap-2 border-b border-slate-800/80 pb-2">
              <Layers className="w-4 h-4 text-amber-400" />
              <span>Teknik Muayene & Statik Ölçüm Değerleri</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                <span className="text-slate-400 text-[11px] block">Donatı Detayları & Çap</span>
                <span className="font-semibold text-white mt-0.5 block">{visa.reinforcementDetails}</span>
              </div>

              <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                <span className="text-slate-400 text-[11px] block">Paspayı Mesafesi</span>
                <span className="font-semibold text-emerald-400 mt-0.5 block font-mono">
                  {visa.coverSpace} cm {visa.coverSpace >= 2.5 ? "✅ (Uygun)" : "⚠️ (Kritik)"}
                </span>
              </div>

              <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                <span className="text-slate-400 text-[11px] block">Kalıp Durumu & Şakül</span>
                <span className={`font-semibold mt-0.5 block ${visa.formworkStatus === "Şakülünde" ? "text-emerald-400" : "text-amber-400"}`}>
                  {visa.formworkStatus}
                </span>
              </div>
            </div>
          </div>

          {/* Red Formu Girişi */}
          {rejecting && (
            <div className="p-4 rounded-xl border border-rose-800/80 bg-rose-950/20 space-y-3 animate-in fade-in">
              <label className="block text-xs font-bold text-rose-300">
                Red / Kusur Gerekçesini Giriniz *
              </label>
              <textarea
                rows={3}
                placeholder="Örn: Kiriş mesnet donatısında etriye aralığı projeye aykırı (15cm yerine 25cm tespit edildi). Paspayı takozları yetersiz."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="w-full bg-slate-950 border border-rose-800/60 rounded-lg p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500"
              />
              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setRejecting(false)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 text-xs font-medium hover:bg-slate-700"
                >
                  Vazgeç
                </button>
                <button
                  type="button"
                  onClick={handleReject}
                  disabled={isUpdating}
                  className="px-4 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold transition cursor-pointer"
                >
                  {isUpdating ? "Kaydediliyor..." : "Reddi Kesinleştir"}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modal Alt Aksiyonları */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-6 py-4 border-t border-slate-800 bg-slate-950/70">
          <button
            type="button"
            onClick={() => toast.success(`Vize Tutanağı Yazdırılıyor: ${visa.visaNo}`, { icon: "🖨️" })}
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition cursor-pointer w-full sm:w-auto justify-center"
          >
            <Printer className="w-4 h-4 text-blue-400" />
            <span>Resmi Tutanak Yazdır</span>
          </button>

          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 transition"
            >
              Kapat
            </button>

            {visa.status === "PENDING" && !rejecting && (
              <>
                <button
                  type="button"
                  onClick={() => setRejecting(true)}
                  disabled={isUpdating}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-rose-950 hover:bg-rose-900 text-rose-300 border border-rose-800 text-xs font-semibold transition cursor-pointer"
                >
                  <AlertTriangle className="w-4 h-4" />
                  <span>Reddet (Kusur Bildir)</span>
                </button>

                <button
                  type="button"
                  onClick={handleApprove}
                  disabled={isUpdating}
                  className="flex items-center gap-1.5 px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md transition cursor-pointer"
                >
                  {isUpdating ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4" />
                  )}
                  <span>Onayla (Döküm İzni Ver)</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
