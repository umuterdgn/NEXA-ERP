/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * This code is the property of NXA Software.
 */

import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    const userRole = session?.user?.role
    const isSuperAdmin = userRole === "SUPER_ADMIN"
    const tenantId = (session?.user as any)?.tenantId as string | undefined

    if (!session?.user || (!tenantId && !isSuperAdmin)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const resolvedParams = await params

    if (!isSuperAdmin) {
      const existing = await prisma.contract.findFirst({
        where: { id: resolvedParams.id, tenantId }
      })
      if (!existing) {
        return NextResponse.json({ error: "Contract not found or access denied" }, { status: 404 })
      }
    }

    await prisma.contract.delete({
      where: { id: resolvedParams.id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting contract:", error)
    return NextResponse.json({ error: "Failed to delete contract" }, { status: 500 })
  }
}