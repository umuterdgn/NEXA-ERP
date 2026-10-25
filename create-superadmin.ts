import { PrismaClient, UserRole } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const hashedPassword = await bcrypt.hash('nexa2026', 10)

  // Aktif bir Tenant bağla (varsa)
  const tenant = await prisma.tenant.findFirst({
    where: { isActive: true },
    select: { id: true },
  }).catch(() => null)

  const superadmin = await prisma.user.upsert({
    where: { email: 'superadmin@nxa.com.tr' },
    update: {
      password: hashedPassword,
      role: UserRole.SUPER_ADMIN,
      name: 'Nexa Superadmin',
      tenantId: tenant?.id || null,
      permissions: [
        'all',
        'dashboard',
        'projects',
        'inspection',
        'personnel',
        'finance',
        'inventory',
        'subcontractors',
        'contracts',
        'procurement',
        'admin',
        'users',
      ],
    },
    create: {
      email: 'superadmin@nxa.com.tr',
      password: hashedPassword,
      name: 'Nexa Superadmin',
      role: UserRole.SUPER_ADMIN,
      tenantId: tenant?.id || null,
      permissions: [
        'all',
        'dashboard',
        'projects',
        'inspection',
        'personnel',
        'finance',
        'inventory',
        'subcontractors',
        'contracts',
        'procurement',
        'admin',
        'users',
      ],
    },
  })
  console.log('✅ Superadmin hesabı hazır: superadmin@nxa.com.tr / nexa2026 (Rol: SUPER_ADMIN)')
}

main()
  .catch((e) => {
    console.error('❌ Hata:', e.message || e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
