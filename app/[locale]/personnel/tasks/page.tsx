/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * This code is the property of NXA Software.
 */

import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { PersonnelTasksClient } from "./client"

export default async function PersonnelTasksPage() {
  const session = await auth()
  
  if (!session) {
    redirect("/login")
  }

  const userRole = session.user?.role as string
  const isPersonnel = userRole === "STAFF" || userRole === "WORKER"

  if (!isPersonnel) {
    redirect("/admin")
  }

  // Fetch personnel data
  const personnel = await (prisma as any).personel.findFirst({
    where: {
      userId: session.user.id
    }
  })

  if (!personnel) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-white">Personel kaydı bulunamadı</div>
      </div>
    )
  }

  // Fetch assigned work orders
  const workOrders = await (prisma as any).workOrder.findMany({
    where: {
      assignedToId: personnel.id
    },
    include: {
      project: true
    },
    orderBy: { createdAt: "desc" }
  })

  return <PersonnelTasksClient workOrders={workOrders} />
}
