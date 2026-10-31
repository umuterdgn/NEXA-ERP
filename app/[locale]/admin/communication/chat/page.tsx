"use client"
/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * This code is the property of NXA Software.
 */


import { useState, useEffect } from "react"
import { toast } from "react-hot-toast"
import { MessageSquare, Send, Paperclip, Hash, User, Search, MoreVertical, AlertTriangle, FileText, CheckCircle, Plus, X, Users, Mic, Bot, MoreHorizontal } from "lucide-react"

interface ChatMessage {
  id: string
  senderId: string
  senderName: string
  content: string
  attachmentType?: string
  attachmentRefId?: string
  attachmentUrl?: string
  isRead: boolean
  createdAt: Date
  isAI?: boolean
}

interface Channel {
  id: string
  name: string
  type: "channel" | "direct"
  lastMessage?: string
  lastMessageTime?: Date
  unreadCount?: number
  messages: ChatMessage[]
}

export default function ChatPage() {
  const [selectedChannel, setSelectedChannel] = useState<Channel | null>(null)
  const [messageInput, setMessageInput] = useState("")
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [isNewChatModalOpen, setIsNewChatModalOpen] = useState(false)
  const [newChatName, setNewChatName] = useState("")
  const [selectedProject, setSelectedProject] = useState("")
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>([])
  const [projects, setProjects] = useState<any[]>([])
  const [personnel, setPersonnel] = useState<any[]>([])
  const [isRecording, setIsRecording] = useState(false)
  const [actionMenuOpen, setActionMenuOpen] = useState<string | null>(null)
  const [isAIResponding, setIsAIResponding] = useState(false)
  const [channels, setChannels] = useState<Channel[]>([])

  const filteredChannels = channels.filter(channel =>
    channel.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Fetch threads and live messages from database
  useEffect(() => {
    const fetchThreadsAndMessages = async () => {
      try {
        const [threadsRes, msgsRes] = await Promise.all([
          fetch("/api/admin/chat-threads"),
          fetch("/api/chat")
        ])

        const threadsData = threadsRes.ok ? await threadsRes.json() : []
        const msgsData = msgsRes.ok ? await msgsRes.json() : { messages: [] }

        const liveMsgs: ChatMessage[] = (msgsData.messages || []).map((m: any) => ({
          id: m.id,
          senderId: m.senderId,
          senderName: m.sender?.name || "Saha Personeli",
          content: m.content,
          attachmentUrl: m.photoUrl,
          isRead: m.isRead || true,
          createdAt: new Date(m.createdAt),
        }))

        if (Array.isArray(threadsData) && threadsData.length > 0) {
          const loadedChannels: Channel[] = threadsData.map((t: any) => ({
            id: t.id,
            name: t.title,
            type: "channel",
            lastMessage: t.messages?.[0]?.content || "",
            lastMessageTime: t.messages?.[0]?.createdAt ? new Date(t.messages[0].createdAt) : new Date(t.createdAt),
            unreadCount: 0,
            messages: liveMsgs.filter((m: any) => m.channelName === t.title)
          }))
          setChannels(loadedChannels)
          if (!selectedChannel && loadedChannels.length > 0) {
            setSelectedChannel(loadedChannels[0])
          }
        } else if (liveMsgs.length > 0) {
          // Fallback if messages exist with channelName
          const channelNames = Array.from(new Set(liveMsgs.map((m: any) => m.channelName || "Genel Şantiye Grubu")))
          const generatedChannels: Channel[] = channelNames.map((name, idx) => {
            const chMsgs = liveMsgs.filter((m: any) => (m.channelName || "Genel Şantiye Grubu") === name)
            return {
              id: String(idx + 1),
              name,
              type: "channel",
              lastMessage: chMsgs[chMsgs.length - 1]?.content || "",
              lastMessageTime: chMsgs[chMsgs.length - 1]?.createdAt || new Date(),
              unreadCount: 0,
              messages: chMsgs
            }
          })
          setChannels(generatedChannels)
          if (!selectedChannel && generatedChannels.length > 0) {
            setSelectedChannel(generatedChannels[0])
          }
        } else {
          setChannels([])
        }
      } catch (e) {
        console.error("Chat sync error:", e)
      }
    }

    fetchThreadsAndMessages()
    const timer = setInterval(fetchThreadsAndMessages, 5000)
    return () => clearInterval(timer)
  }, [])

  const handleSendMessage = async () => {
    if (!messageInput.trim()) return
    const textToSend = messageInput
    setMessageInput("")
    
    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      senderId: "admin",
      senderName: "Merkez Ofis",
      content: textToSend,
      isRead: true,
      createdAt: new Date()
    }
    
    if (selectedChannel) {
      const updatedChannel = {
        ...selectedChannel,
        messages: [...selectedChannel.messages, newMessage],
        lastMessage: textToSend,
        lastMessageTime: new Date()
      }
      setSelectedChannel(updatedChannel)
      setChannels(channels.map(c => c.id === selectedChannel.id ? updatedChannel : c))
    }

    // Persist to database ChatMessage model
    try {
      await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: textToSend,
          channelName: selectedChannel?.name || "Genel",
        }),
      })
    } catch (err) {
      console.error("Chat sync error:", err)
    }
    
    // Check for @AI mention
    if (textToSend.includes("@AI")) {
      await handleAIResponse(textToSend)
    }
  }

  const handleAIResponse = async (userMessage: string) => {
    setIsAIResponding(true)
    
    // Simulate AI processing
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    let aiResponse = ""
    if (userMessage.includes("eksiklik") || userMessage.includes("deficiency")) {
      aiResponse = "Şu an bu şantiyede 3 adet açık eksiklik (Deficiency) bulunmaktadır. Bunlardan 2'si kritik seviyededir."
    } else if (userMessage.includes("proje") || userMessage.includes("ilerleme")) {
      aiResponse = "Bu projenin genel ilerleme durumu %67'dir. B Blok tamamlanma aşamasında, C Blok temel aşamasında."
    } else if (userMessage.includes("personel") || userMessage.includes("işçi")) {
      aiResponse = "Bugün şantiyede 42 personel aktif olarak çalışıyor. 3 personel izinde."
    } else {
      aiResponse = "Sorunuzu anladım. Şu anda demo modunda çalışıyorum. Proje verileri, eksiklik durumu veya personel hakkında başka sorularınız varsa lütfen sorun."
    }
    
    const aiMessage: ChatMessage = {
      id: (Date.now() + 1).toString(),
      senderId: "ai-bot",
      senderName: "AI Asistan",
      content: aiResponse,
      isRead: true,
      createdAt: new Date(),
      isAI: true
    }
    
    if (selectedChannel) {
      const updatedChannel = {
        ...selectedChannel,
        messages: [...selectedChannel.messages, aiMessage],
        lastMessage: aiResponse,
        lastMessageTime: new Date()
      }
      setSelectedChannel(updatedChannel)
      setChannels(channels.map(c => c.id === selectedChannel.id ? updatedChannel : c))
    }
    
    setIsAIResponding(false)
  }

  const handleVoiceRecord = async () => {
    setIsRecording(true)
    
    // Simulate speech-to-text (2-3 seconds)
    await new Promise(resolve => setTimeout(resolve, 2500))
    
    setMessageInput("Bugün B Blok beton dökümü tamamlandı, paspayları kontrol edildi, sorun yok.")
    setIsRecording(false)
  }

  const handleQuickAction = async (action: string, messageId: string) => {
    setActionMenuOpen(null)
    
    if (action === "deficiency") {
      toast.success("Mesaj eksiklik (Deficiency) olarak kaydedildi")
    } else if (action === "sitereport") {
      toast.success("Mesaj günlük rapora (SiteReport) eklendi")
    }
  }

  useEffect(() => {
    // Fetch projects and personnel when modal opens
    if (isNewChatModalOpen) {
      fetchProjects()
      fetchPersonnel()
    }
  }, [isNewChatModalOpen])

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

  const handleAttachmentSelect = (type: string) => {
    setShowAttachmentMenu(false)
    // Handle attachment selection
  }

  const handleCreateNewChat = async () => {
    if (!newChatName.trim()) return

    try {
      const response = await fetch("/api/admin/chat-threads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newChatName,
          projectId: selectedProject || null,
          participants: selectedParticipants
        })
      })

      if (response.ok) {
        const newThread = await response.json()
        // Add to channels list
        const newChannel: Channel = {
          id: newThread.id,
          name: newThread.title,
          type: "channel",
          lastMessage: "",
          lastMessageTime: new Date(),
          unreadCount: 0,
          messages: []
        }
        setChannels([...channels, newChannel])
        setSelectedChannel(newChannel)
        setNewChatName("")
        setSelectedProject("")
        setSelectedParticipants([])
        setIsNewChatModalOpen(false)
      }
    } catch (error) {
      console.error("Failed to create chat:", error)
    }
  }

  const toggleParticipant = (personId: string) => {
    setSelectedParticipants(prev =>
      prev.includes(personId)
        ? prev.filter(id => id !== personId)
        : [...prev, personId]
    )
  }

  return (
    <div className="h-screen flex bg-slate-900">
      {/* Left Sidebar - Channels */}
      <div className="w-80 bg-slate-800 border-r border-slate-700 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-slate-700">
          <div className="flex items-center gap-3 mb-4">
            <MessageSquare className="w-6 h-6 text-blue-400" />
            <h1 className="text-xl font-bold text-white">İç Haberleşme</h1>
          </div>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Kanal veya kişi ara..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
              />
            </div>
            <button
              onClick={() => setIsNewChatModalOpen(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-colors flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Yeni Sohbet</span>
            </button>
          </div>
        </div>

        {/* Channels List */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-2">
            {filteredChannels.map((channel) => (
              <button
                key={channel.id}
                onClick={() => setSelectedChannel(channel)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors mb-1 ${
                  selectedChannel?.id === channel.id
                    ? "bg-blue-600 text-white"
                    : "text-slate-300 hover:bg-slate-700"
                }`}
              >
                {channel.type === "channel" ? (
                  <Hash className="w-5 h-5" />
                ) : (
                  <User className="w-5 h-5" />
                )}
                <div className="flex-1 text-left">
                  <div className="font-medium">{channel.name}</div>
                  {channel.lastMessage && (
                    <div className="text-xs text-slate-400 truncate">{channel.lastMessage}</div>
                  )}
                </div>
                {channel.unreadCount && channel.unreadCount > 0 && (
                  <span className="bg-blue-500 text-white text-xs rounded-full px-2 py-0.5">
                    {channel.unreadCount}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Right Side - Chat Window */}
      <div className="flex-1 flex flex-col">
        {selectedChannel ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b border-slate-700 bg-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                {selectedChannel.type === "channel" ? (
                  <Hash className="w-6 h-6 text-blue-400" />
                ) : (
                  <User className="w-6 h-6 text-blue-400" />
                )}
                <div>
                  <h2 className="text-lg font-semibold text-white">{selectedChannel.name}</h2>
                  <p className="text-xs text-slate-400">
                    {selectedChannel.type === "channel" ? "Kanal" : "Birebir Mesajlaşma"}
                  </p>
                </div>
              </div>
              <button className="text-slate-400 hover:text-white">
                <MoreVertical className="w-5 h-5" />
              </button>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {isAIResponding && (
                <div className="flex justify-start">
                  <div className="max-w-md">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs text-slate-400">AI Asistan</span>
                    </div>
                    <div className="px-4 py-2 rounded-lg bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-blue-500/30 text-white">
                      <div className="flex items-center gap-2">
                        <Bot className="w-4 h-4 text-blue-400 animate-pulse" />
                        <span className="text-sm">Yanıt yazılıyor...</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {selectedChannel.messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.senderId === "user1" ? "justify-end" : "justify-start"}`}
                >
                  <div className={`max-w-md ${message.senderId === "user1" ? "order-2" : "order-1"}`}>
                    <div className={`flex items-center gap-2 mb-1 ${message.senderId === "user1" ? "justify-end" : "justify-start"}`}>
                      <div className="flex items-center gap-2">
                        {message.isAI && <Bot className="w-3 h-3 text-blue-400" />}
                        <span className="text-xs text-slate-400">{message.senderName}</span>
                      </div>
                      <span className="text-xs text-slate-500">
                        {new Date(message.createdAt).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <button
                        onClick={() => setActionMenuOpen(actionMenuOpen === message.id ? null : message.id)}
                        className="text-slate-500 hover:text-slate-300 transition-colors"
                      >
                        <MoreHorizontal className="w-3 h-3" />
                      </button>
                    </div>
                    
                    {/* Quick Action Menu */}
                    {actionMenuOpen === message.id && (
                      <div className="absolute mb-2 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-10 w-48">
                        <button
                          onClick={() => handleQuickAction("deficiency", message.id)}
                          className="w-full flex items-center gap-3 px-3 py-2 text-left text-slate-300 hover:bg-slate-700 rounded-t-lg transition-colors text-sm"
                        >
                          <AlertTriangle className="w-4 h-4 text-red-400" />
                          Eksiklik Olarak Kaydet
                        </button>
                        <button
                          onClick={() => handleQuickAction("sitereport", message.id)}
                          className="w-full flex items-center gap-3 px-3 py-2 text-left text-slate-300 hover:bg-slate-700 rounded-b-lg transition-colors text-sm"
                        >
                          <FileText className="w-4 h-4 text-blue-400" />
                          Günlük Rapora Ekle
                        </button>
                      </div>
                    )}
                    
                    {message.attachmentType ? (
                      <a
                        href={message.attachmentUrl}
                        className="block bg-slate-800 border border-slate-700 rounded-lg p-4 hover:border-blue-500 transition-colors"
                      >
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-lg bg-red-500/20 flex items-center justify-center flex-shrink-0">
                            <AlertTriangle className="w-5 h-5 text-red-400" />
                          </div>
                          <div className="flex-1">
                            <div className="font-medium text-white mb-1">Uygunsuzluk Raporu</div>
                            <div className="text-sm text-slate-400 mb-2">#{message.attachmentRefId}</div>
                            <div className="text-xs text-slate-500">{message.content}</div>
                          </div>
                          <FileText className="w-5 h-5 text-slate-400" />
                        </div>
                      </a>
                    ) : (
                      <div className={`px-4 py-2 rounded-lg ${
                        message.isAI
                          ? "bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-blue-500/30 text-white"
                          : message.senderId === "user1"
                          ? "bg-blue-600 text-white"
                          : "bg-slate-700 text-white"
                      }`}>
                        {message.content}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Message Input */}
            <div className="p-4 border-t border-slate-700 bg-slate-800">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <button
                    onClick={() => setShowAttachmentMenu(!showAttachmentMenu)}
                    className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
                  >
                    <Paperclip className="w-5 h-5" />
                  </button>
                  
                  {/* Attachment Menu */}
                  {showAttachmentMenu && (
                    <div className="absolute bottom-full left-0 mb-2 w-64 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-10">
                      <div className="p-2">
                        <button
                          onClick={() => handleAttachmentSelect("NCR_REPORT")}
                          className="w-full flex items-center gap-3 px-3 py-2 text-left text-slate-300 hover:bg-slate-700 rounded-lg transition-colors"
                        >
                          <AlertTriangle className="w-5 h-5 text-red-400" />
                          <div>
                            <div className="font-medium">Uygunsuzluk Raporu</div>
                            <div className="text-xs text-slate-500">DÖF referansı ekle</div>
                          </div>
                        </button>
                        <button
                          onClick={() => handleAttachmentSelect("ISG_ALARM")}
                          className="w-full flex items-center gap-3 px-3 py-2 text-left text-slate-300 hover:bg-slate-700 rounded-lg transition-colors"
                        >
                          <CheckCircle className="w-5 h-5 text-green-400" />
                          <div>
                            <div className="font-medium">İSG Belgesi</div>
                            <div className="text-xs text-slate-500">Sertifika referansı ekle</div>
                          </div>
                        </button>
                        <button
                          onClick={() => handleAttachmentSelect("MATERIAL_DOC")}
                          className="w-full flex items-center gap-3 px-3 py-2 text-left text-slate-300 hover:bg-slate-700 rounded-lg transition-colors"
                        >
                          <FileText className="w-5 h-5 text-blue-400" />
                          <div>
                            <div className="font-medium">Malzeme Dokümanı</div>
                            <div className="text-xs text-slate-500">Onay referansı ekle</div>
                          </div>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
                
                <input
                  type="text"
                  placeholder="Mesaj yazın... (@AI ile soru sor)"
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                  className="flex-1 px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
                  disabled={isRecording}
                />
                
                <button
                  onClick={handleVoiceRecord}
                  disabled={isRecording}
                  className={`p-2 rounded-lg transition-colors ${
                    isRecording
                      ? "bg-red-500 text-white animate-pulse"
                      : "text-slate-400 hover:text-white hover:bg-slate-700"
                  }`}
                >
                  {isRecording ? (
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 bg-white rounded-full animate-ping" />
                      <div className="w-2 h-2 bg-white rounded-full animate-ping" style={{ animationDelay: '0.2s' }} />
                      <div className="w-2 h-2 bg-white rounded-full animate-ping" style={{ animationDelay: '0.4s' }} />
                    </div>
                  ) : (
                    <Mic className="w-5 h-5" />
                  )}
                </button>
                
                <button
                  onClick={handleSendMessage}
                  disabled={isRecording || isAIResponding}
                  className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-colors disabled:opacity-50"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="text-center max-w-md">
              <MessageSquare className="w-16 h-16 text-slate-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">Henüz Aktif Sohbet Yok</h3>
              <p className="text-slate-400 text-sm mb-6">Şantiyeleriniz veya departmanlarınız için kapalı devre bir iletişim kanalı açabilirsiniz.</p>
              <button
                onClick={() => setIsNewChatModalOpen(true)}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors text-sm font-medium shadow-lg shadow-blue-600/20"
              >
                <Plus className="w-4 h-4" />
                Yeni Sohbet Kanalı Başlat
              </button>
            </div>
          </div>
        )}
      </div>

      {/* New Chat Modal */}
      {isNewChatModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-800 rounded-xl border border-slate-700 w-full max-w-md">
            <div className="flex items-center justify-between p-4 border-b border-slate-700">
              <h3 className="text-lg font-semibold text-white">Yeni Sohbet</h3>
              <button
                onClick={() => setIsNewChatModalOpen(false)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Sohbet Adı</label>
                <input
                  type="text"
                  value={newChatName}
                  onChange={(e) => setNewChatName(e.target.value)}
                  className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
                  placeholder="Örn: Proje Ekibi"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">İlgili Proje (Opsiyonel)</label>
                <select
                  value={selectedProject}
                  onChange={(e) => setSelectedProject(e.target.value)}
                  className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="">Proje Seçin</option>
                  {projects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.name || project.title}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2 flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Katılımcılar
                </label>
                <div className="max-h-48 overflow-y-auto space-y-2 bg-slate-900 rounded-lg p-3 border border-slate-700">
                  {(personnel || []).map((person) => (
                    <label
                      key={person.id}
                      className="flex items-center gap-3 p-2 hover:bg-slate-800 rounded cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selectedParticipants.includes(person.id)}
                        onChange={() => toggleParticipant(person.id)}
                        className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-blue-500 focus:ring-blue-500"
                      />
                      <div className="flex-1">
                        <p className="text-sm text-white">{person.name}</p>
                        <p className="text-xs text-slate-400">{person.position || person.department}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
              
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setIsNewChatModalOpen(false)}
                  className="flex-1 px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors"
                >
                  İptal
                </button>
                <button
                  onClick={handleCreateNewChat}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-colors"
                >
                  Oluştur
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
