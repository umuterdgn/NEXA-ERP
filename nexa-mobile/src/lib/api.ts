import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";

/**
 * Nexa ERP - Mobil API İstemcisi
 * Next.js Backend API bağlantısı ve JWT / Session Token yönetimi
 */

// Geliştirme ve Prod ortam URL'leri
const DEFAULT_PROD_URL = "https://nxerp.com.tr/api";
const DEFAULT_DEV_URL = "http://10.0.2.2:3000/api"; // Android Emulator için 10.0.2.2, iOS / Web için localhost

export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL ||
  (__DEV__ ? DEFAULT_DEV_URL : DEFAULT_PROD_URL);

// Bellek içi token önbelleği (AsyncStorage entegrasyonuyla uyumlu)
let currentAuthToken: string | null = null;
let onUnauthorizedCallback: (() => void) | null = null;

/**
 * Mevcut aktif token'ı döner
 */
export const getAuthToken = (): string | null => {
  return currentAuthToken;
};

/**
 * Aktif oturum token'ını günceller
 */
export const setAuthToken = (token: string | null) => {
  currentAuthToken = token;
};

/**
 * Oturumu sonlandırır / token'ı siler
 */
export const clearAuthToken = () => {
  currentAuthToken = null;
};

/**
 * 401 durumunda çağrılacak global callback kaydeder (Örn: Login ekranına yönlendirme)
 */
export const registerOnUnauthorized = (callback: () => void) => {
  onUnauthorizedCallback = callback;
};

// Axios Instance
export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

// Request Interceptor: Her isteğe yetkilendirme başlığını (Bearer Token) otomatik ekle
api.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const token = getAuthToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor: 401 oturum düşmesi ve hata yönetimi
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error: AxiosError) => {
    if (error.response?.status === 401) {
      console.warn("[Nexa API] Oturum süresi doldu veya yetkisiz istek (401).");
      clearAuthToken();
      if (onUnauthorizedCallback) {
        onUnauthorizedCallback();
      }
    }
    return Promise.reject(error);
  }
);

/**
 * Kimlik Doğrulama Servis Fonksiyonları
 */
export interface LoginPayload {
  email?: string;
  username?: string;
  password?: string;
}

export interface LoginResponse {
  token?: string;
  user?: {
    id: string;
    email: string;
    name?: string;
    role?: string;
    tenantId?: string;
  };
  message?: string;
}

export const authService = {
  /**
   * Nexa ERP Next.js backend'ine giriş yapar (/api/auth/login veya /api/auth/callback/credentials)
   */
  login: async (credentials: LoginPayload): Promise<LoginResponse> => {
    const response = await api.post<LoginResponse>("/auth/login", credentials);
    if (response.data.token) {
      setAuthToken(response.data.token);
    }
    return response.data;
  },

  /**
   * Oturumu kapatır
   */
  logout: async (): Promise<void> => {
    try {
      await api.post("/auth/logout");
    } catch {
      // Offline ya da hata olsa bile yerel oturumu kapat
    } finally {
      clearAuthToken();
    }
  },
};

export default api;
