"use client"
/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Client wrapper for ARViewer with ssr: false
 */

import dynamic from "next/dynamic"

const ARViewer = dynamic(() => import("@/components/ARViewer"), {
  ssr: false,
  loading: () => (
    <div className="fixed inset-0 bg-slate-950 flex flex-col items-center justify-center p-6 text-center z-50">
      <div className="w-14 h-14 border-4 border-cyan-500/20 border-t-cyan-400 rounded-full animate-spin mb-4 shadow-[0_0_20px_rgba(6,182,212,0.5)]" />
      <h3 className="text-white font-semibold text-lg mb-1">AR Sahada Modu Yükleniyor</h3>
      <p className="text-slate-400 text-xs">Kamera ve 3D motor hazırlanıyor...</p>
    </div>
  ),
})

interface ARViewerClientProps {
  project: {
    id: string
    name?: string | null
    title?: string | null
    bimModelUrl?: string | null
    ifcModelUrl?: string | null
  }
  modelUrl: string
}

export default function ARViewerClient({ project, modelUrl }: ARViewerClientProps) {
  return <ARViewer project={project} modelUrl={modelUrl} />
}
