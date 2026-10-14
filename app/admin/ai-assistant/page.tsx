"use client"
/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Nexa ERP - OpenAI/ChatGPT Style AI Tahsilat ve Risk Asistanı
 */

import React, { useState, useRef, useEffect } from "react"
import { 
  Bot, 
  Send, 
  Sparkles, 
  User, 
  Loader2, 
  AlertTriangle, 
  TrendingDown, 
  Wallet, 
  Building2, 
  Copy, 
  Check, 
  RotateCcw, 
  Clock, 
  ShieldAlert,
  ArrowRight,
  Database,
  Layers,
  ChevronRight
} from "lucide-react"
import toast from "react-hot-toast"

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: Date
  metrics?: {
    totalContracts?: number
    delayedContracts?: number
    pendingBillings?: number
    pendingAmount?: number
  }
}

const QUICK_PROMPTS = [
  {
    title: "Geciken Taşeronlar",
    prompt: "Hangi taşeronlar işi geciktiriyor?",
    icon: Clock,
    color: "from-amber-500/20 to-rose-500/20 text-amber-400 border-amber-500/30"
  },
  {
    title: "Hakediş & Ödeme Riski",
    prompt: "Hakediş ödemelerinde risk var mı?",
    icon: Wallet,
    color: "from-blue-500/20 to-cyan-500/20 text-cyan-400 border-cyan-500/30"
  },
  {
    title: "Bütçe ve Projeler",
    prompt: "Bütçe aşımı olan projeleri özetle",
    icon: Building2,
    color: "from-purple-500/20 to-indigo-500/20 text-purple-400 border-purple-500/30"
  },
  {
    title: "Genel Risk Özeti",
    prompt: "Genel finans ve nakit akışı risk analizi yap",
    icon: ShieldAlert,
    color: "from-emerald-500/20 to-teal-500/20 text-emerald-400 border-emerald-500/30"
  }
]

