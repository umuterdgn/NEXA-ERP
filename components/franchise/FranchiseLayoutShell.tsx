"use client"
/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Franchise Layout Shell Component - Viewport Overflow & Sidebar Fix
 */

import React, { useState } from "react"
import FranchiseSidebar from "./Sidebar"

export default function FranchiseLayoutShell({ children }: { children: React.ReactNode }) {
  const [isCollapsed, setIsCollapsed] = useState(false)

  return (
    <div className="flex h-screen overflow-hidden bg-slate-950 text-slate-100 w-full">
      <FranchiseSidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
      <main
        className={`flex-1 h-screen overflow-y-auto w-full transition-all duration-300 p-6 ${
          isCollapsed ? "lg:ml-20" : "lg:ml-64"
        }`}
      >
        {children}
      </main>
    </div>
  )
}
