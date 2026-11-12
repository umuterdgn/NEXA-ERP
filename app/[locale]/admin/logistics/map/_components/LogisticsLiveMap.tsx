"use client";

/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Lojistik ve Sevkiyat Canlı Filo Takip Haritası (Leaflet Client Component)
 * - Çıkış Noktası (Merkez Depo / Tedarikçi) -> Şantiye Rota Çizgisi (Polyline)
 * - Mobil Arka Plan GPS Verisi ile Canlı ETA ve Kalan Mesafe Bilgi Kartı (HUD)
 * - Geofence Tespiti: Şantiyeye 350m mesafe içine girildiğinde "Şantiyede / Kapıda" Yeşil Rozeti
 */

import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
  useMap,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import {
  Truck,
  Navigation,
  Phone,
  Clock,
  MapPin,
  ExternalLink,
  ShieldCheck,
  RefreshCw,
  Search,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  Layers,
  Crosshair,
  Building2,
  Factory,
} from "lucide-react";

// Varsayılan Leaflet icon hatasını önle
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

export interface ShipmentLiveItem {
  id: string;
  trackingCode: string;
  vehiclePlate: string;
  driverName?: string | null;
  driverPhone: string;
  status: string; // PREPARING, ON_THE_WAY, ARRIVED, DELIVERED, KAPIDA, ŞANTİYEDE
  latitude: number | null;
  longitude: number | null;
  speed?: number | null;
  heading?: number | null;
  updatedAt: string;
  materialName: string;
  quantity: number;
  unit: string;
  originName?: string | null;
  originLat?: number | null;
  originLng?: number | null;
  project?: {
    id: string;
    name?: string | null;
    city?: string | null;
    district?: string | null;
    location?: string | null;
    latitude?: number | null;
    longitude?: number | null;
  } | null;
  isLive: boolean;
}

interface LogisticsLiveMapProps {
  initialShipments: ShipmentLiveItem[];
}

// İki koordinat arası Haversine mesafe hesabı (km cinsinden)
export function calculateHaversineDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Özel Araç Tır İkonu Oluşturucu (HTML DivIcon)
function createTruckIcon(
  plate: string,
  status: string,
  speed?: number | null,
  isAtSite?: boolean
) {
  const isMoving = !isAtSite && status === "ON_THE_WAY";
  const color = isAtSite ? "#10b981" : isMoving ? "#38bdf8" : "#f59e0b";
  const pulseHtml = isAtSite
    ? `<span style="position:absolute; width:100%; height:100%; border-radius:50%; background:#10b981; opacity:0.6; animation:ping 1s cubic-bezier(0,0,0.2,1) infinite;"></span>`
    : isMoving
    ? `<span style="position:absolute; width:100%; height:100%; border-radius:50%; background:${color}; opacity:0.4; animation:ping 1.5s cubic-bezier(0,0,0.2,1) infinite;"></span>`
    : "";

  const badgeText = isAtSite ? "🟢 KAPIDA" : `${plate} ${speed ? `(${speed} km/s)` : ""}`;

  return L.divIcon({
    className: "nexa-live-truck-marker",
    html: `
      <div style="display:flex; flex-direction:column; align-items:center; transform: translate(-50%, -100%);">
        <div style="background:#020617; border:1px solid ${color}; color:#f8fafc; font-size:10px; font-weight:700; font-family:monospace; padding:2px 7px; border-radius:6px; white-space:nowrap; box-shadow:0 4px 14px rgba(0,0,0,0.8); display:flex; align-items:center; gap:4px;">
          <span style="display:inline-block; width:6px; height:6px; border-radius:50%; background:${color};"></span>
          ${badgeText}
        </div>
        <div style="width:38px; height:38px; border-radius:50%; background:#0f172a; border:2px solid ${color}; display:flex; align-items:center; justify-content:center; box-shadow:0 0 18px ${color}99; margin-top:3px; position:relative;">
          ${pulseHtml}
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="position:relative; z-index:2;">
            <path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/>
            <path d="M15 18H9"/>
            <path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.62l-3.48-4.35A1 1 0 0 0 17.52 8H14"/>
            <circle cx="17" cy="18" r="2"/>
            <circle cx="7" cy="18" r="2"/>
          </svg>
        </div>
        <div style="width:0; height:0; border-left:6px solid transparent; border-right:6px solid transparent; border-top:7px solid ${color}; margin-top:-1px;"></div>
      </div>
    `,
    iconSize: [38, 64],
    iconAnchor: [19, 64],
  });
}

