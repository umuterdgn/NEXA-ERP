/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Dijital Projeler & Çizimler Terminali (Yapı Denetim Modülü)
 */

"use client";

import React from "react";
import UnderConstructionHero from "@/components/inspection/UnderConstructionHero";
import { Layers } from "lucide-react";

export default function BlueprintsPage() {
  return (
    <UnderConstructionHero
      category="DİJİTAL PROJE & ARŞİV"
      title="Dijital Projeler / Çizimler"
      description="DWG, DXF ve IFC formatındaki mimari, statik, mekanik ve elektrik uygulama projelerinin sahada kat kat vektörel olarak görüntülenmesi, katman yönetimi ve aks üzeri ölçüm araçları."
      icon={Layers}
      accentColor="blue"
      features={[
        { label: "Vektörel DWG / DXF Kat Planı Görüntüleyici", desc: "WebGL hızlandırmalı hızlı çizim açıcı ve sıfır gecikmeli zoom" },
        { label: "BIM / IFC 3D Yapı Modeli Entegrasyonu", desc: "3 boyutlu yapı modeli üzerinden donatı ve kolon periyot incelemesi" },
        { label: "Aks & Katman (Layer) Filtreleme", desc: "Kolon aplikasyon, kiriş detay ve kalıp planlarını ayrı ayrı açıp kapama" },
        { label: "Saha İçi Dijital Cetvel & Alan Ölçümü", desc: "Statik projedeki açıklık ve boyutların sahada doğrudan doğrulanması" },
      ]}
    />
  );
}
