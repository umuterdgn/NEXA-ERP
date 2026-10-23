"use client"
/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Franchise Stage-Gate Mağaza Seçim ve Genel Bakış Listesi
 */

import { useState, useEffect } from "react"
import Link from "next/link"
import {
  ShieldCheck,
  Building2,
  MapPin,
  ChevronRight,
  CheckCircle2,
  Clock,
  ArrowRight,
  Store,
  RefreshCw,
} from "lucide-react"

export default function StageGatesIndexPage() {
  const [projects, setProjects] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const fetchProjects = async () => {
    try {
      setLoading(true)
      const res = await fetch("/api/franchise/rollout")
      const data = await res.json()
      if (data.projects) {
        setProjects(data.projects)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProjects()
  }, [])

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-blue-400 mb-1">
            <ShieldCheck className="w-4 h-4" />
            <span>İdari İzin & Kilit Yönetimi</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Stage-Gate İdari Onaylar
          </h1>
          <p className="text-sm text-slate-400">
            Kiralama, AVM onayı, şantiye izni ve itfaiye ruhsatlarını yönetmek istediğiniz mağazayı seçin.
          </p>
        </div>

        <button
          onClick={fetchProjects}
          disabled={loading}
          className="p-2 rounded-lg bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors self-start sm:self-center"
          title="Yenile"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {projects.map((p) => {
          const totalGates = p.stageGates?.length || 5
          const approvedGates = p.stageGates?.filter((g: any) => g.isApproved)?.length || 0
          const percent = Math.round((approvedGates / totalGates) * 100)

          return (
            <Link
              key={p.id}
              href={`/admin/franchise/stage-gates/${p.id}`}
              className="group bg-slate-900/80 border border-slate-800 hover:border-blue-700/60 rounded-xl p-5 transition-all hover:shadow-xl space-y-4"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider">
                    {p.storeTemplate?.name || "Tip Konsept"}
                  </span>
                  <h3 className="text-base font-bold text-white group-hover:text-blue-400 transition-colors mt-0.5">
                    {p.name || p.title}
                  </h3>
                  <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-500" />
                    <span>{p.city} • {p.district || p.location}</span>
                  </div>
                </div>

                <div className="p-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-400 group-hover:text-blue-400 group-hover:border-blue-800/50 transition-colors">
                  <ChevronRight className="w-4 h-4" />
                </div>
              </div>

              {/* Approval status */}
              <div className="space-y-1.5 pt-2 border-t border-slate-800/80">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400 flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
                    İdari Onay: {approvedGates} / {totalGates} Faz
                  </span>
                  <span className="font-semibold text-white">%{percent}</span>
                </div>
                <div className="h-1.5 w-full bg-slate-950 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500 rounded-full transition-all"
                    style={{ width: `${percent}%` }}
                  ></div>
                </div>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
