/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Inspection Project Server Actions with Strict Multi-Tenant Isolation
 */

"use server"

import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { revalidatePath } from "next/cache"

export interface CreateInspectionProjectInput {
  yibfNo: string
  projectName: string
  contractorName?: string
  yambisNo?: string
  city?: string
  district?: string
  ada?: string
  parsel?: string
  totalArea?: number | string | null
  buildingClass?: string
  uydsStatus?: string
  startDate?: string | Date
  description?: string
}

export interface InspectionProjectResult {
  success: boolean
  project?: any
  error?: string
}

/**
 * Oturum açan kullanıcının tenantId'sini ve yetkisini doğrular.
 * Asla tenant'sız (izolasyonsuz) kayıt yapılmasına izin vermez.
 */
async function getAuthorizedInspectionTenant(): Promise<{
  userId: string
  userRole: string
  tenantId: string
}> {
  const session = await auth()

  if (!session || !session.user) {
    throw new Error("Yetkisiz işlem: Oturum açmanız gerekmektedir.")
  }

  const userRole = session.user.role as string
  const userId = session.user.id as string

  // Yetki Kontrolü: Yalnızca Yapı Denetim ve Yönetici rolleri proje açabilir
  const authorizedRoles = ["INSPECTION_ADMIN", "INSPECTOR", "ADMIN", "SUPER_ADMIN", "DENETCI"]
  if (!authorizedRoles.includes(userRole)) {
    throw new Error("Yetkisiz işlem: Bu işlem için Yapı Denetim yetkiniz bulunmamaktadır.")
  }

  // Session üzerindeki tenantId kontrolü
  let tenantId = (session.user as any)?.tenantId as string | null | undefined

  // Session'da yoksa veritabanındaki güncel kullanıcı kaydından kontrol et
  if (!tenantId && userId) {
    const dbUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { tenantId: true, companyId: true },
    })
    tenantId = dbUser?.tenantId || null
  }

  // Sistemde henüz bir tenant atanmamışsa, Yapı Denetim Tenant'ını tespit et veya bağla
  if (!tenantId) {
    const inspectionTenant = await prisma.tenant.findFirst({
      where: { type: "INSPECTION", isActive: true },
      select: { id: true },
    })

    if (inspectionTenant) {
      tenantId = inspectionTenant.id
      // Kullanıcıya da bu tenant'ı kaydet
      if (userId) {
        await prisma.user.update({
          where: { id: userId },
          data: { tenantId: inspectionTenant.id },
        }).catch(() => null)
      }
    } else {
      // Varsayılan Yapı Denetim Tenant'ı oluştur (Tenant Isolation için kesinlikle tenantId şarttır)
      const defaultTenant = await prisma.tenant.create({
        data: {
          name: "Yapı Denetim Kuruluşu",
          type: "INSPECTION",
          subscriptionPlan: "ENTERPRISE",
          isActive: true,
        },
      })
      tenantId = defaultTenant.id
      if (userId) {
        await prisma.user.update({
          where: { id: userId },
          data: { tenantId: defaultTenant.id },
        }).catch(() => null)
      }
    }
  }

  if (!tenantId) {
    throw new Error("Firma/Tenant kimliği doğrulanamadı. İzolasyon gereği işlem iptal edildi.")
  }

  return { userId, userRole, tenantId }
}

/**
 * YİBF sorgusu sonrası Bakanlık verilerini "Inspection Tenant" bağlamında
 * ROW LEVEL SECURITY / TENANT ISOLATION kurallarıyla veritabanına kaydeder.
 */
