"use client"
/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * This code is the property of NXA Software.
 */

import { useState } from "react"
import { useRouter } from "next/navigation"
import { 
  FileText,
  Camera,
  Upload,
  Save,
  ArrowLeft,
  CheckCircle
} from "lucide-react"

export default function DailyReportPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    projectId: "",
    description: "",
    completionPercentage: 0,
    photos: [] as string[]
  })

  // Mock projects data - will be fetched from API
  const projects = [
    { id: "1", name: "Merkez Plaza Projesi" },
    { id: "2", name: "Vadi Sitesi A Blok" },
  ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // API call to save daily progress
      const response = await fetch("/api/subcontractor/daily-progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        alert("Günlük rapor başarıyla kaydedildi!")
        router.push("/subcontractor")
      }
    } catch (error) {
      console.error("Failed to save report:", error)
      alert("Rapor kaydedilirken bir hata oluştu.")
    } finally {
      setLoading(false)
    }
  }

  const handlePhotoUpload = () => {
    // Placeholder for photo upload functionality
    // Will be connected to UploadThing when set up
    alert("Fotoğraf yükleme özelliği yakında eklenecek (UploadThing entegrasyonu)")
  }

  return (
    <div className="min-h-screen bg-slate-950 p-6">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-orange-400 hover:text-orange-300 mb-4 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Geri Dön
        </button>
        <h1 className="text-3xl font-bold text-white mb-2">Günlük Saha Raporu</h1>
        <p className="text-slate-400">Sahada yapılan işleri ve ilerlemeyi kaydedin</p>
      </div>

      {/* Report Form */}
      <div className="max-w-3xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Project Selection */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <label className="block text-sm font-medium text-white mb-3">
              Proje
            </label>
            <select
              value={formData.projectId}
              onChange={(e) => setFormData({ ...formData, projectId: e.target.value })}
              className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-orange-500 transition-colors"
              required
            >
              <option value="">Proje Seçin</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>{project.name}</option>
              ))}
            </select>
          </div>

          {/* Description */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <label className="block text-sm font-medium text-white mb-3">
              İş Açıklaması
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={6}
              className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-orange-500 transition-colors resize-none"
              placeholder="Bugün sahada ne yaptınız? (Örn: A Blok 3. Kat kalıbı çakıldı, demir montajı tamamlandı...)"
              required
            />
          </div>

          {/* Completion Percentage */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <label className="block text-sm font-medium text-white mb-3">
              İşin Tamamlanma Yüzdesi
            </label>
            <div className="flex items-center gap-4">
              <input
                type="range"
                min="0"
                max="100"
                value={formData.completionPercentage}
                onChange={(e) => setFormData({ ...formData, completionPercentage: parseInt(e.target.value) })}
                className="flex-1 h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-orange-500"
              />
              <div className="w-20 text-center">
                <span className="text-2xl font-bold text-orange-400">{formData.completionPercentage}</span>
                <span className="text-slate-400">%</span>
              </div>
            </div>
          </div>

          {/* Photo Upload */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <label className="block text-sm font-medium text-white mb-3">
              Fotoğraflar
            </label>
            <div className="border-2 border-dashed border-slate-700 rounded-xl p-8 text-center hover:border-orange-500/50 transition-colors cursor-pointer" onClick={handlePhotoUpload}>
              <Camera className="w-12 h-12 mx-auto mb-4 text-slate-500" />
              <p className="text-slate-400 font-medium mb-2">Fotoğraf Yükle</p>
              <p className="text-slate-500 text-sm">Saha fotoğraflarını buraya yükleyin</p>
              <div className="mt-4 flex items-center justify-center gap-2 text-orange-400 text-sm">
                <Upload className="w-4 h-4" />
                <span>Yüklemek için tıklayın</span>
              </div>
            </div>
            <p className="text-slate-500 text-xs mt-2">
              * Fotoğraf yükleme özelliği yakında aktif olacak
            </p>
          </div>

          {/* Submit Button */}
          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => router.back()}
              className="flex-1 px-6 py-4 bg-slate-800 hover:bg-slate-700 text-white rounded-xl transition-colors font-medium flex items-center justify-center gap-2"
            >
              İptal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-6 py-4 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 text-white rounded-xl transition-all font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-orange-500/30"
            >
              {loading ? (
                "Kaydediliyor..."
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  Raporu Kaydet
                </>
              )}
            </button>
          </div>
        </form>

        {/* Tips */}
        <div className="mt-8 bg-orange-900/20 border border-orange-800 rounded-2xl p-6">
          <div className="flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-orange-400 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-white font-medium mb-2">İpuçları</h3>
              <ul className="text-slate-400 text-sm space-y-1">
                <li>• İş açıklamasını mümkün olduğunca detaylı yazın</li>
                <li>• Tamamlanma yüzdesini gerçekçi girin</li>
                <li>• Fotoğraflar işin kalitesini belgelemeye yardımcı olur</li>
                <li>• Günlük raporlar denetimlerde referans olarak kullanılır</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
