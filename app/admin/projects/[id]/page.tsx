/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * This code is the property of NXA Software.
 */

import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import Link from "next/link"
import ProjectDetailClient from "@/components/ProjectDetailClient"
import ProjectDetailTabs from "@/components/ProjectDetailTabs"
import ProjectTimeline from "@/components/ProjectTimeline"

export const dynamic = 'force-dynamic'

export default async function ProjectDetailPage({
  params
}: {
  params: Promise<{ id: string }>
}) {
  const resolvedParams = await params

  type ProjectTransaction = {
    id: string
    type: "GELIR" | "GIDER"
    amount: number | string
    description: string
    date: string
  }

  type ProjectRecord = {
    id: string
    name?: string | null
    title?: string | null
    healthScore?: number | null
    progress?: number | null
    yibfNo?: string | number | null
    status?: string | null
    startDate?: string | Date | null
    endDate?: string | Date | null
    locationCity?: string | null
    district?: string | null
    transactions?: ProjectTransaction[]
    inspections?: Array<Record<string, unknown>>
    deficiencies?: Array<Record<string, unknown>>
    documents?: Array<Record<string, unknown>>
    audits?: Array<Record<string, unknown>>
    _count?: {
      inspections?: number
      deficiencies?: number
      documents?: number
      projectTasks?: number
      droneMedia?: number
      projectFiles?: number
    }
    company?: { name: string } | null
    archives?: Array<Record<string, unknown>>
    siteZones?: Array<Record<string, unknown>>
    [key: string]: unknown
  }
  
  let project: ProjectRecord | null = null
  try {
    project = (await prisma.project.findUnique({
      where: { id: resolvedParams.id },
      include: {
        company: true,
        archives: true,
        transactions: true,
        siteZones: true,
        inspections: {
          include: {
            inspector: {
              select: {
                id: true,
                name: true
              }
            }
          },
          orderBy: {
            inspectionDate: 'desc'
          }
        },
        deficiencies: {
          include: {
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
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        },
        documents: {
          include: {
            uploadedBy: {
              select: {
                id: true,
                name: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        },
        audits: {
          include: {
            inspector: {
              select: {
                id: true,
                name: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        },
        _count: {
          select: {
            inspections: true,
            deficiencies: true,
            documents: true,
            projectTasks: true,
            droneMedia: true,
            projectFiles: true
          }
        }
      }
    })) as ProjectRecord | null
  } catch (error) {
    console.error("Failed to fetch project:", error)
    notFound()
  }

  if (!project) {
    notFound()
  }

  // Calculate project financial stats
  const totalIncome = (project.transactions ?? [])
    .filter((t: ProjectTransaction) => t.type === "GELIR")
    .reduce((sum: number, t: ProjectTransaction) => sum + Number(t.amount || 0), 0)
  
  const totalExpense = (project.transactions ?? [])
    .filter((t: ProjectTransaction) => t.type === "GIDER")
    .reduce((sum: number, t: ProjectTransaction) => sum + Number(t.amount || 0), 0)
  
  const netBalance = totalIncome - totalExpense
  const inspectionCount = Number(project?._count?.inspections ?? project?.inspections?.length ?? 0)
  const deficiencyCount = Number(project?._count?.deficiencies ?? project?.deficiencies?.length ?? 0)
  const documentCount = Number(project?._count?.documents ?? project?.documents?.length ?? 0)
  const healthScore = Number(project?.healthScore ?? 0)
  const progressValue = Number(project?.progress ?? 0)

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "ETUT": return "Etüt"
      case "CIZIM": return "Çizim"
      case "SAHA": return "Saha"
      case "TAMAMLANDI": return "Tamamlandı"
      default: return status
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ETUT": return "bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-800"
      case "CIZIM": return "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800"
      case "SAHA": return "bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 border border-orange-200 dark:border-orange-800"
      case "TAMAMLANDI": return "bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 border border-green-200 dark:border-green-800"
      default: return "bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700"
    }
  }

  return (
    <div className="lg:mt-0 mt-16">
      <div className="mb-6">
        <Link
          href="/admin/projects"
          className="text-slate-400 hover:text-slate-200 text-sm"
        >
          ← Projeler Listesine Dön
        </Link>
      </div>

      {/* Header - Digital Twin Card */}
      <div className="bg-white dark:bg-slate-900 rounded-xl p-6 border border-slate-200 dark:border-slate-800 mb-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl lg:text-3xl font-bold text-slate-900 dark:text-white">
                {project.name || project.title}
              </h1>
              {Boolean(project.yibfNo) && (
                <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full text-sm font-medium border border-blue-200 dark:border-blue-800">
                  YİBF: {String(project.yibfNo)}
                </span>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-4 text-slate-600 dark:text-slate-400">
              {Boolean(project.company) && (
                <span className="flex items-center">
                  <span className="mr-2">Müşteri:</span>
                  <span className="text-slate-900 dark:text-white font-medium">{String(project.company?.name ?? "")}</span>
                </span>
              )}
              <span className="flex items-center">
                <span className="mr-2">Başlangıç:</span>
                <span className="text-slate-900 dark:text-white">
                  {new Date(String(project.startDate || Date.now())).toLocaleDateString("tr-TR")}
                </span>
              </span>
              {Boolean(project.endDate) && (
                <span className="flex items-center">
                  <span className="mr-2">Bitiş:</span>
                  <span className="text-slate-900 dark:text-white">
                    {new Date(String(project.endDate || Date.now())).toLocaleDateString("tr-TR")}
                  </span>
                </span>
              )}
              {Boolean(project.locationCity) && (
                <span className="flex items-center">
                  <span className="mr-2">Konum:</span>
                  <span className="text-slate-900 dark:text-white font-medium">
                    {String(project.locationCity ?? "")}
                    {Boolean(project.district) && `, ${String(project.district ?? "")}`}
                  </span>
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <ProjectDetailClient project={project} />
            {Boolean(project.status) && (
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(String(project.status ?? ""))}`}>
                {getStatusLabel(String(project.status ?? ""))}
              </span>
            )}
          </div>
        </div>

        {/* Digital Twin Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-6 border-t border-slate-200 dark:border-slate-700">
          {/* Health Score */}
          <div className="bg-linear-to-br from-emerald-50 to-green-50 dark:from-emerald-900/20 dark:to-green-900/20 rounded-lg p-4 border border-emerald-200 dark:border-emerald-800">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-emerald-700 dark:text-emerald-400">Sağlık Skoru</span>
              <span className={`text-2xl font-bold ${healthScore >= 80 ? 'text-emerald-600 dark:text-emerald-400' : healthScore >= 50 ? 'text-yellow-600 dark:text-yellow-400' : 'text-red-600 dark:text-red-400'}`}>
                {healthScore}
              </span>
            </div>
            <div className="w-full bg-emerald-200 dark:bg-emerald-800 rounded-full h-2">
              <div 
                className={`h-2 rounded-full transition-all ${healthScore >= 80 ? 'bg-emerald-500' : healthScore >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`}
                style={{ width: `${Math.min(100, Math.max(0, healthScore))}%` }}
              />
            </div>
          </div>

          {/* Progress */}
          <div className="bg-linear-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-blue-700 dark:text-blue-400">İlerleme</span>
              <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {progressValue}%
              </span>
            </div>
            <div className="w-full bg-blue-200 dark:bg-blue-800 rounded-full h-2">
              <div 
                className="h-2 rounded-full bg-blue-500 transition-all"
                style={{ width: `${Math.min(100, Math.max(0, progressValue))}%` }}
              />
            </div>
          </div>

          {/* Quick Stats */}
          <div className="bg-linear-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg p-4 border border-purple-200 dark:border-purple-800">
            <div className="grid grid-cols-3 gap-2">
              <div className="text-center">
                <span className="block text-2xl font-bold text-purple-600 dark:text-purple-400">{inspectionCount}</span>
                <span className="text-xs text-purple-700 dark:text-purple-400">Denetim</span>
              </div>
              <div className="text-center">
                <span className="block text-2xl font-bold text-pink-600 dark:text-pink-400">{deficiencyCount}</span>
                <span className="text-xs text-pink-700 dark:text-pink-400">Eksiklik</span>
              </div>
              <div className="text-center">
                <span className="block text-2xl font-bold text-indigo-600 dark:text-indigo-400">{documentCount}</span>
                <span className="text-xs text-indigo-700 dark:text-indigo-400">Belge</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Timeline */}
      <ProjectTimeline 
        inspections={project.inspections}
        deficiencies={project.deficiencies}
        documents={project.documents}
        audits={project.audits}
      />

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Financial Summary (Narrow) */}
        <div className="space-y-6">
          <div className="bg-slate-900 rounded-xl p-6 border border-slate-800">
            <h3 className="text-lg font-semibold text-white mb-4">Finansal Özet</h3>
            
            <div className="space-y-4 mb-6">
              <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
                <label className="block text-sm font-medium text-slate-400 mb-1">Toplam Gelir</label>
                <p className="text-2xl font-bold text-green-400">
                  {totalIncome.toLocaleString("tr-TR")} ₺
                </p>
              </div>
              
              <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
                <label className="block text-sm font-medium text-slate-400 mb-1">Toplam Gider</label>
                <p className="text-2xl font-bold text-red-400">
                  {totalExpense.toLocaleString("tr-TR")} ₺
                </p>
              </div>
              
              <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
                <label className="block text-sm font-medium text-slate-400 mb-1">Net Durum</label>
                <p className={`text-2xl font-bold ${netBalance >= 0 ? "text-green-400" : "text-red-400"}`}>
                  {netBalance.toLocaleString("tr-TR")} ₺
                </p>
              </div>
            </div>

            {/* Recent Transactions */}
            <div>
              <h4 className="text-md font-semibold text-white mb-3">Son İşlemler</h4>
              {(project.transactions ?? []).length === 0 ? (
                <div className="text-center text-slate-500 py-8">
                  Henüz işlem yok
                </div>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {(project.transactions ?? []).slice(0, 10).map((transaction: ProjectTransaction) => (
                    <div key={transaction.id} className="bg-slate-800 rounded-lg p-3 border border-slate-700">
                      <p className="text-white text-sm font-medium truncate">{transaction.description}</p>
                      <div className="flex justify-between items-center mt-1">
                        <p className="text-slate-500 text-xs">
                          {new Date(transaction.date).toLocaleDateString("tr-TR")}
                        </p>
                        <p className={`font-semibold text-sm ${transaction.type === "GELIR" ? "text-green-400" : "text-red-400"}`}>
                          {transaction.type === "GELIR" ? "+" : "-"}
                          {transaction.amount.toLocaleString("tr-TR")} ₺
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column - Tabbed Content (Wide, col-span-2) */}
        <div className="lg:col-span-2 space-y-6">
          <ProjectDetailTabs project={project as any} />
        </div>
      </div>
    </div>
  )
}
