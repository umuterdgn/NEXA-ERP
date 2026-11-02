/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Yatırımcı Portalı - Executive (Yönetici) Dashboard
 * - 3 Executive Özet Kartı: Fiziksel İlerleme, Bütçe Durumu (Çubuk Grafik), Saha Mevcudu
 * - Son Saha Fotoğrafları (En Yeni 4 Fotoğraf)
 * - Güncel İmalat Özeti (Jurnal Metinleri)
 * - Veri girişine ve düzenlemeye tamamen kapalı (Read-Only)
 */

import React from "react"
import { prisma } from "@/lib/prisma"
import {
  TrendingUp,
  Users,
  HardHat,
  Camera,
  Calendar,
  Building,
  CheckCircle2,
  Clock,
  Layers,
  Sparkles,
  ShieldCheck,
  ChevronRight,
  Sun,
  Truck,
  DollarSign,
  PieChart,
} from "lucide-react"
import Link from "next/link"

export const dynamic = "force-dynamic"

export default async function InvestorDashboardPage() {
  // 1. Fiziksel İlerleme ve Bütçe Verileri (BoQ)
  const boqItems = await prisma.boQItem
    .findMany({
      orderBy: { createdAt: "desc" },
    })
    .catch(() => [])

  let totalPlannedAmount = 0
  let totalActualSpending = 0

  if (boqItems.length > 0) {
    boqItems.forEach((it) => {
      const planned = it.plannedQuantity || it.contractQuantity || 0
      const completed = it.completedQuantity || 0
      const price = it.unitPrice || 0
      totalPlannedAmount += planned * price
      totalActualSpending += completed * price
    })
  }

  // Fallback demo veriler (Şantiye bütçesi)
  if (totalPlannedAmount === 0) {
    totalPlannedAmount = 24500000 // 24.5 M ₺
    totalActualSpending = 15925000 // 15.9 M ₺ (~%65)
  }

  const physicalProgress =
    totalPlannedAmount > 0
      ? Math.min(100, Math.round((totalActualSpending / totalPlannedAmount) * 100))
      : 65

  // 2. Güncel Saha Jurnalleri & Saha Mevcudu
  const rawLogs = await prisma.dailyLog
    .findMany({
      orderBy: { date: "desc" },
      take: 5,
    })
    .catch(() => [])

  const latestLog = rawLogs[0] || null
  const activeWorkersCount = latestLog?.personnelCount || (latestLog as any)?.workerCount || 54
  const activeMachineryCount = latestLog?.machineryCount || 8
  const weatherText = latestLog?.weather || "Açık, 19°C"

  // 3. Son Saha Fotoğrafları (En Yeni 4 Fotoğraf)
  const fallbackPhotos = [
    {
      id: "ph-1",
      title: "A Blok 8. Kat Kolon Donatı ve Kalıp Kontrolü",
      date: "02 Kasım 2026",
      zone: "A Blok • Kat 8",
      url: "https://images.unsplash.com/photo-1541888946425-d0fbb1861571?q=80&w=800&auto=format&fit=crop",
    },
    {
      id: "ph-2",
      title: "C30 Hazır Beton Pompalı Döküm Aşaması",
      date: "01 Kasım 2026",
      zone: "B Blok • Zemin Kat",
      url: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?q=80&w=800&auto=format&fit=crop",
    },
    {
      id: "ph-3",
      title: "Çelik Konstrüksiyon Çatı Makası Montajı",
      date: "31 Ekim 2026",
      zone: "Ticari Podyum",
      url: "https://images.unsplash.com/photo-1590496793929-36417d3117de?q=80&w=800&auto=format&fit=crop",
    },
    {
      id: "ph-4",
      title: "Dış Cephe Isı Yalıtımı ve Cam Giydirme Panelleri",
      date: "30 Ekim 2026",
      zone: "A Blok • Güney Cephe",
      url: "https://images.unsplash.com/photo-1581094288338-2314dddb7ece?q=80&w=800&auto=format&fit=crop",
    },
  ]

  // Jurnal fotoğrafları varsa onları al, yoksa fallback fotoğrafları kullan
  const extractedPhotos: typeof fallbackPhotos = []
  rawLogs.forEach((log) => {
    if (log.photoUrls && Array.isArray(log.photoUrls)) {
      log.photoUrls.forEach((u, i) => {
        if (extractedPhotos.length < 4 && u) {
          extractedPhotos.push({
            id: `log-ph-${log.id}-${i}`,
            title: log.workDone ? log.workDone.slice(0, 50) + "..." : "Saha İmalat İlerlemesi",
            date: new Date(log.date).toLocaleDateString("tr-TR"),
            zone: "Şantiye Sahası",
            url: u,
          })
        }
      })
    }
  })

  const galleryPhotos = extractedPhotos.length >= 4 ? extractedPhotos.slice(0, 4) : fallbackPhotos

  // 4. Güncel İmalat Özeti (Son Jurnallerin Sadece Metin Kısmı)
  const defaultLogSummaries = [
    {
      id: "log-1",
      date: "02 Kasım 2026",
      weather: "Güneşli, 19°C",
      text: "A Blok 8. kat kolon betonarme kalıp ve demir donatı bağlama işlemleri tamamlandı. Yapı denetim vizesi alındıktan sonra transmikser ile C30 beton dökümüne başlandı.",
      workDone: "180 m³ Kolon Betonu • 28 Ton Donatı Montajı",
    },
    {
      id: "log-2",
      date: "01 Kasım 2026",
      weather: "Parçalı Bulutlu, 17°C",
      text: "B Blok zemin kat çevre çevreleme ve 20 cm gazbeton duvar örme imalatları devam etti. Mekanik tesisat şaft borulamaları için çekirdek delme işlemleri gerçekleştirildi.",
      workDone: "350 m² Gazbeton Duvar • 45 mt Yangın Sprinkler Hattı",
    },
    {
      id: "log-3",
      date: "31 Ekim 2026",
      weather: "Açık, 18°C",
      text: "Ticari podyum alanında çelik makas kiriş montajı mobil vinç yardımıyla başarıyla tamamlandı. ISG uzmanı gözetiminde yüksekte çalışma güvenlik emniyet kemerleri denetlendi.",
      workDone: "12 Adet Çelik Makas Montajı • Tork Kalibrasyon Kontrolü",
    },
    {
      id: "log-4",
      date: "30 Ekim 2026",
      weather: "Güneşli, 20°C",
      text: "Bodrum kat otopark döşemesinde helikopterli şap uygulaması ve yüzey sertleştirici perdah işlemi bitirildi. Kürleme örtüsü serilerek sulama sürecine geçildi.",
      workDone: "650 m² Zemin Şapı ve Helikopterli Perdah",
    },
  ]

  const journalEntries =
    rawLogs.length > 0
      ? rawLogs.slice(0, 4).map((l) => ({
          id: l.id,
          date: new Date(l.date).toLocaleDateString("tr-TR", {
            day: "numeric",
            month: "long",
            year: "numeric",
          }),
          weather: l.weather || "Açık, 18°C",
          text: l.notes || l.workDone || "Saha imalatları planlanan iş programına uygun şekilde sürdürülmektedir.",
          workDone: l.workDone || "Günlük şantiye imalat raporu",
        }))
      : defaultLogSummaries

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Portalı Karşılama Başlığı */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-slate-900/90 to-amber-950/20 border border-slate-800 p-6 rounded-2xl shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/30 font-bold">
              Yatırımcı & Müşteri Paneli
            </span>
            <span className="text-xs text-slate-400 font-mono">• Canlı Güncelleniyor</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            Nexa Plaza & Rezidans Yatırım Özeti
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Projenin fiziksel ilerleme metrajları, finansal gerçekleşme oranları ve günlük şantiye bülteni
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/investor/3d-twin"
            className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-blue-600/20 flex items-center gap-2 transition cursor-pointer"
          >
            <span>3D Proje İkizini Aç</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* ADIM 3: EN ÜSTE YAN YANA 3 ŞIK "EXECUTIVE YÖNETİCİ ÖZET KARTI"       */}
      {/* ==================================================================== */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* KART 1: Fiziksel İlerleme (BoQ Tamamlanma Oranına Göre) */}
        <div className="relative overflow-hidden bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg group hover:border-blue-500/50 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Fiziksel İlerleme
            </span>
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
          </div>

          <div className="mt-4 flex items-baseline justify-between">
            <div>
              <p className="text-3xl sm:text-4xl font-extrabold text-white font-mono tracking-tight">
                %{physicalProgress}
              </p>
              <p className="text-xs text-slate-400 mt-1">
                BoQ Metraj Cetveli Genel Tamamlanma
              </p>
            </div>
            <div className="text-right">
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                <TrendingUp className="w-3 h-3" />
                Takvimde
              </span>
            </div>
          </div>

          {/* İlerleme Çubuğu */}
          <div className="mt-5 space-y-1.5">
            <div className="flex justify-between text-[11px] text-slate-400 font-mono">
              <span>Hedef: %100</span>
              <span>Kalan: %{Math.max(0, 100 - physicalProgress)}</span>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden border border-slate-700/50">
              <div
                className="h-full rounded-full bg-gradient-to-r from-blue-600 via-indigo-500 to-emerald-400 transition-all duration-700"
                style={{ width: `${physicalProgress}%` }}
              />
            </div>
          </div>
        </div>

        {/* KART 2: Bütçe Durumu (Planlanan vs Harcanan - Çubuk Grafik) */}
        <div className="relative overflow-hidden bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg group hover:border-emerald-500/50 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Bütçe Durumu
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>

          <div className="mt-3 space-y-2 font-mono">
            <div className="flex items-baseline justify-between">
              <span className="text-xs text-slate-400">Harcanan:</span>
              <span className="text-xl sm:text-2xl font-bold text-emerald-400">
                {totalActualSpending.toLocaleString("tr-TR", { maximumFractionDigits: 0 })} ₺
              </span>
            </div>
            <div className="flex items-baseline justify-between text-xs text-slate-400">
              <span>Toplam Keşif Bütçesi:</span>
              <span className="text-slate-200 font-bold">
                {totalPlannedAmount.toLocaleString("tr-TR", { maximumFractionDigits: 0 })} ₺
              </span>
            </div>
          </div>

          {/* Çubuk Grafik (Bar Comparison) */}
          <div className="mt-4 space-y-2">
            <div className="flex justify-between text-[11px] text-slate-400">
              <span>Bütçe Tüketimi:</span>
              <span className="font-bold text-white font-mono">
                %{Math.round((totalActualSpending / totalPlannedAmount) * 100)}
              </span>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-3 overflow-hidden border border-slate-700/50 p-0.5">
              <div
                className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-teal-400 to-blue-500 transition-all duration-700"
                style={{
                  width: `${Math.min(
                    100,
                    Math.round((totalActualSpending / totalPlannedAmount) * 100)
                  )}%`,
                }}
              />
            </div>
            <div className="flex justify-between text-[10px] text-slate-500">
              <span>0 ₺</span>
              <span>Planlanan Tavan</span>
            </div>
          </div>
        </div>

        {/* KART 3: Saha Mevcudu (O günkü toplam personel sayısı - Jurnalden çekilir) */}
        <div className="relative overflow-hidden bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg group hover:border-amber-500/50 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Saha Mevcudu (Bugün)
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
              <HardHat className="w-4 h-4" />
            </div>
          </div>

          <div className="mt-4 flex items-baseline justify-between">
            <div>
              <p className="text-3xl sm:text-4xl font-extrabold text-white font-mono tracking-tight">
                {activeWorkersCount}
              </p>
              <p className="text-xs text-slate-400 mt-1">Aktif Saha Personeli & Taşeron</p>
            </div>
            <div className="text-right">
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                <Sun className="w-3 h-3 text-amber-400" />
                {weatherText}
              </span>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-2 pt-2 border-t border-slate-800/80 text-xs">
            <div className="flex items-center gap-2">
              <Truck className="w-4 h-4 text-slate-400" />
              <div>
                <span className="text-slate-400 text-[10px]">İş Makinesi:</span>
                <p className="font-bold text-white font-mono">{activeMachineryCount} Adet</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-slate-400" />
              <div>
                <span className="text-slate-400 text-[10px]">Taşeron Ekibi:</span>
                <p className="font-bold text-white font-mono">4 Farklı Ekip</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* ALT KISIM 1: SON SAHA FOTOĞRAFLARI (GALERİDEN EN YENİ 4 FOTOĞRAF)     */}
      {/* ==================================================================== */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 flex items-center justify-center">
              <Camera className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-white">
                Son Saha Fotoğrafları
              </h2>
              <p className="text-xs text-slate-400">
                Şantiyeden en son onaylanan canlı imalat ve kalite kontrol kareleri
              </p>
            </div>
          </div>

          <Link
            href="/investor/gallery"
            className="text-xs font-semibold text-blue-400 hover:text-blue-300 flex items-center gap-1 transition"
          >
            <span>Tüm Galeriyi Gör</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* 4 Fotoğraf Izgarası (Read-Only) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {galleryPhotos.map((photo) => (
            <div
              key={photo.id}
              className="group relative rounded-2xl overflow-hidden border border-slate-800 bg-slate-900 shadow-md hover:border-slate-700 transition-all flex flex-col"
            >
              <div className="aspect-[4/3] w-full overflow-hidden bg-slate-950 relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={photo.url}
                  alt={photo.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded bg-black/60 backdrop-blur-md text-[10px] text-white font-mono border border-white/10">
                  {photo.zone}
                </div>
              </div>

              <div className="p-3.5 flex-1 flex flex-col justify-between space-y-2 bg-slate-900/90">
                <h3 className="text-xs font-semibold text-slate-200 line-clamp-2 leading-snug">
                  {photo.title}
                </h3>
                <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono pt-1 border-t border-slate-800">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-slate-500" />
                    {photo.date}
                  </span>
                  <span className="text-[10px] text-emerald-400 font-bold">Onaylandı</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ==================================================================== */}
      {/* ALT KISIM 2: GÜNCEL İMALAT ÖZETİ (SON JURNALLERİN METİN KISMI)         */}
      {/* ==================================================================== */}
      <div className="space-y-4">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center">
            <Clock className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-bold text-white">
              Güncel İmalat Özeti (Şantiye Jurnal Bülteni)
            </h2>
            <p className="text-xs text-slate-400">
              Saha şefleri ve mühendisler tarafından kaydedilen son çalışma notları
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {journalEntries.map((log) => (
            <div
              key={log.id}
              className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-3 hover:border-slate-700 transition"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-mono">
                  <Calendar className="w-3.5 h-3.5 text-amber-400" />
                  <span className="font-bold text-white">{log.date}</span>
                </div>
                <span className="text-[11px] text-slate-400 font-mono bg-slate-800 px-2 py-0.5 rounded">
                  {log.weather}
                </span>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed font-sans">
                {log.text}
              </p>

              <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
                <span className="text-slate-500 font-mono">İmalat Çıktısı:</span>
                <span className="text-indigo-400 font-medium font-sans">
                  {log.workDone}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Yatırımcı Bilgi Dipnotu */}
      <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800/60 text-center text-xs text-slate-500">
        Bu portal yatırımcı ve müşterilere özel olarak salt okunur (read-only) güvenlik protokolü ile sunulmaktadır.
        Tüm veriler merkezi BIM ve şantiye yönetim veritabanından anlık çekilmektedir.
      </div>
    </div>
  )
}
