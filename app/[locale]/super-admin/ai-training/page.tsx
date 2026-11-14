/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Super Admin - AI Model Eğitimi (Dataset) & JSONL Fine-Tuning Exporter (/super-admin/ai-training)
 */

import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { exportTrainingData } from "@/actions/super-admin/ai-training"
import AiTrainingDatasetClient from "@/components/superadmin/AiTrainingDatasetClient"

export const dynamic = "force-dynamic"

export const metadata = {
  title: "AI Model Eğitimi (Dataset) | Super Admin",
  description:
    "Şantiye şefleri tarafından onaylanmış Keşif/Metraj (BoQ) ve Mimari/Statik Çakışma raporlarını açık kaynak modelleri (LoRA/Fine-Tuning) eğitmek için JSONL formatında dışa aktarın.",
}

export default async function AiTrainingPage() {
  const session = await auth()

  if (!session) {
    redirect("/login")
  }

  const userRole = (session.user as any)?.role
  if (userRole !== "SUPER_ADMIN" && userRole !== "ADMIN") {
    redirect("/unauthorized")
  }

  const initialDataset = await exportTrainingData({ filterCategory: "ALL" })

  return <AiTrainingDatasetClient initialData={initialDataset} />
}
