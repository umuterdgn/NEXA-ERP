/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * This code is the property of NXA Software.
 */

import { PrismaClient } from "@prisma/client"

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

const prisma = globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma

async function main() {
  console.log("Seeding contract templates...")

  // Create contract templates
  const isgTemplate = await prisma.contractTemplate.upsert({
    where: { name: "İSG (İş Sağlığı ve Güvenliği) Taahhütnamesi" },
    update: {},
    create: {
      name: "İSG (İş Sağlığı ve Güvenliği) Taahhütnamesi",
      content: "İŞ SAĞLIĞI VE GÜVENLİĞİ TAAHHÜTNAMESİ\n\nBen {{PERSONEL_ADI}} (TC: {{KIMLIK_NO}}), {{PROJE_ADI}} şantiyesinde çalışırken İş Sağlığı ve Güvenliği kurallarına eksiksiz uyacağımı, tarafıma teslim edilen kişisel koruyucu donanımları (baret, yelek, iş ayakkabısı) her zaman kullanacağımı beyan ve taahhüt ederim.\n\nTarih: {{TARİH}}\nİmza:"
    }
  })

  const zimmetTemplate = await prisma.contractTemplate.upsert({
    where: { name: "Malzeme ve Donanım Zimmet Formu" },
    update: {},
    create: {
      name: "Malzeme ve Donanım Zimmet Formu",
      content: "DEMİRBAŞ / MALZEME ZİMMET TUTANAĞI\n\n{{PROJE_ADI}} projesinde görev yapmakta olan {{PERSONEL_ADI}}'na (TC: {{KIMLIK_NO}}) firmaya ait ekipmanlar/malzemeler eksiksiz ve çalışır durumda teslim edilmiştir. İlgili personel işten ayrılma durumunda bu malzemeleri iade etmekle yükümlüdür.\n\nTarih: {{TARİH}}\nTeslim Alan (İmza):"
    }
  })

  const sozlesmeTemplate = await prisma.contractTemplate.upsert({
    where: { name: "Genel Hizmet / Taşeron Sözleşmesi" },
    update: {},
    create: {
      name: "Genel Hizmet / Taşeron Sözleşmesi",
      content: "HİZMET SÖZLEŞMESİ\n\nBu sözleşme, {{PROJE_ADI}} projesi kapsamında görev alacak olan {{PERSONEL_ADI}} (TC: {{KIMLIK_NO}}) ile işveren arasında, {{TARİH}} tarihinde imza altına alınmıştır. Taraflar, şantiye yönetmeliklerine ve belirlenen hakediş kurallarına uymayı kabul eder.\n\nTarih: {{TARİH}}\nİmza:"
    }
  })

  console.log(`Created/Updated contract templates:`)
  console.log(`  - ${isgTemplate.name}`)
  console.log(`  - ${zimmetTemplate.name}`)
  console.log(`  - ${sozlesmeTemplate.name}`)
  console.log("Contract templates seeded successfully!")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })