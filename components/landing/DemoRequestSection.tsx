"use client";
/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Kurumsal Demo Talebi Sayfa İçi Bölümü (Landing Page Demo Section)
 */

import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  Sparkles,
  Building2,
  User,
  Mail,
  Phone,
  Users,
  MessageSquare,
  CheckCircle2,
  Loader2,
  ArrowRight,
  ShieldCheck,
  Zap,
  Check,
} from "lucide-react";
import toast from "react-hot-toast";
import { createDemoRequest } from "@/actions/super-admin/leads";

const EMPLOYEE_RANGES = [
  { value: "1-10", label: "1 - 10 Kişi (Butik Şantiye)" },
  { value: "10-50", label: "10 - 50 Kişi (KOBİ Müteahhitlik)" },
  { value: "50-200", label: "50 - 200 Kişi (Bölgesel Ana Yüklenici)" },
  { value: "200+", label: "200+ Kişi (Holding & Uluslararası)" },
];

export default function DemoRequestSection() {
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
        setFormData({
          companyName: "",
          contactName: "",
          email: "",
          phone: "",
          employeeCount: "10-50",
          notes: "",
        });
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
    <section id="demo-form" className="relative py-24 px-4 overflow-hidden border-t border-slate-800 bg-slate-950">
      {/* Background gradients */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-cyan-900/15 via-slate-950 to-slate-950 pointer-events-none" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800c_1px,transparent_1px),linear-gradient(to_bottom,#8080800c_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />

      <div className="relative max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          {/* Left Column: Value Proposition */}
          <div className="lg:col-span-5 space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-4 py-1.5 text-xs font-semibold text-cyan-300">
              <Sparkles className="h-4 w-4 text-cyan-400" />
              <span>Kurumsal B2B Onboarding</span>
            </div>

            <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight leading-tight">
              Şantiyenizi Dijitalleştirmeye{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-400">
                Bugün Başlayın
              </span>
            </h2>

            <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
              Formu doldurun, ERP & BIM uzmanlarımız projenizin ölçeğine ve ihtiyaçlarına özel 4D
              Dijital İkiz demo ortamını 24 saat içinde hazırlasın.
            </p>

            <div className="space-y-3 pt-2">
              {[
                "Web-IFC destekli 3D BIM hakediş denetim simülasyonu",
                "Taşeron hakediş ve sahte iş emri bloke koruma motoru",
                "BLE & GPS destekli canlı personel ve şantiye İSG radarı",
                "Müteahhit, Yapı Denetim ve Yatırımcı çoklu portal mimarisi",
              ].map((feature, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-cyan-500/15 text-cyan-400 border border-cyan-500/30">
                    <Check className="h-3 w-3" />
                  </div>
                  <span className="text-xs sm:text-sm text-slate-300 font-medium">{feature}</span>
                </div>
              ))}
            </div>

            <div className="pt-4 border-t border-slate-800/80 flex items-center gap-6 text-xs text-slate-400">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-emerald-400" />
                <span>%100 KVKK & ISO 27001 Uyumlu</span>
              </div>
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-cyan-400" />
                <span>Taahhütsüz & Ücretsiz</span>
              </div>
            </div>
          </div>

          {/* Right Column: Interactive Form */}
          <div className="lg:col-span-7">
            <div className="relative rounded-3xl border border-slate-800 bg-slate-900/80 backdrop-blur-xl p-6 sm:p-8 shadow-2xl shadow-cyan-950/30">
              <div className="mb-6 flex items-center justify-between border-b border-slate-800/80 pb-4">
                <div>
                  <h3 className="text-xl font-bold text-white">Ücretsiz Demo Talebi</h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Yetkilimiz sizinle iletişime geçerek firmanıza özel demo sunumu planlayacaktır.
                  </p>
                </div>
                <div className="hidden sm:flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                  <Sparkles className="h-5 w-5" />
                </div>
              </div>

              {isSuccess ? (
                <div className="py-12 text-center space-y-4">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
                    <CheckCircle2 className="h-9 w-9" />
                  </div>
                  <h4 className="text-2xl font-bold text-white">Talebiniz Başarıyla Alındı!</h4>
                  <p className="text-sm text-slate-300 max-w-md mx-auto leading-relaxed">
                    Talebiniz alınmıştır, uzmanlarımız en kısa sürede sizinle iletişime geçecektir.
                    İlginiz için teşekkür ederiz.
                  </p>
                  <button
                    type="button"
                    onClick={() => setIsSuccess(false)}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold text-cyan-300 bg-slate-800 hover:bg-slate-750 border border-slate-700 transition-colors"
                  >
                    Yeni Bir Talep Gönder
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                        placeholder="Örn: Torunlar Gayrimenkul A.Ş."
                        className="w-full rounded-xl border border-slate-800 bg-slate-950/80 px-3.5 py-2.5 text-sm text-white placeholder-slate-500 transition-colors focus:border-cyan-500 focus:outline-none"
                      />
                    </div>

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
                        placeholder="Örn: Ahmet Yılmaz"
                        className="w-full rounded-xl border border-slate-800 bg-slate-950/80 px-3.5 py-2.5 text-sm text-white placeholder-slate-500 transition-colors focus:border-cyan-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                        placeholder="ahmet@torunlar.com.tr"
                        className="w-full rounded-xl border border-slate-800 bg-slate-950/80 px-3.5 py-2.5 text-sm text-white placeholder-slate-500 transition-colors focus:border-cyan-500 focus:outline-none"
                      />
                    </div>

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
                        className="w-full rounded-xl border border-slate-800 bg-slate-950/80 px-3.5 py-2.5 text-sm text-white placeholder-slate-500 transition-colors focus:border-cyan-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-slate-300">
                      <Users className="h-3.5 w-3.5 text-cyan-400" />
                      <span>Firma & Şantiye Ölçeği</span>
                    </label>
                    <select
                      name="employeeCount"
                      value={formData.employeeCount}
                      onChange={handleChange}
                      className="w-full rounded-xl border border-slate-800 bg-slate-950/80 px-3.5 py-2.5 text-sm text-white transition-colors focus:border-cyan-500 focus:outline-none"
                    >
                      {EMPLOYEE_RANGES.map((r) => (
                        <option key={r.value} value={r.value} className="bg-slate-900 text-white">
                          {r.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-slate-300">
                      <MessageSquare className="h-3.5 w-3.5 text-cyan-400" />
                      <span>Notlar / İlgilendiğiniz Modüller</span>
                    </label>
                    <textarea
                      name="notes"
                      rows={2}
                      value={formData.notes}
                      onChange={handleChange}
                      placeholder="Şantiyeleriniz, 4D BIM, hakediş kontrolü veya taşeron takibi hakkındaki sorularınızı yazabilirsiniz..."
                      className="w-full resize-none rounded-xl border border-slate-800 bg-slate-950/80 px-3.5 py-2 text-sm text-white placeholder-slate-500 transition-colors focus:border-cyan-500 focus:outline-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 px-6 py-4 text-sm font-bold text-white shadow-xl shadow-cyan-500/25 transition-all hover:from-cyan-400 hover:to-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transform hover:scale-[1.01] active:scale-[0.99]"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Talebiniz İletiliyor...</span>
                      </>
                    ) : (
                      <>
                        <span>Ücretsiz Demo Talebi Gönder</span>
                        <ArrowRight className="h-4 w-4" />
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

