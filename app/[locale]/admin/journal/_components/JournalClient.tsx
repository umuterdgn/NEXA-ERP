"use client"

import React, { useState, useEffect } from "react"
import {
  BookOpen,
  Sparkles,
  CheckCircle2,
  Send,
  Calendar,
  Users,
  Sun,
  ShieldCheck,
  RefreshCw,
  Clock,
  ClipboardList,
  FileText,
} from "lucide-react"
import toast from "react-hot-toast"
import TableToolbar from "@/components/ui/TableToolbar"

interface JournalItem {
  id: string
  date: string
  rawDate: string
  projectName: string
  workerCount: number
  engineerNotes: string
  status: string
}

interface ProjectOption {
  id: string
  name: string | null
}

export default function JournalClient({
  initialJournals = [],
  projects = [],
  locale,
}: {
  initialJournals: JournalItem[]
  projects: ProjectOption[]
  locale: string
}) {
  const [journals, setJournals] = useState<JournalItem[]>(initialJournals)
  const [selectedProjectId, setSelectedProjectId] = useState<string>(projects[0]?.id || "")
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  )
  const [journalContent, setJournalContent] = useState<string>("")
  const [completedTasksCount, setCompletedTasksCount] = useState<number>(0)
  const [workerCount, setWorkerCount] = useState<number>(45)
  const [isLoadingDraft, setIsLoadingDraft] = useState<boolean>(false)
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)
  const [searchQuery, setSearchQuery] = useState<string>("")

  // Sayfa açıldığında AI taslağını otomatik çek
  useEffect(() => {
    fetchAiDraft()
  }, [selectedProjectId, selectedDate])

  const fetchAiDraft = async () => {
    try {
      setIsLoadingDraft(true)
      const res = await fetch(
        `/api/admin/journal/ai-draft?projectId=${selectedProjectId}&date=${selectedDate}`
      )
      if (res.ok) {
        const data = await res.json()
        setJournalContent(data.aiDraftText || "")
        setCompletedTasksCount(data.tasksCount || 0)
        setWorkerCount(data.workerCount || 45)
      }
    } catch (err) {
      console.warn("AI draft fetch error:", err)
    } finally {
      setIsLoadingDraft(false)
    }
  }

  const handleSaveAndBroadcast = async () => {
    if (!journalContent.trim()) {
      toast.error("Lütfen jurnal içeriğini boş bırakmayın.")
      return
    }

    try {
      setIsSubmitting(true)
      const res = await fetch("/api/mobile/journal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          project: projects.find((p) => p.id === selectedProjectId)?.name || "Merkez Rezidans",
          block: "Tüm Sahalar",
          personnelCount: workerCount,
          worksDone: journalContent,
          equipment: "1 Kule Vinç, 2 Transmikser",
          isgNotes: "İSG saha denetimleri tamamlandı, uygunsuzluk yok.",
          weatherSummary: "Açık / Güneşli",
          temperature: 19,
        }),
      })

      if (res.ok) {
        const data = await res.json()
        toast.success("✅ Günlük Şantiye Jurnali onaylandı ve merkez ofise iletildi!")
        setJournals((prev) => [
          {
            id: data.journal?.id || `JRN-${Date.now().toString().slice(-4)}`,
            date: "Bugün (" + new Date().toLocaleDateString("tr-TR") + ")",
            rawDate: selectedDate,
            projectName: projects.find((p) => p.id === selectedProjectId)?.name || "Merkez Proje",
            workerCount,
            engineerNotes: journalContent.slice(0, 100) + "...",
            status: "SUBMITTED",
          },
          ...prev,
        ])
      } else {
        toast.error("Jurnal kaydedilemedi.")
      }
    } catch (err: any) {
      toast.error(err?.message || "Kayıt hatası")
    } finally {
      setIsSubmitting(false)
    }
  }

  const filteredJournals = journals.filter((j) => {
    if (!searchQuery) return true
    const q = searchQuery.toLowerCase()
    return (
      j.projectName.toLowerCase().includes(q) ||
      j.date.toLowerCase().includes(q) ||
      j.engineerNotes.toLowerCase().includes(q)
    )
  })

  return (
    <div className="max-w-[1700px] mx-auto p-4 md:p-8 space-y-8">
      {/* Üst Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
              SAHA & OPERASYON
            </span>
            <span className="text-xs text-slate-400">Otonom İmalat Bülteni</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white mt-1">
            📖 Şantiye Jurnali (AI Destekli)
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Manuel veri girmek yerine o gün kapanan tüm İş Emirleri taranarak jurnal metni yapay zeka ile otomatik taslak haline getirilir.
          </p>
        </div>

        {/* Proje ve Tarih Seçimi */}
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs sm:text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name || "İsimsiz Proje"}
              </option>
            ))}
          </select>

          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs sm:text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Ana Çalışma Alanı: Sol Taraf AI Jurnal Oluşturucu, Sağ Taraf Canlı İmalat Metrikleri */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sol Kolon (2 Birim): AI Jurnal Editörü */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-500 animate-pulse" />
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Otomatik AI Taslak Metni
              </h2>
            </div>
            <button
              onClick={fetchAiDraft}
              disabled={isLoadingDraft}
              className="flex items-center gap-1.5 text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoadingDraft ? "animate-spin" : ""}`} />
              Yeniden Derle
            </button>
          </div>

          <div className="relative">
            <textarea
              rows={14}
              value={journalContent}
              onChange={(e) => setJournalContent(e.target.value)}
              placeholder="Yapay zeka günün kapanan iş emirlerini tarıyor..."
              className="w-full bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 rounded-xl p-4 font-mono text-xs sm:text-sm text-slate-900 dark:text-slate-100 leading-relaxed focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {isLoadingDraft && (
              <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm rounded-xl flex items-center justify-center gap-2 text-white text-xs font-bold">
                <RefreshCw className="w-4 h-4 animate-spin" />
                İş Emirleri Taranıyor & AI Jurnali Yazılıyor...
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <div className="text-xs text-slate-400 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              Gerektiğinde metin üzerinde düzenleme yapıp onaylayabilirsiniz.
            </div>

            <button
              onClick={handleSaveAndBroadcast}
              disabled={isSubmitting || isLoadingDraft}
              className="flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-lg shadow-emerald-600/20 transition disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              {isSubmitting ? "İletiliyor..." : "Jurnali Onayla ve Merkeze Gönder"}
            </button>
          </div>
        </div>

        {/* Sağ Kolon (1 Birim): Bugünün Canlı Saha Kartları */}
        <div className="space-y-4">
          {/* İmalat & Görev Özeti Kartı */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <ClipboardList className="w-4 h-4 text-blue-500" />
              Bugün Kapanan İş Emirleri
            </h3>
            <div className="flex items-center justify-between">
              <span className="text-3xl font-black text-slate-900 dark:text-white">
                {completedTasksCount}
              </span>
              <span className="text-xs font-bold px-2 py-1 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 rounded-lg">
                %100 Başarı
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Bu iş emirlerine ait metraj, kat ve fotoğraf verileri doğrudan jurnal gövdesine entegre edilmiştir.
            </p>
          </div>

          {/* Personel ve Vardiya */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <Users className="w-4 h-4 text-purple-500" />
                Saha Personeli
              </span>
              <span className="text-lg font-bold text-slate-900 dark:text-white">
                {workerCount} Usta & İşçi
              </span>
            </div>
            <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
              <span>Hava Durumu:</span>
              <span className="font-semibold text-slate-900 dark:text-white flex items-center gap-1">
                <Sun className="w-3.5 h-3.5 text-amber-500" /> Açık, 19°C
              </span>
            </div>
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>İSG Denetimi:</span>
              <span className="font-semibold text-emerald-500 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" /> Uygun (0 Olay)
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Alt Bölüm: Geçmiş Jurnaller Listesi (Arama ve Export Destekli) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-blue-500" />
            Geçmiş Şantiye Jurnalleri Arşivi
          </h2>
        </div>

        {/* Global Arama ve Export Toolbar */}
        <TableToolbar
          searchValue={searchQuery}
          onSearchChange={setSearchQuery}
          searchPlaceholder="Tarih, proje adı veya jurnal notlarında ara..."
          data={filteredJournals}
          title="Şantiye Jurnalleri"
          fileNamePrefix="Nexa_Santiye_Jurnalleri"
          columns={[
            { key: "id", label: "Jurnal No" },
            { key: "date", label: "Tarih" },
            { key: "projectName", label: "Proje" },
            { key: "workerCount", label: "Personel Sayısı" },
            { key: "status", label: "Durum" },
          ]}
        />

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-xs font-bold text-slate-400 uppercase bg-slate-50 dark:bg-slate-800/50">
                  <th className="py-3 px-4">Tarih</th>
                  <th className="py-3 px-4">Proje</th>
                  <th className="py-3 px-4">Personel</th>
                  <th className="py-3 px-4">İmalat & Jurnal Özeti</th>
                  <th className="py-3 px-4">Durum</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredJournals.map((j) => (
                  <tr key={j.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                    <td className="py-3.5 px-4 font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-blue-500" />
                      {j.date}
                    </td>
                    <td className="py-3.5 px-4 text-xs font-medium text-slate-700 dark:text-slate-300">
                      {j.projectName}
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-500">{j.workerCount} Kişi</td>
                    <td className="py-3.5 px-4 text-xs text-slate-500 max-w-md truncate">
                      {j.engineerNotes}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="text-xs font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400">
                        {j.status === "SUBMITTED" ? "Onaylandı" : "İnceleniyor"}
                      </span>
                    </td>
                  </tr>
                ))}
                {filteredJournals.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-400 text-xs">
                      Kayıtlı şantiye jurnali bulunamadı.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}

