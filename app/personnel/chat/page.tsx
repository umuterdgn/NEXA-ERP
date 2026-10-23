"use client"
/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Saha İçi İletişim & Şantiye Chat (/personnel/chat)
 */

import { useState, useEffect, useRef } from "react"
import {
  MessageSquare,
  Send,
  Camera,
  Image as ImageIcon,
  Paperclip,
  Check,
  CheckCheck,
  Building2,
  Users,
  RefreshCw,
  Loader2,
  X,
  Bot,
} from "lucide-react"

interface MessageItem {
  id: string
  senderId: string
  content: string
  photoUrl: string | null
  createdAt: string
  sender: {
    id: string
    name: string
    role: string
    profileImage?: string | null
  }
}

export default function PersonnelChatPage() {
  const [messages, setMessages] = useState<MessageItem[]>([])
  const [inputText, setInputText] = useState("")
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [previewPhoto, setPreviewPhoto] = useState<string | null>(null)
  const [projects, setProjects] = useState<Array<{ id: string; name: string }>>([])
  const [selectedProjectId, setSelectedProjectId] = useState<string>("")
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Fetch projects
  useEffect(() => {
    fetch("/api/projects")
      .then((res) => res.json())
      .then((data) => {
        if (data.projects && data.projects.length > 0) {
          setProjects(data.projects)
          setSelectedProjectId(data.projects[0].id)
        }
      })
      .catch((err) => console.error(err))
  }, [])

  // Fetch messages
  const fetchMessages = async () => {
    try {
      const url = selectedProjectId ? `/api/chat?projectId=${selectedProjectId}` : "/api/chat"
      const res = await fetch(url)
      const data = await res.json()
      if (data.messages) {
        setMessages(data.messages)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMessages()
    const interval = setInterval(fetchMessages, 4000) // Poll every 4 seconds
    return () => clearInterval(interval)
  }, [selectedProjectId])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // Handle Photo input (Camera capture)
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onloadend = () => {
      setPreviewPhoto(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  // Send message
  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!inputText.trim() && !previewPhoto) return

    try {
      setSending(true)
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: inputText.trim(),
          photoUrl: previewPhoto || null,
          projectId: selectedProjectId || null,
          channelName: "Şantiye Saha Grubu",
        }),
      })

      if (res.ok) {
        setInputText("")
        setPreviewPhoto(null)
        fetchMessages()
      }
    } catch (err) {
      console.error("Send message error:", err)
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto h-[calc(100vh-140px)] flex flex-col bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl overflow-hidden">
      {/* Chat Header */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span>Şantiye İçi İletişim (Kapalı Devre Chat)</span>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            </h1>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Merkez ofis ve şantiye ekibiyle anlık mesajlaşma & fotoğraf paylaşımı
            </p>
          </div>
        </div>

        {/* Project Selector */}
        <div className="flex items-center gap-2 text-xs">
          <Building2 className="w-4 h-4 text-slate-400 shrink-0" />
          <select
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
            className="px-3 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
          >
            <option value="">Genel Şantiye Kanalı</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Messages Feed */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-slate-50/50 dark:bg-slate-950/40">
        {loading ? (
          <div className="flex items-center justify-center h-full text-xs text-slate-400 gap-2">
            <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
            <span>Mesajlar yükleniyor...</span>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center text-xs text-slate-400 space-y-2">
            <MessageSquare className="w-8 h-8 text-slate-300 dark:text-slate-700" />
            <p>Bu şantiye kanalında henüz mesaj bulunmuyor.</p>
            <p className="text-[11px] text-slate-500">İlk mesajı veya saha fotoğrafını gönderin.</p>
          </div>
        ) : (
          messages.map((m) => {
            const isManager = ["ADMIN", "SUPER_ADMIN", "SITE_MANAGER"].includes(m.sender?.role)

            return (
              <div key={m.id} className="flex items-start gap-2.5 max-w-xl">
                <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-700 dark:text-slate-300 shrink-0">
                  {m.sender?.name ? m.sender.name.slice(0, 2).toUpperCase() : "SA"}
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-[11px]">
                    <span className="font-bold text-slate-900 dark:text-white">
                      {m.sender?.name || "Personel"}
                    </span>
                    {isManager && (
                      <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-blue-950 text-blue-400 border border-blue-800">
                        YÖNETİM
                      </span>
                    )}
                    <span className="text-[10px] text-slate-400">
                      {new Date(m.createdAt).toLocaleTimeString("tr-TR", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>

                  {/* Message Bubble */}
                  <div className="p-3 rounded-2xl rounded-tl-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-100 shadow-sm space-y-2">
                    {/* Attached Photo if any */}
                    {m.photoUrl && (
                      <div className="rounded-xl overflow-hidden max-h-64 border border-slate-200 dark:border-slate-700">
                        <img
                          src={m.photoUrl}
                          alt="Saha Görseli"
                          className="max-h-64 w-full object-cover"
                        />
                      </div>
                    )}
                    {m.content && <p className="leading-relaxed whitespace-pre-wrap">{m.content}</p>}
                  </div>
                </div>
              </div>
            )
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Photo Preview Thumbnail if captured */}
      {previewPhoto && (
        <div className="px-4 py-2 bg-slate-100 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex items-center gap-3">
          <div className="relative w-14 h-14 rounded-lg overflow-hidden border border-blue-500">
            <img src={previewPhoto} alt="Önizleme" className="w-full h-full object-cover" />
            <button
              onClick={() => setPreviewPhoto(null)}
              className="absolute top-0 right-0 bg-black/70 text-white p-0.5 rounded-bl hover:bg-red-600"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
          <span className="text-xs text-blue-500 font-medium">Fotoğraf eklendi, gönderilmeye hazır.</span>
        </div>
      )}

      {/* Input Bar */}
      <form
        onSubmit={handleSend}
        className="p-3 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center gap-2"
      >
        {/* Camera Capture Input */}
        <label
          className="p-2.5 rounded-xl text-slate-500 hover:text-blue-500 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors shrink-0"
          title="Sahadan Anlık Fotoğraf Çek"
        >
          <Camera className="w-5 h-5" />
          <input
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handlePhotoUpload}
            className="hidden"
          />
        </label>

        {/* Gallery Upload */}
        <label
          className="p-2.5 rounded-xl text-slate-500 hover:text-blue-500 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors shrink-0"
          title="Galeriden Fotoğraf Seç"
        >
          <ImageIcon className="w-5 h-5" />
          <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
        </label>

        <input
          type="text"
          placeholder="Şantiyeye veya merkeze mesaj yazın..."
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          className="flex-1 px-4 py-2.5 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
        />

        <button
          type="submit"
          disabled={sending || (!inputText.trim() && !previewPhoto)}
          className="p-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white transition-all shadow-md shadow-blue-600/30 disabled:opacity-40 shrink-0"
        >
          {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        </button>
      </form>
    </div>
  )
}
