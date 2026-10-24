/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Akıllı Evrak Denetimi (OCR) Terminali (Yapı Denetim Modülü)
 */

"use client";

import React from "react";
import UnderConstructionHero from "@/components/inspection/UnderConstructionHero";
import { ScanText } from "lucide-react";

export default function OcrPage() {
  return (
    <UnderConstructionHero
      category="YAPAY ZEKA & İLERİ TEKNOLOJİ"
      title="Akıllı Evrak Denetimi (OCR)"
      description="Laboratuvar deney föyleri, hazır beton mikser irsaliyeleri, TSE kalite belgeleri ve belediye ruhsatlarının gelişmiş OCR ve NLP motoruyla taranıp otomatik dijital veri tabanına işlenmesi."
      icon={ScanText}
      accentColor="cyan"
      badgeText="Akıllı Belge Ayrıştırma (Beta)"
      features={[
        { label: "Hazır Beton İrsaliyesi Otomatik Okuma", desc: "Beton sınıfı, slump, döküm saati ve mikser plakasını anında okur" },
        { label: "TÜRKAK Akredite Karot Raporu Ayrıştırma", desc: "7 ve 28 günlük basınç dayanımı MPa değerlerini dijital sisteme çeker" },
        { label: "TSE / CE Standart Belgesi Doğrulama", desc: "Demir ve beton sertifikalarının sahteciliğe karşı karekod doğrulaması" },
        { label: "e-YİBF Hakediş Dosyasına Otomatik Eşleme", desc: "Okunan evrakları ilişkili YİBF numarasıyla otomatik arşivler" },
      ]}
    />
  );
}
