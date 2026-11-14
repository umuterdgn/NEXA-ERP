"use server"
/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Çevre, Şehircilik ve İklim Değişikliği Bakanlığı Resmi Birim Fiyat (Poz No) RAG Eşleştiricisi
 */

import { prisma } from "@/lib/prisma"

export interface OfficialPozMatch {
  pozNo: string
  description: string
  unit: string
  price: number
  year: number
}

// Çevre, Şehircilik ve İklim Değişikliği Bakanlığı 2026 Resmi Birim Fiyat Kataloğu
const OFFICIAL_POZ_CATALOG: Array<OfficialPozMatch & { keywords: string[] }> = [
  {
    pozNo: "15.100.1001",
    description: "Makine ile her derinlikte yumuşak ve sert toprak kazılması (Hafriyat)",
    unit: "m3",
    price: 185.0,
    year: 2026,
    keywords: ["hafriyat", "kazı", "toprak", "temel kazısı", "tesviye"],
  },
  {
    pozNo: "15.115.1004",
    description: "Kum-çakıl veya kırmataş ile temel altı ve çevre dolgusu yapılması",
    unit: "m3",
    price: 460.0,
    year: 2026,
    keywords: ["dolgu", "stabilize", "kum", "çakıl", "blokaj", "kot"],
  },
  {
    pozNo: "15.150.1005",
    description: "Beton santralinde üretilen C30/37 - C35/45 basınç dayanım sınıfında hazır beton dökülmesi",
    unit: "m3",
    price: 2850.0,
    year: 2026,
    keywords: ["beton", "c30", "c35", "c25", "hazır beton", "grobeton"],
  },
  {
    pozNo: "15.160.1002",
    description: "B420C nervürlü beton çelik çubuklarının (Ø8-Ø32mm) bükülmesi ve yerine konulması",
    unit: "Ton",
    price: 32000.0,
    year: 2026,
    keywords: ["demir", "donatı", "nervürlü", "çelik", "b420c", "etriye"],
  },
  {
    pozNo: "15.180.1003",
    description: "Plywood ile düz yüzeyli beton ve betonarme kalıbı ve güvenlikli cephe iskelesi yapılması",
    unit: "m2",
    price: 340.0,
    year: 2026,
    keywords: ["kalıp", "plywood", "iskele", "perde kalıbı", "kolon kalıbı"],
  },
  {
    pozNo: "15.220.1004",
    description: "G2/04 sınıfı gazbeton teçhizatsız duvar blokları ile 15 cm kalınlığında duvar yapılması",
    unit: "m2",
    price: 420.0,
    year: 2026,
    keywords: ["gazbeton", "duvar", "tuğla", "bims", "bölme duvar"],
  },
  {
    pozNo: "15.280.1003",
    description: "Çift iskeletli akustik taşyünü dolgulu alçı levha bölme duvar ve asma tavan yapılması",
    unit: "m2",
    price: 580.0,
    year: 2026,
    keywords: ["alçıpan", "akustik", "asma tavan", "baffle", "ses yalıtım"],
  },
  {
    pozNo: "15.350.1001",
    description: "60x120 cm ebadında her türlü porselen / granit seramik ile döşeme kaplaması yapılması",
    unit: "m2",
    price: 750.0,
    year: 2026,
    keywords: ["seramik", "fayans", "granit", "porselen", "zemin kaplama"],
  },
  {
    pozNo: "15.380.1005",
    description: "32. sınıf 10 mm kalınlığında derzli laminat parke döşeme kaplaması yapılması",
    unit: "m2",
    price: 460.0,
    year: 2026,
    keywords: ["parke", "laminat", "ahşap", "masif"],
  },
  {
    pozNo: "15.420.1002",
    description: "Yeni sıvanmış iç yüzeylere alçı astar üzerine 2 kat su bazlı silikonlu mat boya yapılması",
    unit: "m2",
    price: 165.0,
    year: 2026,
    keywords: ["boya", "saten", "sıva", "iç cephe", "tavan boyası"],
  },
  {
    pozNo: "15.050.1006",
    description: "İZODER standartlarında XPS/Taşyünü ısı yalıtımı ve çift kat bitümlü membran su yalıtımı",
    unit: "m2",
    price: 490.0,
    year: 2026,
    keywords: ["yalıtım", "izoder", "membran", "xps", "taşyünü", "mantolama"],
  },
  {
    pozNo: "18.150.1003",
    description: "Halojensiz (HFFR) yangına dayanıklı NHXMH 3x2.5 mm² bakır iletkenli tesisat kablosu",
    unit: "Metre",
    price: 95.0,
    year: 2026,
    keywords: ["kablo", "elektrik", "priz", "anahtar", "armatür", "kuvvetli akım"],
  },
  {
    pozNo: "18.320.1008",
    description: "Adresli optik duman dedektörü, IP CCTV kamera ve Cat6A zayıf akım sistemi",
    unit: "Adet",
    price: 1250.0,
    year: 2026,
    keywords: ["dedektör", "zayıf akım", "cctv", "yangın", "data"],
  },
  {
    pozNo: "19.200.1004",
    description: "VRF/VRV değişken debili iklimlendirme iç ünitesi ve ısıtma/soğutma tesisatı",
    unit: "Adet",
    price: 18500.0,
    year: 2026,
    keywords: ["klima", "vrf", "radyatör", "iklimlendirme", "havalandırma", "hvac"],
  },
  {
    pozNo: "19.450.1002",
    description: "PPRC temiz su ve sessiz PVC pis su tesisat borulaması ve vitrifiye montajı",
    unit: "Metre",
    price: 280.0,
    year: 2026,
    keywords: ["boru", "pprc", "pvc", "temiz su", "pis su", "vitrifiye", "klozet", "lavabo"],
  },
]

