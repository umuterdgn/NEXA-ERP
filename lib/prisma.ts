import { PrismaClient } from '@prisma/client'

const prismaClientSingleton = () => {
  return new PrismaClient()
}

type PrismaClientSingleton = ReturnType<typeof prismaClientSingleton>

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClientSingleton | undefined
}

export const prisma = globalForPrisma.prisma ?? prismaClientSingleton()

// Compatibility alias for Turkish/English spelling (personel <-> personnel)
if (!(prisma as any).personnel) {
  Object.defineProperty(prisma, 'personnel', {
    get() {
      return (prisma as any).personel
    },
    configurable: true,
    enumerable: true
  })
}

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

export default prisma