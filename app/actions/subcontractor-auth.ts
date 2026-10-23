"use server"
/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Server Action for granting login credentials to Subcontractors
 */

import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { revalidatePath } from "next/cache"

export async function grantSubcontractorAccessAction(formData: {
  subcontractorId: string
  name: string
  email: string
  password: string
}) {
  try {
    const { subcontractorId, name, email, password } = formData

    if (!email || !password || !subcontractorId) {
      return { success: false, error: "Lütfen taşeron seçimi, e-posta ve şifre alanlarını eksiksiz doldurunuz." }
    }

    if (password.length < 6) {
      return { success: false, error: "Şifre en az 6 karakter olmalıdır." }
    }

    const cleanEmail = email.trim().toLowerCase()

    // 1. Taşeron ve Firma Kaydını Çözümle
    let targetCompany = await prisma.company.findUnique({
      where: { id: subcontractorId }
    })

    if (!targetCompany) {
      const subRecord = await prisma.subcontractor.findUnique({
        where: { id: subcontractorId }
      })

      if (subRecord) {
        targetCompany = await prisma.company.findFirst({
          where: { name: subRecord.name }
        })

        if (!targetCompany) {
          targetCompany = await prisma.company.create({
            data: {
              name: subRecord.name,
              type: "SUBCONTRACTOR",
            }
          })
        }
      }
    }

    const companyId = targetCompany?.id || subcontractorId
    const companyName = targetCompany?.name || name || "Taşeron Firması"

    // 2. Şifreyi bcrypt ile hashle
    const hashedPassword = await bcrypt.hash(password, 10)

    // 3. User Tablosunda Hesabı Oluştur veya Güncelle
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
          role: "SUBCONTRACTOR",
          companyId: companyId,
          companyType: "SUBCONTRACTOR",
          permissions: ["subcontractor_portal", "proof_upload", "billing_view", "task_view"],
        }
      })
    } else {
      user = await prisma.user.create({
        data: {
          name: name.trim() || companyName,
          email: cleanEmail,
          password: hashedPassword,
          role: "SUBCONTRACTOR",
          companyId: companyId,
          companyType: "SUBCONTRACTOR",
          permissions: ["subcontractor_portal", "proof_upload", "billing_view", "task_view"],
        }
      })
    }

    // 4. Personel Tablosu ile Entegrasyon (Billing ve İş Kanıtı İlişkisi İçin)
    const existingPersonel = await prisma.personel.findFirst({
      where: { userId: user.id }
    })

    if (existingPersonel) {
      await prisma.personel.update({
        where: { id: existingPersonel.id },
        data: {
          companyId: companyId,
          name: user.name,
          username: cleanEmail,
        }
      })
    } else {
      const count = await prisma.personel.count()
      const pNo = `SUB-${String(count + 1).padStart(3, "0")}`
      await prisma.personel.create({
        data: {
          personnelNo: pNo,
          name: user.name,
          userId: user.id,
          companyId: companyId,
          department: "Taşeron",
          position: "Taşeron Yetkilisi",
          username: cleanEmail,
          age: 35,
          birthDate: new Date("1990-01-01"),
          hireDate: new Date(),
          currentSite: "Taşeron Ofisi",
          role: "SUBCONTRACTOR",
        }
      })
    }

    revalidatePath("/admin/subcontractors/contracts")
    revalidatePath("/admin/users")

    return {
      success: true,
      message: `"${user.name}" (${user.email}) için Taşeron Giriş Hesabı oluşturuldu ve yetkilendirildi.`,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      }
    }
  } catch (error: any) {
    console.error("grantSubcontractorAccessAction error:", error)
    return {
      success: false,
      error: error?.message || "Taşeron giriş yetkisi verilirken bir veritabanı hatası oluştu."
    }
  }
}
