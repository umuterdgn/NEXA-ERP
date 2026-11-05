"use client"
/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Nexa ERP - Çoklu Tema Geçiş Bileşeni (Koyu / Açık / Siyah-Beyaz)
 */

import React, { useState, useEffect, useRef } from "react"
import { useTheme } from "next-themes"
import { Sun, Moon, Contrast, Check } from "lucide-react"
import toast from "react-hot-toast"

interface ThemeToggleProps {
  variant?: "dropdown" | "pills" | "icon"
  className?: string
}

export default function ThemeToggle({ variant = "dropdown", className = "" }: ThemeToggleProps) {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  if (!mounted) {
    return (
      <div className={`w-9 h-9 rounded-lg bg-slate-100 dark:bg-slate-800 animate-pulse ${className}`} />
    )
  }

  const currentTheme = theme || "dark"

  const handleSelectTheme = (newTheme: "dark" | "light" | "monochrome") => {
    setTheme(newTheme)
    setIsOpen(false)
    if (newTheme === "monochrome") {
      toast("Siyah-Beyaz (Güneş Altı & WCAG) modu aktif", { icon: "☀️" })
    } else if (newTheme === "light") {
      toast.success("Açık (Light) tema aktif")
    } else {
      toast.success("Koyu (Dark) tema aktif")
    }
  }

  const cycleTheme = () => {
    if (currentTheme === "dark") handleSelectTheme("light")
    else if (currentTheme === "light") handleSelectTheme("monochrome")
    else handleSelectTheme("dark")
  }

  if (variant === "pills") {
    return (
      <div className={`flex items-center p-1 rounded-xl bg-slate-200/80 dark:bg-slate-800 border border-slate-300 dark:border-slate-700/60 ${className}`}>
        <button
          type="button"
          onClick={() => handleSelectTheme("dark")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            currentTheme === "dark"
              ? "bg-slate-900 text-white shadow-sm"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
          }`}
          title="Koyu Tema"
        >
          <Moon className="w-3.5 h-3.5" />
          <span>Koyu</span>
        </button>

        <button
          type="button"
          onClick={() => handleSelectTheme("light")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            currentTheme === "light"
              ? "bg-white text-slate-900 shadow-sm"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
          }`}
          title="Açık Tema"
        >
          <Sun className="w-3.5 h-3.5 text-amber-500" />
          <span>Açık</span>
        </button>

        <button
          type="button"
          onClick={() => handleSelectTheme("monochrome")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            currentTheme === "monochrome"
              ? "bg-black text-white ring-1 ring-white/50"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
          }`}
          title="Siyah-Beyaz (Güneş Altı)"
        >
          <Contrast className="w-3.5 h-3.5" />
          <span>Mono</span>
        </button>
      </div>
    )
  }

  if (variant === "icon") {
    return (
      <button
        type="button"
        onClick={cycleTheme}
        className={`w-9 h-9 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white flex items-center justify-center transition-colors shadow-sm ${className}`}
        title={`Tema Değiştir (Şu anki: ${currentTheme})`}
      >
        {currentTheme === "light" ? (
          <Sun className="w-4 h-4 text-amber-500" />
        ) : currentTheme === "monochrome" ? (
          <Contrast className="w-4 h-4 text-white" />
        ) : (
          <Moon className="w-4 h-4 text-blue-400" />
        )}
      </button>
    )
  }

  // Default: Dropdown Button
  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="h-9 px-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white flex items-center gap-1.5 transition-colors shadow-sm text-xs font-medium"
        title="Görünüm Teması"
      >
        {currentTheme === "light" ? (
          <Sun className="w-4 h-4 text-amber-500" />
        ) : currentTheme === "monochrome" ? (
          <Contrast className="w-4 h-4 text-white" />
        ) : (
          <Moon className="w-4 h-4 text-blue-400" />
        )}
        <span className="hidden sm:inline capitalize">
          {currentTheme === "monochrome" ? "Mono" : currentTheme === "light" ? "Açık" : "Koyu"}
        </span>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-1.5 shadow-xl z-50 animate-in fade-in slide-in-from-top-2">
          <div className="px-2 py-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            Görünüm Teması
          </div>

          <button
            type="button"
            onClick={() => handleSelectTheme("dark")}
            className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-semibold transition-colors ${
              currentTheme === "dark"
                ? "bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
                : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            <div className="flex items-center gap-2">
              <Moon className="w-4 h-4 text-blue-400" />
              <span>Koyu (Dark)</span>
            </div>
            {currentTheme === "dark" && <Check className="w-3.5 h-3.5" />}
          </button>

          <button
            type="button"
            onClick={() => handleSelectTheme("light")}
            className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-semibold transition-colors ${
              currentTheme === "light"
                ? "bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
                : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            <div className="flex items-center gap-2">
              <Sun className="w-4 h-4 text-amber-500" />
              <span>Açık (Light)</span>
            </div>
            {currentTheme === "light" && <Check className="w-3.5 h-3.5" />}
          </button>

          <button
            type="button"
            onClick={() => handleSelectTheme("monochrome")}
            className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-semibold transition-colors ${
              currentTheme === "monochrome"
                ? "bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
                : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            <div className="flex items-center gap-2">
              <Contrast className="w-4 h-4 text-white" />
              <span>Siyah-Beyaz (Güneş Altı)</span>
            </div>
            {currentTheme === "monochrome" && <Check className="w-3.5 h-3.5" />}
          </button>
        </div>
      )}
    </div>
  )
}

