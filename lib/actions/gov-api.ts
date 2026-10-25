/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Server Action for Ministry YİBF / UYDS Integration
 */

"use server"

import { fetchYibfMockData, YibfGovResponse } from "@/lib/services/yibf-mock"

export async function getYibfGovData(yibfNo: string): Promise<{ success: boolean; data?: YibfGovResponse; error?: string }> {
  try {
    if (!yibfNo || !yibfNo.trim()) {
      return { success: false, error: "YİBF Numarası girilmelidir." }
    }
    const data = await fetchYibfMockData(yibfNo)
    return { success: true, data }
  } catch (error) {
    return { success: false, error: "Bakanlık sistemine bağlanırken bir hata oluştu." }
  }
}
