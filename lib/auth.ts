/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * This code is the property of NXA Software.
 */
import NextAuth from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { authConfig } from "./auth.config"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  secret: process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET || "fallback-secret-key-change-in-production",
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        // First try to find user by email in User table (for admin users)
        let user = await prisma.user.findUnique({
          where: { email: credentials.email as string }
        })

        if (!user) {
          // If not found in User table, try to find in Personel table by username (for personnel)
          const personnel = await (prisma as any).personel.findFirst({
            where: {
              username: {
                equals: credentials.email as string,
                mode: 'insensitive'
              }
            }
          })

          if (personnel) {
            // If personnel found and has linked user, use that user
            if (personnel.userId) {
              user = await (prisma as any).user.findUnique({
                where: { id: personnel.userId }
              })
            } else {
              // Personnel exists but no linked user account
              console.log("❌ Personnel found but no linked user account:", personnel.username)
              return null
            }
          }
        }

        if (!user) {
          return null
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password as string,
          user.password
        )

        if (!isPasswordValid) {
          return null
        }

        console.log("✅ User authenticated:", user.email, "Role:", user.role)

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          permissions: (user as any).permissions || []
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role
        token.id = user.id
        token.permissions = user.permissions
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.role = token.role as any
        session.user.id = token.id as string
        session.user.permissions = token.permissions as any
      }
      return session
    }
  }
})

// Export auth config for API routes if needed
export const authOptions = authConfig