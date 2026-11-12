"use server";
/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Web Trafiği & Analitik Server Actions
 */

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function recordWebTraffic(data: {
  path: string;
  referer?: string | null;
  userAgent?: string | null;
}) {
  try {
    await prisma.webTraffic.create({
      data: {
        path: data.path || "/",
        referer: data.referer || null,
        userAgent: data.userAgent || null,
      },
    });
    return { success: true };
  } catch (error) {
    // Non-blocking telemetry error
    return { success: false };
  }
}

export async function getWebTrafficAnalytics() {
  try {
    const session = await auth();
    const userRole = (session?.user as any)?.role;
    if (userRole !== "SUPER_ADMIN" && userRole !== "ADMIN") {
      return { success: false, error: "Yetkisiz erişim." };
    }

    const now = new Date();
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const last7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const last30d = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [
      totalViews,
      views24h,
      views7d,
      views30d,
      recentLogs,
      totalLeads,
      convertedLeads,
      totalTenants,
    ] = await Promise.all([
      prisma.webTraffic.count(),
      prisma.webTraffic.count({ where: { createdAt: { gte: last24h } } }),
      prisma.webTraffic.count({ where: { createdAt: { gte: last7d } } }),
      prisma.webTraffic.count({ where: { createdAt: { gte: last30d } } }),
      prisma.webTraffic.findMany({
        take: 100,
        orderBy: { createdAt: "desc" },
      }),
      prisma.demoRequest.count(),
      prisma.demoRequest.count({ where: { status: "CONVERTED" } }),
      prisma.tenant.count(),
    ]);

    // Top pages aggregation from recent 1000 logs
    const pathCounts: Record<string, number> = {};
    const deviceCounts = { Desktop: 0, Mobile: 0, Tablet: 0, Bot: 0 };
    const refererCounts: Record<string, number> = {};

    const sampleLogs = await prisma.webTraffic.findMany({
      take: 1000,
      orderBy: { createdAt: "desc" },
      select: { path: true, userAgent: true, referer: true, createdAt: true },
    });

    for (const log of sampleLogs) {
      pathCounts[log.path] = (pathCounts[log.path] || 0) + 1;

      const ua = (log.userAgent || "").toLowerCase();
      if (ua.includes("bot") || ua.includes("crawl") || ua.includes("spider")) {
        deviceCounts.Bot++;
      } else if (ua.includes("ipad") || ua.includes("tablet")) {
        deviceCounts.Tablet++;
      } else if (ua.includes("mobile") || ua.includes("android") || ua.includes("iphone")) {
        deviceCounts.Mobile++;
      } else {
        deviceCounts.Desktop++;
      }

      const ref = log.referer ? log.referer.replace(/^https?:\/\//, "").split("/")[0] : "Doğrudan (Direct)";
      refererCounts[ref] = (refererCounts[ref] || 0) + 1;
    }

    const topPages = Object.entries(pathCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([path, count]) => ({ path, count }));

    const topReferers = Object.entries(refererCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([source, count]) => ({ source, count }));

    // 7-day trend
    const dailyTrend: { date: string; views: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dayKey = d.toISOString().slice(0, 10);
      const count = sampleLogs.filter((l) => l.createdAt.toISOString().slice(0, 10) === dayKey).length;
      dailyTrend.push({
        date: d.toLocaleDateString("tr-TR", { day: "2-digit", month: "short" }),
        views: count,
      });
    }

    const leadConversionRate =
      views30d > 0 ? ((totalLeads / views30d) * 100).toFixed(2) : totalLeads > 0 ? "100.00" : "0.00";

    return {
      success: true,
      analytics: {
        totalViews,
        views24h,
        views7d,
        views30d,
        totalLeads,
        convertedLeads,
        totalTenants,
        leadConversionRate,
        topPages,
        topReferers,
        deviceCounts,
        dailyTrend,
        recentLogs: recentLogs.slice(0, 20).map((l) => ({
          id: l.id,
          path: l.path,
          referer: l.referer || "Doğrudan",
          userAgent: l.userAgent || "-",
          createdAt: l.createdAt.toISOString(),
        })),
      },
    };
  } catch (error: any) {
    console.error("getWebTrafficAnalytics error:", error);
    return { success: false, error: error?.message || "Analitik verileri alınamadı." };
  }
}

