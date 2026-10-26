/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * GeofenceZone Delete API
 */

import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    if (!id) {
      return NextResponse.json({ error: "Geofence ID zorunludur" }, { status: 400 })
    }

    // Try deleting from GeofenceZone
    const zone = await prisma.geofenceZone.findUnique({ where: { id } }).catch(() => null)
    if (zone) {
      await prisma.geofenceZone.delete({ where: { id } })
      // Also clean matching SiteZone if found
      await prisma.siteZone.deleteMany({
        where: { projectId: zone.projectId, title: zone.name }
      }).catch(() => null)
    } else {
      // Check if it's a SiteZone ID
      await prisma.siteZone.delete({ where: { id } }).catch(() => null)
    }

    return NextResponse.json({ success: true, message: "Sanal çit başarıyla silindi" })
  } catch (error: any) {
    console.error("GeofenceZone DELETE Error:", error)
    return NextResponse.json(
      { error: error?.message || "Sanal çit silinirken hata oluştu" },
      { status: 500 }
    )
  }
}
