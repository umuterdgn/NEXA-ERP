/**
 * © 2026 NXA Software. All rights reserved.
 * Nexa ERP Mobil - Merkezi API Sözleşmesi & RBAC Tip Tanımları
 * Kaynak: docs/MOBILE_API_CONTRACT.md & lib/rbac/permissions.ts
 */

export type TenantType = "CONTRACTOR" | "INSPECTION" | "FRANCHISE";

export type SystemRole =
  | "SUPER_ADMIN"
  | "ADMIN"
  | "PROJECT_MANAGER"
  | "SITE_MANAGER"
  | "ENGINEER"
  | "ARCHITECT"
  | "ISG_EXPERT"
  | "FINANCE_MANAGER"
  | "HR_MANAGER"
  | "PROCUREMENT_MANAGER"
  | "WAREHOUSE_MANAGER"
  | "SECURITY"
  | "DRIVER"
  | "WORKER"
  | "SUBCONTRACTOR"
  | "INSPECTION_ADMIN"
  | "PROJECT_AUDITOR"
  | "INSPECTOR"
  | "LAB_TECH"
  | "INSPECTION_OFFICE"
  | "INSPECTION_FINANCE"
  | "FRANCHISE_ADMIN"
  | "REGIONAL_MANAGER"
  | "FRANCHISEE"
  | "FITOUT_SUPERVISOR"
  | "FITOUT_TECH"
  | "STAFF"
  | "MUHASEBE"
  | "ACCOUNTANT"
  | "HR_STAFF"
  | "PURCHASING_STAFF"
  | "EQUIPMENT_MANAGER"
  | "MUTEAHHIT"
  | "AUDITOR"
  | "BRANCH_MANAGER"
  | "CLIENT"
  | "INVESTOR"
  | "SUPPLIER";

export type ModuleCategory =
  | "MANAGEMENT_BI"
  | "HR_PERSONAL"
  | "SUBCONTRACTOR_FINANCE"
  | "PROCUREMENT_LOGISTICS"
  | "INSPECTION_QUALITY"
  | "HSE_FIELD_OPS"
  | "SYSTEM";

export type ModuleKey =
  // Yönetim & BI
  | "dashboard"
  | "site_map"
  | "projects"
  | "progress"
  | "control_center"
  | "crm"
  | "bim_3d"
  | "boq"
  // İK & Kişisel
  | "personnel"
  | "personnel_tracking"
  | "isg_doc_alerts"
  | "attendance"
  | "payroll"
  | "shifts"
  | "approvals"
  | "food_menu"
  | "my_attendance_qr"
  | "my_shifts_history"
  | "my_leaves"
  | "my_salary_advances"
  | "my_expenses"
  | "my_announcements"
  | "my_profile"
  // Taşeron & Finans
  | "work_proofs"
  | "subcontractor_inspections"
  | "progress_payments"
  | "subcontractor_contracts"
  | "subcontractor_isg"
  | "deductions"
  | "finance_cash"
  | "expense_approvals"
  | "checks_notes"
  | "contracts"
  | "collection_risk"
  // Tedarik & Lojistik
  | "procurement"
  | "gate_security"
  | "goods_receiving"
  | "logistics_map"
  | "route_optimization"
  | "warehouse_inventory"
  | "qr_micro_consumption"
  | "material_requests"
  | "equipments"
  | "my_assigned_equipments"
  | "logistics_appointments"
  | "driver_deliveries"
  // Yapı Denetim & Kalite
  | "dynamic_forms"
  | "form_builder"
  | "damage_assessment"
  | "samples_core"
  | "reinforcement_check"
  | "site_camera"
  | "attachments_evidence"
  | "license_archive"
  | "digital_archive"
  | "smart_ocr"
  | "field_reports"
  | "ai_vision"
  | "revisions"
  | "drone_maps"
  | "digital_drawings"
  | "free_drawing"
  | "inspections"
  | "deficiencies"
  | "material_approvals"
  | "ncr_dof"
  | "concrete_pouring_qa"
  | "yibf_integration"
  // İSG & Saha Operasyon
  | "isg_dashboard"
  | "isg_risk_plan"
  | "isg_certificates"
  | "near_miss"
  | "ppe_forms"
  | "tasks_work_orders"
  | "site_journal"
  | "internal_comms"
  | "ptt_chat"
  | "sos_alarm"
  | "offline_sync"
  // Sistem
  | "system_health"
  | "users_management"
  | "system_logs"
  | "audit_logs"
  | "notifications"
  | "announcements_admin"
  | "settings_branding";

