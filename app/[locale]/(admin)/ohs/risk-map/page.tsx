/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Nexa ERP - Admin Vaziyet & İSG Risk Planı Canlı Haritası
 *
 * Şantiyedeki aktif personellerin GPS koordinatlarını ve dinamik tehlike çemberlerini
 * Leaflet haritası üzerinde gerçek zamanlı olarak görüntüler.
 */

import React from "react";
import DynamicRiskMapWrapper from "@/components/ohs/DynamicRiskMapWrapper";
import { getLivePersonnelLocations, getRiskZones } from "@/app/actions/ohs";
import { prisma } from "@/lib/prisma";
import { ShieldAlert, Users, MapPin, Radio, Activity, AlertOctagon } from "lucide-react";

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
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white flex items-center gap-2">
            Vaziyet & İSG Risk Planı
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            {projectName} • BLE Beacon, Akıllı Baret & GPS telemetrisi ile şantiye sahasındaki riskli bölgeleri harita üzerinde izleyin.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-4 py-2 bg-slate-900 border border-slate-800 rounded-xl flex items-center gap-2.5">
            <Radio className="w-4 h-4 text-cyan-400 animate-pulse" />
            <div className="text-left">
              <span className="block text-[10px] text-slate-400 font-semibold uppercase">Aktif Uydu/Baz</span>
              <span className="text-xs font-bold text-slate-200">9 GPS + 4 BLE Hub</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. HIZLI METRİK KARTLARI */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-400">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-400 font-medium">Sahadaki Personel</span>
            <p className="text-2xl font-black text-white font-mono mt-0.5">
              {initialPersonnel.length} <span className="text-xs text-slate-400 font-normal">Kişi</span>
            </p>
          </div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-400 font-medium">Aktif Tehlike Çemberi</span>
            <p className="text-2xl font-black text-rose-400 font-mono mt-0.5">
              {initialRiskZones.length} <span className="text-xs text-rose-500/80 font-normal">Kritik Bölge</span>
            </p>
          </div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <AlertOctagon className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-400 font-medium">İhlal Bildirimi (Son 1s)</span>
            <p className="text-2xl font-black text-amber-400 font-mono mt-0.5">
              0 <span className="text-xs text-slate-400 font-normal">Uyarı</span>
            </p>
          </div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 flex items-center gap-4">
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
        <DynamicRiskMapWrapper
          initialPersonnel={initialPersonnel}
          initialRiskZones={initialRiskZones}
          siteCoordinates={siteCoordinates}
          projectName={projectName}
        />
      </div>
    </div>
  );
}
