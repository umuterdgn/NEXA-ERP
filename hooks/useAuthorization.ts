"use client";

/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Nexa ERP - useAuthorization Hook
 * Kullanıcının rolüne göre ekran ve yetki kontrollerini yönetir.
 * Eğer user.role === 'DRIVER' ise sadece "Sürücü Portalı"nı görsün. Diğer menüler gizlensin.
 */

import { useSession } from "next-auth/react";
import { useMemo } from "react";
import {
  UserRole,
  ROLE_DEFINITIONS,
  isRouteAllowedForRole,
} from "@/lib/constants/Roles";

export function useAuthorization() {
  const { data: session, status } = useSession();

  const user = session?.user as any;
  const role: UserRole | undefined = user?.role;

  const authData = useMemo(() => {
    const isDriver = role === "DRIVER";
    const isSecurity = role === "SECURITY";
    const isSubcontractor = role === "SUBCONTRACTOR";
    const isInspector = role === "INSPECTOR" || role === "AUDITOR" || role === "INSPECTION_ADMIN";
    const isAdmin = role === "ADMIN" || role === "SUPER_ADMIN";
    const isSuperAdmin = role === "SUPER_ADMIN";

    const roleDef = role ? ROLE_DEFINITIONS[role] : null;

    return {
      user,
      role,
      roleTitle: roleDef?.title || "Kullanıcı",
      category: roleDef?.category || "GENEL",
      defaultRoute: roleDef?.defaultRoute || "/admin",
      isDriver,
      isSecurity,
      isSubcontractor,
      isInspector,
      isAdmin,
      isSuperAdmin,
      // Sürücü kısıtlaması: Sadece sürücü portalı izni
      canAccessMenu: (menuHref: string) => isRouteAllowedForRole(role, menuHref),
      // Belirli bir portala erişim izni
      canAccessPortal: (portalKey: string) => {
        if (isAdmin) return true;
        if (isDriver) return portalKey === "driver" || portalKey === "driver-portal";
        if (isSecurity) return portalKey === "security" || portalKey === "logistics";
        if (isSubcontractor) return portalKey === "subcontractor";
        if (isInspector) return portalKey === "inspection" || portalKey === "qa-qc";
        return true;
      },
    };
  }, [user, role]);

  return {
    ...authData,
    isLoading: status === "loading",
    isAuthenticated: !!session?.user,
  };
}

export default useAuthorization;

