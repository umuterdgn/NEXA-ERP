"use client"

import React, { useState } from "react"
import Link from "next/link"
import {
  GitCompare,
  Layers,
  Box,
  Sliders,
  Bell,
  CheckCircle2,
  AlertTriangle,
  ChevronLeft,
  Eye,
  Maximize2,
  FileText,
  RotateCw,
  Plus,
  Trash2,
  RefreshCw,
  Sparkles,
} from "lucide-react"
import toast from "react-hot-toast"

interface ProjectProps {
  id: string
  name: string
  code?: string | null
  status?: string | null
}

interface ChangeElement {
  id: string
  name: string
  category: "REMOVED" | "ADDED" | "MODIFIED"
  location: string
  details: string
  discipline: "Statik" | "Mimari" | "Mekanik"
}

const MOCK_CHANGES: ChangeElement[] = [
  {
    id: "elm-01",
    name: "S-104 Kolonu (60x60)",
    category: "REMOVED",
    location: "Blok-B • 3. Kat • B-4 Aksı",
    details: "Statik hesap revizyonu ile kaldırıldı, yerine 70x70 kolon ikame edildi.",
    discipline: "Statik",
  },
  {
    id: "elm-02",
    name: "S-104-REV Kolonu (70x70 + Q22)",
    category: "ADDED",
    location: "Blok-B • 3. Kat • B-4 Aksı",
    details: "Yanal deprem yükü kapasitesi artırılarak ilave boyuna donatılarla eklendi.",
    discipline: "Statik",
  },
  {
    id: "elm-03",
    name: "Ø110 Pis Su Şaft Borusu",
    category: "REMOVED",
    location: "Blok-B • Kat 3-4 Şaftı",
    details: "Kolon genişlemesi nedeniyle eski şaft güzergahı iptal edildi.",
    discipline: "Mekanik",
  },
  {
    id: "elm-04",
    name: "Ø110 Pis Su Şaftı (Yeni Aks)",
    category: "ADDED",
    location: "Blok-B • Kat 3-4 B-5 Aksı",
    details: "Kolon çakışmasını önlemek üzere 20 cm doğuya deplase edildi.",
    discipline: "Mekanik",
  },
  {
    id: "elm-05",
    name: "K-208 Kiriş Donatısı (5Q20 -> 7Q20)",
    category: "MODIFIED",
    location: "Blok-B • Kat 3 Tabliyesi",
    details: "Açıklık momenti artışı nedeniyle mesnet pilyeleri revize edildi.",
    discipline: "Statik",
  },
]

