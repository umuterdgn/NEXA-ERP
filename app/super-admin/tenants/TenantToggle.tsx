"use client"
/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * This code is the property of NXA Software.
 */

import { useState } from "react"

interface TenantToggleProps {
  tenantId: string
  isActive: boolean
}

export default function TenantToggle({ tenantId, isActive }: TenantToggleProps) {
  const [currentStatus, setCurrentStatus] = useState(isActive)
  const [loading, setLoading] = useState(false)

  const handleToggle = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/super-admin/tenants/${tenantId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !currentStatus })
      })

      if (response.ok) {
        setCurrentStatus(!currentStatus)
      }
    } catch (error) {
      console.error("Failed to toggle tenant:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleToggle}
      disabled={loading}
      className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
        currentStatus
          ? "bg-red-600/20 text-red-400 hover:bg-red-600/30"
          : "bg-green-600/20 text-green-400 hover:bg-green-600/30"
      } ${loading ? "opacity-50 cursor-not-allowed" : ""}`}
    >
      {loading ? "..." : currentStatus ? "Pasife Al" : "Aktifleştir"}
    </button>
  )
}
