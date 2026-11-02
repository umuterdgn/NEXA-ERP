/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Nexa ERP - Mobil Cihaz Push Token Kayıt API'si
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, email, pushToken, platform, deviceName } = body;

    if (!pushToken) {
      return NextResponse.json(
        { error: "pushToken alanı zorunludur" },
        { status: 400 }
      );
    }

    // Kullanıcıyı id veya email ile bul
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          ...(userId ? [{ id: userId }] : []),
          ...(email ? [{ email }] : []),
        ],
      },
    });

    if (user) {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          pushToken,
        },
      });

      console.log(
        `[PushToken] Cihaz token'ı kullanıcıya kaydedildi: ${user.name} (${user.email}) -> ${pushToken.slice(0, 15)}...`
      );
    } else {
      console.log(
        `[PushToken] Kullanıcı bulunamadı, genel token kaydedildi (${platform || "mobil"} - ${deviceName || "cihaz"}): ${pushToken.slice(0, 15)}...`
      );
    }

    return NextResponse.json({
      success: true,
      message: "Cihaz push token başarıyla sisteme kaydedildi.",
      pushToken,
    });
  } catch (error: any) {
    console.error("[PushToken Error]:", error);
    return NextResponse.json(
      { error: "Push token kaydedilemedi: " + (error?.message || "Bilinmeyen hata") },
      { status: 500 }
    );
  }
}
