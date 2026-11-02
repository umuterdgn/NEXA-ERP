/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Nexa ERP - Şantiye Chat Kanalları API'si
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    let channels = await prisma.chatChannel.findMany({
      orderBy: { createdAt: "asc" },
      include: {
        _count: {
          select: { messages: true },
        },
      },
    });

    // Eğer hiç kanal yoksa, varsayılan şantiye telsiz ve chat kanallarını otomatik oluştur
    if (channels.length === 0) {
      const defaultChannels = [
        {
          name: "Şantiye Genel (Telsiz)",
          description: "Tüm saha ekibi, telsiz anonsları ve genel şantiye haberleşmesi",
        },
        {
          name: "A Blok Kaba Yapı",
          description: "Kalıp, demir, beton dökümü ve taşeron koordinasyonu",
        },
        {
          name: "İSG & Acil Durum ⚠️",
          description: "İş güvenliği ihlalleri, acil durumlar ve ramak kala bildirimleri",
        },
        {
          name: "Lojistik & Sevkiyat 🚚",
          description: "Beton mikserleri, malzeme kabul ve vinç operasyonları",
        },
      ];

      for (const ch of defaultChannels) {
        await prisma.chatChannel.create({
          data: ch,
        });
      }

      channels = await prisma.chatChannel.findMany({
        orderBy: { createdAt: "asc" },
        include: {
          _count: {
            select: { messages: true },
          },
        },
      });
    }

    return NextResponse.json({
      success: true,
      channels,
    });
  } catch (error: any) {
    console.error("[Chat Channels GET Error]:", error);
    return NextResponse.json(
      { error: "Kanallar getirilemedi: " + error.message },
      { status: 500 }
    );
  }
}
