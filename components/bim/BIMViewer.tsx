"use client"
/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Federated Multi-Discipline BIM, IFC & 2D-to-3D R3F Extrusion Viewer Component
 * SSR Disabled with Web-IFC WebAssembly (/wasm/) Support & 2D Blueprint Extrusion Engine
 */

import dynamic from "next/dynamic"
import React from "react"
import { Loader2 } from "lucide-react"
import type { FederatedModelItem } from "@/app/[locale]/admin/projects/[id]/_components/BimViewer"
import type { Blueprint2DCoordinateElement } from "@/actions/ai-blueprint-parser"

const SUPPORTED_3D_EXTENSIONS = [".ifc", ".gltf", ".glb"]
const NON_3D_EXTENSIONS = [
  ".pdf",
  ".jpg",
  ".jpeg",
  ".png",
  ".webp",
  ".gif",
  ".svg",
  ".bmp",
  ".dwg",
  ".dxf",
  ".doc",
  ".docx",
  ".xls",
  ".xlsx",
  ".ppt",
  ".pptx",
  ".csv",
  ".txt",
  ".zip",
  ".rar",
]

export interface Extruded3DBoxMeshData {
  id: string
  meshName: string
  eleman: string
  pozNo: string
  disciplineGroup: "Mimari" | "Statik" | "Elektrik" | "Mekanik"
  categoryKey: "mimari" | "statik" | "elektrik" | "mekanik"
  position: [number, number, number]
  rotation: [number, number, number]
  boxArgs: [number, number, number]
  color: string
}

/**
 * ADIM 2: 2D'den 3D'ye Otomatik Geometri Üretimi (Geometry Engine)
 * AI Blueprint Parser veya Prisma BoqItem üzerinden gelen 2D koordinat (X, Y) ve yükseklik (Z)
 * verilerini React Three Fiber (<mesh>, <boxGeometry>) kutu/duvar geometrilerine dönüştürür
 * ve disiplin gruplarına ("Mimari", "Statik", "Elektrik", "Mekanik") ayırır.
 */
export function generate3DFrom2DData(
  elements: Blueprint2DCoordinateElement[] = []
): {
  groupedByDiscipline: Record<
    "Mimari" | "Statik" | "Elektrik" | "Mekanik",
    Extruded3DBoxMeshData[]
  >
  counts: Record<"mimari" | "statik" | "elektrik" | "mekanik", number>
  allMeshes: Extruded3DBoxMeshData[]
} {
  const groupedByDiscipline: Record<
    "Mimari" | "Statik" | "Elektrik" | "Mekanik",
    Extruded3DBoxMeshData[]
  > = {
    Mimari: [],
    Statik: [],
    Elektrik: [],
    Mekanik: [],
  }

  const counts: Record<"mimari" | "statik" | "elektrik" | "mekanik", number> = {
    mimari: 0,
    statik: 0,
    elektrik: 0,
    mekanik: 0,
  }

  const allMeshes: Extruded3DBoxMeshData[] = []

  elements.forEach((el, idx) => {
    const startX = Number(el.baslangic?.x ?? 0)
    const startZ = Number(el.baslangic?.y ?? 0)
    const endX = Number(el.bitis?.x ?? 5)
    const endZ = Number(el.bitis?.y ?? 0)
    const height = Math.max(0.15, Number(el.yukseklik ?? 3.0))
    const thickness = Math.max(0.15, Number(el.kalinlik ?? 0.25))
    const baseY = Number(el.taban_kotu ?? 0)

    const dx = endX - startX
    const dz = endZ - startZ
    const length = Math.max(0.4, Math.hypot(dx, dz))
    const angleY = -Math.atan2(dz, dx)

    const centerX = (startX + endX) / 2
    const centerY = baseY + height / 2
    const centerZ = (startZ + endZ) / 2

    const rawDisc = (el.disiplin || "Mimari").toLowerCase()
    let disciplineGroup: "Mimari" | "Statik" | "Elektrik" | "Mekanik" = "Mimari"
    let categoryKey: "mimari" | "statik" | "elektrik" | "mekanik" = "mimari"
    let color = "#f97316" // Mimari Turuncu

    if (
      rawDisc.includes("statik") ||
      rawDisc.includes("beton") ||
      rawDisc.includes("iskele") ||
      rawDisc.includes("kalıp")
    ) {
      disciplineGroup = "Statik"
      categoryKey = "statik"
      color = "#3b82f6" // Statik Mavi
    } else if (
      rawDisc.includes("elektrik") ||
      rawDisc.includes("zayıf akım") ||
      rawDisc.includes("kablo")
    ) {
      disciplineGroup = "Elektrik"
      categoryKey = "elektrik"
      color = "#eab308" // Elektrik Sarı
    } else if (
      rawDisc.includes("mekanik") ||
      rawDisc.includes("tesisat") ||
      rawDisc.includes("hvac") ||
      rawDisc.includes("boru")
    ) {
      disciplineGroup = "Mekanik"
      categoryKey = "mekanik"
      color = "#06b6d4" // Mekanik Cyan
    }

    const meshData: Extruded3DBoxMeshData = {
      id: el.id || `EXT-3D-${idx + 1}`,
      meshName: `${disciplineGroup}_${el.eleman || `Eleman_${idx + 1}`}`,
      eleman: el.eleman || "Yapı Elemanı",
      pozNo: el.poz_no || "15.220.1004",
      disciplineGroup,
      categoryKey,
      position: [centerX, centerY, centerZ],
      rotation: [0, angleY, 0],
      boxArgs: [length, height, thickness],
      color,
    }

    groupedByDiscipline[disciplineGroup].push(meshData)
    counts[categoryKey] += 1
    allMeshes.push(meshData)
  })

  return { groupedByDiscipline, counts, allMeshes }
}

