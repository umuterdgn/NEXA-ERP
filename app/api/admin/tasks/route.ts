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
    const projectId = searchParams.get("projectId")
    const status = searchParams.get("status")

    const tasks = await prisma.task.findMany({
      where: {
        ...(projectId && { projectId }),
        ...(status && { status })
      },
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
      const personnel = await prisma.personel.findMany({
        where: {
          id: { in: personnelIds }
        },
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
        taskType
      }
    })

    return NextResponse.json(task)
  } catch (error) {
    console.error("Error creating task:", error)
    return NextResponse.json({ error: "Failed to create task" }, { status: 500 })
  }
}
