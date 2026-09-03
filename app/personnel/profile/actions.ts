/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * This code is the property of NXA Software.
 */

"use server"

import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import bcrypt from "bcryptjs"

// Server Action: İletişim bilgilerini güncelle
export async function updateContactInfo(formData: FormData) {
  const session = await auth()
  
  if (!session) {
    return { error: "Oturum bulunamadı" }
  }

  const personel = await prisma.personel.findFirst({
    where: { userId: session.user.id },
    select: { id: true }
  })

  if (!personel) {
    return { error: "Personel bulunamadı" }
  }

  const email = formData.get("email") as string
  const phone = formData.get("phone") as string

  // İletişim bilgilerini güncelle
  await prisma.personel.update({
    where: { id: personel.id },
    data: {
      email,
      phone
    }
  })

  revalidatePath("/personnel/profile")
  redirect("/personnel/profile")
}

// Server Action: Banka bilgilerini güncelle
export async function updateBankInfo(formData: FormData) {
  const session = await auth()
  
  if (!session) {
    return { error: "Oturum bulunamadı" }
  }

  const personel = await prisma.personel.findFirst({
    where: { userId: session.user.id },
    select: { id: true }
  })

  if (!personel) {
    return { error: "Personel bulunamadı" }
  }

  const bankName = formData.get("bankName") as string
  const iban = formData.get("iban") as string

  // Banka bilgilerini güncelle
  await prisma.personel.update({
    where: { id: personel.id },
    data: {
      bankName,
      iban
    }
  })

  revalidatePath("/personnel/profile")
  redirect("/personnel/profile")
}

// Server Action: Şifre değiştir
export async function changePassword(formData: FormData) {
  const session = await auth()
  
  if (!session) {
    return { error: "Oturum bulunamadı" }
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { password: true }
  })

  if (!user) {
    return { error: "Kullanıcı bulunamadı" }
  }

  const currentPassword = formData.get("currentPassword") as string
  const newPassword = formData.get("newPassword") as string
  const confirmPassword = formData.get("confirmPassword") as string

  // Mevcut şifreyi doğrula
  const isPasswordValid = await bcrypt.compare(currentPassword, user.password || "")
  if (!isPasswordValid) {
    return { error: "Mevcut şifre hatalı" }
  }

  // Yeni şifreleri kontrol et
  if (newPassword !== confirmPassword) {
    return { error: "Yeni şifreler eşleşmiyor" }
  }

  if (newPassword.length < 6) {
    return { error: "Şifre en az 6 karakter olmalı" }
  }

  // Yeni şifreyi hash'le ve güncelle
  const hashedPassword = await bcrypt.hash(newPassword, 10)
  await prisma.user.update({
    where: { id: session.user.id },
    data: { password: hashedPassword }
  })

  revalidatePath("/personnel/profile")
  redirect("/personnel/profile")
}

// Server Action: Acil durum bilgilerini güncelle
export async function updateEmergencyContact(formData: FormData) {
  const session = await auth()
  
  if (!session) {
    return { error: "Oturum bulunamadı" }
  }

  const personel = await prisma.personel.findFirst({
    where: { userId: session.user.id },
    select: { id: true }
  })

  if (!personel) {
    return { error: "Personel bulunamadı" }
  }

  const name = formData.get("name") as string
  const relation = formData.get("relation") as string
  const phone = formData.get("phone") as string

  // Acil durum bilgilerini güncelle
  await prisma.personel.update({
    where: { id: personel.id },
    data: {
      emergencyContactName: name,
      emergencyContactRelation: relation,
      emergencyContactPhone: phone
    }
  })

  revalidatePath("/personnel/profile")
  redirect("/personnel/profile")
}
