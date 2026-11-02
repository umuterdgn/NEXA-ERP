"use server"

/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Lojistik & Şoför Yönetimi Server Actions
 */

import { prisma } from "@/lib/prisma"

export async function getDriversForSelect() {
  return await prisma.user.findMany({
    where: { role: 'DRIVER' }, // Sadece şoförleri getir
    select: { id: true, name: true }
  });
}
