"use client"
/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Field Personnel Completion Photo Gallery with Lightbox
 * Polaroid-styled cards with date-fns chronological formatting
 */

import React, { useState, useEffect } from "react"
import Image from "next/image"
import { format } from "date-fns"
import { tr } from "date-fns/locale"
import {
  Camera,
  X,
  User,
  Calendar,
  ExternalLink,
  Download,
  Loader2,
  RefreshCw,
  ImageIcon,
  ShieldCheck,
  CheckCircle2
} from "lucide-react"
import { getProjectMediaGallery, ProjectMediaGalleryItem } from "@/app/actions/tasks"
import { toast } from "react-hot-toast"

interface ProjectGalleryProps {
  projectId: string
  media?: ProjectMediaGalleryItem[]
}

export default function ProjectGallery({ projectId, media }: ProjectGalleryProps) {
  const [mediaItems, setMediaItems] = useState<ProjectMediaGalleryItem[]>(media || [])
  const [loading, setLoading] = useState<boolean>(!media)
  const [refreshing, setRefreshing] = useState<boolean>(false)
  const [selectedImage, setSelectedImage] = useState<ProjectMediaGalleryItem | null>(null)

  const loadGallery = async () => {
    try {
      const data = await getProjectMediaGallery(projectId)
      setMediaItems(data)
    } catch (err) {
      console.error("Failed to load project media gallery:", err)
      toast.error("Saha fotoğrafları yüklenirken bir hata oluştu.")
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    if (!media) {
      loadGallery()
    } else {
      setMediaItems(media)
      setLoading(false)
    }
  }, [projectId, media])

  const handleRefresh = async () => {
    setRefreshing(true)
    await loadGallery()
    toast.success("Saha galerisi güncellendi.")
  }

  const formatItemDate = (dateVal: Date | string | null | undefined): string => {
    if (!dateVal) return "Tarih belirtilmedi"
    try {
      const d = new Date(dateVal)
      if (isNaN(d.getTime())) return "Tarih belirtilmedi"
      return format(d, "dd MMMM yyyy, HH:mm", { locale: tr })
    } catch {
      return "Tarih belirtilmedi"
    }
  }

  return (
    <div className="space-y-6">
      {/* Gallery Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/60 backdrop-blur-md p-4 rounded-2xl border border-slate-800">
        <div>
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <span className="p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <Camera className="w-5 h-5" />
            </span>
            <span>📸 Saha Galerisi / Görev Kanıtları</span>
            <span className="text-xs bg-emerald-500/20 text-emerald-400 px-2.5 py-0.5 rounded-full border border-emerald-500/30 font-mono">
              {mediaItems.length} Fotoğraf
            </span>
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Sahadaki personelin iş emirlerini tamamlarken arka kamera ile çektiği resmi kanıt fotoğrafları
          </p>
        </div>

        <button
          type="button"
          onClick={handleRefresh}
          disabled={loading || refreshing}
          className="self-start sm:self-auto px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition flex items-center gap-2 text-xs font-semibold border border-slate-700"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing || loading ? "animate-spin text-blue-400" : ""}`} />
          <span>Yenile</span>
        </button>
      </div>

      {/* Loading Skeleton */}
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="bg-slate-900/60 rounded-2xl border border-slate-800 overflow-hidden animate-pulse space-y-2"
            >
              <div className="aspect-square bg-slate-800" />
              <div className="p-3 space-y-2">
                <div className="h-3.5 bg-slate-800 rounded w-3/4" />
                <div className="h-3 bg-slate-800 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : mediaItems.length === 0 ? (
        /* Empty State */
        <div className="bg-slate-900/60 rounded-2xl p-12 border border-slate-800 text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-blue-500/10 text-blue-400 flex items-center justify-center mx-auto border border-blue-500/20">
            <ImageIcon className="w-8 h-8" />
          </div>
          <div>
            <h4 className="text-base font-bold text-white">Henüz Kanıt Fotoğrafı Bulunmuyor</h4>
            <p className="text-xs text-slate-400 max-w-md mx-auto mt-1 leading-relaxed">
              Sahadaki personel kendilerine atanan iş emirlerini ve görevleri tamamlayıp kamera ile fotoğraf yükledikçe, kanıtlar burada kronolojik olarak listelenecektir.
            </p>
          </div>
        </div>
      ) : (
        /* ADIM 2: Masonry / Grid Polaroid-like Cards */
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {mediaItems.map((item) => {
            const formattedDate = formatItemDate(item.completedAt || item.updatedAt)
            const staffName = item.assignedToName || item.assignedTo?.name || "Saha Personeli"

            return (
              <div
                key={item.id}
                onClick={() => setSelectedImage(item)}
                className="group relative bg-slate-900 rounded-2xl border border-slate-800 hover:border-blue-500/50 overflow-hidden shadow-lg hover:shadow-2xl hover:shadow-blue-500/10 transition-all duration-300 cursor-pointer flex flex-col justify-between"
              >
                {/* Photo Top / Center with scale-105 hover animation */}
                <div className="relative aspect-square w-full bg-slate-950 overflow-hidden">
                  <Image
                    src={item.completionPhoto}
                    alt={item.title}
                    fill
                    sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                    unoptimized
                  />

                  {/* Top Badge */}
                  <div className="absolute top-2 left-2 z-10">
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-lg bg-black/60 backdrop-blur-md text-emerald-400 border border-emerald-500/30">
                      <ShieldCheck className="w-3 h-3 text-emerald-400" />
                      Kanıt
                    </span>
                  </div>

                  {/* Hover Overlay Hint */}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                    <span className="px-3 py-1.5 rounded-xl bg-black/70 backdrop-blur-md text-white text-xs font-semibold flex items-center gap-1.5 border border-white/20">
                      <ExternalLink className="w-3.5 h-3.5" />
                      Büyüt
                    </span>
                  </div>
                </div>

                {/* Bottom Polaroid-style translucent dark ribbon */}
                <div className="p-3 bg-slate-950/90 border-t border-slate-800/80 backdrop-blur-xs space-y-1.5">
                  <h4
                    className="text-xs font-bold text-white truncate group-hover:text-blue-400 transition-colors"
                    title={item.title}
                  >
                    {item.title}
                  </h4>

                  <div className="flex items-center gap-1.5 text-[11px] text-slate-300 truncate">
                    <User className="w-3 h-3 text-blue-400 shrink-0" />
                    <span className="truncate">{staffName}</span>
                  </div>

                  <div className="flex items-center gap-1 text-[10px] text-slate-500">
                    <Calendar className="w-3 h-3 text-slate-500 shrink-0" />
                    <span>{formattedDate}</span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ======================================================== */}
      {/* ADIM 3: Tıklama ile Büyütme (Lightbox / Modal)            */}
      {/* ======================================================== */}
      {selectedImage && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200"
          onClick={() => setSelectedImage(null)}
        >
          {/* Close Button on Top Right */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              setSelectedImage(null)
            }}
            className="absolute top-4 right-4 z-50 p-2.5 rounded-full bg-slate-800/90 hover:bg-slate-700 text-slate-300 hover:text-white transition shadow-xl border border-slate-700 cursor-pointer"
            title="Kapat (ESC)"
          >
            <X className="w-6 h-6" />
          </button>

          {/* Lightbox Main Container */}
          <div
            className="relative max-w-5xl w-full max-h-[85vh] flex flex-col items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            {/* High-Resolution Centered Image */}
            <div className="relative w-full h-[65vh] sm:h-[70vh] flex items-center justify-center">
              <Image
                src={selectedImage.completionPhoto}
                alt={selectedImage.title}
                fill
                className="object-contain rounded-xl"
                sizes="100vw"
                unoptimized
                priority
              />
            </div>

            {/* Bottom Details Bar */}
            <div className="mt-4 w-full bg-slate-900/90 border border-slate-800 rounded-2xl p-4 backdrop-blur-md shadow-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-white">
              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-400 text-[10px] font-bold border border-emerald-500/30 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    Tamamlanan İş Emri Kanıtı
                  </span>
                  <span className="text-xs text-slate-400">
                    {formatItemDate(selectedImage.completedAt || selectedImage.updatedAt)}
                  </span>
                </div>
                <h3 className="text-sm sm:text-base font-bold text-white truncate">
                  {selectedImage.title}
                </h3>
                <p className="text-xs text-slate-300 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-blue-400" />
                  <span>Görevi Tamamlayan: </span>
                  <strong className="text-white">
                    {selectedImage.assignedToName || selectedImage.assignedTo?.name || "Saha Personeli"}
                  </strong>
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 shrink-0">
                <a
                  href={selectedImage.completionPhoto}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-1.5 transition shadow-lg shadow-blue-600/20"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Orijinalini Aç</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
