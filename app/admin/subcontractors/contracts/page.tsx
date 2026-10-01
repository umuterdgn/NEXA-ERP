/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * This code is the property of NXA Software.
 */

import { prisma } from "@/lib/prisma"
import ContractsClient from "./ContractsClient"

export const dynamic = 'force-dynamic'

export default async function SubcontractorContractsPage() {
  const contracts = await prisma.contract.findMany({
    include: {
      subcontractor: {
        select: { id: true, name: true }
      },
      project: {
        select: { id: true, name: true }
      }
    },
    orderBy: { createdAt: "desc" }
  })

  const subcontractors = await prisma.subcontractor.findMany({
    select: { id: true, name: true }
  })

  const projects = await prisma.project.findMany({
    where: { isActive: true },
    select: { id: true, name: true }
  })

  const formattedSubcontractors = subcontractors.map(s => ({
    id: s.id,
    name: s.name || 'İsimsiz Taşeron'
  }))

  const formattedProjects = projects.map(p => ({
    id: p.id,
    name: p.name || 'İsimsiz Proje'
  }))

  return (
    <ContractsClient 
      initialContracts={contracts}
      subcontractors={formattedSubcontractors}
      projects={formattedProjects}
    />
  )
}
