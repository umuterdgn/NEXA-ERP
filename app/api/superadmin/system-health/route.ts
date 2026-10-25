/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Superadmin Live System Health, Server Metrics & Latency API
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET() {
  try {
    const session = await auth();
    if (session?.user?.role !== "SUPER_ADMIN" && session?.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Yetkisiz erişim." }, { status: 403 });
    }

    // 1. Process Memory Usage
    const memory = process.memoryUsage();
    const memoryStats = {
      heapUsedMb: Number((memory.heapUsed / 1024 / 1024).toFixed(1)),
      heapTotalMb: Number((memory.heapTotal / 1024 / 1024).toFixed(1)),
      rssMb: Number((memory.rss / 1024 / 1024).toFixed(1)),
      externalMb: Number((memory.external / 1024 / 1024).toFixed(1)),
    };

    // 2. Database Ping & Roundtrip Latency (Neon PostgreSQL)
    const dbStart = performance.now();
    await prisma.$queryRaw`SELECT 1 as ping`;
    const dbLatencyMs = Number((performance.now() - dbStart).toFixed(1));

    // 3. Maintenance mode status
    const maintenanceSetting = await prisma.systemSettings.findUnique({
      where: { key: "maintenance_mode" },
    });
    const isMaintenanceMode = maintenanceSetting?.value === "true";

    // 4. Server Uptime & Metadata
    const uptimeSeconds = Math.floor(process.uptime());
    const uptimeFormatted = `${Math.floor(uptimeSeconds / 3600)}s ${Math.floor((uptimeSeconds % 3600) / 60)}d ${uptimeSeconds % 60}sn`;

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      server: {
        nodeVersion: process.version,
        platform: process.platform,
        uptimeSeconds,
        uptimeFormatted,
        isVercel: !!process.env.VERCEL,
        region: process.env.VERCEL_REGION || "eu-central-1 (AWS Frankfurt)",
      },
      memory: memoryStats,
      database: {
        provider: "PostgreSQL (Neon Serverless)",
        latencyMs: dbLatencyMs,
        status: dbLatencyMs < 200 ? "OPTIMAL" : dbLatencyMs < 500 ? "MODERATE" : "DEGRADED",
        connectionPool: "ACTIVE",
      },
      maintenanceMode: isMaintenanceMode,
    });
  } catch (error: any) {
    console.error("Superadmin System Health Error:", error);
    return NextResponse.json(
      { error: "Sistem metrikleri alınamadı.", details: error.message },
      { status: 500 }
    );
  }
}
