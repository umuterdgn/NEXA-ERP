import { auth } from "@/lib/auth"
import { getPersonnelAssignedBim } from "@/actions/bim"
import PersonnelBimClient from "./PersonnelBimClient"

export const dynamic = "force-dynamic"

// Personel Portalı - 3D Federated BIM Görüntüleyici (Prisma Senkron)
export default async function PersonnelBimViewerPage() {
  const session = await auth()
  const userId = session?.user?.id
  const userEmail = session?.user?.email || undefined

  const { project, models } = await getPersonnelAssignedBim(userId, userEmail)

  return <PersonnelBimClient project={project} models={models} />
}
