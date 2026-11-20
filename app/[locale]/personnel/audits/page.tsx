/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Personel Saha Denetim Raporları Ekranı (/personnel/audits)
 */

import React from "react"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { hasModuleAccess, normalizeTenantType } from "@/lib/rbac/permissions"
import { ClipboardCheck, AlertTriangle, CheckCircle2, Calendar, Building2 } from "lucide-react"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

export const metadata = {
  title: "Denetim Raporları | Nexa Saha Portalı",
  description: "Yetkili saha personelinin proje bazlı denetim ve kusur raporları",
}

export default async function PersonnelAuditsPage() {
  const session = await auth()
  if (!session?.user) {
    redirect("/login")
  }

  const user = session.user as any
  const role = String(user.role || "").toUpperCase()
  const tenantId = (user.tenantId as string | null) || null
  const tenantType = normalizeTenantType(user.tenantType)
  const assignedProjectIds: string[] = Array.isArray(user.assignedProjectIds) ? user.assignedProjectIds : []

  const canView =
    hasModuleAccess(role, tenantType, "field_reports") ||
    hasModuleAccess(role, tenantType, "inspections") ||
    hasModuleAccess(role, tenantType, "deficiencies")

  if (!canView) {
    redirect("/personnel")
  }

  const scopeFilter: any = {
    ...(tenantId ? { tenantId } : {}),
    ...(assignedProjectIds.length > 0 ? { projectId: { in: assignedProjectIds } } : {}),
  }

  const [inspections, deficiencies] = await Promise.all([
    prisma.inspection.findMany({
      where: scopeFilter,
      include: {
        project: { select: { id: true, name: true, title: true } },
        inspector: { select: { id: true, name: true } },
      },
      orderBy: { inspectionDate: "desc" },
      take: 25,
    }),
    prisma.deficiency.findMany({
      where: scopeFilter,
      include: {
        project: { select: { id: true, name: true, title: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 25,
    }),
  ])

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
            <ClipboardCheck className="w-7 h-7 text-blue-500" />
            Saha Denetim & Kalite Raporları
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            Yetkili olduğunuz projelerdeki yapı denetimleri ve açık kusur kayıtları.
          </p>
        </div>
        <div className="flex items-center gap-3 text-xs font-semibold">
          <span className="px-3 py-1.5 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
            {inspections.length} Denetim
          </span>
          <span className="px-3 py-1.5 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
            {deficiencies.length} Kusur Kaydı
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/70 p-5 space-y-4">
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
            Son Denetimler
          </h2>
          {inspections.length === 0 ? (
            <p className="text-sm text-slate-500 py-8 text-center">Kayıtlı denetim raporu bulunamadı.</p>
          ) : (
            <div className="space-y-3">
              {inspections.map((ins) => (
                <div key={ins.id} className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-bold text-slate-900 dark:text-white">
                      {ins.type} • {ins.floor || "Genel"}
                    </span>
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                      {ins.status}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                    <span className="flex items-center gap-1">
                      <Building2 className="w-3.5 h-3.5" />
                      {ins.project?.name || ins.project?.title || "Proje"}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {new Date(ins.inspectionDate).toLocaleDateString("tr-TR")}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/70 p-5 space-y-4">
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            Saha Kusur & Uygunsuzluklar
          </h2>
          {deficiencies.length === 0 ? (
            <p className="text-sm text-slate-500 py-8 text-center">Açık saha kusuru bulunmuyor.</p>
          ) : (
            <div className="space-y-3">
              {deficiencies.map((def) => (
                <div key={def.id} className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-bold text-slate-900 dark:text-white">
                      {def.element} ({def.floor})
                    </span>
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-amber-500/15 text-amber-600 dark:text-amber-400">
                      {def.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300">{def.description}</p>
                  <div className="text-[11px] text-slate-500">
                    {def.project?.name || def.project?.title || "Proje"} • Öncelik: {def.priority}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}

