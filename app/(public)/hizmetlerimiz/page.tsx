/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * This code is the property of NXA Software.
 */

import { prisma } from "@/lib/prisma"
import ServicesClient from "./ServicesClient"

export const dynamic = 'force-dynamic'

async function getServices() {
  try {
    const services = await prisma.service.findMany({
      where: { isActive: true },
      orderBy: { displayOrder: 'asc' }
    })
    return services
  } catch (error) {
    console.error("Error fetching services:", error)
    return []
  }
}

export default async function HizmetlerimizPage() {
  const services = await getServices()

  // Sanitize null values to undefined for type compatibility
  const sanitizedServices = services.map(service => ({
    ...service,
    threeDModelUrl: service.threeDModelUrl ?? undefined
  }))

  return <ServicesClient services={sanitizedServices} />
}