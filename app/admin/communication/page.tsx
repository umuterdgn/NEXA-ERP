/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * This code is the property of NXA Software.
 */

"use client"

import { useState, useEffect, useRef } from "react"
import { toast } from "react-hot-toast"

interface Project {
  id: string
  title: string
}

interface Personel {
  id: string
  name: string
}

interface Announcement {
  id: string
  title: string
  content: string
  severity: string
  projectId: string | null
  project: {
    id: string
    title: string
  } | null
  createdAt: string
}

interface ChatThread {
  id: string
  title: string
  status: string
  projectId: string
  project: {
    id: string
    title: string
  }
  createdAt: string
  updatedAt: string
  _count: {
    messages: number
  }
}

interface ThreadMessage {
  id: string
  content: string
  senderId: string
  senderName: string
  createdAt: string
}

export default function CommunicationPage() {
  const [activeTab, setActiveTab] = useState<"threads" | "chat">("threads")
  const [selectedThread, setSelectedThread] = useState<ChatThread | null>(null)
  
  const [projects, setProjects] = useState<Project[]>([])
  const [personnel, setPersonnel] = useState<Personel[]>([])
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [threads, setThreads] = useState<ChatThread[]>([])
  const [messages, setMessages] = useState<ThreadMessage[]>([])
  
  const [isLoading, setIsLoading] = useState(true)
  const [isAnnouncementModalOpen, setIsAnnouncementModalOpen] = useState(false)
  const [isThreadModalOpen, setIsThreadModalOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const [announcementForm, setAnnouncementForm] = useState({
    title: "",
    content: "",
    severity: "INFO",
    projectId: ""
  })
  
  const [threadForm, setThreadForm] = useState({
    title: "",
    projectId: "",
    participantIds: [] as string[]
  })
  
  const [newMessage, setNewMessage] = useState("")
  const messagesEndRef = useRef<HTMLDivElement>(null)
  
  useEffect(() => {
    fetchProjects()
    fetchPersonnel()
    fetchAnnouncements()
    fetchThreads()
  }, [])
  
  useEffect(() => {
    if (selectedThread) {
      fetchMessages(selectedThread.id)
    }
  }, [selectedThread])
  
  // Polling for messages (every 5 seconds)
  useEffect(() => {
    if (!selectedThread) return
    
    const interval = setInterval(() => {
      fetchMessages(selectedThread.id)
    }, 5000)
    
    return () => clearInterval(interval)
  }, [selectedThread])
  
  useEffect(() => {
    scrollToBottom()
  }, [messages])
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }
  
  const fetchProjects = async () => {
    try {
      const response = await fetch("/api/admin/projects")
      if (response.ok) {
        const data = await response.json()
        setProjects(data)
      }
    } catch (error) {
      console.error("Failed to fetch projects:", error)
    }
  }
  
  const fetchPersonnel = async () => {
    try {
      const response = await fetch("/api/admin/personnel")
      if (response.ok) {
        const data = await response.json()
        setPersonnel(data)
      }
    } catch (error) {
      console.error("Failed to fetch personnel:", error)
    }
  }
  
  const fetchAnnouncements = async () => {
    try {
      const response = await fetch("/api/admin/communication/announcements")
      if (response.ok) {
        const data = await response.json()
        setAnnouncements(data)
      }
    } catch (error) {
      console.error("Failed to fetch announcements:", error)
    }
  }
  
  const fetchThreads = async () => {
    try {
      const response = await fetch("/api/admin/communication/threads")
      if (response.ok) {
        const data = await response.json()
        setThreads(data)
      }
    } catch (error) {
      console.error("Failed to fetch threads:", error)
    } finally {
      setIsLoading(false)
    }
  }
  
  const fetchMessages = async (threadId: string) => {
    try {
      const response = await fetch(`/api/admin/communication/messages?threadId=${threadId}`)
      if (response.ok) {
        const data = await response.json()
        setMessages(data)
      }
    } catch (error) {
      console.error("Failed to fetch messages:", error)
    }
  }
  
  const handleCreateAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!announcementForm.title || !announcementForm.content) {
      toast.error("Başlık ve içerik zorunludur")
      return
    }
    
    setIsSubmitting(true)
    try {
      const response = await fetch("/api/admin/communication/announcements", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(announcementForm)
      })
      
      if (response.ok) {
        toast.success("Duyuru başarıyla yayınlandı")
        fetchAnnouncements()
        setIsAnnouncementModalOpen(false)
        setAnnouncementForm({
          title: "",
          content: "",
          severity: "INFO",
          projectId: ""
        })
      } else {
        toast.error("Duyuru yayınlanırken hata oluştu")
      }
    } catch (error) {
      toast.error("Duyuru yayınlanırken hata oluştu")
    } finally {
      setIsSubmitting(false)
    }
  }
  
  const handleCreateThread = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!threadForm.title || !threadForm.projectId) {
      toast.error("Başlık ve proje zorunludur")
      return
    }
    
    setIsSubmitting(true)
    try {
      const response = await fetch("/api/admin/communication/threads", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          title: threadForm.title,
          projectId: threadForm.projectId,
          createdById: "admin", // TODO: Replace with actual user ID
          participantIds: threadForm.participantIds
        })
      })
      
      if (response.ok) {
        toast.success("Konu başarıyla oluşturuldu")
        fetchThreads()
        setIsThreadModalOpen(false)
        setThreadForm({
          title: "",
          projectId: "",
          participantIds: []
        })
      } else {
        toast.error("Konu oluşturulurken hata oluştu")
      }
    } catch (error) {
      toast.error("Konu oluşturulurken hata oluştu")
    } finally {
      setIsSubmitting(false)
    }
  }
  
  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedThread) {
      return
    }
    
    try {
      const response = await fetch("/api/admin/communication/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          threadId: selectedThread.id,
          content: newMessage,
          senderId: "admin", // TODO: Replace with actual user ID
          senderName: "Admin" // TODO: Replace with actual user name
        })
      })
      
      if (response.ok) {
        setNewMessage("")
        fetchMessages(selectedThread.id)
      } else {
        toast.error("Mesaj gönderilirken hata oluştu")
      }
    } catch (error) {
      toast.error("Mesaj gönderilirken hata oluştu")
    }
  }
  
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "INFO": return "bg-blue-500/20 text-blue-400 border-blue-500/30"
      case "WARNING": return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
      case "URGENT": return "bg-red-500/20 text-red-400 border-red-500/30"
      default: return "bg-slate-500/20 text-slate-400 border-slate-500/30"
    }
  }
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case "OPEN": return "bg-green-500/20 text-green-400"
      case "RESOLVED": return "bg-blue-500/20 text-blue-400"
      case "ARCHIVED": return "bg-slate-500/20 text-slate-400"
      default: return "bg-slate-500/20 text-slate-400"
    }
  }
  
  return (
    <div className="lg:mt-0 mt-16 p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
          İletişim Merkezi
        </h1>
        <p className="text-slate-400 mt-1">Konu bazlı odalar ve duyuru sistemi</p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Panel - Announcements */}
        <div className="lg:col-span-1">
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-700/50 shadow-lg">
            <div className="flex flex-wrap gap-4 justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-white">Duyurular</h2>
              <button
                onClick={() => setIsAnnouncementModalOpen(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-colors whitespace-nowrap"
              >
                Yeni Duyuru
              </button>
            </div>
            
            <div className="space-y-4 max-h-[600px] overflow-y-auto">
              {announcements.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-sm">
                  Henüz duyuru yok
                </div>
              ) : (
                announcements.map((announcement) => (
                  <div
                    key={announcement.id}
                    className={`p-4 rounded-xl border ${getSeverityColor(announcement.severity)}`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-semibold text-white">{announcement.title}</h3>
                      <span className="text-xs px-2 py-1 rounded-full bg-white/10">
                        {announcement.severity}
                      </span>
                    </div>
                    <p className="text-sm text-slate-300 mb-2">{announcement.content}</p>
                    <div className="text-xs text-slate-400">
                      {announcement.project ? announcement.project.title : "Şirket Geneli"} • {" "}
                      {new Date(announcement.createdAt).toLocaleDateString("tr-TR")}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
        
        {/* Right Panel - Threads */}
        <div className="lg:col-span-2">
          {activeTab === "threads" && !selectedThread ? (
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-700/50 shadow-lg">
              <div className="flex flex-wrap gap-4 justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-white">Konu Bazlı Odalar</h2>
                <button
                  onClick={() => setIsThreadModalOpen(true)}
                  className="px-3 py-1.5 bg-gradient-to-r from-emerald-600 to-cyan-600 text-white text-sm rounded-lg hover:from-emerald-500 hover:to-cyan-500 transition-all whitespace-nowrap"
                >
                  + Yeni Oda
                </button>
              </div>
              
              {isLoading ? (
                <div className="text-center py-12 text-slate-400">Yükleniyor...</div>
              ) : threads.length === 0 ? (
                <div className="text-center py-12 text-slate-400">
                  Henüz konu odası yok
                </div>
              ) : (
                <div className="space-y-3 max-h-[600px] overflow-y-auto">
                  {threads.map((thread) => (
                    <div
                      key={thread.id}
                      onClick={() => {
                        setSelectedThread(thread)
                        setActiveTab("chat")
                      }}
                      className="p-4 bg-slate-900/50 rounded-xl border border-slate-700/50 hover:border-emerald-500/50 cursor-pointer transition-all group"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-semibold text-white group-hover:text-emerald-400 transition-colors">
                          {thread.title}
                        </h3>
                        <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(thread.status)}`}>
                          {thread.status}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-sm text-slate-400">
                        <span>{thread.project.title}</span>
                        <span>{thread._count.messages} mesaj</span>
                      </div>
                      <div className="text-xs text-slate-500 mt-2">
                        Son güncelleme: {new Date(thread.updatedAt).toLocaleString("tr-TR")}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700/50 shadow-lg h-[700px] flex flex-col">
              {/* Chat Header */}
              <div className="p-4 border-b border-slate-700/50 flex justify-between items-center">
                <div>
                  <button
                    onClick={() => {
                      setSelectedThread(null)
                      setActiveTab("threads")
                    }}
                    className="text-slate-400 hover:text-white mb-2 text-sm"
                  >
                    ← Odalara Dön
                  </button>
                  <h2 className="text-xl font-semibold text-white">{selectedThread?.title}</h2>
                  <p className="text-sm text-slate-400">{selectedThread?.project.title}</p>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(selectedThread?.status || "OPEN")}`}>
                  {selectedThread?.status}
                </span>
              </div>
              
              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.length === 0 ? (
                  <div className="text-center py-12 text-slate-400">
                    Henüz mesaj yok. İlk mesajı gönderin!
                  </div>
                ) : (
                  messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.senderId === "admin" ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[70%] p-3 rounded-xl ${
                          message.senderId === "admin"
                            ? "bg-gradient-to-r from-emerald-600 to-cyan-600 text-white"
                            : "bg-slate-700/50 text-slate-200"
                        }`}
                      >
                        <div className="text-xs opacity-70 mb-1">{message.senderName}</div>
                        <div>{message.content}</div>
                        <div className="text-xs opacity-50 mt-1 text-right">
                          {new Date(message.createdAt).toLocaleTimeString("tr-TR", {
                            hour: "2-digit",
                            minute: "2-digit"
                          })}
                        </div>
                      </div>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>
              
              {/* Message Input */}
              <div className="p-4 border-t border-slate-700/50">
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                    placeholder="Mesaj yazın..."
                    className="flex-1 px-4 py-3 bg-slate-900/50 border border-slate-700/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-white"
                  />
                  <button
                    onClick={handleSendMessage}
                    className="px-6 py-3 bg-gradient-to-r from-emerald-600 to-cyan-600 text-white rounded-xl hover:from-emerald-500 hover:to-cyan-500 transition-all"
                  >
                    Gönder
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Announcement Modal */}
      {isAnnouncementModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-700/50 w-full max-w-lg mx-4 shadow-2xl">
            <h3 className="text-xl font-semibold text-white mb-6">Yeni Duyuru Yayınla</h3>
            
            <form onSubmit={handleCreateAnnouncement} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Başlık *</label>
                <input
                  type="text"
                  value={announcementForm.title}
                  onChange={(e) => setAnnouncementForm({ ...announcementForm, title: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-white"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">İçerik *</label>
                <textarea
                  value={announcementForm.content}
                  onChange={(e) => setAnnouncementForm({ ...announcementForm, content: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-white"
                  rows={4}
                  required
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Önem Seviyesi</label>
                  <select
                    value={announcementForm.severity}
                    onChange={(e) => setAnnouncementForm({ ...announcementForm, severity: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-white"
                  >
                    <option value="INFO">Bilgi</option>
                    <option value="WARNING">Uyarı</option>
                    <option value="URGENT">Acil</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Proje</label>
                  <select
                    value={announcementForm.projectId}
                    onChange={(e) => setAnnouncementForm({ ...announcementForm, projectId: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-white"
                  >
                    <option value="">Şirket Geneli</option>
                    {projects.map((project) => (
                      <option key={project.id} value={project.id}>{project.title}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsAnnouncementModalOpen(false)}
                  className="flex-1 px-4 py-3 bg-slate-700/50 text-white rounded-xl hover:bg-slate-700 transition-colors"
                  disabled={isSubmitting}
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-emerald-600 to-cyan-600 text-white rounded-xl hover:from-emerald-500 hover:to-cyan-500 transition-all"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Yayınlanıyor..." : "Yayınla"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* New Thread Modal */}
      {isThreadModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-700/50 w-full max-w-lg mx-4 shadow-2xl">
            <h3 className="text-xl font-semibold text-white mb-6">Yeni Konu Odası Aç</h3>
            
            <form onSubmit={handleCreateThread} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Konu Başlığı *</label>
                <input
                  type="text"
                  value={threadForm.title}
                  onChange={(e) => setThreadForm({ ...threadForm, title: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-white"
                  required
                  placeholder="Örn: B Blok 3. Kat Kolon Çatlağı"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Proje *</label>
                <select
                  value={threadForm.projectId}
                  onChange={(e) => setThreadForm({ ...threadForm, projectId: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-white"
                  required
                >
                  <option value="">Proje Seçin</option>
                  {projects.map((project) => (
                    <option key={project.id} value={project.id}>{project.title}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Katılımcılar</label>
                <div className="max-h-48 overflow-y-auto bg-slate-900/50 border border-slate-700/50 rounded-xl p-3 space-y-2">
                  {personnel.map((person) => (
                    <label key={person.id} className="flex items-center gap-2 cursor-pointer hover:bg-slate-800/50 p-2 rounded-lg">
                      <input
                        type="checkbox"
                        checked={threadForm.participantIds.includes(person.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setThreadForm({
                              ...threadForm,
                              participantIds: [...threadForm.participantIds, person.id]
                            })
                          } else {
                            setThreadForm({
                              ...threadForm,
                              participantIds: threadForm.participantIds.filter(id => id !== person.id)
                            })
                          }
                        }}
                        className="rounded border-slate-600 text-emerald-500 focus:ring-emerald-500"
                      />
                      <span className="text-slate-300">{person.name}</span>
                    </label>
                  ))}
                </div>
              </div>
              
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsThreadModalOpen(false)}
                  className="flex-1 px-4 py-3 bg-slate-700/50 text-white rounded-xl hover:bg-slate-700 transition-colors"
                  disabled={isSubmitting}
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-emerald-600 to-cyan-600 text-white rounded-xl hover:from-emerald-500 hover:to-cyan-500 transition-all"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Oluşturuluyor..." : "Oda Aç"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
