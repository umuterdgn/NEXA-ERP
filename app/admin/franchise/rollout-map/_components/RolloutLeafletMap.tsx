"use client";

/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Franchise İnteraktif Rollout Haritası (React-Leaflet Client Component)
 * Esri Dark Gray Base harita altlığı kullanır (Yazısız, temiz, "API KEY REQUIRED" içermez).
 */

import React, { useEffect } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMap,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { Store, MapPin, CheckCircle2, ArrowRight } from "lucide-react";

// Varsayılan Leaflet icon hatasını önle
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

export type PinCategory = "IDARI" | "INSAAT" | "IT_MONTAJ" | "ACIK";

export interface StoreProject {
  id: string;
  name: string;
  title: string;
  city: string | null;
  district: string | null;
  location: string | null;
  latitude: number | null;
  longitude: number | null;
  progress: number;
  status: string;
  grossAreaSqm: number | null;
  totalCapex: number | null;
  rolloutPhase: string;
  storeTemplate?: {
    name: string;
  } | null;
  stageGates: Array<{
    id: string;
    stageName: string;
    isApproved: boolean;
  }>;
}

interface RolloutLeafletMapProps {
  projects: StoreProject[];
  selectedProject: StoreProject | null;
  onSelectProject: (project: StoreProject) => void;
  getPinCategory: (p: StoreProject) => PinCategory;
}

// Özel Stage-Gate Pin İkonu (HTML DivIcon)
function createRolloutPinIcon(cat: PinCategory, isSelected: boolean, name?: string) {
  let color = "#ef4444";
  let pulseHtml = "";

  if (cat === "ACIK") {
    color = "#10b981"; // Yeşil: Açık / Faal
  } else if (cat === "IT_MONTAJ") {
    color = "#3b82f6"; // Mavi: IT / Montaj
    pulseHtml = `<span style="position:absolute; width:100%; height:100%; border-radius:50%; background:${color}; opacity:0.4; animation:ping 1.8s cubic-bezier(0,0,0.2,1) infinite;"></span>`;
  } else if (cat === "INSAAT") {
    color = "#f59e0b"; // Sarı: İnşaat Fazı
    pulseHtml = `<span style="position:absolute; width:100%; height:100%; border-radius:50%; background:${color}; opacity:0.4; animation:ping 1.8s cubic-bezier(0,0,0.2,1) infinite;"></span>`;
  } else {
    color = "#ef4444"; // Kırmızı: İdari Onay (Kiralama / AVM)
    pulseHtml = `<span style="position:absolute; width:100%; height:100%; border-radius:50%; background:${color}; opacity:0.4; animation:ping 1.8s cubic-bezier(0,0,0.2,1) infinite;"></span>`;
  }

  const borderStyle = isSelected
    ? `border: 2.5px solid #ffffff; box-shadow: 0 0 20px #ffffff, 0 0 30px ${color}; transform: scale(1.15);`
    : `border: 2px solid ${color}; box-shadow: 0 0 16px ${color}88;`;

  const displayName = name ? (name.length > 22 ? name.slice(0, 20) + "..." : name) : "Mağaza";

  return L.divIcon({
    className: "nexa-rollout-marker",
    html: `
      <div style="display:flex; flex-direction:column; align-items:center; transform: translate(-50%, -100%); cursor:pointer;">
        <div style="background:#020617; border:1px solid ${color}; color:#f8fafc; font-size:10px; font-weight:700; font-family:sans-serif; padding:2px 7px; border-radius:6px; white-space:nowrap; box-shadow:0 4px 14px rgba(0,0,0,0.85); display:flex; align-items:center; gap:4px; margin-bottom:3px;">
          <span style="display:inline-block; width:6px; height:6px; border-radius:50%; background:${color};"></span>
          ${displayName}
        </div>
        <div style="width:36px; height:36px; border-radius:50%; background:#0f172a; ${borderStyle} display:flex; align-items:center; justify-content:center; position:relative; transition:all 0.2s ease;">
          ${pulseHtml}
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="position:relative; z-index:2;">
            <path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7"/>
            <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/>
            <path d="M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4"/>
            <path d="M2 7h20"/>
            <path d="M22 7v3a2 2 0 0 1-2 2v0a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 16 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 12 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 8 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 4 12v0a2 2 0 0 1-2-2V7"/>
          </svg>
        </div>
        <div style="width:0; height:0; border-left:6px solid transparent; border-right:6px solid transparent; border-top:7px solid ${color}; margin-top:-1px;"></div>
      </div>
    `,
    iconSize: [36, 62],
    iconAnchor: [18, 62],
  });
}

// Seçilen Mağazaya Yumuşak Odaklanma Kontrolcüsü
function MapViewController({
  selectedProject,
}: {
  selectedProject: StoreProject | null;
}) {
  const map = useMap();

  useEffect(() => {
    if (selectedProject?.latitude && selectedProject?.longitude) {
      map.flyTo([selectedProject.latitude, selectedProject.longitude], 12, { duration: 1.2 });
    }
  }, [selectedProject, map]);

  return null;
}

