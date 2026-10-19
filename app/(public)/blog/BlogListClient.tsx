"use client"
/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Nexa ERP Blog & Case Study Showcase Client Component
 */

import { useState, useMemo } from "react"
import Link from "next/link"
import Image from "next/image"
import { 
  Search, 
  Tag, 
  Calendar, 
  User, 
  ArrowRight, 
  Sparkles, 
  BookOpen, 
  Target, 
  SlidersHorizontal,
  Building2,
  ShieldCheck,
  CheckCircle2
} from "lucide-react"

interface BlogPostItem {
  id: string
  title: string
  slug: string
  category: string
  targetAudience: string
  content: string
  imageUrl: string | null
  author: string
  language?: string
  createdAt: string | Date
  updatedAt: string | Date
}

interface BlogListClientProps {
  initialPosts: BlogPostItem[]
}

export default function BlogListClient({ initialPosts }: BlogListClientProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string>("Tümü")
  const [selectedLanguage, setSelectedLanguage] = useState<string>("ALL")

  // Extract unique categories
  const categories = useMemo(() => {
    const cats = Array.from(new Set(initialPosts.map((p) => p.category).filter(Boolean)))
    return ["Tümü", ...cats]
  }, [initialPosts])

  // Filter posts
  const filteredPosts = useMemo(() => {
    return initialPosts.filter((post) => {
      const matchesSearch =
        searchTerm.trim() === "" ||
        post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        post.targetAudience.toLowerCase().includes(searchTerm.toLowerCase()) ||
        post.content.toLowerCase().includes(searchTerm.toLowerCase())

      const matchesCategory =
        selectedCategory === "Tümü" || post.category === selectedCategory

      const matchesLanguage =
        selectedLanguage === "ALL" || (post.language || "tr") === selectedLanguage

      return matchesSearch && matchesCategory && matchesLanguage
    })
  }, [initialPosts, searchTerm, selectedCategory, selectedLanguage])

  // Helper to extract clean preview text from HTML
  const getExcerpt = (html: string, length = 140) => {
    const plain = html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim()
    return plain.length > length ? plain.slice(0, length) + "..." : plain
  }

  // Reading time estimate
  const getReadingTime = (content: string) => {
    const words = content.replace(/<[^>]+>/g, " ").trim().split(/\s+/).length
    const minutes = Math.max(1, Math.round(words / 180))
    return `${minutes} dk okuma`
  }

  return (
    <div className="min-h-screen text-slate-100 pb-24">
      {/* Hero Header */}
      <section className="relative pt-32 pb-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
        {/* Glow Effects */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[350px] bg-gradient-to-tr from-cyan-600/20 via-blue-600/15 to-transparent rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-10 right-10 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-5xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-950/60 border border-cyan-500/30 text-cyan-300 text-xs font-semibold tracking-wide uppercase mb-6 shadow-lg shadow-cyan-950/50">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>GEO & SEO Uyumlu Bilgi Bankası</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.15] mb-6">
            Başarı Hikayeleri &{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-400">
              Sektörel Vaka Analizleri
            </span>
          </h1>

          <p className="text-lg sm:text-xl text-slate-300 max-w-3xl mx-auto leading-relaxed mb-10">
            Büyük ölçekli şantiyelerde finansal kaçakları önleyen, 5D BIM entegrasyonuyla metraj sapmalarını sıfırlayan ve BLE IoT ile iş kazalarını engelleyen gerçek saha deneyimleri.
          </p>

          {/* Search & Filter Bar */}
          <div className="max-w-2xl mx-auto flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Başlık, persona (CFO, Şantiye Şefi) veya anahtar kelime ara..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3.5 bg-slate-900/90 border border-slate-700/80 rounded-xl text-white placeholder-slate-400 text-sm focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all shadow-inner"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-white bg-slate-800 px-2 py-1 rounded"
                >
                  Temizle
                </button>
              )}
            </div>
          </div>

          {/* Category Tabs */}
          <div className="flex flex-wrap items-center justify-center gap-2 mt-6">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                  selectedCategory === cat
                    ? "bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/25 border border-cyan-400/30"
                    : "bg-slate-900/80 text-slate-300 hover:text-white hover:bg-slate-800 border border-slate-800"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Language Selector Pills */}
          <div className="flex items-center justify-center gap-2 mt-4">
            <span className="text-xs text-slate-400 mr-1">Dil / Language:</span>
            <button
              onClick={() => setSelectedLanguage("ALL")}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                selectedLanguage === "ALL"
                  ? "bg-slate-700 text-white border border-slate-500 shadow-sm"
                  : "bg-slate-900/60 text-slate-400 hover:text-white border border-slate-800"
              }`}
            >
              🌐 Tümü (All)
            </button>
            <button
              onClick={() => setSelectedLanguage("tr")}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                selectedLanguage === "tr"
                  ? "bg-red-950 text-red-200 border border-red-700 shadow-sm"
                  : "bg-slate-900/60 text-slate-400 hover:text-white border border-slate-800"
              }`}
            >
              🇹🇷 Türkçe
            </button>
            <button
              onClick={() => setSelectedLanguage("en")}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                selectedLanguage === "en"
                  ? "bg-blue-950 text-blue-200 border border-blue-700 shadow-sm"
                  : "bg-slate-900/60 text-slate-400 hover:text-white border border-slate-800"
              }`}
            >
              🇬🇧 English
            </button>
          </div>
        </div>
      </section>

      {/* Posts Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between pb-6 mb-8 border-b border-slate-800/80">
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <SlidersHorizontal className="w-4 h-4 text-cyan-400" />
            <span>
              Toplam <strong className="text-white font-semibold">{filteredPosts.length}</strong> içerik listeleniyor
            </span>
          </div>
          {selectedCategory !== "Tümü" && (
            <span className="text-xs text-cyan-400 bg-cyan-950/60 px-3 py-1 rounded-full border border-cyan-800/60 font-medium">
              Filtre: {selectedCategory}
            </span>
          )}
        </div>

        {filteredPosts.length === 0 ? (
          <div className="text-center py-20 bg-slate-900/40 rounded-3xl border border-slate-800/80 p-8 max-w-lg mx-auto">
            <div className="w-16 h-16 rounded-2xl bg-slate-800 flex items-center justify-center mx-auto mb-4 text-slate-400">
              <BookOpen className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Arama Sonucu Bulunamadı</h3>
            <p className="text-sm text-slate-400 mb-6">
              Aradığınız kriterlere uygun yayınlanmış makale veya başarı hikayesi bulunamadı.
            </p>
            <button
              onClick={() => {
                setSearchTerm("")
                setSelectedCategory("Tümü")
                setSelectedLanguage("ALL")
              }}
              className="px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-sm transition-all"
            >
              Filtreleri Sıfırla
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredPosts.map((post) => {
              const formattedDate = new Date(post.createdAt).toLocaleDateString("tr-TR", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })

              return (
                <article
                  key={post.id}
                  className="group flex flex-col bg-slate-900/70 border border-slate-800/90 rounded-2xl overflow-hidden hover:border-cyan-500/50 hover:shadow-2xl hover:shadow-cyan-950/30 transition-all duration-300"
                >
                  {/* Card Cover Image */}
                  <Link href={`/blog/${post.slug}`} className="relative h-52 w-full overflow-hidden block bg-slate-950">
                    {post.imageUrl ? (
                      <img
                        src={post.imageUrl}
                        alt={post.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center text-slate-600">
                        <BookOpen className="w-12 h-12" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />
                    
                    {/* Category & Language Badges */}
                    <div className="absolute top-3 left-3 flex items-center gap-1.5">
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-cyan-500/90 text-slate-950 backdrop-blur-md shadow-md">
                        {post.category}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold backdrop-blur-md border uppercase ${
                        post.language === "en"
                          ? "bg-blue-950/90 text-blue-200 border-blue-700 shadow-sm"
                          : "bg-red-950/90 text-red-200 border-red-700 shadow-sm"
                      }`}>
                        {post.language === "en" ? "EN 🇬🇧" : "TR 🇹🇷"}
                      </span>
                    </div>

                    {/* Persona Badge */}
                    <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-slate-900/90 text-cyan-300 border border-cyan-800/40 backdrop-blur-md">
                        <Target className="w-3 h-3 text-cyan-400" />
                        <span className="truncate max-w-[200px]">{post.targetAudience}</span>
                      </span>
                      <span className="text-[11px] text-slate-300 bg-slate-950/80 px-2 py-0.5 rounded backdrop-blur-md">
                        {getReadingTime(post.content)}
                      </span>
                    </div>
                  </Link>

                  {/* Card Body */}
                  <div className="p-6 flex-1 flex flex-col justify-between">
                    <div>
                      {/* Meta info */}
                      <div className="flex items-center gap-3 text-xs text-slate-400 mb-3">
                        <span className="flex items-center gap-1">
                          <User className="w-3.5 h-3.5 text-slate-500" />
                          {post.author}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-slate-500" />
                          {formattedDate}
                        </span>
                      </div>

                      {/* Title */}
                      <h2 className="text-xl font-bold text-white group-hover:text-cyan-300 transition-colors line-clamp-2 mb-3 leading-snug">
                        <Link href={`/blog/${post.slug}`}>
                          {post.title}
                        </Link>
                      </h2>

                      {/* Excerpt */}
                      <p className="text-sm text-slate-400 line-clamp-3 leading-relaxed mb-6">
                        {getExcerpt(post.content, 140)}
                      </p>
                    </div>

                    {/* Footer / Read Link */}
                    <div className="pt-4 border-t border-slate-800/60 flex items-center justify-between">
                      <Link
                        href={`/blog/${post.slug}`}
                        className="inline-flex items-center gap-2 text-sm font-bold text-cyan-400 hover:text-cyan-300 group/link transition-colors"
                      >
                        <span>İncele & Oku</span>
                        <ArrowRight className="w-4 h-4 group-hover/link:translate-x-1 transition-transform" />
                      </Link>
                      <span className="text-xs text-slate-500 font-mono">
                        GEO Optimized
                      </span>
                    </div>
                  </div>
                </article>
              )
            })}
          </div>
        )}

        {/* Bottom CTA Banner */}
        <div className="mt-20 p-8 sm:p-12 rounded-3xl bg-gradient-to-r from-cyan-950/60 via-slate-900 to-blue-950/60 border border-cyan-800/40 relative overflow-hidden text-center sm:text-left flex flex-col sm:flex-row items-center justify-between gap-8 shadow-2xl">
          <div className="max-w-2xl relative z-10">
            <div className="inline-flex items-center gap-2 text-xs font-bold text-cyan-400 uppercase tracking-widest mb-3">
              <Building2 className="w-4 h-4" />
              <span>Nexa ERP Kurumsal Çözümler</span>
            </div>
            <h3 className="text-2xl sm:text-3xl font-black text-white mb-3">
              Şantiyenizdeki Maliyet Kaçaklarına Son Verin
            </h3>
            <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
              5D BIM entegrasyonu, otonom hakediş motoru ve BLE IoT radarını kendi projelerinizde canlı test edin.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 relative z-10 w-full sm:w-auto">
            <Link
              href="/iletisim"
              className="px-6 py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-sm text-center shadow-lg shadow-cyan-500/25 transition-all"
            >
              Ücretsiz Demo Talep Edin
            </Link>
            <Link
              href="/features"
              className="px-6 py-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-sm text-center border border-slate-700 transition-all"
            >
              Modülleri İncele
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
