/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Field Personnel Work Orders / Assigned Tasks Page
 */

import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { getMyWorkOrders } from "@/app/actions/tasks"
import WorkOrdersClient from "./WorkOrdersClient"

export const dynamic = "force-dynamic"

export default async function WorkOrdersPage() {
  // getServerSession / auth ile giriş yapan kullanıcının kimliğini al
  const session = await auth()

  if (!session?.user) {
    redirect("/login")
  }

  const userId = session.user.id
  const result = await getMyWorkOrders(userId)
  const initialWorkOrders = result.success ? result.workOrders : []

  return (
    <WorkOrdersClient
      initialWorkOrders={initialWorkOrders}
      userName={session.user.name || "Saha Personeli"}
    />
  )
}
