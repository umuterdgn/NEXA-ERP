/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Franchise Şube / Bayi Özel Ekranı (/franchise/branch)
 * Bayi yalnızca kendisine atanan şubenin durumunu, kusurlarını, görevlerini ve zimmetli ekipmanlarını görür.
 */

import React from "react"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { Link } from "@/i18n/routing"
import {
  Store,
  Box,
  AlertTriangle,
  CheckSquare,
  Headphones,
  MapPin,
  Package,
  TrendingUp,
  CheckCircle2,
  Clock,
  ArrowRight,
  Building2,
} from "lucide-react"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

export const metadata = {
  title: "Şube Portalı | Nexa Franchise",
  description: "Bayi şube kurulum, 3D mağaza modeli ve saha operasyon özeti",
}

export default async function FranchiseBranchPage() {
  const session = await auth()
  if (!session?.user) {
    redirect("/login")
  }

  const user = session.user as any
  const userId = user.id as string
  const role = String(user.role || "").toUpperCase()
  const tenantId = (user.tenantId as string | null) || null

  const personel = await prisma.personel
    .findFirst({
      where: { userId },
      select: { id: true, projectId: true, assignedProjectIds: true },
    })
    .catch(() => null)

  const rawIds = [
    ...(Array.isArray(user.assignedProjectIds) ? user.assignedProjectIds : []),
    ...(Array.isArray(personel?.assignedProjectIds) ? personel.assignedProjectIds : []),
    ...(personel?.projectId ? [personel.projectId] : []),
  ].filter(Boolean) as string[]

  const effectiveProjectIds = Array.from(new Set(rawIds))
  const isAdminViewer = ["FRANCHISE_ADMIN", "REGIONAL_MANAGER", "SUPER_ADMIN"].includes(role)

  const branchWhere: any =
    effectiveProjectIds.length > 0
      ? { id: { in: effectiveProjectIds }, deletedAt: null, ...(tenantId ? { tenantId } : {}) }
      : isAdminViewer && tenantId
      ? { tenantId, deletedAt: null }
      : null

  const [branches, deficiencies, tasks, assignments] = branchWhere
    ? await Promise.all([
        prisma.project.findMany({
          where: branchWhere,
          select: {
            id: true,
            name: true,
            title: true,
            city: true,
            district: true,
            location: true,
            progress: true,
            status: true,
          },
          orderBy: { createdAt: "desc" },
          take: 10,
        }),
        prisma.deficiency.findMany({
          where: {
            ...(tenantId ? { tenantId } : {}),
            ...(effectiveProjectIds.length > 0 ? { projectId: { in: effectiveProjectIds } } : {}),
          },
          select: {
            id: true,
            floor: true,
            element: true,
            category: true,
            priority: true,
            status: true,
            description: true,
            createdAt: true,
            projectId: true,
          },
          orderBy: { createdAt: "desc" },
          take: 15,
        }),
        prisma.task.findMany({
          where: {
            ...(tenantId ? { tenantId } : {}),
            ...(effectiveProjectIds.length > 0 ? { projectId: { in: effectiveProjectIds } } : {}),
          },
          select: {
            id: true,
            title: true,
            status: true,
            dueDate: true,
            taskType: true,
            projectId: true,
          },
          orderBy: { createdAt: "desc" },
          take: 15,
        }),
        prisma.inventoryAssignment.findMany({
          where: {
            ...(tenantId ? { tenantId } : {}),
            ...(personel?.id
              ? { personelId: personel.id }
              : effectiveProjectIds.length > 0
              ? { inventory: { projectId: { in: effectiveProjectIds } } }
              : { id: "__none__" }),
          },
          include: {
            inventory: {
              select: { id: true, name: true, category: true, unit: true },
            },
          },
          orderBy: { assignedAt: "desc" },
          take: 10,
        }),
      ])
    : [[], [], [], []]

  const primaryBranch = branches[0] || null
  const avgProgress =
    branches.length > 0
      ? Math.round(branches.reduce((acc, b) => acc + (b.progress || 0), 0) / branches.length)
      : 0
  const openDeficiencies = deficiencies.filter((d) => d.status !== "CLOSED")
  const pendingTasks = tasks.filter((t) => t.status !== "COMPLETED" && t.status !== "DONE")

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-amber-400">
            <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
            Bayi & Şube Portalı
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight mt-1 flex items-center gap-3">
            <Store className="w-8 h-8 text-amber-400" />
            <span>{primaryBranch ? primaryBranch.name || primaryBranch.title : "Şube Operasyon Merkezi"}</span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            {primaryBranch
              ? `${primaryBranch.district || ""}${primaryBranch.district && primaryBranch.city ? ", " : ""}${primaryBranch.city || primaryBranch.location || "Şube Detayları"}`
              : "Size atanmış şube kurulum, 3D mağaza ve görev özetiniz."}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Link
            href="/franchise/bim"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500/15 border border-amber-500/30 hover:bg-amber-500/25 text-amber-300 text-xs font-bold transition"
          >
            <Box className="w-4 h-4" />
            <span>3D Mağaza BIM</span>
          </Link>
          <Link
            href="/franchise/stores/helpdesk"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-200 text-xs font-semibold transition"
          >
            <Headphones className="w-4 h-4 text-blue-400" />
            <span>Destek Talebi</span>
          </Link>
        </div>
      </div>

      {branches.length === 0 ? (
        <div className="p-8 rounded-2xl bg-slate-900/70 border border-slate-800 text-center space-y-3">
          <Building2 className="w-10 h-10 text-slate-500 mx-auto" />
          <h2 className="text-lg font-bold text-white">Henüz size atanmış bir şube bulunmuyor</h2>
          <p className="text-sm text-slate-400 max-w-md mx-auto">
            Franchise yöneticiniz şube ataması yaptığında kurulum ilerlemesi, 3D mağaza modeli ve görevleriniz burada görüntülenecektir.
          </p>
        </div>
      ) : (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800/80">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Kurulum İlerlemesi</span>
                <TrendingUp className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-2xl font-black text-white mt-2">%{avgProgress}</div>
              <div className="text-[11px] text-emerald-400 mt-1">
                {primaryBranch?.status || "AKTİF"}
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800/80">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Açık Kusurlar</span>
                <AlertTriangle className="w-4 h-4 text-rose-400" />
              </div>
              <div className="text-2xl font-black text-white mt-2">{openDeficiencies.length}</div>
              <div className="text-[11px] text-slate-400 mt-1">Toplam {deficiencies.length} kayıt</div>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800/80">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Bekleyen Görevler</span>
                <CheckSquare className="w-4 h-4 text-amber-400" />
              </div>
              <div className="text-2xl font-black text-white mt-2">{pendingTasks.length}</div>
              <div className="text-[11px] text-slate-400 mt-1">Toplam {tasks.length} iş emri</div>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800/80">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Demirbaş & Ekipman</span>
                <Package className="w-4 h-4 text-blue-400" />
              </div>
              <div className="text-2xl font-black text-white mt-2">{assignments.length}</div>
              <div className="text-[11px] text-slate-400 mt-1">Şube zimmet kaydı</div>
            </div>
          </div>

          {/* Assigned Branches List */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800/80 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-amber-400" />
                  Atanan Şubelerim ({branches.length})
                </h2>
                <Link href="/franchise/bim" className="text-xs text-amber-400 hover:underline flex items-center gap-1">
                  <span>3D Model</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
              <div className="space-y-3">
                {branches.map((b) => (
                  <div key={b.id} className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-white truncate">{b.name || b.title}</p>
                      <p className="text-xs text-slate-400 truncate">
                        {[b.district, b.city, b.location].filter(Boolean).join(" • ") || "Lokasyon tanımlı"}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                        %{b.progress || 0}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Deficiencies Summary */}
            <div className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800/80 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-400" />
                  Şube Kusur & Eksiklik Listesi
                </h2>
                <Link href="/franchise/rollout/punch-list" className="text-xs text-amber-400 hover:underline flex items-center gap-1">
                  <span>Tümü</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
              {deficiencies.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400 flex flex-col items-center gap-2">
                  <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                  <span>Şubenizde kayıtlı açık kusur bulunmuyor.</span>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {deficiencies.slice(0, 6).map((d) => (
                    <div key={d.id} className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-white truncate">
                          {d.element} • {d.floor}
                        </p>
                        <p className="text-xs text-slate-400 line-clamp-1">{d.description}</p>
                      </div>
                      <span className="shrink-0 text-[10px] font-bold px-2 py-0.5 rounded bg-rose-500/15 text-rose-300 border border-rose-500/30">
                        {d.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Tasks & Equipments */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800/80 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <Clock className="w-4 h-4 text-blue-400" />
                  Şube Görevleri
                </h2>
                <Link href="/franchise/tasks" className="text-xs text-amber-400 hover:underline flex items-center gap-1">
                  <span>Görevler</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
              {tasks.length === 0 ? (
                <p className="text-xs text-slate-400 py-4 text-center">Aktif görev bulunmuyor.</p>
              ) : (
                <div className="space-y-2">
                  {tasks.slice(0, 6).map((t) => (
                    <div key={t.id} className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center justify-between gap-3">
                      <span className="text-xs font-semibold text-white truncate">{t.title}</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300 shrink-0">
                        {t.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800/80 space-y-4">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Package className="w-4 h-4 text-emerald-400" />
                Şube Ekipman & Zimmetler
              </h2>
              {assignments.length === 0 ? (
                <p className="text-xs text-slate-400 py-4 text-center">Henüz zimmetli ekipman kaydı yok.</p>
              ) : (
                <div className="space-y-2">
                  {assignments.map((a) => (
                    <div key={a.id} className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-white truncate">{a.inventory?.name || "Ekipman"}</p>
                        <p className="text-[11px] text-slate-400">{a.quantity} {a.inventory?.unit || "Adet"}</p>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 shrink-0">
                        {a.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
