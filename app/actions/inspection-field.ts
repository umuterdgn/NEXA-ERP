/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Inspection Field Actions (Offline sync & mobile inspector)
 */

"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export interface InspectionData {
  yibfId: string;
  photoUrl: string;
  gpsLocation: { lat: number; lng: number } | null;
  classification: {
    category: string;
    section: string;
    result: "PASS" | "FAIL";
    description: string;
  };
}

export async function saveInspection(data: InspectionData) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return { success: false, error: "Oturum bulunamadı" };
    }

    const inspectorId = session.user.id;

    if (data.classification.result === "PASS") {
      const record = await prisma.inspectionRecord.create({
        data: {
          yibfId: data.yibfId,
          inspectorId: inspectorId,
          category: data.classification.category,
          status: "PASS",
          gpsLat: data.gpsLocation?.lat,
          gpsLng: data.gpsLocation?.lng,
          notes: `Bölüm: ${data.classification.section}\nAçıklama: ${data.classification.description}`,
        },
      });

      await prisma.yibfEvent.create({
        data: {
          yibfId: data.yibfId,
          eventType: "Denetim Tamamlandı",
          description: `${data.classification.category} kontrolü yapıldı - UYGUN`,
          userId: session.user.id,
        },
      });

      return { success: true, record };
    } else {
      const deficiency = await prisma.deficiency.create({
        data: {
          yibfId: data.yibfId,
          inspectorId: inspectorId,
          floor: data.classification.section,
          element: data.classification.category,
          category: data.classification.category,
          priority: "MEDIUM",
          description: data.classification.description || `${data.classification.section} - ${data.classification.category} uygunsuzluğu tespit edildi`,
          photoUrl: data.photoUrl,
          status: "OPEN",
          dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      });

      await prisma.yibfEvent.create({
        data: {
          yibfId: data.yibfId,
          eventType: "Eksiklik Açıldı",
          description: `${data.classification.section} - ${data.classification.category} uygunsuzluğu tespit edildi`,
          userId: session.user.id,
        },
      });

      return { success: true, deficiency };
    }
  } catch (error) {
    console.error("Kayıt hatası:", error);
    return { success: false, error: "Kayıt sırasında hata oluştu" };
  }
}
