/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * GET /api/mobile/routes
 * Şoför, Denetçi ve Bölge Müdürleri İçin Günlük Optimize Rota / Durak Listesi
 */

import { NextResponse } from "next/server"
import { getMobileAuth } from "@/lib/mobile-auth"
import { prisma } from "@/lib/prisma"
import { requireAnyModule } from "@/lib/api-rbac"

export const runtime = "nodejs"

export async function GET(request: Request) {
  try {
    const auth = await getMobileAuth(request)
    if (!auth) {
      return NextResponse.json({ error: "Yetkisiz oturum." }, { status: 401 })
    }

    const denied = requireAnyModule(auth, [
      "route_optimization",
      "driver_deliveries",
      "inspections",
      "samples_core",
      "site_map",
      "dashboard",
    ])
    if (denied) return denied

    const { role, tenantId, assignedProjectIds, name } = auth

    let stops: any[] = []

    if (role === "DRIVER") {
      // Şoför sevkiyat durakları
      const schedules = await prisma.logisticsSchedule.findMany({
        where: {
          OR: [
            ...(name ? [{ driverName: { contains: name, mode: "insensitive" as const } }] : []),
            { status: { in: ["PLANNED", "IN_TRANSIT"] as const } },
          ],
          ...(tenantId ? { tenantId } : {}),
        },
        orderBy: { scheduledAt: "asc" },
        take: 10,
        include: {
          project: {
            select: { id: true, title: true, name: true, city: true, district: true, latitude: true, longitude: true },
          },
        },
      })

      stops = schedules.map((s, idx) => ({
        id: s.id,
        order: idx + 1,
        title: s.project?.name || s.project?.title || s.title || `Sevkiyat Noktası #${idx + 1}`,
        description: `${s.type || "Malzeme Sevkiyatı"} - ${s.location || "Şantiye"}`,
        plateNumber: s.vehiclePlate,
        status: s.status,
        lat: s.project?.latitude || 41.0082,
        lng: s.project?.longitude || 28.9784,
        address: `${s.project?.district || ""}, ${s.project?.city || "İstanbul"}`,
        eta: s.scheduledAt,
        type: "DELIVERY",
      }))
    } else if (role === "INSPECTOR" || role === "PROJECT_AUDITOR" || role === "LAB_TECH") {
      // Saha Denetçisi / Laboratuvar Numune Rotaları
      const projects = await prisma.project.findMany({
        where: {
          id: assignedProjectIds.length > 0 ? { in: assignedProjectIds } : undefined,
          deletedAt: null,
          ...(tenantId ? { tenantId } : {}),
        },
        take: 8,
        select: {
          id: true,
          title: true,
          name: true,
          city: true,
          district: true,
          latitude: true,
          longitude: true,
          buildingClass: true,
          yibfNo: true,
        },
      })

      stops = projects.map((p, idx) => ({
        id: p.id,
        order: idx + 1,
        title: p.name || p.title,
        description: `YİBF No: ${p.yibfNo || "Bekliyor"} | Yapı Sınıfı: ${p.buildingClass || "3B"}`,
        status: "SCHEDULED",
        lat: p.latitude || 41.0082 + idx * 0.01,
        lng: p.longitude || 28.9784 + idx * 0.01,
        address: `${p.district || ""}, ${p.city || ""}`,
        type: "INSPECTION",
      }))
    } else {
      // Genel Şantiye Durakları
      const projects = await prisma.project.findMany({
        where: {
          id: assignedProjectIds.length > 0 ? { in: assignedProjectIds } : undefined,
          deletedAt: null,
          ...(tenantId ? { tenantId } : {}),
        },
        take: 5,
        select: {
          id: true,
          title: true,
          name: true,
          city: true,
          district: true,
          latitude: true,
          longitude: true,
        },
      })

      stops = projects.map((p, idx) => ({
        id: p.id,
        order: idx + 1,
        title: p.name || p.title,
        description: `${p.district || ""}, ${p.city || ""}`,
        status: "ACTIVE",
        lat: p.latitude || 41.0082,
        lng: p.longitude || 28.9784,
        address: `${p.district || ""}, ${p.city || ""}`,
        type: "SITE",
      }))
    }

    return NextResponse.json({
      success: true,
      count: stops.length,
      stops,
    })
  } catch (error: any) {
    console.error("Mobile routes error:", error)
    return NextResponse.json({ error: "Rotalar alınamadı." }, { status: 500 })
  }
}
