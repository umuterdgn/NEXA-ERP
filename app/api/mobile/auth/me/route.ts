/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * GET /api/mobile/auth/me
 * Mobil Oturum Bilgisi ve Yetkileri Tazeleme
 */

import { NextResponse } from "next/server"
import { getMobileAuth } from "@/lib/mobile-auth"
import { prisma } from "@/lib/prisma"

export const runtime = "nodejs"

export async function GET(request: Request) {
  try {
    const auth = await getMobileAuth(request)
    if (!auth) {
      return NextResponse.json(
        { error: "Yetkisiz oturum. Lütfen yeniden giriş yapınız." },
        { status: 401 }
      )
    }

    const { user, tenant, role, assignedProjectIds, locationTrackingMode, allowedModules, mobileProfile } = auth

    const linkedPersonel = await prisma.personel.findFirst({
      where: { userId: user.id },
      include: { project: true },
    })

    const assignedProjects = await prisma.project.findMany({
      where: {
        id: { in: assignedProjectIds },
        deletedAt: null,
      },
      select: {
        id: true,
        title: true,
        name: true,
        city: true,
        district: true,
        status: true,
        latitude: true,
        longitude: true,
        gpsRadius: true,
      },
    })

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role,
        profileImage: user.profileImage || null,
        phone: user.phone || linkedPersonel?.phone || null,
        plateNumber: user.plateNumber || linkedPersonel?.plateNumber || null,
        personnelNo: linkedPersonel?.personnelNo || null,
        currentSite: linkedPersonel?.currentSite || null,
      },
      tenant,
      assignedProjects: assignedProjects.map((p) => ({
        id: p.id,
        name: p.name || p.title,
        city: p.city,
        district: p.district,
        status: p.status,
        latitude: p.latitude,
        longitude: p.longitude,
        radius: p.gpsRadius || 100,
      })),
      locationTrackingMode,
      allowedModules,
      mobileProfile,
    })
  } catch (error: any) {
    console.error("Mobile auth/me error:", error)
    return NextResponse.json({ error: "Oturum doğrulanamadı." }, { status: 500 })
  }
}