export default function RolloutLeafletMap({
  projects,
  selectedProject,
  onSelectProject,
  getPinCategory,
}: RolloutLeafletMapProps) {
  const defaultCenter: [number, number] = [39.0, 35.0]; // Türkiye'nin coğrafi merkezi

  const getCategoryLabel = (cat: PinCategory) => {
    switch (cat) {
      case "IDARI":
        return { label: "İdari Aşama", badge: "bg-red-500/20 text-red-400 border-red-800" };
      case "INSAAT":
        return { label: "İnşaat Fazı", badge: "bg-amber-500/20 text-amber-400 border-amber-800" };
      case "IT_MONTAJ":
        return { label: "IT / Montaj", badge: "bg-blue-500/20 text-blue-400 border-blue-800" };
      case "ACIK":
        return { label: "Açık / Faal", badge: "bg-emerald-500/20 text-emerald-400 border-emerald-800" };
    }
  };

  return (
    <div className="relative w-full h-[520px] rounded-xl overflow-hidden border border-slate-800 shadow-2xl bg-slate-950">
      <style jsx global>{`
        .leaflet-popup-content-wrapper {
          background: #090d16 !important;
          color: #f8fafc !important;
          border: 1px solid #1e293b !important;
          border-radius: 12px !important;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.8), 0 8px 10px -6px rgba(0, 0, 0, 0.8) !important;
          padding: 0 !important;
        }
        .leaflet-popup-content {
          margin: 0 !important;
          line-height: 1.4 !important;
        }
        .leaflet-popup-tip {
          background: #090d16 !important;
          border: 1px solid #1e293b !important;
        }
        .leaflet-container {
          font-family: inherit !important;
        }
      `}</style>

      <MapContainer
        center={defaultCenter}
        zoom={6}
        scrollWheelZoom={true}
        className="w-full h-full min-h-[500px] rounded-xl z-0"
        style={{ background: "#020617" }}
      >
        {/* Esri Dark Gray Harita Altlığı (Yazısız, temiz, API KEY gerektirmez) */}
        <TileLayer
          attribution='&copy; <a href="https://www.esri.com/">Esri</a>, DeLorme, HERE, MapmyIndia'
          url="https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}"
          maxZoom={16}
        />

        {/* Mağaza Pinleri */}
        {projects.map((p) => {
          const lat = p.latitude;
          const lng = p.longitude;
          if (typeof lat !== "number" || typeof lng !== "number" || isNaN(lat) || isNaN(lng)) {
            return null;
          }

          const cat = getPinCategory(p);
          const isSelected = selectedProject?.id === p.id;
          const catInfo = getCategoryLabel(cat);

          return (
            <Marker
              key={p.id}
              position={[lat, lng]}
              icon={createRolloutPinIcon(cat, isSelected, p.name || p.title)}
              eventHandlers={{
                click: () => onSelectProject(p),
              }}
            >
              <Popup>
                <div className="p-3.5 space-y-2.5 min-w-[220px]">
                  <div className="flex items-center justify-between gap-2">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${catInfo.badge}`}>
                      {catInfo.label}
                    </span>
                    <span className="text-[10px] font-mono font-semibold text-slate-400">
                      %{p.progress} İlerleme
                    </span>
                  </div>

                  <div>
                    <h3 className="font-bold text-sm text-white line-clamp-1">
                      {p.name || p.title}
                    </h3>
                    <div className="flex items-center gap-1 text-xs text-slate-400 mt-0.5">
                      <MapPin className="w-3 h-3 text-slate-500" />
                      <span>{p.city ? `${p.city} ${p.district ? `/${p.district}` : ""}` : "Konum Belirtilmedi"}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-800 text-[11px]">
                    <div className="bg-slate-900/80 p-1.5 rounded border border-slate-800">
                      <span className="text-slate-400 block text-[10px]">Brüt Alan</span>
                      <strong className="text-white font-mono">{p.grossAreaSqm ? `${p.grossAreaSqm} m²` : "120 m²"}</strong>
                    </div>
                    <div className="bg-slate-900/80 p-1.5 rounded border border-slate-800">
                      <span className="text-slate-400 block text-[10px]">CAPEX</span>
                      <strong className="text-emerald-400 font-mono">
                        {p.totalCapex ? `${(p.totalCapex / 1000000).toFixed(2)}M ₺` : "1.85M ₺"}
                      </strong>
                    </div>
                  </div>

                  <button
                    onClick={() => onSelectProject(p)}
                    className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold transition-colors mt-1"
                  >
                    <span>Detayları İncele</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </Popup>
            </Marker>
          );
        })}

        {/* Seçilen Mağazaya Yumuşak Odaklanma */}
        <MapViewController selectedProject={selectedProject} />
      </MapContainer>
    </div>
  );
}
