/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * This code is the property of NXA Software.
 */

import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

// Yardımcı fonksiyon: Yetki kontrolü
function hasPermission(user: any, permission: string): boolean {
  if (!user) return false
  if (user.role === "SUPER_ADMIN") return true
  
  const permissions = user.permissions
  if (!Array.isArray(permissions)) return false
  
  // Check if permission exists in either string format or object format
  return permissions.some((perm: any) => {
    if (typeof perm === 'string') {
      return perm === permission
    }
    if (perm && typeof perm === 'object' && perm.page) {
      return perm.page === permission
    }
    return false
  })
}

async function createInventoryHistory(inventoryId: string, action: string, quantity?: number, description?: string, personnelId?: string, userId?: string) {
  try {
    await prisma.inventoryHistory.create({
      data: {
        inventoryId,
        action,
        quantity,
        description,
        personnelId,
        userId
      }
    })
  } catch (error) {
    console.error("Error creating inventory history:", error)
  }
}

export async function GET() {
  try {
    const session = await auth()
    
    // Debug: Log session info
    console.log("=== INVENTORY API GET DEBUG ===")
    console.log("SESSION EXISTS:", !!session)
    console.log("SESSION USER ROLE:", session?.user?.role)
    console.log("==================================")
    
    if (!session) {
      console.log("❌ No session found")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (!session.user) {
      console.log("❌ No user in session")
      return NextResponse.json({ error: "Unauthorized - No user" }, { status: 401 })
    }

    // Fallback: Check only role for SUPER_ADMIN and ADMIN
    const role = session.user.role
    console.log("🔍 Checking role:", role)
    
    if (role !== "SUPER_ADMIN" && role !== "ADMIN") {
      console.log("❌ Permission denied for role:", role)
      return NextResponse.json({ error: "Forbidden - Insufficient permissions" }, { status: 403 })
    }
    
    console.log("✅ Permission granted for role:", role)

    const inventory = await prisma.inventory.findMany({
      include: {
        project: true,
        assignments: {
          where: { returnedAt: null },
          include: {
            personel: true
          }
        }
      },
      orderBy: { name: 'asc' }
    })
    return NextResponse.json(inventory)
  } catch (error) {
    console.error("Error fetching inventory:", error)
    return NextResponse.json({ error: "Stok bilgileri getirilirken hata oluştu" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth()
    
    // Debug: Log session info
    console.log("=== INVENTORY API POST DEBUG ===")
    console.log("SESSION EXISTS:", !!session)
    console.log("SESSION USER:", session?.user)
    console.log("SESSION USER ROLE:", session?.user?.role)
    console.log("SESSION USER PERMISSIONS:", session?.user?.permissions)
    console.log("==================================")
    
    if (!session) {
      console.log("❌ No session found")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (!session.user) {
      console.log("❌ No user in session")
      return NextResponse.json({ error: "Unauthorized - No user" }, { status: 401 })
    }

    // Fallback: Check only role for SUPER_ADMIN and ADMIN
    const role = session.user.role
    console.log("🔍 Checking role:", role)
    
    if (role !== "SUPER_ADMIN" && role !== "ADMIN") {
      console.log("❌ Permission denied for role:", role)
      return NextResponse.json({ error: "Forbidden - Insufficient permissions" }, { status: 403 })
    }
    
    console.log("✅ Permission granted for role:", role)

    const body = await request.json()
    const { name, category, quantity, unit, location, projectId, recordedBy } = body

    // Get a valid project ID
    const project = await prisma.project.findFirst()
    const validProjectId = projectId || project?.id || "default"

    // Get a valid admin user ID for the foreign key constraint
    const adminUser = await prisma.user.findFirst({
      where: { role: 'ADMIN' }
    })
    const validRecordedBy = recordedBy || adminUser?.id

    if (!validRecordedBy) {
      return NextResponse.json({ error: "Geçerli bir admin kullanıcısı bulunamadı" }, { status: 400 })
    }

    const item = await prisma.inventory.create({
      data: {
        name,
        type: "IN",
        category,
        quantity: parseFloat(quantity),
        unit,
        location,
        projectId: validProjectId,
        recordedBy: validRecordedBy
      }
    })

    // Create history record
    await createInventoryHistory(
      item.id,
      "CREATED",
      parseFloat(quantity),
      `Malzeme oluşturuldu: ${name}`,
      undefined,
      validRecordedBy
    )

    return NextResponse.json(item)
  } catch (error) {
    console.error("Error creating inventory item:", error)
    return NextResponse.json({ error: "Malzeme eklenirken hata oluştu" }, { status: 500 })
  }
}
