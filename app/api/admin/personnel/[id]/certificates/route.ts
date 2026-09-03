/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * This code is the property of NXA Software.
 */

import { NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const certificates = await prisma.certificate.findMany({
      where: {
        personelId: id
      },
      orderBy: {
        expiryDate: 'asc'
      }
    })

    return NextResponse.json(certificates)
  } catch (error) {
    console.error("Failed to fetch personnel certificates:", error)
    return NextResponse.json(
      { error: "Failed to fetch certificates" },
      { status: 500 }
    )
  }
}
