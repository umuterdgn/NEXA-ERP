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
  // Faz 5: Kriz & İyimser Kilitleme
  | "RESOURCE_OVERLAP_CONFLICT"
  | "OPTIMISTIC_LOCK_COLLISION"
  | "BUDGET_HARD_STOP_OVERFLOW"
  // Faz 6: Yönetişim & Algoritmik Çöküş
  | "EXECUTIVE_PROXY_DELEGATION"
  | "GANTT_DAG_CIRCULAR_LOOP"
  | "GDPR_KVKK_ANONYMIZATION"
  // Faz 7: Kıyamet, Adli Bilişim & Suistimal
  | "CONTRACT_PRICE_ESCALATION"
  | "AI_ANOMALY_FRAUD_DETECTION"
  | "CASCADING_SOFT_DELETE_RESTORE"

export type TestPhase = "FAZ_1" | "FAZ_2" | "FAZ_3" | "FAZ_4" | "FAZ_5" | "FAZ_6" | "FAZ_7"

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

export interface TeardownPool {
  // Faz 1
  projectIds: string[]
  userIds: string[]
  subcontractorIds: string[]
  boqItemIds: string[]
  stageGateIds: string[]
  coreSampleIds: string[]
  ncrIds: string[]
  progressBillingIds: string[]
  workProofIds: string[]
  inventoryItemIds: string[]
  weatherForecastIds: string[]
  uploadedFiles: string[]
  // Faz 2
  personelIds: string[]
  personelPaymentIds: string[]
  purchaseRequestIds: string[]
  supplierBidIds: string[]
  companyIds: string[]
  purchaseOrderIds: string[]
  materialRequestIds: string[]
  punchListIds: string[]
  deliveryIssueIds: string[]
  goodsReceiptIds: string[]
  // Faz 3
  contractIds: string[]
  equipmentIds: string[]
  chatMessageIds: string[]
  auditLogIds: string[]
  systemLogIds: string[]
  financialTransactionIds: string[]
  // Faz 4
  blueprintIds: string[]
  reinforcementVisaIds: string[]
  // Faz 5, 6, 7
  projectTaskIds: string[]
  equipmentFuelRecordIds: string[]
}

export interface SuiteContext {
  runId: string
  teardownPool: TeardownPool
  addLog: (level: DiagnosticLogLine["level"], message: string) => void
  testResults: DiagnosticTestResult[]
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
