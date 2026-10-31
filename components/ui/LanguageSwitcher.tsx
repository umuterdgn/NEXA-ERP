"use client";

import React, { useState, useRef, useEffect } from "react";
import { useLocale } from "next-intl";
import { useRouter, usePathname } from "@/i18n/routing";
import { Globe, Check, ChevronDown } from "lucide-react";

export type SupportedLocale = "tr" | "en" | "de" | "ru" | "ar";

interface LanguageOption {
  code: SupportedLocale;
  label: string;
  flag: string;
}

const languages: LanguageOption[] = [
  { code: "tr", label: "Türkçe", flag: "🇹🇷" },
  { code: "en", label: "English", flag: "🇬🇧" },
  { code: "de", label: "Deutsch", flag: "🇩🇪" },
  { code: "ru", label: "Русский", flag: "🇷🇺" },
  { code: "ar", label: "العربية", flag: "🇸🇦" },
];

export default function LanguageSwitcher({ className = "" }: { className?: string }) {
  const currentLocale = useLocale() as SupportedLocale;
  const router = useRouter();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const activeLanguage = languages.find((lang) => lang.code === currentLocale) || languages[0];

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelectLanguage = (newLocale: SupportedLocale) => {
    if (newLocale === currentLocale) {
      setIsOpen(false);
      return;
    }

    // Persist choice to cookie
    document.cookie = `NEXT_LOCALE=${newLocale}; path=/; max-age=31536000; SameSite=Lax`;
    
    // Switch locale using next-intl router
    router.replace(pathname, { locale: newLocale });
    setIsOpen(false);
  };

  return (
    <div className={`relative inline-block text-left ${className}`} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-haspopup="true"
        className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-700/60 bg-slate-900/80 hover:bg-slate-800 text-slate-200 hover:text-white transition-all duration-200 shadow-sm hover:border-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
      >
        <span className="text-sm leading-none">{activeLanguage.flag}</span>
        <span className="hidden sm:inline font-semibold">{activeLanguage.code.toUpperCase()}</span>
        <ChevronDown
          size={14}
          className={`text-slate-400 transition-transform duration-200 ${
            isOpen ? "rotate-180 text-white" : ""
          }`}
        />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-1.5 w-40 rounded-xl border border-slate-800 bg-slate-900/95 backdrop-blur-md shadow-xl ring-1 ring-black/20 z-50 py-1 animate-in fade-in zoom-in-95 duration-150">
          <div className="px-2.5 py-1 text-[10px] font-semibold tracking-wider uppercase text-slate-400 flex items-center gap-1.5 border-b border-slate-800/80 mb-1">
            <Globe size={11} className="text-blue-400" />
            <span>Dil Seçimi</span>
          </div>

          {languages.map((lang) => {
            const isSelected = lang.code === currentLocale;
            return (
              <button
                key={lang.code}
                type="button"
                onClick={() => handleSelectLanguage(lang.code)}
                className={`w-full flex items-center justify-between px-2.5 py-1.5 text-xs rounded-md transition-colors ${
                  isSelected
                    ? "bg-blue-600/20 text-blue-400 font-semibold"
                    : "text-slate-300 hover:bg-slate-800/80 hover:text-white"
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm leading-none">{lang.flag}</span>
                  <span>{lang.label}</span>
                </div>
                {isSelected && <Check size={14} className="text-blue-400" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
