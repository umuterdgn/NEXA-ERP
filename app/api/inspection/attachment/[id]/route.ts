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
    const { title, location, description, createdBy } = body;

    const existing = await prisma.attachmentEvidence.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Kayıt bulunamadı!" }, { status: 404 });
    }

    const updatedAttachment = await prisma.attachmentEvidence.update({
      where: { id },
      data: {
        title: title || undefined,
        location: location || undefined,
        description: description !== undefined ? description : undefined,
        createdBy: createdBy !== undefined ? createdBy : undefined,
      },
    });

    return NextResponse.json(updatedAttachment);
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

    const existing = await prisma.attachmentEvidence.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Kayıt bulunamadı!" }, { status: 404 });
    }

    await prisma.attachmentEvidence.delete({ where: { id } });

    return NextResponse.json({ message: "Kayıt başarıyla silindi" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
