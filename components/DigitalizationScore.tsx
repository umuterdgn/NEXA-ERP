"use client"
/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * This code is the property of NXA Software.
 */

import { useState } from "react"
import { TrendingUp, X, Zap, AlertCircle } from "lucide-react"

export default function DigitalizationScore() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      {/* Badge */}
      <button
        onClick={() => setIsOpen(true)}
        className="flex w-full items-center justify-center gap-2 whitespace-normal text-center h-auto py-2 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-lg transition-colors font-medium sm:w-auto"
      >
        <TrendingUp className="w-5 h-5 shrink-0" />
        <span className="leading-snug">Dijitalleşme Skoru: 68/100</span>
      </button>

      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-slate-900 rounded-xl p-6 border border-slate-800 w-full max-w-md mx-4 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-emerald-500/20 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-emerald-400" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-white">Dijitalleşme Skoru</h3>
                  <p className="text-slate-400 text-sm">Şirket genelinde</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Overall Score */}
            <div className="bg-gradient-to-r from-emerald-900/20 to-teal-900/20 rounded-xl p-6 border border-emerald-500/30 mb-6">
              <div className="flex items-center justify-between mb-4">
                <span className="text-slate-400">Genel Skor</span>
                <span className="text-4xl font-bold text-emerald-400">68/100</span>
              </div>
              <div className="w-full bg-slate-700 rounded-full h-3">
                <div className="bg-gradient-to-r from-emerald-600 to-teal-600 h-3 rounded-full" style={{ width: '68%' }} />
              </div>
            </div>

            {/* Category Scores */}
            <div className="space-y-4 mb-6">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-white font-medium">Saha</span>
                  <span className="text-emerald-400 font-bold">82/100</span>
                </div>
                <div className="w-full bg-slate-700 rounded-full h-2">
                  <div className="bg-emerald-500 h-2 rounded-full" style={{ width: '82%' }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-white font-medium">Finans</span>
                  <span className="text-orange-400 font-bold">51/100</span>
                </div>
                <div className="w-full bg-slate-700 rounded-full h-2">
                  <div className="bg-orange-500 h-2 rounded-full" style={{ width: '51%' }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-white font-medium">AI</span>
                  <span className="text-red-400 font-bold">38/100</span>
                </div>
                <div className="w-full bg-slate-700 rounded-full h-2">
                  <div className="bg-red-500 h-2 rounded-full" style={{ width: '38%' }} />
                </div>
              </div>
            </div>

            {/* Recommendation */}
            <div className="bg-gradient-to-r from-orange-900/20 to-amber-900/20 rounded-xl p-4 border border-orange-500/30">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-orange-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <AlertCircle className="w-5 h-5 text-orange-400" />
                </div>
                <div>
                  <h4 className="text-white font-semibold mb-1">Öneri</h4>
                  <p className="text-slate-300 text-sm">Finans modülünü aktif edin. Dijital fatura ve ödeme sistemlerini kullanarak skorunuzu artırabilirsiniz.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
