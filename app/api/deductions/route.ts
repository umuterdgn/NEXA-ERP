/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * This code is the property of NXA Software.
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await auth();
    const userRole = session?.user?.role;
    const isSuperAdmin = userRole === "SUPER_ADMIN";
    const tenantId = (session?.user as any)?.tenantId as string | undefined;

    if (!session?.user || (!tenantId && !isSuperAdmin)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const whereClause: any = !isSuperAdmin ? (tenantId ? { tenantId } : { tenantId: "non-existent" }) : {};

    const deductions = await prisma.deduction.findMany({
      where: whereClause,
      include: {
        subcontractor: true,
        project: true,
      },
      orderBy: {
        date: 'desc',
      },
    });

    return NextResponse.json(deductions);
  } catch (error) {
    console.error("Error fetching deductions:", error);
    return NextResponse.json(
      { error: "Kesintiler getirilirken hata oluştu" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    const userRole = session?.user?.role;
    const isSuperAdmin = userRole === "SUPER_ADMIN";
    const tenantId = (session?.user as any)?.tenantId as string | undefined;

    if (!session?.user || (!tenantId && !isSuperAdmin)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { subcontractorId, projectId, amount, reason, notes } = body;

    const deduction = await prisma.deduction.create({
      data: {
        subcontractorId,
        projectId: projectId || null,
        amount: parseFloat(amount),
        reason,
        notes: notes || null,
        tenantId: tenantId || null,
      },
      include: {
        subcontractor: true,
        project: true,
      },
    });

    return NextResponse.json(deduction, { status: 201 });
  } catch (error) {
    console.error("Error creating deduction:", error);
    return NextResponse.json(
      { error: "Kesinti oluşturulurken hata oluştu" },
      { status: 500 }
    );
  }
}
