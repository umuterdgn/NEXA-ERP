import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import BimViewerWrapper from "@/components/bim/BimViewerWrapper"

// Personel Portalı - BIM Viewer Otomasyonu (Server Component)
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
    <BimViewerWrapper
      modelUrl={modelUrl}
      projectName={projectName}
      hideUpload={hideUpload}
      hasAssignedProject={hasAssignedProject}
    />
  )
}
