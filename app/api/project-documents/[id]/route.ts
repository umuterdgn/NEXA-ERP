/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * This code is the property of NXA Software.
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const body = await request.json();
    const { status } = body;

    const document = await prisma.projectDocument.update({
      where: { id: resolvedParams.id },
      data: { status },
      include: {
        uploadedBy: {
          select: { name: true },
        },
      },
    });

    return NextResponse.json(document);
  } catch (error) {
    console.error("Error updating project document:", error);
    return NextResponse.json(
      { error: "Proje dokümanı güncellenirken hata oluştu" },
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

    await prisma.projectDocument.delete({
      where: { id: resolvedParams.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting project document:", error);
    return NextResponse.json(
      { error: "Proje dokümanı silinirken hata oluştu" },
      { status: 500 }
    );
  }
}
