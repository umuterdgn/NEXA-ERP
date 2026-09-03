/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * This code is the property of NXA Software.
 */

"use client";
import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Circle, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Leaflet ikon sorununu çözme
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

interface Props {
  latitude: number | null;
  longitude: number | null;
  radius: number | null;
  onChange: (lat: number, lng: number, rad: number) => void;
  isReadOnly?: boolean;
}

function MapEvents({ onChange, isReadOnly }: { onChange: (lat: number, lng: number) => void, isReadOnly?: boolean }) {
  useMapEvents({
    click(e) {
      if (!isReadOnly) {
        onChange(e.latlng.lat, e.latlng.lng);
      }
    },
  });
  return null;
}

export default function MapLocationPicker({ latitude, longitude, radius, onChange, isReadOnly = false }: Props) {
  const [mounted, setMounted] = useState(false);
  const defaultCenter: [number, number] = [36.5871, 36.1735]; // İskenderun merkez
  const center: [number, number] = latitude && longitude ? [latitude, longitude] : defaultCenter;
  const currentRadius = radius || 100;

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return <div className="h-64 bg-slate-800 animate-pulse rounded-lg flex items-center justify-center">Harita Yükleniyor...</div>;

  return (
    <div className="flex flex-col gap-3">
      <div className="h-[300px] rounded-lg overflow-hidden border border-slate-600 relative z-0">
        <MapContainer center={center} zoom={15} maxZoom={22} style={{ width: "100%", height: "100%" }}>
          <TileLayer 
            attribution="&copy; Google" 
            maxNativeZoom={19} 
            maxZoom={22} 
            url="https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}"
          />
          <MapEvents isReadOnly={isReadOnly} onChange={(lat, lng) => onChange(lat, lng, currentRadius)} />
          {latitude && longitude && (
            <>
              <Marker position={[latitude, longitude]}/>
              <Circle center={[latitude, longitude]} pathOptions={{ color: 'red', fillColor: '#ef4444', fillOpacity: 0.2 }} radius={currentRadius} />
            </>
          )}
        </MapContainer>
      </div>
      
      {!isReadOnly && (
        <div className="flex flex-col sm:flex-row gap-4 items-end">
          <div className="flex-1">
            <label className="block text-xs font-medium text-slate-400 mb-1">Şantiye Yarıçapı (Sanal Çit Büyüklüğü)</label>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min="5"
                max="1000"
                step="5"
                value={currentRadius}
                onChange={(e) => onChange(latitude || defaultCenter[0], longitude || defaultCenter[1], parseInt(e.target.value))}
                className="w-full accent-emerald-500"
              />
              <span className="text-white font-medium whitespace-nowrap bg-slate-800 px-3 py-1 rounded-md border border-slate-600">
                {currentRadius} Metre
              </span>
            </div>
          </div>
          <p className="text-xs text-slate-400 flex-1">
            * Harita üzerine tıklayarak şantiyenin merkezini (kırmızı pini) belirleyin.
          </p>
        </div>
      )}
    </div>
  );
}