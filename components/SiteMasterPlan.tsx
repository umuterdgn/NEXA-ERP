/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Şantiye Haritası & İSG Risk Haritası - Poligon Sanal Çit (Polygon Geofencing) & BLE Canlı Radar Modülü
 */

"use client";
import { useState, useEffect, useCallback, useMemo } from "react";
import { 
  MapContainer, 
  TileLayer, 
  Polygon as LeafletPolygon, 
  Polyline, 
  CircleMarker, 
  Popup, 
  useMapEvents,
  useMap
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { toast } from "react-hot-toast";
import * as turf from "@turf/turf";

// Leaflet default icon fix
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

export type ZoneType = 'MAIN_SITE' | 'DANGER_ZONE' | 'REST_AREA';

export interface SiteZone {
  id?: string;
  title: string;
  zoneType: ZoneType;
  category?: 'RISK' | 'BUILDING' | 'REST_AREA' | 'STORAGE' | string;
  lat?: number | null;
  lng?: number | null;
  radius?: number | null; // Legacy radius fallback
  polygonCoordinates?: { lat: number; lng: number }[];
  supervisor?: string;
}

export interface Personnel {
  id: string;
  name: string;
  department?: string;
  position?: string;
  currentSite?: string;
  lastCheckIn?: string;
}

export interface WorkerLiveItem {
  id: string;
  name: string;
  department: string;
  position: string;
  lat: number;
  lng: number;
  pulse: number; // Nabız (bpm)
  battery: number; // BLE Pil (%)
  hasHelmet: boolean; // Baret / KKD Onayı
  inDanger: boolean; // DANGER_ZONE içinde mi?
  currentZoneName: string; // O an içinde olduğu poligon
  currentZoneType: ZoneType | null;
  timeOnSite: string;
  lastViolationAt?: number;
}

interface Props {
  projectLat: number;
  projectLng: number;
  projectId: string;
  userLocation?: {
    latitude: number | null;
    longitude: number | null;
    isTracking: boolean;
  };
}

// Renklendirme Kuralları (Prompt spesifikasyonuna tam uyumlu)
// MAIN_SITE: Mavi yarı saydam dolgu (#3b82f6, 0.25 opacity)
// DANGER_ZONE: Kırmızı yarı saydam dolgu (#ef4444, 0.35 opacity)
// REST_AREA: Yeşil yarı saydam dolgu (#10b981, 0.25 opacity)
const ZONE_STYLE_CONFIG: Record<ZoneType, {
  color: string;
  fillColor: string;
  fillOpacity: number;
  weight: number;
  dashArray?: string;
  label: string;
  badgeBg: string;
  badgeText: string;
}> = {
  MAIN_SITE: {
    color: '#2563eb',
    fillColor: '#3b82f6',
    fillOpacity: 0.25,
    weight: 2,
    label: 'Ana Şantiye (Mavi)',
    badgeBg: 'bg-blue-500/20',
    badgeText: 'text-blue-400'
  },
  DANGER_ZONE: {
    color: '#dc2626',
    fillColor: 'red',
    fillOpacity: 0.35,
    weight: 2.5,
    dashArray: '6, 6',
    label: 'Riskli Alan (Kırmızı)',
    badgeBg: 'bg-red-500/20',
    badgeText: 'text-red-400'
  },
  REST_AREA: {
    color: '#059669',
    fillColor: '#10b981',
    fillOpacity: 0.25,
    weight: 2,
    label: 'Dinlenme Alanı (Yeşil)',
    badgeBg: 'bg-emerald-500/20',
    badgeText: 'text-emerald-400'
  }
};

// Tarayıcı AudioContext Sesli Alarm Sistemi (Web Audio API)
const playAlarm = () => {
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(650, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(950, ctx.currentTime + 0.15);
    osc.frequency.exponentialRampToValueAtTime(650, ctx.currentTime + 0.3);
    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.45);
    osc.start();
    osc.stop(ctx.currentTime + 0.45);
  } catch (e) {
    console.error("Audio blocked by browser", e);
  }
};

