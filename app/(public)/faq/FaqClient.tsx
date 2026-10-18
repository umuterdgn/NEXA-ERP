'use client'
/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * This code is the property of NXA Software.
 */

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { 
  HelpCircle, 
  Search, 
  ChevronDown, 
  ChevronUp, 
  Box, 
  WifiOff, 
  DollarSign, 
  ShieldCheck, 
  Layers, 
  Sparkles, 
  ArrowRight,
  MessageSquare
} from 'lucide-react'

export interface FaqItem {
  id: string
  category: 'bim' | 'offline' | 'finance' | 'isg' | 'general'
  categoryLabel: string
  q: string
  a: string
  keywords: string[]
}

const FAQ_LIST: FaqItem[] = [
  {
    id: 'bim-1',
    category: 'bim',
    categoryLabel: '3D & 5D BIM',
    q: "Nexa ERP'yi mevcut BIM (Revit/Navisworks) yazılımlarımızla nasıl entegre edebiliriz?",
    a: "Nexa ERP, entegre Web-IFC ve WASM motorları sayesinde ağır masaüstü yazılımlarına ihtiyaç duymadan .ifc, .gltf ve .glb formatındaki 3D modelleri doğrudan tarayıcınızda açar. Şantiye şefiniz tabletinden anında 3D revizyonları görebilir ve kusur (snagging) işaretleyebilir.",
    keywords: ["bim", "revit", "navisworks", "ifc", "3d", "wasm", "snagging"]
  },
  {
    id: 'offline-1',
    category: 'offline',
    categoryLabel: 'Saha & Offline',
    q: "Şantiyelerde internet erişimi kesildiğinde sistem çalışmaya devam eder mi?",
    a: "Evet. Nexa ERP, Dexie.js tabanlı 'Offline-First' (Çevrimdışı) senkronizasyon mimarisiyle çalışır. İnternetin çekmediği bodrum katlarda yazdığınız raporlar ve çizdiğiniz paftalar cihazınızda saklanır, bağlantı sağlandığında sunucuya otomatik yüklenir.",
    keywords: ["offline", "çevrimdışı", "internet", "dexie", "senkronizasyon", "bodrum", "şantiye"]
  },
  {
    id: 'finance-1',
    category: 'finance',
    categoryLabel: 'Finans & Hakediş',
    q: "İhale keşif özetlerini (BoQ) sisteme girmek ne kadar sürer?",
    a: "Gelişmiş Excel (Bulk Upload) entegrasyonumuz sayesinde, binlerce satırlık keşif özetlerinizi saniyeler içinde sisteme aktarabilir, 5D BIM eşleştirmesine anında başlayabilirsiniz.",
    keywords: ["excel", "boq", "keşif", "metraj", "bulk upload", "5d bim", "ihale"]
  },
  {
    id: 'finance-2',
    category: 'finance',
    categoryLabel: 'Finans & Hakediş',
    q: "Taşeron hakedişlerini ve ödemelerini nasıl kontrol altında tutuyorsunuz?",
    a: "Sistemimiz 3D model üzerindeki kusurları doğrudan hakediş modülüne bağlar. Kusurlu bir imalat düzeltilmeden o taşerona ait ödeme sistem tarafından otomatik bloke edilir.",
    keywords: ["taşeron", "hakediş", "bloke", "kusur", "ödeme", "kontrol", "snagging"]
  },
  {
    id: 'isg-1',
    category: 'isg',
    categoryLabel: 'İSG & Donanım',
    q: "İşçi güvenliği (İSG) için donanımsal takibiniz yasal mevzuata uygun mu?",
    a: "Kesinlikle. Kamera tabanlı KVKK riskli sistemler yerine, Bluetooth Low Energy (BLE) tabanlı akıllı baret ve yelek zimmetleme kullanıyoruz. İşçinin riskli bölgeye donanımsız girmesi durumunda İSG uzmanına anlık alarm iletilir.",
    keywords: ["isg", "kvkk", "ble", "baret", "yelek", "iot", "donanım", "zimmet", "güvenlik"]
  },
  {
    id: 'bim-2',
    category: 'bim',
    categoryLabel: '3D & 5D BIM',
    q: "Drone ile çekilen şantiye fotogrametri verilerini ve 4D zaman çizelgesini görebilir miyiz?",
    a: "Evet. Nexa ERP'nin 4D Drone Dijital İkizi modülü ile şantiyenizin periyodik drone uçuş modellerini (GLB/GLTF) zaman çizelgesinde geri ve ileri sararak gerçek ilerlemeyi planlanan BIM modeliyle kıyaslayabilirsiniz.",
    keywords: ["drone", "fotogrametri", "4d", "zaman çizelgesi", "şantiye ikizi"]
  },
  {
    id: 'general-1',
    category: 'general',
    categoryLabel: 'Genel & Kurulum',
    q: "Nexa ERP kurulumu için şantiyede yerel bir sunucu kurmamız gerekiyor mu?",
    a: "Hayır. Nexa ERP tamamen bulut tabanlı bir B2B SaaS platformudur. Herhangi bir yerel sunucu donanımına gerek yoktur. Kullanıcılarınız web tarayıcısı veya mobil PWA üzerinden saniyeler içinde yetkileri dahilinde erişim sağlar.",
    keywords: ["kurulum", "sunucu", "bulut", "saas", "pwa"]
  },
  {
    id: 'offline-2',
    category: 'offline',
    categoryLabel: 'Saha & Offline',
    q: "Yapı Denetim ve Müteahhit firmaları tek bir sistem üzerinden iş birliği yapabilir mi?",
    a: "Evet. Çok kiracılı (Multi-Tenant) mimarimiz sayesinde müteahhit firma inşaat operasyonunu yönetirken, ilgili yapı denetim kuruluşu şantiye denetimlerini, YİBF formlarını ve numune/karot kayıtlarını aynı platformda bağımsız yetkiyle gerçekleştirebilir.",
    keywords: ["yapı denetim", "müteahhit", "yibf", "numune", "denetim", "iş birliği"]
  }
]

