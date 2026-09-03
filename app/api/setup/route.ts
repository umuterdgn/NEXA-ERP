/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * This code is the property of NXA Software.
 */

import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

export async function GET() {
  try {
    // Check if any admin user exists
    const existingAdmin = await prisma.adminUser.findFirst()
    
    if (existingAdmin) {
      return NextResponse.json(
        { 
          message: "Admin user already exists",
          email: existingAdmin.email
        },
        { status: 200 }
      )
    }

    // Create default admin user
    const hashedPassword = await bcrypt.hash("123456", 10)
    
    const admin = await prisma.adminUser.create({
      data: {
        name: "Sistem Yöneticisi",
        email: "admin@nexa.com",
        password: hashedPassword,
        role: "ADMIN"
      }
    })

    return NextResponse.json(
      { 
        message: "Default admin user created successfully",
        email: admin.email,
        password: "123456"
      },
      { status: 201 }
    )
  } catch (error) {
    console.error("Error creating admin user:", error)
    return NextResponse.json(
      { error: "Failed to create admin user" },
      { status: 500 }
    )
  }
}
