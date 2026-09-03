/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * This code is the property of NXA Software.
 */

import { NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

export async function GET() {
  try {
    // Hash the default password (123456)
    const hashedPassword = await bcrypt.hash("123456", 10)

    // Create or update demo users using upsert
    const demoUsers = [
      {
        email: "admin@nexa.com",
        name: "Patron Demo",
        role: "ADMIN" as const,
        permissions: ["DASHBOARD", "PERSONNEL", "PROJECTS", "ANALYTICS"],
        password: hashedPassword
      },
      {
        email: "site@nexa.com",
        name: "Şantiye Şefi",
        role: "SITE_MANAGER" as const,
        permissions: ["DASHBOARD", "PERSONNEL", "PROJECTS"],
        password: hashedPassword
      },
      {
        email: "contractor@nexa.com",
        name: "Müteahhit Demo",
        role: "CLIENT" as const,
        permissions: ["DASHBOARD", "PROJECTS"],
        password: hashedPassword
      }
    ]

    const results = await Promise.all(
      demoUsers.map(async (user) => {
        return await prisma.user.upsert({
          where: { email: user.email },
          update: {
            password: user.password,
            name: user.name,
            role: user.role,
            permissions: user.permissions
          },
          create: {
            email: user.email,
            password: user.password,
            name: user.name,
            role: user.role,
            permissions: user.permissions
          }
        })
      })
    )

    return NextResponse.json(
      { 
        message: "Demo kullanıcıları başarıyla oluşturuldu",
        users: results.map(u => ({ email: u.email, name: u.name, role: u.role }))
      },
      { status: 200 }
    )
  } catch (error) {
    console.error("Demo kullanıcı oluşturma hatası:", error)
    return NextResponse.json(
      { message: "Demo kullanıcıları oluşturulurken bir hata oluştu", error: String(error) },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}
