/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Çevre ve Şehircilik Bakanlığı YİBF RPA Senkronizasyon Başlatma API'si
 * Headless Browser (Playwright) ile E-Devlet Girişi ve 2FA Bekleme Köprüsü
 */

import { NextRequest, NextResponse } from "next/server";
import { initiateYibfRpaSync, getRpaSessionStatus } from "@/lib/rpa/yibf-rpa-engine";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { tcKimlik, password, yibfNo, projectId } = body;

    console.log(`[API /api/yibf/rpa-sync] RPA senkronizasyon isteği alındı (YİBF: ${yibfNo || "Tümü"})`);

    const result = await initiateYibfRpaSync({
      tcKimlik,
      password,
      yibfNo,
      projectId,
    });

    return NextResponse.json({
      success: true,
      sessionId: result.sessionId,
      status: result.status,
      requiresTwoFactor: result.requiresTwoFactor,
      message: result.message,
      data: result.data,
    });
  } catch (error: any) {
    console.error("RPA Sync API Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "RPA senkronizasyonu başlatılamadı.",
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get("sessionId");

    if (!sessionId) {
      return NextResponse.json({ error: "sessionId parametresi gereklidir" }, { status: 400 });
    }

    const session = getRpaSessionStatus(sessionId);
    if (!session) {
      return NextResponse.json({ error: "Oturum bulunamadı veya süresi doldu" }, { status: 404 });
    }

    return NextResponse.json({
      sessionId: session.id,
      status: session.status,
      message: session.message,
      data: session.scrapedData,
      error: session.error,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
