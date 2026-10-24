"use server"

/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Enterprise Diagnostics Server Actions
 */

import { runEnterpriseDiagnostics } from "@/lib/diagnostics/engine"
import { DiagnosticRunReport } from "@/lib/diagnostics/types"

export async function executeSystemHealthCheck(): Promise<{
  success: boolean
  report?: DiagnosticRunReport
  error?: string
}> {
  try {
    const report = await runEnterpriseDiagnostics()
    return {
      success: true,
      report,
    }
  } catch (error: any) {
    console.error("executeSystemHealthCheck error:", error)
    return {
      success: false,
      error: error?.message || "Sistem check-up çalıştırılırken beklenmeyen hata oluştu.",
    }
  }
}
