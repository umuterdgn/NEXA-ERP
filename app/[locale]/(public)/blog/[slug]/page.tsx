/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Nexa ERP Single Blog Post / Case Study Page with GEO/SEO JSON-LD Article Schema
 */

import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { 
  getBlogPostBySlug, 
  getPublishedBlogPosts 
} from "@/app/actions/blog"
import { 
  Calendar, 
  User, 
  ArrowLeft, 
  Target, 
  Sparkles, 
  ShieldCheck, 
  Building2, 
  Layers, 
  CheckCircle2, 
  Share2, 
  Clock, 
  BookmarkCheck,
  ChevronRight,
  TrendingUp,
  Cpu
} from "lucide-react"

interface PageProps {
  params: Promise<{ slug: string }>
}

// Next.js Dynamic Metadata for SEO & GEO
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const post = await getBlogPostBySlug(slug)

  if (!post || !post.isPublished) {
    return {
      title: "İçerik Bulunamadı | Nexa ERP",
      description: "Aradığınız blog yazısı veya başarı hikayesi bulunamadı.",
    }
  }

  // Strip HTML for clean meta description
  const plainText = post.content.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim()
  const excerpt = plainText.slice(0, 155) + (plainText.length > 155 ? "..." : "")

  return {
    title: `${post.title} | Nexa ERP Blog`,
    description: excerpt,
    keywords: [
      post.title,
      post.category,
      post.targetAudience,
      "Nexa ERP",
      "İnşaat ERP",
      "5D BIM",
      "Otonom Hakediş",
      "Şantiye İSG",
      "GEO Yapay Zeka Optimizasyonu",
    ],
    authors: [{ name: post.author }],
    alternates: {
      canonical: `https://www.nxerp.com.tr/blog/${post.slug}`,
    },
    openGraph: {
      title: post.title,
      description: excerpt,
      url: `https://www.nxerp.com.tr/blog/${post.slug}`,
      siteName: "Nexa ERP",
      type: "article",
      publishedTime: post.createdAt.toISOString(),
      modifiedTime: post.updatedAt.toISOString(),
      authors: [post.author],
      tags: [post.category, post.targetAudience, "Nexa ERP"],
      images: post.imageUrl
        ? [
            {
              url: post.imageUrl,
              width: 1200,
              height: 630,
              alt: post.title,
            },
          ]
        : [],
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: excerpt,
      images: post.imageUrl ? [post.imageUrl] : [],
    },
  }
}