// Çıkış Noktası (Merkez Depo / Tedarikçi Fabrikası) İkonu
function createOriginIcon(name?: string | null) {
  const isDepot = (name || "").toLowerCase().includes("depo");
  const label = name || (isDepot ? "Merkez Depo" : "Tedarikçi Çıkış");
  const color = isDepot ? "#a855f7" : "#f59e0b"; // purple for depot, amber for supplier

  return L.divIcon({
    className: "nexa-origin-marker",
    html: `
      <div style="display:flex; flex-direction:column; align-items:center; transform: translate(-50%, -100%);">
        <div style="background:#090d16; border:1px solid ${color}; color:${color}; font-size:10px; font-weight:bold; padding:2px 7px; border-radius:6px; white-space:nowrap; box-shadow:0 4px 12px rgba(0,0,0,0.8);">
          ${isDepot ? "🏢" : "🏬"} ${label}
        </div>
        <div style="width:30px; height:30px; border-radius:50%; background:#1e1b4b; border:2px solid ${color}; display:flex; align-items:center; justify-content:center; box-shadow:0 0 14px ${color}88; margin-top:2px;">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M3 21h18"/>
            <path d="M19 21v-4"/>
            <path d="M19 17a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v4"/>
            <path d="M14 8h-4"/>
            <path d="M12 3v5"/>
          </svg>
        </div>
        <div style="width:0; height:0; border-left:5px solid transparent; border-right:5px solid transparent; border-top:6px solid ${color};"></div>
      </div>
    `,
    iconSize: [30, 52],
    iconAnchor: [15, 52],
  });
}

// Şantiye Hedef Noktası İkonu
function createProjectDestinationIcon(name?: string | null) {
  const displayName = name || "Şantiye";
  return L.divIcon({
    className: "nexa-site-destination-marker",
    html: `
      <div style="display:flex; flex-direction:column; align-items:center; transform: translate(-50%, -100%);">
        <div style="background:#0f172a; border:1px solid #38bdf8; color:#38bdf8; font-size:10px; font-weight:bold; padding:2px 6px; border-radius:6px; white-space:nowrap; box-shadow:0 4px 12px rgba(0,0,0,0.6);">
          🏗️ ${displayName}
        </div>
        <div style="width:30px; height:30px; border-radius:50%; background:#0369a1; border:2px solid #38bdf8; display:flex; align-items:center; justify-content:center; box-shadow:0 0 12px #38bdf888; margin-top:2px;">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
            <circle cx="12" cy="10" r="3"/>
          </svg>
        </div>
        <div style="width:0; height:0; border-left:5px solid transparent; border-right:5px solid transparent; border-top:6px solid #38bdf8;"></div>
      </div>
    `,
    iconSize: [30, 52],
    iconAnchor: [15, 52],
  });
}

