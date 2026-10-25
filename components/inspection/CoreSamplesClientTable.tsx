/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Karot & Numune QR Takip İstemci Tablo Bileşeni (CRUD + Modallar)
 */

"use client";

import React, { useState } from "react";
import {
  FlaskConical,
  QrCode,
  Search,
  Filter,
  Plus,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Printer,
  Calendar,
  Layers,
  Eye,
  Radio,
  Cpu,
  X,
  ExternalLink,
  Loader2
} from "lucide-react";
import { toast } from "react-hot-toast";
import NewSampleModal from "@/components/inspection/NewSampleModal";
import SampleDetailModal from "@/components/inspection/SampleDetailModal";
import { queryEbisSampleAction } from "@/app/actions/inspection-gov";
import type { EbisCoreSampleGovData } from "@/lib/services/gov-api";

interface CoreSampleRecord {
  id: string;
  qrCode: string;
  projectId: string;
  location: string | null;
  status: string;
  pourDate: string | Date | null;
  testDate: string | Date | null;
  strengthResult: number | null;
  resultStrength?: number | null;
  createdAt: string | Date;
  project?: {
    id: string;
    name: string | null;
    title: string;
    yibfNo: string | null;
    location?: string | null;
  } | null;
  takenBy?: {
    id: string;
    name: string;
    email: string;
  } | null;
}

