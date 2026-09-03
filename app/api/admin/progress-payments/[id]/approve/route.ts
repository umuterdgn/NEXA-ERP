/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * This code is the property of NXA Software.
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const payment = await prisma.progressPayment.findUnique({ where: { id } });
    
    if (!payment || payment.status === "ONAYLANDI") {
      return NextResponse.json({ error: "Hakediş bulunamadı veya zaten onaylı." }, { status: 400 });
    }

    // 1. Hakedişin durumunu ONAYLANDI yap
    // 2. Finans (Kasa) tablosuna otomatik "Gider" olarak işle (MÜKEMMEL ERP OTOMASYONU)
    const result = await prisma.$transaction(async (tx) => {
      const updatedPayment = await tx.progressPayment.update({
        where: { id },
        data: { status: "ONAYLANDI" }
      });

      await tx.transaction.create({
        data: {
          type: "GIDER",
          category: "Taşeron Hakediş",
          amount: updatedPayment.totalPrice || 0,
          description: `${updatedPayment.title} Hakediş Ödemesi`,
          date: new Date()
        }
      });
      return updatedPayment;
    });

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: "Onaylama işlemi başarısız oldu." }, { status: 500 });
  }
}
