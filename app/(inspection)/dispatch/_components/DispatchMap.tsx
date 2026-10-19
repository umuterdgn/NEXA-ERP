/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Yapı Denetim - Gerçek Yol Ağı (OSRM) Tabanlı Rota Haritası Bileşeni
 */

"use client";

import React, { useEffect, useMemo } from "react";
import { 
  MapContainer, 
  TileLayer, 
  Marker, 
  Popup, 
  Polyline, 
  CircleMarker, 
  useMap 
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { MapPin, Clock, ArrowRight, ShieldCheck, Navigation } from "lucide-react";

// Leaflet icon fix
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

export interface DispatchTask {
  id: string;
  projectId?: string;
  projectName: string;
  yibfNo: string;
  address: string;
  taskType: string;
  taskBadgeColor?: string;
  status: string;
  orderIndex: number;
  coordinates: { lat: number; lng: number };
  estimatedTime: string;
  notes?: string;
}

interface DispatchMapProps {
  allTasks: DispatchTask[];
  selectedTaskIds: string[];
  orderedTasks: DispatchTask[];
  roadPolyline: [number, number][]; // [lat, lng] array from OSRM
  userLocation?: { lat: number; lng: number } | null;
  onToggleTask: (taskId: string) => void;
  isLoadingRoute?: boolean;
}

// Controller to auto-center and fit map bounds to the active route
function MapBoundsController({
  boundsPoints
}: {
  boundsPoints: [number, number][];
}) {
  const map = useMap();

  useEffect(() => {
    if (boundsPoints.length >= 2) {
      try {
        const bounds = L.latLngBounds(boundsPoints);
        map.fitBounds(bounds, {
          padding: [50, 50],
          maxZoom: 15,
          animate: true,
          duration: 1.2
        });
      } catch (e) {
        console.error("Bounds error:", e);
      }
    } else if (boundsPoints.length === 1) {
      map.flyTo(boundsPoints[0], 14, { animate: true });
    }
  }, [map, boundsPoints]);

  return null;
}

// Numbered Sequence Pin (1, 2, 3...)
function createNumberedPinIcon(orderNumber: number, title: string, isFirst: boolean, isLast: boolean) {
  const bgGradient = isFirst
    ? "linear-gradient(135deg, #10b981, #059669)" // Green for start
    : isLast
    ? "linear-gradient(135deg, #f97316, #ea580c)" // Orange for end
    : "linear-gradient(135deg, #3b82f6, #1d4ed8)"; // Blue for middle stops

  const ringColor = isFirst ? "#6ee7b7" : isLast ? "#fdba74" : "#93c5fd";

  return L.divIcon({
    className: "custom-route-marker",
    iconSize: [42, 42],
    iconAnchor: [21, 21],
    popupAnchor: [0, -22],
    html: `
      <div style="position: relative; width: 42px; height: 42px; display: flex; align-items: center; justify-content: center;">
        <div style="position: absolute; inset: -4px; border-radius: 9999px; background: rgba(59, 130, 246, 0.25); filter: blur(4px);"></div>
        <div style="
          width: 36px;
          height: 36px;
          border-radius: 9999px;
          background: ${bgGradient};
          border: 2.5px solid ${ringColor};
          box-shadow: 0 4px 14px rgba(0,0,0,0.4), 0 0 10px rgba(59, 130, 246, 0.6);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: 800;
          font-size: 15px;
          font-family: ui-sans-serif, system-ui, sans-serif;
        ">
          ${orderNumber}
        </div>
        <span style="
          position: absolute;
          bottom: -18px;
          font-size: 10px;
          font-weight: 700;
          color: #f1f5f9;
          white-space: nowrap;
          background: rgba(15, 23, 42, 0.92);
          padding: 1px 6px;
          border-radius: 4px;
          border: 1px solid rgba(59, 130, 246, 0.4);
          box-shadow: 0 2px 6px rgba(0,0,0,0.5);
          pointer-events: none;
        ">${title.slice(0, 15)}</span>
      </div>
    `
  });
}

// Unselected / Inactive Site Marker
function createUnselectedPinIcon(title: string) {
  return L.divIcon({
    className: "custom-inactive-marker",
    iconSize: [30, 30],
    iconAnchor: [15, 15],
    popupAnchor: [0, -16],
    html: `
      <div style="position: relative; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center; opacity: 0.75;">
        <div style="
          width: 22px;
          height: 22px;
          border-radius: 9999px;
          background: #475569;
          border: 2px solid #94a3b8;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 11px;
          box-shadow: 0 2px 6px rgba(0,0,0,0.4);
        ">
          +
        </div>
      </div>
    `
  });
}

export default function DispatchMap({
  allTasks,
  selectedTaskIds,
  orderedTasks,
  roadPolyline,
  userLocation,
  onToggleTask,
  isLoadingRoute = false
}: DispatchMapProps) {
  // Center fallback (Istanbul center or first task coordinates)
  const defaultCenter: [number, number] = useMemo(() => {
    if (orderedTasks.length > 0) {
      return [orderedTasks[0].coordinates.lat, orderedTasks[0].coordinates.lng];
    }
    if (allTasks.length > 0) {
      return [allTasks[0].coordinates.lat, allTasks[0].coordinates.lng];
    }
    return [41.0082, 28.9784];
  }, [orderedTasks, allTasks]);

  // Points for bounds fitting (active stops + user location + road polyline key points)
  const boundsPoints = useMemo<[number, number][]>(() => {
    const pts: [number, number][] = orderedTasks.map((t) => [
      t.coordinates.lat,
      t.coordinates.lng
    ]);
    if (userLocation) {
      pts.push([userLocation.lat, userLocation.lng]);
    }
    return pts;
  }, [orderedTasks, userLocation]);

  return (
    <div className="relative w-full h-full bg-slate-950 overflow-hidden">
      {/* Route Loading Indicator Overlay */}
      {isLoadingRoute && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] bg-slate-900/90 backdrop-blur-md border border-cyan-500/40 text-cyan-300 px-4 py-2 rounded-full text-xs font-semibold shadow-xl flex items-center gap-2">
          <div className="w-3.5 h-3.5 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
          <span>Gerçek Karayolu Rota Ağı Hesaplanıyor (OSRM)...</span>
        </div>
      )}

      <MapContainer
        center={defaultCenter}
        zoom={12}
        style={{ height: "100%", width: "100%" }}
        className="z-0 h-full w-full"
      >
        {/* OpenStreetMap Base Tile Layer */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Bounds Controller */}
        <MapBoundsController boundsPoints={boundsPoints} />

        {/* 1. Real Road Polyline (Gerçek Karayolu Güzergahı) */}
        {roadPolyline.length > 1 && (
          <>
            {/* Soft Glow Underlay */}
            <Polyline
              positions={roadPolyline}
              pathOptions={{
                color: "#1d4ed8",
                weight: 9,
                opacity: 0.35,
                lineCap: "round",
                lineJoin: "round"
              }}
            />
            {/* Sharp Road Polyline */}
            <Polyline
              positions={roadPolyline}
              pathOptions={{
                color: "#3b82f6",
                weight: 5,
                opacity: 0.95,
                lineCap: "round",
                lineJoin: "round"
              }}
            />
          </>
        )}

        {/* 2. User Current Location Pin (if active) */}
        {userLocation && (
          <CircleMarker
            center={[userLocation.lat, userLocation.lng]}
            radius={8}
            pathOptions={{
              color: "#06b6d4",
              fillColor: "#06b6d4",
              fillOpacity: 1,
              weight: 2
            }}
          >
            <Popup>
              <div className="p-2 text-xs text-slate-800 font-bold flex items-center gap-1.5">
                <Navigation className="w-4 h-4 text-cyan-600" />
                <span>Mevcut Konumunuz (Başlangıç)</span>
              </div>
            </Popup>
          </CircleMarker>
        )}

        {/* 3. Selected Ordered Tasks (Numbered 1, 2, 3...) */}
        {orderedTasks.map((task, idx) => {
          const isFirst = idx === 0;
          const isLast = idx === orderedTasks.length - 1 && orderedTasks.length > 1;
          const icon = createNumberedPinIcon(idx + 1, task.projectName, isFirst, isLast);

          return (
            <Marker
              key={task.id}
              position={[task.coordinates.lat, task.coordinates.lng]}
              icon={icon}
            >
              <Popup>
                <div className="p-4 min-w-[260px] text-slate-800 font-sans">
                  {/* Badge & Order */}
                  <div className="flex items-center justify-between border-b pb-2 mb-2.5">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs">
                        {idx + 1}
                      </span>
                      <h4 className="font-bold text-slate-900 text-sm">{task.projectName}</h4>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-700">
                      YİBF #{task.yibfNo}
                    </span>
                  </div>

                  {/* Task details */}
                  <div className="space-y-1.5 text-xs text-slate-600 mb-3">
                    <div className="flex items-center gap-1.5 text-slate-900 font-semibold">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      <span>{task.taskType}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-600">
                      <MapPin className="w-4 h-4 text-slate-400" />
                      <span>{task.address}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-500">
                      <Clock className="w-4 h-4 text-slate-400" />
                      <span>Öngörülen Süre: {task.estimatedTime}</span>
                    </div>
                  </div>

                  {/* Toggle button in popup */}
                  <button
                    onClick={() => onToggleTask(task.id)}
                    className="w-full py-1.5 text-xs font-semibold rounded bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 transition"
                  >
                    Rotadan Çıkar
                  </button>
                </div>
              </Popup>
            </Marker>
          );
        })}

        {/* 4. Unselected / Inactive Tasks (Click to Add to Route) */}
        {allTasks
          .filter((t) => !selectedTaskIds.includes(t.id))
          .map((task) => (
            <Marker
              key={task.id}
              position={[task.coordinates.lat, task.coordinates.lng]}
              icon={createUnselectedPinIcon(task.projectName)}
              eventHandlers={{
                click: () => onToggleTask(task.id)
              }}
            >
              <Popup>
                <div className="p-3 min-w-[220px] text-slate-800">
                  <div className="flex items-center justify-between border-b pb-1.5 mb-2">
                    <h4 className="font-bold text-slate-900 text-xs">{task.projectName}</h4>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-200 text-slate-700">
                      YİBF {task.yibfNo}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mb-2">{task.taskType}</p>
                  <button
                    onClick={() => onToggleTask(task.id)}
                    className="w-full py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-bold transition flex items-center justify-center gap-1"
                  >
                    <span>+ Rotaya Ekle</span>
                  </button>
                </div>
              </Popup>
            </Marker>
          ))}
      </MapContainer>
    </div>
  );
}
