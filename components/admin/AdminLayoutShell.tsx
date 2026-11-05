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
    <>
      <AdminSidebar
        isCollapsed={isCollapsed}
        setIsCollapsed={setIsCollapsed}
        sidebarWidth={sidebarWidth}
        setSidebarWidth={setSidebarWidth}
      />
      <main
        style={{
          ["--admin-sidebar-margin" as any]: `${isCollapsed ? 80 : sidebarWidth}px`,
        }}
        className="transition-all duration-150 pt-20 p-6 lg:pt-6 lg:p-8 lg:ml-[var(--admin-sidebar-margin)]"
      >
        {children}
      </main>
    </>
  )
}
