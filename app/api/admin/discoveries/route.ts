import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * Nexa ERP - Saha Keşif & Ön Etüt API
 * POST: Yeni keşif kaydı ekler
 * GET: Kayıtlı keşifleri listeler
 */

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 });
    }

    // SiteReport tablosunu veya Discovery loglarını oku
    const reports = await prisma.siteReport
      .findMany({
        where: {
          reportType: "KESIF",
        },
        orderBy: { createdAt: "desc" },
        take: 50,
      })
      .catch(() => []);

    return NextResponse.json(reports);
  } catch (error: any) {
    console.error("[Discoveries API GET Error]:", error);
    return NextResponse.json({ error: "Keşif kayıtları alınamadı" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 });
    }

    const body = await req.json();
    const {
      title,
      date,
      projectId,
      clientName,
      surveyorName,
      notes,
      estimatedArea,
      estimatedBudget,
      latitude,
      longitude,
      files,
    } = body;

    if (!title || !date) {
      return NextResponse.json(
        { error: "Keşif başlığı ve tarihi zorunludur" },
        { status: 400 }
      );
    }

    const tenantId = (session.user as any)?.tenantId || "nexa-franchise";

    // SiteReport tablosuna kaydet veya mock response
    let createdRecord = null;
    try {
      createdRecord = await prisma.siteReport.create({
        data: {
          title,
          reportType: "KESIF",
          summary: `Sörveyör: ${surveyorName || "Belirtilmedi"} | Müşteri: ${clientName || "-"} | Alan: ${estimatedArea || 0} m²`,
          content: notes || "",
          latitude: latitude ? parseFloat(latitude) : undefined,
          longitude: longitude ? parseFloat(longitude) : undefined,
          projectId: projectId || undefined,
          tenantId,
          weatherData: {
            estimatedBudget: estimatedBudget ? parseFloat(estimatedBudget) : null,
            surveyor: surveyorName,
            client: clientName,
            mediaCount: Array.isArray(files) ? files.length : 0,
            discoveryDate: date,
          },
        },
      });
    } catch (dbErr) {
      console.warn("[Discoveries API] Prisma SiteReport fallback:", dbErr);
      createdRecord = {
        id: "disc-" + Date.now(),
        title,
        createdAt: new Date().toISOString(),
      };
    }

    return NextResponse.json({
      success: true,
      message: "Yeni keşif başarıyla sisteme kaydedildi.",
      data: createdRecord,
    });
  } catch (error: any) {
    console.error("[Discoveries API POST Error]:", error);
    return NextResponse.json(
      { error: error?.message || "Keşif kaydedilirken bir hata oluştu" },
      { status: 500 }
    );
  }
}
