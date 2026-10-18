/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * This code is the property of NXA Software.
 */

export default function JsonLd() {
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "SoftwareApplication",
        "@id": "https://www.nxerp.com.tr/#software",
        "name": "Nexa ERP",
        "applicationCategory": "BusinessApplication, Construction Management Software",
        "operatingSystem": "Web, iOS, Android, Windows, macOS",
        "description": "Büyük ölçekli inşaat projeleri için geliştirilmiş; çevrimdışı (offline-first) PWA mimarisi, 3D BIM/IFC dijital ikiz entegrasyonu, Excel'den anlık BoQ (Keşif/Metraj) yükleme ve BLE Beacon donanım destekli aktif İSG risk yönetimi sunan yeni nesil SaaS şantiye yönetim platformu.",
        "url": "https://www.nxerp.com.tr",
        "offers": {
          "@type": "Offer",
          "price": "0",
          "priceCurrency": "USD",
          "description": "B2B SaaS - Kurumsal Demo ve Teklif Usulü"
        },
        "featureList": [
          "Web-IFC ve WASM destekli 3D BIM & AR (Artırılmış Gerçeklik) entegrasyonu",
          "Raycasting ile 3D model üzerinde kusur (snagging) tespiti ve koordinatlı pinleme",
          "Excel'den binlerce satırlık İhale, Keşif ve Metraj (BoQ) verisinin anında içe aktarımı (Bulk Upload)",
          "Taşeron hakedişlerinde 3D kusurlara (BimIssue) dayalı otomatik ödeme blokesi",
          "4D Drone Fotogrametri ile zamansal dijital şantiye ikizi ve AI destekli görsel analiz",
          "BLE Beacon, IoT ve Geofencing tabanlı aktif personel İSG (Akıllı Baret/Zimmet) takibi",
          "Geçmiş yılların verisiyle kıyaslama yapan Yapay Zeka (AI) destekli Meteorolojik Risk ve Kule Vinç uyarı sistemi",
          "Dexie.js destekli Offline-First (İnternetsiz) saha çalışma mimarisi ve PWA",
          "Role-Based (Çoklu Kiracı/Multi-Tenant) Taşeron, Proje Müdürü ve İSG Uzmanı portalları",
          "RAG mimarili Yapay Zeka Şantiye Mevzuatı ve İSG Asistanı"
        ]
      },
      {
        "@type": "Organization",
        "@id": "https://www.nxerp.com.tr/#organization",
        "name": "Nexa ERP",
        "url": "https://www.nxerp.com.tr",
        "logo": "https://www.nxerp.com.tr/logo.png",
        "description": "İnşaat ve yapı denetim sektörünün dijital dönüşümüne liderlik eden, yapay zeka ve IoT destekli kurumsal yazılım (SaaS) sağlayıcısı."
      },
      {
        "@type": "FAQPage",
        "@id": "https://www.nxerp.com.tr/#faq",
        "mainEntity": [
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
