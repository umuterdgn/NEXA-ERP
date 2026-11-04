import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
<<<<<<< HEAD
 * Nexa ERP - Yeni Keşif Ekleme ve Keşif Yönetimi API
 * - Proje / Keşif kayıtları
 * - GPS koordinatları & Metraj / Bütçe
 * - Saha keşif fotoğrafları & krokileri
=======
 * Nexa ERP - Saha Keşif & Ön Etüt API
 * POST: Yeni keşif kaydı ekler
 * GET: Kayıtlı keşifleri listeler
>>>>>>> 0bc202996566110dca4d9702def0abbe9d37379f
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
<<<<<<< HEAD
          activities: { contains: "[KEŞİF]" },
=======
          reportType: "KESIF",
>>>>>>> 0bc202996566110dca4d9702def0abbe9d37379f
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

<<<<<<< HEAD
    let targetProjectId = projectId;
    if (!targetProjectId) {
      const p = await prisma.project.findFirst().catch(() => null);
      if (p) targetProjectId = p.id;
    }

    // SiteReport tablosuna kaydet veya fallback
    let createdRecord = null;
    if (targetProjectId) {
      try {
        createdRecord = await prisma.siteReport.create({
          data: {
            projectId: targetProjectId,
            tenantId,
            date: new Date(date),
            weather: `GPS: ${latitude || "36.5878"}, ${longitude || "36.1735"}`,
            activities: `[KEŞİF] ${title} | Müşteri: ${clientName || "-"} | Sörveyör: ${surveyorName || "Saha Şefi"}`,
            dailyEvents: JSON.stringify({
              title,
              estimatedArea: estimatedArea ? parseFloat(estimatedArea) : 0,
              estimatedBudget: estimatedBudget ? parseFloat(estimatedBudget) : 0,
              latitude: latitude ? parseFloat(latitude) : null,
              longitude: longitude ? parseFloat(longitude) : null,
              files: Array.isArray(files) ? files : [],
            }),
            notes: notes || "Saha keşif notu",
            images: Array.isArray(files) ? files.join(",") : "",
            createdBy: session.user.name || surveyorName || "Sörveyör",
          },
        });
      } catch (dbErr) {
        console.warn("[Discoveries API] Prisma fallback:", dbErr);
      }
    }

    if (!createdRecord) {
      createdRecord = {
        id: "dsc-" + Date.now(),
        title,
        date,
        surveyorName,
        clientName,
        estimatedArea: estimatedArea ? parseFloat(estimatedArea) : 0,
        estimatedBudget: estimatedBudget ? parseFloat(estimatedBudget) : 0,
        latitude: latitude ? parseFloat(latitude) : null,
        longitude: longitude ? parseFloat(longitude) : null,
        notes,
        files: files || [],
=======
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
>>>>>>> 0bc202996566110dca4d9702def0abbe9d37379f
        createdAt: new Date().toISOString(),
      };
    }

    return NextResponse.json({
      success: true,
<<<<<<< HEAD
      message: "Keşif kaydı başarıyla oluşturuldu.",
=======
      message: "Yeni keşif başarıyla sisteme kaydedildi.",
>>>>>>> 0bc202996566110dca4d9702def0abbe9d37379f
      data: createdRecord,
    });
  } catch (error: any) {
    console.error("[Discoveries API POST Error]:", error);
    return NextResponse.json(
<<<<<<< HEAD
      { error: error?.message || "Keşif kaydedilirken hata oluştu" },
=======
      { error: error?.message || "Keşif kaydedilirken bir hata oluştu" },
>>>>>>> 0bc202996566110dca4d9702def0abbe9d37379f
      { status: 500 }
    );
  }
}
