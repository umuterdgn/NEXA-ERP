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

### 3. Çevrimdışı Kamera & Medya Kuyruğu (`src/components/media/OfflineCamera.tsx`)
- Sahada internet bağlantısı olmasa dahi görev kanıtı fotoğraflarını çeker
- Fotoğrafı `FileSystem.documentDirectory` içinde `nexa_media/` klasörüne kalıcı olarak kopyalar
- Fotoğraf metaverilerini ve yerel URI'sini AsyncStorage içinde `@nexa_offline_upload_queue` kuyruğuna kaydeder
- İnternet bağlantısı sağlandığında sunucuya toplu yüklenmeye hazır bekletir

---

## 📁 Dizin Yapısı
```
nexa-mobile/
├── app/                      # Expo Router sayfaları
│   ├── _layout.tsx           # Global Kök Düzen & Dark Mode sağlayıcısı
│   └── index.tsx             # Nexa ERP Mobil Giriş & Saha Test Paneli
├── src/
│   ├── components/
│   │   ├── scanner/          # QR & Barkod Tarayıcı (CameraView)
│   │   │   ├── QRScanner.tsx
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
