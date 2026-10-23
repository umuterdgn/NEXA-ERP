/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Visa Detail Client Actions (Approve / Reject / Print)
 */

"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, AlertTriangle, Printer, Loader2 } from "lucide-react";
import { toast } from "react-hot-toast";
import { updateVisaStatus } from "@/app/actions/inspection";

export default function VisaDetailClientActions({ visa }: { visa: any }) {
  const router = useRouter();
  const [isUpdating, setIsUpdating] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");

  const handleApprove = async () => {
    setIsUpdating(true);
    try {
      const res = await updateVisaStatus(visa.id, "APPROVED");
      if (res.success) {
        toast.success("Vize Onaylandı! Beton Döküm İzni Verildi.", { icon: "✅" });
        router.refresh();
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
        setRejecting(false);
        router.refresh();
      } else {
        toast.error(res.error || "Red işlemi başarısız.");
      }
    } catch (err: any) {
      toast.error(err.message || "Hata oluştu.");
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
      <button
        onClick={() => window.print()}
        className="flex items-center justify-center gap-2 px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition cursor-pointer"
      >
        <Printer className="w-4 h-4 text-blue-400" />
        <span>Resmi Çıktı</span>
      </button>

      {visa.status === "PENDING" && !rejecting && (
        <>
          <button
            onClick={() => setRejecting(true)}
            disabled={isUpdating}
            className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-rose-950 hover:bg-rose-900 text-rose-300 border border-rose-800 text-xs font-semibold transition cursor-pointer"
          >
            <AlertTriangle className="w-4 h-4" />
            <span>Reddet</span>
          </button>

          <button
            onClick={handleApprove}
            disabled={isUpdating}
            className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md transition cursor-pointer"
          >
            {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
            <span>Döküm İzni Ver</span>
          </button>
        </>
      )}

      {rejecting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md p-5 rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl space-y-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400" />
              <span>Red / Kusur Gerekçesi</span>
            </h3>
            <textarea
              rows={3}
              placeholder="Örn: Etriye aralığı hatalı, paspayı yetersiz."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              className="w-full bg-slate-950 border border-rose-800/60 rounded-lg p-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setRejecting(false)}
                className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 text-xs hover:bg-slate-700"
              >
                Vazgeç
              </button>
              <button
                onClick={handleReject}
                disabled={isUpdating}
                className="px-4 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold"
              >
                {isUpdating ? "İşleniyor..." : "Reddet"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