export default function ProjectRevisionDiffClient({
  project,
  locale,
}: {
  project: ProjectProps
  locale: string
}) {
  const [activeMode, setActiveMode] = useState<"2D" | "3D">("2D")
  const [selectedRevA, setSelectedRevA] = useState("REV-03 (01.11.2026)")
  const [selectedRevB, setSelectedRevB] = useState("REV-04 (04.11.2026 - Güncel)")

  // 2D Kontrolleri
  const [opacity, setOpacity] = useState(65)
  const [blendMode, setBlendMode] = useState<"difference" | "multiply" | "overlay" | "screen">("difference")
  const [viewSplit, setViewSplit] = useState<"overlay" | "side-by-side">("overlay")

  // 3D Kontrolleri
  const [showRemoved, setShowRemoved] = useState(true)
  const [showAdded, setShowAdded] = useState(true)
  const [showModified, setShowModified] = useState(true)
  const [selectedElement, setSelectedElement] = useState<ChangeElement | null>(MOCK_CHANGES[1])
  const [isBroadcasting, setIsBroadcasting] = useState(false)

  const handleBroadcastObsoleteWarning = async () => {
    try {
      setIsBroadcasting(true)
      await new Promise((resolve) => setTimeout(resolve, 800))
      toast.success(
        "📢 Sahadaki tüm mobil cihazlara 'REV-03 GEÇERSİZDİR, YENİ KOTLAR UYGULANMALI' push bildirimi iletildi!",
        { duration: 5000 }
      )
    } finally {
      setIsBroadcasting(false)
    }
  }

  return (
    <div className="max-w-[1700px] mx-auto p-4 md:p-8 space-y-6">
      {/* Üst Başlık ve Geri Dönüş */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div className="flex items-center gap-4">
          <Link
            href={`/admin/projects/${project.id}`}
            className="p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
          >
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
                REVİZYON & SÜRÜM DENETİMİ
              </span>
              <span className="text-xs text-slate-500">{project.code || "PRJ"}</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight mt-1 text-slate-900 dark:text-white">
              {project.name} • Çift Katmanlı Proje Diff & Karşılaştırma
            </h1>
          </div>
        </div>

        {/* 2D / 3D Mod Seçici & Sahaya Bildirim Butonu */}
        <div className="flex items-center gap-3">
          <div className="flex bg-slate-200 dark:bg-slate-800 p-1 rounded-xl">
            <button
              onClick={() => setActiveMode("2D")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition ${
                activeMode === "2D"
                  ? "bg-white dark:bg-blue-600 text-blue-600 dark:text-white shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <FileText className="w-4 h-4" />
              2D Plan Diff (PDF)
            </button>
            <button
              onClick={() => setActiveMode("3D")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition ${
                activeMode === "3D"
                  ? "bg-white dark:bg-blue-600 text-blue-600 dark:text-white shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <Box className="w-4 h-4" />
              3D BIM Diff Engine
            </button>
          </div>

          <button
            onClick={handleBroadcastObsoleteWarning}
            disabled={isBroadcasting}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-bold shadow-lg shadow-red-600/20 transition disabled:opacity-50"
          >
            <Bell className="w-4 h-4" />
            {isBroadcasting ? "İletiliyor..." : "Sahaya Acil Uyarı Gönder"}
          </button>
        </div>
      </div>

      {/* Revizyon Sürüm Seçici ve Özet Barı */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-white dark:bg-slate-900/80 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
            Temel Alınan Versiyon (Eski)
          </label>
          <select
            value={selectedRevA}
            onChange={(e) => setSelectedRevA(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option>REV-03 (01.11.2026)</option>
            <option>REV-02 (24.10.2026)</option>
            <option>REV-01 (12.09.2026 - Ruhsat)</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
            Karşılaştırılan Versiyon (Yeni)
          </label>
          <select
            value={selectedRevB}
            onChange={(e) => setSelectedRevB(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option>REV-04 (04.11.2026 - Güncel)</option>
            <option>REV-03 (01.11.2026)</option>
          </select>
        </div>

        <div className="flex items-center justify-between border-t md:border-t-0 md:border-l border-slate-200 dark:border-slate-800 pt-3 md:pt-0 md:pl-4">
          <div>
            <div className="text-xs text-slate-500">Tespit Edilen Değişiklik</div>
            <div className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
              <span className="text-red-500">2 Silinen</span>
              <span>•</span>
              <span className="text-emerald-500">2 Eklenen</span>
              <span>•</span>
              <span className="text-blue-500">1 Değişen</span>
            </div>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 border border-amber-500/20 text-amber-500 rounded-xl text-xs font-bold">
            <AlertTriangle className="w-3.5 h-3.5" />
            Statik Aks Kaçıklığı
          </div>
        </div>
      </div>

      {/* ================================================================== */}
      {/* 2D PLAN DIFF (PDF / GÖRSEL KARŞILAŞTIRMA)                          */}
      {/* ================================================================== */}
      {activeMode === "2D" && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Kontrol Paneli */}
          <div className="lg:col-span-1 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-6">
            <div>
              <h3 className="text-sm font-black uppercase text-slate-500 tracking-wider flex items-center gap-2">
                <Sliders className="w-4 h-4 text-blue-500" />
                2D Karışım & Filtreler
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                İki planı üst üste bindirerek milimetrik farkları ortaya çıkarın.
              </p>
            </div>

            {/* Görünüm Tipi */}
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-2">
                Görüntüleme Düzeni
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setViewSplit("overlay")}
                  className={`py-2 px-3 rounded-xl text-xs font-bold border transition ${
                    viewSplit === "overlay"
                      ? "bg-blue-50 dark:bg-blue-900/30 border-blue-500 text-blue-600 dark:text-blue-400"
                      : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400"
                  }`}
                >
                  Üst Üste Bindirme (Overlay)
                </button>
                <button
                  onClick={() => setViewSplit("side-by-side")}
                  className={`py-2 px-3 rounded-xl text-xs font-bold border transition ${
                    viewSplit === "side-by-side"
                      ? "bg-blue-50 dark:bg-blue-900/30 border-blue-500 text-blue-600 dark:text-blue-400"
                      : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400"
                  }`}
                >
                  Yan Yana (Split)
                </button>
              </div>
            </div>

            {/* Opaklık Sürgüsü */}
            <div>
              <div className="flex justify-between text-xs font-bold mb-2">
                <span className="text-slate-600 dark:text-slate-400">Yeni Plan Opaklığı</span>
                <span className="text-blue-600 dark:text-blue-400">%{opacity}</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={opacity}
                onChange={(e) => setOpacity(Number(e.target.value))}
                className="w-full accent-blue-600 cursor-pointer"
              />
            </div>

            {/* Karışım Modu (Blend Mode) */}
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-2">
                Karışım Modu (Blend Mode)
              </label>
              <div className="grid grid-cols-2 gap-2">
                {(["difference", "multiply", "overlay", "screen"] as const).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setBlendMode(mode)}
                    className={`py-2 px-3 rounded-xl text-xs font-bold capitalize border transition ${
                      blendMode === mode
                        ? "bg-blue-50 dark:bg-blue-900/30 border-blue-500 text-blue-600 dark:text-blue-400"
                        : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400"
                    }`}
                  >
                    {mode === "difference" ? "Fark (Difference)" : mode}
                  </button>
                ))}
              </div>
              <p className="text-[11px] text-slate-400 mt-2">
                Difference modu değişmeyen çizgileri siyah, yeni/silinen aksları neon renklerle parlatır.
              </p>
            </div>

            {/* Bilgi Kutusu */}
            <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-xs space-y-1">
              <div className="font-bold text-slate-900 dark:text-white">Pafta Bilgisi:</div>
              <div className="text-slate-500">Blok_B_Kat3_Statik_Kalıp_REV04.dwg</div>
              <div className="text-slate-500">Ölçek: 1/50 • Kot: +9.60 m</div>
            </div>
          </div>

          {/* 2D Canvas & Önizleme Alanı */}
          <div className="lg:col-span-3 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center min-h-[550px] relative overflow-hidden">
            {viewSplit === "overlay" ? (
              <div className="relative w-full max-w-[850px] h-[500px] border border-slate-300 dark:border-slate-700 rounded-xl overflow-hidden bg-slate-950 flex items-center justify-center">
                {/* Alt Katman: Eski Plan (REV-03) Kırmızı Vurgu */}
                <div
                  className="absolute inset-0 flex items-center justify-center pointer-events-none"
                  style={{ mixBlendMode: "normal" }}
                >
                  <svg className="w-full h-full p-8" viewBox="0 0 800 500">
                    {/* Aks Çizgileri */}
                    <line x1="100" y1="50" x2="100" y2="450" stroke="#475569" strokeDasharray="4" />
                    <line x1="300" y1="50" x2="300" y2="450" stroke="#475569" strokeDasharray="4" />
                    <line x1="500" y1="50" x2="500" y2="450" stroke="#475569" strokeDasharray="4" />
                    <line x1="700" y1="50" x2="700" y2="450" stroke="#475569" strokeDasharray="4" />

                    {/* Eski Kolon S-104 (Kırmızı diff: Silinen) */}
                    <rect x="280" y="220" width="40" height="40" fill="#ef4444" fillOpacity="0.4" stroke="#ef4444" strokeWidth="2" />
                    <text x="270" y="210" fill="#ef4444" fontSize="12" fontWeight="bold">S-104 (60x60 - SİLİNDİ)</text>

                    {/* Eski Şaft Deliği */}
                    <circle cx="340" cy="240" r="15" fill="#ef4444" fillOpacity="0.3" stroke="#ef4444" strokeDasharray="2" />
                    <text x="330" y="275" fill="#ef4444" fontSize="10">Ø110 İptal</text>

                    {/* Kiriş Hattı */}
                    <line x1="100" y1="240" x2="700" y2="240" stroke="#94a3b8" strokeWidth="3" />
                  </svg>
                </div>

                {/* Üst Katman: Yeni Plan (REV-04) Yeşil Vurgu & Blend Mode */}
                <div
                  className="absolute inset-0 flex items-center justify-center"
                  style={{
                    opacity: opacity / 100,
                    mixBlendMode: blendMode,
                  }}
                >
                  <svg className="w-full h-full p-8" viewBox="0 0 800 500">
                    {/* Yeni Kolon S-104 (Yeşil diff: Eklenen 70x70) */}
                    <rect x="275" y="215" width="50" height="50" fill="#10b981" fillOpacity="0.5" stroke="#10b981" strokeWidth="2.5" />
                    <text x="260" y="205" fill="#10b981" fontSize="12" fontWeight="bold">S-104 (70x70 - YENİ KESİT)</text>

                    {/* Yeni Şaft Güzergahı */}
                    <circle cx="480" cy="240" r="16" fill="#10b981" fillOpacity="0.5" stroke="#10b981" />
                    <text x="460" y="275" fill="#10b981" fontSize="10">Ø110 Yeni Şaft</text>

                    {/* Değişen Kiriş Donatısı */}
                    <line x1="100" y1="240" x2="700" y2="240" stroke="#3b82f6" strokeWidth="4" />
                    <text x="520" y="230" fill="#3b82f6" fontSize="11" fontWeight="bold">K-208 (7Q20)</text>
                  </svg>
                </div>

                {/* Rozet */}
                <div className="absolute bottom-4 left-4 flex items-center gap-3 bg-slate-900/90 backdrop-blur px-3 py-2 rounded-xl border border-slate-700 text-xs">
                  <div className="flex items-center gap-1.5 text-red-400 font-bold">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
                    Silinen (REV-03)
                  </div>
                  <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                    Eklenen (REV-04)
                  </div>
                  <div className="flex items-center gap-1.5 text-blue-400 font-bold">
                    <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                    Modifiye
                  </div>
                </div>
              </div>
            ) : (
              /* Yan Yana (Side-by-Side) */
              <div className="grid grid-cols-2 gap-4 w-full h-[500px]">
                <div className="border border-red-500/30 rounded-xl p-4 bg-slate-950 flex flex-col justify-between">
                  <div className="text-xs font-bold text-red-400 flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-red-500" />
                    {selectedRevA} (Eski Pafta)
                  </div>
                  <div className="flex-1 flex items-center justify-center">
                    <span className="text-sm font-semibold text-red-400">S-104 (60x60 Kolon Kesiti)</span>
                  </div>
                </div>
                <div className="border border-emerald-500/30 rounded-xl p-4 bg-slate-950 flex flex-col justify-between">
                  <div className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-emerald-500" />
                    {selectedRevB} (Onaylı Güncel Pafta)
                  </div>
                  <div className="flex-1 flex items-center justify-center">
                    <span className="text-sm font-semibold text-emerald-400">S-104 (70x70 Kolon Kesiti + Deplase Şaft)</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ================================================================== */}
      {/* 3D BIM DIFF ENGINE (SAYISAL İKİZ & ÇAKIŞMA İNCELEME)               */}
      {/* ================================================================== */}
      {activeMode === "3D" && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sol Kolon: Eleman Listesi ve Filtreler */}
          <div className="lg:col-span-1 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-5">
            <div>
              <h3 className="text-sm font-black uppercase text-slate-500 tracking-wider flex items-center gap-2">
                <Box className="w-4 h-4 text-emerald-500" />
                3D BIM Eleman Diff
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Kırmızı: Silinen | Yeşil: Yeni Eklenen | Mavi: Değişen
              </p>
            </div>

            {/* Katman Filtreleri */}
            <div className="space-y-2">
              <button
                onClick={() => setShowRemoved(!showRemoved)}
                className={`w-full flex items-center justify-between p-2.5 rounded-xl border text-xs font-bold transition ${
                  showRemoved
                    ? "bg-red-500/10 border-red-500/30 text-red-500"
                    : "border-slate-200 dark:border-slate-800 text-slate-400 opacity-60"
                }`}
              >
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded bg-red-500" />
                  <span>Silinen Elemanlar (Red Diff)</span>
                </div>
                <span>2 Adet</span>
              </button>

              <button
                onClick={() => setShowAdded(!showAdded)}
                className={`w-full flex items-center justify-between p-2.5 rounded-xl border text-xs font-bold transition ${
                  showAdded
                    ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-500"
                    : "border-slate-200 dark:border-slate-800 text-slate-400 opacity-60"
                }`}
              >
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded bg-emerald-500" />
                  <span>Yeni Eklenen Elemanlar (Green Diff)</span>
                </div>
                <span>2 Adet</span>
              </button>

              <button
                onClick={() => setShowModified(!showModified)}
                className={`w-full flex items-center justify-between p-2.5 rounded-xl border text-xs font-bold transition ${
                  showModified
                    ? "bg-blue-500/10 border-blue-500/30 text-blue-500"
                    : "border-slate-200 dark:border-slate-800 text-slate-400 opacity-60"
                }`}
              >
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded bg-blue-500" />
                  <span>Modifiye / Boyut Değişen</span>
                </div>
                <span>1 Adet</span>
              </button>
            </div>

            {/* Eleman Listesi */}
            <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                Değişiklik Listesi
              </div>
              {MOCK_CHANGES.filter((c) => {
                if (c.category === "REMOVED" && !showRemoved) return false
                if (c.category === "ADDED" && !showAdded) return false
                if (c.category === "MODIFIED" && !showModified) return false
                return true
              }).map((item) => {
                const isSelected = selectedElement?.id === item.id
                return (
                  <div
                    key={item.id}
                    onClick={() => setSelectedElement(item)}
                    className={`p-3 rounded-xl border cursor-pointer transition ${
                      isSelected
                        ? "bg-blue-50 dark:bg-blue-900/30 border-blue-500 shadow-sm"
                        : "bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700/60 hover:bg-slate-100 dark:hover:bg-slate-800"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900 dark:text-white">
                        {item.name}
                      </span>
                      <span
                        className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded ${
                          item.category === "REMOVED"
                            ? "bg-red-500/20 text-red-500"
                            : item.category === "ADDED"
                            ? "bg-emerald-500/20 text-emerald-500"
                            : "bg-blue-500/20 text-blue-500"
                        }`}
                      >
                        {item.category === "REMOVED"
                          ? "SİLİNDİ"
                          : item.category === "ADDED"
                          ? "EKLENDİ"
                          : "MODİFİYE"}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 mt-1">{item.location}</div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Sağ Kolon: 3D BIM Görselleştirme Sahnesi */}
          <div className="lg:col-span-3 bg-slate-950 p-6 rounded-2xl border border-slate-800 flex flex-col justify-between min-h-[550px] relative overflow-hidden">
            {/* 3D Sahne Kontrolleri */}
            <div className="flex items-center justify-between z-10">
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1.5 px-3 py-1 bg-emerald-500/20 text-emerald-400 rounded-xl text-xs font-bold border border-emerald-500/30">
                  <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  3D IFC / GLTF Sayısal İkiz Motoru
                </span>
                <span className="text-xs text-slate-400">LOD 350 • Statik & MEP</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => toast.success("Kamera pozisyonu sıfırlandı.")}
                  className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs transition"
                >
                  <RotateCw className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* 3D Simülasyon Görseli / Canvas Gövdesi */}
            <div className="flex-1 flex flex-col items-center justify-center my-6">
              <div className="relative w-80 h-80 flex items-center justify-center">
                {/* 3D Izgara ve Zemin */}
                <div className="absolute inset-0 border border-slate-800/80 rounded-2xl transform rotate-45 scale-90 bg-gradient-to-br from-slate-900 to-slate-950" />

                {/* 1. Silinen Kolon (Kırmızı Tel Kafes) */}
                {showRemoved && (
                  <div className="absolute w-28 h-48 border-2 border-dashed border-red-500 bg-red-500/20 rounded shadow-[0_0_25px_rgba(239,68,68,0.4)] flex flex-col items-center justify-center -translate-x-6 -translate-y-4">
                    <span className="text-[10px] font-black text-red-300">S-104 (60x60)</span>
                    <span className="text-[9px] text-red-400 font-bold">[SİLİNEN]</span>
                  </div>
                )}

                {/* 2. Yeni Eklenen Kolon (Yeşil Opak Gövde) */}
                {showAdded && (
                  <div className="absolute w-36 h-52 border-2 border-emerald-400 bg-emerald-500/35 rounded shadow-[0_0_30px_rgba(16,185,129,0.5)] flex flex-col items-center justify-center translate-x-4 translate-y-2">
                    <span className="text-[11px] font-black text-white">S-104-REV (70x70)</span>
                    <span className="text-[9px] text-emerald-300 font-bold">[YENİ EKLENEN]</span>
                  </div>
                )}

                {/* 3. Kiriş Ekseni (Mavi) */}
                {showModified && (
                  <div className="absolute w-64 h-6 border-2 border-blue-400 bg-blue-500/30 rounded -rotate-12 translate-y-20">
                    <span className="absolute -top-4 left-2 text-[9px] text-blue-300 font-bold">K-208 KİRİŞİ [DONATI DEĞİŞTİ]</span>
                  </div>
                )}
              </div>
            </div>

            {/* Seçili Eleman Detay Kartı */}
            {selectedElement && (
              <div className="bg-slate-900/90 backdrop-blur p-4 rounded-xl border border-slate-700/80 flex flex-col md:flex-row md:items-center justify-between gap-3 z-10">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-white">{selectedElement.name}</span>
                    <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                      {selectedElement.discipline}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">{selectedElement.details}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400">{selectedElement.location}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Revizyon Tarihçesi Tablosu */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Layers className="w-5 h-5 text-blue-500" />
          Proje Revizyon Günlüğü & Dağıtım Tarihçesi
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-400 uppercase">
                <th className="py-3 px-4">Revizyon No</th>
                <th className="py-3 px-4">Açıklama / Değişiklik Özeti</th>
                <th className="py-3 px-4">Disiplin</th>
                <th className="py-3 px-4">Tarih</th>
                <th className="py-3 px-4">Durum</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              <tr>
                <td className="py-3 px-4 font-bold text-emerald-500">REV-04 (Güncel)</td>
                <td className="py-3 px-4 text-slate-700 dark:text-slate-300">
                  Blok-B 3. Kat Kolon Donatı & Aks Kaçıklığı Revizyonu (S-104 70x70)
                </td>
                <td className="py-3 px-4">
                  <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 text-xs font-bold">
                    Statik & MEP
                  </span>
                </td>
                <td className="py-3 px-4 text-slate-500">04.11.2026</td>
                <td className="py-3 px-4">
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-500">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Sahada Yürürlükte
                  </span>
                </td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-bold text-red-500">REV-03 (Eski)</td>
                <td className="py-3 px-4 text-slate-700 dark:text-slate-300">
                  Blok-A & B Bodrum Kalıp ve Perde Donatı Planı
                </td>
                <td className="py-3 px-4">
                  <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs font-bold">
                    Statik
                  </span>
                </td>
                <td className="py-3 px-4 text-slate-500">01.11.2026</td>
                <td className="py-3 px-4">
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-red-500">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    Hükümsüz Kılındı
                  </span>
                </td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-bold text-slate-500">REV-02</td>
                <td className="py-3 px-4 text-slate-700 dark:text-slate-300">
                  Yangın Sprinkler ve Pis Su Şaft Revizyonu
                </td>
                <td className="py-3 px-4">
                  <span className="px-2 py-0.5 rounded bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300 text-xs font-bold">
                    Mekanik
                  </span>
                </td>
                <td className="py-3 px-4 text-slate-500">24.10.2026</td>
                <td className="py-3 px-4">
                  <span className="text-xs text-slate-500">Arşivlendi</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

