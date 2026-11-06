"use client"

/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Nexa ERP - Standart Tablo Üst Barı: Arama Kutucuğu (Search Input) & Dışa Aktar (Export) Butonu
 */

import React, { useState } from "react"
import { Search, Download, X } from "lucide-react"
import ExportModal, { ExportColumn } from "./ExportModal"

export interface TableToolbarProps {
  searchValue: string
  onSearchChange: (value: string) => void
  searchPlaceholder?: string
  data: any[]
  columns?: ExportColumn[]
  title?: string
  fileNamePrefix?: string
  extraActions?: React.ReactNode
}

export default function TableToolbar({
  searchValue,
  onSearchChange,
  searchPlaceholder = "Tabloda ara...",
  data = [],
  columns,
  title = "Veri Listesi",
  fileNamePrefix = "Nexa_Tablo",
  extraActions,
}: TableToolbarProps) {
  const [isExportModalOpen, setIsExportModalOpen] = useState(false)

  return (
    <>
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 my-4">
        {/* Sol / Orta: Arama Kutucuğu */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={searchPlaceholder}
            className="w-full pl-10 pr-9 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition shadow-sm"
          />
          {searchValue ? (
            <button
              onClick={() => onSearchChange("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          ) : null}
        </div>

        {/* Sağ: Dışa Aktar Butonu & Ek Aksiyonlar */}
        <div className="flex items-center gap-2">
          {extraActions}
          <button
            type="button"
            onClick={() => setIsExportModalOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200 shadow-sm transition"
          >
            <Download className="w-4 h-4 text-blue-500" />
            <span>Dışa Aktar</span>
          </button>
        </div>
      </div>

      {/* Dışa Aktar Modal Popup */}
      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        title={`${title} - Dışa Aktar`}
        data={data}
        columns={columns}
        fileNamePrefix={fileNamePrefix}
      />
    </>
  )
}

