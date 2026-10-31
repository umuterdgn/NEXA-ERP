"use client";

/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * QR Mikro Tüketim Döngüsü & Ambar Tarayıcı Terminali
 * Kamerayla veya optik okuyucuyla QR okutup malzemenin currentZone ve status değerini anında günceller.
 */

import React, { useState, useEffect, useRef } from "react";
import {
  QrCode,
  Camera,
  CameraOff,
  PackageCheck,
  MapPin,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Search,
  ArrowRight,
  UserCheck,
  Clock,
  Sparkles,
  Layers,
  History,
  Box,
  Truck,
  Flame,
} from "lucide-react";

interface InventoryItemData {
  id: string;
  materialName: string;
  qrCode: string;
  quantity: number;
  unit?: string | null;
  currentZone: string;
  status: string; // IN_STOCK, DISPATCHED, CONSUMED
  assignedToId?: string | null;
  consumedAt?: string | null;
  createdAt: string;
  project?: {
    id: string;
    name: string;
  } | null;
}

const COMMON_ZONES = [
  "MAIN_WAREHOUSE",
  "A_BLOK_TEMEL",
  "A_BLOK_KAT_1",
  "A_BLOK_KAT_3",
  "B_BLOK_BODRUM",
  "DEMIR_ATOLYESI",
  "KALIP_SAHASI",
  "NIZAMIYE_KABUL",
];

