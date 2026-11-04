"use client"
/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Franchise Saha Personeli & Mağaza Ekipleri Client View with CreatePersonnelModal & PersonnelSlideOver
 */

import React, { useState } from "react"
import Link from "next/link"
import {
  Users,
  Building2,
  Phone,
  Mail,
  MapPin,
  CheckCircle2,
  Clock,
  Plus,
  ArrowRight,
  ShieldCheck,
  Award,
  UserCheck
} from "lucide-react"
import { toast } from "react-hot-toast"
import CreatePersonnelModal from "@/components/franchise/CreatePersonnelModal"
import PersonnelSlideOver from "@/components/franchise/PersonnelSlideOver"

interface PersonnelPageClientProps {
  initialPersonnel: any[]
}

export default function PersonnelPageClient({ initialPersonnel }: PersonnelPageClientProps) {
  const [personnelList, setPersonnelList] = useState(initialPersonnel)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [selectedPerson, setSelectedPerson] = useState<any | null>(null)
  const [isSlideOverOpen, setIsSlideOverOpen] = useState(false)

  const handleOpenDetail = (person: any) => {
    setSelectedPerson(person)
    setIsSlideOverOpen(true)
  }

  const handlePersonAdded = (newPerson: any) => {
    setPersonnelList((prev) => [newPerson, ...prev])
  }

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-amber-400">
            <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
            İnsan Kaynakları & Saha Ekipleri
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight mt-1 flex items-center gap-3">
            <Users className="w-8 h-8 text-amber-400" />
            Saha Personeli & Mağaza Ekipleri
          </h1>
          <p className="text-sm text-slate-400 mt-1 max-w-2xl">
            Yeni mağaza açılışlarını yürüten saha mimarları, bölge operasyon müdürleri ve süpervizör kadrosu.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/franchise/tasks"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-200 text-xs font-medium transition-all shadow-sm"
          >
            <span>Görevler & Takvim</span>
            <ArrowRight className="w-4 h-4 text-blue-400" />
          </Link>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white text-xs font-bold transition-all shadow-lg shadow-amber-500/20 cursor-pointer hover:scale-[1.02]"
          >
            <Plus className="w-4 h-4" />
            <span>Yeni Personel Tanımla</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800/80 backdrop-blur-xl">
          <div className="text-xs text-slate-400 font-medium flex items-center justify-between">
            <span>Toplam Saha Kadrosu</span>
            <Users className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-white mt-2">
            {personnelList.length} <span className="text-xs text-slate-500 font-normal">personel</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Zincir operasyonu aktif
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800/80 backdrop-blur-xl">
          <div className="text-xs text-emerald-400 font-medium flex items-center justify-between">
            <span>Aktif Görevde</span>
            <UserCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-400 mt-2">
            {personnelList.length} <span className="text-xs text-slate-500 font-normal">kişi</span>
          </div>
          <div className="text-[11px] text-emerald-500/80 mt-1">
            %100 vardiya uyumu
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800/80 backdrop-blur-xl">
          <div className="text-xs text-blue-400 font-medium flex items-center justify-between">
            <span>Sertifikalı Personel</span>
            <Award className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-black text-blue-400 mt-2">
            %95 <span className="text-xs text-slate-500 font-normal">oran</span>
          </div>
          <div className="text-[11px] text-blue-400/80 mt-1">
            İSG & barista sertifikalı
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800/80 backdrop-blur-xl">
          <div className="text-xs text-amber-400 font-medium flex items-center justify-between">
            <span>Saha Mimarları</span>
            <ShieldCheck className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-white mt-2">
            6 <span className="text-xs text-slate-500 font-normal">mimar</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Rollout şantiye süpervizyonu
          </div>
        </div>
      </div>

      {/* Personnel Grid */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <Users className="w-5 h-5 text-amber-400" />
          Saha ve Operasyon Ekibi
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {personnelList.map((p: any) => (
            <div
              key={p.id}
              className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800/80 hover:border-amber-500/40 transition-all space-y-4"
            >
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-xl bg-gradient-to-tr from-amber-500 to-rose-600 font-black text-white text-base flex items-center justify-center shadow-lg shadow-amber-500/20">
                  {p.name ? p.name[0] : "P"}
                </div>
                <div>
                  <h3 className="text-base font-bold text-white leading-tight">
                    {p.name}
                  </h3>
                  <span className="text-[11px] text-amber-400 font-semibold block mt-0.5">
                    {p.role || "Saha Personeli"}
                  </span>
                </div>
              </div>

              <div className="space-y-1.5 text-xs text-slate-400 pt-2 border-t border-slate-800">
                <div className="flex items-center gap-2">
                  <Building2 className="w-3.5 h-3.5 text-slate-500" />
                  <span>{p.department || "Operasyon"}</span>
                </div>
                {p.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-slate-500" />
                    <span>{p.phone}</span>
                  </div>
                )}
                {p.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-slate-500 truncate" />
                    <span className="truncate">{p.email}</span>
                  </div>
                )}
              </div>

              <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs">
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/50">
                  <CheckCircle2 className="w-3 h-3" />
                  AKTİF
                </span>
                <button
                  onClick={() => handleOpenDetail(p)}
                  className="text-amber-400 hover:text-amber-300 font-semibold text-xs cursor-pointer px-2 py-1 rounded-md hover:bg-amber-500/10 transition-colors"
                >
                  Detay
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Create Personnel Modal */}
      <CreatePersonnelModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={handlePersonAdded}
      />

      {/* Personnel Slide-Over Panel */}
      <PersonnelSlideOver
        isOpen={isSlideOverOpen}
        personnel={selectedPerson}
        onClose={() => {
          setIsSlideOverOpen(false)
          setSelectedPerson(null)
        }}
      />
    </div>
  )
}

