'use client'
/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * This code is the property of NXA Software.
 */

import { motion, useScroll } from 'framer-motion'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { ArrowRight, LogIn, Menu, X, Sparkles } from 'lucide-react'

export default function Navbar() {
  const pathname = usePathname()
  
  // Hide navbar on check-in pages
  if (pathname?.startsWith('/check-in')) {
    return null
  }
  
  const { scrollY } = useScroll()
  const [scrolled, setScrolled] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    const unsubscribe = scrollY.on('change', (latest) => {
      setScrolled(latest > 30)
    })
    return () => unsubscribe()
  }, [scrollY])

  const navLinks = [
    { href: '/', label: 'Ana Sayfa' },
    { href: '/about', label: 'Hakkımızda' },
    { href: '/features', label: 'Özellikler' },
    { href: '/faq', label: 'S.S.S.' },
    { href: '/iletisim', label: 'İletişim' },
  ]

  const isLinkActive = (href: string) => {
    if (href === '/') return pathname === '/'
    return pathname?.startsWith(href)
  }

  return (
    <motion.nav
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4 }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-slate-950/90 backdrop-blur-xl border-b border-slate-800/80 shadow-2xl shadow-cyan-950/20'
          : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo & Tagline */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 via-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-cyan-500/25 border border-cyan-400/30 group-hover:scale-105 transition-transform duration-300">
              <span className="text-white font-black text-xl tracking-tighter">N</span>
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-black text-white tracking-tight flex items-center gap-1.5">
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400">Nexa</span>
                <span>ERP</span>
                <span className="hidden sm:inline-block px-1.5 py-0.5 rounded text-[10px] font-bold bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                  4D BIM & SaaS
                </span>
              </span>
              <span className="text-[10px] text-slate-400 font-medium hidden sm:block -mt-0.5">
                Otonom İnşaat & Şantiye İşletim Sistemi
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-1 bg-slate-900/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-slate-800/80">
            {navLinks.map((link) => {
              const active = isLinkActive(link.href)
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`text-xs font-semibold px-4 py-2 rounded-full transition-all duration-200 relative ${
                    active
                      ? 'text-white bg-slate-800/90 shadow-sm border border-slate-700/80'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/40'
                  }`}
                >
                  {link.label}
                  {active && (
                    <motion.span
                      layoutId="nav-pill"
                      className="absolute inset-0 rounded-full border border-cyan-500/40 bg-cyan-500/10 pointer-events-none"
                      transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                </Link>
              )
            })}
          </div>

          {/* Desktop Action Buttons */}
          <div className="hidden sm:flex items-center gap-3">
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-slate-300 hover:text-white bg-slate-900/80 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 transition-all duration-200 shadow-sm"
              title="Yönetim Paneline Giriş"
            >
              <LogIn className="w-3.5 h-3.5 text-slate-400" />
              <span>Sisteme Giriş</span>
            </Link>

            <Link
              href="/iletisim"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 shadow-lg shadow-cyan-500/25 border border-cyan-400/40 transition-all duration-300 transform hover:scale-105 active:scale-95"
            >
              <Sparkles className="w-3.5 h-3.5 text-cyan-200" />
              <span>Demo Talebi</span>
              <ArrowRight className="w-3.5 h-3.5 ml-0.5 text-cyan-200" />
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex sm:hidden items-center gap-2">
            <Link
              href="/login"
              className="px-2.5 py-1.5 rounded-lg text-xs font-bold text-slate-300 bg-slate-900 border border-slate-800"
            >
              Giriş
            </Link>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl bg-slate-900 text-slate-300 hover:text-white border border-slate-800"
              aria-label="Menüyü Aç/Kapat"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="lg:hidden mt-2 pb-6 px-4 pt-3 bg-slate-950/95 backdrop-blur-2xl rounded-2xl border border-slate-800 shadow-2xl space-y-3"
          >
            <div className="space-y-1">
              {navLinks.map((link) => {
                const active = isLinkActive(link.href)
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`block px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                      active
                        ? 'bg-cyan-500/10 text-cyan-300 border border-cyan-500/20'
                        : 'text-slate-300 hover:text-white hover:bg-slate-900'
                    }`}
                  >
                    {link.label}
                  </Link>
                )
              })}
            </div>

            <div className="pt-3 border-t border-slate-800/80 flex flex-col gap-2">
              <Link
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold text-slate-200 bg-slate-900 border border-slate-800 hover:bg-slate-850"
              >
                <LogIn className="w-4 h-4 text-slate-400" />
                <span>Sisteme Giriş (Admin / Portal)</span>
              </Link>
              <Link
                href="/iletisim"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 shadow-md"
              >
                <Sparkles className="w-4 h-4 text-cyan-200" />
                <span>Ücretsiz Demo Talebi</span>
              </Link>
            </div>
          </motion.div>
        )}
      </div>
    </motion.nav>
  )
}
