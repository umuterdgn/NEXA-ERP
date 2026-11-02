/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Nexa ERP - Şantiye Günlüğü Güncelleme & Yapı Denetim e-İmza Onayı
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const body = await request.json();
    const { inspectorSignature, inspectorId, notes } = body;

    const existing = await prisma.dailyLog.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Şantiye jurnali kaydı bulunamadı." },
        { status: 404 }
      );
    }

    const updated = await prisma.dailyLog.update({
      where: { id },
      data: {
        ...(inspectorSignature !== undefined && {
          inspectorSignature,
          inspectorSignedAt: new Date(),
          inspectorId: inspectorId || null,
        }),
        ...(notes !== undefined && { notes }),
      },
      include: {
        project: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Yapı denetim e-İmzası başarıyla kaydedildi.",
      log: updated,
    });
  } catch (error: any) {
    console.error("[DailyLog PATCH] Signature update error:", error);
    return NextResponse.json(
      { error: "İmza kaydedilirken hata oluştu: " + error.message },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  return PATCH(request, context);
}
