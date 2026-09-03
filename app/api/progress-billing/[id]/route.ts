/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * This code is the property of NXA Software.
 */

import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params
    const body = await request.json()
    const { status, totalAmount, notes } = body

    const billing = await prisma.progressBilling.update({
      where: { id: resolvedParams.id },
      data: {
        ...(status && { status }),
        ...(totalAmount !== undefined && { totalAmount }),
        ...(notes !== undefined && { notes })
      }
    })

    return NextResponse.json(billing)
  } catch (error) {
    console.error("Failed to update progress billing:", error)
    return NextResponse.json({ error: "Failed to update billing" }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params
    await prisma.progressBilling.delete({
      where: { id: resolvedParams.id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Failed to delete progress billing:", error)
    return NextResponse.json({ error: "Failed to delete billing" }, { status: 500 })
  }
}
