"use server"
/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Multi-Agent Master Orchestrator
 * Görev: architecturalAgent, structuralAgent ve surveyorAgent ajanlarını aynı anda (Promise.all)
 * çalıştırır ve Çevre ve Şehircilik Bakanlığı Poz No (OfficialPricePoz) eşleştirmeli tek bir BoQ tablosunda birleştirir.
 */

import type { ParsedRoom, ParsedBoQItem } from "@/actions/ai-blueprint-parser"
import { architecturalAgent, type ArchitecturalAgentResult } from "./architectural-agent"
import { structuralAgent, type StructuralAgentResult } from "./structural-agent"
import { surveyorAgent, type SurveyorAgentResult } from "./surveyor-agent"
import { ensureOfficialPricePozCatalogSeeded } from "./official-poz-matcher"

export interface MasterOrchestratorResult {
  rooms: ParsedRoom[]
  boqItems: ParsedBoQItem[]
  totalEstimatedCost: number
  agentsSummary: {
    architectural: ArchitecturalAgentResult
    structural: StructuralAgentResult
    surveyor: SurveyorAgentResult
  }
}

export async function masterOrchestrator(
  pdfUrl: string,
  projectId: string,
  defaultRooms: ParsedRoom[] = []
): Promise<MasterOrchestratorResult> {
  // Resmi birim fiyat tablosunun (OfficialPricePoz) veritabanında hazır olduğundan emin ol
  await ensureOfficialPricePozCatalogSeeded()

  // ADIM 1: 3 Uzman Agent aynı anda (Promise.all) paralel çalışır
  const [archResult, structResult, surveyResult] = await Promise.all([
    architecturalAgent(pdfUrl, projectId, defaultRooms),
    structuralAgent(pdfUrl, projectId),
    surveyorAgent(pdfUrl, projectId),
  ])

  // Tüm ajanlardan gelen metraj kalemlerini (BoQ) tek bir tabloda birleştir
  const combinedBoqItems: ParsedBoQItem[] = [
    ...surveyResult.boqItems,
    ...structResult.boqItems,
    ...archResult.boqItems,
  ]

  const totalEstimatedCost = combinedBoqItems.reduce(
    (sum, item) => sum + item.totalPrice,
    0
  )

  return {
    rooms: archResult.rooms,
    boqItems: combinedBoqItems,
    totalEstimatedCost,
    agentsSummary: {
      architectural: archResult,
      structural: structResult,
      surveyor: surveyResult,
    },
  }
}

