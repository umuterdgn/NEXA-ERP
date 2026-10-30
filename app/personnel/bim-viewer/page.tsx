import dynamic from "next/dynamic"
import { Loader2 } from "lucide-react"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

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

// ADIM 3: Personel Portalı - BIM Viewer Otomasyonu (Server Component)
export default async function PersonnelBimViewerPage() {
  const session = await auth()

  let personnel = null
  if (session?.user?.id) {
    personnel = await prisma.personel.findUnique({
      where: { userId: session.user.id },
      include: { project: true }
    })
  }

  // E-posta ile eşleşme yedek kontrolü
  if (!personnel && session?.user?.email) {
    personnel = await prisma.personel.findFirst({
      where: { email: session.user.email },
      include: { project: true }
    })
  }

  const userRole = ((session?.user?.role as string) || "").toUpperCase()
  // Normal saha personeli için IFC/GLB yükleme butonu gizlenir, sadece Admin görebilir
  const isPrivileged = userRole === "ADMIN" || userRole === "SUPER_ADMIN"
  const hideUpload = !isPrivileged

  const project = personnel?.project
  const modelUrl = project?.bimModelUrl || project?.ifcModelUrl || null
  const projectName = project?.title || project?.name || null
  const hasAssignedProject = Boolean(personnel?.projectId || project)

  return (
    <BimModelViewer
      modelUrl={modelUrl}
      projectName={projectName}
      hideUpload={hideUpload}
      hasAssignedProject={hasAssignedProject}
    />
  )
}
