/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Driver & Logistics Real-Time Telemetry API (Canlı GPS Yayınlama)
 */

import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

export async function POST(req: Request) {
  try {
    const session = await auth()
    const body = await req.json()
    const { appointmentId, trackingToken, latitude, longitude, speed, heading, accuracy } = body

    if (typeof latitude !== "number" || typeof longitude !== "number") {
      return NextResponse.json(
        { error: "Geçersiz koordinatlar (latitude ve longitude zorunludur)." },
        { status: 400 }
      )
    }

    // 1. If user is logged in, log to LocationLog
    if (session?.user?.id) {
      try {
        await prisma.locationLog.create({
          data: {
            userId: session.user.id,
            tenantId: (session.user as any)?.tenantId || null,
            latitude,
            longitude,
            accuracy: typeof accuracy === "number" ? accuracy : null,
          },
        })
      } catch (logErr) {
        console.warn("LocationLog insert warning:", logErr)
      }
    }

    // 2. If appointmentId or trackingToken is provided, update or record on LogisticsAppointment
    if (appointmentId || trackingToken) {
      try {
        const appointment = await prisma.logisticsAppointment.findFirst({
          where: {
            OR: [
              ...(appointmentId ? [{ id: appointmentId }] : []),
              ...(trackingToken ? [{ trackingToken }] : []),
            ],
          },
        })

        if (appointment) {
          // If status is BEKLİYOR or SCHEDULED, we can update or keep notes with live coordinates
          const telemetryNote = `[GPS: ${latitude.toFixed(6)}, ${longitude.toFixed(6)} | Hız: ${speed ? Math.round(speed * 3.6) : 0} km/s | ${new Date().toLocaleTimeString("tr-TR")}]`
          await prisma.logisticsAppointment.update({
            where: { id: appointment.id },
            data: {
              notes: appointment.notes
                ? `${appointment.notes.split("\n[GPS:")[0]}\n${telemetryNote}`
                : telemetryNote,
            },
          })
        }
      } catch (appErr) {
        console.warn("LogisticsAppointment telemetry update warning:", appErr)
      }
    }

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      coordinates: { latitude, longitude, speed, heading, accuracy },
    })
  } catch (error: any) {
    console.error("Logistics Telemetry Error:", error)
    return NextResponse.json(
      { error: error.message || "Failed to record telemetry" },
      { status: 500 }
    )
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const appointmentId = searchParams.get("appointmentId")
    const trackingToken = searchParams.get("trackingToken")

    if (!appointmentId && !trackingToken) {
      return NextResponse.json({ error: "appointmentId veya trackingToken gerekli" }, { status: 400 })
    }

    const appointment = await prisma.logisticsAppointment.findFirst({
      where: {
        OR: [
          ...(appointmentId ? [{ id: appointmentId }] : []),
          ...(trackingToken ? [{ trackingToken }] : []),
        ],
      },
      include: {
        project: {
          select: { id: true, title: true, name: true, location: true },
        },
      },
    })

    if (!appointment) {
      return NextResponse.json({ error: "Randevu bulunamadı" }, { status: 404 })
    }

    return NextResponse.json({ appointment })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
