/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Nexa ERP - Telsiz Ses Kaydı Yükleme API'si
 */

import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get("content-type") || "";

    let fileBuffer: Buffer | null = null;
    let extension = "m4a";

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const file = formData.get("file") as File | null;
      if (!file) {
        return NextResponse.json({ error: "Ses dosyası bulunamadı" }, { status: 400 });
      }
      const bytes = await file.arrayBuffer();
      fileBuffer = Buffer.from(bytes);
      const name = file.name || "recording.m4a";
      if (name.includes(".")) {
        extension = name.split(".").pop() || "m4a";
      }
    } else {
      // JSON Base64 formatı
      const body = await request.json();
      if (!body.audioBase64) {
        return NextResponse.json({ error: "audioBase64 alanı gereklidir" }, { status: 400 });
      }
      fileBuffer = Buffer.from(body.audioBase64, "base64");
      if (body.extension) {
        extension = body.extension;
      }
    }

    const uploadDir = path.join(process.cwd(), "public", "uploads");
    await mkdir(uploadDir, { recursive: true });

    const fileName = `radio-${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${extension}`;
    const filePath = path.join(uploadDir, fileName);

    await writeFile(filePath, fileBuffer);

    const audioUrl = `/uploads/${fileName}`;

    return NextResponse.json({
      success: true,
      audioUrl,
      fileName,
    });
  } catch (error: any) {
    console.error("[Upload Audio Error]:", error);
    return NextResponse.json(
      { error: "Ses kaydı yüklenemedi: " + error.message },
      { status: 500 }
    );
  }
}
