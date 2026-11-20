/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Mobil Personel Özlük, Zimmetli Ekipman, Menü ve Duyurular API
 */

import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getMobileAuth } from "@/lib/mobile-auth"
import { assertRecordTenantScope, requireAnyModule } from "@/lib/api-rbac"

export async function GET(request: Request) {
  try {
    const auth = await getMobileAuth(request)
    if (!auth) {
      return NextResponse.json({ error: "Yetkisiz oturum." }, { status: 401 })
    }

    const denied = requireAnyModule(auth, ["my_profile", "my_assigned_equipments", "my_announcements", "my_salary_advances"])
    if (denied) return denied

    const { userId, tenantId } = auth

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true, phone: true, role: true },
    })

    if (!user) {
      return NextResponse.json({ error: "Kullanıcı bulunamadı." }, { status: 404 })
    }

    const personel = await prisma.personel.findFirst({
      where: {
        OR: [
          { userId },
          ...(user.email ? [{ email: user.email }] : []),
        ],
      },
      include: {
        project: { select: { id: true, title: true } },
      },
    })

    // Zimmetli Ekipmanlar / KKD
    const assignedEquipments = await prisma.inventoryAssignment.findMany({
      where: {
        personelId: personel?.id || "__none__",
      },
      include: {
        inventory: {
          select: { id: true, name: true, category: true, qrCode: true },
        },
      },
    }).catch(() => [])

    // Bugünkü / Bu Haftaki Yemek Menüsü
    const startOfWeek = new Date()
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay() + 1)
    startOfWeek.setHours(0, 0, 0, 0)

    const foodMenus = await prisma.foodMenu.findMany({
      where: {
        date: { gte: startOfWeek },
        ...(tenantId ? { tenantId } : {}),
      },
      orderBy: { date: "asc" },
      take: 7,
    }).catch(() => [])

    // Kurumsal Duyurular
    const announcements = await prisma.announcement.findMany({
      where: {
        ...(tenantId ? { tenantId } : {}),
      },
      orderBy: { createdAt: "desc" },
      take: 5,
    }).catch(() => [])

    return NextResponse.json({
      success: true,
      profile: {
        name: user.name,
        email: user.email,
        phone: user.phone || personel?.phone,
        personnelNo: personel?.personnelNo || "P-001",
        tcNo: personel?.tcNo ? `${personel.tcNo.slice(0, 3)}*****${personel.tcNo.slice(-2)}` : null,
        department: personel?.department || "Saha",
        position: personel?.position || "Saha Personeli",
        project: personel?.project?.title || "Merkez",
        salary: personel?.salary || 0,
        salaryStatus: personel?.salaryStatus || "Güncel",
        hireDate: personel?.hireDate,
        iban: personel?.iban ? `${personel.iban.slice(0, 6)}...${personel.iban.slice(-4)}` : null,
      },
      assignedEquipments: assignedEquipments.map((a: any) => ({
        id: a.id,
        name: a.inventory?.name || "İş Güvenliği Ekipmanı",
        category: a.inventory?.category || "KKD",
        qrCode: a.inventory?.qrCode || "-",
        assignedAt: a.assignedAt || a.createdAt,
        status: a.status,
      })),
      foodMenus: foodMenus.map((f) => ({
        id: f.id,
        date: f.date,
        dayName: new Date(f.date).toLocaleDateString("tr-TR", { weekday: "long" }),
        items: f.items,
      })),
      announcements: announcements.map((a) => ({
        id: a.id,
        title: a.title,
        content: a.content,
        severity: a.severity,
        createdAt: a.createdAt,
      })),
    })
  } catch (error: any) {
    console.error("Mobile hr/self GET error:", error)
    return NextResponse.json({ error: "Özlük bilgileri getirilemedi." }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const auth = await getMobileAuth(request)
    if (!auth) {
      return NextResponse.json({ error: "Yetkisiz oturum." }, { status: 401 })
    }

    const denied = requireAnyModule(auth, ["my_assigned_equipments", "my_profile"])
    if (denied) return denied

    const body = await request.json().catch(() => ({}))
    const { assignmentId, signatureData } = body

    if (!assignmentId || !signatureData) {
      return NextResponse.json({ error: "Zimmet ID ve imza verisi zorunludur." }, { status: 400 })
    }

    const existing = await prisma.inventoryAssignment.findUnique({ where: { id: assignmentId } })
    if (!existing) {
      return NextResponse.json({ error: "Zimmet kaydı bulunamadı." }, { status: 404 })
    }
    const scopeErr = assertRecordTenantScope(auth, existing)
    if (scopeErr) return scopeErr

    const updated = await prisma.inventoryAssignment.update({
      where: { id: assignmentId },
      data: {
        notes: `Zimmet dijital olarak imzalandı. Teslimat Kanıtı: ${String(signatureData).slice(0, 100)}`,
        status: "ACTIVE",
      },
    })

    return NextResponse.json({
      success: true,
      message: "Zimmet teslim tutanağı dijital olarak onaylandı.",
      assignment: updated,
    })
  } catch (error: any) {
    console.error("Mobile hr/self POST error:", error)
    return NextResponse.json({ error: "Zimmet imzası kaydedilemedi." }, { status: 500 })
  }
}