export type LocationTrackingMode =
  | "SITE_LIVE"
  | "ROUTE_LIVE"
  | "OFF"
  | "GEOFENCE_STATIONARY"
  | "OFFSITE_DISPATCH"
  | "PRIVACY_RESTRICTED";

// ============================================================================
// AUTH & SESSION
// ============================================================================

export interface MobileUser {
  id: string;
  name: string;
  email: string;
  role: SystemRole;
  profileImage?: string | null;
  phone?: string | null;
  plateNumber?: string | null;
  personnelNo?: string | null;
  currentSite?: string | null;
}

export interface MobileTenant {
  id: string;
  name: string;
  type: TenantType;
  slug?: string | null;
  primaryColor?: string | null;
}

export interface AssignedProject {
  id: string;
  name: string;
  city?: string | null;
  district?: string | null;
  status?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  radius?: number | null;
}

export interface MobileNavProfile {
  role: SystemRole;
  title: string;
  trackingMode: LocationTrackingMode;
  bottomTabs?: {
    tab1: { key: string; label: string; icon: string; route: string };
    tab2: { key: string; label: string; icon: string; route: string };
  };
  fabAction?: {
    label: string;
    icon: string;
    action: string;
  };
  moduleGrid?: {
    key: ModuleKey;
    title: string;
    icon: string;
    category: ModuleCategory;
    badge?: string;
  }[];
}

export interface AuthLoginRequest {
  email?: string;
  username?: string;
  password: string;
  pushToken?: string;
}

export interface AuthLoginResponse {
  success: boolean;
  message?: string;
  accessToken?: string;
  refreshToken?: string;
  tokens?: {
    accessToken: string;
    refreshToken?: string;
    expiresIn?: number;
  };
  expiresIn?: number;
  user: MobileUser;
  tenant: MobileTenant | null;
  assignedProjects: AssignedProject[];
  locationTrackingMode: LocationTrackingMode;
  allowedModules: ModuleKey[];
  mobileProfile?: MobileNavProfile;
}

export interface AuthMeResponse {
  success: boolean;
  user: MobileUser;
  tenant: MobileTenant | null;
  assignedProjects: AssignedProject[];
  locationTrackingMode: LocationTrackingMode;
  allowedModules: ModuleKey[];
  mobileProfile?: MobileNavProfile;
}

export interface SsoTokenResponse {
  success: boolean;
  ssoToken: string;
  expiresIn?: number;
  endpoints: {
    bimViewerUrl: string;
    arViewerUrl: string;
    customTargetUrl: string;
  };
}

// ============================================================================
// DASHBOARD & TELEMETRI
// ============================================================================

export interface DashboardMetric {
  key: string;
  title: string;
  value: string | number;
  trend?: "warning" | "danger" | "success" | "info";
  status?: string;
}

export interface DashboardPendingTask {
  id: string;
  title: string;
  description?: string | null;
  status: string;
  dueDate?: string | null;
  taskType?: string | null;
}

export interface DashboardResponse {
  success: boolean;
  project: {
    id: string;
    name: string;
    city?: string | null;
    district?: string | null;
    progress: number;
    has3DModel: boolean;
  } | null;
  weather: {
    temperature: number;
    windSpeed?: number;
    weatherCode: number;
    description?: string;
    time?: string;
    isLive: boolean;
  };
  metrics: DashboardMetric[];
  pendingTasks: DashboardPendingTask[];
  todayAttendance: {
    id: string;
    checkIn?: string | null;
    checkOut?: string | null;
    status: string;
  } | null;
  todayJournals: {
    id: string;
    activities?: string | null;
    personnelCount?: number | null;
    weather?: string | null;
    createdAt: string;
  }[];
  activeDeliveries: {
    id: string;
    vehiclePlate?: string | null;
    driverName?: string | null;
    type?: string | null;
    status: string;
    scheduledAt: string;
    title?: string | null;
  }[];
  recentAnnouncements: {
    id: string;
    title: string;
    content: string;
    severity?: string | null;
    createdAt: string;
  }[];
}

