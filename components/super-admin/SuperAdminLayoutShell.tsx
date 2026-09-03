"use client"

import { useState } from "react"
import SuperAdminSidebar from "@/app/super-admin/_components/SuperAdminSidebar"

export default function SuperAdminLayoutShell({ children }: { children: React.ReactNode }) {
  const [isCollapsed, setIsCollapsed] = useState(false)

  return (
    <>
      <SuperAdminSidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
      <main
        className={`transition-all duration-300 pt-20 p-6 lg:pt-6 lg:p-8 ${
          isCollapsed ? "lg:ml-20" : "lg:ml-64"
        }`}
      >
        {children}
      </main>
    </>
  )
}
