/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * This code is the property of NXA Software.
 */

import { NextResponse } from "next/server"
import NextAuth from "next-auth"
import { authConfig } from "@/lib/auth.config"
import createIntlMiddleware from "next-intl/middleware"
import { routing } from "@/i18n/routing"

// 1. next-intl middleware örneği (Tarayıcı dili algılama, Accept-Language, NEXT_LOCALE cookie)
const intlMiddleware = createIntlMiddleware(routing)

// Define role-based access control rules
const ROUTE_PROTECTION = {
  "/superadmin": ["SUPER_ADMIN"],
  "/super-admin": ["SUPER_ADMIN"],
  "/admin/procurement/logistics": [
    "SECURITY",
    "ADMIN",
    "SUPER_ADMIN",
    "MANAGER",
    "PROJECT_MANAGER",
    "PROCUREMENT_MANAGER"
  ],
  "/admin": [
    "ADMIN",
    "SUPER_ADMIN",
    "MANAGER",
    "PROJECT_MANAGER",
    "MUTEAHHIT",
    "MUHASEBE",
    "ACCOUNTANT",
    "HR_MANAGER",
    "FINANCE_MANAGER",
    "PROCUREMENT_MANAGER",
    "EQUIPMENT_MANAGER",
    "ISG_EXPERT",
    "SECURITY"
  ],
  "/inspection": ["INSPECTION_ADMIN", "INSPECTOR", "AUDITOR", "ADMIN", "SUPER_ADMIN"],
  "/subcontractor": ["SUBCONTRACTOR", "ADMIN", "SUPER_ADMIN"],
  "/supplier": ["SUPPLIER", "ADMIN", "SUPER_ADMIN"],
  "/personnel": [
    "ENGINEER",
    "SITE_MANAGER",
    "PERSONNEL",
    "STAFF",
    "WORKER",
    "DRIVER",
    "ADMIN",
    "SUPER_ADMIN"
  ],
  "/driver": ["DRIVER", "ADMIN", "SUPER_ADMIN"],
  "/dashboard": ["INSPECTION_ADMIN", "INSPECTOR", "AUDITOR", "ADMIN", "SUPER_ADMIN"],
  "/yibf": ["INSPECTION_ADMIN", "INSPECTOR", "AUDITOR", "ADMIN", "SUPER_ADMIN"],
  "/field": ["INSPECTION_ADMIN", "INSPECTOR", "AUDITOR", "ADMIN", "SUPER_ADMIN"],
  "/dispatch": ["INSPECTION_ADMIN", "INSPECTOR", "AUDITOR", "ADMIN", "SUPER_ADMIN"],
  "/map": ["INSPECTION_ADMIN", "INSPECTOR", "AUDITOR", "ADMIN", "SUPER_ADMIN"],
  "/reports": ["INSPECTION_ADMIN", "INSPECTOR", "AUDITOR", "ADMIN", "SUPER_ADMIN"],
  "/analytics": ["INSPECTION_ADMIN", "INSPECTOR", "AUDITOR", "ADMIN", "SUPER_ADMIN"],
  "/ai-assistant": ["INSPECTION_ADMIN", "INSPECTOR", "AUDITOR", "ADMIN", "SUPER_ADMIN"],
  "/settings": ["INSPECTION_ADMIN", "INSPECTOR", "AUDITOR", "ADMIN", "SUPER_ADMIN"],
}

// Multi-tenant & custom domain configuration
const MAIN_DOMAIN = (process.env.NEXT_PUBLIC_MAIN_DOMAIN || "app.nxa.com.tr").toLowerCase()
const LOCALHOST = "localhost"

const ALLOWED_DOMAINS = [
  "nxerp.com.tr",
  "www.nxerp.com.tr",
  "nexa-erp.com",
  "www.nexa-erp.com",
  MAIN_DOMAIN
]

// Add configured env domains if present
if (process.env.NEXT_PUBLIC_APP_URL) {
  try {
    ALLOWED_DOMAINS.push(new URL(process.env.NEXT_PUBLIC_APP_URL).hostname.toLowerCase())
  } catch {}
}
if (process.env.NEXTAUTH_URL) {
  try {
    ALLOWED_DOMAINS.push(new URL(process.env.NEXTAUTH_URL).hostname.toLowerCase())
  } catch {}
}

