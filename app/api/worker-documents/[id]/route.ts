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
    const { subcontractorId, workerName, tcNo, sgkStatus, ohsTraining, medicalReport, notes } = body;

    const document = await prisma.workerDocument.update({
      where: { id },
      data: {
        subcontractorId: subcontractorId || undefined,
        workerName: workerName || undefined,
        tcNo: tcNo !== undefined ? tcNo : undefined,
        sgkStatus: sgkStatus !== undefined ? sgkStatus : undefined,
        ohsTraining: ohsTraining !== undefined ? ohsTraining : undefined,
        medicalReport: medicalReport !== undefined ? medicalReport : undefined,
        notes: notes !== undefined ? notes : undefined,
      },
      include: {
        subcontractor: true,
      },
    });

    return NextResponse.json(document);
  } catch (error) {
    console.error("Error updating worker document:", error);
    return NextResponse.json(
      { error: "İşçi evrağı güncellenirken hata oluştu" },
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
    await prisma.workerDocument.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting worker document:", error);
    return NextResponse.json(
      { error: "İşçi evrağı silinirken hata oluştu" },
      { status: 500 }
    );
  }
}
