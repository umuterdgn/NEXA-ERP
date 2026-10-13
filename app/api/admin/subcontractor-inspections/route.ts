/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Admin Subcontractor Inspections API (Proof of Work Verification)
 */

import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")
    const projectId = searchParams.get("projectId")
    const search = searchParams.get("search")

    const where: any = {}

    if (status && (status === "PENDING" || status === "APPROVED" || status === "REJECTED")) {
      where.status = status
    }

    if (projectId) {
      where.contract = {
        projectId: projectId
      }
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        { subcontractor: { name: { contains: search, mode: "insensitive" } } },
        { contract: { title: { contains: search, mode: "insensitive" } } }
      ]
    }

    const proofs = await prisma.workProof.findMany({
      where,
      include: {
        contract: {
          select: {
            id: true,
            title: true,
            totalAmount: true,
            projectId: true,
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

    const stats = {
      total: await prisma.workProof.count(),
      pending: await prisma.workProof.count({ where: { status: "PENDING" } }),
      approved: await prisma.workProof.count({ where: { status: "APPROVED" } }),
      rejected: await prisma.workProof.count({ where: { status: "REJECTED" } })
    }

    return NextResponse.json({ proofs, stats })
  } catch (error) {
    console.error("Fetch inspections error:", error)
    return NextResponse.json(
      { error: "Taşeron kanıtları yüklenirken hata oluştu" },
      { status: 500 }
    )
  }
}
