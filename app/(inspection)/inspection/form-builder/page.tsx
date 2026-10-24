/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Dinamik Form Oluşturucu Terminali (Yapı Denetim Modülü)
 */

"use client";

import React from "react";
import UnderConstructionHero from "@/components/inspection/UnderConstructionHero";
import { PenTool } from "lucide-react";

export default function FormBuilderPage() {
  return (
    <UnderConstructionHero
      category="YAPI DENETİM & KONTROL"
      title="Dinamik Form Oluşturucu"
      description="Saha denetçileri için sürükle-bırak dinamik kontrol listesi ve resmi tutanak şablonu tasarlayıcısı. JSON şeması ve Türkak akreditasyon standartlarına tam uyumlu modüler form mimarisi."
      icon={PenTool}
      accentColor="blue"
      features={[
        { label: "Sürükle-Bırak Soru & Şablon Tasarlayıcı", desc: "Çoktan seçmeli, onay kutulu ve sayısal ölçüm girdi alanları" },
        { label: "Bakanlık Mevzuat Şablonları Kütüphanesi", desc: "4708 sayılı kanun güncel denetim formları entegrasyonu" },
        { label: "Mobil Uyumlu Dinamik Soru Mantığı", desc: "Koşullu alanlar ve sahada zorunlu fotoğraf yükleme kuralı" },
        { label: "Otomatik e-İmzalı PDF Çıktı Motoru", desc: "Şantiye şefi ve denetçi imzalarıyla anında resmi tutanak üretimi" },
      ]}
    />
  );
}
