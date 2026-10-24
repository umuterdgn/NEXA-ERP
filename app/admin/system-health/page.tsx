/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Enterprise Diagnostics & System Health Sayfası (/admin/system-health)
 */

import { Metadata } from "next"
import SystemHealthClient from "./SystemHealthClient"

export const metadata: Metadata = {
  title: "Sistem Sağlığı & Check-up (Diagnostics) | NEXA ERP",
  description: "Enterprise Diagnostics Engine: RBAC, Finans, Yapı Denetim, Jurnal ve Harici API Doğrulama Merkezi",
}

export const dynamic = "force-dynamic"

export default function SystemHealthPage() {
  return <SystemHealthClient />
}
