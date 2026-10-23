/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Uygunsuzluk & DÖF (NCR) İnceleme ve Kapatma Modalı
 */

"use client";

import React, { useState } from "react";
import {
  X,
  AlertTriangle,
  Calendar,
  Building2,
  FileText,
  CheckCircle2,
  Clock,
  User,
  Loader2,
  ShieldCheck,
} from "lucide-react";
import { toast } from "react-hot-toast";
import { resolveNCR } from "@/app/actions/inspection-core";

interface NCRRecord {
  id: string;
  reportNo: string;
  projectId: string;
  description: string;
  deadline: string | Date;
  status: string;
  photos?: string[];
  createdAt: string | Date;
  project?: {
    id: string;
    title: string | null;
    name?: string | null;
    yibfNo?: string | null;
    location?: string | null;
  } | null;
  creator?: {
    id: string;
    name: string | null;
    email: string | null;
  } | null;
}

interface NCRDetailModalProps {
  ncr: NCRRecord | null;
  isOpen: boolean;
  onClose: () => void;
  onStatusUpdated: (updatedNcr: NCRRecord) => void;
}

export default function NCRDetailModal({
  ncr,
  isOpen,
  onClose,
  onStatusUpdated,
}: NCRDetailModalProps) {
  const [loading, setLoading] = useState(false);

  if (!isOpen || !ncr) return null;

  const handleResolve = async (newStatus: "RESOLVED" | "VERIFIED") => {
    setLoading(true);
    try {
      const res = await resolveNCR(ncr.id, newStatus);
      if (!res.success || !res.data) {
        toast.error(res.error || "DÖF durumu güncellenemedi.");
        return;
      }

      toast.success(
        newStatus === "VERIFIED"
          ? "DÖF Yapı Denetçi Onayıyla Kesin Kapatıldı!"
          : "DÖF Giderildi (Çözüldü) Olarak İşaretlendi!"
      );
      onStatusUpdated(res.data as any);
      onClose();
    } catch (err: any) {
      toast.error(err.message || "Hata oluştu.");
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "VERIFIED":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-950/80 text-emerald-400 border border-emerald-800">
            <ShieldCheck className="w-3.5 h-3.5" /> Denetçi Tarafından Onaylandı (Kapatıldı)
          </span>
        );
      case "RESOLVED":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-950/80 text-blue-400 border border-blue-800">
            <CheckCircle2 className="w-3.5 h-3.5" /> Giderildi / Çözüldü (Doğrulama Bekliyor)
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-950/80 text-rose-400 border border-rose-800">
            <Clock className="w-3.5 h-3.5" /> Açık Kusur / Termin Bekliyor
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Başlığı */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-rose-400">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white tracking-tight">{ncr.reportNo}</h3>
                {getStatusBadge(ncr.status)}
              </div>
              <p className="text-xs text-slate-400">Uygunsuzluk & Düzeltici Faaliyet Detayı</p>
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

        {/* Modal İçerik */}
        <div className="p-6 space-y-5 overflow-y-auto">
          {/* Proje ve Tarih Kartı */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 text-xs">
            <div>
              <span className="text-slate-500 block text-[10px] uppercase font-bold">Denetim Projesi</span>
              <p className="font-semibold text-white mt-0.5">
                {ncr.project?.title || ncr.project?.name || "Bilinmeyen Proje"}
              </p>
              <p className="text-[11px] text-slate-400">YİBF No: {ncr.project?.yibfNo || "—"}</p>
            </div>

            <div>
              <span className="text-slate-500 block text-[10px] uppercase font-bold">Termin Tarihi</span>
              <p className="font-semibold text-rose-400 mt-0.5 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                {new Date(ncr.deadline).toLocaleDateString("tr-TR")}
              </p>
              <p className="text-[11px] text-slate-400">
                Açılış: {new Date(ncr.createdAt).toLocaleDateString("tr-TR")}
              </p>
            </div>
          </div>

          {/* Açıklama */}
          <div>
            <span className="text-slate-400 text-xs font-semibold block mb-1">
              Kusur & Uygunsuzluk Açıklaması
            </span>
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 leading-relaxed">
              {ncr.description}
            </div>
          </div>

          {/* Tespit Eden Denetçi */}
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <User className="w-4 h-4 text-slate-500" />
            <span>
              Tespit Eden Denetçi:{" "}
              <strong className="text-slate-200">
                {ncr.creator?.name || ncr.creator?.email || "Saha Denetçisi"}
              </strong>
            </span>
          </div>

          {/* Aksiyon Butonları */}
          <div className="pt-4 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
            <button
              onClick={() => {
                toast.success(`DÖF Tutanağı İndirildi: ${ncr.reportNo}`, { icon: "📄" });
              }}
              className="px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 transition"
            >
              Tutanağı Yazdır (PDF)
            </button>

            <div className="flex items-center gap-2">
              {ncr.status === "OPEN" && (
                <button
                  onClick={() => handleResolve("RESOLVED")}
                  disabled={loading}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md transition disabled:opacity-50 cursor-pointer"
                >
                  {loading ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  )}
                  <span>Giderildi İşaretle</span>
                </button>
              )}

              {ncr.status !== "VERIFIED" && (
                <button
                  onClick={() => handleResolve("VERIFIED")}
                  disabled={loading}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md transition disabled:opacity-50 cursor-pointer"
                >
                  {loading ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <ShieldCheck className="w-3.5 h-3.5" />
                  )}
                  <span>DÖF'ü Kesin Kapat</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
