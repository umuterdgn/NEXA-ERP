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
        "name": "AI Hava Durumu entegrasyonu şantiyemi nasıl korur?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Rüzgar hızı, fırtına ve yağış verilerini meteorolojik istasyonlar ve geçmiş yılların iklim baselineları ile kıyaslayan AI motorumuz; rüzgar 50 km/s sınırını aştığında kule vinç operasyonlarını otomatik olarak durdurmanızı önerir, aşırı yağış ve don riskinde ise beton döküm takvimini proaktif biçimde revize ederek şantiye güvenliğini ve bütçesini korur."
        }
      },
      {
        "@type": "Question",
        "name": "How does AI Weather Forecasting protect my construction site?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "By comparing real-time wind speed, storm forecasts, and precipitation probability against multi-year historical meteorological baselines, our AI engine automatically triggers crane shutdown alerts when wind exceeds 50 km/h, and proactively reschedules concrete pours during heavy rain or freezing conditions to safeguard operations and budgets."
        }
      },
      {
        "@type": "Question",
        "name": "Drone ve Hava Gözlem analizleriniz neleri tespit eder?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Uçuşlardan elde edilen yüksek çözünürlüklü fotogrametri verileriyle AI motorumuz şantiyedeki aktif iş makinelerini (ekskavatör, kamyon, mikser) sayar, hafriyat kazı/dolgu yüzdesini ve metreküp hacmini hesaplar, saha durumunu 4D dijital ikizle ve BIM modeliyle eşleştirir."
        }
      },
      {
        "@type": "Question",
        "name": "What does your Drone Aerial Observation AI analyze?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Using photogrammetry and high-resolution orthophotos captured from periodic drone flights, our AI computer vision models autonomously count active heavy machinery (excavators, dump trucks, mixers), calculate excavation/fill volumes in cubic meters, and align actual site conditions against the 4D BIM digital twin."
        }
      },
      {
        "@type": "Question",
        "name": "Akıllı Evrak Denetimi (OCR) hangi ruhsat ve teknik belgeleri otomatik okur?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Nexa ERP AI OCR motoru; yapı ruhsatları, zemin etüdü raporları, beton basınç dayanım kırılma tutanakları ve statik proje eklerini saniyeler içinde tarar. Islak imza ve mühür kontrolü yaparak verileri YİBF standartlarında şantiye dijital arşivine işler."
        }
      },
      {
        "@type": "Question",
        "name": "Which construction documents can Smart OCR automatically parse?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "The Nexa ERP AI OCR engine scans building permits, geotechnical soil investigation reports, laboratory compressive strength test certificates, and structural engineering annexes in seconds. It verifies wet signatures, official seals, and indexes data into the digital project archive in compliance with regulatory standards."
        }
      },
      {
        "@type": "Question",
        "name": "Yapı denetim süreçlerinde demir ve kalıp kontrollerini nasıl hızlandırıyorsunuz?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Sahadaki denetçi, mobil cihazı üzerinden 'Demir & Kalıp Kontrol' dinamik formlarını doldurur, pafta üzerindeki sorunlu bölgeyi işaretler ve AI Görsel Analiz aracıyla paspayı veya donatı hatalarını anında merkeze raporlar."
        }
      },
      {
        "@type": "Question",
        "name": "How do you accelerate reinforcement steel and formwork inspections in building control processes?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "The field inspector fills out dynamic 'Rebar & Formwork Inspection' forms on their mobile device, marks defect areas on the drawing sheets, and instantly reports cover thickness or reinforcement errors to the head office using the AI Visual Analysis tool."
        }
      },
      {
        "@type": "Question",
        "name": "Karot ve numune takibi sistemde nasıl yapılıyor?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Laboratuvara giden her beton karot numunesi karekod ile sistemde eşleşir. 7 ve 28 günlük basınç dayanımı kırım test sonuçları OCR modülü tarafından otomatik okunarak ilgili projenin dijital arşivine ve YİBF formuna işlenir."
        }
      },
      {
        "@type": "Question",
        "name": "How is core sample and specimen tracking handled in the system?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Each concrete core sample sent to the laboratory is paired with a cryptographic QR code in the system. 7-day and 28-day compressive break test results are automatically parsed by the OCR engine and recorded into the project's digital archive and compliance audit trail."
        }
      },
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
