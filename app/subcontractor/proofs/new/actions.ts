/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Subcontractor Proof of Work Server Actions
 */

"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { writeFile, mkdir } from "fs/promises"
import { existsSync } from "fs"
import path from "path"

export async function getSubcontractorContracts() {
  try {
    const contracts = await prisma.contract.findMany({
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
    return { success: true, contracts }
  } catch (error) {
    console.error("Get contracts error:", error)
    return { success: false, contracts: [] }
  }
}

export async function submitProofAction(formData: FormData) {
  try {
    const contractId = formData.get("contractId") as string
    const title = formData.get("title") as string
    const description = (formData.get("description") as string) || ""
    const file = formData.get("photo") as File | null
    let imageUrl = (formData.get("imageUrl") as string) || ""

    if (!contractId) {
      return { success: false, error: "Lütfen ilgili sözleşmeyi seçiniz." }
    }
    if (!title || !title.trim()) {
      return { success: false, error: "İş başlığı zorunludur." }
    }

    // Find the contract to get subcontractorId
    const contract = await prisma.contract.findUnique({
      where: { id: contractId }
    })

    if (!contract) {
      return { success: false, error: "Seçilen sözleşme bulunamadı." }
    }

    // If a file was uploaded directly in formData, save it
    if (file && file.size > 0) {
      try {
        const bytes = await file.arrayBuffer()
        const buffer = Buffer.from(bytes)

        // Local public/uploads save
        const uploadsDir = path.join(process.cwd(), "public", "uploads")
        if (!existsSync(uploadsDir)) {
          await mkdir(uploadsDir, { recursive: true })
        }

        const safeFilename = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`
        const filepath = path.join(uploadsDir, safeFilename)
        await writeFile(filepath, buffer)

        imageUrl = `/uploads/${safeFilename}`
      } catch (fileErr) {
        console.error("File save error:", fileErr)
        // If image URL is not provided, return error
        if (!imageUrl) {
          return { success: false, error: "Fotoğraf kaydedilirken hata oluştu." }
        }
      }
    }

    if (!imageUrl) {
      return { success: false, error: "Lütfen yapılan işe ait bir kanıt fotoğrafı yükleyiniz." }
    }

    // Create WorkProof in DB
    const proof = await prisma.workProof.create({
      data: {
        contractId,
        subcontractorId: contract.subcontractorId,
        title: title.trim(),
        description: description.trim() || null,
        imageUrl,
        status: "PENDING"
      }
    })

    revalidatePath("/subcontractor/proofs/new")
    revalidatePath("/admin/subcontractor-inspections")

    return { success: true, proofId: proof.id }
  } catch (error: any) {
    console.error("Submit proof error:", error)
    return { success: false, error: error?.message || "İş kanıtı gönderilirken hata oluştu." }
  }
}
