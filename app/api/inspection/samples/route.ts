/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Karot & Numune Takip API (Liste ve Yeni Numune Oluşturma)
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search");
    const status = searchParams.get("status");
    const projectId = searchParams.get("projectId");

    const where: any = {};

    if (projectId) {
      where.projectId = projectId;
    }

    if (status && status !== "ALL") {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { qrCode: { contains: search, mode: "insensitive" } },
        { location: { contains: search, mode: "insensitive" } },
        { project: { title: { contains: search, mode: "insensitive" } } },
        { project: { name: { contains: search, mode: "insensitive" } } },
        { project: { yibfNo: { contains: search, mode: "insensitive" } } },
      ];
    }

    const samples = await prisma.coreSample.findMany({
      where,
      include: {
        project: {
          select: {
            id: true,
            title: true,
            name: true,
            yibfNo: true,
            city: true,
            district: true,
          },
        },
        takenBy: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
      orderBy: { takenAt: "desc" },
    });

    return NextResponse.json(samples);
  } catch (error) {
    console.error("CoreSample GET error:", error);
    return NextResponse.json(
      { error: "Numune listesi alınırken hata oluştu" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    const body = await request.json();

    const {
      projectId,
      location,
      notes,
      takenById: reqTakenById,
      customQrCode,
    } = body;

    if (!projectId || !location) {
      return NextResponse.json(
        { error: "Proje (Şantiye) ve Alındığı Konum zorunludur" },
        { status: 400 }
      );
    }

    // Projeyi ve YİBF numarasını bul
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { id: true, yibfNo: true, name: true, title: true },
    });

    if (!project) {
      return NextResponse.json({ error: "Geçersiz proje ID" }, { status: 404 });
    }

    // Denetçi (User) ID belirle
    let takenById = session?.user?.id || reqTakenById;
    if (!takenById) {
      const firstUser = await prisma.user.findFirst({
        select: { id: true },
      });
      takenById = firstUser?.id;
    }

    if (!takenById) {
      return NextResponse.json(
        { error: "Numuneyi alan denetçi kullanıcı bulunamadı" },
        { status: 400 }
      );
    }

    // Benzersiz QR Kod formatı üret: Örn: "SMP-14582-K3-9421"
    const yibfClean = (project.yibfNo || "YIBF").replace(/\s/g, "");
    const locClean = location.replace(/[^a-zA-Z0-9]/g, "").slice(0, 3).toUpperCase() || "LOC";
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const generatedQr = customQrCode || `SMP-${yibfClean}-${locClean}-${randomSuffix}`;

    const newSample = await prisma.coreSample.create({
      data: {
        qrCode: generatedQr,
        projectId,
        takenById,
        location,
        status: "TAKEN",
        notes: notes || null,
      },
      include: {
        project: {
          select: {
            id: true,
            title: true,
            name: true,
            yibfNo: true,
          },
        },
        takenBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json(newSample, { status: 201 });
  } catch (error: any) {
    console.error("CoreSample POST error:", error);
    return NextResponse.json(
      { error: error.message || "Numune kaydı oluşturulurken hata oluştu" },
      { status: 500 }
    );
  }
}
