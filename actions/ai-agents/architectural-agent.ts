"use server"
/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Multi-Agent 1: Architectural Agent (Mimar Ajanı)
 */

import type { ParsedRoom } from "@/actions/ai-blueprint-parser"
import { architectAgent, type ArchitectAgentResult } from "./architectAgent"

export type ArchitecturalAgentResult = ArchitectAgentResult

export async function architecturalAgent(
  pdfUrl: string,
  projectId?: string,
  seedRooms: ParsedRoom[] = []
): Promise<ArchitectAgentResult> {
  return architectAgent(pdfUrl, projectId, seedRooms)
}
