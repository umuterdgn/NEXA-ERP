/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Role verification utilities for multi-tier workflows (No 'use server' - safe for Client & Server)
 */

export function isEngineerRole(role?: string): boolean {
  if (!role) return false;
  return ["STAFF", "ENGINEER"].includes(role);
}

export function isManagerRole(role?: string): boolean {
  if (!role) return false;
  return ["SITE_MANAGER", "PROJECT_MANAGER", "ADMIN", "SUPER_ADMIN", "INSPECTION_ADMIN"].includes(role);
}
