/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Nexa ERP - Leaflet Tabanlı Canlı Şantiye Vaziyet, İSG Risk Planı & Rota Playback Haritası
 *
 * Özel FPV Drone Ortofoto katmanı (TileLayer), dinamik tehlike çemberleri (Circle) ve
 * personelin geçmiş şantiye hareketlerini canlandıran video timeline oynatıcı (Playback Polyline).
 */

"use client";

import React, { useEffect, useState, useRef, useMemo } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Circle,
  Tooltip,
  Polyline,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { io as socketIOClient } from "socket.io-client";
import {
  LivePersonnel,
  RiskZoneItem,
  LocationHistoryPoint,
  getLivePersonnelLocations,
  getRiskZones,
  getPersonnelRouteHistory,
  getAllPersonnelForPlayback,
} from "@/app/actions/ohs";
import {
  ShieldAlert,
  Users,
  Radio,
  Crosshair,
  RefreshCw,
  Play,
  Pause,
  RotateCcw,
  FastForward,
  Layers,
  Camera,
  Calendar,
  UserCheck,
  Eye,
  Sliders,
  ChevronRight,
  Map as MapIcon,
} from "lucide-react";

// Harita Merkezini Dinamik Olarak Güncelleyen Yardımcı Bileşen
function MapCenterUpdater({ center, zoom }: { center: [number, number]; zoom?: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom || map.getZoom());
  }, [center, zoom, map]);
  return null;
}

