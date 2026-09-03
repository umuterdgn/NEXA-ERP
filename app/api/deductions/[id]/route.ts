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
    const { id } = await params;
    const body = await request.json();
    const { subcontractorId, projectId, amount, reason, notes } = body;

    const deduction = await prisma.deduction.update({
      where: { id },
      data: {
        subcontractorId: subcontractorId || undefined,
        projectId: projectId !== undefined ? (projectId || null) : undefined,
        amount: amount !== undefined ? parseFloat(amount) : undefined,
        reason: reason || undefined,
        notes: notes !== undefined ? (notes || null) : undefined,
      },
      include: {
        subcontractor: true,
        project: true,
      },
    });

    return NextResponse.json(deduction);
  } catch (error) {
    console.error("Error updating deduction:", error);
    return NextResponse.json(
      { error: "Kesinti güncellenirken hata oluştu" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.deduction.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting deduction:", error);
    return NextResponse.json(
      { error: "Kesinti silinirken hata oluştu" },
      { status: 500 }
    );
  }
}
