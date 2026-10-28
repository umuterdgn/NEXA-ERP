/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Şantiye Haritası & BLE Canlı Radar - Server Component (100% Prisma DB)
 */

import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import AdminMapClient, { ProjectItem } from "./_components/AdminMapClient"
import type { 
  BleEquipment, 
  ActiveRadarPersonnel, 
  GeofenceZoneItem 
} from "@/components/map/BleEquipmentMap"

export const dynamic = "force-dynamic"

export default async function AdminMapPage() {
  const session = await auth()
  if (!session?.user) {
    redirect("/login")
  }

  const isSuperAdmin = session.user.role === "SUPER_ADMIN"
  const tenantId = (session.user as any)?.tenantId

  const tenantFilter = !isSuperAdmin
    ? tenantId ? { tenantId } : { tenantId: "non-existent" }
    : {}

  // ============================================================================
  // ADIM 2: SERVER-SIDE GERÇEK VERİ ÇEKME (WIRING)
  // ============================================================================

  // 1. Gerçek Sanal Çit (Poligon) Verileri (Prisma GeofenceZone)
  const dbGeofences = await prisma.geofenceZone.findMany({
    where: {
      ...tenantFilter,
      isActive: true
    },
    orderBy: { createdAt: "desc" }
  }).catch(() => [])

  // Geriye dönük uyumluluk: SiteZone poligonları
  const dbSiteZones = await prisma.siteZone.findMany({
    where: tenantFilter,
    orderBy: { createdAt: "desc" }
  }).catch(() => [])

  // 2. Gerçek BLE Radar (Canlı Konum) Verileri (Prisma Personel)
  const dbPersonnel = await prisma.personel.findMany({
    where: {
      ...tenantFilter,
      lastKnownLat: { not: null },
      lastKnownLng: { not: null }
    },
    select: {
      id: true,
      name: true,
      department: true,
      position: true,
      lastKnownLat: true,
      lastKnownLng: true,
      role: true
    }
  }).catch(() => [])

  const activeRadars: ActiveRadarPersonnel[] = dbPersonnel.map((p) => {
    const parts = (p.name || "").trim().split(" ")
    const firstName = parts.slice(0, -1).join(" ") || parts[0] || "Personel"
    const lastName = parts.length > 1 ? parts[parts.length - 1] : ""
    return {
      id: p.id,
      name: p.name,
      firstName,
      lastName,
      department: p.department || "Saha Personeli",
      position: p.position || String(p.role) || "İşçi",
      lastKnownLat: p.lastKnownLat,
      lastKnownLng: p.lastKnownLng,
      role: String(p.role)
    }
  })

  // 3. Projeler Listesi
  const dbProjects = await prisma.project.findMany({
    where: {
      ...tenantFilter,
      isActive: true
    },
    select: {
      id: true,
      name: true,
      title: true,
      city: true,
      district: true,
      latitude: true,
      longitude: true
    },
    orderBy: { updatedAt: "desc" }
  }).catch(() => [])

  const initialProjects: ProjectItem[] = dbProjects.map((p) => ({
    id: p.id,
    title: p.title || p.name,
    name: p.name || p.title,
    city: p.city,
    district: p.district,
    latitude: p.latitude,
    longitude: p.longitude
  }))

  // 4. Demirbaş / Ekipman Listesi
  const dbEquipments = await prisma.equipment.findMany({
    where: tenantFilter,
    include: {
      project: {
        select: {
          id: true,
          title: true,
          name: true,
          latitude: true,
          longitude: true
        }
      },
      assignedTo: {
        select: {
          id: true,
          name: true,
          department: true,
          phone: true
        }
      }
    },
    orderBy: { updatedAt: "desc" }
  }).catch(() => [])

  const initialEquipments: BleEquipment[] = []
  for (const eq of dbEquipments) {
    const rawStatus = (eq.status || "").toUpperCase()
    const isLost = rawStatus === "KAYIP" || rawStatus === "LOST" || rawStatus === "MAINTENANCE"
    const lat = eq.latitude ?? eq.lastLat
    const lng = eq.longitude ?? eq.lastLng

    if (lat != null && lng != null) {
      initialEquipments.push({
        id: eq.id,
        name: eq.name,
        type: eq.type,
        category: eq.category || "Genel Ekipman",
        status: isLost ? "KAYIP" : "AKTIF",
        rawStatus: eq.status,
        serialNumber: eq.serialNumber || undefined,
        bleTagId: eq.bleTagId || eq.serialNumber || "BLE-N/A",
        latitude: lat,
        longitude: lng,
        lastSeenAt: eq.lastSeenAt ? eq.lastSeenAt.toISOString() : eq.updatedAt.toISOString(),
        projectId: eq.projectId,
        project: eq.project ? {
          id: eq.project.id,
          title: eq.project.title || eq.project.name || "Şantiye",
          name: eq.project.name || eq.project.title || "Şantiye",
          latitude: eq.project.latitude,
          longitude: eq.project.longitude
        } : null,
        assignedTo: eq.assignedTo ? {
          id: eq.assignedTo.id,
          name: eq.assignedTo.name,
          department: eq.assignedTo.department || undefined,
          phone: eq.assignedTo.phone || undefined
        } : null
      })
    }
  }

  // ============================================================================
  // ADIM 3: HARİTA MERKEZİ VE BOŞ DURUM YÖNETİMİ
  // ============================================================================
  // Default: İskenderun / Türkiye merkezi
  let defaultCenter: [number, number] = [36.5872, 36.1735]
  let defaultZoom = 13

  const projectWithCoords = initialProjects.find((p) => p.latitude && p.longitude)
  if (projectWithCoords && projectWithCoords.latitude && projectWithCoords.longitude) {
    defaultCenter = [projectWithCoords.latitude, projectWithCoords.longitude]
    defaultZoom = 16
  } else if (activeRadars.length > 0 && activeRadars[0].lastKnownLat && activeRadars[0].lastKnownLng) {
    defaultCenter = [activeRadars[0].lastKnownLat, activeRadars[0].lastKnownLng]
    defaultZoom = 16
  } else {
    const firstProjectWithCity = initialProjects.find((p) => p.city)
    if (firstProjectWithCity?.city) {
      const cityLower = firstProjectWithCity.city.toLowerCase()
      if (cityLower.includes("istanbul") || cityLower.includes("i̇stanbul")) {
        defaultCenter = [41.0082, 28.9784]
      } else if (cityLower.includes("ankara")) {
        defaultCenter = [39.9334, 32.8597]
      } else if (cityLower.includes("izmir") || cityLower.includes("i̇zmir")) {
        defaultCenter = [38.4192, 27.1287]
      } else if (cityLower.includes("hatay") || cityLower.includes("iskenderun") || cityLower.includes("i̇skenderun")) {
        defaultCenter = [36.5872, 36.1735]
      }
    }
  }

  // Poligonları ve Sanal Çitleri birleştir
  const initialZones: GeofenceZoneItem[] = [
    ...dbGeofences.map((g) => ({
      id: g.id,
      name: g.name,
      title: g.name,
      type: g.type,
      zoneType: g.type,
      coordinates: g.coordinates,
      projectId: g.projectId
    })),
    ...dbSiteZones.map((sz) => ({
      id: sz.id,
      name: sz.title,
      title: sz.title,
      type: sz.zoneType || sz.category || "MAIN_SITE",
      zoneType: sz.zoneType || sz.category || "MAIN_SITE",
      polygonCoordinates: (sz.polygonCoordinates as any) || undefined,
      projectId: sz.projectId
    }))
  ]

  return (
    <AdminMapClient
      initialProjects={initialProjects}
      initialZones={initialZones}
      initialActiveRadars={activeRadars}
      initialEquipments={initialEquipments}
      defaultCenter={defaultCenter}
      defaultZoom={defaultZoom}
    />
  )
}
