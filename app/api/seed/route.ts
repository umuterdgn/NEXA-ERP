/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Customer Demo & Presentation Seed Endpoint
 */

import { NextResponse } from "next/server";
import { seedDatabase } from "@/prisma/seed";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const result = await seedDatabase();
    return NextResponse.json(
      {
        success: true,
        message: "Demo ve müşteri sunumu verileri başarıyla yüklendi!",
        details: result,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Seed API Hatası:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Seed işlemi sırasında bir hata meydana geldi.",
      },
      { status: 500 }
    );
  }
}

export async function POST() {
  return GET();
}
