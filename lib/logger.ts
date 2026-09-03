/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * This code is the property of NXA Software.
 */
import { prisma } from "@/lib/prisma"

export async function logAction(action: string, details: string, user: string = "Sistem/Admin", affectedData?: string) {
  try {
    // Format the details to include user name and affected data
    let formattedDetails = details
    if (affectedData) {
      formattedDetails = `${user}, ${affectedData}`
    }

    await prisma.systemLog.create({
      data: { 
        action, 
        details: formattedDetails, 
        user 
      }
    })
  } catch (error) {
    console.error("Log yazılamadı:", error)
  }
}

// Helper function for personnel operations
export async function logPersonnelAction(action: string, userName: string, personnelName: string, details?: string) {
  const affectedData = `${personnelName} adlı personeli ${action.toLowerCase()}${details ? ` - ${details}` : ''}`
  await logAction(action, affectedData, userName)
}

// Helper function for equipment operations
export async function logEquipmentAction(action: string, userName: string, equipmentName: string, details?: string) {
  const affectedData = `${equipmentName} adlı demirbaşı ${action.toLowerCase()}${details ? ` - ${details}` : ''}`
  await logAction(action, affectedData, userName)
}

// Helper function for project operations
export async function logProjectAction(action: string, userName: string, projectName: string, details?: string) {
  const affectedData = `${projectName} adlı projeyi ${action.toLowerCase()}${details ? ` - ${details}` : ''}`
  await logAction(action, affectedData, userName)
}

// Helper function for financial operations
export async function logFinancialAction(action: string, userName: string, amount: number, description?: string) {
  const affectedData = `${amount.toLocaleString('tr-TR')} ₺ ${description ? `(${description})` : ''} tutarında işlem ${action.toLowerCase()}`
  await logAction(action, affectedData, userName)
}
