/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Yapı Denetim OS - Proje Revizyonları & Görsel Karşılaştırma Terminali (/inspection/revisions)
 */

"use client";

import React, { useState, useRef } from "react";
import {
  History,
  GitCompare,
  Upload,
  X,
  Plus,
  Minus,
  Bell,
  ChevronLeft,
  ChevronRight,
  Layers,
  Sparkles,
  CheckCircle,
  AlertTriangle,
  Building2,
  Sliders,
} from "lucide-react";
import toast from "react-hot-toast";

interface RevisionChange {
  id: string;
  type: "removed" | "added" | "modified";
  description: string;
  discipline: "STATIK" | "MIMARI" | "MEKANIK";
  severity: "CRITICAL" | "NORMAL";
}

const SAMPLE_REVISION_CHANGES: RevisionChange[] = [
  {
    id: "ch-1",
    type: "modified",
    description: "C-12 Kolonu donatı çapı statik revizyonla Φ16'dan Φ20'ye yükseltildi.",
    discipline: "STATIK",
    severity: "CRITICAL",
  },
  {
    id: "ch-2",
    type: "removed",
    description: "B Aksı üzerindeki ara bölme duvarı yangın kaçış holü genişletilmesi için iptal edildi.",
    discipline: "MIMARI",
    severity: "NORMAL",
  },
  {
    id: "ch-3",
    type: "added",
    description: "Bodrum kat otopark tavanına ilave sprinkler kollektör hattı eklendi.",
    discipline: "MEKANIK",
    severity: "NORMAL",
  },
];

export default function InspectionRevisionsPage() {
  const [revAImage, setRevAImage] = useState<string>(
    "https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=1000&q=80"
  );
  const [revBImage, setRevBImage] = useState<string>(
    "https://images.unsplash.com/photo-1541888946425-d0fbb18615f3?auto=format&fit=crop&w=1000&q=80"
  );
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isComparing, setIsComparing] = useState(false);
  const [changes, setChanges] = useState<RevisionChange[]>(SAMPLE_REVISION_CHANGES);
  const sliderRef = useRef<HTMLDivElement>(null);

  const handleSliderMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!sliderRef.current) return;
    const rect = sliderRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPosition(percentage);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, version: "A" | "B") => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (version === "A") {
          setRevAImage(event.target?.result as string);
        } else {
          setRevBImage(event.target?.result as string);
        }
        toast.success(`Revizyon ${version} paftası yüklendi.`);
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const handleNotifySubcontractors = () => {
    toast.success("Revizyon bildirimi şantiye şefi, demirci ve kalıpçı taşeronlarına iletildi!");
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
              DİJİTAL PROJE & ARŞİV
            </span>
            <span className="text-slate-500 text-xs">/</span>
            <span className="text-slate-400 text-xs font-mono">GÖRSEL DİFF MOTORU</span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5 mt-1">
            <GitCompare className="w-6 h-6 text-blue-400" />
            Proje Revizyonları & Görsel Fark Karşılaştırma
          </h1>
          <p className="text-slate-400 text-xs mt-1">
            Mimar ve mühendislerin yüklediği yeni paftaları (R0 vs R1) split-slider ile üst üste bindirip farkları anında tespit edin.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleNotifySubcontractors}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-lg shadow-blue-600/20 transition cursor-pointer"
          >
            <Bell className="w-4 h-4" />
            <span>Sahaya Revizyon Bildir</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Diff Slider (8 cols) + Changes Inspector (4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Visual Split-Screen Slider (8 cols) */}
        <div className="lg:col-span-8 space-y-3">
          {/* Controls Bar */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs">
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 cursor-pointer transition">
                <Upload className="w-3.5 h-3.5 text-blue-400" />
                <span>Eski Versiyon (R0) Seç</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileSelect(e, "A")}
                  className="hidden"
                />
              </label>

              <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 cursor-pointer transition">
                <Upload className="w-3.5 h-3.5 text-cyan-400" />
                <span>Yeni Versiyon (R1) Seç</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileSelect(e, "B")}
                  className="hidden"
                />
              </label>
            </div>

            <div className="flex items-center gap-2 font-mono text-[11px]">
              <span className="text-blue-400">R0: %{Math.round(sliderPosition)}</span>
              <span className="text-slate-600">|</span>
              <span className="text-cyan-400">R1: %{100 - Math.round(sliderPosition)}</span>
            </div>
          </div>

          {/* Interactive Slider Container */}
          <div
            ref={sliderRef}
            onMouseMove={handleSliderMove}
            className="relative aspect-video rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 cursor-ew-resize select-none shadow-2xl"
          >
            {/* Version B (Underneath / Full Width) */}
            <img
              src={revBImage}
              alt="Revision B"
              className="absolute inset-0 w-full h-full object-cover"
            />

            {/* Version A (Clipped on Left by sliderPosition) */}
            <div
              className="absolute inset-0 overflow-hidden"
              style={{ width: `${sliderPosition}%` }}
            >
              <img
                src={revAImage}
                alt="Revision A"
                className="absolute inset-0 w-full h-full object-cover max-w-none"
                style={{ width: sliderRef.current?.clientWidth || 800 }}
              />
            </div>

            {/* Vertical Split Line */}
            <div
              className="absolute top-0 bottom-0 w-1 bg-white shadow-[0_0_10px_rgba(255,255,255,0.8)] pointer-events-none"
              style={{ left: `${sliderPosition}%` }}
            >
              <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-slate-900 border-2 border-white flex items-center justify-center text-white shadow-xl">
                <Sliders className="w-3.5 h-3.5" />
              </div>
            </div>

            {/* Corner Badges */}
            <div className="absolute top-3 left-3 px-2 py-1 rounded bg-black/70 backdrop-blur-md border border-slate-700 text-[10px] font-mono text-blue-300">
              SOL: R0 (Eski Pafta)
            </div>
            <div className="absolute top-3 right-3 px-2 py-1 rounded bg-black/70 backdrop-blur-md border border-slate-700 text-[10px] font-mono text-cyan-300">
              SAĞ: R1 (Yeni Revizyon)
            </div>
          </div>
        </div>

        {/* Right Column: Detected Revision Changes (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-xs font-bold text-white">
                <History className="w-4 h-4 text-blue-400" />
                <span>Statik & Mimari Değişiklik İzi</span>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                {changes.length} Değişiklik
              </span>
            </div>

            <div className="space-y-3">
              {changes.map((ch) => {
                const isCritical = ch.severity === "CRITICAL";
                return (
                  <div
                    key={ch.id}
                    className={`p-3 rounded-lg border text-xs space-y-1.5 transition ${
                      isCritical
                        ? "border-rose-500/30 bg-rose-950/10"
                        : "border-slate-800 bg-slate-950/70"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono font-bold text-slate-400">
                        {ch.discipline}
                      </span>
                      <span
                        className={`text-[9px] font-mono px-1.5 py-0.5 rounded font-bold ${
                          ch.type === "modified"
                            ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                            : ch.type === "added"
                            ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                            : "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                        }`}
                      >
                        {ch.type === "modified" ? "REVİZYON" : ch.type === "added" ? "EKLENDİ" : "İPTAL"}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-200 leading-relaxed">{ch.description}</p>
                  </div>
                );
              })}
            </div>

            <div className="pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => toast.success("Revizyon onay tutanağı düzenlendi ve arşive eklendi.")}
                className="w-full py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold transition cursor-pointer"
              >
                Revizyonu Resmi Olarak Onayla
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
