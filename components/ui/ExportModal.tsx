"use client"

/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Nexa ERP - Dinamik ve Genel Dışa Aktar (Export) Popup Modülü
 * xlsx ve jspdf desteği ile Excel, PDF ve CSV indirme sağlar.
 */

import React, { useState } from "react"
import {
  X,
  FileSpreadsheet,
  FileText,
  FileCode,
  Download,
  Calendar,
  Filter,
  CheckCircle2,
} from "lucide-react"
import toast from "react-hot-toast"
import * as XLSX from "xlsx"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"

export interface ExportColumn {
  key: string
  label: string
}

export interface ExportModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  data: any[]
  columns?: ExportColumn[]
  fileNamePrefix?: string
}

export default function ExportModal({
  isOpen,
  onClose,
  title = "Verileri Dışa Aktar",
  data = [],
  columns,
  fileNamePrefix = "Nexa_Export",
}: ExportModalProps) {
  const [dateRange, setDateRange] = useState<"LAST_7" | "THIS_MONTH" | "CUSTOM">("THIS_MONTH")
  const [startDate, setStartDate] = useState<string>(
    new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString().split("T")[0]
  )
  const [endDate, setEndDate] = useState<string>(new Date().toISOString().split("T")[0])
  const [filterType, setFilterType] = useState<"ALL" | "COMPLETED" | "ACTIVE">("ALL")
  const [format, setFormat] = useState<"XLSX" | "PDF" | "CSV">("XLSX")
  const [isExporting, setIsExporting] = useState(false)

  if (!isOpen) return null

  // 1. Veriyi Tarih ve Durum Filtrelerine Göre Süzelim
  const getFilteredData = () => {
    let result = [...data]

    // Durum Filtresi
    if (filterType === "COMPLETED") {
      result = result.filter(
        (item) =>
          item.status === "COMPLETED" ||
          item.status === "TAMAMLANDI" ||
          item.status === "DONE" ||
          item.status === "PASSED" ||
          item.healthStatus === "GREEN"
      )
    } else if (filterType === "ACTIVE") {
      result = result.filter(
        (item) =>
          item.status === "IN_PROGRESS" ||
          item.status === "DEVAM EDİYOR" ||
          item.status === "TODO" ||
          item.status === "BEKLİYOR" ||
          item.status === "ACTIVE"
      )
    }

    // Tarih Filtresi
    if (dateRange === "LAST_7") {
      const past7 = new Date(Date.now() - 7 * 24 * 3600 * 1000)
      result = result.filter((item) => {
        const itemDate = new Date(item.createdAt || item.date || item.dueDate || item.startDate || Date.now())
        return itemDate >= past7
      })
    } else if (dateRange === "CUSTOM") {
      const start = new Date(startDate)
      const end = new Date(endDate)
      end.setHours(23, 59, 59, 999)
      result = result.filter((item) => {
        const itemDate = new Date(item.createdAt || item.date || item.dueDate || item.startDate || Date.now())
        return itemDate >= start && itemDate <= end
      })
    }

    return result
  }

  // 2. Kolon Eşlemesi
  const effectiveColumns: ExportColumn[] =
    columns && columns.length > 0
      ? columns
      : data.length > 0
      ? Object.keys(data[0])
          .filter((k) => typeof data[0][k] !== "object")
          .slice(0, 8)
          .map((k) => ({
            key: k,
            label: k.charAt(0).toUpperCase() + k.slice(1),
          }))
      : [
          { key: "id", label: "ID" },
          { key: "name", label: "İsim" },
          { key: "status", label: "Durum" },
        ]

  // 3. İndirme Yürütme
  const handleExport = async () => {
    try {
      setIsExporting(true)
      const filtered = getFilteredData()
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19)
      const fileName = `${fileNamePrefix}_${timestamp}`

      // Tablo Düz verisi
      const flatRows = filtered.map((row) => {
        const obj: Record<string, any> = {}
        effectiveColumns.forEach((col) => {
          const val = row[col.key]
          obj[col.label] = typeof val === "object" ? JSON.stringify(val) : val ?? "-"
        })
        return obj
      })

      if (format === "XLSX") {
        // EXCEL (.xlsx)
        const worksheet = XLSX.utils.json_to_sheet(flatRows)
        const workbook = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(workbook, worksheet, "Rapor")
        XLSX.writeFile(workbook, `${fileName}.xlsx`)
        toast.success(`Excel dosyası (${fileName}.xlsx) başarıyla indirildi.`)
      } else if (format === "CSV") {
        // CSV
        const worksheet = XLSX.utils.json_to_sheet(flatRows)
        const csvContent = XLSX.utils.sheet_to_csv(worksheet)
        const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" })
        const url = URL.createObjectURL(blob)
        const link = document.createElement("a")
        link.href = url
        link.download = `${fileName}.csv`
        link.click()
        URL.revokeObjectURL(url)
        toast.success(`CSV dosyası (${fileName}.csv) başarıyla indirildi.`)
      } else if (format === "PDF") {
        // PDF (.pdf)
        const doc = new jsPDF("landscape")
        doc.setFontSize(16)
        doc.text(title, 14, 15)
        doc.setFontSize(10)
        doc.text(`Rapor Tarihi: ${new Date().toLocaleDateString("tr-TR")} • Kayıt Sayısı: ${filtered.length}`, 14, 22)

        const head = [effectiveColumns.map((c) => c.label)]
        const body = filtered.map((row) =>
          effectiveColumns.map((c) => {
            const val = row[c.key]
            return typeof val === "object" ? JSON.stringify(val) : String(val ?? "-")
          })
        )

        autoTable(doc, {
          head,
          body,
          startY: 28,
          theme: "grid",
          headStyles: { fillColor: [10, 122, 255] },
          styles: { fontSize: 8 },
        })

        doc.save(`${fileName}.pdf`)
        toast.success(`PDF belgesi (${fileName}.pdf) başarıyla indirildi.`)
      }

      onClose()
    } catch (err: any) {
      console.error("[ExportModal] Error:", err)
      toast.error(`Dışa aktarma hatası: ${err.message || "Bilinmeyen hata"}`)
    } finally {
      setIsExporting(false)
    }
  }

  const filteredCount = getFilteredData().length

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#161D2F] border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden">
        {/* Modal Başlığı */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">{title}</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Filtrelenmiş verileri tercih ettiğiniz formatta cihazınıza indirin.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Gövdesi */}
        <div className="p-6 space-y-5 text-sm">
          {/* 1. Tarih Aralığı */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-blue-500" />
              Tarih Aralığı
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setDateRange("LAST_7")}
                className={`py-2 px-3 rounded-xl text-xs font-semibold border transition ${
                  dateRange === "LAST_7"
                    ? "bg-blue-50 dark:bg-blue-900/30 border-blue-500 text-blue-600 dark:text-blue-400"
                    : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
                }`}
              >
                Son 7 Gün
              </button>
              <button
                type="button"
                onClick={() => setDateRange("THIS_MONTH")}
                className={`py-2 px-3 rounded-xl text-xs font-semibold border transition ${
                  dateRange === "THIS_MONTH"
                    ? "bg-blue-50 dark:bg-blue-900/30 border-blue-500 text-blue-600 dark:text-blue-400"
                    : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
                }`}
              >
                Bu Ay
              </button>
              <button
                type="button"
                onClick={() => setDateRange("CUSTOM")}
                className={`py-2 px-3 rounded-xl text-xs font-semibold border transition ${
                  dateRange === "CUSTOM"
                    ? "bg-blue-50 dark:bg-blue-900/30 border-blue-500 text-blue-600 dark:text-blue-400"
                    : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
                }`}
              >
                Özel Aralık
              </button>
            </div>

            {dateRange === "CUSTOM" && (
              <div className="grid grid-cols-2 gap-3 mt-3">
                <div>
                  <span className="text-[11px] text-slate-500 font-medium">Başlangıç:</span>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full mt-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <span className="text-[11px] text-slate-500 font-medium">Bitiş:</span>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full mt-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-900 dark:text-white"
                  />
                </div>
              </div>
            )}
          </div>

          {/* 2. Veri Türü / Filtre */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2 flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-blue-500" />
              Veri Durumu
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setFilterType("ALL")}
                className={`py-2 px-3 rounded-xl text-xs font-semibold border transition ${
                  filterType === "ALL"
                    ? "bg-blue-50 dark:bg-blue-900/30 border-blue-500 text-blue-600 dark:text-blue-400"
                    : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
                }`}
              >
                Tüm Kayıtlar
              </button>
              <button
                type="button"
                onClick={() => setFilterType("ACTIVE")}
                className={`py-2 px-3 rounded-xl text-xs font-semibold border transition ${
                  filterType === "ACTIVE"
                    ? "bg-blue-50 dark:bg-blue-900/30 border-blue-500 text-blue-600 dark:text-blue-400"
                    : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
                }`}
              >
                Aktif / Devam Eden
              </button>
              <button
                type="button"
                onClick={() => setFilterType("COMPLETED")}
                className={`py-2 px-3 rounded-xl text-xs font-semibold border transition ${
                  filterType === "COMPLETED"
                    ? "bg-blue-50 dark:bg-blue-900/30 border-blue-500 text-blue-600 dark:text-blue-400"
                    : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
                }`}
              >
                Tamamlananlar
              </button>
            </div>
          </div>

          {/* 3. Dışa Aktarma Formatı */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
              Dışa Aktarma Formatı
            </label>
            <div className="grid grid-cols-3 gap-3">
              {/* Excel */}
              <label
                onClick={() => setFormat("XLSX")}
                className={`flex flex-col items-center justify-center p-3 rounded-2xl border cursor-pointer transition ${
                  format === "XLSX"
                    ? "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-500 text-emerald-600 dark:text-emerald-400 shadow-sm"
                    : "border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                }`}
              >
                <FileSpreadsheet className="w-6 h-6 mb-1 text-emerald-500" />
                <span className="font-bold text-xs">Excel (XLSX)</span>
                <span className="text-[10px] text-slate-400">Elektronik Tablo</span>
              </label>

              {/* PDF */}
              <label
                onClick={() => setFormat("PDF")}
                className={`flex flex-col items-center justify-center p-3 rounded-2xl border cursor-pointer transition ${
                  format === "PDF"
                    ? "bg-red-50 dark:bg-red-950/30 border-red-500 text-red-600 dark:text-red-400 shadow-sm"
                    : "border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                }`}
              >
                <FileText className="w-6 h-6 mb-1 text-red-500" />
                <span className="font-bold text-xs">PDF Belgesi</span>
                <span className="text-[10px] text-slate-400">Yazdırılabilir</span>
              </label>

              {/* CSV */}
              <label
                onClick={() => setFormat("CSV")}
                className={`flex flex-col items-center justify-center p-3 rounded-2xl border cursor-pointer transition ${
                  format === "CSV"
                    ? "bg-blue-50 dark:bg-blue-950/30 border-blue-500 text-blue-600 dark:text-blue-400 shadow-sm"
                    : "border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                }`}
              >
                <FileCode className="w-6 h-6 mb-1 text-blue-500" />
                <span className="font-bold text-xs">CSV Metin</span>
                <span className="text-[10px] text-slate-400">Ham Veri</span>
              </label>
            </div>
          </div>

          {/* Önizleme Bilgisi */}
          <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl text-xs text-slate-600 dark:text-slate-300">
            <span>Dışa Aktarılacak Kayıt Sayısı:</span>
            <span className="font-bold text-slate-900 dark:text-white">
              {filteredCount} / {data.length} satır
            </span>
          </div>
        </div>

        {/* Modal Alt Kontrolleri */}
        <div className="flex items-center justify-end gap-3 p-5 bg-slate-50 dark:bg-slate-800/40 border-t border-slate-100 dark:border-slate-800/80">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
          >
            Vazgeç
          </button>
          <button
            type="button"
            onClick={handleExport}
            disabled={isExporting || filteredCount === 0}
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-600/20 transition"
          >
            <Download className="w-4 h-4" />
            {isExporting ? "Hazırlanıyor..." : "Dışa Aktar ve İndir"}
          </button>
        </div>
      </div>
    </div>
  )
}
