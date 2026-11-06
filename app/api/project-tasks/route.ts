/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * This code is the property of NXA Software.
 * Gantt Görevleri & BoQ İmalat Takvimi API'si
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

    if (tasks.length > 0) {
      return NextResponse.json(tasks);
    }

    // Bütünleşik Gantt Entegrasyonu:
    // Eğer projede manuel ProjectTask yoksa ancak BoqItem (Poz) kalemleri varsa,
    // BoqItem kayıtlarını Gantt şemasına aktararak dinamik ilerleme sağla.
    if (projectId) {
      const boqItems = await prisma.boqItem.findMany({
        where: { projectId },
        orderBy: { pozNo: 'asc' },
      });

      if (boqItems.length > 0) {
        const now = new Date();
        const formattedBoqTasks = boqItems.map((item, idx) => {
          const start = item.startDate ? new Date(item.startDate) : new Date(now.getTime() + idx * 7 * 86400000);
          const end = item.endDate ? new Date(item.endDate) : new Date(start.getTime() + 14 * 86400000);
          const progress = item.plannedQuantity > 0
            ? Math.min(100, Math.round((item.actualQuantity / item.plannedQuantity) * 100))
            : 0;

          return {
            id: item.id,
            name: `${item.pozNo} - ${item.description}`,
            startDate: start.toISOString(),
            endDate: end.toISOString(),
            progress,
            notes: `Poz No: ${item.pozNo} | Birim: ${item.unit} | Planlanan: ${item.plannedQuantity} | Gerçekleşen: ${item.actualQuantity}`,
            assignedTo: null,
          };
        });

        return NextResponse.json(formattedBoqTasks);
      }
    }

    return NextResponse.json([]);
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
