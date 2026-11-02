# Nexa ERP - Mobil Uygulama (React Native & Expo)

Nexa ERP kurumsal kaynak yönetimi, şantiye jurnali ve lojistik operasyonları için geliştirilmiş modern mobil istemci uygulaması.

---

## 🚀 Teknolojik Mimari
- **Framework:** [Expo SDK 58](https://expo.dev) & React Native 0.88
- **Yönlendirme (Routing):** [Expo Router](https://docs.expo.dev/router/introduction/) (Next.js App Router uyumlu dosya tabanlı yönlendirme)
- **Tasarım & Stiller:** [NativeWind v4](https://www.nativewind.dev/) (Tailwind CSS v3 motoru ile Dark Mode desteği)
- **Ağ & API İstemcisi:** [Axios](https://axios-http.com/) (Next.js backend bağlantısı, JWT Interceptors)
- **Donanım Modülleri:**
  - `expo-camera`: Entegre Barkod & QR tarayıcı, Flaş kontrolü ve Saha fotoğraf çekimi
  - `expo-location`: Anti-Fake GPS (Mock location kilidi) ve yüksek doğruluklu saha koordinat tespiti
  - `expo-file-system`: Çevrimdışı çekilen fotoğrafların cihaz yerel hafızasına (`documentDirectory`) kalıcı kaydı
  - `@react-native-async-storage/async-storage`: Çevrimdışı medya yükleme kuyruğu (`@nexa_offline_upload_queue`)
  - `Open-Meteo API`: Koordinata bağlı anlık şantiye hava durumu ve rüzgar hızı tespiti

---

## 🛠️ Donanım Yetenekleri ve Modüller

### 1. QR ve Barkod Tarayıcı (`src/components/scanner/QRScanner.tsx`)
- Tam ekran `CameraView` üzerinde şık hedefleme çerçevesi ve köşe vurguları
- Malzeme kabul, irsaliye ve lojistik QR/Barkodlarını okuma
- Dokunsal titreşim (Vibration) geri bildirimi ve fener açma/kapama desteği

### 2. Güvenli Anti-Fake GPS & Hava Durumu (`src/hooks/useLocationWeather.ts`)
- `expo-location` ile anlık GPS koordinatlarını çeker
- **Güvenlik Kilidi:** `location.mocked === true` durumunda sahte konumu (Fake GPS spoofing) tespit eder ve işlemi derhal durdurarak hata fırlatır
- Gerçek koordinatlarla Open-Meteo API'ye sorgu atarak sıcaklık (°C), rüzgar hızı (km/h) ve hava durumu tanımını döner

### 4. Yapı Denetim Dijital e-İmza (`src/components/inspections/SignaturePad.tsx`)
- `react-native-signature-canvas` ve `react-native-webview` üzerinde çalışan donanım duyarlı çizim tuvali
- Beyaz çizim alanı, "Temizle" ve "Onayla ve İmzala" butonları
- İmzayı şeffaf/temiz Base64 PNG data-uri formatında dışa aktarma
- Yasal mevzuat dipnotu ve imza kılavuz çizgisi

### 5. Arka Plan Canlı GPS Takip Servisi (`src/tasks/locationTask.ts`)
- `expo-task-manager` ve `expo-location` ile telefon kilitliyken bile çalışan arka plan görevi (`UIBackgroundModes: ["location"]`)
- Şoför sevkiyat rotasına başladığında (`Location.startLocationUpdatesAsync`) periyodik olarak koordinatları backend'e (`/api/location/track`) aktarma
- Şoför ekranında "🚚 Sevkiyata Başla" ve "🛑 Teslimatı Bitir" dinamik durumu
- iOS arka plan konum göstergesi ve Android Foreground Bildirimi desteği

### 6. Anlık Push Bildirimleri & Deep Link (`src/hooks/usePushNotifications.ts`)
- `expo-notifications` ve `expo-device` ile benzersiz cihaz token'ı alma (`Notifications.getExpoPushTokenAsync()`)
- Giriş yapıldığında token'ı backend User modeline (`/api/user/push-token`) otomatik kaydetme
- Ön planda (foreground) sesli ve üstten banner ile bildirim gösterimi (`Notifications.setNotificationHandler`)
- Bildirime dokunulduğunda ilgili sekmeye (İş Emirleri, Jurnal, Yapı Denetim, Lojistik) akıllı yönlendirme (Deep Link)

### 7. Çevrimdışı Senkronizasyon (`src/services/OfflineQueue.ts` & `src/hooks/useNetworkSync.ts`)
- `expo-network` ile internet bağlantısı denetimi (`Network.getNetworkStateAsync()`)
- Bodrum katlar gibi internetin olmadığı şantiye sahalarında Jurnal ve İmza verilerini `OFFLINE_TASKS` kuyruğuna otomatik kaydetme
- Ekranda yeşil bildirim: *"İnternet bağlantısı yok. Veriler cihaza kaydedildi, bağlantı sağlandığında otomatik gönderilecek."*
- `isConnected: true` olduğunda `OfflineQueue.processQueue()` fonksiyonunu tetikleyerek bekleyen tüm istekleri Axios ile sırayla merkeze iletme

### 8. NFC ve Geofence Doğrulamalı Akıllı Puantaj (`src/hooks/useNFCScanner.ts` & `app/(tabs)/attendance.tsx`)
- `react-native-nfc-manager` ile Ndef, NfcA ve Mifare kart / baret çip okuyucu
- Haversine formülü ile GPS Geofencing (500m şantiye sınır doğrulaması)
- Devasa animasyonlu dairesel "Giriş Yap" butonu ve alternatif kamera QR yaka kartı okuyucu
- `/api/attendance/check-in` rotasına anlık check-in ve çevrimdışı kuyruk yedeklemesi

### 9. İSG Güvenlik İhlali & Ramak Kala Raporlama (`app/(tabs)/safety.tsx`)
- Kırmızı "⚠️ İhlal / Ceza Bildir" ve "🛑 Ramak Kala Olayı Bildir" acil bildirim butonları
- Dokunulduğunda `OfflineCamera` bileşeni otomatik açılarak baretsiz çalışan veya güvenlik açığını anında fotoğraflama
- Fotoğraf çekimi sonrası ekranın altından açılan modern **Bottom Sheet / Kayıt Formu**:
  - **İhlal Türü:** KKD eksikliği, yüksekte çalışma, elektrik, iskele vb. modal picker seçici
  - **Sorumlu Taşeron:** Sistemden çekilen taşeron firma seçici (Zirve Yapı, Ege İnşaat, vb.)
  - **Konum:** Otomatik GPS (Lat/Lng) doğrulama + serbest metin saha açıklaması
  - **Ceza Tutarı:** Taşeron sözleşmesine yansıtılacak idari ceza miktarı
- **Çevrimdışı (Offline) Destek:** İnternet yoksa `OfflineQueue` servisiyle cihazda kuyruğa alma, bağlantı sağlandığında backend `/api/safety/incidents` rotasına otomatik senkronizasyon

---

## 📁 Dizin Yapısı
```
nexa-mobile/
├── app/                      # Expo Router sayfaları
│   ├── _layout.tsx           # Global Kök Düzen & Dark Mode sağlayıcısı
│   ├── index.tsx             # Nexa ERP Mobil Giriş & Saha Test Paneli
│   └── (tabs)/               # Rol Tabanlı Alt Navigasyon (Bottom Tab Bar)
│       ├── _layout.tsx       # Tab Bar Koyu Tema & Feather İkonları
│       ├── index.tsx         # Ana Sayfa (Dashboard & Özet)
│       ├── journal.tsx       # Şantiye Günlük Jurnali (iOS Bottom Sheet)
│       ├── tasks.tsx         # Saha İş Emirleri (Swipe-to-complete)
│       ├── logistics.tsx     # Malzeme Kabul (Şoför & Depo Özel Ekranı)
│       ├── inspections.tsx   # Yapı Denetim Kritik İmalat & e-İmza (INSPECTOR Rolü)
│       ├── attendance.tsx    # Akıllı Puantaj Turnike (NFC & GPS Geofencing)
│       ├── safety.tsx        # İSG Güvenlik & Ramak Kala Raporlama (Offline Kamera & Ceza)
│       └── profile.tsx       # Kullanıcı Profili & Çıkış
├── src/
│   ├── components/
│   │   ├── inspections/      # Dijital e-İmza Tuvali (SignaturePad)
│   │   │   ├── SignaturePad.tsx
│   │   │   └── index.ts
│   │   ├── scanner/          # QR & Barkod Tarayıcı (CameraView & Vizör)
│   │   │   ├── QRScanner.tsx
│   │   │   ├── LogisticsScanner.tsx
│   │   │   └── index.ts
│   │   └── media/            # Offline Fotoğraf Çekim & Medya Kuyruğu
│   │       ├── OfflineCamera.tsx
│   │       └── index.ts
│   ├── hooks/
│   │   ├── useLocationWeather.ts # Anti-Fake GPS & Open-Meteo hook'u
│   │   └── index.ts
│   └── lib/
│       └── api.ts            # Axios instance, token interceptor'lar ve auth servisleri
├── assets/                   # Mobil ikonlar ve görseller
├── global.css                # NativeWind Tailwind direktifleri
├── tailwind.config.js        # Tailwind konfigürasyonu & renk paleti
├── babel.config.js           # Babel preset ve NativeWind entegrasyonu
├── metro.config.js           # Metro bundler withNativeWind wrapper
├── app.json                  # Kamera ve Konum izinleri & Expo manifestosu
└── package.json
```

---

## ⚙️ Kurulum ve Çalıştırma

Projeyi başlatmak için `nexa-mobile` dizininde:

```bash
# Geliştirici sunucusunu başlat
npm run start
```

Platforma göre doğrudan başlatma:
```bash
# Android emülatör veya bağlı cihaz
npm run android

# iOS Simulator (macOS gerektirir)
npm run ios

# Web önizleme
npm run web
```

---

## 🌐 Backend API Bağlantısı

API bağlantısı varsayılan olarak şu şekilde yapılandırılmıştır:
- **Üretim (Production):** `https://nxerp.com.tr/api`
- **Geliştirme (Development):** `http://10.0.2.2:3000/api` (Android Emulator) veya yerel IP adresi

Özel bir endpoint belirlemek için `.env` dosyası oluşturabilirsiniz:
```env
EXPO_PUBLIC_API_URL=https://nxerp.com.tr/api
```
