"use client"
/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * This code is the property of NXA Software.
 */


import { useState, useEffect } from "react"
import { pusherClient } from "@/lib/pusher"
import toast from "react-hot-toast"
import ConfirmModal from "@/components/ConfirmModal"

interface ChatClientProps {
  currentUser: any
  initialConversations: any[]
}

export default function ChatClient({ currentUser, initialConversations }: ChatClientProps) {
  const [conversations, setConversations] = useState<any[]>(initialConversations)
  const [activeConversation, setActiveConversation] = useState<any>(initialConversations[0] || null)
  const [messages, setMessages] = useState<any[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [users, setUsers] = useState<any[]>([])
  const [isLoadingUsers, setIsLoadingUsers] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState<"users" | "group" | "announcement">("users")
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; id: string | null }>({ isOpen: false, id: null })

  useEffect(() => {
    if (activeConversation) {
      fetchMessages(activeConversation.id)
      
      // Subscribe to Pusher channel for real-time updates
      const channel = pusherClient.subscribe(`conversation-${activeConversation.id}`)
      
      channel.bind('new-message', (data: any) => {
        setMessages(prev => [...prev, data])
      })

      return () => {
        channel.unbind_all()
        channel.unsubscribe()
      }
    }
  }, [activeConversation])

  const fetchMessages = async (conversationId: string) => {
    try {
      const response = await fetch(`/api/chat/messages?conversationId=${conversationId}`)
      if (response.ok) {
        const data = await response.json()
        setMessages(data)
      }
    } catch (error) {
      console.error("Failed to fetch messages:", error)
    }
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!newMessage.trim() || !activeConversation || !currentUser) return

    try {
      const payload: any = {
        body: newMessage,
        conversationId: activeConversation.id,
      }

      // Send as user or worker based on user type
      if (currentUser.type === 'worker') {
        payload.workerSenderId = currentUser.id
      } else {
        payload.senderId = currentUser.id
      }

      const response = await fetch('/api/chat/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      })

      if (response.ok) {
        setNewMessage("")
        // Manually refresh messages to show the new message immediately
        await fetchMessages(activeConversation.id)
      } else {
        const errorData = await response.json()
        console.error("Failed to send message:", errorData)
        toast.error("Mesaj gönderilemedi: " + (errorData.message || "Bilinmeyen hata"))
      }
    } catch (error) {
      console.error("Error sending message:", error)
      toast.error("Mesaj gönderilirken bir hata oluştu")
    }
  }

  const handleCreateConversation = async () => {
    try {
      const response = await fetch('/api/chat/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Genel Sohbet',
          isGroup: true,
          isAnnouncement: false,
          participantIds: []
        })
      })
      
      if (response.ok) {
        const data = await response.json()
        if (data && data.id) {
          setConversations(prev => [data, ...prev])
          setActiveConversation(data)
        }
      }
    } catch (error) {
      console.error("Failed to create conversation:", error)
    }
  }

  const handleOpenModal = async () => {
    setIsModalOpen(true)
    setIsLoadingUsers(true)
    try {
      const response = await fetch('/api/admin/users')
      if (response.ok) {
        const data = await response.json()
        // Filter out current user and null entries
        const filteredUsers = data.filter((user: any) => user && user.id !== currentUser.id)
        setUsers(filteredUsers)
      }
    } catch (error) {
      console.error("Failed to fetch users:", error)
    } finally {
      setIsLoadingUsers(false)
    }
  }

  const handleCreatePrivateConversation = async (selectedUser: any) => {
    if (!selectedUser || !selectedUser.id) {
      console.error("Invalid user selected")
      return
    }

    try {
      const response = await fetch('/api/chat/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: null,
          isGroup: false,
          isAnnouncement: false,
          participantIds: [selectedUser.id]
        })
      })
      
      if (response.ok) {
        const data = await response.json()
        if (data && data.id) {
          setConversations(prev => [data, ...prev])
          setActiveConversation(data)
          setIsModalOpen(false)
        }
      }
    } catch (error) {
      console.error("Failed to create private conversation:", error)
    }
  }

  const handleCreateGroup = async (name: string, participantIds: string[]) => {
    if (!name || !participantIds || participantIds.length === 0) {
      console.error("Invalid group creation parameters")
      return
    }

    try {
      const response = await fetch('/api/chat/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          isGroup: true,
          isAnnouncement: false,
          participantIds
        })
      })
      
      if (response.ok) {
        const data = await response.json()
        if (data && data.id) {
          setConversations(prev => [data, ...prev])
          setActiveConversation(data)
          setIsModalOpen(false)
        }
      }
    } catch (error) {
      console.error("Failed to create group:", error)
    }
  }

  const handleCreateAnnouncement = async (name: string, participantIds: string[]) => {
    if (!name || !participantIds || participantIds.length === 0) {
      console.error("Invalid announcement creation parameters")
      return
    }

    try {
      const response = await fetch('/api/chat/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          isGroup: true,
          isAnnouncement: true,
          participantIds
        })
      })
      
      if (response.ok) {
        const data = await response.json()
        if (data && data.id) {
          setConversations(prev => [data, ...prev])
          setActiveConversation(data)
          setIsModalOpen(false)
        }
      }
    } catch (error) {
      console.error("Failed to create announcement:", error)
    }
  }

  const handleDeleteConversation = async (id: string) => {
    setDeleteConfirm({ isOpen: true, id })
  }

  const confirmDeleteConversation = async () => {
    if (!deleteConfirm.id) return

    try {
      const response = await fetch(`/api/chat/conversations?id=${deleteConfirm.id}`, {
        method: "DELETE"
      })
      if (response.ok) {
        toast.success("Sohbet başarıyla silindi")
        setConversations(conversations.filter(c => c.id !== deleteConfirm.id))
        if (activeConversation?.id === deleteConfirm.id) {
          setActiveConversation(null)
        }
      } else {
        toast.error("Sohbet silinirken hata oluştu")
      }
    } catch (error) {
      toast.error("Sohbet silinirken hata oluştu")
    }
  }

  const isAdmin = currentUser?.role === 'ADMIN' || currentUser?.role === 'SUPER_ADMIN'
  const filteredConversations = conversations.filter(conv => {
    if (!conv) return false
    if (!searchQuery) return true
    const searchLower = searchQuery.toLowerCase()
    return conv.name?.toLowerCase().includes(searchLower) || 
           conv.isGroup?.toString().toLowerCase().includes(searchLower)
  })

  return (
    <div className="flex h-[calc(100dvh-80px)] w-full overflow-hidden bg-[#111b21]">
        {/* Left Sidebar - Conversations */}
        <div className={`flex-col border-r border-gray-800 bg-[#111b21] ${
          activeConversation ? 'hidden md:flex' : 'flex'
        } w-full md:w-80 lg:w-1/3`}>
          <div className="p-4 border-b border-[#202c33]">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-white">Sohbetler</h2>
              <button
                onClick={handleOpenModal}
                className="px-3 py-1 bg-[#00a884] text-white rounded-lg hover:bg-[#008f6f] text-sm"
              >
                + Yeni Sohbet
              </button>
            </div>
            {/* Search Bar */}
            <input
              type="text"
              placeholder="Sohbet veya kişi ara..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 bg-[#202c33] border border-[#2a3942] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00a884] text-white text-sm"
            />
          </div>
          
          <div className="flex-1 overflow-y-auto">
            {filteredConversations.length === 0 ? (
              <div className="p-4 text-slate-400 text-center">
                {searchQuery ? 'Sonuç bulunamadı' : 'Henüz sohbet yok'}
              </div>
            ) : (
              filteredConversations.filter(conv => conv !== null).map((conversation) => (
                <div
                  key={conversation.id}
                  className={`p-4 hover:bg-[#2a3942] transition-colors ${
                    activeConversation?.id === conversation.id ? 'bg-[#2a3942]' : ''
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div
                      className="flex-1 cursor-pointer"
                      onClick={() => setActiveConversation(conversation)}
                    >
                      <div className="font-medium text-white">
                        {conversation.name || (conversation.isGroup ? 'Grup Sohbeti' : 'Özel Sohbet')}
                      </div>
                      <div className="text-sm text-slate-400">
                        {conversation.isAnnouncement ? '📢 Duyuru' :
                         conversation.isGroup ? '👥 Grup' : '👤 Kişisel'}
                      </div>
                    </div>
                    {isAdmin && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDeleteConversation(conversation.id)
                        }}
                        className="ml-2 text-red-400 hover:text-red-300 text-sm"
                      >
                        Sil
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Side - Active Chat */}
        <div className={`flex-1 flex flex-col bg-[#0b141a] w-full rounded-none ${
          activeConversation ? 'flex' : 'hidden md:flex'
        }`}>
          {activeConversation ? (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b border-[#202c33] bg-[#202c33]">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setActiveConversation(null)}
                    className="md:hidden text-white hover:text-slate-300"
                  >
                    ⬅ Geri
                  </button>
                  <h3 className="text-lg font-semibold text-white">
                    {activeConversation.name || activeConversation.isGroup ? 'Grup Sohbeti' : 'Özel Sohbet'}
                  </h3>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.length === 0 ? (
                  <div className="text-center text-slate-400">
                    Henüz mesaj yok. İlk mesajı gönderin!
                  </div>
                ) : (
                  messages.filter(msg => msg !== null).map((message) => {
                    const isFromCurrentUser = message.senderId === currentUser?.id || message.workerSenderId === currentUser?.id
                    const senderName = message.sender?.name || 
                                      (message.workerSender ? `${message.workerSender.firstName || ''} ${message.workerSender.lastName || ''}`.trim() : null) || 
                                      'Bilinmeyen'
                    
                    return (
                      <div
                        key={message.id}
                        className={`flex ${
                          isFromCurrentUser ? 'justify-end' : 'justify-start'
                        }`}
                      >
                        <div
                          className={`max-w-xs md:max-w-md rounded-lg p-3 ${
                            isFromCurrentUser
                              ? 'bg-[#005c4b] text-white rounded-tr-none'
                              : 'bg-[#202c33] text-white rounded-tl-none'
                          }`}
                        >
                          <div className="text-sm">{message.body || ''}</div>
                          <div className="text-xs mt-1 opacity-70 text-right">
                            {new Date(message.createdAt).toLocaleTimeString('tr-TR', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </div>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>

              {/* Message Input */}
              <div className="p-4 border-t border-[#202c33] bg-[#202c33]">
                {activeConversation.isAnnouncement && !isAdmin ? (
                  <div className="text-center text-slate-400 text-sm">
                    📢 Bu bir duyuru kanalıdır. Sadece adminler mesaj gönderebilir.
                  </div>
                ) : (
                  <form onSubmit={handleSendMessage} className="flex gap-2 items-center">
                    <div className="flex-1 relative">
                      <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder={activeConversation.isAnnouncement ? "Duyuru yazın..." : "Mesaj yazın..."}
                        className="w-full px-6 py-3 bg-[#2a3942] border-none rounded-full focus:outline-none focus:ring-2 focus:ring-[#00a884] text-white"
                      />
                    </div>
                    <button
                      type="submit"
                      className="w-12 h-12 bg-[#00a884] text-white rounded-full hover:bg-[#008f6f] transition-colors flex items-center justify-center"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                      </svg>
                    </button>
                  </form>
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-slate-400">
              Bir sohbet seçin
            </div>
          )}
        </div>

      {/* New Conversation Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-[#111b21] rounded-xl p-6 border border-[#202c33] w-full max-w-md mx-4 shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold text-white">Yeni Sohbet</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 mb-4 border-b border-[#202c33] pb-2">
              <button
                onClick={() => setActiveTab("users")}
                className={`px-4 py-2 rounded-lg text-sm ${
                  activeTab === "users" ? "bg-[#00a884] text-white" : "text-slate-400 hover:text-white"
                }`}
              >
                Kişiler
              </button>
              {isAdmin && (
                <>
                  <button
                    onClick={() => setActiveTab("group")}
                    className={`px-4 py-2 rounded-lg text-sm ${
                      activeTab === "group" ? "bg-[#00a884] text-white" : "text-slate-400 hover:text-white"
                    }`}
                  >
                    Grup Oluştur
                  </button>
                  <button
                    onClick={() => setActiveTab("announcement")}
                    className={`px-4 py-2 rounded-lg text-sm ${
                      activeTab === "announcement" ? "bg-[#00a884] text-white" : "text-slate-400 hover:text-white"
                    }`}
                  >
                    Duyuru Oluştur
                  </button>
                </>
              )}
            </div>

            {/* Users Tab */}
            {activeTab === "users" && (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {isLoadingUsers ? (
                  <div className="text-center text-slate-400 py-8">
                    Yükleniyor...
                  </div>
                ) : users.length === 0 ? (
                  <div className="text-center text-slate-400 py-8">
                    Kullanıcı bulunamadı
                  </div>
                ) : (
                  users.filter(user => user !== null).map((user) => (
                    <div
                      key={user.id}
                      onClick={() => handleCreatePrivateConversation(user)}
                      className="p-4 bg-[#202c33] rounded-lg hover:bg-[#2a3942] cursor-pointer transition-colors"
                    >
                      <div className="font-medium text-white">{user.name || 'Bilinmeyen Kullanıcı'}</div>
                      <div className="text-sm text-slate-400">{user.email || 'Email yok'}</div>
                      <div className="text-xs text-slate-500 mt-1">
                        {user.role === 'SUPER_ADMIN' ? '👑 Süper Admin' : 
                         user.role === 'ADMIN' ? '🔧 Admin' : 
                         user.role === 'WORKER' ? '👷 İşçi' : user.role || 'Kullanıcı'}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Group Tab */}
            {activeTab === "group" && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Grup Adı</label>
                  <input
                    type="text"
                    placeholder="Örn: Şantiye Takımı"
                    className="w-full px-4 py-2 bg-[#202c33] border border-[#2a3942] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00a884] text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Katılımcılar</label>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {users.filter(user => user !== null).map((user) => (
                      <div key={user.id} className="flex items-center gap-2 p-2 bg-[#202c33] rounded">
                        <input type="checkbox" className="rounded" />
                        <span className="text-white text-sm">{user.name || 'Bilinmeyen Kullanıcı'}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <button
                  onClick={() => {
                    const groupName = "Test Grubu"
                    const selectedUsers = users.filter(u => u !== null).slice(0, 3).map(u => u.id)
                    handleCreateGroup(groupName, selectedUsers)
                  }}
                  className="w-full px-4 py-2 bg-[#00a884] text-white rounded-lg hover:bg-[#008f6f]"
                >
                  Grup Oluştur
                </button>
              </div>
            )}

            {/* Announcement Tab */}
            {activeTab === "announcement" && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Duyuru Başlığı</label>
                  <input
                    type="text"
                    placeholder="Örn: Şantiye Duyurusu"
                    className="w-full px-4 py-2 bg-[#202c33] border border-[#2a3942] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00a884] text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Hedef Kitle</label>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {users.filter(user => user !== null).map((user) => (
                      <div key={user.id} className="flex items-center gap-2 p-2 bg-[#202c33] rounded">
                        <input type="checkbox" className="rounded" />
                        <span className="text-white text-sm">{user.name || 'Bilinmeyen Kullanıcı'}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <button
                  onClick={() => {
                    const announcementName = "Test Duyurusu"
                    const selectedUsers = users.filter(u => u !== null).map(u => u.id)
                    handleCreateAnnouncement(announcementName, selectedUsers)
                  }}
                  className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-500"
                >
                  Duyuru Oluştur
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm({ isOpen: false, id: null })}
        onConfirm={confirmDeleteConversation}
        title="Sohbeti Sil"
        message="Bu sohbeti silmek istediğinize emin misiniz? Bu işlem geri alınamaz."
        confirmText="Sil"
        cancelText="İptal"
        type="danger"
      />
    </div>
  )
}