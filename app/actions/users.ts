/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Kullanıcı Yönetimi & Şifreleme Server Actions (User Management)
 */

"use server"

import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import bcrypt from "bcryptjs"
import { revalidatePath } from "next/cache"

export interface CreateUserInput {
  firstName: string
  lastName: string
  email: string
  password: string
  role: string
}

export async function createUser(input: CreateUserInput | FormData) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: "Yetkisiz işlem: Oturum açmanız gerekmektedir." }
    }

    const currentRole = session.user.role as string
    if (currentRole !== "ADMIN" && currentRole !== "SUPER_ADMIN") {
      return {
        success: false,
        error: "Yetkisiz işlem: Sadece ADMIN ve SUPER_ADMIN kullanıcı oluşturabilir.",
      }
    }

    // Parse input from FormData or JSON object
    let firstName = ""
    let lastName = ""
    let email = ""
    let password = ""
    let role = "STAFF"

    if (input instanceof FormData) {
      firstName = (input.get("firstName") as string) || ""
      lastName = (input.get("lastName") as string) || ""
      email = (input.get("email") as string) || ""
      password = (input.get("password") as string) || ""
      role = (input.get("role") as string) || "STAFF"
    } else {
      firstName = input.firstName || ""
      lastName = input.lastName || ""
      email = input.email || ""
      password = input.password || ""
      role = input.role || "STAFF"
    }

    // Validations
    if (!firstName.trim() || !lastName.trim()) {
      return { success: false, error: "Ad ve Soyad alanları zorunludur." }
    }
    if (!email.trim() || !email.includes("@")) {
      return { success: false, error: "Geçerli bir e-posta adresi giriniz." }
    }
    if (!password || password.length < 6) {
      return { success: false, error: "Şifre en az 6 karakter olmalıdır." }
    }

    // Check if user already exists
    const normalizedEmail = email.toLowerCase().trim()
    const existing = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    })

    if (existing) {
      return { success: false, error: `"${normalizedEmail}" e-posta adresi zaten kullanımda.` }
    }

    // Fetch the creating Admin to inherit their companyId & tenantId
    const adminUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, companyId: true, tenantId: true },
    })

    // Hash password with bcryptjs
    const hashedPassword = await bcrypt.hash(password, 10)

    const fullName = `${firstName.trim()} ${lastName.trim()}`

    // Create new user in the database
    const newUser = await prisma.user.create({
      data: {
        name: fullName,
        email: normalizedEmail,
        password: hashedPassword,
        role: role as any,
        companyId: adminUser?.companyId || null,
        tenantId: adminUser?.tenantId || null,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        companyId: true,
        createdAt: true,
      },
    })

    try {
      revalidatePath("/admin/users")
    } catch {
      // Non-request context resilience (e.g. tests)
    }

    return {
      success: true,
      user: newUser,
      message: `${fullName} kullanıcısı (${role}) başarıyla oluşturuldu.`,
    }
  } catch (error: any) {
    console.error("❌ createUser error:", error)
    return { success: false, error: error.message || "Kullanıcı oluşturulurken bir hata oluştu." }
  }
}

export async function getUsers() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: "Yetkisiz erişim", users: [] }
    }

    const currentRole = session.user.role as string
    if (currentRole !== "ADMIN" && currentRole !== "SUPER_ADMIN") {
      return { success: false, error: "Yetkisiz erişim", users: [] }
    }

    const adminUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { companyId: true, tenantId: true },
    })

    const whereClause: any = {}
    // If not super admin, filter by tenantId
    if (currentRole !== "SUPER_ADMIN") {
      const tenantId = (session.user as any)?.tenantId || adminUser?.tenantId
      whereClause.tenantId = tenantId || "non-existent"
    }

    const users = await prisma.user.findMany({
      where: whereClause,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        companyId: true,
        company: {
          select: { id: true, name: true },
        },
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    })

    return { success: true, users }
  } catch (error: any) {
    console.error("❌ getUsers error:", error)
    return { success: false, error: error.message || "Kullanıcılar alınamadı", users: [] }
  }
}

export async function deleteUser(userId: string) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: "Yetkisiz işlem." }
    }

    const currentRole = session.user.role as string
    if (currentRole !== "ADMIN" && currentRole !== "SUPER_ADMIN") {
      return { success: false, error: "Sadece ADMIN yetkisine sahip kullanıcılar silebilir." }
    }

    if (userId === session.user.id) {
      return { success: false, error: "Kendi hesabınızı silemezsiniz." }
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, tenantId: true },
    })

    if (!targetUser) {
      return { success: false, error: "Kullanıcı bulunamadı." }
    }

    const sessionTenantId = (session.user as any)?.tenantId
    if (currentRole !== "SUPER_ADMIN" && targetUser.tenantId !== sessionTenantId) {
      return { success: false, error: "Yetkisiz işlem: Bu kullanıcı farklı bir kiracıya ait." }
    }

    await prisma.user.delete({
      where: { id: userId },
    })

    try {
      revalidatePath("/admin/users")
    } catch {
      // Non-request context resilience
    }

    return { success: true, message: "Kullanıcı başarıyla silindi." }
  } catch (error: any) {
    console.error("❌ deleteUser error:", error)
    return { success: false, error: error.message || "Kullanıcı silinemedi." }
  }
}
