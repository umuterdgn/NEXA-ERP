"use client"
/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * This code is the property of NXA Software.
 */


import { useState, useEffect } from "react"
import { FileText, AlertTriangle, Calendar, CheckCircle, Plus, X, Upload } from "lucide-react"
import toast from "react-hot-toast"

interface Certificate {
  id: string
  name: string
  expiryDate: string
  daysRemaining: number
  status: 'critical' | 'warning' | 'valid'
  personel: {
    id: string
    name: string
    personnelNo: string
  }
}

export default function CertificatesPage() {
  const [certificates, setCertificates] = useState<Certificate[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [personnel, setPersonnel] = useState<any[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    personelId: "",
    name: "",
    expiryDate: ""
  })

  useEffect(() => {
    fetchCertificates()
    fetchPersonnel()
  }, [])

  const fetchCertificates = async () => {
    try {
      const response = await fetch('/api/admin/certificates')
      if (response.ok) {
        const data = await response.json()
        setCertificates(data)
      }
    } catch (error) {
      console.error('Failed to fetch certificates:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchPersonnel = async () => {
    try {
      const response = await fetch('/api/admin/personnel')
      if (response.ok) {
        const data = await response.json()
        setPersonnel(data)
      }
    } catch (error) {
      console.error('Failed to fetch personnel:', error)
    }
  }

  const criticalCount = certificates.filter(c => c.status === 'critical').length
  const warningCount = certificates.filter(c => c.status === 'warning').length
  const validCount = certificates.filter(c => c.status === 'valid').length

  const getStatusColor = (status: string) => {
    switch (status) {
      case "critical": return "bg-red-500/20 border-red-500 text-red-400"
      case "warning": return "bg-yellow-500/20 border-yellow-500 text-yellow-400"
      case "valid": return "bg-green-500/20 border-green-500 text-green-400"
      default: return "bg-slate-500/20 border-slate-500 text-slate-400"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "critical": return <AlertTriangle className="w-4 h-4" />
      case "warning": return <AlertTriangle className="w-4 h-4" />
      case "valid": return <CheckCircle className="w-4 h-4" />
      default: return null
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case "critical": return "Kritik"
      case "warning": return "Uyarı"
      case "valid": return "Geçerli"
      default: return "Bilinmiyor"
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.personelId || !formData.name || !formData.expiryDate) {
      toast.error("Lütfen tüm alanları doldurun")
      return
    }

    setSubmitting(true)
    try {
      const response = await fetch('/api/admin/certificates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        toast.success("Sertifika başarıyla eklendi")
        setIsModalOpen(false)
        setFormData({ personelId: "", name: "", expiryDate: "" })
        fetchCertificates()
      } else {
        toast.error("Sertifika eklenirken hata oluştu")
      }
    } catch (error) {
      console.error('Failed to add certificate:', error)
      toast.error("Bir hata oluştu")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <FileText className="w-8 h-8 text-blue-400" />
            Yasal Evrak ve Sertifika Takibi
          </h1>
          <p className="text-slate-400 mt-1">Personel sertifikalarının takibi ve son kullanma tarihleri</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Yeni Evrak/Sertifika Ekle
        </button>
      </div>

      {/* Warning Banner */}
      <div className="bg-red-500/10 border border-red-500/50 rounded-xl p-4 mb-6 flex items-start gap-3">
        <AlertTriangle className="w-6 h-6 text-red-400 flex-shrink-0 mt-0.5" />
        <div>
          <h3 className="text-red-400 font-semibold mb-1">⚠️ Kritik Uyarı</h3>
          <p className="text-slate-300 text-sm">
            {criticalCount} personelin sertifikası 15 gün içinde sona eriyor. Acil yenileme işlemi gerekmektedir.
          </p>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-slate-800/50 backdrop-blur-lg rounded-xl border border-slate-700 p-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-red-500/20 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-red-400" />
            </div>
            <div>
              <div className="text-2xl font-bold text-red-400">{criticalCount}</div>
              <div className="text-xs text-slate-400">Kritik (15 gün)</div>
            </div>
          </div>
        </div>
        <div className="bg-slate-800/50 backdrop-blur-lg rounded-xl border border-slate-700 p-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-yellow-500/20 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-yellow-400" />
            </div>
            <div>
              <div className="text-2xl font-bold text-yellow-400">{warningCount}</div>
              <div className="text-xs text-slate-400">Uyarı (30 gün)</div>
            </div>
          </div>
        </div>
        <div className="bg-slate-800/50 backdrop-blur-lg rounded-xl border border-slate-700 p-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-green-500/20 flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-400" />
            </div>
            <div>
              <div className="text-2xl font-bold text-green-400">{validCount}</div>
              <div className="text-xs text-slate-400">Geçerli</div>
            </div>
          </div>
        </div>
      </div>

      {/* Certificates Table */}
      <div className="bg-slate-800/50 backdrop-blur-lg rounded-xl border border-slate-700 overflow-hidden">
        <div className="p-4 border-b border-slate-700">
          <h3 className="text-lg font-semibold text-white">Sertifika Listesi</h3>
        </div>
        {loading ? (
          <div className="p-8 text-center text-slate-400">Yükleniyor...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-900/50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Personel</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Sertifika Tipi</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Son Kullanma</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Kalan Gün</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Durum</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700">
                {certificates.map((cert) => (
                  <tr key={cert.id} className="hover:bg-slate-700/50 transition-colors">
                    <td className="px-4 py-4">
                      <div className="font-medium text-white">{cert.personel.name}</div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="text-slate-300">{cert.name}</div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2 text-slate-300">
                        <Calendar className="w-4 h-4" />
                        {new Date(cert.expiryDate).toLocaleDateString('tr-TR')}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className={`font-semibold ${
                        cert.daysRemaining <= 15 ? 'text-red-400' : 
                        cert.daysRemaining <= 30 ? 'text-yellow-400' : 'text-green-400'
                      }`}>
                        {cert.daysRemaining} gün
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${getStatusColor(cert.status)}`}>
                        {getStatusIcon(cert.status)}
                        {getStatusText(cert.status)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-800 rounded-xl border border-slate-700 w-full max-w-md">
            <div className="flex items-center justify-between p-4 border-b border-slate-700">
              <h3 className="text-lg font-semibold text-white">Yeni Sertifika Ekle</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Personel Seçin</label>
                <select
                  value={formData.personelId}
                  onChange={(e) => setFormData({ ...formData, personelId: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  required
                >
                  <option value="">Personel Seçin...</option>
                  {personnel.map((person) => (
                    <option key={person.id} value={person.id}>
                      {person.name} ({person.personnelNo})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Sertifika Tipi</label>
                <select
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  required
                >
                  <option value="">Sertifika Tipi Seçin...</option>
                  <option value="İSG Eğitimi">İSG Eğitimi</option>
                  <option value="Yüksekte Çalışma Belgesi">Yüksekte Çalışma Belgesi</option>
                  <option value="Mesleki Yeterlilik Belgesi">Mesleki Yeterlilik Belgesi</option>
                  <option value="Sağlık Raporu">Sağlık Raporu</option>
                  <option value="Sürücü Belgesi">Sürücü Belgesi</option>
                  <option value="Diğer">Diğer</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Son Kullanma Tarihi</label>
                <input
                  type="date"
                  value={formData.expiryDate}
                  onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Dosya Yükle</label>
                <div className="relative">
                  <input
                    type="file"
                    className="hidden"
                    id="file-upload"
                  />
                  <label
                    htmlFor="file-upload"
                    className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-slate-400 hover:border-blue-500 hover:text-blue-400 transition-colors cursor-pointer"
                  >
                    <Upload className="w-5 h-5" />
                    <span>Dosya seçin (Backend entegrasyonu bekleniyor)</span>
                  </label>
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? "Kaydediliyor..." : "Kaydet"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
