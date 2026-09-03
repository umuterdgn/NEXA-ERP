/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * This code is the property of NXA Software.
 */

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    // Fetch all drone media URLs
    const droneMedia = await prisma.droneMedia.findMany({
      select: { url: true }
    })

    // Fetch all project document URLs
    const projectDocuments = await prisma.projectDocument.findMany({
      select: { fileUrl: true }
    })

    // Fetch all document URLs
    const documents = await prisma.document.findMany({
      select: { googleDriveUrl: true }
    })

    // Calculate estimated storage usage
    // Since we can't get actual file sizes from URLs, we'll estimate based on record count
    // This is a simplified approach - in production, you'd use Cloudinary API or store file sizes in DB
    
    const droneMediaCount = droneMedia.length
    const projectDocumentCount = projectDocuments.length
    const documentCount = documents.length

    // Estimate: Drone media ~10MB average, Documents ~2MB average
    const estimatedUsageGB = (droneMediaCount * 10 + projectDocumentCount * 2 + documentCount * 2) / 1024

    const maxSpaceGB = 250 // Cloudinary free tier or configured limit

    return NextResponse.json({
      usedSpace: Math.round(estimatedUsageGB * 10) / 10, // Round to 1 decimal
      maxSpace: maxSpaceGB,
      percentage: Math.min((estimatedUsageGB / maxSpaceGB) * 100, 100),
      breakdown: {
        droneMedia: droneMediaCount,
        projectDocuments: projectDocumentCount,
        documents: documentCount
      }
    })
  } catch (error) {
    console.error('Failed to fetch storage data:', error)
    return NextResponse.json(
      { error: 'Failed to fetch storage data' },
      { status: 500 }
    )
  }
}
