/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Donatı & Kalıp Vize Tutanağı Detay ve Resmi Muayene Sayfası
 */

import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Construction,
  ArrowLeft,
  Building,
  UserCheck,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Printer,
  ShieldCheck,
  Ruler,
  Layers,
  FileText
} from "lucide-react";
import { getVisaById } from "@/app/actions/inspection";
import VisaDetailClientActions from "./_components/VisaDetailClientActions";

export const dynamic = "force-dynamic";

export default async function VisaDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const res = await getVisaById(id);

  if (!res.success || !res.data) {
    notFound();
  }

  const visa = res.data;

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-5xl mx-auto">
      {/* Geri Dönüş & Üst Başlık */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800/80 pb-5">
        <div>
          <Link
            href="/inspection/reinforcement"
            className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Tüm Vizelere Geri Dön</span>
          </Link>
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-blue-950/70 text-blue-400 border border-blue-900/80">
              {visa.visaNo}
            </span>
            <span className="text-xs text-slate-400">Resmi Muayene Tutanağı</span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight mt-1">{visa.elementName}</h1>
        </div>

        {/* İstemci Tarafı Onay/Red Butonları */}
        <VisaDetailClientActions visa={visa} />
      </div>

      {/* Durum Kartı */}
      <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/70 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
            Vize Muayene Kararı
          </div>
          {visa.status === "APPROVED" && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-950/70 text-emerald-400 border border-emerald-800">
              <CheckCircle2 className="w-4 h-4" /> Beton Döküm İzni Verildi (Onaylı)
            </span>
          )}
          {visa.status === "REJECTED" && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-950/70 text-rose-400 border border-rose-800">
              <AlertTriangle className="w-4 h-4" /> Vize Reddedildi (Döküm Yasak)
            </span>
          )}
          {visa.status === "PENDING" && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-950/70 text-amber-400 border border-amber-800">
              <Clock className="w-4 h-4" /> Muayene & Karar Bekliyor
            </span>
          )}
        </div>

        <div className="text-right">
          <div className="text-[11px] font-medium text-slate-400">Kayıt Tarihi</div>
          <div className="text-xs font-semibold text-slate-200 mt-0.5">
            {new Date(visa.createdAt).toLocaleDateString("tr-TR", {
              day: "2-digit",
              month: "long",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </div>
        </div>
      </div>

      {/* Red Gerekçesi Varsa Göster */}
      {visa.rejectionReason && (
        <div className="p-4 rounded-xl border border-rose-900/80 bg-rose-950/30 text-xs">
          <div className="font-bold text-rose-300 flex items-center gap-1.5 mb-1">
            <AlertTriangle className="w-4 h-4 text-rose-400" />
            <span>Kusur Bildirimi & Red Gerekçesi</span>
          </div>
          <p className="text-rose-200/90 leading-relaxed">{visa.rejectionReason}</p>
        </div>
      )}

      {/* Proje ve Denetçi Bilgileri */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-5 rounded-xl border border-slate-800 bg-slate-900/60 space-y-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-blue-400 uppercase tracking-wider">
            <Building className="w-4 h-4" />
            <span>Denetlenen Şantiye / Yapı</span>
          </div>
          <div className="text-base font-bold text-white">
            {visa.project?.title || visa.project?.name}
          </div>
          <div className="text-xs text-slate-300">
            YİBF No: <span className="font-mono text-white font-semibold">{visa.project?.yibfNo || "—"}</span>
          </div>
          {visa.project?.location && (
            <div className="text-xs text-slate-400">Konum: {visa.project.location}</div>
          )}
        </div>

        <div className="p-5 rounded-xl border border-slate-800 bg-slate-900/60 space-y-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 uppercase tracking-wider">
            <UserCheck className="w-4 h-4" />
            <span>Sorumlu Denetçi Mühendis</span>
          </div>
          <div className="text-base font-bold text-white">{visa.inspector?.name}</div>
          <div className="text-xs text-slate-300">
            Yetki Rolü: <span className="text-white font-semibold">{visa.inspector?.role}</span>
          </div>
          <div className="text-xs text-slate-400">E-Posta: {visa.inspector?.email}</div>
        </div>
      </div>

      {/* Ölçüm ve Teknik Detaylar */}
      <div className="p-5 rounded-xl border border-slate-800 bg-slate-900/60 space-y-4">
        <div className="text-xs font-bold text-white flex items-center gap-2 border-b border-slate-800/80 pb-3">
          <Layers className="w-4 h-4 text-amber-400" />
          <span>Statik ve Geometrik Muayene Parametreleri (TBDY 2018 / TS 500)</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800">
            <span className="text-slate-400 text-xs block font-medium">Donatı Çapı & Detayları</span>
            <span className="font-bold text-white text-sm mt-1 block">{visa.reinforcementDetails}</span>
          </div>

          <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800">
            <span className="text-slate-400 text-xs block font-medium">Paspayı (Cover Space)</span>
            <span className="font-bold text-emerald-400 text-sm mt-1 block font-mono">
              {visa.coverSpace} cm {visa.coverSpace >= 2.5 ? "✅ (Şartnameye Uygun)" : "⚠️ (Kritik Düşük)"}
            </span>
          </div>

          <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800">
            <span className="text-slate-400 text-xs block font-medium">Kalıp Rijitliği & Şakül</span>
            <span className={`font-bold text-sm mt-1 block ${visa.formworkStatus === "Şakülünde" ? "text-emerald-400" : "text-amber-400"}`}>
              {visa.formworkStatus}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
