/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Çevre ve Şehircilik Bakanlığı e-YİBF Senkronizasyon Botu (Simülasyon / Mock API)
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { yibfNo, projectId } = body;

    // 1. Projeyi bul
    let targetProject = null;

    if (projectId) {
      targetProject = await prisma.project.findUnique({
        where: { id: projectId }
      });
    } else if (yibfNo) {
      targetProject = await prisma.project.findFirst({
        where: { yibfNo }
      });
    }

    if (!targetProject) {
      // Eğer parametre verilmediyse veya bulunamadıysa en güncel projeyi al
      targetProject = await prisma.project.findFirst({
        orderBy: { createdAt: "desc" }
      });
    }

    if (!targetProject) {
      return NextResponse.json(
        { error: "Senkronize edilecek proje bulunamadı." },
        { status: 404 }
      )
    }

    // 2. Bakanlık e-YİBF Veri Simülasyonu (Bakanlık Botu)
    const effectiveYibfNo = yibfNo || targetProject.yibfNo || `${Math.floor(14000 + Math.random() * 59000)}`;

    const possibleStatuses = [
      "Aktif Şantiye (Kaba Yapı)",
      "Ruhsat Bekliyor",
      "Demir/Donatı Vizesi Onaylandı",
      "Beton Dökümü İzni Verildi",
      "İnce İşler ve Tesisat",
      "İskan ve Yapı Kullanım Aşaması"
    ];

    const possibleClasses = ["III-B", "IV-A", "IV-B", "V-A"];
    
    // YİBF numarasına göre deterministik ama dinamik alan hesaplama
    const seedNum = parseInt(effectiveYibfNo.replace(/\D/g, "")) || 14582;
    const totalArea = 2500 + (seedNum % 9500) + Math.floor(Math.random() * 250);
    const yibfStatus = possibleStatuses[seedNum % possibleStatuses.length];
    const yapiSinifi = possibleClasses[seedNum % possibleClasses.length];
    const ada = targetProject.ada || `${100 + (seedNum % 800)}`;
    const parsel = targetProject.parsel || `${1 + (seedNum % 45)}`;

    // 3. Proje kaydını güncelle
    const updatedProject = await prisma.project.update({
      where: { id: targetProject.id },
      data: {
        yibfNo: effectiveYibfNo,
        totalArea,
        yibfStatus,
        lastYibfSync: new Date(),
        yapiSinifi,
        ada,
        parsel,
        progress: targetProject.progress || 35
      }
    });

    console.log(`[YİBF BOTU] Proje #${updatedProject.id} (YİBF ${effectiveYibfNo}) bakanlık verileriyle senkronize edildi.`);

    return NextResponse.json({
      success: true,
      message: `Çevre ve Şehircilik Bakanlığı e-YİBF sistemiyle senkronize edildi (YİBF #${effectiveYibfNo})`,
      data: {
        projectId: updatedProject.id,
        projectName: updatedProject.name || updatedProject.title,
        yibfNo: effectiveYibfNo,
        totalArea: updatedProject.totalArea,
        yibfStatus: updatedProject.yibfStatus,
        lastYibfSync: updatedProject.lastYibfSync,
        yapiSinifi: updatedProject.yapiSinifi,
        ada: updatedProject.ada,
        parsel: updatedProject.parsel,
        syncProtocol: "Bakanlık e-YİBF Web Servisi v4.2 (Mock/SSL)"
      }
    });
  } catch (error: any) {
    console.error("YİBF Sync Bot hatası:", error);
    return NextResponse.json(
      { error: error.message || "YİBF senkronizasyonu sırasında hata oluştu" },
      { status: 500 }
    );
  }
}

// GET: Son YİBF Senkronizasyon Durumu Sorgulama
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId");
    const yibfNo = searchParams.get("yibfNo");

    const where: any = {};
    if (projectId) where.id = projectId;
    if (yibfNo) where.yibfNo = yibfNo;

    const project = await prisma.project.findFirst({
      where,
      select: {
        id: true,
        name: true,
        title: true,
        yibfNo: true,
        totalArea: true,
        yibfStatus: true,
        lastYibfSync: true,
        yapiSinifi: true,
        ada: true,
        parsel: true
      }
    });

    if (!project) {
      return NextResponse.json({ error: "Proje bulunamadı" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      project
    });
  } catch (error) {
    return NextResponse.json(
      { error: "YİBF sorgulanırken hata oluştu" },
      { status: 500 }
    );
  }
}