// Canlı Personel DivIcon'u
function createPersonnelIcon(role: string, isOnline: boolean) {
  const isDanger = role === "OPERATOR";
  const isForeman = role === "FOREMAN" || role === "ENGINEER";
  const bgClass = isDanger ? "#EF4444" : isForeman ? "#3B82F6" : "#10B981";

  return L.divIcon({
    className: "custom-personnel-marker",
    html: `
      <div style="position: relative; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center;">
        <div style="position: absolute; width: 32px; height: 32px; border-radius: 50%; background: ${bgClass}; opacity: 0.35; animation: ping 1.8s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
        <div style="width: 24px; height: 24px; border-radius: 50%; background: ${bgClass}; border: 2px solid white; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.4); display: flex; align-items: center; justify-content: center; color: white; font-size: 11px; font-weight: bold;">
          ${isDanger ? "⚠️" : isForeman ? "👷" : "🟢"}
        </div>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -18],
  });
}

// Playback Animasyonlu Nokta İkonu (Kırmızı Hareketli Hedef)
const playbackRunnerIcon = L.divIcon({
  className: "custom-playback-runner-marker",
  html: `
    <div style="position: relative; width: 38px; height: 38px; display: flex; align-items: center; justify-content: center;">
      <div style="position: absolute; width: 38px; height: 38px; border-radius: 50%; background: #EF4444; opacity: 0.5; animation: ping 1.2s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
      <div style="width: 28px; height: 28px; border-radius: 50%; background: #DC2626; border: 3px solid #FFFFFF; box-shadow: 0 0 14px rgba(220, 38, 38, 0.9); display: flex; align-items: center; justify-content: center; color: white; font-size: 13px; font-weight: 900;">
        📍
      </div>
    </div>
  `,
  iconSize: [38, 38],
  iconAnchor: [19, 19],
  popupAnchor: [0, -20],
});

// Risk Alanı İkonu
const riskCenterIcon = L.divIcon({
  className: "custom-risk-center-marker",
  html: `
    <div style="width: 22px; height: 22px; border-radius: 50%; background: #DC2626; border: 2px solid #FEF2F2; box-shadow: 0 0 10px rgba(220, 38, 38, 0.8); display: flex; align-items: center; justify-content: center; color: white; font-size: 11px;">
      🛑
    </div>
  `,
  iconSize: [22, 22],
  iconAnchor: [11, 11],
});

interface LiveSituationRiskMapProps {
  initialPersonnel?: LivePersonnel[];
  initialRiskZones?: RiskZoneItem[];
  siteCoordinates?: [number, number];
  projectName?: string;
}

export default function LiveSituationRiskMap({
  initialPersonnel = [],
  initialRiskZones = [],
  siteCoordinates = [40.9912, 29.0287],
  projectName = "Kadıköy Merkez Rezidans & AVM",
}: LiveSituationRiskMapProps) {
  // Canlı Takip State'leri
  const [personnelList, setPersonnelList] = useState<LivePersonnel[]>(initialPersonnel);
  const [riskZones, setRiskZones] = useState<RiskZoneItem[]>(initialRiskZones);
  const [isLiveActive, setIsLiveActive] = useState<boolean>(true);
  const [isSocketConnected, setIsSocketConnected] = useState<boolean>(false);
  const [lastRefreshedAt, setLastRefreshedAt] = useState<string>("");
  const [isUpdating, setIsUpdating] = useState<boolean>(false);
  const [selectedPersonnel, setSelectedPersonnel] = useState<LivePersonnel | null>(null);

  // ADIM 1: Katman Yönetimi State'leri (OSM vs Uydu vs Drone Ortofoto)
  const [activeLayer, setActiveLayer] = useState<"OSM" | "SATELLITE" | "DRONE">("DRONE");
  const [droneMapUrl, setDroneMapUrl] = useState<string>(
    "https://{s}.tile.nxa.com.tr/orthophoto/{z}/{x}/{y}.png"
  );
  const [showDroneUrlInput, setShowDroneUrlInput] = useState<boolean>(false);

  // ADIM 2: Rota Playback (Zaman Çizelgesi) State'leri
  const [playbackMode, setPlaybackMode] = useState<boolean>(false);
  const [allPersonnelList, setAllPersonnelList] = useState<Array<{ id: string; name: string; role: string }>>([]);
  const [selectedPlaybackUserId, setSelectedPlaybackUserId] = useState<string>("");
  const [selectedPlaybackDate, setSelectedPlaybackDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [routePoints, setRoutePoints] = useState<LocationHistoryPoint[]>([]);
  const [isLoadingRoute, setIsLoadingRoute] = useState<boolean>(false);

  // Video Oynatıcı Slider State'leri
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1); // 1x, 2x, 5x
  const playbackTimerRef = useRef<NodeJS.Timeout | null>(null);

  // 1. Playback için Personel Listesini Yükle
  useEffect(() => {
    getAllPersonnelForPlayback().then((users) => {
      setAllPersonnelList(users);
      if (users.length > 0 && !selectedPlaybackUserId) {
        setSelectedPlaybackUserId(users[0].id);
      }
    });
  }, []);

  // 2. Socket.io Dinleyicisi - 'locationUpdated' yayınını dinle
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

  // 3. Canlı Konumları ve Risk Alanlarını Çekme (5s Interval)
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

  useEffect(() => {
    refreshLiveFeed();

    if (!isLiveActive || playbackMode) return;

    const intervalId = setInterval(() => {
      refreshLiveFeed();
    }, 5000);

    return () => clearInterval(intervalId);
  }, [isLiveActive, playbackMode]);

  // ADIM 2: Seçilen Personel & Tarih İçin Rota Geçmişini Yükle
  const handleLoadRoute = async () => {
    if (!selectedPlaybackUserId) return;
    try {
      setIsLoadingRoute(true);
      setIsPlaying(false);
      setCurrentStepIndex(0);

      const points = await getPersonnelRouteHistory(
        selectedPlaybackUserId,
        selectedPlaybackDate
      );
      setRoutePoints(points);
      setPlaybackMode(true);
    } catch (err) {
      console.error("[LiveRiskMap] Rota yükleme hatası:", err);
    } finally {
      setIsLoadingRoute(false);
    }
  };

  // ADIM 2: Playback Otomatik Oynatma Motoru (Play / Pause & Speed)
  useEffect(() => {
    if (isPlaying && routePoints.length > 0) {
      const stepDuration = 1000 / playbackSpeed;

      playbackTimerRef.current = setInterval(() => {
        setCurrentStepIndex((prev) => {
          if (prev >= routePoints.length - 1) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, stepDuration);
    } else {
      if (playbackTimerRef.current) {
        clearInterval(playbackTimerRef.current);
      }
    }

    return () => {
      if (playbackTimerRef.current) {
        clearInterval(playbackTimerRef.current);
      }
    };
  }, [isPlaying, playbackSpeed, routePoints.length]);

  // Aktif Oynatılan Nokta ve Çizgi Koordinatları
  const activeRouteCoordinates = useMemo<[number, number][]>(() => {
    return routePoints.map((pt) => [pt.lat, pt.lng]);
  }, [routePoints]);

  const currentRunnerPoint = routePoints[currentStepIndex] || null;
  const selectedPlaybackUserObj = allPersonnelList.find((p) => p.id === selectedPlaybackUserId);

  return (
    <div className="flex flex-col h-full w-full bg-slate-950 text-white rounded-2xl overflow-hidden border border-slate-800 shadow-2xl relative">
      {/* 1. ÜST KONTROL BAR & KATMAN DEĞİŞTİRİCİ */}
      <div className="bg-slate-900/95 backdrop-blur-md px-6 py-4 border-b border-slate-800 flex flex-wrap items-center justify-between gap-4 z-10">
        <div>
          <div className="flex items-center gap-2">
            <span className="relative flex h-3 w-3">
              <span
                className={`animate-ping absolute inline-flex h-full w-full rounded-full ${
                  isSocketConnected ? "bg-cyan-400" : isLiveActive ? "bg-emerald-400" : "bg-gray-400"
                } opacity-75`}
              ></span>
              <span
                className={`relative inline-flex rounded-full h-3 w-3 ${
                  isSocketConnected ? "bg-cyan-500" : isLiveActive ? "bg-emerald-500" : "bg-gray-500"
                }`}
              ></span>
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
              {playbackMode
                ? "🎬 GEÇMİŞ ROTA OYNATICI (PLAYBACK MODU)"
                : isSocketConnected
                ? "⚡ SOCKET.IO CANLI RADAR AKTİF"
                : "🛰️ CANLI RADAR (5s)"}
            </span>
            <span className="text-slate-500 text-xs">|</span>
            <span className="text-slate-400 text-xs font-medium">
              Son Veri: <span className="text-slate-200 font-mono">{lastRefreshedAt || "Yükleniyor..."}</span>
            </span>
          </div>
          <h2 className="text-xl font-black text-white tracking-tight mt-0.5">
            {projectName} - Vaziyet & İSG Risk Planı
          </h2>
        </div>

        {/* SAĞ ÜST: KATMANLAR (LAYERS CONTROL) VE MOD SEÇİMİ */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* ADIM 1: KATMAN SEÇİM BUTONLARI */}
          <div className="flex bg-slate-800 p-1 rounded-xl border border-slate-700">
            <button
              onClick={() => setActiveLayer("OSM")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
                activeLayer === "OSM"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <MapIcon className="w-3.5 h-3.5" />
              Standart
            </button>
            <button
              onClick={() => setActiveLayer("SATELLITE")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
                activeLayer === "SATELLITE"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              Uydu
            </button>
            <button
              onClick={() => setActiveLayer("DRONE")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
                activeLayer === "DRONE"
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Camera className="w-3.5 h-3.5 text-amber-300" />
              Güncel Drone Görüntüsü
            </button>
          </div>

          {/* Drone URL Düzenleme Toggle */}
          <button
            onClick={() => setShowDroneUrlInput(!showDroneUrlInput)}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300"
            title="Drone Ortofoto URL Ayarları"
          >
            <Sliders className="w-4 h-4" />
          </button>

          {/* Canlı vs Playback Mod Değiştirici */}
          <button
            onClick={() => {
              if (playbackMode) {
                setPlaybackMode(false);
                setIsPlaying(false);
              } else {
                handleLoadRoute();
              }
            }}
            className={`px-3.5 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition cursor-pointer ${
              playbackMode
                ? "bg-rose-600/30 text-rose-300 border border-rose-500/50 hover:bg-rose-600/40"
                : "bg-blue-600/30 text-blue-300 border border-blue-500/50 hover:bg-blue-600/40"
            }`}
          >
            <RotateCcw className="w-3.5 h-3.5" />
            {playbackMode ? "Canlı Radara Dön" : "Rota İzle (Playback)"}
          </button>
        </div>
      </div>

      {/* DRONE URL GİRİŞ PANELİ (Açılırsa) */}
      {showDroneUrlInput && (
        <div className="bg-slate-900 border-b border-slate-800 px-6 py-2.5 flex items-center gap-3 text-xs">
          <Camera className="w-4 h-4 text-emerald-400" />
          <span className="text-slate-400 font-semibold">Özel FPV Drone Ortofoto Tile URL:</span>
          <input
            type="text"
            value={droneMapUrl}
            onChange={(e) => setDroneMapUrl(e.target.value)}
            className="flex-1 bg-slate-950 border border-slate-700 px-3 py-1.5 rounded-lg text-white font-mono text-xs focus:border-emerald-500 focus:outline-none"
            placeholder="https://{s}.tile.nxa.com.tr/orthophoto/{z}/{x}/{y}.png"
          />
          <button
            onClick={() => setShowDroneUrlInput(false)}
            className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white font-bold"
          >
            Kaydet
          </button>
        </div>
      )}

      {/* 2. LEAFLET HARİTA ALANI */}
      <div className="flex-1 w-full relative z-0 min-h-[520px]">
        <MapContainer
          center={siteCoordinates}
          zoom={18}
          scrollWheelZoom={true}
          className="h-full w-full"
          style={{ background: "#0b0f19" }}
        >
          {/* ADIM 1: KATMANLAR (STANDART / UYDU / ÖZEL DRONE ORTOFOTO) */}
          {activeLayer === "OSM" && (
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
          )}

          {activeLayer === "SATELLITE" && (
            <TileLayer
              attribution='&copy; <a href="https://www.esri.com/">Esri World Imagery</a>'
              url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
              maxZoom={20}
            />
          )}

          {activeLayer === "DRONE" && (
            <>
              {/* Altlık: Esri Uydu */}
              <TileLayer
                attribution='&copy; <a href="https://www.esri.com/">Esri</a>'
                url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                maxZoom={20}
              />
              {/* ADIM 1: Özel Drone Ortofoto Katmanı */}
              <TileLayer
                url={droneMapUrl || "https://{s}.tile.nxa.com.tr/orthophoto/{z}/{x}/{y}.png"}
                maxZoom={22}
                zIndex={10}
                opacity={0.94}
              />
            </>
          )}

          <MapCenterUpdater center={siteCoordinates} />

          {/* Şantiye Ana Merkez İşareti */}
          <Marker position={siteCoordinates}>
            <Popup>
              <div className="p-1">
                <p className="font-bold text-slate-900 text-sm">{projectName}</p>
                <p className="text-xs text-slate-600">Şantiye Ana Yönetim Koordinatı</p>
                <p className="text-[11px] font-mono text-blue-600 mt-1">
                  {siteCoordinates[0].toFixed(5)}, {siteCoordinates[1].toFixed(5)}
                </p>
              </div>
            </Popup>
          </Marker>

          {/* İSG TEHLİKE ÇEMBERLERİ */}
          {riskZones.map((zone) => {
            const isCritical = zone.dangerLevel === "CRITICAL";
            return (
              <React.Fragment key={zone.id}>
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
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-rose-100 text-rose-700">
                        {zone.dangerLevel || "TEHLİKE"}
                      </span>
                      <h4 className="font-bold text-slate-900 text-sm mt-1 mb-1">{zone.name}</h4>
                      <p className="text-xs text-slate-700 mb-1">
                        Tehlike Yarıçapı: <b>{zone.radius} Metre</b>
                      </p>
                    </div>
                  </Popup>
                </Circle>

                <Marker position={[zone.centerLat, zone.centerLng]} icon={riskCenterIcon}>
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

          {/* CANLI PERSONEL MARKER'LARI (Playback modu kapalıyken) */}
          {!playbackMode &&
            personnelList.map((person) => {
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
                      </div>
                    </div>
                  </Popup>
                </Marker>
              );
            })}

          {/* ============================================================ */}
          {/* ADIM 2: PLAYBACK ROTA ÇİZGİSİ (Kırmızı Kesik Çizgili Polyline) */}
          {/* ============================================================ */}
          {playbackMode && activeRouteCoordinates.length > 0 && (
            <>
              {/* Tüm Geçmiş Rota Yolu */}
              <Polyline
                positions={activeRouteCoordinates}
                pathOptions={{
                  color: "#EF4444",
                  weight: 4,
                  opacity: 0.85,
                  dashArray: "8, 8", // Kırmızı kesik çizgiler
                }}
              />

              {/* Başlangıç Noktası */}
              <Marker position={activeRouteCoordinates[0]}>
                <Popup>
                  <div className="p-1">
                    <p className="font-bold text-xs text-emerald-700">🟢 Vardiya Başlangıç Noktası</p>
                    <p className="text-[10px] font-mono text-slate-600">
                      Saat: {routePoints[0]?.formattedTime}
                    </p>
                  </div>
                </Popup>
              </Marker>

              {/* Bitiş Noktası */}
              <Marker position={activeRouteCoordinates[activeRouteCoordinates.length - 1]}>
                <Popup>
                  <div className="p-1">
                    <p className="font-bold text-xs text-rose-700">🏁 Vardiya Bitiş Noktası</p>
                    <p className="text-[10px] font-mono text-slate-600">
                      Saat: {routePoints[routePoints.length - 1]?.formattedTime}
                    </p>
                  </div>
                </Popup>
              </Marker>

              {/* ADIM 2: Slider ilerletildikçe animasyonlu hareket eden nokta (Runner Marker) */}
              {currentRunnerPoint && (
                <Marker
                  position={[currentRunnerPoint.lat, currentRunnerPoint.lng]}
                  icon={playbackRunnerIcon}
                >
                  <Tooltip permanent direction="top" offset={[0, -16]} opacity={0.95}>
                    <div className="p-1 text-center">
                      <p className="font-black text-rose-700 text-xs">
                        {selectedPlaybackUserObj?.name || "Personel"}
                      </p>
                      <p className="text-[11px] font-mono text-slate-800 font-bold">
                        🕒 {currentRunnerPoint.formattedTime}
                      </p>
                    </div>
                  </Tooltip>
                  <Popup>
                    <div className="p-2 min-w-[200px]">
                      <h4 className="font-bold text-slate-900 text-sm">
                        {selectedPlaybackUserObj?.name}
                      </h4>
                      <p className="text-xs text-slate-500">Konum Hareketi (Nokta {currentStepIndex + 1} / {routePoints.length})</p>
                      <div className="mt-2 p-2 bg-slate-50 rounded-lg border border-slate-200 text-xs space-y-1">
                        <p>Zaman: <b>{currentRunnerPoint.formattedTime}</b></p>
                        <p className="font-mono text-[11px]">
                          GPS: {currentRunnerPoint.lat}, {currentRunnerPoint.lng}
                        </p>
                      </div>
                    </div>
                  </Popup>
                </Marker>
              )}
            </>
          )}
        </MapContainer>

        {/* Sol Alt: Harita Açıklama / Legend */}
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
            {playbackMode ? (
              <div className="flex items-center gap-2">
                <span className="w-3.5 h-1 bg-red-500 border border-white border-dashed" />
                <span className="text-red-400 font-bold">Kırmızı Kesik Çizgi: Personel Rota Yolu</span>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-blue-500 border border-white" />
                  <span>Mavi Nokta: Şantiye Şefi / Mühendis</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-emerald-500 border border-white" />
                  <span>Yeşil Nokta: Aktif Personel & Taşeron</span>
                </div>
              </>
            )}
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-amber-400" />
              <span>Katman: {activeLayer === "DRONE" ? "FPV Drone Ortofoto" : activeLayer === "SATELLITE" ? "Uydu" : "Standart"}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ================================================================== */}
      {/* ADIM 2: HARİTANIN ALTINDAKİ ZAMAN ÇİZELGESİ (TIMELINE SLIDER)       */}
      {/* ================================================================== */}
      <div className="bg-slate-900/95 border-t border-slate-800 px-6 py-4 z-20">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
          {/* Dropdown Filtreleri: Tarih & Personel Seçimi */}
          <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
            {/* Tarih Seçimi */}
            <div className="flex items-center bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5">
              <Calendar className="w-4 h-4 text-blue-400 mr-2" />
              <input
                type="date"
                value={selectedPlaybackDate}
                onChange={(e) => setSelectedPlaybackDate(e.target.value)}
                className="bg-transparent text-white text-xs font-semibold focus:outline-none cursor-pointer"
              />
            </div>

            {/* Personel Seçimi Dropdown */}
            <div className="flex items-center bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 flex-1 sm:flex-initial">
              <UserCheck className="w-4 h-4 text-emerald-400 mr-2" />
              <select
                value={selectedPlaybackUserId}
                onChange={(e) => setSelectedPlaybackUserId(e.target.value)}
                className="bg-transparent text-white text-xs font-semibold focus:outline-none cursor-pointer max-w-[200px]"
              >
                {allPersonnelList.map((user) => (
                  <option key={user.id} value={user.id} className="bg-slate-900 text-white">
                    {user.name} ({user.role})
                  </option>
                ))}
              </select>
            </div>

            {/* Rota Yükle Butonu */}
            <button
              onClick={handleLoadRoute}
              disabled={isLoadingRoute}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-black flex items-center gap-1.5 shadow-md transition cursor-pointer"
            >
              <Eye className="w-4 h-4" />
              {isLoadingRoute ? "Yükleniyor..." : "Rotayı Getir"}
            </button>
          </div>

          {/* Video Oynatıcı Kontrolleri (Play / Pause / Slider / Speed) */}
          {routePoints.length > 0 && (
            <div className="flex-1 w-full lg:w-auto flex flex-col md:flex-row items-center gap-4">
              {/* Oynat / Duraklat Butonu */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsPlaying(!isPlaying)}
                  className={`w-10 h-10 rounded-full flex items-center justify-center shadow-lg transition cursor-pointer ${
                    isPlaying
                      ? "bg-amber-500 hover:bg-amber-600 text-slate-950"
                      : "bg-emerald-500 hover:bg-emerald-600 text-slate-950"
                  }`}
                  title={isPlaying ? "Duraklat" : "Oynat"}
                >
                  {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 ml-0.5 fill-current" />}
                </button>

                <button
                  onClick={() => {
                    setIsPlaying(false);
                    setCurrentStepIndex(0);
                  }}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300"
                  title="Başa Sar"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>

                {/* Hız Seçici: 1x, 2x, 5x */}
                <div className="flex bg-slate-950 p-0.5 rounded-lg border border-slate-800">
                  {([1, 2, 5] as const).map((spd) => (
                    <button
                      key={spd}
                      onClick={() => setPlaybackSpeed(spd)}
                      className={`px-2 py-1 rounded text-[11px] font-black ${
                        playbackSpeed === spd
                          ? "bg-blue-600 text-white"
                          : "text-slate-400 hover:text-white"
                      }`}
                    >
                      {spd}x
                    </button>
                  ))}
                </div>
              </div>

              {/* TIMELINE SLIDER (ZAMAN ÇUBUĞU) */}
              <div className="flex-1 flex items-center gap-3 w-full">
                <span className="text-[11px] font-mono text-slate-400 font-bold min-w-[55px]">
                  {currentRunnerPoint?.formattedTime || routePoints[0]?.formattedTime}
                </span>

                <input
                  type="range"
                  min={0}
                  max={routePoints.length - 1}
                  value={currentStepIndex}
                  onChange={(e) => {
                    setIsPlaying(false);
                    setCurrentStepIndex(parseInt(e.target.value, 10));
                  }}
                  className="flex-1 h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-red-500"
                />

                <span className="text-[11px] font-mono text-slate-400 font-bold min-w-[55px] text-right">
                  {routePoints[routePoints.length - 1]?.formattedTime}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
