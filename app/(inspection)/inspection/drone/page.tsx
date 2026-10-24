/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Hava & Drone Gözlem Terminali (Yapı Denetim Modülü)
 */

"use client";

import React from "react";
import UnderConstructionHero from "@/components/inspection/UnderConstructionHero";
import { Plane } from "lucide-react";

export default function DronePage() {
  return (
    <UnderConstructionHero
      category="YAPAY ZEKA & İLERİ TEKNOLOJİ"
      title="Hava & Drone Gözlem"
      description="İHA ve otonom drone uçuşları ile şantiye sahasının havadan fotogrametrik haritalanması, kule vinç güvenlik alanı denetimi, kazı hacim hesapları ve dış cephe iskele kontrolleri."
      icon={Plane}
      accentColor="emerald"
      badgeText="Fotogrametri & İHA Denetimi (Beta)"
      features={[
        { label: "Ortomozaik 2D/3D Yüzey Modeli", desc: "Santimetre hassasiyetinde havadan güncel şantiye ortofoto haritası" },
        { label: "Dış Cephe İskele & Güvenlik Taraması", desc: "Yüksek katlı bloklarda iskele ankrajı ve güvenlik ağı kontrolleri" },
        { label: "Hafriyat & Kazı Hacim Hesaplama", desc: "Hacimsel kübaj hesaplarıyla hakediş kazı seviyesinin doğrulanması" },
        { label: "Zaman Serili 4K İlerleme Arşivi", desc: "Haftalık periyodik uçuşlarla inşaat ilerleme timelapse kayıtları" },
      ]}
    />
  );
}
