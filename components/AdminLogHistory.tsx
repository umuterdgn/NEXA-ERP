"use client"
/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * AdminLogHistory: Geçmiş Şantiye Jurnalleri Arşivi (Data Table & Timeline Görünümü)
 */

import React, { useState, useEffect, useMemo } from "react"
import {
  Calendar,
  CloudSun,
  Users,
  Truck,
  FileText,
  Search,
  Filter,
  Eye,
  RefreshCw,
  Clock,
  HardHat,
  Camera,
  X,
  ExternalLink,
  ChevronRight,
  Sun,
  CloudRain,
  Snowflake,
  Wind,
  CheckCircle2,
  Table as TableIcon,
  GitCommit,
  ShieldAlert,
  Download
} from "lucide-react"
import { getProjectLogsHistory } from "@/app/actions/dailyLog"
import { toast } from "react-hot-toast"

interface DailyLogRecord {
  id: string
  date: string | Date
  weather?: string | null
  weatherTemp?: number | null
  windSpeed?: number | null
  personnelCount: number
  equipmentData?: any
  activities?: string | null
  workDone?: string | null
  notes?: string | null
  photos?: string[]
  photoUrls?: string[]
  machineryCount?: number
  createdById?: string | null
  createdBy?: {
    id: string
    name: string | null
    email: string | null
    profileImage?: string | null
    role?: string | null
  } | null
  createdAt: string | Date
}

interface AdminLogHistoryProps {
  projectId: string
}

