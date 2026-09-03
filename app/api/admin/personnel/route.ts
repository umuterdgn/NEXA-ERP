/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * This code is the property of NXA Software.
 */

import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { logPersonnelAction } from "@/lib/logger"

export async function GET() {
  try {
    const personnel = await prisma.personel.findMany({
      where: {
        role: {
          notIn: ['ADMIN', 'MUTEAHHIT']
        }
      },
      include: {
        profession: true
      },
      orderBy: { createdAt: 'desc' }
    })
    return NextResponse.json(personnel)
  } catch (error) {
    console.error("Error fetching personnel:", error)
    return NextResponse.json({ error: "Failed to fetch personnel" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth()
    const userName = session?.user?.name || "Bilinmeyen Kullanıcı"
    
    const body = await request.json()
    
    const personnel = await prisma.personel.create({
      data: {
        personnelNo: body.personnelNo,
        name: body.name,
        tcNo: body.tcNo || null,
        nfcUid: body.nfcUid || null,
        age: body.age ? Number(body.age) : 0,
        birthDate: new Date(body.birthDate),
        department: body.department,
        currentSite: body.currentSite,
        phone: body.phone || null,
        email: body.email || null,
        hireDate: new Date(body.hireDate || new Date()),
        status: "ACTIVE",
        salary: body.salary ? parseFloat(body.salary.toString()) : 0,
        salaryPayDay: body.salaryPayDay ? Number(body.salaryPayDay) : null,
        sgkPeriod: body.sgkPeriod || null,
        sgkPayDay: body.sgkPayDay ? Number(body.sgkPayDay) : null,
        healthStatus: body.healthStatus || null,
        bonuses: body.bonuses ? parseFloat(body.bonuses.toString()) : 0,
        takim: body.takim || null,
        gunlukYevmiye: body.gunlukYevmiye ? parseFloat(body.gunlukYevmiye.toString()) : 0,
        professionId: body.professionId || null
      }
    })
    
    // Log the action with detailed information
    await logPersonnelAction("EKLENDI", userName, personnel.name, `Personel No: ${personnel.personnelNo}`)
    
    return NextResponse.json(personnel)
  } catch (error) {
    console.error("Error creating personnel:", error)
    return NextResponse.json({ error: "Failed to create personnel" }, { status: 500 })
  }
}
