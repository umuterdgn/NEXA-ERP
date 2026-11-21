# Nexa ERP — Mobil API ve Çok Kiracılı RBAC Teknik Şartnamesi (Faz 1)

Bu doküman, Nexa ERP platformunun **Müteahhit (CONTRACTOR)**, **Yapı Denetim (INSPECTION)** ve **Franchise (FRANCHISE)** işletme tiplerine özel merkezi RBAC mimarisini, rol taksonomisini ve mobil uygulamanın sıfır mock veriyle doğrudan PostgreSQL (Prisma ORM) veritabanına bağlandığı tüm `/api/mobile/*` uç noktalarının teknik sözleşmesini (API Contract) tanımlar.

---

## 1. MİMARİ VE ÇOK KİRACILI (MULTI-TENANT) İZOLASYON

Nexa ERP, aynı kod tabanı ve veritabanı üzerinde 3 farklı endüstriyel işletme tipine hizmet veren tam izole bir SaaS mimarisine sahiptir:

```
+-----------------------------------------------------------------------------------+
|                                NEXA ERP PLATFORM                                  |
+-----------------------------------------+-----------------------------------------+
                                          |
        +---------------------------------+---------------------------------+
        |                                 |                                 |
+-------v-------+                 +-------v-------+                 +-------v-------+
|  CONTRACTOR   |                 |  INSPECTION   |                 |   FRANCHISE   |
| (Müteahhitlik)|                 | (Yapı Denetim)|                 |  (Bayi / Şube)|
+-------+-------+                 +-------+-------+                 +-------+-------+
        |                                 |                                 |
        +---------------------------------+---------------------------------+
                                          |
                      +-------------------v-------------------+
                      |       lib/rbac/permissions.ts         |
                      |   (Tek Merkezli Yetki Matrisi & Kural)|
                      +-------------------+-------------------+
                                          |
        +---------------------------------+---------------------------------+
        |                                                                   |
+-------v-------------------------+                       +-----------------v-------------------------+
|        WEB RBAC KATMANI         |                       |     CANLI MOBİL API OMURGASI              |
| - Sidebar dinamik filtreleme    |                       | - `/api/mobile/auth/*` (JWT Auth)         |
| - GrantAccessModal (Rol atama)  |                       | - `/api/mobile/dashboard` (Canlı metrik)  |
| - Middleware route koruması     |                       | - `/api/mobile/telemetry/*` (GPS Takip)   |
| - Panel yönlendirme guard'ları  |                       | - `/api/mobile/sync/batch` (Offline Sync) |
+---------------------------------+                       +-------------------------------------------+
```

### 1.1 İşletme Tipleri ve Veri Sınırları
1. **CONTRACTOR (Müteahhitlik & İnşaat):**
   - Saha operasyonları, 3D BIM modelleri, metraj (BoQ), taşeron hakedişleri, malzeme kabul/ambar ve iş makineleri.
2. **INSPECTION (Yapı Denetim Kuruluşu):**
   - Bakanlık YİBF mevzuat denetimleri, beton ve karot kırım numuneleri, demir/kalıp vizeleri, saha eksiklikleri (snagging) ve DÖF tutanakları.
3. **FRANCHISE (Bayi / Şube / Mimari Fit-Out):**
   - Şube kurulum checklist'leri, mimari konsept uyum denetimleri, fit-out malzeme onayları, açılış takvimleri ve servis ticket'ları.

---

## 2. ROL TAKSONOMİSİ VE YETKİ MATRİSİ

Tüm yetkilendirmeler `lib/rbac/permissions.ts` dosyasında merkezi olarak tanımlanmıştır.

### 2.1 İşletme Tipine Göre Atanabilir Roller
| İşletme Tipi | Atanabilir Roller |
| :--- | :--- |
| **CONTRACTOR** | `ADMIN`, `PROJECT_MANAGER`, `SITE_MANAGER`, `ENGINEER`, `ARCHITECT`, `WAREHOUSE_MANAGER`, `STAFF`, `SUBCONTRACTOR`, `WORKER`, `DRIVER`, `SECURITY`, `CLIENT`, `INVESTOR` |
| **INSPECTION** | `ADMIN`, `INSPECTOR`, `PROJECT_AUDITOR`, `LAB_TECH`, `INSPECTION_OFFICE`, `INSPECTION_FINANCE` |
| **FRANCHISE** | `ADMIN`, `FRANCHISE_ADMIN`, `REGIONAL_MANAGER`, `FRANCHISEE`, `FITOUT_SUPERVISOR`, `FITOUT_TECH` |

### 2.2 Telemetri ve GPS Takip Modelleri (`locationTrackingMode`)
Kullanıcı rolleri ve çalışma sahasına göre konum takip kuralları otomatik atanır:
- **`SITE_LIVE` (Sürekli Canlı Takip - 15-30 sn):** `DRIVER`, `LOGISTICS`, `WORKER`, `SUBCONTRACTOR`
- **`OFFSITE_DISPATCH` (Ziyaret & Rota Odaklı - 60-120 sn):** `INSPECTOR`, `PROJECT_AUDITOR`, `LAB_TECH`, `REGIONAL_MANAGER`, `FITOUT_TECH`
- **`GEOFENCE_STATIONARY` (Şantiye Sınırında Sabit Takip):** `SITE_MANAGER`, `ENGINEER`, `ARCHITECT`, `WAREHOUSE_MANAGER`, `SECURITY`
- **`PRIVACY_RESTRICTED` (Takip Yok / Gizli):** `ADMIN`, `SUPER_ADMIN`, `CLIENT`, `INVESTOR`, `FRANCHISEE`

---

## 3. GÜVENLİK VE KİMLİK DOĞRULAMA (MOBILE AUTH)

Mobil uygulama ile sunucu arasındaki tüm iletişim JSON Web Token (JWT) ile güvence altına alınır:
- **Bearer Token Doğrulaması:** `Authorization: Bearer <accessToken>` başlığı zorunludur.
- **Access Token:** 7 gün geçerlilik süresi.
- **Refresh Token:** 30 gün geçerlilik süresi.
- **SSO Tek Kullanımlık Token:** Webview veya 3D BIM görüntüleyicilere mobilden oturum kaybetmeden geçiş için `/api/mobile/sso-token` uç noktası üzerinden 5 dakikalık tek kullanımlık bilet üretilir.

---

## 4. MOBİL REST API SÖZLEŞMESİ (TÜM UÇ NOKTALAR)

### 4.1 Kimlik Doğrulama & Oturum

#### `POST /api/mobile/auth/login`
Kullanıcı adı veya e-posta ve şifre ile giriş yapar, JWT token çifti döner.
- **Yetki:** Herkese açık
- **Request Body:**
```json
{
  "email": "muhendis@nexa.com",
  "password": "GucluSifre2026!"
}
```
- **Response (200 OK):**
```json
{
  "success": true,
  "tokens": {
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
    "expiresIn": 604800
  },
  "user": {
    "id": "cuid_user_1",
    "email": "muhendis@nexa.com",
    "name": "Ahmet Yılmaz",
    "role": "ENGINEER",
    "tenantId": "cuid_tenant_1",
    "tenantType": "CONTRACTOR",
    "locationTrackingMode": "GEOFENCE_STATIONARY",
    "assignedProjectIds": ["cuid_proj_1"]
  },
  "navigation": {
    "homeScreen": "Dashboard",
    "tabs": [
      { "id": "dashboard", "title": "Ana Sayfa", "icon": "Home", "badge": null },
      { "id": "bim", "title": "3D BIM", "icon": "Box", "badge": null },
      { "id": "tasks", "title": "Görevler", "icon": "ClipboardList", "badge": "3" },
      { "id": "chat", "title": "İletişim", "icon": "MessageSquare", "badge": null },
      { "id": "profile", "title": "Profil", "icon": "User", "badge": null }
    ]
  }
}
```

#### `GET /api/mobile/auth/me`
Geçerli token sahibinin kullanıcı bilgilerini ve izin verilen modüllerini döner.
- **Header:** `Authorization: Bearer <token>`
- **Response (200 OK):**
```json
{
  "success": true,
  "user": {
    "id": "cuid_user_1",
    "email": "muhendis@nexa.com",
    "name": "Ahmet Yılmaz",
    "role": "ENGINEER",
    "tenantId": "cuid_tenant_1",
    "tenantType": "CONTRACTOR",
    "locationTrackingMode": "GEOFENCE_STATIONARY",
    "assignedProjectIds": ["cuid_proj_1"]
  },
  "allowedModules": [
    "dashboard_site", "bim_3d", "tasks_work_orders", "site_journal", 
    "work_proofs", "goods_receiving", "internal_comms"
  ]
}
```

#### `GET /api/mobile/sso-token`
Mobil uygulamadan webview veya masaüstü 3D BIM oturumuna güvenli aktarım için tek kullanımlık SSO token üretir.
- **Header:** `Authorization: Bearer <token>`
- **Response (200 OK):**
```json
{
  "success": true,
  "ssoToken": "eyJhbGciOiJIUzI1NiIs...",
  "targetUrl": "https://nxerp.com.tr/sso?token=eyJhbGciOiJIUzI1NiIs...",
  "expiresInSeconds": 300
}
```

---

### 4.2 Dashboard & Canlı Göstergeler

#### `GET /api/mobile/dashboard`
Kullanıcının rolüne ve projelerine göre filtrelenmiş canlı şantiye dashboard metriklerini, hava durumunu, görevleri ve duyuruları döner.
- **Header:** `Authorization: Bearer <token>`
- **Query Params:** `projectId` (opsiyonel)
- **Response (200 OK):**
```json
{
  "success": true,
  "tenantType": "CONTRACTOR",
  "role": "ENGINEER",
  "project": {
    "id": "cuid_proj_1",
    "title": "Vadi Evleri 3. Etap",
    "location": "Sarıyer, İstanbul",
    "gpsRadius": 200
  },
  "weather": {
    "temperature": 18,
    "windSpeed": 12.4,
    "weatherCode": 2,
    "description": "Parçalı Bulutlu",
    "isLive": true
  },
  "metrics": [
    { "key": "tasks", "title": "Bekleyen Görevler", "value": 4, "trend": "warning" },
    { "key": "attendance", "title": "Bugünkü Mesai", "value": "Giriş Yapıldı", "status": "PRESENT" },
    { "key": "deficiencies", "title": "Açık Saha Kusurları", "value": 2, "trend": "danger" },
    { "key": "deliveries", "title": "Aktif Sevkiyatlar", "value": 3, "trend": "info" }
  ],
  "pendingTasks": [
    {
      "id": "cuid_task_1",
      "title": "A Blok 3. Kat Kolon Donatı Kontrolü",
      "description": "Paspayı ve bindirme boyları kontrol edilecek",
      "status": "TODO",
      "taskType": "Demir Kontrolü",
      "dueDate": "2026-11-20T17:00:00.000Z"
    }
  ],
  "recentAnnouncements": [
    {
      "id": "cuid_ann_1",
      "title": "Yüksekte Çalışma İSG Hatırlatması",
      "content": "Paraşüt tipi emniyet kemeri kullanımı zorunludur.",
      "severity": "URGENT",
      "createdAt": "2026-11-20T08:00:00.000Z"
    }
  ]
}
```

---

### 4.3 Telemetri, GPS, Güzergah ve Zimmetli BLE Yakınlık Radarı

#### `POST /api/mobile/telemetry/location`
Saha ekibi ve yol personelinin arka plan/ön plan GPS koordinatlarını ve opsiyonel zimmetli BLE etiket telemetrisini `LocationLog` ve `BleDevice` / `Equipment` tablolarına işler. `bleEventType: "LOST_ALERT"` durumunda şantiye yöneticilerine acil bildirim ve İSG ihlali kaydı açar.
- **Header:** `Authorization: Bearer <token>`
- **Request Body:**
```json
{
  "latitude": 41.0122,
  "longitude": 28.9765,
  "speed": 0.4,
  "heading": 180,
  "accuracy": 8,
  "batteryLevel": 88,
  "source": "GPS",
  "projectId": "cuid_proj_1",
  "bleDeviceId": "cuid_ble_1",
  "rssi": -72,
  "estimatedDistanceMeters": 3.8,
  "proximityZone": "NEAR",
  "bleEventType": "HEARTBEAT"
}
```
- **Response (200 OK):**
```json
{
  "success": true,
  "logId": "cuid_loc_1",
  "isInsideGeofence": true,
  "recordedAt": "2026-11-20T14:30:00.000Z",
  "bleUpdated": true,
  "alertTriggered": false
}
```

#### `GET /api/mobile/ble/devices`
`ble_radar` modül yetkisine sahip kullanıcılara yalnızca **PostgreSQL'deki canlı zimmetli** BLE kart/baret/ekipman etiketlerini döner (yetkisiz rollerde `403`, sıfır mock cihaz):
- `WORKER`, `DRIVER`, `STAFF`, `FITOUT_TECH`: Yalnızca kendisine zimmetli cihazlar (`scope: "PERSONAL"`).
- `SITE_MANAGER`, `ENGINEER`, `ISG_EXPERT`, `EQUIPMENT_MANAGER`, `WAREHOUSE_MANAGER`, `ADMIN`, `PROJECT_MANAGER`: Atandığı şantiyedeki (`projectId`) tüm personel ve ekipman etiketleri (`scope: "PROJECT"`).
- **Header:** `Authorization: Bearer <token>`
- **Query Params:** `projectId` (opsiyonel, yönetici kapsamı için)
- **Response (200 OK):**
```json
{
  "success": true,
  "scope": "PERSONAL",
  "count": 1,
  "devices": [
    {
      "id": "cuid_ble_1",
      "sourceType": "BLE_DEVICE",
      "name": "Baret BLE-01 (Ahmet Yılmaz)",
      "macAddress": "AA:BB:CC:11:22:33",
      "uuid": "0000feaa-0000-1000-8000-00805f9b34fb",
      "txPower": -59,
      "type": "BARET",
      "status": "ACTIVE",
      "batteryLevel": 92,
      "lastSeenAt": "2026-11-20T14:25:00.000Z",
      "lastLat": 41.0122,
      "lastLng": 28.9765,
      "lastRssi": -64,
      "proximityZone": "NEAR",
      "assignedToName": "Ahmet Yılmaz",
      "projectId": "cuid_proj_1"
    }
  ]
}
```

#### `GET /api/mobile/routes`
Yalnızca rota görevi olan rollere (`route_optimization` / `driver_deliveries`) veritabanındaki gerçek `lat`/`lng` koordinatlarıyla sıralı durak listesini döner (koordinatı girilmemiş projelerde `null` döner, sabit mock koordinat üretmez).
- **Header:** `Authorization: Bearer <token>`
- **Response (200 OK):**
```json
{
  "success": true,
  "count": 1,
  "stops": [
    {
      "id": "cuid_sched_1",
      "stopId": "cuid_sched_1",
      "projectId": "cuid_proj_1",
      "recordModel": "LOGISTICS_SCHEDULE",
      "order": 1,
      "title": "Vadi Evleri 3. Etap Şantiyesi",
      "description": "BETON - C35/45 Dökümü",
      "plateNumber": "34 NEX 2026",
      "status": "IN_TRANSIT",
      "lat": 41.0122,
      "lng": 28.9765,
      "address": "Sarıyer, İstanbul",
      "eta": "2026-11-20T14:30:00.000Z",
      "stopType": "DELIVERY",
      "type": "DELIVERY"
    }
  ]
}
```

#### `POST /api/mobile/routes/checkin`
Durağa varıldığında veya teslimat/denetim tamamlandığında GPS mesafe doğrulamasıyla durak statüsünü (`ARRIVED` | `COMPLETED`) canlı veritabanında (`LogisticsSchedule`, `LogisticsAppointment` veya `Inspection`) günceller.
- **Header:** `Authorization: Bearer <token>`
- **Request Body:**
```json
{
  "stopId": "cuid_sched_1",
  "projectId": "cuid_proj_1",
  "action": "COMPLETED",
  "stopType": "DELIVERY",
  "lat": 41.0122,
  "lng": 28.9765,
  "qrCode": "IRS-2026-0041",
  "photoUrl": "https://storage.nexa.com/proofs/tesellum.jpg",
  "notes": "Malzeme eksiksiz indirildi."
}
```
- **Response (200 OK):**
```json
{
  "success": true,
  "stopId": "cuid_sched_1",
  "status": "COMPLETED",
  "distanceMeters": 32,
  "gpsVerified": true,
  "checkedInAt": "2026-11-20T14:38:00.000Z",
  "updatedRecordId": "cuid_sched_1",
  "message": "Durak işlemi tamamlandı ve web paneline yansıtıldı."
}
```

---

### 4.4 Taşeron & İmalat Kanıtı (WorkProof)

#### `GET /api/mobile/work-proofs`
Projedeki veya taşeronun kendi yüklediği fotoğraflı imalat kanıtlarını listeler.
- **Query Params:** `projectId`, `status` (`PENDING`, `APPROVED`, `REJECTED`, `ALL`)
- **Response (200 OK):**
```json
{
  "success": true,
  "count": 1,
  "proofs": [
    {
      "id": "cuid_wp_1",
      "title": "A Blok Kolon Donatı İmalatı",
      "description": "24 adet kolon demiri bağlandı, vizeye hazır.",
      "photoUrl": "https://storage.nexa.com/proofs/kolon_1.jpg",
      "claimedQuantity": 15.5,
      "approvedQuantity": null,
      "status": "PENDING",
      "subcontractor": "Yılmaz Demir İnşaat Ltd.",
      "boqItem": "15.120.1001 - Nervürlü Çelik Donatı",
      "unit": "Ton",
      "gpsLatitude": 41.0122,
      "gpsLongitude": 28.9765,
      "createdAt": "2026-11-20T11:00:00.000Z"
    }
  ]
}
```

#### `POST /api/mobile/work-proofs`
Saha kamerasından çekilen GPS etiketli fotoğrafı ve iddia edilen metrajı hakediş kuyruğuna ekler.
- **Request Body:**
```json
{
  "projectId": "cuid_proj_1",
  "title": "B Blok 2. Kat Döşeme Betonu",
  "description": "120 m³ C30 beton dökümü tamamlandı.",
  "photoUrl": "https://storage.nexa.com/proofs/doseme_beton_1.jpg",
  "claimedQuantity": 120,
  "boqItemId": "cuid_boq_1",
  "gpsLatitude": 41.0125,
  "gpsLongitude": 28.9762
}
```
- **Response (200 OK):**
```json
{
  "success": true,
  "message": "İş kanıtı başarıyla yüklendi ve mühendis onay kuyruğuna alındı.",
  "proof": { "id": "cuid_wp_2", "status": "PENDING" }
}
```

#### `POST /api/mobile/work-proofs/[id]/review`
Şantiye Şefi veya Kontrol Mühendisinin iş kanıtını onaylamasını, miktarını kırpmasını veya revizeye göndermesini sağlar.
- **Request Body:**
```json
{
  "action": "APPROVE",
  "approvedQuantity": 115,
  "notes": "5 m³ fire düşüldü, imalat kabul edildi."
}
```
- **Response (200 OK):**
```json
{
  "success": true,
  "message": "İş kanıtı onaylandı ve hakedişe hazırlandı.",
  "proof": { "id": "cuid_wp_2", "status": "APPROVED", "approvedQuantity": 115 }
}
```

---

### 4.5 Yapı Denetim & QA/QC Saha Terminali

#### `GET /api/mobile/inspections`
Yapı denetim tutanakları ve vizeleri listeler.
#### `POST /api/mobile/inspections`
Saha vizesi kaydeder (Demir-Kalıp, Temel, Tesisat vb.).
#### `GET /api/mobile/samples`
Laboratuvar beton numuneleri ve 7/28 günlük kırım sonuçlarını listeler.
#### `POST /api/mobile/samples`
Mikser başından GPS ve barkodlu taze beton numunesi kaydeder.
#### `GET /api/mobile/deficiencies`
Açık eksiklikleri (Snagging) ve DÖF kayıtlarını listeler.
#### `POST /api/mobile/deficiencies`
Fotoğraflı ve kat mahal etiketli uygunsuzluk açar.
#### `GET /api/mobile/forms` & `POST /api/mobile/forms`
Dinamik kontrol listesi şablonlarını listeler ve doldurulan form yanıtlarını kaydeder.

---

### 4.6 Puantaj, İK & Özlük Terminali

#### `POST /api/mobile/attendance`
QR kod veya Geofence GPS doğrulaması ile mesai giriş/çıkışını kaydeder.
- **Request Body:**
```json
{
  "latitude": 41.0122,
  "longitude": 28.9765,
  "projectId": "cuid_proj_1"
}
```
- **Response (200 OK):**
```json
{
  "success": true,
  "type": "CHECK_IN",
  "message": "Şantiye mesai girişiniz başarıyla onaylandı.",
  "record": { "id": "cuid_att_1", "status": "PRESENT" }
}
```

#### `GET /api/mobile/hr/self`
Personelin kendi maaş, izin, zimmetli KKD/ekipman ve yemekhane menüsü bilgilerini döner.

---

### 4.7 Lojistik, İrsaliye & Ambar QR

#### `GET /api/mobile/logistics`
Bekleyen sevkiyat randevularını, kritik stok seviyelerini ve malzeme taleplerini döner.
#### `POST /api/mobile/logistics`
- `action: "GATE_CHECKIN"`: Güvenlik kulübesi araç plaka giriş onayı.
- `action: "RECEIVE_GOODS"`: Saha şefi irsaliye teslim kabulü (tesellüm).
- `action: "CONSUME_QR"`: Saha ekibinin depodan karekod okutarak malzeme sarfiyatı yapması.
- `action: "CREATE_REQUEST"`: Malzeme talep formu oluşturulması.

---

### 4.8 İSG & Acil Durum SOS

#### `POST /api/mobile/isg`
- `action: "SOS"`: Anında siren çaldıran ve tüm şantiye amirlerine konum ileten kırmızı alarm üretir.
- `action: "NEAR_MISS"`: Anonim veya isimli ramak kala olay bildirimi kaydeder.

---

### 4.9 Saha İletişimi & Anlık Mesajlaşma

#### `GET /api/mobile/chat` & `POST /api/mobile/chat`
Şantiye içi genel duyuru kanalı veya projeye özel ekip sohbeti üzerinden mesaj gönderir ve alır.

---

### 4.10 AI Görsel Şantiye Analizi

#### `POST /api/mobile/ai/vision`
Mobil kameradan çekilen görseli yapay zeka ile analiz eder:
- İSG kask/yelek denetimi
- Çatlak ve paslanma tespiti
- İmalat ilerleme oranı tahmini
- Pafta ve metraj doğrulama

---

### 4.11 Çevrimdışı Senkronizasyon (Offline Batch Sync)

#### `POST /api/mobile/sync/batch`
Bodrum katlar veya tünel gibi internetin çekmediği sahalarda cihaz yerel veritabanında (SQLite/WatermelonDB) biriken işlemleri internet geldiğinde tek bir işlemde sunucuya aktarır.
- **Request Body:**
```json
{
  "items": [
    {
      "id": "local_uuid_1",
      "action": "ATTENDANCE",
      "clientTimestamp": "2026-11-20T08:15:00.000Z",
      "payload": { "projectId": "cuid_proj_1", "checkInTime": "2026-11-20T08:15:00.000Z" }
    },
    {
      "id": "local_uuid_2",
      "action": "TASK_UPDATE",
      "payload": { "taskId": "cuid_task_1", "status": "DONE" }
    },
    {
      "id": "local_uuid_3",
      "action": "LOCATION_LOG",
      "payload": { "lat": 41.0122, "lng": 28.9765, "speed": 1.2 }
    }
  ]
}
```
- **Response (200 OK):**
```json
{
  "success": true,
  "processedCount": 3,
  "results": [
    { "id": "local_uuid_1", "status": "SYNCED" },
    { "id": "local_uuid_2", "status": "SYNCED" },
    { "id": "local_uuid_3", "status": "SYNCED" }
  ]
}
```

---

## 5. TEST VE DOĞRULAMA STATÜSÜ

1. **TypeScript Statik Tip Kontrolü (`tsc --noEmit`):**
   - Hata Sayısı: **0** (Sıfır hata ile derlendi).
2. **Prisma Şema Senkronizasyonu (`prisma db push`):**
   - Neon PostgreSQL bulut veritabanında tüm enum ve model kolonları canlı olarak senkronize edildi.
3. **Geriye Dönük Uyumluluk:**
   - Mevcut tüm kullanıcılar (`STAFF`, `ENGINEER`, `ADMIN`) korunmuş, veri kaybı yaşanmamıştır.

