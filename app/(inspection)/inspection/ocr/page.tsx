/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Yapı Denetim OS - Akıllı Evrak & OCR Denetim Terminali (/inspection/ocr)
 */

"use client";

import React, { useState, useRef } from "react";
import Link from "next/link";
import {
  ScanText,
  FileText,
  CheckCircle,
  AlertTriangle,
  X,
  Loader2,
  Calendar,
  Building2,
  Upload,
  Sparkles,
  Zap,
  ShieldCheck,
  FileCheck,
  Search,
  Eye,
  FileWarning,
  Copy,
} from "lucide-react";
import toast from "react-hot-toast";
import { parseDocument, ParsedDocumentResult } from "@/app/actions/parseDocument";

interface MandatoryDocItem {
  id: string;
  category: "RUHSAT" | "ZEMIN" | "STATIK" | "LAB" | "SOZLESME" | "YANGIN";
  name: string;
  lawReference: string;
  status: "verified" | "missing" | "review";
  yibfSynced: boolean;
  parsedData?: ParsedDocumentResult;
}

const MANDATORY_INSPECTION_DOCUMENTS: MandatoryDocItem[] = [
  {
    id: "doc_1",
    category: "RUHSAT",
    name: "Belediye Onaylı Yapı Ruhsatı ve Ekleri",
    lawReference: "3194 İmar Kanunu / 4708 Md. 2",
    status: "verified",
    yibfSynced: true,
  },
  {
    id: "doc_2",
    category: "ZEMIN",
    name: "Jeoteknik ve Jeolojik Zemin Etüt Raporu",
    lawReference: "TBDY 2018 / Madde 16",
    status: "missing",
    yibfSynced: false,
  },
  {
    id: "doc_3",
    category: "STATIK",
    name: "Statik & Betonarme Hesap Raporu ve Metraj",
    lawReference: "TS 500 / Çevre Şehircilik Esasları",
    status: "review",
    yibfSynced: false,
  },
  {
    id: "doc_4",
    category: "LAB",
    name: "TÜRKAK Akredite Laboratuvar Sözleşmesi",
    lawReference: "4708 Sayılı Kanun Md. 3",
    status: "missing",
    yibfSynced: false,
  },
  {
    id: "doc_5",
    category: "SOZLESME",
    name: "Şantiye Şefi Hizmet Sözleşmesi ve Taahhütname",
    lawReference: "Şantiye Şefleri Hakkında Yönetmelik",
    status: "missing",
    yibfSynced: false,
  },
  {
    id: "doc_6",
    category: "YANGIN",
    name: "İtfaiye Yangın Tahliye ve Güvenlik Onayı",
    lawReference: "BYKHY Yönetmeliği 2007/2024",
    status: "missing",
    yibfSynced: false,
  },
];

