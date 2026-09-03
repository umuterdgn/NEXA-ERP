# NEXA (Müteahhit ERP + Yapı Denetim OS) - Proje Anatomisi ve Modül Haritası

**Sürüm:** V1/V2  
**Geliştirici:** Umut Erdoğan (NXA Software)  
**Tarih:** 2026  
**Teknoloji Stack:** Next.js 16, Prisma ORM, PostgreSQL, TypeScript, React, TailwindCSS

---

## A. Çekirdek Mimari ve Altyapı

### A1. Multi-Tenant (Çoklu Kiracı) Yapısı

**Konsept:** SaaS mimarisi ile Müteahhit ve Yapı Denetim firmalarının veri izolasyonu

**Route Groups:**
- `app/(inspection)/` - Yapı Denetim OS modülleri (Denetçiler, Kontrol Elemanları için)
- `app/(public)/` - Müşteri/Müteahhit portalı (Salt okunur ilerleme takibi)
- `app/admin/` - Ana ERP yönetim paneli
- `app/subcontractor/` - Taşeron portalı
- `app/personnel/` - Personel mobil arayüzü
- `app/super-admin/` - SaaS yöneticisi paneli

**Prisma Modelleri:**
- `Tenant` - Şirket/kurum bazlı veri izolasyonu
- `User` - Sistem kullanıcıları (Admin, Super Admin)
- `Personel` - Personel kayıtları (Tenant ve Company ilişkisi ile)
- `Company` - Firma yönetimi (MAIN_CONTRACTOR, SUBCONTRACTOR, INSPECTION)

**Dosya Yolları:**
- `prisma/schema.prisma` - Tenant, User, Personel, Company modelleri
- `lib/auth.ts` - NextAuth konfigürasyonu, User ve Personel tabanlı authentication
- `lib/auth.config.ts` - Auth ayarları ve middleware
- `app/api/auth/[...nextauth]/route.ts` - Authentication API endpoint'i

**Çalışma Mantığı:**
1. Her `Tenant` kendi projelerini, personelini ve ekipmanlarını yönetir
2. `CompanyType` enum ile MAIN_CONTRACTOR (Ana Yüklenici), SUBCONTRACTOR (Taşeron), INSPECTION (Yapı Denetim) ayrımı
3. `UserRole` enum ile SUPER_ADMIN, ADMIN, SITE_MANAGER, MUHASEBE, STAFF, ENGINEER, SUBCONTRACTOR, CLIENT yetkilendirme
4. NextAuth ile User tablosu üzerinden login, Personel tablosu ile eşleştirme

---

### A2. Veritabanı Şeması ve Rol Yönetimi (RBAC)

**Prisma Modelleri:**
- `User` - Kullanıcı hesapları, permissions array ile modül bazlı yetkilendirme
- `UserRole` - SUPER_ADMIN, ADMIN, SITE_MANAGER, MUHASEBE, STAFF, ENGINEER, SUBCONTRACTOR, CLIENT
- `CompanyType` - MAIN_CONTRACTOR, SUBCONTRACTOR, SUPPLIER, CLIENT, INSPECTION
- `SystemLog` - Audit trail ve sistem logları

**Dosya Yolları:**
- `prisma/schema.prisma` - User, UserRole, SystemLog modelleri
- `lib/auth.ts` - Role-based session yönetimi
- `app/admin/users/page.tsx` - Kullanıcı yönetimi arayüzü
- `app/super-admin/tenants/page.tsx` - Tenant yönetimi

**Çalışma Mantığı:**
1. `User.permissions` array ile modül bazlı erişim kontrolü (dashboard, cms, archive, finance, stock, staff, users)
2. Middleware ile route bazlı yetkilendirme kontrolü
3. SystemLog ile tüm işlemlerin audit trail'i

---

## B. Müteahhit / Ana Yüklenici ERP Modülleri

### B1. Personel Yönetimi ve Puantaj (Timesheets)

**Konsept:** Personel takibi, günlük/aylık puantaj girişleri, maaş ve ödeme yönetimi

**Prisma Modelleri:**
- `Personel` - Personel kayıtları (TC No, SGK No, maaş, yevmiye, departman, pozisyon)
- `AttendanceRecord` - Giriş/çıkış ve puantaj kayıtları (GPS check-in ile)
- `PersonelPayment` - Maaş, SGK, prim, avans ödemeleri
- `SiteHistory` - Personelin şantiye geçmişi
- `LeaveRequest` - İzin talepleri (Yıllık, Mazeret, Hastalık, Ücretsiz)
- `Profession` - Meslek/Birim yönetimi (Kalıpçı, Elektrikçi, Demirci, Şoför)

