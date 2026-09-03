/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * This code is the property of NXA Software.
 */

"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

export async function updateProjectBimModel(projectId: string, ifcModelUrl: string) {
  try {
    await prisma.project.update({
      where: { id: projectId },
      data: { ifcModelUrl }
    })
    
    revalidatePath(`/admin/projects/${projectId}`)
    return { success: true }
  } catch (error) {
    console.error("Failed to update project BIM model:", error)
    return { success: false, error: "Failed to update project" }
  }
}
