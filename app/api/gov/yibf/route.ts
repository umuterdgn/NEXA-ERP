/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * T.C. Çevre, Şehircilik ve İklim Değişikliği Bakanlığı
 * YİBF & UYDS Veri Çekme Motoru (Standart Next.js App Router HTTP Rotaları)
 */

import { NextResponse } from "next/server"
import { fetchYibfMockData } from "@/lib/services/yibf-mock"

export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const yibfNo = searchParams.get("yibfNo")

    if (!yibfNo || !yibfNo.trim()) {
      return NextResponse.json(
        { success: false, error: "Geçerli bir YİBF Numarası girilmelidir." },
        { status: 400 }
      )
    }

    const data = await fetchYibfMockData(yibfNo)

    return NextResponse.json({
      success: true,
      data,
    })
  } catch (error) {
    console.error("YİBF Bakanlık API Hatası:", error)
    return NextResponse.json(
      { success: false, error: "Bakanlık sistemine bağlanırken hata oluştu." },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}))
    const yibfNo = body.yibfNo

    if (!yibfNo || !String(yibfNo).trim()) {
      return NextResponse.json(
        { success: false, error: "Geçerli bir YİBF Numarası girilmelidir." },
        { status: 400 }
      )
    }

    const data = await fetchYibfMockData(String(yibfNo))

    return NextResponse.json({
      success: true,
      data,
    })
  } catch (error) {
    console.error("YİBF Bakanlık API Hatası:", error)
    return NextResponse.json(
      { success: false, error: "Bakanlık sistemine bağlanırken hata oluştu." },
      { status: 500 }
    )
  }
}
