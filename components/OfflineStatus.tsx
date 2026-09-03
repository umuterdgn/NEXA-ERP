/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * This code is the property of NXA Software.
 */

"use client";
import { useNetworkState } from 'react-use';
import { useState, useEffect } from 'react';

export default function OfflineStatus() {
  const { online } = useNetworkState();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;
  if (online) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[9999] bg-gradient-to-r from-orange-600 to-red-600 text-white text-center py-3 px-4 text-sm font-bold shadow-lg flex items-center justify-center gap-2">
      <svg className="w-5 h-5 animate-pulse flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3" />
      </svg>
      <span>Şu an çevrimdışısınız. Yaptığınız değişiklikler (fotoğraflar, formlar) cihazınıza kaydediliyor, internet geldiğinde otomatik senkronize edilecek.</span>
    </div>
  );
}