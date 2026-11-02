/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Nexa ERP - Mobil İSG İhlal & Ramak Kala Raporlama API'si
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId");
    const category = searchParams.get("category"); // "VIOLATION" | "NEAR_MISS"

    const whereClause: any = {};
    if (projectId) whereClause.projectId = projectId;

    const reports = await prisma.isgReport.findMany({
      where: whereClause,
      include: {
        project: {
          select: { id: true, name: true },
        },
        personel: {
          select: { id: true, name: true, role: true },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 40,
    });

    return NextResponse.json(reports);
  } catch (error: any) {
    console.error("[Safety GET Error]:", error);
    return NextResponse.json(
      { error: "İSG raporları getirilemedi: " + error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      title,
      description,
      incidentType, // Örn: "KKD Eksikliği", "Yüksekte Çalışma", "Ramak Kala"
      category, // "VIOLATION" | "NEAR_MISS"
      subcontractorName,
      penaltyAmount,
      imageUrl,
      locationText,
      latitude,
      longitude,
      projectId,
      reporterName,
    } = body;

    // Hedef proje belirle
    let targetProjectId = projectId;
    if (!targetProjectId) {
      const activeProj =
        (await prisma.project.findFirst({
          where: { status: "ACTIVE" },
        })) || (await prisma.project.findFirst());
      targetProjectId = activeProj?.id;
    }

    // İlk personeli veya raporlayan kişiyi bağla
    let personnel = await prisma.personel.findFirst();

    const formattedDescription = `[${category === "NEAR_MISS" ? "RAMAK KALA" : "İSG İHLALİ / CEZA"}] ${incidentType || "Güvenlik İhlali"}\nTaşeron: ${subcontractorName || "Belirtilmedi"}\nKonum: ${locationText || "Saha"} (GPS: ${latitude?.toFixed(4)}, ${longitude?.toFixed(4)})\nDetay: ${description || title || "Açıklama girilmedi."}\n${penaltyAmount ? `Uygulanan Ceza: ₺${penaltyAmount}` : ""}`;

    let savedReport = null;
    if (personnel && targetProjectId) {
      savedReport = await prisma.isgReport.create({
        data: {
          projectId: targetProjectId,
          personelId: personnel.id,
          type: category === "NEAR_MISS" ? "TEHLIKE" : "KAZA_TUTANAGI",
          status: "ACIL",
          description: formattedDescription,
          imageUrl: imageUrl || "",
          location: `${locationText || "Saha"} (${latitude || 0}, ${longitude || 0})`,
        },
        include: {
          project: true,
        },
      });
    }

    // Ayrıca IsgViolation tablosuna da kaydet
    if (targetProjectId) {
      try {
        await prisma.isgViolation.create({
          data: {
            projectId: targetProjectId,
            workerName: `${reporterName || "İSG Uzmanı"} / Taşeron: ${subcontractorName || "Genel"}`,
            violation: `${incidentType || "İhlal"}: ${description || title || ""}`,
            zoneName: locationText || "Saha Bölgesi",
            status: "OPEN",
          },
        });
      } catch (violErr) {
        console.warn("[Safety] IsgViolation ekleme uyarısı:", violErr);
      }
    }

    console.log(
      `[Safety] Yeni İSG Raporu Kaydedildi: ${incidentType} - ${subcontractorName}`
    );

    return NextResponse.json(
      {
        success: true,
        message: "İSG güvenlik raporu başarıyla kaydedildi.",
        report: savedReport,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("[Safety POST Error]:", error);
    return NextResponse.json(
      { error: "İSG raporu kaydedilemedi: " + error.message },
      { status: 500 }
    );
  }
}
