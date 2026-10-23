"use server"
/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Server Action for granting login credentials to Personnel, Site Managers & Inspectors
 */

import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { revalidatePath } from "next/cache"
import type { UserRole } from "@prisma/client"

export async function grantPersonnelAccessAction(formData: {
  personelId?: string
  name: string
  email: string
  password: string
  role: UserRole
}) {
  try {
    const { personelId, name, email, password, role } = formData

    if (!email || !password) {
      return { success: false, error: "E-posta/Kullanıcı adı ve şifre zorunludur." }
    }

    if (password.length < 6) {
      return { success: false, error: "Şifre en az 6 karakter olmalıdır." }
    }

    const cleanEmail = email.trim().toLowerCase()
    const hashedPassword = await bcrypt.hash(password, 10)

    // 1. User Tablosunda Hesabı Bul veya Oluştur
    const existingUser = await prisma.user.findUnique({
      where: { email: cleanEmail }
    })

    let user
    if (existingUser) {
      user = await prisma.user.update({
        where: { id: existingUser.id },
        data: {
          name: name.trim() || existingUser.name,
          password: hashedPassword,
          role: role || "STAFF",
        }
      })
    } else {
      user = await prisma.user.create({
        data: {
          name: name.trim() || "Personel",
          email: cleanEmail,
          password: hashedPassword,
          role: role || "STAFF",
          permissions: role === "SITE_MANAGER" ? ["site_management", "inspections", "work_orders", "reports"] : ["personnel_portal"],
        }
      })
    }

    // 2. Personel tablosuyla eşleştir
    if (personelId) {
      await prisma.personel.update({
        where: { id: personelId },
        data: {
          userId: user.id,
          username: cleanEmail,
          name: user.name,
        }
      })
    } else {
      const existingPersonel = await prisma.personel.findFirst({
        where: { userId: user.id }
      })
      if (!existingPersonel) {
        const count = await prisma.personel.count()
        const pNo = `P${String(count + 1).padStart(3, "0")}`
        await prisma.personel.create({
          data: {
            personnelNo: pNo,
            name: user.name,
            userId: user.id,
            username: cleanEmail,
            age: 30,
            birthDate: new Date("1995-01-01"),
            hireDate: new Date(),
            currentSite: "Merkez Şantiye",
            department: role === "SITE_MANAGER" ? "Şantiye Yönetimi" : "Saha",
            position: role === "SITE_MANAGER" ? "Şantiye Şefi" : "Personel",
            role: role || "STAFF",
          }
        })
      }
    }

    revalidatePath("/admin/personel")
    revalidatePath("/admin/users")

    return {
      success: true,
      message: `"${user.name}" (${user.role}) için sisteme giriş hesabı başarıyla tanımlandı.`,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      }
    }
  } catch (error: any) {
    console.error("grantPersonnelAccessAction error:", error)
    return {
      success: false,
      error: error?.message || "Giriş yetkisi oluşturulurken bir hata oluştu."
    }
  }
}
