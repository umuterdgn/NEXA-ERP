/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Karot & Numune QR Takip Terminali (Yapı Denetim Modülü)
 */

"use client";

import React, { useState } from "react";
import Link from "next/link";
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
  FileCheck,
  Building,
  Calendar,
  Layers,
  ArrowRight,
  TrendingUp
} from "lucide-react";
import { toast } from "react-hot-toast";

interface ConcreteSample {
  id: string;
  qrCode: string;
  yibfNo: string;
  projectName: string;
  blockFloor: string;
  element: string; // "Kolon", "Kiriş", "Perde", "Temel", "Döşeme"
  concreteClass: "C25/30" | "C30/37" | "C35/45" | "C40/50";
  samplingDate: string;
  day7Strength: number | null; // MPa
  day28Strength: number | null; // MPa
  targetStrength: number; // MPa
  labName: string;
  status: "PENDING_7DAY" | "PENDING_28DAY" | "PASSED" | "FAILED";
}

const mockSamples: ConcreteSample[] = [
  {
    id: "1",
    qrCode: "NXA-SPL-2024-8841",
    yibfNo: "2024-001",
    projectName: "Mavi Vadi Konutları A Blok",
    blockFloor: "3. Kat",
    element: "Kolon & Perde Grubu",
    concreteClass: "C30/37",
    samplingDate: "2026-10-16",
    day7Strength: 24.8,
    day28Strength: 33.2,
    targetStrength: 30.0,
    labName: "Boğaziçi Zemin & Beton Laboratuvarı",
    status: "PASSED"
  },
  {
    id: "2",
    qrCode: "NXA-SPL-2024-8842",
    yibfNo: "2024-001",
    projectName: "Mavi Vadi Konutları A Blok",
    blockFloor: "4. Kat",
    element: "Tabliye & Kiriş Betonu",
    concreteClass: "C30/37",
    samplingDate: "2026-10-21",
    day7Strength: 22.4,
    day28Strength: null,
    targetStrength: 30.0,
    labName: "Boğaziçi Zemin & Beton Laboratuvarı",
    status: "PENDING_28DAY"
  },
  {
    id: "3",
    qrCode: "NXA-SPL-2024-8843",
    yibfNo: "2024-002",
    projectName: "Kuzey Plaza Ticaret Merkezi",
    blockFloor: "Bodrum 2. Kat",
    element: "Radye Temel Betonu",
    concreteClass: "C35/45",
    samplingDate: "2026-10-23",
    day7Strength: null,
    day28Strength: null,
    targetStrength: 35.0,
    labName: "Marmara Akredite Test A.Ş.",
    status: "PENDING_7DAY"
  },
  {
    id: "4",
    qrCode: "NXA-SPL-2024-8844",
    yibfNo: "2024-003",
    projectName: "Boğaziçi Yaşam Evleri C Blok",
    blockFloor: "Zemin Kat",
    element: "P101-P104 Perde Duvarları",
    concreteClass: "C25/30",
    samplingDate: "2026-09-25",
    day7Strength: 17.2,
    day28Strength: 23.1,
    targetStrength: 25.0,
    labName: "Kadıköy Yapı Denetim Lab.",
    status: "FAILED"
  }
];

