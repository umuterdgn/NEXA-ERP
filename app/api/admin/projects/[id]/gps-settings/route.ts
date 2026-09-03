/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * This code is the property of NXA Software.
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { gpsRequired, latitude, longitude, gpsRadius } = body;

    const updatedProject = await prisma.project.update({
      where: { id },
      data: {
        gpsRequired,
        latitude: latitude ? parseFloat(latitude) : null,
        longitude: longitude ? parseFloat(longitude) : null,
        gpsRadius: gpsRadius ? parseInt(gpsRadius) : 100
      }
    });

    return NextResponse.json(updatedProject);
  } catch (error) {
    console.error("GPS settings update error:", error);
    return NextResponse.json(
      { error: "GPS ayarları güncellenirken hata oluştu" },
      { status: 500 }
    );
  }
}
