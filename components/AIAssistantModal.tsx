"use client"
/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * This code is the property of NXA Software.
 */

import { useState, useRef, useEffect } from "react"
import { Mic, X, Upload, Sparkles, Loader2 } from "lucide-react"

interface AIAssistantModalProps {
  isOpen: boolean
  onClose: () => void
  onResult: (data: any) => void
}

export default function AIAssistantModal({ isOpen, onClose, onResult }: AIAssistantModalProps) {
  const [image, setImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string>("")
  const [transcribedText, setTranscribedText] = useState("")
  const [isRecording, setIsRecording] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const recognitionRef = useRef<any>(null)

  useEffect(() => {
    if (!isOpen) {
      resetForm()
    }
  }, [isOpen])

  const resetForm = () => {
    setImage(null)
    setImagePreview("")
    setTranscribedText("")
    setIsRecording(false)
    setIsProcessing(false)
    if (recognitionRef.current) {
      recognitionRef.current.stop()
    }
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setImage(file)
      const reader = new FileReader()
      reader.onload = (event) => {
        setImagePreview(event.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const startRecording = () => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
      
      if (!SpeechRecognition) {
        alert("Tarayıcınız ses tanımayı desteklemiyor. Lütfen Chrome kullanın.")
        return
      }

      const recognition = new SpeechRecognition()
      recognition.lang = 'tr-TR'
      recognition.continuous = true
      recognition.interimResults = true

      recognition.onstart = () => {
        setIsRecording(true)
      }

      recognition.onresult = (event: any) => {
        let interimTranscript = ""
        let finalTranscript = ""

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript
          if (event.results[i].isFinal) {
            finalTranscript += transcript + " "
          } else {
            interimTranscript += transcript
          }
        }

        setTranscribedText(finalTranscript + interimTranscript)
      }

      recognition.onerror = (event: any) => {
        console.error("Speech recognition error:", event.error)
        setIsRecording(false)
      }

      recognition.onend = () => {
        setIsRecording(false)
      }

      recognitionRef.current = recognition
      recognition.start()
    }
  }

  const stopRecording = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop()
      setIsRecording(false)
    }
  }

  const handleAnalyze = async () => {
    if (!image && !transcribedText) {
      alert("Lütfen bir fotoğraf yükleyin veya sesli komut kaydedin.")
      return
    }

    setIsProcessing(true)

    try {
      const formData = new FormData()
      if (image) {
        formData.append("image", image)
      }
      formData.append("transcribedText", transcribedText)

      const response = await fetch("/api/admin/ai-assistant", {
        method: "POST",
        body: formData
      })

      const data = await response.json()

      if (response.ok) {
        onResult(data)
        onClose()
        resetForm()
      } else {
        alert("Analiz sırasında hata oluştu")
      }
    } catch (error) {
      console.error("AI analysis error:", error)
      alert("Analiz sırasında hata oluştu")
    } finally {
      setIsProcessing(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 rounded-2xl border border-slate-800 w-full max-w-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-xl font-bold text-white">✨ AI Saha Asistanı</h2>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Image Upload */}
          <div>
            <label className="block text-slate-400 text-sm mb-2">Fotoğraf Yükle</label>
            <div className="relative">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
                id="ai-image-upload"
              />
              <label
                htmlFor="ai-image-upload"
                className="flex items-center justify-center gap-3 w-full h-32 border-2 border-dashed border-slate-700 rounded-xl cursor-pointer hover:border-purple-500 transition-colors bg-slate-800/50"
              >
                {imagePreview ? (
                  <img src={imagePreview} alt="Preview" className="w-full h-full object-contain rounded-xl" />
                ) : (
                  <>
                    <Upload className="w-8 h-8 text-slate-500" />
                    <span className="text-slate-500">Fotoğraf seçin veya sürükleyin</span>
                  </>
                )}
              </label>
            </div>
          </div>

          {/* Voice Recording */}
          <div>
            <label className="block text-slate-400 text-sm mb-2">Sesli Komut (Web Speech API)</label>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <button
                  onClick={isRecording ? stopRecording : startRecording}
                  className={`p-3 rounded-xl transition-colors ${
                    isRecording 
                      ? "bg-red-600 hover:bg-red-500 text-white" 
                      : "bg-purple-600 hover:bg-purple-500 text-white"
                  }`}
                >
                  <Mic className="w-5 h-5" />
                </button>
                <span className="text-slate-400 text-sm">
                  {isRecording ? "Kayıt devam ediyor..." : "Mikrofona tıklayın ve konuşun"}
                </span>
              </div>
              <textarea
                value={transcribedText}
                onChange={(e) => setTranscribedText(e.target.value)}
                placeholder="Sesli komutunuz buraya yazılacak..."
                className="w-full h-32 bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 resize-none"
              />
            </div>
          </div>

          {/* Info */}
          <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
            <p className="text-slate-400 text-sm">
              💡 <strong>KVKK Uyumlu:</strong> Ses verisi tarayıcıda işlenir, sunucuya gönderilmez. 
              Fotoğraflar analiz için geçici olarak kullanılır ve güvenli şekilde işlenir.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-800 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-slate-400 hover:text-white transition-colors"
          >
            İptal
          </button>
          <button
            onClick={handleAnalyze}
            disabled={isProcessing}
            className="px-6 py-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Analiz ediliyor...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Analiz Et
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
