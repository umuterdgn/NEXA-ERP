"use client"
/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Federated Multi-Discipline BIM & IFC Viewer Component
 * SSR Disabled with Web-IFC WebAssembly (/wasm/) Support
 */

import dynamic from "next/dynamic"
import React from "react"
import { Loader2 } from "lucide-react"
import type { FederatedModelItem } from "@/app/[locale]/admin/projects/[id]/_components/BimViewer"

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
  return <InternalBimViewer {...props} />
}

export { type FederatedModelItem }

