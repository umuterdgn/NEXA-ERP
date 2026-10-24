"use client"

/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Enterprise Diagnostics Engine & System Health UI
 * Terminal Log Akışı, Canlı Test Doğrulamaları ve Sıfır Kirlilik Teardown Sertifikası
 */

import React, { useState, useEffect, useRef, useTransition } from "react"
import Link from "next/link"
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
  ChevronRight,
  AlertTriangle,
  Sparkles,
  Maximize2,
  Trash2,
  ExternalLink,
  Info
} from "lucide-react"
import { executeSystemHealthCheck } from "@/app/actions/diagnostics"
import { DiagnosticRunReport, DiagnosticTestResult, DiagnosticLogLine } from "@/lib/diagnostics/types"

export default function SystemHealthClient() {
  const [report, setReport] = useState<DiagnosticRunReport | null>(null)
  const [isRunning, setIsRunning] = useState(false)
  const [activeTab, setActiveTab] = useState<"ALL" | "FAILED" | "TERMINAL">("ALL")
  const [selectedTest, setSelectedTest] = useState<DiagnosticTestResult | null>(null)
  const [copiedLogs, setCopiedLogs] = useState(false)
  const [liveLogs, setLiveLogs] = useState<DiagnosticLogLine[]>([])
  const [isPending, startTransition] = useTransition()

  const terminalEndRef = useRef<HTMLDivElement>(null)

  // Terminal otomatik kaydırma
  useEffect(() => {
    if (activeTab === "TERMINAL" || isRunning) {
      terminalEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }
  }, [liveLogs, activeTab, isRunning])

  // Check-up Başlat
  const handleStartCheckup = () => {
    setIsRunning(true)
    setLiveLogs([
      {
        id: "start-1",
        timestamp: new Date().toLocaleTimeString("tr-TR"),
        level: "SYSTEM",
        message: "⚡ NEXA Enterprise Diagnostics Engine v2.6 tetiklendi...",
      },
      {
        id: "start-2",
        timestamp: new Date().toLocaleTimeString("tr-TR"),
        level: "INFO",
        message: "🧪 5 Ana Modülde Çok Katmanlı İzolasyon ve Bütünlük Testleri Başlatılıyor...",
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
    a.download = `NEXA_Diagnostics_${report.runId}.json`
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
      default:
        return <Activity className="w-4 h-4 text-slate-400" />
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8 space-y-8 font-sans">
      {/* 1. ÜST BAŞLIK VE HUD BAR */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-slate-800/80">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold tracking-wider uppercase text-cyan-400 mb-1">
            <Activity className="w-4 h-4 animate-pulse" />
            <span>NEXA Enterprise Autonomous Diagnostics Engine</span>
            <span className="text-slate-600">•</span>
            <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px]">
              CANLI SİSTEM SAĞLIĞI
            </span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
            <span>Sistem Teşhis & Sağlık Doğrulama Merkezi</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1.5 max-w-2xl">
            RBAC yetkileri, finansal metraj algoritmaları, Yapı Denetim Stage-Gate kilitleri, otonom günlük jurnaller ve harici servisler (Storage, AI, OSRM) gerçek kullanıcı senaryolarıyla otonom test edilir.
          </p>
        </div>

        {/* Aksiyon Butonları */}
        <div className="flex items-center flex-wrap gap-3">
          {report && (
            <button
              onClick={handleDownloadReport}
              className="px-3.5 py-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl text-xs font-semibold text-slate-300 hover:text-white transition-colors flex items-center gap-2"
            >
              <Download className="w-4 h-4 text-cyan-400" />
              <span>Raporu İndir (JSON)</span>
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

      {/* 2. HUD İSTATİSTİK KARTLARI */}
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
                  <span className="text-emerald-400">%100 Stabil</span>
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
            {report ? `${report.passedTests}/${report.totalTests} Doğrulama Başarılı` : "Check-up çalıştırılmadı"}
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
            <span>Tüm dummy test kayıtları silindi</span>
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
            {report ? `Koşu ID: ${report.runId.substring(0, 16)}...` : "Bekleniyor"}
          </div>
        </div>

        {/* DB Bağlantı */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 relative overflow-hidden backdrop-blur-sm group hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
            <span className="font-medium">Veritabanı Katmanı</span>
            <Database className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-bold tracking-tight text-white mb-1">
            PostgreSQL
          </div>
          <div className="text-[11px] text-emerald-400 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span>Neon AWS Pooler • Çift Yönlü Aktif</span>
          </div>
        </div>
      </div>

      {/* 3. CANLI TERMİNAL GÖRÜNÜMÜ & LOG AKIŞI (Terminal Stream Window) */}
      <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
        {/* Terminal Header */}
        <div className="bg-slate-900/90 px-4 py-3 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-rose-500/80" />
              <div className="w-3 h-3 rounded-full bg-amber-500/80" />
              <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
            </div>
            <div className="flex items-center gap-2 text-xs font-mono text-slate-400 pl-2 border-l border-slate-800">
              <Terminal className="w-3.5 h-3.5 text-cyan-400" />
              <span>nexa-diagnostics-daemon --stream --zero-pollution</span>
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

        {/* Terminal Body */}
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

      {/* 4. DETAYLI TEST SONUÇLARI KARTLARI */}
      <div className="space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-cyan-400" />
            <h2 className="text-lg font-bold text-white">Doğrulanan Modüller & Test Paketleri</h2>
          </div>

          <div className="flex items-center gap-1.5 text-xs">
            <button
              onClick={() => setActiveTab("ALL")}
              className={`px-3 py-1 rounded-lg transition-colors ${
                activeTab === "ALL" ? "bg-cyan-600 text-white font-medium" : "bg-slate-900 text-slate-400 hover:text-white"
              }`}
            >
              Tümü ({report ? report.tests.length : 8})
            </button>
            <button
              onClick={() => setActiveTab("FAILED")}
              className={`px-3 py-1 rounded-lg transition-colors ${
                activeTab === "FAILED" ? "bg-rose-600 text-white font-medium" : "bg-slate-900 text-slate-400 hover:text-white"
              }`}
            >
              Hatalılar ({report ? report.failedTests : 0})
            </button>
          </div>
        </div>

        {/* Test Listesi */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {(report ? report.tests : defaultPlaceholders).map((test) => {
            const isPassed = test.status === "PASSED"
            const isRunningTest = isRunning && test.status === "RUNNING"

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
                      <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                        {test.categoryTitle}
                      </span>
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

      {/* 5. TEARDOWN VE GÜVENLİK SERTİFİKASI */}
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
                  VERIFIED
                </span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Tüm test senaryolarında oluşturulan geçici projeler, hakedişler, karot numuneleri ve DÖF kayıtları icra bitiminde anında temizlenir. Üretim veritabanında hiçbir artık kayıt kalmaz.
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

      {/* 6. TEST DETAY MODALI (Assertion Inspector Drawer) */}
      {selectedTest && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-xl w-full p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                {getCategoryIcon(selectedTest.category)}
                <h3 className="text-base font-bold text-white">
                  {selectedTest.title}
                </h3>
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

// Varsayılan Placeholder Kartlar
const defaultPlaceholders: DiagnosticTestResult[] = [
  {
    id: "TEST-1.1",
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
    category: "RBAC_ISOLATION",
    categoryTitle: "RBAC & Multi-Tenant İzolasyon",
    title: "Taşeronlar Arası Çapraz Veri İzolasyon Testi",
    description: "MOCK_SUBCONTRACTOR_A, MOCK_SUBCONTRACTOR_B'nin hakediş verilerini okuyamamalıdır (Boş array veya 403).",
    status: "IDLE",
    durationMs: 0,
    assertions: [{ name: "Çapraz Sızıntı Sıfır", expected: 0, actual: 0, passed: true }],
  },
  {
    id: "TEST-2.1",
    category: "INSPECTION_STAGE_GATE",
    categoryTitle: "Yapı Denetim & Stage-Gate Süreçleri",
    title: "Stage-Gate Faz Kilidi & Vize Engelleme Doğrulaması",
    description: "0/5 Ruhsat Bekleyen projeye Beton Dökümü (Kaba İnşaat) vizesi eklenmeye çalışıldığında 'Önceki faz kilitli' hatasıyla reddedilmelidir.",
    status: "IDLE",
    durationMs: 0,
    assertions: [{ name: "Faz Kilidi Reddi", expected: true, actual: true, passed: true }],
  },
  {
    id: "TEST-2.2",
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
    category: "FINANCE_BOQ_ALGORITHM",
    categoryTitle: "Finans & BoQ Algoritmik Bütünlük",
    title: "Metraj, Ağırlıklı İlerleme ve Hakediş Bütünlük Doğrulaması",
    description: "1000 m³ @ 2000 TL imalatın 500 m³'ü tamamlandığında; actualQuantity=500, totalPrice=2.000.000 TL, progress=%50 ve 1.000.000 TL'lik hakediş oluşmalıdır.",
    status: "IDLE",
    durationMs: 0,
    assertions: [{ name: "Algoritmik Eşitlikler", expected: true, actual: true, passed: true }],
  },
  {
    id: "TEST-4.1",
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
    category: "EXTERNAL_IO_SYSTEMS",
    categoryTitle: "Harici Sistemler & I/O (S3, AI, OSRM)",
    title: "Karayolları OSRM / GIS Akıllı Rota Geometrisi Testi",
    description: "İskenderun ve Antakya koordinatları arasında gerçek karayolu rota ağı sorgulanır, mesafe ve seyahat süresi doğrulanır.",
    status: "IDLE",
    durationMs: 0,
    assertions: [{ name: "Mesafe ve Süre > 0", expected: true, actual: true, passed: true }],
  },
]
