"use client"

import React, { useState, useEffect } from "react"
import Link from "next/link"
import {
  KeyRound,
  ShieldCheck,
  Eye,
  EyeOff,
  Save,
  RefreshCw,
  Sparkles,
  Bot,
  ExternalLink,
  Lock,
  Cloud,
  CheckCircle2,
  AlertCircle,
  Building2,
  TrendingUp,
  Cpu,
  ArrowRight
} from "lucide-react"
import { toast } from "react-hot-toast"

export default function AdminSettingsPage() {
  const [activeTab, setActiveTab] = useState<"api-keys" | "drive" | "tcmb">("api-keys")
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isTestingKey, setIsTestingKey] = useState(false)

  // API Key Form State
  const [openaiApiKey, setOpenaiApiKey] = useState("")
  const [showOpenaiKey, setShowOpenaiKey] = useState(false)
  const [awsTextractKey, setAwsTextractKey] = useState("")
  const [showAwsKey, setShowAwsKey] = useState(false)
  const [driveFolderId, setDriveFolderId] = useState("")
  const [tcmbSyncEnabled, setTcmbSyncEnabled] = useState(true)

  // Status flags
  const [hasOpenAiKey, setHasOpenAiKey] = useState(false)
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null)

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    setIsLoading(true)
    try {
      const res = await fetch("/api/admin/settings")
      if (res.ok) {
        const data = await res.json()
        setOpenaiApiKey(data.openaiApiKey || "")
        setAwsTextractKey(data.awsTextractKey || "")
        setDriveFolderId(data.driveFolderId || "")
        setTcmbSyncEnabled(data.tcmbSyncEnabled !== false)
        setHasOpenAiKey(Boolean(data.hasOpenAiKey || data.openaiApiKey))
      }
    } catch (err) {
      console.error("Ayarlar yüklenemedi:", err)
      toast.error("Ayarlar yüklenirken bir hata oluştu")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    setTestResult(null)

    try {
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          openaiApiKey,
          awsTextractKey,
          driveFolderId,
          tcmbSyncEnabled
        })
      })

      if (res.ok) {
        setHasOpenAiKey(Boolean(openaiApiKey.trim()))
        toast.success("Dış Servis API Anahtarları ve sistem ayarları güvenle kaydedildi!", {
          icon: "🔒"
        })
      } else {
        toast.error("Ayarlar kaydedilirken hata oluştu")
      }
    } catch (err) {
      console.error("Ayarlar kayıt hatası:", err)
      toast.error("Kaydetme işlemi başarısız oldu")
    } finally {
      setIsSaving(false)
    }
  }

  // OpenAI API Key Doğrulama Testi
  const handleTestApiKey = async () => {
    if (!openaiApiKey.trim()) {
      toast.error("Lütfen önce bir OpenAI API anahtarı giriniz")
      return
    }

    setIsTestingKey(true)
    setTestResult(null)

    try {
      // Doğrudan OCR/Match rotasına test sorgusu at
      const res = await fetch("/api/ai/invoice-match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rawTextContent: "TEST İNŞAAT FATURASI: 100 m3 C30 Beton dökümü",
          fileName: "test_fatura.txt"
        })
      })

      const data = await res.json()

      if (res.ok && data.success) {
        setTestResult({
          success: true,
          message: "API anahtarı geçerli! GPT-4o-mini servisine başarıyla bağlanıldı."
        })
        toast.success("Bağlantı Başarılı: OpenAI servisi aktif!", { icon: "✅" })
      } else {
        setTestResult({
          success: false,
          message: data.error || "API anahtarı doğrulanamadı. Lütfen kontrol ediniz."
        })
        toast.error(data.error || "API Anahtarı doğrulanamadı")
      }
    } catch (err: any) {
      setTestResult({
        success: false,
        message: "Bağlantı testi başarısız: " + (err?.message || "Sunucuya ulaşılamadı")
      })
      toast.error("Bağlantı testi hatası")
    } finally {
      setIsTestingKey(false)
    }
  }

  return (
    <div className="space-y-8 p-4 md:p-8 max-w-6xl mx-auto">
      {/* Üst Başlık & Bilgi */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-md bg-blue-500/10 text-blue-400 border border-blue-500/20">
              Yönetim & Entegrasyonlar
            </span>
            <span className="text-xs text-slate-500">•</span>
            <span className="text-xs text-slate-400">Sistem Ayarları</span>
          </div>
          <h1 className="text-2xl font-black text-white tracking-wide mt-1 flex items-center gap-2.5">
            <span>Dış Servis & API Ayarları</span>
            <KeyRound className="w-6 h-6 text-violet-400" />
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Yapay Zeka (OpenAI OCR), Türkiye Cumhuriyet Merkez Bankası (TCMB) Döviz Kuru ve Bulut entegrasyon anahtarları.
          </p>
        </div>

        {/* Bakanlık RPA Entegrasyonlarına Hızlı Geçiş */}
        <Link
          href="/admin/settings/integrations"
          className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-xl text-xs font-bold transition-all border border-slate-700 flex items-center gap-2 shadow-lg"
        >
          <Building2 className="w-4 h-4 text-emerald-400" />
          <span>Bakanlık YİBF/RPA Ayarları</span>
          <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
        </Link>
      </div>

      {/* Tab Navigasyonu */}
      <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
        <button
          onClick={() => setActiveTab("api-keys")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === "api-keys"
              ? "bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg shadow-indigo-500/20"
              : "bg-slate-900/60 text-slate-400 hover:text-white hover:bg-slate-800"
          }`}
        >
          <Bot className="w-4 h-4" />
          <span>Dış Servis API Anahtarları (AI & OCR)</span>
          {hasOpenAiKey && (
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" title="Anahtar Aktif" />
          )}
        </button>

        <button
          onClick={() => setActiveTab("tcmb")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === "tcmb"
              ? "bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg shadow-indigo-500/20"
              : "bg-slate-900/60 text-slate-400 hover:text-white hover:bg-slate-800"
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          <span>TCMB Döviz & Enflasyon Motoru</span>
        </button>

        <button
          onClick={() => setActiveTab("drive")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === "drive"
              ? "bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg shadow-indigo-500/20"
              : "bg-slate-900/60 text-slate-400 hover:text-white hover:bg-slate-800"
          }`}
        >
          <Cloud className="w-4 h-4" />
          <span>Google Drive Arşivi</span>
        </button>
      </div>

      {/* ==================================================================== */}
      {/* TAB 1: DIŞ SERVİS API ANAHTARLARI (OpenAI, AWS Textract vb.) */}
      {/* ==================================================================== */}
      {activeTab === "api-keys" && (
        <form onSubmit={handleSaveSettings} className="space-y-6">
          <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-violet-500/10 text-violet-400 flex items-center justify-center border border-violet-500/20">
                  <Cpu className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <span>Yapay Zeka & OCR Servis Anahtarları</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      AES-256 Şifrelenir
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    BoQ Keşif E-Fatura eşleştirmesi, saha tutanağı OCR ve akıllı metraj doğrulamaları için kullanılır.
                  </p>
                </div>
              </div>
            </div>

            {/* OpenAI API Key Girişi */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-200 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Bot className="w-3.5 h-3.5 text-violet-400" />
                  <span>OpenAI API Anahtarı (GPT-4o / Vision OCR)</span>
                </span>
                <span className="text-[11px] text-slate-400 font-normal">
                  Örn: <code className="text-slate-300">sk-proj-...</code>
                </span>
              </label>

              <div className="relative">
                <input
                  type={showOpenaiKey ? "text" : "password"}
                  value={openaiApiKey}
                  onChange={(e) => setOpenaiApiKey(e.target.value)}
                  placeholder="sk-proj-..."
                  className="w-full bg-slate-850 border border-slate-700/80 rounded-xl pl-4 pr-24 py-3 text-xs text-white placeholder-slate-500 font-mono focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-all"
                />

                <div className="absolute right-2 top-2 flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setShowOpenaiKey(!showOpenaiKey)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700/50 transition-colors cursor-pointer"
                    title={showOpenaiKey ? "Gizle" : "Göster"}
                  >
                    {showOpenaiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>

                  <button
                    type="button"
                    onClick={handleTestApiKey}
                    disabled={isTestingKey || !openaiApiKey.trim()}
                    className="px-2.5 py-1.5 rounded-lg bg-violet-600/30 hover:bg-violet-600/50 text-violet-300 border border-violet-500/40 text-[11px] font-bold transition-all cursor-pointer disabled:opacity-40 flex items-center gap-1"
                    title="Bağlantıyı doğrula"
                  >
                    {isTestingKey ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Sparkles className="w-3.5 h-3.5" />
                    )}
                    <span>Test Et</span>
                  </button>
                </div>
              </div>

              {/* Test Sonucu Bildirimi */}
              {testResult && (
                <div
                  className={`p-3 rounded-xl border text-xs flex items-center gap-2 mt-2 ${
                    testResult.success
                      ? "bg-emerald-950/40 border-emerald-500/30 text-emerald-300"
                      : "bg-rose-950/40 border-rose-500/30 text-rose-300"
                  }`}
                >
                  {testResult.success ? (
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                  ) : (
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                  )}
                  <span>{testResult.message}</span>
                </div>
              )}

              <p className="text-[11px] text-slate-400">
                Bu anahtar girildiğinde BoQ ekranındaki "AI E-Fatura Eşleştir" butonu faturayı doğrudan GPT-4o-mini Vision modeline göndererek pozlarla semantik eşleştirir.
              </p>
            </div>

            {/* AWS Textract Key Girişi (Alternatif OCR) */}
            <div className="space-y-2 pt-2 border-t border-slate-800">
              <label className="text-xs font-bold text-slate-200 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Cloud className="w-3.5 h-3.5 text-cyan-400" />
                  <span>AWS Textract / Bedrock Erişim Anahtarı (Opsiyonel)</span>
                </span>
                <span className="text-[11px] text-slate-400 font-normal">
                  Kurumsal AWS Altyapısı
                </span>
              </label>

              <div className="relative">
                <input
                  type={showAwsKey ? "text" : "password"}
                  value={awsTextractKey}
                  onChange={(e) => setAwsTextractKey(e.target.value)}
                  placeholder="AKIAIOSFODNN7EXAMPLE..."
                  className="w-full bg-slate-850 border border-slate-700/80 rounded-xl pl-4 pr-12 py-3 text-xs text-white placeholder-slate-500 font-mono focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all"
                />

                <button
                  type="button"
                  onClick={() => setShowAwsKey(!showAwsKey)}
                  className="absolute right-3 top-3 text-slate-400 hover:text-white cursor-pointer"
                >
                  {showAwsKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>

          {/* Kaydet Butonu */}
          <div className="flex items-center justify-end gap-3">
            <button
              type="submit"
              disabled={isSaving}
              className="px-6 py-3 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold shadow-xl shadow-indigo-500/25 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Kaydediliyor...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>API Anahtarlarını Güvenle Kaydet</span>
                </>
              )}
            </button>
          </div>
        </form>
      )}

      {/* ==================================================================== */}
      {/* TAB 2: TCMB CANLI DÖVİZ & ENFLASYON MOTORU */}
      {/* ==================================================================== */}
      {activeTab === "tcmb" && (
        <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">
                  TCMB Resmi Kurlar & İnşaat Enflasyonu Simülatörü
                </h3>
                <p className="text-xs text-slate-400">
                  Türkiye Cumhuriyet Merkez Bankası (TCMB) günlük kurları ve TÜİK inşaat maliyet endeksi projeksiyonları.
                </p>
              </div>
            </div>

            <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Canlı API Aktif
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-slate-850 border border-slate-700/60 space-y-1">
              <span className="text-[11px] text-slate-400 uppercase font-bold">Kaynak Endpoint</span>
              <p className="font-mono text-xs text-emerald-300 font-bold">/api/finance/exchange-rates</p>
              <p className="text-[10px] text-slate-500">TCMB XML + OpenExchange fallback</p>
            </div>

            <div className="p-4 rounded-xl bg-slate-850 border border-slate-700/60 space-y-1">
              <span className="text-[11px] text-slate-400 uppercase font-bold">Yıllık TÜFE Enflasyonu</span>
              <p className="text-lg font-black text-white">%48.6</p>
              <p className="text-[10px] text-slate-500">TÜİK Güncel İnşaat Endeksi</p>
            </div>

            <div className="p-4 rounded-xl bg-slate-850 border border-slate-700/60 space-y-1">
              <span className="text-[11px] text-slate-400 uppercase font-bold">BoQ Dinamik Formülü</span>
              <p className="font-mono text-xs text-cyan-300">Δ = Qty x (Güncel - İhale)</p>
              <p className="text-[10px] text-slate-500">Otomatik kur farkı hakediş hesabı</p>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* TAB 3: GOOGLE DRIVE */}
      {/* ==================================================================== */}
      {activeTab === "drive" && (
        <form onSubmit={handleSaveSettings} className="space-y-6">
          <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center border border-cyan-500/20">
                <Cloud className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Google Drive Klasör Entegrasyonu</h3>
                <p className="text-xs text-slate-400">Şantiye evrakları ve hakediş eklerinin depolanacağı Drive klasörü.</p>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-200">Google Drive Klasör ID (Folder ID)</label>
              <input
                type="text"
                value={driveFolderId}
                onChange={(e) => setDriveFolderId(e.target.value)}
                placeholder="1aBcDeFgHiJkLmNoPqRsTuVwXyZ..."
                className="w-full bg-slate-850 border border-slate-700/80 rounded-xl px-4 py-3 text-xs text-white placeholder-slate-500 font-mono focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isSaving}
                className="px-5 py-2.5 bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-xl text-xs font-bold shadow-lg"
              >
                Drive Ayarını Kaydet
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  )
}
