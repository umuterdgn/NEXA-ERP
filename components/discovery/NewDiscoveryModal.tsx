"use client";

/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Nexa ERP Web - Yeni Keşif Ekleme Modülü (Discovery Modal)
 */

import React, { useState, useRef } from "react";
import {
  Plus,
  X,
  Compass,
  MapPin,
  Calendar,
  Building2,
  UserCheck,
  FileText,
  Upload,
  CheckCircle2,
  Trash2,
  Navigation,
  Sparkles,
} from "lucide-react";
import toast from "react-hot-toast";

interface ProjectOption {
  id: string;
<<<<<<< HEAD
  title?: string | null;
  name?: string | null;
  city?: string | null;
=======
  title?: string | null;
  name?: string | null;
  city?: string | null;
>>>>>>> 0bc202996566110dca4d9702def0abbe9d37379f
}

interface NewDiscoveryModalProps {
  buttonText?: string;
  className?: string;
  projects?: ProjectOption[];
  onSuccess?: () => void;
  defaultCoords?: { lat: number; lng: number };
}

export default function NewDiscoveryModal({
  buttonText = "+ Yeni Keşif Ekle",
  className = "",
  projects = [],
  onSuccess,
  defaultCoords,
}: NewDiscoveryModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  // Form State
  const [title, setTitle] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [selectedProjectId, setSelectedProjectId] = useState(projects[0]?.id || "");
  const [clientName, setClientName] = useState("");
  const [surveyorName, setSurveyorName] = useState("Ahmet Yılmaz (Baş Sörveyör)");
  const [notes, setNotes] = useState("");
  const [estimatedArea, setEstimatedArea] = useState("");
  const [estimatedBudget, setEstimatedBudget] = useState("");
  const [latitude, setLatitude] = useState(defaultCoords?.lat ? defaultCoords.lat.toString() : "36.5878");
  const [longitude, setLongitude] = useState(defaultCoords?.lng ? defaultCoords.lng.toString() : "36.1735");
  const [uploadedFiles, setUploadedFiles] = useState<Array<{ name: string; size: number }>>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Tarayıcıdan Anlık GPS Konumu Çekme
  const handleGetLiveGps = () => {
    if (typeof navigator !== "undefined" && navigator.geolocation) {
      toast.loading("GPS uydularından konum alınıyor...", { id: "gps-fetch" });
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLatitude(pos.coords.latitude.toFixed(6));
          setLongitude(pos.coords.longitude.toFixed(6));
          toast.success("Hassas GPS koordinatları alındı!", { id: "gps-fetch" });
        },
        (err) => {
          console.warn("[GPS Error]:", err);
          toast.error("GPS konumuna erişilemedi. Lütfen elle giriniz.", { id: "gps-fetch" });
        },
        { enableHighAccuracy: true, timeout: 8000 }
      );
    } else {
      toast.error("Cihazınızda GPS desteği bulunamadı.");
    }
  };

  // Drag & Drop Dosya Yönetimi
  const handleFilesAdded = (fileList: FileList | null) => {
    if (!fileList) return;
    const newItems = Array.from(fileList).map((f) => ({
      name: f.name,
      size: Math.round(f.size / 1024), // KB
    }));
    setUploadedFiles((prev) => [...prev, ...newItems]);
    toast.success(`${newItems.length} dosya keşif dosyalarına eklendi.`);
  };

  const handleRemoveFile = (index: number) => {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      toast.error("Lütfen Keşif Başlığını giriniz.");
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await fetch("/api/admin/discoveries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          date,
          projectId: selectedProjectId,
          clientName: clientName.trim(),
          surveyorName,
          notes: notes.trim(),
          estimatedArea: parseFloat(estimatedArea) || 0,
          estimatedBudget: parseFloat(estimatedBudget) || 0,
          latitude: parseFloat(latitude) || null,
          longitude: parseFloat(longitude) || null,
          files: uploadedFiles,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Keşif kaydedilemedi");
      }

      toast.success("Yeni keşif kaydı ve saha ön etüdü başarıyla oluşturuldu!");
      setIsOpen(false);
      setTitle("");
      setNotes("");
      setUploadedFiles([]);
      onSuccess?.();
    } catch (err: any) {
      toast.error(err?.message || "Kayıt sırasında bir hata oluştu.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {/* Tetikleyici Buton */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className={
          className ||
          "flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-semibold shadow-lg shadow-cyan-600/20 transition-all border border-cyan-400/20"
        }
      >
        <Plus className="w-4 h-4" />
        <span>{buttonText}</span>
      </button>

      {/* MODAL DIALOG */}
      {isOpen && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                  <Compass className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    Yeni Saha Keşif & Ön Etüt Formu
                  </h3>
                  <p className="text-xs text-slate-400">
                    Saha durumu, fiziksel engeller, GPS koordinatları ve etüt krokileri
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form Scroll Content */}
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
              {/* 1. Keşif Başlığı ve Tarihi */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2 space-y-1">
                  <label className="text-xs font-semibold text-slate-300">
                    Keşif Başlığı <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Örn: Blok-C Temel Zemin & Altyapı Ön Keşfi"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-cyan-400" />
                    Keşif Tarihi
                  </label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              {/* 2. Müşteri / Proje & Sörveyör */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300 flex items-center gap-1">
                    <Building2 className="w-3.5 h-3.5 text-cyan-400" />
                    İlgili Proje
                  </label>
                  <select
                    value={selectedProjectId}
                    onChange={(e) => setSelectedProjectId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                  >
                    <option value="">(Genel / Proje Seçiniz)</option>
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.title || p.name} {p.city ? `(${p.city})` : ""}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">
                    Müşteri / Kurum
                  </label>
                  <input
                    type="text"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    placeholder="Örn: Nexa Towers A.Ş."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300 flex items-center gap-1">
                    <UserCheck className="w-3.5 h-3.5 text-cyan-400" />
                    Sörveyör / Yetkili
                  </label>
                  <select
                    value={surveyorName}
                    onChange={(e) => setSurveyorName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                  >
                    <option value="Ahmet Yılmaz (Baş Sörveyör)">Ahmet Yılmaz (Baş Sörveyör)</option>
                    <option value="Mehmet Demir (Harita Y. Müh.)">Mehmet Demir (Harita Y. Müh.)</option>
                    <option value="Caner Özkan (Saha Şefi)">Caner Özkan (Saha Şefi)</option>
                    <option value="Ali Kaya (Topograf)">Ali Kaya (Topograf)</option>
                  </select>
                </div>
              </div>

              {/* 3. Tahmini Metraj & Bütçe */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">
                    Tahmini Alan / Metraj (m²)
                  </label>
                  <input
                    type="number"
                    value={estimatedArea}
                    onChange={(e) => setEstimatedArea(e.target.value)}
                    placeholder="Örn: 1450"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">
                    Tahmini Keşif Bütçesi (₺)
                  </label>
                  <input
                    type="number"
                    value={estimatedBudget}
                    onChange={(e) => setEstimatedBudget(e.target.value)}
                    placeholder="Örn: 2800000"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              {/* 4. Keşif Detayları ve Notlar */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1">
                  <FileText className="w-3.5 h-3.5 text-cyan-400" />
                  Keşif Detayları ve Notlar (Saha durumu, fiziksel engeller)
                </label>
                <textarea
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Saha sınırında yüksek gerilim hattı mevcut. Zemin killi-tınlı yapıda olup batı aksında 1.2 metre eğim farkı bulunmaktadır..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 leading-relaxed resize-none"
                />
              </div>

              {/* 5. Keşif Koordinatları (Map Picker / GPS) */}
              <div className="p-3.5 bg-slate-950/80 rounded-xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-cyan-400" />
                    Keşif Koordinatları (Harita & GPS)
                  </span>

                  <button
                    type="button"
                    onClick={handleGetLiveGps}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-cyan-950/60 border border-cyan-800/60 text-cyan-300 text-[11px] font-semibold hover:bg-cyan-900/60 transition"
                  >
                    <Navigation className="w-3.5 h-3.5" />
                    <span>Mevcut GPS Konumunu Al</span>
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] text-slate-400 font-mono">Enlem (Latitude)</label>
                    <input
                      type="text"
                      value={latitude}
                      onChange={(e) => setLatitude(e.target.value)}
                      placeholder="36.5878"
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 font-mono">Boylam (Longitude)</label>
                    <input
                      type="text"
                      value={longitude}
                      onChange={(e) => setLongitude(e.target.value)}
                      placeholder="36.1735"
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* 6. Medya Yükleme (Drag & Drop File Upload) */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1">
                  <Upload className="w-3.5 h-3.5 text-cyan-400" />
                  Saha Fotoğrafları & Ön Etüt Krokileri (Drag & Drop)
                </label>

                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragOver(true);
                  }}
                  onDragLeave={() => setIsDragOver(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDragOver(false);
                    handleFilesAdded(e.dataTransfer.files);
                  }}
                  onClick={() => fileInputRef.current?.click()}
                  className={`p-5 rounded-xl border-2 border-dashed text-center cursor-pointer transition-all ${
                    isDragOver
                      ? "border-cyan-500 bg-cyan-500/10"
                      : "border-slate-800 hover:border-slate-700 bg-slate-950/50"
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="image/*,.pdf,.dwg,.dxf"
                    className="hidden"
                    onChange={(e) => handleFilesAdded(e.target.files)}
                  />
                  <Upload className="w-6 h-6 text-cyan-400 mx-auto mb-1.5" />
                  <p className="text-xs font-medium text-slate-300">
                    Dosyaları buraya sürükleyin veya <span className="text-cyan-400 underline">seçin</span>
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    JPG, PNG, DWG veya PDF etüt dosyaları
                  </p>
                </div>

                {/* Yüklenen Dosyalar Listesi */}
                {uploadedFiles.length > 0 && (
                  <div className="space-y-1.5 max-h-32 overflow-y-auto pt-1">
                    {uploadedFiles.map((f, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs"
                      >
                        <span className="text-slate-300 truncate max-w-[80%]">
                          📎 {f.name} ({f.size} KB)
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveFile(i)}
                          className="text-red-400 hover:text-red-300"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Modal Footer Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
                >
                  İptal
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-bold shadow-lg shadow-cyan-600/30 transition disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <span>Kaydediliyor...</span>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Keşfi Kaydet & Sisteme İlet</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
<<<<<<< HEAD

=======
>>>>>>> 0bc202996566110dca4d9702def0abbe9d37379f
