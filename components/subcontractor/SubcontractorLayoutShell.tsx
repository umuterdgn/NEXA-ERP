"use client"

import { useState } from "react"
import SubcontractorSidebar from "@/components/subcontractor/SubcontractorSidebar"

export default function SubcontractorLayoutShell({ children }: { children: React.ReactNode }) {
  const [isCollapsed, setIsCollapsed] = useState(false)

  return (
    <>
      <SubcontractorSidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
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
