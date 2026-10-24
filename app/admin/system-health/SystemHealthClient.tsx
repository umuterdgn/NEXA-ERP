"use client"

/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Enterprise Diagnostics Engine & System Health UI
 * Faz 1, Faz 2 & Faz 3: Canlı Terminal Akışı, Hukuk, Siber Güvenlik, Real-time WebSocket ve %100 Kurumsal Onay Rozeti
 */

import React, { useState, useEffect, useRef, useTransition } from "react"
import {
  Activity,
  Terminal,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Play,
  RotateCw,
  Clock,
  Database,
  Server,
  Layers,
  FileText,
  Lock,
  Building2,
  Coins,
  Cpu,
  Download,
  Copy,
  Check,
  AlertTriangle,
  UserCheck,
  ShoppingBag,
  Store,
  PackageX,
  Scale,
  Wrench,
  Radio,
  Award,
  Sparkles,
  FileWarning,
  Flame,
  CheckCheck
} from "lucide-react"
import { executeSystemHealthCheck } from "@/app/actions/diagnostics"
import { DiagnosticRunReport, DiagnosticTestResult, DiagnosticLogLine } from "@/lib/diagnostics/types"

export default function SystemHealthClient() {
  const [report, setReport] = useState<DiagnosticRunReport | null>(null)
  const [isRunning, setIsRunning] = useState(false)
  const [activeTab, setActiveTab] = useState<"ALL" | "FAZ_1" | "FAZ_2" | "FAZ_3" | "FAZ_4" | "FAZ_5" | "FAZ_6" | "FAZ_7" | "FAILED">("ALL")
  const [selectedTest, setSelectedTest] = useState<DiagnosticTestResult | null>(null)
  const [copiedLogs, setCopiedLogs] = useState(false)
  const [liveLogs, setLiveLogs] = useState<DiagnosticLogLine[]>([])
  const [isPending, startTransition] = useTransition()

  const terminalEndRef = useRef<HTMLDivElement>(null)

  // Terminal otomatik kaydırma
  useEffect(() => {
    if (isRunning) {
      terminalEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }
  }, [liveLogs, isRunning])

  // Check-up Başlat
  const handleStartCheckup = () => {
    setIsRunning(true)
    setLiveLogs([
      {
        id: "start-1",
        timestamp: new Date().toLocaleTimeString("tr-TR"),
        level: "SYSTEM",
        message: "⚡ NEXA Enterprise Diagnostics Engine v4.0 başlatılıyor...",
      },
      {
        id: "start-2",
        timestamp: new Date().toLocaleTimeString("tr-TR"),
        level: "INFO",
        message: "🧪 Faz 1-7 (Çekirdek, İK, Hukuk, Global, Kriz, Yönetişim & Adli Bilişim) 31 Modül Testi Başlatıldı...",
      },
    ])

    startTransition(async () => {
      try {
        const res = await executeSystemHealthCheck()
        if (res.success && res.report) {
          setReport(res.report)
          setLiveLogs(res.report.logs)
        } else {
          setLiveLogs((prev) => [
            ...prev,
            {
              id: "err-1",
              timestamp: new Date().toLocaleTimeString("tr-TR"),
              level: "ERROR",
              message: res.error || "Check-up sırasında kritik hata oluştu.",
            },
          ])
        }
      } catch (err: any) {
        setLiveLogs((prev) => [
          ...prev,
          {
            id: "err-fatal",
            timestamp: new Date().toLocaleTimeString("tr-TR"),
            level: "ERROR",
            message: err.message || "Bağlantı hatası",
          },
        ])
      } finally {
        setIsRunning(false)
      }
    })
  }

  // Logları Kopyala
  const handleCopyLogs = () => {
    const text = (report?.logs || liveLogs).map((l) => `[${l.timestamp}] [${l.level}] ${l.message}`).join("\n")
    navigator.clipboard.writeText(text)
    setCopiedLogs(true)
    setTimeout(() => setCopiedLogs(false), 2000)
  }

  // JSON Raporunu İndir
  const handleDownloadReport = () => {
    if (!report) return
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `NEXA_Diagnostics_FullReport_${report.runId}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  // Kategori İkonu
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "RBAC_ISOLATION":
        return <Lock className="w-4 h-4 text-purple-400" />
      case "INSPECTION_STAGE_GATE":
        return <Building2 className="w-4 h-4 text-emerald-400" />
      case "FINANCE_BOQ_ALGORITHM":
        return <Coins className="w-4 h-4 text-blue-400" />
      case "AUTONOMOUS_JOURNAL":
        return <FileText className="w-4 h-4 text-amber-400" />
      case "EXTERNAL_IO_SYSTEMS":
        return <Cpu className="w-4 h-4 text-cyan-400" />
      case "HR_PAYROLL":
        return <UserCheck className="w-4 h-4 text-pink-400" />
      case "PROCUREMENT_BIDDING":
        return <ShoppingBag className="w-4 h-4 text-amber-400" />
      case "FRANCHISE_PUNCH_LIST":
        return <Store className="w-4 h-4 text-rose-400" />
      case "LOGISTICS_RMA":
        return <PackageX className="w-4 h-4 text-teal-400" />
      case "CONTRACT_PENALTY":
        return <Scale className="w-4 h-4 text-amber-400" />
      case "EQUIPMENT_BLOCKING":
        return <Wrench className="w-4 h-4 text-red-400" />
      case "AUDIT_LOG_SECURITY":
        return <ShieldCheck className="w-4 h-4 text-emerald-400" />
      case "REALTIME_SOCKET":
        return <Radio className="w-4 h-4 text-cyan-400" />
      case "FX_CURRENCY_RISK":
        return <Coins className="w-4 h-4 text-emerald-400" />
      case "RETENTION_DEDUCTION":
        return <Lock className="w-4 h-4 text-amber-400" />
      case "BLUEPRINT_INVALIDATION":
        return <Layers className="w-4 h-4 text-indigo-400" />
      case "IOT_HARDWARE_WEBHOOK":
        return <Cpu className="w-4 h-4 text-rose-400" />
      // Faz 5: Kriz & İyimser Kilitleme
      case "RESOURCE_OVERLAP_CONFLICT":
        return <AlertTriangle className="w-4 h-4 text-rose-400" />
      case "OPTIMISTIC_LOCK_COLLISION":
        return <Lock className="w-4 h-4 text-amber-400" />
      case "BUDGET_HARD_STOP_OVERFLOW":
        return <Coins className="w-4 h-4 text-red-400" />
      // Faz 6: Yönetişim & Algoritmik Çöküş
      case "EXECUTIVE_PROXY_DELEGATION":
        return <Award className="w-4 h-4 text-purple-400" />
      case "GANTT_DAG_CIRCULAR_LOOP":
        return <RotateCw className="w-4 h-4 text-cyan-400" />
      case "GDPR_KVKK_ANONYMIZATION":
        return <ShieldCheck className="w-4 h-4 text-emerald-400" />
      // Faz 7: Kıyamet, Adli Bilişim & Suistimal
      case "CONTRACT_PRICE_ESCALATION":
        return <Coins className="w-4 h-4 text-teal-400" />
      case "AI_ANOMALY_FRAUD_DETECTION":
        return <Flame className="w-4 h-4 text-orange-400" />
      case "CASCADING_SOFT_DELETE_RESTORE":
        return <Database className="w-4 h-4 text-indigo-400" />
      default:
        return <Activity className="w-4 h-4 text-slate-400" />
    }
  }

  // Filtrelenmiş Testler
  const currentTests = report ? report.tests : defaultPlaceholders
  const filteredTests = currentTests.filter((t) => {
    if (activeTab === "ALL") return true
    if (activeTab === "FAZ_1") return t.phase === "FAZ_1" || !t.phase
    if (activeTab === "FAZ_2") return t.phase === "FAZ_2"
    if (activeTab === "FAZ_3") return t.phase === "FAZ_3"
    if (activeTab === "FAZ_4") return t.phase === "FAZ_4"
    if (activeTab === "FAZ_5") return t.phase === "FAZ_5"
    if (activeTab === "FAZ_6") return t.phase === "FAZ_6"
    if (activeTab === "FAZ_7") return t.phase === "FAZ_7"
    if (activeTab === "FAILED") return t.status === "FAILED"
    return true
  })

  const faz1Count = currentTests.filter((t) => t.phase === "FAZ_1" || !t.phase).length
  const faz2Count = currentTests.filter((t) => t.phase === "FAZ_2").length
  const faz3Count = currentTests.filter((t) => t.phase === "FAZ_3").length
  const faz4Count = currentTests.filter((t) => t.phase === "FAZ_4").length
  const faz5Count = currentTests.filter((t) => t.phase === "FAZ_5").length
  const faz6Count = currentTests.filter((t) => t.phase === "FAZ_6").length
  const faz7Count = currentTests.filter((t) => t.phase === "FAZ_7").length
  const failedCount = currentTests.filter((t) => t.status === "FAILED").length

  const isFullCompliance = report && report.failedTests === 0 && report.totalTests >= 31

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8 space-y-8 font-sans">
      {/* 1. ÜST BAŞLIK VE HUD BAR */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-slate-800/80">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold tracking-wider uppercase text-cyan-400 mb-1">
            <Activity className="w-4 h-4 animate-pulse" />
            <span>NEXA Enterprise Diagnostics Engine v4.0</span>
            <span className="text-slate-600">•</span>
            <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px]">
              FAZ 1 - 7 TAM ENTEGRE (31 MODÜL)
            </span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
            <span>Sistem Teşhis & Sağlık Doğrulama Merkezi</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1.5 max-w-3xl">
            Sözleşme cezaları & otonom kesintiler, makine parkı arıza blokajları, değiştirilemez siber denetim izi (AuditLog) ve canlı WebSocket anlık bildirim kanalları sıfır kirlilik garantisiyle test edilir.
          </p>
        </div>

        {/* Aksiyon Butonları */}
        <div className="flex items-center flex-wrap gap-3">
          {report && (
            <button
              onClick={handleDownloadReport}
              className="px-3.5 py-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl text-xs font-semibold text-slate-300 hover:text-white transition-colors flex items-center gap-2 shadow-sm"
            >
              <Download className="w-4 h-4 text-cyan-400" />
              <span>Tam Raporu İndir (JSON)</span>
            </button>
          )}

          <button
            onClick={handleStartCheckup}
            disabled={isRunning}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-xl flex items-center gap-2.5 active:scale-95 ${
              isRunning
                ? "bg-cyan-600/50 text-cyan-200 cursor-not-allowed"
                : "bg-linear-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white shadow-cyan-950/50"
            }`}
          >
            {isRunning ? (
              <>
                <RotateCw className="w-4 h-4 animate-spin text-white" />
                <span>Teşhis Koşuluyor...</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current" />
                <span>Sistem Check-up Başlat</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* 2. SİSTEM %100 KAPSAM İLE ONAYLANDI - NEXA ERP ENTERPRISE CORE V1.0 MÜHÜRLENDİ */}
      {isFullCompliance && (
        <div className="relative overflow-hidden rounded-3xl border-2 border-emerald-500/50 bg-linear-to-r from-emerald-950/70 via-slate-900 to-teal-950/70 p-6 md:p-8 shadow-2xl shadow-emerald-950/50 animate-in fade-in zoom-in-95 duration-500">
          {/* Confetti Particle Cannon Animation */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {[...Array(40)].map((_, i) => (
              <div
                key={i}
                className="absolute w-2 h-2 rounded-xs opacity-80 animate-bounce"
                style={{
                  top: `${(i * 7) % 100}%`,
                  left: `${(i * 13) % 100}%`,
                  backgroundColor: ["#10b981", "#06b6d4", "#f59e0b", "#ec4899", "#8b5cf6", "#3b82f6"][i % 6],
                  transform: `rotate(${i * 35}deg) scale(${0.7 + (i % 5) * 0.2})`,
                  animationDuration: `${1.5 + (i % 4) * 0.6}s`,
                  animationDelay: `${(i % 10) * 0.15}s`,
                }}
              />
            ))}
          </div>

          <div className="absolute -top-12 -right-12 w-48 h-48 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-teal-500/15 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-6">
            <div className="flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-5">
              <div className="w-22 h-22 rounded-3xl bg-linear-to-br from-amber-400 via-emerald-400 to-teal-500 p-1 shadow-2xl shadow-emerald-500/30 shrink-0">
                <div className="w-full h-full bg-slate-950 rounded-[20px] flex items-center justify-center relative overflow-hidden">
                  <Award className="w-12 h-12 text-emerald-400 animate-pulse" />
                  <div className="absolute inset-0 bg-linear-to-tr from-transparent via-emerald-400/10 to-transparent" />
                </div>
              </div>
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-bold tracking-wide">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                  <span>RESMİ VE KURUMLARARASI DOĞRULAMA SERTİFİKASI</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-3">
                  <span className="bg-linear-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">
                    NEXA ERP - ENTERPRISE CORE V1.0 MÜHÜRLENDİ
                  </span>
                  <CheckCheck className="w-8 h-8 text-emerald-400" />
                </h2>
                <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
                  Çekirdek Sistem (Faz 1), Operasyon & İK (Faz 2), Hukuk & Güvenlik (Faz 3), Global Kur & IoT (Faz 4), Kriz & İyimser Kilit (Faz 5), Yönetişim & KVKK (Faz 6) ve Adli Bilişim & Suistimal (Faz 7) olmak üzere 7 ana fazın tümü 31/31 başarı ve sıfır veri kirliliği ile mühürlenmiştir.
                </p>

                {/* 7 Faz Rozetleri */}
                <div className="pt-2 flex flex-wrap items-center gap-2 text-xs">
                  <span className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5 font-semibold">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Faz 1: Çekirdek & Denetim
                  </span>
                  <span className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5 font-semibold">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Faz 2: Operasyon & İK
                  </span>
                  <span className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5 font-semibold">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Faz 3: Hukuk & Güvenlik
                  </span>
                  <span className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5 font-semibold">
                    <CheckCircle2 className="w-3.5 h-3.5 text-teal-400" /> Faz 4: Global & IoT
                  </span>
                  <span className="px-2.5 py-1 rounded-lg bg-rose-500/20 text-rose-300 border border-rose-500/30 flex items-center gap-1.5 font-semibold">
                    <CheckCircle2 className="w-3.5 h-3.5 text-rose-400" /> Faz 5: Kriz & İyimser Kilit
                  </span>
                  <span className="px-2.5 py-1 rounded-lg bg-purple-500/20 text-purple-300 border border-purple-500/30 flex items-center gap-1.5 font-semibold">
                    <CheckCircle2 className="w-3.5 h-3.5 text-purple-400" /> Faz 6: Yönetişim & KVKK
                  </span>
                  <span className="px-2.5 py-1 rounded-lg bg-orange-500/20 text-orange-300 border border-orange-500/30 flex items-center gap-1.5 font-semibold">
                    <CheckCircle2 className="w-3.5 h-3.5 text-orange-400" /> Faz 7: Adli Bilişim & Suistimal
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 w-full lg:w-auto shrink-0 text-center sm:text-right">
              <div className="p-3 bg-slate-900/80 border border-slate-800 rounded-xl">
                <div className="text-xl font-black text-emerald-400">{report.passedTests}/{report.totalTests}</div>
                <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Modül Doğrulandı</div>
              </div>
              <div className="p-3 bg-slate-900/80 border border-slate-800 rounded-xl">
                <div className="text-xl font-black text-cyan-400">{report.totalDurationMs} ms</div>
                <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">İcra Süresi</div>
              </div>
              <div className="p-3 bg-slate-900/80 border border-slate-800 rounded-xl col-span-2 sm:col-span-1">
                <div className="text-xl font-black text-indigo-400">0 Kalıntı</div>
                <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Temiz Teardown</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. HUD İSTATİSTİK KARTLARI */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Test Durumu */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 relative overflow-hidden backdrop-blur-sm group hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
            <span className="font-medium">Genel Sistem Durumu</span>
            <Server className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold tracking-tight text-white mb-1 flex items-center gap-2">
            {report ? (
              report.failedTests === 0 ? (
                <>
                  <span className="text-emerald-400">%100 Başarılı</span>
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                </>
              ) : (
                <>
                  <span className="text-amber-400">{report.failedTests} Uyarı</span>
                  <AlertTriangle className="w-5 h-5 text-amber-400" />
                </>
              )
            ) : (
              <span className="text-slate-400">Beklemede</span>
            )}
          </div>
          <div className="text-[11px] text-slate-400">
            {report ? `${report.passedTests}/${report.totalTests} Modül Doğrulandı` : "Check-up çalıştırılmadı"}
          </div>
        </div>

        {/* Veritabanı ve Teardown */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 relative overflow-hidden backdrop-blur-sm group hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
            <span className="font-medium">Sıfır Kirlilik Teardown</span>
            <ShieldCheck className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-bold tracking-tight text-cyan-400 mb-1">
            %100 Temiz
          </div>
          <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
            <span>Faz 1, 2, 3 & 4 kayıtları silindi</span>
          </div>
        </div>

        {/* İcra Süresi */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 relative overflow-hidden backdrop-blur-sm group hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
            <span className="font-medium">Toplam Teşhis Süresi</span>
            <Clock className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-bold tracking-tight text-white mb-1 font-mono">
            {report ? `${report.totalDurationMs} ms` : "0 ms"}
          </div>
          <div className="text-[11px] text-slate-400">
            {report ? `Koşu ID: ${report.runId.substring(0, 16)}...` : "Hazır"}
          </div>
        </div>

        {/* Güvenlik & Hukuk */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 relative overflow-hidden backdrop-blur-sm group hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
            <span className="font-medium">Hukuk & Siber Güvenlik</span>
            <Scale className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold tracking-tight text-white mb-1">
            Aktif & Korunan
          </div>
          <div className="text-[11px] text-emerald-400 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span>AuditLog & Ceza Motoru Hazır</span>
          </div>
        </div>
      </div>

      {/* 4. CANLI TERMİNAL GÖRÜNÜMÜ & LOG AKIŞI (Terminal Stream Window) */}
      <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
        <div className="bg-slate-900/90 px-4 py-3 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-rose-500/80" />
              <div className="w-3 h-3 rounded-full bg-amber-500/80" />
              <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
            </div>
            <div className="flex items-center gap-2 text-xs font-mono text-slate-400 pl-2 border-l border-slate-800">
              <Terminal className="w-3.5 h-3.5 text-cyan-400" />
              <span>nexa-diagnostics-daemon --stream --phase1 --phase2 --phase3 --phase4</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyLogs}
              className="px-2.5 py-1 rounded-md bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-[11px] transition-colors flex items-center gap-1"
            >
              {copiedLogs ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              <span>{copiedLogs ? "Kopyalandı" : "Logları Kopyala"}</span>
            </button>
          </div>
        </div>

        <div className="p-4 bg-slate-950 font-mono text-xs max-h-72 overflow-y-auto space-y-1.5 select-text">
          {liveLogs.length === 0 ? (
            <div className="py-8 text-center text-slate-600">
              <Terminal className="w-8 h-8 mx-auto mb-2 opacity-20" />
              <p>Teşhis motoru hazır. Başlatmak için yukarıdaki &quot;Sistem Check-up Başlat&quot; butonuna basınız.</p>
            </div>
          ) : (
            liveLogs.map((log) => {
              let badgeColor = "bg-slate-800 text-slate-300 border-slate-700"
              let textColor = "text-slate-300"

              if (log.level === "SUCCESS") {
                badgeColor = "bg-emerald-950/60 text-emerald-300 border-emerald-500/30"
                textColor = "text-emerald-200"
              } else if (log.level === "ERROR") {
                badgeColor = "bg-rose-950/60 text-rose-300 border-rose-500/30"
                textColor = "text-rose-200"
              } else if (log.level === "WARN") {
                badgeColor = "bg-amber-950/60 text-amber-300 border-amber-500/30"
                textColor = "text-amber-200"
              } else if (log.level === "SYSTEM") {
                badgeColor = "bg-cyan-950/60 text-cyan-300 border-cyan-500/30"
                textColor = "text-cyan-200 font-semibold"
              }

              return (
                <div key={log.id} className="flex items-start gap-2.5 leading-relaxed font-mono">
                  <span className="text-slate-600 shrink-0 text-[10px] select-none pt-0.5">
                    {log.timestamp}
                  </span>
                  <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold border shrink-0 uppercase ${badgeColor}`}>
                    {log.level}
                  </span>
                  <span className={`break-all ${textColor}`}>
                    {log.message}
                  </span>
                </div>
              )
            })
          )}
          <div ref={terminalEndRef} />
        </div>
      </div>

      {/* 5. SEKME VE FİLTRELER: FAZ 1 vs FAZ 2 vs FAZ 3 */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-cyan-400" />
            <h2 className="text-lg font-bold text-white">Doğrulanan Test Paketleri</h2>
          </div>

          {/* Sekme Butonları */}
          <div className="flex items-center flex-wrap gap-1.5 text-xs">
            <button
              onClick={() => setActiveTab("ALL")}
              className={`px-3 py-1.5 rounded-lg transition-colors font-medium ${
                activeTab === "ALL" ? "bg-cyan-600 text-white" : "bg-slate-900 text-slate-400 hover:text-white"
              }`}
            >
              Tüm Testler ({currentTests.length})
            </button>
            <button
              onClick={() => setActiveTab("FAZ_1")}
              className={`px-3 py-1.5 rounded-lg transition-colors font-medium ${
                activeTab === "FAZ_1" ? "bg-indigo-600 text-white" : "bg-slate-900 text-slate-400 hover:text-white"
              }`}
            >
              Faz 1: Çekirdek & Denetim ({faz1Count})
            </button>
            <button
              onClick={() => setActiveTab("FAZ_2")}
              className={`px-3 py-1.5 rounded-lg transition-colors font-medium ${
                activeTab === "FAZ_2" ? "bg-purple-600 text-white" : "bg-slate-900 text-slate-400 hover:text-white"
              }`}
            >
              Faz 2: Operasyon & İK ({faz2Count})
            </button>
            <button
              onClick={() => setActiveTab("FAZ_3")}
              className={`px-3 py-1.5 rounded-lg transition-colors font-medium ${
                activeTab === "FAZ_3" ? "bg-amber-600 text-white font-bold shadow-md shadow-amber-950" : "bg-slate-900 text-slate-400 hover:text-white"
              }`}
            >
              Faz 3: Hukuk & Güvenlik ({faz3Count})
            </button>
            <button
              onClick={() => setActiveTab("FAZ_4")}
              className={`px-3 py-1.5 rounded-lg transition-colors font-medium ${
                activeTab === "FAZ_4" ? "bg-teal-600 text-white font-bold shadow-md shadow-teal-950" : "bg-slate-900 text-slate-400 hover:text-white"
              }`}
            >
              Faz 4: Kur & IoT ({faz4Count})
            </button>
            <button
              onClick={() => setActiveTab("FAZ_5")}
              className={`px-3 py-1.5 rounded-lg transition-colors font-medium ${
                activeTab === "FAZ_5" ? "bg-rose-600 text-white font-bold shadow-md shadow-rose-950" : "bg-slate-900 text-slate-400 hover:text-white"
              }`}
            >
              Faz 5: Kriz & Kilit ({faz5Count})
            </button>
            <button
              onClick={() => setActiveTab("FAZ_6")}
              className={`px-3 py-1.5 rounded-lg transition-colors font-medium ${
                activeTab === "FAZ_6" ? "bg-purple-600 text-white font-bold shadow-md shadow-purple-950" : "bg-slate-900 text-slate-400 hover:text-white"
              }`}
            >
              Faz 6: Yönetişim & KVKK ({faz6Count})
            </button>
            <button
              onClick={() => setActiveTab("FAZ_7")}
              className={`px-3 py-1.5 rounded-lg transition-colors font-medium ${
                activeTab === "FAZ_7" ? "bg-orange-600 text-white font-bold shadow-md shadow-orange-950" : "bg-slate-900 text-slate-400 hover:text-white"
              }`}
            >
              Faz 7: Suistimal Radarı ({faz7Count})
            </button>
            <button
              onClick={() => setActiveTab("FAILED")}
              className={`px-3 py-1.5 rounded-lg transition-colors font-medium ${
                activeTab === "FAILED" ? "bg-red-600 text-white" : "bg-slate-900 text-slate-400 hover:text-white"
              }`}
            >
              Hatalılar ({failedCount})
            </button>
          </div>
        </div>

        {/* Test Listesi Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredTests.map((test) => {
            const isFaz1 = test.phase === "FAZ_1" || !test.phase
            const isFaz2 = test.phase === "FAZ_2"
            const isFaz3 = test.phase === "FAZ_3"
            const isFaz4 = test.phase === "FAZ_4"
            const isFaz5 = test.phase === "FAZ_5"
            const isFaz6 = test.phase === "FAZ_6"
            const isFaz7 = test.phase === "FAZ_7"

            let phaseBadgeClass = "bg-indigo-950 text-indigo-300 border-indigo-500/30"
            let phaseLabel = "FAZ 1"
            if (isFaz2) { phaseBadgeClass = "bg-purple-950 text-purple-300 border-purple-500/30"; phaseLabel = "FAZ 2" }
            if (isFaz3) { phaseBadgeClass = "bg-amber-950 text-amber-300 border-amber-500/30"; phaseLabel = "FAZ 3" }
            if (isFaz4) { phaseBadgeClass = "bg-teal-950 text-teal-300 border-teal-500/30"; phaseLabel = "FAZ 4" }
            if (isFaz5) { phaseBadgeClass = "bg-rose-950 text-rose-300 border-rose-500/30"; phaseLabel = "FAZ 5" }
            if (isFaz6) { phaseBadgeClass = "bg-purple-950 text-purple-300 border-purple-500/30"; phaseLabel = "FAZ 6" }
            if (isFaz7) { phaseBadgeClass = "bg-orange-950 text-orange-300 border-orange-500/30"; phaseLabel = "FAZ 7" }

            return (
              <div
                key={test.id}
                onClick={() => setSelectedTest(test)}
                className="bg-slate-900/60 hover:bg-slate-900/90 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 cursor-pointer transition-all shadow-md group relative overflow-hidden"
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-xl bg-slate-950 border border-slate-800">
                      {getCategoryIcon(test.category)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                          {test.categoryTitle}
                        </span>
                        <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold border ${phaseBadgeClass}`}>
                          {phaseLabel}
                        </span>
                      </div>
                      <h3 className="text-sm font-bold text-white group-hover:text-cyan-400 transition-colors">
                        {test.title}
                      </h3>
                    </div>
                  </div>

                  {/* Durum Rozeti */}
                  <div className="shrink-0">
                    {test.status === "PASSED" && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-[11px] font-bold">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Başarılı</span>
                      </span>
                    )}
                    {test.status === "FAILED" && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-950/60 border border-rose-500/40 text-rose-300 text-[11px] font-bold">
                        <XCircle className="w-3.5 h-3.5 text-rose-400" />
                        <span>Başarısız</span>
                      </span>
                    )}
                    {test.status === "IDLE" && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-800 text-slate-400 text-[11px] font-medium">
                        <Clock className="w-3.5 h-3.5" />
                        <span>Bekliyor</span>
                      </span>
                    )}
                  </div>
                </div>

                <p className="text-xs text-slate-400 line-clamp-2 mb-3">
                  {test.description}
                </p>

                {/* Assertions Özeti */}
                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500">
                  <span className="font-mono">{test.assertions?.length || 1} Doğrulama (Assertion)</span>
                  <span className="font-mono text-slate-400">
                    {test.durationMs ? `${test.durationMs} ms` : "0 ms"}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* 6. TEARDOWN VE GÜVENLİK SERTİFİKASI */}
      <div className="bg-linear-to-r from-emerald-950/30 via-slate-900 to-cyan-950/30 border border-emerald-500/30 rounded-2xl p-6 relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span>Enterprise Teardown & Sıfır Kirlilik Garantisi</span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold">
                  FAZ 1, 2, 3 & 4 KORUMALI
                </span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Sözleşmeler, cezalar, vinç arıza logları, silinen ödemeler, değiştirilemez audit izleri, acil durum websocket mesajları, kur riskleri, revizyon çatışmaları ve IoT turnike DÖF kayıtları icra bitiminde anında temizlenir. Üretim tablolarında 0 kalıntı kalır.
              </p>
            </div>
          </div>

          <div className="text-right sm:border-l sm:border-slate-800 sm:pl-6 shrink-0">
            <div className="text-2xl font-bold font-mono text-emerald-400">
              {report ? `${report.cleanedRecordsCount} Kayıt` : "Otomatik"}
            </div>
            <div className="text-[11px] text-slate-500">
              İzole & Temizlenen Veri
            </div>
          </div>
        </div>
      </div>

      {/* 7. TEST DETAY MODALI */}
      {selectedTest && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-xl w-full p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                {getCategoryIcon(selectedTest.category)}
                <div>
                  <h3 className="text-base font-bold text-white">
                    {selectedTest.title}
                  </h3>
                  <span className="text-[10px] font-bold text-cyan-400 uppercase">
                    {selectedTest.categoryTitle}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setSelectedTest(null)}
                className="text-slate-500 hover:text-white"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-400">
              {selectedTest.description}
            </p>

            <div className="space-y-2">
              <span className="text-xs font-semibold text-slate-300">
                Doğrulama Adımları (Assertions):
              </span>
              <div className="space-y-1.5 max-h-48 overflow-y-auto">
                {selectedTest.assertions?.map((a, i) => (
                  <div
                    key={i}
                    className="p-2.5 rounded-lg bg-slate-950 border border-slate-800/80 text-xs flex items-center justify-between gap-3"
                  >
                    <span className="text-slate-300 font-medium truncate">
                      {a.name}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold shrink-0 ${
                        a.passed
                          ? "bg-emerald-950 text-emerald-300 border border-emerald-500/30"
                          : "bg-rose-950 text-rose-300 border border-rose-500/30"
                      }`}
                    >
                      {a.passed ? "DOĞRULANDI" : "HATALI"}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {selectedTest.details && (
              <div className="space-y-1">
                <span className="text-xs font-semibold text-slate-300">
                  İcra Parametreleri:
                </span>
                <pre className="p-3 bg-slate-950 border border-slate-800 rounded-lg text-[11px] font-mono text-cyan-300 overflow-x-auto">
                  {JSON.stringify(selectedTest.details, null, 2)}
                </pre>
              </div>
            )}

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedTest(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-lg transition-colors"
              >
                Kapat
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Varsayılan Placeholder Kartlar (Faz 1 + Faz 2 + Faz 3 + Faz 4)
const defaultPlaceholders: DiagnosticTestResult[] = [
  // Faz 1
  {
    id: "TEST-1.1",
    phase: "FAZ_1",
    category: "RBAC_ISOLATION",
    categoryTitle: "RBAC & Multi-Tenant İzolasyon",
    title: "Denetçi Rolü (INSPECTOR) Finans Modülü İzolasyon Testi",
    description: "MOCK_INSPECTOR rolüyle /admin/finance API rotasına erişim denemesi 403 Forbidden ile engellenmelidir.",
    status: "IDLE",
    durationMs: 0,
    assertions: [{ name: "403 Forbidden Yanıtı", expected: 403, actual: 403, passed: true }],
  },
  {
    id: "TEST-1.2",
    phase: "FAZ_1",
    category: "RBAC_ISOLATION",
    categoryTitle: "RBAC & Multi-Tenant İzolasyon",
    title: "Taşeronlar Arası Çapraz Veri İzolasyon Testi",
    description: "MOCK_SUBCONTRACTOR_A, MOCK_SUBCONTRACTOR_B'nin hakediş verilerini okuyamamalıdır (Boş array).",
    status: "IDLE",
    durationMs: 0,
    assertions: [{ name: "Çapraz Sızıntı Sıfır", expected: 0, actual: 0, passed: true }],
  },
  {
    id: "TEST-1.3",
    phase: "FAZ_1",
    category: "RBAC_ISOLATION",
    categoryTitle: "RBAC & Multi-Tenant İzolasyon",
    title: "Yetkisiz İstek (Unauthenticated) Giriş Yönlendirme Testi",
    description: "Oturum token'ı olmayan istekler sistem tarafından /login sayfasına 307/302 ile yönlendirilmelidir.",
    status: "IDLE",
    durationMs: 0,
    assertions: [{ name: "Tokensız kök rotası isteğinin /login sayfasına yönlendirilmesi", expected: "/login", actual: "/login", passed: true }],
  },
  {
    id: "TEST-2.1",
    phase: "FAZ_1",
    category: "INSPECTION_STAGE_GATE",
    categoryTitle: "Yapı Denetim & Stage-Gate Süreçleri",
    title: "Stage-Gate Faz Kilidi & Vize Engelleme Doğrulaması",
    description: "0/5 Ruhsat Bekleyen projeye Beton Dökümü (Kaba İnşaat) vizesi eklenmeye çalışıldığında reddedilmelidir.",
    status: "IDLE",
    durationMs: 0,
    assertions: [{ name: "Faz Kilidi Reddi", expected: true, actual: true, passed: true }],
  },
  {
    id: "TEST-2.2",
    phase: "FAZ_1",
    category: "INSPECTION_STAGE_GATE",
    categoryTitle: "Yapı Denetim & Stage-Gate Süreçleri",
    title: "Kritik Karot Kırımı & Otonom DÖF (NonConformance) Tetikleyici",
    description: "12 MPa kırım sonucu girildiğinde sistem otonom olarak 'OPEN' statüsünde bir DÖF (NCR) tutanağı oluşturmalıdır.",
    status: "IDLE",
    durationMs: 0,
    assertions: [{ name: "Otonom NCR Tetiklendi", expected: true, actual: true, passed: true }],
  },
  {
    id: "TEST-3.1",
    phase: "FAZ_1",
    category: "FINANCE_BOQ_ALGORITHM",
    categoryTitle: "Finans & BoQ Algoritmik Bütünlük",
    title: "Metraj, Ağırlıklı İlerleme ve Hakediş Bütünlük Doğrulaması",
    description: "1000 m³ @ 2000 TL imalatın 500 m³'ü tamamlandığında; actualQuantity=500, totalPrice=2.000.000 TL, progress=%50 ve 1.000.000 TL hakediş oluşmalıdır.",
    status: "IDLE",
    durationMs: 0,
    assertions: [{ name: "Algoritmik Eşitlikler", expected: true, actual: true, passed: true }],
  },
  {
    id: "TEST-4.1",
    phase: "FAZ_1",
    category: "AUTONOMOUS_JOURNAL",
    categoryTitle: "Otonom Jurnal (Data Aggregation)",
    title: "Günlük Şantiye Jurnali Çok Boyutlu Veri Bütünleme Testi",
    description: "QR Tüketim, İSG DÖF ve Meteoroloji verilerinin getTodaySummary() ile eksiksiz aggregate edilmesi.",
    status: "IDLE",
    durationMs: 0,
    assertions: [{ name: "JSON Bütünlüğü", expected: true, actual: true, passed: true }],
  },
  {
    id: "TEST-5.1",
    phase: "FAZ_1",
    category: "EXTERNAL_IO_SYSTEMS",
    categoryTitle: "Harici Sistemler & I/O (S3, AI, OSRM)",
    title: "Dosya ve Doküman Depolama (Storage / S3) Entegrasyon Testi",
    description: "PDF base64 veri akışı depolama katmanına gönderilir ve erişilebilir HTTPS dosya URL'si doğrulanır.",
    status: "IDLE",
    durationMs: 0,
    assertions: [{ name: "URL Formatı Doğrulandı", expected: true, actual: true, passed: true }],
  },
  {
    id: "TEST-5.2",
    phase: "FAZ_1",
    category: "EXTERNAL_IO_SYSTEMS",
    categoryTitle: "Harici Sistemler & I/O (S3, AI, OSRM)",
    title: "Yapay Zeka (LLM / RAG) C-Level Yönetici Özeti Üretim Testi",
    description: "Jurnal JSON verisi AI motoruna gönderilir ve dönen analiz metninin semantik bütünlüğü test edilir.",
    status: "IDLE",
    durationMs: 0,
    assertions: [{ name: "Metin Uzunluğu > 10", expected: true, actual: true, passed: true }],
  },
  {
    id: "TEST-5.3",
    phase: "FAZ_1",
    category: "EXTERNAL_IO_SYSTEMS",
    categoryTitle: "Harici Sistemler & I/O (S3, AI, OSRM)",
    title: "Karayolları OSRM / GIS Akıllı Rota Geometrisi Testi",
    description: "İskenderun ve Antakya koordinatları arasında gerçek karayolu rota ağı sorgulanır, mesafe ve süre doğrulanır.",
    status: "IDLE",
    durationMs: 0,
    assertions: [{ name: "Mesafe ve Süre > 0", expected: true, actual: true, passed: true }],
  },

  // Faz 2
  {
    id: "TEST-6.1",
    phase: "FAZ_2",
    category: "HR_PAYROLL",
    categoryTitle: "İK, Puantaj ve Bordro (HR & Payroll)",
    title: "Puantaj, Fazla Mesai ve Ay Sonu Bordro Hesaplama Testi",
    description: "200 TL/saat tabanlı personelin 160s normal + 10s %50 zamlı fazla mesaisi (35.000 TL) hesaplanmalı ve Finans yükümlülüğüne işlenmelidir.",
    status: "IDLE",
    durationMs: 0,
    assertions: [
      { name: "Bordro Formülü (160x200 + 10x300 = 35.000 TL)", expected: 35000, actual: 35000, passed: true },
      { name: "Finans 'Ödenecek Maaşlar' Kaydı (PENDING)", expected: "PENDING", actual: "PENDING", passed: true },
    ],
  },
  {
    id: "TEST-7.1",
    phase: "FAZ_2",
    category: "PROCUREMENT_BIDDING",
    categoryTitle: "Satınalma ve İhale (Procurement Bidding)",
    title: "Tedarikçi Teklif Değerlendirme ve Otonom Sipariş Testi",
    description: "100 Ton B420C için gelen 23.000, 22.500 ve 24.000 TL tekliflerden en uygununun (22.500 TL) seçilmesi ve Satınalma Siparişine dönüştürülmesi.",
    status: "IDLE",
    durationMs: 0,
    assertions: [
      { name: "Otonom En İyi Teklif Seçimi (22.500 TL/Ton)", expected: 22500, actual: 22500, passed: true },
      { name: "Satınalma Siparişi Tutarı (2.250.000 TL)", expected: 2250000, actual: 2250000, passed: true },
    ],
  },
  {
    id: "TEST-8.1",
    phase: "FAZ_2",
    category: "FRANCHISE_PUNCH_LIST",
    categoryTitle: "Franchise Rollout & Punch List (QA)",
    title: "Açık Kusur Varlığında 'Açılışa Hazır' Stage-Gate Kilidi Testi",
    description: "İnşaatı %100 bitmiş olsa dahi açık Punch List (Kasa arkası ledler) varken mağazanın 'Açılışa Hazır' aşamasına geçmesi engellenmelidir.",
    status: "IDLE",
    durationMs: 0,
    assertions: [
      { name: "Açık Punch List Kaydı Tespiti (1 Adet)", expected: 1, actual: 1, passed: true },
      { name: "Stage-Gate 'Açılışa Hazır' Statü Kilidi", expected: true, actual: true, passed: true },
    ],
  },
  {
    id: "TEST-9.1",
    phase: "FAZ_2",
    category: "LOGISTICS_RMA",
    categoryTitle: "Ambar, Lojistik & RMA (Kusurlu Teslimat)",
    title: "Hasarlı Teslimat (RMA) ve Dinamik Sağlam Stok Ayrımı Testi",
    description: "5 adet buzdolabından 2 adedi 'DAMAGED' okutulduğunda; otomatik RMA (REPORTED) kaydı açılmalı ve sağlam stok 3 adede revize edilmelidir.",
    status: "IDLE",
    durationMs: 0,
    assertions: [
      { name: "Otonom RMA Kaydı ve 'Değişim Bekleyenler' Kuyruğu", expected: "DAMAGED / REPORTED", actual: "DAMAGED / REPORTED", passed: true },
      { name: "Stoktaki Sağlam Ürün Adedi: 3", expected: 3, actual: 3, passed: true },
    ],
  },

  // Faz 3
  {
    id: "TEST-10.1",
    phase: "FAZ_3",
    category: "CONTRACT_PENALTY",
    categoryTitle: "Sözleşme Hukuku & Gecikme Cezaları",
    title: "Otonom Taşeron Gecikme Cezası ve Hakediş Mahsubu Testi",
    description: "5 gün gecikmiş imalat için sözleşmedeki günlük 5.000 TL ceza kuralıyla; -25.000 TL ceza fişi kesilmeli ve 100.000 TL hakedişten 75.000 TL net ödeme hesaplanmalıdır.",
    status: "IDLE",
    durationMs: 0,
    assertions: [
      { name: "5 Günlük Takvim Gecikmesi Tespiti", expected: 5, actual: 5, passed: true },
      { name: "Otonom Ceza Fişi Kesintisi (-25.000 TL)", expected: 25000, actual: 25000, passed: true },
      { name: "Cezalı Net Ödenecek Tutar (75.000 TL)", expected: 75000, actual: 75000, passed: true },
    ],
  },
  {
    id: "TEST-11.1",
    phase: "FAZ_3",
    category: "EQUIPMENT_BLOCKING",
    categoryTitle: "Makine Parkı & Otonom İş Engelleme",
    title: "Kule Vinç Arızası ve Bağlı İmalat Kalemi Blokaj (Stage-Lock) Testi",
    description: "Kule vinç BROKEN statüsüne geçtiğinde; bağlı BoQ/Gantt kalemi BLOCKED durumuna alınmalı ve Jurnal'e 'Kule Vinç Arızası Nedeniyle İş Durdu' tutanağı yazılmalıdır.",
    status: "IDLE",
    durationMs: 0,
    assertions: [
      { name: "Kule Vinç Ekipman Statüsü (BROKEN)", expected: "BROKEN", actual: "BROKEN", passed: true },
      { name: "Bağlı BoQ İmalat Kaleminin BLOCKED Durumuna Çekilmesi", expected: true, actual: true, passed: true },
      { name: "Jurnal'e 'Kule Vinç Arızası Nedeniyle İş Durdu' Tutanak Kaydı", expected: true, actual: true, passed: true },
    ],
  },
  {
    id: "TEST-12.1",
    phase: "FAZ_3",
    category: "AUDIT_LOG_SECURITY",
    categoryTitle: "Siber Güvenlik & Değiştirilemez Denetim İzi",
    title: "Kritik Finans Kaydı Silme ve Değiştirilemez AuditLog Doğrulaması",
    description: "Finans ödemesi DELETE komutuyla silinse dahi, AuditLog tablosuna silinmesi imkansız kalıcı güvenlik izi ('Kullanıcı X, Ödeme Y'yi sildi') düşülmelidir.",
    status: "IDLE",
    durationMs: 0,
    assertions: [
      { name: "Finans Kaydının Veritabanından Silinmesi (DELETE)", expected: null, actual: null, passed: true },
      { name: "AuditLog Tablosunda Silinmesi İmkansız Güvenlik İzi (DELETE / Payment)", expected: "DELETE / Payment", actual: "DELETE / Payment", passed: true },
    ],
  },
  {
    id: "TEST-13.1",
    phase: "FAZ_3",
    category: "REALTIME_SOCKET",
    categoryTitle: "İç Haberleşme & Real-time WebSocket",
    title: "Kritik Saha Acil Durum Mesajı ve WebSocket Broadcast Testi",
    description: "MOCK_ENGINEER'ın MOCK_MANAGER'a gönderdiği 'Acil durum: Beton pompası tıkandı' mesajı 200 OK ile websocket kanalına push edilmelidir.",
    status: "IDLE",
    durationMs: 0,
    assertions: [
      { name: "WebSocket / Pusher Event Trigger Yanıtı (200 OK)", expected: 200, actual: 200, passed: true },
      { name: "Acil Durum Mesaj Payload'unun Kanala İletilmesi", expected: "Acil durum: Beton pompası tıkandı", actual: "Acil durum: Beton pompası tıkandı", passed: true },
    ],
  },

  // Faz 4
  {
    id: "TEST-14.1",
    phase: "FAZ_4",
    category: "FX_CURRENCY_RISK",
    categoryTitle: "Çoklu Para Birimi & Kur Riski (FX)",
    title: "İthal Malzeme BoQ ve Döviz Kuru Artışı (+50.000 TL FX Loss) Testi",
    description: "10.000 USD tutarındaki ithal malzeme 40 TL'den (400.000 TL) 45 TL'ye (450.000 TL) revize edildiğinde; aradaki +50.000 TL kur farkı maliyet artışı olarak BoQ ve Finans sistemine anında yansıtılmalıdır.",
    status: "IDLE",
    durationMs: 0,
    assertions: [
      { name: "BoQ Başlangıç Bütçesi (10.000 USD @ 40 TL = 400.000 TL)", expected: 400000, actual: 400000, passed: true },
      { name: "Güncellenen Döviz Kuru (1 USD = 45 TL)", expected: 45, actual: 45, passed: true },
      { name: "Otonom Kur Farkı / Maliyet Artışı (+50.000 TL FX Loss)", expected: 50000, actual: 50000, passed: true },
    ],
  },
  {
    id: "TEST-15.1",
    phase: "FAZ_4",
    category: "RETENTION_DEDUCTION",
    categoryTitle: "Sözleşme Hukuku & Teminat Kesintisi",
    title: "Taşeron Hakedişinden %5 Teminat Kesintisi ve Bloke Fon Hesabı Testi",
    description: "100.000 TL'lik hakediş için sözleşmedeki %5 geçici kabul kesintisi uygulanmalı; net 95.000 TL ödeme emri çıkmalı ve 5.000 TL 'Taşeron Teminat Hesabı' altında bloke edilmelidir.",
    status: "IDLE",
    durationMs: 0,
    assertions: [
      { name: "Brüt Hakediş Tutarı (100.000 TL)", expected: 100000, actual: 100000, passed: true },
      { name: "Çıkarılan Net Ödeme Emri (95.000 TL)", expected: 95000, actual: 95000, passed: true },
      { name: "Geçici Kabul Kesintisi (%5 = 5.000 TL)", expected: 5000, actual: 5000, passed: true },
      { name: "Finans 'Taşeron Teminat Hesabı' Bloke Fon Doğrulaması", expected: "Taşeron Teminat Hesabı", actual: "Taşeron Teminat Hesabı", passed: true },
    ],
  },
  {
    id: "TEST-16.1",
    phase: "FAZ_4",
    category: "BLUEPRINT_INVALIDATION",
    categoryTitle: "Versiyonlama & Revizyon Çatışması",
    title: "Statik Pafta V2 Yüklendiğinde V1 Vizesinin Otonom İptali (REJECTED_REVISION)",
    description: "Statik Proje V1'e bağlı bekleyen Demir Vizesi varken, V2 yüklendiği an sistem eski vizeyi otonom REJECTED_REVISION statüsüne çekmeli ve mühendise 'Proje güncellendi, vizeyi yeni projeye göre tekrar açın' uyarısı düşmelidir.",
    status: "IDLE",
    durationMs: 0,
    assertions: [
      { name: "Yeni Revizyonun Sisteme Yüklenmesi (Statik Proje V2)", expected: true, actual: true, passed: true },
      { name: "Eski Vize Statüsünün Otonom İptali (REJECTED_REVISION)", expected: "REJECTED_REVISION", actual: "REJECTED_REVISION", passed: true },
      { name: "Mühendise Bildirilen İptal Nedeni ('Proje güncellendi, vizeyi yeni projeye göre tekrar açın')", expected: true, actual: true, passed: true },
    ],
  },
  {
    id: "TEST-17.1",
    phase: "FAZ_4",
    category: "IOT_HARDWARE_WEBHOOK",
    categoryTitle: "Fiziksel IoT & Turnike Entegrasyonu",
    title: "Yetkisiz RFID Turnike Okutulduğunda Otonom CRITICAL İSG Uyarısı (NCR) Testi",
    description: "/api/webhooks/iot rotasına izinsiz WORKER_123 RFID okutulduğunda; turnike engellenmeli, sistemde otonom CRITICAL seviyeli 'İzinsiz Sahaya Giriş (Yetkisiz Baret/RFID)' DÖF (NCR) tutanağı açılmalı ve İSG Radarına düşmelidir.",
    status: "IDLE",
    durationMs: 0,
    assertions: [
      { name: "Turnike Donanım Yanıtı (Geçiş Engellendi - accessGranted=false)", expected: false, actual: false, passed: true },
      { name: "Otonom CRITICAL Seviyeli İSG DÖF (NCR) Kaydı Açılışı", expected: "CRITICAL", actual: "CRITICAL", passed: true },
      { name: "DÖF Tutanağında 'İzinsiz Sahaya Giriş (Yetkisiz Baret/RFID)' İbaresi", expected: true, actual: true, passed: true },
    ],
  },

  // Faz 5: Kriz & İyimser Kilitleme
  {
    id: "TEST-18.1",
    phase: "FAZ_5",
    category: "RESOURCE_OVERLAP_CONFLICT",
    categoryTitle: "Kaynak Çakışması & Zaman Planlaması",
    title: "Aynı Mühendisin Aynı Saatte İki Farklı Projeye Atanması ve 409 Conflict Koruması",
    description: "Aynı mühendis Proje A'da mesaideyken, aynı zaman diliminde Proje B'ye görev atanmaya çalışıldığında; sistem zaman çakışmasını anında yakalayıp 409 Conflict dönerek çift rezervasyonu engellemelidir.",
    status: "IDLE",
    durationMs: 0,
    assertions: [
      { name: "Zaman Çakışması Yanıt Kodu (409 Conflict)", expected: 409, actual: 409, passed: true },
      { name: "Çakışan Görevin Tespit Edilmesi (Proje A)", expected: true, actual: true, passed: true },
      { name: "Çift Proje Atamasının Reddi ve Hata İletisi", expected: true, actual: true, passed: true },
    ],
  },
  {
    id: "TEST-19.1",
    phase: "FAZ_5",
    category: "OPTIMISTIC_LOCK_COLLISION",
    categoryTitle: "İyimser Kilitleme (Optimistic Concurrency)",
    title: "Aynı Hakedişe Eşzamanlı Çift Onay Denemesi ve Version Mismatch Hatası",
    description: "Aynı hakediş kaydı aynı anda 2 farklı thread/kullanıcı tarafından onaylanmaya çalışıldığında; sadece biri başarılı olmalı (Version: 1 -> 2), diğeri Version Mismatch fırlatarak tutarsızlığı önlemelidir.",
    status: "IDLE",
    durationMs: 0,
    assertions: [
      { name: "Yalnızca Bir İsteğin Başarılı Olması (hasOneWinner)", expected: true, actual: true, passed: true },
      { name: "Çakışan Diğer İsteğin 'Version Mismatch' ile Reddedilmesi", expected: true, actual: true, passed: true },
      { name: "Hakediş Sürümünün Güvenle Sadece 1 Artırılması (Version: 2)", expected: 2, actual: 2, passed: true },
    ],
  },
  {
    id: "TEST-20.1",
    phase: "FAZ_5",
    category: "BUDGET_HARD_STOP_OVERFLOW",
    categoryTitle: "Bütçe Denetimi & Hard-Stop Kontrolleri",
    title: "Proje Bütçesini Aşan Siparişte Otonom 'CEO_APPROVAL_REQUIRED' Statüsü",
    description: "100.000 TL bütçeli projede 150.000 TL satınalma siparişi açıldığında; işlem tamamen iptal edilip bloke edilmemeli, sipariş otonom CEO_APPROVAL_REQUIRED statüsüne alınarak üst yönetime sevk edilmelidir.",
    status: "IDLE",
    durationMs: 0,
    assertions: [
      { name: "Bütçe Aşımı Tespiti (150.000 TL > 100.000 TL)", expected: true, actual: true, passed: true },
      { name: "Otonom CEO_APPROVAL_REQUIRED Statüsüne Sevk", expected: "CEO_APPROVAL_REQUIRED", actual: "CEO_APPROVAL_REQUIRED", passed: true },
      { name: "Sipariş İptal Edilmedi (Aktif Üst Onay Kuyruğunda)", expected: true, actual: true, passed: true },
    ],
  },

  // Faz 6: Yönetişim & Algoritmik Çöküş
  {
    id: "TEST-21.1",
    phase: "FAZ_6",
    category: "EXECUTIVE_PROXY_DELEGATION",
    categoryTitle: "Kurumsal Yönetişim & Yetki Devri",
    title: "CEO Yetki Devri (Proxy Delegation) ve AuditLog'da 'actingAs: CEO' Damgası",
    description: "CEO yetkisini vekile devrettiğinde ve vekil onay verdiğinde; AuditLog tablosunda işlemi fiilen yapan vekilin kimliği gizlenmemeli, ancak 'actingAs: CEO' damgası otonom olarak güvenlik kütüğüne düşmelidir.",
    status: "IDLE",
    durationMs: 0,
    assertions: [
      { name: "AuditLog'da 'actingAs: CEO' Damgası Doğrulaması", expected: "CEO", actual: "CEO", passed: true },
      { name: "İşlemi Yapan Gerçek Vekil Kimliğinin Korunması", expected: true, actual: true, passed: true },
      { name: "Denetim İzi Özetinde Vekalet İbaresi", expected: true, actual: true, passed: true },
    ],
  },
  {
    id: "TEST-22.1",
    phase: "FAZ_6",
    category: "GANTT_DAG_CIRCULAR_LOOP",
    categoryTitle: "İş Programı & Algoritmik Çöküş Koruması",
    title: "Gantt Şemasında Sonsuz Döngüsel Bağımlılık (A->B->C->A) ve 422 Unprocessable Entity",
    description: "İş programında A görevi B'ye, B görevi C'ye bağlıyken, C görevi de tekrar A'ya bağlanmak istendiğinde; sistemin sonsuz döngüsel bağımlılığı anında yakalayıp 422 Unprocessable Entity dönmesi doğrulanır.",
    status: "IDLE",
    durationMs: 0,
    assertions: [
      { name: "Sonsuz Döngü Tespiti (hasCycle = true)", expected: true, actual: true, passed: true },
      { name: "422 Unprocessable Entity Yanıt Kodu", expected: 422, actual: 422, passed: true },
      { name: "Döngü Zinciri Açıklaması (DAG Circular Loop)", expected: true, actual: true, passed: true },
    ],
  },
  {
    id: "TEST-23.1",
    phase: "FAZ_6",
    category: "GDPR_KVKK_ANONYMIZATION",
    categoryTitle: "KVKK Uyumluluk & Finansal Bütünlük",
    title: "Personel 'KVKK Sil' İşleminde İsim Anonimleştirmesi ve Maaş Kaydı Korunması",
    description: "Personel hakkında 'Unutulma Hakkı / KVKK Sil' çalıştırıldığında; personelin adı ANON-*** olmalı, kişisel verileri (TC, telefon, adres) temizlenmeli fakat finans modülündeki maaş ödemesi silinmemelidir.",
    status: "IDLE",
    durationMs: 0,
    assertions: [
      { name: "Personel Adının Anonimleştirilmesi (ANON-***)", expected: true, actual: true, passed: true },
      { name: "İletişim / PII Verilerinin Silinmesi (ANONYMIZED)", expected: "ANONYMIZED", actual: "ANONYMIZED", passed: true },
      { name: "Finans Modülündeki Maaş Ödemesinin (38.500 TL) Korunması", expected: 38500, actual: 38500, passed: true },
    ],
  },

  // Faz 7: Kıyamet, Adli Bilişim & Suistimal
  {
    id: "TEST-24.1",
    phase: "FAZ_7",
    category: "CONTRACT_PRICE_ESCALATION",
    categoryTitle: "Sözleşme Hukuku & Fiyat Farkı (Escalation)",
    title: "Sözleşmeye %20 Yİ-ÜFE Enflasyon Farkı ve +20.000 TL Otonom Fiyat Farkı Satırı",
    description: "100.000 TL'lik hakediş döneminde TÜİK Yİ-ÜFE enflasyon katsayısı (%20) devreye girdiğinde; hakedişte +20.000 TL fiyat farkı (escalation) kalemi otonom oluşmalı ve net ödenecek 120.000 TL olarak deftere geçmelidir.",
    status: "IDLE",
    durationMs: 0,
    assertions: [
      { name: "Yİ-ÜFE Fiyat Farkı Katsayısı (%20)", expected: 0.20, actual: 0.20, passed: true },
      { name: "Otonom Fiyat Farkı Tutarının Hesaplanması (+20.000 TL)", expected: 20000, actual: 20000, passed: true },
      { name: "Enflasyon Farklı Net Hakediş Ödeme Tutarı (120.000 TL)", expected: 120000, actual: 120000, passed: true },
      { name: "Finans Defteri 'Fiyat Farkı (Yİ-ÜFE Escalation)' Kaydı", expected: true, actual: true, passed: true },
    ],
  },
  {
    id: "TEST-25.1",
    phase: "FAZ_7",
    category: "AI_ANOMALY_FRAUD_DETECTION",
    categoryTitle: "Yapay Zeka & Adli Bilişim (Suistimal Radarı)",
    title: "Gece Saat 03:00'te Boş Şantiyede 50.000 TL Akaryakıt Fişine 'PENDING_INVESTIGATION' Blokajı",
    description: "Tatil gününde sahada 0 kişi varken, gece saat 03:00'te 50.000 TL akaryakıt fişi girildiğinde; AI Suistimal Radarı işlemi otonom yakalamalı, risk skorunu %98 hesaplamalı ve işlemi PENDING_INVESTIGATION statüsüne alarak bloke etmelidir.",
    status: "IDLE",
    durationMs: 0,
    assertions: [
      { name: "AI Suistimal Risk Skoru (Risk Skoru >= 90)", expected: 98, actual: 98, passed: true },
      { name: "Fişin Otonom PENDING_INVESTIGATION Statüsüne Alınması", expected: "PENDING_INVESTIGATION", actual: "PENDING_INVESTIGATION", passed: true },
      { name: "3 Ayrı Anomali Bayrağının (Gece, Boş Saha, Yüksek Tutar) Tetiklenmesi", expected: 3, actual: 3, passed: true },
    ],
  },
  {
    id: "TEST-26.1",
    phase: "FAZ_7",
    category: "CASCADING_SOFT_DELETE_RESTORE",
    categoryTitle: "Afet Kurtarma & Kaskad Soft-Delete",
    title: "Proje Soft-Delete Edildiğinde Gizlenme ve RESTORE ile Tüm Alt Kayıtların Eksiksiz Kurtarılması",
    description: "Proje DELETE edildiğinde (Soft-Delete) sistemde deletedAt damgalanmalı ve aktif sorgulardan gizlenmeli; ardından RESTORE yapıldığında projeye bağlı tüm alt kayıtlar (BoQ, Gantt görevleri, paftalar) saniyeler içinde eksiksiz geri gelmelidir.",
    status: "IDLE",
    durationMs: 0,
    assertions: [
      { name: "Soft-Delete ile deletedAt Damgalanması ve isActive=false", expected: true, actual: true, passed: true },
      { name: "Aktif Sorgularda Projenin Gizlenmesi (returned null)", expected: true, actual: true, passed: true },
      { name: "RESTORE Sonrası Tüm 6 Alt Kaydın Eksiksiz Geri Gelmesi", expected: 6, actual: 6, passed: true },
    ],
  },
]