// OSRM Gerçek Yol Koordinatları (Road Snapping) Polyline Bileşeni
function OsrmRoadPolyline({
  start,
  end,
  status,
}: {
  start: [number, number]; // [lat, lng]
  end: [number, number];   // [lat, lng]
  status: string;
}) {
  const [positions, setPositions] = useState<[number, number][]>([start, end]);

  useEffect(() => {
    let isCancelled = false;
    const fetchRoadRoute = async () => {
      try {
        const [startLat, startLng] = start;
        const [endLat, endLng] = end;

        const url = `https://router.project-osrm.org/route/v1/driving/${startLng},${startLat};${endLng},${endLat}?overview=full&geometries=geojson`;
        const res = await fetch(url);
        if (!res.ok) throw new Error("OSRM routing request failed");

        const data = await res.json();
        if (
          data.code === "Ok" &&
          data.routes?.[0]?.geometry?.coordinates?.length > 0
        ) {
          const roadPositions: [number, number][] =
            data.routes[0].geometry.coordinates.map(
              ([lng, lat]: [number, number]) => [lat, lng]
            );
          if (!isCancelled) {
            setPositions(roadPositions);
          }
        }
      } catch (err) {
        if (!isCancelled) {
          setPositions([start, end]);
        }
      }
    };

    fetchRoadRoute();
    return () => {
      isCancelled = true;
    };
  }, [start[0], start[1], end[0], end[1]]);

  return (
    <Polyline
      positions={positions}
      pathOptions={{
        color: status === "ARRIVED" ? "#10b981" : "#38bdf8",
        weight: 3.5,
        dashArray: "6, 8",
        opacity: 0.85,
      }}
    />
  );
}

// Haritayı Seçilen Araca veya Tüm Noktalara Odaklayan Kontrolcü
function MapViewController({
  selectedCoords,
  allPoints,
}: {
  selectedCoords: [number, number] | null;
  allPoints: [number, number][];
}) {
  const map = useMap();

  useEffect(() => {
    if (selectedCoords) {
      map.flyTo(selectedCoords, 14, { duration: 1.5 });
    } else if (allPoints.length > 0) {
      const bounds = L.latLngBounds(allPoints);
      map.fitBounds(bounds, { padding: [60, 60], maxZoom: 14 });
    }
    return () => {
      try {
        map.stop();
      } catch {}
    };
  }, [selectedCoords, allPoints, map]);

  useEffect(() => {
    return () => {
      try {
        map.stop();
        map.off();
        map.remove();
      } catch {}
    };
  }, [map]);

  return null;
}

