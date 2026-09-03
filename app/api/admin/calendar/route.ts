/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * This code is the property of NXA Software.
 */

import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const events: any[] = []
    const today = new Date()
    const currentMonth = today.getMonth()
    const currentYear = today.getFullYear()

    // 1. Projelerin tarihleri
    const projects = await prisma.project.findMany({
      select: {
        id: true,
        name: true,
        title: true,
        startDate: true,
        endDate: true
      }
    })

    projects.forEach(project => {
      if (project.startDate) {
        events.push({
          id: `project-start-${project.id}`,
          date: project.startDate.toISOString(),
          title: `Proje Başlangıcı: ${project.name || project.title}`,
          type: "project",
          color: "#3b82f6", // Mavi
          description: `${project.name || project.title} projesi başlıyor`
        })
      }
      if (project.endDate) {
        events.push({
          id: `project-end-${project.id}`,
          date: project.endDate.toISOString(),
          title: `Proje Bitişi: ${project.name || project.title}`,
          type: "project",
          color: "#06b6d4", // Turkuaz
          description: `${project.name || project.title} projesi bitiyor`
        })
      }
    })

    // 2. Demirbaş bakım tarihleri
    const equipments = await prisma.equipment.findMany({
      where: {
        nextMaintenance: {
          not: null
        }
      },
      select: {
        id: true,
        name: true,
        nextMaintenance: true
      }
    })

    equipments.forEach(equipment => {
      if (equipment.nextMaintenance) {
        events.push({
          id: `equipment-${equipment.id}`,
          date: equipment.nextMaintenance.toISOString(),
          title: `Bakım: ${equipment.name}`,
          type: "maintenance",
          color: "#f59e0b", // Sarı/Turuncu
          description: `${equipment.name} demirbaşının bakım tarihi`
        })
      }
    })

    // 3. Personel ödeme günleri
    const personnel = await prisma.personel.findMany({
      where: {
        OR: [
          { salaryPayDay: { not: null } },
          { sgkPayDay: { not: null } }
        ]
      },
      select: {
        id: true,
        name: true,
        salaryPayDay: true,
        sgkPayDay: true
      }
    })

    personnel.forEach(person => {
      // Bu ay ve sonraki ayın ödeme günlerini hesapla
      const monthsToCheck = [currentMonth, (currentMonth + 1) % 12]
      const yearsToCheck = [currentYear, currentMonth === 11 ? currentYear + 1 : currentYear]

      if (person.salaryPayDay) {
        monthsToCheck.forEach((month, idx) => {
          const year = yearsToCheck[idx]
          const paymentDate = new Date(year, month, person.salaryPayDay ?? 5)
          events.push({
            id: `salary-${person.id}-${year}-${month}`,
            date: paymentDate.toISOString(),
            title: `Maaş: ${person.name}`,
            type: "salary",
            color: "#ef4444", // Kırmızı
            description: `${person.name} için maaş ödemesi`
          })
        })
      }

      if (person.sgkPayDay) {
        monthsToCheck.forEach((month, idx) => {
          const year = yearsToCheck[idx]
          const paymentDate = new Date(year, month, person.sgkPayDay ?? 5)
          events.push({
            id: `sgk-${person.id}-${year}-${month}`,
            date: paymentDate.toISOString(),
            title: `SGK: ${person.name}`,
            type: "sgk",
            color: "#ef4444", // Kırmızı
            description: `${person.name} için SGK ödemesi`
          })
        })
      }
    })

    // Tarihe göre sırala
    events.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

    return NextResponse.json(events)
  } catch (error) {
    console.error("Error fetching calendar events:", error)
    return NextResponse.json(
      { error: "Takvim etkinlikleri getirilirken hata oluştu" },
      { status: 500 }
    )
  }
}
