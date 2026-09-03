/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * This code is the property of NXA Software.
 */

import { Package, AlertTriangle, Search, Filter, Wrench, CheckCircle, XCircle } from "lucide-react"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import ReportEquipmentButton from "./ReportEquipmentButton"

// Durum konfigürasyonu
function getStatusConfig(status: string) {
  const statusConfigs: Record<string, { label: string; color: string; icon: any }> = {
    ACTIVE: { label: "Aktif", color: "text-green-400 bg-green-500/20", icon: CheckCircle },
    MAINTENANCE: { label: "Bakımda", color: "text-amber-400 bg-amber-500/20", icon: Wrench },
    RETURNED: { label: "İade Edildi", color: "text-slate-400 bg-slate-500/20", icon: XCircle },
    LOST: { label: "Kayıp", color: "text-red-400 bg-red-500/20", icon: XCircle }
  }
  return statusConfigs[status] || { label: status, color: "text-slate-400 bg-slate-500/20", icon: CheckCircle }
}

// Durum rengi
function getConditionColor(condition: string): string {
  const conditionColors: Record<string, string> = {
    "İyi": "text-green-400",
    "Orta": "text-amber-400",
    "Kötü": "text-red-400",
    "Arızalı": "text-red-400"
  }
  return conditionColors[condition] || "text-slate-400"
}

// Tarih formatlama (dd.MM.yyyy)
function formatDate(date: Date): string {
  const day = String(date.getDate()).padStart(2, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const year = date.getFullYear()
  return `${day}.${month}.${year}`
}

async function getEquipmentData(userId: string) {
  const personel = await prisma.personel.findFirst({
    where: { userId },
    select: { id: true }
  })

  if (!personel) {
    return {
      equipment: [],
      stats: { total: 0, active: 0, maintenance: 0 }
    }
  }

  // Personelin zimmetli ekipmanlarını çek
  const assignments = await prisma.inventoryAssignment.findMany({
    where: {
      personelId: personel.id,
      status: { in: ["ACTIVE", "MAINTENANCE"] }
    },
    include: {
      inventory: {
        select: {
          id: true,
          name: true,
          category: true,
          qrCode: true
        }
      }
    },
    orderBy: {
      assignedAt: "desc"
    }
  })

  // Ekipman verilerini formatla
  const equipment = assignments.map((assignment: any) => ({
    id: assignment.id,
    name: assignment.inventory.name,
    serialNumber: assignment.inventory.qrCode || "-",
    category: assignment.inventory.category || "-",
    assignedDate: formatDate(new Date(assignment.assignedAt)),
    status: assignment.status.toLowerCase(),
    condition: assignment.condition || "İyi"
  }))

  // İstatistikleri hesapla
  const total = equipment.length
  const active = equipment.filter((e: any) => e.status === "active").length
  const maintenance = equipment.filter((e: any) => e.status === "maintenance").length

  return {
    equipment,
    stats: { total, active, maintenance }
  }
}

export default async function EquipmentPage() {
  const session = await auth()
  
  if (!session) {
    redirect("/login")
  }

  const { equipment, stats } = await getEquipmentData(session.user.id)

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Zimmetli Ekipmanlar</h1>
        <p className="text-slate-400">Size zimmetlenen ekipmanları yönetin</p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-gradient-to-br from-blue-600/20 to-blue-700/20 border border-blue-500/30 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-2">
            <Package className="w-5 h-5 text-blue-400" />
            <p className="text-blue-300 text-sm">Toplam Ekipman</p>
          </div>
          <p className="text-3xl font-bold text-white">{stats.total}</p>
        </div>

        <div className="bg-gradient-to-br from-green-600/20 to-green-700/20 border border-green-500/30 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-2">
            <CheckCircle className="w-5 h-5 text-green-400" />
            <p className="text-green-300 text-sm">Aktif</p>
          </div>
          <p className="text-3xl font-bold text-white">{stats.active}</p>
        </div>

        <div className="bg-gradient-to-br from-amber-600/20 to-orange-700/20 border border-amber-500/30 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-2">
            <Wrench className="w-5 h-5 text-amber-400" />
            <p className="text-amber-300 text-sm">Bakımda</p>
          </div>
          <p className="text-3xl font-bold text-white">{stats.maintenance}</p>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="mb-6 flex items-center gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Ekipman ara..."
            className="w-full pl-12 pr-4 py-3 bg-slate-900 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
          />
        </div>
        <button className="flex items-center gap-2 px-4 py-3 bg-slate-900 border border-slate-800 rounded-xl text-slate-300 hover:bg-slate-800 transition-colors">
          <Filter className="w-4 h-4" />
          <span className="text-sm">Filtrele</span>
        </button>
        <ReportEquipmentButton equipment={equipment} />
      </div>

      {/* Equipment Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {equipment.map((item: any) => {
          const status = getStatusConfig(item.status.toUpperCase())
          const StatusIcon = status.icon
          return (
            <div
              key={item.id}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-6 hover:border-blue-500/50 transition-colors"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
                  <Package className="w-6 h-6 text-blue-400" />
                </div>
                <span className={`px-2 py-1 rounded-full text-xs flex items-center gap-1 ${status.color}`}>
                  <StatusIcon className="w-3 h-3" />
                  {status.label}
                </span>
              </div>

              <h3 className="text-lg font-semibold text-white mb-1">{item.name}</h3>
              <p className="text-slate-400 text-sm mb-3">{item.category}</p>

              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Seri No</span>
                  <span className="text-white font-mono text-xs">{item.serialNumber}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Teslim Tarihi</span>
                  <span className="text-white">{item.assignedDate}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Durum</span>
                  <span className={getConditionColor(item.condition)}>{item.condition}</span>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
