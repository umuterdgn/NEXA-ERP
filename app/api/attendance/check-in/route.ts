/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Nexa ERP - Mobil NFC & Geofence Akıllı Puantaj Check-In API
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      projectId,
      workerName,
      latitude,
      longitude,
      nfcUid,
      cardUid,
      personelId,
    } = body;

    const uid = nfcUid || cardUid;

    // Hedef projeyi belirle (verilmemişse ilk aktif projeyi seç)
    let targetProjectId = projectId;
    if (!targetProjectId) {
      const activeProject =
        (await prisma.project.findFirst({
          where: { status: "ACTIVE" },
        })) || (await prisma.project.findFirst());
      targetProjectId = activeProject?.id;
    }

    if (!targetProjectId) {
      return NextResponse.json(
        { error: "Sistemde aktif proje bulunamadı" },
        { status: 400 }
      );
    }

    // Personel kartı eşleştirmesi veya isim belirleme
    let resolvedWorkerName = workerName;
    if (!resolvedWorkerName && uid) {
      resolvedWorkerName = `NFC Kart Sahibi (${uid})`;
    }

    // Puantaj kaydı oluştur
    const attendance = await prisma.attendanceRecord.create({
      data: {
        projectId: targetProjectId,
        personelId: personelId || undefined,
        workerName: resolvedWorkerName || "Saha Personeli",
        latitude: latitude !== undefined ? parseFloat(latitude) : null,
        longitude: longitude !== undefined ? parseFloat(longitude) : null,
        date: new Date(),
        checkIn: new Date(),
        status: "PRESENT",
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            title: true,
          },
        },
      },
    });

    console.log(
      `[Attendance] Puantaj Girişi Başarılı: ${attendance.workerName} (Proje: ${attendance.project?.name})`
    );

    return NextResponse.json({
      success: true,
      message: "Şantiye puantaj girişi başarıyla onaylandı.",
      attendance,
      checkInTime: attendance.checkIn?.toLocaleTimeString("tr-TR"),
    });
  } catch (error: any) {
    console.error("[Attendance check-in error]:", error);
    return NextResponse.json(
      { error: "Puantaj girişi kaydedilemedi: " + (error?.message || "Sunucu hatası") },
      { status: 500 }
    );
  }
}