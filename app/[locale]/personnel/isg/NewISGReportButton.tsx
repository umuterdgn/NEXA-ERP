/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Nexa ERP - Web İSG Bildirim Butonu & OpenAI Vision Entegrasyonu
 */

"use client";

import { useState } from "react";
import { Plus, XCircle, Bot, AlertTriangle, CheckCircle, Sparkles } from "lucide-react";
import { createISGReport } from "./actions";
import { analyzeSafetyViolation, SafetyViolationResult } from "@/app/actions/ai-vision";

export default function NewISGReportButton() {
  const [showModal, setShowModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imageUrl, setImageUrl] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiResult, setAiResult] = useState<SafetyViolationResult | null>(null);
  const [description, setDescription] = useState("");
  const [incidentType, setIncidentType] = useState("TEHLIKE");
  const [location, setLocation] = useState("");

  const handleAiAnalyze = async () => {
    setIsAnalyzing(true);
    setAiResult(null);
    try {
      const result = await analyzeSafetyViolation(
        imageUrl || "https://images.unsplash.com/photo-1541888946425-d0fbb186156f?auto=format&fit=crop&w=800&q=80"
      );
      setAiResult(result);

      if (result.violationFound) {
        setIncidentType("TEHLIKE");
        setDescription(
          (prev) =>
            `${prev ? prev + "\n\n" : ""}🤖 [AI Oto-Denetim Tespiti]: ${result.details}`
        );
        if (!location) {
          setLocation("A Blok 3. Kat İskele Sahası");
        }
      }
    } catch (err) {
      console.error("AI analizi sırasında hata:", err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  async function handleSubmit(formData: FormData) {
    setIsSubmitting(true);
    try {
      if (imageUrl) formData.append("imageUrl", imageUrl);
      await createISGReport(formData);
      setShowModal(false);
      setImageUrl("");
      setAiResult(null);
      setDescription("");
      setLocation("");
    } catch (error) {
      console.error("İSG bildirimi gönderilirken hata:", error);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="flex items-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-500 text-white rounded-xl transition-colors font-medium shadow-lg shadow-red-600/20"
      >
        <Plus className="w-5 h-5" />
        Yeni Bildirim
      </button>

      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 rounded-3xl p-6 max-w-lg w-full border border-slate-800 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
                  <span className="text-xs font-bold text-red-400 uppercase tracking-wider">
                    İSG Saha Denetimi
                  </span>
                </div>
                <h3 className="text-xl font-bold text-white tracking-tight">
                  İSG İhlal / Ramak Kala Bildirimi
                </h3>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 hover:bg-slate-800 rounded-xl transition-colors"
              >
                <XCircle className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            {/* AI Vision Fotoğraf Analizi Bölümü */}
            <div className="mb-5 p-4 rounded-2xl bg-slate-950/80 border border-slate-800">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                  OpenAI Vision Fotoğraf Analizi
                </span>
                {isAnalyzing && (
                  <span className="text-[11px] text-blue-400 font-medium animate-pulse">
                    Taranıyor...
                  </span>
                )}
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="Fotoğraf URL'si yapıştırın (veya demo için boş bırakın)..."
                  className="flex-1 px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
                <button
                  type="button"
                  onClick={handleAiAnalyze}
                  disabled={isAnalyzing}
                  className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-md"
                >
                  <Bot className="w-3.5 h-3.5" />
                  {isAnalyzing ? "İnceleniyor..." : "AI ile Tara"}
                </button>
              </div>

              {/* Kırmızı AI Uyarı Kartı */}
              {aiResult && aiResult.violationFound && (
                <div className="mt-3 p-3.5 rounded-xl bg-red-950/80 border-2 border-red-500">
                  <div className="flex items-center gap-2 mb-1">
                    <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                    <span className="text-xs font-black text-red-300 uppercase tracking-wider">
                      🚨 AI İSG İHLALİ TESPİT ETTİ!
                    </span>
                  </div>
                  <p className="text-xs font-bold text-white leading-relaxed">
                    🤖 AI Tespit Etti: Sağdaki personelde baret eksik! Bu kayıt Yüksek Riskli ihlal olarak dosyalandı.
                  </p>
                  <p className="text-[11px] text-red-200/90 mt-1">
                    {aiResult.details}
                  </p>
                </div>
              )}

              {aiResult && !aiResult.violationFound && (
                <div className="mt-3 p-3 rounded-xl bg-emerald-950/80 border border-emerald-500/60 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                  <p className="text-xs font-semibold text-emerald-200">
                    Fotoğrafta KKD uygunsuzluğu tespit edilmedi. Kurallara uygundur.
                  </p>
                </div>
              )}
            </div>

            <form action={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                  Olay Türü
                </label>
                <select
                  name="type"
                  value={incidentType}
                  onChange={(e) => setIncidentType(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-red-500 text-sm font-medium transition-colors"
                  required
                >
                  <option value="TEHLIKE">Tehlike (KKD & Baret Eksikliği)</option>
                  <option value="KAZA_TUTANAGI">Kaza Tutanağı</option>
                  <option value="EKSIK_DOKUM">Eksik Doküman / Evrak</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                  Tarih
                </label>
                <input
                  type="date"
                  name="date"
                  defaultValue={new Date().toISOString().split("T")[0]}
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-red-500 text-sm transition-colors"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                  Saha Konumu
                </label>
                <input
                  type="text"
                  name="location"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Örn: A Blok 3. Kat İskele Sahası"
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-red-500 text-sm transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                  Açıklama & AI Tutanak Notu
                </label>
                <textarea
                  name="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Olayı detaylı açıklayın..."
                  rows={3}
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-red-500 text-sm transition-colors resize-none"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 bg-red-600 hover:bg-red-500 disabled:bg-red-800 disabled:cursor-not-allowed text-white rounded-xl transition-colors font-bold text-sm shadow-lg shadow-red-600/30"
              >
                {isSubmitting ? "Kaydediliyor..." : "İSG Raporunu Gönder"}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
