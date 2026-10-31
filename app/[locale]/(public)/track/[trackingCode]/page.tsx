/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Şoför Uygulamasız (SMS-Link) Canlı Konum ve Kapı QR Terminali Sayfası
 * Bu rota herhangi bir login/oturum İSTEMEZ.
 */

import React from "react";
import { Metadata } from "next";
import TrackDriverClient from "./TrackDriverClient";

interface PageProps {
  params: Promise<{ trackingCode: string }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { trackingCode } = await params;
  return {
    title: `Canlı Sevkiyat Takibi #${trackingCode} | NEXA ERP Lojistik`,
    description: "Sürücü Canlı GPS Konum Paylaşımı ve Şantiye Kapı Geçiş Terminali",
  };
}

export default async function TrackDriverPage({ params }: PageProps) {
  const { trackingCode } = await params;

  return <TrackDriverClient trackingCode={trackingCode} />;
}