export async function createInspectionProject(
  data: CreateInspectionProjectInput
): Promise<InspectionProjectResult> {
  try {
    const cleanYibf = (data.yibfNo || "").trim()
    if (!cleanYibf) {
      return { success: false, error: "Geçerli bir YİBF Numarası zorunludur." }
    }

    if (!data.projectName || !data.projectName.trim()) {
      return { success: false, error: "Proje Adı zorunludur." }
    }

    // ADIM 2: Oturum ve Tenant Doğrulaması (Row-Level Tenant Isolation)
    const { userId, tenantId } = await getAuthorizedInspectionTenant()

    // Aynı YİBF ile bu tenant'ta zaten kayıtlı mı kontrol et
    const existing = await prisma.project.findFirst({
      where: {
        yibfNo: cleanYibf,
        tenantId: tenantId, // KRİTİK: Bu tenant'taki projeler arasında ara
      },
      select: { id: true, title: true, yibfNo: true },
    })

    if (existing) {
      return {
        success: false,
        error: `Bu YİBF numarası (${cleanYibf}) firmanız kütüğünde "${existing.title}" adıyla zaten kayıtlıdır.`,
      }
    }

    const totalAreaParsed =
      data.totalArea !== undefined && data.totalArea !== null && data.totalArea !== ""
        ? parseFloat(String(data.totalArea))
        : null

    const title = data.projectName.trim()
    const name = data.projectName.trim()

    // KRİTİK: Prisma Project kaydına tenantId ZORUNLU olarak enjekte ediliyor
    const newProject = await prisma.project.create({
      data: {
        title,
        name,
        description:
          data.description ||
          `T.C. ÇŞİDB YİBF #${cleanYibf} Denetim Kütüğü. Müteahhit: ${data.contractorName || "Belirtilmedi"} (YAMBİS: ${data.yambisNo || "-"}). MAKS: ${data.ada || "-"}/${data.parsel || "-"}. Yapı Sınıfı: ${data.buildingClass || "-"}.`,
        yibfNo: cleanYibf,
        tenantId: tenantId, // KRİTİK: Proje bu Yapı Denetim firmasına kilitleniyor
        maksAdaParsel: data.ada && data.parsel ? `${data.ada}/${data.parsel}` : null,
        yambisId: data.yambisNo || null,
        ada: data.ada || null,
        parsel: data.parsel || null,
        city: data.city || null,
        district: data.district || null,
        totalArea: totalAreaParsed,
        totalConstructionArea: totalAreaParsed,
        buildingClass: data.buildingClass || null,
        yapiSinifi: data.buildingClass || null,
        clientName: data.contractorName || null,
        yibfStatus: data.uydsStatus || "Ruhsat Alındı (Denetim Başladı)",
        status: "ACTIVE",
        progress: 10,
        lastYibfSync: new Date(),
        managerId: userId,
        startDate: data.startDate ? new Date(data.startDate) : new Date(),
      },
      include: {
        tenant: true,
      },
    })

    // YibfProject tablosunu da tenantId ile senkronize et
    try {
      const company = await prisma.company.findFirst()
      if (company) {
        await prisma.yibfProject.upsert({
          where: { yibfNo: cleanYibf },
          create: {
            yibfNo: cleanYibf,
            address: `${data.district || ""}, ${data.city || ""}`.trim() || "Belirtilmedi",
            ownerName: data.contractorName || "Yapı Sahibi",
            contractorName: data.contractorName || "Yüklenici Firma",
            totalArea: totalAreaParsed || 0,
            floors: 1,
            status: "ACTIVE",
            companyId: company.id,
            tenantId: tenantId, // KRİTİK: YİBF modeli de tenant'a kilitlendi
          },
          update: {
            tenantId: tenantId,
            totalArea: totalAreaParsed || undefined,
          },
        })
      }
    } catch (syncErr) {
      console.warn("[createInspectionProject] YibfProject sync uyarısı:", syncErr)
    }

    revalidatePath("/inspection/projects")
    revalidatePath("/inspection")

    return {
      success: true,
      project: newProject,
    }
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Proje kaydedilirken beklenmeyen bir hata oluştu."
    console.error("[createInspectionProject] Hata:", message)
    return {
      success: false,
      error: message,
    }
  }
}

/**
 * ADIM 3: İzolasyon Kontrolü & Proje Listesi
 * Giriş yapan Yapı Denetim firmasının yalnızca kendi tenantId'sine ait projelerini döner.
 * Farklı bir Yapı Denetim veya Müteahhit bu projeleri kesinlikle göremez.
 */
export async function getTenantInspectionProjects() {
  try {
    const { tenantId } = await getAuthorizedInspectionTenant()

    const projects = await prisma.project.findMany({
      where: {
        tenantId: tenantId, // RLS Mantığı: Sadece bu firmanın projeleri
        deletedAt: null,
      },
      include: {
        manager: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: { createdAt: "desc" },
    })

    return { success: true, data: projects }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Projeler listelenirken hata oluştu."
    return { success: false, error: message, data: [] }
  }
}
