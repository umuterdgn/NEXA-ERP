/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * This code is the property of NXA Software.
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { deleteFileFromDrive } from "@/lib/google-drive";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const archiveId = resolvedParams.id;

    // 1. Önce veritabanından kaydı bul (Drive URL'sini almak için)
    const archiveRecord = await prisma.archive.findUnique({
      where: { id: archiveId }
    });

    if (!archiveRecord) {
      return NextResponse.json({ error: "Kayıt bulunamadı" }, { status: 404 });
    }

    // 2. Drive URL'sinden dosya ID'sini çıkart
    const fileIdMatch = archiveRecord.driveUrl.match(/\/d\/([a-zA-Z0-9_-]+)/);
    if (fileIdMatch && fileIdMatch[1]) {
      const driveFileId = fileIdMatch[1];
      // 3. Google Drive'dan kalıcı olarak sil
      await deleteFileFromDrive(driveFileId);
    }

    // 4. Veritabanından sil
    await prisma.archive.delete({
      where: { id: archiveId }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Archive delete error:", error);
    return NextResponse.json(
      { error: "Arşiv silinirken bir hata oluştu" },
      { status: 500 }
    );
  }
}