/**
 * Verilen imalat açıklamasını OfficialPricePoz veritabanı tablosundan (veya Bakanlık kataloğundan)
 * eşleştirerek resmi Poz No ve birim fiyat bilgisini döner.
 */
export async function matchOfficialPricePoz(
  description: string,
  fallbackPozNo?: string,
  fallbackUnit?: string,
  fallbackPrice?: number
): Promise<OfficialPozMatch> {
  const lower = (description || "").toLowerCase()

  try {
    // 1. Önce Prisma OfficialPricePoz tablosunda arama yap
    const dbPozList = await (prisma as any).officialPricePoz?.findMany?.({
      take: 100,
    })

    if (Array.isArray(dbPozList) && dbPozList.length > 0) {
      const exactByPoz = fallbackPozNo
        ? dbPozList.find((p: any) => p.pozNo === fallbackPozNo)
        : null
      if (exactByPoz) {
        return {
          pozNo: exactByPoz.pozNo,
          description: exactByPoz.description,
          unit: exactByPoz.unit,
          price: exactByPoz.price,
          year: exactByPoz.year,
        }
      }

      const matchedDb = dbPozList.find((p: any) => {
        const pDesc = (p.description || "").toLowerCase()
        return lower.split(/\s+/).some((word) => word.length > 3 && pDesc.includes(word))
      })

      if (matchedDb) {
        return {
          pozNo: matchedDb.pozNo,
          description: matchedDb.description,
          unit: matchedDb.unit,
          price: matchedDb.price,
          year: matchedDb.year,
        }
      }
    }
  } catch {
    // Tablo henüz senkronize edilmemişse dahili Bakanlık kataloğuna düş
  }

  // 2. Dahili Bakanlık Resmi Poz Kataloğundan Eşleştir
  if (fallbackPozNo) {
    const byCode = OFFICIAL_POZ_CATALOG.find((item) => item.pozNo === fallbackPozNo)
    if (byCode) {
      return {
        pozNo: byCode.pozNo,
        description: byCode.description,
        unit: byCode.unit,
        price: byCode.price,
        year: byCode.year,
      }
    }
  }

  const byKeyword = OFFICIAL_POZ_CATALOG.find((item) =>
    item.keywords.some((kw) => lower.includes(kw))
  )

  if (byKeyword) {
    return {
      pozNo: byKeyword.pozNo,
      description: description || byKeyword.description,
      unit: fallbackUnit || byKeyword.unit,
      price: fallbackPrice ?? byKeyword.price,
      year: byKeyword.year,
    }
  }

  return {
    pozNo: fallbackPozNo || "15.100.1001",
    description,
    unit: fallbackUnit || "m2",
    price: fallbackPrice ?? 450.0,
    year: 2026,
  }
}

/**
 * Veritabanındaki OfficialPricePoz tablosuna Çevre ve Şehircilik Bakanlığı resmi pozlarını tohumlar (Seed/Upsert)
 */
export async function ensureOfficialPricePozCatalogSeeded(): Promise<number> {
  try {
    if (!(prisma as any).officialPricePoz) return 0
    let count = 0
    for (const item of OFFICIAL_POZ_CATALOG) {
      await (prisma as any).officialPricePoz.upsert({
        where: { pozNo: item.pozNo },
        update: {
          description: item.description,
          unit: item.unit,
          price: item.price,
          year: item.year,
        },
        create: {
          pozNo: item.pozNo,
          description: item.description,
          unit: item.unit,
          price: item.price,
          year: item.year,
        },
      })
      count++
    }
    return count
  } catch {
    return 0
  }
}

