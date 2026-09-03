/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * This code is the property of NXA Software.
 */

import NextAuth from "next-auth"
import { authConfig } from "@/lib/auth.config"
import { NextResponse } from "next/server"

// Ana domain ve localhost tanımları
const MAIN_DOMAIN = process.env.NEXT_PUBLIC_MAIN_DOMAIN || "app.nxa.com.tr"
const LOCALHOST = "localhost"

export default NextAuth(authConfig).auth((req) => {
  const isLoggedIn = !!req.auth
  const isOnAdminPanel = req.nextUrl.pathname.startsWith("/admin")
  const isOnSuperAdminPanel = req.nextUrl.pathname.startsWith("/super-admin")
  const isOnSubcontractorPanel = req.nextUrl.pathname.startsWith("/subcontractor")
  const isOnLoginPage = req.nextUrl.pathname === "/login"
  const isOnPersonnelPage = req.nextUrl.pathname.startsWith("/personnel")

  const userRole = req.auth?.user?.role

  // --- 1. YETKİLENDİRME VE GÜVENLİK (Auth) KONTROLLERİ ---

  // SUBCONTRACTOR rolü için güvenlik kontrolü
  if (userRole === "SUBCONTRACTOR" as any) {
    // Taşeronlar sadece /subcontractor rotasına erişebilir
    if (isOnAdminPanel || isOnSuperAdminPanel || isOnPersonnelPage) {
      return NextResponse.redirect(new URL("/subcontractor", req.nextUrl))
    }
    // Taşeron /subcontractor dışındaki sayfalara girmeye çalışırsa
    if (!isOnSubcontractorPanel && !isOnLoginPage) {
      return NextResponse.redirect(new URL("/subcontractor", req.nextUrl))
    }
  }

  if (isOnAdminPanel && !isLoggedIn) {
    return NextResponse.redirect(new URL("/login", req.nextUrl))
  }

  if (isOnPersonnelPage && !isLoggedIn) {
    return NextResponse.redirect(new URL("/login", req.nextUrl))
  }

  if (isOnSubcontractorPanel && !isLoggedIn) {
    return NextResponse.redirect(new URL("/login", req.nextUrl))
  }

  if (isOnLoginPage && isLoggedIn) {
    // SUPER_ADMIN ise /super-admin'a, SUBCONTRACTOR ise /subcontractor'a, PERSONNEL ise /personnel'a, diğerleri /admin'e yönlendir
    if (userRole === "SUPER_ADMIN") {
      return NextResponse.redirect(new URL("/super-admin", req.nextUrl))
    }
    if (userRole === "SUBCONTRACTOR" as any) {
      return NextResponse.redirect(new URL("/subcontractor", req.nextUrl))
    }
    if (userRole === "PERSONNEL" as any) {
      return NextResponse.redirect(new URL("/personnel", req.nextUrl))
    }
    return NextResponse.redirect(new URL("/admin", req.nextUrl))
  }

  // --- 2. MULTI-TENANT DOMAIN (SaaS) YÖNLENDİRMESİ ---

  const hostname = req.headers.get("host") || ""
  const cleanHostname = hostname.replace(/^https?:\/\//, "")

  // Vercel domainlerini localhost gibi güvenli kabul et
  const isVercelDomain = cleanHostname.endsWith(".vercel.app")

  // Custom domain tanımları
  const isCustomDomain = cleanHostname === "mahirbakaymuhendislik.com" || 
                         cleanHostname === "www.mahirbakaymuhendislik.com"

  // Eğer ana domain, localhost, Vercel test domaini veya custom domain ise, normal rotalara devam et
  if (cleanHostname === MAIN_DOMAIN || cleanHostname.startsWith(LOCALHOST) || isVercelDomain || isCustomDomain) {
    return NextResponse.next()
  }

  // Eğer özel domain veya subdomain (Müşterinin sitesi) ise, public route'a yönlendir
  const url = req.nextUrl.clone()
  url.pathname = `/${cleanHostname}${url.pathname}` 

  return NextResponse.rewrite(url)
})

export const config = {
  matcher: [
    /*
     * Auth ve Domain yönlendirmesinin çalışacağı path'ler.
     * Statik dosyaları ve Next.js sistem dosyalarını es geçiyoruz.
     */
    "/((?!_next/static|_next/image|favicon.ico|api).*)",
  ],
}