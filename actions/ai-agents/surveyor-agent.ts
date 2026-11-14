"use server"
/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Multi-Agent 3: Surveyor Agent (Harita, Topoğrafya ve Hafriyat Ajanı)
 * Görev: Kotlar (±0.00 subasman kotu, kazı kotları), hafriyat hacmi ve vaziyet planı yerleşimine odaklanır.
 */

import type { ParsedBoQItem } from "@/actions/ai-blueprint-parser"
import { matchOfficialPricePoz } from "./official-poz-matcher"

const SURVEYOR_AGENT_PROMPT = `
Rol: Sen Nexa ERP'nin Kıdemli Harita ve Topoğrafya Mühendisi Ajanısın (Surveyor Agent).
Uzmanlık Alanın: Sadece vaziyet planı yerleşimi, bina oturum alanı (TAKS/KAKS), tesviye ve subasman kotları (±0.00, temel alt kotu), derin kazı / hafriyat hacimleri (m3) ve geri dolgu (stabilize kum-çakıl) hesapları.
Kurallar:
1. Vaziyet planı ve kesitler üzerindeki kot etiketlerini (±0.00, -4.50 temel alt kotu vb.) oku.
2. Bina oturum izi, çalışma payı ve şev açılarına göre toplam hafriyat (kazı) ve geri dolgu hacimlerini (m3) hesapla.
3. Kazı ve dolgu kalemlerini Çevre ve Şehircilik Bakanlığı resmi birim fiyat pozlarıyla (15.100.1001 vb.) eşleştir.
`.trim()

export interface SurveyorAgentResult {
  agentName: "surveyorAgent"
  systemPrompt: string
  siteSurveyData: {
    zeroElevationKot: string
    excavationDepthKot: string
    footprintAreaM2: number
    excavationVolumeM3: number
    backfillVolumeM3: number
  }
  boqItems: ParsedBoQItem[]
}

export async function surveyorAgent(
  pdfUrl: string,
  _projectId?: string
): Promise<SurveyorAgentResult> {
  const rawSurveyItems: Array<{
    id: string
    pozNo: string
    description: string
    discipline: string
    category: "STATIK"
    unit: string
    quantity: number
    detectedInRooms: string[]
  }> = [
    {
      id: "SRV-01",
      pozNo: "15.100.1001",
      description: "Vaziyet Planı Temel Kazısı (-4.50 Kotu) Makine ile Yumuşak ve Sert Toprak Hafriyatı",
      discipline: "Harita & Hafriyat",
      category: "STATIK",
      unit: "m3",
      quantity: 2480.0,
      detectedInRooms: ["Vaziyet Planı Oturum Alanı ve Bodrum Perde Çevresi"],
    },
    {
      id: "SRV-02",
      pozNo: "15.115.1004",
      description: "Subasman (±0.00 Kotu) ve Perde Arkası Kum-Çakıl / Kırmataş Stabilize Geri Dolgu",
      discipline: "Harita & Hafriyat",
      category: "STATIK",
      unit: "m3",
      quantity: 620.0,
      detectedInRooms: ["Temel Altı Blokaj ve Bodrum Perde Drenaj Çevresi"],
    },
  ]

  const boqItems: ParsedBoQItem[] = await Promise.all(
    rawSurveyItems.map(async (item) => {
      const matchedPoz = await matchOfficialPricePoz(item.description, item.pozNo, item.unit)
      const unitPrice = matchedPoz.price
      return {
        id: item.id,
        pozNo: matchedPoz.pozNo,
        description: item.description,
        discipline: item.discipline,
        category: item.category,
        unit: matchedPoz.unit || item.unit,
        quantity: item.quantity,
        unitPrice,
        totalPrice: Math.round(item.quantity * unitPrice * 100) / 100,
        detectedInRooms: item.detectedInRooms,
      }
    })
  )

  return {
    agentName: "surveyorAgent",
    systemPrompt: `${SURVEYOR_AGENT_PROMPT}\nKaynak: ${pdfUrl}`,
    siteSurveyData: {
      zeroElevationKot: "±0.00 (+104.50 m Nivo)",
      excavationDepthKot: "-4.50 m (Radye Temel Alt Kotu)",
      footprintAreaM2: 495.0,
      excavationVolumeM3: 2480.0,
      backfillVolumeM3: 620.0,
    },
    boqItems,
  }
}

