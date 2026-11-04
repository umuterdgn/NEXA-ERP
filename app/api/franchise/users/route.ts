/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Franchise Kullanıcı & Personel Oluşturma API Endpoint (bcrypt Şifreleme)
 */

import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 })
    }

    const tenantId = (session.user as any)?.tenantId

    const users = await prisma.user.findMany({
      where: tenantId ? { tenantId } : {},
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        companyType: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json({ success: true, users })
  } catch (error: any) {
    console.error("[Franchise Users GET Error]:", error)
    return NextResponse.json(
      { error: error?.message || "Kullanıcılar alınırken hata oluştu" },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 })
    }

    const tenantId = (session.user as any)?.tenantId
    const body = await request.json()

    const {
      name,
      email,
      password,
      role = "STAFF",
      companyType = "FRANCHISE",
      phone,
    } = body

    // 1. Zorunlu Alan Kontrolleri
    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: "Kullanıcı Adı Soyadı zorunludur" },
        { status: 400 }
      )
    }

    if (!email || !email.trim() || !email.includes("@")) {
      return NextResponse.json(
        { error: "Geçerli bir e-posta adresi zorunludur" },
        { status: 400 }
      )
    }

    // 2. Şifre Alanı ZORUNLU (Required) ve en az 6 karakter kontrolü
    if (!password || password.trim().length < 6) {
      return NextResponse.json(
        { error: "Giriş şifresi zorunludur ve en az 6 karakter olmalıdır." },
        { status: 400 }
      )
    }

    const normalizedEmail = email.toLowerCase().trim()

    // 3. E-posta Tekillik Kontrolü
    const existing = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    })

    if (existing) {
      return NextResponse.json(
        { error: `"${normalizedEmail}" e-posta adresi zaten kullanımda.` },
        { status: 409 }
      )
    }

    // 4. bcrypt ile güvenli şifre hash'leme (10 salt round)
    const hashedPassword = await bcrypt.hash(password.trim(), 10)

    // 5. Veritabanına Kullanıcıyı Ekle
    const newUser = await prisma.user.create({
      data: {
        name: name.trim(),
        email: normalizedEmail,
        password: hashedPassword,
        role: role as any,
        companyType: companyType || "FRANCHISE",
        tenantId: tenantId || "nexa-franchise",
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        companyType: true,
        createdAt: true,
      },
    })

    console.log(
      `[Franchise User Created] 👤 ${newUser.name} (${newUser.email}) - Rol: ${newUser.role} - Mobil Giriş Aktif`
    )

    return NextResponse.json({
      success: true,
      message: "Kullanıcı başarıyla oluşturuldu. Mobil ve web erişim şifresi aktif.",
      user: newUser,
    })
  } catch (error: any) {
    console.error("[Franchise Users POST Error]:", error)
    return NextResponse.json(
      { error: error?.message || "Kullanıcı oluşturulurken bir hata oluştu" },
      { status: 500 }
    )
  }
}

