import dynamic from "next/dynamic"
import { Loader2 } from "lucide-react"

// ADIM 1: SSR Kapatma (Dynamic Import ile WebGL ve Three.js SSR çökmelerini önleme)
const BimModelViewer = dynamic(() => import("@/components/bim/BimModelViewer"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[calc(100vh-180px)] min-h-[500px] bg-gray-900 rounded-lg flex flex-col items-center justify-center gap-3 text-slate-400">
      <Loader2 className="w-8 h-8 text-orange-400 animate-spin" />
      <span className="text-xs font-semibold text-slate-300">3D BIM WebGL Motoru Yükleniyor...</span>
    </div>
  ),
})

export default function PersonnelBimViewerPage() {
  return <BimModelViewer />
}