export default function InventoryQrScannerPage() {
  const [scannedCode, setScannedCode] = useState("");
  const [manualCodeInput, setManualCodeInput] = useState("");
  const [item, setItem] = useState<InventoryItemData | null>(null);
  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Güncelleme Form State'i
  const [selectedZone, setSelectedZone] = useState("MAIN_WAREHOUSE");
  const [customZone, setCustomZone] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("IN_STOCK");
  const [assignedTo, setAssignedTo] = useState("");

  // Kamera Durumu
  const [isCameraActive, setIsCameraActive] = useState(false);
  const scannerRef = useRef<any>(null);

  // Son İşlemler (Tarihçe)
  const [historyItems, setHistoryItems] = useState<InventoryItemData[]>([]);

  // 1. Son hareketleri getir
  const loadRecentItems = async () => {
    try {
      const res = await fetch("/api/inventory/qr");
      const data = await res.json();
      if (data.success && Array.isArray(data.items)) {
        setHistoryItems(data.items);
      }
    } catch (e) {
      console.warn("Tarihçe yüklenemedi:", e);
    }
  };

  useEffect(() => {
    loadRecentItems();
  }, []);

  // 2. Belirli bir QR Kodunu Sorgula
  const searchQrCode = async (code: string) => {
    if (!code.trim()) return;
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/inventory/qr?qrCode=${encodeURIComponent(code.trim())}`);
      const data = await res.json();

      if (res.ok && data.success && data.item) {
        setItem(data.item);
        setScannedCode(data.item.qrCode);
        setSelectedZone(data.item.currentZone || "MAIN_WAREHOUSE");
        setSelectedStatus(data.item.status || "IN_STOCK");
        setAssignedTo(data.item.assignedToId || "");
        setMessage({ type: "success", text: `"${data.item.materialName}" bulundu.` });
      } else {
        setItem(null);
        setScannedCode(code.trim());
        setMessage({
          type: "error",
          text: `"${code}" kodlu malzeme bulunamadı. Aşağıdan yeni malzeme olarak kaydedebilirsiniz.`,
        });
      }
    } catch (err: any) {
      setMessage({ type: "error", text: "Malzeme sorgulama hatası: " + err.message });
    } finally {
      setLoading(false);
    }
  };

  // 3. Kamera Okuyucu Başlatma / Kapatma (html5-qrcode)
  const startCamera = async () => {
    try {
      const { Html5Qrcode } = await import("html5-qrcode");
      setIsCameraActive(true);
      setMessage(null);

      const html5QrCode = new Html5Qrcode("nexa-qr-reader-container");
      scannerRef.current = html5QrCode;

      await html5QrCode.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        },
        (decodedText) => {
          // Başarılı QR Okuma
          if (navigator.vibrate) navigator.vibrate(100);
          setScannedCode(decodedText);
          searchQrCode(decodedText);
          stopCamera();
        },
        () => {
          // Frame tarama hatası (göz ardı edilir)
        }
      );
    } catch (err: any) {
      console.error("Kamera başlatma hatası:", err);
      setIsCameraActive(false);
      setMessage({
        type: "error",
        text: "Kamera açılamadı. Lütfen kamera izni verdiğinizden emin olun veya kodu el ile girin.",
      });
    }
  };

  const stopCamera = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
        scannerRef.current.clear();
      } catch (e) {
        console.warn("Kamera kapatma hatası:", e);
      }
      scannerRef.current = null;
    }
    setIsCameraActive(false);
  };

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  // 4. Malzeme Durumu & Bölge Güncelleme
  const handleUpdateItem = async () => {
    const code = scannedCode || manualCodeInput;
    if (!code) {
      setMessage({ type: "error", text: "Lütfen geçerli bir QR kod giriniz." });
      return;
    }

    setUpdating(true);
    setMessage(null);
    try {
      const targetZone = customZone.trim() ? customZone.trim() : selectedZone;

      const res = await fetch("/api/inventory/qr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          qrCode: code,
          currentZone: targetZone,
          status: selectedStatus,
          assignedToId: assignedTo.trim() || null,
          materialName: item?.materialName || "Yeni Malzeme (" + code + ")",
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Güncelleme başarısız.");
      }

      setItem(data.item);
      setMessage({
        type: "success",
        text: `Malzeme başarıyla güncellendi: [${data.item.currentZone}] - [${data.item.status}]`,
      });

      // Tarihçeyi tazele
      loadRecentItems();
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || "Güncelleme sırasında hata oluştu." });
    } finally {
      setUpdating(false);
    }
  };

  // Test Verisi Yükleyici
  const handleLoadSample = (sampleCode: string) => {
    setManualCodeInput(sampleCode);
    searchQrCode(sampleCode);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-6 lg:p-8 flex flex-col gap-6 max-w-7xl mx-auto">
      {/* 1. Üst Başlık & Ekmek Kırıntısı */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-blue-400 uppercase tracking-wider mb-1">
            <QrCode className="w-4 h-4" />
            ŞANTİYE AMBAR & LOJİSTİK
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
            QR Mikro Tüketim Döngüsü
            <span className="text-xs bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full font-sans">
              Canlı Takip
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Ambar kabulünden kat/blok tüketimine kadar malzemenin şantiye içi tüm fiziksel hareketlerini anlık yönetin.
          </p>
        </div>

        {/* Hızlı Test Butonları */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[11px] text-slate-500 font-medium">Hızlı Test Kodu:</span>
          <button
            onClick={() => handleLoadSample("QR-BETON-C35")}
            className="text-[11px] font-mono bg-slate-800 hover:bg-slate-700 text-slate-300 px-2.5 py-1 rounded-lg border border-slate-700 transition-colors"
          >
            QR-BETON-C35
          </button>
          <button
            onClick={() => handleLoadSample("QR-DEMIR-Q16")}
            className="text-[11px] font-mono bg-slate-800 hover:bg-slate-700 text-slate-300 px-2.5 py-1 rounded-lg border border-slate-700 transition-colors"
          >
            QR-DEMIR-Q16
          </button>
          <button
            onClick={() => handleLoadSample("QR-TUG-BLOK-A")}
            className="text-[11px] font-mono bg-slate-800 hover:bg-slate-700 text-slate-300 px-2.5 py-1 rounded-lg border border-slate-700 transition-colors"
          >
            QR-TUG-BLOK-A
          </button>
        </div>
      </div>

      {/* Bildirim Mesajı */}
      {message && (
        <div
          className={`p-3.5 rounded-2xl border text-xs flex items-center gap-2.5 transition-all ${
            message.type === "success"
              ? "bg-emerald-950/40 text-emerald-300 border-emerald-500/30"
              : "bg-rose-950/40 text-rose-300 border-rose-500/30"
          }`}
        >
          {message.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {/* 2. Ana Grid: Kamera & Giriş (Sol) + Güncelleme Formu (Sağ) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Sol Kolon: Kamera Okuyucu ve Manuel Kod Girişi */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Camera className="w-5 h-5 text-blue-400" />
                <h2 className="text-sm font-bold text-white">Optik QR Tarayıcı</h2>
              </div>
              {isCameraActive ? (
                <button
                  onClick={stopCamera}
                  className="px-3 py-1 bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors"
                >
                  <CameraOff className="w-3.5 h-3.5" /> Kamerayı Kapat
                </button>
              ) : (
                <button
                  onClick={startCamera}
                  className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors shadow-lg shadow-blue-600/20"
                >
                  <Camera className="w-3.5 h-3.5" /> Kamerayı Aç
                </button>
              )}
            </div>

            {/* Kamera Görüntüleme Penceresi */}
            <div className="relative rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 aspect-square flex items-center justify-center">
              <div
                id="nexa-qr-reader-container"
                className={`w-full h-full ${!isCameraActive ? "hidden" : ""}`}
              />

              {!isCameraActive && (
                <div className="flex flex-col items-center justify-center text-center p-6 gap-3">
                  <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500">
                    <QrCode className="w-8 h-8" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-300 block">Kamera Beklemede</span>
                    <span className="text-[11px] text-slate-500 block mt-0.5">
                      Malzeme üzerindeki etiketi okutmak için kamerayı başlatın veya lazer barkod kullanın.
                    </span>
                  </div>
                  <button
                    onClick={startCamera}
                    className="mt-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl border border-slate-700 transition-colors"
                  >
                    Kamerayı Başlat
                  </button>
                </div>
              )}
            </div>

            {/* Manuel Barkod / QR Kod Girişi */}
            <div className="pt-3 border-t border-slate-800/80 flex flex-col gap-2">
              <label className="text-[11px] font-bold text-slate-400">VEYA MANUEL KOD GİRİN / OKUTUN</label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Örn: QR-INV-8821"
                    value={manualCodeInput}
                    onChange={(e) => setManualCodeInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") searchQrCode(manualCodeInput);
                    }}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <button
                  onClick={() => searchQrCode(manualCodeInput)}
                  disabled={loading || !manualCodeInput.trim()}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white rounded-xl text-xs font-bold transition-all disabled:opacity-50"
                >
                  {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : "Sorgula"}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Sağ Kolon: Malzeme Detay & Mikro Hareket Formu */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col gap-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-2.5">
                <PackageCheck className="w-5 h-5 text-emerald-400" />
                <h2 className="text-sm font-bold text-white">Malzeme Mikro Döngü Yönetimi</h2>
              </div>
              {scannedCode && (
                <span className="font-mono text-xs font-bold text-blue-400 bg-blue-950/60 border border-blue-500/30 px-2.5 py-1 rounded-lg">
                  {scannedCode}
                </span>
              )}
            </div>

            {/* Taranan Malzeme Bilgi Kartı */}
            {item ? (
              <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 flex flex-col gap-3">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[11px] text-slate-500 font-semibold block">Kayıtlı Malzeme</span>
                    <h3 className="text-lg font-black text-white">{item.materialName}</h3>
                  </div>
                  <div className="text-right">
                    <span className="text-[11px] text-slate-500 font-semibold block">Miktar</span>
                    <span className="text-base font-extrabold text-emerald-400">
                      {item.quantity} {item.unit || "Adet"}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs pt-2 border-t border-slate-800/60">
                  <div>
                    <span className="text-slate-500 text-[10px] block">Mevcut Bölge:</span>
                    <span className="font-bold text-slate-300 font-mono">{item.currentZone}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[10px] block">Durum:</span>
                    <span
                      className={`font-bold px-1.5 py-0.5 rounded text-[11px] ${
                        item.status === "CONSUMED"
                          ? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                          : item.status === "DISPATCHED"
                          ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                          : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                      }`}
                    >
                      {item.status}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[10px] block">Zimmet:</span>
                    <span className="font-bold text-slate-300 truncate block">
                      {item.assignedToId || "Depo Stoğu"}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-slate-950/40 border border-dashed border-slate-800 rounded-2xl p-6 text-center text-slate-500 text-xs">
                QR kod okutulduğunda malzeme detayları ve konumu burada listelenecektir.
              </div>
            )}

            {/* Bölge ve Durum Güncelleme Kontrolleri */}
            <div className="flex flex-col gap-4">
              {/* 1. Şantiye Bölgesi (currentZone) Seçimi */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-rose-400" />
                  Hedef Lokasyon / Bölge (currentZone)
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {COMMON_ZONES.map((zone) => (
                    <button
                      key={zone}
                      onClick={() => {
                        setSelectedZone(zone);
                        setCustomZone("");
                      }}
                      className={`p-2 rounded-xl text-[11px] font-bold border transition-all text-left truncate ${
                        selectedZone === zone && !customZone
                          ? "bg-blue-600 text-white border-blue-500 shadow-md shadow-blue-600/20"
                          : "bg-slate-950/60 text-slate-400 border-slate-800 hover:text-white hover:bg-slate-800/40"
                      }`}
                    >
                      {zone.replace(/_/g, " ")}
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  placeholder="Veya özel bölge yazın (Örn: B Blok 4. Kat Kolonlar)"
                  value={customZone}
                  onChange={(e) => setCustomZone(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 mt-1"
                />
              </div>

              {/* 2. Malzeme Durumu (status) */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-amber-400" />
                  Tüketim Durumu (status)
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => setSelectedStatus("IN_STOCK")}
                    className={`p-3 rounded-2xl border flex flex-col items-center gap-1.5 transition-all ${
                      selectedStatus === "IN_STOCK"
                        ? "bg-emerald-950/40 text-emerald-300 border-emerald-500 shadow-lg shadow-emerald-500/10"
                        : "bg-slate-950/60 text-slate-400 border-slate-800 hover:text-white"
                    }`}
                  >
                    <Box className="w-5 h-5 text-emerald-400" />
                    <span className="text-xs font-black">IN_STOCK</span>
                    <span className="text-[10px] text-slate-500">Depoda / Sağlam</span>
                  </button>

                  <button
                    onClick={() => setSelectedStatus("DISPATCHED")}
                    className={`p-3 rounded-2xl border flex flex-col items-center gap-1.5 transition-all ${
                      selectedStatus === "DISPATCHED"
                        ? "bg-amber-950/40 text-amber-300 border-amber-500 shadow-lg shadow-amber-500/10"
                        : "bg-slate-950/60 text-slate-400 border-slate-800 hover:text-white"
                    }`}
                  >
                    <Truck className="w-5 h-5 text-amber-400" />
                    <span className="text-xs font-black">DISPATCHED</span>
                    <span className="text-[10px] text-slate-500">Sahaya Sevk</span>
                  </button>

                  <button
                    onClick={() => setSelectedStatus("CONSUMED")}
                    className={`p-3 rounded-2xl border flex flex-col items-center gap-1.5 transition-all ${
                      selectedStatus === "CONSUMED"
                        ? "bg-rose-950/40 text-rose-300 border-rose-500 shadow-lg shadow-rose-500/10"
                        : "bg-slate-950/60 text-slate-400 border-slate-800 hover:text-white"
                    }`}
                  >
                    <Flame className="w-5 h-5 text-rose-400" />
                    <span className="text-xs font-black">CONSUMED</span>
                    <span className="text-[10px] text-slate-500">Tüketildi / Monte</span>
                  </button>
                </div>
              </div>

              {/* 3. Zimmetli Taşeron / Usta (assignedToId) */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <UserCheck className="w-3.5 h-3.5 text-indigo-400" />
                  Zimmetli Usta / Taşeron (Opsiyonel)
                </label>
                <input
                  type="text"
                  placeholder="Örn: Demirci Mehmet Kalfa / Özlem İnşaat"
                  value={assignedTo}
                  onChange={(e) => setAssignedTo(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Kaydet ve Güncelle Butonu */}
              <button
                onClick={handleUpdateItem}
                disabled={updating || (!scannedCode && !manualCodeInput.trim())}
                className="w-full mt-2 py-3.5 px-6 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-emerald-600 hover:from-blue-500 hover:to-emerald-500 text-white font-extrabold text-sm shadow-xl shadow-blue-600/25 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {updating ? (
                  <RefreshCw className="w-5 h-5 animate-spin" />
                ) : (
                  <CheckCircle2 className="w-5 h-5" />
                )}
                DURUM & LOKASYONU GÜNCELLE
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Alt Kısım: Son Yapılan Mikro Tüketim ve Hareket Tarihçesi */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-indigo-400" />
            <h2 className="text-sm font-bold text-white">Son Şantiye İçi Hareketler (Audit Log)</h2>
          </div>
          <button
            onClick={loadRecentItems}
            className="text-xs text-slate-400 hover:text-white flex items-center gap-1"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Yenile
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-semibold">
                <th className="pb-3 pl-2">QR Kod</th>
                <th className="pb-3">Malzeme</th>
                <th className="pb-3">Miktar</th>
                <th className="pb-3">Bölge (currentZone)</th>
                <th className="pb-3">Durum (status)</th>
                <th className="pb-3">Zimmetli</th>
                <th className="pb-3 pr-2">Son Hareket</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {historyItems.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-6 text-center text-slate-500">
                    Henüz kayıtlı hareket bulunmuyor.
                  </td>
                </tr>
              ) : (
                historyItems.map((h) => (
                  <tr
                    key={h.id}
                    onClick={() => {
                      setManualCodeInput(h.qrCode);
                      searchQrCode(h.qrCode);
                    }}
                    className="hover:bg-slate-800/40 cursor-pointer transition-colors"
                  >
                    <td className="py-3 pl-2 font-mono font-bold text-blue-400">{h.qrCode}</td>
                    <td className="py-3 font-semibold text-white">{h.materialName}</td>
                    <td className="py-3 text-slate-300 font-medium">
                      {h.quantity} {h.unit || "Adet"}
                    </td>
                    <td className="py-3 font-mono text-slate-300">{h.currentZone}</td>
                    <td className="py-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                          h.status === "CONSUMED"
                            ? "bg-rose-500/20 text-rose-300 border-rose-500/30"
                            : h.status === "DISPATCHED"
                            ? "bg-amber-500/20 text-amber-300 border-amber-500/30"
                            : "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                        }`}
                      >
                        {h.status}
                      </span>
                    </td>
                    <td className="py-3 text-slate-400">{h.assignedToId || "—"}</td>
                    <td className="py-3 pr-2 text-slate-500 font-mono text-[11px]">
                      {new Date(h.consumedAt || h.createdAt).toLocaleString("tr-TR")}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
