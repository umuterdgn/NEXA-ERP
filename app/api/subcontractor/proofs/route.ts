/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Subcontractor Proof of Work API
 */

import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const contractId = searchParams.get("contractId")
    const subcontractorId = searchParams.get("subcontractorId")

    const where: any = {}
    if (contractId) where.contractId = contractId
    if (subcontractorId) where.subcontractorId = subcontractorId

    const proofs = await prisma.workProof.findMany({
      where,
      include: {
        contract: {
          select: {
            id: true,
            title: true,
            totalAmount: true,
            project: {
              select: { id: true, name: true, title: true }
            }
          }
        },
        subcontractor: {
          select: {
            id: true,
            name: true,
            contactName: true,
            phone: true
          }
        }
      },
      orderBy: { createdAt: "desc" }
    })

    return NextResponse.json({ proofs })
  } catch (error) {
    console.error("Fetch proofs error:", error)
    return NextResponse.json({ error: "Kanıtlar getirilemedi" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { contractId, title, description, imageUrl, subcontractorId: providedSubId } = body

    if (!contractId || !title || !imageUrl) {
      return NextResponse.json(
        { error: "Sözleşme seçimi, iş başlığı ve kanıt fotoğrafı zorunludur" },
        { status: 400 }
      )
    }

    // Find contract to verify and obtain subcontractorId
    const contract = await prisma.contract.findUnique({
      where: { id: contractId }
    })

    if (!contract) {
      return NextResponse.json({ error: "Geçersiz sözleşme" }, { status: 404 })
    }

    const subcontractorId = providedSubId || contract.subcontractorId
    const projectId = contract.projectId

    // Ensure valid boqItem
    let boqItemId = body.boqItemId
    if (!boqItemId) {
      const firstBoq = await prisma.boqItem.findFirst({ where: { projectId } })
      if (firstBoq) {
        boqItemId = firstBoq.id
      } else {
        const newBoq = await prisma.boqItem.create({
          data: {
            projectId,
            pozNo: "15.120.1001",
            description: "C35/45 Hazır Beton Dökümü",
            unit: "m³",
            unitPrice: 2200,
            plannedQuantity: 500,
          },
        })
        boqItemId = newBoq.id
      }
    }

    const proof = await prisma.workProof.create({
      data: {
        contractId,
        subcontractorId,
        projectId,
        boqItemId,
        claimedQuantity: typeof body.claimedQuantity === "number" ? body.claimedQuantity : 1,
        title: title.trim(),
        description: description ? description.trim() : "",
        imageUrl,
        photoUrl: imageUrl,
        bimElementId: body.bimElementId || null,
        gpsLatitude: body.latitude || null,
        gpsLongitude: body.longitude || null,
        status: "PENDING",
      },
      include: {
        contract: {
          select: { id: true, title: true },
        },
        subcontractor: {
          select: { id: true, name: true },
        },
      },
    })

    return NextResponse.json({ success: true, proof }, { status: 201 })
  } catch (error) {
    console.error("Create proof error:", error)
    return NextResponse.json({ error: "Kanıt oluşturulurken hata oluştu" }, { status: 500 })
  }
}
