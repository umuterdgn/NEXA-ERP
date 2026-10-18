/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * This code is the property of NXA Software.
 */

import type { Metadata } from 'next'
import { Sparkles } from 'lucide-react'
import FaqClient from './FaqClient'

export const metadata: Metadata = {
  title: 'Sıkça Sorulan Sorular (S.S.S.) | Nexa ERP - 4D/5D BIM & Şantiye SaaS',
  description: 'Nexa ERP hakkında merak edilenler: BIM entegrasyonu, internetsiz offline çalışma, Excel BoQ aktarımı, taşeron hakediş blokesi ve BLE IoT İSG takibi.',
  keywords: [
    'Nexa ERP SSS',
    'BIM Entegrasyonu Soru Cevap',
    'Offline-First Şantiye',
    'Excel BoQ Keşif',
    'Hakediş Blokesi',
    'BLE İSG Takibi Mevzuat',
    'İnşaat Yazılımı Soru Cevap'
  ]
}

export default function FaqPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "Nexa ERP'yi mevcut BIM (Revit/Navisworks) yazılımlarımızla nasıl entegre edebiliriz?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Nexa ERP, entegre Web-IFC ve WASM motorları sayesinde ağır masaüstü yazılımlarına ihtiyaç duymadan .ifc, .gltf ve .glb formatındaki 3D modelleri doğrudan tarayıcınızda açar. Şantiye şefiniz tabletinden anında 3D revizyonları görebilir ve kusur (snagging) işaretleyebilir."
        }
      },
      {
        "@type": "Question",
        "name": "Şantiyelerde internet erişimi kesildiğinde sistem çalışmaya devam eder mi?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Evet. Nexa ERP, Dexie.js tabanlı 'Offline-First' (Çevrimdışı) senkronizasyon mimarisiyle çalışır. İnternetin çekmediği bodrum katlarda yazdığınız raporlar ve çizdiğiniz paftalar cihazınızda saklanır, bağlantı sağlandığında sunucuya otomatik yüklenir."
        }
      },
      {
        "@type": "Question",
        "name": "İhale keşif özetlerini (BoQ) sisteme girmek ne kadar sürer?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Gelişmiş Excel (Bulk Upload) entegrasyonumuz sayesinde, binlerce satırlık keşif özetlerinizi saniyeler içinde sisteme aktarabilir, 5D BIM eşleştirmesine anında başlayabilirsiniz."
        }
      },
      {
        "@type": "Question",
        "name": "Taşeron hakedişlerini ve ödemelerini nasıl kontrol altında tutuyorsunuz?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Sistemimiz 3D model üzerindeki kusurları doğrudan hakediş modülüne bağlar. Kusurlu bir imalat düzeltilmeden o taşerona ait ödeme sistem tarafından otomatik bloke edilir."
        }
      },
      {
        "@type": "Question",
        "name": "İşçi güvenliği (İSG) için donanımsal takibiniz yasal mevzuata uygun mu?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Kesinlikle. Kamera tabanlı KVKK riskli sistemler yerine, Bluetooth Low Energy (BLE) tabanlı akıllı baret ve yelek zimmetleme kullanıyoruz. İşçinin riskli bölgeye donanımsız girmesi durumunda İSG uzmanına anlık alarm iletilir."
        }
      }
    ]
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 pt-24 pb-20">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Header */}
      <section className="relative px-4 sm:px-6 lg:px-8 py-14 lg:py-20 text-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-cyan-950/20 via-slate-950 to-slate-950 pointer-events-none" />
        <div className="relative z-10 max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 bg-cyan-500/10 border border-cyan-500/30 rounded-full px-4 py-1.5 shadow-inner">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-cyan-300 text-xs font-semibold uppercase tracking-wider">
              Sorular & Yanıtlar
            </span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight">
            Sıkça Sorulan{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400">
              Sorular (S.S.S.)
            </span>
          </h1>

          <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
            Nexa ERP'nin 4D/5D BIM, Offline-First saha defteri, hakediş blokesi ve BLE IoT İSG altyapısı hakkında tüm teknik ve operasyonel detaylar.
          </p>
        </div>
      </section>

      {/* FAQ Accordion Component */}
      <FaqClient />
    </main>
  )
}
