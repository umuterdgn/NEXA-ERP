/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Bakanlık e-YİBF Senkronizasyon & RPA Entegrasyon Terminali
 */

"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Bot,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Send,
  Terminal,
  ShieldCheck,
  Lock,
  KeyRound,
  FileSpreadsheet,
  Building,
  ArrowUpRight
} from "lucide-react";
import { toast } from "react-hot-toast";
import TwoFactorModal from "@/components/rpa/TwoFactorModal";

interface SyncJob {
  id: string;
  action: string;
  yibfNo: string;
  projectName: string;
  queuedAt: string;
  status: "QUEUED" | "SYNCING" | "COMPLETED" | "FAILED";
  retryCount: number;
}

const mockSyncJobs: SyncJob[] = [
  {
    id: "JOB-101",
    action: "4. Seviye Hakediş Dosyası İletimi",
    yibfNo: "2024-001",
    projectName: "Mavi Vadi Konutları A Blok",
    queuedAt: "10:45",
    status: "COMPLETED",
    retryCount: 0
  },
  {
    id: "JOB-102",
    action: "Beton Kırım Raporları Otomatik Yükleme",
    yibfNo: "2024-001",
    projectName: "Mavi Vadi Konutları A Blok",
    queuedAt: "11:15",
    status: "COMPLETED",
    retryCount: 0
  },
  {
    id: "JOB-103",
    action: "Şantiye Şefi Değişiklik Bildirimi",
    yibfNo: "2024-002",
    projectName: "Kuzey Plaza Ticaret Merkezi",
    queuedAt: "12:00",
    status: "SYNCING",
    retryCount: 1
  },
  {
    id: "JOB-104",
    action: "Donatı Vize Tutanağı XML Gönderimi",
    yibfNo: "2024-003",
    projectName: "Boğaziçi Yaşam Evleri C Blok",
    queuedAt: "13:20",
    status: "QUEUED",
    retryCount: 0
  }
];

