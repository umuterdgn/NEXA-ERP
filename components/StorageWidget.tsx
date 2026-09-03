"use client"
/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * This code is the property of NXA Software.
 */

import { HardDrive, AlertTriangle, Loader2 } from "lucide-react"
import { useState, useEffect } from "react"

export default function StorageWidget() {
  const [storageData, setStorageData] = useState<{ usedSpace: number; maxSpace: number; percentage: number } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStorageData()
  }, [])

  const fetchStorageData = async () => {
    try {
      const response = await fetch('/api/admin/storage')
      if (response.ok) {
        const data = await response.json()
        setStorageData(data)
      }
    } catch (error) {
      console.error('Failed to fetch storage data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
        <div className="flex items-center gap-2 mb-3">
          <Loader2 className="w-4 h-4 text-slate-400 animate-spin" />
          <span className="text-sm font-medium text-slate-300">Depolama Alanı</span>
        </div>
      </div>
    )
  }

  if (!storageData) {
    return (
      <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
        <div className="flex items-center gap-2 mb-3">
          <HardDrive className="w-4 h-4 text-slate-400" />
          <span className="text-sm font-medium text-slate-300">Depolama Alanı</span>
        </div>
        <div className="text-xs text-slate-500">Veri yüklenemedi</div>
      </div>
    )
  }

  const { usedSpace, maxSpace, percentage } = storageData
  const remainingSpace = maxSpace - usedSpace

  // Determine bar color based on usage
  let barColor = "bg-blue-500"
  let showWarning = false

  if (usedSpace > maxSpace * 0.95) {
    // Last 5% - critical
    barColor = "bg-red-500"
    showWarning = true
  } else if (percentage >= 80) {
    // 80-95% - warning
    barColor = "bg-orange-500"
  } else {
    // < 80% - normal
    barColor = "bg-blue-500"
  }

  return (
    <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
      <div className="flex items-center gap-2 mb-3">
        <HardDrive className="w-4 h-4 text-slate-400" />
        <span className="text-sm font-medium text-slate-300">Depolama Alanı</span>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-slate-700 rounded-full h-2 mb-2">
        <div
          className={`${barColor} h-2 rounded-full transition-all duration-300`}
          style={{ width: `${percentage}%` }}
        />
      </div>

      {/* Usage Text */}
      <div className="flex justify-between text-xs text-slate-400 mb-2">
        <span>{usedSpace.toFixed(1)} GB kullanıldı</span>
        <span>{maxSpace} GB toplam</span>
      </div>

      {/* Critical Warning */}
      {showWarning && (
        <div className="flex items-start gap-2 mt-2 p-2 bg-red-500/10 border border-red-500/30 rounded">
          <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-red-400">
            Kritik Seviye: Alanınız dolmak üzere. Lütfen sistem yöneticinizle iletişime geçin.
          </p>
        </div>
      )}
    </div>
  )
}
