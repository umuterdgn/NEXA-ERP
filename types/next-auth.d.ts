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
      tenantId?: string | null
      permissions?: string[]
      companyId?: string | null
      companyType?: string | null
    } & DefaultSession["user"]
  }

  interface User {
    role: UserRole
    tenantId?: string | null
    permissions?: string[]
    companyId?: string | null
    companyType?: string | null
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string
    role?: UserRole
    tenantId?: string | null
    permissions?: string[]
    companyId?: string | null
    companyType?: string | null
  }
}