**Dosya Yolları:**
- `app/admin/personel/page.tsx` - Personel listesi ve yönetimi
- `app/admin/personel/[id]/page.tsx` - Personel detay sayfası
- `app/admin/attendance/page.tsx` - Puantaj ve yoklama kayıtları
- `app/api/admin/personnel/route.ts` - Personel CRUD API
- `app/api/admin/personnel/[id]/route.ts` - Personel detay API
- `app/api/attendance/check-in/route.ts` - GPS check-in API
- `app/api/attendance/worker-count/route.ts` - Şantiye işçi sayısı API

**Çalışma Mantığı:**
1. `AttendanceRecord` ile günlük check-in/check-out kayıtları
2. GPS koordinatları ile şantiye içinde doğrulama
3. `dayMultiplier` ile tam gün (1.0) veya yarım gün (0.5) hesaplama
4. `PersonelPayment` ile maaş, SGK, prim, avans ödemeleri
5. `LeaveRequest` ile izin talepleri ve onay akışı

---

### B2. İSG (İş Sağlığı ve Güvenliği)

**Konsept:** İSG kayıtları, uyarılar, tehlike bildirimleri ve KKD zimmeti

**Prisma Modelleri:**
- `IsgReport` - İSG raporları (TEHLIKE, KAZA_TUTANAGI, EKSIK_DOKUM)
- `NearMissReport` - Ramak kala bildirim sistemi (Anonim veya isimli)
- `PPEDelivery` - KKD (Kişisel Koruyucu Donanım) dijital zimmet
- `Certificate` - Sertifika ve belge takibi (SGK eğitimi, sağlık raporu)
- `Insurance` - İş kazası sigortası takibi

**Dosya Yolları:**
- `app/admin/isg/page.tsx` - İSG ana panel
- `app/admin/isg/certificates/page.tsx` - Sertifika yönetimi
- `app/admin/isg/master-plan/page.tsx` - İSG master plan
- `app/admin/isg/near-miss/page.tsx` - Ramak kala bildirimleri
- `app/admin/isg/ppe-forms/page.tsx` - KKD zimmet formları
- `app/api/admin/isg/route.ts` - İSG rapor API
- `app/api/admin/certificates/route.ts` - Sertifika API
- `app/api/admin/near-miss/route.ts` - Ramak kala API

**Çalışma Mantığı:**
1. `IsgReport` ile tehlike, kaza tutanağı ve eksik doküman kayıtları
2. `NearMissReport` ile anonim ramak kala bildirimleri
3. `PPEDelivery` ile KKD zimmeti ve dijital imza
4. `Certificate` ile sertifika süre takibi ve expiry uyarıları
5. `Insurance` ile iş kazası sigortası ve yenileme takibi

---

### B3. Taşeron ve Hakediş Sistemi

**Konsept:** Alt yüklenici sözleşmeleri, kesintiler (cezalar) ve hakediş onay mekanizması

**Prisma Modelleri:**
- `Company` - Taşeron firmalar (CompanyType.SUBCONTRACTOR)
- `SubcontractorContract` - Taşeron sözleşmeleri (UNIT_PRICE, LUMP_SUM)
- `ProgressBilling` - Hakediş kayıtları (DRAFT, PENDING_APPROVAL, APPROVED, PAID)
- `Deduction` - Kesintiler ve cezalar (hakedişe uygulanan)
- `DailyProgress` - Günlük ilerleme raporları
- `Audit` - Taşeron denetim ve performans puanları
- `WorkerDocument` - İSG ve SGK evrak takibi

**Dosya Yolları:**
- `app/admin/subcontractors/contracts/page.tsx` - Taşeron sözleşmeleri
- `app/admin/subcontractors/deductions/page.tsx` - Kesintiler ve cezalar
- `app/admin/subcontractors/documents/page.tsx` - İşçi evrakları
- `app/admin/progress-payments/page.tsx` - Hakediş yönetimi
- `app/admin/progress-payments/[id]/page.tsx` - Hakediş detay ve onay
- `app/admin/audits/page.tsx` - Taşeron denetimleri
- `app/api/progress-billing/route.ts` - Hakediş API
- `app/api/deductions/route.ts` - Kesinti API
- `app/api/worker-documents/route.ts` - İşçi evrak API