export default function LogisticsLiveMap({ initialShipments }: LogisticsLiveMapProps) {
  const [shipments, setShipments] = useState<ShipmentLiveItem[]>(initialShipments);
  const [selectedId, setSelectedId] = useState<string | null>(
    initialShipments.length > 0 ? initialShipments[0].id : null
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "ON_THE_WAY" | "ARRIVED">("ALL");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [tileMode, setTileMode] = useState<"dark" | "osm">("dark");

  // Canlı 5 Saniyede Bir Polling (Aktif Filo API'sinden Koordinatları Çek)
  const fetchLiveShipments = async () => {
    try {
      setIsRefreshing(true);
      const res = await fetch("/api/logistics/active");
      if (!res.ok) return;
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        setShipments(data);
      }
    } catch (err) {
      console.warn("Canlı filo güncellenirken hata:", err);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    const timer = setInterval(fetchLiveShipments, 5000);
    return () => clearInterval(timer);
  }, []);

  // Haritadaki Geçerli Konum Noktaları
  const validShipmentPoints = useMemo<[number, number][]>(() => {
    return shipments
      .filter((s) => s.latitude !== null && s.longitude !== null)
      .map((s) => [s.latitude!, s.longitude!]);
  }, [shipments]);

  // Seçili veya İlk Sevkiyat
  const selectedShipment = shipments.find((s) => s.id === selectedId) || shipments[0] || null;

  const selectedCoords: [number, number] | null =
    selectedShipment?.latitude && selectedShipment?.longitude
      ? [selectedShipment.latitude, selectedShipment.longitude]
      : null;

  // Seçili Araç için Canlı Telemetri ve ETA Hesaplaması (ADIM 3)
  const activeTelemetry = useMemo(() => {
    if (!selectedShipment) return null;

    const destLat = selectedShipment.project?.latitude || 41.1105;
    const destLng = selectedShipment.project?.longitude || 29.0205;
    const origLat = selectedShipment.originLat || 40.8986;
    const origLng = selectedShipment.originLng || 29.3597;
    const currentLat = selectedShipment.latitude ?? 40.9500;
    const currentLng = selectedShipment.longitude ?? 29.1500;

    // Kalan Mesafe
    const distanceKm = calculateHaversineDistanceKm(currentLat, currentLng, destLat, destLng);

    // Geofence Eşiği: 350m içine girdiğinde "Şantiyede / Kapıda" kabul edilir
    const isAtSite = distanceKm <= 0.35 || selectedShipment.status === "ARRIVED" || selectedShipment.status === "KAPIDA";

    // Tahmini Varış Süresi (ETA): Hız varsa hız üzerinden, yoksa ağır vasıta ortalama 48 km/s
    const speed = selectedShipment.speed && selectedShipment.speed > 10 ? selectedShipment.speed : 52;
    const etaMinutes = isAtSite ? 0 : Math.max(1, Math.round((distanceKm / speed) * 60));
    const arrivalTime = new Date(Date.now() + etaMinutes * 60000).toLocaleTimeString("tr-TR", {
      hour: "2-digit",
      minute: "2-digit",
    });

    return {
      shipment: selectedShipment,
      originName: selectedShipment.originName || "Tuzla Merkez Lojistik Deposu",
      destinationName: selectedShipment.project?.name || "Maslak Rezidans Şantiyesi",
      distanceKm,
      isAtSite,
      etaMinutes,
      arrivalTime,
      speed,
      originCoords: [origLat, origLng] as [number, number],
      currentCoords: [currentLat, currentLng] as [number, number],
      destCoords: [destLat, destLng] as [number, number],
    };
  }, [selectedShipment]);

  // Filtreleme
  const filteredShipments = useMemo(() => {
    return shipments.filter((s) => {
      const matchesSearch =
        s.vehiclePlate.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.materialName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.trackingCode.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus =
        statusFilter === "ALL" ? true : s.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [shipments, searchTerm, statusFilter]);

  // İstatistikler
  const activeCount = shipments.filter((s) => s.status === "ON_THE_WAY").length;
  const arrivedCount = shipments.filter(
    (s) => s.status === "ARRIVED" || s.status === "KAPIDA"
  ).length;
  const preparingCount = shipments.filter((s) => s.status === "PREPARING").length;

  const handleCopyTrackLink = (trackingCode: string) => {
    const fullUrl = `${window.location.origin}/track/${trackingCode}`;
    navigator.clipboard.writeText(fullUrl);
    setCopiedCode(trackingCode);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const defaultCenter: [number, number] = [41.0082, 28.9784];

  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-5rem)] bg-slate-950 text-slate-100 overflow-hidden relative">
      {/* 1. Sol / Yan Filo Kontrol Paneli */}
      <div className="w-full lg:w-96 flex flex-col bg-slate-900 border-r border-slate-800 z-10 shrink-0 shadow-2xl">
        {/* Panel Başlığı ve Hızlı İstatistikler */}
        <div className="p-4 border-b border-slate-800 bg-slate-950/40">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400">
                <Truck className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-white tracking-tight">Canlı Lojistik Filosu</h2>
                <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Gerçek Zamanlı GPS & ETA</span>
                </div>
              </div>
            </div>

            <button
              onClick={fetchLiveShipments}
              disabled={isRefreshing}
              title="Manuel Yenile"
              className="p-2 text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-700 rounded-xl transition-all"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin text-blue-400" : ""}`} />
            </button>
          </div>

          {/* İstatistik Sayaçları */}
          <div className="grid grid-cols-3 gap-2 mt-3 text-center">
            <div className="bg-emerald-950/30 border border-emerald-500/20 rounded-xl p-2">
              <span className="text-[10px] text-emerald-400 font-bold block">YOLDA</span>
              <span className="text-base font-black text-white">{activeCount}</span>
            </div>
            <div className="bg-emerald-950/40 border border-emerald-400/30 rounded-xl p-2">
              <span className="text-[10px] text-emerald-300 font-bold block">ŞANTİYEDE</span>
              <span className="text-base font-black text-white">{arrivedCount}</span>
            </div>
            <div className="bg-slate-800/40 border border-slate-700/30 rounded-xl p-2">
              <span className="text-[10px] text-slate-400 font-bold block">HAZIRLIK</span>
              <span className="text-base font-black text-white">{preparingCount}</span>
            </div>
          </div>

          {/* Arama ve Filtre Butonları */}
          <div className="mt-3 flex flex-col gap-2">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Plaka, malzeme, kod ara..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="flex gap-1.5">
              {(["ALL", "ON_THE_WAY", "ARRIVED"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setStatusFilter(tab)}
                  className={`flex-1 py-1 text-[11px] font-bold rounded-lg transition-all ${
                    statusFilter === tab
                      ? "bg-blue-600 text-white"
                      : "bg-slate-800/60 text-slate-400 hover:text-white"
                  }`}
                >
                  {tab === "ALL" ? "Tümü" : tab === "ON_THE_WAY" ? "Yoldakiler" : "Şantiyedekiler"}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Araç Kartları Listesi */}
        <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2.5">
          {filteredShipments.length === 0 ? (
            <div className="text-center py-12 text-slate-500 text-xs">
              Kriterlere uygun sevkiyat bulunamadı.
            </div>
          ) : (
            filteredShipments.map((s) => {
              const isSelected = s.id === selectedId;
              const hasCoords = s.latitude !== null && s.longitude !== null;

              // Canlı Geofence Kontrolü
              const destLat = s.project?.latitude || 41.1105;
              const destLng = s.project?.longitude || 29.0205;
              const curLat = s.latitude ?? 40.9500;
              const curLng = s.longitude ?? 29.1500;
              const dist = calculateHaversineDistanceKm(curLat, curLng, destLat, destLng);
              const atSite = dist <= 0.35 || s.status === "ARRIVED" || s.status === "KAPIDA";

              return (
                <div
                  key={s.id}
                  onClick={() => setSelectedId(s.id)}
                  className={`p-3 rounded-2xl border transition-all cursor-pointer flex flex-col gap-2 ${
                    isSelected
                      ? "bg-slate-800/90 border-blue-500 shadow-lg shadow-blue-500/10"
                      : "bg-slate-950/60 hover:bg-slate-800/50 border-slate-800/80"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-sm text-white bg-slate-900 px-2 py-0.5 rounded-lg border border-slate-800">
                        {s.vehiclePlate}
                      </span>
                      {s.speed !== null && s.speed !== undefined && (
                        <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-500/20 px-1.5 py-0.5 rounded">
                          {s.speed} km/s
                        </span>
                      )}
                    </div>

                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        atSite
                          ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40 animate-pulse"
                          : "bg-blue-500/20 text-blue-300 border-blue-500/30"
                      }`}
                    >
                      {atSite ? "🟢 ŞANTİYEDE" : "YOLDA"}
                    </span>
                  </div>

                  <div className="text-xs text-slate-300 flex items-center justify-between">
                    <span className="font-medium truncate max-w-[180px]">{s.materialName}</span>
                    <span className="text-slate-400 text-[11px]">
                      {s.quantity} {s.unit}
                    </span>
                  </div>

                  {/* Çıkış -> Varış Güzergahı */}
                  <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
                    <Building2 className="w-3 h-3 text-purple-400 shrink-0" />
                    <span className="truncate">{s.originName || "Merkez Depo"}</span>
                    <span>→</span>
                    <span className="truncate text-slate-300">{s.project?.name || "Şantiye"}</span>
                  </div>

                  <div className="text-[11px] text-slate-400 flex items-center justify-between pt-1 border-t border-slate-800/60">
                    <div className="flex items-center gap-1 text-slate-400">
                      <Clock className="w-3 h-3 text-slate-500" />
                      <span>{new Date(s.updatedAt).toLocaleTimeString("tr-TR")}</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {s.driverPhone && (
                        <a
                          href={`tel:${s.driverPhone}`}
                          onClick={(e) => e.stopPropagation()}
                          title="Şoförü Ara"
                          className="p-1 text-slate-400 hover:text-emerald-400 bg-slate-900 hover:bg-slate-800 rounded transition-colors"
                        >
                          <Phone className="w-3 h-3" />
                        </a>
                      )}

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCopyTrackLink(s.trackingCode);
                        }}
                        title="Şoför SMS Takip Linkini Kopyala"
                        className="p-1 text-slate-400 hover:text-blue-400 bg-slate-900 hover:bg-slate-800 rounded transition-colors flex items-center gap-1 text-[10px]"
                      >
                        {copiedCode === s.trackingCode ? (
                          <Check className="w-3 h-3 text-emerald-400" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </button>

                      <a
                        href={`/track/${s.trackingCode}`}
                        target="_blank"
                        rel="noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        title="Şoför Ekranını Yeni Sekmede Aç"
                        className="p-1 text-slate-400 hover:text-white bg-slate-900 hover:bg-slate-800 rounded transition-colors"
                      >
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>

                  {!hasCoords && (
                    <div className="text-[10px] text-amber-400/80 bg-amber-500/10 px-2 py-1 rounded-lg border border-amber-500/20 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3 shrink-0" />
                      <span>Şoför henüz konum paylaşımını başlatmadı.</span>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* 2. Sağ / Harita Alanı */}
      <div className="flex-1 relative h-full z-0 isolate">
        {/* Harita Katman Değiştirme Butonu */}
        <div className="absolute top-4 right-4 z-[400] flex items-center gap-1.5 bg-slate-900/90 backdrop-blur-md p-1.5 rounded-xl border border-slate-800 shadow-xl">
          <button
            onClick={() => setTileMode("dark")}
            className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
              tileMode === "dark"
                ? "bg-blue-600 text-white"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Karanlık Mod
          </button>
          <button
            onClick={() => setTileMode("osm")}
            className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
              tileMode === "osm"
                ? "bg-blue-600 text-white"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Uydu / Sokak
          </button>
        </div>

        {/* Canlı ETA & Telemetri HUD Bilgi Kartı (ADIM 3) */}
        {activeTelemetry && (
          <div className="absolute top-4 left-4 z-[400] w-80 md:w-96 bg-slate-900/90 backdrop-blur-xl border border-slate-700/80 rounded-2xl p-4 shadow-2xl text-slate-100 animate-in fade-in slide-in-from-top-2 duration-300">
            {/* Üst Başlık & Geofence Rozeti */}
            <div className="flex items-start justify-between gap-2 border-b border-slate-800 pb-3 mb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-black text-sm text-white px-2 py-0.5 rounded-lg bg-slate-950 border border-slate-800">
                    {activeTelemetry.shipment.vehiclePlate}
                  </span>
                  {activeTelemetry.shipment.driverName && (
                    <span className="text-xs text-slate-300 font-medium">
                      {activeTelemetry.shipment.driverName}
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5 truncate max-w-[220px]">
                  {activeTelemetry.shipment.materialName} ({activeTelemetry.shipment.quantity} {activeTelemetry.shipment.unit})
                </p>
              </div>

              {/* Geofence Durum Rozeti (< 350m -> Şantiyede / Kapıda) */}
              {activeTelemetry.isAtSite ? (
                <span className="shrink-0 px-2.5 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/50 text-emerald-400 font-bold text-[11px] flex items-center gap-1.5 animate-pulse shadow-lg shadow-emerald-950">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  Şantiyede / Kapıda
                </span>
              ) : (
                <span className="shrink-0 px-2.5 py-1 rounded-full bg-blue-500/20 border border-blue-500/40 text-blue-400 font-bold text-[11px] flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-blue-400 animate-ping" />
                  Yolda
                </span>
              )}
            </div>

            {/* Çıkış Noktası -> Hedef Proje Rota Hattı */}
            <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800/80 mb-3 space-y-1.5 text-xs">
              <div className="flex items-center gap-2 text-purple-300">
                <span className="w-4 h-4 rounded-full bg-purple-500/20 border border-purple-500 flex items-center justify-center text-[10px]">A</span>
                <span className="text-slate-400 text-[11px]">Kalkış:</span>
                <strong className="truncate font-semibold text-slate-200">
                  {activeTelemetry.originName}
                </strong>
              </div>
              <div className="flex items-center gap-2 text-cyan-300">
                <span className="w-4 h-4 rounded-full bg-cyan-500/20 border border-cyan-500 flex items-center justify-center text-[10px]">B</span>
                <span className="text-slate-400 text-[11px]">Varış:</span>
                <strong className="truncate font-semibold text-slate-200">
                  {activeTelemetry.destinationName}
                </strong>
              </div>
            </div>

            {/* Metrik Göstergeleri: Mesafe, ETA, Hız */}
            <div className="grid grid-cols-3 gap-2 text-center mb-3">
              <div className="p-2 rounded-xl bg-slate-950/60 border border-slate-800">
                <span className="text-[10px] text-slate-400 block font-medium">Kalan Mesafe</span>
                <span className="text-sm font-black font-mono text-cyan-400">
                  {activeTelemetry.distanceKm < 1
                    ? `${Math.round(activeTelemetry.distanceKm * 1000)} m`
                    : `${activeTelemetry.distanceKm.toFixed(1)} km`}
                </span>
              </div>
              <div className="p-2 rounded-xl bg-slate-950/60 border border-slate-800">
                <span className="text-[10px] text-slate-400 block font-medium">Tahmini Varış (ETA)</span>
                <span className="text-sm font-black font-mono text-amber-400">
                  {activeTelemetry.isAtSite ? "0 dk" : `~${activeTelemetry.etaMinutes} dk`}
                </span>
                {!activeTelemetry.isAtSite && (
                  <span className="text-[9px] text-slate-400 block">
                    Saat {activeTelemetry.arrivalTime}
                  </span>
                )}
              </div>
              <div className="p-2 rounded-xl bg-slate-950/60 border border-slate-800">
                <span className="text-[10px] text-slate-400 block font-medium">Anlık Hız</span>
                <span className="text-sm font-black font-mono text-emerald-400">
                  {activeTelemetry.speed} km/s
                </span>
              </div>
            </div>

            {/* Aksiyon Butonları */}
            <div className="flex items-center gap-2 pt-1 border-t border-slate-800/80">
              {activeTelemetry.shipment.driverPhone && (
                <a
                  href={`tel:${activeTelemetry.shipment.driverPhone}`}
                  className="flex-1 py-1.5 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md shadow-emerald-950"
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span>Şoförü Ara</span>
                </a>
              )}
              <button
                type="button"
                onClick={() => handleCopyTrackLink(activeTelemetry.shipment.trackingCode)}
                className="py-1.5 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs flex items-center justify-center gap-1.5 transition-all border border-slate-700"
              >
                {copiedCode === activeTelemetry.shipment.trackingCode ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Kopyalandı</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Takip Linki</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Leaflet Haritası */}
        <MapContainer
          center={validShipmentPoints[0] || defaultCenter}
          zoom={validShipmentPoints.length > 0 ? 11 : 7}
          maxZoom={16}
          scrollWheelZoom={true}
          className="h-full w-full"
          style={{ background: "#020617" }}
        >
          {tileMode === "dark" ? (
            <TileLayer
              url="https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}"
              attribution='&copy; <a href="https://www.esri.com/">Esri</a>, DeLorme, HERE, MapmyIndia'
              maxZoom={16}
            />
          ) : (
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              maxZoom={19}
            />
          )}

          {/* Otomatik Harita Görünüm Kontrolcüsü */}
          <MapViewController
            selectedCoords={selectedCoords}
            allPoints={validShipmentPoints}
          />

          {/* Haritadaki Araçlar, Çıkış Noktaları, Rotalar ve Hedef Şantiyeler */}
          {shipments.map((s) => {
            const destLat = s.project?.latitude || 41.1105;
            const destLng = s.project?.longitude || 29.0205;
            const origLat = s.originLat || 40.8986;
            const origLng = s.originLng || 29.3597;
            const vehLat = s.latitude ?? 40.9500;
            const vehLng = s.longitude ?? 29.1500;

            // Geofence kontrolü
            const dist = calculateHaversineDistanceKm(vehLat, vehLng, destLat, destLng);
            const isAtSite = dist <= 0.35 || s.status === "ARRIVED" || s.status === "KAPIDA";

            const truckIcon = createTruckIcon(s.vehiclePlate, s.status, s.speed, isAtSite);

            return (
              <React.Fragment key={s.id}>
                {/* 1. Çıkış Noktası (Merkez Depo / Tedarikçi) Marker'ı */}
                <Marker
                  position={[origLat, origLng]}
                  icon={createOriginIcon(s.originName)}
                >
                  <Popup className="nexa-leaflet-popup">
                    <div className="p-1 min-w-[180px] text-slate-900">
                      <div className="font-bold text-xs border-b pb-1 mb-1 text-purple-700">
                        Çıkış Noktası (Kalkış)
                      </div>
                      <div className="text-xs font-semibold">
                        {s.originName || "Merkez Lojistik Deposu"}
                      </div>
                    </div>
                  </Popup>
                </Marker>

                {/* 2. Rota Çizgisi: Çıkış Noktası -> Araç (Polyline) */}
                <Polyline
                  positions={[
                    [origLat, origLng],
                    [vehLat, vehLng],
                  ]}
                  pathOptions={{
                    color: "#a855f7",
                    weight: 3,
                    dashArray: "6, 8",
                    opacity: 0.65,
                  }}
                />

                {/* 3. Canlı Hareket Eden Araç Marker'ı */}
                <Marker
                  position={[vehLat, vehLng]}
                  icon={truckIcon}
                  eventHandlers={{
                    click: () => setSelectedId(s.id),
                  }}
                >
                  <Popup className="nexa-leaflet-popup">
                    <div className="p-1 min-w-[210px] text-slate-900">
                      <div className="font-bold text-sm flex items-center justify-between border-b pb-1 mb-1">
                        <span>{s.vehiclePlate}</span>
                        <span
                          className={`text-xs font-bold px-1.5 py-0.5 rounded ${
                            isAtSite
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-blue-100 text-blue-800"
                          }`}
                        >
                          {isAtSite ? "Şantiyede / Kapıda" : `${s.speed || 55} km/s`}
                        </span>
                      </div>
                      <div className="text-xs text-slate-600 mb-0.5">
                        <strong>Yük:</strong> {s.materialName} ({s.quantity} {s.unit})
                      </div>
                      <div className="text-xs text-slate-600 mb-0.5">
                        <strong>Kalkış:</strong> {s.originName || "Merkez Depo"}
                      </div>
                      <div className="text-xs text-slate-600 mb-0.5">
                        <strong>Hedef:</strong> {s.project?.name || "Şantiye Sahası"}
                      </div>
                      <div className="text-[11px] text-slate-500 mt-1 pt-1 border-t">
                        Kalan Mesafe: {dist < 1 ? `${Math.round(dist * 1000)} m` : `${dist.toFixed(1)} km`}
                      </div>
                    </div>
                  </Popup>
                </Marker>

                {/* 4. Rota Çizgisi: Araç -> Hedef Şantiye (Road Snapped Polyline) */}
                <OsrmRoadPolyline
                  start={[vehLat, vehLng]}
                  end={[destLat, destLng]}
                  status={isAtSite ? "ARRIVED" : "ON_THE_WAY"}
                />

                {/* 5. Hedef Şantiye Marker'ı */}
                <Marker
                  position={[destLat, destLng]}
                  icon={createProjectDestinationIcon(s.project?.name)}
                >
                  <Popup className="nexa-leaflet-popup">
                    <div className="p-1 min-w-[180px] text-slate-900">
                      <div className="font-bold text-xs border-b pb-1 mb-1 text-blue-700">
                        Hedef Şantiye Teslimat Noktası
                      </div>
                      <div className="text-xs font-semibold">
                        {s.project?.name || "Şantiye Sahası"}
                      </div>
                    </div>
                  </Popup>
                </Marker>
              </React.Fragment>
            );
          })}
        </MapContainer>
      </div>
    </div>
  );
}
