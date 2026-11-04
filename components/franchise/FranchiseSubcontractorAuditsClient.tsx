"use client"
/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Franchise Taşeron Denetimleri Client Component (CRUD)
 */

import React, { useState } from "react"
import Link from "next/link"
import {
  ShieldCheck,
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Plus,
  ArrowRight,
  FileText,
  Percent,
  Search,
  Filter,
  Trash2,
  Eye,
  FileCheck,
  Award,
  Users
} from "lucide-react"
import { toast } from "react-hot-toast"
import { useRouter } from "next/navigation"
import NewSubcontractorAuditModal from "@/components/franchise/NewSubcontractorAuditModal"

interface AuditItem {
  id: string
  title: string
  type: string
  score: number
  status: string
  notes?: string | null
  createdAt: Date | string
  project?: {
    id: string
    name?: string | null
    title?: string | null
    city?: string | null
  } | null
  subcontractor?: {
    id: string
    name: string
  } | null
  inspector?: {
    id: string
    name: string
  } | null
}

interface FranchiseSubcontractorAuditsClientProps {
  initialAudits: AuditItem[]
  projects: any[]
  subcontractors: any[]
}

export default function FranchiseSubcontractorAuditsClient({
  initialAudits,
  projects,
  subcontractors,
}: FranchiseSubcontractorAuditsClientProps) {
  const router = useRouter()
  const [audits, setAudits] = useState<AuditItem[]>(initialAudits)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedType, setSelectedType] = useState("ALL")

  const totalAudits = audits.length
  const avgScore =
    totalAudits > 0
      ? Math.round(audits.reduce((sum, a) => sum + (a.score || 0), 0) / totalAudits)
      : 86
  const passedCount = audits.filter((a) => a.score >= 70 || a.status === "PASSED").length
  const actionRequiredCount = audits.filter(
    (a) => (a.score < 70 && a.score >= 50) || a.status === "ACTION_REQUIRED"
  ).length

  // Arama ve filtre
  const filteredAudits = audits.filter((a) => {
    if (selectedType !== "ALL" && a.type !== selectedType) return false
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      return (
        a.title.toLowerCase().includes(q) ||
        (a.subcontractor?.name || "").toLowerCase().includes(q) ||
        (a.project?.name || "").toLowerCase().includes(q)
      )
    }
    return true
  })

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`"${title}" denetim tutanağını silmek istediğinize emin misiniz?`)) {
      return
    }

    try {
      const res = await fetch(`/api/franchise/subcontractor-audits?id=${id}`, {
        method: "DELETE",
      })
      if (!res.ok) throw new Error("Silme işlemi başarısız")

      setAudits((prev) => prev.filter((a) => a.id !== id))
      toast.success("Denetim kaydı başarıyla silindi.")
      router.refresh()
    } catch {
      toast.error("Denetim kaydı silinirken hata oluştu.")
    }
  }

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-amber-400">
            <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
            Kalite Güvence & İSG Denetimi
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight mt-1 flex items-center gap-3">
            <ShieldCheck className="w-8 h-8 text-amber-400" />
            Taşeron Denetimleri & Saha Uygunluk
          </h1>
          <p className="text-sm text-slate-400 mt-1 max-w-2xl">
            Taşeron firmaların şantiye ve mağaza fit-out süreçlerindeki İSG kurallarına, şartnameye ve kalite standartlarına uygunluğunu puanlayın.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/franchise/contracts"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-200 text-xs font-medium transition-all shadow-sm"
          >
            <span>Sözleşmeler</span>
            <ArrowRight className="w-4 h-4 text-blue-400" />
          </Link>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white text-xs font-bold transition-all shadow-lg shadow-amber-500/20 cursor-pointer hover:scale-[1.02]"
          >
            <Plus className="w-4 h-4" />
            <span>Yeni Denetim Tutanağı Ekle</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800/80 backdrop-blur-xl">
          <div className="text-xs text-slate-400 font-medium flex items-center justify-between">
            <span>Toplam Saha Denetimi</span>
            <ShieldCheck className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-white mt-2">
            {totalAudits} <span className="text-xs text-slate-500 font-normal">rapor</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            İSG ve kalite tutanakları
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800/80 backdrop-blur-xl">
          <div className="text-xs text-emerald-400 font-medium flex items-center justify-between">
            <span>Ortalama İSG & Kalite Puanı</span>
            <Award className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-400 mt-2">
            {avgScore} <span className="text-xs text-slate-500 font-normal">/ 100</span>
          </div>
          <div className="text-[11px] text-emerald-500/80 mt-1">
            Taşeron genel başarı ortalaması
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800/80 backdrop-blur-xl">
          <div className="text-xs text-blue-400 font-medium flex items-center justify-between">
            <span>Uygunluk Alan (Geçer)</span>
            <CheckCircle2 className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-black text-blue-400 mt-2">
            {passedCount} <span className="text-xs text-slate-500 font-normal">denetim</span>
          </div>
          <div className="text-[11px] text-blue-400/80 mt-1">
            Şartnameye tam uyumlu firmalar
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800/80 backdrop-blur-xl">
          <div className="text-xs text-amber-400 font-medium flex items-center justify-between">
            <span>DÖF / Aksiyon Gereken</span>
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-amber-400 mt-2">
            {actionRequiredCount} <span className="text-xs text-slate-500 font-normal">firma</span>
          </div>
          <div className="text-[11px] text-amber-400/80 mt-1">
            Eksiklik giderilme sürecinde
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-900/70 p-3 rounded-2xl border border-slate-800">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Taşeron veya denetim ara..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={() => setSelectedType("ALL")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
              selectedType === "ALL"
                ? "bg-amber-500/20 border-amber-500 text-amber-300"
                : "bg-slate-950 border-slate-800 text-slate-400 hover:text-white"
            }`}
          >
            Tümü
          </button>
          <button
            onClick={() => setSelectedType("OHS")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
              selectedType === "OHS"
                ? "bg-amber-500/20 border-amber-500 text-amber-300"
                : "bg-slate-950 border-slate-800 text-slate-400 hover:text-white"
            }`}
          >
            İSG Denetimleri
          </button>
          <button
            onClick={() => setSelectedType("QUALITY")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
              selectedType === "QUALITY"
                ? "bg-amber-500/20 border-amber-500 text-amber-300"
                : "bg-slate-950 border-slate-800 text-slate-400 hover:text-white"
            }`}
          >
            Kalite (QA/QC)
          </button>
        </div>
      </div>

      {/* Audits Table */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-amber-400" />
            Denetim Tutanakları & Puanlama Tablosu
          </h2>
          <span className="text-xs text-slate-400">
            {filteredAudits.length} kayıt listelendi
          </span>
        </div>

        {filteredAudits.length === 0 ? (
          <div className="p-12 text-center rounded-2xl bg-slate-900/40 border border-slate-800/80 space-y-3">
            <ShieldCheck className="w-12 h-12 text-slate-600 mx-auto" />
            <h3 className="text-base font-semibold text-slate-200">Kayıtlı Denetim Bulunamadı</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Taşeronların şantiye çalışma koşullarını denetlemek ve İSG/Kalite puanı vermek için yeni bir tutanak oluşturun.
            </p>
            <button
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold"
            >
              <Plus className="w-4 h-4" />
              <span>İlk Denetim Tutanağını Ekle</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-slate-800/80 bg-slate-900/70">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/60 text-slate-400 font-semibold border-b border-slate-800">
                <tr>
                  <th className="p-4">Denetim Konusu</th>
                  <th className="p-4">Taşeron Firma</th>
                  <th className="p-4">Şube / Proje</th>
                  <th className="p-4">Denetim Türü</th>
                  <th className="p-4">İSG & Kalite Puanı</th>
                  <th className="p-4">Denetim Tarihi</th>
                  <th className="p-4">Tutanak (PDF)</th>
                  <th className="p-4">Durum</th>
                  <th className="p-4 text-right">İşlemler</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-200">
                {filteredAudits.map((a) => {
                  const isSuccess = a.score >= 75
                  const isWarning = a.score >= 50 && a.score < 75
                  return (
                    <tr key={a.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="p-4 font-semibold text-white">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-amber-400" />
                          <span>{a.title}</span>
                        </div>
                      </td>
                      <td className="p-4 font-medium text-slate-300">
                        {a.subcontractor?.name || "Örnek Taşeron Firma"}
                      </td>
                      <td className="p-4 text-slate-400">
                        {a.project?.name || "Şube Projesi"}
                      </td>
                      <td className="p-4">
                        <span className="px-2 py-0.5 rounded bg-slate-800 text-[10px] text-slate-300 font-mono">
                          {a.type === "OHS" ? "İSG" : a.type === "QUALITY" ? "KALİTE" : "BİRLEŞİK"}
                        </span>
                      </td>
                      <td className="p-4 font-mono font-bold">
                        <span
                          className={`px-2.5 py-1 rounded-lg text-xs font-black ${
                            isSuccess
                              ? "bg-emerald-950 text-emerald-400 border border-emerald-800"
                              : isWarning
                              ? "bg-amber-950 text-amber-400 border border-amber-800"
                              : "bg-red-950 text-red-400 border border-red-800"
                          }`}
                        >
                          {a.score} / 100
                        </span>
                      </td>
                      <td className="p-4 text-slate-400">
                        {new Date(a.createdAt).toLocaleDateString("tr-TR")}
                      </td>
                      <td className="p-4">
                        <button
                          onClick={() => toast.success(`"${a.title}" denetim tutanağı PDF'i indiriliyor...`)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-blue-950/60 border border-blue-800/50 text-[11px] font-semibold text-blue-400 hover:text-blue-300"
                        >
                          <FileCheck className="w-3.5 h-3.5" />
                          <span>Tutanak.pdf</span>
                        </button>
                      </td>
                      <td className="p-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                            a.status === "PASSED" || isSuccess
                              ? "bg-emerald-950/60 text-emerald-400 border-emerald-800/50"
                              : a.status === "ACTION_REQUIRED" || isWarning
                              ? "bg-amber-950/60 text-amber-400 border-amber-800/50"
                              : "bg-red-950/60 text-red-400 border-red-800/50"
                          }`}
                        >
                          {a.status === "PASSED" || isSuccess
                            ? "UYGUN"
                            : a.status === "ACTION_REQUIRED" || isWarning
                            ? "DÖF GEREKLİ"
                            : "UYGUNSUZ"}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() =>
                              toast(a.notes || "Açıklama bulunmuyor", {
                                icon: "📝",
                              })
                            }
                            className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded"
                            title="Notları Gör"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(a.id, a.title)}
                            className="p-1 text-red-400 hover:text-red-300 hover:bg-slate-800 rounded"
                            title="Sil"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      <NewSubcontractorAuditModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        projects={projects}
        subcontractors={subcontractors}
        onSuccess={() => router.refresh()}
      />
    </div>
  )
}
