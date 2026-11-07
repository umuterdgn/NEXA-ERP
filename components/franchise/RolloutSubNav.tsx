"use client"
/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Rollout Sub-Navigation Header - Unified tab bar for Franchise Rollout Modules
 */

import React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Kanban,
  Box,
  FileCheck2,
  ClipboardCheck,
  MapPin,
  Sparkles,
  ChevronRight,
  ShieldCheck,
  AlertTriangle,
} from "lucide-react"

interface RolloutSubNavProps {
  activeTab?: "board" | "ffe" | "legal" | "punch-list" | "map"
  alertCount?: number
}

export default function RolloutSubNav({ activeTab, alertCount = 0 }: RolloutSubNavProps) {
  const pathname = usePathname()

  const tabs = [
    {
      key: "board",
      href: "/franchise/rollout/board",
      label: "Rollout Kanban & Stage-Gate",
      subLabel: "6 Aşamalı Onay Kapıları",
      icon: Kanban,
      badge: "Stage-Gate",
    },
    {
      key: "ffe",
      href: "/franchise/rollout/ffe",
      label: "FF&E Demirbaş Lojistiği",
      subLabel: "Ekipman & Canlı Harita",
      icon: Box,
      badge: "Lojistik",
    },
    {
      key: "legal",
      href: "/franchise/rollout/legal",
      label: "Resmi İzinler & Abonelik",
      subLabel: "Kritik Yol (CPM) Alarmı",
      icon: FileCheck2,
      badge: "Kritik Yol",
      alert: alertCount > 0,
    },
    {
      key: "punch-list",
      href: "/franchise/rollout/punch-list",
      label: "Punch List & Pre-Opening",
      subLabel: "Mobil Kusur & Taşeron DÖF",
      icon: ClipboardCheck,
      badge: "Açılış Kilidi",
    },
    {
      key: "map",
      href: "/franchise/rollout-map",
      label: "Türkiye Şube Haritası",
      subLabel: "GIS Coğrafi Dağılım",
      icon: MapPin,
    },
  ]

  const isCurrent = (key: string, href: string) => {
    if (activeTab) return activeTab === key
    return pathname.includes(href)
  }

  return (
    <div className="w-full bg-slate-900/80 border border-slate-800 rounded-2xl p-1.5 backdrop-blur-md shadow-xl mb-6">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-1.5">
        {tabs.map((tab) => {
          const active = isCurrent(tab.key, tab.href)
          const Icon = tab.icon

          return (
            <Link
              key={tab.key}
              href={tab.href}
              className={`relative flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all duration-200 text-left group ${
                active
                  ? "bg-gradient-to-r from-amber-500/20 via-amber-500/10 to-transparent border border-amber-500/40 text-amber-300 shadow-md shadow-amber-500/5"
                  : "bg-slate-950/40 border border-transparent hover:border-slate-700/60 hover:bg-slate-800/40 text-slate-400 hover:text-slate-200"
              }`}
            >
              <div
                className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                  active
                    ? "bg-amber-500 text-slate-950 font-bold shadow-lg shadow-amber-500/30"
                    : "bg-slate-800/80 text-slate-400 group-hover:text-amber-400 group-hover:bg-slate-800"
                }`}
              >
                <Icon className="w-4 h-4" />
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-semibold truncate tracking-tight">
                    {tab.label}
                  </span>
                  {tab.alert && (
                    <span className="inline-flex items-center px-1.5 py-0.2 text-[9px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/40 rounded-full animate-pulse">
                      Risk
                    </span>
                  )}
                </div>
                <div className="text-[10px] text-slate-400 truncate mt-0.5">
                  {tab.subLabel}
                </div>
              </div>

              {active && (
                <div className="absolute right-2 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-amber-400 shadow-sm shadow-amber-400" />
              )}
            </Link>
          )
        })}
      </div>
    </div>
  )
}
