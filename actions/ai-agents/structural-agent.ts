"use server"
/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Multi-Agent 2: Structural Agent (Statik Ajanı)
 */

import {
  structuralAgent as runStructuralAgent,
  type StructuralAgentResult,
} from "./structuralAgent"

export type { StructuralAgentResult }

export async function structuralAgent(
  pdfUrl: string,
  projectId?: string
): Promise<StructuralAgentResult> {
  return runStructuralAgent(pdfUrl, projectId)
}
