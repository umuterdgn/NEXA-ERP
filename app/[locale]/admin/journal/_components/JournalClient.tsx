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
  const [worksDone, setWorksDone] = useState<string>("")
  const [weatherSummary, setWeatherSummary] = useState<string>("Açık / Güneşli, 19°C • Rüzgar: 12 km/s")
  const [temperature, setTemperature] = useState<number>(19)
  const [isgNotes, setIsgNotes] = useState<string>(
    "Çalışma öncesi TBM (Toolbox) İSG bilgilendirmesi yapıldı. Herhangi bir iş kazası yaşanmadı. KKD kullanımı tamdır."
  )
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
        setWorksDone(data.worksDone || "")
        setWeatherSummary(data.weatherSummary || "Açık / Güneşli, 19°C • Rüzgar: 12 km/s")
        setTemperature(data.temperature || 19)
        setCompletedTasksCount(data.tasksCount || 0)
        setWorkerCount(data.workerCount || 45)
        toast.success("✨ Bugünün jurnali (iş emirleri, hava durumu, personel) başarıyla çekildi!", { icon: "📊" })
      }
    } catch (err) {
      console.warn("AI draft fetch error:", err)
    } finally {
      setIsLoadingDraft(false)
    }
  }

  const handleSaveAndBroadcast = async () => {
    const finalWorksDone = worksDone.trim() || journalContent.trim()
    if (!finalWorksDone) {
      toast.error("Lütfen imalat ve jurnal içeriğini boş bırakmayın.")
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
          personnelCount: Number(workerCount) || 45,
          worksDone: finalWorksDone,
          equipment: "1 Kule Vinç, 2 Transmikser, 1 Mobil Beton Pompası",
          isgNotes,
          weatherSummary,
          temperature: Number(temperature) || 19,
        }),
      })

      if (res.ok) {
        const data = await res.json()
        toast.success("✅ Günlük Şantiye Jurnali onaylandı ve merkez ofise kaydedildi!")
        setJournals((prev) => [
          {
            id: data.journal?.id || `JRN-${Date.now().toString().slice(-4)}`,
            date: "Bugün (" + new Date().toLocaleDateString("tr-TR") + ")",
            rawDate: selectedDate,
            projectName: projects.find((p) => p.id === selectedProjectId)?.name || "Merkez Proje",
            workerCount: Number(workerCount) || 45,
            engineerNotes: (finalWorksDone || journalContent).slice(0, 100) + "...",
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

      {/* AI & Otomasyon Aksiyon Paneli */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-gradient-to-r from-blue-600/10 via-indigo-600/10 to-amber-600/10 border border-blue-200 dark:border-blue-900/40 rounded-2xl p-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold shadow-md shadow-blue-600/20">
            <Sparkles className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Otonom Şantiye Jurnali Motoru
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              O gün kapanan tüm iş emirlerini, Open-Meteo canlı hava durumunu ve turnike puantaj verisini tek tıkla forma döker.
            </p>
          </div>
        </div>

        <button
          onClick={fetchAiDraft}
          disabled={isLoadingDraft}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-600/20 transition disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${isLoadingDraft ? "animate-spin" : ""}`} />
          {isLoadingDraft ? "Saha Verileri Çekiliyor..." : "✨ Bugünün Jurnalini Oluştur"}
        </button>
      </div>

      {/* Ana Çalışma Alanı: Sol Taraf Jurnal Formu & İmalatlar, Sağ Taraf Canlı Saha Metrikleri */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sol Kolon (2 Birim): Form Alanları */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Günlük İmalat & Saha Jurnali Formu
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Otomatik dolan alanları kontrol edip gerekirse ekleme yapabilir ve kaydedebilirsiniz.
              </p>
            </div>
          </div>

          {/* 1. Bugün Yapılan İmalatlar (Autofill from Completed Tasks) */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <ClipboardList className="w-4 h-4 text-blue-500" />
                Bugün Yapılan İmalatlar (Tamamlanan Görevlerden Otomatik) *
              </span>
              <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                {completedTasksCount} İş Emri Entegre
              </span>
            </label>
            <textarea
              rows={5}
              value={worksDone}
              onChange={(e) => setWorksDone(e.target.value)}
              placeholder="Tamamlanan görevler buraya otomatik olarak maddeler halinde yazılır..."
              className="w-full bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 rounded-xl p-3 font-mono text-xs sm:text-sm text-slate-900 dark:text-slate-100 leading-relaxed focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* 2. Hava Durumu ve Personel Sayısı (2 Kolon) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Sun className="w-4 h-4 text-amber-500" />
                Hava Durumu (Open-Meteo API) *
              </label>
              <input
                type="text"
                value={weatherSummary}
                onChange={(e) => setWeatherSummary(e.target.value)}
                placeholder="Örn: Açık / Güneşli, 19°C • Rüzgar: 12 km/s"
                className="w-full bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Users className="w-4 h-4 text-purple-500" />
                Sahadaki Aktif Personel Sayısı (Turnike / Puantaj) *
              </label>
              <input
                type="number"
                value={workerCount}
                onChange={(e) => setWorkerCount(Number(e.target.value))}
                placeholder="Örn: 45"
                className="w-full bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold"
              />
            </div>
          </div>

          {/* 3. İSG ve Saha Kalite Notları */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              İSG ve Saha Denetim Notları
            </label>
            <input
              type="text"
              value={isgNotes}
              onChange={(e) => setIsgNotes(e.target.value)}
              placeholder="Örn: Toolbox toplantısı yapıldı, KKD eksiksiz."
              className="w-full bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* 4. Tüm Jurnal Özeti (AI Destekli Bütünleşik Metin) */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-blue-500" />
              Tüm Jurnal Taslağı (Genel Merkez & Raporlama Özeti)
            </label>
            <textarea
              rows={7}
              value={journalContent}
              onChange={(e) => setJournalContent(e.target.value)}
              placeholder="Yapay zeka günün kapanan iş emirlerini tarayarak rapor derliyor..."
              className="w-full bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 rounded-xl p-3 font-mono text-xs sm:text-sm text-slate-900 dark:text-slate-100 leading-relaxed focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Alt Kontroller & Kaydet */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <div className="text-xs text-slate-400 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              Şantiye Şefi otomatik dolan metni okuyup manuel düzenleme yapabilir.
            </div>

            <button
              onClick={handleSaveAndBroadcast}
              disabled={isSubmitting || isLoadingDraft}
              className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-lg shadow-emerald-600/20 transition disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              {isSubmitting ? "Kaydediliyor..." : "Kaydet (Şantiye Jurnalini Onayla)"}
            </button>
          </div>
        </div>

        {/* Sağ Kolon (1 Birim): Canlı Saha & Metrik Kartları */}
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

