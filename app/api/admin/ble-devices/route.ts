import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

// GET /api/admin/ble-devices
// Tüm zimmetli/kayıtlı IoT BLE cihazlarını döner
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get("projectId")

    const where: any = {}
    if (projectId) {
      where.projectId = projectId
    }

    const devices = await prisma.bleDevice.findMany({
      where,
      orderBy: { lastSeenAt: "desc" }
    })

    // Personel isimlerini eşleştirmek için personel kayıtlarını çekelim
    const assignedIds = devices.map(d => d.assignedTo).filter(Boolean) as string[]
    let personnelMap: Record<string, any> = {}

    if (assignedIds.length > 0) {
      const personels = await prisma.personel.findMany({
        where: { id: { in: assignedIds } },
        select: { id: true, name: true, personnelNo: true, department: true, position: true }
      })
      personnelMap = personels.reduce((acc, p) => {
        acc[p.id] = p
        return acc
      }, {} as Record<string, any>)
    }

    const enrichedDevices = devices.map(d => ({
      ...d,
      personnel: d.assignedTo ? personnelMap[d.assignedTo] || null : null
    }))

    return NextResponse.json(enrichedDevices)
  } catch (error) {
    console.error("BLE Devices GET error:", error)
    return NextResponse.json({ error: "Cihazlar listelenirken hata oluştu" }, { status: 500 })
  }
}

// POST /api/admin/ble-devices
// Personel için IoT Cihaz / Baret Zimmetle
export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 })
    }

    const body = await request.json()
    const { personnelId, deviceType, macAddress, projectId: reqProjectId } = body

    if (!personnelId || !deviceType || !macAddress) {
      return NextResponse.json(
        { error: "Personel seçimi, cihaz türü ve MAC adresi zorunludur" },
        { status: 400 }
      )
    }

    const normalizedMac = String(macAddress).trim().toUpperCase()

    // Personeli kontrol et
    const personel = await prisma.personel.findUnique({
      where: { id: personnelId },
      select: { id: true, name: true, currentSite: true, userId: true }
    })

    if (!personel) {
      return NextResponse.json({ error: "Seçilen personel bulunamadı" }, { status: 404 })
    }

    // Proje ID'sini belirle
    let targetProjectId = reqProjectId
    if (!targetProjectId) {
      const firstProject = await prisma.project.findFirst({ select: { id: true } })
      targetProjectId = firstProject?.id || "default-project"
    }

    // BleDevice tablosuna upsert et: MAC adresi varsa personeli ve cihaz türünü güncelle, yoksa yeni kayıt aç
    const bleDevice = await prisma.bleDevice.upsert({
      where: { macAddress: normalizedMac },
      create: {
        macAddress: normalizedMac,
        deviceType: deviceType.toUpperCase(),
        assignedTo: personnelId,
        userId: personel.userId || null,
        projectId: targetProjectId,
        batteryLevel: 100,
        lastSeenAt: new Date()
      },
      update: {
        deviceType: deviceType.toUpperCase(),
        assignedTo: personnelId,
        userId: personel.userId || null,
        projectId: targetProjectId,
        lastSeenAt: new Date()
      }
    })

    return NextResponse.json({
      success: true,
      message: `${personel.name} personeline ${deviceType} (${normalizedMac}) başarıyla zimmetlendi.`,
      device: bleDevice
    })
  } catch (error: any) {
    console.error("BLE Device Zimmetleme error:", error)
    return NextResponse.json(
      { error: error?.message || "Cihaz zimmetlenirken bir hata oluştu" },
      { status: 500 }
    )
  }
}
