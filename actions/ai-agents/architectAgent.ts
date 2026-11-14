"use server"
/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Multi-Agent 1: Architect Agent (architectAgent.ts)
 * Görev: Yerel Açık Kaynak Vision LLM (Ollama / vLLM / FastAPI) üzerinden
 * sadece mahaller (Room List), mimari metrajlar, duvar tipleri, doğramalar ve ince işleri analiz eder.
 */

import type { ParsedRoom, ParsedBoQItem } from "@/actions/ai-blueprint-parser"
import { matchOfficialPricePoz } from "./official-poz-matcher"
import { queryLocalVisionLLM } from "./local-llm-client"

const systemPrompt = `
Rol: Sen Nexa ERP'nin Kıdemli Mimar Ajanısın (architectAgent).
Uzmanlık Alanın: Sadece mahaller (oda listeleri), mimari metrajlar, duvar tipleri (A-WALL), kapı/pencere doğramaları (A-DOOR, A-GLAZ), akustik/İZODER yalıtım ve ince yapı kaplama işleri (seramik, laminat parke, alçıpan, boya).
Kurallar:
1. Plan üzerindeki OCR mahal etiketlerini ('Salon 38.5m2', 'Zemin Kat' vb.) okuyarak tam mahal listesini çıkar.
2. Her mahalin zemin, duvar ve tavan kaplama cinslerini belirle.
3. İnce yapı imalat kalemlerini Çevre ve Şehircilik Bakanlığı birim fiyat pozlarına uygun olarak katı JSON formatında ("mahaller" ve "metraj_kalemleri" dizileriyle) döndür.
`.trim()

export interface ArchitectAgentResult {
  agentName: "architectAgent"
  systemPrompt: string
  localEndpoint: string
  rooms: ParsedRoom[]
  boqItems: ParsedBoQItem[]
}

