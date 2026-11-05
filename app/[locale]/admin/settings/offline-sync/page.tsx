"use client"

/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Nexa ERP - Cihaz ve Çevrimdışı Senkronizasyon Yönetimi (Offline Sync Hub)
 */

import React, { useState } from "react"
import {
  RefreshCw,
  Wifi,
  WifiOff,
  Smartphone,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Layers,
  Database,
  ArrowUpRight,
  ShieldAlert,
  Server,
  Sliders,
  Trash2,
  Play,
  RotateCw,
  FileText,
  TestTube,
  HardHat,
  PackageCheck,
  Navigation,
} from "lucide-react"

interface SyncDevice {
  id: string
  name: string
  user: string
  role: string
  os: "iOS" | "Android"
  batteryLevel: number
  networkStatus: "ONLINE" | "OFFLINE" | "WEAK_4G"
  pendingItems: number
  lastSyncTime: string
  appVersion: string
}

interface QueueItem {
  id: string
  module: "JURNAL" | "BETON" | "KKD" | "MALZEME" | "GPS"
  title: string
  device: string
  author: string
  recordedAt: string
  status: "PENDING" | "SYNCED" | "CONFLICT"
  conflictDetail?: string
}

const INITIAL_DEVICES: SyncDevice[] = [
  {
    id: "dev-iphone-15",
    name: "Murat Çetin iPhone 15 Pro",
    user: "Murat Çetin",
    role: "Şantiye Şefi",
    os: "iOS",
    batteryLevel: 78,
    networkStatus: "ONLINE",
    pendingItems: 3,
    lastSyncTime: "1 dk önce",
    appVersion: "v2.4.1 (EAS Build)",
  },
  {
    id: "dev-samsung-s23",
    name: "Kemal Demir Galaxy S23",
    user: "Kemal Demir",
    role: "Demir Formeni",
    os: "Android",
    batteryLevel: 45,
    networkStatus: "OFFLINE",
    pendingItems: 8,
    lastSyncTime: "42 dk önce",
    appVersion: "v2.4.1",
  },
  {
    id: "dev-ipad-air",
    name: "Zeynep Kaya iPad Air Sahada",
    user: "Zeynep Kaya",
    role: "İSG Uzmanı",
    os: "iOS",
    batteryLevel: 92,
    networkStatus: "ONLINE",
    pendingItems: 0,
    lastSyncTime: "Az önce",
    appVersion: "v2.4.1",
  },
  {
    id: "dev-pixel-8",
    name: "Ahmet Yılmaz Pixel 8 (Tır)",
    user: "Ahmet Yılmaz",
    role: "Lojistik Sürücüsü",
    os: "Android",
    batteryLevel: 62,
    networkStatus: "WEAK_4G",
    pendingItems: 4,
    lastSyncTime: "4 dk önce",
    appVersion: "v2.4.1",
  },
]

const INITIAL_QUEUE: QueueItem[] = [
  {
    id: "q-101",
    module: "JURNAL",
    title: "Günlük Şantiye Defteri (A Blok 4. Kat)",
    device: "Murat Çetin iPhone 15 Pro",
    author: "Murat Çetin",
    recordedAt: "10:14 (Çevrimdışı)",
    status: "PENDING",
  },
  {
    id: "q-102",
    module: "BETON",
    title: "C35 Slump ve Sıcaklık Testi Kaydı (Mikser 34 VR 8901)",
    device: "Kemal Demir Galaxy S23",
    author: "Kemal Demir",
    recordedAt: "09:48 (Çevrimdışı)",
    status: "CONFLICT",
    conflictDetail: "Sunucudaki son beton verisi ile cihaz saati arasında 12 dakika zaman farkı var.",
  },
  {
    id: "q-103",
    module: "KKD",
    title: "Kule Vinç Sapancı Paraşüt Tipi Emniyet Kemeri Zimmeti",
    device: "Zeynep Kaya iPad Air Sahada",
    author: "Zeynep Kaya",
    recordedAt: "10:30",
    status: "SYNCED",
  },
  {
    id: "q-104",
    module: "MALZEME",
    title: "İrsaliye No 88412 - 24 Ton Nervürlü Demir Kabulü",
    device: "Ahmet Yılmaz Pixel 8 (Tır)",
    author: "Ahmet Yılmaz",
    recordedAt: "10:02 (Çevrimdışı)",
    status: "PENDING",
  },
  {
    id: "q-105",
    module: "GPS",
    title: "Lojistik Tır Background GPS Telemetri Paketi (12 Nokta)",
    device: "Ahmet Yılmaz Pixel 8 (Tır)",
    author: "Ahmet Yılmaz",
    recordedAt: "10:20 (Çevrimdışı)",
    status: "PENDING",
  },
]

