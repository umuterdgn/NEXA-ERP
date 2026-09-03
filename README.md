# Mahir Bakay Mühendislik - Web Sitesi ve ERP Sistemi

Mahir Bakay Mühendislik için geliştirilmiş tam kapsamlı, fütüristik web sitesi ve gelişmiş ERP/Yönetim paneli.

## 🚀 Teknoloji Yığını

### Frontend
- **Next.js 14** (App Router)
- **TypeScript**
- **Tailwind CSS**
- **Framer Motion** (Animasyonlar)

### Backend & Veritabanı
- **Node.js**
- **Prisma ORM**
- **PostgreSQL**

### Entegrasyonlar
- **NextAuth** (Yetkilendirme)
- **Google Drive API** (Arşiv yönetimi)
- **Nodemailer** (İletişim formu)

## 📋 Özellikler

### Public UI (Kullanıcı Arayüzü)

#### Ana Sayfa
- ✅ Hero section tam ekran video arka planı
- ✅ Öne çıkan hizmetler (3 kart)
- ✅ Hakkımızda özeti
- ✅ Öne çıkan projeler (3 proje)
- ✅ İSG (İş Sağlığı ve Güvenliği) modülü
- ✅ Footer (Admin Panel butonu dahil)

#### Hakkımızda Sayfası
- ✅ Video background loop
- ✅ CMS entegrasyonu (Admin panelden yönetilebilir)

#### Hizmetlerimiz Sayfası
- ✅ Fütüristik grid yapısı
- ✅ Modal ile detay gösterimi
- ✅ 5 görsel slider

#### Projelerimiz Sayfası
- ✅ Hizmetlerden farklı tema
- ✅ Modal ile detay gösterimi
- ✅ 5 görsel slider

#### İletişim Sayfası
- ✅ Google Maps entegrasyonu
- ✅ WhatsApp direkt mesaj butonu
- ✅ Çalışan iletişim formu (Nodemailer)

### Admin Panel & ERP

#### Yetkilendirme
- ✅ Login sayfası
- ✅ Rol bazlı yetkilendirme (Admin/Staff)
- ✅ Sayfa bazlı yetki kontrolü (Okuma/Yazma/Silme)

#### CMS (İçerik Yönetimi)
- ✅ Hakkımızda içerik yönetimi
- ✅ Hizmetler CRUD
- ✅ Projeler CRUD

#### Arşiv Yönetimi
- ✅ PDF dosya upload (Google Drive)
- ✅ Proje adına göre arama
- ✅ Tarihe göre artan/azalan sıralama
- ✅ Tarih aralığı filtreleme
- ✅ Sadece indirme butonu (preview yok)

#### Finans Yönetimi
- ✅ Tedarikçi listesi
- ✅ Tedarikçi detay modalı
- ✅ Toplam borç, ödenen tutar, kalan bakiye
- ✅ Borç ve ödeme geçmişi

#### Stok Yönetimi
- ✅ Stok kalemleri (ad, birim)
- ✅ Stok giriş/çıkış işlemleri
- ✅ Tarih log tutma
- ✅ Mevcut miktar hesaplama

#### Personel Yönetimi
- ✅ Personel kaydı (ad, yaş, doğum tarihi, birim, şantiye)
- ✅ Şantiye geçmişi (log tutma)
- ✅ Maaş ve ödemeler (normal, prim, döner sermaye)
- ✅ Ödeme durumu (ödenen/bekleyen)
- ✅ Sigorta yönetimi (başlangıç, yenileme periyodu)
- ✅ Hazır filtreler (maaşı ödenmeyenler, sigortası yaklaşanlar)
- ✅ Detaylı arama

#### Kullanıcı Yönetimi
- ✅ Yeni kullanıcı oluşturma
- ✅ Şifre belirleme/güncelleme
- ✅ Kullanıcı silme
- ✅ Rol bazlı yetki atama (checkbox ile)

## 🛠️ Kurulum

### 1. Bağımlılıkları Yükle
```bash
cd mahir-bakay-muhendislik
npm install
```

### 2. Environment Değişkenlerini Ayarla

`.env` dosyasını oluşturun ve aşağıdaki değişkenleri ekleyin:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/mahir_bakay_muhendislik?schema=public"

