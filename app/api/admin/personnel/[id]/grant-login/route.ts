/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * This code is the property of NXA Software.
 */

import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params
    const body = await request.json()
    const { email, password, role, username } = body

    // Check if personnel exists
    const personnel = await prisma.personel.findUnique({
      where: { id: resolvedParams.id }
    })

    if (!personnel) {
      return NextResponse.json({ error: "Personel bulunamadı" }, { status: 404 })
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Check if email already exists - if so, update existing user
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    let user
    if (existingUser) {
      // Update existing user's password and role
      user = await prisma.user.update({
        where: { email },
        data: {
          password: hashedPassword,
          role: role || "STAFF"
        }
      })
    } else {
      // Create new User
      user = await prisma.user.create({
        data: {
          name: personnel.name,
          email,
          password: hashedPassword,
          role: role || "STAFF"
        }
      })
    }

    // Update personnel with userId and username
    const updatedPersonnel = await prisma.personel.update({
      where: { id: resolvedParams.id },
      data: { 
        userId: user.id,
        username: username || email // Use username if provided, otherwise use email
      }
    })

    return NextResponse.json({ 
      success: true, 
      user,
      personnel: updatedPersonnel
    })
  } catch (error) {
    console.error("Error granting login access:", error)
    return NextResponse.json({ error: "Giriş izni verilirken hata oluştu" }, { status: 500 })
  }
}
