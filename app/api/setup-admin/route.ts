import { NextResponse } from 'next/server';
import { PrismaClient, UserRole } from '@prisma/client';
import bcrypt from 'bcryptjs';

export const dynamic = 'force-dynamic';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const hashedPassword = await bcrypt.hash('nexa2026', 10);
    
    // Varsa aktif bir tenant bul (Superadmin tenant'a bağlı olmak zorunda değil ama şema istiyorsa ekliyoruz)
    const tenant = await prisma.tenant.findFirst({
      where: { isActive: true },
      select: { id: true },
    }).catch(() => null);

    const superadmin = await prisma.user.upsert({
      where: { email: 'superadmin@nxa.com.tr' },
      update: {
        password: hashedPassword,
        role: UserRole.SUPER_ADMIN,
        name: 'Nexa Superadmin',
        tenantId: tenant?.id || null,
        permissions: ['all'],
      },
      create: {
        email: 'superadmin@nxa.com.tr',
        password: hashedPassword,
        name: 'Nexa Superadmin',
        role: UserRole.SUPER_ADMIN,
        tenantId: tenant?.id || null,
        permissions: ['all'],
      },
    });

    return NextResponse.json({ 
      success: true, 
      message: "Superadmin hesabı Vercel üzerinden başarıyla oluşturuldu!", 
      email: superadmin.email,
      role: superadmin.role
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  } finally {
    await prisma.$disconnect().catch(() => null);
  }
}
