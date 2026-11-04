/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Nexa ERP - Şantiye Günlüğü (Daily Log) API
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId");
    const status = searchParams.get("status"); // "PENDING_INSPECTION" | "ALL"

    const whereClause: any = {};
    if (projectId) {
      whereClause.projectId = projectId;
    }

    if (status === "PENDING_INSPECTION") {
      whereClause.inspectorSignature = null;
    }

    const logs = await prisma.dailyLog.findMany({
      where: whereClause,
      include: {
        project: {
          select: {
            id: true,
            name: true,
            title: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        date: "desc",
      },
      take: 50,
    });

    return NextResponse.json(logs);
  } catch (error: any) {
    console.error("[DailyLog GET] Error:", error);
    return NextResponse.json(
      { error: "Şantiye jurnalleri getirilemedi: " + error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      projectId,
      activities,
      notes,
      weather,
      personnelCount,
      machineryCount,
      photos,
      createdById,
    } = body;

    if (!projectId || !activities) {
      return NextResponse.json(
        { error: "Proje ID ve yapılan aktiviteler zorunludur" },
        { status: 400 }
      );
    }

    const newLog = await prisma.dailyLog.create({
      data: {
        projectId,
        activities,
        notes: notes || "",
        weather: weather || "Açık, 24°C",
        personnelCount: Number(personnelCount) || 0,
        machineryCount: Number(machineryCount) || 0,
        photos: photos || [],
        createdById: createdById || undefined,
      },
      include: {
        project: true,
      },
    });

    return NextResponse.json(newLog, { status: 201 });
  } catch (error: any) {
    console.error("[DailyLog POST] Error:", error);
    return NextResponse.json(
      { error: "Şantiye jurnali kaydedilemedi: " + error.message },
      { status: 500 }
    );
  }
}
