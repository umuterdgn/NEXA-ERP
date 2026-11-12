"use client";
/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Kurumsal Demo Talebi Modal Bileşeni (B2B Lead Generation)
 */

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  Building2,
  User,
  Mail,
  Phone,
  Users,
  MessageSquare,
  CheckCircle2,
  X,
  Loader2,
  ArrowRight,
  ShieldCheck,
  Zap,
} from "lucide-react";
import toast from "react-hot-toast";
import { createDemoRequest } from "@/actions/super-admin/leads";

interface DemoRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const EMPLOYEE_RANGES = [
  { value: "1-10", label: "1 - 10 Kişi (Butik Şantiye)" },
  { value: "10-50", label: "10 - 50 Kişi (KOBİ Müteahhitlik)" },
  { value: "50-200", label: "50 - 200 Kişi (Bölgesel Ana Yüklenici)" },
  { value: "200+", label: "200+ Kişi (Holding & Uluslararası)" },
];

export default function DemoRequestModal({ isOpen, onClose }: DemoRequestModalProps) {
  const [formData, setFormData] = useState({
    companyName: "",
    contactName: "",
    email: "",
    phone: "",
    employeeCount: "10-50",
    notes: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.companyName.trim()) {
      toast.error("Lütfen firma adınızı giriniz.");
      return;
    }
    if (!formData.contactName.trim()) {
      toast.error("Lütfen ad ve soyadınızı giriniz.");
      return;
    }
    if (!formData.email.trim() || !formData.email.includes("@")) {
      toast.error("Lütfen geçerli bir kurumsal e-posta adresi giriniz.");
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await createDemoRequest({
        companyName: formData.companyName,
        contactName: formData.contactName,
        email: formData.email,
        phone: formData.phone || null,
        employeeCount: formData.employeeCount || null,
        notes: formData.notes || null,
      });

      if (res.success) {
        toast.success(
          res.message ||
            "Talebiniz alınmıştır, uzmanlarımız en kısa sürede sizinle iletişime geçecektir",
          {
            duration: 6000,
            icon: "🚀",
          }
        );
        setIsSuccess(true);
        setTimeout(() => {
          setIsSuccess(false);
          setFormData({
            companyName: "",
            contactName: "",
            email: "",
            phone: "",
            employeeCount: "10-50",
            notes: "",
          });
          onClose();
        }, 3000);
      } else {
        toast.error(res.error || "Demo talebiniz kaydedilemedi. Lütfen tekrar deneyin.");
      }
    } catch (err: any) {
      console.error("Demo request submit error:", err);
      toast.error("İşlem sırasında bir hata oluştu. Lütfen tekrar deneyin.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ duration: 0.25 }}
            className="relative w-full max-w-xl overflow-hidden rounded-3xl border border-cyan-500/30 bg-slate-950 p-6 sm:p-8 shadow-2xl shadow-cyan-950/40"
          >
            {/* Background Glow */}
            <div className="absolute -top-24 -right-24 h-48 w-48 rounded-full bg-cyan-500/15 blur-3xl pointer-events-none" />
            <div className="absolute -bottom-24 -left-24 h-48 w-48 rounded-full bg-blue-600/15 blur-3xl pointer-events-none" />

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="absolute top-5 right-5 z-10 flex h-9 w-9 items-center justify-center rounded-xl border border-slate-800 bg-slate-900/80 text-slate-400 transition-colors hover:border-slate-700 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>

            {isSuccess ? (
              <div className="py-10 text-center space-y-4">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
                  <CheckCircle2 className="h-9 w-9" />
                </div>
                <h3 className="text-2xl font-bold text-white">Talebiniz Alınmıştır!</h3>
                <p className="text-sm text-slate-300 max-w-md mx-auto leading-relaxed">
                  Uzmanlarımız en kısa sürede sizinle iletişime geçecek, firmanıza özel 4D BIM ve
                  otonom şantiye demosu için toplantı planlayacaktır.
                </p>
                <div className="pt-2 text-xs text-slate-500">Pencere otomatik kapatılıyor...</div>
              </div>
            ) : (
              <div>
                {/* Header */}
                <div className="mb-6 space-y-1.5">
                  <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-xs font-semibold text-cyan-300">
                    <Sparkles className="h-3.5 w-3.5 text-cyan-400" />
                    <span>Ücretsiz 1-e-1 Canlı Demo & Danışmanlık</span>
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                    Nexa ERP Demo Talebi
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-400">
                    Projelerinizdeki maliyet kaçaklarını önleyin, şantiye süreçlerinizi dijital ikizle
                    hızlandırın.
                  </p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Firma Adı */}
                    <div>
                      <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-slate-300">
                        <Building2 className="h-3.5 w-3.5 text-cyan-400" />
                        <span>Firma / Şirket Adı *</span>
                      </label>
                      <input
                        type="text"
                        name="companyName"
                        required
                        value={formData.companyName}
                        onChange={handleChange}
                        placeholder="Örn: Akdeniz İnşaat A.Ş."
                        className="w-full rounded-xl border border-slate-800 bg-slate-900/90 px-3.5 py-2.5 text-sm text-white placeholder-slate-500 transition-colors focus:border-cyan-500 focus:outline-none"
                      />
                    </div>

                    {/* Yetkili Ad Soyad */}
                    <div>
                      <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-slate-300">
                        <User className="h-3.5 w-3.5 text-cyan-400" />
                        <span>Yetkili Ad Soyad *</span>
                      </label>
                      <input
                        type="text"
                        name="contactName"
                        required
                        value={formData.contactName}
                        onChange={handleChange}
                        placeholder="Örn: Kemal Yılmaz"
                        className="w-full rounded-xl border border-slate-800 bg-slate-900/90 px-3.5 py-2.5 text-sm text-white placeholder-slate-500 transition-colors focus:border-cyan-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Kurumsal E-posta */}
                    <div>
                      <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-slate-300">
                        <Mail className="h-3.5 w-3.5 text-cyan-400" />
                        <span>Kurumsal E-posta *</span>
                      </label>
                      <input
                        type="email"
                        name="email"
                        required
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="kemal@sirketiniz.com"
                        className="w-full rounded-xl border border-slate-800 bg-slate-900/90 px-3.5 py-2.5 text-sm text-white placeholder-slate-500 transition-colors focus:border-cyan-500 focus:outline-none"
                      />
                    </div>

                    {/* Telefon */}
                    <div>
                      <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-slate-300">
                        <Phone className="h-3.5 w-3.5 text-cyan-400" />
                        <span>Telefon Numarası</span>
                      </label>
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        placeholder="05XX XXX XX XX"
                        className="w-full rounded-xl border border-slate-800 bg-slate-900/90 px-3.5 py-2.5 text-sm text-white placeholder-slate-500 transition-colors focus:border-cyan-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Çalışan Sayısı / Şantiye Ölçeği */}
                  <div>
                    <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-slate-300">
                      <Users className="h-3.5 w-3.5 text-cyan-400" />
                      <span>Firma & Şantiye Ölçeği</span>
                    </label>
                    <select
                      name="employeeCount"
                      value={formData.employeeCount}
                      onChange={handleChange}
                      className="w-full rounded-xl border border-slate-800 bg-slate-900/90 px-3.5 py-2.5 text-sm text-white transition-colors focus:border-cyan-500 focus:outline-none"
                    >
                      {EMPLOYEE_RANGES.map((r) => (
                        <option key={r.value} value={r.value} className="bg-slate-900 text-white">
                          {r.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Notlar / İhtiyaçlar */}
                  <div>
                    <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-slate-300">
                      <MessageSquare className="h-3.5 w-3.5 text-cyan-400" />
                      <span>Öncelikli İhtiyaçlarınız veya Şantiyeleriniz</span>
                    </label>
                    <textarea
                      name="notes"
                      rows={2}
                      value={formData.notes}
                      onChange={handleChange}
                      placeholder="Örn: 3D BIM hakediş denetimi ve IoT İSG takibi ile ilgileniyoruz..."
                      className="w-full resize-none rounded-xl border border-slate-800 bg-slate-900/90 px-3.5 py-2 text-sm text-white placeholder-slate-500 transition-colors focus:border-cyan-500 focus:outline-none"
                    />
                  </div>

                  {/* Security / Guarantees */}
                  <div className="flex items-center gap-4 py-1 text-[11px] text-slate-400">
                    <span className="flex items-center gap-1">
                      <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
                      KVKK Uyumlu & Gizlilik Garantisi
                    </span>
                    <span className="flex items-center gap-1">
                      <Zap className="h-3.5 w-3.5 text-cyan-400" />
                      24 Saat İçinde Dönüş
                    </span>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-cyan-500/25 transition-all hover:from-cyan-400 hover:to-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Talebiniz İletiliyor...</span>
                      </>
                    ) : (
                      <>
                        <span>Ücretsiz Demo Talebini Gönder</span>
                        <ArrowRight className="h-4 w-4" />
                      </>
                    )}
                  </button>
                </form>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

