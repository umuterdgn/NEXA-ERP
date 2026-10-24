/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Enterprise Diagnostics Engine & System Health Types
 */

export type TestCategory = 
  | "RBAC_ISOLATION"
  | "INSPECTION_STAGE_GATE"
  | "FINANCE_BOQ_ALGORITHM"
  | "AUTONOMOUS_JOURNAL"
  | "EXTERNAL_IO_SYSTEMS"
  | "HR_PAYROLL"
  | "PROCUREMENT_BIDDING"
  | "FRANCHISE_PUNCH_LIST"
  | "LOGISTICS_RMA"
  | "CONTRACT_PENALTY"
  | "EQUIPMENT_BLOCKING"
  | "AUDIT_LOG_SECURITY"
  | "REALTIME_SOCKET"
  | "FX_CURRENCY_RISK"
  | "RETENTION_DEDUCTION"
  | "BLUEPRINT_INVALIDATION"
  | "IOT_HARDWARE_WEBHOOK"

export type TestPhase = "FAZ_1" | "FAZ_2" | "FAZ_3" | "FAZ_4"

export type TestStatus = "IDLE" | "RUNNING" | "PASSED" | "FAILED" | "SKIPPED"

export interface DiagnosticAssertion {
  name: string
  expected: any
  actual: any
  passed: boolean
}

export interface DiagnosticTestResult {
  id: string
  phase?: TestPhase
  category: TestCategory
  categoryTitle: string
  title: string
  description: string
  status: TestStatus
  durationMs: number
  assertions: DiagnosticAssertion[]
  details?: Record<string, any>
  error?: string
}

export interface DiagnosticLogLine {
  id: string
  timestamp: string
  level: "INFO" | "SUCCESS" | "WARN" | "ERROR" | "SYSTEM"
  message: string
}

export interface DiagnosticRunReport {
  runId: string
  startedAt: string
  completedAt: string
  totalDurationMs: number
  totalTests: number
  passedTests: number
  failedTests: number
  teardownSuccess: boolean
  cleanedRecordsCount: number
  tests: DiagnosticTestResult[]
  logs: DiagnosticLogLine[]
}
