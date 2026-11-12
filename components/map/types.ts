/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Pure TypeScript definitions for Map components (SSR-safe, zero runtime imports)
 */

export interface BleEquipment {
  id: string
  name: string
  type: string
  category?: string
  status: "AKTIF" | "KAYIP" | string
  rawStatus?: string
  serialNumber?: string
  bleTagId: string
  latitude: number
  longitude: number
  lastSeenAt: string
  projectId?: string | null
  project?: {
    id: string
    title: string
    name: string
    latitude: number | null
    longitude: number | null
  } | null
  assignedTo?: {
    id: string
    name: string
    department?: string
    phone?: string
  } | null
}

export interface BleSiteZone {
  id: string
  title: string
  zoneType: "MAIN_SITE" | "DANGER_ZONE" | "REST_AREA" | "POLYLINE" | string
  polygonCoordinates?: { lat: number; lng: number }[]
  supervisor?: string
  projectId?: string
}

export interface LiveBleWorker {
  id: string
  name: string
  department: string
  position: string
  role?: string
  latitude: number
  longitude: number
  pulse: number
  battery: number
  hasHelmet: boolean
  inDanger: boolean
  currentZoneName: string
  currentZoneType: string | null
}

export interface ActiveRadarPersonnel {
  id: string
  name?: string
  firstName?: string
  lastName?: string
  department?: string
  position?: string
  lastKnownLat: number | null
  lastKnownLng: number | null
  role?: string
  pulse?: number
  battery?: number
  hasHelmet?: boolean
  inDanger?: boolean
  currentZoneName?: string
  currentZoneType?: string | null
}

export interface GeofenceZoneItem {
  id: string
  name?: string
  title?: string
  type?: string
  zoneType?: string
  coordinates?: any
  polygonCoordinates?: { lat: number; lng: number }[]
  supervisor?: string
  projectId?: string
}

export interface MapProjectItem {
  id: string
  title?: string | null
  name?: string | null
  city?: string | null
  district?: string | null
  latitude?: number | null
  longitude?: number | null
  progress?: number
  healthScore?: number
  activeWorkers?: number
  totalBlocks?: number
}

export interface BleEquipmentMapProps {
  center: [number, number]
  zoom?: number
  equipments: BleEquipment[]
  siteZones?: BleSiteZone[]
  zones?: GeofenceZoneItem[]
  activeRadars?: ActiveRadarPersonnel[]
  projects?: MapProjectItem[]
  highlightedId?: string | null
  searchQuery?: string
  onSelectEquipment?: (equipment: BleEquipment) => void
  onSelectProject?: (project: MapProjectItem) => void
  onDeleteZone?: (zoneId: string) => void
  selectedProjectName?: string
  // Drawing mode props
  isDrawing?: boolean
  drawShape?: "POLYGON" | "POLYLINE"
  drawZoneType?: "MAIN_SITE" | "DANGER_ZONE" | "REST_AREA"
  drawingPoints?: { lat: number; lng: number }[]
  onAddDrawingPoint?: (pt: { lat: number; lng: number }) => void
  onFinishDrawing?: () => void
}