**Çalışma Mantığı:**
1. `SubcontractorContract` ile taşeron sözleşmeleri (birim fiyat veya toplam fiyat)
2. `ProgressBilling` ile aylık hakediş hesaplaması (totalAmount - deductions = netAmount)
3. `Deduction` ile cezalar ve kesintiler (appliedToBillingId ile hakedişe bağlama)
4. `Audit` ile taşeron performans puanlaması (OHS, QUALITY, PROGRESS)
5. `DailyProgress` ile günlük ilerleme fotoğrafları ve tamamlanma yüzdesi

---

### B4. Satınalma ve Depo/Stok Yönetimi

**Konsept:** Malzeme talepleri, onay akışları ve depo giriş/çıkışları

**Prisma Modelleri:**
- `MaterialRequest` - Malzeme talepleri (PENDING, QUOTING, APPROVED, REJECTED, DELIVERED)
- `PurchaseOrder` - Satınalma siparişleri
- `Stock` - Stok kartları (S001, S002 kod sistemi)
- `StockTransaction` - Stok hareketleri (IN, OUT)
- `StockMovement` - Proje bazlı stok giriş/çıkışları
- `Cari` - Tedarikçi/Müşteri yönetimi
- `Debt` - Borç kayıtları
- `Payment` - Ödeme kayıtları

**Dosya Yolları:**
- `app/admin/procurement/page.tsx` - Satınalma talepleri
- `app/admin/stock/page.tsx` - Stok yönetimi
- `app/admin/stock/[id]/page.tsx` - Stok detay ve hareketler
- `app/api/material-requests/route.ts` - Malzeme talep API
- `app/api/purchase-orders/route.ts` - Satınalma sipariş API
- `app/api/admin/stock/route.ts` - Stok API
- `app/api/admin/stock/transaction/route.ts` - Stok hareket API
- `app/api/admin/suppliers/debt/route.ts` - Borç API
- `app/api/admin/suppliers/payment/route.ts` - Ödeme API

**Çalışma Mantığı:**
1. `MaterialRequest` ile sahadan malzeme talebi (urgency: LOW, NORMAL, HIGH, CRITICAL)
2. `PurchaseOrder` ile tedarikçiden sipariş (approvedById ile onaylayan kişi)
3. `Stock` ile stok kartları (code, name, unit, minStock, maxStock)
4. `StockTransaction` ile stok hareketleri (type: IN/OUT, quantity, unitPrice)
5. `StockMovement` ile proje bazlı giriş/çıkış (personelId ile kimin yaptığı)
6. `Cari` ile tedarikçi/müşteri bakiye takibi

---

### B5. İş Programı (Gantt Şeması)

**Konsept:** Görev bağımlılıkları ve zaman çizelgesi yönetimi

**Prisma Modelleri:**
- `ProjectTask` - İş programı görevleri (startDate, endDate, progress, dependencies)
- `Task` - Kanban görevleri (TODO, IN_PROGRESS, IN_REVIEW, DONE)
- `WorkOrder` - İş emirleri (status: TODO, IN_PROGRESS, REVIEW, DONE)
- `SiteTask` - Şantiye yapılacaklar listesi

**Dosya Yolları:**
- `app/admin/projects/[id]/_components/GanttChart.tsx` - Gantt şeması bileşeni
- `app/admin/tasks/page.tsx` - Görev yönetimi
- `app/admin/work-orders/page.tsx` - İş emirleri
- `app/api/project-tasks/route.ts` - Proje görev API
- `app/api/tasks/route.ts` - Görev API

