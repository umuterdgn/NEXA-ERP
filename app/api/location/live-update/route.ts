/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Nexa ERP - Mobil Şantiye Personeli Canlı Konum Güncelleme API'si
 *
 * Check-in sonrası arka planda çalışan BACKGROUND_LOCATION_TASK tarafından
 * gönderilen LAT/LNG koordinatlarını İSG izleme ve acil durum güvenliği için kaydeder.
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      userId,
      personelId,
      latitude,
      longitude,
      lat,
      lng,
      accuracy,
      speed,
      altitude,
      timestamp,
      projectId,
      source,
    } = body;

    const actualLat = latitude !== undefined ? latitude : lat;
    const actualLng = longitude !== undefined ? longitude : lng;

    if (actualLat === undefined || actualLng === undefined) {
      return NextResponse.json(
        { error: "Latitude ve Longitude koordinatları zorunludur." },
        { status: 400 }
      );
    }

    if (
      typeof actualLat !== "number" ||
      typeof actualLng !== "number" ||
      actualLat < -90 ||
      actualLat > 90 ||
      actualLng < -180 ||
      actualLng > 180
    ) {
      return NextResponse.json(
        { error: "Geçersiz GPS koordinatları." },
        { status: 400 }
      );
    }

    // Hedef kullanıcı belirle
    const targetUserId = userId || personelId;
    let matchedUser = null;

    if (targetUserId) {
      matchedUser = await prisma.user.findFirst({
        where: {
          OR: [{ id: targetUserId }, { email: targetUserId }],
        },
      });
    }

    if (!matchedUser) {
      // Varsayılan personel veya ilk admin
      matchedUser = await prisma.user.findFirst();
    }

    let savedLog = null;
    if (matchedUser) {
      savedLog = await prisma.locationLog.create({
        data: {
          userId: matchedUser.id,
          tenantId: matchedUser.tenantId,
          latitude: actualLat,
          longitude: actualLng,
          accuracy: accuracy || null,
          timestamp: timestamp ? new Date(timestamp) : new Date(),
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: "Arka plan konumu başarıyla güncellendi.",
      data: {
        id: savedLog?.id,
        latitude: actualLat,
        longitude: actualLng,
        timestamp: savedLog?.timestamp || new Date(),
      },
    });
  } catch (error: any) {
    console.error("[Live Location Update Error]:", error);
    return NextResponse.json(
      { error: "Konum güncellenemedi: " + error.message },
      { status: 500 }
    );
  }
}
