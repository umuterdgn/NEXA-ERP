/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Karot & Numune Detay, Durum Güncelleme ve Silme API
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Hem ID ile hem de QR kodu ile sorgulamayı destekle
    const sample = await prisma.coreSample.findFirst({
      where: {
        OR: [{ id }, { qrCode: id }],
      },
      include: {
        project: {
          select: {
            id: true,
            title: true,
            name: true,
            yibfNo: true,
            totalArea: true,
            yibfStatus: true,
            city: true,
            district: true,
          },
        },
        takenBy: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
    });

    if (!sample) {
      return NextResponse.json(
        { error: "Numune kaydı bulunamadı" },
        { status: 404 }
      );
    }

    return NextResponse.json(sample);
  } catch (error) {
    console.error("CoreSample [id] GET error:", error);
    return NextResponse.json(
      { error: "Numune bilgisi alınamadı" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const {
      status,
      resultStrength,
      isPassed,
      testedAt,
      reportFileUrl,
      location,
      notes,
    } = body;

    const existing = await prisma.coreSample.findFirst({
      where: {
        OR: [{ id }, { qrCode: id }],
      },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Güncellenecek numune bulunamadı" },
        { status: 404 }
      );
    }

    const updated = await prisma.coreSample.update({
      where: { id: existing.id },
      data: {
        ...(status !== undefined && { status }),
        ...(resultStrength !== undefined && {
          resultStrength: resultStrength !== null ? parseFloat(resultStrength) : null,
        }),
        ...(isPassed !== undefined && { isPassed }),
        ...(testedAt !== undefined && {
          testedAt: testedAt ? new Date(testedAt) : null,
        }),
        ...(reportFileUrl !== undefined && { reportFileUrl }),
        ...(location !== undefined && { location }),
        ...(notes !== undefined && { notes }),
      },
      include: {
        project: {
          select: {
            id: true,
            title: true,
            name: true,
            yibfNo: true,
          },
        },
        takenBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error("CoreSample [id] PATCH error:", error);
    return NextResponse.json(
      { error: error.message || "Numune güncellenirken hata oluştu" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const existing = await prisma.coreSample.findFirst({
      where: {
        OR: [{ id }, { qrCode: id }],
      },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Silinecek numune bulunamadı" },
        { status: 404 }
      );
    }

    await prisma.coreSample.delete({
      where: { id: existing.id },
    });

    return NextResponse.json({ success: true, message: "Numune silindi" });
  } catch (error) {
    console.error("CoreSample [id] DELETE error:", error);
    return NextResponse.json(
      { error: "Numune silinirken hata oluştu" },
      { status: 500 }
    );
  }
}
