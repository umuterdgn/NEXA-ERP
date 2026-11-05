"use client"

/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Nexa ERP - Şantiye Telsiz (PTT) & Sesli İletişim Ağı
 */

import React, { useState, useEffect, useRef } from "react"
import {
  Radio,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Users,
  AlertTriangle,
  Play,
  Pause,
  RotateCcw,
  Signal,
  Wifi,
  PhoneCall,
  Activity,
  Headphones,
  Sliders,
  Flame,
  CheckCircle2,
  Clock,
  ShieldAlert,
} from "lucide-react"

interface Channel {
  id: string
  name: string
  frequency: string
  category: string
  activeUsers: number
  description: string
  isEmergency?: boolean
}

interface RadioMessage {
  id: string
  senderName: string
  senderRole: string
  channelId: string
  timestamp: string
  durationSec: number
  transcript: string
  isPlaying?: boolean
}

interface OnlineUser {
  id: string
  name: string
  role: string
  device: string
  signalLevel: number // 1-4
  isSpeaking: boolean
}

const CHANNELS: Channel[] = [
  {
    id: "ch-1",
    name: "Kanal 1: Genel Şantiye",
    frequency: "142.150 MHz",
    category: "GENEL",
    activeUsers: 14,
    description: "Saha mühendisleri, şefler ve formenler ortak koordinasyon hattı",
  },
  {
    id: "ch-2",
    name: "Kanal 2: Vinç & Ağır Yük",
    frequency: "142.300 MHz",
    category: "OPERASYON",
    activeUsers: 5,
    description: "Kule vinç operatörleri, sapancılar ve kaba yapı şefleri",
  },
  {
    id: "ch-3",
    name: "Kanal 3: İSG & Güvenlik",
    frequency: "142.600 MHz",
    category: "GÜVENLİK",
    activeUsers: 8,
    description: "İSG uzmanları, kapı güvenlik ekipleri ve ilk yardım birimi",
  },
  {
    id: "ch-4",
    name: "Kanal 4: Beton & Pompa",
    frequency: "143.100 MHz",
    category: "BETON",
    activeUsers: 6,
    description: "Beton mikseri, pompa operatörleri ve laboratuvar numune personeli",
  },
  {
    id: "ch-5",
    name: "Kanal 5: Elektrik & Tesisat",
    frequency: "143.450 MHz",
    category: "MEKANİK",
    activeUsers: 7,
    description: "Şantiye içi elektrik, su ve mekanik altyapı taşeronları",
  },
  {
    id: "ch-emergency",
    name: "🚨 KANAL 0: ACİL DURUM (SOS)",
    frequency: "141.000 MHz",
    category: "ACİL DURUM",
    activeUsers: 40,
    description: "Şantiye geneli tahliye, ramak kala ve acil durum genel anons hattı",
    isEmergency: true,
  },
]

const INITIAL_MESSAGES: RadioMessage[] = [
  {
    id: "msg-1",
    senderName: "Murat Çetin",
    senderRole: "Şantiye Şefi",
    channelId: "ch-1",
    timestamp: "10:42",
    durationSec: 6,
    transcript: "Blok A 4. kat döşeme demir kontrolleri tamamlandı, beton mikseri sahaya girebilir.",
  },
  {
    id: "msg-2",
    senderName: "Hasan Dağ",
    senderRole: "Kule Vinç Operatörü",
    channelId: "ch-2",
    timestamp: "10:38",
    durationSec: 9,
    transcript: "3. kule vinç hazır. 12'lik nervürlü demir paletini güney aksına indiriyorum, alt sahayı boşaltın.",
  },
  {
    id: "msg-3",
    senderName: "Zeynep Kaya",
    senderRole: "A Sınıfı İSG Uzmanı",
    channelId: "ch-3",
    timestamp: "10:15",
    durationSec: 7,
    transcript: "Kuzey cephe iskele emniyet kancası denetimleri devam ediyor, baret takmayan taşeronlar uyarıldı.",
  },
  {
    id: "msg-4",
    senderName: "Selim Tokat",
    senderRole: "Beton Pompa Çavuşu",
    channelId: "ch-4",
    timestamp: "09:50",
    durationSec: 8,
    transcript: "C35 hazır beton transmikseri şantiye kapısına yanaştı, slump testini alıyoruz.",
  },
]

