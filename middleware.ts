/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * This code is the property of NXA Software.
 */

import { NextResponse } from "next/server"
import NextAuth from "next-auth"
import { authConfig } from "@/lib/auth.config"

// Define role-based access control rules
const ROUTE_PROTECTION = {
  "/admin": ["ADMIN", "SUPER_ADMIN", "SITE_MANAGER", "MUHASEBE", "ENGINEER"],
  "/subcontractor": ["SUBCONTRACTOR", "ADMIN", "SUPER_ADMIN"],
  "/personnel": ["STAFF", "WORKER", "SITE_MANAGER", "ENGINEER", "ADMIN", "SUPER_ADMIN"],
  "/dashboard": ["INSPECTOR", "AUDITOR", "ADMIN", "SUPER_ADMIN"],
  "/yibf": ["INSPECTOR", "AUDITOR", "ADMIN", "SUPER_ADMIN"],
  "/field": ["INSPECTOR", "AUDITOR", "ADMIN", "SUPER_ADMIN"],
  "/dispatch": ["INSPECTOR", "AUDITOR", "ADMIN", "SUPER_ADMIN"],
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

  // --- 0. ROUTE GROUP URL NORMALIZATION ---
  if (pathname.startsWith("/(inspection)")) {
    const cleanPath = pathname.replace("/(inspection)", "") || "/dashboard"
    const redirectUrl = req.nextUrl.clone()
    redirectUrl.pathname = cleanPath
    return NextResponse.redirect(redirectUrl)
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
  
  const userRole = session?.user?.role as string
  const isOnLoginPage = pathname === "/login"

  // Giriş Yapmış Kullanıcı /login veya / Sayfasındaysa Kesin Yönlendirme (Redirect)
  if ((isOnLoginPage || pathname === "/") && session) {
    const redirectUrl = req.nextUrl.clone()

    // 1. role === 'INSPECTOR' (Yapı Denetim) ➔ /dashboard (veya /(inspection)/dashboard)
    if (userRole === "INSPECTOR" || userRole === "AUDITOR") {
      redirectUrl.pathname = "/dashboard"
      return NextResponse.redirect(redirectUrl)
    }

    // 2. role === 'SUBCONTRACTOR' ➔ /subcontractor
    if (userRole === "SUBCONTRACTOR") {
      redirectUrl.pathname = "/subcontractor"
      return NextResponse.redirect(redirectUrl)
    }

    // 3. role === 'WORKER' veya 'STAFF' ➔ /personnel (Admin'e atma bug'ı çözüldü)
    if (userRole === "STAFF" || userRole === "WORKER") {
      redirectUrl.pathname = "/personnel"
      return NextResponse.redirect(redirectUrl)
    }

    // 4. role === 'SITE_MANAGER' ➔ /admin (Şantiye Şefi)
    if (userRole === "SITE_MANAGER") {
      redirectUrl.pathname = "/admin"
      return NextResponse.redirect(redirectUrl)
    }

    // 5. role === 'ADMIN' veya 'SUPER_ADMIN' ➔ /admin
    redirectUrl.pathname = "/admin"
    return NextResponse.redirect(redirectUrl)
  }

  // Kullanıcı Giriş Yapmamışsa ve Korumalı Rotalardaysa Login'e Yönlendir
  const isProtectedRoute = Object.keys(ROUTE_PROTECTION).some(route => pathname.startsWith(route))
  if (isProtectedRoute && !session && !isOnLoginPage) {
    const redirectUrl = req.nextUrl.clone()
    redirectUrl.pathname = "/login"
    return NextResponse.redirect(redirectUrl)
  }

  // --- ROL BAZLI YALITIM VE YÖNLENDİRME (ROUTING CONFINEMENT) ---

  // A. WORKER veya STAFF: Admin'e girmeye çalıştığında /personnel'e yönlendir (Admin bug'ı kesin çözümü)
  if (userRole === "STAFF" || userRole === "WORKER") {
    if (pathname.startsWith("/admin") || pathname.startsWith("/subcontractor") || pathname.startsWith("/dashboard")) {
      const redirectUrl = req.nextUrl.clone()
      redirectUrl.pathname = "/personnel"
      return NextResponse.redirect(redirectUrl)
    }
  }

  // B. SUBCONTRACTOR: Sadece /subcontractor rotalarına erişebilir
  if (userRole === "SUBCONTRACTOR") {
    if (pathname.startsWith("/admin") || pathname.startsWith("/personnel") || pathname.startsWith("/dashboard")) {
      const redirectUrl = req.nextUrl.clone()
      redirectUrl.pathname = "/subcontractor"
      return NextResponse.redirect(redirectUrl)
    }
    if (!pathname.startsWith("/subcontractor") && !isOnLoginPage) {
      const redirectUrl = req.nextUrl.clone()
      redirectUrl.pathname = "/subcontractor"
      return NextResponse.redirect(redirectUrl)
    }
  }

  // C. INSPECTOR / AUDITOR: Yapı Denetimciler Kasa, Finans, İK, Bordro görmemeli, /dashboard ve denetim modüllerine odaklı kalmalı
  if (userRole === "INSPECTOR" || userRole === "AUDITOR") {
    // Yasaklı admin rotaları: finans, muhasebe, ik, bordro, personel, puantaj
    const restrictedAdminPaths = [
      "/admin/finance",
      "/admin/payroll",
      "/admin/attendance",
      "/admin/personel",
      "/admin/personnel",
      "/admin/billing",
      "/admin/progress-payments",
      "/admin/procurement",
      "/admin/shifts",
      "/admin/approvals",
      "/admin/food-menu"
    ]
    if (restrictedAdminPaths.some(p => pathname.startsWith(p)) || pathname === "/admin") {
      const redirectUrl = req.nextUrl.clone()
      redirectUrl.pathname = "/dashboard"
      return NextResponse.redirect(redirectUrl)
    }
  }

  // D. Genel Rol ve Rota Koruması
  const protectedRoute = Object.keys(ROUTE_PROTECTION).find(route => pathname.startsWith(route))
  if (protectedRoute) {
    const allowedRoles = ROUTE_PROTECTION[protectedRoute as keyof typeof ROUTE_PROTECTION]
    if (!userRole || !allowedRoles.includes(userRole)) {
      // Eğer kendi portalı varsa oraya, yoksa unauthorized
      const redirectUrl = req.nextUrl.clone()
      if (userRole === "STAFF" || userRole === "WORKER") {
        redirectUrl.pathname = "/personnel"
      } else if (userRole === "SUBCONTRACTOR") {
        redirectUrl.pathname = "/subcontractor"
      } else if (userRole === "INSPECTOR" || userRole === "AUDITOR") {
        redirectUrl.pathname = "/dashboard"
      } else {
        redirectUrl.pathname = "/unauthorized"
      }
      return NextResponse.redirect(redirectUrl)
    }
  }

  return NextResponse.next()
})

// Configure middleware matcher for better performance
export const config = {
  matcher: [
    // Match all paths except static files, images, and public assets
    "/((?!_next/static|_next/image|favicon.ico|public|api/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|woff|woff2|ttf|eot|ifc|wasm|glb|gltf)$).*)",
  ],
}
