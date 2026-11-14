"use client";
/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Proje Detayları Belge & PDF Yükleme Modalı
 */

import React, { useState } from "react";
import {
  FileText,
  Upload,
  X,
  Loader2,
  CheckCircle2,
  Sparkles,
  FileCode,
  FileCheck,
  FilePlus,
} from "lucide-react";
import toast from "react-hot-toast";
import { createProjectDocumentAction } from "@/actions/project-documents";
import AiBlueprintAnalysisModal from "@/components/bim/AiBlueprintAnalysisModal";

interface ProjectDocumentUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  projectName?: string;
  onSuccess?: () => void;
}

export default function ProjectDocumentUploadModal({
  isOpen,
  onClose,
  projectId,
  projectName,
  onSuccess,
}: ProjectDocumentUploadModalProps) {
  const [title, setTitle] = useState("");
  const [type, setType] = useState("BLUEPRINT");
  const [notes, setNotes] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [fileUrl, setFileUrl] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  // AI Analysis trigger state after successful PDF upload
  const [showAiModal, setShowAiModal] = useState(false);
  const [uploadedDocInfo, setUploadedDocInfo] = useState<{ title: string; url: string } | null>(null);

  if (!isOpen && !showAiModal) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0] || null;
    setFile(selected);
    if (selected && !title) {
      // Auto-set title from file name without extension
      const cleanName = selected.name.replace(/\.[^/.]+$/, "");
      setTitle(cleanName);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      toast.error("Lütfen belge adını giriniz.");
      return;
    }

    if (!file && !fileUrl.trim()) {
      toast.error("Lütfen bir PDF/belge dosyası seçiniz veya bağlantı giriniz.");
      return;
    }

    setIsUploading(true);

    try {
      let finalUrl = fileUrl.trim();

      // Fiziksel dosya seçildiyse /api/upload endpointine yükle
      if (file) {
        const uploadFormData = new FormData();
        uploadFormData.append("file", file);
        uploadFormData.append("projectId", projectId);

        const uploadRes = await fetch("/api/upload", {
          method: "POST",
          body: uploadFormData,
        });

        if (!uploadRes.ok) {
          throw new Error("Dosya sunucuya yüklenemedi.");
        }

        const uploadData = await uploadRes.json();
        finalUrl = uploadData.url || finalUrl;
      }

      // Server Action ile veritabanına Document kaydı oluştur
      const res = await createProjectDocumentAction({
        projectId,
        title: title.trim(),
        type,
        fileUrl: finalUrl,
        notes: notes.trim() || null,
        fileSizeMB: file ? Number((file.size / (1024 * 1024)).toFixed(2)) : 0,
      });

      if (res.success) {
        toast.success(res.message || "Belge başarıyla yüklendi!");

        const isPdf =
          file?.type === "application/pdf" ||
          finalUrl.toLowerCase().endsWith(".pdf") ||
          type === "BLUEPRINT";

        // Formu sıfırla
        setTitle("");
        setNotes("");
        setFile(null);
        setFileUrl("");

        if (onSuccess) {
          onSuccess();
        }

        // Eğer PDF veya Proje paftasıysa AI analiz önerisi sun
        if (isPdf) {
          setUploadedDocInfo({ title: title.trim(), url: finalUrl });
          setShowAiModal(true);
          onClose();
        } else {
          onClose();
        }
      } else {
        toast.error(res.error || "Belge kaydedilemedi.");
      }
    } catch (err: any) {
      console.error("Document upload error:", err);
      toast.error(err.message || "Yükleme sırasında hata oluştu.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-lg my-auto rounded-3xl border border-slate-800 bg-slate-950 p-6 sm:p-8 shadow-2xl text-white space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/15 border border-blue-500/30 text-blue-400">
                  <FilePlus className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Belge / Proje Yükle</h3>
                  <p className="text-xs text-slate-400 truncate max-w-xs sm:max-w-sm">
                    {projectName ? `Proje: ${projectName}` : "Proje Evrak ve Pafta Arşivi"}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                disabled={isUploading}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Belge Adı */}
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-300">
                  Belge / Pafta Adı *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Örn: Zemin Kat Mimari Tatbikat Paftası"
                  className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
                />
              </div>

              {/* Belge Tipi */}
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-300">
                  Belge & Disiplin Türü *
                </label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3.5 py-2.5 text-sm text-white focus:border-blue-500 focus:outline-none"
                >
                  <option value="BLUEPRINT">📐 Mimari / Statik Proje (Blueprint)</option>
                  <option value="MIMARI">🧱 Mimari Proje Paftası</option>
                  <option value="STATIK">🏗️ Statik & Kalıp Planı</option>
                  <option value="ELEKTRIK">⚡ Elektrik Tesisat Projesi</option>
                  <option value="MEKANIK">🔧 Mekanik & Sıhhi Tesisat</option>
                  <option value="SPECIFICATION">📄 Mahal Listesi & Teknik Şartname</option>
                  <option value="CONTRACT">📑 Sözleşme & Hakediş Evrakı</option>
                  <option value="OTHER">📁 Diğer Resmi Belge</option>
                </select>
              </div>

              {/* Dosya Seçimi */}
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-300">
                  PDF veya Çizim Dosyası Yükle *
                </label>
                <div className="relative rounded-2xl border-2 border-dashed border-slate-800 bg-slate-900/50 p-5 text-center hover:border-blue-500/50 transition-colors">
                  <input
                    type="file"
                    accept=".pdf,.dwg,.dxf,.ifc,image/*"
                    onChange={handleFileChange}
                    className="absolute inset-0 h-full w-full opacity-0 cursor-pointer"
                  />
                  <div className="flex flex-col items-center justify-center gap-2">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400">
                      <Upload className="h-5 w-5" />
                    </div>
                    {file ? (
                      <div>
                        <p className="text-xs font-bold text-white truncate max-w-xs">{file.name}</p>
                        <p className="text-[11px] text-emerald-400">
                          {(file.size / (1024 * 1024)).toFixed(2)} MB • Hazır
                        </p>
                      </div>
                    ) : (
                      <div>
                        <p className="text-xs font-semibold text-slate-300">
                          Dosyayı buraya sürükleyin veya tıklayarak seçin
                        </p>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          PDF, DWG, DXF veya Görsel (Maks. 64 MB)
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Veya URL */}
              <div>
                <label className="mb-1 block text-[11px] font-medium text-slate-400">
                  Veya Harici Dosya / Bulut Bağlantısı (İsteğe Bağlı)
                </label>
                <input
                  type="url"
                  value={fileUrl}
                  onChange={(e) => setFileUrl(e.target.value)}
                  placeholder="https://drive.google.com/... veya https://..."
                  className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
                />
              </div>

              {/* Notlar */}
              <div>
                <label className="mb-1 block text-[11px] font-medium text-slate-400">
                  Revizyon Açıklaması veya Notlar
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Örn: Belediye onaylı nihai mimari revizyon..."
                  className="w-full resize-none rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
                />
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isUploading}
                  className="rounded-xl border border-slate-800 bg-slate-900 px-4 py-2.5 text-xs font-semibold text-slate-300 hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={isUploading}
                  className="flex items-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-500 px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-blue-600/20 transition-all cursor-pointer disabled:opacity-50"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Belge Kaydediliyor...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4" />
                      <span>Belgeyi Sisteme Yükle</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* AI Blueprint Vision Analiz Modalı (Yükleme sonrası otomatik veya manuel) */}
      {showAiModal && uploadedDocInfo && (
        <AiBlueprintAnalysisModal
          isOpen={showAiModal}
          onClose={() => {
            setShowAiModal(false);
            setUploadedDocInfo(null);
          }}
          documentTitle={uploadedDocInfo.title}
          documentUrl={uploadedDocInfo.url}
          projectId={projectId}
          onSuccessTransfer={() => {
            if (onSuccess) onSuccess();
          }}
        />
      )}
    </>
  );
}
