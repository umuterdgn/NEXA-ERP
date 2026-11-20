/**
 * © 2026 NXA Software. All rights reserved.
 * Nexa ERP Mobil - Merkezi Canlı Kimlik Doğrulama & Oturum Bağlamı (AuthContext)
 * Sıfır mock veri: Tüm rol, modül ve proje bilgileri /api/mobile/auth/* üzerinden gelir.
 */

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { Alert } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import NetInfo from "@react-native-community/netinfo";
import * as LocalAuthentication from "expo-local-authentication";
import { useRouter } from "expo-router";
import {
  clearSecureTokens,
  extractErrorMessage,
  getActiveProjectHeader,
  loadSecureTokens,
  mobileApi,
  queueExecutor,
  registerApiHandlers,
  saveSecureTokens,
  setActiveProjectHeader,
} from "../services/apiClient";
import { offlineSync } from "../services/offlineSync";
import {
  startLocationTracking,
  stopLocationTracking,
  type GeofenceStatus,
} from "../services/locationTracker";
import type {
  AssignedProject,
  LocationTrackingMode,
  MobileNavProfile,
  MobileTenant,
  MobileUser,
  ModuleKey,
  SystemRole,
  TenantType,
} from "../types/api";

const SESSION_SNAPSHOT_KEY = "@nexa_session_snapshot_v2";
const BIOMETRIC_PREF_KEY = "@nexa_biometric_enabled_v2";

interface SessionSnapshot {
  user: MobileUser;
  tenant: MobileTenant | null;
  assignedProjects: AssignedProject[];
  locationTrackingMode: LocationTrackingMode;
  allowedModules: ModuleKey[];
  mobileProfile?: MobileNavProfile;
}

interface AuthContextValue {
  isBootstrapping: boolean;
  isAuthenticated: boolean;
  hasSavedSession: boolean;
  biometricAvailable: boolean;
  biometricEnabled: boolean;
  setBiometricEnabled: (enabled: boolean) => Promise<void>;
  user: MobileUser | null;
  tenant: MobileTenant | null;
  tenantType: TenantType;
  role: SystemRole;
  allowedModules: ModuleKey[];
  assignedProjects: AssignedProject[];
  activeProject: AssignedProject | null;
  locationTrackingMode: LocationTrackingMode;
  mobileProfile: MobileNavProfile | null;
  isOnline: boolean;
  offlineQueueCount: number;
  geofenceStatus: GeofenceStatus | null;
  login: (identifier: string, password: string) => Promise<void>;
  unlockWithBiometrics: () => Promise<boolean>;
  refreshSession: () => Promise<boolean>;
  logout: () => Promise<void>;
  setActiveProject: (project: AssignedProject) => Promise<void>;
  hasModule: (...keys: ModuleKey[]) => boolean;
  syncOfflineNow: () => Promise<{
    total: number;
    synced: number;
    conflicts: number;
    errors: number;
  }>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const isMountedRef = useRef(true);

