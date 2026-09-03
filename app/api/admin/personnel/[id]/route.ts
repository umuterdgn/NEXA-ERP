/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * This code is the property of NXA Software.
 */

import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { logPersonnelAction } from "@/lib/logger"
import bcrypt from "bcryptjs"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params
    const person = await prisma.personel.findUnique({
      where: { id: resolvedParams.id },
      include: {
        payments: {
          orderBy: { date: "desc" }
        },
        inventoryHistory: {
          include: {
            inventory: true
          }
        },
        attendanceRecords: {
          include: {
            project: true
          },
          orderBy: { date: "desc" }
        },
        assignedTasks: {
          include: {
            project: true
          },
          orderBy: { createdAt: "desc" }
        },
        assignedEquipment: {
          include: {
            project: true
          }
        },
        inspectionRecords: {
          include: {
            yibf: true
          },
          orderBy: { timestamp: "desc" }
        },
        deficiencies: {
          include: {
            project: true
          },
          orderBy: { createdAt: "desc" }
        }
      }
    })
    
    if (!person) {
      return NextResponse.json({ error: "Personel bulunamadı" }, { status: 404 })
    }

    const totalDayMultiplier = person.attendanceRecords.reduce((sum, record) => sum + Number(record.dayMultiplier ?? 0), 0)
    const totalOvertimeHours = person.attendanceRecords.reduce((sum, record) => sum + Number(record.overtimeHours ?? 0), 0)
    const dailyWage = Number(person.gunlukYevmiye ?? 0)
    const totalBaseEarned = totalDayMultiplier * dailyWage
    const overtimeHourlyRate = dailyWage > 0 ? (dailyWage / 9) * 1.5 : 0
    const totalOvertimeEarned = totalOvertimeHours * overtimeHourlyRate
    const totalBonuses = Number(person.bonuses ?? 0)
    const totalPaid = person.payments.reduce((sum, payment) => sum + Number(payment.amount ?? 0), 0)
    const totalEarned = totalBaseEarned + totalOvertimeEarned + totalBonuses
    const currentBalance = totalEarned - totalPaid

    const financialSummary = {
      dailyWage,
      totalDayMultiplier,
      totalOvertimeHours,
      totalBaseEarned,
      totalOvertimeEarned,
      totalBonuses,
      totalPaid,
      totalEarned,
      currentBalance
    }

    return NextResponse.json({
      ...person,
      financialSummary,
      totalBaseEarned,
      totalOvertimeEarned,
      totalEarned,
      totalPaid,
      currentBalance,
      totalOvertimeHours,
      totalDayMultiplier
    })
  } catch (error) {
    console.error("Error fetching personnel:", error)
    return NextResponse.json({ error: "Failed to fetch personnel" }, { status: 500 })
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    const userName = session?.user?.name || "Bilinmeyen Kullanıcı"
    
    const resolvedParams = await params
    const body = await request.json()
    
    // Get the existing personnel to log the name
    const existingPerson = await prisma.personel.findUnique({
      where: { id: resolvedParams.id }
    })
    
    // Handle username/password synchronization with User table
    let userId = existingPerson?.userId
    if (body.username && body.password) {
      // Hash the password
      const hashedPassword = await bcrypt.hash(body.password, 10)
      
      // Create or update User account
      if (userId) {
        // Update existing user
        await (prisma as any).user.update({
          where: { id: userId },
          data: {
            email: body.username, // Use username as email for simplicity
            password: hashedPassword,
            name: existingPerson?.name || body.username
          }
        })
      } else {
        // Create new user
        const newUser = await (prisma as any).user.create({
          data: {
            email: body.username,
            password: hashedPassword,
            name: existingPerson?.name || body.username,
            role: 'STAFF'
          }
        })
        userId = newUser.id
      }
    }
    
    const updatedPerson = await prisma.personel.update({
      where: { id: resolvedParams.id },
      data: {
        ...body,
        age: body.age ? Number(body.age) : undefined,
        salary: body.salary ? parseFloat(body.salary.toString()) : 0,
        salaryPayDay: body.salaryPayDay ? Number(body.salaryPayDay) : null,
        sgkPeriod: body.sgkPeriod || null,
        sgkPayDay: body.sgkPayDay ? Number(body.sgkPayDay) : null,
        healthStatus: body.healthStatus || null,
        bonuses: body.bonuses ? parseFloat(body.bonuses.toString()) : 0,
        userId: userId || undefined
      }
    })
    
    // Log the action with detailed information
    if (existingPerson) {
      await logPersonnelAction("GUNCELLENDI", userName, existingPerson.name, `Personel No: ${existingPerson.personnelNo}`)
    }
    
    return NextResponse.json(updatedPerson)
  } catch (error) {
    console.error("Error updating personnel:", error)
    return NextResponse.json({ error: "Failed to update personnel" }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    const userName = session?.user?.name || "Bilinmeyen Kullanıcı"
    
    const resolvedParams = await params
    
    // Get the existing personnel to log the name
    const existingPerson = await prisma.personel.findUnique({
      where: { id: resolvedParams.id }
    })
    
    await prisma.personel.delete({
      where: { id: resolvedParams.id }
    })
    
    // Log the action with detailed information
    if (existingPerson) {
      await logPersonnelAction("SILINDI", userName, existingPerson.name, `Personel No: ${existingPerson.personnelNo}`)
    }
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting personnel:", error)
    return NextResponse.json({ error: "Failed to delete personnel" }, { status: 500 })
  }
}