const ONLINE_PERSONNEL: OnlineUser[] = [
  { id: "p-1", name: "Murat Çetin", role: "Şantiye Şefi", device: "Motorola DP4800e", signalLevel: 4, isSpeaking: false },
  { id: "p-2", name: "Hasan Dağ", role: "Vinç Operatörü", device: "Hytera HP785", signalLevel: 4, isSpeaking: false },
  { id: "p-3", name: "Zeynep Kaya", role: "İSG Uzmanı", device: "Nexa Mobile (iOS PTT)", signalLevel: 3, isSpeaking: false },
  { id: "p-4", name: "Kemal Demir", role: "Demir Formeni", device: "Nexa Mobile (Android)", signalLevel: 4, isSpeaking: false },
  { id: "p-5", name: "Selim Tokat", role: "Pompa Çavuşu", device: "Baofeng UV-82", signalLevel: 2, isSpeaking: false },
  { id: "p-6", name: "Ahmet Yılmaz", role: "Lojistik Tır Sürücüsü", device: "Nexa Mobile (Background GPS)", signalLevel: 3, isSpeaking: false },
]

export default function WalkieTalkiePage() {
  const [selectedChannel, setSelectedChannel] = useState<Channel>(CHANNELS[0])
  const [isTransmitting, setIsTransmitting] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [volume, setVolume] = useState(85)
  const [messages, setMessages] = useState<RadioMessage[]>(INITIAL_MESSAGES)
  const [playingMsgId, setPlayingMsgId] = useState<string | null>(null)
  const [transmitTimer, setTransmitTimer] = useState(0)
  const [noiseReduction, setNoiseReduction] = useState(true)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  // Bas-Konuş Süre Sayacı
  useEffect(() => {
    if (isTransmitting) {
      setTransmitTimer(0)
      timerRef.current = setInterval(() => {
        setTransmitTimer((prev) => prev + 1)
      }, 1000)
    } else {
      if (timerRef.current) clearInterval(timerRef.current)
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [isTransmitting])

  const handleStartTransmitting = () => {
    if (isMuted) return
    setIsTransmitting(true)
  }

  const handleStopTransmitting = () => {
    if (!isTransmitting) return
    setIsTransmitting(false)
    if (transmitTimer >= 1) {
      const newMsg: RadioMessage = {
        id: `msg-${Date.now()}`,
        senderName: "Sen (Merkez Ofis)",
        senderRole: "Yönetici",
        channelId: selectedChannel.id,
        timestamp: new Date().toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" }),
        durationSec: Math.max(1, transmitTimer),
        transcript: `${selectedChannel.name} frekansından merkez sesli anonsu iletildi.`,
      }
      setMessages((prev) => [newMsg, ...prev])
    }
    setTransmitTimer(0)
  }

  const togglePlayAudio = (id: string) => {
    if (playingMsgId === id) {
      setPlayingMsgId(null)
    } else {
      setPlayingMsgId(id)
      setTimeout(() => {
        setPlayingMsgId(null)
      }, 4000)
    }
  }

  const filteredMessages = messages.filter((m) => m.channelId === selectedChannel.id || selectedChannel.isEmergency)

  return (
    <div className="space-y-6">
      {/* Üst Başlık & Durum */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950 border border-slate-800 shadow-xl">
        <div className="flex items-center gap-3.5">
          <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-2xl text-blue-400">
            <Radio className="w-8 h-8 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-white tracking-tight">
                Telsiz (PTT) & Şantiye Sesli İletişim Ağı
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                CANLI FREKANS AKTİF
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Web ve mobil uygulama arasında 0 gecikmeli bas-konuş (Push-to-Talk) şantiye telsiz köprüsü.
            </p>
          </div>
        </div>

        {/* Acil Durum / SOS Genel Anons Butonu */}
        <button
          onClick={() => {
            const emergencyCh = CHANNELS.find((c) => c.isEmergency)
            if (emergencyCh) setSelectedChannel(emergencyCh)
          }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-600/20 hover:bg-red-600/30 border border-red-500/40 text-red-400 font-bold text-xs transition-all shadow-lg shadow-red-950/40"
        >
          <Flame className="w-4 h-4 text-red-400 animate-bounce" />
          <span>TÜM KANALLARA ACİL ANONS (SOS)</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* SOL: Kanal Seçimi ve Frekans Listesi (4 Kolon) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl">
            <div className="flex items-center justify-between mb-3 pb-3 border-b border-slate-800">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <Sliders className="w-4 h-4 text-blue-400" />
                Şantiye Frekans Kanalları
              </h2>
              <span className="text-xs text-slate-400 font-mono">
                {CHANNELS.length} Kanal
              </span>
            </div>

            <div className="space-y-2">
              {CHANNELS.map((ch) => {
                const isSelected = selectedChannel.id === ch.id
                return (
                  <button
                    key={ch.id}
                    onClick={() => setSelectedChannel(ch)}
                    className={`w-full text-left p-3.5 rounded-xl border transition-all flex flex-col gap-1.5 ${
                      isSelected
                        ? ch.isEmergency
                          ? "bg-red-950/40 border-red-500 text-white shadow-lg shadow-red-950/50"
                          : "bg-blue-600/15 border-blue-500 text-white shadow-lg shadow-blue-500/10"
                        : "bg-slate-950/60 hover:bg-slate-800/50 border-slate-800 text-slate-300"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm tracking-tight flex items-center gap-2">
                        {ch.isEmergency && <Flame className="w-4 h-4 text-red-400 shrink-0" />}
                        {ch.name}
                      </span>
                      <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded bg-slate-900 border border-slate-700/60 text-slate-300">
                        {ch.frequency}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-400 line-clamp-1">
                      {ch.description}
                    </p>

                    <div className="flex items-center justify-between pt-1 border-t border-slate-800/60 text-[10px] text-slate-500 font-mono">
                      <span>{ch.category}</span>
                      <span className="flex items-center gap-1 text-emerald-400">
                        <Users className="w-3 h-3" />
                        {ch.activeUsers} Dinleyen
                      </span>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Ses ve Gürültü Filtreleme Ayarları */}
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-3">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <Headphones className="w-4 h-4 text-slate-400" />
              Ses & Hoparlör Kontrolleri
            </h3>

            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">Hoparlör Sesi:</span>
              <span className="font-mono text-white font-bold">{volume}%</span>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsMuted(!isMuted)}
                className={`p-2 rounded-lg border transition-all ${
                  isMuted ? "bg-red-500/20 border-red-500 text-red-400" : "bg-slate-800 border-slate-700 text-slate-300"
                }`}
                title={isMuted ? "Sesi Aç" : "Sessize Al"}
              >
                {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>
              <input
                type="range"
                min="0"
                max="100"
                value={volume}
                onChange={(e) => setVolume(Number(e.target.value))}
                className="w-full accent-blue-500 cursor-pointer"
              />
            </div>

            <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-200 font-semibold block">Şantiye Gürültü Engelleme (AI)</span>
                <span className="text-[10px] text-slate-500">Kompresör ve rüzgar sesini filtreler</span>
              </div>
              <button
                onClick={() => setNoiseReduction(!noiseReduction)}
                className={`w-11 h-6 rounded-full transition-colors relative ${
                  noiseReduction ? "bg-blue-600" : "bg-slate-800"
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full bg-white transition-transform absolute top-1 ${
                    noiseReduction ? "left-6" : "left-1"
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* ORTA: PTT Telsiz Konsolu & Dalga Formu (5 Kolon) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl flex flex-col items-center justify-center relative overflow-hidden">
            {/* Arka Plan Frekans Efekti */}
            <div className="absolute inset-0 bg-radial-gradient from-blue-500/5 via-transparent to-transparent pointer-events-none" />

            {/* Seçili Frekans Bilgi Paneli */}
            <div className="w-full text-center mb-6">
              <span className="text-[11px] font-mono tracking-widest text-blue-400 font-bold uppercase">
                Aktif Frekans Yayını
              </span>
              <h2 className="text-2xl font-black text-white tracking-tight mt-1">
                {selectedChannel.name}
              </h2>
              <div className="inline-flex items-center gap-2 mt-2 px-3 py-1 rounded-full bg-slate-950 border border-slate-800 text-xs font-mono text-emerald-400">
                <Activity className="w-3.5 h-3.5 animate-pulse text-emerald-400" />
                <span>TX/RX: {selectedChannel.frequency}</span>
                <span className="text-slate-500">•</span>
                <span>{selectedChannel.activeUsers} İstasyon Bağlı</span>
              </div>
            </div>

            {/* Dinamik Ses Dalga Formu Görselleştirici (Audio Waveform) */}
            <div className="h-16 flex items-center justify-center gap-1.5 w-full max-w-xs mb-8">
              {[40, 65, 30, 85, 95, 45, 70, 90, 55, 100, 75, 40, 80, 60, 90, 35, 70].map((h, i) => (
                <div
                  key={i}
                  className={`w-1.5 rounded-full transition-all duration-150 ${
                    isTransmitting
                      ? "bg-gradient-to-t from-red-500 to-amber-400 animate-pulse"
                      : "bg-slate-800"
                  }`}
                  style={{
                    height: isTransmitting ? `${Math.max(16, (h * (transmitTimer % 2 === 0 ? 0.9 : 1.3)) % 64)}px` : "12px",
                  }}
                />
              ))}
            </div>

            {/* DEV BAS-KONUŞ (PUSH-TO-TALK) BUTONU */}
            <div className="relative flex flex-col items-center">
              {isTransmitting && (
                <>
                  <div className="absolute -inset-4 rounded-full bg-red-500/20 animate-ping pointer-events-none" />
                  <div className="absolute -inset-8 rounded-full bg-red-500/10 animate-pulse pointer-events-none" />
                </>
              )}

              <button
                type="button"
                onMouseDown={handleStartTransmitting}
                onMouseUp={handleStopTransmitting}
                onTouchStart={handleStartTransmitting}
                onTouchEnd={handleStopTransmitting}
                className={`w-40 h-40 rounded-full border-4 flex flex-col items-center justify-center transition-all shadow-2xl select-none cursor-pointer ${
                  isTransmitting
                    ? "bg-gradient-to-b from-red-500 to-red-700 border-red-300 text-white shadow-red-500/50 scale-95"
                    : "bg-gradient-to-b from-slate-800 to-slate-950 hover:from-slate-700 hover:to-slate-900 border-blue-500/40 text-blue-400 shadow-blue-500/20 active:scale-95"
                }`}
              >
                <Mic className={`w-14 h-14 ${isTransmitting ? "animate-bounce" : ""}`} />
                <span className="text-xs font-black tracking-widest mt-1 uppercase">
                  {isTransmitting ? "YAYINDASINIZ" : "BAS KONUŞ"}
                </span>
                <span className="text-[10px] font-mono opacity-80">
                  {isTransmitting ? `${transmitTimer} sn` : "(PTT HOLD)"}
                </span>
              </button>
            </div>

            <p className="text-xs text-slate-400 text-center mt-6 max-w-xs">
              {isTransmitting ? (
                <span className="text-red-400 font-bold animate-pulse">
                  🎙️ Sesiniz şantiyedeki tüm telsiz ve telefonlara eşzamanlı aktarılıyor...
                </span>
              ) : (
                "Konuşmak için butona basılı tutun, bitirdiğinizde bırakın."
              )}
            </p>
          </div>

          {/* Son Sesli Mesajlar ve Çözülmüş Telsiz Geçmişi */}
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-blue-400" />
                Frekans Ses Kayıtları (Dispatch Log)
              </h3>
              <span className="text-[11px] text-slate-400">{filteredMessages.length} Kayıt</span>
            </div>

            <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
              {filteredMessages.map((msg) => {
                const isPlaying = playingMsgId === msg.id
                return (
                  <div
                    key={msg.id}
                    className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 flex flex-col gap-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-200">{msg.senderName}</span>
                        <span className="text-[10px] text-blue-400 bg-blue-950/60 px-1.5 py-0.5 rounded border border-blue-500/20 font-mono">
                          {msg.senderRole}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-500 font-mono">{msg.timestamp}</span>
                    </div>

                    <p className="text-xs text-slate-300 italic">
                      "{msg.transcript}"
                    </p>

                    <div className="flex items-center justify-between pt-1 border-t border-slate-800/60">
                      <button
                        onClick={() => togglePlayAudio(msg.id)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1.5 transition-all ${
                          isPlaying
                            ? "bg-emerald-500 text-slate-950"
                            : "bg-slate-800 hover:bg-slate-700 text-slate-200"
                        }`}
                      >
                        {isPlaying ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                        <span>{isPlaying ? "Oynatılıyor..." : `Dinle (${msg.durationSec} sn)`}</span>
                      </button>

                      <span className="text-[10px] text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        İletildi
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* SAĞ: Şantiyede Telsize Bağlı Personel Listesi (3 Kolon) */}
        <div className="lg:col-span-3 space-y-4">
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-3">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-emerald-400" />
                Frekansı Dinleyenler
              </h2>
              <span className="text-xs font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                {ONLINE_PERSONNEL.length} Aktif
              </span>
            </div>

            <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
              {ONLINE_PERSONNEL.map((person) => (
                <div
                  key={person.id}
                  className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-between"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="relative">
                      <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-bold text-white">
                        {person.name.substring(0, 2).toUpperCase()}
                      </div>
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-slate-950 absolute -bottom-0.5 -right-0.5" />
                    </div>

                    <div>
                      <span className="text-xs font-bold text-slate-200 block truncate max-w-[120px]">
                        {person.name}
                      </span>
                      <span className="text-[10px] text-slate-400 block truncate max-w-[120px]">
                        {person.role}
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="flex items-center justify-end gap-0.5 text-emerald-400 mb-0.5" title="Sinyal Gücü">
                      <Signal className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-[9px] text-slate-500 block truncate max-w-[90px]">
                      {person.device}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

