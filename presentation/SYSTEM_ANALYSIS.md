# NEXA ERP — Kapsamlı Sistem Mimarisi & Kod Tabanı Analiz Raporu
**Versiyon:** 4.2.0 Enterprise | **Tarih:** Kasım 2026 | **Geliştirici:** NXA Software

---

## 1. Yönetici Özeti ve Vizyon

**NEXA ERP**, modern inşaat, taahhüt ve yapı denetim sektörünün tüm paydaşlarını (Ana Yüklenici, Yapı Denetim Firmaları, Taşeronlar, Şantiye Şefleri, Saha Mühendisleri, Finans/Muhasebe Ekipleri ve Yatırımcılar) tek bir dijital platformda buluşturan yeni nesil **"All-in-One ConTech"** ekosistemidir.

Geleneksel inşaat yönetiminde yaşanan veri kopukluğu, geciken hakediş onayları, sahadaki imalat hatalarının geç fark edilmesi ve 2D paftalar ile 3D saha gerçekliği arasındaki uyumsuzluk problemlerini; **Yapay Zeka (Gemini Vision)**, **Federated 3D BIM & X-Ray Görüş Motoru**, **IoT/BLE Konum Takibi**, **YİBF Entegrasyonlu Akıllı Yapı Denetim** ve **Uçtan Uca Finans/Hakediş** otomasyonu ile ortadan kaldırır.

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                 NEXA ERP EKOSİSTEMİ                                    │
└────────────────────────────────────────────────────────────────────────────────────────┘
        │
        ├── 1. MİMARİ & DİJİTAL İKİZ (2D CAD / PDF -> Gemini AI -> 3D BIM & X-Ray)
        ├── 2. MALİYET & İHALE (Otomatik Metraj / BoQ -> Çevre Şehircilik Pozları -> Keşif)
        ├── 3. SAHA & LOJİSTİK (Harita, Geofence, BLE İşçi/Ekipman Takibi, İrsaliye & Depo)
        ├── 4. YAPI DENETİM & KALİTE (YİBF Entegrasyonu, Karot/Beton Testleri, Demir Vizesi)
        ├── 5. TAŞERON & HAKEDİŞ (İş Emirleri, Fotoğraflı Kanıt, Kesintiler, E-Fatura)
        └── 6. İSG & MOBİL AR (Sanal X-Ray Duvar Arkası Görüş, SOS Acil Durum, Canlı İSG)
```

---

## 2. Uçtan Uca Olay Örgüsü ve Veri Akışı (End-to-End Workflow)

Nexa ERP'deki iş süreçleri birbirinden kopuk modüller yerine birbirini besleyen canlı bir olay örgüsü (event-driven pipeline) şeklinde çalışır:

```
[2D PDF / DWG Pafta Yükleme]
            │
            ▼
[Gemini AI Multimodal Vision & LibreDWG Motoru]
   - Vektörel CAD katmanlarının ayrıştırılması (Duvar, Kolon, Kiriş, Kapı, Pencere)
   - Metrik koordinatların çıkarılması (startX, startY, endX, endY, height)
            │
            ├──► [Otomatik Metraj & BoQ (Bill of Quantities)]
            │       └── Çevre ve Şehircilik Bakanlığı Pozları ile otomatik eşleşme (Birim Fiyat)
            │
            └──► [2D'den 3D'ye Parametrik Ekstrüzyon & Federated BIM]
                    ├── IFC + GLTF + CAD katmanlarının tek sahnede birleşimi
                    ├── X-Ray Duvar İçi Tesisat Görünürlüğü (MEP & Statik)
                    └── Çakışma Analizi (Clash Detection) & BIM Sorun Kaydı
                                │
                                ▼
            [İhale, Satın Alma & Taşeron Sözleşmeleri]
               - Keşif özeti üzerinden taşeron tekliflerinin toplanması
               - Sözleşme bağlama ve birim fiyat garantisi
                                │
                                ▼
            [Saha Operasyonları & IoT Takibi]
               - Mobil Uygulama & BLE İkonları ile sahadaki işçi/ekipman konumu
               - Şantiye Haritası ve Geofence alan denetimi
               - Günlük Şantiye Defteri (Site Diary) ve İSG Güvenlik Takibi
                                │
                                ▼
            [Mobil AR & Saha Denetimi (X-Ray Vision)]
               - Şantiyede kamerayı duvara tutarak arkasındaki boru/donatıyı görme
               - Mobil QR Check-in & İmalat Kanıtı (Work Proof) yükleme
                                │
                                ▼
            [Yapı Denetim & YİBF Uyumluluğu]
               - Demir Donatı Vizesi & Kalıp Kontrolü
               - Tutanak / Karot & Beton Kırım Testleri
               - Uygunsuzluk (DOF) ve Eksiklik (Deficiency) Takibi
                                │
                                ▼
            [Otomatik Hakediş & Muhasebe Kapama]
               - Tamamlanan imalatların metraj üzerinden doğrulanması
               - Ceza ve avans kesintilerinin otomatik düşülmesi
               - E-Fatura entegrasyonu ve Cari Hesap mutabakatı
