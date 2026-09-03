/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * This code is the property of NXA Software.
 */

import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { username, password, projectId } = body

    console.log("--- YENİ CHECK-IN İSTEĞİ ---")
    console.log("Gelen ID:", username)
    console.log("Proje ID:", projectId)

    // ŞEMA ANALİZİ SONUCU:
    // - grant-login API'si username'i Personel tablosuna kaydediyor
    // - AttendanceRecord, personelId ile Personel'e bağlı
    // - Doğru tablo: Personel

    // Personel tablosunda username, id veya nfcId ile ara (case-insensitive)
    const personnel = await (prisma as any).personel.findFirst({
      where: {
        OR: [
          {
            username: {
              equals: username as string,
              mode: 'insensitive'
            }
          },
          {
            id: username as string
          },
          {
            nfcId: username as string
          }
        ]
      }
    })

    console.log("Veritabanı Sonucu:", personnel ? "Bulundu" : "BULUNAMADI")
    console.log("Personel Detayları:", personnel ? { id: personnel.id, name: personnel.name, username: personnel.username } : null)

    if (!personnel) {
      console.error("❌ HATA: Personel veritabanında YOK. Aranan username:", username)
      return NextResponse.json(
        { success: false, error: "Kullanıcı bulunamadı!" },
        { status: 404 }
      )
    }

    console.log("✅ Personel Bulundu:", { id: personnel.id, name: personnel.name, username: personnel.username, userId: personnel.userId })

    // Linked User hesabı ile şifre doğrula
    if (personnel.userId) {
      const user = await (prisma as any).user.findUnique({
        where: { id: personnel.userId }
      })

      if (!user) {
        console.error("❌ HATA: Personel'e bağlı User hesabı bulunamadı. Personel ID:", personnel.id)
        return NextResponse.json(
          { success: false, error: "Kullanıcı hesabı bulunamadı!" },
          { status: 404 }
        )
      }

      const isPasswordValid = await bcrypt.compare(password, user.password)
      if (!isPasswordValid) {
        console.error("❌ HATA: Şifre geçersiz. Personel ID:", personnel.id)
        return NextResponse.json(
          { success: false, error: "Geçersiz şifre" },
          { status: 401 }
        )
      }

      console.log("✅ Şifre doğrulandı")
    } else {
      console.error("❌ HATA: Bu personel için giriş izni tanımlı değil (userId null). Personel ID:", personnel.id)
      return NextResponse.json(
        { success: false, error: "Bu personel için giriş izni tanımlı değil" },
        { status: 401 }
      )
    }

    // Bugünün tarihini al
    const today = new Date()
    const todayStr = today.toISOString().split('T')[0]

    console.log("📅 Bugünün tarihi:", todayStr)

    // Bugün için var olan kayıt kontrol et
    const existingRecord = await (prisma as any).attendanceRecord.findFirst({
      where: {
        personelId: personnel.id,
        projectId: projectId,
        date: new Date(todayStr)
      }
    })

    if (existingRecord) {
      console.log("📋 Mevcut kayıt bulundu:", { id: existingRecord.id, checkIn: existingRecord.checkIn, checkOut: existingRecord.checkOut })

      // Giriş var ama çıkış yoksa çıkış yap
      if (existingRecord.checkIn && !existingRecord.checkOut) {
        const updatedRecord = await (prisma as any).attendanceRecord.update({
          where: { id: existingRecord.id },
          data: {
            checkOut: new Date()
          }
        })

        console.log("✅ Çıkış yapıldı:", updatedRecord.id)
        return NextResponse.json({
          success: true,
          message: "Çıkış yapıldı",
          record: updatedRecord
        })
      }

      // İkisi de varsa yeni giriş yap
      const newRecord = await (prisma as any).attendanceRecord.create({
        data: {
          personelId: personnel.id,
          projectId: projectId,
          date: new Date(todayStr),
          checkIn: new Date(),
          checkOut: null,
          dayMultiplier: 1
        }
      })

      console.log("✅ Yeni giriş yapıldı (mevcut kayıt vardı):", newRecord.id)
      return NextResponse.json({
        success: true,
        message: "Giriş yapıldı",
        record: newRecord
      })
    }

    // Yeni yoklama kaydı oluştur
    const newRecord = await (prisma as any).attendanceRecord.create({
      data: {
        personelId: personnel.id,
        projectId: projectId,
        date: new Date(todayStr),
        checkIn: new Date(),
        checkOut: null,
        dayMultiplier: 1
      }
    })

    console.log("✅ Yeni yoklama kaydı oluşturuldu:", newRecord.id)

    return NextResponse.json({
      success: true,
      message: "Giriş yapıldı",
      record: newRecord
    })
  } catch (error) {
    console.error("❌ YOKLAMA API HATASI:", error)
    return NextResponse.json(
      { success: false, error: "İşlem sırasında hata oluştu" },
      { status: 500 }
    )
  }
}
