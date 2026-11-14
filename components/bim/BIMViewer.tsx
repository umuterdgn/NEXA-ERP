"use client"
/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Federated Multi-Discipline BIM, IFC & R3F 2D-to-3D Extrusion Viewer Component
 * Features: <GeometryEngine2Dto3D data={boqData} /> & Web-IFC WASM (/wasm/)
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
  boxArgs: [number, number, number] // [width, height, depth]
  color: string
}

/**
 * ADIM 2: Plandaki startX, startY ve endX, endY değerlerini kullanarak duvar uzunluğunu (width)
 * ve açısını hesaplar; height ve depth ile <boxGeometry args={[width, height, depth]}> için
 * 3D blok verisi üretir.
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
    const startX = Number(el.startX ?? el.baslangic?.x ?? 0)
    const startY = Number(el.startY ?? el.baslangic?.y ?? 0)
    const endX = Number(el.endX ?? el.bitis?.x ?? 5)
    const endY = Number(el.endY ?? el.bitis?.y ?? 0)
    const height = Math.max(0.15, Number(el.height ?? el.yukseklik ?? 3.0))
    const depth = Math.max(0.15, Number(el.thickness ?? el.kalinlik ?? 0.25))
    const baseY = Number(el.baseElevation ?? el.taban_kotu ?? 0)

    const dx = endX - startX
    const dy = endY - startY
    const width = Math.max(0.4, Math.hypot(dx, dy))
    const angleY = -Math.atan2(dy, dx)

    const centerX = (startX + endX) / 2
    const centerY = baseY + height / 2
    const centerZ = (startY + endY) / 2

    const rawDisc = (el.disiplin || "Mimari").toLowerCase()
    let disciplineGroup: "Mimari" | "Statik" | "Elektrik" | "Mekanik" = "Mimari"
    let categoryKey: "mimari" | "statik" | "elektrik" | "mekanik" = "mimari"
    let color = "#f97316" // Mimari

    if (
      rawDisc.includes("statik") ||
      rawDisc.includes("beton") ||
      rawDisc.includes("iskele") ||
      rawDisc.includes("kalıp")
    ) {
      disciplineGroup = "Statik"
      categoryKey = "statik"
      color = "#3b82f6" // Statik
    } else if (
      rawDisc.includes("elektrik") ||
      rawDisc.includes("zayıf akım") ||
      rawDisc.includes("kablo")
    ) {
      disciplineGroup = "Elektrik"
      categoryKey = "elektrik"
      color = "#eab308" // Elektrik
    } else if (
      rawDisc.includes("mekanik") ||
      rawDisc.includes("tesisat") ||
      rawDisc.includes("hvac") ||
      rawDisc.includes("boru")
    ) {
      disciplineGroup = "Mekanik"
      categoryKey = "mekanik"
      color = "#06b6d4" // Mekanik
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
      boxArgs: [width, height, depth],
      color,
    }

    groupedByDiscipline[disciplineGroup].push(meshData)
    counts[categoryKey] += 1
    allMeshes.push(meshData)
  })

  return { groupedByDiscipline, counts, allMeshes }
}

/**
 * ADIM 2: R3F ile 2D'den 3D'ye Geometri Motoru (<GeometryEngine2Dto3D data={boqData} />)
 * Gelen verilerde map işlemi yaparak her bir duvar veya yapısal eleman için startX, startY, endX, endY
 * değerlerinden duvar uzunluğunu (width) ve açısını hesaplar, height ve depth ile
 * <boxGeometry args={[width, height, depth]}> kullanarak 2D çizgiyi 3D bloğa dönüştürür.
 */
export function GeometryEngine2Dto3D({
  data,
  layerVisibility = { mimari: true, statik: true, elektrik: true, mekanik: true },
  xRayOpacity = 100,
  onClick,
  onPointerDown,
}: {
  data: Blueprint2DCoordinateElement[]
  layerVisibility?: Record<"mimari" | "statik" | "elektrik" | "mekanik", boolean>
  xRayOpacity?: number
  onClick?: (e: any) => void
  onPointerDown?: (e: any) => void
}) {
  const { groupedByDiscipline } = React.useMemo(
    () => generate3DFrom2DData(data),
    [data]
  )

  const alpha = xRayOpacity / 100
  const isTransparent = alpha < 0.99
  const clampedOpacity = Math.max(0.08, alpha)

  const renderMeshes = (
    items: Extruded3DBoxMeshData[],
    isStructuralOrArch: boolean
  ) =>
    items.map((item) => {
      const [width, height, depth] = item.boxArgs
      return (
        <mesh
          key={item.id}
          name={item.meshName}
          position={item.position}
          rotation={item.rotation}
          castShadow
          receiveShadow
          onClick={onClick}
          onPointerDown={onPointerDown}
        >
          <boxGeometry args={[width, height, depth]} />
          <meshStandardMaterial
            color={item.color}
            transparent={isStructuralOrArch ? isTransparent : false}
            opacity={isStructuralOrArch ? clampedOpacity : 1.0}
            roughness={isStructuralOrArch ? 0.65 : 0.25}
            metalness={isStructuralOrArch ? 0.15 : 0.6}
          />
        </mesh>
      )
    })

  return (
    <group name="GeometryEngine2Dto3DRoot">
      <group name="Mimari" visible={layerVisibility.mimari}>
        {renderMeshes(groupedByDiscipline.Mimari, true)}
      </group>
      <group name="Statik" visible={layerVisibility.statik}>
        {renderMeshes(groupedByDiscipline.Statik, true)}
      </group>
      <group name="Elektrik" visible={layerVisibility.elektrik}>
        {renderMeshes(groupedByDiscipline.Elektrik, false)}
      </group>
      <group name="Mekanik" visible={layerVisibility.mekanik}>
        {renderMeshes(groupedByDiscipline.Mekanik, false)}
      </group>
    </group>
  )
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
          Federated BIM & R3F GeometryEngine2Dto3D Başlatılıyor...
        </span>
        <span className="text-xs text-slate-500 font-mono">
          /wasm/web-ifc.wasm • GeometryEngine2Dto3D
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
  boqData?: Blueprint2DCoordinateElement[]
}

export default function BIMViewer(props: BIMViewerProps) {
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
