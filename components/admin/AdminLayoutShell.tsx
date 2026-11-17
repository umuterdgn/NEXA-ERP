"use client"

import { useState, useEffect } from "react"
import AdminSidebar from "@/components/admin/Sidebar"

export default function AdminLayoutShell({ children }: { children: React.ReactNode }) {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [sidebarWidth, setSidebarWidth] = useState(260)
  const [isDesktop, setIsDesktop] = useState(false)

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

    const checkDesktop = () => {
      setIsDesktop(window.innerWidth >= 768)
    }
    checkDesktop()
    window.addEventListener("resize", checkDesktop)
    return () => window.removeEventListener("resize", checkDesktop)
  }, [])

  const currentMarginLeft = isDesktop ? (isCollapsed ? 80 : sidebarWidth) : 0
  const currentContentWidth = isDesktop ? `calc(100% - ${currentMarginLeft}px)` : "100%"

  return (
    <div className="flex h-screen w-full overflow-hidden relative bg-slate-50 dark:bg-[#0A0F1C]">
      <AdminSidebar
        isCollapsed={isCollapsed}
        setIsCollapsed={setIsCollapsed}
        sidebarWidth={sidebarWidth}
        setSidebarWidth={setSidebarWidth}
      />
      <main
        style={{
          marginLeft: `${currentMarginLeft}px`,
          width: currentContentWidth,
          transition: "margin-left 0.2s ease, width 0.2s ease",
        }}
        className="relative z-0 flex-1 h-full overflow-y-auto bg-slate-50 dark:bg-[#0A0F1C]"
      >
        <div className="p-3 sm:p-5 lg:p-6 pt-16 md:pt-6 min-h-full w-full max-w-full">
          {children}
        </div>
      </main>
    </div>
  )
}
