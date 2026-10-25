/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * SaaS Çoklu Kiracı (Multi-Tenant) İzolasyon ve Güvenlik Bariyeri
 */

import { notFound } from "next/navigation";

export interface TenantAccessResult {
  allowed: boolean;
  reason?: string;
}

/**
 * Kullanıcının belirli bir operasyonel kayda (Proje, Sözleşme, Fatura vb.) erişim hakkını tenant bazında doğrular.
 * SUPER_ADMIN rolü istisna olup tüm firmaların verilerini görebilir.
 * Normal mühendis, yönetici veya denetçi başka firmanın tenantId'sine sahip kayda erişmeye çalıştığında engellenir.
 */
export function checkTenantAccess(
  recordTenantId: string | null | undefined,
  session: any
): TenantAccessResult {
  const userRole = session?.user?.role;
  const userTenantId = (session?.user as any)?.tenantId;

  // Superadmin her şeyi denetleyebilir
  if (userRole === "SUPER_ADMIN") {
    return { allowed: true };
  }

  // Eğer kayıtta tenantId yoksa (eski/genel kayıt) veya kullanıcının tenantId'si henüz atanmamışsa geçiş verilir
  if (!recordTenantId || !userTenantId) {
    return { allowed: true };
  }

  // Tenant uyuşmazlığı kontrolü:
  if (recordTenantId !== userTenantId) {
    return {
      allowed: false,
      reason: `Çapraz Kiracı İhlali: Kullanıcı (${userTenantId}) başka bir firmanın (${recordTenantId}) verisine erişemez.`,
    };
  }

  return { allowed: true };
}

/**
 * Sayfa düzeyinde çağrıldığında, eğer kullanıcı başka firmanın projesine URL üzerinden sızmaya çalışıyorsa 404 Not Found fırlatır.
 */
export function enforceTenantBarrier(
  recordTenantId: string | null | undefined,
  session: any
): void {
  const result = checkTenantAccess(recordTenantId, session);
  if (!result.allowed) {
    console.warn(`[SECURITY ALERT] Multi-Tenant Barrier Blocked Access: ${result.reason}`);
    notFound();
  }
}

/**
 * Firmanın belirli bir SaaS özelliğine (Örn: 3D BIM, AI Vision, OCR) erişim yetkisi olup olmadığını kontrol eder.
 */
export function isTenantFeatureEnabled(
  tenantFeatures: string[] | null | undefined,
  featureKey: string
): boolean {
  if (!tenantFeatures || !Array.isArray(tenantFeatures)) return true;
  return tenantFeatures.includes(featureKey);
}
