/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * This code is the property of NXA Software.
 */

import { NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export async function GET() {
  try {
    const certificates = await prisma.certificate.findMany({
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
    const body = await request.json()
    const { name, expiryDate, personelId, documentUrl, type } = body

    const certificate = await prisma.certificate.create({
      data: {
        name,
        expiryDate: new Date(expiryDate),
        personelId,
        documentUrl: documentUrl || null,
        type: type || "SERTIFIKA"
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
