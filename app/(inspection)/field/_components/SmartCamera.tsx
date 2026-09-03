/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * This code is the property of NXA Software.
 */

"use client";

import React, { useState, useRef } from "react";
import { Camera, MapPin, CheckCircle, XCircle, Mic, X, AlertTriangle } from "lucide-react";
import { saveInspection } from "../actions";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";
import { offlineQueue } from "@/utils/offlineQueue";

interface SmartCameraProps {
  yibfId: string;
}

export default function SmartCamera({ yibfId }: SmartCameraProps) {
  const [photoUrl, setPhotoUrl] = useState<string>("");
  const [gpsLocation, setGpsLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isClassificationModalOpen, setIsClassificationModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [classification, setClassification] = useState({
    category: "",
    section: "",
    result: "" as "PASS" | "FAIL",
    description: "",
  });
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [visionResult, setVisionResult] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { isOnline } = useNetworkStatus();

  const categories = [
    { id: "donati", label: "Donatı", icon: "🔩" },
    { id: "beton", label: "Beton", icon: "🧱" },
    { id: "kalip", label: "Kalıp", icon: "📐" },
    { id: "duvar", label: "Duvar", icon: "🧱" },
    { id: "tesisat", label: "Tesisat", icon: "🔧" },
    { id: "diger", label: "Diğer", icon: "📋" },
  ];

  const sections = [
    { id: "temel", label: "Temel" },
    { id: "bodrum", label: "Bodrum" },
    { id: "zemin", label: "Zemin" },
    { id: "1kat", label: "1. Kat" },
    { id: "2kat", label: "2. Kat" },
    { id: "catisan", label: "Çatı" },
  ];

  const handlePhotoCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Create preview URL
      const previewUrl = URL.createObjectURL(file);
      setPhotoUrl(previewUrl);

      // Get GPS location
      if (navigator.geolocation) {
        try {
          const position = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
              enableHighAccuracy: true,
              timeout: 10000,
              maximumAge: 0,
            });
          });
          setGpsLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        } catch (error) {
          console.error("GPS alınamadı:", error);
        }
      }

      // AI Vision Analysis
      if (isOnline) {
        setIsAnalyzing(true);
        try {
          const base64 = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.readAsDataURL(file);
          });

          const response = await fetch("/api/ai/vision", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ type: "SITE_PHOTO", image: base64 }),
          });

          const result = await response.json();
          if (result.success) {
            setVisionResult(result.data);
          }
        } catch (error) {
          console.error("AI Vision error:", error);
        } finally {
          setIsAnalyzing(false);
        }
      }

      // Open classification modal
      setIsClassificationModalOpen(true);
    }
  };

  const handleCameraClick = () => {
    fileInputRef.current?.click();
  };

  const handleClassificationSubmit = async () => {
    if (!classification.category || !classification.section || !classification.result) {
      alert("Lütfen tüm alanları doldurun");
      return;
    }

    setIsSubmitting(true);

    try {
      // Upload photo to UploadThing and get URL (TODO: implement)
      const uploadedPhotoUrl = photoUrl; // For now, use the preview URL

      const inspectionData = {
        id: Date.now().toString(),
        yibfId,
        photoUrl: uploadedPhotoUrl,
        gpsLocation,
        classification,
        timestamp: Date.now(),
      };

      if (isOnline) {
        // Online: Save directly to server
        const result = await saveInspection({
          yibfId,
          photoUrl: uploadedPhotoUrl,
          gpsLocation,
          classification,
        });

        if (result.success) {
          alert("Kayıt başarıyla tamamlandı!");
        } else {
          alert(result.error || "Kayıt sırasında hata oluştu");
          return;
        }
      } else {
        // Offline: Add to queue
        offlineQueue.add(inspectionData);
        alert("Çevrimdışı modda kayıt cihaza kaydedildi. İnternet bağlandığında otomatik senkronize edilecek.");
      }

      // Reset form
      setPhotoUrl("");
      setGpsLocation(null);
      setClassification({ category: "", section: "", result: "PASS" as "PASS" | "FAIL", description: "" });
      setIsClassificationModalOpen(false);
    } catch (error) {
      console.error("Kayıt hatası:", error);
      alert("Kayıt sırasında hata oluştu");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleModalClose = () => {
    setIsClassificationModalOpen(false);
    setPhotoUrl("");
    setGpsLocation(null);
    setClassification({ category: "", section: "", result: "PASS" as "PASS" | "FAIL", description: "" });
    setTranscript("");
    setIsListening(false);
  };

  const handleVoiceInput = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert('Tarayıcınız ses tanımayı desteklemiyor');
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();

    recognition.lang = 'tr-TR';
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => {
      setIsListening(true);
      setTranscript("");
    };

    recognition.onresult = async (event: any) => {
      const text = event.results[0][0].transcript;
      setTranscript(text);
      setIsListening(false);

      // Send to AI API for parsing
      try {
        const response = await fetch('/api/ai/parse-inspection', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text }),
        });

        if (response.ok) {
          const parsed = await response.json();
          
          // Auto-fill the form
          setClassification(prev => ({
            ...prev,
            section: parsed.floor || prev.section,
            category: parsed.category || prev.category,
            description: parsed.issue || text,
            result: parsed.priority === 'CRITICAL' ? 'FAIL' : prev.result,
          }));
        }
      } catch (error) {
        console.error('AI parsing error:', error);
        // Fallback: just use the transcript as description
        setClassification(prev => ({ ...prev, description: text }));
      }
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  };

  return (
    <>
      <div className="space-y-4">
        {/* Camera Button */}
        <button
          onClick={handleCameraClick}
          className="w-full aspect-square bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl flex flex-col items-center justify-center gap-4 hover:from-blue-500 hover:to-blue-600 transition-all active:scale-95 shadow-2xl"
        >
          <Camera className="w-20 h-20 text-white" />
          <span className="text-white text-xl font-semibold">Fotoğraf Çek</span>
          <span className="text-blue-200 text-sm">Kamerayı açmak için dokunun</span>
        </button>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handlePhotoCapture}
          className="hidden"
        />

        {/* GPS Status */}
        {gpsLocation && (
          <div className="bg-green-900/30 border border-green-700 rounded-lg p-3 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-green-400" />
            <div className="flex-1">
              <p className="text-green-400 text-sm font-medium">GPS Konumu Alındı</p>
              <p className="text-slate-400 text-xs">
                {gpsLocation.lat.toFixed(6)}, {gpsLocation.lng.toFixed(6)}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Classification Modal */}
      {isClassificationModalOpen && (
        <div className="fixed inset-0 bg-black/80 flex items-end sm:items-center justify-center z-50 p-4">
          <div className="bg-slate-900 rounded-t-3xl sm:rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6 space-y-6">
              {/* Header */}
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-white">Sınıflandırma</h2>
                <button
                  onClick={handleModalClose}
                  className="text-slate-400 hover:text-white transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Photo Preview */}
              {photoUrl && (
                <div className="aspect-video bg-slate-800 rounded-lg overflow-hidden relative">
                  <img src={photoUrl} alt="Çekilen fotoğraf" className="w-full h-full object-cover" />
                  {isAnalyzing && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <div className="text-center">
                        <div className="w-8 h-8 border-4 border-blue-400 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                        <p className="text-white text-sm">AI Analizi Yapılıyor...</p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Vision Result Alert */}
              {visionResult && (
                <div className={`p-4 rounded-lg border ${
                  visionResult.hasDefect
                    ? "bg-orange-900/30 border-orange-700"
                    : "bg-green-900/30 border-green-700"
                }`}>
                  <div className="flex items-start gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      visionResult.hasDefect ? "bg-orange-600/30" : "bg-green-600/30"
                    }`}>
                      {visionResult.hasDefect ? (
                        <AlertTriangle className="w-4 h-4 text-orange-400" />
                      ) : (
                        <CheckCircle className="w-4 h-4 text-green-400" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="text-white font-medium text-sm mb-1">
                        {visionResult.hasDefect ? "AI Tespiti" : "AI Analizi"}
                      </p>
                      <p className="text-slate-300 text-sm">{visionResult.message}</p>
                      {visionResult.confidence && (
                        <p className="text-slate-400 text-xs mt-1">
                          Güven: %{(visionResult.confidence * 100).toFixed(0)}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Category Selection */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-3">
                  Neyi kontrol ediyorsunuz?
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {categories.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => setClassification({ ...classification, category: cat.id })}
                      className={`p-4 rounded-xl border-2 transition-all ${
                        classification.category === cat.id
                          ? "border-blue-500 bg-blue-600/20"
                          : "border-slate-700 bg-slate-800 hover:border-slate-600"
                      }`}
                    >
                      <div className="text-2xl mb-1">{cat.icon}</div>
                      <div className="text-sm text-white">{cat.label}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Section Selection */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-3">
                  Hangi bölüm?
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {sections.map((sec) => (
                    <button
                      key={sec.id}
                      onClick={() => setClassification({ ...classification, section: sec.id })}
                      className={`p-3 rounded-xl border-2 transition-all ${
                        classification.section === sec.id
                          ? "border-blue-500 bg-blue-600/20"
                          : "border-slate-700 bg-slate-800 hover:border-slate-600"
                      }`}
                    >
                      <div className="text-sm text-white">{sec.label}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Result Selection */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-3">
                  Sonuç
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setClassification({ ...classification, result: "PASS" })}
                    className={`p-4 rounded-xl border-2 transition-all flex items-center justify-center gap-2 ${
                      classification.result === "PASS"
                        ? "border-green-500 bg-green-600/20"
                        : "border-slate-700 bg-slate-800 hover:border-slate-600"
                    }`}
                  >
                    <CheckCircle className="w-6 h-6 text-green-400" />
                    <span className="text-white font-medium">Uygun</span>
                  </button>
                  <button
                    onClick={() => setClassification({ ...classification, result: "FAIL" })}
                    className={`p-4 rounded-xl border-2 transition-all flex items-center justify-center gap-2 ${
                      classification.result === "FAIL"
                        ? "border-red-500 bg-red-600/20"
                        : "border-slate-700 bg-slate-800 hover:border-slate-600"
                    }`}
                  >
                    <XCircle className="w-6 h-6 text-red-400" />
                    <span className="text-white font-medium">Uygunsuz</span>
                  </button>
                </div>
              </div>

              {/* Voice Input Button */}
              <button
                onClick={handleVoiceInput}
                disabled={isListening}
                className={`w-full p-4 rounded-xl border-2 transition-all flex items-center justify-center gap-2 ${
                  isListening
                    ? "border-purple-500 bg-purple-600/20 animate-pulse"
                    : "border-slate-700 bg-slate-800 hover:border-slate-600"
                }`}
              >
                <Mic className={`w-5 h-5 ${isListening ? "text-purple-400" : "text-slate-400"}`} />
                <span className={isListening ? "text-purple-300" : "text-slate-300"}>
                  {isListening ? "🎤 Dinleniyor..." : "🎤 Sesle Doldur"}
                </span>
              </button>

              {/* Transcript Display */}
              {transcript && (
                <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700">
                  <p className="text-slate-400 text-xs mb-1">Sesli Metin:</p>
                  <p className="text-white text-sm">{transcript}</p>
                </div>
              )}

              {/* Submit Button */}
              <button
                onClick={handleClassificationSubmit}
                disabled={isSubmitting}
                className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? "Kaydediliyor..." : "Kaydet"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
