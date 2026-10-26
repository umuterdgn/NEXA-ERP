/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * This code is the property of NXA Software.
 */

import { NextResponse } from "next/server"
import { revalidatePath } from 'next/cache'
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const session = await auth()
    const userRole = session?.user?.role
    const isSuperAdmin = userRole === "SUPER_ADMIN"
    const tenantId = (session?.user as any)?.tenantId as string | undefined

    if (!session?.user || (!tenantId && !isSuperAdmin)) {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get('projectId')
    const status = searchParams.get('status')

    const whereClause: any = !isSuperAdmin ? (tenantId ? { tenantId } : { tenantId: "non-existent" }) : {}
    if (projectId) whereClause.projectId = projectId
    if (status) whereClause.status = status

    const shifts = await prisma.shift.findMany({
      where: whereClause,
      include: {
        project: {
          select: { id: true, name: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json(shifts || [])
  } catch (error) {
    console.error("Error fetching shifts:", error)
    return NextResponse.json([], { status: 200 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth()
    const userRole = session?.user?.role
    const isSuperAdmin = userRole === "SUPER_ADMIN"
    const tenantId = (session?.user as any)?.tenantId as string | undefined

    if (!session?.user || (!tenantId && !isSuperAdmin)) {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 })
    }

    const body = await request.json()
    const { name, timeRange, personnelCount, projectId, status } = body

    const newShift = await prisma.shift.create({
      data: {
        name,
        timeRange,
        personnelCount: parseInt(personnelCount) || 0,
        projectId: projectId || null,
        status: status || "Active",
        tenantId: tenantId || null,
      },
      include: {
        project: {
          select: { id: true, name: true }
        }
      }
    })

    revalidatePath('/admin/shifts')

    return NextResponse.json(newShift, { status: 201 })
  } catch (error) {
    console.error("Error creating shift:", error)
    return NextResponse.json(
      { error: "Vardiya oluşturulurken hata oluştu" },
      { status: 500 }
    )
  }
}
