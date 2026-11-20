/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * GET / POST /api/mobile/sso-token
 * Mobil WebView İçin Kısa Ömürlü Tek Kullanımlık SSO Token Üretim Ucu
 */

import { NextResponse } from "next/server"
import { getMobileAuth, generateSsoToken } from "@/lib/mobile-auth"
import { assertTenantAndProjectAccess } from "@/lib/api-rbac"

export const runtime = "nodejs"

async function handleSsoToken(request: Request) {
  try {
    const auth = await getMobileAuth(request)
    if (!auth) {
      return NextResponse.json({ error: "Yetkisiz oturum." }, { status: 401 })
    }

    const { userId, email, role, tenantId, assignedProjectIds } = auth
    const url = new URL(request.url)
    const body = request.method === "POST" ? await request.json().catch(() => ({})) : {}
    const targetRoute = body.targetRoute || url.searchParams.get("targetRoute")
    const reqProjectId = body.projectId || url.searchParams.get("projectId")

    if (reqProjectId) {
      const accessErr = await assertTenantAndProjectAccess(auth, reqProjectId)
      if (accessErr) return accessErr
    }

    const targetProjectId = reqProjectId || assignedProjectIds[0]

    const ssoToken = await generateSsoToken({
      id: userId,
      email,
      role,
      tenantId,
    })

    const bimUrl = targetProjectId
      ? `/tr/admin/projects/${targetProjectId}?tab=bim&ssoToken=${ssoToken}`
      : `/tr/admin/bim?ssoToken=${ssoToken}`

    const arUrl = targetProjectId
      ? `/tr/ar/${targetProjectId}?ssoToken=${ssoToken}`
      : `/tr/admin/bim?ssoToken=${ssoToken}`

    return NextResponse.json({
      success: true,
      ssoToken,
      expiresIn: 900,
      endpoints: {
        bimViewerUrl: bimUrl,
        arViewerUrl: arUrl,
        customTargetUrl: targetRoute ? `${targetRoute}?ssoToken=${ssoToken}` : bimUrl,
      },
    })
  } catch (error: any) {
    console.error("Mobile SSO token error:", error)
    return NextResponse.json({ error: "SSO token üretilemedi." }, { status: 500 })
  }
}

export async function GET(request: Request) {
  return handleSsoToken(request)
}

export async function POST(request: Request) {
  return handleSsoToken(request)
}
