/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * 4857 Sayılı İş Kanunu Uyumlu İK (İzin & Avans) Server Actions ve Hesaplama Motoru
 */

"use server"

import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { revalidatePath } from "next/cache"

/**
 * Türkiye Resmi Tatil Günleri Listesi
 * Sabit resmi tatiller ve dini bayram takvimi
 */
const FIXED_HOLIDAYS = [
  "01-01", // Yılbaşı
  "04-23", // Ulusal Egemenlik ve Çocuk Bayramı
  "05-01", // Emek ve Dayanışma Günü
  "05-19", // Atatürk'ü Anma, Gençlik ve Spor Bayramı
  "07-15", // 15 Temmuz Demokrasi ve Milli Birlik Günü
  "08-30", // Zafer Bayramı
  "10-29", // Cumhuriyet Bayramı
]

// 2025, 2026, 2027 Dini Bayram ve Değişken Tatil Günleri
const VARIABLE_HOLIDAYS_MAP: Record<string, string> = {
  // 2025
  "2025-03-30": "Ramazan Bayramı 1. Gün",
  "2025-03-31": "Ramazan Bayramı 2. Gün",
  "2025-04-01": "Ramazan Bayramı 3. Gün",
  "2025-06-06": "Kurban Bayramı 1. Gün",
  "2025-06-07": "Kurban Bayramı 2. Gün",
  "2025-06-08": "Kurban Bayramı 3. Gün",
  "2025-06-09": "Kurban Bayramı 4. Gün",
  // 2026
  "2026-03-20": "Ramazan Bayramı 1. Gün",
  "2026-03-21": "Ramazan Bayramı 2. Gün",
  "2026-03-22": "Ramazan Bayramı 3. Gün",
  "2026-05-27": "Kurban Bayramı 1. Gün",
  "2026-05-28": "Kurban Bayramı 2. Gün",
  "2026-05-29": "Kurban Bayramı 3. Gün",
  "2026-05-30": "Kurban Bayramı 4. Gün",
  // 2027
  "2027-03-10": "Ramazan Bayramı 1. Gün",
  "2027-03-11": "Ramazan Bayramı 2. Gün",
  "2027-03-12": "Ramazan Bayramı 3. Gün",
  "2027-05-17": "Kurban Bayramı 1. Gün",
  "2027-05-18": "Kurban Bayramı 2. Gün",
  "2027-05-19": "Kurban Bayramı 3. Gün",
  "2027-05-20": "Kurban Bayramı 4. Gün",
}

/**
 * 4857 Sayılı İş Kanunu Madde 46 & 47 Uyumlu İzin Günü Hesaplayıcı:
 * Yıllık ve diğer kanuni izin süreleri hesaplanırken;
 * Hafta tatili (Pazar günleri) ve ulusal bayram/genel tatil günleri toplam izin gününden düşülür.
 */
