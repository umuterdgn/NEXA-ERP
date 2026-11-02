/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Yatırımcı Portalı - Saha Fotoğraf Galerisi (Read-Only Construction Gallery)
 */

import React from "react"
import { Camera, Calendar, ShieldCheck, MapPin, Layers } from "lucide-react"

export const dynamic = "force-dynamic"

export default function InvestorGalleryPage() {
  const galleryItems = [
    {
      id: "g-1",
      title: "A Blok 8. Kat Kolon Donatı ve Kalıp İmalat Kontrolü",
      zone: "A Blok • 8. Kat",
      date: "02 Kasım 2026",
      tag: "Statik İmalat",
      url: "https://images.unsplash.com/photo-1541888946425-d0fbb1861571?q=80&w=1200&auto=format&fit=crop",
    },
    {
      id: "g-2",
      title: "C30 Hazır Beton Pompalı Döküm ve Vibratörle Sıkıştırma",
      zone: "B Blok • Zemin Kat",
      date: "01 Kasım 2026",
      tag: "Beton Dökümü",
      url: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?q=80&w=1200&auto=format&fit=crop",
    },
    {
      id: "g-3",
      title: "Ticari Podyum Çelik Konstrüksiyon Makas Montajı",
      zone: "Podyum • Blok A-B Arası",
      date: "31 Ekim 2026",
      tag: "Çelik İskelet",
      url: "https://images.unsplash.com/photo-1590496793929-36417d3117de?q=80&w=1200&auto=format&fit=crop",
    },
    {
      id: "g-4",
      title: "Dış Cephe Taşyünü Isı Yalıtımı ve Cam Giydirme",
      zone: "A Blok • Güney Cephe",
      date: "30 Ekim 2026",
      tag: "Dış Cephe",
      url: "https://images.unsplash.com/photo-1581094288338-2314dddb7ece?q=80&w=1200&auto=format&fit=crop",
    },
    {
      id: "g-5",
      title: "Kapalı Otopark Zemin Şapı ve Helikopterli Perdah",
      zone: "Bodrum Kat -2",
      date: "28 Ekim 2026",
      tag: "Zemin & Şap",
      url: "https://images.unsplash.com/photo-1574680096145-d05b474e2155?q=80&w=1200&auto=format&fit=crop",
    },
    {
      id: "g-6",
      title: "Mekanik Tesisat Yangın Sprinkler Borulaması",
      zone: "B Blok • 3. Kat",
      date: "26 Ekim 2026",
      tag: "Mekanik Tesisat",
      url: "https://images.unsplash.com/photo-1589939705384-5185137a7f0f?q=80&w=1200&auto=format&fit=crop",
    },
  ]

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900 border border-slate-800 p-5 rounded-2xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30 font-bold">
              Fotoğraf Arşivi
            </span>
            <span className="text-xs text-slate-400 font-mono">• Canlı Saha Akışı</span>
          </div>
          <h1 className="text-lg sm:text-xl font-bold text-white">
            Şantiye İmalat & Fotoğraf Galerisi
          </h1>
          <p className="text-xs text-slate-400">
            Günlük jurnaller ve kalite kontrol denetimlerinden gelen yüksek çözünürlüklü fotoğraflar
          </p>
        </div>

        <div className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center gap-2 text-xs text-slate-400">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Salt Okunur Görsel Denetim</span>
        </div>
      </div>

      {/* Galeri Izgarası */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {galleryItems.map((item) => (
          <div
            key={item.id}
            className="group rounded-2xl overflow-hidden border border-slate-800 bg-slate-900 shadow-lg hover:border-slate-700 transition flex flex-col"
          >
            <div className="aspect-[16/10] w-full overflow-hidden bg-slate-950 relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={item.url}
                alt={item.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute top-3 left-3 px-2 py-0.5 rounded-md bg-black/70 backdrop-blur-md text-[10px] text-white font-mono border border-white/10 flex items-center gap-1">
                <MapPin className="w-3 h-3 text-amber-400" />
                <span>{item.zone}</span>
              </div>
              <div className="absolute bottom-3 right-3 px-2 py-0.5 rounded-md bg-blue-600/80 backdrop-blur-md text-[10px] text-white font-bold">
                {item.tag}
              </div>
            </div>

            <div className="p-4 flex-1 flex flex-col justify-between space-y-3 bg-slate-900/90">
              <h3 className="text-sm font-semibold text-slate-200 line-clamp-2 leading-snug">
                {item.title}
              </h3>
              <div className="flex items-center justify-between text-xs text-slate-400 font-mono pt-2 border-t border-slate-800">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-500" />
                  {item.date}
                </span>
                <span className="text-emerald-400 font-bold text-[11px]">Denetlendi</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
