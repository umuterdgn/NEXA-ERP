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
    <div className="flex h-screen w-full overflow-hidden relative">
      <AdminSidebar
        isCollapsed={isCollapsed}
        setIsCollapsed={setIsCollapsed}
        sidebarWidth={sidebarWidth}
        setSidebarWidth={setSidebarWidth}
      />
      <main
        className={`relative z-0 flex-1 h-full overflow-y-auto bg-slate-50 dark:bg-[#0A0F1C] ml-0 w-full transition-all duration-300 ${
          isCollapsed ? "md:ml-20" : "md:ml-64"
        }`}
      >
        <div className="p-4 sm:p-6 lg:p-8 pt-16 md:pt-8 min-h-full w-full max-w-full">
          {children}
        </div>
      </main>
    </div>
  )
}
