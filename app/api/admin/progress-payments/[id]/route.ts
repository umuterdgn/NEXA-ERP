/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * This code is the property of NXA Software.
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const body = await request.json();
    const { status } = body;

    if (!status || !["BEKLIYOR", "ONAYLANDI", "REDDEDILDI"].includes(status)) {
      return NextResponse.json(
        { error: "Geçersiz durum" },
        { status: 400 }
      );
    }

    const payment = await prisma.progressPayment.update({
      where: { id: resolvedParams.id },
      data: { status }
    });

    // Eğer onaylandıysa otomatik olarak finans kaydı oluştur
    if (status === "ONAYLANDI") {
      await prisma.transaction.create({
        data: {
          type: "GIDER",
          amount: payment.totalPrice || 0,
          description: `Hakediş: ${payment.title}`,
          category: "HAKEDIS",
          date: new Date()
        }
      });
    }

    return NextResponse.json(payment);
  } catch (error) {
    console.error("Error updating progress payment:", error);
    return NextResponse.json(
      { error: "Hakediş güncellenirken hata oluştu" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    
    await prisma.progressPayment.delete({
      where: { id: resolvedParams.id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting progress payment:", error);
    return NextResponse.json(
      { error: "Hakediş silinirken hata oluştu" },
      { status: 500 }
    );
  }
}