export async function calculateLeaveDays(
  startDateInput: Date | string,
  endDateInput: Date | string
): Promise<{
  totalDays: number
  calendarDays: number
  sundaysCount: number
  holidaysCount: number
  holidaysList: Array<{ date: string; name: string }>
}> {
  const start = new Date(startDateInput)
  const end = new Date(endDateInput)

  // Saat farklarını sıfırla
  start.setHours(0, 0, 0, 0)
  end.setHours(0, 0, 0, 0)

  if (start > end) {
    throw new Error("Başlangıç tarihi bitiş tarihinden sonra olamaz.")
  }

  let totalWorkDays = 0
  let calendarDays = 0
  let sundaysCount = 0
  let holidaysCount = 0
  const holidaysList: Array<{ date: string; name: string }> = []

  const current = new Date(start)

  while (current <= end) {
    calendarDays++
    const dayOfWeek = current.getDay() // 0 = Pazar
    const yyyy = current.getFullYear()
    const mm = String(current.getMonth() + 1).padStart(2, "0")
    const dd = String(current.getDate()).padStart(2, "0")
    const dateStr = `${yyyy}-${mm}-${dd}`
    const monthDayStr = `${mm}-${dd}`

    const isSunday = dayOfWeek === 0
    let holidayName: string | null = null

    // Sabit tatil kontrolü
    if (FIXED_HOLIDAYS.includes(monthDayStr)) {
      if (monthDayStr === "01-01") holidayName = "Yılbaşı"
      else if (monthDayStr === "04-23") holidayName = "Ulusal Egemenlik ve Çocuk Bayramı"
      else if (monthDayStr === "05-01") holidayName = "Emek ve Dayanışma Günü"
      else if (monthDayStr === "05-19") holidayName = "Atatürk'ü Anma, Gençlik ve Spor Bayramı"
      else if (monthDayStr === "07-15") holidayName = "15 Temmuz Demokrasi ve Milli Birlik Günü"
      else if (monthDayStr === "08-30") holidayName = "Zafer Bayramı"
      else if (monthDayStr === "10-29") holidayName = "Cumhuriyet Bayramı"
    } else if (VARIABLE_HOLIDAYS_MAP[dateStr]) {
      holidayName = VARIABLE_HOLIDAYS_MAP[dateStr]
    }

    if (isSunday) {
      sundaysCount++
      // Pazar günü zaten hafta tatili olduğu için izin gününden düşülür
    } else if (holidayName) {
      holidaysCount++
      holidaysList.push({ date: dateStr, name: holidayName })
      // Resmi tatil günü izin gününden düşülür
    } else {
      // Kanuni iş günü
      totalWorkDays++
    }

    // Bir sonraki güne geç
    current.setDate(current.getDate() + 1)
  }

  return {
    totalDays: totalWorkDays,
    calendarDays,
    sundaysCount,
    holidaysCount,
    holidaysList,
  }
}

// ============================================================================
// İZİN TALEPLERİ (LEAVE REQUESTS) SERVER ACTIONS
// ============================================================================

export async function createLeaveRequestAction(data: {
  userId?: string
  leaveType: string // "YILLIK", "MAZERET", "RAPORLU", "UCRETSIZ"
  startDate: string
  endDate: string
  reason?: string
}) {
  try {
    const session = await auth()
    const targetUserId = data.userId || session?.user?.id

    if (!targetUserId) {
      return { success: false, error: "Kullanıcı kimliği belirlenemedi." }
    }

    const { totalDays } = await calculateLeaveDays(data.startDate, data.endDate)

    const leave = await prisma.leaveRequest.create({
      data: {
        userId: targetUserId,
        leaveType: data.leaveType,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        totalDays: totalDays,
        days: totalDays,
        reason: data.reason || null,
        status: "PENDING",
      },
      include: {
        user: {
          select: { id: true, name: true, email: true, role: true },
        },
      },
    })

    revalidatePath("/admin/hr/leaves")
    revalidatePath("/admin/hr")
    return { success: true, leave }
  } catch (error: any) {
    console.error("createLeaveRequestAction error:", error)
    return { success: false, error: error.message || "İzin talebi oluşturulamadı." }
  }
}

export async function getLeaveRequestsAction(filter?: {
  status?: string
  userId?: string
}) {
  try {
    const where: any = {}
    if (filter?.status && filter.status !== "ALL") {
      where.status = filter.status
    }
    if (filter?.userId) {
      where.userId = filter.userId
    }

    const leaves = await prisma.leaveRequest.findMany({
      where,
      include: {
        user: {
          select: { id: true, name: true, email: true, role: true, profileImage: true },
        },
        personel: {
          select: { id: true, name: true, tcNo: true, position: true },
        },
      },
      orderBy: { createdAt: "desc" },
    })

    return { success: true, leaves }
  } catch (error: any) {
    console.error("getLeaveRequestsAction error:", error)
    return { success: false, error: error.message || "İzin talepleri getirilemedi.", leaves: [] }
  }
}

