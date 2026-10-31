"use client"

import dynamic from "next/dynamic"
import { Loader2 } from "lucide-react"

// 3D/WebGL bileşenini sadece tarayıcıda yüklenecek şekilde (ssr: false) çağırıyoruz
const BimModelViewer = dynamic(() => import("./BimModelViewer"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[calc(100vh-120px)] min-h-[500px] bg-gray-900 rounded-lg flex flex-col items-center justify-center gap-3 text-slate-400">
      <Loader2 className="w-8 h-8 text-orange-400 animate-spin" />
      <span className="text-xs font-semibold text-slate-300">3D BIM WebGL Motoru Yükleniyor...</span>
    </div>
  ),
})

export interface BimViewerWrapperProps {
  modelUrl?: string | null
  projectName?: string | null
  hideUpload?: boolean
  hasAssignedProject?: boolean
}

export default function BimViewerWrapper({
  modelUrl,
  projectName,
  hideUpload = false,
  hasAssignedProject = false,
}: BimViewerWrapperProps) {
  return (
    <BimModelViewer
      modelUrl={modelUrl}
      projectName={projectName}
      hideUpload={hideUpload}
      hasAssignedProject={hasAssignedProject}
    />
  )
}
