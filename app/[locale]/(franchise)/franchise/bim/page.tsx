/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Franchise Portal - BIM & 3D Mağaza Tasarım Modelleri
 */

import React from "react"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import BimPageClient from "@/components/franchise/BimPageClient"

export const dynamic = "force-dynamic"

export default async function FranchiseBimPage() {
  const session = await auth()
  if (!session?.user) {
    redirect("/login")
  }

  const tenantId = (session.user as any)?.tenantId

  // %100 Tenant İzolasyonu
  const [projects, templates, bimFiles] = await Promise.all([
    prisma.project.findMany({
      where: tenantId ? { tenantId } : {},
      select: {
        id: true,
        name: true,
        city: true,
        district: true,
        status: true,
        storeTemplate: {
          select: {
            id: true,
            name: true,
            estimatedDays: true,
          },
        },
      },
      take: 20,
    }),
    prisma.storeTemplate.findMany({
      where: tenantId ? { tenantId } : {},
      select: {
        id: true,
        name: true,
        estimatedDays: true,
      },
    }),
    prisma.bimFile.findMany({
      where: tenantId ? { tenantId } : {},
      include: {
        project: {
          select: {
            id: true,
            name: true,
            title: true,
            city: true,
          },
        },
      },
      orderBy: { uploadedAt: "desc" },
      take: 30,
    }).catch(() => []),
  ])

  const formattedProjects = projects.map((p) => ({
    ...p,
    name: p.name || "İsimsiz Şube / Mağaza",
  }))

  return (
    <BimPageClient
      projects={formattedProjects}
      templates={templates}
      initialBimFiles={bimFiles}
    />
  )
}
