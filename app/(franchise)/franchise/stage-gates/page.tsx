"use client"
/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Franchise Stage-Gate Mağaza Seçim ve İdari Onay Paneli
 * %100 Tenant İzolasyonu ile RolloutProject ve StageGate Modellerine Bağlıdır.
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
  XCircle,
  AlertCircle,
  Check,
  Plus,
  Loader2,
} from "lucide-react"
import { getRolloutProjects, updateStageGateApproval } from "@/app/actions/franchise"

export default function StageGatesIndexPage() {
  const [projects, setProjects] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [updatingGateId, setUpdatingGateId] = useState<string | null>(null)
  const [selectedProject, setSelectedProject] = useState<any | null>(null)

  const fetchProjects = async () => {
    try {
      setLoading(true)
      const res = await getRolloutProjects()
      if (res.success && res.projects) {
        setProjects(res.projects)
      } else {
        // Fallback to API route
        const apiRes = await fetch("/api/franchise/rollout")
        const apiData = await apiRes.json()
        if (apiData.projects) {
          setProjects(apiData.projects)
        }
      }
    } catch (err) {
      console.error("Stage-Gates yüklenirken hata:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProjects()
  }, [])

  const handleToggleGate = async (gateId: string, currentStatus: string) => {
    try {
      setUpdatingGateId(gateId)
      const newStatus = currentStatus === "ONAYLANDI" ? "BEKLIYOR" : "ONAYLANDI"
      await updateStageGateApproval(gateId, newStatus)
      await fetchProjects()
    } catch (err) {
      console.error("Gate güncelleme hatası:", err)
    } finally {
      setUpdatingGateId(null)
    }
  }

  return (
    <div className="w-full space-y-6 pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-amber-400 mb-1">
            <ShieldCheck className="w-4 h-4" />
            <span>İdari İzin & Kilit Yönetimi</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Stage-Gate İdari Onaylar
          </h1>
          <p className="text-sm text-slate-400">
            Kiralama, lokasyon ve ruhsat onayı, şantiye izni ve itfaiye ruhsatlarını veritabanındaki mağaza kayıtları üzerinden yönetin.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={fetchProjects}
            disabled={loading}
            className="p-2 rounded-lg bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors self-start sm:self-center"
            title="Yenile"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>

          <Link
            href="/franchise/rollout"
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold transition-all shadow-md shadow-amber-600/20"
          >
            <Plus className="w-4 h-4" />
            <span>Yeni Mağaza Ekle</span>
          </Link>
        </div>
      </div>

      {/* Projects Grid or Empty State: data.length === 0 */}
      {!loading && projects.length === 0 ? (
        <div className="bg-slate-900/60 border border-dashed border-slate-800 rounded-2xl p-12 text-center max-w-xl mx-auto space-y-4 shadow-xl my-6">
          <div className="w-16 h-16 rounded-2xl bg-slate-800/80 border border-slate-700/60 flex items-center justify-center mx-auto text-slate-400 shadow-inner">
            <ShieldCheck className="w-8 h-8 text-amber-400" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-white">Kayıtlı Mağaza Projesi Bulunamadı</h3>
            <p className="text-sm text-slate-400">
              Stage-gate idari onaylarını yönetebilmek için sisteme en az bir franchise mağaza projesi eklenmiş olmalıdır.
            </p>
          </div>
          <Link
            href="/franchise/rollout"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold shadow-lg shadow-amber-500/20 transition-all hover:scale-105"
          >
            <span>Rollout Sayfasına Git</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((p) => {
            const gates = p.stageGates || []
            const totalGates = gates.length || 5
            const approvedGates = gates.filter((g: any) => g.status === "ONAYLANDI" || g.isApproved).length
            const percent = totalGates > 0 ? Math.round((approvedGates / totalGates) * 100) : 0

            return (
              <div
                key={p.id}
                className="bg-slate-900/80 border border-slate-800 hover:border-amber-700/60 rounded-xl p-5 transition-all hover:shadow-xl space-y-4 flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider px-2 py-0.5 rounded bg-amber-950/60 border border-amber-800/40">
                        {p.status || "KIRALAMA"}
                      </span>
                      <h3 className="text-base font-bold text-white mt-1.5 line-clamp-1">
                        {p.name || p.title}
                      </h3>
                      <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-500" />
                        <span>{p.city}</span>
                        {p.budget && (
                          <span className="text-slate-500">• {p.budget.toLocaleString("tr-TR")} ₺</span>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={() => setSelectedProject(p)}
                      className="p-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-400 hover:text-amber-400 hover:border-amber-800/50 transition-colors"
                      title="Kilitleri Yönet"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Approval progress */}
                  <div className="space-y-1.5 pt-2 border-t border-slate-800/80">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400 flex items-center gap-1.5">
                        <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                        İdari Onay: {approvedGates} / {totalGates} Faz
                      </span>
                      <span className="font-semibold text-white">%{percent}</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-950 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-amber-500 rounded-full transition-all duration-300"
                        style={{ width: `${percent}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Stage-Gate Badges List */}
                  <div className="space-y-1.5 pt-1">
                    {gates.map((g: any) => {
                      const isAppr = g.status === "ONAYLANDI" || g.isApproved
                      return (
                        <div
                          key={g.id}
                          className="flex items-center justify-between p-2 rounded-lg bg-slate-950 border border-slate-800/80 text-xs"
                        >
                          <span className="text-slate-300 font-medium truncate max-w-[200px]">
                            {g.name || g.stageName}
                          </span>
                          <button
                            onClick={() => handleToggleGate(g.id, g.status || (g.isApproved ? "ONAYLANDI" : "BEKLIYOR"))}
                            disabled={updatingGateId === g.id}
                            className={`flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold transition-colors ${
                              isAppr
                                ? "bg-emerald-950/60 text-emerald-300 border border-emerald-800 hover:bg-emerald-900/60"
                                : "bg-amber-950/60 text-amber-300 border border-amber-800 hover:bg-amber-900/60"
                            }`}
                          >
                            {updatingGateId === g.id ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : isAppr ? (
                              <>
                                <Check className="w-3 h-3" />
                                <span>Onaylı</span>
                              </>
                            ) : (
                              <>
                                <Clock className="w-3 h-3" />
                                <span>Bekliyor</span>
                              </>
                            )}
                          </button>
                        </div>
                      )
                    })}
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-800">
                  <Link
                    href={`/franchise/stage-gates/${p.id}`}
                    className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors"
                  >
                    <span>Detaylı Kilit Raporu</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Selected Project Full Stage Gate Modal */}
      {selectedProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 space-y-5 shadow-2xl">
            <div className="flex items-start justify-between border-b border-slate-800 pb-3">
              <div>
                <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider">
                  Stage-Gate İdari Kilitleri
                </span>
                <h3 className="text-base font-bold text-white mt-1">
                  {selectedProject.name || selectedProject.title}
                </h3>
                <p className="text-xs text-slate-400">{selectedProject.city}</p>
              </div>
              <button
                onClick={() => setSelectedProject(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2">
              {(selectedProject.stageGates || []).map((g: any, index: number) => {
                const isAppr = g.status === "ONAYLANDI" || g.isApproved
                return (
                  <div
                    key={g.id}
                    className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold ${
                          isAppr ? "bg-emerald-500 text-white" : "bg-slate-800 text-slate-400"
                        }`}
                      >
                        {index + 1}
                      </div>
                      <div>
                        <div className="font-semibold text-white">{g.name || g.stageName}</div>
                        <div className="text-[10px] text-slate-400">
                          {isAppr ? "Onaylandı" : "İdari Onay Bekleniyor"}
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={async () => {
                        await handleToggleGate(g.id, g.status || (g.isApproved ? "ONAYLANDI" : "BEKLIYOR"))
                        // update selectedProject local state
                        setSelectedProject((prev: any) => ({
                          ...prev,
                          stageGates: prev.stageGates.map((sg: any) =>
                            sg.id === g.id
                              ? {
                                  ...sg,
                                  status: isAppr ? "BEKLIYOR" : "ONAYLANDI",
                                  isApproved: !isAppr,
                                }
                              : sg
                          ),
                        }))
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                        isAppr
                          ? "bg-emerald-950/60 text-emerald-300 border border-emerald-800"
                          : "bg-amber-950/60 text-amber-300 border border-amber-800"
                      }`}
                    >
                      {isAppr ? "Onayı Kaldır" : "Onayla"}
                    </button>
                  </div>
                )
              })}
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedProject(null)}
                className="px-4 py-2 text-xs bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-semibold"
              >
                Kapat
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
