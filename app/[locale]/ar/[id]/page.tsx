/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * AR (Augmented Reality) Field View Page - With "See Through Walls" (Duvarın Arkasını Gör) X-Ray Engine
 */

import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import ARViewerClient from "@/components/ARViewerClient"
import { getProject2DExtrusionData } from "@/actions/ai-blueprint-parser"

export const dynamic = "force-dynamic"

export default async function ProjectARPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams?: Promise<{ url?: string; mode?: string }>
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

  const rawModelUrl = resolvedSearchParams?.url || project.bimModelUrl || project.ifcModelUrl
  let modelUrl = rawModelUrl

  // If URL is blob or IFC, fallback to default GLB model
  if (
    !modelUrl ||
    modelUrl.startsWith("blob:") ||
    modelUrl.toLowerCase().endsWith(".ifc") ||
    modelUrl.toLowerCase().includes(".ifc?")
  ) {
    modelUrl = "/models/bina.glb"
  }

  // Fetch project 2D-to-3D coordinates from Prisma / AI analysis
  let aiData: any[] = []
  try {
    const extrusionRes = await getProject2DExtrusionData(id)
    if (extrusionRes?.elements && extrusionRes.elements.length > 0) {
      aiData = extrusionRes.elements
    }
  } catch (err) {
    console.warn("Could not fetch project extrusion coordinates for AR:", err)
  }

  const initialXRay = resolvedSearchParams?.mode === "xray"

  return (
    <ARViewerClient
      project={project}
      modelUrl={modelUrl}
      aiData={aiData}
      initialXRay={initialXRay}
    />
  )
}
