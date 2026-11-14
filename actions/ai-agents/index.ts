"use server"
/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Multi-Agent Exports
 */

import type { ParsedRoom } from "@/actions/ai-blueprint-parser"
import { architectAgent, type ArchitectAgentResult } from "./architectAgent"
import { structuralAgent as runStructuralAgent, type StructuralAgentResult } from "./structuralAgent"
import { surveyorAgent as runSurveyorAgent, type SurveyorAgentResult } from "./surveyorAgent"
import { orchestrator as runOrchestrator, type OrchestratorResult } from "./orchestrator"
import { matchOfficialPricePoz as runMatchOfficialPricePoz, ensureOfficialPricePozCatalogSeeded as runEnsureOfficialPricePozCatalogSeeded, type OfficialPozMatch } from "./official-poz-matcher"
import { queryLocalVisionLLM as runQueryLocalVisionLLM, type LocalLLMResponse } from "./local-llm-client"

export type {
  ArchitectAgentResult,
  StructuralAgentResult,
  SurveyorAgentResult,
  OrchestratorResult,
  OfficialPozMatch,
  LocalLLMResponse,
}

export async function architecturalAgent(
  pdfUrl: string,
  projectId?: string,
  seedRooms: ParsedRoom[] = []
) {
  return architectAgent(pdfUrl, projectId, seedRooms)
}

export async function structuralAgent(pdfUrl: string, projectId?: string) {
  return runStructuralAgent(pdfUrl, projectId)
}

export async function surveyorAgent(pdfUrl: string, projectId?: string) {
  return runSurveyorAgent(pdfUrl, projectId)
}

export async function orchestrator(
  pdfUrl: string,
  projectId: string,
  defaultRooms: ParsedRoom[] = []
) {
  return runOrchestrator(pdfUrl, projectId, defaultRooms)
}

export async function masterOrchestrator(
  pdfUrl: string,
  projectId: string,
  defaultRooms: ParsedRoom[] = []
) {
  return runOrchestrator(pdfUrl, projectId, defaultRooms)
}

export async function matchOfficialPricePoz(
  itemDescription: string,
  preferredPozNo?: string,
  unitFallback?: string,
  priceFallback?: number
) {
  return runMatchOfficialPricePoz(
    itemDescription,
    preferredPozNo,
    unitFallback,
    priceFallback
  )
}

export async function ensureOfficialPricePozCatalogSeeded() {
  return runEnsureOfficialPricePozCatalogSeeded()
}

export async function queryLocalVisionLLM<T = any>(params: {
  systemPrompt: string
  userPrompt: string
  documentUrl?: string
  model?: string
  temperature?: number
}) {
  return runQueryLocalVisionLLM<T>(params)
}