export function isValid3DModelFile(
  url?: string | null,
  fileName?: string | null,
  fileType?: string | null
): boolean {
  const cleanUrl = (url || "").split("?")[0].split("#")[0].toLowerCase().trim()
  const cleanName = (fileName || "").split("?")[0].split("#")[0].toLowerCase().trim()
  const cleanType = (fileType || "").toLowerCase().replace(/^\./, "").trim()

  if (cleanType) {
    if (["ifc", "gltf", "glb"].includes(cleanType)) return true
    if (NON_3D_EXTENSIONS.includes(`.${cleanType}`)) return false
  }

  if (NON_3D_EXTENSIONS.some((ext) => cleanUrl.endsWith(ext) || cleanName.endsWith(ext))) {
    return false
  }

  if (SUPPORTED_3D_EXTENSIONS.some((ext) => cleanUrl.endsWith(ext) || cleanName.endsWith(ext))) {
    return true
  }

  if (cleanName && cleanName.includes(".")) {
    return SUPPORTED_3D_EXTENSIONS.some((ext) => cleanName.endsWith(ext))
  }

  const lastSegment = cleanUrl.split("/").pop() || ""
  if (lastSegment.includes(".")) {
    return SUPPORTED_3D_EXTENSIONS.some((ext) => lastSegment.endsWith(ext))
  }

  return Boolean(cleanUrl)
}

const InternalBimViewer = dynamic(
  () => import("@/app/[locale]/admin/projects/[id]/_components/BimViewer"),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full min-h-[600px] bg-slate-950 flex flex-col items-center justify-center gap-3 text-cyan-400">
        <Loader2 className="w-9 h-9 animate-spin text-cyan-400" />
        <span className="text-sm font-semibold text-slate-300">
          Federated BIM & R3F 2D→3D Extrusion Motoru Başlatılıyor...
        </span>
        <span className="text-xs text-slate-500 font-mono">
          /wasm/web-ifc.wasm • generate3DFrom2DData()
        </span>
      </div>
    ),
  }
)

export interface BIMViewerProps {
  url?: string | null
  ifcUrl?: string | null
  bimUrl?: string | null
  projectId?: string
  fileName?: string
  models?: FederatedModelItem[]
}

export default function BIMViewer(props: BIMViewerProps) {
  // Sadece desteklenen 3D modelleri (.ifc, .gltf, .glb) filtrele;
  // Eğer hazır 3D model yoksa veya 2D PDF/DWG yüklendiyse InternalBimViewer otomatik olarak
  // generate3DFrom2DData() ile R3F 3D Extrusion modelini oluşturur.
  const validModels = React.useMemo(() => {
    if (!props.models || props.models.length === 0) return undefined
    return props.models.filter((m) => isValid3DModelFile(m.url, m.name))
  }, [props.models])

  return (
    <InternalBimViewer
      {...props}
      models={validModels}
    />
  )
}

export { type FederatedModelItem }
