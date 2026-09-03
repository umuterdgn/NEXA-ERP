/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * This code is the property of NXA Software.
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding CMS data...')

  // Seed Services
  const services = [
    {
      title: 'Yapı Mühendisliği',
      description: 'Modern yapı tasarımı ve inşaat mühendisliği çözümleri',
      images: ['/service-1.jpg']
    },
    {
      title: 'İnşaat Projeleri',
      description: 'Endüstriyel ve ticari inşaat projeleri',
      images: ['/service-2.jpg']
    },
    {
      title: 'Danışma Hizmetleri',
      description: 'Teknik danışmanlık ve proje yönetimi',
      images: ['/service-3.jpg']
    }
  ]

  for (const service of services) {
    const existing = await prisma.service.findFirst({
      where: { title: service.title }
    })
    if (!existing) {
      await prisma.service.create({ data: service })
    }
  }

  console.log('✓ Services seeded')

  // Seed Projects
  const projects = [
    {
      title: 'Modern Plaza',
      description: 'Modern ticari plaza projesi',
      location: 'İstanbul',
      images: ['/project-1.jpg']
    },
    {
      title: 'Endüstriyel Tesis',
      description: 'Endüstriyel üretim tesisi',
      location: 'Kocaeli',
      images: ['/project-2.jpg']
    },
    {
      title: 'Konut Projesi',
      description: 'Lüks konut projesi',
      location: 'Ankara',
      images: ['/project-3.jpg']
    }
  ]

  for (const project of projects) {
    const existing = await prisma.project.findFirst({
      where: { title: project.title }
    })
    if (!existing) {
      await prisma.project.create({ data: project })
    }
  }

  console.log('✓ Projects seeded')

  // Seed About content if not exists
  const about = await prisma.about.findFirst()
  if (!about) {
    await prisma.about.create({
      data: {
        title: 'Hakkımızda',
        content: 'Mahir Bakay Mühendislik olarak 20 yılı aşkın tecrübemizle inşaat sektöründe yenilikçi ve sürdürülebilir çözümler sunuyoruz.'
      }
    })
    console.log('✓ About content seeded')
  }

  console.log('Seeding completed!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
