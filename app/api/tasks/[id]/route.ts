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
    const { id } = await params
    const body = await request.json()
    const { status } = body

    if (!status || !["TODO", "IN_PROGRESS", "DONE"].includes(status)) {
      return NextResponse.json({ error: "Geçersiz durum" }, { status: 400 })
    }

    const task = await prisma.task.update({
      where: { id },
      data: {
        status,
        ...(body.completionPhoto ? { completionPhoto: body.completionPhoto } : {})
      }
    })

    // ADIM 4: Taşeron işi tamamladığında bağlı Punch List otomatik "Çözüldü - Onay Bekliyor" (FIXED) olur
    try {
      if (status === "DONE" || status === "COMPLETED") {
        if (task.punchListId) {
          await prisma.punchList.updateMany({
            where: { id: task.punchListId },
            data: {
              status: "FIXED",
              photoUrl: body.completionPhoto || task.completionPhoto || undefined
            }
          })
        } else {
          await prisma.punchList.updateMany({
            where: { taskId: task.id },
            data: {
              status: "FIXED",
              photoUrl: body.completionPhoto || task.completionPhoto || undefined
            }
          })
        }
      }
    } catch (punchErr) {
      console.warn("Task [id] to PunchList sync fallback:", punchErr)
    }

    return NextResponse.json(task)
  } catch (error) {
    console.error("Error updating task:", error)
    return NextResponse.json({ error: "Görev güncellenemedi" }, { status: 500 })
  }
}
