/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Proje Revizyonları & Tadilat Takip Terminali (Yapı Denetim Modülü)
 */

"use client";

import React from "react";
import UnderConstructionHero from "@/components/inspection/UnderConstructionHero";
import { History } from "lucide-react";

export default function RevisionsPage() {
  return (
    <UnderConstructionHero
      category="DİJİTAL PROJE & ARŞİV"
      title="Proje Revizyonları"
      description="Müellif mimar ve statikçiler tarafından yapılan proje tadilatlarının (Rev.01, Rev.02...) versiyon karşılaştırması, belediye onaylı tadilat ruhsatı eşleştirmesi ve saha denetçisine anlık bildirim sistemi."
      icon={History}
      accentColor="purple"
      features={[
        { label: "İki Pafta Arası Otomatik Görsel Fark (Diff)", desc: "Değişen kolon boyutları, kiriş aksları ve donatıları renkli vurgular" },
        { label: "Tadilat Ruhsatı & Belediye Onay Takibi", desc: "Revizyonun ruhsata bağlanıp bağlanmadığını hukuki olarak denetler" },
        { label: "Müellif Onaylı Değişiklik Kütüğü", desc: "Statik hesap raporu ve mimari tadilat gerekçelerinin arşivlenmesi" },
        { label: "Saha Ekibine Hatalı İmalat Önleme Uyarısı", desc: "Eski paftanın sahada uygulanmasını engelleyen revizyon kilitleri" },
      ]}
    />
  );
}
