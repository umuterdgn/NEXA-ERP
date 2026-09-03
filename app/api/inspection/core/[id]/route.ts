/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * This code is the property of NXA Software.
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const body = await request.json();
    const { strength, status, reportUrl } = body;

    const existing = await prisma.concreteTest.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Kayıt bulunamadı! Lütfen tablodaki sahte verileri değil, gerçek bir kaydı güncelleyin." }, { status: 404 });
    }

    const updatedKarot = await prisma.concreteTest.update({
      where: { id },
      data: {
        day28Result: strength ? parseFloat(strength) : undefined,
        status: status || undefined,
        reportUrl: reportUrl !== undefined ? reportUrl : undefined,
      },
    });

    return NextResponse.json(updatedKarot);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    const existing = await prisma.concreteTest.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Kayıt bulunamadı!" }, { status: 404 });
    }

    await prisma.concreteTest.delete({ where: { id } });

    return NextResponse.json({ message: "Kayıt başarıyla silindi" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