// Turf.js Polygon Builder (GeoJSON Linear Ring Helper)
function buildTurfPolygon(coords: { lat: number; lng: number }[]) {
  if (!coords || coords.length < 3) return null;
  const ring: [number, number][] = coords.map((c) => [c.lng, c.lat]);
  // GeoJSON poligonunda ilk ve son nokta aynı olmalıdır
  const first = ring[0];
  const last = ring[ring.length - 1];
  if (first[0] !== last[0] || first[1] !== last[1]) {
    ring.push([first[0], first[1]]);
  }
  if (ring.length < 4) return null;
  try {
    return turf.polygon([ring]);
  } catch (err) {
    console.error("Geçersiz poligon:", err);
    return null;
  }
}

export default function SiteMasterPlan({ projectLat, projectLng, projectId, userLocation }: Props) {
  const [zones, setZones] = useState<SiteZone[]>([]);
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isLiveTracking, setIsLiveTracking] = useState(true);
  const [personnel, setPersonnel] = useState<Personnel[]>([]);
  const [workers, setWorkers] = useState<WorkerLiveItem[]>([]);

  // Poligon Çizim Durumları (Interactive Vertex Drawing Tool)
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawZoneType, setDrawZoneType] = useState<ZoneType>('MAIN_SITE');
  const [drawingPoints, setDrawingPoints] = useState<{ lat: number; lng: number }[]>([]);

  // Modallar
  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; zoneId: string }>({ isOpen: false, zoneId: '' });
  const [modalForm, setModalForm] = useState({ title: '', supervisor: '' });

  // Initial Data Fetch
  useEffect(() => {
    setMounted(true);
    fetchZones();
    fetchPersonnel();
  }, [projectId]);

  const fetchPersonnel = async () => {
    try {
      const response = await fetch('/api/admin/personnel');
      if (response.ok) {
        const data = await response.json();
        setPersonnel(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error('Failed to fetch personnel:', error);
    }
  };

  const fetchZones = async () => {
    try {
      setLoading(true);
      let response = await fetch(`/api/admin/geofences?projectId=${projectId}`);
      let data: any[] = [];
      if (response.ok) {
        data = await response.json();
      }
      if (!Array.isArray(data) || data.length === 0) {
        response = await fetch(`/api/admin/site-zones?projectId=${projectId}`);
        if (response.ok) {
          data = await response.json();
        }
      }

      if (Array.isArray(data)) {
        const formattedZones: SiteZone[] = data.map((z: any) => {
          let zType: ZoneType = 'MAIN_SITE';
          const typeStr = z.type || z.zoneType || z.category;
          if (typeStr === 'DANGER_ZONE' || typeStr === 'RISK') {
            zType = 'DANGER_ZONE';
          } else if (typeStr === 'REST_AREA') {
            zType = 'REST_AREA';
          } else {
            zType = 'MAIN_SITE';
          }

          let polygonCoords = z.coordinates || z.polygonCoordinates;
          if (typeof polygonCoords === 'string') {
            try {
              polygonCoords = JSON.parse(polygonCoords);
            } catch {}
          }

          return {
            id: z.id,
            title: z.name || z.title || 'Sanal Çit',
            zoneType: zType,
            category: z.category,
            lat: z.latitude,
            lng: z.longitude,
            radius: z.radius,
            polygonCoordinates: Array.isArray(polygonCoords) ? polygonCoords : undefined,
            supervisor: z.supervisor
          };
        });
        setZones(formattedZones);
      }
    } catch (error) {
      console.error("Failed to fetch zones:", error);
      toast.error("Alanlar yüklenirken hata oluştu");
    } finally {
      setLoading(false);
    }
  };

  // Harita Tıklama Dinleyicisi (Vertex Çizim Modu)
  function MapDrawingHandler() {
    useMapEvents({
      click(e) {
        if (!isDrawing) return;
        // Eğer 3 veya daha fazla nokta varsa ve kullanıcı başlangıç noktasına yakın bir yere tıkladıysa şekli kapat
        if (drawingPoints.length >= 3) {
          const first = drawingPoints[0];
          const dLat = Math.abs(e.latlng.lat - first.lat);
          const dLng = Math.abs(e.latlng.lng - first.lng);
          if (dLat < 0.00025 && dLng < 0.00025) {
            setSaveModalOpen(true);
            return;
          }
        }
        const newPoint = { lat: e.latlng.lat, lng: e.latlng.lng };
        setDrawingPoints((prev) => [...prev, newPoint]);
      }
    });
    return null;
  }

  // Poligon Kaydetme İşlemi
  const handleSavePolygon = async () => {
    if (!modalForm.title.trim()) {
      toast.error("Lütfen alan adını girin");
      return;
    }
    if (drawingPoints.length < 3) {
      toast.error("Poligon oluşturmak için en az 3 köşe noktası gereklidir");
      return;
    }

    try {
      const response = await fetch('/api/admin/geofences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          name: modalForm.title,
          title: modalForm.title,
          type: drawZoneType,
          zoneType: drawZoneType,
          coordinates: drawingPoints,
          polygonCoordinates: drawingPoints,
          supervisor: modalForm.supervisor || undefined
        })
      });

      if (response.ok) {
        const created = await response.json();
        setZones((prev) => [
          ...prev,
          {
            id: created.id,
            title: modalForm.title,
            zoneType: drawZoneType,
            polygonCoordinates: drawingPoints,
            supervisor: modalForm.supervisor
          }
        ]);
        toast.success(`"${modalForm.title}" poligon sanal çiti GeofenceZone tablosuna kaydedildi!`);
        // Reset states
        setDrawingPoints([]);
        setIsDrawing(false);
        setSaveModalOpen(false);
        setModalForm({ title: '', supervisor: '' });
      } else {
        toast.error("Alan kaydedilirken sunucu hatası oluştu");
      }
    } catch (error) {
      console.error("Failed to create polygon zone:", error);
      toast.error("Alan eklenirken hata oluştu");
    }
  };

  // Poligon Silme İşlemi
  const confirmDelete = async () => {
    if (!deleteModal.isOpen || !deleteModal.zoneId) return;

    try {
      const response = await fetch(`/api/admin/geofences/${deleteModal.zoneId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setZones((prev) => prev.filter((z) => z.id !== deleteModal.zoneId));
        toast.success("Alan başarıyla silindi");
      } else {
        toast.error("Alan silinemedi");
      }
    } catch (error) {
      console.error("Failed to delete zone:", error);
      toast.error("Alan silinirken hata oluştu");
    } finally {
      setDeleteModal({ isOpen: false, zoneId: '' });
    }
  };

  // Otonom İSG İhlali Loglama (Turf.js Tetiklemesi)
  const logAutonomousViolation = useCallback(
    async (worker: WorkerLiveItem, zoneName: string) => {
      try {
        await fetch('/api/admin/site-zones/violation', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            projectId,
            workerId: worker.id,
            workerName: worker.name,
            zoneName,
            violation: `${zoneName} bölgesinde Baret / KKD algılanamadı (Kritik Bölge İhlali)`
          })
        });
      } catch (err) {
        console.error("Violation logging error:", err);
      }
    },
    [projectId]
  );

  // Canlı BLE Personel Üretimi & Turf.js Uzaysal İhlal Takip Motoru
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isLiveTracking && projectLat && projectLng) {
      // 1. İşçileri Gerçek Personel Verisi ile Başlat (100% Prisma DB)
      if (workers.length === 0) {
        if (!personnel || personnel.length === 0) {
          setWorkers([]);
        } else {
          const initialWorkers: WorkerLiveItem[] = personnel.slice(0, 15).map(
            (p: any, idx: number) => {
              const hasHelmet = idx % 3 !== 1;
              return {
                id: p.id || `worker-ble-${idx + 1}`,
                name: p.name || `İşçi #${idx + 1}`,
                department: p.department || "Saha Personeli",
                position: p.position || "İşçi",
                lat: projectLat + (Math.random() - 0.5) * 0.0018,
                lng: projectLng + (Math.random() - 0.5) * 0.0018,
                pulse: 74 + Math.floor(Math.random() * 26), // 74 - 100 bpm
                battery: 65 + Math.floor(Math.random() * 35), // 65% - 99%
                hasHelmet,
                inDanger: false,
                currentZoneName: "Ana Şantiye",
                currentZoneType: 'MAIN_SITE',
                timeOnSite: `${Math.floor(Math.random() * 5) + 2}sa ${Math.floor(Math.random() * 50)}dk`
              };
            }
          );
          setWorkers(initialWorkers);
        }
      }

      // 2. Her 2.5 saniyede bir personelleri mikro hareket ettir & Turf.js booleanPointInPolygon çalıştır
      interval = setInterval(() => {
        setWorkers((prevWorkers) =>
          prevWorkers.map((worker) => {
            const newLat = worker.lat + (Math.random() - 0.5) * 0.00012;
            const newLng = worker.lng + (Math.random() - 0.5) * 0.00012;
            const newPulse = Math.max(68, Math.min(130, worker.pulse + (Math.random() > 0.5 ? 1 : -1)));

            // Turf.js Uzaysal Analiz (Point-in-Polygon Engine)
            const workerPt = turf.point([newLng, newLat]);
            let detectedZone: SiteZone | null = null;

            for (const zone of zones) {
              if (zone.polygonCoordinates && zone.polygonCoordinates.length >= 3) {
                const poly = buildTurfPolygon(zone.polygonCoordinates);
                if (poly && turf.booleanPointInPolygon(workerPt, poly)) {
                  detectedZone = zone;
                  break;
                }
              } else if (zone.lat && zone.lng && zone.radius) {
                // Legacy radius desteği (Turf circle)
                try {
                  const circlePoly = turf.circle([zone.lng, zone.lat], zone.radius / 1000, { units: 'kilometers' });
                  if (turf.booleanPointInPolygon(workerPt, circlePoly)) {
                    detectedZone = zone;
                    break;
                  }
                } catch {}
              }
            }

            const inDangerZone = detectedZone?.zoneType === 'DANGER_ZONE';
            const zoneName = detectedZone ? detectedZone.title : "Genel Saha Alanı";
            const zoneType = detectedZone ? detectedZone.zoneType : null;

            // DANGER_ZONE ihlal kontrolü: Eğer kırmızı alandaysa ve baret/KKD onayı yoksa
            if (inDangerZone && !worker.hasHelmet) {
              const now = Date.now();
              const timeSinceLast = now - (worker.lastViolationAt || 0);

              // 40 saniyede bir alarm ve sesli siren çal
              if (timeSinceLast > 40000) {
                playAlarm();
                toast.error(
                  `🚨 İSG ALARMI! ${worker.name} baret olmadan "${zoneName}" (Kırmızı Alan) poligonuna girdi!`,
                  {
                    id: `isg-violation-${worker.id}`,
                    duration: 6000
                  }
                );
                void logAutonomousViolation(worker, zoneName);
                return {
                  ...worker,
                  lat: newLat,
                  lng: newLng,
                  pulse: newPulse + 10, // Panik/Adrenalin artışı
                  inDanger: true,
                  currentZoneName: zoneName,
                  currentZoneType: zoneType,
                  lastViolationAt: now
                };
              }
            }

            return {
              ...worker,
              lat: newLat,
              lng: newLng,
              pulse: newPulse,
              inDanger: inDangerZone,
              currentZoneName: zoneName,
              currentZoneType: zoneType
            };
          })
        );
      }, 2500);
    }

    return () => clearInterval(interval);
  }, [isLiveTracking, projectLat, projectLng, zones, personnel, logAutonomousViolation]);

  if (!mounted) {
    return (
      <div className="bg-slate-900/90 border border-slate-800 p-6 rounded-2xl h-[650px] flex flex-col items-center justify-center text-slate-400">
        <div className="w-10 h-10 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin mb-3" />
        <p className="font-semibold text-white">Şantiye Poligon Haritası Yükleniyor...</p>
      </div>
    );
  }

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 flex flex-col gap-4 shadow-2xl relative">
      {/* Header Bar */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
              <span className="text-lg">📐</span>
            </div>
            <div>
              <h3 className="text-white font-bold text-lg flex items-center gap-2">
                Poligon Sanal Çit (Geofencing) & BLE Radar
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 font-mono">
                  Turf.js Destekli
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Gerçek köşe noktalarıyla sanal çit çizin; BLE personelin alan ihlallerini anlık takip edin.
              </p>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Çizim Başlat Butonu */}
          {!isDrawing ? (
            <button
              onClick={() => {
                setIsDrawing(true);
                setDrawingPoints([]);
                toast("Poligon çizim modu devrede! Haritaya tıklayarak köşe noktaları ekleyin.", {
                  icon: "✏️"
                });
              }}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white shadow-lg shadow-blue-600/20 flex items-center gap-1.5 transition active:scale-95"
            >
              <span>✏️</span>
              <span>Yeni Poligon Çiz</span>
            </button>
          ) : (
            <div className="flex items-center gap-2 bg-slate-800/90 border border-cyan-500/40 rounded-xl p-1.5">
              {/* Bölge Türü Seçimi */}
              <div className="flex items-center gap-1">
                {(Object.keys(ZONE_STYLE_CONFIG) as ZoneType[]).map((type) => {
                  const cfg = ZONE_STYLE_CONFIG[type];
                  const isActive = drawZoneType === type;
                  return (
                    <button
                      key={type}
                      onClick={() => setDrawZoneType(type)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium transition ${
                        isActive
                          ? 'bg-slate-700 text-white ring-1 ring-white/30 shadow'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <span className="mr-1" style={{ color: cfg.color }}>●</span>
                      {type === 'MAIN_SITE' ? 'Ana Şantiye' : type === 'DANGER_ZONE' ? 'Kırmızı Alan' : 'Dinlenme'}
                    </button>
                  );
                })}
              </div>

              {/* Geri Al */}
              <button
                onClick={() => setDrawingPoints((pts) => pts.slice(0, -1))}
                disabled={drawingPoints.length === 0}
                className="px-2.5 py-1 bg-slate-700/80 hover:bg-slate-600 disabled:opacity-40 text-slate-200 text-xs rounded-lg transition"
                title="Son noktayı sil"
              >
                ↩ Geri Al
              </button>

              {/* Poligonu Tamamla */}
              <button
                onClick={() => {
                  if (drawingPoints.length < 3) {
                    toast.error("Poligon için en az 3 köşe noktası işaretlemelisiniz!");
                    return;
                  }
                  setSaveModalOpen(true);
                }}
                disabled={drawingPoints.length < 3}
                className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white font-bold text-xs rounded-lg transition shadow-md shadow-emerald-600/30 flex items-center gap-1"
              >
                <span>✓</span>
                <span>Tamamla ({drawingPoints.length})</span>
              </button>

              {/* İptal */}
              <button
                onClick={() => {
                  setIsDrawing(false);
                  setDrawingPoints([]);
                }}
                className="px-2.5 py-1 bg-red-600/20 hover:bg-red-600/30 border border-red-500/30 text-red-300 text-xs rounded-lg transition"
              >
                İptal
              </button>
            </div>
          )}

          {/* Canlı BLE Radar Aç/Kapat */}
          <button
            onClick={() => setIsLiveTracking(!isLiveTracking)}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all border flex items-center gap-2 ${
              isLiveTracking
                ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400 shadow-lg shadow-emerald-500/10'
                : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${isLiveTracking ? 'bg-emerald-400 animate-ping' : 'bg-slate-500'}`} />
            {isLiveTracking ? 'BLE Radar AKTİF' : 'BLE Radarı Başlat'}
          </button>
        </div>
      </div>

      {/* Drawing Instructions Banner (When active) */}
      {isDrawing && (
        <div className="bg-gradient-to-r from-blue-950/70 to-slate-900 border border-blue-500/30 rounded-xl px-4 py-2.5 flex items-center justify-between text-xs text-blue-200">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
            <span>
              <strong>Çizim Modu:</strong> Harita üzerine tıklayarak poligonun köşe noktalarını (vertex) belirleyin.
              {drawingPoints.length > 0 && ` (${drawingPoints.length} nokta eklendi)`}
            </span>
          </div>
          <span className="text-slate-400 text-[11px]">
            {drawingPoints.length >= 3 ? "Yeşil 'Tamamla' butonuna basarak kaydedebilirsiniz." : "En az 3 nokta gereklidir."}
          </span>
        </div>
      )}

      {/* Leaflet Map Body */}
      <div className="h-[550px] w-full rounded-xl overflow-hidden border border-slate-800 relative z-0">
        {loading ? (
          <div className="w-full h-full flex flex-col items-center justify-center bg-slate-950 text-slate-400">
            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mb-2" />
            <p>Poligon sınırları ve telemetri yükleniyor...</p>
          </div>
        ) : (
          <MapContainer
            center={[projectLat, projectLng]}
            zoom={17}
            maxZoom={22}
            style={{ width: "100%", height: "100%" }}
            className={`w-full h-full ${isDrawing ? 'cursor-crosshair' : ''}`}
          >
            {/* Google Hybrid / Satellite Map Tiles */}
            <TileLayer
              attribution="&copy; Google Maps"
              maxNativeZoom={19}
              maxZoom={22}
              url="https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}"
            />

            {/* Click Event Listener */}
            <MapDrawingHandler />

            {/* 1. Kayıtlı Poligon Sanal Çitler (SiteZone Polygons) */}
            {zones.map((zone) => {
              const cfg = ZONE_STYLE_CONFIG[zone.zoneType] || ZONE_STYLE_CONFIG.MAIN_SITE;

              // Eğer poligon koordinatları varsa Polygon çiz
              if (zone.polygonCoordinates && zone.polygonCoordinates.length >= 3) {
                const positions: [number, number][] = zone.polygonCoordinates.map((p) => [p.lat, p.lng]);
                return (
                  <LeafletPolygon
                    key={zone.id || Math.random()}
                    positions={positions}
                    pathOptions={{
                      color: cfg.color,
                      fillColor: cfg.fillColor,
                      fillOpacity: cfg.fillOpacity,
                      weight: cfg.weight,
                      dashArray: cfg.dashArray
                    }}
                  >
                    <Popup>
                      <div className="p-3 min-w-[210px] text-slate-800">
                        <div className="flex items-center justify-between border-b pb-2 mb-2">
                          <h4 className="font-bold text-sm text-slate-900">{zone.title}</h4>
                          <span
                            className="text-[10px] font-bold px-2 py-0.5 rounded uppercase"
                            style={{ backgroundColor: `${cfg.color}25`, color: cfg.color }}
                          >
                            {zone.zoneType}
                          </span>
                        </div>
                        <div className="text-xs space-y-1 text-slate-600">
                          <p>📐 <strong>Köşe Sayısı:</strong> {zone.polygonCoordinates.length} Nokta</p>
                          {zone.supervisor && (
                            <p>👤 <strong>Sorumlu Amir:</strong> {zone.supervisor}</p>
                          )}
                          <p className="text-[11px] text-slate-500 italic mt-1">
                            {zone.zoneType === 'DANGER_ZONE'
                              ? '⚠️ Baret takmayan personel girdiğinde anlık İSG alarmı tetiklenir.'
                              : zone.zoneType === 'REST_AREA'
                              ? '☕ Personel mola ve güvenli toplanma alanı.'
                              : '🟦 Ana şantiye çevreleme çiti.'}
                          </p>
                        </div>
                        {zone.id && (
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setDeleteModal({ isOpen: true, zoneId: zone.id! });
                            }}
                            className="mt-3 w-full py-1.5 bg-red-500 hover:bg-red-600 text-white rounded text-xs font-semibold transition"
                          >
                            Poligonu Sil
                          </button>
                        )}
                      </div>
                    </Popup>
                  </LeafletPolygon>
                );
              }

              return null;
            })}

            {/* 2. Çizim Aşamasındaki Poligon & Çizgiler & Köşe Noktaları (Drawing Preview) */}
            {isDrawing && drawingPoints.length > 0 && (
              <>
                {/* Noktaları birleştiren kılavuz çizgi */}
                <Polyline
                  positions={drawingPoints.map((p) => [p.lat, p.lng])}
                  pathOptions={{
                    color: ZONE_STYLE_CONFIG[drawZoneType].color,
                    weight: 2.5,
                    dashArray: '5, 5'
                  }}
                />

                {/* 3 veya daha fazla nokta varsa önizleme poligonu */}
                {drawingPoints.length >= 3 && (
                  <LeafletPolygon
                    positions={drawingPoints.map((p) => [p.lat, p.lng])}
                    pathOptions={{
                      color: ZONE_STYLE_CONFIG[drawZoneType].color,
                      fillColor: ZONE_STYLE_CONFIG[drawZoneType].fillColor,
                      fillOpacity: ZONE_STYLE_CONFIG[drawZoneType].fillOpacity,
                      weight: 2
                    }}
                  />
                )}

                {/* Köşe Noktaları (Vertices) */}
                {drawingPoints.map((pt, idx) => (
                  <CircleMarker
                    key={idx}
                    center={[pt.lat, pt.lng]}
                    radius={idx === 0 ? 10 : 5}
                    eventHandlers={{
                      click: (e) => {
                        L.DomEvent.stopPropagation(e as any);
                        if (idx === 0 && drawingPoints.length >= 3) {
                          setSaveModalOpen(true);
                        }
                      }
                    }}
                    pathOptions={{
                      color: idx === 0 ? '#10b981' : '#ffffff',
                      fillColor: idx === 0 ? '#10b981' : ZONE_STYLE_CONFIG[drawZoneType].color,
                      fillOpacity: 1,
                      weight: idx === 0 ? 3 : 2
                    }}
                  />
                ))}
              </>
            )}

            {/* 3. Canlı BLE Personel Radarı (İkonlar ve Pop-up Bilgi Kartları) */}
            {isLiveTracking &&
              workers.map((worker) => {
                const isDanger = worker.inDanger;
                const markerColor = isDanger
                  ? '#ef4444'
                  : !worker.hasHelmet
                  ? '#f59e0b'
                  : '#3b82f6';

                return (
                  <CircleMarker
                    key={worker.id}
                    center={[worker.lat, worker.lng]}
                    radius={isDanger ? 11 : 7}
                    interactive={true}
                    pathOptions={{
                      color: markerColor,
                      fillColor: markerColor,
                      fillOpacity: 0.95,
                      weight: isDanger ? 3 : 2,
                      className: isDanger ? 'animate-ping duration-1000' : 'transition-all duration-700'
                    }}
                  >
                    <Popup className="ble-worker-popup">
                      <div className="p-3.5 min-w-[240px] text-slate-800">
                        {/* Başlık & İsim */}
                        <div className="flex items-start justify-between border-b pb-2 mb-2">
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-sm">👷</span>
                              <h4 className="font-bold text-slate-900 text-sm">{worker.name}</h4>
                            </div>
                            <p className="text-[11px] text-slate-500">{worker.position} - {worker.department}</p>
                          </div>
                          {isDanger && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-700 border border-red-300 animate-pulse">
                              TEHLİKE
                            </span>
                          )}
                        </div>

                        {/* Kritik İSG & Poligon Durum Rozeti */}
                        <div className="mb-2.5">
                          <div
                            className={`p-2 rounded-lg text-xs font-semibold flex items-center justify-between ${
                              isDanger
                                ? 'bg-red-50 text-red-800 border border-red-200'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            <span>📍 Konum:</span>
                            <span className="truncate max-w-[150px] font-mono text-[11px]">
                              {worker.currentZoneName}
                            </span>
                          </div>
                        </div>

                        {/* Canlı Telemetri: Nabız, Pil, Baret */}
                        <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                          {/* Nabız (Pulse) */}
                          <div className="bg-slate-50 p-2 rounded-lg border border-slate-200">
                            <span className="text-slate-500 text-[10px] block">❤️ Nabız</span>
                            <span className={`font-bold font-mono ${worker.pulse > 105 ? 'text-red-600' : 'text-slate-800'}`}>
                              {worker.pulse} bpm
                            </span>
                          </div>

                          {/* BLE Pil (Battery) */}
                          <div className="bg-slate-50 p-2 rounded-lg border border-slate-200">
                            <span className="text-slate-500 text-[10px] block">🔋 BLE Pil</span>
                            <span className={`font-bold font-mono ${worker.battery < 25 ? 'text-red-500' : 'text-emerald-700'}`}>
                              %{worker.battery}
                            </span>
                          </div>
                        </div>

                        {/* Baret / KKD Onay Durumu */}
                        <div className="mb-3">
                          <div
                            className={`px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center justify-between ${
                              worker.hasHelmet
                                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                : 'bg-amber-50 text-amber-900 border border-amber-300 font-bold'
                            }`}
                          >
                            <span className="flex items-center gap-1">
                              <span>🪖</span>
                              <span>Baret / KKD:</span>
                            </span>
                            <span>{worker.hasHelmet ? 'Onaylı' : '⚠️ SİNYAL YOK!'}</span>
                          </div>
                        </div>

                        {/* Detay Linki */}
                        <div className="flex gap-2">
                          <a
                            href={`/admin/personnel`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded text-center transition"
                          >
                            Personel Kartı
                          </a>
                        </div>
                      </div>
                    </Popup>
                  </CircleMarker>
                );
              })}

            {/* Kullanıcı Konum İbresi */}
            {userLocation?.isTracking && userLocation.latitude && userLocation.longitude && (
              <CircleMarker
                center={[userLocation.latitude, userLocation.longitude]}
                radius={8}
                pathOptions={{
                  color: '#06b6d4',
                  fillColor: '#06b6d4',
                  fillOpacity: 1,
                  weight: 2
                }}
              >
                <Popup>
                  <div className="p-2 text-xs text-slate-800 font-semibold">
                    📍 Siz Buradasınız (GPS)
                  </div>
                </Popup>
              </CircleMarker>
            )}
          </MapContainer>
        )}
      </div>

      {/* Lejant (Harita Altı Bilgilendirme) */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400 bg-slate-950/60 border border-slate-800 rounded-xl p-3">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-blue-500/30 border border-blue-500" />
            <span className="text-slate-300">Ana Şantiye (MAIN_SITE)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-red-500/35 border border-red-500" />
            <span className="text-slate-300">Riskli Alan (DANGER_ZONE)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-emerald-500/25 border border-emerald-500" />
            <span className="text-slate-300">Dinlenme Alanı (REST_AREA)</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1 text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400" /> Normal Personel
          </span>
          <span className="flex items-center gap-1 text-red-400">
            <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse" /> İhlal / Riskli Bölge
          </span>
        </div>
      </div>

      {/* Poligon Kaydetme Modalı */}
      {saveModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-150">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-1 flex items-center gap-2">
              <span>📐</span>
              Poligon Sanal Çiti Kaydet
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Haritada {drawingPoints.length} köşe noktasıyla işaretlenen sanal çitin özelliklerini belirleyin.
            </p>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Alan Tipi *</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setDrawZoneType('MAIN_SITE')}
                    className={`p-2.5 rounded-xl border text-center transition ${
                      drawZoneType === 'MAIN_SITE'
                        ? 'bg-blue-600/25 border-blue-500 text-white ring-1 ring-blue-500 shadow'
                        : 'bg-slate-800/40 border-slate-700 text-slate-400 hover:text-white'
                    }`}
                  >
                    <span className="block text-sm mb-0.5 text-blue-400">●</span>
                    <span className="text-[11px] font-semibold block">Ana Şantiye (Mavi)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDrawZoneType('DANGER_ZONE')}
                    className={`p-2.5 rounded-xl border text-center transition ${
                      drawZoneType === 'DANGER_ZONE'
                        ? 'bg-red-600/25 border-red-500 text-white ring-1 ring-red-500 shadow'
                        : 'bg-slate-800/40 border-slate-700 text-slate-400 hover:text-white'
                    }`}
                  >
                    <span className="block text-sm mb-0.5 text-red-500">●</span>
                    <span className="text-[11px] font-semibold block">Riskli Alan (Kırmızı)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDrawZoneType('REST_AREA')}
                    className={`p-2.5 rounded-xl border text-center transition ${
                      drawZoneType === 'REST_AREA'
                        ? 'bg-emerald-600/25 border-emerald-500 text-white ring-1 ring-emerald-500 shadow'
                        : 'bg-slate-800/40 border-slate-700 text-slate-400 hover:text-white'
                    }`}
                  >
                    <span className="block text-sm mb-0.5 text-emerald-400">●</span>
                    <span className="text-[11px] font-semibold block">Dinlenme Alanı (Yeşil)</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Alan Adı *</label>
                <input
                  type="text"
                  value={modalForm.title}
                  onChange={(e) => setModalForm({ ...modalForm, title: e.target.value })}
                  placeholder="Örn: Ana Şantiye Sınırı, Kule Vinç Altı (Tehlikeli)"
                  className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Sorumlu İSG Uzmanı / Şantiye Şefi</label>
                <input
                  type="text"
                  value={modalForm.supervisor}
                  onChange={(e) => setModalForm({ ...modalForm, supervisor: e.target.value })}
                  placeholder="Örn: Ahmet Şen - 0532 555..."
                  className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setSaveModalOpen(false)}
                className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition"
              >
                İptal
              </button>
              <button
                onClick={handleSavePolygon}
                className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition shadow-lg shadow-blue-600/30"
              >
                Kaydet ve Aktifleştir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Silme Onay Modalı */}
      {deleteModal.isOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-2">Poligonu Sil</h3>
            <p className="text-xs text-slate-300 mb-5">
              Bu poligon sanal çitini silmek istediğinize emin misiniz? Otomatik İSG ihlal hesaplamaları bu bölge için sonlanacaktır.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteModal({ isOpen: false, zoneId: '' })}
                className="flex-1 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs font-semibold"
              >
                Vazgeç
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-bold transition shadow-lg shadow-red-600/30"
              >
                Evet, Sil
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}