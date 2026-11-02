import { useState, useEffect, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { clearAuthToken } from "../lib/api";

export type UserRole =
  | "ENGINEER"
  | "FOREMAN"
  | "DRIVER"
  | "WAREHOUSE"
  | "LOGISTICS"
  | "SUBCONTRACTOR"
  | "INSPECTOR"
  | "ADMIN";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  tenantName?: string;
  avatarUrl?: string;
}

const AUTH_USER_STORAGE_KEY = "@nexa_auth_user";

// Varsayılan mockup kullanıcı (İlk açılışta veya demo modunda)
const DEFAULT_USER: AuthUser = {
  id: "usr_eng_101",
  name: "Ahmet Yılmaz",
  email: "ahmet.yilmaz@nxerp.com.tr",
  role: "ENGINEER",
  tenantName: "Nexa İnşaat A.Ş.",
};

/**
 * Nexa ERP - Kullanıcı ve Rol Yönetimi Hook'u
 */
export function useAuth() {
  const [user, setUserState] = useState<AuthUser>(DEFAULT_USER);
  const [isLoading, setIsLoading] = useState(true);

  // AsyncStorage'dan oturum açmış kullanıcıyı yükle
  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(AUTH_USER_STORAGE_KEY);
        if (stored) {
          setUserState(JSON.parse(stored));
        }
      } catch (err) {
        console.warn("[useAuth] Kullanıcı yükleme hatası:", err);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  // Kullanıcıyı güncelle ve sakla
  const setUser = useCallback(async (newUser: AuthUser) => {
    setUserState(newUser);
    try {
      await AsyncStorage.setItem(AUTH_USER_STORAGE_KEY, JSON.stringify(newUser));
    } catch (err) {
      console.error("[useAuth] Kullanıcı kaydetme hatası:", err);
    }
  }, []);

  // Rol değiştirme (Test ve dinamik geçiş için)
  const setRole = useCallback(
    async (role: UserRole) => {
      const updated: AuthUser = {
        ...user,
        role,
      };
      await setUser(updated);
    },
    [user, setUser]
  );

  // Çıkış yap
  const logout = useCallback(async () => {
    clearAuthToken();
    try {
      await AsyncStorage.removeItem(AUTH_USER_STORAGE_KEY);
    } catch {
      // Hata yok sayılır
    }
    setUserState(DEFAULT_USER);
  }, []);

  return {
    user,
    role: user.role,
    isLoading,
    setUser,
    setRole,
    logout,
  };
}

export default useAuth;
