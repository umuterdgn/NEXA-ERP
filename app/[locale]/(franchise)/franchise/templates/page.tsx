"use client"
/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Franchise Konsept Şablonları (ConceptTemplate) Yönetimi
 * %100 Tenant İzolasyonu ile ConceptTemplate Modeline Bağlıdır.
 */

import { useState, useEffect } from "react"
import Link from "next/link"
import {
  Box,
  Plus,
  RefreshCw,
  Clock,
  Layers,
  Calculator,
  ChevronRight,
  Building2,
  Calendar,
  CheckCircle2,
  ArrowRight,
  FileSpreadsheet,
  X,
  Loader2,
  Coins,
  Check,
  Sparkles,
} from "lucide-react"
import {
  getConceptTemplates,
  toggleConceptTemplate,
} from "@/app/actions/franchise"
import CreateTemplateModal from "@/components/franchise/CreateTemplateModal"

interface ConceptTemplateItem {
  id: string
  name: string
  baseBudget: number
  phasesJson: any
  isActive: boolean
  createdAt: string | Date
}

export default function FranchiseTemplatesPage() {
  const [templates, setTemplates] = useState<ConceptTemplateItem[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedTemplate, setSelectedTemplate] = useState<ConceptTemplateItem | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const fetchTemplates = async () => {
    try {
      setLoading(true)
      const res = await getConceptTemplates()
      if (res.success && res.templates) {
        setTemplates(res.templates)
        if (res.templates.length > 0 && !selectedTemplate) {
          setSelectedTemplate(res.templates[0])
        }
      }
    } catch (err) {
      console.error("Şablonlar yüklenemedi", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTemplates()
  }, [])



  const handleToggleActive = async (id: string) => {
    try {
      await toggleConceptTemplate(id)
      await fetchTemplates()
    } catch (err) {
      console.error("Durum güncellenemedi", err)
    }
  }

  return (
    <div className="w-full space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-amber-400 mb-1">
            <Box className="w-4 h-4" />
            <span>Tip Proje ve Konsept Standartizasyonu</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Konsept Şablonları (Tip Mağaza)
          </h1>
          <p className="text-sm text-slate-400">
            Farklı metrekare ve lokasyonlar için standart BoQ (metraj), taban bütçe ve iş planı şablonlarını yönetin.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={fetchTemplates}
            disabled={loading}
            className="p-2 rounded-lg bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
            title="Yenile"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>

          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold transition-all shadow-md shadow-amber-600/20"
          >
            <Plus className="w-4 h-4" />
            <span>Yeni Şablon Tanımla</span>
          </button>
        </div>
      </div>

      {/* Empty State */}
      {!loading && templates.length === 0 ? (
        <div className="bg-slate-900/60 border border-dashed border-slate-800 rounded-2xl p-12 text-center max-w-xl mx-auto space-y-4 shadow-xl my-6">
          <div className="w-16 h-16 rounded-2xl bg-slate-800/80 border border-slate-700/60 flex items-center justify-center mx-auto text-slate-400 shadow-inner">
            <Box className="w-8 h-8 text-amber-400" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-white">Henüz Konsept Şablonu Tanımlanmadı</h3>
            <p className="text-sm text-slate-400">
              Mağazalarınız için standart taban bütçe ve aşama adımlarını oluşturarak açılış süreçlerinizi hızlandırın.
            </p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold shadow-lg shadow-amber-500/20 transition-all hover:scale-105"
          >
            <Plus className="w-4 h-4" />
            <span>İlk Şablonu Oluştur</span>
          </button>
        </div>
      ) : (
        /* Main Grid: Template Cards + Detail Panel */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Templates List (1 col) */}
          <div className="space-y-3 lg:col-span-1">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Kayıtlı Konseptler ({templates.length})
            </h2>

            <div className="space-y-2.5">
              {templates.map((tpl) => {
                const isSelected = selectedTemplate?.id === tpl.id
                return (
                  <div
                    key={tpl.id}
                    onClick={() => setSelectedTemplate(tpl)}
                    className={`p-4 rounded-xl border cursor-pointer transition-all space-y-3 ${
                      isSelected
                        ? "bg-amber-950/40 border-amber-600/70 shadow-md ring-1 ring-amber-500/50"
                        : "bg-slate-900/80 border-slate-800 hover:border-slate-700"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="text-sm font-bold text-white">{tpl.name}</h3>
                        <div className="text-xs text-emerald-400 font-semibold font-mono mt-0.5">
                          {tpl.baseBudget.toLocaleString("tr-TR")} ₺ Taban Bütçe
                        </div>
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleToggleActive(tpl.id)
                        }}
                        className={`px-2 py-0.5 rounded text-[10px] font-bold border transition-colors ${
                          tpl.isActive
                            ? "bg-emerald-950/60 text-emerald-300 border-emerald-800"
                            : "bg-slate-800 text-slate-400 border-slate-700"
                        }`}
                      >
                        {tpl.isActive ? "Aktif" : "Pasif"}
                      </button>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-800/80">
                      <span>Standart İş Adımı: {Array.isArray(tpl.phasesJson) ? tpl.phasesJson.length : 5} Faz</span>
                      <span className="text-amber-400 flex items-center gap-0.5 font-medium">
                        İncele <ChevronRight className="w-3 h-3" />
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Template Inspector & Gantt Breakdown (2 cols) */}
          <div className="lg:col-span-2 space-y-4">
            {selectedTemplate ? (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6 shadow-xl">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-800 pb-4">
                  <div>
                    <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">
                      Seçili Tip Konsept Detayı
                    </span>
                    <h2 className="text-xl font-bold text-white mt-1">{selectedTemplate.name}</h2>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="bg-slate-950 px-3.5 py-1.5 rounded-xl border border-slate-800 text-xs">
                      <span className="text-slate-400 block text-[10px]">Taban Kurulum Bütçesi</span>
                      <span className="font-bold text-emerald-400 font-mono text-sm">
                        {selectedTemplate.baseBudget.toLocaleString("tr-TR")} ₺
                      </span>
                    </div>

                    <Link
                      href="/franchise/rollout"
                      className="px-3 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold shadow-md transition-colors flex items-center gap-1.5"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Bu Konseptle Şube Aç</span>
                    </Link>
                  </div>
                </div>

                {/* Standard Phases Breakdown */}
                <div className="space-y-3">
                  <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                    <Layers className="w-4 h-4 text-amber-400" />
                    <span>Standart Rollout İş Planı Fazları (Gantt Kurgusu)</span>
                  </h3>

                  <div className="space-y-2">
                    {(Array.isArray(selectedTemplate.phasesJson)
                      ? selectedTemplate.phasesJson
                      : []
                    ).map((phase: any, idx: number) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-6 h-6 rounded-full bg-slate-800 text-amber-400 flex items-center justify-center font-bold text-[11px]">
                            {idx + 1}
                          </div>
                          <div>
                            <span className="font-semibold text-white">{phase.name}</span>
                            <div className="text-[10px] text-slate-500">
                              Tahmini Süre: {phase.days || 10} İş Günü
                            </div>
                          </div>
                        </div>

                        <span className="text-[11px] font-mono text-slate-400 px-2 py-0.5 rounded bg-slate-900 border border-slate-800">
                          Ağırlık: %{phase.weight || 20}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center text-slate-500 text-xs">
                Detayları incelemek için soldaki listeden bir konsept şablonu seçin.
              </div>
            )}
          </div>
        </div>
      )}

      {/* CreateTemplateModal Component */}
      <CreateTemplateModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchTemplates}
      />
    </div>
  )
}
