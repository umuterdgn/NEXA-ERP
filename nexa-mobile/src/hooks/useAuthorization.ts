import { useState, useEffect } from "react";
import { getAuthSession } from "../../apiClient";
import { UserRole } from "../constants/Roles";

export function useAuthorization() {
  const [role, setRole] = useState<UserRole | null>(null);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const session = await getAuthSession();
        if (session) {
          const u = session.user || session;
          setUser(u);
          const userRole = (u?.role || (session as any)?.role) as UserRole;
          setRole(userRole || "ENGINEER");
        }
      } catch (err) {
        console.warn("Auth check error in useAuthorization:", err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const isDriver = role === "DRIVER";
  const isSecurity = role === "SECURITY";
  const isSubcontractor = role === "SUBCONTRACTOR";
  const isInspector = role === "INSPECTOR" || role === "AUDITOR" || role === "INSPECTION_ADMIN";
  const isAdmin = role === "ADMIN" || role === "SUPER_ADMIN" || role === "SITE_MANAGER";

  return {
    user,
    role,
    loading,
    isDriver,
    isSecurity,
    isSubcontractor,
    isInspector,
    isAdmin,
    canAccessPortal: (portalKey: string) => {
      if (isAdmin) return true;
      if (isDriver) return portalKey === "driver";
      if (isSecurity) return portalKey === "security";
      if (isSubcontractor) return portalKey === "subcontractor";
      if (isInspector) return portalKey === "inspection";
      return true;
    },
  };
}
