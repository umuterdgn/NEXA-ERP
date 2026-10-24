/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Yapı Denetim Portalı - Modül Geliştirme / Çok Yakında Hero Bileşeni
 */

"use client";

import React from "react";
import Link from "next/link";
import {
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Bot,
  Construction,
  Layers,
  ChevronRight,
  Clock,
  Send,
  Building2,
} from "lucide-react";
import { toast } from "react-hot-toast";

interface FeaturePill {
  label: string;
  desc?: string;
}

interface UnderConstructionHeroProps {
  category: string;
  title: string;
  description: string;
  icon: any;
  plannedRelease?: string;
  features: FeaturePill[];
  badgeText?: string;
  accentColor?: "blue" | "purple" | "emerald" | "amber" | "rose" | "cyan";
}

export default function UnderConstructionHero({
  category,
  title,
  description,
  icon: Icon,
  plannedRelease = "Q4 2026",
  features,
  badgeText = "Geliştirme Aşamasında (Beta)",
  accentColor = "blue",
}: UnderConstructionHeroProps) {
  const colorMap = {
    blue: {
      glow: "from-blue-600/20 via-blue-900/10 to-transparent",
      badge: "bg-blue-950/80 text-blue-400 border-blue-800",
      iconBg: "bg-blue-600/20 border-blue-500/40 text-blue-400",
      button: "bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/20",
    },
    purple: {
      glow: "from-purple-600/20 via-purple-900/10 to-transparent",
      badge: "bg-purple-950/80 text-purple-400 border-purple-800",
      iconBg: "bg-purple-600/20 border-purple-500/40 text-purple-400",
      button: "bg-purple-600 hover:bg-purple-500 text-white shadow-purple-600/20",
    },
    emerald: {
      glow: "from-emerald-600/20 via-emerald-900/10 to-transparent",
      badge: "bg-emerald-950/80 text-emerald-400 border-emerald-800",
      iconBg: "bg-emerald-600/20 border-emerald-500/40 text-emerald-400",
      button: "bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/20",
    },
    amber: {
      glow: "from-amber-600/20 via-amber-900/10 to-transparent",
      badge: "bg-amber-950/80 text-amber-400 border-amber-800",
      iconBg: "bg-amber-600/20 border-amber-500/40 text-amber-400",
      button: "bg-amber-600 hover:bg-amber-500 text-white shadow-amber-600/20",
    },
    rose: {
      glow: "from-rose-600/20 via-rose-900/10 to-transparent",
      badge: "bg-rose-950/80 text-rose-400 border-rose-800",
      iconBg: "bg-rose-600/20 border-rose-500/40 text-rose-400",
      button: "bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/20",
    },
    cyan: {
      glow: "from-cyan-600/20 via-cyan-900/10 to-transparent",
      badge: "bg-cyan-950/80 text-cyan-400 border-cyan-800",
      iconBg: "bg-cyan-600/20 border-cyan-500/40 text-cyan-400",
      button: "bg-cyan-600 hover:bg-cyan-500 text-white shadow-cyan-600/20",
    },
  };

  const c = colorMap[accentColor] || colorMap.blue;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto space-y-8">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center gap-2 text-xs text-slate-400">
        <Link href="/inspection/dashboard" className="hover:text-white transition">
          Yapı Denetim Portalı
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
        <span className="text-slate-400 uppercase tracking-wider text-[11px] font-semibold">
          {category}
        </span>
        <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
        <span className="text-white font-medium">{title}</span>
      </div>

      {/* Hero Showcase Card */}
      <div className={`relative rounded-3xl border border-slate-800 bg-slate-900/80 p-6 sm:p-10 lg:p-12 overflow-hidden shadow-2xl bg-gradient-to-br ${c.glow}`}>
        {/* Glow Element */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 rounded-full bg-blue-500/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl space-y-6">
          {/* Status Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold border backdrop-blur-md shadow-sm">
            <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-slate-200">{badgeText}</span>
            <span className="text-slate-500">•</span>
            <span className="text-slate-400 font-mono text-[11px]">{plannedRelease}</span>
          </div>

          {/* Module Title & Icon */}
          <div className="flex items-start gap-4 sm:gap-5">
            <div className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl border flex items-center justify-center shrink-0 shadow-lg ${c.iconBg}`}>
              <Icon className="w-7 h-7 sm:w-8 sm:h-8" />
            </div>
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                {category}
              </span>
              <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight mt-1">
                {title}
              </h1>
            </div>
          </div>

          {/* Description */}
          <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-2xl">
            {description}
          </p>

          {/* Feature Highlights Grid */}
          <div className="pt-4 border-t border-slate-800/80 space-y-3">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Modül Kapsamında Sunulacak İleri Yetenekler:
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {features.map((feat, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 text-xs text-slate-300 backdrop-blur-sm"
                >
                  <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-white block font-semibold">{feat.label}</strong>
                    {feat.desc && <span className="text-slate-400 text-[11px] mt-0.5 block">{feat.desc}</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="pt-4 flex flex-wrap items-center gap-3">
            <Link
              href="/inspection/dashboard"
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs shadow-lg transition active:scale-95 cursor-pointer ${c.button}`}
            >
              <span>Yapı Denetim Terminaline Dön</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <button
              onClick={() => {
                toast.success("Erken Erişim & Geri Bildirim Talebiniz Kaydedildi!", { icon: "🚀" });
              }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition cursor-pointer"
            >
              <Send className="w-3.5 h-3.5 text-blue-400" />
              <span>Erken Erişim Bildirimi Al</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
