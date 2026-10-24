/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Serbest Çizim & Plan Notları Terminali (Yapı Denetim Modülü)
 */

"use client";

import React from "react";
import UnderConstructionHero from "@/components/inspection/UnderConstructionHero";
import { Pencil } from "lucide-react";

export default function SketchPage() {
  return (
    <UnderConstructionHero
      category="DİJİTAL PROJE & ARŞİV"
      title="Serbest Çizim / Plan"
      description="Saha denetçisinin mobil ve tablet ekranında kat planı üzerine kırmızı kalemle serbest not alması, kusur konumu işaretlemesi, donatı detay eskizi çizmesi ve şantiye şefine anında iletmesi."
      icon={Pencil}
      accentColor="amber"
      features={[
        { label: "Dokunmatik Ekran Kırmızı Kalem Notu", desc: "Plan üzerine doğrudan parmak veya kalem ile işaretleme ve çizim" },
        { label: "Fotoğraf Üzerine Ok ve Ölçü Ekleme", desc: "Çekilen imalat fotoğrafının üzerine paspayı veya etriye aralığı yazma" },
        { label: "DÖF & Tutanaklarla Doğrudan İlişkilendirme", desc: "Yapılan eskizi doğrudan ilgili uygunsuzluk tutanağına delil ekleme" },
        { label: "Anlık WhatsApp & PDF Paylaşımı", desc: "Çizimi anında şantiye şefi ve statik müellife aktarma" },
      ]}
    />
  );
}
