"use client"
/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * This code is the property of NXA Software.
 */

import { useState } from "react"
import { FileText, Download, X, Sparkles, Loader2 } from "lucide-react"

export default function AIReportGenerator() {
  const [isGenerating, setIsGenerating] = useState(false)
  const [showPreview, setShowPreview] = useState(false)

  const handleGenerateReport = () => {
    setIsGenerating(true)
    // Simulate PDF generation with 2 second delay
    setTimeout(() => {
      setIsGenerating(false)
      setShowPreview(true)
    }, 2000)
  }

  const handleDownloadPDF = () => {
    // Simulate PDF download
    const link = document.createElement('a')
    link.href = '#'
    link.download = 'haftalik-ozet-raporu.pdf'
    link.click()
  }

  const handleClosePreview = () => {
    setShowPreview(false)
  }

  return (
    <>
      <button 
        onClick={handleGenerateReport}
        className="flex w-full items-center justify-center gap-2 whitespace-normal text-center h-auto py-2 px-4 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white rounded-lg transition-colors font-medium sm:w-auto"
      >
        <Sparkles className="w-5 h-5 shrink-0" />
        <span className="leading-snug">Tek Tıkla Rapor Oluştur (AI)</span>
      </button>

      {/* Loading Modal */}
      {isGenerating && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-slate-900 rounded-xl p-8 border border-slate-800 w-full max-w-md mx-4 shadow-2xl">
            <div className="flex flex-col items-center gap-4">
              <div className="w-16 h-16 bg-purple-500/20 rounded-full flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
              </div>
              <div className="text-center">
                <h3 className="text-xl font-semibold text-white mb-2">Rapor Hazırlanıyor</h3>
                <p className="text-slate-400">AI haftalık özet raporunuzu oluşturuyor...</p>
              </div>
              <div className="w-full bg-slate-700 rounded-full h-2 mt-4">
                <div className="bg-gradient-to-r from-purple-600 to-blue-600 h-2 rounded-full animate-pulse" style={{ width: '60%' }} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PDF Preview Modal */}
      {showPreview && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-slate-900 rounded-xl p-6 border border-slate-800 w-full max-w-2xl mx-4 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center">
                  <FileText className="w-6 h-6 text-purple-400" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-white">Haftalık Özet PDF Önizlemesi</h3>
                  <p className="text-slate-400 text-sm">AI tarafından oluşturuldu</p>
                </div>
              </div>
              <button
                onClick={handleClosePreview}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* PDF Preview Content */}
            <div className="bg-white rounded-lg p-6 mb-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-4 border-b border-slate-200">
                  <h4 className="text-lg font-semibold text-slate-900">Haftalık Yönetim Özeti</h4>
                  <span className="text-sm text-slate-500">26 Ağustos - 1 Eylül 2024</span>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-blue-50 rounded-lg p-4 text-center">
                    <p className="text-3xl font-bold text-blue-600">143</p>
                    <p className="text-sm text-slate-600">Gerçekleşen Kontrol</p>
                  </div>
                  <div className="bg-orange-50 rounded-lg p-4 text-center">
                    <p className="text-3xl font-bold text-orange-600">38</p>
                    <p className="text-sm text-slate-600">Açılan Eksiklik</p>
                  </div>
                  <div className="bg-red-50 rounded-lg p-4 text-center">
                    <p className="text-3xl font-bold text-red-600">4</p>
                    <p className="text-sm text-slate-600">Riskli Yapılar</p>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-200">
                  <h5 className="font-medium text-slate-900 mb-2">Öne Çıkanlar</h5>
                  <ul className="text-sm text-slate-600 space-y-1">
                    <li>• YİBF #14582'de donatı kontrolü tamamlandı</li>
                    <li>• 3 kritik eksiklik çözüme ulaştı</li>
                    <li>• Toplam %82 ilerleme oranı sağlandı</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={handleClosePreview}
                className="flex-1 px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors"
              >
                Kapat
              </button>
              <button
                onClick={handleDownloadPDF}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white rounded-lg transition-colors"
              >
                <Download className="w-4 h-4" />
                PDF İndir
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
