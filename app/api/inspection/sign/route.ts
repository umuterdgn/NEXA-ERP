/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Nexa ERP - Yapı Denetim e-İmza Onay API'si
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { dailyLogId, inspectorSignature, inspectorId, notes } = body;

    if (!dailyLogId || !inspectorSignature) {
      return NextResponse.json(
        { error: "dailyLogId ve inspectorSignature zorunludur" },
        { status: 400 }
      );
    }

    const updated = await prisma.dailyLog.update({
      where: { id: dailyLogId },
      data: {
        inspectorSignature,
        inspectorSignedAt: new Date(),
        inspectorId: inspectorId || null,
        ...(notes && { notes }),
      },
      include: {
        project: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Yapı denetim e-İmzası jurnale işlendi.",
      dailyLog: updated,
    });
  } catch (error: any) {
    console.error("[Inspection Sign POST] Error:", error);
    return NextResponse.json(
      { error: "İmza onaylanırken hata oluştu: " + error.message },
      { status: 500 }
    );
  }
}
