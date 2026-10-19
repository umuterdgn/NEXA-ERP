/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * E-Devlet 2FA (SMS / Mobil Onay) Etkileşimli Modal Bileşeni
 */

"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  ShieldAlert,
  Smartphone,
  CheckCircle2,
  Lock,
  RefreshCw,
  X,
  AlertCircle,
  KeyRound,
  ShieldCheck,
  Send
} from "lucide-react";
import { toast } from "react-hot-toast";

interface TwoFactorModalProps {
  isOpen: boolean;
  onClose: () => void;
  sessionId: string;
  onSuccess: (data: any) => void;
}

export default function TwoFactorModal({
  isOpen,
  onClose,
  sessionId,
  onSuccess,
}: TwoFactorModalProps) {
  const [digits, setDigits] = useState<string[]>(["", "", "", "", "", ""]);
  const [submitting, setSubmitting] = useState(false);
  const [countdown, setCountdown] = useState(120);
  const [errorMsg, setErrorMsg] = useState("");

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // 120 Saniyelik geri sayım
  useEffect(() => {
    if (!isOpen) {
      setDigits(["", "", "", "", "", ""]);
      setCountdown(120);
      setErrorMsg("");
      return;
    }

    // İlk kutuya otomatik odaklan
    setTimeout(() => {
      inputRefs.current[0]?.focus();
    }, 150);

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen]);

  if (!isOpen) return null;

  const handleDigitChange = (index: number, value: string) => {
    setErrorMsg("");
    // Tek hane al
    const clean = value.replace(/\D/g, "");

    // Eğer kullanıcı yapıştırma (paste) yaptıysa
    if (clean.length > 1) {
      const newDigits = [...digits];
      for (let i = 0; i < 6; i++) {
        newDigits[i] = clean[i] || "";
      }
      setDigits(newDigits);
      const nextFocus = Math.min(clean.length, 5);
      inputRefs.current[nextFocus]?.focus();
      return;
    }

    const newDigits = [...digits];
    newDigits[index] = clean;
    setDigits(newDigits);

    // Sonraki kutuya geç
    if (clean && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === "Enter") {
      handleSubmit();
    }
  };

  const fullCode = digits.join("");

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (fullCode.length !== 6) {
      setErrorMsg("Lütfen 6 haneli onay kodunu eksiksiz giriniz.");
      return;
    }

    setSubmitting(true);
    setErrorMsg("");

    try {
      const res = await fetch("/api/yibf/rpa-submit-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          code: fullCode,
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        toast.success("E-Devlet 2FA Doğrulandı! Bakanlık verileri başarıyla senkronize edildi.", {
          icon: "🏛️",
          duration: 5000,
        });
        onSuccess(data.data);
        onClose();
      } else {
        setErrorMsg(data.error || "Girdiğiniz SMS kodu doğrulanamadı veya süresi doldu.");
        toast.error("Doğrulama başarısız oldu.");
      }
    } catch (err: any) {
      setErrorMsg("Bağlantı hatası oluştu. Lütfen tekrar deneyin.");
      toast.error("İşlem sırasında hata oluştu.");
    } finally {
      setSubmitting(false);
    }
  };

  const formatCountdown = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const s = sec % 60;
    return `${mins}:${s < 10 ? "0" : ""}${s}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        {/* Glow accent */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-cyan-600/10 rounded-full blur-3xl pointer-events-none" />

        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header with E-Devlet Emblem and Shield */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-red-600/20 to-red-950/40 border border-red-500/40 text-red-400 mb-4 shadow-lg shadow-red-950/50">
            <Smartphone className="w-8 h-8 animate-pulse" />
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-red-950/60 text-red-300 border border-red-800/60 mb-2">
            <span>T.C. E-DEVLET KAPISI • 2FA DOĞRULAMA</span>
          </div>

          <h2 className="text-xl sm:text-2xl font-extrabold text-white">
            E-Devlet Güvenlik Onayı Gerekiyor
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-2 max-w-md mx-auto leading-relaxed">
            Lütfen telefonunuza gelen e-Devlet onay kodunu giriniz veya mobil uygulamadan giriş izni veriniz.
          </p>
        </div>

        {/* 6-Digit OTP Input Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex justify-center items-center gap-2 sm:gap-3">
            {digits.map((digit, idx) => (
              <input
                key={idx}
                ref={(el) => {
                  inputRefs.current[idx] = el;
                }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleDigitChange(idx, e.target.value)}
                onKeyDown={(e) => handleKeyDown(idx, e)}
                disabled={submitting || countdown === 0}
                className="w-11 sm:w-13 h-14 sm:h-16 text-center text-xl sm:text-2xl font-mono font-bold bg-slate-950 border-2 border-slate-700/80 rounded-2xl text-white focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/30 transition-all shadow-inner disabled:opacity-50"
              />
            ))}
          </div>

          {/* Error Message */}
          {errorMsg && (
            <div className="flex items-center justify-center gap-2 text-xs font-semibold text-red-400 bg-red-950/40 border border-red-900/50 p-2.5 rounded-xl">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Countdown timer */}
          <div className="flex items-center justify-between text-xs text-slate-400 px-1">
            <span className="flex items-center gap-1.5">
              <KeyRound className="w-3.5 h-3.5 text-slate-500" />
              <span>Kalan Onay Süresi:</span>
            </span>
            <span
              className={`font-mono font-bold text-sm ${
                countdown < 30 ? "text-red-400 animate-pulse" : "text-amber-400"
              }`}
            >
              {formatCountdown(countdown)}
            </span>
          </div>

          {/* Actions */}
          <div className="space-y-2.5 pt-1">
            <button
              type="submit"
              disabled={submitting || fullCode.length !== 6 || countdown === 0}
              className="w-full inline-flex items-center justify-center gap-2 py-3.5 px-6 rounded-2xl bg-gradient-to-r from-red-600 via-rose-600 to-red-700 hover:from-red-500 hover:to-rose-500 text-white font-bold text-sm shadow-xl shadow-red-600/25 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Onay Kodu İletiliyor & Veriler Kazınıyor...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-5 h-5" />
                  <span>Onayla ve Verileri Çek</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={onClose}
              className="w-full py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-slate-200 transition-colors"
            >
              İptal Et
            </button>
          </div>

          {/* Trust badge */}
          <div className="pt-3 border-t border-slate-800 text-center">
            <div className="flex items-center justify-center gap-2 text-[11px] text-slate-500">
              <Lock className="w-3 h-3 text-emerald-500" />
              <span>256-bit SSL Uçtan Uca Şifreli Oturum • NEXA RPA Bot v2.4</span>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
