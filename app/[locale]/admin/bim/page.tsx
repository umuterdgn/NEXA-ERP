/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Universal BIM & 3D Project Hub Server Page (/admin/bim)
 */

import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import BimHubClient, { type BimProjectSummary } from "./BimHubClient"

export const metadata = {
  title: "BIM & 3D Proje Merkezi | Nexa ERP",
  description: "Şantiye 3D BIM modelleri, CAD çizimleri ve dijital ikiz kontrol paneli",
}

export default async function AdminBimHubPage({
  searchParams,
}: {
  searchParams?: Promise<{ projectId?: string }>
}) {
  const resolvedParams = searchParams ? await searchParams : undefined
  if (resolvedParams?.projectId) {
    redirect(`/admin/projects/${resolvedParams.projectId}?tab=bim`)
  }

  const session = await auth()
  if (!session?.user) {
    redirect("/auth/login")
  }

  const userRole = (session.user as any)?.role
  const isSuperAdmin = userRole === "SUPER_ADMIN"
  const tenantId = (session.user as any)?.tenantId as string | undefined

  const whereClause: any = {
    deletedAt: null,
  }

  if (!isSuperAdmin && tenantId) {
    whereClause.tenantId = tenantId
  }

  const projects = await prisma.project.findMany({
    where: whereClause,
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      title: true,
      city: true,
      district: true,
      location: true,
      status: true,
      category: true,
      bimModelUrl: true,
      ifcModelUrl: true,
      threeDModelUrl: true,
      updatedAt: true,
      bimFiles: {
        select: {
          id: true,
          fileName: true,
          fileUrl: true,
          fileType: true,
          isActive: true,
          uploadedAt: true,
        },
      },
      projectDocuments: {
        select: {
          id: true,
          title: true,
          type: true,
        },
      },
      projectFiles: {
        select: {
          id: true,
          name: true,
          url: true,
        },
      },
      projectBlueprints: {
        select: {
          id: true,
          title: true,
          discipline: true,
        },
      },
      aiAnalyses: {
        where: { type: "BLUEPRINT_OCR" },
        select: { id: true, imageUrl: true },
      },
    },
  })

  let total3DModels = 0
  let totalBlueprints = 0
  let totalAiAnalyses = 0

  const is3DExt = (nameOrUrl?: string | null) => {
    const clean = (nameOrUrl || "").split("?")[0].toLowerCase().trim()
    return clean.endsWith(".ifc") || clean.endsWith(".glb") || clean.endsWith(".gltf")
  }

  const projectSummaries: BimProjectSummary[] = projects.map((p) => {
    const valid3DFiles = p.bimFiles.filter((f) => is3DExt(f.fileUrl) || is3DExt(f.fileName))
    const threeDCount =
      valid3DFiles.length +
      (p.bimModelUrl || p.ifcModelUrl || p.threeDModelUrl
        ? valid3DFiles.length === 0
          ? 1
          : 0
        : 0)

    const docCount = p.projectDocuments.length + p.projectFiles.length + p.projectBlueprints.length
    const aiCount = p.aiAnalyses.length

    total3DModels += threeDCount
    totalBlueprints += docCount
    totalAiAnalyses += aiCount

    const active3D = valid3DFiles.find((f) => f.isActive) || valid3DFiles[0]
    const hasActive3D = threeDCount > 0

    return {
      id: p.id,
      name: p.name || p.title || "İsimsiz Proje",
      title: p.title || p.name || "İsimsiz Proje",
      city: p.city,
      district: p.district,
      location: p.location,
      status: p.status,
      category: p.category,
      threeDCount,
      blueprintCount: docCount,
      aiAnalysesCount: aiCount,
      hasActive3D,
      activeModelName: active3D?.fileName || (p.bimModelUrl ? "3D Model" : undefined),
      lastUpdated: p.updatedAt,
    }
  })

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      <BimHubClient
        projects={projectSummaries}
        total3DModels={total3DModels}
        totalBlueprints={totalBlueprints}
        totalAiAnalyses={totalAiAnalyses}
      />
    </div>
  )
}
