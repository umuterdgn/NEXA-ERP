/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Franchise Portal - Görevler & Mağaza Açılış Takvimi
 */

import React from "react"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import TasksPageClient from "@/components/franchise/TasksPageClient"

export const dynamic = "force-dynamic"

export default async function FranchiseTasksPage() {
  const session = await auth()
  if (!session?.user) {
    redirect("/login")
  }

  const tenantId = (session.user as any)?.tenantId

  // %100 Tenant İzolasyonu
  const projects = await prisma.project.findMany({
    where: tenantId ? { tenantId } : {},
    select: {
      id: true,
      name: true,
      city: true,
      status: true,
    },
    take: 20,
  })

  // Sample tasks tailored for retail rollouts
  const tasks = [
    { id: "TSK-01", title: "Belediye Tabela İzni ve Harç Ödemesi", store: projects[0]?.name || "Kadıköy Şubesi", dueDate: "29.10.2026", priority: "HIGH", status: "PENDING" },
    { id: "TSK-02", title: "Merkezi Soğutma Grubu Gaz Basınç Testi", store: projects[1]?.name || "Marmara Forum AVM", dueDate: "31.10.2026", priority: "CRITICAL", status: "IN_PROGRESS" },
    { id: "TSK-03", title: "Yazar Kasa POS Mali Mühür Aktivasyonu", store: projects[0]?.name || "Kadıköy Şubesi", dueDate: "02.11.2026", priority: "HIGH", status: "PENDING" },
    { id: "TSK-04", title: "Gondol Raf ve Fiyat Etiketlikleri Montajı", store: projects[2]?.name || "Tunalı Hilmi Şubesi", dueDate: "27.10.2026", priority: "NORMAL", status: "COMPLETED" },
    { id: "TSK-05", title: "Geçici Kabul Eksiklik (Punch List) Kapatma", store: projects[1]?.name || "Marmara Forum AVM", dueDate: "04.11.2026", priority: "CRITICAL", status: "IN_PROGRESS" },
  ]

  return <TasksPageClient projects={projects} initialTasks={tasks} />
}
