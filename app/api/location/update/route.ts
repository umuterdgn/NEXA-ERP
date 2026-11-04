import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * Nexa ERP - Şoför / Lojistik Arka Plan GPS Konum Güncelleme API
 * /api/location/update
 *
 * Mobil arka plan GPS görevinden (BACKGROUND_LOCATION_TASK)
 * her 10 saniyede bir veya 50 metre yer değiştirmede gelen telemetri verisini karşılar.
 */

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      driverId,
      driverName,
      plate,
      latitude,
      longitude,
      speed,
      heading,
      accuracy,
      timestamp,
      isDriving,
    } = body;

    if (latitude === undefined || longitude === undefined) {
      return NextResponse.json(
        { error: "Enlem (latitude) ve boylam (longitude) zorunludur" },
        { status: 400 }
      );
    }

    const numericLat = parseFloat(latitude);
    const numericLng = parseFloat(longitude);

    // Varsa ilgili ekipman / araç konumunu güncelle
    if (plate) {
      await prisma.equipment
        .updateMany({
          where: { serialNumber: plate },
          data: {
            latitude: numericLat,
            longitude: numericLng,
            lastLat: numericLat,
            lastLng: numericLng,
            lastSeenAt: new Date(),
          },
        })
        .catch(() => null);
    }

    // Konsol log / telemetry telemetry
    console.log(
      `[Driver GPS Update] 🚛 Şoför: ${driverName || driverId || "Anonim"} (${plate || "Plakasız"}) -> LAT: ${numericLat}, LNG: ${numericLng}, Hız: ${speed || 0} km/h`
    );

    return NextResponse.json({
      success: true,
      message: "Şoför konum verisi başarıyla güncellendi.",
      data: {
        driverId,
        plate,
        latitude: numericLat,
        longitude: numericLng,
        speed: speed || 0,
        receivedAt: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    console.error("[Driver Location Update Error]:", error);
    return NextResponse.json(
      { error: error?.message || "Konum güncellenemedi" },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    status: "ACTIVE",
    service: "Driver Background GPS Telemetry Engine",
    interval: "10s or 50m displacement",
  });
}