export default function YibfSyncTerminalPage() {
  const [isSyncing, setIsSyncing] = useState(false);
  const [twoFactorModalOpen, setTwoFactorModalOpen] = useState(false);
  const [activeRpaSessionId, setActiveRpaSessionId] = useState("");
  const [consoleLogs, setConsoleLogs] = useState<string[]>([
    "[SYSTEM] e-YİBF Entegrasyon Servisi Başlatıldı (Versiyon 4.2.1-TR)",
    "[RPA] Bakanlık e-Devlet Kimlik Doğrulama Gateway Aktif.",
    "[CERT] TÜBİTAK UEKAE Nitelikli Elektronik İmza Kartı Takılı (Sertifika Geçerli).",
    "[SYNC] Son başarılı periyodik kontrol: 10 dakika önce (24 yapı tarandı).",
    "[IDLE] RPA Botu kuyruktaki yeni görevleri dinliyor..."
  ]);

  const handleTriggerSync = async () => {
    setIsSyncing(true);
    setConsoleLogs(prev => [
      `[${new Date().toLocaleTimeString()}] [SYNC_START] Kullanıcı manuel tetikleme başlattı...`,
      ...prev
    ]);

    try {
      const res = await fetch("/api/yibf/rpa-sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.requiresTwoFactor || data.status === "AWAITING_2FA") {
          setActiveRpaSessionId(data.sessionId);
          setTwoFactorModalOpen(true);
          setConsoleLogs(prev => [
            `[${new Date().toLocaleTimeString()}] [2FA_REQUIRED] Bakanlık SMS Doğrulama Kodu İstendi (Session: ${data.sessionId}).`,
            ...prev
          ]);
        } else {
          toast.success("Bakanlık e-YİBF portaliyle tam senkronizasyon sağlandı!", { icon: "🏛️" });
          setConsoleLogs(prev => [
            `[${new Date().toLocaleTimeString()}] [SUCCESS] 24 YİBF kaydı başarıyla doğrulandı ve güncellendi.`,
            ...prev
          ]);
        }
      } else {
        toast.error("Bakanlık botuna erişilemedi.");
        setConsoleLogs(prev => [
          `[${new Date().toLocaleTimeString()}] [ERROR] HTTP 500: Bakanlık YİBF sunucusu yanıt vermedi. Yeniden denenecek.`,
          ...prev
        ]);
      }
    } catch {
      toast.error("Ağ bağlantı hatası oluştu.");
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Üst Başlık */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800/80 pb-5">
        <div>
          <div className="flex items-center gap-2 text-blue-400 text-xs font-semibold uppercase tracking-wider mb-1">
            <Bot className="w-4 h-4" />
            <span>RPA Bot & Otomasyon Gateway</span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">e-YİBF Senkronizasyon Terminali</h1>
          <p className="text-slate-400 text-sm mt-0.5">
            Bakanlık Yapı Denetim Bilgi Sistemi (e-YİBF) ile çift yönlü otomatik veri aktarımı ve XML vize gönderimi
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleTriggerSync}
            disabled={isSyncing}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-sm transition cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isSyncing ? "animate-spin text-white" : ""}`} />
            <span>{isSyncing ? "Bakanlığa Bağlanıyor..." : "Şimdi Senkronize Et"}</span>
          </button>
        </div>
      </div>

      {/* Durum Göstergeleri */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 flex items-center justify-between">
          <div>
            <div className="text-xs font-medium text-slate-400">Bakanlık e-Devlet Gateway</div>
            <div className="text-lg font-bold text-white mt-1 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>Bağlantı Aktif</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-1">Gecikme Süresi: 48 ms (Kadıköy)</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-950/50 border border-emerald-800/60 flex items-center justify-center text-emerald-400">
            <ShieldCheck className="w-5 h-5" />
          </div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 flex items-center justify-between">
          <div>
            <div className="text-xs font-medium text-slate-400">Elektronik İmza (e-İmza)</div>
            <div className="text-lg font-bold text-white mt-1 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-400" />
              <span>TÜBİTAK UEKAE</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-1">Sertifika Bitiş: 14.11.2027</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-950/50 border border-blue-800/60 flex items-center justify-center text-blue-400">
            <KeyRound className="w-5 h-5" />
          </div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 flex items-center justify-between">
          <div>
            <div className="text-xs font-medium text-slate-400">Kuyruktaki Senkronizasyon</div>
            <div className="text-lg font-bold text-amber-400 mt-1 flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-400" />
              <span>1 Bekleyen Görev</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-1">Son aktarım: 14:32 (Başarılı)</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-950/50 border border-amber-800/60 flex items-center justify-center text-amber-400">
            <FileSpreadsheet className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Terminal Log Ekranı */}
      <div className="rounded-xl border border-slate-800 bg-slate-950 overflow-hidden shadow-md">
        <div className="bg-slate-900/90 border-b border-slate-800 px-4 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-mono text-slate-300">
            <Terminal className="w-4 h-4 text-emerald-400" />
            <span>Bakanlık RPA Otomasyon Konsolu (Live Stream)</span>
          </div>
          <span className="text-[10px] text-slate-400 font-mono">STDOUT / JSON-RPC</span>
        </div>

        <div className="p-4 font-mono text-xs text-slate-300 space-y-1.5 max-h-52 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-800">
          {consoleLogs.map((log, index) => (
            <div key={index} className="leading-relaxed">
              <span className="text-emerald-400 font-bold">$</span>{" "}
              <span className={log.includes("[ERROR]") ? "text-rose-400" : log.includes("[SUCCESS]") ? "text-emerald-300" : log.includes("[2FA_REQUIRED]") ? "text-amber-300" : "text-slate-300"}>
                {log}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Senkronizasyon Kuyruğu Tablosu */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 overflow-hidden shadow-sm">
        <div className="px-4 py-3 border-b border-slate-800 bg-slate-950/40">
          <h2 className="text-sm font-semibold text-white">Bakanlık İletim Kuyruğu ve İşlem Geçmişi</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">İşlem / Görev Adı</th>
                <th className="py-3 px-4">YİBF No / Proje</th>
                <th className="py-3 px-4">Kuyruk Zamanı</th>
                <th className="py-3 px-4">Durum</th>
                <th className="py-3 px-4 text-right">Eylem</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {mockSyncJobs.map((job) => (
                <tr key={job.id} className="hover:bg-slate-800/40 transition">
                  <td className="py-3.5 px-4 font-semibold text-white">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-blue-400">{job.id}</span>
                      <span>—</span>
                      <span>{job.action}</span>
                    </div>
                  </td>

                  <td className="py-3.5 px-4">
                    <div className="text-slate-200 font-medium">{job.projectName}</div>
                    <div className="text-[11px] text-slate-400">YİBF: {job.yibfNo}</div>
                  </td>

                  <td className="py-3.5 px-4 text-slate-400">
                    <span>{job.queuedAt}</span>
                  </td>

                  <td className="py-3.5 px-4">
                    {job.status === "COMPLETED" && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-950/60 text-emerald-400 border border-emerald-800/80">
                        <CheckCircle2 className="w-3.5 h-3.5" /> İletildi & Onaylandı
                      </span>
                    )}
                    {job.status === "SYNCING" && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-950/60 text-blue-400 border border-blue-800/80">
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" /> İletiliyor...
                      </span>
                    )}
                    {job.status === "QUEUED" && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-950/60 text-amber-400 border border-amber-800/80">
                        <Clock className="w-3.5 h-3.5" /> Kuyrukta Bekliyor
                      </span>
                    )}
                  </td>

                  <td className="py-3.5 px-4 text-right">
                    <button
                      onClick={() => toast.success(`Görev Logu İnceleniyor: ${job.id}`, { icon: "🔍" })}
                      className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs transition cursor-pointer"
                    >
                      Ayrıntı
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <TwoFactorModal
        isOpen={twoFactorModalOpen}
        onClose={() => setTwoFactorModalOpen(false)}
        sessionId={activeRpaSessionId}
        onSuccess={() => {
          toast.success("e-Devlet 2FA Doğrulandı! Senkronizasyon Başlatıldı.", { icon: "🎉" });
          setTwoFactorModalOpen(false);
          setConsoleLogs(prev => [
            `[${new Date().toLocaleTimeString()}] [2FA_AUTH_SUCCESS] SMS şifresi onaylandı, oturum anahtarı yenilendi.`,
            ...prev
          ]);
        }}
      />
    </div>
  );
}
