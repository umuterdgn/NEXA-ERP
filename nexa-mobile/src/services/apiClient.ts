/**
 * © 2026 NXA Software. All rights reserved.
 * Nexa ERP Mobil - Merkezi Canlı API İstemcisi
 * Taban URL: process.env.EXPO_PUBLIC_API_URL || 'https://nxerp.com.tr'
 * - SecureStore JWT Bearer Token & X-Active-Project-Id yönetimi
 * - 401/403 merkezi interceptor yönetimi
 * - Çevrimdışı (NetInfo) yazma işlemlerini otomatik offlineSync kuyruğuna alma
 */

import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from "axios";
import * as SecureStore from "expo-secure-store";
import AsyncStorage from "@react-native-async-storage/async-storage";
import NetInfo from "@react-native-community/netinfo";
import { Alert, Platform } from "react-native";
import { offlineSync, type QueueExecutor } from "./offlineSync";
import type {
  AiVisionAnalysis,
  AiVisionPayload,
  AttendanceRecordItem,
  AttendanceSubmitPayload,
  AttendanceSubmitResponse,
  AuthLoginRequest,
  AuthLoginResponse,
  AuthMeResponse,
  BleDevicesResponse,
  ChatMessageItem,
  CoreSampleItem,
  CreateDeficiencyPayload,
  CreateHrRequestPayload,
  CreateInspectionPayload,
  CreateJournalPayload,
  CreateSamplePayload,
  CreateWorkProofPayload,
  DashboardResponse,
  DeficiencyItem,
  DynamicFormTemplate,
  HrRequestsResponse,
  HrSelfResponse,
  InspectionItem,
  IsgActionPayload,
  IsgResponse,
  LogisticsActionPayload,
  LogisticsResponse,
  MobileJournalItem,
  MobileTaskItem,
  OfflineBatchAction,
  PatchDeficiencyPayload,
  PatchHrRequestPayload,
  PatchSamplePayload,
  ReviewWorkProofPayload,
  RouteCheckinPayload,
  RouteCheckinResponse,
  RoutesResponse,
  SendChatPayload,
  SsoTokenResponse,
  SubmitFormPayload,
  SyncBatchItem,
  SyncBatchResponse,
  TelemetryLocationPayload,
  TelemetryLocationResponse,
  WorkProofItem,
} from "../types/api";

export const API_BASE_URL = (
  process.env.EXPO_PUBLIC_API_URL || "https://nxerp.com.tr"
).replace(/\/+$/, "");

const SECURE_KEYS = {
  ACCESS_TOKEN: "nexa_mobile_access_token",
  REFRESH_TOKEN: "nexa_mobile_refresh_token",
};

const ACTIVE_PROJECT_STORAGE_KEY = "@nexa_mobile_active_project_id";

let memoryAccessToken: string | null = null;
let memoryRefreshToken: string | null = null;
let memoryActiveProjectId: string | null = null;
let unauthorizedHandler: (() => void) | null = null;
let offlineQueuedHandler: ((label: string) => void) | null = null;
let isHandling401 = false;

async function isSecureStoreReady(): Promise<boolean> {
  if (Platform.OS === "web") return false;
  try {
    return await SecureStore.isAvailableAsync();
  } catch {
    return false;
  }
}

export async function saveSecureTokens(
  accessToken: string,
  refreshToken?: string | null
): Promise<void> {
  memoryAccessToken = accessToken;
  memoryRefreshToken = refreshToken || null;
  const canSecure = await isSecureStoreReady();

  if (canSecure) {
    await SecureStore.setItemAsync(SECURE_KEYS.ACCESS_TOKEN, accessToken);
    if (refreshToken) {
      await SecureStore.setItemAsync(SECURE_KEYS.REFRESH_TOKEN, refreshToken);
    } else {
      await SecureStore.deleteItemAsync(SECURE_KEYS.REFRESH_TOKEN).catch(() => {});
    }
  } else {
    await AsyncStorage.setItem(SECURE_KEYS.ACCESS_TOKEN, accessToken);
    if (refreshToken) {
      await AsyncStorage.setItem(SECURE_KEYS.REFRESH_TOKEN, refreshToken);
    }
  }
}

