/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * E-Devlet 2FA (SMS / Mobil Onay Kodu) Gönderme ve Enjeksiyon API'si
 * Bekleyen Playwright tarayıcı oturumuna kodu aktarır
 */

import { NextRequest, NextResponse } from "next/server";
import { submitRpaTwoFactorCode } from "@/lib/rpa/yibf-rpa-engine";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { sessionId, code } = body;

    if (!sessionId || !code) {
      return NextResponse.json(
        { error: "sessionId ve 2FA onay kodu zorunludur." },
        { status: 400 }
      );
    }

    console.log(`[API /api/yibf/rpa-submit-code] 2FA kodu oturuma aktarılıyor: ${sessionId}`);

    const result = await submitRpaTwoFactorCode(sessionId, code);

    return NextResponse.json({
      success: result.success,
      status: result.status,
      message: result.message,
      data: result.data,
    });
  } catch (error: any) {
    console.error("2FA Submit Code API Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "2FA kodu işlenirken hata oluştu.",
      },
      { status: 500 }
    );
  }
}
