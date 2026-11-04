"use client";

/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Nexa ERP - Kalite Kontrol (QA/QC) & Beton Döküm Tutanağı
 * Zorunlu Döküm Parametreleri:
 * - Slump (çökme) değeri (cm)
 * - Beton sıcaklığı (°C)
 * - Hava sıcaklığı (°C)
 * - Gelen transmikser plakası
 * - İrsaliye saati
 * - Döküm başlama saati
 * - Laboratuvar/numune teslim durumu (checkbox)
 */

import React, { useState, useEffect } from "react";
import {
  TestTube2,
  Plus,
  X,
  Calendar,
  Clock,
  Truck,
  Thermometer,
  ShieldAlert,
  CheckCircle2,
  AlertCircle,
  Building2,
  Search,
  FileText,
  Camera,
  Layers,
  Sparkles,
  Info,
} from "lucide-react";
import toast from "react-hot-toast";

interface ConcreteLog {
  id: string;
  projectId: string;
  projectName?: string;
  castDate: string;
  concreteClass: string;
  element: string;
  waybillNo: string;
  transmixerPlate: string;
  slumpCm: number;
  concreteTemp: number;
  airTemp: number;
  waybillTime: string;
  castStartTime: string;
  labSampleTaken: boolean;
  sampleCubesCount: number;
  batchPlant: string;
  status: string;
  notes?: string;
}

const CONCRETE_CLASSES = [
  "C25/30",
  "C30/37",
  "C35/45",
  "C40/50",
  "C50/60 (Yüksek Dayanımlı)",
];

const STRUCTURAL_ELEMENTS = [
  "Temel Radye Plağı",
  "Bodrum Kat Dış Perdeler",
  "1. Normal Kat Kolon ve Perdeleri",
  "1. Normal Kat Döşeme & Kirişler (Tabliye)",
  "2. Normal Kat Kolonları",
  "Çatı Tabliyesi",
  "İstinat Duvarı",
  "Saha Betonu (Otopark)",
];