export default function AIAssistantPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome-1",
      role: "assistant",
      content: `Merhaba! Ben **Nexa AI Tahsilat ve Risk Asistanı**'yım.\n\nSistemdeki tüm aktif sözleşmeleri, hakediş ödeme tablolarını, taşeron termin tarihlerini ve proje bütçelerini gerçek zamanlı inceleyebilirim.\n\nAşağıdaki hazır analizlerden birini seçebilir veya aklınıza gelen herhangi bir finansal/şantiye riskini sorabilirsiniz.`,
      timestamp: new Date()
    }
  ])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, isLoading])

  // Handle textarea auto-resize
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto"
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 160)}px`
    }
  }, [input])

  const handleSend = async (textToSend?: string) => {
    const query = (textToSend || input).trim()
    if (!query || isLoading) return

    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content: query,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMsg])
    setInput("")
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto"
    }
    setIsLoading(true)

    try {
      const historyPayload = messages.slice(-6).map(m => ({
        role: m.role,
        content: m.content
      }))

      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: query,
          history: historyPayload
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Sunucudan yanıt alınamadı.")
      }

      const assistantMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.message || "Analiz tamamlandı.",
        timestamp: new Date(),
        metrics: data.ragMetrics
      }

      setMessages(prev => [...prev, assistantMsg])
    } catch (err: any) {
      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: `⚠️ **Bağlantı Hatası:** ${err.message || "İstek işlenirken bir sorun oluştu. Lütfen tekrar deneyin."}`,
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMsg])
      toast.error("AI yanıtı alınırken hata oluştu.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    toast.success("Metin panoya kopyalandı")
    setTimeout(() => setCopiedId(null), 2000)
  }

  const handleClearChat = () => {
    if (confirm("Sohbet geçmişini sıfırlamak istiyor musunuz?")) {
      setMessages([
        {
          id: Date.now().toString(),
          role: "assistant",
          content: "Sohbet sıfırlandı. Yeni bir risk veya finans sorusu yöneltebilirsiniz.",
          timestamp: new Date()
        }
      ])
      toast.success("Sohbet temizlendi")
    }
  }

  // Render markdown-like simple formatting (bold, list items, tables)
  const formatMarkdown = (content: string) => {
    const lines = content.split("\n")
    return lines.map((line, idx) => {
      // Heading 3
      if (line.startsWith("### ")) {
        return (
          <h3 key={idx} className="text-lg font-bold text-white mt-3 mb-2 flex items-center gap-2">
            {line.replace("### ", "")}
          </h3>
        )
      }
      // Heading 4
      if (line.startsWith("#### ")) {
        return (
          <h4 key={idx} className="text-base font-semibold text-cyan-400 mt-2 mb-1">
            {line.replace("#### ", "")}
          </h4>
        )
      }
      // Bullet list item
      if (line.trim().startsWith("- ") || line.trim().startsWith("• ")) {
        const text = line.trim().replace(/^[-•]\s*/, "")
        return (
          <li key={idx} className="ml-4 list-disc text-slate-200 my-0.5 leading-relaxed">
            <span dangerouslySetInnerHTML={{ __html: parseBold(text) }} />
          </li>
        )
      }
      // Numbered list item
      if (/^\d+\.\s/.test(line.trim())) {
        return (
          <div key={idx} className="text-slate-200 my-1 font-medium leading-relaxed">
            <span dangerouslySetInnerHTML={{ __html: parseBold(line) }} />
          </div>
        )
      }
      // Table row (simple detection)
      if (line.includes("|") && !line.includes(":---")) {
        const cells = line.split("|").filter(c => c.trim().length > 0)
        return (
          <div key={idx} className="grid grid-cols-3 gap-2 py-1 border-b border-slate-700/50 text-xs sm:text-sm">
            {cells.map((cell, cIdx) => (
              <span key={cIdx} className={cIdx === 0 ? "font-semibold text-slate-300" : "text-slate-400"}>
                {cell.trim()}
              </span>
            ))}
          </div>
        )
      }
      if (line.includes(":---")) {
        return null // skip table separator
      }
      // Empty line
      if (!line.trim()) {
        return <div key={idx} className="h-2" />
      }
      // Regular paragraph
      return (
        <p key={idx} className="text-slate-200 leading-relaxed my-1">
          <span dangerouslySetInnerHTML={{ __html: parseBold(line) }} />
        </p>
      )
    })
  }

  const parseBold = (text: string) => {
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong class="text-white font-semibold">$1</strong>')
      .replace(/\*(.*?)\*/g, '<em class="text-slate-300">$1</em>')
  }

  return (
    <div className="flex flex-col h-[calc(100vh-4.5rem)] bg-slate-950 text-slate-100">
      {/* Top Header */}
      <header className="border-b border-slate-800/80 bg-slate-900/60 backdrop-blur px-4 py-3 sm:px-6">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 via-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-slate-900 rounded-full" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-bold text-white tracking-tight">
                  AI Tahsilat ve Risk Asistanı
                </h1>
                <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 rounded-full">
                  <Sparkles className="w-3 h-3" />
                  RAG v2.6
                </span>
              </div>
              <p className="text-xs text-slate-400 flex items-center gap-1.5">
                <Database className="w-3 h-3 text-emerald-400" />
                <span>Canlı Prisma Veritabanı Senkronize</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleClearChat}
              title="Sohbeti Sıfırla"
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-1.5 text-xs"
            >
              <RotateCcw className="w-4 h-4" />
              <span className="hidden md:inline">Sohbeti Temizle</span>
            </button>
          </div>
        </div>
      </header>

      {/* Chat Messages Body */}
      <div className="flex-1 overflow-y-auto px-4 py-6 sm:px-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Quick Prompt Cards (Shown when chat has only welcome message) */}
          {messages.length <= 1 && (
            <div className="pt-2 pb-4">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-cyan-400" />
                Hızlı Risk ve Finans Analizleri
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {QUICK_PROMPTS.map((item, idx) => {
                  const Icon = item.icon
                  return (
                    <button
                      key={idx}
                      onClick={() => handleSend(item.prompt)}
                      disabled={isLoading}
                      className={`text-left p-4 rounded-xl border bg-gradient-to-br ${item.color} hover:border-slate-500 hover:scale-[1.01] transition-all flex items-start justify-between group disabled:opacity-50`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Icon className="w-4 h-4" />
                          <h3 className="text-sm font-semibold text-white group-hover:text-cyan-300 transition-colors">
                            {item.title}
                          </h3>
                        </div>
                        <p className="text-xs text-slate-300">
                          "{item.prompt}"
                        </p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-white group-hover:translate-x-0.5 transition-all mt-1" />
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Messages Stream */}
          {messages.map((message) => {
            const isUser = message.role === "user"
            return (
              <div
                key={message.id}
                className={`flex gap-3 sm:gap-4 ${isUser ? "justify-end" : "justify-start"}`}
              >
                {!isUser && (
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center flex-shrink-0 shadow-md shadow-blue-500/10 mt-1">
                    <Bot className="w-4 h-4 text-white" />
                  </div>
                )}

                <div className={`relative group max-w-[88%] sm:max-w-2xl ${isUser ? "order-1" : "order-2"}`}>
                  <div
                    className={`rounded-2xl px-4 py-3.5 sm:px-5 sm:py-4 shadow-sm text-sm ${
                      isUser
                        ? "bg-blue-600 text-white rounded-br-none"
                        : "bg-slate-900 border border-slate-800 text-slate-100 rounded-bl-none"
                    }`}
                  >
                    {isUser ? (
                      <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>
                    ) : (
                      <div className="space-y-1">{formatMarkdown(message.content)}</div>
                    )}

                    {/* Metadata footer */}
                    <div className="flex items-center justify-between gap-3 mt-2 pt-1 border-t border-white/5 text-[10px] text-slate-400">
                      <span>
                        {message.timestamp.toLocaleTimeString("tr-TR", {
                          hour: "2-digit",
                          minute: "2-digit"
                        })}
                      </span>

                      {!isUser && (
                        <button
                          onClick={() => handleCopy(message.content, message.id)}
                          className="opacity-0 group-hover:opacity-100 hover:text-white transition-opacity flex items-center gap-1"
                          title="Cevabı Kopyala"
                        >
                          {copiedId === message.id ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-400" />
                              <span className="text-emerald-400">Kopyalandı</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              <span>Kopyala</span>
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {isUser && (
                  <div className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center flex-shrink-0 mt-1">
                    <User className="w-4 h-4 text-slate-300" />
                  </div>
                )}
              </div>
            )
          })}

          {/* Loading Indicator */}
          {isLoading && (
            <div className="flex gap-3 sm:gap-4 justify-start items-start">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center flex-shrink-0 animate-pulse mt-1">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div className="bg-slate-900 border border-slate-800 rounded-2xl rounded-bl-none px-5 py-4 max-w-md shadow-sm">
                <div className="flex items-center gap-3">
                  <Loader2 className="w-4 h-4 text-cyan-400 animate-spin" />
                  <span className="text-sm text-slate-300 font-medium">
                    Sözleşmeler ve hakedişler taranıyor, risk analizi yapılıyor...
                  </span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Floating Centered Input Box */}
      <footer className="border-t border-slate-800/80 bg-slate-900/80 backdrop-blur p-4">
        <div className="max-w-4xl mx-auto space-y-2">
          {/* Quick Suggestions Chips when chat is running */}
          {messages.length > 1 && !isLoading && (
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none text-xs">
              <span className="text-slate-500 shrink-0">Hızlı Sor:</span>
              {QUICK_PROMPTS.map((p, i) => (
                <button
                  key={i}
                  onClick={() => handleSend(p.prompt)}
                  className="px-2.5 py-1 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700/80 whitespace-nowrap transition-colors"
                >
                  {p.title}
                </button>
              ))}
            </div>
          )}

          <div className="relative flex items-end gap-2 bg-slate-950 border border-slate-800 rounded-2xl p-2 focus-within:border-cyan-500/60 focus-within:ring-2 focus-within:ring-cyan-500/20 transition-all">
            <textarea
              ref={textareaRef}
              rows={1}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Finans, hakediş veya taşeronlar hakkında bir soru sorun... (Shift + Enter yeni satır)"
              disabled={isLoading}
              className="flex-1 bg-transparent border-0 resize-none px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none max-h-40 leading-relaxed"
            />

            <button
              onClick={() => handleSend()}
              disabled={isLoading || !input.trim()}
              className="p-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 disabled:text-slate-600 text-white font-medium transition-colors flex items-center justify-center shrink-0"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </button>
          </div>

          <p className="text-[11px] text-center text-slate-500">
            Nexa AI Tahsilat ve Risk Asistanı canlı ERP verileri üzerinden karar destek analizi sunar.
          </p>
        </div>
      </footer>
    </div>
  )
}
