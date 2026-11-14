"use client"
/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Federated Multi-Discipline BIM & IFC Viewer Component
 * SSR Disabled with Web-IFC WebAssembly (/wasm/) Support & 3D File Format Guard
 */

import dynamic from "next/dynamic"
import React from "react"
import { Loader2, AlertTriangle, FileWarning } from "lucide-react"
import type { FederatedModelItem } from "@/app/[locale]/admin/projects/[id]/_components/BimViewer"

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

  // Açıkça 3D olmayan (.pdf, .jpg, .png vb.) uzantıları reddet
  if (NON_3D_EXTENSIONS.some((ext) => cleanUrl.endsWith(ext) || cleanName.endsWith(ext))) {
    return false
  }

  // Desteklenen 3D uzantılar (.ifc, .gltf, .glb)
  if (SUPPORTED_3D_EXTENSIONS.some((ext) => cleanUrl.endsWith(ext) || cleanName.endsWith(ext))) {
    return true
  }

  // Dosya adında uzantı varsa ve .ifc/.gltf/.glb değilse reddet
  if (cleanName && cleanName.includes(".")) {
    return SUPPORTED_3D_EXTENSIONS.some((ext) => cleanName.endsWith(ext))
  }

  // URL son segmentinde uzantı varsa kontrol et
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
          Federated BIM & Web-IFC WASM Motoru Başlatılıyor...
        </span>
        <span className="text-xs text-slate-500 font-mono">
          /wasm/web-ifc.wasm
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
  const candidateUrl = (props.bimUrl || props.url || props.ifcUrl || "").trim()

  // Sadece desteklenen 3D modelleri (.ifc, .gltf, .glb) filtrele
  const validModels = React.useMemo(() => {
    if (!props.models || props.models.length === 0) return undefined
    return props.models.filter((m) => isValid3DModelFile(m.url, m.name))
  }, [props.models])

  const hasInvalidCandidate =
    Boolean(candidateUrl) && !isValid3DModelFile(candidateUrl, props.fileName)

  // Eğer seçilen aktif dosya .pdf, .jpg, .png gibi 3D olmayan bir formatsa Canvas'ı hiç başlatma
  if (hasInvalidCandidate && (!validModels || validModels.length === 0)) {
    return (
      <div className="w-full h-full min-h-[600px] bg-slate-950 rounded-2xl border border-amber-500/40 flex flex-col items-center justify-center p-8 text-center shadow-2xl">
        <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-4 shadow-lg shadow-amber-500/10">
          <FileWarning className="w-8 h-8" />
        </div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-bold mb-3">
          <AlertTriangle className="w-3.5 h-3.5" />
          <span>Desteklenmeyen Dosya Formatı</span>
        </div>
        <h4 className="text-white font-bold text-lg mb-2">
          3D Görüntüleyici Başlatılamadı
        </h4>
        <p className="text-amber-200/90 text-sm font-semibold max-w-md mb-2 leading-relaxed">
          Bu dosya bir 3D model değildir. Lütfen .ifc, .gltf veya .glb uzantılı bir dosya seçin.
        </p>
        <p className="text-slate-400 text-xs max-w-md">
          PDF paftaları ve 2B görseller 3D WebGL / IFC motorunda açılamaz. Bu dosyaları &quot;Proje Evrakları / Paftalar&quot; bölümünden görüntüleyebilirsiniz.
        </p>
      </div>
    )
  }

  const safeUrl = hasInvalidCandidate ? (validModels?.[0]?.url || null) : props.url
  const safeBimUrl = hasInvalidCandidate ? (validModels?.[0]?.url || null) : props.bimUrl
  const safeIfcUrl = hasInvalidCandidate ? (validModels?.[0]?.url || null) : props.ifcUrl

  return (
    <InternalBimViewer
      {...props}
      url={safeUrl}
      bimUrl={safeBimUrl}
      ifcUrl={safeIfcUrl}
      models={validModels}
    />
  )
}

export { type FederatedModelItem }
