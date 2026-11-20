/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * POST /api/mobile/auth/logout
 * Mobil Çıkış ve Cihaz Push Token İptali
 */

import { NextResponse } from "next/server"
import { getMobileAuth } from "@/lib/mobile-auth"
import { prisma } from "@/lib/prisma"

export const runtime = "nodejs"

export async function POST(request: Request) {
  try {
    const auth = await getMobileAuth(request)
    if (!auth) {
      return NextResponse.json({ error: "Yetkisiz oturum." }, { status: 401 })
    }

    await prisma.user
      .update({
        where: { id: auth.userId },
        data: { pushToken: null },
      })
      .catch(() => {})

    return NextResponse.json({
      success: true,
      message: "Başarıyla çıkış yapıldı.",
    })
  } catch {
    return NextResponse.json({ error: "Çıkış işlemi başarısız." }, { status: 500 })
  }
}
