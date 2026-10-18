"use client"

import React, { useState, useEffect } from "react"
import {
  X,
  HardHat,
  Cpu,
  Radio,
  User,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Search,
  Battery,
  Clock,
  Sparkles
} from "lucide-react"
import { toast } from "react-hot-toast"

export interface BlePersonnelOption {
  id: string
  name: string
  personnelNo?: string
  department?: string
  position?: string
}

interface BleDeviceAssignModalProps {
  isOpen: boolean
  onClose: () => void
  personnelList?: BlePersonnelOption[]
  initialPersonnelId?: string
  onAssigned?: () => void
}

export default function BleDeviceAssignModal({
  isOpen,
  onClose,
  personnelList = [],
  initialPersonnelId,
  onAssigned
}: BleDeviceAssignModalProps) {
  const [selectedPersonnelId, setSelectedPersonnelId] = useState<string>("")
  const [deviceType, setDeviceType] = useState<string>("BARET")
  const [macAddress, setMacAddress] = useState<string>("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [searchFilter, setSearchFilter] = useState("")
  const [assignedDevices, setAssignedDevices] = useState<any[]>([])
  const [activeTab, setActiveTab] = useState<"assign" | "list">("assign")
  const [isLoadingDevices, setIsLoadingDevices] = useState(false)

  useEffect(() => {
    if (initialPersonnelId) {
      setSelectedPersonnelId(initialPersonnelId)
    } else if (personnelList.length > 0 && !selectedPersonnelId) {
      setSelectedPersonnelId(personnelList[0].id)
    }
  }, [initialPersonnelId, personnelList, selectedPersonnelId])

  useEffect(() => {
    if (isOpen) {
      fetchAssignedDevices()
    }
  }, [isOpen])

  const fetchAssignedDevices = async () => {
    setIsLoadingDevices(true)
    try {
      const res = await fetch("/api/admin/ble-devices")
      if (res.ok) {
        const data = await res.json()
        setAssignedDevices(Array.isArray(data) ? data : [])
      }
    } catch (err) {
      console.error("BLE devices fetch error:", err)
    } finally {
      setIsLoadingDevices(false)
    }
  }

  if (!isOpen) return null

  // Rastgele test MAC adresi üret
  const generateRandomMac = () => {
    const hex = () => Math.floor(Math.random() * 256).toString(16).padStart(2, "0").toUpperCase()
    const generated = `F8:33:${hex()}:${hex()}:${hex()}:${hex()}`
    setMacAddress(generated)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedPersonnelId) {
      toast.error("Lütfen bir personel seçin")
      return
    }

    if (!macAddress.trim()) {
      toast.error("Lütfen geçerli bir BLE MAC adresi girin")
      return
    }

    setIsSubmitting(true)
    try {
      const res = await fetch("/api/admin/ble-devices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          personnelId: selectedPersonnelId,
          deviceType,
          macAddress: macAddress.trim().toUpperCase()
        })
      })

      const data = await res.json()

      if (res.ok) {
        toast.success(data.message || "Cihaz personele başarıyla zimmetlendi!", {
          icon: "🪖",
          duration: 4000
        })
        setMacAddress("")
        await fetchAssignedDevices()
        if (onAssigned) onAssigned()
        setActiveTab("list")
      } else {
        toast.error(data.error || "Zimmetleme işlemi başarısız oldu")
      }
    } catch (err) {
      console.error(err)
      toast.error("İşlem sırasında bir hata oluştu")
    } finally {
      setIsSubmitting(false)
    }
  }

  const filteredPersonnel = personnelList.filter(p =>
    p.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
    (p.personnelNo && p.personnelNo.toLowerCase().includes(searchFilter.toLowerCase())) ||
    (p.position && p.position.toLowerCase().includes(searchFilter.toLowerCase()))
  )

  const selectedPerson = personnelList.find(p => p.id === selectedPersonnelId)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Modal Başlığı */}
        <div className="flex items-center justify-between p-6 border-b border-slate-800 bg-slate-900/80">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center border border-cyan-500/20 shadow-lg shadow-cyan-500/10">
              <Cpu className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <span>IoT Cihaz & Baret Zimmetleme</span>
                <span className="text-[11px] font-semibold bg-cyan-500/20 text-cyan-300 px-2.5 py-0.5 rounded-full border border-cyan-500/30">
                  BLE Telemetri
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Şantiye personeline akıllı baret, yelek ve BLE beacon tanımlayın
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Geçişleri */}
        <div className="flex border-b border-slate-800 bg-slate-950/40 px-6 pt-3 gap-2">
          <button
            onClick={() => setActiveTab("assign")}
            className={`pb-3 px-3 text-xs font-semibold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === "assign"
                ? "border-cyan-500 text-cyan-400"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <HardHat className="w-4 h-4" />
            Yeni Cihaz Zimmetle
          </button>
          <button
            onClick={() => setActiveTab("list")}
            className={`pb-3 px-3 text-xs font-semibold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === "list"
                ? "border-cyan-500 text-cyan-400"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <Radio className="w-4 h-4" />
            Zimmetli Cihazlar ({assignedDevices.length})
          </button>
        </div>

        {/* Modal Gövdesi */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {activeTab === "assign" ? (
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Personel Seçimi */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Zimmetlenecek Personel
                </label>
                <div className="space-y-2">
                  <div className="relative">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                    <input
                      type="text"
                      placeholder="Personel ara (Ad, numara veya pozisyon)..."
                      value={searchFilter}
                      onChange={(e) => setSearchFilter(e.target.value)}
                      className="w-full bg-slate-800/80 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-cyan-500"
                    />
                  </div>

                  <select
                    value={selectedPersonnelId}
                    onChange={(e) => setSelectedPersonnelId(e.target.value)}
                    required
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500"
                  >
                    <option value="">-- Personel Seçin --</option>
                    {filteredPersonnel.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} {p.personnelNo ? `(${p.personnelNo})` : ""} - {p.position || p.department || "Personel"}
                      </option>
                    ))}
                  </select>

                  {selectedPerson && (
                    <div className="p-3 bg-cyan-950/20 border border-cyan-500/30 rounded-xl flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2 text-cyan-300">
                        <User className="w-4 h-4 text-cyan-400" />
                        <span className="font-semibold">{selectedPerson.name}</span>
                        <span className="text-slate-400">• {selectedPerson.position || "Saha Personeli"}</span>
                      </div>
                      <span className="px-2 py-0.5 bg-cyan-500/20 text-cyan-300 rounded font-mono text-[10px]">
                        ID: {selectedPerson.id.slice(-6)}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Cihaz Türü */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Cihaz / Donanım Türü
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { id: "BARET", label: "Akıllı Baret", icon: "🪖" },
                    { id: "YELEK", label: "Sensörlü Yelek", icon: "🦺" },
                    { id: "AYAKKABI", label: "İSG Ayakkabısı", icon: "🥾" },
                    { id: "YAKA_KARTI", label: "BLE Yaka Kartı", icon: "🪪" }
                  ].map((type) => (
                    <button
                      key={type.id}
                      type="button"
                      onClick={() => setDeviceType(type.id)}
                      className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                        deviceType === type.id
                          ? "bg-cyan-500/20 border-cyan-500 text-white shadow-lg shadow-cyan-500/10 font-bold"
                          : "bg-slate-800/60 border-slate-700/60 text-slate-400 hover:text-white hover:border-slate-600"
                      }`}
                    >
                      <div className="text-2xl mb-1">{type.icon}</div>
                      <div className="text-xs">{type.label}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* MAC Adresi */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    Cihaz MAC Adresi
                  </label>
                  <button
                    type="button"
                    onClick={generateRandomMac}
                    className="text-xs text-cyan-400 hover:text-cyan-300 font-medium flex items-center gap-1 cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Örnek MAC Üret</span>
                  </button>
                </div>
                <input
                  type="text"
                  placeholder="Örn: AA:BB:CC:11:22:33"
                  value={macAddress}
                  onChange={(e) => setMacAddress(e.target.value.toUpperCase())}
                  required
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-sm font-mono text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 uppercase"
                />
                <p className="text-[11px] text-slate-500 mt-1.5 flex items-center gap-1">
                  <span>ℹ️</span> Eğer bu MAC adresi sistemde zaten kayıtlıysa, zimmetlenen personel otomatik olarak güncellenir.
                </p>
              </div>

              {/* Butonlar */}
              <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-xl border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800 text-xs font-semibold transition-colors"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-cyan-500/20 transition-all flex items-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Kaydediliyor...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Cihazı Personele Zimmetle</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          ) : (
            /* Zimmetli Cihazlar Listesi */
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-2">
                <span className="text-xs text-slate-400">
                  Toplam {assignedDevices.length} kayıtlı BLE cihazı
                </span>
                <button
                  onClick={fetchAssignedDevices}
                  className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoadingDevices ? "animate-spin" : ""}`} />
                  Yenile
                </button>
              </div>

              {assignedDevices.length === 0 ? (
                <div className="py-12 text-center text-slate-400 bg-slate-800/30 rounded-2xl border border-slate-800">
                  <Cpu className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                  <p className="text-sm">Henüz kayıtlı veya zimmetli bir BLE cihazı bulunmuyor.</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-800 border border-slate-800 rounded-2xl overflow-hidden bg-slate-800/30">
                  {assignedDevices.map((device) => {
                    const icon =
                      device.deviceType === "BARET"
                        ? "🪖"
                        : device.deviceType === "YELEK"
                        ? "🦺"
                        : device.deviceType === "AYAKKABI"
                        ? "🥾"
                        : "🪪"

                    return (
                      <div
                        key={device.id}
                        className="p-4 flex items-center justify-between gap-4 hover:bg-slate-800/50 transition-colors"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="text-2xl shrink-0">{icon}</span>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-sm text-white">{device.deviceType}</span>
                              <span className="px-2 py-0.5 rounded bg-slate-800 text-cyan-300 font-mono text-[11px] border border-slate-700">
                                {device.macAddress}
                              </span>
                            </div>
                            <p className="text-xs text-slate-400 mt-0.5 truncate">
                              Zimmetli: <strong className="text-slate-200">{device.personnel?.name || device.assignedTo || "Atanmamış"}</strong>
                              {device.personnel?.position && ` (${device.personnel.position})`}
                            </p>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <div className="flex items-center gap-1 text-emerald-400 text-xs font-semibold">
                            <Battery className="w-3.5 h-3.5" />
                            <span>%{device.batteryLevel ?? 100}</span>
                          </div>
                          <span className="text-[10px] text-slate-500 block mt-0.5">
                            {device.lastSeenAt
                              ? new Date(device.lastSeenAt).toLocaleTimeString("tr-TR", {
                                  hour: "2-digit",
                                  minute: "2-digit"
                                })
                              : "Çevrimdışı"}
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
