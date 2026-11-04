/**
 * © 2026 NXA Software. All rights reserved.
 * Nexa ERP - BLE Donanımlı Personel ve Ekipman Mock Verileri
 * Şantiye Canlı Konum ve Telemetri Takibi
 */

export interface BleEntity {
  id: string;
  type: 'personnel' | 'equipment';
  name: string;
  role: string;
  latitude: number;
  longitude: number;
  battery: number;
  status: 'active' | 'idle' | 'warning' | 'offline';
  lastSeen?: string;
  zone?: string;
}

export const SITE_CENTER_REGION = {
  latitude: 36.5878,
  longitude: 36.1735,
  latitudeDelta: 0.006,
  longitudeDelta: 0.006,
};

export const mockBleEntities: BleEntity[] = [
  {
    id: 'p1',
    type: 'personnel',
    name: 'Ahmet Yılmaz',
    role: 'Şantiye Şefi',
    latitude: 36.5878,
    longitude: 36.1735,
    battery: 85,
    status: 'active',
    lastSeen: '1 dk önce',
    zone: 'Blok-A • Zemin Kat',
  },
  {
    id: 'p2',
    type: 'personnel',
    name: 'Mehmet Demir',
    role: 'Operatör',
    latitude: 36.5881,
    longitude: 36.1730,
    battery: 42,
    status: 'active',
    lastSeen: 'Şimdi',
    zone: 'Açık Saha / Kazı Alanı',
  },
  {
    id: 'e1',
    type: 'equipment',
    name: 'Kule Vinç 1',
    role: 'Ağır Ekipman',
    latitude: 36.5885,
    longitude: 36.1740,
    battery: 100,
    status: 'idle',
    lastSeen: '3 dk önce',
    zone: 'Blok-B Çevresi',
  },
  {
    id: 'e2',
    type: 'equipment',
    name: 'Ekskavatör',
    role: 'Kazı',
    latitude: 36.5875,
    longitude: 36.1725,
    battery: 12,
    status: 'warning',
    lastSeen: '2 dk önce',
    zone: 'Temel Kazı Çukuru',
  },
];