export default function OfflineSyncPage() {
  const [devices, setDevices] = useState<SyncDevice[]>(INITIAL_DEVICES)
  const [queue, setQueue] = useState<QueueItem[]>(INITIAL_QUEUE)
  const [isSyncingAll, setIsSyncingAll] = useState(false)
  const [conflictPolicy, setConflictPolicy] = useState<"SERVER_WINS" | "CLIENT_WINS" | "SMART_MERGE">("SMART_MERGE")
  const [toastMsg, setToastMsg] = useState<string | null>(null)

  const pendingCount = queue.filter((i) => i.status === "PENDING").length
  const conflictCount = queue.filter((i) => i.status === "CONFLICT").length
  const syncedCount = queue.filter((i) => i.status === "SYNCED").length

  const handleSyncAll = () => {
    setIsSyncingAll(true)
    setTimeout(() => {
      setQueue((prev) =>
        prev.map((item) => ({
          ...item,
          status: "SYNCED",
        }))
      )
      setDevices((prev) =>
        prev.map((d) => ({
          ...d,
          pendingItems: 0,
          lastSyncTime: "Az önce",
        }))
      )
      setIsSyncingAll(false)
      setToastMsg("Tüm çevrimdışı kuyruk paketleri merkezi veritabanı ile eşitlendi!")
      setTimeout(() => setToastMsg(null), 3500)
    }, 1800)
  }

  const handleResolveConflict = (id: string) => {
    setQueue((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status: "SYNCED", conflictDetail: undefined } : item))
    )
    setToastMsg("Çakışma Akıllı Birleştirme kuralıyla çözüldü.")
    setTimeout(() => setToastMsg(null), 3000)
  }

  const handleClearSynced = () => {
    setQueue((prev) => prev.filter((i) => i.status !== "SYNCED"))
    setToastMsg("Senkronize edilmiş eski kuyruk kayıtları temizlendi.")
    setTimeout(() => setToastMsg(null), 3000)
  }

  const getModuleIcon = (module: string) => {
    switch (module) {
      case "JURNAL":
        return <FileText className="w-4 h-4 text-blue-400" />
      case "BETON":
        return <TestTube className="w-4 h-4 text-amber-400" />
      case "KKD":
        return <HardHat className="w-4 h-4 text-purple-400" />
      case "MALZEME":
        return <PackageCheck className="w-4 h-4 text-emerald-400" />
      case "GPS":
        return <Navigation className="w-4 h-4 text-cyan-400" />
      default:
        return <Database className="w-4 h-4 text-slate-400" />
    }
  }

  return (
    <div className="space-y-6">
      {/* Üst Başlık & Senkronizasyon Aksiyonu */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950 border border-slate-800 shadow-xl">
        <div className="flex items-center gap-3.5">
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-emerald-400">
            <RefreshCw className={`w-8 h-8 ${isSyncingAll ? "animate-spin" : ""}`} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-white tracking-tight">
                Cihaz & Çevrimdışı Senkronizasyon (Offline Sync)
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                OFFLINE-FIRST MOTORU AKTİF
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Şantiyede internet kopukken mobil cihazlara SQLite/WatermelonDB ile kaydedilen verilerin merkezi bulut senkronizasyonu.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleClearSynced}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 transition-all flex items-center gap-1.5"
          >
            <Trash2 className="w-4 h-4" />
            <span>Kuyruğu Temizle</span>
          </button>

          <button
            onClick={handleSyncAll}
            disabled={isSyncingAll}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-all shadow-lg shadow-emerald-950"
          >
            <RotateCw className={`w-4 h-4 ${isSyncingAll ? "animate-spin" : ""}`} />
            <span>{isSyncingAll ? "Senkronize Ediliyor..." : "Tüm Kuyruğu Şimdi Eşitle"}</span>
          </button>
        </div>
      </div>

      {toastMsg && (
        <div className="p-3.5 rounded-2xl bg-emerald-950/60 border border-emerald-500/30 text-emerald-200 text-xs flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* İSTATİSTİK SAYAÇLARI */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl flex items-center gap-3">
          <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-400">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-400 font-medium block">Bekleyen Kuyruk</span>
            <span className="text-xl font-black text-white">{pendingCount} Paket</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl flex items-center gap-3">
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-400 font-medium block">Başarılı Eşitlenen</span>
            <span className="text-xl font-black text-white">{syncedCount} Paket</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl flex items-center gap-3">
          <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-400 font-medium block">Çakışma / Uyuşmazlık</span>
            <span className="text-xl font-black text-white">{conflictCount} Kayıt</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl flex items-center gap-3">
          <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl text-blue-400">
            <Smartphone className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-400 font-medium block">Bağlı Cihaz Filosu</span>
            <span className="text-xl font-black text-white">{devices.length} Terminal</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* SOL: Senkronizasyon Kuyruğu (7 Kolon) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <Database className="w-4 h-4 text-blue-400" />
                Senkronizasyon Kuyruk Paketleri (Offline Queue)
              </h2>
              <span className="text-xs font-mono text-slate-400">{queue.length} Toplam İşlem</span>
            </div>

            <div className="space-y-3">
              {queue.map((item) => (
                <div
                  key={item.id}
                  className={`p-3.5 rounded-xl border transition-all flex flex-col gap-2 ${
                    item.status === "CONFLICT"
                      ? "bg-red-950/20 border-red-500/40"
                      : item.status === "PENDING"
                      ? "bg-slate-950/70 border-slate-800"
                      : "bg-slate-950/40 border-slate-800/60 opacity-80"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-lg bg-slate-900 border border-slate-800">
                        {getModuleIcon(item.module)}
                      </div>
                      <span className="font-bold text-xs text-white truncate max-w-[280px]">
                        {item.title}
                      </span>
                    </div>

                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        item.status === "CONFLICT"
                          ? "bg-red-500/20 text-red-400 border-red-500/40 animate-pulse"
                          : item.status === "PENDING"
                          ? "bg-amber-500/20 text-amber-400 border-amber-500/40"
                          : "bg-emerald-500/20 text-emerald-400 border-emerald-500/40"
                      }`}
                    >
                      {item.status === "CONFLICT"
                        ? "ÇAKIŞMA VAR"
                        : item.status === "PENDING"
                        ? "KUYRUKTA BEKLİYOR"
                        : "EŞİTLENDİ"}
                    </span>
                  </div>

                  {item.conflictDetail && (
                    <div className="p-2 rounded-lg bg-red-950/40 border border-red-500/20 text-[11px] text-red-300">
                      ⚠️ {item.conflictDetail}
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-1 border-t border-slate-800/60 text-[11px] text-slate-400 font-mono">
                    <span>{item.author} ({item.device.split(" ")[0]})</span>
                    <span>{item.recordedAt}</span>
                  </div>

                  {item.status === "CONFLICT" && (
                    <div className="pt-2 flex justify-end">
                      <button
                        onClick={() => handleResolveConflict(item.id)}
                        className="px-3 py-1 rounded-lg bg-red-600 hover:bg-red-500 text-white font-bold text-xs transition-all"
                      >
                        Çakışmayı Çöz (Sunucuya Yaz)
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* SAĞ: Kayıtlı Saha Cihazları & Çakışma Kuralları (5 Kolon) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Çakışma Yönetim Politikası */}
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-3">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Sliders className="w-4 h-4 text-purple-400" />
              Çakışma Çözüm Stratejisi (Conflict Policy)
            </h2>
            <p className="text-xs text-slate-400">
              Aynı veri hem ofiste hem sahada çevrimdışı değiştirildiğinde uygulanacak kural:
            </p>

            <div className="space-y-2 pt-1">
              {[
                {
                  id: "SMART_MERGE",
                  title: "Akıllı Birleştirme (Smart Merge - Önerilen)",
                  desc: "Farklı alanları korur, son zaman damgalı girdiyi birleştirir.",
                },
                {
                  id: "SERVER_WINS",
                  title: "Sunucu Öncelikli (Server Wins)",
                  desc: "Merkez ofisin girdiği veri her zaman sahadakini ezer.",
                },
                {
                  id: "CLIENT_WINS",
                  title: "Saha Cihazı Öncelikli (Client Wins)",
                  desc: "Saha gerçeğini yansıtmak için cep telefonunun verisi esas alınır.",
                },
              ].map((policy) => (
                <label
                  key={policy.id}
                  onClick={() => setConflictPolicy(policy.id as any)}
                  className={`p-3 rounded-xl border flex flex-col gap-1 cursor-pointer transition-all ${
                    conflictPolicy === policy.id
                      ? "bg-purple-950/30 border-purple-500 text-white shadow-md shadow-purple-950/40"
                      : "bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-slate-200">{policy.title}</span>
                    <input
                      type="radio"
                      name="conflictPolicy"
                      checked={conflictPolicy === policy.id}
                      onChange={() => {}}
                      className="accent-purple-500"
                    />
                  </div>
                  <span className="text-[11px] text-slate-400">{policy.desc}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Sahadaki Mobil Cihazlar */}
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-3">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-emerald-400" />
                Saha Terminalleri & Cihazlar
              </h2>
              <span className="text-xs font-mono text-slate-400">{devices.length} Cihaz</span>
            </div>

            <div className="space-y-2.5">
              {devices.map((device) => (
                <div
                  key={device.id}
                  className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-between"
                >
                  <div>
                    <span className="text-xs font-bold text-white block truncate max-w-[200px]">
                      {device.name}
                    </span>
                    <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono mt-0.5">
                      <span>{device.user}</span>
                      <span>•</span>
                      <span>{device.os} ({device.appVersion})</span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full border inline-block mb-1 ${
                        device.networkStatus === "ONLINE"
                          ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                          : device.networkStatus === "OFFLINE"
                          ? "bg-red-500/20 text-red-400 border-red-500/30"
                          : "bg-amber-500/20 text-amber-400 border-amber-500/30"
                      }`}
                    >
                      {device.networkStatus === "ONLINE" ? "ÇEVRİMİÇİ" : device.networkStatus === "OFFLINE" ? "ÇEVRİMDIŞI" : "ZAYIF 4G"}
                    </span>
                    <span className="text-[10px] text-slate-400 block font-mono">
                      {device.pendingItems > 0 ? `${device.pendingItems} paket bekliyor` : "Eşit"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

