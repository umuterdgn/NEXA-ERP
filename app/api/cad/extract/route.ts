import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { extractCadAndPdfMetrics } from "@/lib/cad-metric-extractor";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { fileUrl, fileName, fileType, discipline } = body || {};

    if (!fileUrl || typeof fileUrl !== "string") {
      return NextResponse.json({ error: "fileUrl gereklidir." }, { status: 400 });
    }

    const result = await extractCadAndPdfMetrics(fileUrl, fileName, fileType, discipline);
    return NextResponse.json(result, { status: 200 });
  } catch (err: any) {
    console.error("[/api/cad/extract] Error:", err);
    return NextResponse.json(
      {
        success: false,
        error: err?.message || "CAD/PDF geometri çözümleme hatası.",
      },
      { status: 500 }
    );
  }
}