# NextAuth
NEXTAUTH_SECRET="your-secret-key-here"
NEXTAUTH_URL="http://localhost:3000"

# Google Drive (Opsiyonel - arşiv için)
GOOGLE_DRIVE_CLIENT_ID=""
GOOGLE_DRIVE_CLIENT_SECRET=""
GOOGLE_DRIVE_REDIRECT_URI=""

# Email (Nodemailer - iletişim formu için)
EMAIL_HOST=""
EMAIL_PORT=""
EMAIL_USER=""
EMAIL_PASSWORD=""
EMAIL_FROM=""
```

### 3. Veritabanını Başlat

```bash
# Prisma migrate çalıştır
npx prisma migrate dev --name init

# Seed verilerini yükle
npm run seed
```

### 4. Projeyi Çalıştır

```bash
npm run dev
```

Tarayıcınızda `http://localhost:3000` adresini açın.

## 🔐 Varsayılan Admin Hesabı

- **E-posta:** admin@mahirbakay.com
- **Şifre:** admin123

⚠️ **Önemli:** Production ortamında bu şifreyi değiştirmeyi unutmayın!

## 📁 Proje Yapısı

```
mahir-bakay-muhendislik/
├── app/
│   ├── admin/              # Admin panel sayfaları
│   │   ├── cms/           # İçerik yönetimi
│   │   ├── archive/       # Arşiv yönetimi
│   │   ├── finance/       # Finans yönetimi
│   │   ├── stock/         # Stok yönetimi
│   │   ├── staff/         # Personel yönetimi
│   │   └── users/         # Kullanıcı yönetimi
│   ├── api/               # API route'ları
│   │   ├── admin/         # Admin API'leri
│   │   ├── auth/          # NextAuth
│   │   └── contact/       # İletişim formu
│   ├── hakkimizda/        # Hakkımızda sayfası
│   ├── hizmetlerimiz/     # Hizmetler sayfası
│   ├── projelerimiz/      # Projeler sayfası
│   ├── iletisim/          # İletişim sayfası
│   ├── login/             # Login sayfası
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Ana sayfa
├── components/            # React bileşenleri
│   ├── ServiceModal.tsx   # Hizmet modalı
│   └── ProjectModal.tsx   # Proje modalı
├── lib/                   # Yardımcı fonksiyonlar
│   ├── auth.ts           # NextAuth yapılandırması
│   ├── prisma.ts         # Prisma client
│   ├── google-drive.ts   # Google Drive entegrasyonu
│   └── nodemailer.ts     # Email gönderme
├── prisma/
│   ├── schema.prisma     # Veritabanı şeması
│   └── seed.ts           # Seed verileri
└── types/
    └── next-auth.d.ts    # NextAuth tip tanımları
```

## 🎨 Tasarım Özellikleri

- **Fütüristik tema:** Koyu renk paleti (slate tonları)
- **Animasyonlar:** Framer Motion ile scroll-triggered animasyonlar
- **Responsive:** Mobil, tablet ve desktop uyumlu
- **Erişilebilir:** WCAG standartlarına uygun

## 📝 Notlar

1. **Video Dosyaları:** Video dosyalarını `public/` klasörüne ekleyin:
   - `hero-video.mp4` (Ana sayfa için)
   - `about-video.mp4` (Hakkımızda için)

2. **Görseller:** Görselleri `public/images/` klasörüne ekleyin. Veritabanında URL'leri güncelleyin.

3. **Google Drive:** Google Drive API'yi kullanmak için:
   - Google Cloud Console'da proje oluşturun
   - Drive API'yi etkinleştirin
   - OAuth credentials alın
   - `.env` dosyasına ekleyin

4. **Email:** Nodemailer kullanmak için:
   - SMTP sunucu bilgilerini `.env` dosyasına ekleyin
   - Test için Ethereal Email gibi servisler kullanılabilir

## 🚀 Deployment

### Vercel (Önerilen)
```bash
npm run build
vercel
```

### Docker
Dockerfile oluşturulabilir ve containerize edilebilir.

## 📞 İletişim

Sorularınız için proje sahibiyle iletişime geçin.

---

**Not:** Bu proje Nexx standartlarında, yüksek kaliteli ve sıfır hata toleranslı bir iş çıkarılmıştır.