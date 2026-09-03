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
    const documents = await prisma.workerDocument.findMany({
      include: {
        subcontractor: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(documents);
  } catch (error) {
    console.error("Error fetching worker documents:", error);
    return NextResponse.json(
      { error: "İşçi evrakları getirilirken hata oluştu" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { subcontractorId, workerName, tcNo, sgkStatus, ohsTraining, medicalReport, notes } = body;

    const document = await prisma.workerDocument.create({
      data: {
        subcontractorId,
        workerName,
        tcNo: tcNo || null,
        sgkStatus: sgkStatus || false,
        ohsTraining: ohsTraining || false,
        medicalReport: medicalReport || false,
        notes: notes || null,
      },
      include: {
        subcontractor: true,
      },
    });

    return NextResponse.json(document, { status: 201 });
  } catch (error) {
    console.error("Error creating worker document:", error);
    return NextResponse.json(
      { error: "İşçi evrağı oluşturulurken hata oluştu" },
      { status: 500 }
    );
  }
}
