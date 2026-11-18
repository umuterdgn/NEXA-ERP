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

  const desktopSpacerWidth = isCollapsed ? 80 : sidebarWidth

  return (
    <div className="flex h-screen w-full overflow-hidden relative bg-slate-50 dark:bg-[#0A0F1C]">
      <AdminSidebar
        isCollapsed={isCollapsed}
        setIsCollapsed={setIsCollapsed}
        sidebarWidth={sidebarWidth}
        setSidebarWidth={setSidebarWidth}
      />
      {/* Desktop spacer matching fixed sidebar width exactly - prevents sidebar overlap & hydration jump */}
      <div
        aria-hidden="true"
        className="hidden md:block shrink-0 transition-[width] duration-200"
        style={{ width: `${desktopSpacerWidth}px` }}
      />
      <main className="flex-1 min-w-0 h-full overflow-y-auto overflow-x-hidden bg-slate-50 dark:bg-[#0A0F1C]">
        <div className="p-3 sm:p-5 lg:p-6 pt-16 md:pt-6 min-h-full w-full max-w-full overflow-x-hidden">
          {children}
        </div>
      </main>
    </div>
  )
}
