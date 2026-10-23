"use client";

/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Uygulamasız (SMS-Link) Canlı Şoför Takip Terminali
 * Şoförün telefonundan konum izni alarak 15 saniyede bir merkeze konum gönderir.
 * Kapı güvenliğine gösterilmek üzere büyük QR Kod barındırır.
 */

import React, { useState, useEffect, useRef, useCallback } from "react";
import { QRCodeSVG } from "qrcode.react";
import {
  Truck,
  Navigation,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  Radio,
  Phone,
  ShieldCheck,
  ExternalLink,
  RefreshCw,
  Compass,
  Gauge,
  Copy,
  Check,
  Clock,
  Sparkles,
} from "lucide-react";

interface TrackDriverClientProps {
  trackingCode: string;
}

interface ShipmentDetails {
  id: string;
  trackingCode: string;
  vehiclePlate: string;
  driverPhone: string;
  status: string; // PREPARING, ON_THE_WAY, ARRIVED, DELIVERED
  currentLatitude?: number | null;
  currentLongitude?: number | null;
  lastPingTime?: string;
  purchaseRequest?: {
    materialName?: string;
    quantity?: number;
    unit?: string;
    project?: {
      name?: string;
      city?: string;
      address?: string;
      latitude?: number | null;
      longitude?: number | null;
    } | null;
  } | null;
}

