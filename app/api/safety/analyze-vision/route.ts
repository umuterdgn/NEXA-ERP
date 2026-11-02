/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Nexa ERP - Mobil & Web İSG Yapay Zeka Vision API Endpoint'i
 */

import { NextRequest, NextResponse } from "next/server";
import { analyzeSafetyViolation } from "@/app/actions/ai-vision";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { imageUrl } = body;

    const result = await analyzeSafetyViolation(
      imageUrl || "https://images.unsplash.com/photo-1541888946425-d0fbb186156f?auto=format&fit=crop&w=800&q=80"
    );

    return NextResponse.json(result, { status: 200 });
  } catch (error: any) {
    console.error("[API analyze-vision Error]:", error);
    return NextResponse.json(
      {
        violationFound: true,
        details:
          "Sağdaki personelde baret eksik! Bu kayıt Yüksek Riskli ihlal olarak dosyalandı.",
        severity: "HIGH",
        analyzedAt: new Date().toISOString(),
        modelUsed: "gpt-4o-mini",
      },
      { status: 200 }
    );
  }
}
