/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Internal Drivers API for Logistics Module
 */

import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const isSuperAdmin = session.user.role === "SUPER_ADMIN"
    const tenantId = (session.user as any)?.tenantId

    const where: any = {
      OR: [
        { position: { contains: "Şoför", mode: "insensitive" } },
        { position: { contains: "Sofor", mode: "insensitive" } },
        { position: { contains: "Driver", mode: "insensitive" } },
        { position: { contains: "Kamyon", mode: "insensitive" } },
        { department: { contains: "Lojistik", mode: "insensitive" } },
        { department: { contains: "Nakliye", mode: "insensitive" } },
      ],
      status: "ACTIVE",
    }

    if (!isSuperAdmin) {
      where.tenantId = tenantId || "non-existent"
    }

    const drivers = await prisma.personel.findMany({
      where,
      select: {
        id: true,
        name: true,
        phone: true,
        position: true,
        currentSite: true,
      },
      orderBy: { name: "asc" },
    })

    return NextResponse.json(drivers)
  } catch (error) {
    console.error("Failed to fetch internal drivers:", error)
    return NextResponse.json([], { status: 500 })
  }
}
