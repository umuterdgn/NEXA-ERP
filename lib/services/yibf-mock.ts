/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * T.C. Çevre, Şehircilik ve İklim Değişikliği Bakanlığı
 * YİBF & UYDS Veri Çekme Motoru Mock Servisi
 */

export interface YibfGovResponse {
  yibfNo: string
  projectName: string
  contractor: {
    yambisNo: string
    name: string
  }
  location: {
    city: string
    district: string
    maksAda: string
    maksParsel: string
  }
  details: {
    totalAreaSquareMeters: number
    floorCount: number
    buildingClass: string
  }
  uydsStatus: string
}

export const KNOWN_YIBF_SCENARIOS: Record<string, YibfGovResponse> = {
  "14582": {
    yibfNo: "14582",
    projectName: "Vadi Evleri A Blok",
    contractor: {
      yambisNo: "34-98765",
      name: "Demirtaş İnşaat A.Ş.",
    },
    location: {
      city: "İstanbul",
      district: "Kadıköy",
      maksAda: "145",
      maksParsel: "22",
    },
    details: {
      totalAreaSquareMeters: 4500,
      floorCount: 12,
      buildingClass: "4B",
    },
    uydsStatus: "RUHSAT_ALINDI",
  },
  "34591": {
    yibfNo: "34591",
    projectName: "Güneştepe Panorama Konutları",
    contractor: {
      yambisNo: "06-44321",
      name: "Atlas Yapı Endüstri A.Ş.",
    },
    location: {
      city: "Ankara",
      district: "Çankaya",
      maksAda: "280",
      maksParsel: "14",
    },
    details: {
      totalAreaSquareMeters: 8200,
      floorCount: 16,
      buildingClass: "5A",
    },
    uydsStatus: "TEMEL_VIZESI_ONAYLANDI",
  },
  "78214": {
    yibfNo: "78214",
    projectName: "Akdeniz Rezidans B Blok",
    contractor: {
      yambisNo: "31-88912",
      name: "Toroslar İnşaat Ltd. Şti.",
    },
    location: {
      city: "Hatay",
      district: "İskenderun",
      maksAda: "412",
      maksParsel: "7",
    },
    details: {
      totalAreaSquareMeters: 3600,
      floorCount: 8,
      buildingClass: "3B",
    },
    uydsStatus: "DEMIR_KALIP_KONTROLUNDE",
  },
}

export async function fetchYibfMockData(yibfNo: string): Promise<YibfGovResponse> {
  const cleanYibf = yibfNo.trim()

  // 1.5 saniyelik gerçekçi Bakanlık UYDS / MAKS Gateway gecikmesi
  await new Promise((resolve) => setTimeout(resolve, 1500))

  if (KNOWN_YIBF_SCENARIOS[cleanYibf]) {
    return KNOWN_YIBF_SCENARIOS[cleanYibf]
  }

  // Farklı YİBF numaraları için dinamik ve tutarlı senaryo üretimi
  const numHash = cleanYibf.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0)
  const cities = [
    { city: "İstanbul", district: "Ümraniye", ada: ((numHash % 300) + 100).toString(), parsel: ((numHash % 40) + 1).toString() },
    { city: "İzmir", district: "Bornova", ada: ((numHash % 250) + 120).toString(), parsel: ((numHash % 35) + 2).toString() },
    { city: "Bursa", district: "Nilüfer", ada: ((numHash % 200) + 80).toString(), parsel: ((numHash % 50) + 3).toString() },
    { city: "Antalya", district: "Muratpaşa", ada: ((numHash % 180) + 90).toString(), parsel: ((numHash % 30) + 5).toString() },
  ]
  const selectedLoc = cities[numHash % cities.length]
  const contractors = [
    { name: "Özdemir Yapı Mühendislik A.Ş.", yambis: `34-${(numHash * 17) % 90000 + 10000}` },
    { name: "Kuzey Ege Taahhüt Ltd. Şti.", yambis: `35-${(numHash * 23) % 90000 + 10000}` },
    { name: "Marmara İnşaat Yatırımları A.Ş.", yambis: `16-${(numHash * 31) % 90000 + 10000}` },
  ]
  const selectedContractor = contractors[numHash % contractors.length]

  return {
    yibfNo: cleanYibf,
    projectName: `YİBF ${cleanYibf} Konut & Ticari Blok`,
    contractor: {
      yambisNo: selectedContractor.yambis,
      name: selectedContractor.name,
    },
    location: {
      city: selectedLoc.city,
      district: selectedLoc.district,
      maksAda: selectedLoc.ada,
      maksParsel: selectedLoc.parsel,
    },
    details: {
      totalAreaSquareMeters: ((numHash % 10) + 2) * 1200 + 350,
      floorCount: (numHash % 12) + 4,
      buildingClass: (numHash % 2 === 0) ? "4A" : "4B",
    },
    uydsStatus: "RUHSAT_ALINDI",
  }
}
