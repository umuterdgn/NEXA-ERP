"use client"

/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * This code is the property of NXA Software.
 */

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import Link from "next/link"
import { 
  FileText, 
  Plus, 
  Search, 
  Edit3, 
  Trash2, 
  Eye, 
  EyeOff, 
  ExternalLink, 
  Check, 
  X, 
  Sparkles, 
  Image as ImageIcon, 
  Calendar, 
  Users, 
  Layers, 
  RefreshCw, 
  Bold, 
  Italic, 
  Heading1, 
  Heading2, 
  List, 
  Quote,
  UploadCloud
} from "lucide-react"
import { toast } from "react-hot-toast"
import { 
  addBlogPost, 
  updateBlogPost, 
  deleteBlogPost, 
  togglePublishBlogPost, 
  getBlogPosts,
  type BlogPostInput 
} from "@/app/actions/blog"
import { slugify } from "@/lib/slugify"
import { UploadButton } from "@/lib/uploadthing"

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
  isPublished: boolean
  createdAt: Date | string
  updatedAt: Date | string
}

export default function ContentManagementPage() {
  const [posts, setPosts] = useState<BlogPostItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("ALL")
  const [statusFilter, setStatusFilter] = useState("ALL")
  const [languageFilter, setLanguageFilter] = useState("ALL")
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingPost, setEditingPost] = useState<BlogPostItem | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [activeEditorTab, setActiveEditorTab] = useState<"edit" | "preview">("edit")

  // Form states
  const [formState, setFormState] = useState<BlogPostInput>({
    title: "",
    slug: "",
    category: "Case Study",
    targetAudience: "Patronlar, CFO'lar",
    content: "",
    imageUrl: "",
    author: "Nexa ERP",
    language: "tr",
    isPublished: false,
  })

  const loadPosts = async () => {
    setIsLoading(true)
    try {
      const data = await getBlogPosts()
      setPosts(data as BlogPostItem[])
    } catch (error) {
      toast.error("İçerikler yüklenirken hata oluştu.")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadPosts()
  }, [])

  const handleOpenAddModal = () => {
    setEditingPost(null)
    setFormState({
      title: "",
      slug: "",
      category: "Case Study",
      targetAudience: "Patronlar, CFO'lar",
      content: "",
      imageUrl: "",
      author: "Nexa ERP",
      language: "tr",
      isPublished: true,
    })
    setActiveEditorTab("edit")
    setIsModalOpen(true)
  }

  const handleOpenEditModal = (post: BlogPostItem) => {
    setEditingPost(post)
    setFormState({
      title: post.title,
      slug: post.slug,
      category: post.category,
      targetAudience: post.targetAudience,
      content: post.content,
      imageUrl: post.imageUrl || "",
      author: post.author,
      language: post.language || "tr",
      isPublished: post.isPublished,
    })
    setActiveEditorTab("edit")
    setIsModalOpen(true)
  }

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const title = e.target.value
    setFormState(prev => ({
      ...prev,
      title,
      // Auto-update slug if not manually customized or creating new
      slug: !editingPost ? slugify(title) : prev.slug
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formState.title.trim()) {
      toast.error("Lütfen içerik başlığını girin.")
      return
    }
    if (!formState.content.trim()) {
      toast.error("Lütfen içerik metnini girin.")
      return
    }

    setIsSubmitting(true)
    try {
      if (editingPost) {
        const res = await updateBlogPost(editingPost.id, formState)
        if (res.success) {
          toast.success("İçerik başarıyla güncellendi.")
          setIsModalOpen(false)
          loadPosts()
        } else {
          toast.error(res.error || "Güncelleme başarısız.")
        }
      } else {
        const res = await addBlogPost(formState)
        if (res.success) {
          toast.success("Yeni içerik başarıyla kaydedildi.")
          setIsModalOpen(false)
          loadPosts()
        } else {
          toast.error(res.error || "Kayıt başarısız.")
        }
      }
    } catch (error) {
      toast.error("İşlem sırasında beklenmeyen bir hata oluştu.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleTogglePublish = async (post: BlogPostItem) => {
    const newStatus = !post.isPublished
    try {
      const res = await togglePublishBlogPost(post.id, newStatus)
      if (res.success) {
        toast.success(newStatus ? "İçerik yayına alındı!" : "İçerik yayından kaldırıldı (Taslak).")
        setPosts(prev => prev.map(p => p.id === post.id ? { ...p, isPublished: newStatus } : p))
      } else {
        toast.error("Durum güncellenemedi.")
      }
    } catch {
      toast.error("Hata oluştu.")
    }
  }

  const handleDelete = async (post: BlogPostItem) => {
    if (!confirm(`"${post.title}" başlıklı içeriği silmek istediğinize emin misiniz?`)) return

    try {
      const res = await deleteBlogPost(post.id)
      if (res.success) {
        toast.success("İçerik silindi.")
        setPosts(prev => prev.filter(p => p.id !== post.id))
      } else {
        toast.error("Silme başarısız.")
      }
    } catch {
      toast.error("Hata oluştu.")
    }
  }

  // Formatting helper for content editor
  const insertFormatting = (prefix: string, suffix: string = "") => {
    const textarea = document.getElementById("content-editor") as HTMLTextAreaElement
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selected = textarea.value.substring(start, end)
    const replacement = `${prefix}${selected || "örnek metin"}${suffix}`

    const newContent = textarea.value.substring(0, start) + replacement + textarea.value.substring(end)
    setFormState(prev => ({ ...prev, content: newContent }))
  }

  // Filtered posts
  const filteredPosts = posts.filter(post => {
    if (categoryFilter !== "ALL" && post.category !== categoryFilter) return false
    if (statusFilter === "PUBLISHED" && !post.isPublished) return false
    if (statusFilter === "DRAFT" && post.isPublished) return false
    if (languageFilter !== "ALL" && (post.language || "tr") !== languageFilter) return false

    if (!searchQuery.trim()) return true
    const q = searchQuery.toLowerCase()
    return (
      post.title.toLowerCase().includes(q) ||
      post.slug.toLowerCase().includes(q) ||
      post.targetAudience.toLowerCase().includes(q) ||
      post.category.toLowerCase().includes(q)
    )
  })

  const publishedCount = posts.filter(p => p.isPublished).length
  const draftCount = posts.length - publishedCount

  return (
    <div className="space-y-8 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-md bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              CMS • GEO & SEO Engine
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-3">
            <span>İçerik Yönetimi & Başarı Hikayeleri</span>
            <FileText className="w-6 h-6 text-cyan-400" />
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Google ve Yapay Zeka (LLM) botları için optimize edilmiş vaka analizleri ve blog yazıları oluşturun.
          </p>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-xs sm:text-sm font-bold text-white bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 shadow-xl shadow-cyan-500/20 border border-cyan-400/30 transition-all transform hover:scale-105 active:scale-95 cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Yeni İçerik Ekle</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900/60 backdrop-blur-md border border-slate-800 rounded-2xl p-5 shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Toplam İçerik</span>
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center border border-blue-500/20">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-black text-white">{posts.length}</p>
          <p className="text-xs text-slate-400 mt-1">Sistemdeki tüm kayıtlar</p>
        </div>

        <div className="bg-slate-900/60 backdrop-blur-md border border-slate-800 rounded-2xl p-5 shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Yayında (Canlı)</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
              <Eye className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-black text-emerald-400">{publishedCount}</p>
          <p className="text-xs text-slate-400 mt-1">Ön yüzde taranabilir yazılar</p>
        </div>

        <div className="bg-slate-900/60 backdrop-blur-md border border-slate-800 rounded-2xl p-5 shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Taslaklar</span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center border border-amber-500/20">
              <EyeOff className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-black text-amber-400">{draftCount}</p>
          <p className="text-xs text-slate-400 mt-1">Hazırlık aşamasındaki içerikler</p>
        </div>

        <div className="bg-slate-900/60 backdrop-blur-md border border-slate-800 rounded-2xl p-5 shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">SEO & GEO Durumu</span>
            <div className="w-8 h-8 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center border border-cyan-500/20">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <p className="text-sm font-bold text-cyan-300">Article Schema Aktif</p>
          <p className="text-xs text-slate-400 mt-1">LLM botları için hazır</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900/40 p-4 rounded-2xl border border-slate-800">
        <div className="relative flex-1 min-w-[260px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Başlık, slug, hedef kitle veya kategori ara..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-800/80 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-cyan-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
          >
            <option value="ALL">Tüm Kategoriler</option>
            <option value="Case Study">Başarı Hikayesi / Case Study</option>
            <option value="Haberler">Haberler & Duyurular</option>
            <option value="BIM & Teknoloji">BIM & Teknoloji</option>
            <option value="İSG & Saha">İSG & Saha Yönetimi</option>
            <option value="Finans & Hakediş">Finans & Hakediş</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
          >
            <option value="ALL">Tüm Durumlar</option>
            <option value="PUBLISHED">Sadece Yayında</option>
            <option value="DRAFT">Sadece Taslak</option>
          </select>

          <select
            value={languageFilter}
            onChange={(e) => setLanguageFilter(e.target.value)}
            className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
          >
            <option value="ALL">🌐 Tüm Diller</option>
            <option value="tr">🇹🇷 Türkçe (TR)</option>
            <option value="en">🇬🇧 English (EN)</option>
          </select>

          <button
            onClick={loadPosts}
            className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition"
            title="Yenile"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Posts Table / DataGrid */}
      <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
        {isLoading ? (
          <div className="py-20 text-center text-slate-400 flex flex-col items-center justify-center gap-3">
            <RefreshCw className="w-8 h-8 text-cyan-400 animate-spin" />
            <p className="text-sm font-medium">İçerikler yükleniyor...</p>
          </div>
        ) : filteredPosts.length === 0 ? (
          <div className="py-20 text-center text-slate-400 flex flex-col items-center justify-center gap-3">
            <FileText className="w-12 h-12 text-slate-600" />
            <p className="text-base font-semibold text-slate-300">Henüz içerik bulunmuyor.</p>
            <p className="text-xs text-slate-500 max-w-md">
              Yukarıdaki <strong>"Yeni İçerik Ekle"</strong> butonuna tıklayarak ilk başarı hikayenizi veya blog yazınızı oluşturabilirsiniz.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-800/80 border-b border-slate-700 text-slate-300 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-3.5 px-4">Görsel</th>
                  <th className="py-3.5 px-4">Başlık & URL Slug</th>
                  <th className="py-3.5 px-4">Kategori</th>
                  <th className="py-3.5 px-4">Hedef Kitle</th>
                  <th className="py-3.5 px-4 text-center">Dil</th>
                  <th className="py-3.5 px-4">Yazar</th>
                  <th className="py-3.5 px-4 text-center">Durum</th>
                  <th className="py-3.5 px-4 text-right">İşlemler</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredPosts.map((post) => (
                  <tr key={post.id} className="hover:bg-slate-800/40 transition-colors">
                    {/* Görsel */}
                    <td className="py-3 px-4">
                      {post.imageUrl ? (
                        <img
                          src={post.imageUrl}
                          alt={post.title}
                          className="w-12 h-12 rounded-xl object-cover border border-slate-700"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-500">
                          <ImageIcon className="w-5 h-5" />
                        </div>
                      )}
                    </td>

                    {/* Başlık & Slug */}
                    <td className="py-3 px-4 max-w-xs">
                      <div className="font-bold text-white line-clamp-1">{post.title}</div>
                      <div className="text-[11px] font-mono text-cyan-400/80 truncate">
                        /blog/{post.slug}
                      </div>
                    </td>

                    {/* Kategori */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="px-2.5 py-1 rounded-md text-[10.5px] font-semibold bg-blue-500/15 text-blue-300 border border-blue-500/30">
                        {post.category}
                      </span>
                    </td>

                    {/* Hedef Kitle */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="px-2.5 py-1 rounded-md text-[10.5px] font-semibold bg-purple-500/15 text-purple-300 border border-purple-500/30">
                        {post.targetAudience}
                      </span>
                    </td>

                    {/* Dil */}
                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border uppercase ${
                        post.language === "en"
                          ? "bg-blue-950/80 text-blue-300 border-blue-800"
                          : "bg-red-950/80 text-red-300 border-red-800"
                      }`}>
                        {post.language === "en" ? "EN 🇬🇧" : "TR 🇹🇷"}
                      </span>
                    </td>

                    {/* Yazar */}
                    <td className="py-3 px-4 whitespace-nowrap text-slate-300">
                      {post.author}
                    </td>

                    {/* Durum / Toggle */}
                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => handleTogglePublish(post)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold border transition-all cursor-pointer ${
                          post.isPublished
                            ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/30"
                            : "bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-750"
                        }`}
                        title={post.isPublished ? "Yayından kaldır" : "Yayına al"}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${post.isPublished ? "bg-emerald-400 animate-pulse" : "bg-slate-500"}`} />
                        <span>{post.isPublished ? "Yayında" : "Taslak"}</span>
                      </button>
                    </td>

                    {/* İşlemler */}
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-2">
                        {post.isPublished && (
                          <Link
                            href={`/blog/${post.slug}`}
                            target="_blank"
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-400 hover:text-cyan-300 transition"
                            title="Ön Yüzde Görüntüle"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </Link>
                        )}

                        <button
                          type="button"
                          onClick={() => handleOpenEditModal(post)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-blue-400 hover:text-blue-300 transition cursor-pointer"
                          title="Düzenle"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDelete(post)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-red-950/50 text-red-400 hover:text-red-300 transition cursor-pointer"
                          title="Sil"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* --- ADD / EDIT BLOG POST MODAL --- */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-slate-900 border border-slate-700/80 rounded-3xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden"
            >
              {/* Modal Header */}
              <div className="p-5 px-6 border-b border-slate-800 flex items-center justify-between bg-slate-850 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center border border-cyan-500/30">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">
                      {editingPost ? "İçeriği Düzenle" : "Yeni İçerik & Başarı Hikayesi Ekle"}
                    </h3>
                    <p className="text-xs text-slate-400">SEO & GEO uyumlu zengin metin editörü</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Form Body */}
              <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 custom-scrollbar flex-1">
                {/* Başlık */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    İçerik Başlığı (H1) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Örn: 5D BIM ile Şantiyelerde %30 Finansal Kaçağın Önlenmesi"
                    value={formState.title}
                    onChange={handleTitleChange}
                    className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-cyan-500 transition"
                  />
                </div>

                {/* Slug & Yazar */}
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      URL Slug (Kalıcı Bağlantı)
                    </label>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-500 font-mono">/blog/</span>
                      <input
                        type="text"
                        placeholder="otomatik-olusturulur"
                        value={formState.slug || ""}
                        onChange={(e) => setFormState(prev => ({ ...prev, slug: e.target.value }))}
                        className="flex-1 px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white font-mono text-xs focus:outline-none focus:border-cyan-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Yazar / Kurum
                    </label>
                    <input
                      type="text"
                      value={formState.author || "Nexa ERP"}
                      onChange={(e) => setFormState(prev => ({ ...prev, author: e.target.value }))}
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                </div>

                {/* Kategori, Hedef Kitle ve Dil */}
                <div className="grid sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Kategori *
                    </label>
                    <select
                      value={formState.category}
                      onChange={(e) => setFormState(prev => ({ ...prev, category: e.target.value }))}
                      className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-cyan-500"
                    >
                      <option value="Case Study">Başarı Hikayesi / Case Study</option>
                      <option value="Yapı Denetim & AI">Yapı Denetim & AI</option>
                      <option value="Haberler">Haberler & Duyurular</option>
                      <option value="BIM & Teknoloji">BIM & 4D/5D Teknoloji</option>
                      <option value="İSG & Saha">İSG & Saha Yönetimi</option>
                      <option value="Finans & Hakediş">Finans & Hakediş</option>
                      <option value="Sektörel İnceleme">Sektörel İnceleme</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Hedef Kitle (Persona) *
                    </label>
                    <input
                      type="text"
                      placeholder="Örn: Patronlar, CFO'lar, Şantiye Şefleri"
                      value={formState.targetAudience}
                      onChange={(e) => setFormState(prev => ({ ...prev, targetAudience: e.target.value }))}
                      className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-cyan-500"
                    >
                    </input>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Yayın Dili (Language) *
                    </label>
                    <select
                      value={formState.language || "tr"}
                      onChange={(e) => setFormState(prev => ({ ...prev, language: e.target.value }))}
                      className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-cyan-500"
                    >
                      <option value="tr">🇹🇷 Türkçe (tr)</option>
                      <option value="en">🇬🇧 English (en)</option>
                    </select>
                  </div>
                </div>

                {/* Kapak Görseli (UploadThing veya URL) */}
                <div className="p-4 rounded-2xl bg-slate-800/50 border border-slate-700 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                      <ImageIcon className="w-4 h-4 text-cyan-400" />
                      <span>Kapak Fotoğrafı</span>
                    </label>
                    <span className="text-[10px] text-slate-400">UploadThing veya Harici URL</span>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center gap-4">
                    <div className="flex-1 w-full">
                      <input
                        type="url"
                        placeholder="https://... veya aşağıdaki butondan dosya yükleyin"
                        value={formState.imageUrl || ""}
                        onChange={(e) => setFormState(prev => ({ ...prev, imageUrl: e.target.value }))}
                        className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-cyan-500"
                      />
                    </div>

                    <div className="shrink-0">
                      <UploadButton
                        endpoint="blogImageUploader"
                        onClientUploadComplete={(res) => {
                          if (res && res[0]?.url) {
                            setFormState(prev => ({ ...prev, imageUrl: res[0].url }))
                            toast.success("Görsel başarıyla yüklendi!")
                          }
                        }}
                        onUploadError={(error: Error) => {
                          toast.error(`Yükleme hatası: ${error.message}`)
                        }}
                        appearance={{
                          button: "px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-bold transition shadow-md",
                          allowedContent: "hidden"
                        }}
                      />
                    </div>
                  </div>

                  {formState.imageUrl && (
                    <div className="relative w-full h-36 rounded-xl overflow-hidden border border-slate-700 bg-slate-900">
                      <img
                        src={formState.imageUrl}
                        alt="Önizleme"
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => setFormState(prev => ({ ...prev, imageUrl: "" }))}
                        className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/70 text-white hover:bg-red-600 transition"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Zengin İçerik Editörü */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between border-b border-slate-700 pb-2">
                    <label className="text-xs font-semibold text-slate-300">
                      Detaylı İçerik (Zengin Metin / Markdown) *
                    </label>

                    <div className="flex items-center gap-1 bg-slate-800 p-1 rounded-xl">
                      <button
                        type="button"
                        onClick={() => setActiveEditorTab("edit")}
                        className={`px-3 py-1 rounded-lg text-xs font-medium transition ${
                          activeEditorTab === "edit" ? "bg-cyan-600 text-white" : "text-slate-400 hover:text-white"
                        }`}
                      >
                        Düzenle
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveEditorTab("preview")}
                        className={`px-3 py-1 rounded-lg text-xs font-medium transition ${
                          activeEditorTab === "preview" ? "bg-cyan-600 text-white" : "text-slate-400 hover:text-white"
                        }`}
                      >
                        Önizleme
                      </button>
                    </div>
                  </div>

                  {activeEditorTab === "edit" ? (
                    <div className="space-y-2">
                      {/* Biçimlendirme Araç Çubuğu */}
                      <div className="flex flex-wrap items-center gap-1.5 p-2 bg-slate-800/80 rounded-xl border border-slate-700 text-xs text-slate-300">
                        <button
                          type="button"
                          onClick={() => insertFormatting("## ", "\n")}
                          className="px-2.5 py-1 rounded-lg bg-slate-700 hover:bg-slate-600 font-bold"
                          title="H2 Başlık Ekle"
                        >
                          H2
                        </button>
                        <button
                          type="button"
                          onClick={() => insertFormatting("### ", "\n")}
                          className="px-2.5 py-1 rounded-lg bg-slate-700 hover:bg-slate-600 font-bold"
                          title="H3 Başlık Ekle"
                        >
                          H3
                        </button>
                        <button
                          type="button"
                          onClick={() => insertFormatting("**", "**")}
                          className="p-1.5 rounded-lg bg-slate-700 hover:bg-slate-600"
                          title="Kalın (Bold)"
                        >
                          <Bold className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => insertFormatting("*", "*")}
                          className="p-1.5 rounded-lg bg-slate-700 hover:bg-slate-600"
                          title="İtalik"
                        >
                          <Italic className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => insertFormatting("- ", "\n")}
                          className="p-1.5 rounded-lg bg-slate-700 hover:bg-slate-600"
                          title="Maddeleme"
                        >
                          <List className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => insertFormatting("> ", "\n")}
                          className="p-1.5 rounded-lg bg-slate-700 hover:bg-slate-600"
                          title="Alıntı (Quote)"
                        >
                          <Quote className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => insertFormatting("\n\n---\n**💡 Nexa ERP Notu:** ", "\n---\n\n")}
                          className="px-2.5 py-1 rounded-lg bg-cyan-950/80 hover:bg-cyan-900 text-cyan-300 border border-cyan-500/30 font-medium"
                          title="Vurgulu Modül Notu Ekle"
                        >
                          + Reklam/Modül Notu
                        </button>
                      </div>

                      <textarea
                        id="content-editor"
                        rows={12}
                        required
                        placeholder="İçeriğinizi buraya yazın veya yapıştırın. Markdown formatı desteklenir (## Başlık, - Maddeleme vb.)..."
                        value={formState.content}
                        onChange={(e) => setFormState(prev => ({ ...prev, content: e.target.value }))}
                        className="w-full p-4 bg-slate-800 border border-slate-700 rounded-2xl text-white text-xs sm:text-sm font-sans leading-relaxed focus:outline-none focus:border-cyan-500 transition resize-y"
                      />
                    </div>
                  ) : (
                    <div className="p-5 bg-slate-950 rounded-2xl border border-slate-800 max-h-96 overflow-y-auto prose prose-invert prose-sm max-w-none">
                      {formState.content ? (
                        <div className="whitespace-pre-wrap leading-relaxed text-slate-300">
                          {formState.content}
                        </div>
                      ) : (
                        <p className="text-slate-500 italic">Önizlenecek içerik bulunmuyor.</p>
                      )}
                    </div>
                  )}
                </div>

                {/* Yayında mı? Toggle */}
                <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-800/40 border border-slate-700">
                  <div>
                    <h4 className="text-xs font-bold text-white">Yayınlanma Durumu</h4>
                    <p className="text-[11px] text-slate-400">Aktif edilirse hemen ön yüzde ve Google indeksinde yayına alınır.</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formState.isPublished}
                      onChange={(e) => setFormState(prev => ({ ...prev, isPublished: e.target.checked }))}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                  </label>
                </div>

                {/* Modal Footer */}
                <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3 shrink-0">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-5 py-2.5 rounded-xl text-xs font-bold text-slate-300 bg-slate-800 hover:bg-slate-700 transition"
                  >
                    İptal
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 shadow-lg shadow-cyan-500/25 transition disabled:opacity-50"
                  >
                    {isSubmitting ? "Kaydediliyor..." : editingPost ? "Değişiklikleri Kaydet" : "İçeriği Oluştur"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
