"use client"
/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Personel İş Yükü (Driver Workload) Widget
 */

import React from "react"
import { Users } from "lucide-react"

export interface DriverWorkload {
  id: string
  name: string
  fullName?: string
  initial?: string
  shipmentCount?: number
  remainingKm?: number
  workloadPercent: number
  status?: "Optimum" | "Normal" | "Kritik" | "Dolu" | string
  statusText?: string
}

interface DriverWorkloadWidgetProps {
  driverWorkloads: DriverWorkload[]
}

export default function DriverWorkloadWidget({ driverWorkloads }: DriverWorkloadWidgetProps) {
  return (
    <div className="bg-gradient-to-br from-orange-900/20 to-amber-900/20 rounded-xl p-6 border border-orange-500/30">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-12 h-12 bg-orange-500/20 rounded-lg flex items-center justify-center">
          <Users className="w-6 h-6 text-orange-400" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-white">Personel İş Yükü</h2>
          <p className="text-slate-400 text-sm">Aktif DRIVER rolü günlük kapasite analizi</p>
        </div>
      </div>

      <div>
        {driverWorkloads && driverWorkloads.length > 0 ? (
          driverWorkloads.map((driver) => {
            const isOptimum =
              driver.status === "Optimum" ||
              (driver.workloadPercent <= 30 && driver.status !== "Kritik" && driver.status !== "Dolu")
            const isDolu =
              driver.status === "Kritik" ||
              driver.status === "Dolu" ||
              driver.workloadPercent >= 80

            // Kapasite (Optimum/Dolu) etiketlerini şık Tailwind Badge'leri ile vurgula
            const badgeClass = isOptimum
              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-1 rounded-md text-xs"
              : isDolu
              ? "bg-rose-500/10 text-rose-400 border border-rose-500/20 px-2 py-1 rounded-md text-xs"
              : "bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-1 rounded-md text-xs"

            const badgeText = isOptimum ? "Optimum" : isDolu ? "Dolu" : (driver.status || "Normal")

            const initial =
              driver.initial ||
              (driver.name ? driver.name.trim().charAt(0).toUpperCase() : "Ş")

            return (
              // Her şoför için ayrı bir kart (card): bg-gray-800/50 rounded-lg p-3 mb-3 border border-gray-700/50
              <div
                key={driver.id}
                className="bg-gray-800/50 rounded-lg p-3 mb-3 border border-gray-700/50"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2.5">
                    {/* Şoför adının yanına baş harfinden oluşan yuvarlak bir Avatar (Örn: E ve O) */}
                    <div className="w-8 h-8 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center justify-center font-bold text-xs uppercase shadow-sm">
                      {initial}
                    </div>
                    <div>
                      <span className="text-white font-medium text-sm">{driver.name}</span>
                      {driver.shipmentCount !== undefined && (
                        <span className="text-xs text-slate-400 ml-2">
                          ({driver.shipmentCount} sevkiyat{driver.remainingKm !== undefined ? `, ${driver.remainingKm} km kalan` : ""})
                        </span>
                      )}
                    </div>
                  </div>
                  {/* Kapasite Badge */}
                  <span className={`font-medium ${badgeClass}`}>
                    {badgeText}
                  </span>
                </div>

                {/* İlerleme çubuğunu (Progress Bar) daha ince (h-2) ve belirgin bir renkle (bg-blue-500) */}
                <div className="flex items-center gap-2 mt-2">
                  <div className="flex-1 bg-gray-700/60 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-blue-500 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, Math.max(5, driver.workloadPercent))}%` }}
                    />
                  </div>
                  <span className="text-xs font-semibold text-slate-300">
                    %{driver.workloadPercent}
                  </span>
                </div>

                {driver.statusText && (
                  <p className="text-slate-400 text-xs mt-1.5">{driver.statusText}</p>
                )}
              </div>
            )
          })
        ) : (
          <div className="text-center py-6 text-slate-500 text-sm">
            Aktif şoför iş yükü verisi bulunamadı.
          </div>
        )}
      </div>
    </div>
  )
}
