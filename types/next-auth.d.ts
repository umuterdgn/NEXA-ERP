/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * This code is the property of NXA Software.
 */

import { DefaultSession } from "next-auth"
import { UserRole } from "@prisma/client"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      role: UserRole
      permissions: string[]
    } & DefaultSession["user"]
  }

  interface User {
    role: UserRole
    permissions: string[]
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role: UserRole
    permissions: string[]
  }
}