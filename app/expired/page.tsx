"use client"
/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Lisans Bariyeri / Süresi Dolan Abonelik & Demo Ekranı
 */

import React from "react"
import { motion } from "framer-motion"
import { signOut, useSession } from "next-auth/react"
import { 
  ShieldAlert, 
  Clock, 
  Building2, 
  Headphones, 
  LogOut, 
  ExternalLink, 
  Sparkles,
  AlertTriangle,
  Mail,
  Phone
} from "lucide-react"

export default function LicenseExpiredPage() {
  const { data: session } = useSession()
  const user = session?.user as any
  const companyName = user?.companyName || user?.name || "Kurumsal Müşteri"
  const email = user?.email || ""

  const handleContactSales = () => {
    const subject = encodeURIComponent(`NEXA ERP Lisans Yenileme Talebi - ${companyName}`)
    const body = encodeURIComponent(
      `Merhaba Nexa Satış Ekibi,\n\nFirma Adı: ${companyName}\nKullanıcı E-posta: ${email}\n\n14 günlük demo / lisans süremiz sona ermiştir. Kesintisiz erişim için lisansımızı yenilemek ve paket detaylarını öğrenmek istiyoruz.\n\nİyi çalışmalar.`
    )
    window.location.href = `mailto:destek@nxerp.com.tr?subject=${subject}&body=${body}`
  }

  const handleWhatsApp = () => {
    const text = encodeURIComponent(
      `Merhaba Nexa ERP Satış Ekibi, ${companyName} (${email}) firmamızın lisans/demo süresi doldu. Lisansımızı yenilemek istiyoruz.`
    )
    window.open(`https://wa.me/905000000000?text=${text}`, "_blank")
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col justify-between relative overflow-hidden select-none">
      {/* Background glow effects */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-red-600/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-80 h-80 bg-amber-600/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Top Bar */}
      <header className="border-b border-slate-900 bg-slate-950/70 backdrop-blur-md px-6 py-4 flex items-center justify-between relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-red-600 to-amber-600 flex items-center justify-center shadow-lg shadow-red-900/30">
            <ShieldAlert className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="text-base font-black tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
              NEXA ERP
            </span>
            <span className="ml-2 text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/20">
              Lisans Bariyeri
            </span>
          </div>
        </div>

        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-800 bg-slate-900/60 hover:bg-slate-800 text-xs font-semibold text-slate-300 hover:text-white transition-colors"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Güvenli Çıkış</span>
        </button>
      </header>

      {/* Main Expired Card */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="max-w-xl w-full rounded-3xl border border-red-500/20 bg-slate-900/80 backdrop-blur-xl p-8 sm:p-10 shadow-2xl shadow-red-950/40 text-center relative"
        >
          {/* Badge */}
          <div className="mx-auto w-20 h-20 rounded-2xl bg-gradient-to-tr from-red-500/20 to-amber-500/20 border border-red-500/30 flex items-center justify-center text-red-400 shadow-inner mb-6">
            <Clock className="w-10 h-10 text-red-400 animate-pulse" />
          </div>

          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold mb-3">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>14 Günlük Demo / Abonelik Süresi Doldu</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight mb-3">
            Lisans Süreniz Dolmuştur
          </h1>

          <p className="text-sm text-slate-400 leading-relaxed mb-6">
            <strong className="text-white">{companyName}</strong> firması için tahsis edilen 14 günlük deneme (trial) veya kurumsal lisans kullanım süresi sona ermiştir. Veri güvenliğiniz korunmakta olup, modüllere erişim askıya alınmıştır.
          </p>

          {/* Tenant summary box */}
          <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 mb-6 text-left space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-slate-500" />
                Firma Unvanı:
              </span>
              <span className="font-semibold text-white truncate max-w-[200px]">{companyName}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-slate-500" />
                Hesap:
              </span>
              <span className="font-mono text-purple-300 text-[11px] truncate max-w-[200px]">{email}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-500" />
                Abonelik Durumu:
              </span>
              <span className="font-bold text-red-400">SÜRESİ DOLDU (EXPIRED)</span>
            </div>
          </div>

          {/* Action CTA Buttons */}
          <div className="space-y-3">
            <button
              onClick={handleContactSales}
              className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white font-bold text-sm shadow-lg shadow-red-600/30 transition-all flex items-center justify-center gap-2 group active:scale-[0.99]"
            >
              <Headphones className="w-4 h-4" />
              <span>Satış & Lisans Yenileme ile İletişime Geç</span>
              <ExternalLink className="w-3.5 h-3.5 opacity-70 group-hover:opacity-100 transition-opacity" />
            </button>

            <button
              onClick={handleWhatsApp}
              className="w-full py-3 px-6 rounded-xl border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 font-semibold text-xs transition-all flex items-center justify-center gap-2"
            >
              <Phone className="w-3.5 h-3.5" />
              <span>WhatsApp Kurumsal Destek Hattı</span>
            </button>
          </div>

          {/* Footer note */}
          <p className="text-[11px] text-slate-500 mt-6">
            Lisans yenilemeniz onaylandığında paneliniz otomatik olarak yeniden aktif hale gelecektir.
          </p>
        </motion.div>
      </main>

      {/* Bottom Footer */}
      <footer className="border-t border-slate-900 px-6 py-3 text-center text-xs text-slate-600 relative z-10">
        © 2026 NXA Software. Tüm hakları saklıdır. Lisans ve Güvenlik Yönetimi.
      </footer>
    </div>
  )
}
