/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Keşif & Metraj (BoQ) DataGrid Sayfası (/admin/projects/[id]/boq)
 */

import { notFound } from "next/navigation"
import { getProjectBoq } from "@/app/actions/boq"
import ProjectBoqClient from "./ProjectBoqClient"

export const dynamic = "force-dynamic"

export default async function ProjectBoqPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const resolvedParams = await params
  const result = await getProjectBoq(resolvedParams.id)

  if (!result.success || !result.data) {
    notFound()
  }

  return <ProjectBoqClient initialData={result.data} />
}
