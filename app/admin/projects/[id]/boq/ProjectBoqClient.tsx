"use client"

/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Dinamik Keşif & Metraj (BoQ) İnteraktif DataGrid:
 * Hücre İçi Düzenleme (Inline Edit), Canlı KPI Hesaplama & Lojistik Entegrasyonu
 */

import React, { useState, useMemo, useTransition } from "react"
import Link from "next/link"
import {
  Calculator,
  Plus,
  Trash2,
  Package,
  Layers,
  Search,
  CheckCircle2,
  TrendingUp,
  Banknote,
  ArrowLeft,
  RefreshCw,
  Sparkles,
  Link2,
  Download,
  AlertCircle,
  Building2,
  Save,
  Check,
  ChevronDown,
  X
} from "lucide-react"
import {
  BoqPageData,
  BoqRowData,
  InventoryMaterialOption,
  updateBoqItem,
  createBoqItem,
  deleteBoqItem,
  seedBoqTemplate
} from "@/app/actions/boq"

interface ProjectBoqClientProps {
  initialData: BoqPageData
}

export default function ProjectBoqClient({ initialData }: ProjectBoqClientProps) {
  const [project] = useState(initialData.project)
  const [items, setItems] = useState<BoqRowData[]>(initialData.items)
  const [materials] = useState<InventoryMaterialOption[]>(initialData.materials)
  
  // UI States
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedUnit, setSelectedUnit] = useState<string>("ALL")
  const [editingCell, setEditingCell] = useState<{ id: string; field: "pozNo" | "description" | "unit" | "plannedQuantity" | "unitPrice" } | null>(null)
  const [editingValue, setEditingValue] = useState<string>("")
  const [materialSelectOpenId, setMaterialSelectOpenId] = useState<string | null>(null)
  const [materialSearchQuery, setMaterialSearchQuery] = useState("")
  
  const [isPending, startTransition] = useTransition()
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: "success" | "error" | "info" } | null>(null)
  const [savingId, setSavingId] = useState<string | null>(null)

  // 1. Canlı Reaktif KPI Hesaplamaları (Client-side Reactivity)
  const reactiveSummary = useMemo(() => {
    let totalPlannedAmount = 0
    let totalActualAmount = 0

    items.forEach((item) => {
      const planned = Number(item.plannedQuantity) || 0
      const price = Number(item.unitPrice) || 0
      const actual = Number(item.actualQuantity) || 0

      totalPlannedAmount += planned * price
      totalActualAmount += Math.min(actual, planned) * price
    })

    const remainingAmount = Math.max(0, totalPlannedAmount - totalActualAmount)
    const generalProgressPercent = totalPlannedAmount > 0
      ? Number(((totalActualAmount / totalPlannedAmount) * 100).toFixed(1))
      : 0

    return {
      totalPlannedAmount,
      totalActualAmount,
      remainingAmount,
      generalProgressPercent,
      itemCount: items.length,
    }
  }, [items])

  // Filtreleme
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchesSearch =
        item.pozNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.requiredMaterial?.materialName || "").toLowerCase().includes(searchTerm.toLowerCase())
      
      const matchesUnit = selectedUnit === "ALL" || item.unit === selectedUnit
      return matchesSearch && matchesUnit
    })
  }, [items, searchTerm, selectedUnit])

  const uniqueUnits = useMemo(() => {
    const set = new Set<string>()
    items.forEach((it) => set.add(it.unit))
    return Array.from(set)
  }, [items])

  // Bildirim gösterici
  const showToast = (text: string, type: "success" | "error" | "info" = "success") => {
    setStatusMessage({ text, type })
    setTimeout(() => {
      setStatusMessage(null)
    }, 3500)
  }

  // Hücre içi düzenlemeyi başlat
  const startEditing = (item: BoqRowData, field: "pozNo" | "description" | "unit" | "plannedQuantity" | "unitPrice") => {
    setEditingCell({ id: item.id, field })
    setEditingValue(String(item[field]))
  }

  // Hücre içi düzenlemeyi kaydet (Blur veya Enter)
  const saveEditing = async (item: BoqRowData) => {
    if (!editingCell || editingCell.id !== item.id) return

    const field = editingCell.field
    let newValue: any = editingValue.trim()

    if (field === "plannedQuantity" || field === "unitPrice") {
      const num = parseFloat(newValue.replace(",", "."))
      if (isNaN(num) || num < 0) {
        showToast("Lütfen geçerli pozitif bir sayı giriniz.", "error")
        setEditingCell(null)
        return
      }
      newValue = num
    }

    if (item[field] === newValue) {
      setEditingCell(null)
      return
    }

    // İstemci tarafında anında güncelle (Optimistic UI)
    const updatedItems = items.map((it) => {
      if (it.id === item.id) {
        const planned = field === "plannedQuantity" ? Number(newValue) : it.plannedQuantity
        const price = field === "unitPrice" ? Number(newValue) : it.unitPrice
        const totalPrice = Number((planned * price).toFixed(2))
        return {
          ...it,
          [field]: newValue,
          totalPrice,
        }
      }
      return it
    })
    setItems(updatedItems)
    setEditingCell(null)

    // Sunucuya gönder
    setSavingId(item.id)
    try {
      const res = await updateBoqItem(item.id, project.id, {
        [field]: newValue,
      })

      if (res.success) {
        showToast("İş kalemi ve hakediş tutarları otonom güncellendi.", "success")
      } else {
        showToast(res.error || "Güncelleme sırasında hata oluştu.", "error")
      }
    } catch (err: any) {
      showToast(err.message || "Bağlantı hatası", "error")
    } finally {
      setSavingId(null)
    }
  }

  // Bağlı Malzeme Seçimi
  const handleSelectMaterial = async (item: BoqRowData, material: InventoryMaterialOption | null) => {
    setMaterialSelectOpenId(null)
    setMaterialSearchQuery("")

    // Optimistic UI güncelleme
    setItems((prev) =>
      prev.map((it) => {
        if (it.id === item.id) {
          return {
            ...it,
            requiredMaterialId: material ? material.id : null,
            requiredMaterial: material
              ? {
                  id: material.id,
                  materialName: material.materialName,
                  name: material.name,
                  qrCode: material.qrCode,
                  quantity: material.quantity,
                  unit: material.unit,
                  currentZone: material.currentZone,
                  status: material.status,
                }
              : null,
          }
        }
        return it
      })
    )

    setSavingId(item.id)
    try {
      const res = await updateBoqItem(item.id, project.id, {
        requiredMaterialId: material ? material.id : null,
      })
      if (res.success) {
        showToast(
          material
            ? `Bu iş kalemi "${material.materialName}" stoğuna bağlandı.`
            : "Malzeme bağlantısı kaldırıldı.",
          "success"
        )
      } else {
        showToast(res.error || "Malzeme bağlanırken hata oluştu.", "error")
      }
    } catch (err: any) {
      showToast(err.message || "Bağlantı hatası", "error")
    } finally {
      setSavingId(null)
    }
  }

  // Yeni Satır Ekle
  const handleAddNewRow = async () => {
    startTransition(async () => {
      const newPozNo = `15.${Math.floor(100 + Math.random() * 900)}.${Math.floor(1000 + Math.random() * 9000)}`
      const res = await createBoqItem(project.id, {
        pozNo: newPozNo,
        description: "Yeni İmalat / İş Kalemi",
        unit: "m3",
        plannedQuantity: 100,
        unitPrice: 1500,
      })

      if (res.success && res.data) {
        setItems((prev) => [...prev, res.data as any])
        showToast("Yeni poz eklendi. Tablodan düzenleyebilirsiniz.", "success")
        // Yeni eklenen satırın poz no'sunu hemen düzenleme moduna al
        setEditingCell({ id: res.data.id, field: "description" })
        setEditingValue("Yeni İmalat / İş Kalemi")
      } else {
        showToast(res.error || "Yeni kalem eklenemedi.", "error")
      }
    })
  }

  // Satır Sil
  const handleDeleteRow = async (id: string, pozNo: string) => {
    if (!confirm(`"${pozNo}" kodlu poz tablodan silinsin mi?`)) return

    setItems((prev) => prev.filter((it) => it.id !== id))
    try {
      const res = await deleteBoqItem(id, project.id)
      if (res.success) {
        showToast(`${pozNo} poz silindi ve finans tabloları güncellendi.`, "info")
      } else {
        showToast(res.error || "Silme hatası", "error")
      }
    } catch (err: any) {
      showToast(err.message || "Silme hatası", "error")
    }
  }

  // Standart Şablon Doldur
  const handleSeedTemplate = () => {
    startTransition(async () => {
      const res = await seedBoqTemplate(project.id)
      if (res.success) {
        showToast("Standart inşaat poz şablonu başarıyla yüklendi.", "success")
        window.location.reload()
      } else {
        showToast(res.error || "Şablon yüklenirken hata oluştu.", "error")
      }
    })
  }

  // Excel / CSV Dışa Aktar
  const handleExportCSV = () => {
    if (items.length === 0) return
    const headers = ["Poz No", "İş Tanımı", "Birim", "Planlanan Miktar", "Birim Fiyat (TL)", "Toplam Keşif Bedeli (TL)", "Gerçekleşen Miktar", "Bağlı Malzeme"]
    const rows = items.map((it) => [
      `"${it.pozNo}"`,
      `"${it.description.replace(/"/g, '""')}"`,
      `"${it.unit}"`,
      it.plannedQuantity,
      it.unitPrice,
      it.totalPrice,
      it.actualQuantity,
      `"${it.requiredMaterial?.materialName || '-'}"`
    ])
    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + [headers.join(";"), ...rows.map(e => e.join(";"))].join("\n")
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement("a")
    link.setAttribute("href", encodedUri)
    link.setAttribute("download", `${project.name}_Kesif_Metraj_BoQ.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    showToast("CSV dosyası indirildi.", "info")
  }

  // Para formatlayıcı
  const formatTRY = (val: number) => {
    return new Intl.NumberFormat("tr-TR", {
      style: "currency",
      currency: "TRY",
      maximumFractionDigits: 0,
    }).format(val)
  }

  // Sayı formatlayıcı
  const formatNum = (val: number) => {
    return new Intl.NumberFormat("tr-TR", { maximumFractionDigits: 2 }).format(val)
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8 space-y-6">
      {/* Toast Bildirim Kutusu */}
      {statusMessage && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-2xl text-sm font-medium border animate-in fade-in slide-in-from-bottom-3 ${
            statusMessage.type === "success"
              ? "bg-emerald-950/90 text-emerald-200 border-emerald-500/40"
              : statusMessage.type === "error"
              ? "bg-rose-950/90 text-rose-200 border-rose-500/40"
              : "bg-blue-950/90 text-blue-200 border-blue-500/40"
          }`}
        >
          {statusMessage.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0" />
          )}
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* Header & Navigasyon */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
            <Link
              href={`/admin/projects/${project.id}`}
              className="hover:text-blue-400 transition-colors flex items-center gap-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>{project.name}</span>
            </Link>
            <span>/</span>
            <span className="text-slate-300 font-medium">Keşif, Metraj & BoQ DataGrid</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <Calculator className="w-6 h-6 text-blue-500" />
            <span>İnteraktif Keşif & Metraj (BoQ) Tablosu</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Hücre içi düzenlenebilir canlı metraj, birim fiyatlar ve lojistik depo malzeme eşleştirmeleri.
          </p>
        </div>

        {/* Aksiyon Butonları */}
        <div className="flex items-center flex-wrap gap-2.5">
          <Link
            href={`/admin/projects/${project.id}/progress`}
            className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg text-xs font-medium text-slate-300 hover:text-white transition-colors flex items-center gap-1.5"
          >
            <Layers className="w-3.5 h-3.5 text-indigo-400" />
            <span>Gantt & İlerleme Takibi</span>
          </Link>

          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg text-xs font-medium text-slate-300 hover:text-white transition-colors flex items-center gap-1.5"
            title="CSV olarak dışa aktar"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            <span>Dışa Aktar</span>
          </button>

          {items.length === 0 && (
            <button
              onClick={handleSeedTemplate}
              disabled={isPending}
              className="px-3.5 py-2 bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/40 rounded-lg text-xs font-medium text-indigo-300 transition-colors flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span>Standart Poz Şablonu Yükle</span>
            </button>
          )}

          <button
            onClick={handleAddNewRow}
            disabled={isPending}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs rounded-lg shadow-lg shadow-blue-500/20 transition-all flex items-center gap-1.5 active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Yeni Kalem Ekle</span>
          </button>
        </div>
      </div>

      {/* ADIM 2: CANLI REAKTİF KPI KARTLARI (Client-Side Reactivity) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Proje Toplam Keşif Bedeli */}
        <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 relative overflow-hidden backdrop-blur-sm group hover:border-slate-700 transition-all">
          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full blur-2xl pointer-events-none" />
          <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
            <span className="font-medium">Proje Toplam Keşif Bedeli</span>
            <Banknote className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-bold tracking-tight text-white mb-1">
            {formatTRY(reactiveSummary.totalPlannedAmount)}
          </div>
          <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
            <span>{reactiveSummary.itemCount} adet planlanan imalat kalemi</span>
          </div>
        </div>

        {/* 2. Gerçekleşen İmalat Bedeli */}
        <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 relative overflow-hidden backdrop-blur-sm group hover:border-slate-700 transition-all">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none" />
          <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
            <span className="font-medium text-emerald-400">Gerçekleşen İmalat Bedeli</span>
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold tracking-tight text-emerald-400 mb-1">
            {formatTRY(reactiveSummary.totalActualAmount)}
          </div>
          <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span>Hakedişi ve sahası onaylanmış toplam</span>
          </div>
        </div>

        {/* 3. Genel İlerleme % */}
        <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 relative overflow-hidden backdrop-blur-sm group hover:border-slate-700 transition-all">
          <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-2xl pointer-events-none" />
          <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
            <span className="font-medium">Genel İlerleme %</span>
            <span className="text-xs font-mono font-bold text-indigo-400">
              %{reactiveSummary.generalProgressPercent}
            </span>
          </div>
          <div className="text-2xl font-bold tracking-tight text-white mb-2">
            %{reactiveSummary.generalProgressPercent}
          </div>
          <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
            <div
              className="h-full bg-linear-to-r from-blue-500 to-indigo-500 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, Math.max(0, reactiveSummary.generalProgressPercent))}%` }}
            />
          </div>
        </div>

        {/* 4. Kalan Keşif Bedeli */}
        <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 relative overflow-hidden backdrop-blur-sm group hover:border-slate-700 transition-all">
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full blur-2xl pointer-events-none" />
          <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
            <span className="font-medium">Kalan Keşif Bakiyesi</span>
            <span className="text-[11px] font-mono text-amber-400">Yapılacak</span>
          </div>
          <div className="text-2xl font-bold tracking-tight text-amber-400 mb-1">
            {formatTRY(reactiveSummary.remainingAmount)}
          </div>
          <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            <span>Finansal bütçe riski ve kalan imalat</span>
          </div>
        </div>
      </div>

      {/* Tablo Araç Çubuğu (Arama ve Birim Filtreleme) */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-900/50 p-3 rounded-xl border border-slate-800/80">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Poz No, İş Tanımı veya Malzeme Ara..."
            className="w-full pl-9 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 placeholder:text-slate-500 focus:outline-hidden focus:border-blue-500"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 overflow-x-auto">
          <span className="text-[11px] text-slate-500 shrink-0">Birim:</span>
          <button
            onClick={() => setSelectedUnit("ALL")}
            className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
              selectedUnit === "ALL"
                ? "bg-blue-600 text-white"
                : "bg-slate-950 text-slate-400 hover:text-white border border-slate-800"
            }`}
          >
            Tümü ({items.length})
          </button>
          {uniqueUnits.map((u) => (
            <button
              key={u}
              onClick={() => setSelectedUnit(u)}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                selectedUnit === u
                  ? "bg-blue-600 text-white"
                  : "bg-slate-950 text-slate-400 hover:text-white border border-slate-800"
              }`}
            >
              {u}
            </button>
          ))}
        </div>
      </div>

      {/* ADIM 2: HÜCRE İÇİ DÜZENLENEBİLİR İNTERAKTİF DATAGRID */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-950/80 border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                <th className="py-3.5 px-4 w-12 text-center">#</th>
                <th className="py-3.5 px-4 w-32">Poz No</th>
                <th className="py-3.5 px-4 min-w-[240px]">İş & İmalat Tanımı</th>
                <th className="py-3.5 px-4 w-24 text-center">Birim</th>
                <th className="py-3.5 px-4 w-36 text-right">
                  <span className="border-b border-dashed border-slate-600 cursor-help" title="Çift tıklayarak düzenleyebilirsiniz">
                    Planlanan Miktar
                  </span>
                </th>
                <th className="py-3.5 px-4 w-36 text-right">
                  <span className="border-b border-dashed border-slate-600 cursor-help" title="Çift tıklayarak düzenleyebilirsiniz">
                    Birim Fiyat (₺)
                  </span>
                </th>
                <th className="py-3.5 px-4 w-40 text-right bg-blue-950/20 text-blue-300">
                  Toplam Keşif (₺)
                </th>
                <th className="py-3.5 px-4 w-32 text-right">Gerçekleşen</th>
                <th className="py-3.5 px-4 min-w-[200px]">
                  <span className="flex items-center gap-1">
                    <Package className="w-3.5 h-3.5 text-amber-400" />
                    <span>Bağlı Malzeme (Lojistik)</span>
                  </span>
                </th>
                <th className="py-3.5 px-4 w-16 text-center">Sil</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-500">
                    <Package className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    <p className="text-sm font-medium">Bu kriterlere uygun poz bulunamadı.</p>
                    <p className="text-xs text-slate-600 mt-1">
                      Yeni bir kalem eklemek için yukarıdaki &quot;Yeni Kalem Ekle&quot; butonunu kullanabilirsiniz.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredItems.map((item, idx) => {
                  const isSaving = savingId === item.id
                  const isItemMaterialOpen = materialSelectOpenId === item.id

                  return (
                    <tr
                      key={item.id}
                      className="hover:bg-slate-800/40 transition-colors group select-none"
                    >
                      {/* Sıra No & Kayıt Göstergesi */}
                      <td className="py-3 px-4 text-center text-slate-500 font-mono text-[11px]">
                        {isSaving ? (
                          <RefreshCw className="w-3.5 h-3.5 text-blue-400 animate-spin mx-auto" />
                        ) : (
                          idx + 1
                        )}
                      </td>

                      {/* 1. Poz No (Inline Edit) */}
                      <td className="py-3 px-4 font-mono font-semibold text-slate-200">
                        {editingCell?.id === item.id && editingCell.field === "pozNo" ? (
                          <input
                            type="text"
                            autoFocus
                            value={editingValue}
                            onChange={(e) => setEditingValue(e.target.value)}
                            onBlur={() => saveEditing(item)}
                            onKeyDown={(e) => e.key === "Enter" && saveEditing(item)}
                            className="w-full px-2 py-1 bg-slate-950 border border-blue-500 rounded text-xs font-mono text-white focus:outline-hidden"
                          />
                        ) : (
                          <div
                            onDoubleClick={() => startEditing(item, "pozNo")}
                            className="cursor-pointer hover:text-blue-400 hover:underline flex items-center justify-between group/cell"
                            title="Düzenlemek için çift tıklayın"
                          >
                            <span>{item.pozNo}</span>
                          </div>
                        )}
                      </td>

                      {/* 2. Açıklama / İş Tanımı (Inline Edit) */}
                      <td className="py-3 px-4 text-slate-300">
                        {editingCell?.id === item.id && editingCell.field === "description" ? (
                          <input
                            type="text"
                            autoFocus
                            value={editingValue}
                            onChange={(e) => setEditingValue(e.target.value)}
                            onBlur={() => saveEditing(item)}
                            onKeyDown={(e) => e.key === "Enter" && saveEditing(item)}
                            className="w-full px-2 py-1 bg-slate-950 border border-blue-500 rounded text-xs text-white focus:outline-hidden"
                          />
                        ) : (
                          <div
                            onDoubleClick={() => startEditing(item, "description")}
                            className="cursor-pointer hover:text-blue-300 group/cell truncate max-w-md"
                            title="Düzenlemek için çift tıklayın"
                          >
                            <span>{item.description}</span>
                          </div>
                        )}
                      </td>

                      {/* 3. Birim (Inline Edit) */}
                      <td className="py-3 px-4 text-center">
                        {editingCell?.id === item.id && editingCell.field === "unit" ? (
                          <select
                            autoFocus
                            value={editingValue}
                            onChange={(e) => {
                              setEditingValue(e.target.value)
                            }}
                            onBlur={() => saveEditing(item)}
                            className="px-2 py-1 bg-slate-950 border border-blue-500 rounded text-xs text-white focus:outline-hidden"
                          >
                            <option value="m3">m3</option>
                            <option value="Ton">Ton</option>
                            <option value="m2">m2</option>
                            <option value="mt">mt</option>
                            <option value="Adet">Adet</option>
                            <option value="Kg">Kg</option>
                            <option value="Paket">Paket</option>
                            <option value="Takım">Takım</option>
                          </select>
                        ) : (
                          <span
                            onDoubleClick={() => startEditing(item, "unit")}
                            className="cursor-pointer px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-[11px] hover:bg-slate-700"
                            title="Değiştirmek için çift tıklayın"
                          >
                            {item.unit}
                          </span>
                        )}
                      </td>

                      {/* 4. Planlanan Miktar (ÇİFT TIKLA İLE DÜZENLEME) */}
                      <td className="py-3 px-4 text-right font-mono font-medium">
                        {editingCell?.id === item.id && editingCell.field === "plannedQuantity" ? (
                          <input
                            type="number"
                            step="any"
                            autoFocus
                            value={editingValue}
                            onChange={(e) => setEditingValue(e.target.value)}
                            onBlur={() => saveEditing(item)}
                            onKeyDown={(e) => e.key === "Enter" && saveEditing(item)}
                            className="w-24 px-2 py-1 bg-slate-950 border border-blue-500 rounded text-xs text-right font-mono text-white focus:outline-hidden"
                          />
                        ) : (
                          <div
                            onDoubleClick={() => startEditing(item, "plannedQuantity")}
                            className="cursor-pointer hover:bg-blue-950/40 px-2 py-1 rounded transition-colors group/cell text-slate-200"
                            title="Çift tıklayarak miktarı değiştirin"
                          >
                            <span>{formatNum(item.plannedQuantity)}</span>
                          </div>
                        )}
                      </td>

                      {/* 5. Birim Fiyat (₺) (ÇİFT TIKLA İLE DÜZENLEME) */}
                      <td className="py-3 px-4 text-right font-mono font-medium">
                        {editingCell?.id === item.id && editingCell.field === "unitPrice" ? (
                          <input
                            type="number"
                            step="any"
                            autoFocus
                            value={editingValue}
                            onChange={(e) => setEditingValue(e.target.value)}
                            onBlur={() => saveEditing(item)}
                            onKeyDown={(e) => e.key === "Enter" && saveEditing(item)}
                            className="w-28 px-2 py-1 bg-slate-950 border border-blue-500 rounded text-xs text-right font-mono text-white focus:outline-hidden"
                          />
                        ) : (
                          <div
                            onDoubleClick={() => startEditing(item, "unitPrice")}
                            className="cursor-pointer hover:bg-blue-950/40 px-2 py-1 rounded transition-colors group/cell text-slate-200"
                            title="Çift tıklayarak birim fiyatı değiştirin"
                          >
                            <span>₺{formatNum(item.unitPrice)}</span>
                          </div>
                        )}
                      </td>

                      {/* 6. Toplam Keşif Bedeli (OTONOM HESAPLANAN SÜTUN) */}
                      <td className="py-3 px-4 text-right font-mono font-bold bg-blue-950/15 text-blue-300">
                        ₺{formatNum(item.totalPrice)}
                      </td>

                      {/* 7. Gerçekleşen Miktar & İlerleme */}
                      <td className="py-3 px-4 text-right">
                        <div className="font-mono text-emerald-400 font-semibold">
                          {formatNum(item.actualQuantity)} {item.unit}
                        </div>
                        <div className="w-16 ml-auto bg-slate-800 rounded-full h-1 mt-1 overflow-hidden">
                          <div
                            className="h-full bg-emerald-500 rounded-full"
                            style={{
                              width: `${Math.min(
                                100,
                                item.plannedQuantity > 0
                                  ? (item.actualQuantity / item.plannedQuantity) * 100
                                  : 0
                              )}%`,
                            }}
                          />
                        </div>
                      </td>

                      {/* 8. BAĞLI MALZEME (Lojistik InventoryItem Seçimi) */}
                      <td className="py-3 px-4 relative">
                        {item.requiredMaterial ? (
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => setMaterialSelectOpenId(isItemMaterialOpen ? null : item.id)}
                              className="px-2.5 py-1 rounded-lg bg-amber-950/40 border border-amber-500/30 text-amber-200 hover:border-amber-400 transition-colors flex items-center gap-1.5 text-[11px] truncate max-w-[200px]"
                              title="Bağlı stoğu değiştirmek için tıklayın"
                            >
                              <Package className="w-3 h-3 text-amber-400 shrink-0" />
                              <span className="truncate">
                                {item.requiredMaterial.materialName}
                              </span>
                              <ChevronDown className="w-3 h-3 text-amber-400 shrink-0" />
                            </button>
                            <button
                              onClick={() => handleSelectMaterial(item, null)}
                              className="p-1 hover:bg-slate-800 text-slate-500 hover:text-rose-400 rounded transition-colors"
                              title="Malzeme bağlantısını kaldır"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setMaterialSelectOpenId(isItemMaterialOpen ? null : item.id)}
                            className="px-2 py-1 rounded-md border border-dashed border-slate-700 hover:border-amber-500/60 text-slate-500 hover:text-amber-300 transition-all flex items-center gap-1 text-[11px]"
                          >
                            <Link2 className="w-3 h-3" />
                            <span>Malzeme Bağla</span>
                          </button>
                        )}

                        {/* Malzeme Seçim Menüsü (Searchable Select Popover) */}
                        {isItemMaterialOpen && (
                          <div className="absolute z-40 left-0 top-full mt-1 w-72 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-2.5 space-y-2 animate-in fade-in zoom-in-95">
                            <div className="flex items-center justify-between text-[11px] font-semibold text-slate-300 pb-1 border-b border-slate-800">
                              <span>Lojistik Malzeme Seçimi</span>
                              <button
                                onClick={() => setMaterialSelectOpenId(null)}
                                className="text-slate-500 hover:text-white"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>

                            <input
                              type="text"
                              autoFocus
                              value={materialSearchQuery}
                              onChange={(e) => setMaterialSearchQuery(e.target.value)}
                              placeholder="Malzeme adı veya QR ara..."
                              className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white placeholder:text-slate-500 focus:outline-hidden focus:border-amber-500"
                            />

                            <div className="max-h-48 overflow-y-auto space-y-1 divide-y divide-slate-800/40 text-xs">
                              <button
                                onClick={() => handleSelectMaterial(item, null)}
                                className="w-full text-left px-2 py-1.5 rounded hover:bg-rose-950/40 text-rose-300 text-[11px] transition-colors flex items-center gap-1.5"
                              >
                                <X className="w-3 h-3" />
                                <span>(Bağlantı Yok / Temizle)</span>
                              </button>

                              {materials
                                .filter((m) =>
                                  m.materialName.toLowerCase().includes(materialSearchQuery.toLowerCase()) ||
                                  m.qrCode.toLowerCase().includes(materialSearchQuery.toLowerCase())
                                )
                                .slice(0, 15)
                                .map((mat) => (
                                  <button
                                    key={mat.id}
                                    onClick={() => handleSelectMaterial(item, mat)}
                                    className="w-full text-left px-2 py-2 rounded-lg hover:bg-slate-800 text-slate-200 transition-colors flex items-center justify-between group/mat"
                                  >
                                    <div className="truncate pr-2">
                                      <div className="font-medium text-slate-100 group-hover/mat:text-amber-300 truncate">
                                        {mat.materialName}
                                      </div>
                                      <div className="text-[10px] text-slate-400 font-mono">
                                        QR: {mat.qrCode} • Bölge: {mat.currentZone}
                                      </div>
                                    </div>
                                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-950 text-slate-400 font-mono shrink-0">
                                      {mat.quantity} {mat.unit || "Adet"}
                                    </span>
                                  </button>
                                ))}

                              {materials.length === 0 && (
                                <p className="text-[11px] text-slate-500 text-center py-2">
                                  Depoda kayıtlı malzeme bulunamadı.
                                </p>
                              )}
                            </div>
                          </div>
                        )}
                      </td>

                      {/* 9. Satır Silme Butonu */}
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => handleDeleteRow(item.id, item.pozNo)}
                          className="p-1 text-slate-600 hover:text-rose-400 hover:bg-rose-950/30 rounded transition-colors opacity-40 group-hover:opacity-100"
                          title="Bu pozu sil"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
            {items.length > 0 && (
              <tfoot>
                <tr className="bg-slate-950 font-bold border-t-2 border-slate-700 text-slate-200">
                  <td colSpan={4} className="py-4 px-4 text-right uppercase tracking-wider text-[11px] text-slate-400">
                    Genel Proje Toplamı:
                  </td>
                  <td className="py-4 px-4 text-right font-mono text-slate-300">
                    {/* Toplam Miktar Göstergesi */}
                    -
                  </td>
                  <td className="py-4 px-4 text-right font-mono text-slate-400 text-[11px]">
                    Ortalama / Genel
                  </td>
                  <td className="py-4 px-4 text-right font-mono text-blue-400 text-sm bg-blue-950/30 border-x border-blue-900/40">
                    {formatTRY(reactiveSummary.totalPlannedAmount)}
                  </td>
                  <td className="py-4 px-4 text-right font-mono text-emerald-400 text-sm">
                    {formatTRY(reactiveSummary.totalActualAmount)}
                  </td>
                  <td colSpan={2} className="py-4 px-4 text-right text-[11px] text-slate-400">
                    Fiziksel İlerleme: <span className="font-mono text-indigo-400 font-bold">%{reactiveSummary.generalProgressPercent}</span>
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* İpuçları & Kullanım Notu */}
      <div className="bg-slate-900/40 border border-slate-800/80 rounded-xl p-4 text-xs text-slate-400 flex items-start gap-3">
        <Sparkles className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-medium text-slate-300">
            İnteraktif DataGrid Kullanım İpuçları:
          </p>
          <ul className="list-disc list-inside space-y-0.5 text-slate-400">
            <li>
              <strong>Hücre İçi Düzenleme:</strong> <code className="text-slate-300 font-mono">Planlanan Miktar</code> veya <code className="text-slate-300 font-mono">Birim Fiyat</code> hücresine çift tıklayarak rakamı değiştirdiğinizde, <code className="text-blue-300 font-mono">Toplam Keşif</code> ve sayfanın en üstündeki KPI kartları anlık (otonom) yeniden hesaplanır.
            </li>
            <li>
              <strong>Lojistik Depo Entegrasyonu:</strong> <code className="text-amber-300">Malzeme Bağla</code> butonuna tıklayarak inşaat iş kalemini şantiyenin gerçek QR/BLE lojistik envanteriyle eşleştirebilirsiniz.
            </li>
            <li>
              <strong>Finans Senkronizasyonu:</strong> Yapılan her değişiklik otomatik olarak Finans Bütçe Hakedişlerine yansıtılır.
            </li>
          </ul>
        </div>
      </div>
    </div>
  )
}
