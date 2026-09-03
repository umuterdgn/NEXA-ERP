/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * This code is the property of NXA Software.
 */

import { prisma } from "@/lib/prisma"
import ProjectsClient from "./ProjectsClient"

export const dynamic = 'force-dynamic'

async function getProjects() {
  try {
    const projects = await prisma.portfolioProject.findMany({
      where: { isPublished: true },
      orderBy: { displayOrder: 'asc' },
      select: {
        id: true,
        title: true,
        description: true,
        images: true,
        imageUrl: true,
        year: true,
        location: true
      }
    })

    return projects.map(project => ({
      ...project,
      images: project.images.length > 0 ? project.images : (project.imageUrl ? [project.imageUrl] : []),
      threeDModelUrl: undefined
    }))
  } catch (error) {
    console.error("Error fetching projects:", error)
    return []
  }
}

export default async function ProjelerimizPage() {
  const projects = await getProjects()

  // Sanitize null values to undefined for type compatibility
  const sanitizedProjects = projects.map(project => ({
    ...project,
    threeDModelUrl: project.threeDModelUrl ?? undefined,
    year: project.year ?? undefined,
    location: project.location ?? undefined
  }))

  return <ProjectsClient projects={sanitizedProjects} />
}