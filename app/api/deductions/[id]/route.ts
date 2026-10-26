/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * This code is the property of NXA Software.
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export const dynamic = 'force-dynamic';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    const userRole = session?.user?.role;
    const isSuperAdmin = userRole === "SUPER_ADMIN";
    const tenantId = (session?.user as any)?.tenantId as string | undefined;

    if (!session?.user || (!tenantId && !isSuperAdmin)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    if (!isSuperAdmin) {
      const existing = await prisma.deduction.findFirst({
        where: { id, tenantId }
      });
      if (!existing) {
        return NextResponse.json({ error: "Deduction not found or access denied" }, { status: 404 });
      }
    }

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
    const session = await auth();
    const userRole = session?.user?.role;
    const isSuperAdmin = userRole === "SUPER_ADMIN";
    const tenantId = (session?.user as any)?.tenantId as string | undefined;

    if (!session?.user || (!tenantId && !isSuperAdmin)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    if (!isSuperAdmin) {
      const existing = await prisma.deduction.findFirst({
        where: { id, tenantId }
      });
      if (!existing) {
        return NextResponse.json({ error: "Deduction not found or access denied" }, { status: 404 });
      }
    }

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
