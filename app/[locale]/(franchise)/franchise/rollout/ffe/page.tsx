"use client"
/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Franchise Rollout FF&E (Fixtures, Furniture & Equipment) Logistics Module
 * Standart Franchise Demirbaş Şablonu, Durum Takibi ve Canlı Lojistik Haritası Entegrasyonu
 */

import React, { useState, useEffect } from "react"
import Link from "next/link"
import {
  Box,
  Truck,
  MapPin,
  Clock,
  CheckCircle2,
  AlertCircle,
  PackageCheck,
  Search,
  Filter,
  RefreshCw,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  Calendar,
  Layers,
  Thermometer,
  Gauge,
  Phone,
  User,
  Radio,
  X,
  Plus,
} from "lucide-react"
import RolloutSubNav from "@/components/franchise/RolloutSubNav"
import type { FfeItem } from "@/lib/constants/franchise-constants"
import {
  getRolloutFfeData,
  updateFfeItemStatus,
} from "@/app/actions/franchise-rollout"

export default function RolloutFfePage() {
  const [items, setItems] = useState<FfeItem[]>([])
  const [stats, setStats] = useState<any>({
    totalCount: 0,
    onOrderCount: 0,
    inTransitCount: 0,
    inWarehouseCount: 0,
    installedCount: 0,
    completionRate: 0,
  })
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("ALL")
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL")
  const [storeFilter, setStoreFilter] = useState<string>("ALL")

  // Canlı Lojistik Haritası Modal State
  const [selectedLiveTracking, setSelectedLiveTracking] = useState<FfeItem | null>(null)
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  const loadData = async () => {
    try {
      setLoading(true)
      const res = await getRolloutFfeData(storeFilter)
      if (res.success && res.items) {
        setItems(res.items)
        if (res.stats) setStats(res.stats)
      }
    } catch (err) {
      console.error("FF&E verisi yüklenirken hata:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [storeFilter])

  const handleStatusChange = async (
    itemId: string,
    newStatus: "Siparişi Bekleniyor" | "Siparişte" | "Yolda" | "Depoda" | "Sahaya Kuruldu"
  ) => {
    try {
      setUpdatingId(itemId)
      const res = await updateFfeItemStatus(itemId, newStatus)
      if (res.success) {
        setItems((prev) =>
          prev.map((i) => (i.id === itemId ? { ...i, status: newStatus } : i))
        )
        // İstatistikleri anlık yeniden hesapla
        loadData()
      }
    } catch (err) {
      console.error("Status güncelleme hatası:", err)
    } finally {
      setUpdatingId(null)
    }
  }

  // Filtreleme
  const filteredItems = items.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.supplier.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.storeName.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesStatus = statusFilter === "ALL" || item.status === statusFilter
    const matchesCategory = categoryFilter === "ALL" || item.category === categoryFilter
    return matchesSearch && matchesStatus && matchesCategory
  })

  const uniqueStores = Array.from(new Set(items.map((i) => ({ id: i.storeId, name: i.storeName }))))
  const uniqueCategories = Array.from(new Set(items.map((i) => i.category)))

  return (
    <div className="w-full space-y-6 pb-12">
      {/* Sub-Nav */}
      <RolloutSubNav activeTab="ffe" />

      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-amber-400 mb-1">
            <Box className="w-4 h-4 text-amber-400" />
            <span>Franchise Demirbaş & Ekipman Yönetimi</span>
            <span className="text-slate-600">•</span>
            <span className="text-slate-400">FF&E Lojistik & Canlı GPS Entegrasyonu</span>
          </div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            FF&E Demirbaş Lojistiği & Canlı Takip
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Standart Şablon & GPS Telemetri
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-1 max-w-3xl">
            İnşaat malzemesinden bağımsız olarak franchise standart mobilya, mutfak, barista ekipmanları (Espresso, Buz Makinesi), POS ve ışıklı tabela lojistiği anlık takip edilir. Yoldaki demirbaşlar canlı lojistik haritasına bağlıdır.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={loadData}
            disabled={loading}
            className="px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 hover:border-slate-600 text-xs text-slate-300 flex items-center gap-2 hover:bg-slate-800 transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            Yenile
          </button>

          <Link
            href="/franchise/rollout/board"
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 border border-slate-700 text-xs font-medium text-slate-200 flex items-center gap-2 transition"
          >
            <Layers className="w-3.5 h-3.5 text-amber-400" />
            Rollout Kanban Panosu
          </Link>
        </div>
      </div>

      {/* KPI METRIC CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3.5">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">
            Toplam Demirbaş
          </div>
          <div className="text-2xl font-bold text-white mt-1">{stats.totalCount}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Katalog kalemi</div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3.5">
          <div className="text-[11px] font-semibold text-sky-400 uppercase tracking-wide">
            Siparişte
          </div>
          <div className="text-2xl font-bold text-sky-300 mt-1">{stats.onOrderCount}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Üretim / Tedarikte</div>
        </div>

        <div className="bg-slate-900/60 border border-amber-500/30 rounded-xl p-3.5 relative overflow-hidden">
          <div className="absolute -right-2 -bottom-2 opacity-10">
            <Truck className="w-16 h-16 text-amber-400" />
          </div>
          <div className="text-[11px] font-semibold text-amber-400 uppercase tracking-wide flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
            Yolda (Canlı GPS)
          </div>
          <div className="text-2xl font-bold text-amber-300 mt-1">{stats.inTransitCount}</div>
          <div className="text-[10px] text-amber-400/80 mt-0.5">Sevkiyat halinde</div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3.5">
          <div className="text-[11px] font-semibold text-indigo-400 uppercase tracking-wide">
            Depoda
          </div>
          <div className="text-2xl font-bold text-indigo-300 mt-1">{stats.inWarehouseCount}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Sahaya teslime hazır</div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3.5">
          <div className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wide">
            Sahaya Kuruldu
          </div>
          <div className="text-2xl font-bold text-emerald-300 mt-1">{stats.installedCount}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Montaj tamamlandı</div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3.5">
          <div className="text-[11px] font-semibold text-slate-300 uppercase tracking-wide">
            Kurulum Oranı
          </div>
          <div className="text-2xl font-bold text-amber-400 mt-1">%{stats.completionRate}</div>
          <div className="w-full bg-slate-800 rounded-full h-1.5 mt-1 overflow-hidden">
            <div
              className="bg-amber-400 h-1.5 rounded-full"
              style={{ width: `${stats.completionRate}%` }}
            />
          </div>
        </div>
      </div>

      {/* FILTER CONTROLS */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2.5 flex-1 w-full md:w-auto">
          <div className="relative flex-1 md:w-72">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Demirbaş adı, kod veya tedarikçi ara..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* Şube Seçici */}
          <select
            value={storeFilter}
            onChange={(e) => setStoreFilter(e.target.value)}
            className="bg-slate-950 border border-slate-700 text-xs text-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:border-amber-500"
          >
            <option value="ALL">Tüm Şubeler</option>
            {uniqueStores.map((st) => (
              <option key={st.id} value={st.id}>
                {st.name}
              </option>
            ))}
          </select>

          {/* Kategori Seçici */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-slate-950 border border-slate-700 text-xs text-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:border-amber-500 hidden sm:block"
          >
            <option value="ALL">Tüm Kategoriler</option>
            {uniqueCategories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        {/* Status Tab Filter */}
        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
          {[
            { key: "ALL", label: "Tümü" },
            { key: "Siparişi Bekleniyor", label: "Bekleniyor" },
            { key: "Siparişte", label: "Siparişte" },
            { key: "Yolda", label: "Yolda" },
            { key: "Depoda", label: "Depoda" },
            { key: "Sahaya Kuruldu", label: "Kuruldu" },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setStatusFilter(tab.key)}
              className={`px-3 py-1.5 rounded-lg font-medium transition ${statusFilter === tab.key
                  ? "bg-amber-500 text-slate-950 font-bold shadow"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
                }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* FF&E DATAGRID */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-950/80 border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3.5 px-4">Kod & Demirbaş Adı</th>
                <th className="py-3.5 px-3">Kategori</th>
                <th className="py-3.5 px-3">Hedef Şube</th>
                <th className="py-3.5 px-3 text-center">Miktar</th>
                <th className="py-3.5 px-3">Tedarikçi</th>
                <th className="py-3.5 px-3">Planlanan Tarih</th>
                <th className="py-3.5 px-4 text-center">Lojistik Durumu</th>
                <th className="py-3.5 px-4 text-right">Canlı Takip / İşlem</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-200">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500">
                    <Box className="w-8 h-8 text-slate-600 mx-auto mb-2 opacity-50" />
                    <span>Filtre kriterlerine uygun demirbaş kaydı bulunamadı.</span>
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => {
                  const isUpdating = updatingId === item.id
                  const isYolda = item.status === "Yolda"

                  // Durum rozeti renkleri
                  const statusColors: any = {
                    "Siparişi Bekleniyor": "bg-purple-500/10 text-purple-400 border-purple-500/30",
                    Siparişte: "bg-sky-500/10 text-sky-400 border-sky-500/30",
                    Yolda: "bg-amber-500/10 text-amber-300 border-amber-500/40 ring-1 ring-amber-500/20",
                    Depoda: "bg-indigo-500/10 text-indigo-400 border-indigo-500/30",
                    "Sahaya Kuruldu": "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
                  }[item.status] || "bg-slate-800 text-slate-400 border-slate-700"

                  return (
                    <tr
                      key={item.id}
                      className="hover:bg-slate-850/60 transition-colors group"
                    >
                      {/* Ürün & Kod */}
                      <td className="py-3 px-4">
                        <div className="font-bold text-white group-hover:text-amber-300 transition-colors">
                          {item.name}
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-slate-500 font-mono mt-0.5">
                          <span>{item.code}</span>
                          {item.serialNo && (
                            <>
                              <span>•</span>
                              <span>SN: {item.serialNo}</span>
                            </>
                          )}
                        </div>
                      </td>

                      {/* Kategori */}
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded-md bg-slate-800 text-[11px] text-slate-300 border border-slate-700">
                          {item.category}
                        </span>
                      </td>

                      {/* Şube */}
                      <td className="py-3 px-3">
                        <div className="font-medium text-slate-300 line-clamp-1">
                          {item.storeName}
                        </div>
                      </td>

                      {/* Miktar */}
                      <td className="py-3 px-3 text-center">
                        <span className="font-bold text-white bg-slate-950 px-2 py-1 rounded-md border border-slate-800">
                          {item.quantity} {item.unit}
                        </span>
                      </td>

                      {/* Tedarikçi */}
                      <td className="py-3 px-3 text-slate-400">
                        <span className="truncate block max-w-[150px]">{item.supplier}</span>
                      </td>

                      {/* Tarih */}
                      <td className="py-3 px-3 text-slate-400">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-slate-500" />
                          <span>{item.etaDate}</span>
                        </div>
                      </td>

                      {/* Durum Dropdown */}
                      <td className="py-3 px-4 text-center">
                        <select
                          disabled={isUpdating}
                          value={item.status}
                          onChange={(e) =>
                            handleStatusChange(item.id, e.target.value as any)
                          }
                          className={`text-xs font-semibold rounded-lg px-2.5 py-1.5 border focus:outline-none focus:ring-1 focus:ring-amber-500 transition cursor-pointer ${statusColors}`}
                        >
                          <option value="Siparişi Bekleniyor" className="bg-slate-900 text-purple-400">
                            ⏳ Siparişi Bekleniyor
                          </option>
                          <option value="Siparişte" className="bg-slate-900 text-sky-400">
                            Siparişte
                          </option>
                          <option value="Yolda" className="bg-slate-900 text-amber-400">
                            🚚 Yolda
                          </option>
                          <option value="Depoda" className="bg-slate-900 text-indigo-400">
                            Depoda
                          </option>
                          <option value="Sahaya Kuruldu" className="bg-slate-900 text-emerald-400">
                            ✓ Sahaya Kuruldu
                          </option>
                        </select>
                      </td>

                      {/* Canlı Takip Butonu */}
                      <td className="py-3 px-4 text-right">
                        {isYolda ? (
                          <button
                            onClick={() => setSelectedLiveTracking(item)}
                            className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-[11px] inline-flex items-center gap-1.5 shadow-md shadow-amber-500/20 animate-pulse transition"
                          >
                            <Radio className="w-3.5 h-3.5" />
                            Canlı Harita
                          </button>
                        ) : (
                          <span className="text-[11px] text-slate-600 italic">
                            {item.status === "Sahaya Kuruldu" ? "Teslim Edildi" : "Sevkiyat Bekliyor"}
                          </span>
                        )}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CANLI LOJİSTİK HARİTASI MODAL & TELEMETRİ DRAWER */}
      {selectedLiveTracking && selectedLiveTracking.trackingInfo && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-slate-900 border border-amber-500/50 rounded-2xl w-full max-w-3xl shadow-2xl p-6 relative overflow-hidden">
            {/* Top Bar Accent */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 via-emerald-400 to-amber-500" />

            <div className="flex items-start justify-between gap-4 mb-4 pb-3 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-lg shadow-amber-500/10">
                  <Truck className="w-6 h-6 animate-bounce" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded">
                      GPS Canlı Sevkiyat Telemetrisi
                    </span>
                    <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full font-semibold">
                      <Radio className="w-3 h-3 animate-ping" /> Sinyal Aktif
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-white mt-0.5">
                    {selectedLiveTracking.name}
                  </h3>
                  <p className="text-xs text-slate-400">
                    Hedef Şube: <strong className="text-amber-400">{selectedLiveTracking.storeName}</strong>
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSelectedLiveTracking(null)}
                className="text-slate-500 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Simüle Edilmiş Canlı Rota Harita Görseli */}
            <div className="relative w-full h-56 bg-slate-950 rounded-xl border border-slate-800 overflow-hidden mb-4 flex items-center justify-center">
              {/* Harita Arka Plan Grid */}
              <div className="absolute inset-0 bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:16px_16px] opacity-40" />

              {/* Rota Çizgisi */}
              <div className="absolute w-3/4 h-1 bg-gradient-to-r from-sky-500 via-amber-400 to-emerald-400 rounded-full" />

              {/* Başlangıç Noktası */}
              <div className="absolute left-12 flex flex-col items-center">
                <div className="w-8 h-8 rounded-full bg-sky-500/20 border-2 border-sky-400 flex items-center justify-center text-sky-300 shadow-lg shadow-sky-500/30">
                  <Box className="w-4 h-4" />
                </div>
                <span className="text-[10px] font-bold text-sky-400 mt-1">
                  {selectedLiveTracking.trackingInfo.originCity}
                </span>
                <span className="text-[9px] text-slate-500">Çıkış Noktası</span>
              </div>

              {/* Araç Canlı Konumu (Pulse) */}
              <div className="absolute left-1/2 -translate-x-1/2 flex flex-col items-center">
                <div className="relative">
                  <span className="absolute -inset-2 rounded-full bg-amber-400 opacity-40 animate-ping" />
                  <div className="w-10 h-10 rounded-full bg-amber-500 text-slate-950 font-bold flex items-center justify-center shadow-xl shadow-amber-500/40 border-2 border-white">
                    <Truck className="w-5 h-5" />
                  </div>
                </div>
                <span className="text-[11px] font-bold text-amber-300 mt-1.5 bg-slate-900/90 px-2 py-0.5 rounded border border-amber-500/30">
                  {selectedLiveTracking.trackingInfo.currentCity}
                </span>
                <span className="text-[9px] text-amber-400/90">
                  {selectedLiveTracking.trackingInfo.speedKmH} km/s • Seyir Halinde
                </span>
              </div>

              {/* Varış Noktası */}
              <div className="absolute right-12 flex flex-col items-center">
                <div className="w-8 h-8 rounded-full bg-emerald-500/20 border-2 border-emerald-400 flex items-center justify-center text-emerald-300 shadow-lg shadow-emerald-500/30">
                  <MapPin className="w-4 h-4" />
                </div>
                <span className="text-[10px] font-bold text-emerald-400 mt-1">
                  {selectedLiveTracking.trackingInfo.destinationCity}
                </span>
                <span className="text-[9px] text-slate-500">Varış Şantiyesi</span>
              </div>
            </div>

            {/* Telemetri Verileri */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs mb-4">
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                <span className="text-slate-500 text-[10px] block">Araç Plakası & Taşıyıcı:</span>
                <span className="font-bold text-white text-sm">
                  {selectedLiveTracking.trackingInfo.plateNumber}
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5">
                  {selectedLiveTracking.trackingInfo.carrierName}
                </span>
              </div>

              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                <span className="text-slate-500 text-[10px] block">Sürücü İletişim:</span>
                <span className="font-bold text-white text-sm">
                  {selectedLiveTracking.trackingInfo.driverName}
                </span>
                <span className="text-[10px] text-amber-400 block mt-0.5 flex items-center gap-1">
                  <Phone className="w-3 h-3" />
                  {selectedLiveTracking.trackingInfo.driverPhone}
                </span>
              </div>

              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                <span className="text-slate-500 text-[10px] block">Tahmini Varış (ETA):</span>
                <span className="font-bold text-emerald-400 text-sm">
                  {selectedLiveTracking.trackingInfo.etaRemaining}
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5">
                  Trafik: Akıcı / Normal
                </span>
              </div>

              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                <span className="text-slate-500 text-[10px] block">Kasa Sıcaklığı / İklim:</span>
                <span className="font-bold text-sky-400 text-sm flex items-center gap-1">
                  <Thermometer className="w-4 h-4 text-sky-400" />
                  {selectedLiveTracking.trackingInfo.cargoTemp || "+20°C"}
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5">
                  Hassas Elektronik Korumalı
                </span>
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-800 text-xs">
              <span className="text-[10px] text-slate-500">
                Koordinat: {selectedLiveTracking.trackingInfo.currentLat},{" "}
                {selectedLiveTracking.trackingInfo.currentLng} • IoT Telemetry v2.4
              </span>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    handleStatusChange(selectedLiveTracking.id, "Sahaya Kuruldu")
                    setSelectedLiveTracking(null)
                  }}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-emerald-600/20 transition"
                >
                  <PackageCheck className="w-4 h-4" />
                  Şantiyede Teslim Alındı & Kuruldu Olarak İşaretle
                </button>
                <button
                  onClick={() => setSelectedLiveTracking(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium transition"
                >
                  Kapat
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

