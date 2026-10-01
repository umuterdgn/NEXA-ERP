/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * This code is the property of NXA Software.
 */
import type { NextAuthConfig } from "next-auth"

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

export const authConfig: NextAuthConfig = {
  secret: process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET || "fallback-secret-key-change-in-production",
  providers: [], // Providers will be added in auth.ts (not in edge-compatible config)
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role
        token.permissions = user.permissions
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.sub!
        session.user.role = token.role as any
        session.user.permissions = token.permissions as any[]
      }
      return session
    },
    authorized({ request, auth }) {
      const { pathname } = request.nextUrl
      
      // Check if path is public
      const isPublicPath = PUBLIC_PATHS.some(path => pathname.startsWith(path))
      if (isPublicPath) {
        return true
      }

      // Unauthorized page should be accessible without authentication
      if (pathname === "/unauthorized") {
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