```

---

## 3. Sistem Mimarisi & Teknoloji Yığını

| Katman | Teknoloji / Kütüphane | Kullanım Amacı |
|---|---|---|
| **Frontend Framework** | **Next.js 16 (App Router)** | Modern SSR, React Server Components (RSC), dinamik rota grupları |
| **UI & Styling** | **Tailwind CSS v4 + Framer Motion** | Dark Enterprise UI, Cam Efektli (Glassmorphism) kartlar, mikro animasyonlar |
| **BIM & 3D Render** | **Three.js, React Three Fiber (R3F), Web-IFC** | Tarayıcıda GPU tabanlı 3D modelleme, IFC/GLTF render, X-Ray şeffaflık |
| **CAD Vektör Motoru** | **@mlightcad/libredwg-converter, WebAssembly** | DWG ve DXF mimari çizimlerinin sunucuda/tarayıcıda parse edilmesi |
| **Yapay Zeka (Vision)** | **Google Gemini 2.0 Flash / 1.5 Pro Multimodal** | Mimari paftalardan duvar/oda/metraj çıkarımı, yapı denetim görsel doğrulama |
| **Veritabanı & ORM** | **PostgreSQL + Prisma ORM v6** | 150+ ilişkisel model, ACID işlemler, multi-tenancy desteği |
| **Kimlik & Yetkilendirme** | **NextAuth.js v5 (Beta) + JWT + RBAC** | 28 farklı kullanıcı rolü, şirket ve kiracı izolasyonu |
| **Saha Harita & CBS** | **Leaflet, React-Leaflet, Turf.js** | Şantiye poligonları, Geofencing, drone ortofoto harita katmanları |
| **Gerçek Zamanlı İletişim**| **Socket.io + Pusher + Web Push** | Anlık BLE konum güncellemeleri, SOS acil durum bildirimleri, chat |
| **Mobil Platform** | **React Native / Expo + WebXR/AR** | iOS/Android saha uygulaması, offline senkronizasyon, kamera AR modülü |
| **Otomasyon & Test** | **Playwright Chromium** | E2E testler, Retina ekran görüntüsü alma pipeline'ı, PDF sunum üretimi |

---

## 4. Kullanıcı Rolleri ve Yönetim Hiyerarşisi (RBAC)

Nexa ERP, şantiyedeki en üst düzey yatırımcıdan sahadaki taşeron işçisine kadar 28 farklı rolü destekler:

1. **SUPER_ADMIN:** Platform sahibi. Tüm kiracıları (Tenant), lisansları, sistem loglarını ve küresel ayarları yönetir.
2. **ADMIN / PROJECT_MANAGER:** Şirket sahibi veya proje direktörü. Projeleri, bütçeleri, onay zincirlerini ve genel ilerlemeyi yönetir.
3. **SITE_MANAGER (Şantiye Şefi):** Günlük şantiye defteri, taşeron koordinasyonu, iş emirleri ve malzeme kabul süreçlerini yönetir.
4. **ENGINEER (Saha Mühendisi / Mimar):** 2D/3D paftaları inceler, imalat kontrollerini yapar, metraj güncellemelerini ve teknik revizyonları işler.
5. **INSPECTION_ADMIN & INSPECTOR (Yapı Denetim Sorumlusu & Denetçi):** Çevre Şehircilik YİBF mevzuatına uygun demir donatı vizeleri, beton testleri, karot numuneleri ve yasal tutanakları onaylar.
6. **MUHASEBE & FINANCE_MANAGER:** Hakediş tabloları, cari hesaplar, banka işlemleri, çek/senet, nakit akışı ve e-fatura süreçlerini yürütür.
7. **PROCUREMENT_MANAGER:** Satın alma talepleri, tedarikçi teklif toplamaları (RFQ) ve depo lojistik randevularını yönetir.
8. **SUBCONTRACTOR (Taşeron Yetkilisi):** Kendisine atanan iş paketlerini görür, sahadan fotoğraflı imalat kanıtı yükler, hakediş talep eder.
9. **ISG_EXPERT (İş Sağlığı ve Güvenliği Uzmanı):** Risk haritalarını inceler, KKD zimmetlerini denetler, ramak kala raporlarını ve acil durum protokollerini yönetir.
10. **CLIENT / INVESTOR (İşveren / Yatırımcı):** Şeffaf yatırımcı portalından proje ilerleme yüzdesini, harcamaları, drone görüntülerini ve 3D BIM modelini izler.

---

## 5. Çekirdek Modüller ve İşlevsel Yetenekler

### 5.1. AI Blueprint Vision & Otomatik Metraj Motoru
- Kullanıcı mimari veya statik bir PDF/DWG paftayı sisteme yükler.
- Sunucu tarafında çalışan LibreDWG ve Gemini 2.0 Multimodal Vision motoru paftayı analiz eder.
- Çizimdeki duvar kalınlıkları, kapı/pencere açıklıkları, oda alanları ve kolon koordinatları çıkartılır.
- **Resmi Poz Eşleme:** Çevre, Şehircilik ve İklim Değişikliği Bakanlığı'nın güncel birim fiyat kütüphanesiyle otomatik eşleştirilerek keşif tablosu (BoQ) oluşturulur.

### 5.2. 3D Federated BIM & Sanal X-Ray Motoru
- IFC, GLTF ve 2D paftalardan otomatik üretilen 3D katmanlar tek bir sahnede birleşir.
- **Disiplin Katmanları:** Mimari (Turuncu), Statik (Mavi), Elektrik (Sarı), Mekanik (Camgöbeği), Akustik/Yalıtım (Mor).
- **X-Ray Görünümü:** Tek bir butonla dış duvarlar yarı saydam hale gelir; duvarın ve tavanın içinden geçen elektrik kablo tavaları, yangın boruları ve havalandırma kanalları görünür.
- **Çakışma Tespiti (Clash Detection):** Statik kiriş ile mekanik borunun kesiştiği noktalar otomatik algılanarak BIM Issue kaydına dönüştürülür.

### 5.3. Saha Haritası, Drone Fotogrametri & BLE IoT
- Şantiyenin GIS sınırları harita üzerinde poligonlarla belirlenir (Geofencing).
- İşçilerin ve iş makinelerinin BLE beacon veya GPS verileriyle hangi blokta ve katta olduğu gerçek zamanlı takip edilir.
- İHA/Drone ile çekilen ortofoto haritalar sisteme yüklenerek hafriyat kazı/dolgu kübaj hesaplamaları yapılır.

### 5.4. Akıllı Yapı Denetim & YİBF Uyumluluğu
- Türkiye Cumhuriyeti Çevre ve Şehircilik Bakanlığı Yapı Denetim Sistemi (YİBF) ile tam entegre çalışır.
- Kalıp ve demir donatı vizeleri saha fotoğrafları ve GPS konumu ile kayıt altına alınır.
- Laboratuvar beton kırım ve karot test sonuçları sisteme girildiğinde mukavemet eğrileri otomatik çizilir.

### 5.5. Taşeron, İş Paketleri & Otomatik Hakediş
- Taşeronlar mobil veya web arayüzünden tamamladıkları imalatları fotoğraf kanıtlarıyla bildirir.
- Şantiye şefi sahada onayladığında, ilgili kalem otomatik olarak dönemsel hakedişe (Progress Billing) aktarılır.
- Stopaj, teminat kesintisi, avans mahsubu ve şantiye elektrik/su giderleri otomatik düşülerek net hakediş tutarı hesaplanır.

### 5.6. Şantiye İSG & Mobil AR (Augmented Reality)
- Sahadaki mühendis telefon kamerasını bitmiş bir duvara doğrulttuğunda; BIM modelindeki su ve elektrik hatları gerçek duvarın üzerine bindsirilir.
- İSG tehlike bölgeleri (ör. şaft boşlukları, kule vinç çalışma alanı) sanal güvenlik çiti ile çevrilir; izinsiz girişlerde anında SMS ve push bildirim gönderilir.

---

## 6. Güvenlik, Veri İzolasyonu ve SaaS Mimarisi

- **Multi-Tenant İzolasyonu:** Her firma `tenantId` ile mantıksal olarak ayrılmıştır. Veritabanı seviyesinde çapraz erişim kesinlikle engellenir.
- **White-Labeling:** Enterprise kiracılar kendi logolarını, kurumsal renklerini ve özel domainlerini (ör. `erp.firmasi.com`) kullanabilir.
- **Denetim İzi (Audit Log):** Sistemdeki her metraj değişikliği, hakediş onayı ve doküman indirme işlemi kullanıcı IP'si ve zaman damgasıyla kriptografik olarak kaydedilir.
- **S3 & Şifreli Depolama:** Hassas mimari paftalar ve sözleşmeler AES-256 şifreli bulut depolama alanında saklanır.

---

## 7. Sonuç

Nexa ERP, klasik inşaat yazılımlarının ötesine geçerek; yapay zeka gücüyle paftadan metraj çıkaran, 3D BIM ile şantiyeyi dijitalleştiren ve hakedişten yapı denetime tüm süreci otopilota alan Türkiye'nin en gelişmiş inşaat teknolojileri platformudur.

