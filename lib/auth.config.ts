/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * This code is the property of NXA Software.
 */
import type { NextAuthConfig } from "next-auth"

// Paths that should be excluded from middleware
const PUBLIC_PATHS = [
  "/",
  "/login",
  "/register",
  "/hakkimizda",
  "/about",
  "/ozellikler",
  "/features",
  "/basari-hikayeleri",
  "/blog",
  "/sss",
  "/faq",
  "/iletisim",
  "/contact",
  "/hizmetlerimiz",
  "/projelerimiz",
  "/demo",
  "/track",
  "/check-in",
  "/unauthorized",
  "/api/auth",
  "/_next",
  "/favicon.ico",
  "/public",
  "/images",
  "/static"
]

export const authConfig: NextAuthConfig = {
  trustHost: true,
  secret: process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET || "fallback-secret-key-change-in-production",
  providers: [], // Providers will be added in auth.ts (not in edge-compatible config)
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = (user as any).role
        token.tenantId = (user as any).tenantId || null
      }
      return token
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = (token.id as string) || token.sub!
        ;(session.user as any).role = token.role as any
        ;(session.user as any).tenantId = (token as any).tenantId as string || null
      }
      return session
    },
    authorized({ request, auth }) {
      const { pathname } = request.nextUrl
      
      // Strip locale prefix if present (e.g. /tr/hakkimizda -> /hakkimizda)
      const cleanPath = pathname.replace(/^\/(tr|en|de|ru|ar)(\/|$)/i, "/") || "/"
      
      if (cleanPath === "/" || cleanPath === "") {
        return true
      }

      // Check if path is public
      const isPublicPath = PUBLIC_PATHS.some(path => {
        if (!path || path === "/") return false
        return cleanPath === path || cleanPath.startsWith(path + "/")
      })
      if (isPublicPath) {
        return true
      }

      // Unauthorized page should be accessible without authentication
      if (cleanPath === "/unauthorized") {
        return true
      }

      // If no session, redirect to login
      if (!auth) {
        return false
      }

      return true
    }
  },
  pages: {
    signIn: "/login"
  },
  session: {
    strategy: "jwt"
  }
}
