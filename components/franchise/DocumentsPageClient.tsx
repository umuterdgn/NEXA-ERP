"use client"
/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Franchise Evrak & Dijital Arşiv Client View with CreateDocumentModal
 */

import React, { useState } from "react"
import Link from "next/link"
import {
  Archive,
  FileText,
  UploadCloud,
  Plus,
  ArrowRight,
  ShieldCheck,
  FolderArchive,
  Download,
  Building2,
  Calendar,
  CheckCircle2
} from "lucide-react"
import { toast } from "react-hot-toast"
import CreateDocumentModal from "@/components/franchise/CreateDocumentModal"

interface DocumentsPageClientProps {
  projects: any[]
  initialDocs: any[]
}

export default function DocumentsPageClient({
  projects,
  initialDocs,
}: DocumentsPageClientProps) {
  const [docs, setDocs] = useState(initialDocs)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const handleDownload = (title: string) => {
    toast.success(`"${title}" resmi evrakı güvenli kasadan indiriliyor...`)
  }

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-amber-400">
            <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
            Doküman Kasası & Yasal Uyum
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight mt-1 flex items-center gap-3">
            <Archive className="w-8 h-8 text-amber-400" />
            Dijital Evrak & Mağaza Arşivi
          </h1>
          <p className="text-sm text-slate-400 mt-1 max-w-2xl">
            Tüm franchise zincir mağazalarınızın kira sözleşmeleri, belediye ruhsatları ve yangın raporları güvenli bulut kasada.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/franchise/permits"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-200 text-xs font-medium transition-all shadow-sm"
          >
            <ShieldCheck className="w-4 h-4 text-blue-400" />
            <span>İdari İzinler</span>
          </Link>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white text-xs font-bold transition-all shadow-lg shadow-amber-500/20 cursor-pointer hover:scale-[1.02]"
          >
            <UploadCloud className="w-4 h-4" />
            <span>Evrak Yükle</span>
          </button>
        </div>
      </div>

      {/* Grid of Archive Categories */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { title: "Kira Kontratları", count: projects.length || 12, desc: "Noter onaylı sözleşmeler" },
          { title: "Ruhsat Belgeleri", count: 24, desc: "İlçe belediyesi onayları" },
          { title: "İtfaiye Raporları", count: 18, desc: "Yangın güvenlik raporları" },
          { title: "Abonelik Evrakları", count: 36, desc: "Elektrik, su, internet" },
        ].map((c, i) => (
          <div key={i} className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800/80 backdrop-blur-xl">
            <div className="text-xs text-slate-400 font-medium flex items-center justify-between">
              <span>{c.title}</span>
              <FileText className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-2xl font-black text-white mt-2">
              {c.count} <span className="text-xs text-slate-500 font-normal">dosya</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-1">{c.desc}</div>
          </div>
        ))}
      </div>

      {/* Documents Table */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <FolderArchive className="w-5 h-5 text-amber-400" />
          Kayıtlı Sözleşme & Resmi Evraklar
        </h2>

        <div className="overflow-x-auto rounded-2xl border border-slate-800/80 bg-slate-900/70">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/60 text-slate-400 font-semibold border-b border-slate-800">
              <tr>
                <th className="p-4">Belge Adı</th>
                <th className="p-4">Şube / Mağaza</th>
                <th className="p-4">Kategori</th>
                <th className="p-4">Yükleme Tarihi</th>
                <th className="p-4">Boyut</th>
                <th className="p-4 text-right">İşlemler</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-200">
              {docs.map((doc: any, idx: number) => (
                <tr key={idx} className="hover:bg-slate-800/40 transition-colors">
                  <td className="p-4 font-semibold text-white flex items-center gap-2">
                    <FileText className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>{doc.title}</span>
                  </td>
                  <td className="p-4 text-slate-300">{doc.store}</td>
                  <td className="p-4">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-300">
                      {doc.type}
                    </span>
                  </td>
                  <td className="p-4 text-slate-400">{doc.date}</td>
                  <td className="p-4 font-mono text-slate-400">{doc.size}</td>
                  <td className="p-4 text-right">
                    <button
                      onClick={() => handleDownload(doc.title)}
                      className="flex items-center gap-1.5 ml-auto text-amber-400 hover:text-amber-300 font-semibold text-xs cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>İndir</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      <CreateDocumentModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        projects={projects}
        onSuccess={() => toast.success("Dijital evrak arşivi güncellendi.")}
      />
    </div>
  )
}
