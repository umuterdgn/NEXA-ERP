import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET() {
  try {
    // Seed Projects with Hatay coordinates
    const projects = await Promise.all([
      prisma.project.upsert({
        where: { id: 'proj1' },
        update: {},
        create: {
          id: 'proj1',
          name: 'İskenderun TOKİ Projesi',
          title: 'İskenderun TOKİ Projesi',
          description: 'İskenderun TOKİ konut projesi',
          yibfNo: '2024-001',
          latitude: 36.5871,
          longitude: 36.1735,
          city: 'Hatay',
          district: 'İskenderun',
          status: 'SAHA',
          healthScore: 85,
          progress: 65,
          isActive: true,
        },
      }),
      prisma.project.upsert({
        where: { id: 'proj2' },
        update: {},
        create: {
          id: 'proj2',
          name: 'Arsuz Konutları',
          title: 'Arsuz Konutları',
          description: 'Arsuz konut projesi',
          yibfNo: '2024-002',
          latitude: 36.4172,
          longitude: 35.8827,
          city: 'Hatay',
          district: 'Arsuz',
          status: 'SAHA',
          healthScore: 72,
          progress: 45,
          isActive: true,
        },
      }),
      prisma.project.upsert({
        where: { id: 'proj3' },
        update: {},
        create: {
          id: 'proj3',
          name: 'Dörtyol Sitesi',
          title: 'Dörtyol Sitesi',
          description: 'Dörtyol site projesi',
          yibfNo: '2024-003',
          latitude: 36.8439,
          longitude: 36.2219,
          city: 'Hatay',
          district: 'Dörtyol',
          status: 'SAHA',
          healthScore: 45,
          progress: 30,
          isActive: true,
        },
      }),
      prisma.project.upsert({
        where: { id: 'proj4' },
        update: {},
        create: {
          id: 'proj4',
          name: 'Erzin Proje',
          title: 'Erzin Proje',
          description: 'Erzin inşaat projesi',
          yibfNo: '2024-004',
          latitude: 36.9532,
          longitude: 36.2023,
          city: 'Hatay',
          district: 'Erzin',
          status: 'SAHA',
          healthScore: 90,
          progress: 80,
          isActive: true,
        },
      }),
    ])

    // Seed Personnel
    const personnel = await Promise.all([
      prisma.personel.upsert({
        where: { personnelNo: 'P001' },
        update: {},
        create: {
          personnelNo: 'P001',
          name: 'Ahmet Yılmaz',
          department: 'İnşaat',
          position: 'Kalıpçı',
          phone: '0555 123 4567',
          email: 'ahmet@nexa.com',
          currentSite: 'İskenderun TOKİ',
          status: 'ACTIVE',
          salary: 15000,
          salaryStatus: 'Paid',
          age: 35,
          birthDate: new Date('1990-01-15'),
          hireDate: new Date('2023-01-01'),
        },
      }),
      prisma.personel.upsert({
        where: { personnelNo: 'P002' },
        update: {},
        create: {
          personnelNo: 'P002',
          name: 'Mehmet Demir',
          department: 'Elektrik',
          position: 'Elektrikçi',
          phone: '0555 234 5678',
          email: 'mehmet@nexa.com',
          currentSite: 'Arsuz Konutları',
          status: 'ACTIVE',
          salary: 16000,
          salaryStatus: 'Pending',
          age: 32,
          birthDate: new Date('1993-05-20'),
          hireDate: new Date('2023-03-01'),
        },
      }),
      prisma.personel.upsert({
        where: { personnelNo: 'P003' },
        update: {},
        create: {
          personnelNo: 'P003',
          name: 'Ali Kaya',
          department: 'İnşaat',
          position: 'Demirci',
          phone: '0555 345 6789',
          email: 'ali@nexa.com',
          currentSite: 'Dörtyol Sitesi',
          status: 'ON_LEAVE',
          salary: 15500,
          salaryStatus: 'Paid',
          age: 40,
          birthDate: new Date('1985-08-10'),
          hireDate: new Date('2022-06-01'),
        },
      }),
      prisma.personel.upsert({
        where: { personnelNo: 'P004' },
        update: {},
        create: {
          personnelNo: 'P004',
          name: 'Hasan Öztürk',
          department: 'Mekanik',
          position: 'Tesisatçı',
          phone: '0555 456 7890',
          email: 'hasan@nexa.com',
          currentSite: 'Erzin Proje',
          status: 'ACTIVE',
          salary: 14500,
          salaryStatus: 'Pending',
          age: 28,
          birthDate: new Date('1997-12-05'),
          hireDate: new Date('2023-08-01'),
        },
      }),
      prisma.personel.upsert({
        where: { personnelNo: 'P005' },
        update: {},
        create: {
          personnelNo: 'P005',
          name: 'İbrahim Şahin',
          department: 'İnşaat',
          position: 'Mimar',
          phone: '0555 567 8901',
          email: 'ibrahim@nexa.com',
          currentSite: 'İskenderun TOKİ',
          status: 'ACTIVE',
          salary: 20000,
          salaryStatus: 'Paid',
          age: 38,
          birthDate: new Date('1987-03-25'),
          hireDate: new Date('2022-01-15'),
        },
      }),
    ])

    return NextResponse.json({
      success: true,
      message: 'Database seeded successfully',
      projects: projects.length,
      personnel: personnel.length,
    })
  } catch (error) {
    console.error('Seed error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to seed database', 
        details: error instanceof Error ? error.message : String(error) 
      },
      { status: 500 }
    )
  }
}
