/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * This code is the property of NXA Software.
 * PhotoAnnotator - Saha Fotoğrafı Yükleme, Önizleme ve İşaretleme (Markup) Bileşeni
 */

"use client";

import React, { useEffect, useRef, useState } from "react";
import { Camera, UploadCloud, RefreshCw, ZoomIn, Edit3, Trash2, CheckCircle2, Loader2 } from "lucide-react";

interface PhotoAnnotatorProps {
  imageUrl?: string | null;
  onSaveAnnotation?: (dataUrl: string) => void;
  onImageUpload?: (dataUrl: string) => void;
}

export default function PhotoAnnotator({ imageUrl: initialImageUrl, onSaveAnnotation, onImageUpload }: PhotoAnnotatorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [imageUrl, setImageUrl] = useState<string | null>(initialImageUrl || null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isDrawingMode, setIsDrawingMode] = useState<boolean>(false);
  const [isDrawing, setIsDrawing] = useState<boolean>(false);
  const [isDragOver, setIsDragOver] = useState<boolean>(false);

  // Prop olarak dışarıdan imageUrl verilirse veya değişirse senkronize et
  useEffect(() => {
    if (initialImageUrl) {
      setImageUrl(initialImageUrl);
    }
  }, [initialImageUrl]);

  // ADIM 2: Gerçek ve Hızlı Dosya Okuma (FileReader) Entegrasyonu
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    processFile(file);
  };

  const processFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      console.warn("Lütfen geçerli bir görsel dosyası seçin");
      return;
    }

    setIsLoading(true); // Yükleme animasyonunu başlat

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setImageUrl(result); // Görseli state'e aktar (Önizleme veya Canvas için)
      onImageUpload?.(result);
      setIsLoading(false); // Yükleme animasyonunu BİTİR
    };

    reader.onerror = () => {
      console.error("Dosya okuma hatası");
      setIsLoading(false); // Hata durumunda da loading'i kapat ki ekran kilitlenmesin
    };

    reader.readAsDataURL(file); // Dosyayı base64 olarak oku
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  // Canvas üzerine görseli çiz
  useEffect(() => {
    if (imageUrl && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      const img = new Image();
      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx?.drawImage(img, 0, 0);
        setIsLoading(false);
        // İlk yüklemede de parent'a aktar
        if (onSaveAnnotation) {
          onSaveAnnotation(canvas.toDataURL("image/png"));
        }
      };
      img.onerror = () => {
        console.error("Görsel canvas üzerine yüklenemedi");
        setIsLoading(false);
      };
      img.src = imageUrl;
    }
  }, [imageUrl]);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawingMode || !canvasRef.current) return;
    const ctx = canvasRef.current.getContext("2d");
    if (!ctx) return;

    setIsDrawing(true);
    const rect = canvasRef.current.getBoundingClientRect();
    const scaleX = canvasRef.current.width / rect.width;
    const scaleY = canvasRef.current.height / rect.height;
    ctx.beginPath();
    ctx.moveTo((e.clientX - rect.left) * scaleX, (e.clientY - rect.top) * scaleY);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !isDrawingMode || !canvasRef.current) return;
    const ctx = canvasRef.current.getContext("2d");
    if (!ctx) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const scaleX = canvasRef.current.width / rect.width;
    const scaleY = canvasRef.current.height / rect.height;
    ctx.strokeStyle = "#ef4444"; // Kırmızı işaretleme rengi
    ctx.lineWidth = 4;
    ctx.lineCap = "round";
    ctx.lineTo((e.clientX - rect.left) * scaleX, (e.clientY - rect.top) * scaleY);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    // Çizim durduğunda otomatik kaydet
    if (canvasRef.current && onSaveAnnotation) {
      const dataUrl = canvasRef.current.toDataURL("image/png");
      onSaveAnnotation(dataUrl);
    }
  };

  const clearCanvas = () => {
    if (!canvasRef.current || !imageUrl) return;
    const ctx = canvasRef.current.getContext("2d");
    if (!ctx) return;

    const img = new Image();
    img.onload = () => {
      ctx.clearRect(0, 0, canvasRef.current!.width, canvasRef.current!.height);
      ctx.drawImage(img, 0, 0);
      if (onSaveAnnotation) {
        onSaveAnnotation(canvasRef.current!.toDataURL("image/png"));
      }
    };
    img.src = imageUrl;
  };

  const handleSaveAnnotation = () => {
    if (!canvasRef.current || !onSaveAnnotation) return;
    const dataUrl = canvasRef.current.toDataURL("image/png");
    onSaveAnnotation(dataUrl);
  };

  const handleResetImage = () => {
    setImageUrl(null);
    setIsDrawingMode(false);
    setIsDrawing(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="relative w-full bg-slate-950 rounded-xl overflow-hidden border border-slate-800 min-h-[420px] md:min-h-[500px] flex items-center justify-center">
      {/* ADIM 3: UI Kontrolü 1 - Eğer isLoading true ise "Fotoğraf yükleniyor..." spinner'ını göster */}
      {isLoading && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-slate-950/85 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-3 p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl">
            <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
            <p className="text-sm font-semibold text-slate-200">Fotoğraf yükleniyor...</p>
            <span className="text-[11px] text-slate-400">Görsel işleniyor ve optimize ediliyor</span>
          </div>
        </div>
      )}

      {/* ADIM 3: UI Kontrolü 2 - Eğer fotoğraf yüklenmediyse standart "Tıkla veya Sürükle Bırak" (Upload) UI'ını göster */}
      {!imageUrl && !isLoading && (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`w-full h-full min-h-[400px] flex flex-col items-center justify-center p-8 text-center cursor-pointer transition-all ${
            isDragOver
              ? "bg-amber-500/10 border-2 border-dashed border-amber-400 scale-[0.99]"
              : "hover:bg-slate-900/50 hover:border-slate-700"
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/jpg"
            capture="environment"
            onChange={handleImageUpload}
            className="hidden"
          />
          <div className="h-16 w-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mb-4 shadow-lg shadow-amber-500/10">
            <Camera className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-white mb-1">
            Saha Fotoğrafı Yükle veya Fotoğraf Çek
          </h3>
          <p className="text-xs text-slate-400 max-w-sm mb-4">
            Fotoğraf dosyasını buraya sürükleyin veya cihazınızdan seçmek için tıklayın (JPG, PNG, WebP)
          </p>
          <div className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold transition-all shadow-md shadow-amber-500/20">
            <UploadCloud className="w-4 h-4" />
            <span>Fotoğraf Seç</span>
          </div>
        </div>
      )}

      {/* ADIM 3: UI Kontrolü 3 - Eğer imageUrl dolu ise ve isLoading false ise, görseli çizim yapılacak <canvas> içine bas */}
      {imageUrl && !isLoading && (
        <>
          {/* Üst İşaretleme Toolbar'ı */}
          <div className="absolute top-4 left-4 z-20 flex flex-wrap items-center gap-2 bg-slate-900/90 backdrop-blur-md p-2 rounded-xl border border-slate-700 shadow-xl">
            <button
              type="button"
              onClick={() => setIsDrawingMode(false)}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                !isDrawingMode ? "bg-blue-600 text-white shadow-sm" : "text-slate-300 hover:bg-slate-800"
              }`}
            >
              <ZoomIn className="w-3.5 h-3.5" />
              <span>İncele</span>
            </button>
            <button
              type="button"
              onClick={() => setIsDrawingMode(true)}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                isDrawingMode ? "bg-red-600 text-white shadow-sm" : "text-slate-300 hover:bg-slate-800"
              }`}
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Kırmızı Kalem</span>
            </button>
            <button
              type="button"
              onClick={clearCanvas}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:bg-slate-800 rounded-lg transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Çizimi Temizle</span>
            </button>
            <button
              type="button"
              onClick={handleResetImage}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:bg-slate-800 rounded-lg transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Fotoğrafı Değiştir</span>
            </button>
            {onSaveAnnotation && (
              <button
                type="button"
                onClick={handleSaveAnnotation}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors shadow-md shadow-emerald-600/20"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Çizimi Onayla</span>
              </button>
            )}
          </div>

          <canvas
            ref={canvasRef}
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            className={`max-w-full max-h-[75vh] object-contain ${isDrawingMode ? "cursor-crosshair" : "cursor-default"}`}
          />
        </>
      )}
    </div>
  );
}
