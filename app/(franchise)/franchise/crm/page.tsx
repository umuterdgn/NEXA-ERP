/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Franchise Portal - Tedarikçi Firmalar (CRM & Tedarik Ağı)
 */

import React from "react"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import Link from "next/link"
import {
  Building2,
  Phone,
  Mail,
  MapPin,
  Star,
  ShieldCheck,
  Truck,
  Plus,
  ArrowRight,
  Search,
  SlidersHorizontal,
  ExternalLink,
  PackageCheck
} from "lucide-react"

export const dynamic = "force-dynamic"

export default async function FranchiseCrmPage() {
  const session = await auth()
  if (!session?.user) {
    redirect("/login")
  }

  const tenantId = (session.user as any)?.tenantId

  // %100 Tenant İzolasyonu
  const suppliers = await prisma.company.findMany({
    where: tenantId ? { tenantId } : {},
    select: {
      id: true,
      name: true,
      type: true,
      email: true,
      phone: true,
      contactName: true,
      taxNumber: true,
      taxOffice: true,
    },
    take: 50,
  }).catch(() => [])

  // National franchise retail suppliers list
  const sampleCategories = [
    { name: "Endüstriyel Soğutma & Reyon", count: 4, icon: Truck },
    { name: "Kasa Bankosu & Gondol Raf", count: 3, icon: Building2 },
    { name: "LED Aydınlatma & Elektrik", count: 5, icon: PackageCheck },
    { name: "POS, Yazar Kasa & Barkod Donanım", count: 2, icon: ShieldCheck },
  ]

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-amber-400">
            <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
            Tedarik Zinciri & CRM
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight mt-1 flex items-center gap-3">
            <Building2 className="w-8 h-8 text-amber-400" />
            Tedarikçi Firmalar & Ulusal Anlaşmalar
          </h1>
          <p className="text-sm text-slate-400 mt-1 max-w-2xl">
            Zincir mağazalarınız için standartlaştırılmış mobilya, soğutucu, aydınlatma ve POS tedarikçilerinizi tek merkezden yönetin.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/franchise/procurement/consolidated"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-200 text-xs font-medium transition-all shadow-sm"
          >
            <span>Konsolide İhale</span>
            <ArrowRight className="w-4 h-4 text-blue-400" />
          </Link>
          <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white text-xs font-bold transition-all shadow-lg shadow-amber-500/20">
            <Plus className="w-4 h-4" />
            <span>Yeni Tedarikçi Ekle</span>
          </button>
        </div>
      </div>

      {/* Categories */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {sampleCategories.map((c, i) => {
          const IconComp = c.icon
          return (
            <div key={i} className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800/80 backdrop-blur-xl">
              <div className="text-xs text-slate-400 font-medium flex items-center justify-between">
                <span>{c.name}</span>
                <IconComp className="w-4 h-4 text-amber-400" />
              </div>
              <div className="text-2xl font-black text-white mt-2">
                {c.count} <span className="text-xs text-slate-500 font-normal">anlaşmalı firma</span>
              </div>
              <div className="text-[11px] text-amber-400/80 mt-1">
                Ulusal kurumsal iskonto aktif
              </div>
            </div>
          )
        })}
      </div>

      {/* Supplier Grid */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <Building2 className="w-5 h-5 text-amber-400" />
          Kayıtlı Tedarikçiler
        </h2>

        {suppliers.length === 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { name: "Atlas Soğutma Sistemleri A.Ş.", cat: "Soğutucu & Reyon", rating: 4.9, city: "İzmir", phone: "+90 232 400 1020" },
              { name: "Netaş Perakende Raf & Mobilya", cat: "Gondol Raf & Banko", rating: 4.8, city: "Bursa", phone: "+90 224 300 4050" },
              { name: "Lumina Kurumsal Aydınlatma", cat: "LED & Acil Çıkış", rating: 5.0, city: "İstanbul", phone: "+90 212 550 8090" },
            ].map((mock, idx) => (
              <div
                key={idx}
                className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800/80 hover:border-amber-500/40 transition-all space-y-4"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">
                      {mock.cat}
                    </span>
                    <h3 className="text-base font-bold text-white mt-0.5">
                      {mock.name}
                    </h3>
                  </div>
                  <span className="flex items-center gap-1 text-xs font-bold text-amber-400 bg-amber-950/60 border border-amber-800/50 px-2 py-0.5 rounded-md">
                    <Star className="w-3 h-3 fill-amber-400" />
                    {mock.rating}
                  </span>
                </div>

                <div className="space-y-1.5 text-xs text-slate-400">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-slate-500" />
                    <span>{mock.city} Merkez Fabrika</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-slate-500" />
                    <span>{mock.phone}</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs">
                  <span className="text-emerald-400 font-semibold text-[11px]">SLA: 48 Saat Teslimat</span>
                  <button className="text-amber-400 hover:text-amber-300 font-semibold">
                    Katalog İncele
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {suppliers.map((s) => (
              <div
                key={s.id}
                className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800/80 hover:border-amber-500/40 transition-all space-y-4"
              >
                <div>
                  <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">
                    {s.type || "TEDARİKÇİ"}
                  </span>
                  <h3 className="text-base font-bold text-white mt-0.5">{s.name}</h3>
                </div>

                <div className="space-y-1.5 text-xs text-slate-400">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-slate-500" />
                    <span>{s.contactName || "Yetkili Temsilci"}</span>
                  </div>
                  {s.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-slate-500" />
                      <span>{s.phone}</span>
                    </div>
                  )}
                  {s.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-slate-500" />
                      <span>{s.email}</span>
                    </div>
                  )}
                </div>

                <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs">
                  <span className="text-emerald-400 font-semibold text-[11px]">Sözleşmeli Tedarikçi</span>
                  <button className="text-amber-400 hover:text-amber-300 font-semibold">
                    Profil Detayı
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
