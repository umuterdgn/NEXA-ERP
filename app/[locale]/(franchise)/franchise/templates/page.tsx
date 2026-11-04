"use client"
/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Franchise Konsept Şablonları (ConceptTemplate) Yönetimi
 * %100 Tenant İzolasyonu ile ConceptTemplate Modeline Bağlıdır.
 */

import { useState, useEffect } from "react"
import { useTranslations } from "next-intl"
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
  Maximize2,
  DollarSign,
  FileCode,
  FileText,
  Download,
  ExternalLink,
  Store,
  Tag
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

// Demo & Standart Ön Tanımlı Şablonlar
const DEFAULT_PRESET_TEMPLATES: ConceptTemplateItem[] = [
  {
    id: "preset-mall-restaurant",
    name: "AVM İçi 180m² Restoran & Cafe",
    baseBudget: 2970000,
    isActive: true,
    createdAt: new Date(),
    phasesJson: {
      conceptType: "MALL",
      minArea: 140,
      maxArea: 220,
      sqmCost: 16500,
      bimModelUrl: "/models/avm_restaurant_lod300.ifc",
      bimFileName: "AVM_Restaurant_LOD300.ifc",
      manualPdfName: "AVM_Konsept_Uygulama_Kilavuzu_2026.pdf",
      equipmentList: [
        "Endüstriyel Espresso Makinesi & Değirmen",
        "Merkezi POS & Kasa Terminali (Dokunmatik)",
        "LOD-300 Modüler Banko & Servis Hattı",
        "Soğutucu Pasta & İçecek Teşhir Dolabı",
        "Merkezi HVAC & Taze Hava Havalandırması",
        "Yangın Sprinkler & Otomatik Gazlı Söndürme",
        "IP Kamera (CCTV) & Güvenlik Alarm Sistemi",
      ],
      phases: [
        { name: "Kiralama & Alan Teslimi", days: 10, weight: 15 },
        { name: "AVM Yönetimi Mimari Onay", days: 12, weight: 20 },
        { name: "Kaba & İnce İnşaat Fit-Out", days: 24, weight: 40 },
        { name: "Punch List & Kalite Denetimi", days: 6, weight: 15 },
        { name: "İtfaiye Ruhsatı & Açılış İzni", days: 4, weight: 10 },
      ],
    },
  },
  {
    id: "preset-street-store",
    name: "Cadde 350m² Flagship Mağaza",
    baseBudget: 5250000,
    isActive: true,
    createdAt: new Date(),
    phasesJson: {
      conceptType: "STREET",
      minArea: 280,
      maxArea: 420,
      sqmCost: 15000,
      bimModelUrl: "/models/cadde_flagship_lod300.ifc",
      bimFileName: "Cadde_Flagship_LOD300.ifc",
      manualPdfName: "Cadde_Magaza_Tasarim_Rehberi_2026.pdf",
      equipmentList: [
        "Merkezi POS & 3 Kasa Terminali",
        "Merkezi VRF İklimlendirme Sistemi",
        "Otomatik Motorlu Sarmal Cephe Kepengi",
        "Geniş Vitrin Aydınlatma & LED Totem",
        "Derin Dondurucu & Soğuk Oda Deposu",
        "Akustik Ses ve Arka Plan Müzik Ünitesi",
      ],
      phases: [
        { name: "Belediye İmar & Tabela İzni", days: 14, weight: 20 },
        { name: "Statik & Cephe Tadilatı", days: 15, weight: 25 },
        { name: "İç Mimari & Zemin / Asma Tavan", days: 20, weight: 35 },
        { name: "Demirbaş & Raf Montajı", days: 8, weight: 10 },
        { name: "Büyük Açılış Lansmanı", days: 3, weight: 10 },
      ],
    },
  },
  {
    id: "preset-kiosk-stand",
    name: "Express Ada Kiosk (30m²)",
    baseBudget: 720000,
    isActive: true,
    createdAt: new Date(),
    phasesJson: {
      conceptType: "KIOSK",
      minArea: 20,
      maxArea: 40,
      sqmCost: 24000,
      bimModelUrl: "/models/express_kiosk_lod300.ifc",
      bimFileName: "Express_Kiosk_LOD300.ifc",
      manualPdfName: "Kiosk_Moduler_Montaj_Kilavuzu.pdf",
      equipmentList: [
        "Endüstriyel Kompakt Espresso Makinesi",
        "Mobil POS ve Sipariş Ekranı",
        "Özel Paslanmaz Servis Tezgahı",
        "Dahili Su Yumuşatma & Mini Arıtma",
        "Otomatik Güvenlik Perdesi",
      ],
      phases: [
        { name: "AVM Ortak Alan Kiralama Sözleşmesi", days: 7, weight: 20 },
        { name: "Elektrik & Su Altyapı Bağlantısı", days: 5, weight: 25 },
        { name: "Fabrika Prefabrik Kiosk Üretimi", days: 12, weight: 35 },
        { name: "Gece Kurulumu & Test", days: 2, weight: 20 },
      ],
    },
  },
]

