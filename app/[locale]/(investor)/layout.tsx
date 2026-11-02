/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Yatırımcı Portalı Özel Düzeni (Investor Layout)
 * - Yalnızca salt okunur izleme arayüzü
 * - Kısıtlı InvestorSidebar (Genel Bakış, 3D Proje İkizi, Finansal Özet, Saha Galerisi)
 */

import React from "react"
import InvestorSidebar from "./InvestorSidebar"
import { Building2, Eye, Calendar, Sparkles } from "lucide-react"

export const dynamic = "force-dynamic"

export default function InvestorLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const todayStr = "02 Kasım 2026"

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col md:flex-row antialiased selection:bg-amber-500/30 selection:text-amber-200">
      {/* Özel Yatırımcı Yan Menüsü */}
      <InvestorSidebar />

      {/* Ana İçerik Kapsayıcısı */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen overflow-x-hidden">
        {/* Üst Yönetici Başlık Çubuğu */}
        <header className="h-16 bg-slate-900/80 backdrop-blur-md border-b border-slate-800/80 px-6 flex items-center justify-between sticky top-0 z-40">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs font-bold text-white tracking-wide">
                Canlı Proje Akışı: Nexa Plaza & Rezidans
              </span>
            </div>
            <span className="hidden sm:inline-block text-slate-600">•</span>
            <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-mono text-slate-400 bg-slate-800/60 px-2 py-0.5 rounded border border-slate-700/50">
              <Eye className="w-3 h-3 text-amber-400" />
              Salt Okunur Yatırımcı Görünümü
            </span>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 text-xs text-slate-400 font-mono">
              <Calendar className="w-3.5 h-3.5 text-slate-500" />
              <span>{todayStr}</span>
            </div>
            <div className="px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-semibold flex items-center gap-1.5 shadow-sm">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Yatırımcı Portalı</span>
            </div>
          </div>
        </header>

        {/* Sayfa İçeriği */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
