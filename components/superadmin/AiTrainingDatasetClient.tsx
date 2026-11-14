"use client"
/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Super Admin - AI Model Eğitimi (Dataset) & Local LLM Fine-Tuning JSONL Exporter
 */

import React, { useEffect, useState } from "react"
import {
  exportTrainingData,
  type ExportTrainingDataResult,
} from "@/actions/super-admin/ai-training"
import {
  BrainCircuit,
  Download,
  Database,
  CheckCircle2,
  Terminal,
  Layers,
  Cpu,
  FileCode2,
  RefreshCw,
  AlertTriangle,
  Copy,
  Check,
} from "lucide-react"

export default function AiTrainingDatasetClient({
  initialData,
}: {
  initialData: ExportTrainingDataResult
}) {
  const [dataset, setDataset] = useState<ExportTrainingDataResult>(initialData)
  const [filter, setFilter] = useState<
    "ALL" | "ONAYLI_BOQ_METRAJ" | "MIMARI_STATIK_CAKISMA"
  >("ALL")
  const [isExporting, setIsExporting] = useState(false)
  const [copiedLineIdx, setCopiedLineIdx] = useState<number | null>(null)
  const [downloadToast, setDownloadToast] = useState<string | null>(null)

  useEffect(() => {
    setDataset(initialData)
  }, [initialData])

  const handleFilterChange = async (
    newFilter: "ALL" | "ONAYLI_BOQ_METRAJ" | "MIMARI_STATIK_CAKISMA"
  ) => {
    setFilter(newFilter)
    setIsExporting(true)
    try {
      const res = await exportTrainingData({ filterCategory: newFilter })
      setDataset(res)
    } finally {
      setIsExporting(false)
    }
  }

  const handleDownloadJsonl = async () => {
    setIsExporting(true)
    setDownloadToast(null)
    try {
      const freshResult = await exportTrainingData({ filterCategory: filter })
      setDataset(freshResult)

      if (!freshResult.success || !freshResult.jsonlContent) {
        return
      }

      const blob = new Blob([freshResult.jsonlContent], {
        type: "application/x-jsonlines;charset=utf-8",
      })
      const url = URL.createObjectURL(blob)
      const anchor = document.createElement("a")
      anchor.href = url
      anchor.download = freshResult.fileName || "nexa-ai-training-dataset.jsonl"
      document.body.appendChild(anchor)
      anchor.click()
      document.body.removeChild(anchor)
      URL.revokeObjectURL(url)

      setDownloadToast(
        `${freshResult.totalLines} satırlık LoRA/Fine-Tuning eğitim seti (${freshResult.fileName}) başarıyla indirildi.`
      )
    } finally {
      setIsExporting(false)
    }
  }

  const handleCopyJsonlLine = (lineText: string, idx: number) => {
    navigator.clipboard.writeText(lineText)
    setCopiedLineIdx(idx)
    setTimeout(() => setCopiedLineIdx(null), 2000)
  }

  return (
    <div className="space-y-6 text-white">
      {/* Başlık ve Aksiyon Barı */}
      <div className="flex flex-col gap-4 rounded-2xl border border-slate-800 bg-slate-900/90 p-6 shadow-xl lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 rounded-full border border-purple-500/30 bg-purple-500/10 px-3 py-1 text-xs font-semibold text-purple-300">
            <BrainCircuit className="h-3.5 w-3.5" />
            Sıfır Maliyetli Local Open-Source LLM & LoRA Fine-Tuning Motoru
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white lg:text-3xl">
            AI Model Eğitimi (Dataset)
          </h1>
          <p className="max-w-3xl text-sm text-slate-400">
            Şantiyelerde doğruluğu şefler tarafından onaylanmış geçmiş Keşif/Metraj
            (BoQ) listelerini ve Mimari/Statik Çakışma (Clash) raporlarını
            veritabanından çekerek yerel açık kaynak modelleri (Ollama / vLLM /
            Llama-3.2-Vision / Qwen2.5-VL) eğitmek üzere standart{" "}
            <code className="rounded bg-slate-800 px-1.5 py-0.5 text-amber-300">
              .jsonl
            </code>{" "}
            formatında dışa aktarın.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => handleFilterChange(filter)}
            disabled={isExporting}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-sm font-medium text-slate-200 transition hover:bg-slate-700 disabled:opacity-50"
          >
            <RefreshCw
              className={`h-4 w-4 ${isExporting ? "animate-spin" : ""}`}
            />
            Veritabanını Yenile
          </button>

          <button
            type="button"
            onClick={handleDownloadJsonl}
            disabled={isExporting}
            className="inline-flex items-center gap-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-purple-600/25 transition hover:from-purple-500 hover:to-indigo-500 disabled:opacity-50"
          >
            <Download className="h-4 w-4" />
            {isExporting
              ? "JSONL Hazırlanıyor..."
              : ".JSONL Eğitim Setini İndir"}
          </button>
        </div>
      </div>

      {downloadToast && (
        <div className="flex items-center gap-3 rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-4 text-sm text-emerald-300">
          <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-400" />
          <span>{downloadToast}</span>
        </div>
      )}

      {/* Mimari & İstatistik Kartları */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-slate-400">
              Yerel LLM Endpoint
            </span>
            <Cpu className="h-5 w-5 text-purple-400" />
          </div>
          <p className="mt-2 truncate font-mono text-sm font-semibold text-emerald-400">
            {dataset.localAiEndpoint}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Ticari API (OpenAI/Gemini) devre dışı • %100 Yerel
          </p>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-slate-400">
              Multi-Agent Uzmanlar
            </span>
            <Layers className="h-5 w-5 text-blue-400" />
          </div>
          <p className="mt-2 text-xl font-bold text-white">
            3 Paralel Ajan (Promise.all)
          </p>
          <p className="mt-1 text-xs text-slate-400">
            architectAgent • structuralAgent • surveyorAgent
          </p>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-slate-400">
              Şef Onaylı BoQ Kayıtları
            </span>
            <Database className="h-5 w-5 text-emerald-400" />
          </div>
          <p className="mt-2 text-2xl font-bold text-white">
            {dataset.approvedBoqCount}
          </p>
          <p className="mt-1 text-xs text-slate-400">
            Saha metrajı ve Poz No doğrulanmış veri
          </p>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-slate-400">
              Mimari/Statik Çakışma Raporu
            </span>
            <AlertTriangle className="h-5 w-5 text-amber-400" />
          </div>
          <p className="mt-2 text-2xl font-bold text-white">
            {dataset.clashReportCount}
          </p>
          <p className="mt-1 text-xs text-slate-400">
            BIM & pafta çakışma çözümü eğitim örneği
          </p>
        </div>
      </div>

      {/* Filtre Sekmeleri */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-800 bg-slate-900/70 p-4">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => handleFilterChange("ALL")}
            className={`rounded-lg px-3.5 py-2 text-xs font-semibold transition ${
              filter === "ALL"
                ? "bg-purple-600 text-white"
                : "bg-slate-800 text-slate-300 hover:bg-slate-700"
            }`}
          >
            Tümü ({dataset.approvedBoqCount + dataset.clashReportCount})
          </button>
          <button
            type="button"
            onClick={() => handleFilterChange("ONAYLI_BOQ_METRAJ")}
            className={`rounded-lg px-3.5 py-2 text-xs font-semibold transition ${
              filter === "ONAYLI_BOQ_METRAJ"
                ? "bg-emerald-600 text-white"
                : "bg-slate-800 text-slate-300 hover:bg-slate-700"
            }`}
          >
            Şef Onaylı Keşif/Metraj (BoQ) ({dataset.approvedBoqCount})
          </button>
          <button
            type="button"
            onClick={() => handleFilterChange("MIMARI_STATIK_CAKISMA")}
            className={`rounded-lg px-3.5 py-2 text-xs font-semibold transition ${
              filter === "MIMARI_STATIK_CAKISMA"
                ? "bg-amber-600 text-white"
                : "bg-slate-800 text-slate-300 hover:bg-slate-700"
            }`}
          >
            Mimari & Statik Çakışma Raporları ({dataset.clashReportCount})
          </button>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-400">
          <FileCode2 className="h-4 w-4 text-purple-400" />
          <span>
            Aktif Satır Sayısı:{" "}
            <strong className="text-white">{dataset.totalLines} JSONL</strong>
          </span>
        </div>
      </div>

      {/* Onaylı Şantiye Eğitim Verileri Tablosu */}
      <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900">
        <div className="border-b border-slate-800 px-6 py-4">
          <h2 className="text-base font-semibold text-white">
            Onaylanmış Şantiye Keşif/Metraj (BoQ) & Çakışma Veri Havuzu
          </h2>
          <p className="text-xs text-slate-400">
            Şantiye şefleri tarafından doğrulanmış ve LoRA/Fine-Tuning eğitimine
            hazır kayıtlar
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-800 bg-slate-950/60 text-xs uppercase text-slate-400">
              <tr>
                <th className="px-4 py-3">Kayıt Kodu</th>
                <th className="px-4 py-3">Şantiye / Proje</th>
                <th className="px-4 py-3">Veri Kategorisi</th>
                <th className="px-4 py-3">Disiplin</th>
                <th className="px-4 py-3">Onaylayan Şef</th>
                <th className="px-4 py-3">Güven Skoru</th>
                <th className="px-4 py-3">JSONL (User / Assistant) Önizleme</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {dataset.samples.map((sample, idx) => {
                const singleLineJson = JSON.stringify(sample.jsonlRow)
                return (
                  <tr
                    key={sample.id}
                    className="transition hover:bg-slate-800/40"
                  >
                    <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-purple-300">
                      {sample.id}
                    </td>
                    <td className="px-4 py-3 font-medium text-white">
                      {sample.projectName}
                    </td>
                    <td className="px-4 py-3">
                      {sample.category === "ONAYLI_BOQ_METRAJ" ? (
                        <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-xs font-medium text-emerald-300">
                          Onaylı BoQ Metraj
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-0.5 text-xs font-medium text-amber-300">
                          Mimari/Statik Çakışma
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-300">
                      {sample.discipline}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-300">
                      {sample.approvedBy}
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-mono text-xs font-semibold text-emerald-400">
                        %{sample.confidence.toFixed(1)}
                      </span>
                    </td>
                    <td className="max-w-md px-4 py-3">
                      <div className="flex items-center justify-between gap-2 rounded-lg border border-slate-800 bg-slate-950 p-2">
                        <code className="truncate font-mono text-[11px] text-slate-300">
                          {singleLineJson}
                        </code>
                        <button
                          type="button"
                          onClick={() =>
                            handleCopyJsonlLine(singleLineJson, idx)
                          }
                          className="shrink-0 rounded p-1 text-slate-400 hover:bg-slate-800 hover:text-white"
                          title="JSONL Satırını Kopyala"
                        >
                          {copiedLineIdx === idx ? (
                            <Check className="h-3.5 w-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="h-3.5 w-3.5" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Canlı JSONL Çıktı Terminali */}
      <div className="rounded-2xl border border-slate-800 bg-slate-950 p-6">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Terminal className="h-5 w-5 text-emerald-400" />
            <h3 className="text-sm font-semibold text-white">
              Ham JSONL (JSON Lines) Eğitim Dosyası Önizlemesi ({dataset.fileName})
            </h3>
          </div>
          <span className="font-mono text-xs text-slate-400">
            Format: {'{"messages": [{"role": "user", "content": "..."}, {"role": "assistant", "content": "..."}]}'}
          </span>
        </div>
        <pre className="max-h-72 overflow-auto rounded-xl border border-slate-800/90 bg-slate-900/90 p-4 font-mono text-xs leading-relaxed text-emerald-300">
          {dataset.jsonlContent}
        </pre>
      </div>
    </div>
  )
}
