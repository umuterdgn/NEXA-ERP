/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Nexa ERP - iOS Style Custom Map Icons (divIcon)
 */

import L from "leaflet"

// 1. Mühendis (Mavi zeminli baret ikonu)
export function createEngineerDivIcon(name: string) {
  return L.divIcon({
    className: "custom-engineer-marker",
    iconSize: [40, 40],
    iconAnchor: [20, 20],
    html: `
      <div style="position: relative; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; cursor: pointer;">
        <div style="position: absolute; inset: -4px; border-radius: 9999px; background: rgba(37, 99, 235, 0.35); filter: blur(4px);"></div>
        <div style="width: 32px; height: 32px; border-radius: 9999px; background: #2563eb; border: 2px solid #93c5fd; box-shadow: 0 4px 12px rgba(37, 99, 235, 0.5); display: flex; align-items: center; justify-content: center; color: white;">
          <svg style="width: 17px; height: 17px;" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 2a5 5 0 00-5 5v2H5a2 2 0 00-2 2v2a2 2 0 002 2h14a2 2 0 002-2v-2a2 2 0 00-2-2h-2V7a5 5 0 00-5-5zM4 17h16v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2z" />
          </svg>
        </div>
        <span style="position: absolute; bottom: -18px; font-size: 9px; font-weight: 700; color: #93c5fd; white-space: nowrap; background: rgba(15, 23, 42, 0.95); padding: 0.5px 5px; border-radius: 4px; border: 1px solid rgba(59, 130, 246, 0.4);">${(name || "Mühendis").split(' ')[0]}</span>
      </div>
    `
  })
}

// 2. Şoför / Araç (Turuncu zeminli kamyon ikonu)
export function createDriverDivIcon(name: string) {
  return L.divIcon({
    className: "custom-driver-marker",
    iconSize: [40, 40],
    iconAnchor: [20, 20],
    html: `
      <div style="position: relative; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; cursor: pointer;">
        <div style="position: absolute; inset: -4px; border-radius: 9999px; background: rgba(234, 88, 12, 0.35); filter: blur(4px);"></div>
        <div style="width: 32px; height: 32px; border-radius: 9999px; background: #ea580c; border: 2px solid #fdba74; box-shadow: 0 4px 12px rgba(234, 88, 12, 0.5); display: flex; align-items: center; justify-content: center; color: white;">
          <svg style="width: 17px; height: 17px;" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
            <path stroke-linecap="round" stroke-linejoin="round" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8h4l3 4v4a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h2a1 1 0 001-1" />
          </svg>
        </div>
        <span style="position: absolute; bottom: -18px; font-size: 9px; font-weight: 700; color: #fdba74; white-space: nowrap; background: rgba(15, 23, 42, 0.95); padding: 0.5px 5px; border-radius: 4px; border: 1px solid rgba(234, 88, 12, 0.4);">${(name || "Araç").split(' ')[0]}</span>
      </div>
    `
  })
}

// 3. Ambar / Depo (Gri zeminli paket ikonu)
export function createStorageDivIcon(name: string) {
  return L.divIcon({
    className: "custom-storage-marker",
    iconSize: [40, 40],
    iconAnchor: [20, 20],
    html: `
      <div style="position: relative; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; cursor: pointer;">
        <div style="position: absolute; inset: -4px; border-radius: 9999px; background: rgba(71, 85, 105, 0.35); filter: blur(4px);"></div>
        <div style="width: 32px; height: 32px; border-radius: 9999px; background: #475569; border: 2px solid #cbd5e1; box-shadow: 0 4px 12px rgba(71, 85, 105, 0.5); display: flex; align-items: center; justify-content: center; color: white;">
          <svg style="width: 17px; height: 17px;" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
        </div>
        <span style="position: absolute; bottom: -18px; font-size: 9px; font-weight: 700; color: #cbd5e1; white-space: nowrap; background: rgba(15, 23, 42, 0.95); padding: 0.5px 5px; border-radius: 4px; border: 1px solid rgba(148, 163, 184, 0.4);">${(name || "Depo").slice(0, 10)}</span>
      </div>
    `
  })
}