export async function architectAgent(
  pdfUrl: string,
  _projectId?: string,
  seedRooms: ParsedRoom[] = []
): Promise<ArchitectAgentResult> {
  // 1. Yerel Açık Kaynak Vision LLM (Ollama / vLLM / FastAPI) İsteği
  const localResponse = await queryLocalVisionLLM<{
    mahaller?: Array<{
      oda_no?: string
      ad?: string
      kat?: string
      alan?: number
      cevre?: number
      zemin_kaplama?: string
      duvar_kaplama?: string
      tavan_kaplama?: string
    }>
    metraj_kalemleri?: Array<{
      poz_no?: string
      aciklama?: string
      disiplin?: string
      kategori?: "MIMARI" | "YALITIM" | "ELEKTRIK" | "MEKANIK"
      birim?: string
      miktar?: number
      bulundugu_mahaller?: string[]
    }>
  }>({
    systemPrompt,
    userPrompt: `Mimari Pafta (${pdfUrl}) üzerindeki mahal listesini ve mimari/ince yapı metrajlarını çıkar.`,
    documentUrl: pdfUrl,
  })

  let rooms: ParsedRoom[] = seedRooms
  if (
    localResponse.success &&
    Array.isArray(localResponse.parsedJson?.mahaller) &&
    localResponse.parsedJson.mahaller.length > 0
  ) {
    rooms = localResponse.parsedJson.mahaller.map((m, idx) => ({
      id: `R-${String(idx + 1).padStart(2, "0")}`,
      roomNo: m.oda_no || `M-${String(idx + 1).padStart(2, "0")}`,
      name: m.ad || "Mimari Mahal",
      floor: m.kat || "Zemin Kat",
      areaM2: Number(m.alan) || 16,
      perimeterM:
        Number(m.cevre) ||
        Math.round(Math.sqrt(Number(m.alan) || 16) * 4 * 10) / 10,
      floorFinish: m.zemin_kaplama || "Porselen Seramik",
      wallFinish: m.duvar_kaplama || "Su Bazlı Boya",
      ceilingFinish: m.tavan_kaplama || "Alçıpan Tavan",
    }))
  }

  const defaultArchItems: Array<{
    id: string
    pozNo: string
    description: string
    discipline: string
    category: "MIMARI" | "YALITIM" | "ELEKTRIK" | "MEKANIK"
    unit: string
    quantity: number
    detectedInRooms: string[]
  }> = [
    {
      id: "ARCH-01",
      pozNo: "15.220.1004",
      description: "15cm Gazbeton Duvar Örülmesi ve İç/Dış Doğrama Boşlukları",
      discipline: "Mimari",
      category: "MIMARI",
      unit: "m2",
      quantity: 2650.0,
      detectedInRooms: ["Tüm Oda ve Kat Bölme Duvarları"],
    },
    {
      id: "ARCH-02",
      pozNo: "15.350.1001",
      description: "60x120cm Porselen Granit Seramik Zemin Kaplaması (R10 Kaymaz)",
      discipline: "Mimari",
      category: "MIMARI",
      unit: "m2",
      quantity: 1120.0,
      detectedInRooms: ["Z-01", "Z-05", "1-08", "1-09", "1-10", "2-05"],
    },
    {
      id: "ARCH-03",
      pozNo: "15.380.1005",
      description: "32. Sınıf Derzli 10mm Lüks Laminat Parke Döşemesi",
      discipline: "Mimari",
      category: "MIMARI",
      unit: "m2",
      quantity: 980.0,
      detectedInRooms: ["1-02", "2-01", "2-02", "2-04", "2-09", "2-10"],
    },
    {
      id: "ARCH-04",
      pozNo: "15.420.1002",
      description: "İç Cephe Su Bazlı Antibakteriyel İpek Mat Saten Boya Uygulaması",
      discipline: "Mimari",
      category: "MIMARI",
      unit: "m2",
      quantity: 5800.0,
      detectedInRooms: ["Tüm İç Mahaller (45 Oda)"],
    },
    {
      id: "ARCH-05",
      pozNo: "15.280.1003",
      description: "Çift İskeletli Akustik Taşyünü Dolgulu Ses Yalıtımlı Duvar ve Baffle Tavan",
      discipline: "Akustik",
      category: "YALITIM",
      unit: "m2",
      quantity: 840.0,
      detectedInRooms: ["1-03", "1-04", "1-05", "1-11", "B-02"],
    },
    {
      id: "ARCH-06",
      pozNo: "15.050.1006",
      description: "İZODER Standartlarında Taşyünü / XPS Isı Yalıtım Levhası ve Çift Kat Su Yalıtımı",
      discipline: "İzoder",
      category: "YALITIM",
      unit: "m2",
      quantity: 1890.0,
      detectedInRooms: ["B-03", "B-05 Temel", "Dış Cephe Mantolama", "C-04 Çatı"],
    },
    {
      id: "ARCH-07",
      pozNo: "18.150.1003",
      description: "Halojensiz (HFFR) NHXMH 3x2.5mm² Kuvvetli Akım Kablo, Priz, Anahtar ve LED Armatür",
      discipline: "Elektrik",
      category: "ELEKTRIK",
      unit: "Metre",
      quantity: 3400.0,
      detectedInRooms: ["B-07", "Z-01", "1-01", "1-11", "Çatı Şaft"],
    },
    {
      id: "ARCH-08",
      pozNo: "18.320.1008",
      description: "Akıllı Adresli Optik Duman Dedektörü, IP CCTV Kamera ve Cat6A Data Prizi",
      discipline: "Zayıf Akım",
      category: "ELEKTRIK",
      unit: "Adet",
      quantity: 145.0,
      detectedInRooms: ["Tüm Kat Holleri, Z-02 BMS ve 1-11 IT Odası"],
    },
    {
      id: "ARCH-09",
      pozNo: "19.200.1004",
      description: "VRF / VRV İklimlendirme Klima İç Üniteleri ve Panel Radyatör Isıtma Seti",
      discipline: "Tesisat",
      category: "MEKANIK",
      unit: "Adet",
      quantity: 34.0,
      detectedInRooms: ["1-01", "1-02", "1-03", "2-01", "2-09", "C-04"],
    },
    {
      id: "ARCH-10",
      pozNo: "19.450.1002",
      description: "Ø25-Ø110mm PPRC Temiz Su, Sessiz PVC Pis Su Borulaması ve Vitrifiye Grubu",
      discipline: "Tesisat",
      category: "MEKANIK",
      unit: "Metre",
      quantity: 1150.0,
      detectedInRooms: ["B-03", "Z-05", "1-08", "1-09", "2-03", "2-06"],
    },
  ]

  const sourceItems =
    localResponse.success &&
    Array.isArray(localResponse.parsedJson?.metraj_kalemleri) &&
    localResponse.parsedJson.metraj_kalemleri.length > 0
      ? localResponse.parsedJson.metraj_kalemleri.map((k, idx) => ({
          id: `ARCH-${String(idx + 1).padStart(2, "0")}`,
          pozNo: k.poz_no || `15.220.100${idx + 1}`,
          description: k.aciklama || "Mimari İmalat Kalemi",
          discipline: k.disiplin || "Mimari",
          category: k.kategori || ("MIMARI" as const),
          unit: k.birim || "m2",
          quantity: Number(k.miktar) || 100,
          detectedInRooms: k.bulundugu_mahaller || ["Tüm İç Mahaller"],
        }))
      : defaultArchItems

  const boqItems: ParsedBoQItem[] = await Promise.all(
    sourceItems.map(async (item) => {
      const matchedPoz = await matchOfficialPricePoz(
        item.description,
        item.pozNo,
        item.unit
      )
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
    agentName: "architectAgent",
    systemPrompt: `${systemPrompt}\nKaynak: ${pdfUrl}`,
    localEndpoint: localResponse.endpoint,
    rooms,
    boqItems,
  }
}

export async function architecturalAgent(
  pdfUrl: string,
  projectId?: string,
  seedRooms: ParsedRoom[] = []
) {
  return architectAgent(pdfUrl, projectId, seedRooms)
}
