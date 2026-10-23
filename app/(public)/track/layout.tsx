/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Şoför Canlı Takip Özel Mobil Layout'u
 * Mobil tarayıcılar için optimize edilmiş, dikkat dağıtmayan tam ekran terminal görünümü.
 */

import React from "react";

export default function TrackLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950 text-slate-100 flex flex-col font-sans antialiased select-none">
      {children}
    </div>
  );
}
