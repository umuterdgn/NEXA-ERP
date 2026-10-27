/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * This code is the property of NXA Software.
 */

import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import Link from "next/link"
import FinancialChart from "../../components/admin/FinancialChart"
import PersonnelWorkloadChart, { WorkloadItem } from "@/components/admin/PersonnelWorkloadChart"
import DriverCapacityWidget, { DriverCapacityItem } from "@/components/admin/DriverCapacityWidget"
import WeatherWidget from "@/components/ui/WeatherWidget"
import AIReportGenerator from "@/components/AIReportGenerator"
import DigitalizationScore from "@/components/DigitalizationScore"
import SubcontractorDashboard from "@/components/admin/SubcontractorDashboard"

export const dynamic = 'force-dynamic'

type ReminderRecord = {
  id: string
  date: Date
  title: string
  projectId?: string
  project?: {
    id?: string
    name?: string | null
    title?: string | null
    status?: string | null
  } | null
  [key: string]: unknown
}

type SystemLogRecord = {
  id: string
  user?: string
  action?: string
  details?: string
  createdAt: Date
}

type ContractorProject = {
  id: string
  name: string | null
  progress: number | null
  status: string | null
}

export default async function AdminDashboard() {
  const session = await auth()
  const userRole = session?.user?.role
  const userId = session?.user?.id
  const userName = session?.user?.name || "Taşeron Yetkilisi"

  // Multi-Tenant Veri İzolasyonu: Kullanıcının tenantId'si
  let userTenantId = (session?.user as any)?.tenantId as string | null | undefined
  if (!userTenantId && userId) {
    const dbUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { tenantId: true }
    })
    userTenantId = dbUser?.tenantId || null
  }
  const isSuperAdmin = userRole === "SUPER_ADMIN"
  const projectTenantWhere = !isSuperAdmin
    ? userTenantId
      ? { tenantId: userTenantId }
      : { tenantId: "non-existent-tenant" }
    : {}

  // 1. Taşeron Rolü (SUBCONTRACTOR) Korumalı ve Kısıtlı Portal Görünümü
  // Ciro, genel şirket gideri gösterilmez; sadece iş paketleri, 3D BIM cezaları ve hakediş durumu render edilir
  if ((userRole as string) === "SUBCONTRACTOR") {
    let subWorkPackages: any[] = []
    let subBimIssues: any[] = []
    let subApprovals: any[] = []

    try {
      subWorkPackages = await prisma.workPackage.findMany({
        where: {
          ...(!isSuperAdmin ? { project: projectTenantWhere } : {}),
          OR: [
            { subcontractorName: { contains: userName, mode: "insensitive" } },
            { subcontractorName: { not: null } }
          ]
        },
        take: 10,
        orderBy: { createdAt: "desc" }
      })

      if (subWorkPackages.length === 0) {
        subWorkPackages = await prisma.workPackage.findMany({
          where: !isSuperAdmin ? { project: projectTenantWhere } : {},
          take: 5,
          orderBy: { createdAt: "desc" }
        })
      }

      subBimIssues = await prisma.bimIssue.findMany({
        where: {
          ...(!isSuperAdmin ? { project: projectTenantWhere } : {}),
          OR: [
            { subcontractorId: userId },
            { subcontractorName: { contains: userName, mode: "insensitive" } },
            { penaltyAmount: { gt: 0 } }
          ]
        },
        take: 10,
        orderBy: { createdAt: "desc" }
      })

      if (subBimIssues.length === 0) {
        subBimIssues = await prisma.bimIssue.findMany({
          where: !isSuperAdmin ? { project: projectTenantWhere } : {},
          take: 3,
          orderBy: { createdAt: "desc" }
        })
      }

      subApprovals = await prisma.approvalRequest.findMany({
        where: {
          requestType: "HAKEDIS",
          ...(!isSuperAdmin ? { project: projectTenantWhere } : {})
        },
        take: 5,
        orderBy: { createdAt: "desc" }
      })
    } catch (err) {
      console.error("Subcontractor data fetch error:", err)
    }

    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4 md:p-8">
        <SubcontractorDashboard
          userName={userName}
          workPackages={subWorkPackages}
          bimIssues={subBimIssues}
          approvals={subApprovals}
        />
      </div>
    )
  }

  // Check if user is contractor or client
  const isClientPortal = (userRole as string) === "MUTEAHHIT_MUSTERI"

  // Fetch dashboard statistics (only for admin users)
  let totalProjects = 0
  let todayCheckins = 0
  let upcomingReminders: ReminderRecord[] = []
  let recentLogs: SystemLogRecord[] = []
  let totalRevenue = { _sum: { amount: 0 as number | null } }
  let totalExpenses = { _sum: { amount: 0 as number | null } }
  let lowStockCount = 0

  // Real Analytics & Charts Data
  let monthlyFinancialData: { month: string; gelir: number; gider: number }[] = []
  let topWorkloadPersonnel: WorkloadItem[] = []
  let driverCapacityList: DriverCapacityItem[] = []
  let timeLossStats = {
    totalLostHours: 0,
    evrakHours: 0,
    ulasimHours: 0,
    raporlamaHours: 0,
    sahaHours: 0,
    estimatedAiSavingsHours: 0
  }

  // Contractor-specific data
  let contractorProjects: ContractorProject[] = []
  let contractorAverageProgress = 0
  let contractorOpenDeficiencies = 0

  // YİBF Risk Radar data
  let riskRadarProjects: any[] = []

  if (isClientPortal && userId) {
    try {
      // Fetch contractor's managed projects (tenant scoped)
      contractorProjects = await prisma.project.findMany({
        where: {
          managerId: userId,
          ...projectTenantWhere
        },
        select: {
          id: true,
          name: true,
          progress: true,
          status: true
        }
      }).catch(() => [])

      // Calculate average progress
      if (contractorProjects.length > 0) {
        const totalProgress = contractorProjects.reduce((sum, p) => sum + (p.progress || 0), 0)
        contractorAverageProgress = Math.round(totalProgress / contractorProjects.length)
      }

      // Count open deficiencies for contractor's projects
      const projectIds = contractorProjects.map(p => p.id)
      if (projectIds.length > 0) {
        contractorOpenDeficiencies = await prisma.deficiency.count({
          where: {
            projectId: { in: projectIds },
            status: 'OPEN'
          }
        }).catch(() => 0)
      }
    } catch (error) {
      console.error('Error fetching contractor data:', error)
    }
  }

  if (!isClientPortal) {
    try {
      const reminderWindowEnd = new Date()
      reminderWindowEnd.setDate(reminderWindowEnd.getDate() + 7)

      const [
        totalProjectsCount,
        todayCheckinsCount,
        reminders,
        logs,
        revenue,
        expenses,
        stockCount,
        projects
      ] = await Promise.all([
        prisma.project.count({
          where: projectTenantWhere
        }).catch(() => 0),
        prisma.attendanceRecord.count({
          where: {
            date: {
              gte: new Date(new Date().setHours(0, 0, 0, 0))
            },
            ...(!isSuperAdmin ? { project: projectTenantWhere } : {})
          }
        }).catch(() => 0),
        prisma.reminder.findMany({
          where: {
            date: {
              gte: new Date(),
              lte: reminderWindowEnd
            },
            isCompleted: false,
            ...(!isSuperAdmin ? { project: projectTenantWhere } : {})
          },
          include: {
            project: true
          },
          orderBy: { date: 'asc' },
          take: 10
        }).catch(() => []),
        prisma.systemLog.findMany({
          orderBy: { createdAt: 'desc' },
          take: 5
        }).catch(() => []),
        // Financial summary (Tenant filtrelenmiş personel ödemeleri)
        prisma.personelPayment.aggregate({
          _sum: { amount: true },
          where: {
            type: 'PRIM', // Consider payments as revenue
            ...(!isSuperAdmin && userTenantId ? { personel: { tenantId: userTenantId } } : {})
          }
        }).catch(() => ({ _sum: { amount: 0 } })),
        prisma.personelPayment.aggregate({
          _sum: { amount: true },
          where: {
            type: { in: ['AVANS', 'ELDEN'] }, // Consider advances as expenses
            ...(!isSuperAdmin && userTenantId ? { personel: { tenantId: userTenantId } } : {})
          }
        }).catch(() => ({ _sum: { amount: 0 } })),
        // Low stock count (Tenant filtrelenmiş envanter)
        prisma.inventory.count({
          where: {
            quantity: {
              lt: 10 // Items with quantity less than 10
            },
            ...(!isSuperAdmin ? { project: projectTenantWhere } : {})
          }
        }).catch(() => 0),
        // Projects for YİBF Risk Radar (Tenant filtrelenmiş projeler)
        prisma.project.findMany({
          where: projectTenantWhere,
          select: {
            id: true,
            yibfNo: true,
            name: true,
            status: true,
            progress: true
          },
          take: 5,
          orderBy: { createdAt: 'desc' }
        }).catch(() => [])
      ])
      totalProjects = totalProjectsCount
      todayCheckins = todayCheckinsCount
      upcomingReminders = reminders
      recentLogs = logs
      riskRadarProjects = projects
      const normalizedReminders = reminders.map((reminder) => ({
        ...reminder,
        project: reminder.project
          ? {
              ...reminder.project,
              name: reminder.project.name ?? 'İsimsiz Proje',
              title: reminder.project.title ?? reminder.project.name ?? 'İsimsiz Proje',
              status: reminder.project.status ?? 'Durum Yok'
            }
          : null
      }))

      upcomingReminders = normalizedReminders as ReminderRecord[]
      totalRevenue = revenue
      totalExpenses = expenses
      lowStockCount = stockCount

      // ============================================================================
      // 1. GERÇEK FİNANSAL AKIŞ (SON 6 AY GELİR / GİDER AGREGASYONU)
      // ============================================================================
      const sixMonthsAgo = new Date()
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5)
      sixMonthsAgo.setDate(1)
      sixMonthsAgo.setHours(0, 0, 0, 0)

      const transactionWhere: any = {
        date: { gte: sixMonthsAgo },
        ...(!isSuperAdmin
          ? userTenantId
            ? {
                OR: [
                  { tenantId: userTenantId },
                  { project: { tenantId: userTenantId } }
                ]
              }
            : { tenantId: "non-existent-tenant" }
          : {})
      }

      const sixMonthsTransactions = await prisma.transaction.findMany({
        where: transactionWhere,
        select: {
          date: true,
          type: true,
          amount: true
        },
        orderBy: { date: 'asc' }
      }).catch(() => [])

      const monthsMap: Record<string, { month: string; gelir: number; gider: number; sortKey: string }> = {}
      const now = new Date()
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
        const monthLabel = d.toLocaleString("tr-TR", { month: "long" })
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
        monthsMap[key] = { month: monthLabel, gelir: 0, gider: 0, sortKey: key }
      }

      sixMonthsTransactions.forEach((t) => {
        if (!t.date) return
        const tDate = new Date(t.date)
        const key = `${tDate.getFullYear()}-${String(tDate.getMonth() + 1).padStart(2, "0")}`
        if (monthsMap[key]) {
          const amt = Number(t.amount) || 0
          if (t.type === "GELIR") {
            monthsMap[key].gelir += amt
          } else {
            monthsMap[key].gider += amt
          }
        }
      })
      monthlyFinancialData = Object.values(monthsMap).sort((a, b) => a.sortKey.localeCompare(b.sortKey))

      // ============================================================================
      // 2. GERÇEK PERSONEL İŞ YÜKÜ (EN ÇOK AÇIK GÖREVİ OLAN 5 PERSONEL)
      // ============================================================================
      const personnelWithTasks = await prisma.personel.findMany({
        where: !isSuperAdmin
          ? (userTenantId ? { tenantId: userTenantId } : { tenantId: "non-existent" })
          : {},
        select: {
          id: true,
          name: true,
          position: true,
          assignedTasks: {
            where: {
              status: { in: ["TODO", "IN_PROGRESS"] }
            },
            select: { id: true, status: true }
          }
        },
        take: 50
      }).catch(() => [])

      topWorkloadPersonnel = personnelWithTasks
        .map(p => ({
          name: p.name,
          taskCount: p.assignedTasks.length,
          position: p.position || "Saha Ekibi"
        }))
        .sort((a, b) => b.taskCount - a.taskCount)
        .slice(0, 5)

      // ============================================================================
      // 3. AKTİF DRIVER (ŞOFÖR) KAPASİTE ANALİZİ
      // ============================================================================
      const startOfToday = new Date()
      startOfToday.setHours(0, 0, 0, 0)
      const endOfToday = new Date()
      endOfToday.setHours(23, 59, 59, 999)

      const activeDrivers = await prisma.personel.findMany({
        where: {
          ...(!isSuperAdmin ? (userTenantId ? { tenantId: userTenantId } : { tenantId: "non-existent" }) : {}),
          OR: [
            { role: "DRIVER" },
            { position: { contains: "şoför", mode: "insensitive" } },
            { position: { contains: "driver", mode: "insensitive" } }
          ]
        },
        select: {
          id: true,
          name: true,
          phone: true,
          currentSite: true,
        }
      }).catch(() => [])

      const todayLogistics = await prisma.logisticsSchedule.findMany({
        where: {
          ...(!isSuperAdmin ? (userTenantId ? { tenantId: userTenantId } : { tenantId: "non-existent" }) : {}),
          scheduledAt: { gte: startOfToday, lte: endOfToday }
        },
        select: {
          id: true,
          title: true,
          driverName: true,
          driverContact: true,
          location: true,
          status: true,
        }
      }).catch(() => [])

      driverCapacityList = activeDrivers.map(driver => {
        const assignedCount = todayLogistics.filter(l => 
          (l.driverName && l.driverName.toLowerCase().includes(driver.name.toLowerCase())) ||
          (l.driverContact && driver.phone && l.driverContact.includes(driver.phone)) ||
          (l.driverContact && l.driverContact.toLowerCase().includes(driver.name.toLowerCase()))
        ).length

        const capacityPercent = Math.min(100, assignedCount * 20)
        return {
          id: driver.id,
          name: driver.name,
          deliveryCount: assignedCount,
          capacityPercent,
          capacityText: `${driver.name}: ${assignedCount} Teslimat (%${capacityPercent} Dolu)`,
          currentSite: driver.currentSite
        }
      })

      // ============================================================================
      // 4. ZAMAN KAYBI ANALİZİ (GECİKEN GÖREV VE İŞ EMİRLERİNDEN HESAPLANAN KAYIP)
      // ============================================================================
      const startOfMonth = new Date()
      startOfMonth.setDate(1)
      startOfMonth.setHours(0, 0, 0, 0)

      const overdueWorkOrders = await prisma.workOrder.findMany({
        where: {
          ...(!isSuperAdmin ? (userTenantId ? { tenantId: userTenantId } : { tenantId: "non-existent" }) : {}),
          dueDate: { lt: new Date(), gte: startOfMonth },
          status: { in: ["TODO", "IN_PROGRESS"] }
        },
        select: {
          id: true,
          title: true,
          dueDate: true,
          department: true,
          updatedAt: true
        }
      }).catch(() => [])

      const overdueTasks = await prisma.task.findMany({
        where: {
          ...(!isSuperAdmin ? (userTenantId ? { tenantId: userTenantId } : { tenantId: "non-existent" }) : {}),
          dueDate: { lt: new Date(), gte: startOfMonth },
          status: { in: ["TODO", "IN_PROGRESS"] }
        },
        select: {
          id: true,
          title: true,
          dueDate: true,
          taskType: true,
          createdAt: true
        }
      }).catch(() => [])

      let calcTotalHours = 0
      let calcEvrak = 0
      let calcUlasim = 0
      let calcRapor = 0
      let calcSaha = 0

      const nowMs = Date.now()
      for (const wo of overdueWorkOrders) {
        if (wo.dueDate) {
          const diffMs = nowMs - new Date(wo.dueDate).getTime()
          const hours = Math.max(1, Math.round(diffMs / (1000 * 60 * 60)))
          calcTotalHours += hours
          const deptStr = String(wo.department)
          if (deptStr === "MEKANIK" || deptStr === "ELEKTRIK") {
            calcUlasim += hours
          } else if (deptStr === "MIMARI") {
            calcEvrak += hours
          } else {
            calcSaha += hours
          }
        }
      }

      for (const t of overdueTasks) {
        if (t.dueDate) {
          const diffMs = nowMs - new Date(t.dueDate).getTime()
          const hours = Math.max(1, Math.round(diffMs / (1000 * 60 * 60)))
          calcTotalHours += hours
          if (t.taskType?.includes("Evrak") || t.taskType?.includes("Rapor")) {
            calcRapor += hours
          } else {
            calcSaha += hours
          }
        }
      }

      timeLossStats = {
        totalLostHours: calcTotalHours,
        evrakHours: calcEvrak,
        ulasimHours: calcUlasim,
        raporlamaHours: calcRapor,
        sahaHours: calcSaha,
        estimatedAiSavingsHours: Math.round(calcTotalHours * 0.4)
      }
    } catch (error) {
      console.error('Database connection error, using fallback values:', error)
      // Fallback values when database is unreachable
      totalProjects = 0
      todayCheckins = 0
      upcomingReminders = []
      recentLogs = []
      totalRevenue = { _sum: { amount: 0 } }
      totalExpenses = { _sum: { amount: 0 } }
      lowStockCount = 0
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 py-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
              {isClientPortal ? "Müteahhit Portalı" : "Ana Gösterge Paneli"}
            </h1>
            <p className="text-slate-600 dark:text-slate-400 mt-1">
              Hoş geldiniz, {session?.user?.name || 'Admin'}
            </p>
          </div>
          <div className="flex w-full flex-col items-stretch gap-3 sm:w-auto sm:flex-row sm:items-center">
            {!isClientPortal && (
              <div className="w-full sm:w-auto">
                <DigitalizationScore />
              </div>
            )}
            {!isClientPortal && (
              <div className="w-full sm:w-auto">
                <AIReportGenerator />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
        {isClientPortal ? (
          // Client Portal View
          <div className="space-y-6">
            {/* Projects Overview */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-6 border border-blue-200 dark:border-blue-800">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Projelerim</h2>
                  <p className="text-slate-600 dark:text-slate-400 mt-1">Toplam {contractorProjects.length} proje yönetiyorsunuz</p>
                </div>
              </div>
            </div>

            {/* Average Progress */}
            <div className="bg-white dark:bg-slate-900 rounded-xl p-6 border border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Ortalama İlerleme</h3>
                <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">%{contractorAverageProgress}</span>
              </div>
              <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-4">
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 h-4 rounded-full transition-all" style={{ width: `${contractorAverageProgress}%` }} />
              </div>
            </div>

            {/* Open Deficiencies */}
            <div className="bg-white dark:bg-slate-900 rounded-xl p-6 border border-slate-200 dark:border-slate-800">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Açık Eksiklikler</h3>
              <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4 border border-red-200 dark:border-red-800">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-red-500/20 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-3xl font-bold text-red-600 dark:text-red-400">{contractorOpenDeficiencies}</p>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Açık Eksiklik</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Projects List */}
            <div className="bg-white dark:bg-slate-900 rounded-xl p-6 border border-slate-200 dark:border-slate-800">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Proje Listesi</h3>
              {contractorProjects.length === 0 ? (
                <p className="text-slate-500 dark:text-slate-400">Henüz proje atanmamış</p>
              ) : (
                <div className="space-y-3">
                  {contractorProjects.map((project) => (
                    <Link
                      key={project.id}
                      href={`/admin/projects/${project.id}`}
                      className="block bg-slate-50 dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700 hover:border-blue-500 dark:hover:border-blue-500 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-slate-900 dark:text-white">{project.name || 'İsimsiz Proje'}</p>
                          <p className="text-sm text-slate-600 dark:text-slate-400">{project.status || 'Durum Yok'}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-semibold text-blue-600 dark:text-blue-400">%{project.progress ?? 0}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">İlerleme</p>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          // Admin Dashboard View
          <>
        {/* Weather Widget */}
        <div className="mb-6 w-full overflow-hidden">
          <WeatherWidget city="İskenderun" />
        </div>

        {/* AI Morning Report */}
        <div className="w-full overflow-hidden bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-6 border border-blue-200 dark:border-blue-800 mb-6 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-blue-600 dark:bg-blue-500 rounded-xl flex items-center justify-center flex-shrink-0">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">AI Asistan Sabah Raporu</h3>
              <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                Günaydın. Bugün şirketinizde 23 kontrol planlandı. 3 kritik eksiklik bulunuyor. 2 hakediş onay bekliyor. YİBF #14585 için kontrol gecikme riski var.
              </p>
            </div>
          </div>
        </div>

        {/* YDS Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 sm:gap-6 mb-6">
          {/* Aktif Yapılar */}
          <div className="bg-white dark:bg-slate-900 rounded-xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <span className="text-3xl font-bold text-slate-900 dark:text-white">{totalProjects}</span>
            </div>
            <p className="text-slate-700 dark:text-slate-300 font-medium">Aktif Yapılar</p>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Denetimdeki yapılar</p>
          </div>

          {/* Bugün Kontrol */}
          <div className="bg-white dark:bg-slate-900 rounded-xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-green-50 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <span className="text-3xl font-bold text-slate-900 dark:text-white">{todayCheckins}</span>
            </div>
            <p className="text-slate-700 dark:text-slate-300 font-medium">Bugün Kontrol</p>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Planlanan denetimler</p>
          </div>

          {/* Bekleyen İşler */}
          <div className="bg-white dark:bg-slate-900 rounded-xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-orange-50 dark:bg-orange-900/20 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-orange-600 dark:text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <span className="text-3xl font-bold text-slate-900 dark:text-white">{upcomingReminders.length}</span>
            </div>
            <p className="text-slate-700 dark:text-slate-300 font-medium">Bekleyen İşler</p>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Onay bekleyenler</p>
          </div>

          {/* Yaklaşan Beton */}
          <div className="bg-white dark:bg-slate-900 rounded-xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-purple-50 dark:bg-purple-900/20 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8-4m8 4V17" />
                </svg>
              </div>
              <span className="text-3xl font-bold text-slate-900 dark:text-white">6</span>
            </div>
            <p className="text-slate-700 dark:text-slate-300 font-medium">Yaklaşan Beton</p>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Bu hafta döküm</p>
          </div>

          {/* Eksik Evrak */}
          <div className="bg-white dark:bg-slate-900 rounded-xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-red-50 dark:bg-red-900/20 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <span className="text-3xl font-bold text-slate-900 dark:text-white">9</span>
            </div>
            <p className="text-slate-700 dark:text-slate-300 font-medium">Eksik Evrak</p>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Tamamlanması gereken</p>
          </div>
        </div>

        {/* Financial & Inventory Summary */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Total Cash Flow */}
          <div className="bg-white dark:bg-slate-900 rounded-xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <span className="text-3xl font-bold text-slate-900 dark:text-white">
                ₺{((totalRevenue._sum.amount || 0) - (totalExpenses._sum.amount || 0)).toLocaleString('tr-TR')}
              </span>
            </div>
            <p className="text-slate-700 dark:text-slate-300 font-medium">💰 Toplam Kasa</p>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Gelir - Gider</p>
          </div>

          {/* Low Stock Warning */}
          <div className="bg-white dark:bg-slate-900 rounded-xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-slate-600 dark:text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8-4m8 4V17" />
                </svg>
              </div>
              <span className="text-3xl font-bold text-slate-900 dark:text-white">{lowStockCount}</span>
            </div>
            <p className="text-slate-700 dark:text-slate-300 font-medium">📦 Kritik Stok Uyarısı</p>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Eşiğin altındaki malzemeler</p>
          </div>
        </div>

        {/* Financial Chart (Gerçek Prisma Agregasyon Verisi) */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Finansal Akış Grafiği</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Son 6 ayın gerçek gelir ve gider toplamları (Prisma Transaction)</p>
            </div>
            <Link href="/admin/finance" className="text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300 text-sm">
              Detaylı Finans →
            </Link>
          </div>
          <FinancialChart data={monthlyFinancialData} />
        </div>

        {/* 2-Column Analytics Grid: Personel İş Yükü & Aktif DRIVER Kapasite Analizi */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Personel İş Yükü (Personnel Workload) Bar Chart */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Personel İş Yükü</h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Üzerinde en çok açık/devam eden görev olan 5 personel</p>
                </div>
                <Link href="/admin/personnel" className="text-blue-600 dark:text-blue-400 hover:text-blue-500 text-sm">
                  Tüm Personeller →
                </Link>
              </div>
              <PersonnelWorkloadChart data={topWorkloadPersonnel} />
            </div>
          </div>

          {/* Aktif DRIVER (Şoför) Kapasite Analizi */}
          <div>
            <DriverCapacityWidget drivers={driverCapacityList} />
          </div>
        </div>

        {/* Efficiency / Time Loss Analysis (Gerçek Zaman Kaybı Analizi) */}
        <div className="bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 rounded-xl p-6 border border-orange-200 dark:border-orange-800 mb-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              <svg className="w-6 h-6 text-orange-600 dark:text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Zaman Kaybı Analizi
            </h2>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20">
              Gerçek Gecikme Verisi (Bu Ay)
            </span>
          </div>

          <div className="mb-6">
            <p className="text-slate-800 dark:text-slate-200 font-semibold mb-1">
              Bu ay gecikmelerden dolayı kaybedilen toplam tahmini süre:{" "}
              <span className="text-orange-600 dark:text-orange-400 font-black text-lg">
                {timeLossStats.totalLostHours} Saat
              </span>
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Bitiş tarihi geçmiş (Overdue) görev ve iş emirlerinin planlanan ile gerçekleşen arasındaki farkından hesaplandı.
            </p>
            
            {timeLossStats.totalLostHours === 0 ? (
              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm flex items-center gap-2">
                <span>🎉 Harika! Bu ay vadesi geçmiş hiçbir görev veya iş emri bulunmuyor. Tüm işler planlanan zamanda ilerliyor.</span>
              </div>
            ) : (
              <div className="space-y-4">
                {timeLossStats.evrakHours > 0 && (
                  <div>
                    <div className="flex justify-between items-center mb-1.5 text-sm">
                      <span className="text-slate-900 dark:text-white font-medium">Evrak Girişi & İdari İşler</span>
                      <span className="text-orange-600 dark:text-orange-400 font-bold">{timeLossStats.evrakHours} saat</span>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-3">
                      <div className="bg-orange-500 h-3 rounded-full transition-all" style={{ width: `${Math.min(100, Math.round((timeLossStats.evrakHours / timeLossStats.totalLostHours) * 100))}%` }} />
                    </div>
                  </div>
                )}

                {timeLossStats.ulasimHours > 0 && (
                  <div>
                    <div className="flex justify-between items-center mb-1.5 text-sm">
                      <span className="text-slate-900 dark:text-white font-medium">Lojistik & Ulaşım</span>
                      <span className="text-red-600 dark:text-red-400 font-bold">{timeLossStats.ulasimHours} saat</span>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-3">
                      <div className="bg-red-500 h-3 rounded-full transition-all" style={{ width: `${Math.min(100, Math.round((timeLossStats.ulasimHours / timeLossStats.totalLostHours) * 100))}%` }} />
                    </div>
                  </div>
                )}

                {timeLossStats.sahaHours > 0 && (
                  <div>
                    <div className="flex justify-between items-center mb-1.5 text-sm">
                      <span className="text-slate-900 dark:text-white font-medium">Saha & İmalat Süreçleri</span>
                      <span className="text-amber-600 dark:text-amber-400 font-bold">{timeLossStats.sahaHours} saat</span>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-3">
                      <div className="bg-amber-500 h-3 rounded-full transition-all" style={{ width: `${Math.min(100, Math.round((timeLossStats.sahaHours / timeLossStats.totalLostHours) * 100))}%` }} />
                    </div>
                  </div>
                )}

                {timeLossStats.raporlamaHours > 0 && (
                  <div>
                    <div className="flex justify-between items-center mb-1.5 text-sm">
                      <span className="text-slate-900 dark:text-white font-medium">Raporlama & Denetim</span>
                      <span className="text-yellow-600 dark:text-yellow-400 font-bold">{timeLossStats.raporlamaHours} saat</span>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-3">
                      <div className="bg-yellow-500 h-3 rounded-full transition-all" style={{ width: `${Math.min(100, Math.round((timeLossStats.raporlamaHours / timeLossStats.totalLostHours) * 100))}%` }} />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {timeLossStats.totalLostHours > 0 && (
            <div className="bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 rounded-xl p-4 border border-green-300 dark:border-green-700">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center shrink-0">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div>
                  <h4 className="text-green-900 dark:text-green-100 font-semibold text-sm">Tahmini AI Telafi Potansiyeli</h4>
                  <p className="text-green-800 dark:text-green-200 text-base font-bold">{timeLossStats.estimatedAiSavingsHours} saat tasarruf edilebilir</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Dual Panel Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Panel - Upcoming Events */}
          <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Yaklaşan Şantiye Etkinlikleri</h2>
              <Link href="/admin/projects" className="text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300 text-sm">
                Tümünü Gör →
              </Link>
            </div>

            {upcomingReminders.length === 0 ? (
              <div className="text-center text-slate-500 dark:text-slate-400 py-8">
                <svg className="w-12 h-12 mx-auto mb-3 text-slate-400 dark:text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <p>Yaklaşan etkinlik yok</p>
              </div>
            ) : (
              <div className="space-y-3">
                {upcomingReminders.map((reminder) => (
                  <div key={reminder.id} className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="text-slate-900 dark:text-white font-medium mb-1">{reminder.title}</h3>
                        <p className="text-slate-600 dark:text-slate-400 text-sm mb-2">
                          {reminder.project?.name || 'Proje belirtilmemiş'}
                        </p>
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-1 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded text-xs">
                            {new Date(reminder.date).toLocaleDateString('tr-TR', {
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric'
                            })}
                          </span>
                          <span className="px-2 py-1 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded text-xs">
                            {new Date(reminder.date).toLocaleTimeString('tr-TR', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>
                      </div>
                      <Link
                        href={`/admin/projects/${reminder.projectId}`}
                        className="ml-4 text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right Panel - Recent System Movements */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Son Sistem Hareketleri</h2>
              <Link href="/admin/logs" className="text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300 text-sm">
                Tümünü Gör →
              </Link>
            </div>

            {recentLogs.length === 0 ? (
              <div className="text-center text-slate-500 dark:text-slate-400 py-8">
                <svg className="w-12 h-12 mx-auto mb-3 text-slate-400 dark:text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p>Henüz log kaydı yok</p>
              </div>
            ) : (
              <div className="space-y-4">
                {recentLogs.map((log, index) => (
                  <div key={log.id} className="relative pl-6 pb-4 last:pb-0">
                    {index !== recentLogs.length - 1 && (
                      <div className="absolute left-2 top-8 bottom-0 w-0.5 bg-slate-300 dark:bg-slate-700" />
                    )}
                    <div className="absolute left-0 top-1 w-4 h-4 rounded-full bg-blue-600 border-2 border-white dark:border-slate-900" />
                    <div className="mb-1">
                      <span className="text-slate-900 dark:text-white font-medium text-sm">{log.user}</span>
                      <span className="text-slate-500 dark:text-slate-400 text-xs ml-2">
                        {new Date(log.createdAt).toLocaleString('tr-TR', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                    <p className="text-slate-600 dark:text-slate-400 text-xs mb-1">{log.action}</p>
                    <p className="text-slate-500 dark:text-slate-500 text-xs">{log.details}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 mb-6">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">Hızlı İşlemler</h2>
          <div className="mobile-stats-grid gap-4">
            <Link
              href="/admin/projects"
              className="flex min-h-[44px] items-center gap-3 rounded-lg bg-slate-50 p-4 transition-colors group hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700"
            >
              <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/20 rounded-lg flex items-center justify-center group-hover:bg-blue-100 dark:group-hover:bg-blue-900/30 transition-colors">
                <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <div>
                <div className="font-medium text-slate-900 dark:text-white">Projeler</div>
                <div className="text-sm text-slate-600 dark:text-slate-400">Proje yönetimi</div>
              </div>
            </Link>
            <Link
              href="/admin/workers"
              className="flex items-center gap-3 p-4 bg-slate-50 dark:bg-slate-800 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors group"
            >
              <div className="w-10 h-10 bg-slate-100 dark:bg-slate-700 rounded-lg flex items-center justify-center group-hover:bg-slate-200 dark:group-hover:bg-slate-600 transition-colors">
                <svg className="w-5 h-5 text-slate-600 dark:text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div>
                <div className="font-medium text-slate-900 dark:text-white">Personel</div>
                <div className="text-sm text-slate-600 dark:text-slate-400">İşçi yönetimi</div>
              </div>
            </Link>
            <Link
              href="/admin/logs"
              className="flex items-center gap-3 p-4 bg-slate-50 dark:bg-slate-800 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors group"
            >
              <div className="w-10 h-10 bg-slate-100 dark:bg-slate-700 rounded-lg flex items-center justify-center group-hover:bg-slate-200 dark:group-hover:bg-slate-600 transition-colors">
                <svg className="w-5 h-5 text-slate-600 dark:text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <div className="font-medium text-slate-900 dark:text-white">Loglar</div>
                <div className="text-sm text-slate-600 dark:text-slate-400">Sistem kayıtları</div>
              </div>
            </Link>
            <Link
              href="/admin/finance"
              className="flex items-center gap-3 p-4 bg-slate-50 dark:bg-slate-800 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors group"
            >
              <div className="w-10 h-10 bg-slate-100 dark:bg-slate-700 rounded-lg flex items-center justify-center group-hover:bg-slate-200 dark:group-hover:bg-slate-600 transition-colors">
                <svg className="w-5 h-5 text-slate-600 dark:text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <div className="font-medium text-slate-900 dark:text-white">Finans</div>
                <div className="text-sm text-slate-600 dark:text-slate-400">Gelir-gider</div>
              </div>
            </Link>
          </div>
        </div>

        {/* YİBF Risk Radar */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">YİBF Risk Radarı</h2>
            <Link href="/admin/projects" className="text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300 text-sm">
              Tümünü Gör →
            </Link>
          </div>

          <div className="mobile-table-shell">
            <table className="min-w-[720px] w-full">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700 dark:text-slate-300">YİBF No</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700 dark:text-slate-300">Müteahhit</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700 dark:text-slate-300">Health Score</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700 dark:text-slate-300">Teknik Risk</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700 dark:text-slate-300">Finansal Risk</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700 dark:text-slate-300">Durum</th>
                </tr>
              </thead>
              <tbody>
                {riskRadarProjects.length > 0 ? (
                  riskRadarProjects.map((project) => {
                    const healthScore = project.progress || 50
                    const riskScore = 100 - (project.progress || 50)
                    const getHealthColor = (score: number) => {
                      if (score >= 80) return 'bg-green-500'
                      if (score >= 60) return 'bg-orange-500'
                      return 'bg-red-500'
                    }
                    const getHealthTextColor = (score: number) => {
                      if (score >= 80) return 'text-green-600 dark:text-green-400'
                      if (score >= 60) return 'text-orange-600 dark:text-orange-400'
                      return 'text-red-600 dark:text-red-400'
                    }
                    const getRiskLabel = (score: number) => {
                      if (score >= 70) return 'Yüksek'
                      if (score >= 40) return 'Orta'
                      return 'Düşük'
                    }
                    const getRiskTextColor = (score: number) => {
                      if (score >= 70) return 'text-red-600 dark:text-red-400'
                      if (score >= 40) return 'text-orange-600 dark:text-orange-400'
                      return 'text-green-600 dark:text-green-400'
                    }
                    const getStatusBadge = (healthScore: number, riskScore: number) => {
                      if (healthScore < 50 || riskScore > 70) {
                        return <span className="px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-full text-xs font-medium">Kritik �</span>
                      } else if (healthScore < 70 || riskScore > 40) {
                        return <span className="px-2 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 rounded-full text-xs font-medium">Takip 🟠</span>
                      } else {
                        return <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full text-xs font-medium">Normal 🟢</span>
                      }
                    }
                    return (
                      <tr key={project.id} className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                        <td className="py-3 px-4 text-sm text-slate-900 dark:text-white font-medium">{project.yibfNo || '-'}</td>
                        <td className="py-3 px-4 text-sm text-slate-700 dark:text-slate-300">{project.name || '-'}</td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <div className="w-16 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                              <div className={`h-full ${getHealthColor(healthScore)} rounded-full`} style={{ width: `${healthScore}%` }} />
                            </div>
                            <span className={`text-sm font-medium ${getHealthTextColor(healthScore)}`}>{healthScore}</span>
                          </div>
                        </td>
                        <td className={`py-3 px-4 text-sm ${getRiskTextColor(riskScore)} font-medium`}>{getRiskLabel(riskScore)}</td>
                        <td className={`py-3 px-4 text-sm ${getRiskTextColor(100 - riskScore)} font-medium`}>{getRiskLabel(100 - riskScore)}</td>
                        <td className="py-3 px-4">
                          {getStatusBadge(healthScore, riskScore)}
                        </td>
                      </tr>
                    )
                  })
                ) : (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-500">
                      Kayıtlı YİBF projesi bulunmamaktadır.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
          </>
        )}
      </div>
    </div>
  )
}