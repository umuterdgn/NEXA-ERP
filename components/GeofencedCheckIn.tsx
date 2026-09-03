/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * This code is the property of NXA Software.
 */

"use client";
import { useState } from 'react';
import { getDistanceFromLatLonInMeters } from '@/lib/utils';
import { toast } from 'react-hot-toast';

interface Props {
  projectId: string;
  projectLat?: number | null;
  projectLng?: number | null;
  radius?: number | null;
}

export default function GeofencedCheckIn({ projectId, projectLat, projectLng, radius = 100 }: Props) {
  const [isLocating, setIsLocating] = useState(false);
  const [distance, setDistance] = useState<number | null>(null);

  const handleCheckIn = () => {
    if (!projectLat || !projectLng) {
      toast.error("Bu proje için GPS koordinatları tanımlanmamış. Lütfen Proje Künyesi'nden ekleyin.");
      return;
    }

    if (!navigator.geolocation) {
      toast.error("Cihazınız GPS'i desteklemiyor veya izin verilmemiş.");
      return;
    }

    setIsLocating(true);
    toast.loading("Konumunuz doğrulanıyor...", { id: 'geo' });

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const userLat = position.coords.latitude;
        const userLng = position.coords.longitude;
        
        const dist = getDistanceFromLatLonInMeters(projectLat, projectLng, userLat, userLng);
        setDistance(Math.round(dist));

        if (dist <= (radius || 100)) {
          // API çağrısı ile veritabanına kaydet
          const workerName = prompt("Adınız Soyadınız:") || "Bilinmeyen Personel";
          
          fetch("/api/attendance/check-in", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              projectId,
              workerName,
              latitude: userLat,
              longitude: userLng
            })
          }).then(res => {
            if (res.ok) {
              toast.success(`Konum doğrulandı! (${Math.round(dist)}m). İşe girişiniz yapıldı.`, { id: 'geo' });
            } else {
              toast.error("Giriş kaydedilemedi, lütfen tekrar deneyin.", { id: 'geo' });
            }
            setIsLocating(false);
          }).catch(err => {
            console.error("API error:", err);
            toast.error("Bağlantı hatası oluştu.", { id: 'geo' });
            setIsLocating(false);
          });
        } else {
          toast.error(`Şantiye alanından çok uzaksınız! (Mesafe: ${Math.round(dist)}m - İzin verilen: ${radius}m)`, { id: 'geo', duration: 5000 });
          setIsLocating(false);
        }
      },
      (error) => {
        toast.error("Konum alınamadı. Lütfen tarayıcı ayarlarından konum izni verin.", { id: 'geo' });
        setIsLocating(false);
      },
      { enableHighAccuracy: true }
    );
  };

  return (
    <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 flex flex-col items-center text-center">
      <div className="w-16 h-16 bg-blue-900/30 rounded-full flex items-center justify-center mb-4">
        <span className="text-3xl">📍</span>
      </div>
      <h3 className="text-lg font-bold text-white mb-2">Günlük Puantaj & Giriş</h3>
      <p className="text-sm text-slate-400 mb-6">Şantiye sınırları (Geofence) içerisinde olmanız gerekmektedir.</p>
      
      <button 
        onClick={handleCheckIn}
        disabled={isLocating}
        className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold text-lg shadow-[0_0_15px_rgba(52,211,153,0.3)] transition-all disabled:opacity-50"
      >
        {isLocating ? "GPS Aranıyor..." : "🟢 İŞE BAŞLA (CHECK-IN)"}
      </button>

      {distance !== null && distance > (radius || 100) && (
        <p className="mt-4 text-xs text-red-400 font-medium bg-red-950/50 p-2 rounded">
          ⚠️ Merkeze {distance} metre uzaklıktasınız. Sınıra yaklaşın.
        </p>
      )}
    </div>
  );
}