export async function loadSecureTokens(): Promise<{
  accessToken: string | null;
  refreshToken: string | null;
}> {
  if (memoryAccessToken) {
    return { accessToken: memoryAccessToken, refreshToken: memoryRefreshToken };
  }

  const canSecure = await isSecureStoreReady();
  try {
    const access = canSecure
      ? await SecureStore.getItemAsync(SECURE_KEYS.ACCESS_TOKEN)
      : await AsyncStorage.getItem(SECURE_KEYS.ACCESS_TOKEN);
    const refresh = canSecure
      ? await SecureStore.getItemAsync(SECURE_KEYS.REFRESH_TOKEN)
      : await AsyncStorage.getItem(SECURE_KEYS.REFRESH_TOKEN);
    memoryAccessToken = access;
    memoryRefreshToken = refresh;
    return { accessToken: access, refreshToken: refresh };
  } catch {
    return { accessToken: null, refreshToken: null };
  }
}

export async function clearSecureTokens(): Promise<void> {
  memoryAccessToken = null;
  memoryRefreshToken = null;
  const canSecure = await isSecureStoreReady();

  if (canSecure) {
    await SecureStore.deleteItemAsync(SECURE_KEYS.ACCESS_TOKEN).catch(() => {});
    await SecureStore.deleteItemAsync(SECURE_KEYS.REFRESH_TOKEN).catch(() => {});
  } else {
    await AsyncStorage.multiRemove([
      SECURE_KEYS.ACCESS_TOKEN,
      SECURE_KEYS.REFRESH_TOKEN,
    ]).catch(() => {});
  }
}

export async function setActiveProjectHeader(projectId: string | null): Promise<void> {
  memoryActiveProjectId = projectId;
  if (projectId) {
    await AsyncStorage.setItem(ACTIVE_PROJECT_STORAGE_KEY, projectId).catch(() => {});
  } else {
    await AsyncStorage.removeItem(ACTIVE_PROJECT_STORAGE_KEY).catch(() => {});
  }
}

export async function getActiveProjectHeader(): Promise<string | null> {
  if (memoryActiveProjectId) return memoryActiveProjectId;
  try {
    const stored = await AsyncStorage.getItem(ACTIVE_PROJECT_STORAGE_KEY);
    memoryActiveProjectId = stored;
    return stored;
  } catch {
    return null;
  }
}

export function registerApiHandlers(handlers: {
  onUnauthorized?: () => void;
  onOfflineQueued?: (label: string) => void;
}) {
  if (handlers.onUnauthorized) unauthorizedHandler = handlers.onUnauthorized;
  if (handlers.onOfflineQueued) offlineQueuedHandler = handlers.onOfflineQueued;
}

export const httpClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 20000,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

httpClient.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
  if (!memoryAccessToken) {
    await loadSecureTokens();
  }
  if (!memoryActiveProjectId) {
    await getActiveProjectHeader();
  }

  config.headers = config.headers || {};

  if (memoryAccessToken) {
    config.headers.Authorization = `Bearer ${memoryAccessToken}`;
  }
  if (memoryActiveProjectId) {
    config.headers["X-Active-Project-Id"] = memoryActiveProjectId;
  }

  return config;
});

httpClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<{ error?: string; message?: string }>) => {
    const status = error.response?.status;
    const reqUrl = error.config?.url || "";
    const serverMsg = error.response?.data?.error || error.response?.data?.message;

    if (
      status === 401 &&
      !reqUrl.includes("/api/mobile/auth/login") &&
      !reqUrl.includes("/api/mobile/auth/logout")
    ) {
      if (!isHandling401) {
        isHandling401 = true;
        await clearSecureTokens();
        try {
          unauthorizedHandler?.();
        } finally {
          setTimeout(() => {
            isHandling401 = false;
          }, 1200);
        }
      }
    } else if (status === 403) {
      Alert.alert(
        "Yetki Uyarısı",
        serverMsg || "Bu işlem veya modül için erişim yetkiniz bulunmamaktadır."
      );
    }

    return Promise.reject(error);
  }
);

