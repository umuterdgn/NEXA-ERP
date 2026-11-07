"use client"
/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Franchise Rollout Punch List (QA & Snagging) Module
 * Mobil Uyumlu Saha Kusur Girişi, Otomatik Taşeron DÖF (İş Emri) ve Pre-Opening Açılış Kilidi
 */

import React, { useState, useEffect, useRef } from "react"
import Link from "next/link"
import {
  ClipboardCheck,
  AlertTriangle,
  Lock,
  Unlock,
  CheckCircle2,
  Clock,
  Camera,
  Upload,
  Plus,
  RefreshCw,
  Search,
  Filter,
  Image as ImageIcon,
  Building2,
  MapPin,
  Calendar,
  Layers,
  ArrowRight,
  ShieldCheck,
  Check,
  X,
  ExternalLink,
  ChevronRight,
  UserCheck,
  Hammer,
  AlertOctagon,
} from "lucide-react"
import RolloutSubNav from "@/components/franchise/RolloutSubNav"
import {
  getRolloutPunchListData,
  createRolloutPunchListItem,
  updateRolloutPunchStatus,
  PunchListItemExt,
} from "@/app/actions/franchise-rollout"

export default function RolloutPunchListPage() {
  const [items, setItems] = useState<PunchListItemExt[]>([])
  const [stats, setStats] = useState<any>({
    totalCount: 0,
    openCount: 0,
    fixedCount: 0,
    verifiedCount: 0,
    isPreOpeningBlocked: true,
    verificationRate: 0,
  })
  const [loading, setLoading] = useState(true)
  const [storeFilter, setStoreFilter] = useState("ALL")
  const [statusFilter, setStatusFilter] = useState("ALL")
  const [searchQuery, setSearchQuery] = useState("")

  // Mobil Uyumlu Yeni Kusur Girişi Modal
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [previewPhoto, setPreviewPhoto] = useState<string | null>(null)
  const [cameraMode, setCameraMode] = useState<"LIVE" | "FILE">("LIVE")
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  // Form State
  const [formData, setFormData] = useState({
    storeId: "store-kadikoy",
    subcontractorId: "sub-1",
    subcontractorName: "Delta Elektrik & Aydınlatma Taahhüt Ltd.",
    defectDesc: "",
    locationFloor: "Zemin Kat - Giriş Cephesi",
    priority: "YUKSEK" as "KRITIK" | "YUKSEK" | "NORMAL" | "DUSUK",
    deadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
  })

  // Fotoğraf Büyütme Modal
  const [enlargedPhoto, setEnlargedPhoto] = useState<string | null>(null)

  const loadData = async () => {
    try {
      setLoading(true)
      const res = await getRolloutPunchListData(storeFilter)
      if (res.success && res.items) {
        setItems(res.items)
        if (res.stats) setStats(res.stats)
      }
    } catch (err) {
      console.error("Punch list yüklenirken hata:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [storeFilter])

  // Fotoğraf Yakalama & Filigran Ekleme
  const handlePhotoCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = () => {
      setPreviewPhoto(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  // Yeni Kusur Gönderimi (Otomatik DÖF Tetikleme)
  const handleSubmitDefect = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.defectDesc.trim()) {
      alert("Lütfen kusur açıklamasını yazınız.")
      return
    }

    try {
      setSubmitting(true)
      const res = await createRolloutPunchListItem({
        ...formData,
        photoUrl: previewPhoto || undefined,
      })

      if (res.success) {
        setIsModalOpen(false)
        setPreviewPhoto(null)
        setFormData((prev) => ({ ...prev, defectDesc: "" }))
        alert("Kusur kaydı açıldı ve ilgili taşerona otomatik DÖF (İş Emri) iletildi.")
        loadData()
      } else {
        alert(res.error || "Kayıt başarısız")
      }
    } catch (err: any) {
      alert("Hata oluştu: " + err.message)
    } finally {
      setSubmitting(false)
    }
  }

  // Durum İlerlemesi (OPEN -> FIXED -> VERIFIED)
  const handleStatusChange = async (
    itemId: string,
    newStatus: "OPEN" | "FIXED" | "VERIFIED"
  ) => {
    try {
      const res = await updateRolloutPunchStatus(itemId, newStatus)
      if (res.success) {
        loadData()
      }
    } catch (err) {
      console.error("Status update error:", err)
    }
  }

  const filteredItems = items.filter((item) => {
    const matchesSearch =
      item.defectDesc.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.storeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.subcontractorName.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === "ALL" || item.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const uniqueStores = Array.from(new Set(items.map((i) => ({ id: i.storeId, name: i.storeName }))))

  return (
    <div className="w-full space-y-6 pb-12">
      {/* Sub-Nav */}
      <RolloutSubNav activeTab="punch-list" />

      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-amber-400 mb-1">
            <ClipboardCheck className="w-4 h-4 text-amber-400" />
            <span>Saha Kalite ve Son Teslim Denetimi</span>
            <span className="text-slate-600">•</span>
            <span className="text-slate-400">Pre-Opening Blocker Engine</span>
          </div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            Punch List & Pre-Opening Açılış Kilidi
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20 font-bold">
              Otomatik Taşeron DÖF Entegre
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-1 max-w-3xl">
            Saha denetmenleri ve bölge müdürleri kusurları mobilden anında fotoğraflayıp kaydeder. Sistem taşeronlara otomatik DÖF (İş Emri) açar. Tüm kusurlar VERIFIED olmadan şube Açılışa Hazır (Pre-Opening) statüsüne geçirilemez.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
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
            Rollout Kanban
          </Link>

          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-purple-600/25 transition"
          >
            <Camera className="w-4 h-4" />
            Sahadan Yeni Kusur Kaydet (Mobil Form)
          </button>
        </div>
      </div>

      {/* ADIM 4: PRE-OPENING AÇILIŞ KİLİDİ BANNER'I */}
      <div
        className={`rounded-2xl p-4.5 border transition-all ${
          stats.isPreOpeningBlocked
            ? "bg-rose-950/40 border-rose-500/40 text-rose-200"
            : "bg-emerald-950/40 border-emerald-500/40 text-emerald-200"
        }`}
      >
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3.5">
            <div
              className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                stats.isPreOpeningBlocked
                  ? "bg-rose-500/20 text-rose-400 border border-rose-500/40 shadow-lg shadow-rose-500/20"
                  : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-lg shadow-emerald-500/20"
              }`}
            >
              {stats.isPreOpeningBlocked ? (
                <Lock className="w-6 h-6 animate-pulse" />
              ) : (
                <Unlock className="w-6 h-6" />
              )}
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span
                  className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${
                    stats.isPreOpeningBlocked
                      ? "bg-rose-500/20 text-rose-300 border-rose-500/30"
                      : "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                  }`}
                >
                  {stats.isPreOpeningBlocked ? "Açılış Kilidi Devrede (Kilitli)" : "Açılış Kilidi Açık"}
                </span>
                <span className="text-xs text-slate-400">• Pre-Opening Gate Control</span>
              </div>

              <h3 className="text-base font-bold text-white mt-0.5">
                {stats.isPreOpeningBlocked
                  ? `Şubede ${stats.openCount + stats.fixedCount} Adet Onay Bekleyen Kusur Bulunuyor`
                  : "Sıfır Hata Şartı Sağlandı (Tüm Kusurlar Doğrulandı)"}
              </h3>
              <p className="text-xs text-slate-300 max-w-3xl">
                {stats.isPreOpeningBlocked
                  ? "Punch List'teki tüm eksikler giderilip Bölge Müdürü tarafından 'VERIFIED' olarak onaylanmadan şube 'Açılışa Hazır' (Pre-Opening) sütununa geçirilemez."
                  : "Tüm saha eksikleri giderilmiş ve onaylanmıştır. Şube resmi olarak Açılışa Hazır (Pre-Opening) durumuna taşınabilir."}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <span className="text-[11px] text-slate-400 block">Doğrulama Başarısı:</span>
              <span className="text-xl font-bold text-white">%{stats.verificationRate}</span>
            </div>
            <div className="w-20 bg-slate-800 rounded-full h-2 overflow-hidden">
              <div
                className={`h-2 rounded-full ${
                  stats.isPreOpeningBlocked ? "bg-amber-400" : "bg-emerald-400"
                }`}
                style={{ width: `${stats.verificationRate}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* METRİK KARTLARI */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3.5">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">
            Toplam Kusur Kaydı
          </div>
          <div className="text-2xl font-bold text-white mt-1">{stats.totalCount}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Denetimde açılan maddeler</div>
        </div>

        <div className="bg-slate-900/60 border border-rose-500/30 rounded-xl p-3.5">
          <div className="text-[11px] font-semibold text-rose-400 uppercase tracking-wide">
            Açık Kusurlar (OPEN)
          </div>
          <div className="text-2xl font-bold text-rose-300 mt-1">{stats.openCount}</div>
          <div className="text-[10px] text-rose-400/80 mt-0.5">Taşeron müdahalesi bekliyor</div>
        </div>

        <div className="bg-slate-900/60 border border-amber-500/30 rounded-xl p-3.5">
          <div className="text-[11px] font-semibold text-amber-400 uppercase tracking-wide">
            Düzeltildi (FIXED)
          </div>
          <div className="text-2xl font-bold text-amber-300 mt-1">{stats.fixedCount}</div>
          <div className="text-[10px] text-amber-400/80 mt-0.5">Bölge Md. onayı bekliyor</div>
        </div>

        <div className="bg-slate-900/60 border border-emerald-500/30 rounded-xl p-3.5">
          <div className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wide">
            Onaylandı (VERIFIED)
          </div>
          <div className="text-2xl font-bold text-emerald-300 mt-1">{stats.verifiedCount}</div>
          <div className="text-[10px] text-emerald-400/80 mt-0.5">Kabul edildi & kapatıldı</div>
        </div>
      </div>

      {/* FİLTRE VE ARAMA */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Kusur açıklaması, taşeron veya şube ara..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
          />
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <select
            value={storeFilter}
            onChange={(e) => setStoreFilter(e.target.value)}
            className="bg-slate-950 border border-slate-700 text-xs text-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:border-purple-500"
          >
            <option value="ALL">Tüm Şubeler</option>
            {uniqueStores.map((st) => (
              <option key={st.id} value={st.id}>
                {st.name}
              </option>
            ))}
          </select>

          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
            {[
              { key: "ALL", label: "Tümü" },
              { key: "OPEN", label: "Açık" },
              { key: "FIXED", label: "Düzeltildi" },
              { key: "VERIFIED", label: "Onaylandı" },
            ].map((t) => (
              <button
                key={t.key}
                onClick={() => setStatusFilter(t.key)}
                className={`px-3 py-1.5 rounded-lg font-medium transition ${
                  statusFilter === t.key
                    ? "bg-purple-600 text-white font-bold shadow"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* PUNCH LIST KARTLARI / DATAGRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredItems.length === 0 ? (
          <div className="col-span-full py-16 bg-slate-900/40 border border-slate-800 rounded-2xl flex flex-col items-center justify-center text-slate-500">
            <ClipboardCheck className="w-10 h-10 text-slate-600 mb-2 opacity-50" />
            <span className="text-sm font-semibold">Filtre kriterlerine uygun kusur kaydı bulunamadı.</span>
            <span className="text-xs text-slate-600 mt-1">Yeni bir kusur eklemek için üstteki butona tıklayın.</span>
          </div>
        ) : (
          filteredItems.map((item) => {
            const statusConfig = {
              OPEN: {
                label: "Açık / Müdahale Bekliyor",
                bg: "bg-rose-500/10 text-rose-400 border-rose-500/30",
                badge: "OPEN",
              },
              FIXED: {
                label: "Düzeltildi / Onay Bekliyor",
                bg: "bg-amber-500/10 text-amber-300 border-amber-500/40",
                badge: "FIXED",
              },
              VERIFIED: {
                label: "Onaylandı / Kapatıldı",
                bg: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
                badge: "VERIFIED",
              },
            }[item.status]

            const priorityBadge = {
              KRITIK: "bg-rose-600 text-white font-black",
              YUKSEK: "bg-orange-500/20 text-orange-400 border border-orange-500/40 font-bold",
              NORMAL: "bg-slate-800 text-slate-300 font-medium",
              DUSUK: "bg-slate-900 text-slate-500",
            }[item.priority]

            return (
              <div
                key={item.id}
                className="bg-slate-900/70 border border-slate-800 hover:border-slate-700 rounded-2xl p-4 shadow-lg flex flex-col justify-between transition-all group"
              >
                <div>
                  {/* Card Top: Priority & Status */}
                  <div className="flex items-center justify-between gap-2 mb-2.5">
                    <span className={`text-[10px] px-2 py-0.5 rounded uppercase tracking-wider ${priorityBadge}`}>
                      {item.priority} Öncelik
                    </span>

                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${statusConfig.bg}`}>
                      {statusConfig.badge}
                    </span>
                  </div>

                  {/* Defect Title / Description */}
                  <h4 className="text-sm font-bold text-white group-hover:text-purple-300 transition-colors leading-snug line-clamp-2 mb-2">
                    {item.defectDesc}
                  </h4>

                  {/* Location & Store */}
                  <div className="space-y-1 text-xs text-slate-400 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80 mb-3">
                    <div className="flex items-center gap-1.5 font-medium text-slate-300 truncate">
                      <Building2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <span className="truncate">{item.storeName}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                      <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      <span>{item.locationFloor}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px] text-purple-300 pt-1 border-t border-slate-900">
                      <Hammer className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                      <span className="truncate">Atanan: {item.subcontractorName}</span>
                    </div>
                  </div>

                  {/* Photo Preview if exists */}
                  {item.photoUrl && (
                    <div
                      onClick={() => setEnlargedPhoto(item.photoUrl)}
                      className="relative w-full h-36 bg-slate-950 rounded-xl overflow-hidden border border-slate-800 mb-3 cursor-pointer group/img"
                    >
                      <img
                        src={item.photoUrl}
                        alt="Kusur Fotoğrafı"
                        className="w-full h-full object-cover group-hover/img:scale-105 transition duration-300"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 flex items-center justify-center transition">
                        <span className="px-2.5 py-1 rounded bg-black/70 text-[11px] text-white font-semibold flex items-center gap-1">
                          <ImageIcon className="w-3.5 h-3.5" /> Büyüt
                        </span>
                      </div>
                      <div className="absolute bottom-1.5 left-2 bg-black/70 px-2 py-0.5 rounded text-[9px] text-slate-300 font-mono">
                        GPS & Zaman Damgalı
                      </div>
                    </div>
                  )}

                  {/* Deadline & Created info */}
                  <div className="flex items-center justify-between text-[11px] text-slate-400 mb-3">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-slate-500" />
                      Termin: <strong className="text-slate-300">{item.deadline}</strong>
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">
                      Task ID: {item.taskId || "Auto-DÖF"}
                    </span>
                  </div>
                </div>

                {/* Status Transition Action Buttons */}
                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
                  {item.status === "OPEN" && (
                    <button
                      onClick={() => handleStatusChange(item.id, "FIXED")}
                      className="w-full py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 text-xs font-bold flex items-center justify-center gap-1.5 transition"
                    >
                      <Hammer className="w-3.5 h-3.5" />
                      Taşeron Düzeltmesi (FIXED Yap)
                    </button>
                  )}

                  {item.status === "FIXED" && (
                    <div className="w-full flex items-center gap-2">
                      <button
                        onClick={() => handleStatusChange(item.id, "VERIFIED")}
                        className="flex-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center justify-center gap-1 shadow-md shadow-emerald-600/20 transition"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Sahada Onayla (VERIFIED)
                      </button>
                      <button
                        onClick={() => handleStatusChange(item.id, "OPEN")}
                        title="Kusur tam giderilmemiş, tekrar aç"
                        className="px-2.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-rose-400 text-xs font-semibold transition"
                      >
                        Reddet
                      </button>
                    </div>
                  )}

                  {item.status === "VERIFIED" && (
                    <div className="w-full py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold flex items-center justify-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-emerald-400" />
                      Bölge Müdürü Tarafından Onaylandı
                    </div>
                  )}
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* MOBİL UYUMLU YENİ KUSUR GİRİŞİ MODALI */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-slate-900 border border-purple-500/40 rounded-2xl w-full max-w-lg shadow-2xl p-6 relative max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between gap-4 mb-4 pb-3 border-b border-slate-800">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-purple-400 bg-purple-500/10 border border-purple-500/20 px-2 py-0.5 rounded">
                  Saha Denetim & Snagging Formu
                </span>
                <h3 className="text-lg font-bold text-white mt-1">Yeni Kusur / Eksik Kaydı</h3>
                <p className="text-xs text-slate-400">
                  Kaydedilen kusur sorumlu taşeronun paneline anında DÖF (İş Emri) olarak düşer.
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-500 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitDefect} className="space-y-4 text-xs">
              {/* Şube Seçimi */}
              <div>
                <label className="text-slate-300 font-semibold block mb-1">Şube / Proje:</label>
                <select
                  value={formData.storeId}
                  onChange={(e) => setFormData({ ...formData, storeId: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-purple-500"
                >
                  <option value="store-kadikoy">Kadıköy Moda Caddesi Şubesi</option>
                  <option value="store-nisantasi">Nişantaşı City's AVM Şubesi</option>
                  <option value="store-cankaya">Ankara Çankaya Tunalı Şubesi</option>
                  <option value="store-alsancak">İzmir Alsancak Kordon Şubesi</option>
                  <option value="store-bursa">Bursa Korupark Kiosk Şubesi</option>
                </select>
              </div>

              {/* Kusur Açıklaması */}
              <div>
                <label className="text-slate-300 font-semibold block mb-1">
                  Kusur Açıklaması: <span className="text-rose-400">*</span>
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Örn: Müşteri lavabosu batarya altından sızdırıyor, basınç düşürücü ve teflon yenilenmeli..."
                  value={formData.defectDesc}
                  onChange={(e) => setFormData({ ...formData, defectDesc: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-white text-xs placeholder-slate-500 focus:outline-none focus:border-purple-500"
                />
              </div>

              {/* Kat / Mahal ve Sorumlu Taşeron */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Kat / Mahal:</label>
                  <input
                    type="text"
                    placeholder="Örn: Zemin Kat Bar Arkası"
                    value={formData.locationFloor}
                    onChange={(e) => setFormData({ ...formData, locationFloor: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Sorumlu Taşeron:</label>
                  <select
                    value={formData.subcontractorName}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        subcontractorName: e.target.value,
                        subcontractorId: e.target.value.includes("Elektrik")
                          ? "sub-1"
                          : e.target.value.includes("Alçıpan")
                          ? "sub-2"
                          : "sub-3",
                      })
                    }
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-purple-500"
                  >
                    <option value="Delta Elektrik & Aydınlatma Taahhüt Ltd.">
                      Delta Elektrik & Aydınlatma
                    </option>
                    <option value="Aksoy Alçıpan & Boya Sanayi">
                      Aksoy Alçıpan & Boya
                    </option>
                    <option value="Marmara Sıhhi Tesisat & Mekanik">
                      Marmara Sıhhi Tesisat
                    </option>
                    <option value="NeonLine Reklam & Tabela">
                      NeonLine Tabela
                    </option>
                  </select>
                </div>
              </div>

              {/* Öncelik & Termin */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Öncelik:</label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-purple-500"
                  >
                    <option value="KRITIK">🚨 Kritik (Açılış Engelleyici)</option>
                    <option value="YUKSEK">Yüksek</option>
                    <option value="NORMAL">Normal</option>
                    <option value="DUSUK">Düşük</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Son Düzeltme Tarihi:</label>
                  <input
                    type="date"
                    value={formData.deadline}
                    onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              {/* CANLI KAMERA / FOTOĞRAF YÜKLEME */}
              <div>
                <label className="text-slate-300 font-semibold block mb-1">
                  Kusur Kanıt Fotoğrafı:
                </label>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment" // Mobil cihazlarda doğrudan arka kamerayı açar
                  onChange={handlePhotoCapture}
                  className="hidden"
                />

                {previewPhoto ? (
                  <div className="relative w-full h-40 bg-slate-950 rounded-xl overflow-hidden border border-slate-700">
                    <img
                      src={previewPhoto}
                      alt="Önizleme"
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => setPreviewPhoto(null)}
                      className="absolute top-2 right-2 bg-black/80 text-rose-400 p-1.5 rounded-lg hover:bg-black transition"
                    >
                      <X className="w-4 h-4" />
                    </button>
                    <div className="absolute bottom-2 left-2 bg-black/70 px-2 py-0.5 rounded text-[9px] text-amber-300 font-mono">
                      GPS Damgası ve Cihaz Zaman Damgası Eklendi
                    </div>
                  </div>
                ) : (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-slate-700 hover:border-purple-500 rounded-xl p-4 flex flex-col items-center justify-center text-center cursor-pointer bg-slate-950/60 hover:bg-slate-950 transition"
                  >
                    <div className="w-10 h-10 rounded-full bg-purple-500/10 text-purple-400 flex items-center justify-center mb-2">
                      <Camera className="w-5 h-5" />
                    </div>
                    <span className="font-semibold text-slate-200">
                      Fotoğraf Çek veya Galeriden Seç
                    </span>
                    <span className="text-[10px] text-slate-500 mt-0.5">
                      Mobilde doğrudan kamera açılır, GPS ve zaman filigranı basılır
                    </span>
                  </div>
                )}
              </div>

              {/* Form Buttons */}
              <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium transition"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold flex items-center gap-2 shadow-lg shadow-purple-600/30 transition disabled:opacity-50"
                >
                  <Plus className="w-4 h-4" />
                  {submitting ? "Kaydediliyor..." : "Kusuru Kaydet & Taşerona DÖF Aç"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* FOTOĞRAF BÜYÜTME MODALI */}
      {enlargedPhoto && (
        <div
          onClick={() => setEnlargedPhoto(null)}
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in cursor-zoom-out"
        >
          <div className="relative max-w-4xl max-h-[90vh]">
            <img
              src={enlargedPhoto}
              alt="Büyük Fotoğraf"
              className="max-w-full max-h-[85vh] rounded-2xl object-contain border border-slate-800 shadow-2xl"
            />
            <div className="text-center text-xs text-slate-400 mt-2">
              Kapatmak için herhangi bir yere tıklayın
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
