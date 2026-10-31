/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * AR (Augmented Reality) Field View Page
 */

import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import Link from "next/link"
import ARViewerClient from "@/components/ARViewerClient"

export const dynamic = "force-dynamic"

export default async function ProjectARPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams?: Promise<{ url?: string }>
}) {
  const { id } = await params
  const resolvedSearchParams = searchParams ? await searchParams : {}

  const project = await prisma.project.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      title: true,
      bimModelUrl: true,
      ifcModelUrl: true,
    },
  })

  if (!project) {
    notFound()
  }

  let rawModelUrl = resolvedSearchParams?.url || project.bimModelUrl || project.ifcModelUrl
  let modelUrl = rawModelUrl

  // Eğer model URL'si blob: ise veya .ifc formatındaysa, kamerada görünmeme sorununu aşmak için otomatik hafifletilmiş GLB kullan
  if (
    !modelUrl ||
    modelUrl.startsWith("blob:") ||
    modelUrl.toLowerCase().endsWith(".ifc") ||
    modelUrl.toLowerCase().includes(".ifc?")
  ) {
    modelUrl = "/models/bina.glb"
  }

  return <ARViewerClient project={project} modelUrl={modelUrl} />
}