export default function TrackDriverClient({ trackingCode }: TrackDriverClientProps) {
  const [shipment, setShipment] = useState<ShipmentDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Canlı GPS Durumu
  const [isTrackingActive, setIsTrackingActive] = useState(false);
  const [currentCoords, setCurrentCoords] = useState<{
    latitude: number;
    longitude: number;
    accuracy?: number | null;
    speed?: number | null;
    heading?: number | null;
  } | null>(null);

  const [lastPingTime, setLastPingTime] = useState<string | null>(null);
  const [pingCount, setPingCount] = useState<number>(0);
  const [pingStatus, setPingStatus] = useState<"IDLE" | "SENDING" | "SUCCESS" | "FAILED">("IDLE");
  const [copied, setCopied] = useState(false);

  // Interval & Watcher Referansları
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const watchIdRef = useRef<number | null>(null);
  const wakeLockRef = useRef<any>(null);

  // 1. Sevkiyat Verilerini API'den Çek
  const fetchShipmentData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/logistics/ping?trackingCode=${trackingCode}`);
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Sevkiyat bilgisi bulunamadı.");
      }

      setShipment(data.shipment);
      if (data.shipment.status === "ON_THE_WAY") {
        setIsTrackingActive(true);
      }
    } catch (err: any) {
      setError(err.message || "Sevkiyat yüklenirken hata oluştu.");
    } finally {
      setLoading(false);
    }
  }, [trackingCode]);

  useEffect(() => {
    fetchShipmentData();
  }, [fetchShipmentData]);

  // Ekranın Kapanmasını Önle (Screen Wake Lock)
  const requestWakeLock = async () => {
    try {
      if ("wakeLock" in navigator && !wakeLockRef.current) {
        wakeLockRef.current = await (navigator as any).wakeLock.request("screen");
      }
    } catch (e) {
      console.warn("Wake lock desteklenmiyor veya reddedildi:", e);
    }
  };

  // 2. Konum Gönderme Fonksiyonu (15 Saniyede Bir)
  const sendPing = useCallback(
    async (lat: number, lng: number, statusOverride?: string, spd?: number | null, hdg?: number | null, acc?: number | null) => {
      try {
        setPingStatus("SENDING");
        const payload = {
          trackingCode,
          latitude: lat,
          longitude: lng,
          status: statusOverride || shipment?.status || "ON_THE_WAY",
          speed: spd ?? null,
          heading: hdg ?? null,
          accuracy: acc ?? null,
        };

        const res = await fetch("/api/logistics/ping", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        const data = await res.json();
        if (data.success) {
          setPingStatus("SUCCESS");
          setLastPingTime(new Date().toLocaleTimeString("tr-TR"));
          setPingCount((prev) => prev + 1);

          if (statusOverride) {
            setShipment((prev) => (prev ? { ...prev, status: statusOverride } : null));
          }
        } else {
          setPingStatus("FAILED");
        }
      } catch (e) {
        console.error("Ping gönderme hatası:", e);
        setPingStatus("FAILED");
      }
    },
    [trackingCode, shipment?.status]
  );

  // 3. "Yola Çıktım" Butonu - GPS'i Başlat
  const handleStartTracking = () => {
    if (!navigator.geolocation) {
      alert("Cihazınızda GPS / Konum Servisi desteklenmiyor.");
      return;
    }

    if (navigator.vibrate) {
      navigator.vibrate([100, 50, 100]);
    }

    requestWakeLock();
    setIsTrackingActive(true);

    // İlk anlık konumu al ve 'ON_THE_WAY' olarak kaydet
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = {
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
          speed: pos.coords.speed ? Math.round(pos.coords.speed * 3.6) : null, // km/s
          heading: pos.coords.heading,
        };
        setCurrentCoords(coords);
        sendPing(coords.latitude, coords.longitude, "ON_THE_WAY", coords.speed, coords.heading, coords.accuracy);
      },
      (err) => {
        console.error("GPS Hatası:", err);
        alert("Lütfen tarayıcınızdan Konum Erişimine İZİN veriniz.");
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );

    // Watch Position ile dinamik hız/yön güncellemesi
    if (!watchIdRef.current) {
      watchIdRef.current = navigator.geolocation.watchPosition(
        (pos) => {
          setCurrentCoords({
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            accuracy: pos.coords.accuracy,
            speed: pos.coords.speed ? Math.round(pos.coords.speed * 3.6) : null,
            heading: pos.coords.heading,
          });
        },
        (err) => console.warn("Watch position error:", err),
        { enableHighAccuracy: true, maximumAge: 5000 }
      );
    }

    // 15 saniyede bir ping atan Interval
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          const spd = pos.coords.speed ? Math.round(pos.coords.speed * 3.6) : null;
          const hdg = pos.coords.heading;
          const acc = pos.coords.accuracy;
          setCurrentCoords({ latitude: lat, longitude: lng, accuracy: acc, speed: spd, heading: hdg });
          sendPing(lat, lng, "ON_THE_WAY", spd, hdg, acc);
        },
        (err) => console.warn("Periyodik GPS okuma hatası:", err),
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 5000 }
      );
    }, 15000);
  };

  // 4. "Şantiyeye Vardım" Butonu
  const handleArrived = () => {
    if (navigator.vibrate) navigator.vibrate(200);
    if (currentCoords) {
      sendPing(currentCoords.latitude, currentCoords.longitude, "ARRIVED");
    } else {
      navigator.geolocation.getCurrentPosition((pos) => {
        sendPing(pos.coords.latitude, pos.coords.longitude, "ARRIVED");
      });
    }
  };

  // 5. "Teslim Edildi" Butonu
  const handleDelivered = () => {
    if (navigator.vibrate) navigator.vibrate([150, 100, 150]);
    if (currentCoords) {
      sendPing(currentCoords.latitude, currentCoords.longitude, "DELIVERED");
    }
    // GPS döngüsünü durdur
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (watchIdRef.current) navigator.geolocation.clearWatch(watchIdRef.current);
    setIsTrackingActive(false);
  };

  // Cleanup
  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (watchIdRef.current) navigator.geolocation.clearWatch(watchIdRef.current);
      if (wakeLockRef.current) wakeLockRef.current.release?.();
    };
  }, []);

  const copyCode = () => {
    navigator.clipboard.writeText(trackingCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "ON_THE_WAY":
        return {
          label: "YOLDA / CANLI TAKİP",
          bg: "bg-emerald-500/20 text-emerald-400 border-emerald-500/40",
          dot: "bg-emerald-400 animate-pulse",
        };
      case "ARRIVED":
        return {
          label: "KAPIYA ULAŞTI",
          bg: "bg-amber-500/20 text-amber-400 border-amber-500/40",
          dot: "bg-amber-400",
        };
      case "DELIVERED":
        return {
          label: "TESLİM EDİLDİ",
          bg: "bg-blue-500/20 text-blue-400 border-blue-500/40",
          dot: "bg-blue-400",
        };
      default:
        return {
          label: "HAZIRLANIYOR",
          bg: "bg-slate-700/40 text-slate-300 border-slate-600/40",
          dot: "bg-slate-400",
        };
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
        <RefreshCw className="w-12 h-12 text-blue-500 animate-spin mb-4" />
        <h2 className="text-xl font-bold text-white">Sevkiyat Bilgileri Yükleniyor...</h2>
        <p className="text-sm text-slate-400 mt-1">Lütfen bekleyiniz</p>
      </div>
    );
  }

  if (error || !shipment) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center max-w-md mx-auto">
        <div className="w-16 h-16 rounded-2xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center mb-4 text-rose-400">
          <AlertTriangle className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-white">Sevkiyat Bulunamadı</h2>
        <p className="text-sm text-slate-400 mt-2">{error || "Takip kodu geçersiz veya sevkiyat iptal edilmiş."}</p>
        <button
          onClick={fetchShipmentData}
          className="mt-6 px-5 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-sm font-medium text-white flex items-center gap-2"
        >
          <RefreshCw className="w-4 h-4" /> Tekrar Dene
        </button>
      </div>
    );
  }

  const badge = getStatusBadge(shipment.status);
  const targetProject = shipment.purchaseRequest?.project;
  const mapsUrl = targetProject?.latitude && targetProject?.longitude
    ? `https://www.google.com/maps/dir/?api=1&destination=${targetProject.latitude},${targetProject.longitude}`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
        (targetProject?.name || "") + " " + (targetProject?.city || "") + " " + (targetProject?.address || "")
      )}`;

  return (
    <div className="max-w-md w-full mx-auto p-4 sm:p-6 pb-20 flex flex-col gap-4">
      {/* 1. Üst Başlık ve Kurumsal Şoför Kartı */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800/80 rounded-2xl p-4 shadow-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
              <Truck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-semibold text-blue-400 uppercase tracking-wider">NEXA ERP SÜRÜCÜ</span>
                <span className="text-[10px] bg-blue-500/20 text-blue-300 px-1.5 py-0.5 rounded-full font-mono">SMS-LINK</span>
              </div>
              <h1 className="text-lg font-bold text-white tracking-tight">{shipment.vehiclePlate}</h1>
            </div>
          </div>
          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border ${badge.bg}`}>
            <span className={`w-2 h-2 rounded-full ${badge.dot}`} />
            {badge.label}
          </div>
        </div>

        {/* Sevkiyat Yük Bilgisi */}
        <div className="mt-4 pt-3 border-t border-slate-800/80 grid grid-cols-2 gap-3 text-xs">
          <div>
            <span className="text-slate-400 block text-[11px]">Taşınan Malzeme</span>
            <span className="font-semibold text-slate-200">
              {shipment.purchaseRequest?.materialName || "İnşaat Malzemesi"}
            </span>
            {shipment.purchaseRequest?.quantity ? (
              <span className="text-slate-400 ml-1">
                ({shipment.purchaseRequest.quantity} {shipment.purchaseRequest.unit || "Birim"})
              </span>
            ) : null}
          </div>
          <div>
            <span className="text-slate-400 block text-[11px]">Hedef Şantiye</span>
            <span className="font-semibold text-slate-200 truncate block">
              {targetProject?.name || "Merkez Şantiye"}
            </span>
          </div>
        </div>
      </div>

      {/* 2. Kapı Güvenliği İçin Büyük QR Kodu */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 text-center shadow-2xl flex flex-col items-center relative overflow-hidden">
        <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-emerald-500" />
        
        <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          KAPI GÜVENLİK GEÇİŞ KODU
        </div>

        {/* QR Kod Beyaz Kontrast Çerçevede */}
        <div className="p-4 bg-white rounded-2xl shadow-inner border-4 border-slate-700/40 my-1">
          <QRCodeSVG
            value={trackingCode}
            size={210}
            level="H"
            includeMargin={false}
          />
        </div>

        {/* Kod Metni ve Kopyalama */}
        <div className="mt-4 flex items-center gap-2">
          <span className="text-xs text-slate-400">Takip Kodu:</span>
          <span className="font-mono text-base font-extrabold text-blue-400 bg-slate-950 px-3 py-1 rounded-lg border border-slate-800">
            {trackingCode}
          </span>
          <button
            onClick={copyCode}
            aria-label="Kodu Kopyala"
            className="p-1.5 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
          </button>
        </div>

        <p className="text-[11px] text-slate-400 mt-2 max-w-xs">
          Şantiye nizamiyesine ulaştığınızda bu QR kodu güvenlik görevlisine okutunuz.
        </p>
      </div>

      {/* 3. Ana Eylem Butonları (Yola Çıktım / Vardım / Teslim) */}
      <div className="flex flex-col gap-3">
        {!isTrackingActive && shipment.status !== "DELIVERED" && (
          <button
            onClick={handleStartTracking}
            className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-base sm:text-lg shadow-lg shadow-emerald-600/30 active:scale-[0.98] transition-all flex items-center justify-center gap-3 border border-emerald-400/30"
          >
            <Navigation className="w-6 h-6 animate-bounce" />
            YOLA ÇIKTIM (Konumu Başlat)
          </button>
        )}

        {isTrackingActive && shipment.status === "ON_THE_WAY" && (
          <div className="flex flex-col gap-2.5">
            <div className="bg-emerald-950/40 border border-emerald-600/40 rounded-2xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="relative flex h-4 w-4">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500"></span>
                </span>
                <div>
                  <div className="text-xs font-bold text-emerald-400 uppercase tracking-wide">CANLI GPS AKTİF (15s)</div>
                  <div className="text-[11px] text-slate-400">
                    Son Ping: {lastPingTime || "Şimdi"} • Toplam: {pingCount}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-base font-black text-white font-mono">
                  {currentCoords?.speed !== null && currentCoords?.speed !== undefined
                    ? `${currentCoords.speed} km/s`
                    : "-- km/s"}
                </div>
                <div className="text-[10px] text-slate-400">Anlık Hız</div>
              </div>
            </div>

            <button
              onClick={handleArrived}
              className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-extrabold text-base shadow-lg shadow-amber-600/25 active:scale-[0.98] transition-all flex items-center justify-center gap-2 border border-amber-400/30"
            >
              <MapPin className="w-5 h-5" />
              ŞANTİYEYE VARDIM (Kapıya Ulaştı)
            </button>
          </div>
        )}

        {shipment.status === "ARRIVED" && (
          <button
            onClick={handleDelivered}
            className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-extrabold text-base shadow-lg shadow-blue-600/30 active:scale-[0.98] transition-all flex items-center justify-center gap-2 border border-blue-400/30"
          >
            <CheckCircle2 className="w-6 h-6" />
            BOŞALTIM BİTTİ (Sevkiyatı Tamamla)
          </button>
        )}

        {shipment.status === "DELIVERED" && (
          <div className="bg-blue-950/40 border border-blue-500/40 rounded-2xl p-4 text-center">
            <CheckCircle2 className="w-8 h-8 text-blue-400 mx-auto mb-2" />
            <h3 className="text-base font-bold text-white">Sevkiyat Başarıyla Tamamlandı</h3>
            <p className="text-xs text-slate-400 mt-1">İrsaliye ve ambar kabul işlemleri şantiye tarafından onaylandı.</p>
          </div>
        )}
      </div>

      {/* 4. Şantiye Navigasyon ve İletişim Kartı */}
      <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-4 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-rose-400" />
            <span className="text-xs font-bold text-slate-200">Varış Noktası Bilgileri</span>
          </div>
          <a
            href={mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[11px] font-bold text-blue-400 hover:text-blue-300 flex items-center gap-1 bg-blue-500/10 px-2.5 py-1 rounded-lg border border-blue-500/20"
          >
            Haritada Aç <ExternalLink className="w-3 h-3" />
          </a>
        </div>

        <div className="text-xs text-slate-300 bg-slate-950/60 p-3 rounded-xl border border-slate-800/60">
          <div className="font-semibold text-white">{targetProject?.name || "Şantiye Projesi"}</div>
          <div className="text-slate-400 mt-0.5">{targetProject?.address || targetProject?.city || "Adres bilgisi sistemde kayıtlı"}</div>
        </div>

        {/* Şoför Güvenlik ve Pil Bilgilendirmesi */}
        <div className="flex items-center gap-2 text-[11px] text-slate-400 bg-amber-500/10 border border-amber-500/20 p-2.5 rounded-xl">
          <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
          <span>Konum takibinin kesilmemesi için lütfen bu sayfayı yolculuk süresince kapatmayınız.</span>
        </div>
      </div>
    </div>
  );
}
