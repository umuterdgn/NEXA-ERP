/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Nexa ERP - Admin Vaziyet & İSG Risk Planı Canlı Haritası
 *
 * Şantiyedeki aktif personellerin GPS koordinatlarını ve dinamik tehlike çemberlerini
 * Leaflet haritası üzerinde gerçek zamanlı olarak görüntüler.
 */

import React from "react";
import dynamic from "next/dynamic";
import { getLivePersonnelLocations, getRiskZones } from "@/app/actions/ohs";
import { prisma } from "@/lib/prisma";
import { ShieldAlert, Users, MapPin, Radio, Activity, AlertOctagon } from "lucide-react";

// Leaflet SSR'da window hatası vermemesi için dynamic import ile ssr: false
const LiveSituationRiskMap = dynamic(
  () => import("@/components/ohs/LiveSituationRiskMap"),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-[620px] rounded-2xl bg-slate-900 border border-slate-800 flex flex-col items-center justify-center text-slate-400 gap-3">
        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-semibold">Vaziyet Planı & Canlı GPS Haritası Yükleniyor...</p>
      </div>
    ),
  }
);

export const metadata = {
  title: "Vaziyet ve İSG Risk Planı | Nexa ERP",
  description: "Şantiye personellerinin canlı GPS konumları ve dinamik tehlike çemberleri",
};

export default async function RiskMapPage() {
  // İlk sunucu tarafı verilerini çek
  const [initialPersonnel, initialRiskZones, activeProject] = await Promise.all([
    getLivePersonnelLocations(),
    getRiskZones(),
    prisma.project.findFirst({
      where: { status: "ACTIVE" },
      select: { id: true, name: true },
    }) || prisma.project.findFirst({ select: { id: true, name: true } }),
  ]);

  const siteCoordinates: [number, number] = [40.9912, 29.0287]; // Kadıköy Rezidans Koordinatları
  const projectName = activeProject?.name || "Kadıköy Merkez Rezidans & AVM Projesi";

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-8 flex flex-col gap-6">
      {/* 1. SAYFA BAŞLIĞI VE ÖZET BİLGİ */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-black uppercase tracking-wider bg-rose-500/20 text-rose-400 border border-rose-500/30">
              İSG Canlı Güvenlik Radarı
            </span>
            <span className="flex items-center gap-1.5 text-xs text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Real-time Socket.io
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/10 text-amber-300 border border-amber-500/20">
              🚁 FPV Drone Ortofoto (22x Zoom)
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-500/10 text-blue-300 border border-blue-500/20">
              🎬 Geçmiş Rota Playback
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">
            Vaziyet ve İSG Risk Planı
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Şantiye personellerinin anlık mobil konum takibi (Check-in GPS) ve yüksek riskli imalat çemberleri.
          </p>
        </div>

        {/* Proje Bilgi Rozeti */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
            <MapPin className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] text-slate-500 uppercase font-bold tracking-wider">
              Aktif Şantiye
            </span>
            <p className="text-sm font-bold text-white">{projectName}</p>
          </div>
        </div>
      </div>

      {/* 2. DÖRT ANA İSTATİSTİK KARTI */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-400">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-400 font-medium">Sahadaki Personel</span>
            <p className="text-2xl font-black text-white font-mono mt-0.5">
              {initialPersonnel.length} <span className="text-xs text-slate-500 font-normal">Kişi</span>
            </p>
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-400 font-medium">Tanımlı Risk Çemberi</span>
            <p className="text-2xl font-black text-rose-400 font-mono mt-0.5">
              {initialRiskZones.length} <span className="text-xs text-rose-500/80 font-normal">Kritik Alan</span>
            </p>
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Radio className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-400 font-medium">GPS Sinyal Aralığı</span>
            <p className="text-2xl font-black text-amber-400 font-mono mt-0.5">
              5 sn <span className="text-xs text-slate-500 font-normal">Canlı Yenileme</span>
            </p>
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-400 font-medium">İSG Güvenlik Durumu</span>
            <p className="text-2xl font-black text-emerald-400 font-mono mt-0.5">
              %100 <span className="text-xs text-emerald-500/80 font-normal">Kontrol Altında</span>
            </p>
          </div>
        </div>
      </div>

      {/* 3. CANLI LEAFLET HARİTASI (REAL-TIME GPS & DANGER ZONES) */}
      <div className="flex-1 w-full min-h-[640px]">
        <LiveSituationRiskMap
          initialPersonnel={initialPersonnel}
          initialRiskZones={initialRiskZones}
          siteCoordinates={siteCoordinates}
          projectName={projectName}
        />
      </div>
    </div>
  );
}
