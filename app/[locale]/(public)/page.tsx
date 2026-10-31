/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * This code is the property of NXA Software.
 */

import type { Metadata } from "next"
import LandingPageClient from "./LandingPageClient"

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: "Nexa ERP | Şantiyenizin 4D Dijital İkizi & 5D BIM İşletim Sistemi",
  description: "Nexa ERP; 3D/5D BIM, IoT İSG takibi, offline-first şantiye günlüğü ve otonom hakediş motoruyla inşaat projelerinizi tek platformdan yöneten yeni nesil kurumsal B2B SaaS platformudur.",
  keywords: [
    "İnşaat ERP",
    "5D BIM",
    "4D Drone Dijital İkizi",
    "Offline-First",
    "Şantiye İSG",
    "Hakediş Blokesi",
    "Drone 4D",
    "Web-IFC",
    "İnşaat Yönetim Yazılımı",
    "B2B SaaS"
  ],
  openGraph: {
    title: "Nexa ERP | Şantiyenizin 4D Dijital İkizi & 5D BIM",
    description: "Maliyet kaçaklarını engelleyin, İSG ihlallerini sıfırlayın ve otonom hakediş motoruyla inşaat projelerinizi tek ekrandan yönetin.",
    type: "website",
    locale: "tr_TR"
  }
}

export default function Home() {
  return <LandingPageClient />
}