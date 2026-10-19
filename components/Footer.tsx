'use client'
/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * This code is the property of NXA Software.
 */

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Box, Shield, Cpu, Activity, Mail, Phone, MapPin, ArrowRight } from 'lucide-react'

export default function Footer() {
  const pathname = usePathname()
  
  // Hide footer on check-in pages
  if (pathname?.startsWith('/check-in')) {
    return null
  }
  
  return (
    <footer className="bg-slate-950 border-t border-slate-900 py-16 px-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />
      <div className="max-w-7xl mx-auto relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 mb-12">
          {/* Brand Info */}
          <div className="lg:col-span-2 space-y-4">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-white font-black text-lg shadow-lg shadow-cyan-500/20">
                N
              </div>
              <span className="text-xl font-black text-white tracking-tight">
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400">Nexa</span> ERP
              </span>
            </Link>
            <p className="text-slate-400 text-sm leading-relaxed max-w-sm">
              İnşaat müteahhitleri ve yapı denetim firmaları için 4D dijital ikiz, 5D BIM entegrasyonu, BLE IoT tabanlı şantiye güvenliği ve otonom hakediş işletim sistemi.
            </p>
            <div className="flex flex-wrap gap-2 pt-2">
              <span className="px-2.5 py-1 rounded-md text-[11px] font-medium bg-slate-900 text-cyan-300 border border-slate-800">
                WASM 5D BIM
              </span>
              <span className="px-2.5 py-1 rounded-md text-[11px] font-medium bg-slate-900 text-blue-300 border border-slate-800">
                Offline-First PWA
              </span>
              <span className="px-2.5 py-1 rounded-md text-[11px] font-medium bg-slate-900 text-emerald-300 border border-slate-800">
                KVKK Uyumlu BLE
              </span>
            </div>
          </div>

          {/* SaaS Modülleri */}
          <div>
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-4">
              Platform & Özellikler
            </h4>
            <ul className="space-y-2.5 text-xs text-slate-400">
              <li>
                <Link href="/features#bim" className="hover:text-cyan-300 transition-colors">
                  5D BIM & X-Ray Modülü
                </Link>
              </li>
              <li>
                <Link href="/features#hakedis" className="hover:text-cyan-300 transition-colors">
                  Otonom Hakediş & BoQ
                </Link>
              </li>
              <li>
                <Link href="/features#offline" className="hover:text-cyan-300 transition-colors">
                  Offline-First Şantiye Defteri
                </Link>
              </li>
              <li>
                <Link href="/features#isg" className="hover:text-cyan-300 transition-colors">
                  BLE IoT İSG Takibi
                </Link>
              </li>
              <li>
                <Link href="/features#taseron" className="hover:text-cyan-300 transition-colors">
                  Taşeron Portalı & Denetim
                </Link>
              </li>
            </ul>
          </div>

          {/* Kurumsal Linkler */}
          <div>
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-4">
              Kurumsal
            </h4>
            <ul className="space-y-2.5 text-xs text-slate-400">
              <li>
                <Link href="/" className="hover:text-white transition-colors">
                  Ana Sayfa
                </Link>
              </li>
              <li>
                <Link href="/about" className="hover:text-white transition-colors">
                  Hakkımızda (Neden Nexa?)
                </Link>
              </li>
              <li>
                <Link href="/features" className="hover:text-white transition-colors">
                  Özellikler & Kıyaslama
                </Link>
              </li>
              <li>
                <Link href="/blog" className="hover:text-white transition-colors">
                  Başarı Hikayeleri & Blog
                </Link>
              </li>
              <li>
                <Link href="/faq" className="hover:text-white transition-colors">
                  Sıkça Sorulan Sorular (S.S.S.)
                </Link>
              </li>
              <li>
                <Link href="/iletisim" className="hover:text-white transition-colors">
                  İletişim & Demo Talebi
                </Link>
              </li>
            </ul>
          </div>

          {/* İletişim Bilgileri */}
          <div>
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-4">
              İletişim
            </h4>
            <ul className="space-y-3 text-xs text-slate-400">
              <li className="flex items-start gap-2.5">
                <Mail className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                <span>info@nexa-erp.com</span>
              </li>
              <li className="flex items-start gap-2.5">
                <Phone className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                <span>+90 505 147 77 29</span>
              </li>
              <li className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                <span>İskenderun / Hatay, Türkiye</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-slate-900 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-slate-500">
          <p>
            © {new Date().getFullYear()} Nexa ERP. Tüm hakları saklıdır. Geliştirici: NXA Software.
          </p>
          <div className="flex items-center gap-6">
            <Link href="/faq" className="hover:text-slate-300 transition-colors">
              Güvenlik & Mimari S.S.S.
            </Link>
            <Link
              href="/login"
              className="flex items-center gap-1.5 text-cyan-400 hover:text-cyan-300 font-semibold transition-colors"
            >
              <span>Yönetim Paneli Girişi</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
