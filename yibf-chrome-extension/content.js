/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Nexa ERP - YİBF Aktarıcı Content Script
 * Veri kazıma ve API gönderme mantığı
 */

(async function scrapeAndImport() {
  try {
    // Örnek veri kazıma mantığı - YİBF sayfasına göre özelleştirilmeli
    // Bu test amaçlı örnek seçicilerdir, gerçek YİBF sayfasına göre güncellenmelidir
    
    const scrapedData = {
      // YİBF numarası - sayfadaki ilgili elemandan çek
      yibfNo: document.querySelector('[data-yibf-no]')?.innerText?.trim() || 
               document.querySelector('.yibf-no')?.innerText?.trim() ||
               document.querySelector('td:contains("YİBF No")')?.nextElementSibling?.innerText?.trim() ||
               'YIBF-' + Date.now(), // Fallback: test için timestamp
      
      // Proje adı
      projectName: document.querySelector('h1')?.innerText?.trim() ||
                    document.querySelector('.project-name')?.innerText?.trim() ||
                    document.querySelector('[data-project-name]')?.innerText?.trim() ||
                    'Test Projesi',
      
      // Müteahhit/Yüklenici
      contractor: document.querySelector('.contractor')?.innerText?.trim() ||
                   document.querySelector('[data-contractor]')?.innerText?.trim() ||
                   document.querySelector('td:contains("Müteahhit")')?.nextElementSibling?.innerText?.trim() ||
                   'Demo Firma',
      
      // Alan/m²
      area: document.querySelector('.area')?.innerText?.trim() ||
            document.querySelector('[data-area]')?.innerText?.trim() ||
            document.querySelector('td:contains("Alan")')?.nextElementSibling?.innerText?.trim() ||
            null,
      
      // Durum
      status: document.querySelector('.status')?.innerText?.trim() ||
              document.querySelector('[data-status]')?.innerText?.trim() ||
              document.querySelector('td:contains("Durum")')?.nextElementSibling?.innerText?.trim() ||
              'AKTIF',
      
      // Başlangıç tarihi
      startDate: document.querySelector('.start-date')?.innerText?.trim() ||
                  document.querySelector('[data-start-date]')?.innerText?.trim() ||
                  document.querySelector('td:contains("Başlangıç")')?.nextElementSibling?.innerText?.trim() ||
                  null,
      
      // Bitiş tarihi
      endDate: document.querySelector('.end-date')?.innerText?.trim() ||
                document.querySelector('[data-end-date]')?.innerText?.trim() ||
                document.querySelector('td:contains("Bitiş")')?.nextElementSibling?.innerText?.trim() ||
                null,
      
      // Konum
      location: document.querySelector('.location')?.innerText?.trim() ||
                document.querySelector('[data-location]')?.innerText?.trim() ||
                document.querySelector('td:contains("Konum")')?.nextElementSibling?.innerText?.trim() ||
                null,
      
      // Açıklama
      description: document.querySelector('.description')?.innerText?.trim() ||
                   document.querySelector('[data-description]')?.innerText?.trim() ||
                   document.querySelector('td:contains("Açıklama")')?.nextElementSibling?.innerText?.trim() ||
                   null,
      
      // Bina türü
      buildingType: document.querySelector('.building-type')?.innerText?.trim() ||
                    document.querySelector('[data-building-type]')?.innerText?.trim() ||
                    document.querySelector('td:contains("Bina Türü")')?.nextElementSibling?.innerText?.trim() ||
                    null,
      
      // Kat sayısı
      floorCount: document.querySelector('.floor-count')?.innerText?.trim() ||
                  document.querySelector('[data-floor-count]')?.innerText?.trim() ||
                  document.querySelector('td:contains("Kat")')?.nextElementSibling?.innerText?.trim() ||
                  null,
      
      // Toplam alan
      totalArea: document.querySelector('.total-area')?.innerText?.trim() ||
                 document.querySelector('[data-total-area]')?.innerText?.trim() ||
                 document.querySelector('td:contains("Toplam Alan")')?.nextElementSibling?.innerText?.trim() ||
                 null
    }

    console.log('Scraped data:', scrapedData)

    // Nexa ERP API'sine veri gönder
    const response = await fetch('http://localhost:3000/api/yibf/import', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(scrapedData)
    })

    const result = await response.json()

    if (response.ok && result.success) {
      alert(`✓ Başarılı!\n\n${result.message}\n\nProje: ${result.project.name}\nYİBF No: ${result.project.yibfNo}`)
      return { success: true, message: result.message }
    } else {
      alert(`✗ Hata!\n\n${result.error || 'Veri aktarımı başarısız'}`)
      return { success: false, message: result.error || 'Veri aktarımı başarısız' }
    }
  } catch (error) {
    console.error('Scraping error:', error)
    alert(`✗ Hata!\n\n${error.message || 'Bir hata oluştu'}\n\nLütfen Nexa ERP sunucusunun çalıştığından emin olun (localhost:3000)`)
    return { success: false, message: error.message || 'Bir hata oluştu' }
  }
})()