// 4. İSG Güvenlik (Kırmızı zeminli kalkan ikonu)
export function createIsgDivIcon(name: string) {
  return L.divIcon({
    className: "custom-isg-marker",
    iconSize: [40, 40],
    iconAnchor: [20, 20],
    html: `
      <div style="position: relative; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; cursor: pointer;">
        <div style="position: absolute; inset: -4px; border-radius: 9999px; background: rgba(220, 38, 38, 0.4); filter: blur(4px); animation: pulse 2s infinite;"></div>
        <div style="width: 32px; height: 32px; border-radius: 9999px; background: #dc2626; border: 2px solid #fca5a5; box-shadow: 0 4px 14px rgba(220, 38, 38, 0.6); display: flex; align-items: center; justify-content: center; color: white;">
          <svg style="width: 17px; height: 17px;" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <span style="position: absolute; bottom: -18px; font-size: 9px; font-weight: 700; color: #fca5a5; white-space: nowrap; background: rgba(15, 23, 42, 0.95); padding: 0.5px 5px; border-radius: 4px; border: 1px solid rgba(220, 38, 38, 0.4);">${(name || "İSG").split(' ')[0]}</span>
      </div>
    `
  })
}

// 5. Şantiye Proje Noktası (Türkiye genel görünümü için)
export function createProjectPinIcon(title: string) {
  return L.divIcon({
    className: "custom-project-pin",
    iconSize: [44, 44],
    iconAnchor: [22, 22],
    html: `
      <div style="position: relative; width: 44px; height: 44px; display: flex; align-items: center; justify-content: center; cursor: pointer;">
        <div style="position: absolute; inset: -4px; border-radius: 14px; background: rgba(37, 99, 235, 0.35); filter: blur(5px);"></div>
        <div style="width: 36px; height: 36px; border-radius: 12px; background: linear-gradient(135deg, #1d4ed8, #3b82f6); border: 2.5px solid #bfdbfe; box-shadow: 0 4px 16px rgba(37, 99, 235, 0.6); display: flex; align-items: center; justify-content: center; color: white;">
          <svg style="width: 19px; height: 19px;" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
        </div>
        <span style="position: absolute; bottom: -20px; font-size: 10px; font-weight: 800; color: white; white-space: nowrap; background: rgba(15, 23, 42, 0.95); padding: 1px 7px; border-radius: 6px; border: 1px solid rgba(59, 130, 246, 0.5); box-shadow: 0 2px 8px rgba(0,0,0,0.5);">${(title || "Şantiye").slice(0, 16)}</span>
      </div>
    `
  })
}

// 6. Rol Çözümleyici Yardımcı
export function resolveMarkerRole(item: { role?: string; position?: string; department?: string; category?: string; type?: string }): "ENGINEER" | "DRIVER" | "STORAGE" | "ISG" | "WORKER" {
  const text = `${item.role || ""} ${item.position || ""} ${item.department || ""} ${item.category || ""} ${item.type || ""}`.toUpperCase()
  if (text.includes("MÜHENDİS") || text.includes("MUHENDIS") || text.includes("ENGINEER") || text.includes("MİMAR") || text.includes("MIMAR")) {
    return "ENGINEER"
  }
  if (text.includes("ŞOFÖR") || text.includes("SOFOR") || text.includes("DRIVER") || text.includes("KAMYON") || text.includes("TRUCK") || text.includes("ARAÇ") || text.includes("ARAC")) {
    return "DRIVER"
  }
  if (text.includes("AMBAR") || text.includes("DEPO") || text.includes("STORAGE") || text.includes("MALZEME") || text.includes("EKİPMAN") || text.includes("HİLTİ")) {
    return "STORAGE"
  }
  if (text.includes("İSG") || text.includes("ISG") || text.includes("GÜVENLİK") || text.includes("SAFETY") || text.includes("DENETÇİ")) {
    return "ISG"
  }
  return "WORKER"
}

