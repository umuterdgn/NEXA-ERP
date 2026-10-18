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
  "/admin": ["ADMIN", "SUPER_ADMIN", "SITE_MANAGER", "MUHASEBE", "ENGINEER", "INSPECTOR", "AUDITOR"],
  "/subcontractor": ["SUBCONTRACTOR"],
  "/personnel": ["STAFF", "WORKER", "SITE_MANAGER", "ENGINEER", "ADMIN", "SUPER_ADMIN"],
  "/inspection": ["INSPECTOR", "AUDITOR"]
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

  // --- 1. DOMAIN & HOSTNAME KONTROLÜ ---
  const hostHeader = req.headers.get("x-forwarded-host") || req.headers.get("host") || req.nextUrl.hostname || ""
  const cleanHostname = hostHeader.replace(/^https?:\/\//, "").split(":")[0].toLowerCase().trim()
  const isVercelDomain = cleanHostname.endsWith(".vercel.app")
  const isLocal = cleanHostname.startsWith(LOCALHOST) || cleanHostname.startsWith("127.0.0.1") || cleanHostname === ""
  const isAllowedHost = isLocal || isVercelDomain || ALLOWED_DOMAINS.includes(cleanHostname)

  // nxerp.com.tr, www.nxerp.com.tr, Vercel ve Localhost gibi tüm yasal hostlar normal akışa devam eder.
  // Not: Uygulamada dinamik `/[cleanHostname]` rota dizini bulunmadığından rewrite yapılmamalı, 404 önlenmelidir.
  if (!isAllowedHost) {
    // Bilinmeyen veya yapılandırılmamış hostlar için varsayılan olarak normal erişime izin ver
    // veya istenirse ana domaine yönlendir
  }

  // --- 2. RBAC KONTROLLERİ ---
  
  const userRole = session?.user?.role as string
  const isOnLoginPage = pathname === "/login"

  // SUBCONTRACTOR kontrolü
  if (userRole === "SUBCONTRACTOR") {
    if (pathname.startsWith("/admin") || pathname.startsWith("/personnel")) {
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

  // Rol kontrolü
  const protectedRoute = Object.keys(ROUTE_PROTECTION).find(route => pathname.startsWith(route))
  if (protectedRoute) {
    const allowedRoles = ROUTE_PROTECTION[protectedRoute as keyof typeof ROUTE_PROTECTION]
    if (!userRole || !allowedRoles.includes(userRole)) {
      const redirectUrl = req.nextUrl.clone()
      redirectUrl.pathname = "/unauthorized"
      return NextResponse.redirect(redirectUrl)
    }
  }

  // Login page redirect
  if (isOnLoginPage && session) {
    const redirectUrl = req.nextUrl.clone()
    if (userRole === "SUPER_ADMIN") {
      redirectUrl.pathname = "/admin"
      return NextResponse.redirect(redirectUrl)
    }
    if (userRole === "SUBCONTRACTOR") {
      redirectUrl.pathname = "/subcontractor"
      return NextResponse.redirect(redirectUrl)
    }
    if (userRole === "STAFF" || userRole === "WORKER") {
      redirectUrl.pathname = "/personnel"
      return NextResponse.redirect(redirectUrl)
    }
    redirectUrl.pathname = "/admin"
    return NextResponse.redirect(redirectUrl)
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
