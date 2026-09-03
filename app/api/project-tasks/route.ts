/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * This code is the property of NXA Software.
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId");

    const where: any = {};
    if (projectId) where.projectId = projectId;

    const tasks = await prisma.projectTask.findMany({
      where,
      include: {
        assignedTo: {
          select: { name: true },
        },
      },
      orderBy: {
        startDate: 'asc',
      },
    });

    return NextResponse.json(tasks);
  } catch (error) {
    console.error("Error fetching project tasks:", error);
    return NextResponse.json(
      { error: "Proje görevleri getirilirken hata oluştu" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { projectId, name, startDate, endDate, progress, dependencies, notes, assignedToId } = body;

    const task = await prisma.projectTask.create({
      data: {
        projectId,
        name,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        progress: progress || 0,
        dependencies: dependencies || null,
        notes: notes || null,
        assignedToId: assignedToId || null,
      },
      include: {
        assignedTo: {
          select: { name: true },
        },
      },
    });

    return NextResponse.json(task, { status: 201 });
  } catch (error) {
    console.error("Error creating project task:", error);
    return NextResponse.json(
      { error: "Proje görevi oluşturulurken hata oluştu" },
      { status: 500 }
    );
  }
}
