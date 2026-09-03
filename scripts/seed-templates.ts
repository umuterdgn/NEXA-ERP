/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * This code is the property of NXA Software.
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function seedContractTemplates() {
  const templates = [
    {
      name: 'İş Güvenliği Taahhütnamesi',
      content: `İŞ GÜVENLİĞİ TAAHHÜTNAMESİ

Ben, {{PERSONEL_ADI}}, Mahir Bakay Mühendislik'in {{PROJE_ADI}} projesinde çalışırken aşağıdaki taahhütleri kabul ediyorum:

1. KİŞİSEL KORUNUM
- İş güvenliği ekipmanlarını (kask, ayakkabı, yelek vb.) her zaman kullanacağım.
- Eksik veya hasarlı ekipmanı kullanmayacağım.

2. GÜVENLİK KURALLARI
- İş güvenliği kurallarına tam uyacağım.
- Tehlikeli durumlarda derhal şantiye şefini bilgilendireceğim.

3. MAKİNE VE EKİPMAN
- Yetkili olmadığım makineleri kullanmayacağım.
- Ekipmanları sadece amaçları için kullanacağım.

4. ACİL DURUM
- Yangın, kaza gibi acil durumlarda tahliye planına uyacağım.
- İlk yardım bilgisine sahip kişilere haber vereceğim.

5. SAĞLIK
- Alkol veya uyuşturucu etkisi altında çalışmayacağım.
- Sağlık durumum iş güvenliğini etkiliyorsa derhal bildireceğim.

Bu taahhütnameyi ihlal etmem durumunda işten çıkarılma ve yasal sorumluluk kabul ediyorum.

Tarih: {{TARİH}}
İmza: _________________`
    },
    {
      name: 'Standart Taşeron Sözleşmesi',
      content: `STANDART TAŞERON SÖZLEŞMESİ

Bu sözleşme, Mahir Bakay Mühendislik (İşveren) ile aşağıda imzası bulunan Taşeron (Yüklenici) arasında aşağıda belirtilen şartlarda düzenlenmiştir.

MADDE 1: İŞİN KONUSU
Taşeron, İşveren'in {{PROJE_ADI}} projesinde aşağıda belirtilen işleri yerine getirmeyi kabul eder.

MADDE 2: SÜRE
İşin süresi {{BAŞLANGIÇ_TARİHİ}} ile {{BİTİŞ_TARİHİ}} arasında olacaktır.

MADDE 3: ÜCRET
İş bedeli toplam [TUTAR] TL'dir. Ödeme planı aşağıda belirtilmiştir:
- %40 peşin
- %30 işin %50'si tamamlanınca
- %30 iş tamamlanınca

MADDE 4: GÜVENLİK
Taşeron, İş Sağlığı ve Güvenliği kurallarına tam uyacağını ve gerekli tüm ekipmanları sağlayacağını taahhüt eder.

MADDE 5: SORUMLULUK
Taşeron, işin kalitesinden ve zamanında tamamlanmasından sorumludur.

MADDE 6: FESİH
İşveren, Taşeron'un sözleşme şartlarını ihlal etmesi durumunda sözleşmeyi feshetme hakkına sahiptir.

Bu sözleşme {{TARİH}} tarihinde düzenlenmiş ve taraflarca imzalanmıştır.`
    },
    {
      name: 'Malzeme Teslim Sözleşmesi',
      content: `MALZEME TESLİM SÖZLEŞMESİ

Bu sözleşme, Mahir Bakay Mühendislik (Alıcı) ile [FİRMA ADI] (Satıcı) arasında aşağıda belirtilen şartlarda düzenlenmiştir.

MADDE 1: MALZEMENİN CİNSİ VE MİKTARI
Satıcı, Alıcı'ya aşağıda belirtilen malzemeleri teslim edecektir:
- [MALZEME LİSTESİ]

MADDE 2: TESLİM YERİ VE ZAMANI
Malzemeler [TESLİM YERİ]'ne [TESLİM TARİHİ]'nde teslim edilecektir.

MADDE 3: FİYAT VE ÖDEME
Toplam bedel [TUTAR] TL'dir. Ödeme, malzeme kabulünden sonra [GÜN] gün içinde yapılacaktır.

MADDE 4: KALİTE
Satıcı, malzemelerin teknik şartnameye uygun olduğunu garanti eder.

MADDE 5: GARANTİ
Satıcı, malzemeler için [AY] ay garanti verir.

Bu sözleşme {{TARİH}} tarihinde düzenlenmiş ve taraflarca imzalanmıştır.`
    }
  ]

  for (const template of templates) {
    await prisma.contractTemplate.upsert({
      where: { name: template.name },
      update: template,
      create: template
    })
  }

  console.log('Contract templates seeded successfully')
}

seedContractTemplates()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })