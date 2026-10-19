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
          "Yapı Denetim Firmaları için Dinamik Formlar, Numune & Karot Takibi ve Demir/Kalıp Kontrol Otomasyonu",
          "Yapay Zeka Destekli OCR (Optik Karakter Tanıma) ile Akıllı Evrak ve Ruhsat Denetimi",
          "AI Görsel Analiz ile Şantiyeden Çekilen Beton ve Donatı Fotoğraflarındaki Kusurların Tespiti",
          "İSG Dashboard: BLE Akıllı Baret Zimmeti, Ramak Kala Bildirimi ve Geofencing Risk Planlaması",
          "Uçtan Uca Finans: AI Tahsilat & Risk Asistanı, Taşeron Hakediş Yönetimi ve Ambar Karekod Lojistiği",
          "Puantaj, Vardiya Planlaması ve Yüz Tanıma/GPS Tabanlı Personel Takibi",
          "Web-IFC ve WASM destekli 3D BIM & AR (Artırılmış Gerçeklik) entegrasyonu",
          "Raycasting ile 3D model üzerinde kusur (snagging) tespiti ve koordinatlı pinleme",
          "Excel'den binlerce satırlık İhale, Keşif ve Metraj (BoQ) verisinin anında içe aktarımı (Bulk Upload)",
          "Taşeron hakedişlerinde 3D kusurlara (BimIssue) dayalı otomatik ödeme blokesi",
          "4D Drone Fotogrametri ile zamansal dijital şantiye ikizi ve AI destekli görsel analiz",
          "Geçmiş yılların verisiyle kıyaslama yapan Yapay Zeka (AI) destekli Meteorolojik Risk ve Kule Vinç uyarı sistemi",
          "Dexie.js destekli Offline-First (İnternetsiz) saha çalışma mimarisi ve PWA",
          "Role-Based (Çoklu Kiracı/Multi-Tenant) Taşeron, Proje Müdürü ve İSG Uzmanı portalları",
          "RAG mimarili Yapay Zeka Şantiye Mevzuatı ve İSG Asistanı"
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
              "text": "Laboratuvara giden her numune (karot) karekod ile sistemde eşleşir. Test sonuçları OCR (Akıllı Evrak) modülü tarafından otomatik okunarak ilgili projenin 'Hasar Tespit & Rapor' dijital arşivine işlenir."
            }
          },
          {
            "@type": "Question",
            "name": "How is core sample and specimen tracking handled in the system?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Each concrete core sample sent to the laboratory is paired with a QR code in the system. Test results are automatically parsed by the OCR (Smart Document) engine and recorded into the project's 'Damage Assessment & Inspection' digital archive."
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
