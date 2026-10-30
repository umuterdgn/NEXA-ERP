"use client"
/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Franchise Tip Mağaza / Konsept Şablonları Yönetimi
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
} from "lucide-react"

interface StoreTemplate {
  id: string
  name: string
  estimatedDays: number
  defaultBoQ: any
  defaultTasks: any
  createdAt: string
  _count?: {
    projects: number
  }
}

export default function FranchiseTemplatesPage() {
  const [templates, setTemplates] = useState<StoreTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedTemplate, setSelectedTemplate] = useState<StoreTemplate | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [newTemplate, setNewTemplate] = useState({
    name: "",
    estimatedDays: 45,
  })

  const fetchTemplates = async () => {
    try {
      setLoading(true)
      const res = await fetch("/api/franchise/templates")
      const data = await res.json()
      if (data.templates) {
        setTemplates(data.templates)
        if (data.templates.length > 0 && !selectedTemplate) {
          setSelectedTemplate(data.templates[0])
        }
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTemplates()
  }, [])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const res = await fetch("/api/franchise/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...newTemplate,
          defaultBoQ: [
            { code: "ELK-01", description: "3 Fazlı Pano & Aydınlatma Rayları", unit: "Set", quantity: 1, unitPrice: 75000 },
            { code: "MIM-01", description: "Granit Seramik Zemin Kaplaması", unit: "m2", quantity: 100, unitPrice: 1400 },
            { code: "MOB-01", description: "Kurumsal Kasa Bankosu & Arka Görsel", unit: "Adet", quantity: 1, unitPrice: 85000 },
          ],
          defaultTasks: [
            { name: "Kira Kontratı & AVM Proje Onayı", durationDays: 10 },
            { name: "Şantiye Kurulumu & Kaba Altyapı", durationDays: 12 },
            { name: "Elektrik & Havalandırma İmalatları", durationDays: 15 },
            { name: "OFCI Mağaza Mobilya & Kasa Montajı", durationDays: 5 },
            { name: "Punch List & Açılış Denetimi", durationDays: 3 },
          ],
        }),
      })

      if (res.ok) {
        setIsModalOpen(false)
        setNewTemplate({ name: "", estimatedDays: 45 })
        fetchTemplates()
      }
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <div className="w-full space-y-6 pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-blue-400 mb-1">
            <Box className="w-4 h-4" />
            <span>Tip Proje ve Standartizasyon</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Konsept Şablonları (Tip Mağaza)
          </h1>
          <p className="text-sm text-slate-400">
            Farklı metrekare ve lokasyonlar için standart BoQ (metraj) ve Gantt iş planı şablonlarını yönetin.
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
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium transition-colors shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Yeni Şablon Tanımla</span>
          </button>
        </div>
      </div>

      {/* Empty State */}
      {!loading && templates.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center max-w-xl mx-auto space-y-4 shadow-xl">
          <div className="w-16 h-16 rounded-2xl bg-slate-800/80 border border-slate-700/60 flex items-center justify-center mx-auto text-slate-400 shadow-inner">
            <Box className="w-8 h-8 text-blue-400" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-white">Henüz Konsept Şablonu Tanımlanmadı</h3>
            <p className="text-sm text-slate-400">
              Mağazalarınız için standart BoQ (metraj) ve iş planı şablonlarını oluşturarak rollout süreçlerinizi hızlandırın.
            </p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-lg shadow-blue-500/20 transition-all hover:scale-105"
          >
            <Plus className="w-4 h-4" />
            <span>İlk Şablonu Oluştur</span>
          </button>
        </div>
      ) : (
        /* Main Grid: Template Cards + Detail */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Templates List */}
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
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${
                    isSelected
                      ? "bg-blue-950/40 border-blue-600/70 shadow-md"
                      : "bg-slate-900/80 border-slate-800 hover:border-slate-700"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-white">{tpl.name}</h3>
                      <div className="flex items-center gap-2 text-xs text-slate-400 mt-1">
                        <span className="flex items-center gap-1 text-blue-400 font-medium">
                          <Clock className="w-3.5 h-3.5" />
                          {tpl.estimatedDays} Gün Kurulum
                        </span>
                        <span>•</span>
                        <span>{tpl._count?.projects || 0} Aktif Mağaza</span>
                      </div>
                    </div>
                    <ChevronRight
                      className={`w-4 h-4 mt-1 transition-transform ${
                        isSelected ? "text-blue-400 translate-x-1" : "text-slate-600"
                      }`}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Selected Template BoQ and Tasks Detail */}
        <div className="lg:col-span-2 space-y-4">
          {selectedTemplate ? (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-5">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div>
                  <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider">
                    Konsept Detayı
                  </span>
                  <h2 className="text-lg font-bold text-white mt-0.5">{selectedTemplate.name}</h2>
                  <div className="flex items-center gap-3 text-xs text-slate-400 mt-1">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-blue-400" />
                      Hedef Süre: {selectedTemplate.estimatedDays} Gün
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Building2 className="w-3.5 h-3.5 text-slate-500" />
                      Bağlı Mağazalar: {selectedTemplate._count?.projects || 0} Adet
                    </span>
                  </div>
                </div>

                <Link
                  href="/franchise/rollout"
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 transition-colors flex items-center gap-1"
                >
                  <span>Rollout'ta Gör</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              {/* BoQ Items Table */}
              <div className="space-y-2">
                <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Calculator className="w-4 h-4 text-emerald-400" />
                  <span>Standart Keşif ve Malzeme Listesi (BoQ)</span>
                </h3>

                <div className="bg-slate-950 rounded-lg border border-slate-800 overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-900/80 text-slate-400 border-b border-slate-800">
                      <tr>
                        <th className="p-2.5">Poz Kodu</th>
                        <th className="p-2.5">Malzeme / İmalat Tanımı</th>
                        <th className="p-2.5 text-right">Miktar</th>
                        <th className="p-2.5">Birim</th>
                        <th className="p-2.5 text-right">Birim Fiyat</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 text-slate-300">
                      {(Array.isArray(selectedTemplate.defaultBoQ)
                        ? selectedTemplate.defaultBoQ
                        : []
                      ).map((item: any, i: number) => (
                        <tr key={i} className="hover:bg-slate-900/40">
                          <td className="p-2.5 font-mono text-[11px] text-blue-400">{item.code}</td>
                          <td className="p-2.5 font-medium">{item.description}</td>
                          <td className="p-2.5 text-right font-semibold">{item.quantity}</td>
                          <td className="p-2.5 text-slate-400">{item.unit}</td>
                          <td className="p-2.5 text-right font-mono text-emerald-400">
                            {item.unitPrice ? `${Number(item.unitPrice).toLocaleString("tr-TR")} ₺` : "-"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Default Tasks Gantt Summary */}
              <div className="space-y-2 pt-2">
                <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-indigo-400" />
                  <span>Standart Kurulum İş Planı (Gantt Fazları)</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {(Array.isArray(selectedTemplate.defaultTasks)
                    ? selectedTemplate.defaultTasks
                    : []
                  ).map((task: any, i: number) => (
                    <div
                      key={i}
                      className="bg-slate-950 border border-slate-800 rounded-lg p-3 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center font-bold text-[10px] text-blue-400">
                          {i + 1}
                        </span>
                        <span className="font-medium text-white">{task.name}</span>
                      </div>
                      <span className="font-mono text-xs font-bold text-indigo-400 whitespace-nowrap">
                        {task.durationDays} Gün
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-10 text-center text-slate-500 text-xs">
              Lütfen sol menüden incelemek istediğiniz bir konsept seçin.
            </div>
          )}
        </div>
      </div>
    )}

      {/* New Template Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Box className="w-4 h-4 text-blue-400" />
                <span>Yeni Konsept Şablonu Oluştur</span>
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-3.5">
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-300">Konsept Adı *</label>
                <input
                  type="text"
                  value={newTemplate.name}
                  onChange={(e) => setNewTemplate({ ...newTemplate, name: e.target.value })}
                  placeholder="Örn: Cadde Kiosk - 50m2"
                  className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-200 placeholder-slate-600 focus:outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-300">
                  Tahmini Standart Kurulum Süresi (Gün) *
                </label>
                <input
                  type="number"
                  value={newTemplate.estimatedDays}
                  onChange={(e) =>
                    setNewTemplate({ ...newTemplate, estimatedDays: Number(e.target.value) })
                  }
                  className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-blue-500"
                  required
                />
              </div>

              <p className="text-[11px] text-slate-400 pt-1">
                Şablon oluşturulduktan sonra standart BoQ ve Gantt fazları otomatik olarak atanacaktır.
              </p>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3.5 py-2 text-xs rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium"
                >
                  Oluştur
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
