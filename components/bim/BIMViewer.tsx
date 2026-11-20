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
const SUPPORTED_2D_BLUEPRINT_EXTENSIONS = [".pdf", ".dwg", ".dxf"]
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

export const DEFAULT_AI_EXTRUSION_COORDINATES: Blueprint2DCoordinateElement[] = [
  // MİMARİ DUVARLAR
  { id: "AI-M-01", eleman: "Dış Cephe Tuğla Duvarı (Kuzey)", elemanTipi: "Duvar", startX: -8, startY: -6, endX: 8, endY: -6, yukseklik_z: 3.2, height: 3.2, thickness: 0.25, baslangic: { x: -8, y: -6 }, bitis: { x: 8, y: -6 }, yukseklik: 3.2, kalinlik: 0.25, taban_kotu: 0, disiplin: "Mimari", poz_no: "15.220.1004" },
  { id: "AI-M-02", eleman: "Dış Cephe Tuğla Duvarı (Güney)", elemanTipi: "Duvar", startX: -8, startY: 6, endX: 8, endY: 6, yukseklik_z: 3.2, height: 3.2, thickness: 0.25, baslangic: { x: -8, y: 6 }, bitis: { x: 8, y: 6 }, yukseklik: 3.2, kalinlik: 0.25, taban_kotu: 0, disiplin: "Mimari", poz_no: "15.220.1004" },
  { id: "AI-M-03", eleman: "Dış Cephe Tuğla Duvarı (Batı)", elemanTipi: "Duvar", startX: -8, startY: -6, endX: -8, endY: 6, yukseklik_z: 3.2, height: 3.2, thickness: 0.25, baslangic: { x: -8, y: -6 }, bitis: { x: -8, y: 6 }, yukseklik: 3.2, kalinlik: 0.25, taban_kotu: 0, disiplin: "Mimari", poz_no: "15.220.1004" },
  { id: "AI-M-04", eleman: "Dış Cephe Tuğla Duvarı (Doğu)", elemanTipi: "Duvar", startX: 8, startY: -6, endX: 8, endY: 6, yukseklik_z: 3.2, height: 3.2, thickness: 0.25, baslangic: { x: 8, y: -6 }, bitis: { x: 8, y: 6 }, yukseklik: 3.2, kalinlik: 0.25, taban_kotu: 0, disiplin: "Mimari", poz_no: "15.220.1004" },
  { id: "AI-M-05", eleman: "Gazbeton İç Bölme Duvarı (Salon)", elemanTipi: "Duvar", startX: -2, startY: -6, endX: -2, endY: 2, yukseklik_z: 3.2, height: 3.2, thickness: 0.2, baslangic: { x: -2, y: -6 }, bitis: { x: -2, y: 2 }, yukseklik: 3.2, kalinlik: 0.2, taban_kotu: 0, disiplin: "Mimari", poz_no: "15.220.1004" },
  { id: "AI-M-06", eleman: "Gazbeton İç Bölme Duvarı (Yatak Odası - 15m2)", elemanTipi: "Duvar", startX: -2, startY: 2, endX: 8, endY: 2, yukseklik_z: 3.2, height: 3.2, thickness: 0.2, baslangic: { x: -2, y: 2 }, bitis: { x: 8, y: 2 }, yukseklik: 3.2, kalinlik: 0.2, taban_kotu: 0, disiplin: "Mimari", poz_no: "15.220.1004" },
  { id: "AI-M-07", eleman: "1. Kat Dış Cephe Duvarı (Kuzey)", elemanTipi: "Duvar", startX: -8, startY: -6, endX: 8, endY: -6, yukseklik_z: 3.2, height: 3.2, thickness: 0.25, baslangic: { x: -8, y: -6 }, bitis: { x: 8, y: -6 }, yukseklik: 3.2, kalinlik: 0.25, taban_kotu: 3.4, disiplin: "Mimari", poz_no: "15.220.1004" },
  { id: "AI-M-08", eleman: "1. Kat Dış Cephe Duvarı (Güney)", elemanTipi: "Duvar", startX: -8, startY: 6, endX: 8, endY: 6, yukseklik_z: 3.2, height: 3.2, thickness: 0.25, baslangic: { x: -8, y: 6 }, bitis: { x: 8, y: 6 }, yukseklik: 3.2, kalinlik: 0.25, taban_kotu: 3.4, disiplin: "Mimari", poz_no: "15.220.1004" },
  { id: "AI-M-09", eleman: "1. Kat Dış Cephe Duvarı (Batı)", elemanTipi: "Duvar", startX: -8, startY: -6, endX: -8, endY: 6, yukseklik_z: 3.2, height: 3.2, thickness: 0.25, baslangic: { x: -8, y: -6 }, bitis: { x: -8, y: 6 }, yukseklik: 3.2, kalinlik: 0.25, taban_kotu: 3.4, disiplin: "Mimari", poz_no: "15.220.1004" },
  { id: "AI-M-10", eleman: "1. Kat Dış Cephe Duvarı (Doğu)", elemanTipi: "Duvar", startX: 8, startY: -6, endX: 8, endY: 6, yukseklik_z: 3.2, height: 3.2, thickness: 0.25, baslangic: { x: 8, y: -6 }, bitis: { x: 8, y: 6 }, yukseklik: 3.2, kalinlik: 0.25, taban_kotu: 3.4, disiplin: "Mimari", poz_no: "15.220.1004" },
  { id: "AI-M-11", eleman: "1. Kat İç Bölme Duvarı", elemanTipi: "Duvar", startX: 2, startY: -6, endX: 2, endY: 6, yukseklik_z: 3.2, height: 3.2, thickness: 0.2, baslangic: { x: 2, y: -6 }, bitis: { x: 2, y: 6 }, yukseklik: 3.2, kalinlik: 0.2, taban_kotu: 3.4, disiplin: "Mimari", poz_no: "15.220.1004" },

  // STATİK TAŞIYICI SİSTEM
  { id: "AI-S-01", eleman: "C35/45 Radye Temel & Subasman Döşemesi", elemanTipi: "Döşeme", startX: -8.5, startY: 0, endX: 8.5, endY: 0, yukseklik_z: 0.4, height: 0.4, thickness: 13.0, baslangic: { x: -8.5, y: 0 }, bitis: { x: 8.5, y: 0 }, yukseklik: 0.4, kalinlik: 13.0, taban_kotu: -0.4, disiplin: "Statik", poz_no: "15.150.1005" },
  { id: "AI-S-02", eleman: "C35/45 1. Kat Betonarme Döşeme Tabliyesi", elemanTipi: "Döşeme", startX: -8.2, startY: 0, endX: 8.2, endY: 0, yukseklik_z: 0.25, height: 0.25, thickness: 12.4, baslangic: { x: -8.2, y: 0 }, bitis: { x: 8.2, y: 0 }, yukseklik: 0.25, kalinlik: 12.4, taban_kotu: 3.2, disiplin: "Statik", poz_no: "15.150.1005" },
  { id: "AI-S-03", eleman: "C35/45 Çatı Katı Betonarme Döşeme Tabliyesi", elemanTipi: "Döşeme", startX: -8.2, startY: 0, endX: 8.2, endY: 0, yukseklik_z: 0.25, height: 0.25, thickness: 12.4, baslangic: { x: -8.2, y: 0 }, bitis: { x: 8.2, y: 0 }, yukseklik: 0.25, kalinlik: 12.4, taban_kotu: 6.6, disiplin: "Statik", poz_no: "15.150.1005" },
  { id: "AI-S-04", eleman: "S01 Betonarme Kolon (50x50cm)", elemanTipi: "Kolon", startX: -7.8, startY: -5.8, endX: -7.3, endY: -5.8, yukseklik_z: 6.8, height: 6.8, thickness: 0.5, baslangic: { x: -7.8, y: -5.8 }, bitis: { x: -7.3, y: -5.8 }, yukseklik: 6.8, kalinlik: 0.5, taban_kotu: 0, disiplin: "Statik", poz_no: "15.160.1002" },
  { id: "AI-S-05", eleman: "S02 Betonarme Kolon (50x50cm)", elemanTipi: "Kolon", startX: 0, startY: -5.8, endX: 0.5, endY: -5.8, yukseklik_z: 6.8, height: 6.8, thickness: 0.5, baslangic: { x: 0, y: -5.8 }, bitis: { x: 0.5, y: -5.8 }, yukseklik: 6.8, kalinlik: 0.5, taban_kotu: 0, disiplin: "Statik", poz_no: "15.160.1002" },
  { id: "AI-S-06", eleman: "S03 Betonarme Kolon (50x50cm)", elemanTipi: "Kolon", startX: 7.3, startY: -5.8, endX: 7.8, endY: -5.8, yukseklik_z: 6.8, height: 6.8, thickness: 0.5, baslangic: { x: 7.3, y: -5.8 }, bitis: { x: 7.8, y: -5.8 }, yukseklik: 6.8, kalinlik: 0.5, taban_kotu: 0, disiplin: "Statik", poz_no: "15.160.1002" },
  { id: "AI-S-07", eleman: "S04 Betonarme Kolon (50x50cm)", elemanTipi: "Kolon", startX: -7.8, startY: 5.8, endX: -7.3, endY: 5.8, yukseklik_z: 6.8, height: 6.8, thickness: 0.5, baslangic: { x: -7.8, y: 5.8 }, bitis: { x: -7.3, y: 5.8 }, yukseklik: 6.8, kalinlik: 0.5, taban_kotu: 0, disiplin: "Statik", poz_no: "15.160.1002" },
  { id: "AI-S-08", eleman: "S05 Betonarme Kolon (50x50cm)", elemanTipi: "Kolon", startX: 0, startY: 5.8, endX: 0.5, endY: 5.8, yukseklik_z: 6.8, height: 6.8, thickness: 0.5, baslangic: { x: 0, y: 5.8 }, bitis: { x: 0.5, y: 5.8 }, yukseklik: 6.8, kalinlik: 0.5, taban_kotu: 0, disiplin: "Statik", poz_no: "15.160.1002" },
  { id: "AI-S-09", eleman: "S06 Betonarme Kolon (50x50cm)", elemanTipi: "Kolon", startX: 7.3, startY: 5.8, endX: 7.8, endY: 5.8, yukseklik_z: 6.8, height: 6.8, thickness: 0.5, baslangic: { x: 7.3, y: 5.8 }, bitis: { x: 7.8, y: 5.8 }, yukseklik: 6.8, kalinlik: 0.5, taban_kotu: 0, disiplin: "Statik", poz_no: "15.160.1002" },
  { id: "AI-S-10", eleman: "P01 TBDY-2018 Deprem Perdesi (30x240cm)", elemanTipi: "Perde", startX: -1.2, startY: 0, endX: 1.2, endY: 0, yukseklik_z: 6.8, height: 6.8, thickness: 0.35, baslangic: { x: -1.2, y: 0 }, bitis: { x: 1.2, y: 0 }, yukseklik: 6.8, kalinlik: 0.35, taban_kotu: 0, disiplin: "Statik", poz_no: "15.160.1002" },
  { id: "AI-S-11", eleman: "K101 Ana Taşıyıcı Kiriş (30/60cm)", elemanTipi: "Kiriş", startX: -7.8, startY: 0, endX: 7.8, endY: 0, yukseklik_z: 0.5, height: 0.5, thickness: 0.35, baslangic: { x: -7.8, y: 0 }, bitis: { x: 7.8, y: 0 }, yukseklik: 0.5, kalinlik: 0.35, taban_kotu: 2.75, disiplin: "Statik", poz_no: "15.150.1005" },
  { id: "AI-S-12", eleman: "K201 1. Kat Ana Taşıyıcı Kiriş (30/60cm)", elemanTipi: "Kiriş", startX: -7.8, startY: 0, endX: 7.8, endY: 0, yukseklik_z: 0.5, height: 0.5, thickness: 0.35, baslangic: { x: -7.8, y: 0 }, bitis: { x: 7.8, y: 0 }, yukseklik: 0.5, kalinlik: 0.35, taban_kotu: 6.15, disiplin: "Statik", poz_no: "15.150.1005" },

  // ELEKTRİK & ZAYIF AKIM
  { id: "AI-E-01", eleman: "E-POWR Kuvvetli Akım Ana Kablo Tavası (Zemin Kat)", elemanTipi: "Kablo Tavası", startX: -7, startY: -2.5, endX: 7, endY: -2.5, yukseklik_z: 0.18, height: 0.18, thickness: 0.35, baslangic: { x: -7, y: -2.5 }, bitis: { x: 7, y: -2.5 }, yukseklik: 0.18, kalinlik: 0.35, taban_kotu: 2.85, disiplin: "Elektrik", poz_no: "18.150.1003" },
  { id: "AI-E-02", eleman: "Yangın Algılama Hattı & Zayıf Akım Tavası (1. Kat)", elemanTipi: "Kablo Tavası", startX: -7, startY: 2.5, endX: 7, endY: 2.5, yukseklik_z: 0.18, height: 0.18, thickness: 0.35, baslangic: { x: -7, y: 2.5 }, bitis: { x: 7, y: 2.5 }, yukseklik: 0.18, kalinlik: 0.35, taban_kotu: 6.2, disiplin: "Elektrik", poz_no: "18.320.1008" },
  { id: "AI-E-03", eleman: "Düşey Elektrik Şaftı & Busbar Kanalı", elemanTipi: "Şaft", startX: -6.5, startY: -4.5, endX: -6.1, endY: -4.5, yukseklik_z: 6.5, height: 6.5, thickness: 0.4, baslangic: { x: -6.5, y: -4.5 }, bitis: { x: -6.1, y: -4.5 }, yukseklik: 6.5, kalinlik: 0.4, taban_kotu: 0, disiplin: "Elektrik", poz_no: "18.150.1003" },

  // MEKANİK / TESİSAT
  { id: "AI-T-01", eleman: "M-HVAC Galvaniz Havalandırma Kanalı (Zemin Kat)", elemanTipi: "Havalandırma Kanalı", startX: -7, startY: 3.5, endX: 7, endY: 3.5, yukseklik_z: 0.35, height: 0.35, thickness: 0.45, baslangic: { x: -7, y: 3.5 }, bitis: { x: 7, y: 3.5 }, yukseklik: 0.35, kalinlik: 0.45, taban_kotu: 2.65, disiplin: "Mekanik", poz_no: "19.200.1004" },
  { id: "AI-T-02", eleman: "M-PLUM Yangın Sprinkler & Temiz Su Boru Hattı (1. Kat)", elemanTipi: "Tesisat Borusu", startX: -7, startY: -3.5, endX: 7, endY: -3.5, yukseklik_z: 0.25, height: 0.25, thickness: 0.3, baslangic: { x: -7, y: -3.5 }, bitis: { x: 7, y: -3.5 }, yukseklik: 0.25, kalinlik: 0.3, taban_kotu: 6.05, disiplin: "Mekanik", poz_no: "19.450.1002" },
  { id: "AI-T-03", eleman: "Mekanik Tesisat Düşey Kolon Şaftı", elemanTipi: "Şaft", startX: 6.1, startY: -4.5, endX: 6.5, endY: -4.5, yukseklik_z: 6.5, height: 6.5, thickness: 0.4, baslangic: { x: 6.1, y: -4.5 }, bitis: { x: 6.5, y: -4.5 }, yukseklik: 6.5, kalinlik: 0.4, taban_kotu: 0, disiplin: "Mekanik", poz_no: "19.450.1002" },
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
  elements: Blueprint2DCoordinateElement[] = [],
  defaultDiscipline?: string
): {
  groupedByDiscipline: Record<
    "Mimari" | "Statik" | "Elektrik" | "Mekanik",
    Extruded3DBoxMeshData[]
  >
  counts: Record<"mimari" | "statik" | "elektrik" | "mekanik", number>
  allMeshes: Extruded3DBoxMeshData[]
} {
  const source = Array.isArray(elements) && elements.length > 0 ? elements : []

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

  source.forEach((el, idx) => {
    const startX = Number(el.startX ?? el.baslangic?.x ?? 0)
    const startY = Number(el.startY ?? el.baslangic?.y ?? 0)
    const endX = Number(el.endX ?? el.bitis?.x ?? 5)
    const endY = Number(el.endY ?? el.bitis?.y ?? 0)
    const height = Math.max(0.15, Number(el.yukseklik_z ?? el.height ?? el.yukseklik ?? 3.0))
    const depth = Math.max(0.15, Number(el.thickness ?? el.kalinlik ?? 0.25))
    const baseY = Number(el.baseElevation ?? el.taban_kotu ?? 0)

    const dx = endX - startX
    const dy = endY - startY
    const width = Math.max(0.4, Math.hypot(dx, dy))
    const angleY = -Math.atan2(dy, dx)

    const centerX = (startX + endX) / 2
    const centerY = baseY + height / 2
    const centerZ = (startY + endY) / 2

    const rawDisc = (el.disiplin || defaultDiscipline || "Mimari").toLowerCase()
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

    const elemLabel = el.eleman || el.elemanTipi || `Eleman_${idx + 1}`

    const meshData: Extruded3DBoxMeshData = {
      id: el.id || `EXT-3D-${idx + 1}`,
      meshName: `${disciplineGroup}_${elemLabel}`,
      eleman: elemLabel,
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
 * ADIM 2 & ADIM 3: R3F ile 2D'den 3D'ye Geometri Motoru (<GeometryEngine2Dto3D data={aiData} discipline={selectedDiscipline} />)
 */
export function GeometryEngine2Dto3D({
  data,
  discipline,
  layerVisibility = { mimari: true, statik: true, elektrik: true, mekanik: true },
  xRayOpacity = 100,
  onClick,
  onPointerDown,
}: {
  data: Blueprint2DCoordinateElement[]
  discipline?: string
  layerVisibility?: Record<"mimari" | "statik" | "elektrik" | "mekanik", boolean>
  xRayOpacity?: number
  onClick?: (e: any) => void
  onPointerDown?: (e: any) => void
}) {
  const { groupedByDiscipline } = React.useMemo(
    () => generate3DFrom2DData(data, discipline),
    [data, discipline]
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

export function isPdfOr2DBlueprintFile(
  url?: string | null,
  fileName?: string | null,
  fileType?: string | null
): boolean {
  const cleanUrl = (url || "").split("?")[0].split("#")[0].toLowerCase().trim()
  const cleanName = (fileName || "").split("?")[0].split("#")[0].toLowerCase().trim()
  const cleanType = (fileType || "").toLowerCase().replace(/^\./, "").trim()

  if (cleanType && ["pdf", "dwg", "dxf"].includes(cleanType)) {
    return true
  }
  if (
    SUPPORTED_2D_BLUEPRINT_EXTENSIONS.some(
      (ext) => cleanUrl.endsWith(ext) || cleanName.endsWith(ext)
    )
  ) {
    return true
  }
  return false
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

  // Uzantısı belirsiz URL'lerde (örn. UploadThing PDF URL) varsayılan olarak 3D loader çalıştırma
  return false
}

export function isAllowedViewerFile(
  url?: string | null,
  fileName?: string | null,
  fileType?: string | null
): boolean {
  return (
    isValid3DModelFile(url, fileName, fileType) ||
    isPdfOr2DBlueprintFile(url, fileName, fileType)
  )
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
  viewMode?: "MODEL_3D" | "EXTRUSION_2D_TO_3D"
  onViewModeChange?: (mode: "MODEL_3D" | "EXTRUSION_2D_TO_3D") => void
  models?: FederatedModelItem[]
  boqData?: Blueprint2DCoordinateElement[]
  aiData?: Blueprint2DCoordinateElement[]
  discipline?: string
  hasAiAnalysis?: boolean
  onTriggerAiAnalysis?: () => void
  onOpen2DViewer?: () => void
}

export default function BIMViewer(props: BIMViewerProps) {
  const validModels = React.useMemo(() => {
    if (!props.models || props.models.length === 0) return undefined
    return props.models.filter((m) => isValid3DModelFile(m.url, m.name))
  }, [props.models])

  return (
    <InternalBimViewer
      {...props}
      viewMode={props.viewMode}
      onViewModeChange={props.onViewModeChange}
      aiData={props.aiData}
      boqData={props.aiData || props.boqData}
      discipline={props.discipline}
      hasAiAnalysis={props.hasAiAnalysis}
      models={validModels}
    />
  )
}

export { type FederatedModelItem }