export interface TelemetryLocationPayload {
  lat: number;
  lng: number;
  latitude: number;
  longitude: number;
  speed?: number | null;
  heading?: number | null;
  accuracy?: number | null;
  batteryLevel?: number | null;
  source?: string;
  projectId?: string;
}

export interface TelemetryLocationResponse {
  success: boolean;
  logId?: string;
  isInsideGeofence: boolean;
  recordedAt?: string;
  offlineQueued?: boolean;
}

export interface RouteStop {
  id: string;
  order: number;
  title: string;
  description: string;
  plateNumber?: string | null;
  status: string;
  lat: number;
  lng: number;
  address?: string;
  eta?: string;
  type: "DELIVERY" | "INSPECTION" | "SITE" | string;
}

export interface RoutesResponse {
  success: boolean;
  count: number;
  stops: RouteStop[];
}

// ============================================================================
// WORK PROOFS (TAŞERON İŞ KANITI)
// ============================================================================

export interface WorkProofItem {
  id: string;
  title: string;
  description?: string | null;
  photoUrl: string;
  claimedQuantity: number;
  approvedQuantity?: number | null;
  status: "PENDING" | "APPROVED" | "REJECTED" | string;
  engineerStatus?: string | null;
  managerStatus?: string | null;
  subcontractorId?: string | null;
  subcontractor?: string | null;
  boqItem?: string | null;
  unit?: string | null;
  gpsLatitude?: number | null;
  gpsLongitude?: number | null;
  createdAt: string;
}

export interface CreateWorkProofPayload {
  projectId?: string;
  title: string;
  description?: string;
  photoUrl: string;
  claimedQuantity: number;
  boqItemId?: string;
  gpsLatitude?: number | null;
  gpsLongitude?: number | null;
}

export interface ReviewWorkProofPayload {
  action: "APPROVE" | "REJECT";
  approvedQuantity?: number;
  notes?: string;
}

// ============================================================================
// YAPI DENETİM & QA/QC (INSPECTIONS, SAMPLES, DEFICIENCIES, FORMS)
// ============================================================================

export interface InspectionItem {
  id: string;
  type: string;
  floor: string;
  status: string;
  inspectionDate: string;
  gpsLocation?: string | null;
  project?: string | null;
  inspector?: string | null;
}

export interface CreateInspectionPayload {
  projectId?: string;
  type: string;
  floor: string;
  status?: string;
  gpsLocation?: string;
}

export interface CoreSampleItem {
  id: string;
  qrCode: string;
  ebisRfidTag?: string | null;
  location: string;
  status: "WAITING_TEST" | "IN_LAB" | "PASSED" | "FAILED" | string;
  pourDate?: string | null;
  testDate?: string | null;
  strengthResult?: number | null;
  takenAt: string;
  project?: string | null;
}

export interface CreateSamplePayload {
  qrCode?: string;
  ebisRfidTag?: string;
  location: string;
  projectId?: string;
  pourDate?: string;
}

export interface PatchSamplePayload {
  id?: string;
  qrCode?: string;
  status?: string;
  strengthResult?: number;
  testDate?: string;
}

export interface DeficiencyItem {
  id: string;
  projectId?: string | null;
  element: string;
  floor: string;
  category: string;
  priority: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" | string;
  description: string;
  photoUrl?: string | null;
  status: "OPEN" | "IN_PROGRESS" | "CLOSED" | string;
  dueDate?: string | null;
  project?: string | null;
  createdAt: string;
}

export interface CreateDeficiencyPayload {
  projectId?: string;
  element: string;
  floor: string;
  category?: string;
  priority?: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  description: string;
  photoUrl?: string;
}

export interface PatchDeficiencyPayload {
  id: string;
  status: "OPEN" | "IN_PROGRESS" | "CLOSED";
}

