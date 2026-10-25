/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Bakanlık Sistemleri (UYDS, EBİS, YAMBİS, MAKS) Server Actions
 */

"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { fetchYibfData, syncEbisCoreSample, YibfProjectGovData, EbisCoreSampleGovData } from "@/lib/services/gov-api";

interface SessionUserExtended {
  id?: string;
  tenantId?: string | null;
}

/**
 * Kullanıcıdan yalnızca YİBF Numarası alarak Bakanlık sistemlerinden
 * (UYDS, MAKS, YAMBİS) veriyi çeker ve otonom olarak sisteme Project kaydı oluşturur.
 */
export async function createProjectFromYibf(yibfNo: string) {
  try {
    const cleanYibf = yibfNo?.trim();
    if (!cleanYibf) {
      return { success: false, error: "Lütfen geçerli bir YİBF Numarası giriniz." };
    }

    // 1. Zaten kayıtlı mı kontrol et
    const existing = await prisma.project.findFirst({
      where: { yibfNo: cleanYibf },
      select: { id: true, title: true, yibfNo: true },
    });

    if (existing) {
      return {
        success: false,
        error: `Bu YİBF numarası (${cleanYibf}) ile kayıtlı "${existing.title}" projesi zaten mevcut!`,
      };
    }

    // 2. Bakanlık API Simülasyonundan veriyi çek
    const govData: YibfProjectGovData = await fetchYibfData(cleanYibf);

    // 3. Oturum & Rol Doğrulaması (Tenant Isolation)
    const session = await auth();
    if (!session || !session.user) {
      return { success: false, error: "Yetkisiz işlem: Oturum açmanız gerekmektedir." };
    }

    const userRole = (session.user as any)?.role;
    const authorizedRoles = ["INSPECTION_ADMIN", "INSPECTOR", "ADMIN", "SUPER_ADMIN", "DENETCI"];
    if (!authorizedRoles.includes(userRole)) {
      return { success: false, error: "Yetkisiz işlem: Yalnızca Yapı Denetim yetkilileri proje ekleyebilir." };
    }

    let tenantId = (session.user as any)?.tenantId || null;
    if (!tenantId && session.user.id) {
      const dbUser = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { tenantId: true },
      });
      tenantId = dbUser?.tenantId || null;
    }

    if (!tenantId) {
      const inspectionTenant = await prisma.tenant.findFirst({
        where: { type: "INSPECTION", isActive: true },
        select: { id: true },
      });
      if (inspectionTenant) {
        tenantId = inspectionTenant.id;
        if (session.user.id) {
          await prisma.user.update({
            where: { id: session.user.id },
            data: { tenantId: inspectionTenant.id },
          }).catch(() => null);
        }
      }
    }

    if (!tenantId) {
      return { success: false, error: "Firma / Tenant kimliği bulunamadı. İzolasyon gereği işlem reddedildi." };
    }

    const title = `${govData.maks.ilce} ${govData.maks.mahalle} Yapı Denetim Projesi (YİBF ${cleanYibf})`;
    const name = `${govData.yambis.firmaAdi} - YİBF ${cleanYibf}`;
    const description = `T.C. ÇŞİDB UYDS, MAKS ve YAMBİS verisiyle otonom oluşturulan kütük kaydı. Ruhsat No: ${govData.uyds.ruhsatNo}. Ada/Parsel: ${govData.maks.ada}/${govData.maks.parsel}. Taşıyıcı Sistem: ${govData.uyds.tasiyiciSistem}. Yapı Sınıfı: ${govData.uyds.yapiSinifi}. Müteahhit: ${govData.yambis.firmaAdi} (${govData.yambis.yetkiBelgeGrup}). Yapı Sahibi: ${govData.uyds.yapiSahibi}. Şantiye Şefi: ${govData.uyds.santiyeSefi.adSoyad}.`;

    // 4. Veritabanına otonom Project kaydı oluştur
    const newProject = await prisma.project.create({
      data: {
        title,
        name,
        description,
        yibfNo: cleanYibf,
        maksAdaParsel: `${govData.maks.ada}/${govData.maks.parsel}`,
        yambisId: govData.yambis.yambisNo,
        city: govData.maks.il,
        district: govData.maks.ilce,
        mintika: govData.maks.mahalle,
        location: govData.maks.acikAdres,
        ada: govData.maks.ada,
        parsel: govData.maks.parsel,
        pafta: govData.maks.pafta,
        totalArea: govData.uyds.toplamInsaatAlani,
        totalConstructionArea: govData.uyds.toplamInsaatAlani,
        buildingClass: govData.uyds.yapiSinifi,
        yapiSinifi: govData.uyds.yapiSinifi,
        status: "ACTIVE",
        yibfStatus: "Aktif Şantiye (Denetim Altında)",
        progress: 10,
        clientName: govData.yambis.firmaAdi,
        siteManager: govData.uyds.santiyeSefi.adSoyad,
        latitude: govData.maks.koordinatlar.lat,
        longitude: govData.maks.koordinatlar.lng,
        lastYibfSync: new Date(),
        tenantId: tenantId,
        images: [],
      },
    });

    revalidatePath("/inspection/projects");
    revalidatePath("/inspection");

    return {
      success: true,
      project: {
        id: newProject.id,
        title: newProject.title,
        name: newProject.name,
        yibfNo: newProject.yibfNo,
        city: newProject.city,
        district: newProject.district,
        location: newProject.location,
        status: newProject.status || "ACTIVE",
        progress: newProject.progress,
        totalArea: newProject.totalArea,
        buildingClass: newProject.buildingClass,
        ada: newProject.ada,
        parsel: newProject.parsel,
        createdAt: newProject.createdAt.toISOString(),
      },
      govData,
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Bakanlık sisteminden veri çekilirken bir hata meydana geldi.";
    console.error("[GovAction:createProjectFromYibf] Hata:", message);
    return {
      success: false,
      error: message,
    };
  }
}

/**
 * EBİS Çipli Beton RFID sorgusu gerçekleştirir
 */
export async function queryEbisSampleAction(ebisRfidTag: string) {
  try {
    const data: EbisCoreSampleGovData = await syncEbisCoreSample(ebisRfidTag);
    return { success: true, data };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "EBİS sorgusu başarısız oldu.";
    return { success: false, error: message };
  }
}
