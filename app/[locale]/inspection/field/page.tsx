/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Yapı Denetim Saha Terminali (/inspection/field)
 * Saha Denetçileri (INSPECTOR / AUDITOR) İçin Hızlı Operasyon & Denetim Rotası Ekranı
 */

import React from "react"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import Link from "next/link"
import {
  Compass,
  ClipboardCheck,
  TestTube,
  Construction,
  Paperclip,
  AlertTriangle,
  Box,
  Eye,
  MapPin,
  Calendar,
  Building2,
  CheckCircle2,
  Clock,
  ArrowRight,
  Shield,
  Layers,
} from "lucide-react"

export const dynamic = "force-dynamic"

export const metadata = {
  title: "Saha Denetim Terminali | Nexa Yapı Denetim",
  description: "Yapı denetim kontrol elemanları ve saha denetçileri operasyon merkezi",
}

export const runtime = "nodejs"

export default async function InspectionFieldTerminalPage() {
  const session = await auth()
  if (!session?.user) {
    redirect("/login")
  }

  const user = session.user as any
  const tenantId = user.tenantId as string | undefined
  const userId = user.id as string

  // Kullanıcının atandığı projeleri veya aktif YİBF şantiyelerini getir
  const projects = await prisma.project.findMany({
    where: {
      deletedAt: null,
      ...(tenantId ? { tenantId } : {}),
    },
    orderBy: { updatedAt: "desc" },
    take: 6,
    select: {
      id: true,
      title: true,
      name: true,
      city: true,
      district: true,
      buildingClass: true,
      yibfNo: true,
      status: true,
      bimModelUrl: true,
      healthScore: true,
    },
  })

  // Açık Denetim Görevleri ve Eksiklikler
  const openDeficiencies = await prisma.deficiency.findMany({
    where: {
      status: { in: ["OPEN", "FIX_PENDING"] },
      ...(tenantId ? { tenantId } : {}),
    },
    take: 5,
    orderBy: { createdAt: "desc" },
    include: {
      project: { select: { name: true, title: true } },
    },
  })

  // Son Numune Kırım Durumları
  const recentSamples = await prisma.coreSample.findMany({
    where: {
      ...(tenantId ? { tenantId } : {}),
    },
    take: 4,
    orderBy: { takenAt: "desc" },
  })

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Başlık & Bilgi */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-blue-950/60 via-slate-900 to-slate-900 p-6 rounded-3xl border border-blue-900/40 shadow-xl">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/30 shrink-0">
            <Compass className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                Saha Terminali
              </span>
              <span className="text-xs text-slate-400">
                {new Date().toLocaleDateString("tr-TR", { weekday: "long", day: "numeric", month: "long" })}
              </span>
            </div>
            <h1 className="text-2xl font-black text-white mt-1">Yapı Denetim Saha İstasyonu</h1>
            <p className="text-sm text-slate-400">
              Hoş geldiniz, <span className="text-blue-300 font-semibold">{user.name}</span>. Günlük denetim vizeleri ve saha kontrolleri tek ekranda.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/inspection/forms"
            className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold transition-all shadow-lg shadow-blue-600/30 flex items-center gap-2"
          >
            <ClipboardCheck className="w-4 h-4" />
            <span>Yeni Denetim Başlat</span>
          </Link>
          <Link
            href="/inspection/routes"
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-semibold border border-slate-700 transition-all flex items-center gap-2"
          >
            <MapPin className="w-4 h-4 text-emerald-400" />
            <span>Denetim Rotası</span>
          </Link>
        </div>
      </div>

      {/* Hızlı Aksiyon Kartları Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          {
            href: "/inspection/reinforcement",
            title: "Demir & Kalıp",
            desc: "Donatı vizesi ver",
            icon: Construction,
            color: "from-amber-500 to-orange-600",
          },
          {
            href: "/inspection/samples",
            title: "Beton & Karot",
            desc: "QR numune kaydet",
            icon: TestTube,
            color: "from-emerald-500 to-teal-600",
          },
          {
            href: "/inspection/forms",
            title: "Denetim Formu",
            desc: "Dinamik YİBF formu",
            icon: ClipboardCheck,
            color: "from-blue-500 to-cyan-600",
          },
          {
            href: "/inspection/attachment",
            title: "Ataşman & Delil",
            desc: "Fotoğraflı kanıt yükle",
            icon: Paperclip,
            color: "from-purple-500 to-indigo-600",
          },
          {
            href: "/inspection/deficiencies",
            title: "Kusur & DÖF",
            desc: "Eksiklik raporu aç",
            icon: AlertTriangle,
            color: "from-rose-500 to-red-600",
          },
          {
            href: "/inspection/bim",
            title: "3D BIM & AR",
            desc: "Mimari/Statik model",
            icon: Box,
            color: "from-fuchsia-500 to-pink-600",
          },
        ].map((act, i) => {
          const Icon = act.icon
          return (
            <Link
              key={i}
              href={act.href}
              className="p-4 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 hover:bg-slate-850 transition-all group flex flex-col justify-between"
            >
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${act.color} flex items-center justify-center text-white mb-3 shadow-md group-hover:scale-105 transition-transform`}>
                <Icon className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white group-hover:text-blue-400 transition-colors">
                  {act.title}
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">{act.desc}</p>
              </div>
            </Link>
          )
        })}
      </div>

      {/* Şantiyeler ve Aktif Denetim Listesi */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Atanan YİBF Şantiyeleri */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-blue-400" />
              <h2 className="text-lg font-bold text-white">Denetimimdeki Şantiyeler</h2>
            </div>
            <Link href="/inspection/projects" className="text-xs text-blue-400 hover:underline flex items-center gap-1">
              <span>Tümünü Gör ({projects.length})</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {projects.map((p) => (
              <div
                key={p.id}
                className="p-4 rounded-2xl bg-slate-850 border border-slate-800 hover:border-blue-900/50 transition-all flex flex-col justify-between space-y-3"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                      YİBF: {p.yibfNo || "Aktif"}
                    </span>
                    <span className="text-xs text-slate-400">{p.buildingClass || "3B"} Sınıf</span>
                  </div>
                  <h3 className="text-base font-bold text-white mt-2 truncate">{p.name || p.title}</h3>
                  <p className="text-xs text-slate-400 flex items-center gap-1 mt-1">
                    <MapPin className="w-3 h-3 text-slate-500" />
                    <span>{p.district ? `${p.district}, ` : ""}{p.city || "İstanbul"}</span>
                  </p>
                </div>

                <div className="flex items-center gap-2 pt-2 border-t border-slate-800 text-xs">
                  <Link
                    href={`/inspection/projects/${p.id}/ar`}
                    className="flex-1 py-1.5 px-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 rounded-lg text-center font-semibold transition-colors"
                  >
                    AR Denetim
                  </Link>
                  <Link
                    href={`/inspection/projects/${p.id}/bim`}
                    className="flex-1 py-1.5 px-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-center font-semibold transition-colors"
                  >
                    3D Model
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Son Kusur & Eksiklikler */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-400" />
              <h2 className="text-lg font-bold text-white">Açık Kusurlar & DÖF</h2>
            </div>
            <Link href="/inspection/deficiencies" className="text-xs text-amber-400 hover:underline">
              Tümü
            </Link>
          </div>

          <div className="space-y-2.5">
            {openDeficiencies.length === 0 ? (
              <p className="text-xs text-slate-500 py-6 text-center">Açık kusur kaydı bulunmuyor.</p>
            ) : (
              openDeficiencies.map((d) => (
                <div
                  key={d.id}
                  className="p-3 rounded-xl bg-slate-850 border border-slate-800 flex items-start gap-3"
                >
                  <div className="w-2 h-2 rounded-full bg-amber-400 mt-1.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white truncate">{d.element} ({d.floor})</span>
                      <span className="text-[10px] text-amber-400 px-1.5 py-0.2 bg-amber-500/10 rounded">
                        {d.priority}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 line-clamp-1 mt-0.5">{d.description}</p>
                    <p className="text-[10px] text-slate-500 mt-1">{d.project?.name || d.project?.title}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

