/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Yapı Denetim OS - Serbest Çizim & Pafta Notlama (CAD Markup) Terminali (/inspection/sketch)
 */

"use client";

import React, { useState, useEffect, Suspense } from "react";
import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";
import {
  Pencil,
  Upload,
  X,
  Save,
  Download,
  Layers,
  ChevronLeft,
  FileText,
  Sparkles,
  Camera,
  CheckCircle,
  HelpCircle,
} from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";

const AnnotatableFloorPlanViewer = dynamic(
  () => import("@/components/AnnotatableFloorPlanViewer"),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-[600px] bg-slate-950 animate-pulse rounded-2xl flex items-center justify-center border border-slate-800 text-slate-400 text-xs">
        CAD Çizim Motoru Yükleniyor...
      </div>
    ),
  }
);

function SketchContent() {
  const searchParams = useSearchParams();
  const fileParam = searchParams?.get("file");

  const [fileUrl, setFileUrl] = useState<string | null>(fileParam || null);
  const [fileName, setFileName] = useState<string>(fileParam ? "secili_pafta.dwg" : "");

  useEffect(() => {
    if (fileParam) {
      setFileUrl(fileParam);
      setFileName("Sistemden Yüklenen Pafta");
    }
  }, [fileParam]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setFileUrl(url);
      setFileName(file.name);
      toast.success(`${file.name} yüklendi.`);
    }
  };

  const handleClearFile = () => {
    if (fileUrl && fileUrl.startsWith("blob:")) {
      URL.revokeObjectURL(fileUrl);
    }
    setFileUrl(null);
    setFileName("");
  };

  const handleLoadDemoPlan = () => {
    // Demo standard floorplan
    setFileUrl("/sample-floorplan.dxf");
    setFileName("Tipik_Kat_Donati_Aplikasyon_Plani.dxf");
    toast.success("Örnek kat planı yüklendi.");
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div className="flex items-center gap-3">
          <Link
            href="/inspection/blueprints"
            className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700 transition"
          >
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                DİJİTAL PROJE & ARŞİV
              </span>
              <span className="text-slate-500 text-xs">/</span>
              <span className="text-slate-400 text-xs font-mono">CAD İŞARETLEME VE ÇİZİM</span>
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5 mt-1">
              <Pencil className="w-6 h-6 text-blue-400" />
              Serbest Çizim & Pafta Notlama (Markup)
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {!fileUrl ? (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleLoadDemoPlan}
                className="px-3.5 py-2 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white text-xs font-medium transition cursor-pointer"
              >
                Örnek Plan Aç
              </button>
              <label className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-lg shadow-blue-600/20 transition cursor-pointer">
                <Upload className="w-4 h-4" />
                <span>DWG / DXF Yükle</span>
                <input
                  type="file"
                  accept=".dwg,.dxf,.png,.jpg,.jpeg,.svg"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </label>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-300 font-mono bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800 max-w-xs truncate">
                {fileName}
              </span>
              <button
                type="button"
                onClick={handleClearFile}
                className="p-2 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 transition cursor-pointer"
                title="Paftayı Kapat"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* CAD Canvas Viewer Area */}
      <div className="rounded-2xl border border-slate-800 bg-slate-950 overflow-hidden shadow-2xl relative min-h-[620px]">
        {fileUrl ? (
          <AnnotatableFloorPlanViewer
            fileUrl={fileUrl}
            onSaveAnnotation={(dataUrl) => {
              toast.success("Çizim ve notlar pafta revizyonu olarak kaydedildi!");
            }}
          />
        ) : (
          <div className="min-h-[620px] flex flex-col items-center justify-center gap-4 p-8 text-center bg-slate-950/60">
            <div className="w-16 h-16 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <Layers className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <div className="text-base font-bold text-white">Çizim Yapmak İçin Bir Pafta Yükleyin</div>
              <p className="text-xs text-slate-400 max-w-md">
                DWG, DXF veya mimari görsel yükleyerek şantiye kusurlarını, donatı eksikliklerini ve karot noktalarını işaretleyin.
              </p>
            </div>
            <div className="flex items-center gap-3 mt-2">
              <button
                type="button"
                onClick={handleLoadDemoPlan}
                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-medium transition cursor-pointer"
              >
                Örnek Plan ile Başla
              </button>
              <label className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md transition cursor-pointer">
                <Upload className="w-4 h-4" />
                <span>Cihazdan Dosya Seç</span>
                <input
                  type="file"
                  accept=".dwg,.dxf,.png,.jpg,.jpeg"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </label>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function SketchPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[400px] flex items-center justify-center text-slate-400 text-xs font-medium">
          Çizim motoru başlatılıyor...
        </div>
      }
    >
      <SketchContent />
    </Suspense>
  );
}