export default function FaqClient() {
  const [activeCategory, setActiveCategory] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [openIds, setOpenIds] = useState<Record<string, boolean>>({
    'bim-1': true,
    'offline-1': true,
    'finance-1': false,
    'finance-2': false,
    'isg-1': false
  })

  const toggleItem = (id: string) => {
    setOpenIds(prev => ({ ...prev, [id]: !prev[id] }))
  }

  const filteredFaqs = FAQ_LIST.filter(item => {
    const matchesCategory = activeCategory === 'all' || item.category === activeCategory
    if (!matchesCategory) return false

    if (!searchQuery.trim()) return true
    const q = searchQuery.toLowerCase()
    return (
      item.q.toLowerCase().includes(q) ||
      item.a.toLowerCase().includes(q) ||
      item.keywords.some(k => k.toLowerCase().includes(q))
    )
  })

  const categories = [
    { id: 'all', label: 'Tümü' },
    { id: 'bim', label: '3D & 5D BIM' },
    { id: 'offline', label: 'Saha & Offline' },
    { id: 'finance', label: 'Finans & Hakediş' },
    { id: 'isg', label: 'İSG & Donanım' },
    { id: 'general', label: 'Genel & Bulut' },
  ]

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Search Input */}
      <div className="relative mb-8">
        <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          type="text"
          placeholder="Soru veya anahtar kelime arayın (Örn: BIM, Hakediş, Offline, Baret, Excel)..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-12 pr-4 py-4 rounded-2xl bg-slate-900/90 border border-slate-800 text-white placeholder-slate-400 text-sm focus:outline-none focus:border-cyan-500 shadow-xl transition-all"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400 hover:text-white"
          >
            Temizle
          </button>
        )}
      </div>

      {/* Category Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-8 custom-scrollbar">
        {categories.map(cat => {
          const isActive = activeCategory === cat.id
          return (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                isActive
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 shadow-md shadow-cyan-950/40'
                  : 'bg-slate-900/80 text-slate-400 hover:text-white hover:bg-slate-850 border border-slate-800'
              }`}
            >
              {cat.label}
            </button>
          )
        })}
      </div>

      {/* FAQ Accordion Items */}
      {filteredFaqs.length === 0 ? (
        <div className="text-center py-16 bg-slate-900/50 rounded-2xl border border-slate-800 space-y-3">
          <HelpCircle className="w-10 h-10 text-slate-600 mx-auto" />
          <p className="text-sm font-semibold text-slate-300">Aradığınız kriterlere uygun soru bulunamadı.</p>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Arama terimini değiştirebilir veya doğrudan destek ekibimizle iletişime geçebilirsiniz.
          </p>
          <button
            onClick={() => { setSearchQuery(''); setActiveCategory('all'); }}
            className="px-4 py-2 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-white rounded-xl transition"
          >
            Filtreleri Sıfırla
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredFaqs.map((faq, index) => {
            const isOpen = !!openIds[faq.id]
            return (
              <motion.div
                key={faq.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: index * 0.03 }}
                className="bg-slate-900/80 backdrop-blur-md border border-slate-800 hover:border-slate-700/80 rounded-2xl overflow-hidden transition-all duration-200"
              >
                <button
                  type="button"
                  onClick={() => toggleItem(faq.id)}
                  className="w-full p-5 text-left flex items-start justify-between gap-4 text-white hover:text-cyan-300 transition-colors cursor-pointer"
                >
                  <div className="space-y-1">
                    <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-cyan-400 border border-slate-700">
                      {faq.categoryLabel}
                    </span>
                    <h3 className="text-sm sm:text-base font-bold text-slate-100 pr-2 leading-snug">
                      {faq.q}
                    </h3>
                  </div>
                  <span className="w-8 h-8 rounded-lg bg-slate-800/80 flex items-center justify-center shrink-0 text-slate-400 mt-1">
                    {isOpen ? <ChevronUp className="w-4 h-4 text-cyan-400" /> : <ChevronDown className="w-4 h-4" />}
                  </span>
                </button>

                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                      className="px-5 pb-5 pt-1 text-slate-300 text-xs sm:text-sm leading-relaxed border-t border-slate-800/70"
                    >
                      <p>{faq.a}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )
          })}
        </div>
      )}

      {/* Didn't find your answer? */}
      <div className="mt-16 p-8 rounded-3xl bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 border border-slate-800 text-center space-y-4 shadow-2xl">
        <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center mx-auto border border-cyan-500/20">
          <MessageSquare className="w-6 h-6" />
        </div>
        <h3 className="text-xl font-bold text-white">Başka bir sorunuz veya özel bir gereksiniminiz mi var?</h3>
        <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto">
          Şantiyenizin mevcut yazılım altyapısı, ERP entegrasyonu veya özel donanım ihtiyaçları için mühendislik ekibimizle anında görüşün.
        </p>
        <div className="pt-2">
          <Link
            href="/iletisim"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-xs sm:text-sm font-bold text-white bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 shadow-lg shadow-cyan-500/25 transition-all"
          >
            <span>Bize Ulaşın / Demo İsteyin</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  )
}
