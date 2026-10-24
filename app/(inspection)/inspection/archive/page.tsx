/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Ruhsat & Dijital Evrak Arşivi Terminali (Yapı Denetim Modülü)
 */

"use client";

import React from "react";
import UnderConstructionHero from "@/components/inspection/UnderConstructionHero";
import { FolderArchive } from "lucide-react";

export default function ArchivePage() {
  return (
    <UnderConstructionHero
      category="DİJİTAL PROJE & ARŞİV"
      title="Ruhsat & Dijital Evrak Arşivi"
      description="Yapı ruhsatı, tapu tescil belgesi, zemin etüt raporu, akustik proje, yangın güvenliği ve enerji kimlik belgesi evraklarının e-Devlet ve e-YİBF standartlarında bulut arşivleme kütüğü."
      icon={FolderArchive}
      accentColor="rose"
      features={[
        { label: "Yapı Ruhsatı ve Ekleri Dijital Kasası", desc: "Belediye onaylı tüm resmi ruhsat belgelerine her an erişim" },
        { label: "Zemin Etüt & Jeoteknik Rapor Klasörü", desc: "Sondaj logları, laboratuvar zemin deneyleri ve sismik veriler" },
        { label: "Denetçi Hizmet Sözleşmeleri & Vekaletnameler", desc: "Yapı sahibi ile denetim kuruluşu arası yasal sözleşme arşivi" },
        { label: "TÜBİTAK Nitelikli Zaman Damgalı Saklama", desc: "5070 sayılı Elektronik İmza Kanunu'na uygun hukuki delil güvencesi" },
      ]}
    />
  );
}
