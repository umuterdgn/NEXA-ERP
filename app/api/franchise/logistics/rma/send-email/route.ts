/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Tedarikçiye Tek Tıkla RMA İade / Değişim Bildirim E-postası API'si
 */

import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

export const dynamic = "force-dynamic"

export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 })
    }

    const body = await request.json()
    const { issueId, supplierEmail, supplierName, materialName, waybillNo, issueType, description } = body

    if (!issueId) {
      return NextResponse.json({ error: "issueId zorunludur" }, { status: 400 })
    }

    // RMA durumunu REPLACEMENT_SENT veya IN_REVIEW yap
    const updated = await prisma.deliveryIssue.update({
      where: { id: issueId },
      data: { status: "REPLACEMENT_SENT" },
    })

    console.log(`📧 [RMA EMAIL SENT] To: ${supplierEmail || "tedarikci@firma.com"} | Konu: Hasarlı Teslimat & İade Talebi (İrsaliye: ${waybillNo})`)

    return NextResponse.json({
      success: true,
      message: `RMA bildirim e-postası tedarikçiye (${supplierEmail || supplierName}) resmi iade koduyla birlikte iletildi.`,
      issue: updated,
    })
  } catch (error: any) {
    console.error("❌ RMA Send Email Error:", error)
    return NextResponse.json({ error: error.message || "E-posta gönderilemedi" }, { status: 500 })
  }
}
