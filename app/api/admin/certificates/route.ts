/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * This code is the property of NXA Software.
 */

import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const isSuperAdmin = session.user.role === "SUPER_ADMIN"
    const tenantId = (session.user as any)?.tenantId

    const where: any = {}
    if (!isSuperAdmin) {
      where.tenantId = tenantId || "non-existent"
    }

    const certificates = await prisma.certificate.findMany({
      where,
      include: {
        personel: {
          select: {
            id: true,
            name: true,
            personnelNo: true
          }
        }
      },
      orderBy: {
        expiryDate: 'asc'
      }
    })

    // Calculate days remaining and status
    const today = new Date()
    const certificatesWithStatus = certificates.map(cert => {
      const daysRemaining = Math.ceil((cert.expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
      let status = 'valid'
      if (daysRemaining <= 15) status = 'critical'
      else if (daysRemaining <= 30) status = 'warning'

      return {
        ...cert,
        daysRemaining,
        status
      }
    })

    return NextResponse.json(certificatesWithStatus)
  } catch (error) {
    console.error("Failed to fetch certificates:", error)
    return NextResponse.json(
      { error: "Failed to fetch certificates" },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const tenantId = (session.user as any)?.tenantId
    const body = await request.json()
    const { name, expiryDate, personelId, documentUrl, type } = body

    const certificate = await prisma.certificate.create({
      data: {
        name,
        expiryDate: new Date(expiryDate),
        personelId,
        documentUrl: documentUrl || null,
        type: type || "SERTIFIKA",
        tenantId: tenantId || null
      },
      include: {
        personel: {
          select: {
            id: true,
            name: true,
            personnelNo: true
          }
        }
      }
    })

    return NextResponse.json(certificate)
  } catch (error) {
    console.error("Failed to create certificate:", error)
    return NextResponse.json(
      { error: "Failed to create certificate" },
      { status: 500 }
    )
  }
}
