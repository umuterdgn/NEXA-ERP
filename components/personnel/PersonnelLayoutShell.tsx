"use client"

import { useState } from "react"
import PersonnelSidebar from "@/components/PersonnelSidebar"

export default function PersonnelLayoutShell({ children }: { children: React.ReactNode }) {
  const [isCollapsed, setIsCollapsed] = useState(false)

  return (
    <>
      <PersonnelSidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
      <main
        className={`transition-all duration-300 pt-20 p-6 lg:pt-8 lg:p-8 ${
          isCollapsed ? "lg:ml-20" : "lg:ml-64"
        }`}
      >
        {children}
      </main>
    </>
  )
}
