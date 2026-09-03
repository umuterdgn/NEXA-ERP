/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * This code is the property of NXA Software.
 */

import { NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const image = formData.get("image") as File | null
    const transcribedText = formData.get("transcribedText") as string

    // Simulate AI processing delay (2 seconds)
    await new Promise((resolve) => setTimeout(resolve, 2000))

    // Mock AI analysis result with enhanced intelligence
    const mockResult = {
      title: "Temel Perdesi Paspayı Yetersizliği",
      description: `${transcribedText || "Donatılar kalıba çok yakın, yeterli paspayı bırakılmamış."}`,
      severity: "HIGH",
      weatherContext: "35°C (Aşırı Sıcak) - Beton dökümünde soğutma tedbirleri alınmalı.",
      expertAdvice: "Yapı Denetim/TS 500 Uyarısı: Temel altı ve toprakla temas eden perdelerde paspayı en az 50mm olmalıdır. Lütfen paspayı elemanlarını artırın.",
      location: "A Blok Temel",
      aiConfidenceScore: 0.95
    }

    return NextResponse.json(mockResult)
  } catch (error) {
    console.error("AI Assistant API error:", error)
    return NextResponse.json(
      { error: "Analiz sırasında hata oluştu" },
      { status: 500 }
    )
  }
}