export default function CoreSamplesClientTable({
  initialSamples,
}: {
  initialSamples: CoreSampleRecord[];
}) {
  const [samples, setSamples] = useState<CoreSampleRecord[]>(initialSamples);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [selectedSample, setSelectedSample] = useState<CoreSampleRecord | null>(null);

  // EBİS Modal State
  const [isEbisModalOpen, setIsEbisModalOpen] = useState(false);
  const [ebisTagInput, setEbisTagInput] = useState("");
  const [ebisLoading, setEbisLoading] = useState(false);
  const [ebisResult, setEbisResult] = useState<EbisCoreSampleGovData | null>(null);
  const [ebisError, setEbisError] = useState<string | null>(null);

  const handleQueryEbis = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ebisTagInput.trim()) {
      setEbisError("Lütfen geçerli bir EBİS RFID Etiket ID giriniz.");
      return;
    }
    setEbisLoading(true);
    setEbisError(null);
    setEbisResult(null);
    try {
      const res = await queryEbisSampleAction(ebisTagInput.trim());
      if (!res.success) {
        setEbisError(res.error || "EBİS numune verisi çekilemedi.");
      } else {
        setEbisResult(res.data || null);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Bakanlık EBİS sistemine erişilemedi.";
      setEbisError(message);
    } finally {
      setEbisLoading(false);
    }
  };

  const filtered = samples.filter((s) => {
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      s.qrCode.toLowerCase().includes(term) ||
      (s.location && s.location.toLowerCase().includes(term)) ||
      (s.project?.title && s.project.title.toLowerCase().includes(term)) ||
      (s.project?.name && s.project.name.toLowerCase().includes(term)) ||
      (s.project?.yibfNo && s.project.yibfNo.toLowerCase().includes(term));
    const matchesStatus = statusFilter === "ALL" || s.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalCount = samples.length;
  const passedCount = samples.filter((s) => s.status === "PASSED").length;
  const waitingCount = samples.filter((s) => s.status !== "PASSED" && s.status !== "FAILED").length;
  const failedCount = samples.filter((s) => s.status === "FAILED").length;

  const handleCreated = (newSample: CoreSampleRecord) => {
    setSamples((prev) => [newSample, ...prev]);
  };

  const handleUpdated = (updatedSample: Partial<CoreSampleRecord> & { id: string }) => {
    setSamples((prev) =>
      prev.map((s) => (s.id === updatedSample.id ? { ...s, ...updatedSample } : s))
    );
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PASSED":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-950/60 text-emerald-400 border border-emerald-800/80">
            <CheckCircle2 className="w-3.5 h-3.5" /> Dayanım Uygun (Geçti)
          </span>
        );
      case "FAILED":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-950/60 text-rose-400 border border-rose-800/80">
            <AlertTriangle className="w-3.5 h-3.5" /> Yetersiz Dayanım (Red)
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-950/60 text-amber-400 border border-amber-800/80">
            <Clock className="w-3.5 h-3.5" /> Kırım Bekleniyor
          </span>
        );
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Üst Başlık & Butonlar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800/80 pb-5">
        <div>
          <div className="flex items-center gap-2 text-blue-400 text-xs font-semibold uppercase tracking-wider mb-1">
            <FlaskConical className="w-4 h-4" />
            <span>TÜRKAK Akredite Laboratuvar Takibi</span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Karot & Numune QR Takip</h1>
          <p className="text-slate-400 text-sm mt-0.5">
            Beton döküm esnasında alınan silindir/küp numunelerin RFID/QR ile kırım basınç dayanımı takibi (Prisma)
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => {
              setEbisResult(null);
              setEbisError(null);
              setIsEbisModalOpen(true);
            }}
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-600/50 text-xs font-semibold shadow-sm transition cursor-pointer"
          >
            <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
            <span>EBİS Çipli Beton RFID</span>
          </button>

          <button
            onClick={() => setIsNewModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Yeni Numune Al & QR Ekle</span>
          </button>

          <button
            onClick={() => toast.success("Toplu Numune QR Barkodları Yazdırılıyor...", { icon: "🖨️" })}
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-medium border border-slate-700 transition cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Toplu Barkod Bas</span>
          </button>
        </div>
      </div>

      {/* KPI Kartları */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
          <div className="text-slate-400 text-xs font-medium">Toplam Numune</div>
          <div className="text-2xl font-bold text-white mt-1">{totalCount} Adet</div>
          <div className="text-[11px] text-blue-400 mt-1 flex items-center gap-1">
            <Layers className="w-3 h-3" /> Veritabanı Kayıtlı
          </div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
          <div className="text-slate-400 text-xs font-medium">Dayanımı Geçen (Uygun)</div>
          <div className="text-2xl font-bold text-emerald-400 mt-1">{passedCount} Adet</div>
          <div className="text-[11px] text-emerald-400/80 mt-1">Hakedişe esas kabul</div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
          <div className="text-slate-400 text-xs font-medium">Kırım Testi Bekleyen</div>
          <div className="text-2xl font-bold text-amber-400 mt-1">{waitingCount} Adet</div>
          <div className="text-[11px] text-amber-400/80 mt-1">Kür havuzunda bekletiliyor</div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
          <div className="text-slate-400 text-xs font-medium">Yetersiz Dayanım (Red)</div>
          <div className="text-2xl font-bold text-rose-400 mt-1">{failedCount} Adet</div>
          <div className="text-[11px] text-rose-400/80 mt-1">Karot testi talep edildi</div>
        </div>
      </div>

      {/* Arama ve Filtre */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="QR Barkod No, Proje Adı veya Eleman Konumu ara..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-900/80 border border-slate-800 rounded-lg pl-9 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-400 shrink-0" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-900/80 border border-slate-800 rounded-lg px-3 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500 transition"
          >
            <option value="ALL">Tüm Durumlar ({samples.length})</option>
            <option value="PASSED">Dayanım Uygun (Geçti)</option>
            <option value="WAITING_TEST">Kırım Bekleyenler</option>
            <option value="FAILED">Yetersiz Dayanım (Red)</option>
          </select>
        </div>
      </div>

      {/* Numune Tablosu */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">QR Barkod No</th>
                <th className="py-3 px-4">Proje & Yapı Elemanı</th>
                <th className="py-3 px-4">Döküm Tarihi</th>
                <th className="py-3 px-4">Kırım Basınç Dayanımı</th>
                <th className="py-3 px-4">Sonuç Durumu</th>
                <th className="py-3 px-4 text-right">Eylem</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {filtered.map((s) => {
                const strength = s.strengthResult ?? s.resultStrength;
                return (
                  <tr key={s.id} className="hover:bg-slate-800/40 transition">
                    <td className="py-3.5 px-4">
                      <div className="font-mono text-xs font-semibold text-blue-400 flex items-center gap-2">
                        <QrCode className="w-3.5 h-3.5 text-slate-400" />
                        <span>{s.qrCode}</span>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        Alınış: {new Date(s.createdAt).toLocaleDateString("tr-TR")}
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-white truncate max-w-xs">
                        {s.project?.title || s.project?.name || "Proje Bilgisi Yok"}
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        {s.location || "Yapı Elemanı"} • YİBF: {s.project?.yibfNo || "—"}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-slate-300">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-500" />
                        <span>{s.pourDate ? new Date(s.pourDate).toLocaleDateString("tr-TR") : "—"}</span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      {strength !== null && strength !== undefined ? (
                        <div className="font-bold text-white text-sm font-mono">
                          {strength} MPa
                        </div>
                      ) : (
                        <span className="text-slate-500 italic text-[11px]">Henüz Test Edilmedi</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4">
                      {getStatusBadge(s.status)}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => setSelectedSample(s)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-blue-600/20 hover:bg-blue-600/40 text-blue-400 hover:text-blue-200 border border-blue-700/50 text-xs font-semibold transition cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Sonuç Gir / İncele</span>
                      </button>
                    </td>
                  </tr>
                );
              })}

              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <FlaskConical className="w-8 h-8 mx-auto text-slate-600 mb-2" />
                    <p className="text-sm font-medium">Kriterlere uygun beton numunesi bulunamadı.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Yeni Numune Modalı */}
      <NewSampleModal
        isOpen={isNewModalOpen}
        onClose={() => setIsNewModalOpen(false)}
        onSuccess={handleCreated}
      />

      {/* Detay & Kırım Sonuç Modalı */}
      <SampleDetailModal
        sample={selectedSample}
        isOpen={!!selectedSample}
        onClose={() => setSelectedSample(null)}
        onStatusUpdated={handleUpdated}
      />

      {/* EBİS Çipli Beton RFID Sorgu Modalı */}
      {isEbisModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-xl rounded-2xl border border-slate-800 bg-slate-950 p-6 shadow-2xl space-y-5">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-slate-800/80 pb-4">
              <div>
                <div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-1">
                  <Radio className="w-4 h-4 animate-pulse" />
                  <span>EBİS - Elektronik Beton İzleme Sistemi</span>
                </div>
                <h3 className="text-lg font-bold text-white tracking-tight">Çipli Beton RFID Laboratuvar Kırımı</h3>
                <p className="text-slate-400 text-xs mt-0.5">
                  T.C. ÇŞİDB Akredite Yapı Laboratuvarı 7/28 günlük basınç dayanımı sonuçları
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsEbisModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleQueryEbis} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-slate-300">
                  EBİS RFID Çip / Barkod Kodu
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    required
                    placeholder="Örn: EBIS-TR-904128"
                    value={ebisTagInput}
                    onChange={(e) => setEbisTagInput(e.target.value)}
                    disabled={ebisLoading}
                    className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition font-mono tracking-wider disabled:opacity-50"
                  />
                  <button
                    type="submit"
                    disabled={ebisLoading || !ebisTagInput.trim()}
                    className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition disabled:opacity-50 cursor-pointer shadow-sm"
                  >
                    {ebisLoading ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Sorgulanıyor...</span>
                      </>
                    ) : (
                      <>
                        <Cpu className="w-3.5 h-3.5" />
                        <span>Sorgula</span>
                      </>
                    )}
                  </button>
                </div>
                <div className="flex items-center gap-1.5 text-[11px] text-slate-400 pt-1">
                  <span className="text-slate-500">Örnek RFID Çipleri:</span>
                  {["EBIS-TR-904128", "EBIS-TR-812049", "EBIS-TR-402911"].map((code) => (
                    <button
                      key={code}
                      type="button"
                      onClick={() => setEbisTagInput(code)}
                      className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono transition text-[10px]"
                    >
                      {code}
                    </button>
                  ))}
                </div>
              </div>

              {/* Hata */}
              {ebisError && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-rose-950/60 border border-rose-900/80 text-rose-400 text-xs">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{ebisError}</span>
                </div>
              )}

              {/* Sonuç Kartı */}
              {ebisResult && (
                <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/80 space-y-4 animate-in fade-in">
                  <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                    <div>
                      <div className="text-[11px] text-slate-400">Çip / Barkod Seri No</div>
                      <div className="font-mono text-xs font-bold text-white mt-0.5">
                        {ebisResult.cipSeriNo} • {ebisResult.barkodNo}
                      </div>
                    </div>
                    <div>
                      {ebisResult.onayDurumu === "ONAYLANDI" ? (
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-950/80 text-emerald-400 border border-emerald-800">
                          <CheckCircle2 className="w-3.5 h-3.5" /> ONAYLANDI (UYGUN)
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-rose-950/80 text-rose-400 border border-rose-800">
                          <AlertTriangle className="w-3.5 h-3.5" /> DAYANIM YETERSİZ (RED)
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Kırım Değerleri */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800">
                      <div className="text-[11px] text-slate-400 font-medium">7 Günlük Kırım Dayanımı</div>
                      <div className="text-xl font-extrabold text-blue-400 font-mono mt-1">
                        {ebisResult.kirimSonuclari.yediGunluk.basincDayanimiMpa} MPa
                      </div>
                      <div className="text-[10px] text-slate-400 mt-1">
                        Hedef Oran: %{ebisResult.kirimSonuclari.yediGunluk.hedefOranYuzde} • {ebisResult.kirimSonuclari.yediGunluk.durum}
                      </div>
                    </div>

                    <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800">
                      <div className="text-[11px] text-slate-400 font-medium">28 Günlük Nihai Kırım</div>
                      <div className="text-xl font-extrabold text-emerald-400 font-mono mt-1">
                        {ebisResult.kirimSonuclari.yirmisekizGunluk.basincDayanimiMpa} MPa
                      </div>
                      <div className="text-[10px] text-slate-400 mt-1">
                        Hedef: {ebisResult.betonSinifi} (≥ {ebisResult.tasarimDayanimiMpa} MPa)
                      </div>
                    </div>
                  </div>

                  {/* Detaylar */}
                  <div className="text-xs space-y-1.5 text-slate-300 pt-1">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Santral & İrsaliye:</span>
                      <span className="font-medium text-slate-200">{ebisResult.santralAdi} ({ebisResult.irsaliyeNo})</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Mikser Plaka & Döküm:</span>
                      <span className="font-mono text-slate-200">{ebisResult.mikserPlaka} • {ebisResult.dokumTarihi} {ebisResult.numuneAlmaSaati}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Yetkili Laboratuvar:</span>
                      <span className="text-slate-200 truncate max-w-xs">{ebisResult.laboratuvar.labAdi}</span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
                    <a
                      href={ebisResult.bakanlikKarekod}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 text-[11px] text-emerald-400 hover:text-emerald-300 font-medium"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Bakanlık e-Devlet Karekodunu Doğrula</span>
                    </a>
                  </div>
                </div>
              )}

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setIsEbisModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition cursor-pointer"
                >
                  Kapat
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

