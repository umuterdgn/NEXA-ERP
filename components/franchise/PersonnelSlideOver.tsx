"use client"
/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Personel Özlük & Detay Bilgileri Slide-Over Paneli
 */

import React from "react"
import {
  X,
  User,
  Phone,
  Mail,
  Building2,
  Calendar,
  CheckCircle2,
  ShieldCheck,
  FileText,
  Briefcase,
  Award,
  Layers,
  Sparkles,
  ExternalLink
} from "lucide-react"
import { toast } from "react-hot-toast"

interface PersonnelData {
  id: string
  name: string
  role?: string
  department?: string
  phone?: string
  email?: string
  status?: string
}

interface PersonnelSlideOverProps {
  isOpen: boolean
  personnel: PersonnelData | null
  onClose: () => void
}

export default function PersonnelSlideOver({
  isOpen,
  personnel,
  onClose,
}: PersonnelSlideOverProps) {
  if (!isOpen || !personnel) return null

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div
          className="w-screen max-w-md bg-slate-900 border-l border-slate-800 shadow-2xl flex flex-col animate-in slide-in-from-right duration-300"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="p-6 border-b border-slate-800 bg-slate-950/70 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-rose-600 flex items-center justify-center font-black text-white text-lg shadow-lg shadow-amber-500/20">
                {personnel.name ? personnel.name[0] : "P"}
              </div>
              <div>
                <h3 className="text-lg font-bold text-white leading-tight">{personnel.name}</h3>
                <span className="text-xs text-amber-400 font-semibold block mt-0.5">
                  {personnel.role || "Saha Personeli"}
                </span>
              </div>
            </div>

            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Status & ID Badge */}
            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-950 border border-slate-800">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-xs font-bold text-white">Çalışma Durumu: AKTİF</span>
              </div>
              <span className="text-[11px] font-mono text-slate-400">ID: {personnel.id}</span>
            </div>

            {/* İletişim Bilgileri */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                İletişim & Lokasyon
              </h4>

              <div className="space-y-2 text-xs">
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-slate-300">
                    <Phone className="w-4 h-4 text-amber-400" />
                    <span>{personnel.phone || "+90 532 111 2233"}</span>
                  </div>
                  <a
                    href={`tel:${personnel.phone}`}
                    className="text-[11px] font-bold text-amber-400 hover:text-amber-300"
                  >
                    Ara
                  </a>
                </div>

                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-slate-300">
                    <Mail className="w-4 h-4 text-blue-400" />
                    <span className="truncate">{personnel.email || "personel@franchise.com"}</span>
                  </div>
                  <a
                    href={`mailto:${personnel.email}`}
                    className="text-[11px] font-bold text-blue-400 hover:text-blue-300"
                  >
                    E-Posta
                  </a>
                </div>

                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 flex items-center gap-2 text-slate-300">
                  <Building2 className="w-4 h-4 text-emerald-400" />
                  <span>Departman: {personnel.department || "Saha Operasyon & Mimari"}</span>
                </div>
              </div>
            </div>

            {/* Özlük Dosyası & Evrak Durumu */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Özlük Dosyası & İSG Belgeleri
                </h4>
                <span className="text-[11px] text-emerald-400 font-bold">%100 Eksiksiz</span>
              </div>

              <div className="space-y-2">
                {[
                  { name: "SGK İşe Giriş Bildirgesi", date: "15.01.2024", verified: true },
                  { name: "Ağır ve Tehlikeli İşler Sağlık Raporu", date: "10.01.2024", verified: true },
                  { name: "Temel İSG Eğitimi Sertifikası (16 Saat)", date: "12.01.2024", verified: true },
                  { name: "Gıda Hijyen ve Sanitasyon Belgesi", date: "20.01.2024", verified: true },
                  { name: "Adli Sicil Kaydı & İkametgah", date: "05.01.2024", verified: true },
                ].map((doc, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800/80 text-xs"
                  >
                    <div className="flex items-center gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <div>
                        <span className="font-semibold text-white block">{doc.name}</span>
                        <span className="text-[10px] text-slate-500">Kayıt: {doc.date}</span>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold text-slate-400 px-2 py-0.5 rounded bg-slate-900 border border-slate-800">
                      ONAYLI
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Zimmetli Donanımlar */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Zimmetli Cihaz & BLE Tag
              </h4>
              <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-amber-300">Akıllı İSG Baret Tag (BLE)</span>
                  <span className="font-mono text-[10px] text-slate-300">C4:4E:AC:01:22:11</span>
                </div>
                <p className="text-[11px] text-slate-400">Şantiye ve mağaza alanı gerçek zamanlı radar takibi aktif.</p>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="p-6 border-t border-slate-800 bg-slate-950/70 flex items-center justify-between gap-3">
            <button
              onClick={() => {
                toast.success(`"${personnel.name}" için görev atama penceresi açıldı.`)
              }}
              className="flex-1 py-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-200 text-xs font-semibold transition-all text-center"
            >
              Görev Ata
            </button>
            <button
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold transition-all text-center shadow-lg shadow-amber-500/20"
            >
              Kapat
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

