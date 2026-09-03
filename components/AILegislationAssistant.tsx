"use client"
/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * This code is the property of NXA Software.
 */

import { useState } from "react"
import { BookOpen, X, Send, Loader2, Scale } from "lucide-react"

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: Date
}

export default function AILegislationAssistant() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      content: "Merhaba! Ben AI Mevzuat Asistanıyım. Çevre Şehircilik ve yapı denetimi ile ilgili mevzuat sorularınızı yanıtlayabilirim.",
      timestamp: new Date()
    }
  ])
  const [inputText, setInputText] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleSendMessage = () => {
    if (!inputText.trim()) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: inputText,
      timestamp: new Date()
    }

    setMessages([...messages, userMessage])
    setInputText("")
    setIsLoading(true)

    // Simulate AI response
    setTimeout(() => {
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: generateMockResponse(inputText),
        timestamp: new Date()
      }
      setMessages(prev => [...prev, aiResponse])
      setIsLoading(false)
    }, 1500)
  }

  const generateMockResponse = (query: string): string => {
    const lowerQuery = query.toLowerCase()
    
    if (lowerQuery.includes("prosedür") || lowerQuery.includes("yapmalı")) {
      return `Çevre Şehircilik Yönetmeliği Madde 4'e göre bu durumda aşağıdaki prosedürü uygulamanız gerekmektedir:\n\n1. Öncelikle ilgili müteahhide yazılı bildirimde bulunulmalıdır.\n2. 15 iş günü içinde düzeltme talep edilmelidir.\n3. Düzeltme yapılmazsa yapı denetim kurulu rapor tutmalıdır.\n\n**Kaynak:** Mevzuat → Madde 4 → 2026`
    }
    
    if (lowerQuery.includes("donatı") || lowerQuery.includes("beton")) {
      return `TS 500 Betonarme Yapılar Tasarım ve Yapım Kuralları'na göre:\n\n- Donatı aralığı en az 20cm olmalıdır.\n- Beton dayanımı C30 ve üzeri olmalıdır.\n- Donatı paslanmaz çelik kullanılmalıdır.\n\n**Kaynak:** TS 500 → Bölüm 3 → 2024`
    }
    
    if (lowerQuery.includes("eksiklik") || lowerQuery.includes("uygunsuzluk")) {
      return `Yapı Denetim Hizmetleri Yönetmeliği Madde 12'ye göre:\n\n- Eksiklikler 48 saat içinde müteahhide bildirilmelidir.\n- Kritik eksiklikler için acil düzeltme talep edilmelidir.\n- Kanıt zinciri oluşturulmalıdır.\n\n**Kaynak:** Mevzuat → Madde 12 → 2026`
    }
    
    return `Bu konuda ilgili mevzuat hükümleri incelenmektedir. Lütfen daha spesifik bir soru sorunuz veya ilgili yapı elemanını belirtiniz.`
  }

  return (
    <>
      {/* Floating Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white rounded-full shadow-lg flex items-center justify-center transition-all hover:scale-110 z-50"
          title="AI Mevzuat Asistanı"
        >
          <Scale className="w-6 h-6" />
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 w-96 h-[500px] bg-slate-900 rounded-2xl border border-slate-700 shadow-2xl flex flex-col z-50">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-slate-700 bg-gradient-to-r from-purple-900/20 to-blue-900/20">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                <Scale className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <h3 className="text-white font-semibold">AI Mevzuat Asistanı</h3>
                <p className="text-slate-400 text-xs">Çevre Şehircilik & Yapı Denetimi</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl p-3 ${
                    message.role === "user"
                      ? "bg-blue-600 text-white"
                      : "bg-slate-800 text-slate-200 border border-slate-700"
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  <p className="text-xs mt-1 opacity-70">
                    {message.timestamp.toLocaleTimeString("tr-TR", {
                      hour: "2-digit",
                      minute: "2-digit"
                    })}
                  </p>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-slate-800 rounded-2xl p-3 border border-slate-700">
                  <Loader2 className="w-4 h-4 text-slate-400 animate-spin" />
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <div className="p-4 border-t border-slate-700">
            <div className="flex gap-2">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                placeholder="Mevzuat sorunuz..."
                className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
              <button
                onClick={handleSendMessage}
                disabled={!inputText.trim() || isLoading}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
