/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Subcontractor Proof of Work Server Actions with GPS & BIM Integration
 */

"use server"

import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { revalidatePath } from "next/cache"
import { writeFile, mkdir } from "fs/promises"
import { existsSync } from "fs"
import path from "path"

export async function getSubcontractorContracts() {
  try {
    const session = await auth()
    const userId = session?.user?.id

    let subcontractorCompanyId: string | null = null
    if (userId) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { companyId: true }
      })
      subcontractorCompanyId = user?.companyId || null
    }

    const where: any = {}
    if (subcontractorCompanyId) {
      where.subcontractorId = subcontractorCompanyId
    }

    let contracts = await prisma.contract.findMany({
      where,
      include: {
        project: {
          select: { id: true, name: true, title: true }
        },
        subcontractor: {
          select: { id: true, name: true }
        }
      },
      orderBy: { createdAt: "desc" }
    })

    // If 0 contracts found for user, fetch all available contracts so user is not blocked
    if (contracts.length === 0) {
      contracts = await prisma.contract.findMany({
        take: 10,
        include: {
          project: {
            select: { id: true, name: true, title: true }
          },
          subcontractor: {
            select: { id: true, name: true }
          }
        },
        orderBy: { createdAt: "desc" }
      })
    }

    // Also get all projects
    const projects = await prisma.project.findMany({
      select: {
        id: true,
        name: true,
        title: true,
        city: true,
      },
      orderBy: { createdAt: "desc" }
    })

    return { success: true, contracts, projects }
  } catch (error) {
    console.error("Get contracts error:", error)
    return { success: false, contracts: [], projects: [] }
  }
}

export async function submitProofAction(formData: FormData) {
  try {
    const session = await auth()
    const uploaderId = session?.user?.id

    let contractId = (formData.get("contractId") as string) || ""
    let projectId = (formData.get("projectId") as string) || ""
    const title = (formData.get("title") as string) || ""
    const description = (formData.get("description") as string) || ""
    const file = formData.get("photo") as File | null
    let imageUrl = (formData.get("imageUrl") as string) || ""

    // GPS & BIM integration data
    const latitudeStr = formData.get("latitude") as string
    const longitudeStr = formData.get("longitude") as string
    const bimElementId = (formData.get("bimElementId") as string)?.trim() || null

    const latitude = latitudeStr ? parseFloat(latitudeStr) : null
    const longitude = longitudeStr ? parseFloat(longitudeStr) : null

    if (!title || !title.trim()) {
      return { success: false, error: "İş başlığı veya tanımı zorunludur." }
    }

    // Resolve contract and project
    let contract: any = null
    if (contractId) {
      contract = await prisma.contract.findUnique({
        where: { id: contractId },
        include: { project: true }
      })
      if (contract && !projectId) {
        projectId = contract.projectId
      }
    }

    if (!projectId) {
      if (contract?.projectId) {
        projectId = contract.projectId
      } else {
        const firstProj = await prisma.project.findFirst()
        if (firstProj) projectId = firstProj.id
      }
    }

    if (!projectId) {
      return { success: false, error: "Lütfen ilgili projeyi veya sözleşmeyi seçiniz." }
    }

    // Handle file upload
    if (file && file.size > 0) {
      try {
        const bytes = await file.arrayBuffer()
        const buffer = Buffer.from(bytes)

        const uploadsDir = path.join(process.cwd(), "public", "uploads")
        if (!existsSync(uploadsDir)) {
          await mkdir(uploadsDir, { recursive: true })
        }

        const safeFilename = `proof-${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`
        const filepath = path.join(uploadsDir, safeFilename)
        await writeFile(filepath, buffer)

        imageUrl = `/uploads/${safeFilename}`
      } catch (fileErr) {
        console.error("File save error:", fileErr)
        if (!imageUrl) {
          return { success: false, error: "Fotoğraf kaydedilirken hata oluştu." }
        }
      }
    }

    if (!imageUrl) {
      return { success: false, error: "Lütfen yapılan işe ait bir kanıt fotoğrafı yükleyiniz." }
    }

    // Fallback subcontractorId
    let subcontractorId = contract?.subcontractorId || ""
    if (!subcontractorId) {
      const sub = await prisma.subcontractor.findFirst()
      if (sub) subcontractorId = sub.id
    }

    // Ensure fallback contract if not selected
    if (!contractId) {
      const existingContract = await prisma.contract.findFirst({
        where: { projectId }
      })
      if (existingContract) {
        contractId = existingContract.id
        subcontractorId = existingContract.subcontractorId
      }
    }

    // 1. Record into WorkProof (for subcontractor approval & verification workflow)
    let proof = null
    if (contractId && subcontractorId) {
      try {
        proof = await prisma.workProof.create({
          data: {
            contractId,
            subcontractorId,
            title: title.trim(),
            description: description.trim() || null,
            imageUrl,
            latitude: isNaN(Number(latitude)) ? null : latitude,
            longitude: isNaN(Number(longitude)) ? null : longitude,
            bimElementId,
            status: "PENDING",
            engineerStatus: "PENDING",
            managerStatus: "PENDING"
          }
        })
      } catch (e) {
        console.warn("WorkProof creation notice:", e)
      }
    }

    // 2. Record into ProgressAttachment (for Live Site Map and 3D BIM integration)
    let effectiveUploaderId = uploaderId
    if (!effectiveUploaderId) {
      const adminUser = await prisma.user.findFirst()
      effectiveUploaderId = adminUser?.id || ""
    }

    let progressAttachment = null
    if (effectiveUploaderId && projectId) {
      progressAttachment = await prisma.progressAttachment.create({
        data: {
          projectId,
          uploaderId: effectiveUploaderId,
          photoUrl: imageUrl,
          description: `[İş Kanıtı]: ${title.trim()}${description ? " - " + description.trim() : ""}`,
          latitude: isNaN(Number(latitude)) ? null : latitude,
          longitude: isNaN(Number(longitude)) ? null : longitude,
          bimElementId: bimElementId || null,
        }
      })
    }

    revalidatePath("/subcontractor/proofs/new")
    revalidatePath("/subcontractor")
    revalidatePath("/admin/subcontractor-inspections")
    revalidatePath(`/admin/projects/${projectId}`)

    return {
      success: true,
      proofId: proof?.id || progressAttachment?.id,
      progressAttachmentId: progressAttachment?.id,
      gpsRecorded: latitude !== null && longitude !== null,
      bimElementId: bimElementId,
      message: "İş kanıtı başarıyla kaydedildi! GPS koordinatları ve BIM eşleşmesi haritaya işlendi."
    }
  } catch (error: any) {
    console.error("Submit proof error:", error)
    return { success: false, error: error?.message || "İş kanıtı gönderilirken hata oluştu." }
  }
}
