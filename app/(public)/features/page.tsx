/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * This code is the property of NXA Software.
 */

import type { Metadata } from 'next'
import Link from 'next/link'
import { 
  Box, 
  Layers, 
  WifiOff, 
  ShieldCheck, 
  DollarSign, 
  HardHat, 
  FileSpreadsheet, 
  Sparkles, 
  ArrowRight, 
  CheckCircle2, 
  Clock, 
  FileCheck, 
  Cpu, 
  Radio, 
  Building2, 
  FileText
} from 'lucide-react'

export const metadata: Metadata = {
  title: 'Özellikler & Modüller | Nexa ERP - Otonom B2B İnşaat İşletim Sistemi',
  description: '5D BIM, 4D Drone İkizi, Otonom Hakediş Blokesi, Offline-First Saha Defteri, BLE IoT İSG Takibi ve Yapı Denetim modüllerini derinlemesine keşfedin.',
  keywords: [
    'Nexa ERP Özellikler',
    '5D BIM Modülü',
    'Offline-First PWA',
    'Otonom Hakediş',
    'BLE IoT İSG',
    'Drone 4D Şantiye İkizi',
    'İnşaat ERP Modülleri'
  ]
}

export default function FeaturesPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "Nexa ERP Özellikler & Modüller",
    "applicationCategory": "BusinessApplication",
    "description": "5D BIM, Offline-First saha defteri, BLE IoT İSG radarı ve otonom hakediş motoru.",
    "featureList": [
      "WASM Tabanlı 5D BIM & X-Ray Röntgen Modülü",
      "Kusur Düzeltilmeden Bloke Olan Otonom Hakediş Motoru",
      "Dexie.js Offline-First Saha Günlüğü ve Dijital Pafta Çizimi",
      "BLE IoT Akıllı Baret & Tehlikeli Bölge Yaklaşım Radarı",
      "Taşeron Portalı ve GPS Doğrulamalı İş Kanıtı Denetimi",
      "Yapı Denetim YİBF, Numune/Karot Takibi ve OCR Evrak Arşivi"
    ]
  }

  const features = [
    {
      id: "bim",
      title: "5D BIM & 4D Drone Fotogrametri Modülü",
      badge: "WASM & WebGL",
      icon: Box,
      gradient: "from-cyan-500/20 via-blue-500/10 to-transparent",
      borderColor: "border-cyan-500/30",
      accentColor: "text-cyan-400",
      whatItDoes: "Web-IFC ve WebAssembly (WASM) motoruyla .ifc, .glb ve .gltf 3D mimari/statik/tesisat modellerini tarayıcınızda 60 FPS akıcılıkla çalıştırır. Katmanlar & X-Ray şeffaflık filtresi, 3D Lazer Metre (mesafe, alan ve hacim ölçümü) ve drone fotogrametri zaman çizelgesi sunar.",
      whatItSolves: "Ağır masaüstü CAD/BIM programı lisanslarına ihtiyaç duymadan, şantiye şefinin elindeki tablet üzerinden modeli incelemesini, 3D koordinatlarda kusur (snagging) iğnelemesini ve metraj kalemlerini anında keşif pozlarına bağlamasını sağlar.",
      bullets: [
        "Tarayıcıda sıfır kurulumla 60 FPS 3D model renderı",
        "Disiplin filtreleri: Mimari, Statik, Elektrik, Mekanik katman ayrımı",
        "3D Lazer Metre ile anlık mesafe, hacim ve metraj hesabı",
        "Drone fotogrametri ile 4D zaman çizelgeli şantiye ikizi"
      ]
    },
    {
      id: "hakedis",
      title: "Otonom Hakediş & BoQ (Keşif/Metraj) Motoru",
      badge: "Finansal Güvence",
      icon: DollarSign,
      gradient: "from-emerald-500/20 via-teal-500/10 to-transparent",
      borderColor: "border-emerald-500/30",
      accentColor: "text-emerald-400",
      whatItDoes: "Binlerce satırlık ihale keşif özetlerini (BoQ) Excel Bulk Upload ile saniyeler içinde içe aktarır. İmalat pozlarını doğrudan 3D BIM elemanlarıyla eşleştirir ve taşeron sözleşmeleriyle bağlar.",
      whatItSolves: "Sahadaki kusurlu imalatlar düzeltilip şantiye şefi tarafından sistemde onaylanmadıkça, ilgili taşeronun hakediş ödemesini otonom olarak bloke eder. Mükerrer ödemeleri ve haksız tahsilatları sıfırlar.",
      bullets: [
        "Excel (.xlsx) şablonundan tek tıkla binlerce poz aktarımı",
        "Kusur (Snagging) çözülmeden ödeme çıkışını durduran otonom blokaj",
        "Birim fiyat, planlanan metraj ve gerçekleşen ilerleme matrisi",
        "Taşeron ceza, kesinti ve stopaj hesaplama motoru"
      ]
    },
    {
      id: "offline",
      title: "Offline-First Mobil Saha Günlüğü & Dijital Çizim",
      badge: "Dexie.js & PWA",
      icon: WifiOff,
      gradient: "from-blue-500/20 via-indigo-500/10 to-transparent",
      borderColor: "border-blue-500/30",
      accentColor: "text-blue-400",
      whatItDoes: "Dexie.js (IndexedDB) tabanlı çevrimdışı mimari sayesinde internet bağlantısı sıfır olsa dahi mobil cihazda günlük şantiye raporları oluşturur, hava durumu loglar, PDF/DWG paftaları üzerinde yerinde serbest çizim ve işaretleme yapar.",
      whatItSolves: "Bodrum katlarda, metro tünellerinde veya altyapı şantiyelerinde internet koptuğu anda mobil uygulamaların kilitlenmesini ve veri kaybını engeller. İnternet erişimi sağlandığı anda sunucuya arka planda otomatik senkronize olur.",
      bullets: [
        "Bodrum katlarda dahi sıfır kesintiyle kesintisiz veri girişi",
        "Dokunmatik ekranlarla uyumlu serbest pafta çizim araçları",
        "Zaman damgalı ve GPS koordinatlı günlük şantiye defteri",
        "Otomatik arka plan veri senkronizasyonu ve çakışma yönetimi"
      ]
    },
    {
      id: "isg",
      title: "BLE IoT İSG Takibi & Akıllı Donanım Zimmeti",
      badge: "KVKK Uyumlu",
      icon: HardHat,
      gradient: "from-amber-500/20 via-orange-500/10 to-transparent",
      borderColor: "border-amber-500/30",
      accentColor: "text-amber-400",
      whatItDoes: "Bluetooth Low Energy (BLE) donanımlarıyla akıllı baret, yelek ve ayakkabıları personelle eşleştirir. Şantiye alanına yerleştirilen BLE Gateway cihazları ile anlık konum ve tehlikeli alan yaklaşım radarı sunar.",
      whatItSolves: "Kamera tabanlı sistemlerin yarattığı KVKK hukuki risklerini ve güneş/toz kaynaklı görüntü aksaklıklarını ortadan kaldırır. İşçinin baretini takmadan vinç altına veya şaft boşluğuna yaklaşması halinde İSG uzmanına anlık alarm gönderir.",
      bullets: [
        "Kişisel verileri ihlal etmeyen donanımsal BLE takip protokolü",
        "Baret ve KKD zimmetlerinin kâğıtsız, dijital MAC adresi kaydı",
        "Tehlikeli bölgelere yetkisiz girişte anlık sesli/mobil uyarı",
        "Ramak kala bildirimleri ve yasal İSG denetim tutanakları"
      ]
    },
    {
      id: "taseron",
      title: "Taşeron Portalı & GPS Kanıtlı Denetim",
      badge: "İş Birliği",
      icon: Building2,
      gradient: "from-purple-500/20 via-pink-500/10 to-transparent",
      borderColor: "border-purple-500/30",
      accentColor: "text-purple-400",
      whatItDoes: "Taşeron alt yüklenicilere özel kısıtlı ve güvenli portal ekranı sağlar. Taşeronlar kendilerine atanan iş emirlerini görür, tamamladıkları imalat için sahada GPS koordinatlı ve zaman damgalı fotoğraf kanıtı yükler.",
      whatItSolves: "'İşi tamamladım ama param ödenmedi' veya 'Eksik yapıp gitmişler' şeklindeki saha sürtüşmelerini bitirir. Şantiye şefi iş kanıtını fotoğrafla doğrulamadan hakedişe onay verilemez.",
      bullets: [
        "Taşerona özel sadeleştirilmiş iş kanıtı yükleme arayüzü",
        "Metadata doğrulaması (EXIF zamanı ve GPS koordinat kontrolü)",
        "Alt yüklenici sözleşme, avans ve teminat takibi",
        "Eksiklik ve kusur bildirimlerine karşı anlık savunma/onay akışı"
      ]
    },
    {
      id: "denetim",
      title: "Yapı Denetim, YİBF & OCR Akıllı Evrak Arşivi",
      badge: "Mevzuat & Kalite",
      icon: ShieldCheck,
      gradient: "from-teal-500/20 via-cyan-500/10 to-transparent",
      borderColor: "border-teal-500/30",
      accentColor: "text-teal-400",
      whatItDoes: "Çevre ve Şehircilik Bakanlığı YİBF süreçleriyle uyumlu denetim formları, beton & karot numune takip zinciri, demir/kalıp kontrol modülü ve Tesseract.js tabanlı OCR akıllı evrak tarama motoru sunar.",
      whatItSolves: "Yapı denetim firmalarını klasörler dolusu kâğıt evrak arşivinden ve elle veri girişinden kurtarır. Ruhsat, tapu ve laboratuvar raporlarını OCR ile tarayarak metin haline getirir ve ilgili projeyle otomatik bağlar.",
      bullets: [
        "Bakanlık YİBF yapısıyla uyumlu denetim hiyerarşisi",
        "Numune karot 7/28 günlük basınç dayanımı otomatik grafiği",
        "OCR motoruyla taranan evrakların aranabilir metne dönüşmesi",
        "Şantiye denetiminde tek tıkla PDF hasar/uygunsuzluk raporu"
      ]
    }
  ]

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 pt-24 pb-20">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Hero Header */}
      <section className="relative px-4 sm:px-6 lg:px-8 py-14 lg:py-20 text-center overflow-hidden border-b border-slate-900">
        <div className="absolute inset-0 bg-gradient-to-b from-cyan-950/20 via-slate-950 to-slate-950 pointer-events-none" />
        <div className="relative z-10 max-w-4xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 bg-cyan-500/10 border border-cyan-500/30 rounded-full px-4 py-1.5 shadow-inner">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-cyan-300 text-xs font-semibold uppercase tracking-wider">
              Nexa ERP Platform Mimarisi
            </span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight">
            Şantiyeler İçin Uçtan Uca{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400">
              Otonom Modüller
            </span>
          </h1>

          <p className="text-slate-300 text-sm sm:text-base leading-relaxed max-w-2xl mx-auto">
            3D BIM modelinden otonom hakedişe, internetsiz saha defterinden BLE IoT iş güvenliğine kadar inşaatın tüm süreçlerini tek platformda birleştirin.
          </p>
        </div>
      </section>

      {/* 6 Core Pillars (Deep Dive) */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-12">
        {features.map((feature, idx) => {
          const Icon = feature.icon
          return (
            <article
              key={feature.id}
              id={feature.id}
              className={`p-6 sm:p-10 rounded-3xl bg-slate-900/80 backdrop-blur-xl border ${feature.borderColor} shadow-2xl relative overflow-hidden transition-all duration-300 hover:border-cyan-400/50`}
            >
              <div className={`absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl ${feature.gradient} rounded-full blur-3xl pointer-events-none`} />

              <div className="relative z-10 space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-800">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-slate-800/90 text-cyan-400 flex items-center justify-center border border-slate-700 shadow-inner">
                      <Icon className="w-6 h-6" />
                    </div>
                    <div>
                      <span className="text-[11px] font-bold text-slate-400 font-mono tracking-wider">
                        MODÜL 0{idx + 1}
                      </span>
                      <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                        {feature.title}
                      </h2>
                    </div>
                  </div>
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-800 text-cyan-300 border border-slate-700">
                    {feature.badge}
                  </span>
                </div>

                {/* Problem - Çözüm Grid */}
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="p-5 rounded-2xl bg-slate-950/60 border border-slate-800/80 space-y-2">
                    <div className="flex items-center gap-2 text-xs font-bold text-cyan-300 uppercase tracking-wider">
                      <Cpu className="w-4 h-4 text-cyan-400" />
                      <span>Ne İşe Yarıyor? (Teknik İşlev)</span>
                    </div>
                    <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                      {feature.whatItDoes}
                    </p>
                  </div>

                  <div className="p-5 rounded-2xl bg-slate-950/60 border border-slate-800/80 space-y-2">
                    <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 uppercase tracking-wider">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span>Neyi Çözüyor? (SaaS Faydası)</span>
                    </div>
                    <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                      {feature.whatItSolves}
                    </p>
                  </div>
                </div>

                {/* Bullet Points (GEO & LLM Parsing) */}
                <div className="pt-2">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                    Öne Çıkan Yetenekler
                  </h3>
                  <div className="grid sm:grid-cols-2 gap-2.5">
                    {feature.bullets.map((b, bIdx) => (
                      <div key={bIdx} className="flex items-center gap-2 text-xs text-slate-200 bg-slate-950/40 p-2.5 rounded-xl border border-slate-800/60">
                        <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
                        <span>{b}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </article>
          )
        })}
      </section>

      {/* CTA Bottom Banner */}
      <section className="py-20 px-4 max-w-4xl mx-auto text-center space-y-6">
        <h2 className="text-3xl sm:text-4xl font-black text-white">
          Şantiyenizin Gereksinimlerine Göre Demo Planlayın
        </h2>
        <p className="text-slate-300 text-sm sm:text-base max-w-xl mx-auto">
          Mühendislerimiz şantiyenizin ihtiyaçlarını analiz etsin; projenizin IFC modelini sisteme yükleyerek canlı test edin.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
          <Link
            href="/iletisim"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 shadow-xl shadow-cyan-500/20"
          >
            <span>Canlı Demo Talep Edin</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl text-sm font-semibold text-slate-300 bg-slate-900 hover:bg-slate-850 border border-slate-800"
          >
            <span>Ana Sayfa ve Kıyaslama</span>
          </Link>
        </div>
      </section>
    </main>
  )
}
