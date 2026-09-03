/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * This code is the property of NXA Software.
 */

import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    // @ts-ignore - Tenant model exists after schema update
    const tenants = await prisma.tenant.findMany({
      include: {
        _count: {
          select: {
            personnel: true,
            projects: true
          }
        }
      },
      orderBy: { createdAt: "desc" }
    })

    return NextResponse.json(tenants)
  } catch (error) {
    console.error("Failed to fetch tenants:", error)
    return NextResponse.json(
      { error: "Kiracılar yüklenirken hata oluştu" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // @ts-ignore - Tenant model exists after schema update
    const tenant = await prisma.tenant.create({
      data: {
        name: body.name,
        domain: body.domain || null,
        isActive: body.isActive ?? true
      }
    })

    return NextResponse.json(tenant)
  } catch (error) {
    console.error("Failed to create tenant:", error)
    return NextResponse.json(
      { error: "Kiracı oluşturulurken hata oluştu" },
      { status: 500 }
    )
  }
}
