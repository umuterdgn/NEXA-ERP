/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Superadmin Maintenance Mode (Master Kill-Switch) API
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET() {
  try {
    const setting = await prisma.systemSettings.findUnique({
      where: { key: "maintenance_mode" },
    });

    const isMaintenance = setting?.value === "true";

    return NextResponse.json({
      success: true,
      isMaintenance,
      updatedAt: setting?.updatedAt || null,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Bakım modu durumu sorgulanamadı.", isMaintenance: false },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (session?.user?.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { error: "Yalnızca SUPER_ADMIN rolü acil durum şalterini kontrol edebilir." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { enabled } = body;

    const updated = await prisma.systemSettings.upsert({
      where: { key: "maintenance_mode" },
      update: { value: enabled ? "true" : "false" },
      create: { key: "maintenance_mode", value: enabled ? "true" : "false" },
    });

    return NextResponse.json({
      success: true,
      isMaintenance: updated.value === "true",
      message: updated.value === "true"
        ? "🚨 DİKKAT: Tüm SaaS sistemi Bakım Moduna (Master Kill-Switch) alındı! Superadmin harici tüm kullanıcı erişimleri durduruldu."
        : "✅ SaaS sistemi normale döndü, bakım modu kapatıldı.",
    });
  } catch (error: any) {
    console.error("Maintenance mode toggle error:", error);
    return NextResponse.json(
      { error: "Şalter değiştirilemedi.", details: error.message },
      { status: 500 }
    );
  }
}
