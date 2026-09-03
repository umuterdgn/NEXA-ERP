/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * This code is the property of NXA Software.
 */

import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { logAction } from "@/lib/logger"

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    const session = await auth()
    const userRole = session?.user?.role as string
    const userId = session?.user?.id

    // Only contractors can upload proofs
    if (userRole !== "SUBCONTRACTOR" && userRole !== "MUTEAHHIT_MUSTERI") {
      return NextResponse.json(
        { error: "Bu işlem için yetkiniz yok" },
        { status: 403 }
      )
    }

    const formData = await request.formData()
    const proof = formData.get('proof') as File
    const deficiencyId = formData.get('deficiencyId') as string

    if (!proof || !deficiencyId) {
      return NextResponse.json(
        { error: "Dosya ve eksiklik ID gereklidir" },
        { status: 400 }
      )
    }

    // Get the deficiency to check if it belongs to the contractor's projects
    const deficiency = await prisma.deficiency.findUnique({
      where: { id: deficiencyId },
      include: {
        project: true
      }
    })

    if (!deficiency) {
      return NextResponse.json(
        { error: "Eksiklik bulunamadı" },
        { status: 404 }
      )
    }

    // Check if the deficiency belongs to the contractor's managed projects
    const userProjects = await prisma.project.findMany({
      where: { managerId: userId },
      select: { id: true }
    })

    const userProjectIds = userProjects.map(p => p.id)
    if (!deficiency.projectId || !userProjectIds.includes(deficiency.projectId)) {
      return NextResponse.json(
        { error: "Bu eksiklik size atanmamış" },
        { status: 403 }
      )
    }

    // Check if deficiency is in a state that allows proof upload
    if (deficiency.status !== 'OPEN' && deficiency.status !== 'FIX_PENDING') {
      return NextResponse.json(
        { error: "Bu eksiklik için kanıt yüklenemez" },
        { status: 400 }
      )
    }

    // Mock file upload - in production, upload to Cloudinary or similar
    // For now, we'll use a mock URL
    const mockProofUrl = `https://mock-storage.example.com/proofs/${deficiencyId}-${Date.now()}.${proof.name.split('.').pop()}`

    // Update deficiency with proof URL and change status to VERIFY_PENDING
    // CRITICAL: Contractors CANNOT close deficiencies - only set to VERIFY_PENDING
    const updatedDeficiency = await prisma.deficiency.update({
      where: { id: deficiencyId },
      data: {
        photoUrl: mockProofUrl,
        status: 'VERIFY_PENDING' // Only this status, NOT CLOSED
      }
    })

    // Log the action in AuditLog
    await logAction(
      "PROOF_UPLOADED",
      `Müteahhit ${deficiency.project?.name} için düzeltme kanıtı yükledi ve onay talep etti`,
      userId || "Unknown"
    )

    return NextResponse.json({
      success: true,
      deficiency: updatedDeficiency
    })

  } catch (error) {
    console.error("Error uploading proof:", error)
    return NextResponse.json(
      { error: "Kanıt yüklenirken hata oluştu" },
      { status: 500 }
    )
  }
}