async function mutateWithOfflineQueue<T>(opts: {
  method: "POST" | "PUT" | "PATCH";
  url: string;
  data?: Record<string, any>;
  label: string;
  batchAction?: OfflineBatchAction;
  skipOfflineQueue?: boolean;
  silentOfflineAlert?: boolean;
}): Promise<T> {
  const net = await NetInfo.fetch();
  const isOnline = Boolean(net.isConnected && net.isInternetReachable !== false);

  const enqueueAndNotify = async () => {
    const queued = await offlineSync.enqueue({
      endpoint: opts.url,
      method: opts.method,
      payload: opts.data || {},
      label: opts.label,
      batchAction: opts.batchAction,
    });
    offlineQueuedHandler?.(opts.label);
    if (!opts.silentOfflineAlert) {
      Alert.alert(
        "Çevrimdışı Kaydedildi",
        `"${opts.label}" yerel kuyruğa alındı. İnternet bağlantısı sağlandığında sunucuyla eşitlenecek.`
      );
    }
    return {
      success: true,
      offlineQueued: true,
      clientMutationId: queued.clientMutationId,
      message: "Çevrimdışı kaydedildi, internet gelince eşitlenecek.",
    } as unknown as T;
  };

  if (!isOnline && !opts.skipOfflineQueue) {
    return await enqueueAndNotify();
  }

  try {
    const res = await httpClient.request<T>({
      method: opts.method,
      url: opts.url,
      data: opts.data,
    });
    return res.data;
  } catch (err: any) {
    const isNetworkError = !err?.response;
    if (isNetworkError && !opts.skipOfflineQueue) {
      return await enqueueAndNotify();
    }
    const errMsg =
      err?.response?.data?.error ||
      err?.response?.data?.message ||
      err?.message ||
      "Sunucu ile iletişim kurulamadı.";
    throw new Error(errMsg);
  }
}

export const queueExecutor: QueueExecutor = {
  sendBatch: async (items: SyncBatchItem[]): Promise<SyncBatchResponse> => {
    const res = await httpClient.post<SyncBatchResponse>("/api/mobile/sync/batch", {
      items,
    });
    return res.data;
  },
  sendDirect: async (endpoint, method, payload) => {
    const res = await httpClient.request({ method, url: endpoint, data: payload });
    return res.data;
  },
};

export function extractErrorMessage(err: any, fallback = "İşlem tamamlanamadı."): string {
  return (
    err?.response?.data?.error ||
    err?.response?.data?.message ||
    err?.message ||
    fallback
  );
}

