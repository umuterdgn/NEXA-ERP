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
    const { element, status, notes, inspectorName } = body;

    const existing = await prisma.reinforcementInspection.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Kayıt bulunamadı!" }, { status: 404 });
    }

    const updatedInspection = await prisma.reinforcementInspection.update({
      where: { id },
      data: {
        element: element || undefined,
        status: status || undefined,
        notes: notes !== undefined ? notes : undefined,
        inspectorName: inspectorName !== undefined ? inspectorName : undefined,
      },
    });

    return NextResponse.json(updatedInspection);
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

    const existing = await prisma.reinforcementInspection.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Kayıt bulunamadı!" }, { status: 404 });
    }

    await prisma.reinforcementInspection.delete({ where: { id } });

    return NextResponse.json({ message: "Kayıt başarıyla silindi" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
