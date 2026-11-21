/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * GET /api/mobile/routes
 * Şoför, Denetçi, Lab Teknisyeni ve Bölge Müdürleri İçin Canlı Güzergah Durakları (Sıfır Mock Koordinat)
 */

import { NextResponse } from "next/server"
import { getMobileAuth } from "@/lib/mobile-auth"
import { prisma } from "@/lib/prisma"
import { isBranchOrProjectScopedRole, requireAnyModule } from "@/lib/api-rbac"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  try {
    const auth = await getMobileAuth(request)
    if (!auth) {
      return NextResponse.json({ error: "Yetkisiz oturum." }, { status: 401 })
    }

    const denied = requireAnyModule(auth, ["route_optimization", "driver_deliveries"])
    if (denied) return denied

    const { role, tenantId, assignedProjectIds, name } = auth

    let stops: any[] = []

    if (role === "DRIVER") {
      const [schedules, appointments] = await Promise.all([
        prisma.logisticsSchedule.findMany({
          where: {
            ...(tenantId ? { tenantId } : {}),
            ...(assignedProjectIds.length > 0 ? { projectId: { in: assignedProjectIds } } : {}),
            OR: [
              ...(name ? [{ driverName: { contains: name, mode: "insensitive" as const } }] : []),
              { status: { in: ["PLANNED", "IN_TRANSIT"] as const } },
            ],
          },
          orderBy: { scheduledAt: "asc" },
          take: 15,
          include: {
            project: {
              select: {
                id: true,
                title: true,
                name: true,
                city: true,
                district: true,
                location: true,
                latitude: true,
                longitude: true,
              },
            },
          },
        }),
        prisma.logisticsAppointment.findMany({
          where: {
            ...(tenantId ? { tenantId } : {}),
            ...(assignedProjectIds.length > 0 ? { projectId: { in: assignedProjectIds } } : {}),
            status: { in: ["BEKLİYOR", "KAPIDA", "İÇERİDE", "SCHEDULED", "IN_TRANSIT"] },
            OR: [
              { driverUserId: auth.userId },
              ...(name ? [{ driverName: { contains: name, mode: "insensitive" as const } }] : []),
            ],
          },
          orderBy: { appointmentDate: "asc" },
          take: 10,
          include: {
            project: {
              select: {
                id: true,
                title: true,
                name: true,
                city: true,
                district: true,
                location: true,
                latitude: true,
                longitude: true,
              },
            },
          },
        }),
      ])

      const scheduleStops = schedules.map((s, idx) => ({
        id: s.id,
        stopId: s.id,
        projectId: s.projectId || null,
        recordModel: "LOGISTICS_SCHEDULE",
        order: idx + 1,
        title: s.project?.name || s.project?.title || s.title || `Sevkiyat Durağı #${idx + 1}`,
        description: `${s.type || "Malzeme Sevkiyatı"} - ${s.location || s.supplierName || "Şantiye"}`,
        plateNumber: s.vehiclePlate || null,
        status: s.status,
        lat: s.project?.latitude ?? null,
        lng: s.project?.longitude ?? null,
        address: [s.location, s.project?.district, s.project?.city].filter(Boolean).join(", "),
        eta: s.scheduledAt ? s.scheduledAt.toISOString() : null,
        stopType: "DELIVERY",
        type: "DELIVERY",
      }))

      const apptStops = appointments.map((a, idx) => ({
        id: a.id,
        stopId: a.id,
        projectId: a.projectId || null,
        recordModel: "LOGISTICS_APPOINTMENT",
        order: scheduleStops.length + idx + 1,
        title: a.project?.name || a.project?.title || a.title || `Randevu #${idx + 1}`,
        description: `${a.supplier || a.originName || "Sevkiyat"} • ${a.type || "DELIVERY"}`,
        plateNumber: a.plateNumber || null,
        status: a.status,
        lat: a.project?.latitude ?? a.originLat ?? null,
        lng: a.project?.longitude ?? a.originLng ?? null,
        address: [a.project?.location, a.project?.district, a.project?.city].filter(Boolean).join(", "),
        eta: a.appointmentDate ? a.appointmentDate.toISOString() : null,
        stopType: "DELIVERY",
        type: "DELIVERY",
      }))

      stops = [...scheduleStops, ...apptStops]
    } else if (role === "ADMIN" || role === "SUPER_ADMIN") {
      const [schedules, projects] = await Promise.all([
        prisma.logisticsSchedule.findMany({
          where: {
            ...(tenantId ? { tenantId } : {}),
            status: { in: ["PLANNED", "IN_TRANSIT"] },
          },
          orderBy: { scheduledAt: "asc" },
          take: 10,
          include: {
            project: {
              select: {
                id: true,
                title: true,
                name: true,
                city: true,
                district: true,
                location: true,
                latitude: true,
                longitude: true,
              },
            },
          },
        }),
        prisma.project.findMany({
          where: {
            deletedAt: null,
            ...(tenantId ? { tenantId } : {}),
            ...(assignedProjectIds.length > 0 ? { id: { in: assignedProjectIds } } : {}),
          },
          orderBy: { updatedAt: "desc" },
          take: 10,
          select: {
            id: true,
            title: true,
            name: true,
            city: true,
            district: true,
            location: true,
            latitude: true,
            longitude: true,
            status: true,
          },
        }),
      ])

      const schedStops = schedules.map((s, idx) => ({
        id: s.id,
        stopId: s.id,
        projectId: s.projectId || null,
        recordModel: "LOGISTICS_SCHEDULE",
        order: idx + 1,
        title: s.project?.name || s.project?.title || s.title,
        description: `${s.type || "Sevkiyat"} - ${s.location || "Şantiye"}`,
        plateNumber: s.vehiclePlate || null,
        status: s.status,
        lat: s.project?.latitude ?? null,
        lng: s.project?.longitude ?? null,
        address: [s.location, s.project?.district, s.project?.city].filter(Boolean).join(", "),
        eta: s.scheduledAt ? s.scheduledAt.toISOString() : null,
        stopType: "DELIVERY",
        type: "DELIVERY",
      }))

      const projStops = projects.map((p, idx) => ({
        id: p.id,
        stopId: p.id,
        projectId: p.id,
        recordModel: "PROJECT",
        order: schedStops.length + idx + 1,
        title: p.name || p.title,
        description: `Şantiye Durumu: ${p.status || "AKTİF"}`,
        plateNumber: null,
        status: p.status || "ACTIVE",
        lat: p.latitude ?? null,
        lng: p.longitude ?? null,
        address: [p.location, p.district, p.city].filter(Boolean).join(", "),
        eta: null,
        stopType: "INSPECTION",
        type: "INSPECTION",
      }))

      stops = [...schedStops, ...projStops]
    } else {
      // LAB_TECH, INSPECTOR, PROJECT_AUDITOR, AUDITOR, REGIONAL_MANAGER, FITOUT_TECH
      const projectWhere: any = {
        deletedAt: null,
        ...(tenantId ? { tenantId } : {}),
      }

      if (isBranchOrProjectScopedRole(role)) {
        projectWhere.id = { in: assignedProjectIds.length > 0 ? assignedProjectIds : ["__none__"] }
      } else if (assignedProjectIds.length > 0) {
        projectWhere.id = { in: assignedProjectIds }
      }

      const projects = await prisma.project.findMany({
        where: projectWhere,
        orderBy: { updatedAt: "desc" },
        take: 15,
        select: {
          id: true,
          title: true,
          name: true,
          city: true,
          district: true,
          location: true,
          latitude: true,
          longitude: true,
          buildingClass: true,
          yibfNo: true,
          status: true,
        },
      })

      const stopType =
        role === "LAB_TECH"
          ? "SAMPLE_PICKUP"
          : role === "REGIONAL_MANAGER" || role === "FITOUT_TECH"
          ? "BRANCH_AUDIT"
          : "INSPECTION"

      stops = projects.map((p, idx) => ({
        id: p.id,
        stopId: p.id,
        projectId: p.id,
        recordModel: "PROJECT",
        order: idx + 1,
        title: p.name || p.title,
        description:
          stopType === "SAMPLE_PICKUP"
            ? `Karot / Beton Numune Durağı${p.yibfNo ? ` • YİBF: ${p.yibfNo}` : ""}`
            : stopType === "BRANCH_AUDIT"
            ? `Şube / Kurulum Kontrol Durağı (${p.status || "AKTİF"})`
            : `YİBF: ${p.yibfNo || "-"} | Yapı Sınıfı: ${p.buildingClass || "-"}`,
        plateNumber: null,
        status: p.status || "SCHEDULED",
        lat: p.latitude ?? null,
        lng: p.longitude ?? null,
        address: [p.location, p.district, p.city].filter(Boolean).join(", "),
        eta: null,
        stopType,
        type: stopType,
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
