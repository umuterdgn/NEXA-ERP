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
    const { title, description, status, projectId, assignedTo, dueDate, taskType } = body

    const task = await prisma.task.create({
      data: {
        title,
        description,
        status: status || "TODO",
        projectId,
        assignedTo,
        dueDate: dueDate ? new Date(dueDate) : null,
        taskType,
        tenantId: tenantId || null
      }
    })

    return NextResponse.json(task)
  } catch (error) {
    console.error("Error creating task:", error)
    return NextResponse.json({ error: "Failed to create task" }, { status: 500 })
  }
}
