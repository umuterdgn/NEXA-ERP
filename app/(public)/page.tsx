/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * This code is the property of NXA Software.
 */

import { prisma } from "@/lib/prisma"
import HomeClient from "./HomeClient"

export const dynamic = 'force-dynamic'

async function getFeaturedServices() {
  try {
    const services = await prisma.service.findMany({
      where: { isActive: true },
      take: 3,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        title: true,
        description: true,
        images: true,
        threeDModelUrl: true
      }
    })
    return services
  } catch (error) {
    console.error("Error fetching services:", error)
    return []
  }
}

async function getFeaturedProjects() {
  try {
    const projects = await prisma.portfolioProject.findMany({
      where: { isPublished: true },
      take: 3,
      orderBy: { createdAt: 'desc' },
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

export default async function Home() {
  const featuredServices = await getFeaturedServices()
  const featuredProjects = await getFeaturedProjects()

  // Sanitize null values to undefined for type compatibility
  const sanitizedServices = featuredServices.map(service => ({
    ...service,
    threeDModelUrl: service.threeDModelUrl ?? undefined
  }))

  const sanitizedProjects = featuredProjects.map(project => ({
    ...project,
    threeDModelUrl: project.threeDModelUrl ?? undefined
  }))

  return <HomeClient featuredServices={sanitizedServices} featuredProjects={sanitizedProjects} />
}