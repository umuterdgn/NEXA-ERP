"use server"
/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Multi-Agent Orchestrator & Localhost Ollama Router (orchestrator.ts)
 * Görev: Hiçbir bulut veya API maliyeti yaratmadan kullanıcının kendi bilgisayarında çalışan
 * lokal Ollama servisine (http://localhost:11434/api/generate veya /api/chat) bağlanır,
 * 'llama3.2-vision' veya 'llava' açık kaynak vizyon modellerini kullanarak
 * architectAgent, structuralAgent ve surveyorAgent ajanlarını eş zamanlı (Promise.all) çalıştırır.
 */

import type { ParsedRoom, ParsedBoQItem } from "@/actions/ai-blueprint-parser"
import { architectAgent, type ArchitectAgentResult } from "./architectAgent"
import { structuralAgent, type StructuralAgentResult } from "./structuralAgent"
import { surveyorAgent, type SurveyorAgentResult } from "./surveyorAgent"
import { ensureOfficialPricePozCatalogSeeded } from "./official-poz-matcher"
import { queryLocalVisionLLM, type LocalLLMResponse } from "./local-llm-client"

export interface OrchestratorResult {
  localAiEndpoint: string
  visionModel: string
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
  model?: "llama3.2-vision" | "llava" | string
}): Promise<LocalLLMResponse<T>> {
  const aiEndpoint =
    process.env.LOCAL_AI_URL || "http://localhost:11434/api/generate"
  const visionModel = params.model || "llama3.2-vision"

  try {
    const response = await fetch(aiEndpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: visionModel, // 'llama3.2-vision' veya 'llava'
        system: params.systemPrompt,
        prompt: params.userPrompt,
        stream: false,
        format: "json",
      }),
    })

    if (response.ok) {
      const data = await response.json()
      const rawContent = data?.response ?? data?.message?.content ?? null
      if (rawContent) {
        return {
          success: true,
          endpoint: aiEndpoint,
          model: visionModel,
          rawContent,
          parsedJson: JSON.parse(rawContent) as T,
          latencyMs: 0,
        }
      }
    }
  } catch {
    // Fallback to queryLocalVisionLLM helper
  }

  return queryLocalVisionLLM<T>({
    ...params,
    model: visionModel,
  })
}

export async function orchestrator(
  pdfUrl: string,
  projectId: string,
  defaultRooms: ParsedRoom[] = []
): Promise<OrchestratorResult> {
  // ADIM 1: Lokal Ollama Endpoint (ENV fallback mekanizması)
  const aiEndpoint =
    process.env.LOCAL_AI_URL || "http://localhost:11434/api/generate"
  const visionModel = process.env.LOCAL_AI_MODEL || "llama3.2-vision" // veya 'llava'

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
    localAiEndpoint: aiEndpoint,
    visionModel,
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