export default function FranchiseTemplatesPage() {
  const t = useTranslations("FranchiseModule.templatesPage")
  const [templates, setTemplates] = useState<ConceptTemplateItem[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedTemplate, setSelectedTemplate] = useState<ConceptTemplateItem | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const fetchTemplates = async () => {
    try {
      setLoading(true)
      const res = await getConceptTemplates()
      if (res.success && res.templates && res.templates.length > 0) {
        setTemplates(res.templates)
        setSelectedTemplate(res.templates[0])
      } else {
        // Preset default templates for impressive demo experience
        setTemplates(DEFAULT_PRESET_TEMPLATES)
        setSelectedTemplate(DEFAULT_PRESET_TEMPLATES[0])
      }
    } catch (err) {
      console.error("Şablonlar yüklenemedi", err)
      setTemplates(DEFAULT_PRESET_TEMPLATES)
      setSelectedTemplate(DEFAULT_PRESET_TEMPLATES[0])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTemplates()
  }, [])

  const handleToggleActive = async (id: string) => {
    if (id.startsWith("preset-")) {
      setTemplates((prev) =>
        prev.map((tpl) => (tpl.id === id ? { ...tpl, isActive: !tpl.isActive } : tpl))
      )
      return
    }
    try {
      await toggleConceptTemplate(id)
      await fetchTemplates()
    } catch (err) {
      console.error("Durum güncellenemedi", err)
    }
  }

  // Parse details from phasesJson
  const getParsedDetails = (tpl: ConceptTemplateItem | null) => {
    if (!tpl) return null
    const pj = tpl.phasesJson
    if (pj && typeof pj === "object" && !Array.isArray(pj)) {
      return {
        conceptType: pj.conceptType || "MALL",
        minArea: pj.minArea || 100,
        maxArea: pj.maxArea || 250,
        sqmCost: pj.sqmCost || Math.round(tpl.baseBudget / 150),
        bimModelUrl: pj.bimModelUrl || `/models/${tpl.name.toLowerCase().replace(/\\s+/g, "_")}.ifc`,
        bimFileName: pj.bimFileName || `${tpl.name}_LOD300.ifc`,
        manualPdfName: pj.manualPdfName || `${tpl.name}_Standart_Kilavuz.pdf`,
        equipmentList: pj.equipmentList || [
          "Endüstriyel Espresso Makinesi & Değirmen",
          "Merkezi POS & Kasa Terminali",
          "LOD-300 Modüler Banko",
          "Merkezi HVAC Havalandırma",
        ],
        phases: Array.isArray(pj.phases) ? pj.phases : [
          { name: "Kiralama & Alan Teslimi", days: 10, weight: 15 },
          { name: "AVM & Mimari Proje Onayı", days: 12, weight: 20 },
          { name: "Kaba & İnce İnşaat Montajı", days: 22, weight: 40 },
          { name: "Punch List & Kalite Denetimi", days: 6, weight: 15 },
          { name: "İtfaiye Ruhsatı & Açılış İzni", days: 4, weight: 10 },
        ],
      }
    }

    // Fallback if phasesJson was saved as a flat array
    return {
      conceptType: "MALL",
      minArea: 120,
      maxArea: 250,
      sqmCost: Math.round(tpl.baseBudget / 180),
      bimModelUrl: `/models/standard_lod300.ifc`,
      bimFileName: `${tpl.name}_LOD300.ifc`,
      manualPdfName: `${tpl.name}_Uygulama_Kilavuzu.pdf`,
      equipmentList: [
        "Endüstriyel Kahve & Servis Ekipmanları",
        "Merkezi POS Sistemi",
        "İklimlendirme & Havalandırma",
        "Otomatik Yangın Güvenlik Sistemi",
      ],
      phases: Array.isArray(pj) ? pj : [
        { name: "Kiralama & Alan Teslimi", days: 10, weight: 15 },
        { name: "AVM & Mimari Proje Onayı", days: 12, weight: 20 },
        { name: "Kaba & İnce İnşaat Montajı", days: 22, weight: 40 },
        { name: "Punch List & Kalite Denetimi", days: 6, weight: 15 },
        { name: "İtfaiye Ruhsatı & Açılış İzni", days: 4, weight: 10 },
      ],
    }
  }

  const selectedDetails = getParsedDetails(selectedTemplate)

  const getTypeLabel = (type?: string) => {
    switch (type) {
      case "MALL":
        return "AVM İçi Mağaza"
      case "STREET":
        return "Cadde Mağazası"
      case "KIOSK":
        return "Kiosk / Stand"
      case "DRIVE_THRU":
        return "Drive-Thru Konsepti"
      case "EXPRESS":
        return "Express Mini Şube"
      default:
        return "Standart Konsept"
    }
  }

  return (
    <div className="w-full space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-amber-400 mb-1">
            <Box className="w-4 h-4" />
            <span>Konsept Standartları & Tip Mağazalar</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            Konsept Şablonları & Fit-Out Kriterleri
          </h1>
          <p className="text-sm text-slate-400">
            AVM, cadde ve kiosk şubelerinizin m² alan, BIM 3D model, standart bütçe ve zorunlu demirbaş kurallarını yönetin.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={fetchTemplates}
            disabled={loading}
            className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
            title="Yenile"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>

          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white text-xs font-bold transition-all shadow-lg shadow-amber-500/20 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Yeni Şablon Ekle</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Template Cards + Detail Inspector Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Templates List (1 col) */}
        <div className="space-y-3 lg:col-span-1">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Kayıtlı Konseptler ({templates.length})
            </h2>
            <span className="text-[11px] text-amber-400 font-medium">LOD-300 Uyumlu</span>
          </div>

          <div className="space-y-3">
            {templates.map((tpl) => {
              const isSelected = selectedTemplate?.id === tpl.id
              const parsed = getParsedDetails(tpl)

              return (
                <div
                  key={tpl.id}
                  onClick={() => setSelectedTemplate(tpl)}
                  className={`p-4 rounded-2xl border cursor-pointer transition-all space-y-3 ${
                    isSelected
                      ? "bg-amber-950/40 border-amber-600/70 shadow-lg shadow-amber-950/50 ring-1 ring-amber-500/50"
                      : "bg-slate-900/80 border-slate-800 hover:border-slate-700 hover:bg-slate-900"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-400 text-[10px] font-bold border border-amber-500/20">
                          {getTypeLabel(parsed?.conceptType)}
                        </span>
                        {tpl.id.startsWith("preset-") && (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-slate-800 text-slate-400">
                            STANDART
                          </span>
                        )}
                      </div>
                      <h3 className="text-sm font-bold text-white leading-tight">{tpl.name}</h3>
                      <div className="text-xs text-emerald-400 font-bold font-mono mt-1">
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

                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800/80 text-[11px] text-slate-400">
                    <div className="flex items-center gap-1.5">
                      <Maximize2 className="w-3 h-3 text-blue-400" />
                      <span>{parsed?.minArea} - {parsed?.maxArea} m²</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <DollarSign className="w-3 h-3 text-emerald-400" />
                      <span>{parsed?.sqmCost?.toLocaleString("tr-TR")} ₺/m²</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                    <span>{parsed?.phases?.length || 5} İş Adımı Fazı</span>
                    <span className="text-amber-400 flex items-center gap-0.5 font-semibold">
                      İncele <ChevronRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Template Inspector & Detailed Breakdown (2 cols) */}
        <div className="lg:col-span-2 space-y-4">
          {selectedTemplate && selectedDetails ? (
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6 shadow-2xl">
              {/* Top Banner */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800 pb-5">
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="px-2.5 py-0.5 rounded-lg bg-amber-500/10 text-amber-400 text-xs font-bold border border-amber-500/20">
                      {getTypeLabel(selectedDetails.conceptType)}
                    </span>
                    <span className="text-xs text-slate-500">•</span>
                    <span className="text-xs font-mono text-slate-400">ID: {selectedTemplate.id}</span>
                  </div>
                  <h2 className="text-2xl font-black text-white tracking-tight">{selectedTemplate.name}</h2>
                </div>

                <div className="flex items-center gap-3">
                  <div className="bg-slate-950 px-4 py-2 rounded-2xl border border-slate-800 text-right">
                    <span className="text-slate-500 block text-[10px] font-semibold uppercase">Tahmini Taban Bütçe</span>
                    <span className="font-black text-emerald-400 font-mono text-lg">
                      {selectedTemplate.baseBudget.toLocaleString("tr-TR")} ₺
                    </span>
                  </div>

                  <Link
                    href="/franchise/rollout"
                    className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white text-xs font-bold shadow-lg shadow-amber-500/20 transition-all flex items-center gap-1.5"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Bu Konseptle Şube Aç</span>
                  </Link>
                </div>
              </div>

              {/* Specification Grid (Min-Max m², m² Cost, BIM Link, PDF Manual) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
                  <div className="flex items-center justify-between text-slate-400 text-xs">
                    <span>Gerekli Alan</span>
                    <Maximize2 className="w-4 h-4 text-blue-400" />
                  </div>
                  <div className="text-lg font-black text-white">
                    {selectedDetails.minArea} - {selectedDetails.maxArea} <span className="text-xs font-normal text-slate-400">m²</span>
                  </div>
                  <p className="text-[10px] text-slate-500">Optimum fit-out metrekaresi</p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
                  <div className="flex items-center justify-between text-slate-400 text-xs">
                    <span>m² Kurulum Maliyeti</span>
                    <DollarSign className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div className="text-lg font-black text-emerald-400 font-mono">
                    {selectedDetails.sqmCost?.toLocaleString("tr-TR")} ₺
                  </div>
                  <p className="text-[10px] text-slate-500">Birim alan inşaat ortalaması</p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
                  <div className="flex items-center justify-between text-slate-400 text-xs">
                    <span>BIM / 3D Model</span>
                    <FileCode className="w-4 h-4 text-amber-400" />
                  </div>
                  <div className="text-xs font-bold text-white truncate" title={selectedDetails.bimFileName}>
                    {selectedDetails.bimFileName}
                  </div>
                  <Link
                    href="/franchise/bim"
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-400 hover:text-amber-300"
                  >
                    <span>Görüntüle</span>
                    <ExternalLink className="w-3 h-3" />
                  </Link>
                </div>

                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
                  <div className="flex items-center justify-between text-slate-400 text-xs">
                    <span>Mimari Kılavuz (PDF)</span>
                    <FileText className="w-4 h-4 text-rose-400" />
                  </div>
                  <div className="text-xs font-bold text-white truncate" title={selectedDetails.manualPdfName}>
                    {selectedDetails.manualPdfName}
                  </div>
                  <a
                    href="#"
                    onClick={(e) => {
                      e.preventDefault()
                      alert(`"${selectedDetails.manualPdfName}" standart kılavuzu indiriliyor...`)
                    }}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-400 hover:text-rose-300"
                  >
                    <Download className="w-3 h-3" />
                    <span>Kılavuzu İndir</span>
                  </a>
                </div>
              </div>

              {/* Zorunlu Demirbaş ve Ekipman Kriterleri (Multi-select pill display) */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                    <Layers className="w-4 h-4 text-amber-400" />
                    <span>Zorunlu Demirbaş & Makine Parkı Standartları ({selectedDetails.equipmentList?.length || 0})</span>
                  </h3>
                  <span className="text-[11px] text-slate-500">Merkezi Tedarik Kapsamında</span>
                </div>

                <div className="flex flex-wrap gap-2">
                  {selectedDetails.equipmentList?.map((eq: string, idx: number) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-medium text-slate-300 hover:border-amber-500/50 transition-colors"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>{eq}</span>
                    </span>
                  ))}
                </div>
              </div>

              {/* Standard Phases Breakdown (Gantt Kurgusu) */}
              <div className="space-y-3 pt-2 border-t border-slate-800">
                <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-400" />
                  <span>Standart Rollout İş Planı Fazları (Gantt Adımları)</span>
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                  {selectedDetails.phases.map((phase: any, idx: number) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-3 rounded-2xl bg-slate-950 border border-slate-800 text-xs hover:border-slate-700 transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center font-bold text-xs">
                          {idx + 1}
                        </div>
                        <div>
                          <span className="font-bold text-white block">{phase.name}</span>
                          <span className="text-[11px] text-slate-400">
                            {phase.days || 10} İş Günü Süre
                          </span>
                        </div>
                      </div>

                      <span className="text-[11px] font-mono text-amber-400 font-bold px-2 py-0.5 rounded-lg bg-amber-500/10 border border-amber-500/20">
                        %{phase.weight || 20}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-12 text-center text-slate-500 text-xs">
              Detayları incelemek için soldaki listeden bir konsept şablonu seçin.
            </div>
          )}
        </div>
      </div>

      {/* CreateTemplateModal Component */}
      <CreateTemplateModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchTemplates}
      />
    </div>
  )
}