export default NextAuth(authConfig).auth((req) => {
  const { pathname } = req.nextUrl
  const session = req.auth

  // --- PUBLIC ROTA İSTİSNASI (Şoför SMS Takip Ekranı vb.) ---
  if (pathname.startsWith("/track")) {
    return NextResponse.next()
  }

  // --- 0. OTOMATİK DİL ALGILAMA & YÖNLENDİRME (next-intl) ---
  const locales = routing.locales
  const isLocalePath = locales.some((l) => pathname === `/${l}` || pathname.startsWith(`/${l}/`))
  if (!isLocalePath) {
    const intlResponse = intlMiddleware(req)
    if (intlResponse) {
      return intlResponse
    }
  }

  // Aktif locale ve normalize edilmiş (locale öneksiz) rota
  const localeMatch = pathname.match(/^\/(tr|en|de|ru|ar)(\/.*)?$/)
  const currentLocale = localeMatch ? localeMatch[1] : routing.defaultLocale
  const normalizedPath = localeMatch ? (localeMatch[2] || "/") : pathname

  // Helper: Mevcut locale'i koruyarak güvenli yönlendirme
  const redirectWithLocale = (targetPath: string) => {
    const redirectUrl = req.nextUrl.clone()
    const cleanTarget = targetPath.startsWith("/") ? targetPath : `/${targetPath}`
    redirectUrl.pathname = `/${currentLocale}${cleanTarget}`
    return NextResponse.redirect(redirectUrl)
  }

  // --- 0. ROUTE GROUP URL NORMALIZATION ---
  if (normalizedPath.startsWith("/(inspection)")) {
    const cleanPath = normalizedPath.replace("/(inspection)", "") || "/dashboard"
    return redirectWithLocale(cleanPath)
  }

  // --- 1. DOMAIN & HOSTNAME KONTROLÜ ---
  const hostHeader = req.headers.get("x-forwarded-host") || req.headers.get("host") || req.nextUrl.hostname || ""
  const cleanHostname = hostHeader.replace(/^https?:\/\//, "").split(":")[0].toLowerCase().trim()
  const isVercelDomain = cleanHostname.endsWith(".vercel.app")
  const isLocal = cleanHostname.startsWith(LOCALHOST) || cleanHostname.startsWith("127.0.0.1") || cleanHostname === ""
  const isAllowedHost = isLocal || isVercelDomain || ALLOWED_DOMAINS.includes(cleanHostname)

  if (!isAllowedHost) {
    // Normal akışa devam et
  }

  // --- 2. RBAC & KESİN YÖNLENDİRME KONTROLLERİ ---
  const userRole = ((session?.user?.role as string) || "").toUpperCase()
  const isOnLoginPage = normalizedPath === "/login" || normalizedPath.endsWith("/login")

  // Giriş Yapmış Kullanıcı /login veya / (Kök Dizin) Sayfasındaysa Rolüne Göre Yönlendirme
  if ((isOnLoginPage || normalizedPath === "/") && session) {
    // 0. SUPER_ADMIN ➔ /admin
    if (userRole === "SUPER_ADMIN") {
      return redirectWithLocale("/admin")
    }

    // 1. INSPECTION_ADMIN veya INSPECTOR ➔ /inspection/dashboard
    if (userRole === "INSPECTION_ADMIN" || userRole === "INSPECTOR" || userRole === "AUDITOR") {
      return redirectWithLocale("/inspection/dashboard")
    }

    // 2. SUBCONTRACTOR ➔ /subcontractor
    if (userRole === "SUBCONTRACTOR") {
      return redirectWithLocale("/subcontractor")
    }

    // 3. DRIVER ➔ /personnel
    if (userRole === "DRIVER") {
      return redirectWithLocale("/personnel")
    }

    // 4. SECURITY ➔ /admin/procurement/logistics
    if (userRole === "SECURITY") {
      return redirectWithLocale("/admin/procurement/logistics")
    }

    // 5. WORKER ➔ /personnel
    if (userRole === "WORKER") {
      return redirectWithLocale("/personnel")
    }

    // 6. ENGINEER, SITE_MANAGER veya PERSONNEL ➔ /personnel/dashboard
    if (
      userRole === "ENGINEER" ||
      userRole === "SITE_MANAGER" ||
      userRole === "PERSONNEL" ||
      userRole === "STAFF"
    ) {
      return redirectWithLocale("/personnel/dashboard")
    }

    // 7. SUPPLIER ➔ /supplier
    if (userRole === "SUPPLIER") {
      return redirectWithLocale("/supplier")
    }

    // 8. Departman Bazlı Manager Yönlendirmeleri
    if (userRole === "HR_MANAGER") {
      return redirectWithLocale("/admin/personel")
    }
    if (userRole === "FINANCE_MANAGER") {
      return redirectWithLocale("/admin/finance")
    }
    if (userRole === "PROCUREMENT_MANAGER") {
      return redirectWithLocale("/admin/procurement")
    }
    if (userRole === "EQUIPMENT_MANAGER") {
      return redirectWithLocale("/admin/equipments")
    }
    if (userRole === "ISG_EXPERT") {
      return redirectWithLocale("/admin/personel/alerts")
    }

    // 9. ADMIN veya MANAGER ➔ /admin
    return redirectWithLocale("/admin")
  }

  // Kullanıcı Giriş Yapmamışsa ve Korumalı Rotalardaysa Login'e Yönlendir
  const isProtectedRoute = Object.keys(ROUTE_PROTECTION).some(route => normalizedPath.startsWith(route))
  if (isProtectedRoute && !session && !isOnLoginPage) {
    return redirectWithLocale("/login")
  }

  // --- ROL BAZLI YALITIM VE ERİŞİM KORUMASI (ROUTE CONFINEMENT) ---

  // A0. DRIVER: Sadece /personnel, /driver veya mobil arayüz rotalarına erişebilir. KESİNLİKLE /admin veya /superadmin rotalarına erişemez.
  if (userRole === "DRIVER") {
    if (
      normalizedPath.startsWith("/admin") ||
      normalizedPath.startsWith("/superadmin") ||
      normalizedPath.startsWith("/super-admin") ||
      normalizedPath.startsWith("/subcontractor") ||
      normalizedPath.startsWith("/supplier") ||
      normalizedPath.startsWith("/dashboard") ||
      normalizedPath.startsWith("/inspection")
    ) {
      return redirectWithLocale("/personnel")
    }
  }

  // A1. SECURITY: Sadece /admin/procurement/logistics rotasına ve alt rotalarına erişebilir (veya özel bir /security rotası varsa oraya).
  if (userRole === "SECURITY") {
    const isAllowedSecurityPath =
      normalizedPath.startsWith("/admin/procurement/logistics") ||
      normalizedPath.startsWith("/security")

    if (!isAllowedSecurityPath && !isOnLoginPage) {
      return redirectWithLocale("/admin/procurement/logistics")
    }
  }

  // A. ENGINEER, SITE_MANAGER, PERSONNEL, STAFF, WORKER:
  const isPersonnelScope =
    userRole === "ENGINEER" ||
    userRole === "SITE_MANAGER" ||
    userRole === "PERSONNEL" ||
    userRole === "STAFF" ||
    userRole === "WORKER"

  if (isPersonnelScope) {
    if (
      normalizedPath.startsWith("/admin") ||
      normalizedPath.startsWith("/subcontractor") ||
      normalizedPath.startsWith("/supplier") ||
      normalizedPath.startsWith("/dashboard") ||
      normalizedPath.startsWith("/inspection")
    ) {
      return redirectWithLocale("/personnel/dashboard")
    }
  }

  // B. SUBCONTRACTOR: Sadece /subcontractor rotalarına erişebilir
  if (userRole === "SUBCONTRACTOR") {
    if (
      normalizedPath.startsWith("/admin") ||
      normalizedPath.startsWith("/personnel") ||
      normalizedPath.startsWith("/supplier") ||
      normalizedPath.startsWith("/dashboard") ||
      normalizedPath.startsWith("/inspection")
    ) {
      return redirectWithLocale("/subcontractor")
    }
    if (!normalizedPath.startsWith("/subcontractor") && !isOnLoginPage) {
      return redirectWithLocale("/subcontractor")
    }
  }

  // C. SUPPLIER: Sadece /supplier rotalarına erişebilir
  if (userRole === "SUPPLIER") {
    if (
      normalizedPath.startsWith("/admin") ||
      normalizedPath.startsWith("/personnel") ||
      normalizedPath.startsWith("/subcontractor") ||
      normalizedPath.startsWith("/dashboard") ||
      normalizedPath.startsWith("/inspection")
    ) {
      return redirectWithLocale("/supplier")
    }
    if (!normalizedPath.startsWith("/supplier") && !isOnLoginPage) {
      return redirectWithLocale("/supplier")
    }
  }

  // D. INSPECTION_ADMIN & INSPECTOR: Yapı Denetimciler KESİNLİKLE /inspection/dashboard içinde kalmalı
  if (userRole === "INSPECTION_ADMIN" || userRole === "INSPECTOR" || userRole === "AUDITOR") {
    if (
      normalizedPath === "/admin" ||
      normalizedPath.startsWith("/subcontractor") ||
      normalizedPath.startsWith("/supplier") ||
      normalizedPath.startsWith("/personnel")
    ) {
      return redirectWithLocale("/inspection/dashboard")
    }

    const contractorOnlyPaths = [
      "/admin/procurement",
      "/admin/subcontractors",
      "/admin/bim",
      "/admin/crm",
      "/admin/shifts",
      "/admin/approvals",
      "/admin/food-menu",
      "/admin/equipments",
      "/admin/routes",
      "/admin/drone-maps",
      "/admin/logistics",
      "/admin/inventory/qr-scanner"
    ]
    if (contractorOnlyPaths.some(p => normalizedPath.startsWith(p))) {
      return redirectWithLocale("/inspection/dashboard")
    }

    if (userRole === "INSPECTOR" || userRole === "AUDITOR") {
      const inspectorRestrictedPaths = [
        "/admin/finance",
        "/admin/payroll",
        "/admin/attendance",
        "/admin/personel",
        "/admin/personnel",
        "/admin/billing",
        "/admin/progress-payments",
        "/admin/contracts",
        "/inspection/finance",
        "/inspection/billing",
        "/inspection/personnel",
        "/inspection/personel",
        "/inspection/crm",
        "/inspection/companies",
        "/inspection/contracts"
      ]
      if (inspectorRestrictedPaths.some(p => normalizedPath.startsWith(p))) {
        return redirectWithLocale("/inspection/dashboard")
      }
    }
  }

  // E. DEPARTMAN BAZLI YALITIM
  if (userRole === "HR_MANAGER") {
    const hrRestricted = [
      "/admin/finance",
      "/admin/billing",
      "/admin/progress-payments",
      "/admin/procurement",
      "/admin/equipments",
      "/admin/inventory",
      "/admin/subcontractors/contracts",
      "/admin/subcontractors/deductions",
      "/admin/bim",
      "/admin/samples",
      "/admin/forms",
    ]
    if (hrRestricted.some((p) => normalizedPath.startsWith(p))) {
      return redirectWithLocale("/admin/personel")
    }
  }

  if (userRole === "FINANCE_MANAGER") {
    const finRestricted = [
      "/admin/personel",
      "/admin/personnel",
      "/admin/attendance",
      "/admin/payroll",
      "/admin/shifts",
      "/admin/food-menu",
      "/admin/forms",
      "/admin/samples",
      "/admin/qa-qc",
      "/admin/deficiencies",
    ]
    if (finRestricted.some((p) => normalizedPath.startsWith(p))) {
      return redirectWithLocale("/admin/finance")
    }
  }

  if (userRole === "PROCUREMENT_MANAGER") {
    const procRestricted = [
      "/admin/personel",
      "/admin/personnel",
      "/admin/attendance",
      "/admin/payroll",
      "/admin/shifts",
      "/admin/food-menu",
      "/admin/billing",
      "/admin/progress-payments",
      "/admin/finance/documents",
    ]
    if (procRestricted.some((p) => normalizedPath.startsWith(p))) {
      return redirectWithLocale("/admin/procurement")
    }
  }

  if (userRole === "EQUIPMENT_MANAGER") {
    const equipRestricted = [
      "/admin/finance",
      "/admin/billing",
      "/admin/payroll",
      "/admin/attendance",
      "/admin/shifts",
      "/admin/personel",
      "/admin/progress-payments",
    ]
    if (equipRestricted.some((p) => normalizedPath.startsWith(p))) {
      return redirectWithLocale("/admin/equipments")
    }
  }

  if (userRole === "ISG_EXPERT") {
    const isgRestricted = [
      "/admin/finance",
      "/admin/billing",
      "/admin/payroll",
      "/admin/attendance",
      "/admin/procurement",
      "/admin/progress-payments",
      "/admin/shifts",
    ]
    if (isgRestricted.some((p) => normalizedPath.startsWith(p))) {
      return redirectWithLocale("/admin/personel/alerts")
    }
  }

  // F. Genel Rol ve Rota Koruması
  const protectedRoute = Object.keys(ROUTE_PROTECTION).find(route => normalizedPath.startsWith(route))
  if (protectedRoute) {
    const allowedRoles = ROUTE_PROTECTION[protectedRoute as keyof typeof ROUTE_PROTECTION]
    if (!userRole || !allowedRoles.includes(userRole)) {
      if (userRole === "STAFF" || userRole === "WORKER" || userRole === "DRIVER") {
        return redirectWithLocale("/personnel")
      } else if (userRole === "SECURITY") {
        return redirectWithLocale("/admin/procurement/logistics")
      } else if (userRole === "SUBCONTRACTOR") {
        return redirectWithLocale("/subcontractor")
      } else if (userRole === "SUPPLIER") {
        return redirectWithLocale("/supplier")
      } else if (userRole === "INSPECTOR" || userRole === "AUDITOR" || userRole === "INSPECTION_ADMIN") {
        return redirectWithLocale("/dashboard")
      } else {
        return redirectWithLocale("/unauthorized")
      }
    }
  }

  return intlMiddleware(req)
})

// Configure middleware matcher for better performance
export const config = {
  matcher: [
    // Match all paths except static files, images, and public assets
    "/((?!_next/static|_next/image|favicon.ico|public|api/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|woff|woff2|ttf|eot|ifc|wasm|glb|gltf)$).*)",
  ],
}