export async function updateLeaveRequestStatusAction(
  id: string,
  status: "APPROVED" | "REJECTED" | "PENDING"
) {
  try {
    const session = await auth()

    const leave = await prisma.leaveRequest.update({
      where: { id },
      data: {
        status,
        reviewedBy: session?.user?.name || session?.user?.id || "IK_YONETICI",
        reviewedAt: new Date(),
      },
      include: {
        user: { select: { id: true, name: true } },
      },
    })

    revalidatePath("/admin/hr/leaves")
    revalidatePath("/admin/hr")
    return { success: true, leave }
  } catch (error: any) {
    console.error("updateLeaveRequestStatusAction error:", error)
    return { success: false, error: error.message || "İzin durumu güncellenemedi." }
  }
}

// ============================================================================
// AVANS TALEPLERİ (ADVANCE REQUESTS) SERVER ACTIONS
// ============================================================================

export async function createAdvanceRequestAction(data: {
  userId?: string
  amount: number
  deductMonth: string // Örn: "2026-11"
  reason?: string
}) {
  try {
    const session = await auth()
    const targetUserId = data.userId || session?.user?.id

    if (!targetUserId) {
      return { success: false, error: "Kullanıcı kimliği belirlenemedi." }
    }

    if (!data.amount || data.amount <= 0) {
      return { success: false, error: "Geçerli bir avans tutarı giriniz." }
    }

    const advance = await prisma.advanceRequest.create({
      data: {
        userId: targetUserId,
        amount: Number(data.amount),
        deductMonth: data.deductMonth,
        reason: data.reason || null,
        status: "PENDING",
      },
      include: {
        user: {
          select: { id: true, name: true, email: true, role: true },
        },
      },
    })

    revalidatePath("/admin/hr/leaves")
    revalidatePath("/admin/hr")
    return { success: true, advance }
  } catch (error: any) {
    console.error("createAdvanceRequestAction error:", error)
    return { success: false, error: error.message || "Avans talebi oluşturulamadı." }
  }
}

export async function getAdvanceRequestsAction(filter?: {
  status?: string
}) {
  try {
    const where: any = {}
    if (filter?.status && filter.status !== "ALL") {
      where.status = filter.status
    }

    const advances = await prisma.advanceRequest.findMany({
      where,
      include: {
        user: {
          select: { id: true, name: true, email: true, role: true, profileImage: true },
        },
      },
      orderBy: { createdAt: "desc" },
    })

    return { success: true, advances }
  } catch (error: any) {
    console.error("getAdvanceRequestsAction error:", error)
    return { success: false, error: error.message || "Avans talepleri getirilemedi.", advances: [] }
  }
}

export async function updateAdvanceRequestStatusAction(
  id: string,
  status: "APPROVED" | "REJECTED" | "PENDING"
) {
  try {
    const advance = await prisma.advanceRequest.update({
      where: { id },
      data: { status },
      include: {
        user: { select: { id: true, name: true } },
      },
    })

    revalidatePath("/admin/hr/leaves")
    revalidatePath("/admin/hr")
    return { success: true, advance }
  } catch (error: any) {
    console.error("updateAdvanceRequestStatusAction error:", error)
    return { success: false, error: error.message || "Avans durumu güncellenemedi." }
  }
}

// İK Genel İstatistikleri
export async function getHrOverviewStatsAction() {
  try {
    const [pendingLeaves, approvedLeaves, pendingAdvances, totalAdvanceSum] = await Promise.all([
      prisma.leaveRequest.count({ where: { status: "PENDING" } }),
      prisma.leaveRequest.count({ where: { status: "APPROVED" } }),
      prisma.advanceRequest.count({ where: { status: "PENDING" } }),
      prisma.advanceRequest.aggregate({
        where: { status: "APPROVED" },
        _sum: { amount: true },
      }),
    ])

    return {
      success: true,
      stats: {
        pendingLeaves,
        approvedLeaves,
        pendingAdvances,
        approvedAdvanceTotal: totalAdvanceSum._sum.amount || 0,
      },
    }
  } catch (error: any) {
    return {
      success: false,
      stats: {
        pendingLeaves: 0,
        approvedLeaves: 0,
        pendingAdvances: 0,
        approvedAdvanceTotal: 0,
      },
    }
  }
}
