"use client"

import { useState, useEffect } from "react"
import AdminSidebar from "@/components/admin/Sidebar"

export default function AdminLayoutShell({ children }: { children: React.ReactNode }) {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [sidebarWidth, setSidebarWidth] = useState(260)

  useEffect(() => {
    try {
      const saved = localStorage.getItem("nexa_sidebar_width")
      if (saved) {
        const num = parseInt(saved, 10)
        if (!isNaN(num) && num >= 240 && num <= 480) {
          setSidebarWidth(num)
        }
      }
    } catch {}
  }, [])

  return (
    <div className="flex h-screen w-full overflow-hidden">
      <div className="flex-shrink-0 h-full">
        <AdminSidebar
          isCollapsed={isCollapsed}
          setIsCollapsed={setIsCollapsed}
          sidebarWidth={sidebarWidth}
          setSidebarWidth={setSidebarWidth}
        />
      </div>
      <main className="flex-1 h-full overflow-y-auto bg-slate-50 dark:bg-[#0A0F1C]">
        <div className="p-4 sm:p-6 lg:p-8 pt-16 lg:pt-8 min-h-full">
          {children}
        </div>
      </main>
    </div>
  )
}