export default function AdminLogHistory({ projectId }: AdminLogHistoryProps) {
  const [logs, setLogs] = useState<DailyLogRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [viewMode, setViewMode] = useState<"table" | "timeline">("table")
  const [selectedLog, setSelectedLog] = useState<DailyLogRecord | null>(null)
  const [selectedImage, setSelectedImage] = useState<string | null>(null)

  const loadLogs = async () => {
    setLoading(true)
    try {
      const res = await getProjectLogsHistory(projectId)
      if (res.success && res.logs) {
        setLogs(res.logs as DailyLogRecord[])
      } else {
        toast.error(res.error || "Günlükler yüklenemedi.")
      }
    } catch (err) {
      console.error("AdminLogHistory fetch error:", err)
      toast.error("Günlükler alınırken bir sorun oluştu.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (projectId) {
      void loadLogs()
    }
  }, [projectId])

  // Filter logs by search query
  const filteredLogs = useMemo(() => {
    if (!searchQuery.trim()) return logs
    const q = searchQuery.toLowerCase()
    return logs.filter((log) => {
      const act = (log.activities || log.workDone || "").toLowerCase()
      const nts = (log.notes || "").toLowerCase()
      const wth = (log.weather || "").toLowerCase()
      const creator = (log.createdBy?.name || "").toLowerCase()
      return act.includes(q) || nts.includes(q) || wth.includes(q) || creator.includes(q)
    })
  }, [logs, searchQuery])

  // Format date helper
  const formatDate = (d: string | Date) => {
    try {
      const dateObj = new Date(d)
      return dateObj.toLocaleDateString("tr-TR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric"
      })
    } catch {
      return String(d)
    }
  }

  const isToday = (d: string | Date) => {
    try {
      const dateObj = new Date(d)
      const today = new Date()
      return (
        dateObj.getDate() === today.getDate() &&
        dateObj.getMonth() === today.getMonth() &&
        dateObj.getFullYear() === today.getFullYear()
      )
    } catch {
      return false
    }
  }

  // Aggregate photos helper
  const getLogPhotos = (log: DailyLogRecord): string[] => {
    const p1 = Array.isArray(log.photos) ? log.photos : []
    const p2 = Array.isArray(log.photoUrls) ? log.photoUrls : []
    return Array.from(new Set([...p1, ...p2]))
  }

  return (
    <div className="space-y-5">
      {/* Top Header Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-orange-600/10 text-orange-400 border border-orange-500/20 flex items-center justify-center">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                Şantiye Defteri (Geçmiş Jurnaller Arşivi)
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-orange-500/10 text-orange-400 border border-orange-500/20 font-mono">
                  {logs.length} Kayıt
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Sahadaki mühendislerin girdiği onaylı günlük raporlar, hava şartları, iş gücü ve imalat kayıtları
              </p>
            </div>
          </div>
        </div>

        {/* View Toggle & Search */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Search Box */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="İmalat, not veya mühendis ara..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-orange-500 w-48 sm:w-60"
            />
          </div>

          {/* View Mode Buttons */}
          <div className="flex items-center bg-slate-950 border border-slate-800 rounded-xl p-1">
            <button
              type="button"
              onClick={() => setViewMode("table")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
                viewMode === "table"
                  ? "bg-orange-600 text-white shadow-md shadow-orange-600/20"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <TableIcon className="w-3.5 h-3.5" />
              Tablo
            </button>
            <button
              type="button"
              onClick={() => setViewMode("timeline")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
                viewMode === "timeline"
                  ? "bg-orange-600 text-white shadow-md shadow-orange-600/20"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <GitCommit className="w-3.5 h-3.5" />
              Zaman Çizelgesi
            </button>
          </div>

          {/* Reload Button */}
          <button
            type="button"
            onClick={loadLogs}
            disabled={loading}
            title="Günlükleri Yenile"
            className="p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-300 hover:text-white transition disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-orange-400" : ""}`} />
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-16 text-center space-y-3">
          <RefreshCw className="w-8 h-8 text-orange-400 animate-spin mx-auto" />
          <p className="text-sm font-semibold text-white">Şantiye günlükleri taranıyor...</p>
          <p className="text-xs text-slate-400">Veritabanından onaylı jurnal kayıtları yükleniyor</p>
        </div>
      ) : filteredLogs.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center space-y-3">
          <FileText className="w-10 h-10 text-slate-500 mx-auto" />
          <h4 className="text-sm font-bold text-white">Kayıtlı Jurnal Bulunamadı</h4>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            {searchQuery
              ? "Arama kriterlerine uygun şantiye günlüğü bulunamadı."
              : "Bu proje için henüz personel portalından günlük jurnal girişi yapılmamış."}
          </p>
        </div>
      ) : viewMode === "table" ? (
        /* ADIM 3: DATA TABLE GÖRÜNÜMÜ */
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800 uppercase tracking-wider text-[11px] font-bold">
                <tr>
                  <th className="py-3.5 px-4">Tarih</th>
                  <th className="py-3.5 px-4">Hava</th>
                  <th className="py-3.5 px-4">Personel</th>
                  <th className="py-3.5 px-4">İmalat Özeti</th>
                  <th className="py-3.5 px-4 text-center">Ekler</th>
                  <th className="py-3.5 px-4 text-right">İşlem</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {filteredLogs.map((log) => {
                  const photos = getLogPhotos(log)
                  const act = log.activities || log.workDone || "İmalat kaydı girilmedi"
                  const personnel = log.personnelCount || 0
                  const weatherText = log.weather || (log.weatherTemp ? `${log.weatherTemp}°C` : "—")

                  return (
                    <tr
                      key={log.id}
                      className="hover:bg-slate-800/40 transition-colors group cursor-pointer"
                      onClick={() => setSelectedLog(log)}
                    >
                      {/* Tarih */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-3.5 h-3.5 text-orange-400 shrink-0" />
                          <span className="font-bold text-white font-mono">
                            {formatDate(log.date)}
                          </span>
                          {isToday(log.date) && (
                            <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-[10px] font-bold border border-emerald-500/30">
                              Bugün
                            </span>
                          )}
                        </div>
                        {log.createdBy?.name && (
                          <div className="text-[10px] text-slate-400 mt-0.5">
                            Giren: {log.createdBy.name}
                          </div>
                        )}
                      </td>

                      {/* Hava Durumu */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <CloudSun className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                          <span className="text-slate-200 font-medium">{weatherText}</span>
                        </div>
                        {log.windSpeed && (
                          <span
                            className={`text-[10px] font-mono ${
                              log.windSpeed >= 50 ? "text-red-400 font-bold" : "text-slate-400"
                            }`}
                          >
                            Rüzgar: {log.windSpeed} km/s
                          </span>
                        )}
                      </td>

                      {/* Personel */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 font-bold font-mono text-emerald-400">
                          <Users className="w-3.5 h-3.5 text-emerald-400" />
                          <span>{personnel > 0 ? `${personnel} Kişi` : "Puantaj Yok"}</span>
                        </div>
                        {log.machineryCount ? (
                          <div className="text-[10px] text-amber-400 flex items-center gap-1 mt-0.5">
                            <Truck className="w-3 h-3" />
                            <span>{log.machineryCount} İş Makinesi</span>
                          </div>
                        ) : null}
                      </td>

                      {/* İmalat Özeti */}
                      <td className="py-3.5 px-4 max-w-xs md:max-w-md">
                        <p className="text-slate-200 line-clamp-2 leading-relaxed">
                          {act.replace(/\[İmalatlar\]:\s*/g, "")}
                        </p>
                        {log.notes && (
                          <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5 italic">
                            Not: {log.notes.replace(/\[İSG ve Notlar\]:\s*/g, "")}
                          </p>
                        )}
                      </td>

                      {/* Ekler (Fotoğraflar) */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-center">
                        {photos.length > 0 ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20 font-bold text-[11px]">
                            <Camera className="w-3 h-3" />
                            {photos.length}
                          </span>
                        ) : (
                          <span className="text-slate-600 text-[11px]">—</span>
                        )}
                      </td>

                      {/* Raporu İncele Butonu */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-right">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            setSelectedLog(log)
                          }}
                          className="px-3 py-1.5 bg-orange-600/20 hover:bg-orange-600 text-orange-400 hover:text-white rounded-xl font-bold text-xs border border-orange-500/30 transition flex items-center gap-1.5 ml-auto cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Raporu İncele</span>
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* ADIM 3: TIMELINE (ZAMAN ÇİZELGESİ) GÖRÜNÜMÜ */
        <div className="relative pl-6 sm:pl-8 space-y-6 before:absolute before:left-3 sm:before:left-4 before:top-3 before:bottom-3 before:w-0.5 before:bg-gradient-to-b before:from-orange-500 before:via-slate-800 before:to-slate-900">
          {filteredLogs.map((log) => {
            const photos = getLogPhotos(log)
            const act = log.activities || log.workDone || "İmalat kaydı yok"

            return (
              <div key={log.id} className="relative group">
                {/* Node icon */}
                <div className="absolute -left-6 sm:-left-8 top-4 w-4 h-4 rounded-full bg-slate-950 border-2 border-orange-500 flex items-center justify-center group-hover:scale-125 transition" />

                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl hover:border-orange-500/40 transition space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-800">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-orange-400" />
                      <span className="text-sm font-bold text-white font-mono">
                        {formatDate(log.date)}
                      </span>
                      {isToday(log.date) && (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold border border-emerald-500/30">
                          Bugün
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3 text-xs">
                      <span className="flex items-center gap-1 text-blue-400 font-medium">
                        <CloudSun className="w-3.5 h-3.5" />
                        {log.weather || `${log.weatherTemp || "20"}°C`}
                      </span>
                      <span className="flex items-center gap-1 text-emerald-400 font-bold font-mono">
                        <Users className="w-3.5 h-3.5" />
                        {log.personnelCount || 0} Kişi
                      </span>
                      <button
                        type="button"
                        onClick={() => setSelectedLog(log)}
                        className="px-2.5 py-1 rounded-lg bg-orange-600/20 hover:bg-orange-600 text-orange-400 hover:text-white font-bold text-[11px] transition"
                      >
                        İncele →
                      </button>
                    </div>
                  </div>

                  {/* İmalat Detayı */}
                  <div className="text-xs text-slate-200 whitespace-pre-line leading-relaxed font-sans">
                    {act.replace(/\[İmalatlar\]:\s*/g, "")}
                  </div>

                  {/* Notlar & İSG */}
                  {log.notes && (
                    <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800 text-xs text-slate-300 space-y-1">
                      <span className="text-[10px] font-bold text-rose-400 flex items-center gap-1 uppercase">
                        <ShieldAlert className="w-3 h-3" /> İSG ve Özel Notlar:
                      </span>
                      <p>{log.notes.replace(/\[İSG ve Notlar\]:\s*/g, "")}</p>
                    </div>
                  )}

                  {/* Fotoğraflar Thumbnail Grid */}
                  {photos.length > 0 && (
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      {photos.slice(0, 5).map((url, i) => (
                        <div
                          key={i}
                          onClick={() => setSelectedImage(url)}
                          className="w-16 h-12 rounded-lg overflow-hidden border border-slate-800 cursor-pointer hover:opacity-80 transition relative"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={url}
                            alt="Jurnal Eki"
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ))}
                      {photos.length > 5 && (
                        <span className="text-xs text-slate-400 font-bold font-mono pl-1">
                          +{photos.length - 5} Fotoğraf
                        </span>
                      )}
                    </div>
                  )}

                  {log.createdBy?.name && (
                    <div className="text-[10px] text-slate-500 pt-1 border-t border-slate-800/60">
                      Raporu Onaylayan Saha Mühendisi: <strong className="text-slate-400">{log.createdBy.name}</strong>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Raporu İncele Modal */}
      {selectedLog && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl space-y-5 p-6 animate-in fade-in zoom-in-95">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-orange-600/20 text-orange-400 border border-orange-500/30 flex items-center justify-center">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-extrabold text-white">
                    Şantiye Jurnali Detay Raporu
                  </h3>
                  <p className="text-xs text-slate-400 font-mono">
                    Tarih: {formatDate(selectedLog.date)}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedLog(null)}
                className="p-2 rounded-xl bg-slate-950 text-slate-400 hover:text-white border border-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick KPI Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-400 block">Tarih</span>
                <span className="text-xs font-bold text-white font-mono">
                  {formatDate(selectedLog.date)}
                </span>
              </div>
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-400 block">Hava / Sıcaklık</span>
                <span className="text-xs font-bold text-blue-400">
                  {selectedLog.weather || `${selectedLog.weatherTemp || "20"}°C`}
                </span>
              </div>
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-400 block">Saha Mevcudu</span>
                <span className="text-xs font-bold text-emerald-400 font-mono">
                  {selectedLog.personnelCount || 0} Kişi
                </span>
              </div>
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-400 block">Saha Mühendisi</span>
                <span className="text-xs font-bold text-slate-200 truncate block">
                  {selectedLog.createdBy?.name || "Saha Ekibi"}
                </span>
              </div>
            </div>

            {/* Ekipman Verileri (Varsa) */}
            {selectedLog.equipmentData && typeof selectedLog.equipmentData === "object" && (
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                <span className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Truck className="w-3.5 h-3.5" /> Kullanılan Ağır İş Makineleri:
                </span>
                <div className="flex flex-wrap gap-2 pt-1">
                  {Object.entries(selectedLog.equipmentData as Record<string, number>).map(
                    ([name, count]) => (
                      <span
                        key={name}
                        className="px-2.5 py-1 rounded-lg bg-slate-900 border border-gray-800 text-xs text-white font-medium"
                      >
                        {name}: <strong className="text-amber-400 font-mono">{count}</strong>
                      </span>
                    )
                  )}
                </div>
              </div>
            )}

            {/* Yapılan İmalatlar */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" /> Günlük Yapılan İmalatlar (Teknik Detay):
              </label>
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-xs text-slate-200 whitespace-pre-line leading-relaxed font-sans min-h-[90px]">
                {(selectedLog.activities || selectedLog.workDone || "İmalat kaydı girilmedi").replace(
                  /\[İmalatlar\]:\s*/g,
                  ""
                )}
              </div>
            </div>

            {/* İSG ve Notlar */}
            {selectedLog.notes && (
              <div className="space-y-2">
                <label className="text-xs font-bold text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldAlert className="w-3.5 h-3.5" /> İSG, Gecikme ve Saha Notları:
                </label>
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-xs text-slate-300 leading-relaxed">
                  {selectedLog.notes.replace(/\[İSG ve Notlar\]:\s*/g, "")}
                </div>
              </div>
            )}

            {/* Saha Fotoğrafları Galerisi */}
            {getLogPhotos(selectedLog).length > 0 && (
              <div className="space-y-2">
                <label className="text-xs font-bold text-purple-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Camera className="w-3.5 h-3.5" /> Eklenen Saha Fotoğrafları ({getLogPhotos(selectedLog).length}):
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {getLogPhotos(selectedLog).map((photoUrl, idx) => (
                    <div
                      key={idx}
                      onClick={() => setSelectedImage(photoUrl)}
                      className="group relative aspect-video rounded-xl overflow-hidden border border-slate-800 cursor-pointer bg-slate-950"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={photoUrl}
                        alt={`Saha Fotoğrafı ${idx + 1}`}
                        className="w-full h-full object-cover group-hover:scale-105 transition"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
                        <Eye className="w-5 h-5 text-white" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Footer */}
            <div className="pt-2 flex items-center justify-end">
              <button
                type="button"
                onClick={() => setSelectedLog(null)}
                className="px-5 py-2.5 rounded-xl bg-gray-800 hover:bg-gray-700 text-white font-bold text-xs transition"
              >
                Kapat
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Image Lightbox Modal */}
      {selectedImage && (
        <div
          className="fixed inset-0 bg-black/90 z-60 flex items-center justify-center p-4"
          onClick={() => setSelectedImage(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={selectedImage}
              alt="Büyük Görünüm"
              className="max-w-full max-h-[85vh] rounded-2xl object-contain shadow-2xl border border-slate-800"
            />
            <button
              type="button"
              onClick={() => setSelectedImage(null)}
              className="absolute -top-3 -right-3 p-2 bg-red-600 text-white rounded-full shadow-lg"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
