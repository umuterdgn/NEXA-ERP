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
  "/personnel": ["STAFF", "WORKER"],
  "/inspection": ["INSPECTOR", "AUDITOR"]
}

// Multi-tenant domain configuration
const MAIN_DOMAIN = process.env.NEXT_PUBLIC_MAIN_DOMAIN || "app.nxa.com.tr"
const LOCALHOST = "localhost"

export default NextAuth(authConfig).auth((req) => {
  const { pathname } = req.nextUrl
  const session = req.auth

  // --- 1. MULTI-TENANT DOMAIN (SaaS) YÖNLENDİRMESİ ---
  
  const hostname = req.headers.get("host") || ""
  const cleanHostname = hostname.replace(/^https?:\/\//, "")
  const isVercelDomain = cleanHostname.endsWith(".vercel.app")
  const isCustomDomain = cleanHostname === "nexa-erp.com" || cleanHostname === "www.nexa-erp.com"

  if (cleanHostname === MAIN_DOMAIN || cleanHostname.startsWith(LOCALHOST) || isVercelDomain || isCustomDomain) {
    // Normal auth kontrolüne geç
  } else {
    const url = req.nextUrl.clone()
    url.pathname = `/${cleanHostname}${url.pathname}`
    return NextResponse.rewrite(url)
  }

  // --- 2. RBAC KONTROLLERİ ---
  
  const userRole = session?.user?.role as string
  const isOnLoginPage = pathname === "/login"

  // SUBCONTRACTOR kontrolü
  if (userRole === "SUBCONTRACTOR") {
    if (pathname.startsWith("/admin") || pathname.startsWith("/personnel")) {
      return NextResponse.redirect(new URL("/subcontractor", req.url))
    }
    if (!pathname.startsWith("/subcontractor") && !isOnLoginPage) {
      return NextResponse.redirect(new URL("/subcontractor", req.url))
    }
  }

  // Rol kontrolü
  const protectedRoute = Object.keys(ROUTE_PROTECTION).find(route => pathname.startsWith(route))
  if (protectedRoute) {
    const allowedRoles = ROUTE_PROTECTION[protectedRoute as keyof typeof ROUTE_PROTECTION]
    if (!userRole || !allowedRoles.includes(userRole)) {
      return NextResponse.redirect(new URL("/unauthorized", req.url))
    }
  }

  // Login page redirect
  if (isOnLoginPage && session) {
    if (userRole === "SUPER_ADMIN") return NextResponse.redirect(new URL("/admin", req.url))
    if (userRole === "SUBCONTRACTOR") return NextResponse.redirect(new URL("/subcontractor", req.url))
    if (userRole === "STAFF" || userRole === "WORKER") return NextResponse.redirect(new URL("/personnel", req.url))
    return NextResponse.redirect(new URL("/admin", req.url))
  }

  return NextResponse.next()
})

// Configure middleware matcher for better performance
export const config = {
  matcher: [
    // Match all paths except static files, images, and public assets
    "/((?!_next/static|_next/image|favicon.ico|public|api/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|woff|woff2|ttf|eot)$).*)",
  ],
}
