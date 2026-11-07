/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * This code is the property of NXA Software.
 */

import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

export async function GET(request: Request) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const isSuperAdmin = session.user.role === "SUPER_ADMIN"
    const tenantId = (session.user as any)?.tenantId

    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get("projectId")
    const status = searchParams.get("status")

    const where: any = {
      ...(projectId && { projectId }),
      ...(status && { status })
    }

    if (!isSuperAdmin) {
      where.tenantId = tenantId || "non-existent"
    }

    const tasks = await prisma.task.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        project: {
          select: {
            name: true,
            title: true
          }
        },
        profession: true
      }
    })

    // Fetch personnel data for tasks with assignedTo
    const personnelIds = tasks
      .map(task => task.assignedTo)
      .filter((id): id is string => id !== null)
    
    const personnelMap = new Map<string, any>()
    
    if (personnelIds.length > 0) {
      const personnelWhere: any = { id: { in: personnelIds } }
      if (!isSuperAdmin) {
        personnelWhere.tenantId = tenantId || "non-existent"
      }

      const personnel = await prisma.personel.findMany({
        where: personnelWhere,
        select: {
          id: true,
          name: true
        }
      })
      
      personnel.forEach(p => personnelMap.set(p.id, p))
    }

    // Attach personnel data to tasks
    const tasksWithPersonnel = tasks.map(task => ({
      ...task,
      worker: task.assignedTo ? personnelMap.get(task.assignedTo) : null
    }))

    return NextResponse.json(tasksWithPersonnel)
  } catch (error) {
    console.error("Error fetching tasks:", error)
    return NextResponse.json({ error: "Failed to fetch tasks" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const tenantId = (session.user as any)?.tenantId
    const body = await request.json()
    const {
      title,
      description,
      status = "BEKLİYOR",
      projectId,
      assignedTo,
      zoneId,
      location,
      priority = "ORTA",
      dueDate,
      taskType,
    } = body

    // 1. Prisma Task kaydı (status: "BEKLİYOR")
    const task = await prisma.task.create({
      data: {
        title,
        description: description
          ? location
            ? `${description}\nKonum: ${location}`
            : description
          : location
          ? `Konum: ${location}`
          : null,
        status: status || "BEKLİYOR",
        projectId: projectId || null,
        assignedTo: assignedTo || null,
        zoneId: zoneId || null,
        dueDate: dueDate ? new Date(dueDate) : null,
        taskType: taskType || (priority ? `Öncelik: ${priority}` : "Saha İmalatı"),
        tenantId: tenantId || null,
      },
      include: {
        project: { select: { name: true } },
        zone: { select: { name: true } },
      },
    })

    // 2. Anlık Bildirim (Expo Push Notifications / FCM Dispatch)
    try {
      const locationText = location || task.zone?.name || "Şantiye Sahası"
      await fetch("https://exp.host/--/api/v2/push/send", {
        method: "POST",
        headers: {
          "Accept": "application/json",
          "Accept-Encoding": "gzip, deflate",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          to: "ExponentPushToken[nexa_field_ops_channel]",
          title: `⚡ Yeni İş Emri: ${title}`,
          body: `${locationText} mahaline yeni bir iş emri atandı. Öncelik: ${priority}. Lütfen mobil uygulamanızdan kontrol ediniz.`,
          sound: "default",
          priority: "high",
          data: {
            taskId: task.id,
            title,
            priority,
            location: locationText,
            assignedTo,
          },
        }),
      }).catch(() => null)
    } catch (pushErr) {
      // Offline / standalone push notification fallback
    }

    return NextResponse.json(task)
  } catch (error) {
    console.error("Error creating task:", error)
    return NextResponse.json({ error: "Failed to create task" }, { status: 500 })
  }
}
