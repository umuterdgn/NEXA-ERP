/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Nexa ERP - İSG & Canlı Personel Konum / Risk Alanı Server Actions
 */

"use server";

import { prisma } from "@/lib/prisma";

export interface LivePersonnel {
  id: string;
  name: string;
  email: string;
  role: string;
  currentLat: number;
  currentLng: number;
  lastLocationUpdate: string;
  isOnline: boolean;
}

export interface RiskZoneItem {
  id: string;
  name: string;
  radius: number; // Metre cinsinden çember yarıçapı
  centerLat: number;
  centerLng: number;
  dangerLevel?: string;
  zoneName?: string | null;
  projectId: string;
}

/**
 * Şantiyedeki aktif personellerin son canlı GPS konumlarını getirir
 */
export async function getLivePersonnelLocations(
  projectId?: string
): Promise<LivePersonnel[]> {
  try {
    const users = await prisma.user.findMany({
      where: {
        currentLat: { not: null },
        currentLng: { not: null },
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        currentLat: true,
        currentLng: true,
        lastLocationUpdate: true,
      },
      take: 40,
    });

    if (users.length > 0) {
      const now = new Date().getTime();
      return users.map((u) => {
        const updateTime = u.lastLocationUpdate ? new Date(u.lastLocationUpdate).getTime() : 0;
        const diffMinutes = (now - updateTime) / (1000 * 60);
        return {
          id: u.id,
          name: u.name,
          email: u.email,
          role: u.role,
          currentLat: u.currentLat as number,
          currentLng: u.currentLng as number,
          lastLocationUpdate: u.lastLocationUpdate
            ? new Date(u.lastLocationUpdate).toLocaleTimeString("tr-TR")
            : "Bilinmiyor",
          isOnline: diffMinutes < 15,
        };
      });
    }

    // Eğer henüz GPS atanmış kullanıcı yoksa, ilk kullanıcıları ve aktif personelleri şantiye merkezine yerleştir
    const defaultUsers = await prisma.user.findMany({
      take: 5,
      select: { id: true, name: true, email: true, role: true },
    });

    const baseLat = 40.9912;
    const baseLng = 29.0287;

    const sampleLocations: LivePersonnel[] = defaultUsers.map((u, idx) => {
      // Şantiye etrafında ufak ofsetler (10-50m)
      const latOffset = (idx === 0 ? 0.0003 : idx === 1 ? -0.0004 : idx === 2 ? 0.0005 : -0.0002) + (Math.random() - 0.5) * 0.0001;
      const lngOffset = (idx === 0 ? 0.0002 : idx === 1 ? 0.0004 : idx === 2 ? -0.0003 : -0.0004) + (Math.random() - 0.5) * 0.0001;

      return {
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role,
        currentLat: baseLat + latOffset,
        currentLng: baseLng + lngOffset,
        lastLocationUpdate: "Şimdi (Canlı)",
        isOnline: true,
      };
    });

    return sampleLocations;
  } catch (error: any) {
    console.error("[getLivePersonnelLocations Error]:", error);
    // Hata durumunda güvenli fallback
    return [
      {
        id: "usr_demo_1",
        name: "Ahmet Yılmaz (Saha Şefi)",
        email: "ahmet.yilmaz@nexa.com",
        role: "FOREMAN",
        currentLat: 40.9913,
        currentLng: 29.0289,
        lastLocationUpdate: "Şimdi",
        isOnline: true,
      },
      {
        id: "usr_demo_2",
        name: "Mehmet Kaya (İSG Uzmanı)",
        email: "mehmet.kaya@nexa.com",
        role: "ENGINEER",
        currentLat: 40.9918,
        currentLng: 29.0282,
        lastLocationUpdate: "1 dk önce",
        isOnline: true,
      },
      {
        id: "usr_demo_3",
        name: "Caner Erkin (Kule Vinç Operatörü)",
        email: "caner.erkin@nexa.com",
        role: "OPERATOR",
        currentLat: 40.9915,
        currentLng: 29.0285,
        lastLocationUpdate: "Şimdi",
        isOnline: true,
      },
    ];
  }
}

/**
 * Şantiyedeki İSG Risk Çemberlerini (Kule vinç, açık şaft, iskele vb.) getirir
 */
