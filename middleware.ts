/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * This code is the property of NXA Software.
 */

import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { auth } from "@/lib/auth"

// Define role-based access control rules
const ROUTE_PROTECTION = {
  // Admin routes - Only ADMIN, SUPER_ADMIN, SITE_MANAGER, MUHASEBE can access
  "/admin": ["ADMIN", "SUPER_ADMIN", "SITE_MANAGER", "MUHASEBE", "ENGINEER", "INSPECTOR", "AUDITOR"],
  
  // Subcontractor routes - Only SUBCONTRACTOR can access
  "/subcontractor": ["SUBCONTRACTOR"],
  
  // Personnel routes - Only STAFF, WORKER can access
  "/personnel": ["STAFF", "WORKER"],
  
  // Inspection routes - Only INSPECTOR, AUDITOR can access
  "/inspection": ["INSPECTOR", "AUDITOR"]
}

// Paths that should be excluded from middleware
const PUBLIC_PATHS = [
  "/login",
  "/register",
  "/unauthorized",
  "/api/auth",
  "/_next",
  "/favicon.ico",
  "/public",
  "/images",
  "/static"
]

export default auth((req) => {
  const { pathname } = req.nextUrl
  const session = req.auth

  // Check if path is public
  const isPublicPath = PUBLIC_PATHS.some(path => pathname.startsWith(path))
  if (isPublicPath) {
    return NextResponse.next()
  }

  // Unauthorized page should be accessible without authentication
  if (pathname === "/unauthorized") {
    return NextResponse.next()
  }

  // If no session, redirect to login
  if (!session) {
    const loginUrl = new URL("/login", req.url)
    loginUrl.searchParams.set("callbackUrl", pathname)
    return NextResponse.redirect(loginUrl)
  }

  const userRole = session.user?.role as string

  // Get the protected route prefix
  const protectedRoute = Object.keys(ROUTE_PROTECTION).find(route => pathname.startsWith(route))

  if (protectedRoute) {
    const allowedRoles = ROUTE_PROTECTION[protectedRoute as keyof typeof ROUTE_PROTECTION]

    // Check if user's role is allowed
    if (!userRole || !allowedRoles.includes(userRole)) {
      // Redirect to unauthorized page
      return NextResponse.redirect(new URL("/unauthorized", req.url))
    }
  }

  // If user is logged in and tries to access login page, redirect to appropriate dashboard
  if (pathname === "/login" && session) {
    if (userRole === "SUBCONTRACTOR") {
      return NextResponse.redirect(new URL("/subcontractor", req.url))
    } else if (userRole === "STAFF" || userRole === "WORKER") {
      return NextResponse.redirect(new URL("/personnel", req.url))
    } else {
      return NextResponse.redirect(new URL("/admin", req.url))
    }
  }

  return NextResponse.next()
})

// Configure middleware matcher for better performance
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.ico|public).*)",
  ],
}
