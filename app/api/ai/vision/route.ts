/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * This code is the property of NXA Software.
 */

import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, image } = body;

    // Simulate processing delay
    await new Promise((resolve) => setTimeout(resolve, 1500));

    if (type === "DOCUMENT") {
      // Mock OCR response for documents
      return NextResponse.json({
        success: true,
        data: {
          documentType: "Zemin Etüdü",
          yibf: "14582",
          date: "2026-08-20",
          extractedText: "ZEMİN ETÜD RAPORU\nYİBF No: 14582\nTarih: 20.08.2026\n\nZemin taşıma gücü: 150 kN/m²\nOturma miktarı: 2.5 cm\nÖnerilen temel tipi: Radye temel",
          confidence: 0.92,
        },
      });
    } else if (type === "SITE_PHOTO") {
      // Mock Vision response for site photos
      const mockDefects = [
        {
          hasDefect: true,
          defectType: "Çatlak",
          confidence: 0.88,
          message: "Dikkat: Kolon yüzeyinde %88 olasılıkla çatlak tespit edildi.",
          location: "Kolon C12",
          severity: "HIGH",
        },
        {
          hasDefect: true,
          defectType: "Segregasyon",
          confidence: 0.76,
          message: "Beton yüzeyinde %76 olasılıkla segregasyon tespit edildi.",
          location: "Kiriş K5",
          severity: "MEDIUM",
        },
        {
          hasDefect: false,
          defectType: null,
          confidence: 0.95,
          message: "Yapı elemanı normal görünüyor. Kritik kusur tespit edilmedi.",
          location: "Duvar D3",
          severity: "NONE",
        },
      ];

      // Randomly select one for variety
      const randomDefect = mockDefects[Math.floor(Math.random() * mockDefects.length)];

      return NextResponse.json({
        success: true,
        data: randomDefect,
      });
    } else {
      return NextResponse.json(
        { success: false, error: "Invalid type. Must be 'DOCUMENT' or 'SITE_PHOTO'" },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("AI Vision API error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