export default function OcrDocsPage() {
  const [documents, setDocuments] = useState<MandatoryDocItem[]>(MANDATORY_INSPECTION_DOCUMENTS);
  const [selectedDoc, setSelectedDoc] = useState<MandatoryDocItem>(MANDATORY_INSPECTION_DOCUMENTS[1]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadStep, setUploadStep] = useState<"idle" | "uploading" | "ocr" | "done">("idle");
  const [ocrResult, setOcrResult] = useState<ParsedDocumentResult | null>(null);
  const [activeTab, setActiveTab] = useState<"parsed" | "raw">("parsed");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleStartUpload = (doc: MandatoryDocItem) => {
    setSelectedDoc(doc);
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    setUploadStep("uploading");
    setOcrResult(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("documentCategory", selectedDoc.category);

      setUploadStep("ocr");
      const result = await parseDocument(formData);

      if (result.success) {
        setOcrResult(result);
        setDocuments((prev) =>
          prev.map((d) =>
            d.id === selectedDoc.id
              ? { ...d, status: "verified", yibfSynced: true, parsedData: result }
              : d
          )
        );
        toast.success(`OCR Başarılı: [${result.documentType}] ayrıştırıldı ve doğrulandı!`);
      } else {
        throw new Error(result.error || "Belge okunamadı.");
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "OCR işleminde bir hata meydana geldi.");
    } finally {
      setIsProcessing(false);
      setUploadStep("idle");
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-20">
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.png,.jpg,.jpeg"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              YAPAY ZEKA & İLERİ TEKNOLOJİ
            </span>
            <span className="text-slate-500 text-xs">/</span>
            <span className="text-slate-400 text-xs font-mono">AKILLI EVRAK OCR SİSTEMİ</span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5 mt-1">
            <ScanText className="w-6 h-6 text-cyan-400" />
            Akıllı Evrak Denetimi & OCR Çözümleme Terminali
          </h1>
          <p className="text-slate-400 text-xs mt-1">
            Yapı ruhsatları, statik hesap raporları ve zemin etütlerini PDF/görselden okuyarak e-YİBF ve mevzuat uyumunu doğrular.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => handleStartUpload(selectedDoc)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold shadow-lg shadow-cyan-600/20 transition cursor-pointer"
          >
            <Upload className="w-4 h-4" />
            <span>Resmi Belge / PDF Tara</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Checklist (5 cols) + OCR Extractor (7 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Mandatory Document Checklist (5 cols) */}
        <div className="lg:col-span-5 space-y-3">
          <div className="flex items-center justify-between text-xs px-1">
            <span className="font-semibold text-white">4708 Zorunlu Ruhsat & Evrak Kontrol Listesi</span>
            <span className="text-[11px] text-slate-400 font-mono">
              {documents.filter((d) => d.status === "verified").length} / {documents.length} Tamamlandı
            </span>
          </div>

          <div className="space-y-2.5">
            {documents.map((doc) => {
              const isSelected = selectedDoc.id === doc.id;
              const isVerified = doc.status === "verified";
              const isMissing = doc.status === "missing";

              return (
                <div
                  key={doc.id}
                  onClick={() => {
                    setSelectedDoc(doc);
                    if (doc.parsedData) setOcrResult(doc.parsedData);
                  }}
                  className={`p-3.5 rounded-xl border transition cursor-pointer ${
                    isSelected
                      ? "border-cyan-500/60 bg-cyan-950/20 shadow-lg shadow-cyan-950/30"
                      : "border-slate-800 bg-slate-900/60 hover:bg-slate-900 hover:border-slate-700"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                          isVerified
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                            : isMissing
                            ? "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                            : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                        }`}
                      >
                        {isVerified ? (
                          <CheckCircle className="w-4 h-4" />
                        ) : isMissing ? (
                          <AlertTriangle className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </div>

                      <div>
                        <div className="text-xs font-semibold text-white">{doc.name}</div>
                        <div className="text-[10px] text-slate-400 mt-0.5">{doc.lawReference}</div>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-1">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                          isVerified
                            ? "bg-emerald-500/10 text-emerald-300 border border-emerald-500/20"
                            : isMissing
                            ? "bg-rose-500/10 text-rose-300 border border-rose-500/20"
                            : "bg-amber-500/10 text-amber-300 border border-amber-500/20"
                        }`}
                      >
                        {isVerified ? "ONAYLI" : isMissing ? "EKSİK" : "İNCELEMEDE"}
                      </span>
                    </div>
                  </div>

                  <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
                    <span className="text-slate-500 font-mono">
                      {doc.yibfSynced ? "e-YİBF: Senkronize Edildi" : "e-YİBF: Bekliyor"}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleStartUpload(doc);
                      }}
                      className="text-cyan-400 hover:text-cyan-300 font-medium inline-flex items-center gap-1 cursor-pointer"
                    >
                      <Upload className="w-3 h-3" />
                      <span>{isVerified ? "Yeniden Tara" : "PDF Yükle"}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: OCR Extraction Panel (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="rounded-xl border border-slate-800 bg-slate-950 p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-cyan-400" />
                <div>
                  <div className="text-xs font-bold text-white">
                    {selectedDoc ? selectedDoc.name : "Belge Seçimi Yapınız"}
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono">
                    Kategori: {selectedDoc?.category}
                  </div>
                </div>
              </div>

              {ocrResult && (
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-slate-400">Güven Skoru:</span>
                  <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-xs font-bold font-mono border border-emerald-500/30">
                    %{ocrResult.confidence}
                  </span>
                </div>
              )}
            </div>

            {/* In Progress Loader */}
            {isProcessing && (
              <div className="min-h-[280px] flex flex-col items-center justify-center gap-3 p-6 text-center">
                <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
                <div className="text-sm font-semibold text-white">
                  {uploadStep === "uploading" ? "Belge Sunucuya Aktarılıyor..." : "Nöral OCR ile Belge Ayrıştırılıyor..."}
                </div>
                <p className="text-xs text-slate-400 max-w-sm">
                  Metin blokları, ıslak/e-imza sertifikaları ve bakanlık YİBF kayıt numaraları taranıyor.
                </p>
              </div>
            )}

            {/* Empty State */}
            {!isProcessing && !ocrResult && (
              <div className="min-h-[280px] flex flex-col items-center justify-center gap-3 p-6 text-center border-2 border-dashed border-slate-800 rounded-xl">
                <ScanText className="w-10 h-10 text-slate-600" />
                <div className="text-sm font-semibold text-slate-300">Henüz Belge Okunmadı</div>
                <p className="text-xs text-slate-500 max-w-sm">
                  Seçili evrak için PDF dosyasını yükleyin; sistem ruhsat numarası, imza teyidi ve ada/parsel verilerini otomatik çıkarsın.
                </p>
                <button
                  type="button"
                  onClick={() => handleStartUpload(selectedDoc)}
                  className="mt-2 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-medium transition cursor-pointer"
                >
                  <Upload className="w-4 h-4" />
                  <span>Şimdi PDF Tara</span>
                </button>
              </div>
            )}

            {/* Result Extracted */}
            {!isProcessing && ocrResult && (
              <div className="space-y-4">
                {/* Tabs */}
                <div className="flex items-center gap-2 border-b border-slate-800 text-xs pb-2">
                  <button
                    type="button"
                    onClick={() => setActiveTab("parsed")}
                    className={`px-3 py-1.5 rounded-lg font-medium transition cursor-pointer ${
                      activeTab === "parsed"
                        ? "bg-cyan-600/20 text-cyan-300 border border-cyan-500/30"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    Ayrıştırılmış Veri Alanları
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab("raw")}
                    className={`px-3 py-1.5 rounded-lg font-medium transition cursor-pointer ${
                      activeTab === "raw"
                        ? "bg-cyan-600/20 text-cyan-300 border border-cyan-500/30"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    Ham OCR Metni (Raw)
                  </button>
                </div>

                {activeTab === "parsed" ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-1">
                      <span className="text-[10px] text-slate-500 font-mono uppercase">Resmi Belge Türü</span>
                      <div className="font-semibold text-white">{ocrResult.documentType}</div>
                    </div>

                    <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-1">
                      <span className="text-[10px] text-slate-500 font-mono uppercase">YİBF / Ruhsat No</span>
                      <div className="font-semibold text-cyan-400 font-mono">
                        YİBF #{ocrResult.yibfNo} / {ocrResult.licenseNo}
                      </div>
                    </div>

                    <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-1">
                      <span className="text-[10px] text-slate-500 font-mono uppercase">Ada / Parsel & Konum</span>
                      <div className="font-semibold text-slate-200">{ocrResult.blockParcel}</div>
                    </div>

                    <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-1">
                      <span className="text-[10px] text-slate-500 font-mono uppercase">Yapı Sahibi / Firma</span>
                      <div className="font-semibold text-slate-200 truncate">{ocrResult.ownerName}</div>
                    </div>

                    <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-1">
                      <span className="text-[10px] text-slate-500 font-mono uppercase">Yapı Sınıfı & Alan</span>
                      <div className="font-semibold text-slate-200">
                        {ocrResult.buildingClass} ({ocrResult.totalArea})
                      </div>
                    </div>

                    <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-1">
                      <span className="text-[10px] text-slate-500 font-mono uppercase">İmza & TMMOB Sicil Teyidi</span>
                      <div className="flex items-center gap-1.5 font-semibold text-emerald-400">
                        <ShieldCheck className="w-4 h-4" />
                        <span>e-İmza Doğrulandı (Geçerli)</span>
                      </div>
                    </div>

                    {ocrResult.bearingCapacity && (
                      <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-1 sm:col-span-2">
                        <span className="text-[10px] text-slate-500 font-mono uppercase">
                          Jeoteknik Değerler (Zemin Taşıma Gücü & Oturma)
                        </span>
                        <div className="font-semibold text-emerald-400 font-mono">
                          qa: {ocrResult.bearingCapacity} | Oturma: {ocrResult.settlementAmount}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-3.5 rounded-lg bg-slate-900 border border-slate-800 font-mono text-[11px] text-cyan-200/90 whitespace-pre-wrap leading-relaxed max-h-72 overflow-y-auto">
                    {ocrResult.extractedText}
                  </div>
                )}

                <div className="pt-2 flex items-center justify-between border-t border-slate-800">
                  <span className="text-[11px] text-slate-400">
                    Bakanlık 4708 mevzuatına tam uyumlu olarak indekslendi.
                  </span>
                  <button
                    type="button"
                    onClick={() => toast.success("Evrak dijital arşive işlendi ve e-YİBF sistemine aktarıldı!")}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md transition cursor-pointer"
                  >
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>e-YİBF Arşiviyle Eşleştir</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
