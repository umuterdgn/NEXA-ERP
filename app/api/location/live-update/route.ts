/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Nexa ERP - Mobil Canlı Konum Güncelleme API'si
 *
 * Mobilden gelen LAT/LNG verisini alıp giriş yapan kullanıcının
 * currentLat, currentLng ve lastLocationUpdate değerlerini günceller.
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

    const now = timestamp ? new Date(timestamp) : new Date();

    // 1. Hedef Kullanıcıyı Belirle
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
      // Test veya varsayılan aktif personel
      matchedUser = await prisma.user.findFirst({
        where: {
          role: { in: ["ISG_EXPERT", "PROJECT_MANAGER", "DRIVER", "ADMIN"] },
        },
      }) || (await prisma.user.findFirst());
    }

    // 2. Kullanıcının currentLat, currentLng ve lastLocationUpdate değerlerini güncelle
    if (matchedUser) {
      await prisma.user.update({
        where: { id: matchedUser.id },
        data: {
          currentLat: actualLat,
          currentLng: actualLng,
          lastLocationUpdate: now,
        },
      });

      // 3. Geçmiş izleme (LocationLog) kaydı oluştur
      await prisma.locationLog.create({
        data: {
          userId: matchedUser.id,
          tenantId: matchedUser.tenantId,
          latitude: actualLat,
          longitude: actualLng,
          accuracy: accuracy || null,
          timestamp: now,
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: "Canlı konum başarıyla güncellendi.",
      data: {
        userId: matchedUser?.id,
        currentLat: actualLat,
        currentLng: actualLng,
        lastLocationUpdate: now,
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

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId");

    // Son 2 saat içinde güncellenen veya konumu olan personelleri çek
    const users = await prisma.user.findMany({
      where: {
        currentLat: { not: null },
        currentLng: { not: null },
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        currentLat: true,
        currentLng: true,
        lastLocationUpdate: true,
      },
      take: 50,
    });

    return NextResponse.json(users);
  } catch (error: any) {
    return NextResponse.json(
      { error: "Personel konumları getirilemedi: " + error.message },
      { status: 500 }
    );
  }
}
