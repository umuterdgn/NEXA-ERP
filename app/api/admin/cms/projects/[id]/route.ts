/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * This code is the property of NXA Software.
 */

import { NextResponse } from "next/server"
import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params

    await prisma.portfolioProject.delete({
      where: { id }
    })

    revalidatePath("/")
    revalidatePath("/projelerimiz")

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("CMS project delete error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
