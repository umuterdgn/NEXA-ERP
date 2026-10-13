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

    const proof = await prisma.workProof.create({
      data: {
        contractId,
        subcontractorId,
        title: title.trim(),
        description: description ? description.trim() : null,
        imageUrl,
        status: "PENDING"
      },
      include: {
        contract: {
          select: { id: true, title: true }
        },
        subcontractor: {
          select: { id: true, name: true }
        }
      }
    })

    return NextResponse.json({ success: true, proof }, { status: 201 })
  } catch (error) {
    console.error("Create proof error:", error)
    return NextResponse.json({ error: "Kanıt oluşturulurken hata oluştu" }, { status: 500 })
  }
}
