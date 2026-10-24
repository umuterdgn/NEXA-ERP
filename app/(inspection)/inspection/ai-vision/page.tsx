/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * AI Görsel Analiz & Hasar Tespit Terminali (Yapı Denetim Modülü)
 */

"use client";

import React from "react";
import UnderConstructionHero from "@/components/inspection/UnderConstructionHero";
import { Sparkles } from "lucide-react";

export default function AiVisionPage() {
  return (
    <UnderConstructionHero
      category="YAPAY ZEKA & İLERİ TEKNOLOJİ"
      title="AI Görsel Analiz & Hasar Tespit"
      description="Saha fotoğraflarından derin öğrenme ve YOLOv8 bilgisayarlı görü modelleriyle beton çatlak genişliği, segregasyon, paspayı yetersizliği ve donatı korozyonunun milimetrik tespiti."
      icon={Sparkles}
      accentColor="purple"
      badgeText="AI Derin Öğrenme Modeli (Beta)"
      features={[
        { label: "Milimetrik Çatlak Genişliği Analizi", desc: "<0.2mm kılcal ve yapısal çatlakların otomatik sınıflandırılması" },
        { label: "Donatı Paspayı & Korozyon Ölçümü", desc: "Kalıp öncesi açıkta kalan donatıların paspayı standart uyumu kontrolü" },
        { label: "Beton Segregasyon & Boşluk Taraması", desc: "Vibratör kaynaklı peteklenme ve boşluklu beton alanlarının tespiti" },
        { label: "Otomatik DÖF Tutanağı Üretimi", desc: "AI tespit ettiği kusurlara doğrudan fotoğraflı DÖF taslağı açar" },
      ]}
    />
  );
}
