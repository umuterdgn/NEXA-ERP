/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * This code is the property of NXA Software.
 */

import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

export async function GET(request: Request) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const search = searchParams.get("search")
    const filter = searchParams.get("filter")

    let staff = await prisma.personel.findMany({
      include: {
        siteHistory: {
          orderBy: { startDate: "desc" }
        },
        payments: {
          orderBy: { date: "desc" }
        },
        insurance: true
      },
      orderBy: { name: "asc" }
    })

    if (search) {
      staff = staff.filter(s => 
        s.name.toLowerCase().includes(search.toLowerCase())
      )
    }

    if (filter === "unpaid") {
      staff = staff.filter(s => 
        s.payments?.some(p => !p.isPaid)
      )
    }

    if (filter === "insurance") {
      const thirtyDaysFromNow = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      staff = staff.filter(s => 
        s.insurance && new Date(s.insurance.nextRenewalDate) < thirtyDaysFromNow
      )
    }

    return NextResponse.json(staff)
  } catch (error) {
    console.error("Staff fetch error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { name, age, birthDate, department, currentSite } = body

    // Generate personnel number
    const personnelCount = await prisma.personel.count()
    const personnelNo = `P${String(personnelCount + 1).padStart(3, '0')}`

    const newStaff = await prisma.personel.create({
      data: {
        personnelNo,
        name,
        age,
        birthDate: new Date(birthDate),
        department,
        currentSite,
        hireDate: new Date()
      },
      include: {
        siteHistory: true,
        personelPayments: true,
        insurance: true
      } as any
    })

    return NextResponse.json(newStaff)
  } catch (error) {
    console.error("Staff create error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}