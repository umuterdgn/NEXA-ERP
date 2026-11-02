/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Nexa ERP - Leaflet Tabanlı Canlı Şantiye Vaziyet ve İSG Risk Planı Haritası
 *
 * Şantiyedeki personellerin canlı GPS konumlarını ve kırmızı risk çemberlerini
 * gerçek zamanlı (real-time 5s interval) olarak gösterir.
 */

"use client";

import React, { useEffect, useState, useMemo } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Circle,
  Tooltip,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { LivePersonnel, RiskZoneItem, getLivePersonnelLocations, getRiskZones } from "@/app/actions/ohs";
import { ShieldAlert, Users, Radio, Crosshair, AlertTriangle, RefreshCw, HardHat } from "lucide-react";

// Harita Merkezini Dinamik Olarak Güncelleyen Yardımcı Bileşen
function MapCenterUpdater({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, map.getZoom());
  }, [center, map]);
  return null;
}

// Özel Personel DivIcon'u (Rol ve çevrimiçi durumuna göre renkli)
function createPersonnelIcon(role: string, isOnline: boolean) {
  const isDanger = role === "OPERATOR";
  const isForeman = role === "FOREMAN" || role === "ENGINEER";
  const bgClass = isDanger ? "#EF4444" : isForeman ? "#3B82F6" : "#10B981";

  return L.divIcon({
    className: "custom-personnel-marker",
    html: `
      <div style="
        position: relative;
        width: 32px;
        height: 32px;
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        <div style="
          position: absolute;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: ${bgClass};
          opacity: 0.35;
          animation: ping 1.8s cubic-bezier(0, 0, 0.2, 1) infinite;
        "></div>
        <div style="
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: ${bgClass};
          border: 2px solid white;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.4);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 11px;
          font-weight: bold;
        ">
          ${isDanger ? "⚠️" : isForeman ? "👷" : "🟢"}
        </div>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -18],
  });
}

// Risk Alanı İkonu (Çember Merkezi İçin)
const riskCenterIcon = L.divIcon({
  className: "custom-risk-center-marker",
  html: `
    <div style="
      width: 22px;
      height: 22px;
      border-radius: 50%;
      background: #DC2626;
      border: 2px solid #FEF2F2;
      box-shadow: 0 0 10px rgba(220, 38, 38, 0.8);
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: 11px;
    ">
      🛑
    </div>
  `,
  iconSize: [22, 22],
  iconAnchor: [11, 11],
});

interface LiveSituationRiskMapProps {
  initialPersonnel?: LivePersonnel[];
  initialRiskZones?: RiskZoneItem[];
  siteCoordinates?: [number, number]; // [lat, lng]
  projectName?: string;
}

import { io as socketIOClient } from "socket.io-client";

export default function LiveSituationRiskMap({
  initialPersonnel = [],
  initialRiskZones = [],
  siteCoordinates = [40.9912, 29.0287],
  projectName = "Kadıköy Merkez Rezidans & AVM",
}: LiveSituationRiskMapProps) {
  const [personnelList, setPersonnelList] = useState<LivePersonnel[]>(initialPersonnel);
  const [riskZones, setRiskZones] = useState<RiskZoneItem[]>(initialRiskZones);
  const [isLiveActive, setIsLiveActive] = useState<boolean>(true);
  const [isSocketConnected, setIsSocketConnected] = useState<boolean>(false);
  const [lastRefreshedAt, setLastRefreshedAt] = useState<string>("");
  const [isUpdating, setIsUpdating] = useState<boolean>(false);
  const [selectedPersonnel, setSelectedPersonnel] = useState<LivePersonnel | null>(null);

  // ADIM 2: Socket.io Dinleyicisi - 'locationUpdated' yayınını dinle ve haritayı anlık güncelle
  useEffect(() => {
    let socket: any = null;
    try {
      const socketUrl = typeof window !== "undefined" ? window.location.origin : "";
      socket = socketIOClient(socketUrl, {
        transports: ["websocket", "polling"],
        reconnection: true,
      });

      socket.on("connect", () => {
        setIsSocketConnected(true);
      });

      socket.on("locationUpdated", (data: any) => {
        if (!data || data.lat === undefined || data.lng === undefined) return;

        setPersonnelList((prev) => {
          const index = prev.findIndex((p) => p.id === data.userId);
          const updateTimeStr = data.timestamp
            ? new Date(data.timestamp).toLocaleTimeString("tr-TR")
            : new Date().toLocaleTimeString("tr-TR");

          if (index !== -1) {
            const updated = [...prev];
            updated[index] = {
              ...updated[index],
              currentLat: data.lat,
              currentLng: data.lng,
              lastLocationUpdate: updateTimeStr,
              isOnline: true,
            };
            return updated;
          } else {
            return [
              ...prev,
              {
                id: data.userId,
                name: data.userName || `Personel (${data.userId.slice(-4)})`,
                email: "saha@nexa.com",
                role: "WORKER",
                currentLat: data.lat,
                currentLng: data.lng,
                lastLocationUpdate: updateTimeStr,
                isOnline: true,
              },
            ];
          }
        });

        setLastRefreshedAt(new Date().toLocaleTimeString("tr-TR"));
      });

      socket.on("disconnect", () => {
        setIsSocketConnected(false);
      });
    } catch (e) {
      console.warn("[LiveRiskMap] Socket.io bağlantı uyarısı:", e);
    }

    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, []);

  // Canlı Konumları ve Risk Alanlarını Güncelleme Fonksiyonu
  const refreshLiveFeed = async () => {
    try {
      setIsUpdating(true);
      const [latestPersonnel, latestZones] = await Promise.all([
        getLivePersonnelLocations(),
        getRiskZones(),
      ]);

      setPersonnelList(latestPersonnel);
      if (latestZones && latestZones.length > 0) {
        setRiskZones(latestZones);
      }
      setLastRefreshedAt(new Date().toLocaleTimeString("tr-TR"));
    } catch (err) {
      console.error("[LiveRiskMap] Canlı veri çekme hatası:", err);
    } finally {
      setIsUpdating(false);
    }
  };

  // ADIM 3: useEffect ve setInterval (Her 5 saniyede bir canlı konum çek)
  useEffect(() => {
    refreshLiveFeed();

    if (!isLiveActive) return;

    const intervalId = setInterval(() => {
      refreshLiveFeed();
    }, 5000); // 5 saniye

    return () => clearInterval(intervalId);
  }, [isLiveActive]);

  // Çember ve Personel İstatistikleri
  const criticalZonesCount = riskZones.filter((z) => z.dangerLevel === "CRITICAL").length;
  const activePersonnelCount = personnelList.length;

  return (
    <div className="flex flex-col h-full w-full bg-slate-950 text-white rounded-2xl overflow-hidden border border-slate-800 shadow-2xl relative">
      {/* 1. ÜST KONTROL BAR VE BİLGİ PANELİ */}
      <div className="bg-slate-900/90 backdrop-blur-md px-6 py-4 border-b border-slate-800 flex flex-wrap items-center justify-between gap-4 z-10">
        <div>
          <div className="flex items-center gap-2">
            <span className="relative flex h-3 w-3">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${isLiveActive ? "bg-emerald-400" : "bg-gray-400"} opacity-75`}></span>
              <span className={`relative inline-flex rounded-full h-3 w-3 ${isLiveActive ? "bg-emerald-500" : "bg-gray-500"}`}></span>
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
              {isSocketConnected
                ? "⚡ SOCKET.IO CANLI AKIŞ AKTİF (REAL-TIME)"
                : isLiveActive
                ? "CANLI GPS RADARI AKTİF (5s)"
                : "DURAKLATILDI"}
            </span>
            <span className="text-slate-500 text-xs">|</span>
            <span className="text-slate-400 text-xs font-medium">
              Son Güncelleme: <span className="text-slate-200 font-mono">{lastRefreshedAt || "Yükleniyor..."}</span>
            </span>
          </div>
          <h2 className="text-xl font-black text-white tracking-tight mt-0.5">
            {projectName} - Vaziyet & Risk Planı
          </h2>
        </div>

        {/* Canlı İstatistik Rozetleri & Eylemler */}
        <div className="flex items-center gap-3">
          <div className="bg-slate-800/80 px-3.5 py-1.5 rounded-xl border border-slate-700/60 flex items-center gap-2">
            <Users className="w-4 h-4 text-blue-400" />
            <div className="text-xs">
              <span className="text-slate-400 font-medium">Sahadaki Personel:</span>{" "}
              <span className="text-white font-bold font-mono">{activePersonnelCount}</span>
            </div>
          </div>

          <div className="bg-rose-950/50 px-3.5 py-1.5 rounded-xl border border-rose-500/40 flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-rose-400" />
            <div className="text-xs">
              <span className="text-rose-300 font-medium">Risk Çemberi:</span>{" "}
              <span className="text-rose-200 font-bold font-mono">{riskZones.length} Bölge</span>
            </div>
          </div>

          <button
            onClick={() => refreshLiveFeed()}
            disabled={isUpdating}
            className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white transition flex items-center justify-center cursor-pointer"
            title="Şimdi Yenile"
          >
            <RefreshCw className={`w-4 h-4 ${isUpdating ? "animate-spin text-blue-400" : ""}`} />
          </button>

          <button
            onClick={() => setIsLiveActive(!isLiveActive)}
            className={`px-3.5 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition cursor-pointer ${
              isLiveActive
                ? "bg-emerald-600/30 text-emerald-300 border border-emerald-500/50 hover:bg-emerald-600/40"
                : "bg-slate-800 text-slate-400 border border-slate-700 hover:bg-slate-700"
            }`}
          >
            <Radio className="w-3.5 h-3.5" />
            {isLiveActive ? "Canlı Akış Açık" : "Akışı Başlat"}
          </button>
        </div>
      </div>

      {/* 2. LEAFLET HARİTA ALANI */}
      <div className="flex-1 w-full relative z-0 min-h-[560px]">
        <MapContainer
          center={siteCoordinates}
          zoom={18}
          scrollWheelZoom={true}
          className="h-full w-full"
          style={{ background: "#0b0f19" }}
        >
          {/* Harita Katmanı: Esri World Imagery (Uydu Görünümü) veya OpenStreetMap */}
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <MapCenterUpdater center={siteCoordinates} />

          {/* Şantiye Ana Merkez İşareti */}
          <Marker position={siteCoordinates}>
            <Popup>
              <div className="p-1">
                <p className="font-bold text-slate-900 text-sm">{projectName}</p>
                <p className="text-xs text-slate-600">Şantiye Ana Yönetim & Giriş Koordinatı</p>
                <p className="text-[11px] font-mono text-blue-600 mt-1">
                  {siteCoordinates[0].toFixed(5)}, {siteCoordinates[1].toFixed(5)}
                </p>
              </div>
            </Popup>
          </Marker>

          {/* ADIM 3: getRiskZones() verilerini haritaya <Circle> (Kırmızı ve saydam dolgulu) olarak çiz */}
          {riskZones.map((zone) => {
            const isCritical = zone.dangerLevel === "CRITICAL";
            return (
              <React.Fragment key={zone.id}>
                {/* Kırmızı & Saydam Dolgulu Tehlike Çemberi */}
                <Circle
                  center={[zone.centerLat, zone.centerLng]}
                  radius={zone.radius}
                  pathOptions={{
                    color: isCritical ? "#DC2626" : "#E11D48",
                    fillColor: isCritical ? "#EF4444" : "#F43F5E",
                    fillOpacity: 0.28,
                    weight: 2.5,
                    dashArray: isCritical ? "6, 6" : undefined,
                  }}
                >
                  <Tooltip direction="top" offset={[0, -10]} opacity={0.95}>
                    <div className="p-1">
                      <p className="font-black text-rose-700 text-xs">🛑 {zone.name}</p>
                      <p className="text-[10px] text-slate-600">
                        Güvenlik Yarıçapı: <b>{zone.radius} metre</b>
                      </p>
                    </div>
                  </Tooltip>
                  <Popup>
                    <div className="p-2 min-w-[200px]">
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-rose-100 text-rose-700">
                          {zone.dangerLevel || "TEHLİKE"}
                        </span>
                      </div>
                      <h4 className="font-bold text-slate-900 text-sm mb-1">{zone.name}</h4>
                      {zone.zoneName && (
                        <p className="text-xs text-slate-500 mb-1">Bölge: {zone.zoneName}</p>
                      )}
                      <p className="text-xs text-slate-700 mb-1">
                        Tehlike Yarıçapı: <b>{zone.radius} Metre</b>
                      </p>
                      <p className="text-[11px] text-slate-500">
                        Bu alan içerisinde baret ve gerekli KKD kullanımı zorunludur.
                      </p>
                    </div>
                  </Popup>
                </Circle>

                {/* Çember Merkezi İkonu */}
                <Marker
                  position={[zone.centerLat, zone.centerLng]}
                  icon={riskCenterIcon}
                >
                  <Popup>
                    <div className="p-1">
                      <p className="font-bold text-slate-900 text-xs">{zone.name}</p>
                      <p className="text-[10px] text-slate-500">Merkez Noktası (Yarıçap: {zone.radius}m)</p>
                    </div>
                  </Popup>
                </Marker>
              </React.Fragment>
            );
          })}

          {/* ADIM 3: personelleri haritada mavi/yeşil noktalar (Marker) olarak göster */}
          {personnelList.map((person) => {
            const icon = createPersonnelIcon(person.role, person.isOnline);
            return (
              <Marker
                key={person.id}
                position={[person.currentLat, person.currentLng]}
                icon={icon}
                eventHandlers={{
                  click: () => setSelectedPersonnel(person),
                }}
              >
                <Tooltip direction="bottom" offset={[0, 10]} opacity={0.9}>
                  <div className="text-xs font-bold text-slate-900">
                    {person.name} ({person.role})
                  </div>
                </Tooltip>
                <Popup>
                  <div className="p-2 min-w-[220px]">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-100 text-blue-800">
                        {person.role}
                      </span>
                      <span className="flex items-center gap-1 text-[10px] text-emerald-600 font-semibold">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        {person.isOnline ? "Canlı Sinyal" : "Pasif"}
                      </span>
                    </div>

                    <h4 className="font-black text-slate-900 text-sm">{person.name}</h4>
                    <p className="text-xs text-slate-600 mb-2">{person.email}</p>

                    <div className="bg-slate-50 p-2 rounded-lg border border-slate-200 text-[11px] space-y-0.5">
                      <p className="text-slate-600">
                        Son GPS: <span className="font-mono font-bold text-slate-900">{person.lastLocationUpdate}</span>
                      </p>
                      <p className="text-slate-600">
                        Koordinat: <span className="font-mono text-slate-800">{person.currentLat.toFixed(5)}, {person.currentLng.toFixed(5)}</span>
                      </p>
                    </div>
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>

        {/* Sol Alt: Harita Açıklama / Legend Paneli */}
        <div className="absolute bottom-5 left-5 bg-slate-900/90 backdrop-blur-md p-3.5 rounded-xl border border-slate-800 shadow-xl z-500 max-w-xs text-xs pointer-events-auto">
          <p className="font-bold text-white mb-2 flex items-center gap-1.5">
            <Crosshair className="w-3.5 h-3.5 text-blue-400" />
            Harita Açıklamaları (Legend)
          </p>
          <div className="space-y-1.5 text-slate-300">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-rose-600 border border-white" />
              <span>Kırmızı Alan: İSG Tehlike & Risk Çemberi</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-blue-500 border border-white" />
              <span>Mavi Nokta: Şantiye Şefi / Mühendis</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-emerald-500 border border-white" />
              <span>Yeşil Nokta: Aktif Personel & Taşeron</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-rose-500 border border-white" />
              <span>Kırmızı Nokta: Vinç / Ağır Makine Operatörü</span>
            </div>
          </div>
        </div>

        {/* Sağ Alt: Seçili Personel Detay Kartı */}
        {selectedPersonnel && (
          <div className="absolute bottom-5 right-5 bg-slate-900/95 backdrop-blur-md p-4 rounded-2xl border border-blue-500/40 shadow-2xl z-500 w-80 text-xs pointer-events-auto">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  {selectedPersonnel.role}
                </span>
                <h3 className="text-sm font-black text-white mt-1">{selectedPersonnel.name}</h3>
                <p className="text-slate-400 text-[11px]">{selectedPersonnel.email}</p>
              </div>
              <button
                onClick={() => setSelectedPersonnel(null)}
                className="text-slate-400 hover:text-white text-base leading-none p-1"
              >
                ✕
              </button>
            </div>

            <div className="mt-3 pt-2.5 border-t border-slate-800 space-y-1 text-slate-300">
              <div className="flex justify-between">
                <span className="text-slate-500">Son Güncelleme:</span>
                <span className="font-mono text-emerald-400 font-bold">{selectedPersonnel.lastLocationUpdate}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Enlem / Boylam:</span>
                <span className="font-mono text-white">
                  {selectedPersonnel.currentLat.toFixed(5)}, {selectedPersonnel.currentLng.toFixed(5)}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
