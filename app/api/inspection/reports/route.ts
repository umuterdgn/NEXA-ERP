/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * This code is the property of NXA Software.
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { projectId, title, description, violations, dwgAnnotationUrl, photoAnnotationUrl } = body;

    if (!projectId || !title) {
      return NextResponse.json(
        { error: "Proje ID ve başlık zorunludur" },
        { status: 400 }
      );
    }

    const report = await prisma.inspectionReport.create({
      data: {
        projectId,
        title,
        description: description || null,
        violations: violations || null,
        markedBlueprintUrl: dwgAnnotationUrl || null,
        markedPhotoUrl: photoAnnotationUrl || null,
      },
      include: {
        project: true,
      },
    });

    return NextResponse.json(report, { status: 201 });
  } catch (error) {
    console.error("Rapor kaydedilirken hata:", error);
    return NextResponse.json(
      { error: "Rapor kaydedilirken hata oluştu" },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId");

    const whereClause = projectId ? { projectId } : {};

    const reports = await prisma.inspectionReport.findMany({
      where: whereClause,
      include: {
        project: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(reports);
  } catch (error) {
    console.error("Raporlar getirilirken hata:", error);
    return NextResponse.json(
      { error: "Raporlar getirilirken hata oluştu" },
      { status: 500 }
    );
  }
}
