/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * This code is the property of NXA Software.
 */

import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params
    
    const visitor = await prisma.visitorRecord.update({
      where: { id: resolvedParams.id },
      data: { checkOut: new Date() }
    })

    return NextResponse.json({
      message: "Ziyaretçi çıkışı yapıldı",
      visitor
    })
  } catch (error) {
    console.error("Visitor checkout error:", error)
    return NextResponse.json(
      { error: "Çıkış sırasında hata oluştu" },
      { status: 500 }
    )
  }
}