export interface DynamicFormField {
  id?: string;
  name?: string;
  key?: string;
  label: string;
  type: "text" | "number" | "boolean" | "checkbox" | "select" | "textarea" | string;
  required?: boolean;
  options?: string[];
}

export interface DynamicFormTemplate {
  id: string;
  title: string;
  description?: string | null;
  category?: string | null;
  fields: DynamicFormField[];
}

export interface SubmitFormPayload {
  formId: string;
  projectId?: string;
  answers: Record<string, string | number | boolean>;
  notes?: string;
}

// ============================================================================
// PUANTAJ, İK & ÖZLÜK
// ============================================================================

export interface AttendanceRecordItem {
  id: string;
  date: string;
  checkIn?: string | null;
  checkOut?: string | null;
  status: string;
  method?: string;
  project?: string | null;
}

export interface AttendanceSubmitPayload {
  lat?: number;
  lng?: number;
  latitude?: number;
  longitude?: number;
  projectId?: string;
}

export interface AttendanceSubmitResponse {
  success: boolean;
  type?: "CHECK_IN" | "CHECK_OUT" | "ALREADY_COMPLETED";
  message: string;
  record?: AttendanceRecordItem;
  offlineQueued?: boolean;
}

export interface LeaveRequestItem {
  id: string;
  type: "LEAVE";
  leaveType: string;
  startDate: string;
  endDate: string;
  status: "PENDING" | "APPROVED" | "REJECTED" | string;
  reason?: string | null;
  userName?: string | null;
  createdAt: string;
}

export interface AdvanceRequestItem {
  id: string;
  type: "ADVANCE";
  amount: number;
  deductMonth: string;
  status: "PENDING" | "APPROVED" | "REJECTED" | string;
  reason?: string | null;
  userName?: string | null;
  createdAt: string;
}

export interface ExpenseClaimItem {
  id: string;
  type: "EXPENSE";
  expenseType: string;
  amount: number;
  receiptUrl: string;
  description?: string | null;
  status: "PENDING" | "APPROVED" | "REJECTED" | string;
  userName?: string | null;
  createdAt: string;
}

export interface HrRequestsResponse {
  success: boolean;
  leaves: LeaveRequestItem[];
  advances: AdvanceRequestItem[];
  expenses: ExpenseClaimItem[];
}

export interface CreateHrRequestPayload {
  requestType: "LEAVE" | "ADVANCE" | "EXPENSE";
  leaveType?: string;
  startDate?: string;
  endDate?: string;
  amount?: number;
  deductMonth?: string;
  expenseType?: string;
  receiptUrl?: string;
  description?: string;
  reason?: string;
  projectId?: string;
}

export interface PatchHrRequestPayload {
  requestType: "LEAVE" | "ADVANCE" | "EXPENSE";
  id: string;
  action: "APPROVE" | "REJECT";
}

export interface HrSelfResponse {
  success: boolean;
  profile: {
    name: string;
    email: string;
    phone?: string | null;
    personnelNo: string;
    tcNo?: string | null;
    department: string;
    position: string;
    project: string;
    salary: number;
    salaryStatus: string;
    hireDate?: string | null;
    iban?: string | null;
  };
  assignedEquipments: {
    id: string;
    name: string;
    category: string;
    qrCode: string;
    assignedAt: string;
    status: string;
  }[];
  foodMenus: {
    id: string;
    date: string;
    dayName: string;
    items: string[];
  }[];
  announcements: {
    id: string;
    title: string;
    content: string;
    severity?: string | null;
    createdAt: string;
  }[];
}

// ============================================================================
// LOJİSTİK, AMBAR, İSG, CHAT, AI VISION, GÖREV & JURNAL
// ============================================================================

export interface LogisticsResponse {
  success: boolean;
  appointments: {
    id: string;
    plateNumber?: string | null;
    driverName?: string | null;
    driverPhone?: string | null;
    supplierName?: string | null;
    materialType?: string | null;
    estimatedArrival: string;
    status: string;
    project?: string | null;
  }[];
  inventory: {
    id: string;
    name: string;
    category?: string | null;
    quantity: number;
    unit: string;
    isLowStock: boolean;
    qrCode?: string | null;
  }[];
  requests: {
    id: string;
    itemName: string;
    quantity: number;
    unit: string;
    urgency: string;
    status: string;
    requester?: string | null;
    createdAt: string;
  }[];
}

