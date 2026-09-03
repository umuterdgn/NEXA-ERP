/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * This code is the property of NXA Software.
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const deductions = await prisma.deduction.findMany({
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
    const body = await request.json();
    const { subcontractorId, projectId, amount, reason, notes } = body;

    const deduction = await prisma.deduction.create({
      data: {
        subcontractorId,
        projectId: projectId || null,
        amount: parseFloat(amount),
        reason,
        notes: notes || null,
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
