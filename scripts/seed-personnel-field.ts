/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Seed data for Chat, Camera Progress Attachments, QR Inventory Items, and Expense Claims
 */

import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

async function main() {
  console.log("🌱 Seeding Personnel Field Operations data (Chat, Progress, QR, Expenses)...")

  // Find users
  const adminUser = await prisma.user.findFirst({ where: { role: "ADMIN" } })
  const fieldUser =
    (await prisma.user.findFirst({ where: { role: "SITE_MANAGER" } })) ||
    (await prisma.user.findFirst({ where: { role: "STAFF" } })) ||
    adminUser

  const project = (await prisma.project.findFirst()) || { id: "default-proj" }

  if (!adminUser || !fieldUser) {
    console.warn("Users not found, skipping chat/expenses seed.")
    return
  }

  // 1. Seed Inventory Items for QR Consumption
  const sampleItems = [
    {
      materialName: "C30/37 Hazır Beton Katkısı",
      qrCode: "QR-CEM-50KG",
      quantity: 50,
      unit: "Torba",
      currentZone: "MAIN_WAREHOUSE",
      status: "IN_STOCK",
      projectId: project.id,
    },
    {
      materialName: "Ø16 Nervürlü İnşaat Demiri",
      qrCode: "QR-REBAR-16MM",
      quantity: 12,
      unit: "Ton",
      currentZone: "MAIN_WAREHOUSE",
      status: "IN_STOCK",
      projectId: project.id,
    },
    {
      materialName: "60x120 Porselen Granit Seramik",
      qrCode: "QR-CERAMIC-60x120",
      quantity: 180,
      unit: "m²",
      currentZone: "MAIN_WAREHOUSE",
      status: "IN_STOCK",
      projectId: project.id,
    },
    {
      materialName: "3x2.5 NYM Halogen-Free Antigron Kablo",
      qrCode: "QR-CABLE-3x25",
      quantity: 4,
      unit: "Makara",
      currentZone: "MAIN_WAREHOUSE",
      status: "IN_STOCK",
      projectId: project.id,
    },
  ]

  for (const item of sampleItems) {
    const existing = await prisma.inventoryItem.findUnique({ where: { qrCode: item.qrCode } })
    if (!existing) {
      await prisma.inventoryItem.create({ data: item })
    }
  }

  // 2. Seed Expense Claims
  const sampleExpenses = [
    {
      userId: fieldUser.id,
      projectId: project.id,
      expenseType: "FUEL",
      amount: 1450.0,
      receiptUrl: "https://images.unsplash.com/photo-1545454675-3531b543be5d?w=800",
      description: "Şantiye JCB kepçe ve jeneratör için 40 litre motorin alımı (Opet)",
      status: "PENDING",
    },
    {
      userId: fieldUser.id,
      projectId: project.id,
      expenseType: "MATERIAL",
      amount: 860.5,
      receiptUrl: "https://images.unsplash.com/photo-1581783898377-1c85bf937427?w=800",
      description: "Kalıp çivisi, bağ teli ve eldiven acil nalburiye tedariği (Koçtaş)",
      status: "APPROVED",
    },
    {
      userId: fieldUser.id,
      projectId: project.id,
      expenseType: "FOOD",
      amount: 620.0,
      receiptUrl: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800",
      description: "Gece beton dökümü mesaisi için 8 kişilik kumanya & içecek",
      status: "PAID",
    },
  ]

  for (const exp of sampleExpenses) {
    const existing = await prisma.expenseClaim.findFirst({
      where: { userId: exp.userId, description: exp.description },
    })
    if (!existing) {
      await prisma.expenseClaim.create({ data: exp })
    }
  }

  // 3. Seed Progress Attachments
  const sampleProgress = [
    {
      projectId: project.id,
      uploaderId: fieldUser.id,
      photoUrl: "https://images.unsplash.com/photo-1541888946425-d0fbb18615f3?w=800",
      description: "A Blok 3. Kat Kolon Kalıpları ve Paspayı Kontrolleri Tamamlandı",
      latitude: 41.0628,
      longitude: 28.9932,
    },
    {
      projectId: project.id,
      uploaderId: fieldUser.id,
      photoUrl: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=800",
      description: "Temel Su Yalıtımı ve Membran Bohçalama İmalatı Teslim Alındı",
      latitude: 41.0631,
      longitude: 28.9929,
    },
  ]

  for (const prog of sampleProgress) {
    const existing = await prisma.progressAttachment.findFirst({
      where: { projectId: prog.projectId, description: prog.description },
    })
    if (!existing) {
      await prisma.progressAttachment.create({ data: prog })
    }
  }

  // 4. Seed Chat Messages
  const sampleChat = [
    {
      senderId: fieldUser.id,
      content: "Merkez ofise selamlar, A Blok 3. kat tabliye donatısı tamamlandı. Numune laboratuvarı bekleniyor.",
      projectId: project.id,
      channelName: "Şantiye Saha Grubu",
    },
    {
      senderId: adminUser.id,
      content: "Harika Ahmet Bey, beton santraline saat 14:30 için onay verildi. Slump testlerini unutmayın.",
      projectId: project.id,
      channelName: "Şantiye Saha Grubu",
    },
  ]

  for (const msg of sampleChat) {
    const existing = await prisma.chatMessage.findFirst({
      where: { senderId: msg.senderId, content: msg.content },
    })
    if (!existing) {
      await prisma.chatMessage.create({ data: msg })
    }
  }

  console.log("✅ Personnel Field Operations seed tamamlandı.")
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
