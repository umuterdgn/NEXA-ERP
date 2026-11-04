"use client";

/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Nexa ERP - Proje Revizyon Merkezi (Version Control & Site Broadcaster)
 * - Yeni revizyon yükleme & Revizyon Numarası
 * - "Eski proje geçerliliğini yitirdi, sahaya uyarı gönder!" acil mobil push bildirimi
 * - Görsel revizyon karşılaştırma (Slider & Diff)
 */

import { useState, useRef, useEffect } from "react";
import {
  GitCompare,
  Upload,
  X,
  Plus,
  Minus,
  Bell,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
  FileCheck2,
  Clock,
  Layers,
  CheckCircle2,
  AlertTriangle,
  Send,
  Sparkles,
} from "lucide-react";
import toast from "react-hot-toast";

interface Change {
  id: string;
  type: "removed" | "added";
  description: string;
}

interface RevisionHistoryItem {
  id: string;
  revisionNo: string;
  title: string;
  discipline: string;
  date: string;
  isObsoleteBroadcasted: boolean;
  author: string;
}

export default function RevisionsPage() {
  const [activeTab, setActiveTab] = useState<"publish" | "compare">("publish");

  // FORM STATE: Yeni Revizyon Yayınlama
  const [revisionNo, setRevisionNo] = useState("REV-04");
  const [title, setTitle] = useState("Blok-B 3. Kat Kolon Donatı & Aks Kaçıklığı Revizyonu");
  const [discipline, setDiscipline] = useState("STATIK");
  const [projectId, setProjectId] = useState("proj-1");
  const [description, setDescription] = useState(
    "Statik proje müellifinin 04.11.2026 tarihli onaylı revizyonudur. B-4 aksındaki S-104 kolonu 60x60 yerine 70x70 büyütülmüş, ilave Q22 donatılar eklenmiştir."
  );
  const [isObsoleteWarning, setIsObsoleteWarning] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedFileName, setSelectedFileName] = useState("Blok_B_Kat3_Statik_Rev04.pdf");

  // Önceki Revizyonlar Listesi
  const [revisionsList, setRevisionsList] = useState<RevisionHistoryItem[]>([
    {
      id: "rev-1",
      revisionNo: "REV-03",
      title: "Blok-A & B Bodrum Kalıp Planı",
      discipline: "STATIK",
      date: "01.11.2026",
      isObsoleteBroadcasted: true,
      author: "Murat Çelik (Proje Müdürü)",
    },
    {
      id: "rev-2",
      revisionNo: "REV-02",
      title: "Yangın Sprinkler ve Pis Su Şaft Revizyonu",
      discipline: "MEKANIK",
      date: "24.10.2026",
      isObsoleteBroadcasted: false,
      author: "Ece Yılmaz (Mekanik Şefi)",
    },
    {
      id: "rev-3",
      revisionNo: "REV-01",
      title: "Orijinal Ruhsat Projesi (TS 500 Uygun)",
      discipline: "MIMARI",
      date: "12.09.2026",
      isObsoleteBroadcasted: false,
      author: "Başmimar Sinan Ergün",
    },
  ]);

  // Görsel Karşılaştırma State'leri
  const [revAImage, setRevAImage] = useState<string | null>(null);
  const [revBImage, setRevBImage] = useState<string | null>(null);
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isComparing, setIsComparing] = useState(false);
  const [analysisResults, setAnalysisResults] = useState<Change[] | null>(null);
  const fileInputRefA = useRef<HTMLInputElement>(null);
  const fileInputRefB = useRef<HTMLInputElement>(null);
  const sliderRef = useRef<HTMLDivElement>(null);

  // Yeni Revizyon Yayınla & Sahaya Bildir Submit
  const handlePublishRevision = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!revisionNo.trim() || !title.trim()) {
      toast.error("Revizyon Numarası ve Başlık zorunludur.");
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await fetch("/api/admin/revisions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          revisionNo: revisionNo.trim(),
          title: title.trim(),
          discipline,
          projectId,
          description: description.trim(),
          isObsoleteWarning,
          fileName: selectedFileName,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Revizyon kaydedilemedi.");
      }

      toast.success(data.message, { duration: 5000 });

      // Listeye ekle
      const newItem: RevisionHistoryItem = {
        id: "rev-" + Date.now(),
        revisionNo: revisionNo.trim(),
        title: title.trim(),
        discipline,
        date: new Date().toLocaleDateString("tr-TR"),
        isObsoleteBroadcasted: isObsoleteWarning,
        author: "Umut Erdoğan (Başmühendis)",
      };
      setRevisionsList((prev) => [newItem, ...prev]);

      // Formu sıfırla
      setRevisionNo("REV-05");
      setTitle("");
      setDescription("");
    } catch (err: any) {
      toast.error(err.message || "İşlem sırasında bir hata oluştu.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Karşılaştırma Fonksiyonları
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, version: "A" | "B") => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (version === "A") {
          setRevAImage(event.target?.result as string);
        } else {
          setRevBImage(event.target?.result as string);
        }
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const handleSliderMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!sliderRef.current) return;
    const rect = sliderRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPosition(percentage);
  };

  const startComparison = () => {
    if (!revAImage || !revBImage) return;
    setIsComparing(true);
    setTimeout(() => {
      setAnalysisResults([
        {
          id: "1",
          type: "removed",
          description: "B Aksı üzerindeki K102 kolonu yeni projede iptal edilmiş.",
        },
        {
          id: "2",
          type: "added",
          description: "C3-C4 aksları arasına 25cm perde duvar ve donatı bindirmesi eklenmiş.",
        },
        {
          id: "3",
          type: "added",
          description: "Havalandırma şaftı 40 cm batıya kaydırılmış.",
        },
      ]);
      setIsComparing(false);
    }, 1200);
  };

  const resetComparison = () => {
    setRevAImage(null);
    setRevBImage(null);
    setAnalysisResults(null);
    setSliderPosition(50);
  };

  return (
    <div className="flex-1 w-full p-6 space-y-6 max-w-7xl mx-auto">
      {/* Üst Başlık & Sekmeler */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-cyan-400 mb-1">
            <Layers className="w-4 h-4" />
            <span>Versiyon Kontrol & Şantiye Entegrasyonu</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            Proje Revizyon Merkezi
          </h1>
          <p className="text-sm text-slate-400">
            Yeni mimari/statik paftaları yayınlayın, eski projeye bakan saha ekiplerine anında acil mobil uyarı gönderin.
          </p>
        </div>

        {/* Tab Seçici */}
        <div className="flex items-center bg-slate-900 border border-slate-800 p-1.5 rounded-xl gap-1">
          <button
            onClick={() => setActiveTab("publish")}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeTab === "publish"
                ? "bg-cyan-600 text-white shadow-md shadow-cyan-600/30"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Send className="w-3.5 h-3.5" />
            <span>Yeni Revizyon Yayınla & Bildir</span>
          </button>

          <button
            onClick={() => setActiveTab("compare")}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeTab === "compare"
                ? "bg-cyan-600 text-white shadow-md shadow-cyan-600/30"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <GitCompare className="w-3.5 h-3.5" />
            <span>Görsel Karşılaştır (A/B Diff)</span>
          </button>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* SEKME 1: YENİ REVİZYON YAYINLAMA & ACİL MOBİL BİLDİRİM FORMU        */}
      {/* ==================================================================== */}
      {activeTab === "publish" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Sol 2 Kolon: Form */}
          <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
            <div className="flex items-center gap-3 border-b border-slate-800/80 pb-4">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                <FileCheck2 className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white">Revizyon Kaydı ve Pafta Yayını</h2>
                <p className="text-xs text-slate-400">
                  Yeni çizimi yükleyip saha personelinin mobil cihazlarını senkronize edin
                </p>
              </div>
            </div>

            <form onSubmit={handlePublishRevision} className="space-y-4">
              {/* Revizyon No & Disiplin */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">
                    Revizyon Numarası <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={revisionNo}
                    onChange={(e) => setRevisionNo(e.target.value)}
                    placeholder="Örn: REV-04"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white font-mono font-bold focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">Disiplin</label>
                  <select
                    value={discipline}
                    onChange={(e) => setDiscipline(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                  >
                    <option value="STATIK">Statik & Betonarme</option>
                    <option value="MIMARI">Mimari Proje</option>
                    <option value="MEKANIK">Mekanik & Tesisat</option>
                    <option value="ELEKTRIK">Elektrik & Zayıf Akım</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">İlgili Şantiye</label>
                  <select
                    value={projectId}
                    onChange={(e) => setProjectId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                  >
                    <option value="proj-1">Kadıköy Rezidans Blok A & B</option>
                    <option value="proj-2">Nexa Towers Şantiye Sahası</option>
                    <option value="proj-3">İskenderun Lojistik Depo</option>
                  </select>
                </div>
              </div>

              {/* Pafta Başlığı */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">
                  Pafta / Çizim Başlığı <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Örn: Blok-B 3. Kat Kolon Donatı ve Perde Detayları"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              {/* Açıklama & Değişiklik Notu */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">
                  Revizyon Değişiklik Notları & Sebebi
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Statik proje aksına göre S-104 kolonu genişletildi..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 resize-none leading-relaxed"
                />
              </div>

              {/* Dosya Seçimi */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">
                  Yeni Onaylı Pafta Dosyası (DWG, PDF veya IFC)
                </label>
                <div className="flex items-center gap-3 p-3 bg-slate-950 border border-slate-800 rounded-xl">
                  <div className="p-2 rounded-lg bg-slate-800 text-cyan-400">
                    <Upload className="w-4 h-4" />
                  </div>
                  <div className="flex-1 truncate">
                    <span className="text-xs text-white font-medium block truncate">
                      {selectedFileName}
                    </span>
                    <span className="text-[10px] text-slate-500">Boyut: 18.4 MB • TS 500 Onaylı</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const name = prompt("Dosya adı giriniz:", selectedFileName);
                      if (name) setSelectedFileName(name);
                    }}
                    className="px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 hover:text-white text-xs"
                  >
                    Değiştir
                  </button>
                </div>
              </div>

              {/* ============================================================ */}
              {/* ADIM 3: KRİTİK ÖZELLİK - TOGGLE BUTTON                       */}
              {/* ============================================================ */}
              <div
                className={`p-4 rounded-xl border transition-all ${
                  isObsoleteWarning
                    ? "bg-red-950/40 border-red-700/80 shadow-lg shadow-red-950/50"
                    : "bg-slate-950/60 border-slate-800"
                }`}
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div
                      className={`p-2 rounded-xl mt-0.5 ${
                        isObsoleteWarning
                          ? "bg-red-500/20 text-red-400 border border-red-500/30"
                          : "bg-slate-800 text-slate-400"
                      }`}
                    >
                      <ShieldAlert className="w-5 h-5" />
                    </div>
                    <div>
                      <h4
                        className={`text-xs font-bold ${
                          isObsoleteWarning ? "text-red-300" : "text-white"
                        }`}
                      >
                        Eski proje geçerliliğini yitirdi, sahaya uyarı gönder!
                      </h4>
                      <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                        Bu seçenek aktif edildiğinde, mobilde eski projeye bakan tüm saha şeflerine anında
                        kırmızı acil Push Notification gönderilir ve eski pafta geçersiz işaretlenir.
                      </p>
                    </div>
                  </div>

                  {/* Toggle Switch */}
                  <button
                    type="button"
                    onClick={() => setIsObsoleteWarning(!isObsoleteWarning)}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      isObsoleteWarning ? "bg-red-600" : "bg-slate-700"
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                        isObsoleteWarning ? "translate-x-5" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-bold shadow-xl shadow-cyan-600/30 transition disabled:opacity-50"
              >
                {isSubmitting ? (
                  <span>İletiliyor & Bildirim Dağıtılıyor...</span>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Yeni Revizyonu Sisteme Yayınla & Mobil Ekiplere Bildir</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Sağ Kolon: Revizyon Geçmişi */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Clock className="w-4 h-4 text-cyan-400" />
                Revizyon Tarihçesi
              </h3>
              <span className="text-xs text-slate-500 font-mono">{revisionsList.length} Sürüm</span>
            </div>

            <div className="space-y-3">
              {revisionsList.map((rev) => (
                <div
                  key={rev.id}
                  className="p-3.5 rounded-xl bg-slate-950 border border-slate-800/80 space-y-2 hover:border-slate-700 transition"
                >
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-cyan-950 border border-cyan-800 text-cyan-300">
                      {rev.revisionNo}
                    </span>
                    <span className="text-[10px] text-slate-500">{rev.date}</span>
                  </div>

                  <h4 className="text-xs font-semibold text-white">{rev.title}</h4>

                  <div className="flex items-center justify-between pt-1.5 border-t border-slate-900 text-[10px] text-slate-400">
                    <span>{rev.author}</span>
                    {rev.isObsoleteBroadcasted ? (
                      <span className="text-red-400 flex items-center gap-1 font-bold">
                        <AlertTriangle className="w-3 h-3" /> Sahaya Uyarıldı
                      </span>
                    ) : (
                      <span className="text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Normal Sürüm
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* SEKME 2: GÖRSEL REVİZYON KARŞILAŞTIRMA (A/B SLIDER)                  */}
      {/* ==================================================================== */}
      {activeTab === "compare" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Rev A Upload */}
            <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6 flex flex-col items-center justify-center min-h-[220px]">
              <input
                ref={fileInputRefA}
                type="file"
                accept="image/*"
                onChange={(e) => handleFileSelect(e, "A")}
                className="hidden"
              />
              {revAImage ? (
                <div className="relative w-full h-48 rounded-xl overflow-hidden border border-slate-700">
                  <img src={revAImage} alt="Rev A" className="w-full h-full object-cover" />
                  <button
                    onClick={() => setRevAImage(null)}
                    className="absolute top-2 right-2 p-1.5 bg-red-600 text-white rounded-lg"
                  >
                    <X className="w-4 h-4" />
                  </button>
                  <span className="absolute bottom-2 left-2 px-2 py-0.5 bg-slate-900/90 text-xs font-mono font-bold text-white rounded">
                    Eski Çizim (Rev A)
                  </span>
                </div>
              ) : (
                <button
                  onClick={() => fileInputRefA.current?.click()}
                  className="flex flex-col items-center text-slate-400 hover:text-white"
                >
                  <Upload className="w-8 h-8 mb-2 text-cyan-400" />
                  <span className="text-xs font-semibold">Eski Paftayı Yükle (Rev A)</span>
                </button>
              )}
            </div>

            {/* Rev B Upload */}
            <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6 flex flex-col items-center justify-center min-h-[220px]">
              <input
                ref={fileInputRefB}
                type="file"
                accept="image/*"
                onChange={(e) => handleFileSelect(e, "B")}
                className="hidden"
              />
              {revBImage ? (
                <div className="relative w-full h-48 rounded-xl overflow-hidden border border-slate-700">
                  <img src={revBImage} alt="Rev B" className="w-full h-full object-cover" />
                  <button
                    onClick={() => setRevBImage(null)}
                    className="absolute top-2 right-2 p-1.5 bg-red-600 text-white rounded-lg"
                  >
                    <X className="w-4 h-4" />
                  </button>
                  <span className="absolute bottom-2 left-2 px-2 py-0.5 bg-cyan-900/90 text-xs font-mono font-bold text-cyan-300 rounded">
                    Yeni Çizim (Rev B)
                  </span>
                </div>
              ) : (
                <button
                  onClick={() => fileInputRefB.current?.click()}
                  className="flex flex-col items-center text-slate-400 hover:text-white"
                >
                  <Upload className="w-8 h-8 mb-2 text-cyan-400" />
                  <span className="text-xs font-semibold">Yeni Paftayı Yükle (Rev B)</span>
                </button>
              )}
            </div>
          </div>

          {/* Karşılaştır Butonu */}
          {revAImage && revBImage && !isComparing && !analysisResults && (
            <div className="text-center">
              <button
                onClick={startComparison}
                className="px-6 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 text-white rounded-xl text-xs font-bold shadow-lg"
              >
                Görsel A/B Farklarını Analiz Et
              </button>
            </div>
          )}

          {/* Slider */}
          {revAImage && revBImage && (
            <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6">
              <h3 className="text-sm font-bold text-white mb-3">İnteraktif A/B Kaydırıcı</h3>
              <div
                ref={sliderRef}
                className="relative w-full h-96 bg-slate-950 rounded-xl overflow-hidden cursor-ew-resize"
                onMouseMove={handleSliderMove}
              >
                <img src={revAImage} alt="Rev A" className="absolute inset-0 w-full h-full object-cover" />
                <div
                  className="absolute inset-0 overflow-hidden"
                  style={{ width: `${sliderPosition}%` }}
                >
                  <img
                    src={revBImage}
                    alt="Rev B"
                    className="absolute inset-0 w-full h-full object-cover"
                    style={{ left: `-${100 - sliderPosition}%` }}
                  />
                </div>
                <div
                  className="absolute top-0 bottom-0 w-1 bg-cyan-400 shadow-xl"
                  style={{ left: `${sliderPosition}%` }}
                />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