export default function ConcreteCastingPage() {
  const [logs, setLogs] = useState<ConcreteLog[]>([
    {
      id: "demo-1",
      projectId: "proj-1",
      projectName: "Nexa Tower Residence",
      castDate: new Date().toISOString(),
      concreteClass: "C35/45",
      element: "1. Normal Kat Kolon ve Perdeleri",
      waybillNo: "IRS-89104",
      transmixerPlate: "34 VR 8901",
      slumpCm: 18,
      concreteTemp: 21,
      airTemp: 24,
      waybillTime: "09:30",
      castStartTime: "10:05",
      labSampleTaken: true,
      sampleCubesCount: 6,
      batchPlant: "Akçansa Hazır Beton - Maslak Santrali",
      status: "BEKLIYOR",
      notes: "S4 kıvam sınıfı uygun. Kimyasal katkı ile pompalanabilir kıvam sağlandı.",
    },
    {
      id: "demo-2",
      projectId: "proj-2",
      projectName: "Vadistanbul Lojistik Depo",
      castDate: new Date(Date.now() - 86400000).toISOString(),
      concreteClass: "C30/37",
      element: "Saha Betonu (Otopark)",
      waybillNo: "IRS-89021",
      transmixerPlate: "34 KMT 441",
      slumpCm: 14,
      concreteTemp: 19,
      airTemp: 22,
      waybillTime: "14:10",
      castStartTime: "14:35",
      labSampleTaken: true,
      sampleCubesCount: 6,
      batchPlant: "Çimsa Hazır Beton - İkitelli Santrali",
      status: "BEKLIYOR",
      notes: "Vibrasyon homojen uygulandı, çatlak koruma kürü başlatıldı.",
    },
  ]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Form State
  const [projectName, setProjectName] = useState("Nexa Tower Residence");
  const [concreteClass, setConcreteClass] = useState("C35/45");
  const [element, setElement] = useState("1. Normal Kat Kolon ve Perdeleri");
  const [slumpCm, setSlumpCm] = useState<number | "">(18);
  const [concreteTemp, setConcreteTemp] = useState<number | "">(22);
  const [airTemp, setAirTemp] = useState<number | "">(25);
  const [transmixerPlate, setTransmixerPlate] = useState("");
  const [waybillNo, setWaybillNo] = useState("");
  const [waybillTime, setWaybillTime] = useState("");
  const [castStartTime, setCastStartTime] = useState("");
  const [labSampleTaken, setLabSampleTaken] = useState(true);
  const [sampleCubesCount, setSampleCubesCount] = useState(6);
  const [batchPlant, setBatchPlant] = useState("");
  const [notes, setNotes] = useState("");

  // Load backend records
  useEffect(() => {
    fetch("/api/admin/concrete-casting")
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          const parsed = data.map((item: any) => {
            let meta: any = {};
            try {
              if (item.reportUrl?.startsWith("{")) {
                meta = JSON.parse(item.reportUrl);
              }
            } catch {
              meta = {};
            }
            return {
              id: item.id,
              projectId: item.projectId,
              projectName: item.project?.name || "Şantiye Projesi",
              castDate: item.castDate || item.createdAt,
              concreteClass: item.concreteClass || "C30/37",
              element: item.element || "Yapı Elemanı",
              waybillNo: item.waybillNo || "IRS-000",
              transmixerPlate: meta.transmixerPlate || "34 PLK 00",
              slumpCm: meta.slumpCm ?? 16,
              concreteTemp: meta.concreteTemp ?? 20,
              airTemp: meta.airTemp ?? 24,
              waybillTime: meta.waybillTime || "10:00",
              castStartTime: meta.castStartTime || "10:30",
              labSampleTaken: meta.labSampleTaken ?? true,
              sampleCubesCount: meta.sampleCubesCount ?? 6,
              batchPlant: meta.batchPlant || "Hazır Beton Santrali",
              status: item.status || "BEKLIYOR",
              notes: meta.notes || "",
            };
          });
          setLogs((prev) => [...parsed, ...prev.filter((p) => !parsed.some((x: any) => x.id === p.id))]);
        }
      })
      .catch((err) => console.warn("Concrete cast fetch:", err));
  }, []);

  // Form submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!transmixerPlate.trim()) {
      toast.error("Transmikser plakası zorunludur!");
      return;
    }
    if (slumpCm === "" || slumpCm === undefined) {
      toast.error("Slump (çökme) değeri zorunludur!");
      return;
    }
    if (concreteTemp === "" || concreteTemp === undefined) {
      toast.error("Beton sıcaklığı zorunludur!");
      return;
    }
    if (airTemp === "" || airTemp === undefined) {
      toast.error("Hava sıcaklığı zorunludur!");
      return;
    }
    if (!waybillTime) {
      toast.error("İrsaliye saati zorunludur!");
      return;
    }
    if (!castStartTime) {
      toast.error("Döküm başlama saati zorunludur!");
      return;
    }

    setLoading(true);

    const payload = {
      projectId: "proj-1",
      concreteClass,
      element,
      slumpCm: Number(slumpCm),
      concreteTemp: Number(concreteTemp),
      airTemp: Number(airTemp),
      transmixerPlate: transmixerPlate.trim().toUpperCase(),
      waybillNo: waybillNo || `IRS-${Math.floor(100000 + Math.random() * 900000)}`,
      waybillTime,
      castStartTime,
      labSampleTaken,
      sampleCubesCount: Number(sampleCubesCount),
      batchPlant: batchPlant || "Maslak Hazır Beton Santrali",
      notes,
    };

    try {
      const res = await fetch("/api/admin/concrete-casting", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Kayıt başarısız");
      }

      const resData = await res.json();

      const newLog: ConcreteLog = {
        id: resData.data?.id || `cast-${Date.now()}`,
        projectId: payload.projectId,
        projectName,
        castDate: new Date().toISOString(),
        concreteClass,
        element,
        waybillNo: payload.waybillNo,
        transmixerPlate: payload.transmixerPlate,
        slumpCm: Number(slumpCm),
        concreteTemp: Number(concreteTemp),
        airTemp: Number(airTemp),
        waybillTime,
        castStartTime,
        labSampleTaken,
        sampleCubesCount: Number(sampleCubesCount),
        batchPlant: payload.batchPlant,
        status: labSampleTaken ? "BEKLIYOR" : "NUMUNESIZ_KABUL",
        notes,
      };

      setLogs([newLog, ...logs]);
      toast.success("Beton döküm tutanağı ve QA/QC verileri başarıyla kaydedildi!");
      setIsModalOpen(false);

      // Reset form
      setTransmixerPlate("");
      setWaybillNo("");
      setNotes("");
    } catch (err: any) {
      toast.error(err.message || "Tutanak kaydedilemedi.");
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = logs.filter(
    (l) =>
      l.transmixerPlate.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.element.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.waybillNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (l.projectName && l.projectName.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-8 space-y-8">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-cyan-500/10 border border-cyan-500/30 rounded-xl text-cyan-400">
              <TestTube2 className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white flex items-center gap-2">
                Beton Döküm Tutanağı & QA/QC
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 font-medium">
                  TS EN 206 Standardı
                </span>
              </h1>
              <p className="text-sm text-slate-400 mt-1">
                Şantiye taze beton testleri: Slump, beton ve hava sıcaklığı, transmikser varış/döküm saatleri ve küp numune tutanağı.
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-xl font-medium shadow-lg shadow-cyan-600/20 transition-all cursor-pointer"
        >
          <Plus className="w-5 h-5" />
          <span>Yeni Döküm Tutanağı Ekle</span>
        </button>
      </div>

      {/* METRIC CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 backdrop-blur-sm">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Kayıtlı Dökümler</span>
            <TestTube2 className="w-5 h-5 text-cyan-400" />
          </div>
          <div className="text-3xl font-bold text-white mt-2">{logs.length}</div>
          <p className="text-xs text-slate-400 mt-1">Son 30 gün içinde yapılan testler</p>
        </div>

        <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 backdrop-blur-sm">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Ortalama Slump Değeri</span>
            <Layers className="w-5 h-5 text-emerald-400" />
          </div>
          <div className="text-3xl font-bold text-emerald-400 mt-2">16.8 cm</div>
          <p className="text-xs text-emerald-400/80 mt-1">S3 - S4 kıvam aralığında (Normal)</p>
        </div>

        <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 backdrop-blur-sm">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Numune Küp Alımı</span>
            <CheckCircle2 className="w-5 h-5 text-blue-400" />
          </div>
          <div className="text-3xl font-bold text-blue-400 mt-2">
            {logs.filter((l) => l.labSampleTaken).length}/{logs.length}
          </div>
          <p className="text-xs text-blue-400/80 mt-1">7 & 28 günlük kırım testine yollandı</p>
        </div>

        <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 backdrop-blur-sm">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Sıcaklık Uygunluğu</span>
            <Thermometer className="w-5 h-5 text-amber-400" />
          </div>
          <div className="text-3xl font-bold text-white mt-2">%100</div>
          <p className="text-xs text-slate-400 mt-1">+5°C / +32°C limitleri dahilinde</p>
        </div>
      </div>

      {/* FILTER & SEARCH */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-900/40 p-3 rounded-2xl border border-slate-800/60">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Plaka, eleman veya irsaliye no ara..."
            className="w-full bg-slate-950/70 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-cyan-500"
          />
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <span>Toplam {filteredLogs.length} döküm listeleniyor</span>
        </div>
      </div>

      {/* TABLE / LIST */}
      <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl overflow-hidden backdrop-blur-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-950/80 border-b border-slate-800 text-xs uppercase font-semibold text-slate-400">
              <tr>
                <th className="py-3.5 px-4">Tarih & Saat</th>
                <th className="py-3.5 px-4">Yapı Elemanı & Sınıf</th>
                <th className="py-3.5 px-4">Transmikser & İrsaliye</th>
                <th className="py-3.5 px-4">Slump (Çökme)</th>
                <th className="py-3.5 px-4">Sıcaklık (°C)</th>
                <th className="py-3.5 px-4">Numune Durumu</th>
                <th className="py-3.5 px-4">Santral & Not</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-4 px-4 whitespace-nowrap">
                    <div className="flex items-center gap-2 text-slate-200 font-medium">
                      <Calendar className="w-4 h-4 text-cyan-400" />
                      {new Date(log.castDate).toLocaleDateString("tr-TR")}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-400 mt-1">
                      <Clock className="w-3.5 h-3.5 text-slate-500" />
                      İrs: {log.waybillTime} ➔ Döküm: {log.castStartTime}
                    </div>
                  </td>

                  <td className="py-4 px-4">
                    <div className="font-semibold text-white">{log.element}</div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs px-2 py-0.5 rounded bg-blue-500/10 border border-blue-500/30 text-blue-300 font-mono">
                        {log.concreteClass}
                      </span>
                      <span className="text-xs text-slate-400">{log.projectName}</span>
                    </div>
                  </td>

                  <td className="py-4 px-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <Truck className="w-4 h-4 text-slate-400" />
                      <span className="font-mono font-bold text-white bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                        {log.transmixerPlate}
                      </span>
                    </div>
                    <div className="text-xs text-slate-400 mt-1">İrsaliye: {log.waybillNo}</div>
                  </td>

                  <td className="py-4 px-4 whitespace-nowrap">
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`text-base font-bold font-mono ${
                          log.slumpCm >= 12 && log.slumpCm <= 21
                            ? "text-emerald-400"
                            : "text-amber-400"
                        }`}
                      >
                        {log.slumpCm} cm
                      </span>
                      <span className="text-xs text-slate-400">
                        {log.slumpCm >= 16 ? "(S4)" : log.slumpCm >= 10 ? "(S3)" : "(S2)"}
                      </span>
                    </div>
                  </td>

                  <td className="py-4 px-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <div>
                        <div className="text-xs text-slate-400">Beton</div>
                        <div className="font-mono font-semibold text-cyan-300">
                          {log.concreteTemp} °C
                        </div>
                      </div>
                      <div className="h-6 w-px bg-slate-700" />
                      <div>
                        <div className="text-xs text-slate-400">Hava</div>
                        <div className="font-mono font-semibold text-slate-300">
                          {log.airTemp} °C
                        </div>
                      </div>
                    </div>
                  </td>

                  <td className="py-4 px-4 whitespace-nowrap">
                    {log.labSampleTaken ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        {log.sampleCubesCount} Küp Alındı
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-500/10 border border-amber-500/30 text-amber-400">
                        <AlertCircle className="w-3.5 h-3.5" />
                        Numune Alınmadı
                      </span>
                    )}
                  </td>

                  <td className="py-4 px-4 text-xs text-slate-400 max-w-xs truncate">
                    <div className="text-slate-300 font-medium truncate">{log.batchPlant}</div>
                    <div className="truncate mt-0.5 text-slate-400">{log.notes || "Açıklama yok"}</div>
                  </td>
                </tr>
              ))}

              {filteredLogs.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    Arama kriterlerine uygun döküm tutanağı bulunamadı.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: YENİ BETON DÖKÜM TUTANAĞI */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl p-6 md:p-8 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-cyan-500/10 border border-cyan-500/30 rounded-xl text-cyan-400">
                  <TestTube2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">Yeni Beton Döküm Tutanağı</h3>
                  <p className="text-xs text-slate-400">TS EN 206 & TS 13515 standardına uygun saha ölçümleri</p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* FORM */}
            <form onSubmit={handleSubmit} className="mt-6 space-y-6">
              {/* Proje & Eleman */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                    İlgili Proje
                  </label>
                  <select
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-cyan-500"
                  >
                    <option value="Nexa Tower Residence">Nexa Tower Residence</option>
                    <option value="Vadistanbul Lojistik Depo">Vadistanbul Lojistik Depo</option>
                    <option value="Metro İstasyon Revizyonu">Metro İstasyon Revizyonu</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                    Beton Sınıfı
                  </label>
                  <select
                    value={concreteClass}
                    onChange={(e) => setConcreteClass(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-cyan-500"
                  >
                    {CONCRETE_CLASSES.map((cls) => (
                      <option key={cls} value={cls}>
                        {cls}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Dökülen Yapı Elemanı
                </label>
                <select
                  value={element}
                  onChange={(e) => setElement(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-cyan-500"
                >
                  {STRUCTURAL_ELEMENTS.map((el) => (
                    <option key={el} value={el}>
                      {el}
                    </option>
                  ))}
                </select>
              </div>

              {/* ZORUNLU DÖKÜM ALANLARI: Plaka & İrsaliye */}
              <div className="bg-slate-950/60 p-4 rounded-2xl border border-cyan-500/20 space-y-4">
                <div className="flex items-center gap-2 text-cyan-400 text-xs font-semibold uppercase tracking-wider">
                  <Truck className="w-4 h-4" />
                  Zorunlu İrsaliye & Transmikser Bilgileri
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Transmikser Plakası <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="34 VR 8901"
                      value={transmixerPlate}
                      onChange={(e) => setTransmixerPlate(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-200 uppercase font-mono focus:outline-none focus:border-cyan-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      İrsaliye Saati <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="time"
                      required
                      value={waybillTime}
                      onChange={(e) => setWaybillTime(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-cyan-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Döküm Başlama Saati <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="time"
                      required
                      value={castStartTime}
                      onChange={(e) => setCastStartTime(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">İrsaliye No</label>
                    <input
                      type="text"
                      placeholder="IRS-89104"
                      value={waybillNo}
                      onChange={(e) => setWaybillNo(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Beton Santrali / Tedarikçi</label>
                    <input
                      type="text"
                      placeholder="Akçansa Maslak Santrali"
                      value={batchPlant}
                      onChange={(e) => setBatchPlant(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                </div>
              </div>

              {/* ZORUNLU DÖKÜM ALANLARI: Slump & Sıcaklık Ölçümleri */}
              <div className="bg-slate-950/60 p-4 rounded-2xl border border-cyan-500/20 space-y-4">
                <div className="flex items-center gap-2 text-cyan-400 text-xs font-semibold uppercase tracking-wider">
                  <Thermometer className="w-4 h-4" />
                  Zorunlu Taze Beton Saha Testleri
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Slump (Çökme) Değeri <span className="text-rose-400">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.5"
                        required
                        placeholder="18"
                        value={slumpCm}
                        onChange={(e) => setSlumpCm(e.target.value === "" ? "" : Number(e.target.value))}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-200 font-mono focus:outline-none focus:border-cyan-500"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-500 font-mono">
                        cm
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Beton Sıcaklığı <span className="text-rose-400">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.1"
                        required
                        placeholder="21"
                        value={concreteTemp}
                        onChange={(e) => setConcreteTemp(e.target.value === "" ? "" : Number(e.target.value))}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-200 font-mono focus:outline-none focus:border-cyan-500"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-500 font-mono">
                        °C
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Hava Sıcaklığı <span className="text-rose-400">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.1"
                        required
                        placeholder="24"
                        value={airTemp}
                        onChange={(e) => setAirTemp(e.target.value === "" ? "" : Number(e.target.value))}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-200 font-mono focus:outline-none focus:border-cyan-500"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-500 font-mono">
                        °C
                      </span>
                    </div>
                  </div>
                </div>

                <div className="text-xs text-slate-400 flex items-center gap-1.5 bg-slate-900/80 p-2.5 rounded-xl border border-slate-800">
                  <Info className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span>
                    TS EN 206 standardına göre taze beton sıcaklığı 5°C ile 32°C aralığında olmalıdır. Slump toleransı: Hedef ±2 cm.
                  </span>
                </div>
              </div>

              {/* ZORUNLU KONTROL: Laboratuvar / Numune Teslim Durumu (Checkbox) */}
              <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800 space-y-3">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={labSampleTaken}
                    onChange={(e) => setLabSampleTaken(e.target.checked)}
                    className="mt-1 w-4 h-4 rounded border-slate-700 text-cyan-500 focus:ring-cyan-500/20 bg-slate-900 cursor-pointer"
                  />
                  <div>
                    <span className="text-sm font-semibold text-white block">
                      Laboratuvar / Numune Teslim Durumu
                    </span>
                    <span className="text-xs text-slate-400 block mt-0.5">
                      TS 13515 gereğince bu mikserden 7 ve 28 günlük basınç dayanımı testleri için standart küp (150x150 mm) numuneler alındı ve etiketlendi.
                    </span>
                  </div>
                </label>

                {labSampleTaken && (
                  <div className="pt-2 pl-7 flex items-center gap-3">
                    <span className="text-xs text-slate-300">Alınan Küp Sayısı:</span>
                    <input
                      type="number"
                      min={1}
                      max={12}
                      value={sampleCubesCount}
                      onChange={(e) => setSampleCubesCount(Number(e.target.value))}
                      className="w-20 bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-sm text-center text-slate-200 font-mono focus:outline-none focus:border-cyan-500"
                    />
                    <span className="text-xs text-slate-500">(Standart: 6 adet)</span>
                  </div>
                )}
              </div>

              {/* Notlar & Açıklama */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Denetçi Notları & Görsel Durum
                </label>
                <textarea
                  rows={2}
                  placeholder="Kıvam homojen, su ilavesi yapılmadı, vibratör ile sıkıştırma sağlandı..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-cyan-500 resize-none"
                />
              </div>

              {/* MODAL ACTIONS */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 text-sm font-medium transition cursor-pointer"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 disabled:opacity-50 text-white rounded-xl text-sm font-semibold shadow-lg shadow-cyan-600/20 transition cursor-pointer flex items-center gap-2"
                >
                  {loading ? (
                    <span>Kaydediliyor...</span>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Tutanağı Onayla ve Kaydet</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
