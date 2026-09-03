"use client"
/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * This code is the property of NXA Software.
 */


import { useState, useEffect } from "react"
import { AlertTriangle, Shield, MapPin, Clock, User, MessageSquare, Send } from "lucide-react"

interface NearMissReport {
  id: string
  isAnonymous: boolean
  location: string
  category: string
  severity: string
  description: string
  status: string
  createdAt: string
}

export default function NearMissPage() {
  const [isAnonymous, setIsAnonymous] = useState(true)
  const [formData, setFormData] = useState({
    location: "",
    description: "",
    category: "",
    severity: "low"
  })
  const [reports, setReports] = useState<NearMissReport[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetchReports()
  }, [])

  const fetchReports = async () => {
    try {
      const response = await fetch('/api/admin/near-miss')
      if (response.ok) {
        const data = await response.json()
        setReports(data)
      }
    } catch (error) {
      console.error('Failed to fetch reports:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    
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
          isAnonymous,
          location: formData.location,
          category: categoryMap[formData.category] || formData.category,
          severity: severityMap[formData.severity] || formData.severity,
          description: formData.description
        })
      })

      if (response.ok) {
        setFormData({ location: '', description: '', category: '', severity: 'low' })
        fetchReports()
      }
    } catch (error) {
      console.error('Failed to submit report:', error)
    } finally {
      setSubmitting(false)
    }
  }

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffHours / 24)

    if (diffDays > 0) return `${diffDays} gün önce`
    if (diffHours > 0) return `${diffHours} saat önce`
    return 'Az önce'
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white flex items-center gap-3">
          <AlertTriangle className="w-8 h-8 text-yellow-400" />
          Ramak Kala Bildirim Sistemi
        </h1>
        <p className="text-slate-400 mt-1">Tehlikeli durumları güvenli bir şekilde bildirin - İsim gizliliği garantidir</p>
      </div>

      {/* Info Banner */}
      <div className="bg-yellow-500/10 border border-yellow-500/50 rounded-xl p-4 mb-6 flex items-start gap-3">
        <Shield className="w-6 h-6 text-yellow-400 flex-shrink-0 mt-0.5" />
        <div>
          <h3 className="text-yellow-400 font-semibold mb-1">🔒 Gizlilik Garantisi</h3>
          <p className="text-slate-300 text-sm">
            Bu bildirim tamamen anonimdir. İsminiz veya kimlik bilgileriniz asla paylaşılmaz. Şantiye güvenliğini birlikte sağlayalım.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Report Form */}
        <div className="bg-slate-800/50 backdrop-blur-lg rounded-xl border border-slate-700 p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-blue-400" />
            Yeni Bildirim Oluştur
          </h3>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Anonymous Toggle */}
            <div className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-slate-400" />
                <span className="text-sm text-slate-300">Anonim Bildirim</span>
              </div>
              <button
                type="button"
                onClick={() => setIsAnonymous(!isAnonymous)}
                className={`relative w-12 h-6 rounded-full transition-colors ${
                  isAnonymous ? 'bg-green-600' : 'bg-slate-600'
                }`}
              >
                <span
                  className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
                    isAnonymous ? 'translate-x-6' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Location */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2 flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                Konum *
              </label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData({...formData, location: e.target.value})}
                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                placeholder="Örn: Bina A - 3. Kat - Asansör boşluğu"
                required
              />
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Kategori *</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({...formData, category: e.target.value})}
                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                required
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
              <label className="block text-sm font-medium text-slate-300 mb-2">Şiddet Seviyesi *</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { value: 'low', label: 'Düşük', color: 'bg-green-600' },
                  { value: 'medium', label: 'Orta', color: 'bg-yellow-600' },
                  { value: 'high', label: 'Yüksek', color: 'bg-red-600' }
                ].map((level) => (
                  <button
                    key={level.value}
                    type="button"
                    onClick={() => setFormData({...formData, severity: level.value})}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                      formData.severity === level.value
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
              <label className="block text-sm font-medium text-slate-300 mb-2">Olay Açıklaması *</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                rows={4}
                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500 resize-none"
                placeholder="Olayı detaylı bir şekilde açıklayın..."
                required
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full px-4 py-3 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors font-semibold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="w-5 h-5" />
              {submitting ? 'Gönderiliyor...' : 'Bildirimi Gönder'}
            </button>
          </form>
        </div>

        {/* Recent Reports */}
        <div className="bg-slate-800/50 backdrop-blur-lg rounded-xl border border-slate-700 p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-blue-400" />
            Son Bildirimler
          </h3>

          {loading ? (
            <div className="text-center text-slate-400 py-8">Yükleniyor...</div>
          ) : (
            <div className="space-y-3">
              {reports.map((report) => (
                <div key={report.id} className="p-3 bg-slate-900/50 rounded-lg border border-slate-700">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-slate-400" />
                      <span className="text-sm font-medium text-white">{report.location}</span>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      report.severity === 'Yüksek' ? 'bg-red-500/20 text-red-400' :
                      report.severity === 'Orta' ? 'bg-yellow-500/20 text-yellow-400' :
                      'bg-green-500/20 text-green-400'
                    }`}>
                      {report.severity}
                    </span>
                  </div>
                  <div className="text-xs text-slate-400 mb-2">{report.category}</div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-500 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatTimeAgo(report.createdAt)}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded ${
                      report.status === 'Çözüldü' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'
                    }`}>
                      {report.status}
                    </span>
                  </div>
                </div>
              ))}
              {reports.length === 0 && (
                <div className="text-center text-slate-400 py-8">Henüz bildirim yok</div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