export function resolveFullWebUrl(relativeOrAbsoluteUrl: string): string {
  if (!relativeOrAbsoluteUrl) return API_BASE_URL;
  if (/^https?:\/\//i.test(relativeOrAbsoluteUrl)) return relativeOrAbsoluteUrl;
  const clean = relativeOrAbsoluteUrl.startsWith("/")
    ? relativeOrAbsoluteUrl
    : `/${relativeOrAbsoluteUrl}`;
  return `${API_BASE_URL}${clean}`;
}

// ============================================================================
// TÜM /api/mobile/* UÇLARI
// ============================================================================

export const mobileApi = {
  auth: {
    login: async (payload: AuthLoginRequest): Promise<AuthLoginResponse> => {
      const res = await httpClient.post<AuthLoginResponse>(
        "/api/mobile/auth/login",
        payload
      );
      return res.data;
    },
    me: async (): Promise<AuthMeResponse> => {
      const res = await httpClient.get<AuthMeResponse>("/api/mobile/auth/me");
      return res.data;
    },
    logout: async (): Promise<{ success: boolean }> => {
      const res = await httpClient.post<{ success: boolean }>("/api/mobile/auth/logout");
      return res.data;
    },
    getSsoToken: async (params?: {
      projectId?: string;
      targetRoute?: string;
    }): Promise<SsoTokenResponse> => {
      const res = await httpClient.get<SsoTokenResponse>("/api/mobile/sso-token", {
        params,
      });
      return res.data;
    },
  },

  dashboard: {
    get: async (projectId?: string): Promise<DashboardResponse> => {
      const res = await httpClient.get<DashboardResponse>("/api/mobile/dashboard", {
        params: projectId ? { projectId } : undefined,
      });
      return res.data;
    },
  },

  telemetry: {
    sendLocation: async (
      payload: TelemetryLocationPayload
    ): Promise<TelemetryLocationResponse> => {
      return await mutateWithOfflineQueue<TelemetryLocationResponse>({
        method: "POST",
        url: "/api/mobile/telemetry/location",
        data: payload,
        label: payload.bleDeviceId
          ? `BLE Konum & Telemetri (${payload.bleEventType || "HEARTBEAT"})`
          : "Canlı GPS Konum Telemetrisi",
        batchAction: "LOCATION_LOG",
        silentOfflineAlert: true,
      });
    },
  },

  ble: {
    listDevices: async (projectId?: string): Promise<BleDevicesResponse> => {
      const res = await httpClient.get<BleDevicesResponse>("/api/mobile/ble/devices", {
        params: projectId ? { projectId } : undefined,
      });
      return res.data;
    },
  },

  routes: {
    list: async (): Promise<RoutesResponse> => {
      const res = await httpClient.get<RoutesResponse>("/api/mobile/routes");
      return res.data;
    },
    checkin: async (
      payload: RouteCheckinPayload
    ): Promise<RouteCheckinResponse> => {
      return await mutateWithOfflineQueue<RouteCheckinResponse>({
        method: "POST",
        url: "/api/mobile/routes/checkin",
        data: payload,
        label: `Durak Check-In (${payload.action})`,
      });
    },
  },

  workProofs: {
    list: async (params?: {
      projectId?: string;
      status?: string;
    }): Promise<{ success: boolean; count: number; proofs: WorkProofItem[] }> => {
      const res = await httpClient.get("/api/mobile/work-proofs", { params });
      return res.data;
    },
    create: async (payload: CreateWorkProofPayload) => {
      return await mutateWithOfflineQueue<{
        success: boolean;
        message: string;
        proof?: WorkProofItem;
        offlineQueued?: boolean;
      }>({
        method: "POST",
        url: "/api/mobile/work-proofs",
        data: payload,
        label: `İş Kanıtı: ${payload.title}`,
      });
    },
    review: async (id: string, payload: ReviewWorkProofPayload) => {
      return await mutateWithOfflineQueue<{
        success: boolean;
        message: string;
        proof?: WorkProofItem;
        offlineQueued?: boolean;
      }>({
        method: "POST",
        url: `/api/mobile/work-proofs/${id}/review`,
        data: payload,
        label: `İş Kanıtı ${payload.action === "APPROVE" ? "Onayı" : "Reddi"}`,
      });
    },
  },

  inspections: {
    list: async (params?: {
      projectId?: string;
      type?: string;
    }): Promise<{ success: boolean; count: number; inspections: InspectionItem[] }> => {
      const res = await httpClient.get("/api/mobile/inspections", { params });
      return res.data;
    },
    create: async (payload: CreateInspectionPayload) => {
      return await mutateWithOfflineQueue<{
        success: boolean;
        message: string;
        inspection?: InspectionItem;
        offlineQueued?: boolean;
      }>({
        method: "POST",
        url: "/api/mobile/inspections",
        data: payload,
        label: `Denetim Vizesi: ${payload.type} (${payload.floor})`,
      });
    },
  },

  samples: {
    list: async (params?: {
      projectId?: string;
      status?: string;
      qrCode?: string;
    }): Promise<{ success: boolean; count: number; samples: CoreSampleItem[] }> => {
      const res = await httpClient.get("/api/mobile/samples", { params });
      return res.data;
    },
    create: async (payload: CreateSamplePayload) => {
      return await mutateWithOfflineQueue<{
        success: boolean;
        message: string;
        sample?: CoreSampleItem;
        offlineQueued?: boolean;
      }>({
        method: "POST",
        url: "/api/mobile/samples",
        data: payload,
        label: `Numune Kaydı: ${payload.location}`,
      });
    },
    update: async (payload: PatchSamplePayload) => {
      return await mutateWithOfflineQueue<{
        success: boolean;
        message: string;
        sample?: CoreSampleItem;
        offlineQueued?: boolean;
      }>({
        method: "PATCH",
        url: "/api/mobile/samples",
        data: payload,
        label: "Numune Laboratuvar Sonucu",
      });
    },
  },

  deficiencies: {
    list: async (params?: {
      projectId?: string;
      status?: string;
    }): Promise<{ success: boolean; count: number; deficiencies: DeficiencyItem[] }> => {
      const res = await httpClient.get("/api/mobile/deficiencies", { params });
      return res.data;
    },
    create: async (payload: CreateDeficiencyPayload) => {
      return await mutateWithOfflineQueue<{
        success: boolean;
        message: string;
        deficiency?: DeficiencyItem;
        offlineQueued?: boolean;
      }>({
        method: "POST",
        url: "/api/mobile/deficiencies",
        data: payload,
        label: `Saha Kusuru: ${payload.element}`,
        batchAction: "DEFICIENCY",
      });
    },
    update: async (payload: PatchDeficiencyPayload) => {
      return await mutateWithOfflineQueue<{
        success: boolean;
        message: string;
        deficiency?: DeficiencyItem;
        offlineQueued?: boolean;
      }>({
        method: "PATCH",
        url: "/api/mobile/deficiencies",
        data: payload,
        label: `Kusur Durumu (${payload.status})`,
      });
    },
  },

  forms: {
    list: async (): Promise<{
      success: boolean;
      count: number;
      forms: DynamicFormTemplate[];
    }> => {
      const res = await httpClient.get("/api/mobile/forms");
      return res.data;
    },
    submit: async (payload: SubmitFormPayload) => {
      return await mutateWithOfflineQueue<{
        success: boolean;
        message: string;
        submissionId?: string;
        offlineQueued?: boolean;
      }>({
        method: "POST",
        url: "/api/mobile/forms",
        data: payload,
        label: "Dinamik Denetim Formu",
      });
    },
  },

  attendance: {
    list: async (): Promise<{
      success: boolean;
      count: number;
      records: AttendanceRecordItem[];
    }> => {
      const res = await httpClient.get("/api/mobile/attendance");
      return res.data;
    },
    toggle: async (payload: AttendanceSubmitPayload): Promise<AttendanceSubmitResponse> => {
      return await mutateWithOfflineQueue<AttendanceSubmitResponse>({
        method: "POST",
        url: "/api/mobile/attendance",
        data: {
          ...payload,
          checkInTime: new Date().toISOString(),
        },
        label: "Mesai Puantaj Giriş/Çıkış",
        batchAction: "ATTENDANCE",
      });
    },
  },

  hr: {
    getRequests: async (type?: "LEAVE" | "ADVANCE" | "EXPENSE" | "ALL") => {
      const res = await httpClient.get<HrRequestsResponse>("/api/mobile/hr/requests", {
        params: type ? { type } : undefined,
      });
      return res.data;
    },
    createRequest: async (payload: CreateHrRequestPayload) => {
      const typeMap = { LEAVE: "İzin", ADVANCE: "Avans", EXPENSE: "Masraf" };
      return await mutateWithOfflineQueue<{
        success: boolean;
        message: string;
        request?: any;
        offlineQueued?: boolean;
      }>({
        method: "POST",
        url: "/api/mobile/hr/requests",
        data: payload,
        label: `${typeMap[payload.requestType]} Talebi`,
      });
    },
    reviewRequest: async (payload: PatchHrRequestPayload) => {
      return await mutateWithOfflineQueue<{ success: boolean; message: string }>({
        method: "PATCH",
        url: "/api/mobile/hr/requests",
        data: payload,
        label: `İK Talebi (${payload.action})`,
      });
    },
    getSelf: async (): Promise<HrSelfResponse> => {
      const res = await httpClient.get<HrSelfResponse>("/api/mobile/hr/self");
      return res.data;
    },
    signEquipment: async (payload: { assignmentId: string; signatureData: string }) => {
      return await mutateWithOfflineQueue<{ success: boolean; message: string }>({
        method: "POST",
        url: "/api/mobile/hr/self",
        data: payload,
        label: "KKD / Zimmet Dijital İmza",
      });
    },
  },

  logistics: {
    get: async (params?: {
      projectId?: string;
      type?: "APPOINTMENTS" | "WAREHOUSE" | "REQUESTS" | "ALL";
    }): Promise<LogisticsResponse> => {
      const res = await httpClient.get<LogisticsResponse>("/api/mobile/logistics", {
        params,
      });
      return res.data;
    },
    action: async (payload: LogisticsActionPayload) => {
      return await mutateWithOfflineQueue<{
        success: boolean;
        message?: string;
        remainingQuantity?: number;
        offlineQueued?: boolean;
      }>({
        method: "POST",
        url: "/api/mobile/logistics",
        data: payload,
        label: `Lojistik İşlemi (${payload.action})`,
      });
    },
  },

  isg: {
    get: async (projectId?: string): Promise<IsgResponse> => {
      const res = await httpClient.get<IsgResponse>("/api/mobile/isg", {
        params: projectId ? { projectId } : undefined,
      });
      return res.data;
    },
    triggerSos: async (payload: {
      lat?: number;
      lng?: number;
      projectId?: string;
    }) => {
      return await mutateWithOfflineQueue<{ success: boolean; message: string }>({
        method: "POST",
        url: "/api/mobile/isg",
        data: { action: "SOS", ...payload },
        label: "ACİL DURUM SOS ALARMI",
      });
    },
    reportNearMiss: async (payload: IsgActionPayload) => {
      return await mutateWithOfflineQueue<{ success: boolean; message: string }>({
        method: "POST",
        url: "/api/mobile/isg",
        data: { ...payload, action: "NEAR_MISS" },
        label: "Ramak Kala İSG Bildirimi",
      });
    },
  },

  chat: {
    list: async (params?: {
      projectId?: string;
      channelName?: string;
    }): Promise<{ success: boolean; count: number; messages: ChatMessageItem[] }> => {
      const res = await httpClient.get("/api/mobile/chat", { params });
      return res.data;
    },
    send: async (payload: SendChatPayload) => {
      return await mutateWithOfflineQueue<{
        success: boolean;
        message?: ChatMessageItem;
        offlineQueued?: boolean;
      }>({
        method: "POST",
        url: "/api/mobile/chat",
        data: payload,
        label: `Saha Mesajı (${payload.channelName || "Genel"})`,
      });
    },
  },

  ai: {
    analyzeVision: async (
      payload: AiVisionPayload
    ): Promise<{ success: boolean; analysis: AiVisionAnalysis }> => {
      const res = await httpClient.post("/api/mobile/ai/vision", payload, {
        timeout: 45000,
      });
      return res.data;
    },
  },

  sync: {
    batch: async (items: SyncBatchItem[]): Promise<SyncBatchResponse> => {
      const res = await httpClient.post<SyncBatchResponse>("/api/mobile/sync/batch", {
        items,
      });
      return res.data;
    },
  },

  tasks: {
    list: async (params?: {
      projectId?: string;
      status?: string;
    }): Promise<{ success: boolean; count: number; tasks: MobileTaskItem[] }> => {
      const res = await httpClient.get("/api/mobile/tasks", { params });
      return res.data;
    },
    updateStatus: async (taskId: string, status: string) => {
      return await mutateWithOfflineQueue<{ success: boolean; task?: any }>({
        method: "PATCH",
        url: "/api/mobile/tasks",
        data: { taskId, status },
        label: `Görev Durumu -> ${status}`,
        batchAction: "TASK_UPDATE",
      });
    },
  },

  journal: {
    list: async (
      projectId?: string
    ): Promise<{ success: boolean; count: number; journals: MobileJournalItem[] }> => {
      const res = await httpClient.get("/api/mobile/journal", {
        params: projectId ? { projectId } : undefined,
      });
      return res.data;
    },
    create: async (payload: CreateJournalPayload) => {
      return await mutateWithOfflineQueue<{
        success: boolean;
        journal?: MobileJournalItem;
        offlineQueued?: boolean;
      }>({
        method: "POST",
        url: "/api/mobile/journal",
        data: payload,
        label: `Şantiye Jurnali (${payload.block || "Saha"})`,
      });
    },
  },
};

