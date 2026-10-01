/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * This code is the property of NXA Software.
 */

import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params
    const contract = await prisma.contract.delete({
      where: { id: resolvedParams.id }
    })

    return NextResponse.json(contract)
  } catch (error) {
    console.error("Failed to delete contract:", error)
    return NextResponse.json(
      { error: "Sözleşme silinirken hata oluştu" },
      { status: 500 }
    )
  }
}
