/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Nexa ERP - Şantiye Jurnali (AI Destekli Otonom Raporlama)
 */

import { prisma } from "@/lib/prisma"
import JournalClient from "./_components/JournalClient"

export const dynamic = "force-dynamic"

export default async function JournalPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params

  // 1. Son jurnalleri veritabanından çek
  const rawJournals = await prisma.dailyJournal.findMany({
    orderBy: { date: "desc" },
    take: 20,
  })

  // 2. Projeleri çek
  const projects = await prisma.project.findMany({
    select: { id: true, name: true },
    take: 10,
  })

  const projectMap = new Map(projects.map((p) => [p.id, p.name]))

  const initialJournals = rawJournals.map((j) => ({
    id: j.id,
    date: new Date(j.date).toLocaleDateString("tr-TR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }),
    rawDate: j.date.toISOString().split("T")[0],
    projectName: projectMap.get(j.projectId) || "Merkez Proje",
    workerCount: j.workerCount,
    engineerNotes: j.engineerNotes || "",
    status: j.status,
  }))

  return (
    <div className="flex-1 min-h-screen bg-slate-50 dark:bg-[#0A0F1C] text-slate-900 dark:text-white">
      <JournalClient initialJournals={initialJournals} projects={projects} locale={locale} />
    </div>
  )
}
