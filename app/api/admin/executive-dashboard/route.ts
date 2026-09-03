/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * This code is the property of NXA Software.
 */

import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    // Total active projects
    const totalProjects = await prisma.project.count({
      where: {
        isActive: true
      }
    })

    // Total on-site workers (checked in today)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const onSiteWorkers = await prisma.attendanceRecord.count({
      where: {
        checkIn: {
          gte: today,
          lt: tomorrow
        }
      }
    })

    // Open and overdue NCRs
    const openNCRs = await prisma.nonConformanceReport.count({
      where: {
        status: {
          in: ["Açık", "İşlemde"]
        }
      }
    })

    const overdueNCRs = await prisma.nonConformanceReport.count({
      where: {
        status: {
          in: ["Açık", "İşlemde"]
        },
        dueDate: {
          lt: new Date()
        }
      }
    })

    // Equipment ratio (available vs assigned)
    const availableEquipment = await prisma.equipment.count({
      where: {
        status: "AVAILABLE"
      }
    })

    const assignedEquipment = await prisma.equipment.count({
      where: {
        status: "ASSIGNED"
      }
    })

    const totalEquipment = availableEquipment + assignedEquipment
    const assignedEquipmentPercentage = totalEquipment > 0 
      ? Math.round((assignedEquipment / totalEquipment) * 100) 
      : 0

    // Task distribution by project
    const projects = await prisma.project.findMany({
      where: {
        isActive: true
      },
      select: {
        id: true,
        title: true
      }
    })

    const taskDistribution = await Promise.all(
      projects.map(async (project) => {
        const completedTasks = await prisma.task.count({
          where: {
            projectId: project.id,
            status: "COMPLETED"
          }
        })

        const pendingTasks = await prisma.task.count({
          where: {
            projectId: project.id,
            status: {
              in: ["TODO", "IN_PROGRESS"]
            }
          }
        })

        return {
          projectTitle: project.title,
          completed: completedTasks,
          pending: pendingTasks
        }
      })
    )

    // Personnel distribution by project
    const personnelDistribution = await Promise.all(
      projects.map(async (project) => {
        const count = await prisma.personel.count({
          where: {
            currentSite: project.title
          }
        })

        return {
          projectTitle: project.title,
          count
        }
      })
    )

    // Recent events (drone media and chat threads)
    const recentDroneMedia = await prisma.droneMedia.findMany({
      take: 3,
      orderBy: {
        createdAt: 'desc'
      },
      include: {
        project: {
          select: {
            title: true
          }
        }
      }
    })

    const recentChatThreads = await prisma.chatThread.findMany({
      take: 3,
      where: {
        status: "OPEN"
      },
      orderBy: {
        createdAt: 'desc'
      },
      include: {
        project: {
          select: {
            title: true
          }
        }
      }
    })

    const recentEvents = [
      ...recentDroneMedia.map((media) => ({
        type: "DRONE_MEDIA" as const,
        title: `Yeni drone çekimi: ${media.title}`,
        project: media.project?.title || "Şirket Geneli",
        date: media.createdAt
      })),
      ...recentChatThreads.map((thread) => ({
        type: "CHAT_THREAD" as const,
        title: `Yeni konu: ${thread.title}`,
        project: thread.project?.title || "Şirket Geneli",
        date: thread.createdAt
      }))
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5)

    return NextResponse.json({
      kpis: {
        totalProjects,
        onSiteWorkers,
        criticalNCRs: overdueNCRs,
        assignedEquipmentPercentage
      },
      taskDistribution,
      personnelDistribution,
      recentEvents
    })
  } catch (error) {
    console.error("Error fetching executive dashboard data:", error)
    return NextResponse.json(
      { error: "Executive dashboard verileri getirilirken hata oluştu" },
      { status: 500 }
    )
  }
}