**Çalışma Mantığı:**
1. `ProjectTask` ile görev bağımlılıkları (dependencies string ile virgülle ayrılmış ID'ler)
2. `progress` ile ilerleme yüzdesi (0-100)
3. `assignedToId` ile sorumlu personel
4. Gantt chart ile görsel zaman çizelgesi

---

### B6. CAD / BIM Çizim Sistemi

**Konsept:** 3D IFC Viewer entegrasyonu, model görüntüleme ve kusur işaretleme (Snagging)

**Prisma Modelleri:**
- `Project` - ifcModelUrl, latitude, longitude, gpsRadius alanları
- `BimIssue` - 3D kusur işaretleme (positionX,.positionY, positionZ)
- `ProjectBlueprint` - Dijital proje ve revizyon takip (discipline: MIMARI, STATIK, ELEKTRIK, MEKANIK)
- `SiteZone` - Vaziyet planı alanları (RISK, BUILDING, REST_AREA, STORAGE)

**Dosya Yolları:**
- `app/admin/projects/[id]/_components/BimViewer.tsx` - IFC 3D viewer
- `app/admin/blueprints/page.tsx` - Çizim arşivi
- `app/admin/blueprints/draw/page.tsx` - Çizim çizme aracı
- `app/admin/site-reports/page.tsx` - Şantiye günlüğü
- `components/SiteMasterPlan.tsx` - Vaziyet planı bileşeni
- `components/AnnotatableFloorPlanViewer.tsx` - Kat planı işaretleme
- `components/PhotoAnnotator.tsx` - Fotoğraf işaretleme
- `app/api/bim-issues/route.ts` - BIM kusur API
- `app/api/blueprints/route.ts` - Çizim API

**Çalışma Mantığı:**
1. `web-ifc-viewer` ile IFC dosyalarının 3D görüntülenmesi
2. `BimIssue` ile 3D model üzerinde kusur işaretleme (X,Y,Z koordinatları)
3. `ProjectBlueprint` ile proje çizimleri ve revizyon takibi (isCurrent ile en güncel versiyon)
4. `SiteZone` ile vaziyet planı alanları ve GPS koordinatları

---

### B7. Finans ve Kasa Yönetimi

**Konsept:** Gelir/gider takibi ve nakit akışı

**Prisma Modelleri:**
- `Transaction` - Gelir/gider işlemleri (type: GELIR/GIDER)
- `Cari` - Tedarikçi/Müşteri bakiyesi
- `Debt` - Borç kayıtları
- `Payment` - Ödeme kayıtları
- `PersonelPayment` - Personel ödemeleri

**Dosya Yolları:**
- `app/admin/finance/page.tsx` - Finans paneli
- `app/admin/billing/page.tsx` - Faturalandırma
- `app/api/admin/finance/route.ts` - Finans API
- `app/api/admin/crm/route.ts` - CRM API

**Çalışma Mantığı:**
1. `Transaction` ile gelir/gider kayıtları (category: MAAS, SGK, HAKEDIS, MALZEME, DEMIR, BETON vb.)
2. `Cari.balance` ile cari bakiye takibi
3. `Debt` ve `Payment` ile borç/ödeme yönetimi

---

## C. Yapı Denetim OS ve Saha Operasyonları

### C1. YİBF Dijital İkiz ve Zaman Makinesi

**Konsept:** Yapıların geçmişe dönük olay kayıtları (YibfEvent)

**Prisma Modelleri:**
- `YibfProject` - Yapı İzleme Belgesi projeleri (yibfNo, address, ownerName, contractorName)
- `YibfEvent` - Zaman makinesi logları (eventType: "Ruhsat Alındı", "Eksiklik Açıldı", "Beton Döküldü")
- `InspectionRecord` - Kanıt zinciri kayıtları (category, status, gpsLat, gpsLng, hash)
- `Deficiency` - Uygunsuzluk/eksiklik (floor, element, category, priority, status)
- `InspectionTask` - Görev dağıtımı (taskType, status, orderIndex)

**Dosya Yolları:**
- `app/(inspection)/yibf/[id]/page.tsx` - YİBF detay sayfası
- `app/(inspection)/dashboard/page.tsx` - Yapı denetim dashboard
- `app/(inspection)/field/page.tsx` - Mobil saha denetimi
- `app/(inspection)/field/actions.ts` - Denetim kayıt server action
- `app/(inspection)/field/_components/SmartCamera.tsx` - Akıllı kamera bileşeni
- `app/api/projects-with-risk/route.ts` - Risk radarı API

**Çalışma Mantığı:**
1. `YibfProject` ile yapı denetim projeleri (companyId ile yapı denetim firması)
2. `YibfEvent` ile zaman makinesi logları (tüm olayların kronolojik kaydı)
3. `InspectionRecord` ile değiştirilemez kanıt zinciri (hash ile integrity)
4. `Deficiency` ile eksiklik yönetimi (status: OPEN, FIX_PENDING, VERIFY_PENDING, CLOSED)
5. `InspectionTask` ile görev dağıtımı ve rota sırası (orderIndex)

---

### C2. Değiştirilemez Kanıt Zinciri

**Konsept:** Eksiklik (Deficiency) yönetimi ve durum takibi

**Prisma Modelleri:**
- `Deficiency` - Eksiklik kayıtları (priority: LOW, MEDIUM, CRITICAL)
- `InspectionRecord` - Denetim kayıtları (status: PASS, FAIL, PENDING)

**Dosya Yolları:**
- `app/(inspection)/field/page.tsx` - Saha denetimi arayüzü
- `app/(inspection)/field/actions.ts` - Kayıt server action
- `app/(inspection)/reports/page.tsx` - Raporlama

**Çalışma Mantığı:**
1. PASS sonuçları `InspectionRecord` tablosuna kaydedilir
2. FAIL sonuçları `Deficiency` tablosuna kaydedilir
3. GPS koordinatları ile konum doğrulaması
4. Hash ile değiştirilemez kayıt (future implementation)

---

### C3. Mobil Saha ve Offline PWA

**Konsept:** useNetworkStatus, offlineQueue ve internetsiz veri senkronizasyonu

**Prisma Modelleri:**
- `InspectionRecord` - Senkronize edilecek denetim kayıtları
- `Deficiency` - Senkronize edilecek eksiklikler

**Dosya Yolları:**
- `hooks/useNetworkStatus.ts` - Ağ durumu hook'u
- `utils/offlineQueue.ts` - Çevrimdışı kuyruk yönetimi
- `lib/offline-db.ts` - Dexie IndexedDB offline database
- `components/OfflineStatus.tsx` - Offline durum göstergesi
- `components/OfflineSyncManager.tsx` - Senkronizasyon yöneticisi
- `public/sw.js` - Service Worker (PWA)
- `public/swe-worker-5c72df51bb1f6ee0.js` - Service Worker entry
- `public/workbox-f1770938.js` - Workbox library

**Çalışma Mantığı:**
1. `useNetworkStatus` ile online/offline durum takibi
2. `offlineQueue` ile localStorage'da çevrimdışı kayıtlar
3. `offline-db.ts` ile Dexie IndexedDB offline database
4. `syncOfflineQueue` ile internet gelince otomatik senkronizasyon
5. Service Worker ile PWA offline capability

---

### C4. GPS ve Akıllı Kamera

**Konsept:** Uydudan koordinat alma ve fotoğrafa damgalama

**Prisma Modelleri:**
- `InspectionRecord` - gpsLat, gpsLng alanları
- `AttendanceRecord` - latitude, longitude alanları (GPS check-in)
- `Project` - latitude, longitude, gpsRadius, gpsRequired alanları (Geofencing)

**Dosya Yolları:**
- `app/(inspection)/field/_components/SmartCamera.tsx` - Akıllı kamera bileşeni
- `components/GeofencedCheckIn.tsx` - GPS check-in bileşeni
- `app/api/location/track/route.ts` - Konum takip API
- `app/api/attendance/check-in/route.ts` - GPS check-in API

**Çalışma Mantığı:**
1. `navigator.geolocation` ile GPS koordinat alma
2. Fotoğrafa GPS damgalama (EXIF metadata)
3. Geofencing ile proje merkezi ve yarıçap kontrolü
4. `AttendanceRecord` ile GPS check-in kaydı

---

## D. Yapay Zeka (AI) ve Akıllı Sistemler

### D1. Sesli Asistan (Speech-to-Text)

**Konsept:** Sahada sesle form doldurma algoritması

**Prisma Modelleri:**
- `InspectionRecord` - description alanı (speech-to-text ile doldurulur)
- `Deficiency` - description alanı

**Dosya Yolları:**
- `app/(inspection)/ai-assistant/page.tsx` - AI asistan arayüzü
- `app/api/ai/parse-inspection/route.ts` - Sesli denetim parsing API
- `components/AIAssistantModal.tsx` - AI asistan modal bileşeni

**Çalışma Mantığı:**
1. Web Speech API ile ses tanıma
2. Sesli komutları form alanlarına map'leme
3. Mock implementation (future: OpenAI Whisper integration)

---

### D2. Mevzuat Asistanı (RAG)

**Konsept:** AI tabanlı doküman ve yönetmelik sorgulama

**Prisma Modelleri:**
- `DocumentArchive` - Ruhsat ve evrak arşivi (AI için knowledge base)

**Dosya Yolları:**
- `app/(inspection)/ai-assistant/page.tsx` - AI asistan arayüzü
- `app/api/ai/regulation-chat/route.ts` - Mevzuat sorgulama API

**Çalışma Mantığı:**
1. RAG (Retrieval-Augmented Generation) ile yönetmelik sorgulama
2. Mock implementation (future: Vector database + LLM integration)

---

### D3. OCR ve Görsel Hata (Vision) Analizi

**Konsept:** Belge okuma ve fotoğraftaki kusurları tespit (Mock AI)

**Prisma Modelleri:**
- `Deficiency` - AI tespit edilen kusurlar
- `InspectionRecord` - AI analiz sonuçları

**Dosya Yolları:**
- `app/(inspection)/field/_components/SmartCamera.tsx` - Akıllı kamera bileşeni
- `app/api/ai/vision/route.ts` - Vision API (Mock)
- `app/api/ai/generate-summary/route.ts` - Özet oluşturma API

**Çalışma Mantığı:**
1. `type: DOCUMENT` için OCR (Zemin etüdü, ruhsat vb.)
2. `type: SITE_PHOTO` için kusur tespiti (Çatlak, Segregasyon vb.)
3. Mock response ile confidence score ve severity
4. Future: OpenAI Vision / Google Cloud Vision integration

---

### D4. Tek Tıkla PDF Raporlama

**Konsept:** Veri analitiği ve AI destekli özet metin oluşturma

**Prisma Modelleri:**
- `InspectionReport` - Yapı denetim raporları
- `YibfEvent` - Olay kayıtları (rapor özeti için)
- `Deficiency` - Eksiklik listesi (rapor için)

**Dosya Yolları:**
- `app/(inspection)/reports/page.tsx` - Raporlama arayüzü
- `app/api/ai/generate-summary/route.ts` - AI özet API
- `app/admin/inspection/reports/create/page.tsx` - Rapor oluşturma

**Çalışma Mantığı:**
1. YİBF olayları ve eksikliklerin AI ile özetlenmesi
2. PDF generation (jsPDF, html2pdf.js)
3. Mock implementation (future: LLM integration)

---

### D5. GIS Haritası ve AI Rota Optimizasyonu

**Konsept:** Risk radarı ve görev (Dispatch) rotası planlama

**Prisma Modelleri:**
- `YibfProject` - address, companyId (harita için)
- `Deficiency` - priority, status (risk hesaplaması için)
- `InspectionTask` - orderIndex, taskDate (rota için)

**Dosya Yolları:**
- `app/(inspection)/map/page.tsx` - GIS harita sayfası
- `app/(inspection)/map/_components/GISMap.tsx` - Leaflet harita bileşeni
- `app/(inspection)/dispatch/page.tsx` - Dispatch (görev dağıtımı)
- `app/(inspection)/dispatch/_components/DispatchMap.tsx` - Dispatch harita bileşeni
- `app/api/projects-with-risk/route.ts` - Risk radarı API

**Çalışma Mantığı:**
1. `projects-with-risk` API ile risk hesaplaması (critical, high, medium count)
2. Risk score: 100 - (critical*20 + high*10 + medium*5)
3. Risk level: HIGH, MEDIUM, LOW
4. Leaflet ile proje haritalama ve risk görselleştirme
5. Dispatch ile görev rotası planlama (orderIndex ile sıralama)

---

## E. Dış Yüzler ve İletişim

### E1. Müşteri / Müteahhit Portalı

**Konsept:** Salt okunur ilerleme takibi ve memnuniyet yıldızlama

**Prisma Modelleri:**
- `Project` - Public proje bilgileri (title, description, images, year, location)
- `Service` - Hizmet tanıtımları
- `About` - Hakkımızda içeriği

**Dosya Yolları:**
- `app/(public)/page.tsx` - Ana sayfa
- `app/(public)/projelerimiz/page.tsx` - Projeler sayfası
- `app/(public)/hizmetlerimiz/page.tsx` - Hizmetler sayfası
- `app/(public)/hakkimizda/page.tsx` - Hakkımızda sayfası
- `app/(public)/iletisim/page.tsx` - İletişim sayfası
- `app/(public)/check-in/[projectId]/page.tsx` - Müşteri check-in

**Çalışma Mantığı:**
1. Public route group ile herkese açık sayfalar
2. Project ve Service modelleri ile içerik yönetimi
3. Responsive tasarım ve SEO optimizasyonu

---

### E2. Otomatik Bildirim Merkezi

**Konsept:** Uygulama içi (In-App) push bildirimler ve ayarlar

**Prisma Modelleri:**
- `Notification` - Bildirimler (userId, title, message, type, isRead, link)
- `Announcement` - Şirket duyuruları (projectId, severity: INFO, WARNING, URGENT)

**Dosya Yolları:**
- `components/NotificationBell.tsx` - Bildirim zili bileşeni
- `app/actions/notifications.ts` - Bildirim server actions
- `app/(inspection)/settings/notifications/page.tsx` - Bildirim ayarları
- `app/api/admin/communication/announcements/route.ts` - Duyuru API
- `app/api/admin/communication/messages/route.ts` - Mesaj API

**Çalışma Mantığı:**
1. `Notification` ile kullanıcı bazlı bildirimler
2. `Announcement` ile proje veya şirket genelinde duyurular
3. `NotificationBell` ile gerçek zamanlı bildirim gösterimi
4. Push notifications (future: OneSignal / Firebase integration)

---

### E3. Personel Analitiği ve Dijitalleşme Skoru

**Konsept:** KPI hesaplamaları ve Gamification

**Prisma Modelleri:**
- `Personel` - attendanceRecords, payments, assignedTasks
- `AttendanceRecord` - Puantaj verileri
- `Task` / `WorkOrder` - Görev tamamlama oranları

**Dosya Yolları:**
- `app/(inspection)/analytics/page.tsx` - Analitik dashboard
- `app/(inspection)/dashboard/page.tsx` - Dashboard
- `app/admin/my-team/page.tsx` - Ekip analitiği
- `components/WorkerFinancialDashboard.tsx` - Personel finans dashboard

**Çalışma Mantığı:**
1. Attendance rate (giriş/çıkış oranı)
2. Task completion rate (görev tamamlama yüzdesi)
3. Digital score (uygulama kullanım oranı)
4. Gamification (leaderboard, badges - future)

---

## F. Destekleyici Bileşenler ve Utilitiler

### F1. Authentication ve Authorization

**Dosya Yolları:**
- `lib/auth.ts` - NextAuth konfigürasyonu
- `lib/auth.config.ts` - Auth ayarları
- `app/api/auth/[...nextauth]/route.ts` - Auth API

**Çalışma Mantığı:**
1. CredentialsProvider ile email/password authentication
2. User ve Personel tablosu ile çift tabanlı login
3. JWT token ile session yönetimi
4. Role-based access control (RBAC)

---

### F2. Dosya Yükleme ve Depolama

**Dosya Yolları:**
- `app/api/uploadthing/route.ts` - Uploadthing konfigürasyonu
- `app/api/uploadthing/core.ts` - Uploadthing core
- `lib/cloudinary.ts` - Cloudinary entegrasyonu
- `lib/google-drive.ts` - Google Drive entegrasyonu

**Çalışma Mantığı:**
1. Uploadthing ile güvenli dosya yükleme
2. Cloudinary ile görsel optimizasyonu
3. Google Drive ile doküman arşivi

---

### F3. İletişim ve Mesajlaşma

**Prisma Modelleri:**
- `ChatThread` - Konu bazlı odalar
- `ThreadMessage` - Thread mesajları
- `ChatParticipant` - Katılımcılar
- `Conversation` - Genel konuşmalar
- `Message` - Mesajlar
- `ConversationParticipant` - Konuşma katılımcıları
- `ChatMessage` - Operasyonel mesajlaşma

**Dosya Yolları:**
- `app/admin/chat/page.tsx` - Chat arayüzü
- `app/admin/chat/components/ChatClient.tsx` - Chat client bileşeni
- `app/api/chat/conversations/route.ts` - Konuşma API
- `app/api/chat/messages/route.ts` - Mesaj API

**Çalışma Mantığı:**
1. Real-time mesajlaşma (Pusher integration)
2. Konu bazlı thread yapısı
3. Dosya ve referans paylaşımı

---

### F4. Drone ve Medya Yönetimi

**Prisma Modelleri:**
- `DroneMedia` - Drone çekim arşivi (IMAGE, VIDEO)

**Dosya Yolları:**
- `app/admin/drone-archive/page.tsx` - Drone arşivi
- `app/api/admin/drone-media/route.ts` - Drone media API

**Çalışma Mantığı:**
1. Drone çekimlerinin Cloudinary/S3 depolanması
2. Proje bazlı filtreleme
3. Tarih ve medya tipi sıralaması

---

### F5. Kalite Kontrol (QA/QC)

**Prisma Modelleri:**
- `MaterialSubmittal` - Malzeme onayı (TSE sertifikası, marka, parti numarası)
- `NonConformanceReport` - Uygunsuzluk raporu (NCR)

**Dosya Yolları:**
- `app/admin/qa-qc/materials/page.tsx` - Malzeme onayı
- `app/admin/qa-qc/ncr/page.tsx` - NCR yönetimi
- `app/api/admin/ncr/route.ts` - NCR API

**Çalışma Mantığı:**
1. Malzeme onay süreci (Onay Bekliyor, Onaylandı, Reddedildi)
2. NCR ile uygunsuzluk takibi (Açık, İşlemde, Kapalı)
3. Taşeron bazlı filtreleme

---

### F6. Yemek Menüsü ve Lojistik

**Prisma Modelleri:**
- `FoodMenu` - Günlük yemek menüsü
- `LogisticsSchedule` - Lojistik planlama (Beton, Malzeme teslimi, Denetim)

**Dosya Yolları:**
- `app/admin/food-menu/page.tsx` - Yemek menüsü
- `app/admin/communication/logistics/page.tsx` - Lojistik planlama
- `app/api/admin/food-menu/route.ts` - Yemek menüsü API

**Çalışma Mantığı:**
1. Günlük yemek menüsü planlama
2. Lojistik takvim yönetimi (Planlandı, Yolda, Şantiyede, Tamamlandı)
3. Tedarikçi ve şoför iletişim bilgileri

---

## G. Teknoloji Stack ve Kütüphaneler

### G1. Frontend
- **Next.js 16** - React framework (App Router, Server Components)
- **React 19** - UI library
- **TypeScript 5** - Type safety
- **TailwindCSS 4** - Styling
- **Lucide React** - Icons

### G2. Backend
- **Prisma ORM 6** - Database ORM
- **PostgreSQL** - Database
- **NextAuth 5** - Authentication
- **Uploadthing** - File upload

### G3. 3D ve Görselleştirme
- **Three.js** - 3D rendering
- **@react-three/fiber** - React Three.js integration
- **@react-three/drei** - Three.js helpers
- **web-ifc-viewer** - IFC BIM viewer
- **Leaflet** - Maps
- **react-leaflet** - React Leaflet integration

### G4. PDF ve Raporlama
- **jsPDF** - PDF generation
- **jspdf-autotable** - PDF tables
- **html2canvas** - HTML to canvas
- **html2pdf.js** - HTML to PDF

### G5. Offline ve PWA
- **Dexie** - IndexedDB wrapper
- **@ducanh2912/next-pwa** - PWA configuration
- **Workbox** - Service worker library

### G6. Diğer
- **Pusher** - Real-time communication
- **Cloudinary** - Cloud storage
- **Google APIs** - Drive, Calendar integration
- **bcryptjs** - Password hashing
- **nodemailer** - Email sending

---

## H. API Route Yapısı

### H1. Admin API Routes
- `/api/admin/*` - Admin panel API'leri (83 endpoint)

### H2. AI API Routes
- `/api/ai/generate-summary` - AI Summary
- `/api/ai/parse-inspection` - Speech-to-Text parsing
- `/api/ai/regulation-chat` - RAG chat
- `/api/ai/vision` - Computer Vision

### H3. Attendance API Routes
- `/api/attendance/check-in` - GPS check-in
- `/api/attendance/worker-count` - İşçi sayısı
- `/api/attendance/visitor` - Ziyaretçi kaydı

### H4. Inspection API Routes
- `/api/inspection/*` - Denetim API'leri (10 endpoint)

### H5. Project API Routes
- `/api/projects-with-risk` - Risk radarı
- `/api/project-tasks` - İş programı
- `/api/project-documents` - Proje dokümanları

### H6. Subcontractor API Routes
- `/api/deductions` - Kesintiler
- `/api/worker-documents` - İşçi evrakları
- `/api/progress-billing` - Hakediş

---

## İ. Özet ve İstatistikler

### İ1. Toplam Prisma Modelleri: 80+
- User & Auth: 5 modeller
- ERP Core: 25 modeller
- Inspection OS: 10 modeller
- İSG & Safety: 8 modeller
- QA/QC: 2 modeller
- Communication: 6 modeller
- Logistics: 2 modeller
- AI & Analytics: 2 modeller
- Archive & Documents: 8 modeller
- Inventory & Equipment: 6 modeller
- Finance: 6 modeller

### İ2. Toplam Sayfalar: 100+
- Admin panel: 77 sayfa
- Inspection OS: 13 sayfa
- Personnel portal: 32 sayfa
- Subcontractor portal: 5 sayfa
- Public portal: 10 sayfa
- Super Admin: 7 sayfa

### İ3. Toplam API Routes: 139+
- Admin API: 83 endpoint
- AI API: 4 endpoint
- Attendance API: 5 endpoint
- Inspection API: 10 endpoint
- Project API: 3 endpoint
- Subcontractor API: 6 endpoint
- Diğer: 28 endpoint

---

**Dokümantasyon Sürümü:** 1.0  
**Son Güncelleme:** 2026  
**Geliştirici:** Umut Erdoğan (NXA Software)
