# Nexa ERP - YİBF Aktarıcı Chrome Eklentisi

Bu Chrome eklentisi, Yapı Denetim Sistemi (YİBF) sayfalarından verileri çekip Nexa ERP veritabanına aktarır.

## Kurulum

1. Chrome tarayıcısında `chrome://extensions/` adresine gidin
2. Sağ üst köşedeki "Geliştirici modu"nu etkinleştirin
3. "Yüklenmiş paketi aç" butonuna tıklayın
4. Bu klasörü (`yibf-chrome-extension`) seçin
5. Eklenti yüklenecektir

## Kullanım

1. YİBF veri sayfasını açın
2. Tarayıcı araç çubuğundaki Nexa ERP ikonuna tıklayın
3. "YİBF Verilerini Nexa'ya Aktar" butonuna tıklayın
4. Veriler otomatik olarak çekilip Nexa ERP'ye aktarılacaktır

## Gereksinimler

- Nexa ERP sunucusunun çalışıyor olması (http://localhost:3000)
- YİBF sayfasının doğru formatında olması

## Özelleştirme

`content.js` dosyasındaki seçicileri (selectors) gerçek YİBF sayfasına göre güncelleyin.

## API Endpoint

Eklenti şu API endpoint'ine POST isteği gönderir:
- URL: `http://localhost:3000/api/yibf/import`
- Method: POST
- Headers: `Content-Type: application/json`
- Body: JSON formatında YİBF verileri

## Örnek İstek

```json
{
  "yibfNo": "YIBF-12345",
  "projectName": "Örnek Proje",
  "contractor": "Demo Firma",
  "area": "5000",
  "status": "AKTIF",
  "startDate": "2024-01-01",
  "endDate": "2024-12-31",
  "location": "İstanbul",
  "description": "Açıklama",
  "buildingType": "Konut",
  "floorCount": "10",
  "totalArea": "5000"
}
```

## Sorun Giderme

Eğer aktarım başarısız olursa:
1. Nexa ERP sunucusunun çalıştığından emin olun
2. Tarayıcı konsolunda hata mesajlarını kontrol edin
3. CORS ayarlarının doğru yapılandırıldığından emin olun

## Lisans

© 2026 NXA Software. Tüm hakları saklıdır.
