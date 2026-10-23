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
    // Hash the default password (demo123)
    const hashedPassword = await bcrypt.hash("demo123", 10)

    // Create or update demo users using upsert
    const demoUsers = [
      {
        email: "admin@nexa.com",
        name: "Admin (Patron)",
        role: "ADMIN" as const,
        permissions: ["DASHBOARD", "PERSONNEL", "PROJECTS", "ANALYTICS", "ADMIN"],
        password: hashedPassword
      },
      {
        email: "lojistik@nexa.com",
        name: "Satınalma ve Lojistik Müdürü",
        role: "PROCUREMENT_MANAGER" as const,
        permissions: ["DASHBOARD", "LOGISTICS", "PROCUREMENT", "INVENTORY"],
        password: hashedPassword
      },
      {
        email: "koordinator@nexa.com",
        name: "Proje Koordinatörü",
        role: "PROJECT_MANAGER" as const,
        permissions: ["DASHBOARD", "PROJECTS", "APPROVALS", "BUDGET"],
        password: hashedPassword
      },
      {
        email: "sef@nexa.com",
        name: "Şantiye Şefi",
        role: "SITE_MANAGER" as const,
        permissions: ["DASHBOARD", "PROJECTS", "SITE", "APPROVALS"],
        password: hashedPassword
      },
      {
        email: "muhendis@nexa.com",
        name: "Saha Mühendisi",
        role: "ENGINEER" as const,
        permissions: ["DASHBOARD", "PROJECTS", "SITE", "WORK_PROOF"],
        password: hashedPassword
      },
      {
        email: "sofor@nexa.com",
        name: "Kamyon Şoförü",
        role: "DRIVER" as const,
        permissions: ["LOGISTICS", "TRACKING", "DRIVER"],
        password: hashedPassword
      },
      {
        email: "ik@nexa.com",
        name: "İK Müdürü",
        role: "HR_MANAGER" as const,
        permissions: ["DASHBOARD", "PERSONNEL", "HR", "PAYROLL"],
        password: hashedPassword
      },
      {
        email: "finans@nexa.com",
        name: "Finans Müdürü",
        role: "FINANCE_MANAGER" as const,
        permissions: ["DASHBOARD", "FINANCE", "INVOICES", "PAYMENTS"],
        password: hashedPassword
      },
      {
        email: "denetim@nexa.com",
        name: "Yapı Denetim Patronu",
        role: "INSPECTION_ADMIN" as const,
        permissions: ["DASHBOARD", "INSPECTION", "REPORTS", "QA_QC"],
        password: hashedPassword
      },
      {
        email: "denetci@nexa.com",
        name: "Saha Yapı Denetimcisi",
        role: "INSPECTOR" as const,
        permissions: ["DASHBOARD", "INSPECTION", "REPORTS", "FIELD_CHECKS"],
        password: hashedPassword
      },
      {
        email: "personel@nexa.com",
        name: "Saha Personeli",
        role: "STAFF" as const,
        permissions: ["MY_TASKS", "MY_ATTENDANCE", "MY_SALARY"],
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
