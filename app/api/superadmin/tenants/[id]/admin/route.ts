/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Superadmin Tenant Admin Credential Management API (/api/superadmin/tenants/[id]/admin)
 */

import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import bcrypt from "bcryptjs"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    const role = (session?.user as any)?.role
    if (role !== "SUPER_ADMIN" && role !== "ADMIN") {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 403 })
    }

    const { id: tenantId } = await params

    if (!tenantId) {
      return NextResponse.json({ error: "Tenant ID zorunludur" }, { status: 400 })
    }

    // Tenant var mı kontrol et
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { id: true, name: true, type: true }
    })

    if (!tenant) {
      return NextResponse.json({ error: "Firma bulunamadı" }, { status: 404 })
    }

    // Bu tenantId'ye bağlı ve role === 'ADMIN' (veya INSPECTION_ADMIN) olan ilk kullanıcıyı bul
    let adminUser = await prisma.user.findFirst({
      where: {
        tenantId,
        role: { in: ["ADMIN", "INSPECTION_ADMIN", "PROJECT_MANAGER"] }
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true
      },
      orderBy: { createdAt: "asc" }
    })

    // Eğer ADMIN rolünde bulunamazsa firmanın ilk kullanıcısına bak
    if (!adminUser) {
      adminUser = await prisma.user.findFirst({
        where: { tenantId },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          createdAt: true,
          updatedAt: true
        },
        orderBy: { createdAt: "asc" }
      })
    }

    return NextResponse.json({
      success: true,
      tenant: { id: tenant.id, name: tenant.name },
      admin: adminUser || null
    })
  } catch (error: any) {
    console.error("GET Tenant Admin Error:", error)
    return NextResponse.json(
      { error: error?.message || "Yönetici bilgileri alınırken hata oluştu" },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    const role = (session?.user as any)?.role
    if (role !== "SUPER_ADMIN" && role !== "ADMIN") {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 403 })
    }

    const { id: tenantId } = await params
    const body = await request.json()
    const { newEmail, newPassword, newName } = body

    if (!tenantId) {
      return NextResponse.json({ error: "Tenant ID zorunludur" }, { status: 400 })
    }

    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { id: true, name: true, type: true }
    })

    if (!tenant) {
      return NextResponse.json({ error: "Firma bulunamadı" }, { status: 404 })
    }

    // İlgili tenant admin kullanıcısını bul
    let adminUser = await prisma.user.findFirst({
      where: {
        tenantId,
        role: { in: ["ADMIN", "INSPECTION_ADMIN", "PROJECT_MANAGER"] }
      },
      orderBy: { createdAt: "asc" }
    })

    if (!adminUser) {
      adminUser = await prisma.user.findFirst({
        where: { tenantId },
        orderBy: { createdAt: "asc" }
      })
    }

    // Eğer bu firmada henüz kullanıcı yoksa, yeni bir admin kullanıcısı oluştur
    if (!adminUser) {
      if (!newEmail || !newPassword) {
        return NextResponse.json(
          { error: "Bu firmada henüz bir yönetici hesabı yok. Lütfen e-posta ve şifre giriniz." },
          { status: 400 }
        )
      }

      const existingUser = await prisma.user.findUnique({
        where: { email: newEmail.trim().toLowerCase() }
      })
      if (existingUser) {
        return NextResponse.json(
          { error: "Bu e-posta adresi sistemde başka bir kullanıcı tarafından kullanılıyor." },
          { status: 400 }
        )
      }

      const hashedPassword = await bcrypt.hash(newPassword.trim(), 10)
      const defaultRole = tenant.type === "INSPECTION" ? "INSPECTION_ADMIN" : "ADMIN"

      const createdUser = await prisma.user.create({
        data: {
          name: newName?.trim() || `${tenant.name} Yöneticisi`,
          email: newEmail.trim().toLowerCase(),
          password: hashedPassword,
          role: defaultRole,
          tenantId
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          createdAt: true
        }
      })

      return NextResponse.json({
        success: true,
        message: "Firmanın ilk yönetici hesabı başarıyla oluşturuldu.",
        admin: createdUser
      })
    }

    const updateData: any = {}

    // E-posta güncelleme
    if (newEmail && newEmail.trim() !== adminUser.email) {
      const cleanEmail = newEmail.trim().toLowerCase()
      const existingEmailUser = await prisma.user.findFirst({
        where: {
          email: cleanEmail,
          id: { not: adminUser.id }
        }
      })

      if (existingEmailUser) {
        return NextResponse.json(
          { error: "Bu e-posta adresi başka bir kullanıcı tarafından kullanılmaktadır." },
          { status: 400 }
        )
      }

      updateData.email = cleanEmail
    }

    // Şifre güncelleme (bcrypt ile hashle)
    if (newPassword && newPassword.trim().length > 0) {
      if (newPassword.trim().length < 6) {
        return NextResponse.json(
          { error: "Yeni şifre en az 6 karakter olmalıdır." },
          { status: 400 }
        )
      }
      updateData.password = await bcrypt.hash(newPassword.trim(), 10)
    }

    // İsim güncelleme (opsiyonel)
    if (newName && newName.trim().length > 0) {
      updateData.name = newName.trim()
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({
        success: true,
        message: "Herhangi bir değişiklik belirtilmedi.",
        admin: {
          id: adminUser.id,
          name: adminUser.name,
          email: adminUser.email,
          role: adminUser.role
        }
      })
    }

    const updatedAdmin = await prisma.user.update({
      where: { id: adminUser.id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        updatedAt: true
      }
    })

    return NextResponse.json({
      success: true,
      message: "Yönetici giriş bilgileri başarıyla güncellendi.",
      admin: updatedAdmin
    })
  } catch (error: any) {
    console.error("PATCH Tenant Admin Error:", error)
    return NextResponse.json(
      { error: error?.message || "Yönetici bilgileri güncellenirken hata oluştu" },
      { status: 500 }
    )
  }
}
