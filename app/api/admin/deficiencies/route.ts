/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * This code is the property of NXA Software.
 */

import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

export async function GET() {
  try {
    const session = await auth()
    const userRole = session?.user?.role
    const userId = session?.user?.id

    console.log(" Deficiencies API - Session:", { userRole, userId })

    // Admin olmayan kullanıcılar sadece kendi projelerindeki eksiklikleri görebilir
    const isAdmin = userRole === "ADMIN" || userRole === "SUPER_ADMIN"
    
    let whereClause = {}
    
    if (!isAdmin && userId) {
      // Önce kullanıcının yönettiği projeleri bul
      const userProjects = await prisma.project.findMany({
        where: { managerId: userId },
        select: { id: true }
      })
      
      const projectIds = userProjects.map(p => p.id)
      
      // Sadece bu projelerdeki eksiklikleri getir
      whereClause = {
        projectId: { in: projectIds }
      }
    }

    const deficiencies = await prisma.deficiency.findMany({
      where: whereClause,
      include: {
        project: {
          select: {
            id: true,
            name: true,
            yibfNo: true
          }
        },
        inspector: {
          select: {
            id: true,
            name: true
          }
        },
        reporter: {
          select: {
            id: true,
            name: true
          }
        },
        inspection: {
          select: {
            id: true,
            type: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json(deficiencies)
  } catch (error) {
    console.error("Failed to fetch deficiencies:", error)
    return NextResponse.json([])
  }
}
