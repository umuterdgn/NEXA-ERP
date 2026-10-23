"use client";

/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Lojistik ve Sevkiyat Canlı Filo Takip Haritası (Leaflet Client Component)
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
  driverPhone: string;
  status: string; // PREPARING, ON_THE_WAY, ARRIVED, DELIVERED
  latitude: number | null;
  longitude: number | null;
  speed?: number | null;
  heading?: number | null;
  updatedAt: string;
  materialName: string;
  quantity: number;
  unit: string;
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

// Özel Araç Tır İkonu Oluşturucu (HTML DivIcon)
function createTruckIcon(plate: string, status: string, speed?: number | null) {
  const isMoving = status === "ON_THE_WAY";
  const color = isMoving ? "#10b981" : status === "ARRIVED" ? "#f59e0b" : "#6366f1";
  const pulseHtml = isMoving
    ? `<span style="position:absolute; width:100%; height:100%; border-radius:50%; background:${color}; opacity:0.4; animation:ping 1.5s cubic-bezier(0,0,0.2,1) infinite;"></span>`
    : "";

  return L.divIcon({
    className: "nexa-live-truck-marker",
    html: `
      <div style="display:flex; flex-direction:column; align-items:center; transform: translate(-50%, -100%);">
        <div style="background:#020617; border:1px solid ${color}; color:#f8fafc; font-size:10px; font-weight:700; font-family:monospace; padding:2px 6px; border-radius:6px; white-space:nowrap; box-shadow:0 4px 14px rgba(0,0,0,0.7); display:flex; align-items:center; gap:4px;">
          <span style="display:inline-block; width:6px; height:6px; border-radius:50%; background:${color};"></span>
          ${plate} ${speed ? `(${speed} km/s)` : ""}
        </div>
        <div style="width:36px; height:36px; border-radius:50%; background:#0f172a; border:2px solid ${color}; display:flex; align-items:center; justify-content:center; box-shadow:0 0 16px ${color}88; margin-top:3px; position:relative;">
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
    iconSize: [36, 62],
    iconAnchor: [18, 62],
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

// Haritayı Seçilen Araca veya Tüm Araçlara Odaklayan Kontrolcü
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
  }, [selectedCoords, allPoints, map]);

  return null;
}

export default function LogisticsLiveMap({ initialShipments }: LogisticsLiveMapProps) {
  const [shipments, setShipments] = useState<ShipmentLiveItem[]>(initialShipments);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "ON_THE_WAY" | "ARRIVED">("ALL");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [tileMode, setTileMode] = useState<"dark" | "osm">("dark");

  // 1. Canlı 5 Saniyede Bir Polling (Aktif Filo API'sinden Koordinatları Çek)
  const fetchLiveShipments = async () => {
    try {
      setIsRefreshing(true);
      const res = await fetch("/api/logistics/active");
      if (!res.ok) {
        return;
      }
      const data = await res.json();
      if (Array.isArray(data)) {
        setShipments(data);
      } else if (data && Array.isArray(data.shipments)) {
        setShipments(data.shipments);
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

  // Haritadaki Geçerli Konum Noktaları
  const validShipmentPoints = useMemo<[number, number][]>(() => {
    return shipments
      .filter((s) => s.latitude !== null && s.longitude !== null)
      .map((s) => [s.latitude!, s.longitude!]);
  }, [shipments]);

  // Seçili Sevkiyat
  const selectedShipment = shipments.find((s) => s.id === selectedId) || null;
  const selectedCoords: [number, number] | null =
    selectedShipment?.latitude && selectedShipment?.longitude
      ? [selectedShipment.latitude, selectedShipment.longitude]
      : null;

  // İstatistikler
  const activeCount = shipments.filter((s) => s.status === "ON_THE_WAY").length;
  const arrivedCount = shipments.filter((s) => s.status === "ARRIVED").length;
  const preparingCount = shipments.filter((s) => s.status === "PREPARING").length;

  const handleCopyTrackLink = (trackingCode: string) => {
    const fullUrl = `${window.location.origin}/track/${trackingCode}`;
    navigator.clipboard.writeText(fullUrl);
    setCopiedCode(trackingCode);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  // Harita Varsayılan Merkez: Türkiye / İstanbul / Ankara ekseni
  const defaultCenter: [number, number] = [39.92077, 32.85411]; // Ankara merkez

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
                  <span>Gerçek Zamanlı GPS Akışı</span>
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
            <div className="bg-amber-950/30 border border-amber-500/20 rounded-xl p-2">
              <span className="text-[10px] text-amber-400 font-bold block">KAPIDA</span>
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
                  {tab === "ALL" ? "Tümü" : tab === "ON_THE_WAY" ? "Yoldakiler" : "Kapıdakiler"}
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

              return (
                <div
                  key={s.id}
                  onClick={() => {
                    setSelectedId(s.id);
                  }}
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
                        s.status === "ON_THE_WAY"
                          ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                          : s.status === "ARRIVED"
                          ? "bg-amber-500/20 text-amber-300 border-amber-500/30"
                          : "bg-slate-700/40 text-slate-300 border-slate-600/30"
                      }`}
                    >
                      {s.status === "ON_THE_WAY"
                        ? "YOLDA"
                        : s.status === "ARRIVED"
                        ? "KAPIDA"
                        : "HAZIRLANIYOR"}
                    </span>
                  </div>

                  <div className="text-xs text-slate-300 flex items-center justify-between">
                    <span className="font-medium truncate max-w-[180px]">{s.materialName}</span>
                    <span className="text-slate-400 text-[11px]">
                      {s.quantity} {s.unit}
                    </span>
                  </div>

                  <div className="text-[11px] text-slate-400 flex items-center justify-between pt-1 border-t border-slate-800/60">
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-500" />
                      <span>{new Date(s.updatedAt).toLocaleTimeString("tr-TR")}</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {/* Şoförü Ara */}
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

                      {/* SMS Takip Linkini Kopyala */}
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

                      {/* Şoför Sayfasına Git */}
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
      <div className="flex-1 relative h-full">
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

        {/* Leaflet Haritası */}
        <MapContainer
          center={validShipmentPoints[0] || defaultCenter}
          zoom={validShipmentPoints.length > 0 ? 11 : 6}
          scrollWheelZoom={true}
          className="h-full w-full"
          style={{ background: "#020617" }}
        >
          {tileMode === "dark" ? (
            <TileLayer
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
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

          {/* Haritadaki Canlı Tır Marker'ları */}
          {shipments.map((s) => {
            if (s.latitude === null || s.longitude === null) return null;
            const truckIcon = createTruckIcon(s.vehiclePlate, s.status, s.speed);

            return (
              <React.Fragment key={s.id}>
                <Marker
                  position={[s.latitude, s.longitude]}
                  icon={truckIcon}
                  eventHandlers={{
                    click: () => setSelectedId(s.id),
                  }}
                >
                  <Popup className="nexa-leaflet-popup">
                    <div className="p-1 min-w-[200px] text-slate-900">
                      <div className="font-bold text-sm flex items-center justify-between border-b pb-1 mb-1">
                        <span>{s.vehiclePlate}</span>
                        <span className="text-xs text-emerald-600 font-mono">
                          {s.speed ? `${s.speed} km/s` : "Duran"}
                        </span>
                      </div>
                      <div className="text-xs text-slate-600 mb-1">
                        <strong>Yük:</strong> {s.materialName} ({s.quantity} {s.unit})
                      </div>
                      <div className="text-xs text-slate-600 mb-1">
                        <strong>Hedef:</strong> {s.project?.name || "Şantiye"}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        Son Güncelleme: {new Date(s.updatedAt).toLocaleTimeString("tr-TR")}
                      </div>
                    </div>
                  </Popup>
                </Marker>

                {/* Eğer Hedef Şantiye Konumu Varsa Rota Çizgisi ve Şantiye Marker'ı */}
                {s.project?.latitude && s.project?.longitude && (
                  <>
                    <Marker
                      position={[s.project.latitude, s.project.longitude]}
                      icon={createProjectDestinationIcon(s.project.name)}
                    />
                    <Polyline
                      positions={[
                        [s.latitude, s.longitude],
                        [s.project.latitude, s.project.longitude],
                      ]}
                      pathOptions={{
                        color: s.status === "ON_THE_WAY" ? "#10b981" : "#38bdf8",
                        weight: 3,
                        dashArray: "6, 8",
                        opacity: 0.6,
                      }}
                    />
                  </>
                )}
              </React.Fragment>
            );
          })}
        </MapContainer>
      </div>
    </div>
  );
}
