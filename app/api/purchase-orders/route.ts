/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * This code is the property of NXA Software.
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { requestId, supplierName, unitPrice, totalPrice } = body;

    // Create purchase order
    const purchaseOrder = await prisma.purchaseOrder.create({
      data: {
        requestId,
        supplierName,
        unitPrice,
        totalPrice,
        approvedById: session.user.id,
      },
      include: {
        request: {
          include: {
            project: {
              select: { name: true },
            },
            requester: {
              select: { name: true },
            },
            purchaseOrders: true,
          },
        },
      },
    });

    // Update request status to APPROVED
    await prisma.materialRequest.update({
      where: { id: requestId },
      data: { status: "APPROVED" },
    });

    return NextResponse.json(purchaseOrder.request, { status: 201 });
  } catch (error) {
    console.error("Error creating purchase order:", error);
    return NextResponse.json(
      { error: "Satınalma siparişi oluşturulurken hata oluştu" },
      { status: 500 }
    );
  }
}

