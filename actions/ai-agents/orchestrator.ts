"use server"
/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Multi-Agent Orchestrator & Local Open-Source LLM Router (orchestrator.ts)
 * Görev: architectAgent, structuralAgent ve surveyorAgent ajanlarını yerel açık kaynak
 * model (Ollama / vLLM / FastAPI - process.env.LOCAL_AI_ENDPOINT || http://localhost:11434/api/chat)
 * üzerinden eş zamanlı (Promise.all) çalıştırır ve sonuçları tek bir BoQ (Keşif/Metraj) dizisinde birleştirir.
 */

import type { ParsedRoom, ParsedBoQItem } from "@/actions/ai-blueprint-parser"
import { architectAgent, type ArchitectAgentResult } from "./architectAgent"
import { structuralAgent, type StructuralAgentResult } from "./structuralAgent"
import { surveyorAgent, type SurveyorAgentResult } from "./surveyorAgent"
import { ensureOfficialPricePozCatalogSeeded } from "./official-poz-matcher"
import { queryLocalVisionLLM, type LocalLLMResponse } from "./local-llm-client"

export interface OrchestratorResult {
  localAiEndpoint: string
  rooms: ParsedRoom[]
  boqItems: ParsedBoQItem[]
  totalEstimatedCost: number
  agentsSummary: {
    architectural: ArchitectAgentResult
    structural: StructuralAgentResult
    surveyor: SurveyorAgentResult
  }
}

export async function fetchLocalOpenSourceModel<T = any>(params: {
  systemPrompt: string
  userPrompt: string
  documentUrl?: string
  model?: string
}): Promise<LocalLLMResponse<T>> {
  return queryLocalVisionLLM<T>(params)
}

export async function orchestrator(
  pdfUrl: string,
  projectId: string,
  defaultRooms: ParsedRoom[] = []
): Promise<OrchestratorResult> {
  const localAiEndpoint =
    process.env.LOCAL_AI_ENDPOINT || "http://localhost:11434/api/chat"

  // Resmi birim fiyat tablosunun (OfficialPricePoz) veritabanında hazır olduğundan emin ol
  await ensureOfficialPricePozCatalogSeeded()

  // ADIM 2: 3 uzman ajanı (architectAgent, structuralAgent, surveyorAgent) Promise.all ile eş zamanlı çalıştır
  const [archResult, structResult, surveyResult] = await Promise.all([
    architectAgent(pdfUrl, projectId, defaultRooms),
    structuralAgent(pdfUrl, projectId),
    surveyorAgent(pdfUrl, projectId),
  ])

  // Tüm ajanlardan gelen metraj kalemlerini tek bir BoQ (Keşif/Metraj) dizisinde birleştir
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
    localAiEndpoint,
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

export async function masterOrchestrator(
  pdfUrl: string,
  projectId: string,
  defaultRooms: ParsedRoom[] = []
): Promise<OrchestratorResult> {
  return orchestrator(pdfUrl, projectId, defaultRooms)
}
