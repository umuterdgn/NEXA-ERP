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
    const userRole = session?.user?.role as string;
    const isSuperAdmin = userRole === "SUPER_ADMIN";
    const tenantId = (session?.user as any)?.tenantId as string | undefined;

    if (!session?.user || (!tenantId && !isSuperAdmin)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    if (!isSuperAdmin) {
      const existing = await prisma.inspectionReport.findFirst({
        where: { id, tenantId }
      });
      if (!existing) {
        return NextResponse.json({ error: "Rapor bulunamadı veya yetkisiz erişim" }, { status: 404 });
      }
    }
    
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
    const userRole = session?.user?.role as string;
    const isSuperAdmin = userRole === "SUPER_ADMIN";
    const tenantId = (session?.user as any)?.tenantId as string | undefined;

    if (!session?.user || (!tenantId && !isSuperAdmin)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    if (!isSuperAdmin) {
      const existing = await prisma.inspectionReport.findFirst({
        where: { id, tenantId }
      });
      if (!existing) {
        return NextResponse.json({ error: "Rapor bulunamadı veya yetkisiz erişim" }, { status: 404 });
      }
    }

    const body = await req.json();
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
