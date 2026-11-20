import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { extractCadAndPdfMetrics } from "@/lib/cad-metric-extractor";

export const runtime = "nodejs";

/**
 * Node.js Server-Side CAD / DWG / DXF / Vector PDF Parsing API
 * Extracts real vector geometry (LINE, LWPOLYLINE, POLYLINE, ARC, CIRCLE),
 * normalizes coordinates to center (0, 0) in meters, and persists to database.
 * Completely isolates LibreDWG and Node built-ins from client-side bundles.
 */
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Yetkisiz işlem (Unauthorized)" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const { fileUrl, fileName, fileType, discipline, projectId } = body || {};

    if (!fileUrl || typeof fileUrl !== "string") {
      return NextResponse.json({ error: "fileUrl parametresi zorunludur." }, { status: 400 });
    }

    const cleanName = fileName || fileUrl.split("/").pop() || "cizim.dwg";
    const activeDiscipline = discipline || "Mimari";

    // 1. Run server-side CAD / DWG / DXF / PDF vector metric extraction
    const extraction = await extractCadAndPdfMetrics(
      fileUrl,
      cleanName,
      fileType,
      activeDiscipline
    );

    if (!extraction.success) {
      return NextResponse.json(
        {
          success: false,
          error: extraction.error || "DWG/CAD çizimi çözümlenemedi.",
          format: extraction.format,
        },
        { status: 422 }
      );
    }

    // 2. Persist to ProjectBlueprint if projectId is provided
    let blueprintRecordId: string | null = null;
    if (projectId) {
      try {
        const tenantId = (session.user as any)?.tenantId;
        const normalizedDiscipline = activeDiscipline.toUpperCase().includes("STATIK")
          ? "STATIK"
          : activeDiscipline.toUpperCase().includes("ELEKTRIK")
          ? "ELEKTRIK"
          : activeDiscipline.toUpperCase().includes("MEKANIK")
          ? "MEKANIK"
          : "MIMARI";

        const blueprint = await prisma.projectBlueprint.create({
          data: {
            projectId,
            title: cleanName,
            discipline: normalizedDiscipline,
            revisionNo: "R0",
            fileUrl,
            isCurrent: true,
            uploadedBy: session.user.name || session.user.email || "Sistem",
            tenantId: tenantId || null,
          },
        });
        blueprintRecordId = blueprint.id;
      } catch (dbErr) {
        console.warn("[/api/cad/parse-dwg] ProjectBlueprint kayıt uyarısı:", dbErr);
      }
    }

    return NextResponse.json({
      success: true,
      format: extraction.format,
      fileName: cleanName,
      fileUrl,
      metrics: extraction.metrics,
      layers: extraction.layers,
      vectors2D: extraction.vectors2D,
      elements3D: extraction.elements3D,
      rooms: extraction.rooms,
      blueprintRecordId,
    });
  } catch (err: any) {
    console.error("[/api/cad/parse-dwg] Critical Error:", err);
    return NextResponse.json(
      {
        success: false,
        error: err?.message || "Sunucu tarafında DWG/CAD çözümleme hatası.",
      },
      { status: 500 }
    );
  }
}

