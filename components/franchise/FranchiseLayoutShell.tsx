"use client"
/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Franchise Layout Shell Component
 */

import React, { useState } from "react"
import FranchiseSidebar from "./Sidebar"

export default function FranchiseLayoutShell({ children }: { children: React.ReactNode }) {
  const [isCollapsed, setIsCollapsed] = useState(false)

  return (
    <>
      <FranchiseSidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
      <main
        className={`transition-all duration-300 min-h-screen bg-slate-950 text-slate-100 ${
          isCollapsed ? "lg:ml-20" : "lg:ml-64"
        }`}
      >
        {children}
      </main>
    </>
  )
}
