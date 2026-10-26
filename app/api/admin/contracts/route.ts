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
    const userRole = session?.user?.role
    const isSuperAdmin = userRole === "SUPER_ADMIN"
    const tenantId = (session?.user as any)?.tenantId as string | undefined

    if (!session?.user || (!tenantId && !isSuperAdmin)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get("projectId")
    const subcontractorId = searchParams.get("subcontractorId")

    const contracts = await prisma.contract.findMany({
      where: {
        ...(!isSuperAdmin ? (tenantId ? { tenantId } : { tenantId: "non-existent" }) : {}),
        ...(projectId && { projectId }),
        ...(subcontractorId && { subcontractorId })
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            title: true
          }
        },
        subcontractor: {
          select: {
            id: true,
            name: true,
            taxNumber: true,
            contactName: true,
            phone: true
          }
        }
      },
      orderBy: { createdAt: "desc" }
    })

    return NextResponse.json(contracts)
  } catch (error) {
    console.error("Error fetching contracts:", error)
    return NextResponse.json({ error: "Failed to fetch contracts" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth()
    const userRole = session?.user?.role
    const isSuperAdmin = userRole === "SUPER_ADMIN"
    const tenantId = (session?.user as any)?.tenantId as string | undefined

    if (!session?.user || (!tenantId && !isSuperAdmin)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { projectId, subcontractorId, title, totalAmount, startDate, endDate, status } = body

    const contract = await prisma.contract.create({
      data: {
        projectId,
        subcontractorId,
        title,
        totalAmount: parseFloat(totalAmount),
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        status: status || 'ACTIVE',
        tenantId: tenantId || null,
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            title: true
          }
        },
        subcontractor: {
          select: {
            id: true,
            name: true,
            taxNumber: true,
            contactName: true,
            phone: true
          }
        }
      }
    })

    return NextResponse.json(contract)
  } catch (error) {
    console.error("Error creating contract:", error)
    return NextResponse.json({ error: "Failed to create contract" }, { status: 500 })
  }
}