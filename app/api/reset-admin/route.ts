/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * This code is the property of NXA Software.
 */

import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    // Hash the new password
    const hashedPassword = await bcrypt.hash('admin123', 10)

    // Upsert the admin user (update if exists, create if not)
    const updatedUser = await prisma.user.upsert({
      where: { email: 'admin@mahirbakay.com' },
      update: { 
        password: hashedPassword,
        role: 'ADMIN'
      },
      create: {
        email: 'admin@mahirbakay.com',
        name: 'Sistem Yöneticisi',
        password: hashedPassword,
        role: 'ADMIN'
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Admin şifresi admin123 olarak başarıyla sıfırlandı!',
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.name
      }
    })
  } catch (error) {
    console.error('Admin şifre sıfırlama hatası:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Admin şifresi sıfırlanırken bir hata oluştu',
        details: error instanceof Error ? error.message : 'Bilinmeyen hata'
      },
      { status: 500 }
    )
  }
}
