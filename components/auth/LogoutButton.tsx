"use client"
/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 */

import React from "react"
import { signOut } from "next-auth/react"
import { LogOut } from "lucide-react"

interface LogoutButtonProps {
  className?: string
  label?: string
}

export default function LogoutButton({ 
  className = "flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-800 bg-slate-900/60 hover:bg-slate-800 text-xs font-semibold text-slate-300 hover:text-white transition-colors",
  label = "Güvenli Çıkış"
}: LogoutButtonProps) {
  return (
    <button
      onClick={() => signOut({ callbackUrl: "/login" })}
      className={className}
      type="button"
    >
      <LogOut className="w-3.5 h-3.5" />
      <span>{label}</span>
    </button>
  )
}
