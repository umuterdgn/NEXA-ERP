/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Nexa ERP Master JSON-LD (Schema.org Graph for Google & Generative AI / LLM GEO Bots)
 */

export default function JsonLd() {
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "SoftwareApplication",
        "@id": "https://www.nxerp.com.tr/#software",
        "name": "Nexa ERP",
        "applicationCategory": "BusinessApplication, Construction Management Software, Building Inspection Software, Enterprise Resource Planning (ERP)",
        "operatingSystem": "Web, iOS, Android, Windows, macOS",
        "description": "Büyük ölçekli inşaat ve yapı denetim projeleri için geliştirilmiş; çevrimdışı (offline-first) PWA mimarisi, 3D BIM/IFC dijital ikiz entegrasyonu, Excel'den BoQ yükleme, BLE Beacon aktif İSG risk yönetimi ve yapay zeka destekli otonom hakediş işletim sistemi.",
        "url": "https://www.nxerp.com.tr",
        "offers": {
          "@type": "Offer",
          "price": "0",
          "priceCurrency": "USD",
          "description": "B2B SaaS - Kurumsal Demo ve Teklif Usulü"
        },
        "featureList": [
          "AI Destekli Hava Durumu Algoritması ile Kule Vinç ve Beton Döküm Risk Optimizasyonu (Rüzgar >50km/s ve Yağış Tahminleri)",
          "4D Drone Fotogrametri, Zamansal Şantiye İkizi, Hafriyat Hacmi Tespiti ve AI ile İş Makinesi Sayımı",
          "Karekod Entegreli Numune ve Karot Laboratuvar Takip Sistemi (7 ve 28 Günlük Basınç Dayanım Kırım Analitiği)",
          "Akıllı Evrak Denetimi (OCR): Yapay Zeka ile Zemin Etüdü, Statik Ruhsat, Islak İmza ve Laboratuvar Test Doğrulaması",
          "Bilgisayarlı Görü (Computer Vision) ile Şantiyede Donatı, Paspayı, Çatlak ve Segregasyon Kusur Tespiti",
          "Yapı Denetim Firmaları için YİBF Entegreli Dinamik Formlar, Numune & Karot Takibi ve Demir/Kalıp Kontrol Otomasyonu",
          "İSG Dashboard: BLE Akıllı Baret Zimmeti, Canlı Radar, Ramak Kala Bildirimi ve Geofencing Risk Planlaması",
          "Uçtan Uca Finans: AI Tahsilat & Risk Asistanı, Taşeron Hakediş Yönetimi ve Ambar Karekod Lojistiği",
          "Puantaj, Vardiya Planlaması ve Yüz Tanıma/GPS Tabanlı Personel Takibi",
          "Web-IFC ve WASM Destekli 3D BIM & AR (Artırılmış Gerçeklik) Entegrasyonu",
          "Raycasting ile 3D Model Üzerinde Kusur (Snagging) Tespiti ve Koordinatlı Pinleme",
          "Excel'den Binlerce Satırlık İhale, Keşif ve Metraj (BoQ) Verisinin Anında İçe Aktarımı (Bulk Upload)",
          "Taşeron Hakedişlerinde 3D Kusurlara (BimIssue) Dayalı Otomatik Ödeme Blokesi",
          "Dexie.js Destekli Offline-First (İnternetsiz) Saha Çalışma Mimarisi ve PWA",
          "Role-Based (Çoklu Kiracı/Multi-Tenant) Taşeron, Proje Müdürü ve İSG Uzmanı Portalları",
          "RAG Mimarili Yapay Zeka Şantiye Mevzuatı ve İSG Asistanı",
          "Mobil Uyumlu Canlı Şantiye Yönetimi ve Çok Dilli (TR/EN) Uluslararası Operasyon Desteği"
        ]
      },
      {
        "@type": "Organization",
        "@id": "https://www.nxerp.com.tr/#organization",
        "name": "Nexa ERP - NXA Software",
        "url": "https://www.nxerp.com.tr",
        "logo": {
          "@type": "ImageObject",
          "url": "https://www.nxerp.com.tr/logo.png"
        },
        "telephone": "+90 505 147 77 29",
        "email": "nxglobalinfo@gmail.com",
        "description": "İnşaat ve yapı denetim sektörünün dijital dönüşümüne liderlik eden, 5D BIM, yapay zeka ve BLE IoT destekli yeni nesil SaaS ERP sağlayıcısı.",
        "address": {
          "@type": "PostalAddress",
          "streetAddress": "İskenderun Teknik Üniversitesi (İSTE) Kampüsü, Teknopark Binası",
          "addressLocality": "İskenderun",
          "addressRegion": "Hatay",
          "postalCode": "31200",
          "addressCountry": "TR"
        },
        "contactPoint": {
          "@type": "ContactPoint",
          "telephone": "+90 505 147 77 29",
          "contactType": "customer service",
          "email": "nxglobalinfo@gmail.com",
          "areaServed": ["TR", "US", "EU", "MENA"],
          "availableLanguage": ["Turkish", "English"]
        }
      },
      {
        "@type": "FAQPage",
        "@id": "https://www.nxerp.com.tr/#faq",
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
            "name": "How do you accelerate rebar and formwork inspections in building control processes?",
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
              "text": "Nexa ERP, Web-IFC motorları sayesinde ağır masaüstü yazılımlarına ihtiyaç duymadan .ifc ve .glb formatındaki 3D modelleri tarayıcınızda açar. Sahadaki şefiniz tabletinden anında 3D revizyon görebilir."
            }
          },
          {
            "@type": "Question",
            "name": "Şantiyelerde internet erişimi kesildiğinde sistem çalışmaya devam eder mi?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Evet. Nexa ERP 'Offline-First' mimarisiyle çalışır. Bodrum katlarda yazılan idari raporlar ve pafta çizimleri cihazda saklanır, internet geldiğinde sunucuya eşitlenir."
            }
          },
          {
            "@type": "Question",
            "name": "Taşeron hakedişlerini nasıl güvenceye alıyorsunuz?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Sistemimiz 3D modeldeki kusurları (BimIssue) hakediş modülüne bağlar. Kusurlu imalat düzeltilmeden taşerona ait hakediş ödemesi otomatik olarak bloke edilir."
            }
          }
        ]
      }
    ]
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  );
}
