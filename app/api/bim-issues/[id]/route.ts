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
    const { status } = body

    const issue = await prisma.bimIssue.update({
      where: { id: resolvedParams.id },
      data: { status }
    })

    return NextResponse.json(issue)
  } catch (error) {
    console.error("Failed to update BIM issue:", error)
    return NextResponse.json({ error: "Failed to update issue" }, { status: 500 })
  }
}