  const [isBootstrapping, setIsBootstrapping] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [hasSavedSession, setHasSavedSession] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometricEnabled, setBiometricEnabledState] = useState(false);

  const [user, setUser] = useState<MobileUser | null>(null);
  const [tenant, setTenant] = useState<MobileTenant | null>(null);
  const [assignedProjects, setAssignedProjects] = useState<AssignedProject[]>([]);
  const [activeProject, setActiveProjectState] = useState<AssignedProject | null>(null);
  const [locationTrackingMode, setLocationTrackingMode] =
    useState<LocationTrackingMode>("OFF");
  const [allowedModules, setAllowedModules] = useState<ModuleKey[]>([]);
  const [mobileProfile, setMobileProfile] = useState<MobileNavProfile | null>(null);

  const [isOnline, setIsOnline] = useState(true);
  const [offlineQueueCount, setOfflineQueueCount] = useState(0);
  const [geofenceStatus, setGeofenceStatus] = useState<GeofenceStatus | null>(null);

  const tenantType: TenantType = tenant?.type || "CONTRACTOR";
  const role: SystemRole = (user?.role || "WORKER") as SystemRole;

  const clearLocalSession = useCallback(async () => {
    stopLocationTracking();
    await clearSecureTokens();
    await setActiveProjectHeader(null);
    await AsyncStorage.removeItem(SESSION_SNAPSHOT_KEY).catch(() => {});
    if (!isMountedRef.current) return;
    setUser(null);
    setTenant(null);
    setAssignedProjects([]);
    setActiveProjectState(null);
    setLocationTrackingMode("OFF");
    setAllowedModules([]);
    setMobileProfile(null);
    setGeofenceStatus(null);
    setIsAuthenticated(false);
    setHasSavedSession(false);
  }, []);

  const applySessionSnapshot = useCallback(
    async (snapshot: SessionSnapshot) => {
      if (!isMountedRef.current) return;

      setUser(snapshot.user);
      setTenant(snapshot.tenant);
      setAssignedProjects(snapshot.assignedProjects || []);
      setLocationTrackingMode(snapshot.locationTrackingMode || "OFF");
      setAllowedModules(snapshot.allowedModules || []);
      setMobileProfile(snapshot.mobileProfile || null);

      const savedProjId = await getActiveProjectHeader();
      const matched =
        snapshot.assignedProjects.find((p) => p.id === savedProjId) ||
        snapshot.assignedProjects[0] ||
        null;

      setActiveProjectState(matched);
      await setActiveProjectHeader(matched?.id || null);

      await AsyncStorage.setItem(SESSION_SNAPSHOT_KEY, JSON.stringify(snapshot)).catch(
        () => {}
      );

      setHasSavedSession(true);
      setIsAuthenticated(true);

      startLocationTracking({
        mode: snapshot.locationTrackingMode || "OFF",
        project: matched,
        onGeofenceChange: (status) => {
          if (isMountedRef.current) setGeofenceStatus(status);
        },
      }).catch(() => {});
    },
    []
  );

  const refreshSession = useCallback(async (): Promise<boolean> => {
    const { accessToken } = await loadSecureTokens();
    if (!accessToken) {
      return false;
    }
    const me = await mobileApi.auth.me();
    await applySessionSnapshot({
      user: me.user,
      tenant: me.tenant,
      assignedProjects: me.assignedProjects || [],
      locationTrackingMode: me.locationTrackingMode || "OFF",
      allowedModules: me.allowedModules || [],
      mobileProfile: me.mobileProfile,
    });
    return true;
  }, [applySessionSnapshot]);

  // Açılış Bootstrap + Ağ / Offline Sync İzleyicileri
  useEffect(() => {
    isMountedRef.current = true;

    registerApiHandlers({
      onUnauthorized: () => {
        clearLocalSession().finally(() => {
          router.replace("/");
        });
      },
    });

    offlineSync.init().then(() => {
      if (isMountedRef.current) {
        setOfflineQueueCount(offlineSync.getPendingCount());
      }
    });

    const unsubQueue = offlineSync.subscribe(() => {
      if (isMountedRef.current) {
        setOfflineQueueCount(offlineSync.getPendingCount());
      }
    });

    const unsubAutoSync = offlineSync.startAutoSyncListener(queueExecutor);

    const unsubNet = NetInfo.addEventListener((state) => {
      const online = Boolean(state.isConnected && state.isInternetReachable !== false);
      if (isMountedRef.current) {
        setIsOnline(online);
      }
    });

    (async () => {
      try {
        // Biyometrik donanım kontrolü
        try {
          const [hasHw, enrolled, pref] = await Promise.all([
            LocalAuthentication.hasHardwareAsync(),
            LocalAuthentication.isEnrolledAsync(),
            AsyncStorage.getItem(BIOMETRIC_PREF_KEY),
          ]);
          const bioReady = Boolean(hasHw && enrolled);
          if (isMountedRef.current) {
            setBiometricAvailable(bioReady);
            setBiometricEnabledState(bioReady && pref !== "false");
          }
        } catch {}

        const [{ accessToken }, snapRaw, netState] = await Promise.all([
          loadSecureTokens(),
          AsyncStorage.getItem(SESSION_SNAPSHOT_KEY).catch(() => null),
          NetInfo.fetch(),
        ]);

        const online = Boolean(
          netState.isConnected && netState.isInternetReachable !== false
        );
        if (isMountedRef.current) setIsOnline(online);

        if (accessToken) {
          if (isMountedRef.current) setHasSavedSession(true);

          if (online) {
            try {
              const ok = await refreshSession();
              if (ok) {
                offlineSync.syncNow(queueExecutor).catch(() => {});
                return;
              }
            } catch (err: any) {
              if (err?.response?.status === 401) {
                await clearLocalSession();
                return;
              }
            }
          }

          // Çevrimdışı ise kayıtlı snapshot üzerinden oturumu aç
          if (snapRaw) {
            try {
              const parsed: SessionSnapshot = JSON.parse(snapRaw);
              if (parsed?.user?.id) {
                await applySessionSnapshot(parsed);
              }
            } catch {}
          }
        }
      } finally {
        if (isMountedRef.current) {
          setIsBootstrapping(false);
        }
      }
    })();

    return () => {
      isMountedRef.current = false;
      unsubQueue();
      unsubAutoSync();
      unsubNet();
      stopLocationTracking();
    };
  }, [applySessionSnapshot, clearLocalSession, refreshSession, router]);

  const login = useCallback(
    async (identifier: string, password: string) => {
      const cleanId = identifier.trim();
      if (!cleanId || !password) {
        throw new Error("Lütfen e-posta / kullanıcı adı ve şifrenizi giriniz.");
      }

      const res = await mobileApi.auth.login({ email: cleanId, password });
      const accessToken = res.accessToken || res.tokens?.accessToken;
      const refreshToken = res.refreshToken || res.tokens?.refreshToken || null;

      if (!accessToken || !res.user) {
        throw new Error("Sunucudan geçerli kimlik belirteci alınamadı.");
      }

      await saveSecureTokens(accessToken, refreshToken);
      await applySessionSnapshot({
        user: res.user,
        tenant: res.tenant,
        assignedProjects: res.assignedProjects || [],
        locationTrackingMode: res.locationTrackingMode || "OFF",
        allowedModules: res.allowedModules || [],
        mobileProfile: res.mobileProfile,
      });

      offlineSync.syncNow(queueExecutor).catch(() => {});
      router.replace("/(tabs)");
    },
    [applySessionSnapshot, router]
  );

  const unlockWithBiometrics = useCallback(async (): Promise<boolean> => {
    const { accessToken } = await loadSecureTokens();
    if (!accessToken) {
      Alert.alert(
        "Kayıtlı Oturum Yok",
        "Biyometrik kilit açmayı kullanabilmek için önce e-posta ve şifrenizle en az bir kez giriş yapmalısınız."
      );
      return false;
    }

    const res = await LocalAuthentication.authenticateAsync({
      promptMessage: "Nexa ERP Güvenli Giriş",
      fallbackLabel: "Şifre ile Devam Et",
      cancelLabel: "İptal",
      disableDeviceFallback: false,
    });

    if (!res.success) {
      return false;
    }

    const net = await NetInfo.fetch();
    const online = Boolean(net.isConnected && net.isInternetReachable !== false);

    if (online) {
      try {
        await refreshSession();
        router.replace("/(tabs)");
        return true;
      } catch (err: any) {
        Alert.alert("Oturum Süresi Doldu", extractErrorMessage(err));
        await clearLocalSession();
        return false;
      }
    }

    const snapRaw = await AsyncStorage.getItem(SESSION_SNAPSHOT_KEY).catch(() => null);
    if (snapRaw) {
      const parsed: SessionSnapshot = JSON.parse(snapRaw);
      await applySessionSnapshot(parsed);
      router.replace("/(tabs)");
      return true;
    }

    return false;
  }, [applySessionSnapshot, clearLocalSession, refreshSession, router]);

  const logout = useCallback(async () => {
    try {
      const net = await NetInfo.fetch();
      if (net.isConnected) {
        await mobileApi.auth.logout().catch(() => {});
      }
    } finally {
      await clearLocalSession();
      router.replace("/");
    }
  }, [clearLocalSession, router]);

  const setActiveProject = useCallback(
    async (project: AssignedProject) => {
      setActiveProjectState(project);
      await setActiveProjectHeader(project.id);
      startLocationTracking({
        mode: locationTrackingMode,
        project,
        onGeofenceChange: (status) => {
          if (isMountedRef.current) setGeofenceStatus(status);
        },
      }).catch(() => {});
    },
    [locationTrackingMode]
  );

  const setBiometricEnabled = useCallback(async (enabled: boolean) => {
    setBiometricEnabledState(enabled);
    await AsyncStorage.setItem(BIOMETRIC_PREF_KEY, enabled ? "true" : "false").catch(
      () => {}
    );
  }, []);

  const hasModule = useCallback(
    (...keys: ModuleKey[]): boolean => {
      if (user?.role === "SUPER_ADMIN") return true;
      if (keys.length === 0) return true;
      return keys.some((k) => allowedModules.includes(k));
    },
    [allowedModules, user?.role]
  );

  const syncOfflineNow = useCallback(async () => {
    const result = await offlineSync.syncNow(queueExecutor);
    setOfflineQueueCount(offlineSync.getPendingCount());
    return result;
  }, []);

  return (
    <AuthContext.Provider
      value={{
        isBootstrapping,
        isAuthenticated,
        hasSavedSession,
        biometricAvailable,
        biometricEnabled,
        setBiometricEnabled,
        user,
        tenant,
        tenantType,
        role,
        allowedModules,
        assignedProjects,
        activeProject,
        locationTrackingMode,
        mobileProfile,
        isOnline,
        offlineQueueCount,
        geofenceStatus,
        login,
        unlockWithBiometrics,
        refreshSession,
        logout,
        setActiveProject,
        hasModule,
        syncOfflineNow,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth sadece AuthProvider içinde kullanılabilir.");
  }
  return ctx;
}

