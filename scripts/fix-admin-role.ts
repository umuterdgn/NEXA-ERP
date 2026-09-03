/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * This code is the property of NXA Software.
 */

import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

async function main() {
  console.log("Updating admin user role to SUPER_ADMIN...")
  
  // Find and update the first admin user
  const user = await prisma.user.findFirst({
    where: {
      email: "admin@mahirbakay.com"
    }
  })

  if (user) {
    const updated = await prisma.user.update({
      where: { id: user.id },
      data: { role: "SUPER_ADMIN" }
    })
    console.log("Updated user role:", updated.email, "->", updated.role)
  } else {
    console.log("Admin user not found, creating one...")
    
    const { default: bcrypt } = await import('bcryptjs')
    const hashedPassword = await bcrypt.hash("admin123", 10)
    
    const newUser = await prisma.user.create({
      data: {
        email: "admin@mahirbakay.com",
        password: hashedPassword,
        name: "Admin User",
        role: "SUPER_ADMIN",
        permissions: ["dashboard", "cms", "archive", "finance", "stock", "staff", "users", "INVENTORY"]
      }
    })
    console.log("Created admin user:", newUser.email, "with role:", newUser.role)
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })