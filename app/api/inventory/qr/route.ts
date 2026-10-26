/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * QR Mikro Tüketim Döngüsü API with strict tenant isolation
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 });
    }

    const isSuperAdmin = session.user.role === "SUPER_ADMIN";
    const tenantId = (session.user as any)?.tenantId;

    const tenantWhere: any = {};
    if (!isSuperAdmin) {
      tenantWhere.tenantId = tenantId || "non-existent";
    }

    const { searchParams } = new URL(req.url);
    const qrCode = searchParams.get("qrCode");

    if (qrCode) {
      const item = await prisma.inventoryItem.findFirst({
        where: { qrCode, ...tenantWhere },
        include: {
          project: {
            select: { id: true, name: true },
          },
        },
      });

      if (!item) {
        return NextResponse.json(
          { error: "Bu QR koda ait malzeme envanterde bulunamadı." },
          { status: 404 }
        );
      }

      return NextResponse.json({ success: true, item });
    }

    // Tümü veya son tarananlar
    const items = await prisma.inventoryItem.findMany({
      where: tenantWhere,
      orderBy: { createdAt: "desc" },
      take: 50,
      include: {
        project: {
          select: { id: true, name: true },
        },
      },
    });

    return NextResponse.json({ success: true, items });
  } catch (error: any) {
    console.error("[INVENTORY_QR_GET_ERROR]", error);
    return NextResponse.json(
      { error: "Envanter verisi alınamadı.", details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 });
    }

    const isSuperAdmin = session.user.role === "SUPER_ADMIN";
    const tenantId = (session.user as any)?.tenantId;

    const body = await req.json();
    const {
      qrCode,
      materialName,
      quantity,
      unit,
      currentZone,
      status,
      assignedToId,
      projectId,
    } = body;

    if (!qrCode) {
      return NextResponse.json(
        { error: "QR kod değeri zorunludur." },
        { status: 400 }
      );
    }

    // 1. Önce var olan malzemeyi ara
    const existing = await prisma.inventoryItem.findFirst({
      where: { qrCode, ...(isSuperAdmin ? {} : { tenantId: tenantId || "non-existent" }) },
    });

    let updatedItem;

    if (existing) {
      // Güncelleme işlemi
      const isConsumed = (status || existing.status) === "CONSUMED";
      updatedItem = await prisma.inventoryItem.update({
        where: { id: existing.id },
        data: {
          currentZone: currentZone || existing.currentZone,
          status: status || existing.status,
          assignedToId: assignedToId !== undefined ? assignedToId : existing.assignedToId,
          consumedAt: isConsumed ? new Date() : (status === "IN_STOCK" ? null : existing.consumedAt),
          locationStatus: status || existing.locationStatus,
          quantity: quantity !== undefined ? Number(quantity) : existing.quantity,
          materialName: materialName || existing.materialName,
        },
        include: {
          project: {
            select: { id: true, name: true },
          },
        },
      });
    } else {
      // Yeni QR malzeme kaydı oluştur (Şantiye girişinde ambarda ilk etiketleme)
      updatedItem = await prisma.inventoryItem.create({
        data: {
          qrCode,
          materialName: materialName || "Yeni Malzeme",
          name: materialName || "Yeni Malzeme",
          quantity: quantity ? Number(quantity) : 1,
          unit: unit || "Adet",
          currentZone: currentZone || "MAIN_WAREHOUSE",
          status: status || "IN_STOCK",
          assignedToId: assignedToId || null,
          consumedAt: status === "CONSUMED" ? new Date() : null,
          projectId: projectId || null,
          tenantId: tenantId || null,
        },
        include: {
          project: {
            select: { id: true, name: true },
          },
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: "Malzeme başarıyla güncellendi.",
      item: updatedItem,
    });
  } catch (error: any) {
    console.error("[INVENTORY_QR_POST_ERROR]", error);
    return NextResponse.json(
      { error: "Malzeme güncellenemedi.", details: error.message },
      { status: 500 }
    );
  }
}