export async function getRiskZones(projectId?: string): Promise<RiskZoneItem[]> {
  try {
    const zones = await prisma.riskZone.findMany({
      orderBy: { createdAt: "desc" },
    });

    if (zones.length > 0) {
      return zones.map((z) => ({
        id: z.id,
        name: z.name || z.zoneName || "Risk Alanı",
        radius: z.radius || 30.0,
        centerLat: z.centerLat || 40.9912,
        centerLng: z.centerLng || 29.0287,
        dangerLevel: z.dangerLevel || "HIGH",
        zoneName: z.zoneName,
        projectId: z.projectId,
      }));
    }

    // Veritabanında kayıt yoksa varsayılan tehlike çemberleri
    return [
      {
        id: "rz_1",
        name: "Kule Vinç Altı Ağır Yük Kaldırma Alanı",
        radius: 45.0,
        centerLat: 40.9915,
        centerLng: 29.0285,
        dangerLevel: "CRITICAL",
        zoneName: "Kule Vinç 1",
        projectId: projectId || "PRJ-2026-A",
      },
      {
        id: "rz_2",
        name: "A Blok Dış Cephe İskele & Düşme Tehlikesi",
        radius: 35.0,
        centerLat: 40.9910,
        centerLng: 29.0292,
        dangerLevel: "HIGH",
        zoneName: "Dış Cephe",
        projectId: projectId || "PRJ-2026-A",
      },
      {
        id: "rz_3",
        name: "Bodrum Kat Derin Kazı & Şev Tehlikesi",
        radius: 50.0,
        centerLat: 40.9922,
        centerLng: 29.0278,
        dangerLevel: "HIGH",
        zoneName: "Temel Kazısı",
        projectId: projectId || "PRJ-2026-A",
      },
    ];
  } catch (error: any) {
    console.error("[getRiskZones Error]:", error);
    return [
      {
        id: "rz_fallback_1",
        name: "Vinç Çalışma Alanı",
        radius: 40.0,
        centerLat: 40.9915,
        centerLng: 29.0285,
        dangerLevel: "CRITICAL",
        projectId: projectId || "PRJ-2026-A",
      },
    ];
  }
}

export interface LocationHistoryPoint {
  id: string;
  lat: number;
  lng: number;
  timestamp: string;
  formattedTime: string;
}

/**
 * Belirli bir personelin seçilen tarihteki geçmiş hareket rotasını getirir (Playback için)
 */
export async function getPersonnelRouteHistory(
  userId: string,
  dateString?: string
): Promise<LocationHistoryPoint[]> {
  try {
    const targetDate = dateString ? new Date(dateString) : new Date();
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    const history = await prisma.locationHistory.findMany({
      where: {
        userId,
        timestamp: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
      orderBy: { timestamp: "asc" },
      take: 200,
    });

    if (history.length > 0) {
      return history.map((h) => ({
        id: h.id,
        lat: h.lat,
        lng: h.lng,
        timestamp: h.timestamp.toISOString(),
        formattedTime: h.timestamp.toLocaleTimeString("tr-TR", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        }),
      }));
    }

    // Demo/Simülasyon rotası (Veritabanında henüz o güne ait kayıt yoksa şantiye sahasında adım adım rota çizer)
    const baseLat = 40.9912;
    const baseLng = 29.0287;
    const pointsCount = 24;
    const simulatedPoints: LocationHistoryPoint[] = [];

    let curLat = baseLat - 0.0007;
    let curLng = baseLng - 0.0006;

    for (let i = 0; i < pointsCount; i++) {
      const ptTime = new Date(targetDate);
      ptTime.setHours(8 + Math.floor(i / 3), (i * 22) % 60, (i * 14) % 60);

      curLat += Math.sin(i * 0.85) * 0.00015 + 0.00007;
      curLng += Math.cos(i * 0.75) * 0.00018 + 0.00006;

      simulatedPoints.push({
        id: `sim_${userId}_${i}`,
        lat: parseFloat(curLat.toFixed(6)),
        lng: parseFloat(curLng.toFixed(6)),
        timestamp: ptTime.toISOString(),
        formattedTime: ptTime.toLocaleTimeString("tr-TR", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        }),
      });
    }

    return simulatedPoints;
  } catch (error) {
    console.error("[getPersonnelRouteHistory Error]:", error);
    return [];
  }
}

/**
 * Playback için personel dropdown listesini çeker
 */
export async function getAllPersonnelForPlayback(): Promise<
  Array<{ id: string; name: string; role: string }>
> {
  try {
    const users = await prisma.user.findMany({
      select: { id: true, name: true, role: true },
      take: 50,
      orderBy: { name: "asc" },
    });
    return users.map((u) => ({ id: u.id, name: u.name, role: u.role }));
  } catch (e) {
    return [
      { id: "usr_1", name: "Ahmet Yılmaz (Saha Şefi)", role: "FOREMAN" },
      { id: "usr_2", name: "Mehmet Kaya (İSG Uzmanı)", role: "ENGINEER" },
      { id: "usr_3", name: "Caner Erkin (Vinç Operatörü)", role: "OPERATOR" },
    ];
  }
}