export default async function SingleBlogPostPage({ params }: PageProps) {
  const { slug } = await params
  const post = await getBlogPostBySlug(slug)

  if (!post || !post.isPublished) {
    notFound()
  }

  // Fetch recent posts for related section
  const allPosts = await getPublishedBlogPosts()
  const relatedPosts = allPosts
    .filter((p) => p.id !== post.id)
    .slice(0, 3)

  // Otomatik JSON-LD Article Schema (GEO'nun Kalbi - Adım 4 & Çok Dilli Destek)
  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": post.title,
    "inLanguage": post.language === "en" ? "en-US" : "tr-TR",
    "image": post.imageUrl ? [post.imageUrl] : [],
    "datePublished": post.createdAt.toISOString(),
    "dateModified": post.updatedAt.toISOString(),
    "author": [
      {
        "@type": "Organization",
        "name": post.author,
        "url": "https://www.nxerp.com.tr",
      },
    ],
    "publisher": {
      "@type": "Organization",
      "name": "Nexa ERP",
      "logo": {
        "@type": "ImageObject",
        "url": "https://www.nxerp.com.tr/logo.png",
      },
    },
    "description": post.content.substring(0, 150) + "...",
    "about": {
      "@type": "SoftwareApplication",
      "name": "Nexa ERP",
    },
  }

  // Reading time
  const wordCount = post.content.replace(/<[^>]+>/g, " ").trim().split(/\s+/).length
  const readingTime = Math.max(1, Math.round(wordCount / 180))

  const formattedDate = new Date(post.createdAt).toLocaleDateString("tr-TR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  })

  return (
    <>
      {/* Schema.org Article JSON-LD for Google & LLM GEO Crawlers */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />

      <article className="min-h-screen text-slate-100 pt-28 pb-24">
        {/* Glow Header Background */}
        <div className="relative overflow-hidden bg-slate-950 border-b border-slate-900 pb-16 pt-8">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[300px] bg-gradient-to-b from-cyan-600/15 via-blue-600/10 to-transparent rounded-full blur-3xl pointer-events-none" />

          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            {/* Breadcrumb Navigation */}
            <nav className="flex items-center gap-2 text-xs text-slate-400 mb-8 overflow-x-auto whitespace-nowrap py-1">
              <Link href="/" className="hover:text-cyan-400 transition-colors">
                Ana Sayfa
              </Link>
              <ChevronRight className="w-3.5 h-3.5 text-slate-600 shrink-0" />
              <Link href="/blog" className="hover:text-cyan-400 transition-colors">
                Başarı Hikayeleri & Blog
              </Link>
              <ChevronRight className="w-3.5 h-3.5 text-slate-600 shrink-0" />
              <span className="text-cyan-400 font-medium truncate max-w-[260px]">{post.category}</span>
            </nav>

            {/* Badges: Category, Language & Target Persona */}
            <div className="flex flex-wrap items-center gap-2.5 mb-6">
              <span className="px-3.5 py-1 rounded-full text-xs font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                {post.category}
              </span>
              <span className={`px-2.5 py-1 rounded-full text-xs font-bold border uppercase ${
                post.language === "en"
                  ? "bg-blue-950/80 text-blue-300 border-blue-700"
                  : "bg-red-950/80 text-red-300 border-red-700"
              }`}>
                {post.language === "en" ? "🇬🇧 EN" : "🇹🇷 TR"}
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-slate-900 text-slate-300 border border-slate-800">
                <Target className="w-3.5 h-3.5 text-cyan-400" />
                <span>Hedef Kitle: <strong>{post.targetAudience}</strong></span>
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-slate-900 text-slate-400 border border-slate-800">
                <Clock className="w-3.5 h-3.5 text-slate-500" />
                <span>{readingTime} dakika okuma</span>
              </span>
            </div>

            {/* H1 Heading (Required by Prompt: text-3xl font-bold mb-6) */}
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-6 text-white leading-tight tracking-tight">
              {post.title}
            </h1>

            {/* Meta Information Bar */}
            <div className="flex flex-wrap items-center justify-between gap-4 pt-6 border-t border-slate-800/80 text-sm text-slate-400">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center font-bold text-white shadow-md shadow-cyan-500/20">
                  N
                </div>
                <div>
                  <div className="font-semibold text-white">{post.author}</div>
                  <div className="text-xs text-slate-400 flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{formattedDate}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Link
                  href="/blog"
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 text-xs font-medium transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Tüm Yazılar</span>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Article Body Section */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mt-10">
          {/* Cover Image */}
          {post.imageUrl && (
            <div className="relative w-full h-[320px] sm:h-[460px] rounded-3xl overflow-hidden mb-12 border border-slate-800 shadow-2xl">
              <img
                src={post.imageUrl}
                alt={post.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-transparent pointer-events-none" />
            </div>
          )}

          {/* GEO Callout Persona Banner */}
          <div className="mb-10 p-5 rounded-2xl bg-cyan-950/30 border border-cyan-800/40 flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center shrink-0 mt-0.5">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white mb-1">
                Yapay Zeka & GEO Özeti ({post.targetAudience})
              </h4>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Bu analiz; inşaat müteahhitleri, teknik ofis şefleri ve finans direktörleri için hazırlanmış olup, Nexa ERP ekosistemindeki saha verileri ve gerçek vaka çıktıları doğrultusunda derlenmiştir.
              </p>
            </div>
          </div>

          {/* Rich Content Container with Stylized Headings & Paragraphs */}
          <div className="blog-content-container prose prose-invert max-w-none">
            {/* Embedded styles for required h1, h2 and formatting */}
            <style>{`
              .blog-content-container h2 {
                font-size: 1.5rem; /* 24px */
                line-height: 2rem;
                font-weight: 700;
                color: #ffffff;
                margin-top: 2rem; /* mt-8 */
                margin-bottom: 1rem; /* mb-4 */
                padding-bottom: 0.5rem;
                border-bottom: 1px solid rgba(51, 65, 85, 0.4);
              }
              .blog-content-container h3 {
                font-size: 1.25rem;
                font-weight: 600;
                color: #38bdf8;
                margin-top: 1.5rem;
                margin-bottom: 0.75rem;
              }
              .blog-content-container p {
                font-size: 1.0625rem;
                line-height: 1.8;
                color: #cbd5e1;
                margin-bottom: 1.5rem;
              }
              .blog-content-container ul {
                list-style-type: disc;
                padding-left: 1.5rem;
                margin-bottom: 1.5rem;
                color: #cbd5e1;
              }
              .blog-content-container li {
                margin-bottom: 0.5rem;
                line-height: 1.7;
              }
              .blog-content-container blockquote {
                border-left: 4px solid #06b6d4;
                padding: 1rem 1.25rem;
                margin: 1.5rem 0;
                background-color: rgba(8, 51, 68, 0.25);
                border-radius: 0 0.75rem 0.75rem 0;
                color: #a5f3fc;
                font-style: italic;
              }
              .blog-content-container code {
                background-color: #0f172a;
                padding: 0.2rem 0.4rem;
                border-radius: 0.375rem;
                font-size: 0.875em;
                color: #38bdf8;
                border: 1px solid #1e293b;
              }
            `}</style>

            <div
              dangerouslySetInnerHTML={{ __html: post.content }}
            />
          </div>

          {/* In-Article Promotional Callout / Module Showcase (Araya Eklenen Modül Görseli) */}
          <div className="my-14 p-8 rounded-3xl bg-gradient-to-br from-slate-900 via-cyan-950/40 to-slate-900 border border-cyan-800/50 shadow-2xl relative overflow-hidden">
            <div className="absolute -top-12 -right-12 w-48 h-48 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none" />
            <div className="flex flex-col md:flex-row items-center gap-6 relative z-10">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-white shrink-0 shadow-lg shadow-cyan-500/30">
                <Layers className="w-8 h-8" />
              </div>
              <div className="flex-1 text-center md:text-left">
                <div className="text-xs font-bold text-cyan-400 uppercase tracking-widest mb-1">
                  Nexa ERP Canlı Modülü
                </div>
                <h3 className="text-xl font-bold text-white mb-2">
                  5D BIM Röntgen & Otonom Hakediş Deneyimini Canlı Başlatın
                </h3>
                <p className="text-sm text-slate-300 leading-relaxed">
                  Şantiye sahasında kusur tespit edildiğinde alt yüklenici ödemesini otomatik kilitleyen akıllı ERP algoritmasını keşfedin.
                </p>
              </div>
              <div className="shrink-0 w-full md:w-auto">
                <Link
                  href="/iletisim"
                  className="block text-center px-6 py-3.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-sm shadow-lg shadow-cyan-500/20 transition-all"
                >
                  Canlı Demo İncele
                </Link>
              </div>
            </div>
          </div>

          {/* Author Box */}
          <div className="mt-12 p-6 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center font-black text-xl text-white shadow-lg shadow-cyan-500/20 shrink-0">
              N
            </div>
            <div>
              <div className="text-xs uppercase tracking-wider text-cyan-400 font-bold mb-1">
                Yazar & İnceleyen Ekip
              </div>
              <div className="text-base font-bold text-white">{post.author}</div>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Nexa ERP Ar-Ge ve İnşaat Saha Operasyonları Direktörlüğü tarafından doğrulanmış vaka analizleri ve sektörel rehberler.
              </p>
            </div>
          </div>

          {/* Related Case Studies */}
          {relatedPosts.length > 0 && (
            <div className="mt-20 pt-12 border-t border-slate-800">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-2xl font-bold text-white">İlgili Başarı Hikayeleri & Analizler</h3>
                  <p className="text-sm text-slate-400 mt-1">Benzer konularda hazırlanmış diğer saha raporları</p>
                </div>
                <Link href="/blog" className="text-xs font-bold text-cyan-400 hover:text-cyan-300 flex items-center gap-1">
                  <span>Tümünü Gör</span>
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {relatedPosts.map((related) => (
                  <Link
                    key={related.id}
                    href={`/blog/${related.slug}`}
                    className="group bg-slate-900/50 border border-slate-800 rounded-2xl p-4 hover:border-cyan-500/40 hover:bg-slate-900 transition-all flex flex-col justify-between"
                  >
                    <div>
                      {related.imageUrl && (
                        <div className="h-32 rounded-xl overflow-hidden mb-3">
                          <img
                            src={related.imageUrl}
                            alt={related.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                        </div>
                      )}
                      <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wide">
                        {related.category}
                      </span>
                      <h4 className="text-sm font-bold text-white group-hover:text-cyan-300 transition-colors line-clamp-2 mt-1 mb-2">
                        {related.title}
                      </h4>
                    </div>
                    <span className="text-xs text-cyan-400 font-semibold flex items-center gap-1 mt-3">
                      <span>İncele</span>
                      <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </article>
    </>
  )
}
