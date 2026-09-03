/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * This code is the property of NXA Software.
 */

"use client";

import React, { useEffect, useRef, useState } from "react";

interface PhotoAnnotatorProps {
  imageUrl?: string;
  onSaveAnnotation?: (dataUrl: string) => void;
}

export default function PhotoAnnotator({ imageUrl, onSaveAnnotation }: PhotoAnnotatorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawingMode, setIsDrawingMode] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (imageUrl && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      const img = new Image();
      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx?.drawImage(img, 0, 0);
        setIsLoaded(true);
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
    ctx.strokeStyle = "#ef4444";
    ctx.lineWidth = 4;
    ctx.lineCap = "round";
    ctx.lineTo((e.clientX - rect.left) * scaleX, (e.clientY - rect.top) * scaleY);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    // Auto-save annotation when drawing stops
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
    };
    img.src = imageUrl;
  };

  const handleSaveAnnotation = () => {
    if (!canvasRef.current || !onSaveAnnotation) return;
    const dataUrl = canvasRef.current.toDataURL("image/png");
    onSaveAnnotation(dataUrl);
  };

  return (
    <div className="relative w-full bg-slate-950 rounded-xl overflow-hidden border border-slate-800 min-h-[600px] flex items-center justify-center">
      <div className="absolute top-4 left-4 z-20 flex items-center gap-2 bg-slate-900/90 backdrop-blur p-2 rounded-lg border border-slate-700">
        <button
          onClick={() => setIsDrawingMode(false)}
          className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
            !isDrawingMode ? "bg-blue-600 text-white" : "text-slate-300 hover:bg-slate-800"
          }`}
        >
          🔍 İncele
        </button>
        <button
          onClick={() => setIsDrawingMode(true)}
          className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
            isDrawingMode ? "bg-red-600 text-white" : "text-slate-300 hover:bg-slate-800"
          }`}
        >
          🖍️ Kırmızı Kalem
        </button>
        <button
          onClick={clearCanvas}
          className="px-3 py-1.5 text-xs font-medium text-slate-300 hover:bg-slate-800 rounded-md transition-colors"
        >
          🗑️ Çizimi Temizle
        </button>
        {onSaveAnnotation && (
          <button
            onClick={handleSaveAnnotation}
            className="px-3 py-1.5 text-xs font-medium bg-green-600 hover:bg-green-500 text-white rounded-md transition-colors animate-pulse"
          >
            ✅ Çizimi Onayla
          </button>
        )}
      </div>

      {!isLoaded && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-slate-950/80">
          <div className="flex flex-col items-center gap-3">
            <p className="text-sm text-slate-300">Fotoğraf yükleniyor...</p>
          </div>
        </div>
      )}

      <canvas
        ref={canvasRef}
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
        className={`max-w-full max-h-full ${isDrawingMode ? "cursor-crosshair" : "cursor-default"}`}
      />
    </div>
  );
}
