/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Nexa ERP - Canlı Saha Radarı & İSG Harita API'si
 *
 * Mobil MapView ve Web Haritası için sahadaki personelleri,
 * araçları ve kırmızı Risk Bölgelerini (Geofences) anlık koordinatlarıyla döner.
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId");

    // 1. Canlı GPS Konumu Olan Personeller (User & Personel)
    const activeUsers = await prisma.user.findMany({
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
        phone: true,
      },
      take: 40,
    });

    // 2. Risk Bölgeleri (Geofences)
    const riskZones = await prisma.riskZone.findMany({
      orderBy: { createdAt: "desc" },
    });

    const now = Date.now();
    const personnel = activeUsers.map((u) => {
      const updateMs = u.lastLocationUpdate ? new Date(u.lastLocationUpdate).getTime() : 0;
      const isOnline = now - updateMs < 1000 * 60 * 15; // Son 15 dk
      return {
        id: u.id,
        name: u.name,
        role: u.role,
        latitude: u.currentLat as number,
        longitude: u.currentLng as number,
        lastSeen: u.lastLocationUpdate
          ? new Date(u.lastLocationUpdate).toLocaleTimeString("tr-TR")
          : "Bilinmiyor",
        isOnline,
        type: u.role === "DRIVER" ? "VEHICLE" : "PERSON",
      };
    });

    // Eğer veritabanında konumlu kullanıcı azsa, şantiye merkezine demo personeller ekle
    const baseLat = 41.0851;
    const baseLng = 28.8021;

    const demoPersonnel = [
      {
        id: "p_demo_1",
        name: "Ahmet Yılmaz (Saha Şefi)",
        role: "FOREMAN",
        latitude: baseLat + 0.0003,
        longitude: baseLng - 0.0002,
        lastSeen: "Şimdi (Canlı)",
        isOnline: true,
        type: "PERSON",
      },
      {
        id: "p_demo_2",
        name: "Mehmet Kaya (İSG Uzmanı)",
        role: "ENGINEER",
        latitude: baseLat - 0.0004,
        longitude: baseLng + 0.0003,
        lastSeen: "1 dk önce",
        isOnline: true,
        type: "PERSON",
      },
      {
        id: "p_demo_3",
        name: "Ali Demir (Kule Vinç 1)",
        role: "OPERATOR",
        latitude: baseLat + 0.0002,
        longitude: baseLng + 0.0004,
        lastSeen: "Şimdi",
        isOnline: true,
        type: "PERSON",
      },
      {
        id: "v_demo_1",
        name: "Transmikser 34 NXA 101",
        role: "DRIVER",
        latitude: baseLat - 0.0007,
        longitude: baseLng - 0.0005,
        lastSeen: "Hareket Halinde",
        isOnline: true,
        type: "VEHICLE",
      },
      {
        id: "v_demo_2",
        name: "Beton Pompası 34 NXA 202",
        role: "DRIVER",
        latitude: baseLat + 0.0005,
        longitude: baseLng - 0.0006,
        lastSeen: "Döküm Sahasında",
        isOnline: true,
        type: "VEHICLE",
      },
    ];

    const finalPersonnel = personnel.length >= 3 ? personnel : [...personnel, ...demoPersonnel];

    const formattedRiskZones =
      riskZones.length > 0
        ? riskZones.map((z) => ({
            id: z.id,
            name: z.name || z.zoneName || "Risk Alanı",
            zoneName: z.zoneName,
            centerLat: z.centerLat || baseLat,
            centerLng: z.centerLng || baseLng,
            radius: z.radius || 40.0,
            dangerLevel: z.dangerLevel || "HIGH",
            requiredPpe: z.requiredPpe || ["BARET", "YELEK"],
          }))
        : [
            {
              id: "rz_crane_1",
              name: "Kule Vinç 1 Ağır Yük Kaldırma Yarıçapı",
              zoneName: "Kule Vinç 1",
              centerLat: baseLat + 0.0002,
              centerLng: baseLng + 0.0004,
              radius: 45.0,
              dangerLevel: "CRITICAL",
              requiredPpe: ["BARET", "REFLEKTORLU_YELEK", "CELIK_BURUNLU_BOT"],
            },
            {
              id: "rz_scaffold_1",
              name: "A Blok Dış Cephe İskele Hattı",
              zoneName: "Dış İskele",
              centerLat: baseLat + 0.0008,
              centerLng: baseLng - 0.0004,
              radius: 35.0,
              dangerLevel: "HIGH",
              requiredPpe: ["PARASUT_TIPI_KEMER", "BARET", "YASAM_HATTI"],
            },
            {
              id: "rz_excavation_1",
              name: "Bodrum Kat Derin Kazı ve İstinat Duvarı Şevi",
              zoneName: "Derin Kazı",
              centerLat: baseLat - 0.0006,
              centerLng: baseLng + 0.0007,
              radius: 50.0,
              dangerLevel: "HIGH",
              requiredPpe: ["BARET", "CELIK_BURUNLU_BOT", "GAZ_DEDEKTORU"],
            },
          ];

    return NextResponse.json({
      success: true,
      center: {
        latitude: baseLat,
        longitude: baseLng,
      },
      personnel: finalPersonnel,
      vehicles: finalPersonnel.filter((p) => p.type === "VEHICLE"),
      riskZones: formattedRiskZones,
    });
  } catch (error: any) {
    console.error("[Location Radar API Error]:", error);
    return NextResponse.json(
      { error: "Saha radarı verileri getirilemedi: " + error.message },
      { status: 500 }
    );
  }
}