export interface LogisticsActionPayload {
  action: "GATE_CHECKIN" | "RECEIVE_GOODS" | "CONSUME_QR" | "CREATE_REQUEST";
  projectId?: string;
  scheduleId?: string;
  qrCode?: string;
  quantity?: number;
  itemName?: string;
  unit?: string;
  urgency?: "NORMAL" | "HIGH" | "URGENT";
  description?: string;
}

export interface IsgResponse {
  success: boolean;
  activeSosCount: number;
  activeSosAlerts: {
    id: string;
    userName?: string | null;
    userPhone?: string | null;
    latitude?: number | null;
    longitude?: number | null;
    createdAt: string;
  }[];
  nearMisses: {
    id: string;
    title: string;
    description: string;
    severity: string;
    status: string;
    location: string;
    imageUrl?: string | null;
    incidentDate: string;
  }[];
}

export interface IsgActionPayload {
  action?: "SOS" | "NEAR_MISS";
  projectId?: string;
  title?: string;
  description?: string;
  severity?: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  location?: string;
  imageUrl?: string;
  lat?: number;
  lng?: number;
  latitude?: number;
  longitude?: number;
  isAnonymous?: boolean;
}

export interface ChatMessageItem {
  id: string;
  content: string;
  photoUrl?: string | null;
  attachmentType?: string | null;
  attachmentUrl?: string | null;
  channelName: string;
  createdAt: string;
  isMe: boolean;
  sender: {
    id: string;
    name: string;
    role: string;
    avatar?: string | null;
  };
}

export interface SendChatPayload {
  content?: string;
  photoUrl?: string;
  audioUrl?: string;
  channelName?: string;
  receiverId?: string;
  projectId?: string;
}

export interface AiVisionPayload {
  imageBase64?: string;
  imageUrl?: string;
  prompt?: string;
}

export interface AiVisionAnalysis {
  hasDefect: boolean;
  defectType: string;
  severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" | "NONE" | string;
  confidence: number;
  location?: string;
  summary: string;
  recommendedAction: string;
}

export interface MobileTaskItem {
  id: string;
  code: string;
  title: string;
  description: string;
  location: string;
  zoneId?: string;
  zoneName?: string | null;
  zoneType?: string;
  priority: "KRİTİK" | "YÜKSEK" | "ORTA" | "DÜŞÜK" | string;
  status: "BEKLİYOR" | "DEVAM EDİYOR" | "TAMAMLANDI" | string;
  dueDate: string;
  boqItemId?: string;
  projectId?: string;
}

export interface MobileJournalItem {
  id: string;
  date: string;
  project: string;
  block: string;
  personnelCount: number;
  weatherSummary: string;
  temperature?: number | null;
  worksDone: string;
  status: string;
}

export interface CreateJournalPayload {
  projectId?: string;
  block?: string;
  personnelCount: number;
  worksDone: string;
  equipment?: string;
  isgNotes?: string;
  weatherSummary?: string;
  temperature?: number;
  latitude?: number;
  longitude?: number;
}

// ============================================================================
// OFFLINE SYNC QUEUE
// ============================================================================

export type OfflineBatchAction =
  | "TASK_UPDATE"
  | "ATTENDANCE"
  | "DEFICIENCY"
  | "LOCATION_LOG"
  | "WORK_PROOF";

export interface SyncBatchItem {
  id: string;
  action: OfflineBatchAction;
  payload: Record<string, any>;
  clientTimestamp: string;
}

export interface SyncBatchResponse {
  success: boolean;
  processedCount: number;
  totalCount: number;
  results: {
    id: string;
    status: "SYNCED" | "CONFLICT" | "ERROR";
    error?: string;
  }[];
}

export interface OfflineMutationRecord {
  clientMutationId: string;
  endpoint: string;
  method: "POST" | "PUT" | "PATCH";
  payload: Record<string, any>;
  batchAction?: OfflineBatchAction;
  label: string;
  createdAt: string;
  status: "PENDING" | "SYNCED" | "CONFLICT" | "ERROR";
  error?: string;
}

