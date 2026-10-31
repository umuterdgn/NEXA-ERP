/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * This code is the property of NXA Software.
 */

import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { PersonnelDashboard } from "./components/PersonnelDashboard"
import DriverDashboard from "@/components/personnel/DriverDashboard"

export default async function PersonnelPage() {
  const session = await auth()
  
  if (!session) {
    redirect("/login")
  }

  const userRole = ((session.user?.role as string) || "").toUpperCase()
  const isPersonnel = [
    "STAFF",
    "WORKER",
    "PERSONNEL",
    "ENGINEER",
    "SITE_MANAGER",
    "ADMIN",
    "SUPER_ADMIN",
    "DRIVER"
  ].includes(userRole)

  if (!isPersonnel) {
    if (userRole === "INSPECTION_ADMIN" || userRole === "INSPECTOR" || userRole === "AUDITOR") {
      redirect("/inspection/dashboard")
    }
    if (userRole === "SUBCONTRACTOR") {
      redirect("/subcontractor")
    }
    if (userRole === "SUPPLIER") {
      redirect("/supplier")
    }
    redirect("/admin")
  }

  // ADIM 5: Sürücü (Driver) Özel Görünümü
  if (userRole === "DRIVER") {
    const today = new Date()
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0)
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59)

    const appointments = await prisma.logisticsAppointment.findMany({
      where: {
        OR: [
          { driverUserId: session.user.id },
          {
            appointmentDate: {
              gte: startOfDay,
              lte: endOfDay,
            },
          },
        ],
      },
      include: {
        project: {
          select: { id: true, title: true, name: true, location: true },
        },
      },
      orderBy: {
        appointmentDate: "asc",
      },
    })

    return (
      <DriverDashboard
        initialAppointments={JSON.parse(JSON.stringify(appointments))}
        user={session.user}
      />
    )
  }

  // Fetch personnel data
  let personnel = await (prisma as any).personel.findFirst({
    where: {
      userId: session.user.id
    },
    include: {
      attendanceRecords: {
        include: {
          project: true
        },
        orderBy: { date: 'desc' },
        take: 7
      },
      inventoryAssignments: {
        include: {
          inventory: true
        },
        where: {
          status: { in: ['ACTIVE', 'MAINTENANCE'] }
        }
      },
      payments: {
        where: {
          type: 'AVANS',
          status: 'PENDING'
        },
        orderBy: { date: 'desc' }
      },
      leaveRequests: {
        where: {
          status: 'APPROVED'
        },
        orderBy: { startDate: 'desc' }
      }
    }
  })

  // Fallback for engineers/site managers without a linked personel record
  if (!personnel) {
    personnel = {
      id: session.user.id || "eng-fallback",
      name: session.user.name || "Saha Mühendisi / Personel",
      department: userRole === "ENGINEER" ? "Mühendislik & Şantiye" : "Saha Yönetimi",
      currentSite: "Merkez Şantiye Projesi",
      phone: "+90 555 000 00 00",
      email: session.user.email || "muhendis@nexa.com",
      gunlukYevmiye: 2500,
      attendanceRecords: [],
      inventoryAssignments: [],
      payments: [],
      leaveRequests: []
    }
  }

  // Calculate summary data
  const thisMonthAttendance = personnel.attendanceRecords.filter((record: any) => {
    const recordDate = new Date(record.date)
    const now = new Date()
    return recordDate.getMonth() === now.getMonth() && recordDate.getFullYear() === now.getFullYear()
  })

  const totalDayMultiplier = thisMonthAttendance.reduce((sum: number, record: any) => sum + (record.dayMultiplier || 0), 0)
  const estimatedEarnings = totalDayMultiplier * (personnel.gunlukYevmiye || 0)
  const totalHours = thisMonthAttendance.reduce((sum: number, record: any) => {
    if (record.checkIn && record.checkOut) {
      const hours = (new Date(record.checkOut).getTime() - new Date(record.checkIn).getTime()) / (1000 * 60 * 60)
      return sum + hours
    }
    return sum
  }, 0)

  // Calculate leave balance (simplified: 30 days - used approved leave days)
  const usedLeaveDays = personnel.leaveRequests.reduce((sum: number, req: any) => {
    const days = Math.ceil((new Date(req.endDate).getTime() - new Date(req.startDate).getTime()) / (1000 * 60 * 60 * 24)) + 1
    return sum + days
  }, 0)
  const leaveBalance = Math.max(0, 30 - usedLeaveDays)

  // Calculate active advance
  const activeAdvance = personnel.payments.reduce((sum: number, payment: any) => sum + payment.amount, 0)

  // Format recent attendance records (last 3)
  const recentAttendance = personnel.attendanceRecords.slice(0, 3).map((record: any) => {
    const date = new Date(record.date)
    const day = date.getDate()
    const months = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara']
    const month = months[date.getMonth()]
    
    const checkIn = record.checkIn ? new Date(record.checkIn).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }) : '-'
    const checkOut = record.checkOut ? new Date(record.checkOut).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }) : '-'
    
    let hours = 0
    if (record.checkIn && record.checkOut) {
      hours = (new Date(record.checkOut).getTime() - new Date(record.checkIn).getTime()) / (1000 * 60 * 60)
    }
    
    return {
      date: `${day} ${month}`,
      checkIn,
      checkOut,
      hours: Math.round(hours * 10) / 10
    }
  })

  // Format equipment data
  const equipment = personnel.inventoryAssignments.slice(0, 3).map((assignment: any) => ({
    id: assignment.id,
    name: assignment.inventory.name,
    code: assignment.inventory.qrCode || '-',
    status: assignment.status.toLowerCase()
  }))

  // Fetch today's menu
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  const todayMenu = await (prisma as any).foodMenu.findFirst({
    where: {
      date: {
        gte: today,
        lt: tomorrow
      }
    }
  })

  const personnelData = {
    id: personnel.id,
    name: personnel.name,
    department: personnel.department,
    currentSite: personnel.currentSite,
    phone: personnel.phone,
    email: personnel.email
  }

  const summaryData = {
    estimatedEarnings,
    totalHours: Math.round(totalHours * 10) / 10,
    attendanceCount: thisMonthAttendance.length,
    equipmentCount: personnel.inventoryAssignments.length,
    leaveBalance,
    activeAdvance
  }

  return (
    <PersonnelDashboard 
      personnel={personnelData} 
      summary={summaryData} 
      recentAttendance={recentAttendance} 
      equipment={equipment}
      todayMenu={todayMenu ? {
        items: todayMenu.items,
        date: todayMenu.date
      } : null}
    />
  )
}
