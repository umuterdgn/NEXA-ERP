/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * This code is the property of NXA Software.
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const requests = await prisma.materialRequest.findMany({
      include: {
        project: {
          select: { name: true },
        },
        requester: {
          select: { name: true },
        },
        purchaseOrders: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(requests);
  } catch (error) {
    console.error("Error fetching material requests:", error);
    return NextResponse.json(
      { error: "Malzeme talepleri getirilirken hata oluştu" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { projectId, requesterId, itemName, quantity, unit, urgency, notes } = body;

    const materialRequest = await prisma.materialRequest.create({
      data: {
        projectId,
        requesterId,
        itemName,
        quantity,
        unit,
        urgency,
        notes: notes || null,
        status: "PENDING",
      },
      include: {
        project: {
          select: { name: true },
        },
        requester: {
          select: { name: true },
        },
      },
    });

    return NextResponse.json(materialRequest, { status: 201 });
  } catch (error) {
    console.error("Error creating material request:", error);
    return NextResponse.json(
      { error: "Malzeme talebi oluşturulurken hata oluştu" },
      { status: 500 }
    );
  }
}