export default function CoreSamplesPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [scanning, setScanning] = useState(false);

  const filteredSamples = mockSamples.filter(s => {
    const matchesSearch =
      s.qrCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.projectName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.yibfNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.element.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "ALL" || s.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleSimulateScan = () => {
    setScanning(true);
    toast("Kamera QR Okuyucu Açılıyor...", { icon: "📷" });
    setTimeout(() => {
      setScanning(false);
      toast.success("Numune QR Kodu Doğrulandı: NXA-SPL-2024-8842", { icon: "✅" });
    }, 1200);
  };

  const getStatusBadge = (status: ConcreteSample["status"]) => {
    switch (status) {
      case "PASSED":
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-950/60 text-emerald-400 border border-emerald-800/80"><CheckCircle2 className="w-3.5 h-3.5" /> Dayanım Uygun (Geçti)</span>;
      case "FAILED":
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-950/60 text-rose-400 border border-rose-800/80"><AlertTriangle className="w-3.5 h-3.5" /> Yetersiz Dayanım (Red)</span>;
      case "PENDING_7DAY":
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-950/60 text-blue-400 border border-blue-800/80"><Clock className="w-3.5 h-3.5" /> 7. Gün Kırımı Bekleniyor</span>;
      case "PENDING_28DAY":
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-950/60 text-amber-400 border border-amber-800/80"><Clock className="w-3.5 h-3.5" /> 28. Gün Kırımı Bekleniyor</span>;
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
            Beton döküm esnasında alınan silindir/küp numunelerin RFID/QR ile kırım basınç dayanımı takibi
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleSimulateScan}
            disabled={scanning}
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-sm transition cursor-pointer"
          >
            <QrCode className="w-4 h-4" />
            <span>{scanning ? "Taranıyor..." : "Saha QR Tara"}</span>
          </button>

          <button
            onClick={() => toast.success("Toplu QR Barkodları Yazdırılıyor...", { icon: "🖨️" })}
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-medium border border-slate-700 transition cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Toplu QR Yazdır</span>
          </button>
        </div>
      </div>

      {/* KPI Kartları */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
          <div className="text-slate-400 text-xs font-medium">Toplam Alınan Numune</div>
          <div className="text-2xl font-bold text-white mt-1">128 Adet</div>
          <div className="text-[11px] text-emerald-400 mt-1 flex items-center gap-1">
            <TrendingUp className="w-3 h-3" /> %97.6 Uygunluk Oranı
          </div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
          <div className="text-slate-400 text-xs font-medium">7 Günlük Kırım Bekleyen</div>
          <div className="text-2xl font-bold text-blue-400 mt-1">12 Numune</div>
          <div className="text-[11px] text-blue-400/80 mt-1">Kür havuzunda bekletiliyor</div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
          <div className="text-slate-400 text-xs font-medium">28 Günlük Nihai Kırım Bekleyen</div>
          <div className="text-2xl font-bold text-amber-400 mt-1">18 Numune</div>
          <div className="text-[11px] text-amber-400/80 mt-1">Hakediş vizesi için kritik</div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
          <div className="text-slate-400 text-xs font-medium">Uygunsuz (Red) Numune</div>
          <div className="text-2xl font-bold text-rose-400 mt-1">1 Adet</div>
          <div className="text-[11px] text-rose-400/80 mt-1">Karot testi talep edildi</div>
        </div>
      </div>

      {/* Arama ve Filtreleme */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="QR Kod, YİBF No, Proje veya Yapı Elemanı ara..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-900/80 border border-slate-800 rounded-lg pl-9 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-400 shrink-0" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-900/80 border border-slate-800 rounded-lg px-3 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
          >
            <option value="ALL">Tüm Durumlar</option>
            <option value="PASSED">Dayanım Uygun (Geçti)</option>
            <option value="PENDING_28DAY">28. Gün Bekleyen</option>
            <option value="PENDING_7DAY">7. Gün Bekleyen</option>
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
                <th className="py-3 px-4">QR Kod / Numune Bilgisi</th>
                <th className="py-3 px-4">Proje & Kat / Eleman</th>
                <th className="py-3 px-4">Beton Sınıfı</th>
                <th className="py-3 px-4">7 Gün Dayanım (MPa)</th>
                <th className="py-3 px-4">28 Gün Dayanım (MPa)</th>
                <th className="py-3 px-4">Sonuç Durumu</th>
                <th className="py-3 px-4 text-right">Rapor</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {filteredSamples.map((sample) => (
                <tr key={sample.id} className="hover:bg-slate-800/40 transition">
                  <td className="py-3.5 px-4">
                    <div className="font-mono text-xs font-semibold text-blue-400 flex items-center gap-2">
                      <QrCode className="w-3.5 h-3.5 text-slate-400" />
                      <span>{sample.qrCode}</span>
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      YİBF: {sample.yibfNo} • Alınış: {sample.samplingDate}
                    </div>
                  </td>

                  <td className="py-3.5 px-4">
                    <div className="font-semibold text-white truncate max-w-xs">{sample.projectName}</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      {sample.blockFloor} — {sample.element}
                    </div>
                  </td>

                  <td className="py-3.5 px-4">
                    <span className="font-semibold px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-200">
                      {sample.concreteClass}
                    </span>
                    <div className="text-[10px] text-slate-400 mt-1">Hedef: ≥ {sample.targetStrength} MPa</div>
                  </td>

                  <td className="py-3.5 px-4">
                    {sample.day7Strength !== null ? (
                      <div className="font-semibold text-slate-200">
                        {sample.day7Strength} MPa
                        <span className="text-[10px] text-emerald-400 ml-1">
                          (%{Math.round((sample.day7Strength / sample.targetStrength) * 100)})
                        </span>
                      </div>
                    ) : (
                      <span className="text-slate-500 italic">Test Bekliyor</span>
                    )}
                  </td>

                  <td className="py-3.5 px-4">
                    {sample.day28Strength !== null ? (
                      <div className={`font-semibold ${sample.day28Strength >= sample.targetStrength ? "text-emerald-400" : "text-rose-400"}`}>
                        {sample.day28Strength} MPa
                        <span className="text-[10px] ml-1">
                          (%{Math.round((sample.day28Strength / sample.targetStrength) * 100)})
                        </span>
                      </div>
                    ) : (
                      <span className="text-slate-500 italic">Beklemede</span>
                    )}
                  </td>

                  <td className="py-3.5 px-4">
                    {getStatusBadge(sample.status)}
                    <div className="text-[10px] text-slate-400 mt-1 truncate max-w-xs">{sample.labName}</div>
                  </td>

                  <td className="py-3.5 px-4 text-right">
                    <button
                      onClick={() => toast.success(`Laboratuvar Kırım Raporu İndirildi: ${sample.qrCode}`, { icon: "📄" })}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs transition cursor-pointer"
                    >
                      <FileCheck className="w-3.5 h-3.5 text-blue-400" />
                      <span>PDF Rapor</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
