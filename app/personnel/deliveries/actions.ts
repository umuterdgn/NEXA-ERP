/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Site Manager / Personnel Delivery Acceptance Actions
 */

"use server"

import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { revalidatePath } from "next/cache"
import { writeFile, mkdir } from "fs/promises"
import { existsSync } from "fs"
import path from "path"

export async function getPersonnelDeliveriesAction() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: "Oturum bulunamadı", deliveries: [] }
    }

    // Try finding assigned project for this user/personel if applicable
    const personel = await prisma.personel.findFirst({
      where: { userId: session.user.id },
      select: { currentSite: true }
    })

    // Fetch schedules
    const deliveries = await prisma.logisticsSchedule.findMany({
      include: {
        project: {
          select: { id: true, name: true, title: true }
        },
        receivedBy: {
          select: { id: true, name: true }
        }
      },
      orderBy: { scheduledAt: "asc" }
    })

    return { 
      success: true, 
      deliveries: deliveries.map(d => ({
        ...d,
        scheduledAt: d.scheduledAt.toISOString(),
        completedAt: d.completedAt ? d.completedAt.toISOString() : null,
        createdAt: d.createdAt.toISOString(),
        updatedAt: d.updatedAt.toISOString(),
      })),
      currentSite: personel?.currentSite || null
    }
  } catch (error) {
    console.error("Failed to load deliveries:", error)
    return { success: false, error: "Teslimatlar yüklenirken hata oluştu", deliveries: [] }
  }
}

export async function confirmDeliveryAction(id: string) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: "Lütfen önce oturum açınız." }
    }

    if (!id) {
      return { success: false, error: "Teslimat ID'si bulunamadı." }
    }

    const updated = await prisma.logisticsSchedule.update({
      where: { id },
      data: {
        status: "DELIVERED",
        completedAt: new Date(),
        receivedById: session.user.id
      }
    })

    revalidatePath("/personnel/deliveries")
    revalidatePath("/admin/communication/logistics")

    return { success: true, message: "Malzeme başarıyla teslim alındı olarak işaretlendi.", delivery: updated }
  } catch (error) {
    console.error("Confirm delivery error:", error)
    return { success: false, error: "Teslimat onaylanırken hata oluştu." }
  }
}

export async function reportDeliveryIssueAction(formData: FormData) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: "Lütfen önce oturum açınız." }
    }

    const id = formData.get("id") as string
    const deliveryNotes = formData.get("deliveryNotes") as string
    const file = formData.get("photo") as File | null
    let imageUrl = (formData.get("imageUrl") as string) || ""

    if (!id) {
      return { success: false, error: "Teslimat kaydı bulunamadı." }
    }

    if (!deliveryNotes || !deliveryNotes.trim()) {
      return { success: false, error: "Lütfen eksik veya hasarla ilgili bir tutanak/açıklama notu giriniz." }
    }

    // Save uploaded photo if provided as File
    if (file && file.size > 0) {
      try {
        const bytes = await file.arrayBuffer()
        const buffer = Buffer.from(bytes)

        const uploadsDir = path.join(process.cwd(), "public", "uploads")
        if (!existsSync(uploadsDir)) {
          await mkdir(uploadsDir, { recursive: true })
        }

        const safeFilename = `delivery-proof-${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`
        const filepath = path.join(uploadsDir, safeFilename)
        await writeFile(filepath, buffer)

        imageUrl = `/uploads/${safeFilename}`
      } catch (fileErr) {
        console.error("Error saving proof file:", fileErr)
        if (!imageUrl) {
          return { success: false, error: "Fotoğraf kaydedilemedi. Lütfen tekrar deneyiniz." }
        }
      }
    }

    const updated = await prisma.logisticsSchedule.update({
      where: { id },
      data: {
        status: "ISSUE_REPORTED",
        deliveryProofImageUrl: imageUrl || null,
        deliveryNotes: deliveryNotes.trim(),
        completedAt: new Date(),
        receivedById: session.user.id
      }
    })

    revalidatePath("/personnel/deliveries")
    revalidatePath("/admin/communication/logistics")

    return { 
      success: true, 
      message: "Sorun bildirimi ve kanıt fotoğrafı başarıyla kaydedildi.",
      delivery: updated 
    }
  } catch (error) {
    console.error("Report delivery issue error:", error)
    return { success: false, error: "Sorun bildirimi kaydedilirken hata oluştu." }
  }
}
