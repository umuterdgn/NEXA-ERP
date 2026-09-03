/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * This code is the property of NXA Software.
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

// RAPORU SİL (DELETE)
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    
    await prisma.inspectionReport.delete({
      where: { id },
    });
    
    return NextResponse.json({ message: "Rapor başarıyla silindi." }, { status: 200 });
  } catch (error) {
    console.error("Silme hatası:", error);
    return NextResponse.json({ error: "Silme işlemi başarısız" }, { status: 500 });
  }
}

// RAPORU GÜNCELLE (PATCH)
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    
    // Gelen veri içinden güncellenebilecek alanları seç
    const { title, description } = body;
    
    const updatedReport = await prisma.inspectionReport.update({
      where: { id },
      data: {
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
      },
    });
    
    return NextResponse.json(updatedReport, { status: 200 });
  } catch (error) {
    console.error("Güncelleme hatası:", error);
    return NextResponse.json({ error: "Güncelleme işlemi başarısız" }, { status: 500 });
  }
}
