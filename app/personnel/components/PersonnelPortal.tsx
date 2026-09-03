"use client"
/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * This code is the property of NXA Software.
 */


import { useState, useEffect, useRef } from "react"
import { signOut } from "next-auth/react"
import { 
  Camera, 
  FileText, 
  Wallet, 
  Clock, 
  Shield, 
  CheckSquare, 
  Calendar as CalendarIcon,
  Package,
  LogOut,
  Bell,
  User,
  X,
  Megaphone,
  FileCheck,
  Building,
  AlertTriangle,
  Upload,
  Send
} from "lucide-react"

interface PersonnelPortalProps {
  data: {
    personnel: {
      id: string
      name: string
      department: string
      currentSite: string
    }
    summary: {
      estimatedEarnings: number
      totalHours: number
      attendanceCount: number
      equipmentCount: number
    }
    attendanceRecords: any[]
    equipment: any[]
    tasks: any[]
    payments: any[]
  }
}

export function PersonnelPortal({ data }: PersonnelPortalProps) {
  const [activeTab, setActiveTab] = useState("tasks")
  const [showQRModal, setShowQRModal] = useState(false)
  const [showRequestModal, setShowRequestModal] = useState(false)
  const [showISGModal, setShowISGModal] = useState(false)
  const [showNearMissModal, setShowNearMissModal] = useState(false)
  const [isgImage, setIsgImage] = useState<File | null>(null)
  const [isgDescription, setIsgDescription] = useState("")
  const [isgType, setIsgType] = useState("TEHLIKE")
  const [isSubmittingISG, setIsSubmittingISG] = useState(false)
  const [nearMissFormData, setNearMissFormData] = useState({
    location: "",
    category: "",
    severity: "low",
    description: ""
  })
  const [submittingNearMiss, setSubmittingNearMiss] = useState(false)
  const [showSuccessToast, setShowSuccessToast] = useState(false)
  const [currentAnnouncement, setCurrentAnnouncement] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  // Mock announcements
  const announcements = [
    { id: 1, text: "⚠️ İSG Denetimi: Yarın sabah 09:00'da güvenlik ekipmanları kontrol edilecek", type: "warning" },
    { id: 2, text: "🏗️ Beton Dökümü: C blokta 14:00'te beton dökümü yapılacak", type: "info" },
    { id: 3, text: "🌤️ Hava Durumu: Yarın yağmur bekleniyor, açık alanlarda dikkatli olun", type: "info" }
  ]

  // Mock documents for approval
  const documents = [
    { id: 1, title: "Ağustos 2024 Maaş Bordrosu", type: "salary", status: "pending" },
    { id: 2, title: "İSG Talimatnamesi - 2024", type: "safety", status: "pending" },
    { id: 3, title: "KVKK Aydınlatma Metni", type: "legal", status: "approved" }
  ]

  // Auto-rotate announcements
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentAnnouncement((prev) => (prev + 1) % announcements.length)
    }, 5000)
    return () => clearInterval(interval)
  }, [announcements.length])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY'
    }).format(amount)
  }

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString('tr-TR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })
  }

  const formatTime = (date: string | Date) => {
    return new Date(date).toLocaleTimeString('tr-TR', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const handleNearMissSubmit = async () => {
    if (!nearMissFormData.location.trim() || !nearMissFormData.category || !nearMissFormData.description.trim()) {
      alert("Lütfen tüm alanları doldurun")
      return
    }

    setSubmittingNearMiss(true)

    try {
      const categoryMap: Record<string, string> = {
        'fall': 'Düşme Riski',
        'electrical': 'Elektriksel Tehlike',
        'machinery': 'Makine Arızası',
        'chemical': 'Kimyasal Maruz Kalma',
        'structural': 'Yapısal Sorun',
        'other': 'Diğer'
      }
      
      const severityMap: Record<string, string> = {
        'low': 'Düşük',
        'medium': 'Orta',
        'high': 'Yüksek'
      }

      const response = await fetch('/api/admin/near-miss', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          isAnonymous: true,
          location: nearMissFormData.location,
          category: categoryMap[nearMissFormData.category] || nearMissFormData.category,
          severity: severityMap[nearMissFormData.severity] || nearMissFormData.severity,
          description: nearMissFormData.description
        })
      })

      if (response.ok) {
        setShowSuccessToast(true)
        setTimeout(() => setShowSuccessToast(false), 3000)
        setShowNearMissModal(false)
        setNearMissFormData({ location: '', category: '', severity: 'low', description: '' })
      } else {
        throw new Error('Bildirim gönderilemedi')
      }
    } catch (error) {
      console.error('Near-miss report error:', error)
      alert('Bir hata oluştu, lütfen tekrar deneyin')
    } finally {
      setSubmittingNearMiss(false)
    }
  }

  const handleISGReportSubmit = async () => {
    if (!isgImage || !isgDescription.trim()) {
      alert("Lütf bir fotoğraf seçin ve açıklama girin")
      return
    }

    setIsSubmittingISG(true)

    try {
      // Upload image to Cloudinary
      const formData = new FormData()
      formData.append('file', isgImage)
      formData.append('upload_preset', process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || 'ml_default')

      const uploadResponse = await fetch(`https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`, {
        method: 'POST',
        body: formData
      })

      const uploadData = await uploadResponse.json()

      if (!uploadData.secure_url) {
        throw new Error('Fotoğraf yüklenemedi')
      }

      // Submit İSG report
      const reportResponse = await fetch('/api/isg', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageUrl: uploadData.secure_url,
          description: isgDescription,
          type: isgType,
          personelId: data.personnel.id
        })
      })

      if (reportResponse.ok) {
        setShowSuccessToast(true)
        setTimeout(() => setShowSuccessToast(false), 3000)
        setShowISGModal(false)
        setIsgImage(null)
        setIsgDescription("")
        setIsgType("TEHLIKE")
      } else {
        throw new Error('Bildirim gönderilemedi')
      }
    } catch (error) {
      console.error('İSG report error:', error)
      alert('Bir hata oluştu, lütfen tekrar deneyin')
    } finally {
      setIsSubmittingISG(false)
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setIsgImage(e.target.files[0])
    }
  }

  return (
    <>
      {/* Header */}
      <div className="bg-slate-900/50 backdrop-blur-lg border border-slate-800 rounded-2xl p-6">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-blue-500/20 rounded-xl">
            <User className="w-6 h-6 text-blue-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">
              Hoş Geldin, {data.personnel.name}
            </h1>
            <p className="text-slate-400 text-sm">
              {data.personnel.department} • {data.personnel.currentSite}
            </p>
          </div>
        </div>
      </div>

      {/* Live Announcement Banner */}
      <div className="bg-gradient-to-r from-amber-500/20 to-orange-500/20 backdrop-blur-lg rounded-2xl p-4 border border-amber-500/30">
        <div className="flex items-center gap-3">
          <Megaphone className="w-5 h-5 text-amber-400 flex-shrink-0" />
          <div className="flex-1 overflow-hidden">
            <p className="text-amber-100 text-sm font-medium animate-pulse">
              Dikkat: Bugün saat 15:00'te B blokta beton dökümü yapılacaktır. İSG kurallarına uyunuz.
            </p>
          </div>
        </div>
      </div>

      {/* Hero Action Buttons */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <button
          onClick={() => setShowNearMissModal(true)}
          className="flex items-center gap-4 p-6 bg-gradient-to-r from-yellow-600 to-amber-600 rounded-2xl hover:from-yellow-500 hover:to-amber-500 transition-all shadow-lg shadow-yellow-500/30"
        >
          <div className="p-4 bg-white/20 rounded-xl">
            <AlertTriangle className="w-8 h-8 text-white" />
          </div>
          <div className="text-left">
            <h3 className="text-lg font-bold text-white">⚠️ Ramak Kala Bildir</h3>
            <p className="text-yellow-100 text-sm">Anonim tehlike bildirimi</p>
          </div>
        </button>

        <button
          onClick={() => setShowISGModal(true)}
          className="flex items-center gap-4 p-6 bg-gradient-to-r from-red-600 to-orange-600 rounded-2xl hover:from-red-500 hover:to-orange-500 transition-all shadow-lg shadow-red-500/30"
        >
          <div className="p-4 bg-white/20 rounded-xl">
            <AlertTriangle className="w-8 h-8 text-white" />
          </div>
          <div className="text-left">
            <h3 className="text-lg font-bold text-white">🚨 İSG Tehlike Bildir</h3>
            <p className="text-red-100 text-sm">Fotoğraf çek ve bildir</p>
          </div>
        </button>

        <button
          onClick={() => setShowQRModal(true)}
          className="flex items-center gap-4 p-6 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl hover:from-blue-500 hover:to-purple-500 transition-all shadow-lg shadow-blue-500/30"
        >
          <div className="p-4 bg-white/20 rounded-xl">
            <Camera className="w-8 h-8 text-white" />
          </div>
          <div className="text-left">
            <h3 className="text-lg font-bold text-white">📱 QR ile Mesai Başlat</h3>
            <p className="text-blue-100 text-sm">Giriş/Çıkış yap</p>
          </div>
        </button>

        <button
          onClick={() => setShowRequestModal(true)}
          className="flex items-center gap-4 p-6 bg-gradient-to-r from-green-600 to-emerald-600 rounded-2xl hover:from-green-500 hover:to-emerald-500 transition-all shadow-lg shadow-green-500/30"
        >
          <div className="p-4 bg-white/20 rounded-xl">
            <FileText className="w-8 h-8 text-white" />
          </div>
          <div className="text-left">
            <h3 className="text-lg font-bold text-white">📝 İzin / Avans Talep Et</h3>
            <p className="text-green-100 text-sm">Hızlı başvuru</p>
          </div>
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-900/50 backdrop-blur-lg rounded-2xl p-6 border border-slate-800 shadow-md hover:shadow-lg transition-shadow">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-500/20 rounded-xl">
              <Wallet className="w-6 h-6 text-green-400" />
            </div>
            <div>
              <p className="text-slate-400 text-sm">Bu Ayki Tahmini Kazanç</p>
              <p className="text-2xl font-bold text-white">
                {formatCurrency(data.summary.estimatedEarnings)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-slate-900/50 backdrop-blur-lg rounded-2xl p-6 border border-slate-800 shadow-md hover:shadow-lg transition-shadow">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-500/20 rounded-xl">
              <Clock className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <p className="text-slate-400 text-sm">Toplam Mesai Saati</p>
              <p className="text-2xl font-bold text-white">
                {data.summary.totalHours} saat
              </p>
            </div>
          </div>
        </div>

        <div className="bg-slate-900/50 backdrop-blur-lg rounded-2xl p-6 border border-slate-800 shadow-md hover:shadow-lg transition-shadow">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-yellow-500/20 rounded-xl">
              <Shield className="w-6 h-6 text-yellow-400" />
            </div>
            <div>
              <p className="text-slate-400 text-sm">İSG Bildirimleri</p>
              <p className="text-2xl font-bold text-white">0</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-slate-900/50 backdrop-blur-lg rounded-2xl border border-slate-800 overflow-hidden">
        {/* Tab Headers */}
        <div className="flex border-b border-slate-800 overflow-x-auto">
          <button
            onClick={() => setActiveTab("tasks")}
            className={`flex-1 px-4 py-4 font-medium transition-colors whitespace-nowrap ${
              activeTab === "tasks"
                ? "text-blue-400 border-b-2 border-blue-400 bg-slate-800/50"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <CheckSquare className="w-4 h-4" />
              Şantiye Görevlerim
            </div>
          </button>
          <button
            onClick={() => setActiveTab("attendance")}
            className={`flex-1 px-4 py-4 font-medium transition-colors whitespace-nowrap ${
              activeTab === "attendance"
                ? "text-blue-400 border-b-2 border-blue-400 bg-slate-800/50"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <CalendarIcon className="w-4 h-4" />
              Mesai ve Finans
            </div>
          </button>
          <button
            onClick={() => setActiveTab("equipment")}
            className={`flex-1 px-4 py-4 font-medium transition-colors whitespace-nowrap ${
              activeTab === "equipment"
                ? "text-blue-400 border-b-2 border-blue-400 bg-slate-800/50"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <Package className="w-4 h-4" />
              Zimmetli Ekipmanlarım
            </div>
          </button>
          <button
            onClick={() => setActiveTab("documents")}
            className={`flex-1 px-4 py-4 font-medium transition-colors whitespace-nowrap ${
              activeTab === "documents"
                ? "text-blue-400 border-b-2 border-blue-400 bg-slate-800/50"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <FileCheck className="w-4 h-4" />
              Evrak & Onaylar
            </div>
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === "tasks" && (
            <div className="space-y-4">
              {data.tasks.length > 0 ? (
                data.tasks.map((task) => (
                  <div
                    key={task.id}
                    className="bg-slate-800/50 rounded-xl p-4 border border-slate-700"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="text-white font-medium">{task.title}</h4>
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        task.status === 'DONE' ? 'bg-green-500/20 text-green-400' :
                        task.status === 'IN_PROGRESS' ? 'bg-blue-500/20 text-blue-400' :
                        'bg-yellow-500/20 text-yellow-400'
                      }`}>
                        {task.status === 'DONE' ? 'Tamamlandı' :
                         task.status === 'IN_PROGRESS' ? 'Devam Ediyor' :
                         'Bekliyor'}
                      </span>
                    </div>
                    {task.description && (
                      <p className="text-slate-400 text-sm mb-2">{task.description}</p>
                    )}
                    <div className="flex items-center gap-4 text-sm text-slate-500">
                      <span>{formatDate(task.createdAt)}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12 text-slate-500">
                  <CheckSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Henüz görev atanmamış</p>
                </div>
              )}
            </div>
          )}

          {activeTab === "attendance" && (
            <div className="space-y-4">
              {data.attendanceRecords.length > 0 ? (
                data.attendanceRecords.map((record) => (
                  <div
                    key={record.id}
                    className="bg-slate-800/50 rounded-xl p-4 border border-slate-700"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-white font-medium">
                        {formatDate(record.date)}
                      </span>
                      <span className="text-green-400 text-sm">
                        {record.dayMultiplier || 1} gün
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-slate-500">Giriş</p>
                        <p className="text-white">
                          {record.checkIn ? formatTime(record.checkIn) : '-'}
                        </p>
                      </div>
                      <div>
                        <p className="text-slate-500">Çıkış</p>
                        <p className="text-white">
                          {record.checkOut ? formatTime(record.checkOut) : '-'}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12 text-slate-500">
                  <CalendarIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Mesai kaydı bulunmuyor</p>
                </div>
              )}
            </div>
          )}

          {activeTab === "equipment" && (
            <div className="space-y-4">
              {data.equipment.length > 0 ? (
                data.equipment.map((assignment) => (
                  <div
                    key={assignment.id}
                    className="bg-slate-800/50 rounded-xl p-4 border border-slate-700"
                  >
                    <div className="flex items-start gap-4">
                      <div className="p-3 bg-slate-700 rounded-lg">
                        <Package className="w-6 h-6 text-slate-400" />
                      </div>
                      <div className="flex-1">
                        <h4 className="text-white font-medium mb-1">
                          {assignment.inventory?.name || 'Bilinmeyen Ekipman'}
                        </h4>
                        <p className="text-slate-400 text-sm mb-2">
                          {assignment.inventory?.code || '-'}
                        </p>
                        <div className="flex items-center gap-2 text-sm">
                          <span className="text-green-400">Zimmetli</span>
                          <span className="text-slate-500">•</span>
                          <span className="text-slate-500">
                            {formatDate(assignment.assignedAt)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
                ) : (
                  <div className="text-center py-12 text-slate-500">
                    <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>Zimmetli ekipman bulunmuyor</p>
                  </div>
                )}
              </div>
            )}

          {activeTab === "documents" && (
            <div className="space-y-4">
              {documents.map((doc) => (
                <div
                  key={doc.id}
                  className="bg-slate-800/50 rounded-xl p-4 border border-slate-700"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg ${
                        doc.type === 'salary' ? 'bg-green-500/20' :
                        doc.type === 'safety' ? 'bg-yellow-500/20' :
                        'bg-blue-500/20'
                      }`}>
                        <FileCheck className={`w-5 h-5 ${
                          doc.type === 'salary' ? 'text-green-400' :
                          doc.type === 'safety' ? 'text-yellow-400' :
                          'text-blue-400'
                        }`} />
                      </div>
                      <div>
                        <h4 className="text-white font-medium">{doc.title}</h4>
                        <p className="text-slate-400 text-sm mt-1">
                          {doc.type === 'salary' ? 'Maaş Bordrosu' :
                           doc.type === 'safety' ? 'İSG Belgesi' :
                           'Hukuki Belge'}
                        </p>
                      </div>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      doc.status === 'approved' 
                        ? 'bg-green-500/20 text-green-400' 
                        : 'bg-yellow-500/20 text-yellow-400'
                    }`}>
                      {doc.status === 'approved' ? 'Onaylandı' : 'Bekliyor'}
                    </span>
                  </div>
                  {doc.status === 'pending' && (
                    <button className="w-full mt-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-colors text-sm font-medium">
                      Onayla
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Corporate Footer */}
      <div className="mt-8 py-6 border-t border-slate-800">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Building className="w-6 h-6 text-blue-400" />
            <div>
              <p className="text-white font-semibold">Mahir Bakay Mühendislik</p>
              <p className="text-slate-400 text-sm">Yapı & İnşaat Sektörü</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-slate-500 text-sm">Powered by</p>
            <p className="text-blue-400 font-medium">Nexa ERP</p>
          </div>
        </div>
      </div>

      {/* QR Modal */}
      {showQRModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 rounded-2xl p-6 max-w-md w-full border border-slate-800">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-white">QR Kod Okut</h3>
              <button
                onClick={() => setShowQRModal(false)}
                className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            <div className="text-center py-8">
              <Camera className="w-16 h-16 mx-auto mb-4 text-blue-400" />
              <p className="text-slate-400 mb-4">Kamerayı QR koda yönlendirin</p>
              <button className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-colors">
                Kamerayı Aç
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Near-Miss Report Modal */}
      {showNearMissModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 rounded-2xl p-6 max-w-md w-full border border-slate-800">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-white">⚠️ Ramak Kala Bildir</h3>
              <button
                onClick={() => setShowNearMissModal(false)}
                className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="bg-yellow-500/10 border border-yellow-500/50 rounded-lg p-3 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-yellow-400 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-yellow-100">
                  Bu bildirim tamamen anonimdir. İsminiz asla paylaşılmaz.
                </p>
              </div>

              {/* Location */}
              <div>
                <label className="block text-sm text-slate-400 mb-2">Konum *</label>
                <input
                  type="text"
                  value={nearMissFormData.location}
                  onChange={(e) => setNearMissFormData({...nearMissFormData, location: e.target.value})}
                  placeholder="Örn: Bina A - 3. Kat"
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-yellow-500 transition-colors"
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm text-slate-400 mb-2">Kategori *</label>
                <select
                  value={nearMissFormData.category}
                  onChange={(e) => setNearMissFormData({...nearMissFormData, category: e.target.value})}
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-yellow-500 transition-colors"
                >
                  <option value="">Seçiniz...</option>
                  <option value="fall">Düşme Riski</option>
                  <option value="electrical">Elektriksel Tehlike</option>
                  <option value="machinery">Makine Arızası</option>
                  <option value="chemical">Kimyasal Maruz Kalma</option>
                  <option value="structural">Yapısal Sorun</option>
                  <option value="other">Diğer</option>
                </select>
              </div>

              {/* Severity */}
              <div>
                <label className="block text-sm text-slate-400 mb-2">Şiddet Seviyesi *</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { value: 'low', label: 'Düşük', color: 'bg-green-600' },
                    { value: 'medium', label: 'Orta', color: 'bg-yellow-600' },
                    { value: 'high', label: 'Yüksek', color: 'bg-red-600' }
                  ].map((level) => (
                    <button
                      key={level.value}
                      type="button"
                      onClick={() => setNearMissFormData({...nearMissFormData, severity: level.value})}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                        nearMissFormData.severity === level.value
                          ? `${level.color} text-white ring-2 ring-white`
                          : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                      }`}
                    >
                      {level.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm text-slate-400 mb-2">Açıklama *</label>
                <textarea
                  value={nearMissFormData.description}
                  onChange={(e) => setNearMissFormData({...nearMissFormData, description: e.target.value})}
                  placeholder="Tehlikeyi detaylı açıklayın..."
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-yellow-500 transition-colors resize-none"
                  rows={3}
                />
              </div>

              {/* Submit Button */}
              <button
                onClick={handleNearMissSubmit}
                disabled={submittingNearMiss}
                className="w-full py-3 bg-gradient-to-r from-yellow-600 to-amber-600 text-white rounded-xl hover:from-yellow-500 hover:to-amber-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {submittingNearMiss ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Gönderiliyor...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    <span>Anonim Bildir</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* İSG Report Modal */}
      {showISGModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 rounded-2xl p-6 max-w-md w-full border border-slate-800">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-white">🚨 İSG Tehlike Bildir</h3>
              <button
                onClick={() => setShowISGModal(false)}
                className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Type Selection */}
              <div>
                <label className="block text-sm text-slate-400 mb-2">Tehlike Tipi</label>
                <select
                  value={isgType}
                  onChange={(e) => setIsgType(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-red-500 transition-colors"
                >
                  <option value="TEHLIKE">Tehlike</option>
                  <option value="KAZA_TUTANAGI">Kaza Tutanak</option>
                  <option value="EKSIK_DOKUM">Eksik Döküm</option>
                </select>
              </div>

              {/* File Input */}
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full py-8 border-2 border-dashed border-slate-700 rounded-xl hover:border-red-500/50 transition-colors flex flex-col items-center gap-2"
                >
                  {isgImage ? (
                    <>
                      <Upload className="w-8 h-8 text-green-400" />
                      <p className="text-green-400">{isgImage.name}</p>
                    </>
                  ) : (
                    <>
                      <Camera className="w-8 h-8 text-slate-400" />
                      <p className="text-slate-400">Fotoğraf çek veya seç</p>
                    </>
                  )}
                </button>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm text-slate-400 mb-2">Açıklama</label>
                <textarea
                  value={isgDescription}
                  onChange={(e) => setIsgDescription(e.target.value)}
                  placeholder="Tehlikeyi açıklayın..."
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-red-500 transition-colors resize-none"
                  rows={3}
                />
              </div>

              {/* Submit Button */}
              <button
                onClick={handleISGReportSubmit}
                disabled={isSubmittingISG || !isgImage || !isgDescription.trim()}
                className="w-full py-3 bg-gradient-to-r from-red-600 to-orange-600 text-white rounded-xl hover:from-red-500 hover:to-orange-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isSubmittingISG ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Gönderiliyor...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    <span>Bildir</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Toast */}
      {showSuccessToast && (
        <div className="fixed bottom-4 right-4 bg-green-600 text-white px-6 py-4 rounded-xl shadow-lg z-50 flex items-center gap-3 animate-bounce">
          <CheckSquare className="w-5 h-5" />
          <span>Bildiriminiz İSG birimine iletilmiştir, teşekkürler!</span>
        </div>
      )}

      {/* Request Modal */}
      {showRequestModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 rounded-2xl p-6 max-w-md w-full border border-slate-800">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-white">Talep Oluştur</h3>
              <button
                onClick={() => setShowRequestModal(false)}
                className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            <div className="space-y-3">
              <button className="w-full py-4 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition-colors flex items-center justify-center gap-3">
                <CalendarIcon className="w-5 h-5" />
                İzin Talebi
              </button>
              <button className="w-full py-4 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition-colors flex items-center justify-center gap-3">
                <Wallet className="w-5 h-5" />
                Avans Talebi
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
