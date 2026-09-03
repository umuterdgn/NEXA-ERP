/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * This code is the property of NXA Software.
 */

import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const workerId = searchParams.get("workerId")

    if (!workerId) {
      return NextResponse.json({ error: "Worker ID gerekli" }, { status: 400 })
    }

    const tasks = await prisma.task.findMany({
      where: {
        assignedTo: workerId
      },
      include: {
        project: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json(tasks)
  } catch (error) {
    console.error("Error fetching tasks:", error)
    return NextResponse.json({ error: "Görevler getirilirken hata oluştu" }, { status: 500 })
  }
}
