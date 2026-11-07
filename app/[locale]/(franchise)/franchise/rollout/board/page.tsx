"use client"
/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Franchise Rollout Board - 6 Aşamalı Kanban & Zorunlu Stage-Gate Onay Kapıları Panosu
 */

import React, { useState, useEffect } from "react"
import Link from "next/link"
import {
  Kanban,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  Lock,
  Unlock,
  Building2,
  MapPin,
  Clock,
  ArrowRight,
  Plus,
  RefreshCw,
  Search,
  Filter,
  FileText,
  FileCheck2,
  Box,
  ClipboardCheck,
  X,
  ExternalLink,
  ChevronRight,
  AlertOctagon,
  Eye,
  UploadCloud,
  Check,
  Loader2,
} from "lucide-react"
import RolloutSubNav from "@/components/franchise/RolloutSubNav"
import {
  ROLLOUT_STAGES,
  RolloutStageKey,
  getRolloutBoardData,
  updateRolloutBoardStage,
  validateStageGateTransition,
} from "@/app/actions/franchise-rollout"
import CreateRolloutModal from "@/components/franchise/CreateRolloutModal"

export default function RolloutBoardPage() {
  const [projects, setProjects] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [cityFilter, setCityFilter] = useState("ALL")

  // Drag and drop state
  const [draggedStoreId, setDraggedStoreId] = useState<string | null>(null)
  const [dragOverColumn, setDragOverColumn] = useState<RolloutStageKey | null>(null)
  const [isUpdating, setIsUpdating] = useState(false)

  // Blocker & Validation Modal State
  const [blockerModal, setBlockerModal] = useState<{
    isOpen: boolean
    title: string
    reason: string
    missingItem?: string
    storeName?: string
    targetStage?: string
    blockingDetails?: any
    storeId?: string
    canForceOverride?: boolean
  }>({
    isOpen: false,
    title: "",
    reason: "",
  })

  // Create Store Modal
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [selectedStoreDetail, setSelectedStoreDetail] = useState<any | null>(null)

  const loadData = async () => {
    try {
      setLoading(true)
      const res = await getRolloutBoardData()
      if (res.success && res.projects) {
        setProjects(res.projects)
      }
    } catch (err) {
      console.error("Board verisi yüklenirken hata:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  // Drag Handlers
  const handleDragStart = (e: React.DragEvent, storeId: string) => {
    e.dataTransfer.setData("text/plain", storeId)
    setDraggedStoreId(storeId)
  }

  const handleDragOver = (e: React.DragEvent, stageKey: RolloutStageKey) => {
    e.preventDefault()
    setDragOverColumn(stageKey)
  }

  const handleDragLeave = () => {
    setDragOverColumn(null)
  }

  const handleDrop = async (e: React.DragEvent, targetStage: RolloutStageKey) => {
    e.preventDefault()
    setDragOverColumn(null)
    const storeId = e.dataTransfer.getData("text/plain") || draggedStoreId

    if (!storeId) return

    const store = projects.find((p) => p.id === storeId)
    if (!store) return

    if (store.status === targetStage) {
      setDraggedStoreId(null)
      return
    }

    // 1. Validation Kontrolü
    setIsUpdating(true)
    const validation = await validateStageGateTransition(storeId, targetStage)

    if (!validation.allowed) {
      setIsUpdating(false)
      setDraggedStoreId(null)
      setBlockerModal({
        isOpen: true,
        title: "Zorunlu Onay Kapısı (Stage-Gate) Engeli",
        reason: validation.reason || "Bu aşamaya geçiş için zorunlu şartlar sağlanmadı.",
        missingItem: validation.missingItem,
        storeName: store.name,
        targetStage: ROLLOUT_STAGES.find((s) => s.key === targetStage)?.label,
        blockingDetails: validation.blockingDetails,
        storeId,
        canForceOverride: true,
      })
      return
    }

    // Geçişe izin verildi
    const res = await updateRolloutBoardStage(storeId, targetStage)
    if (res.success) {
      setProjects((prev) =>
        prev.map((p) => (p.id === storeId ? { ...p, status: targetStage } : p))
      )
    }
    setIsUpdating(false)
    setDraggedStoreId(null)
  }

  // Manuel Taşıma (Select veya Modal ile)
  const handleMoveStage = async (storeId: string, targetStage: RolloutStageKey) => {
    const store = projects.find((p) => p.id === storeId)
    if (!store || store.status === targetStage) return

    setIsUpdating(true)
    const validation = await validateStageGateTransition(storeId, targetStage)

    if (!validation.allowed) {
      setIsUpdating(false)
      setBlockerModal({
        isOpen: true,
        title: "Zorunlu Onay Kapısı (Stage-Gate) Engeli",
        reason: validation.reason || "Bu aşamaya geçiş engellendi.",
        missingItem: validation.missingItem,
        storeName: store.name,
        targetStage: ROLLOUT_STAGES.find((s) => s.key === targetStage)?.label,
        blockingDetails: validation.blockingDetails,
        storeId,
        canForceOverride: true,
      })
      return
    }

    const res = await updateRolloutBoardStage(storeId, targetStage)
    if (res.success) {
      setProjects((prev) =>
        prev.map((p) => (p.id === storeId ? { ...p, status: targetStage } : p))
      )
    }
    setIsUpdating(false)
  }

  // Filtreleme
  const filteredProjects = projects.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.city && p.city.toLowerCase().includes(searchQuery.toLowerCase()))
    const matchesCity = cityFilter === "ALL" || p.city === cityFilter
    return matchesSearch && matchesCity
  })

  const uniqueCities = Array.from(new Set(projects.map((p) => p.city).filter(Boolean)))

  return (
    <div className="w-full space-y-6 pb-12">
      {/* Sub-Navigation Header */}
      <RolloutSubNav activeTab="board" />

      {/* Top Header & Actions */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-amber-400 mb-1">
            <ShieldCheck className="w-4 h-4 text-amber-400" />
            <span>Otonom Rollout Yönetimi</span>
            <span className="text-slate-600">•</span>
            <span className="text-slate-400">Strict Stage-Gate Enforcement</span>
          </div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            Rollout Kanban & Zorunlu Onay Kapıları
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
              6 Sütun / Drag & Drop
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-1 max-w-3xl">
            Yeni mağaza açılış süreçleri zorunlu onay kapıları (Stage-Gate) ile kontrol edilir. Mimari Proje onaylanmadan şantiye imalatına, resmi izinler ve sıfır hata (Punch List) tamamlanmadan açılış provasına kart taşınamaz.
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
            href="/franchise/rollout/ffe"
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 border border-slate-700 text-xs font-medium text-slate-200 flex items-center gap-2 transition"
          >
            <Box className="w-3.5 h-3.5 text-amber-400" />
            FF&E Demirbaş Lojistiği
          </Link>

          <Link
            href="/franchise/rollout/legal"
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 border border-slate-700 text-xs font-medium text-slate-200 flex items-center gap-2 transition"
          >
            <FileCheck2 className="w-3.5 h-3.5 text-amber-400" />
            Resmi İzinler & Kritik Yol
          </Link>

          <button
            onClick={() => setIsCreateOpen(true)}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-xs font-bold flex items-center gap-2 shadow-lg shadow-amber-500/20 transition"
          >
            <Plus className="w-4 h-4" />
            Yeni Şube Açılışı Başlat
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-900/60 border border-slate-800 p-3 rounded-xl">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Şube adı veya lokasyon ara..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-950 border border-slate-700/80 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Filter className="w-3.5 h-3.5 text-slate-500" />
            <span>Şehir:</span>
            <select
              value={cityFilter}
              onChange={(e) => setCityFilter(e.target.value)}
              className="bg-slate-950 border border-slate-700 text-xs text-slate-200 rounded-lg px-2.5 py-1 focus:outline-none focus:border-amber-500"
            >
              <option value="ALL">Tüm Şehirler</option>
              {uniqueCities.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div className="text-xs text-slate-400">
            Toplam: <strong className="text-amber-400">{filteredProjects.length}</strong> Şube
          </div>
        </div>
      </div>

      {/* 6-COLUMN STAGE-GATE KANBAN BOARD */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3.5 overflow-x-auto min-h-[620px] pb-4">
        {ROLLOUT_STAGES.map((stage, colIdx) => {
          const colProjects = filteredProjects.filter((p) => p.status === stage.key)
          const isOver = dragOverColumn === stage.key

          // Sütun Renkleri
          const colors = [
            { border: "border-sky-500/40", bg: "bg-sky-500/5", badge: "bg-sky-500/10 text-sky-400 border-sky-500/20" },
            { border: "border-indigo-500/40", bg: "bg-indigo-500/5", badge: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20" },
            { border: "border-amber-500/40", bg: "bg-amber-500/5", badge: "bg-amber-500/10 text-amber-400 border-amber-500/20" },
            { border: "border-orange-500/40", bg: "bg-orange-500/5", badge: "bg-orange-500/10 text-orange-400 border-orange-500/20" },
            { border: "border-purple-500/40", bg: "bg-purple-500/5", badge: "bg-purple-500/10 text-purple-400 border-purple-500/20" },
            { border: "border-emerald-500/40", bg: "bg-emerald-500/5", badge: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
          ][colIdx]

          return (
            <div
              key={stage.key}
              onDragOver={(e) => handleDragOver(e, stage.key)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, stage.key)}
              className={`flex flex-col rounded-2xl border transition-all duration-200 bg-slate-900/50 backdrop-blur-sm min-w-[260px] ${
                isOver
                  ? "border-amber-400 bg-amber-500/10 ring-2 ring-amber-500/30 scale-[1.01]"
                  : `${colors.border} ${colors.bg}`
              }`}
            >
              {/* Column Header */}
              <div className="p-3 border-b border-slate-800/80">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-slate-800 text-[11px] font-bold text-slate-300 flex items-center justify-center">
                      {stage.gateOrder}
                    </span>
                    <span className="text-xs font-bold text-slate-200 uppercase tracking-wide">
                      {stage.name}
                    </span>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[11px] font-bold border ${colors.badge}`}
                  >
                    {colProjects.length}
                  </span>
                </div>

                <div className="flex items-center gap-1 text-[10px] text-slate-400 bg-slate-950/40 px-2 py-1 rounded-md border border-slate-800">
                  <Lock className="w-3 h-3 text-amber-400 shrink-0" />
                  <span className="truncate" title={stage.requiredDocument}>
                    Kapı: {stage.requiredDocument}
                  </span>
                </div>
              </div>

              {/* Cards Container */}
              <div className="flex-1 p-2 space-y-2.5 overflow-y-auto max-h-[700px]">
                {colProjects.length === 0 ? (
                  <div className="h-32 border-2 border-dashed border-slate-800/80 rounded-xl flex flex-col items-center justify-center text-slate-500 p-3 text-center">
                    <Lock className="w-5 h-5 text-slate-600 mb-1 opacity-50" />
                    <span className="text-[11px]">Bu aşamada şube yok</span>
                    <span className="text-[10px] text-slate-600">Kartı buraya sürükleyin</span>
                  </div>
                ) : (
                  colProjects.map((project) => {
                    const isDragged = draggedStoreId === project.id

                    return (
                      <div
                        key={project.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, project.id)}
                        className={`group bg-slate-950/90 border border-slate-800 hover:border-amber-500/50 rounded-xl p-3 shadow-md hover:shadow-lg hover:shadow-amber-500/5 transition-all cursor-grab active:cursor-grabbing ${
                          isDragged ? "opacity-40 scale-95 border-amber-400" : ""
                        }`}
                      >
                        {/* Header: Name and Status */}
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="min-w-0">
                            <h4 className="text-xs font-bold text-white group-hover:text-amber-300 transition-colors line-clamp-1">
                              {project.name}
                            </h4>
                            <div className="flex items-center gap-1 text-[10px] text-slate-400 mt-0.5">
                              <MapPin className="w-3 h-3 text-amber-400 shrink-0" />
                              <span className="truncate">{project.city}</span>
                              <span className="text-slate-600">•</span>
                              <span className="text-slate-400">{project.locationType}</span>
                            </div>
                          </div>

                          {project.openDefects > 0 && (
                            <span
                              title={`${project.openDefects} Açık Punch List Kusuru`}
                              className="px-1.5 py-0.5 rounded bg-rose-500/10 border border-rose-500/30 text-[10px] font-bold text-rose-400 flex items-center gap-1 shrink-0"
                            >
                              <AlertTriangle className="w-2.5 h-2.5" />
                              {project.openDefects}
                            </span>
                          )}
                        </div>

                        {/* Progress Bar */}
                        <div className="mb-2.5">
                          <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
                            <span>İlerleme</span>
                            <span className="font-semibold text-slate-200">{project.progress}%</span>
                          </div>
                          <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                            <div
                              className="bg-gradient-to-r from-amber-500 to-amber-400 h-1.5 rounded-full transition-all duration-300"
                              style={{ width: `${project.progress}%` }}
                            />
                          </div>
                        </div>

                        {/* Metadata Footer */}
                        <div className="grid grid-cols-2 gap-1 text-[10px] text-slate-400 pt-2 border-t border-slate-900 mb-2">
                          <div>
                            <span className="text-slate-500 block">Bütçe:</span>
                            <span className="font-semibold text-slate-300">
                              ₺{(project.totalBudget || 0).toLocaleString("tr-TR")}
                            </span>
                          </div>
                          <div className="text-right">
                            <span className="text-slate-500 block">Sorumlu:</span>
                            <span className="font-medium text-slate-300 truncate block">
                              {project.regionalManagerName ? project.regionalManagerName.split(" ")[0] : "Bölge Md."}
                            </span>
                          </div>
                        </div>

                        {/* Quick Action Buttons */}
                        <div className="flex items-center gap-1 pt-1">
                          <button
                            onClick={() => setSelectedStoreDetail(project)}
                            className="flex-1 py-1 rounded bg-slate-900 hover:bg-slate-800 text-[10px] font-medium text-slate-300 flex items-center justify-center gap-1 border border-slate-800 hover:border-slate-700 transition"
                          >
                            <Eye className="w-3 h-3 text-slate-400" />
                            İncele
                          </button>

                          {/* İleri Taşı Hızlı Buton */}
                          {colIdx < ROLLOUT_STAGES.length - 1 && (
                            <button
                              onClick={() =>
                                handleMoveStage(project.id, ROLLOUT_STAGES[colIdx + 1].key)
                              }
                              title="Bir sonraki onay kapısına ilerlet"
                              className="px-2 py-1 rounded bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[10px] font-bold flex items-center gap-1 transition"
                            >
                              <span>İlerle</span>
                              <ChevronRight className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* STAGE-GATE BLOCKER & ALERT MODAL */}
      {blockerModal.isOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-slate-900 border border-rose-500/50 rounded-2xl w-full max-w-lg shadow-2xl p-6 relative overflow-hidden">
            {/* Blocker Accent Line */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-rose-500 via-amber-500 to-rose-500" />

            <div className="flex items-start gap-4 mb-4">
              <div className="w-12 h-12 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center shrink-0 text-rose-400 shadow-lg shadow-rose-500/10">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-rose-400 bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 rounded-md inline-block mb-1">
                  Stage-Gate Zorunlu Kural İhlali
                </span>
                <h3 className="text-lg font-bold text-white">{blockerModal.title}</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Hedef Aşama: <strong className="text-amber-400">{blockerModal.targetStage}</strong> • Şube: {blockerModal.storeName}
                </p>
              </div>
              <button
                onClick={() => setBlockerModal({ ...blockerModal, isOpen: false })}
                className="text-slate-500 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Error Body */}
            <div className="bg-slate-950/80 border border-rose-500/20 rounded-xl p-4 text-xs text-slate-300 mb-5 space-y-3">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <p className="leading-relaxed">{blockerModal.reason}</p>
              </div>

              {blockerModal.missingItem && (
                <div className="bg-rose-500/10 border border-rose-500/30 rounded-lg p-3 text-xs">
                  <span className="text-[10px] font-bold text-rose-400 uppercase tracking-wide block mb-1">
                    Eksik Onay veya Belge:
                  </span>
                  <div className="font-semibold text-rose-200 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-rose-400" />
                    {blockerModal.missingItem}
                  </div>
                </div>
              )}

              {/* Punch list kusurları varsa listele */}
              {blockerModal.blockingDetails?.defects && (
                <div className="space-y-1.5 pt-1">
                  <span className="text-[10px] text-slate-400 font-semibold uppercase">
                    Açık Kusurlar ({blockerModal.blockingDetails.defects.length} Adet):
                  </span>
                  {blockerModal.blockingDetails.defects.slice(0, 3).map((d: any) => (
                    <div
                      key={d.id}
                      className="text-[11px] bg-slate-900 border border-slate-800 p-2 rounded flex items-center justify-between"
                    >
                      <span className="text-slate-300 truncate max-w-[280px]">{d.desc}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 font-bold">
                        {d.priority}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between gap-3 pt-2 border-t border-slate-800">
              <button
                onClick={() => setBlockerModal({ ...blockerModal, isOpen: false })}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-300 transition"
              >
                Vazgeç ve Kapat
              </button>

              <div className="flex items-center gap-2">
                {blockerModal.missingItem?.includes("Punch") ? (
                  <Link
                    href="/franchise/rollout/punch-list"
                    className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-xs font-bold text-white flex items-center gap-2 shadow-lg shadow-purple-600/20 transition"
                  >
                    <ClipboardCheck className="w-4 h-4" />
                    Punch List'e Git
                  </Link>
                ) : (
                  <button
                    onClick={() => {
                      alert("Belge yükleme ve onay formu açılıyor. Belge eklendikten sonra aşama kilidi açılacaktır.")
                      setBlockerModal({ ...blockerModal, isOpen: false })
                    }}
                    className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold flex items-center gap-2 shadow-lg shadow-amber-500/20 transition"
                  >
                    <UploadCloud className="w-4 h-4" />
                    Gerekli Belgeyi Yükle
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DETAIL MODAL */}
      {selectedStoreDetail && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl shadow-2xl p-6 relative">
            <div className="flex items-start justify-between gap-4 mb-4 pb-3 border-b border-slate-800">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                  {selectedStoreDetail.locationType} Şube Detayı
                </span>
                <h3 className="text-xl font-bold text-white mt-1">{selectedStoreDetail.name}</h3>
                <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
                  <MapPin className="w-3.5 h-3.5 text-amber-400" />
                  {selectedStoreDetail.city} {selectedStoreDetail.district ? `(${selectedStoreDetail.district})` : ""}
                </p>
              </div>
              <button
                onClick={() => setSelectedStoreDetail(null)}
                className="text-slate-500 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs text-slate-300">
              {/* Status and Progress */}
              <div className="grid grid-cols-2 gap-3 bg-slate-950 p-3 rounded-xl border border-slate-800">
                <div>
                  <span className="text-slate-500 block text-[11px]">Mevcut Aşama:</span>
                  <span className="font-bold text-amber-400 text-sm">
                    {ROLLOUT_STAGES.find((s) => s.key === selectedStoreDetail.status)?.name || selectedStoreDetail.status}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">Toplam Bütçe:</span>
                  <span className="font-bold text-slate-200 text-sm">
                    ₺{(selectedStoreDetail.totalBudget || 0).toLocaleString("tr-TR")}
                  </span>
                </div>
              </div>

              {/* Stage-Gates Onay Durumu */}
              <div>
                <h4 className="font-bold text-slate-200 mb-2 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-amber-400" />
                  Zorunlu Onay Kapıları (Stage-Gates):
                </h4>
                <div className="space-y-2">
                  {ROLLOUT_STAGES.map((st) => {
                    const gate = selectedStoreDetail.stageGates?.find((g: any) => g.stageName === st.key)
                    const isApproved = gate?.isApproved || (selectedStoreDetail.status === "PRE_OPENING")

                    return (
                      <div
                        key={st.key}
                        className={`flex items-center justify-between p-2.5 rounded-lg border text-xs ${
                          isApproved
                            ? "bg-emerald-500/5 border-emerald-500/30 text-emerald-300"
                            : "bg-slate-950 border-slate-800 text-slate-400"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          {isApproved ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                          ) : (
                            <Lock className="w-4 h-4 text-slate-500 shrink-0" />
                          )}
                          <span className="font-semibold">{st.name}</span>
                        </div>
                        <span className="text-[10px]">
                          {isApproved ? "Onaylandı" : "Bekliyor / Kilitli"}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                onClick={() => setSelectedStoreDetail(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition"
              >
                Kapat
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CREATE MODAL */}
      <CreateRolloutModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSuccess={() => {
          setIsCreateOpen(false)
          loadData()
        }}
      />
    </div>
  )
}
