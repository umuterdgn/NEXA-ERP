/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Nexa ERP - Geofencing & GIS Geometry Utility (React Native & Mobile Web)
 * 
 * Provides Ray-Casting Point-in-Polygon, Polyline Proximity, GeoJSON Normalization,
 * and Danger Zone Geofence Breach Detection.
 */

export interface LatLng {
  latitude: number;
  longitude: number;
}

export interface MobileGeofence {
  id: string;
  projectId?: string;
  name: string;
  type: "MAIN_SITE" | "DANGER_ZONE" | "REST_AREA" | "POLYLINE" | "STORAGE" | string;
  coordinates: LatLng[];
  isActive?: boolean;
}

/**
 * Normalizes varied coordinate representations (GeoJSON [lng, lat], {lat, lng}, {latitude, longitude})
 * into a consistent LatLng[] array.
 */
export function normalizeCoordinates(raw: any): LatLng[] {
  if (!raw) return [];

  let data = raw;
  if (typeof raw === "string") {
    try {
      data = JSON.parse(raw);
    } catch {
      return [];
    }
  }

  // Handle GeoJSON Feature
  if (data?.type === "Feature" && data?.geometry?.coordinates) {
    data = data.geometry.coordinates;
  }

  // Handle GeoJSON Polygon: [ [ [lng, lat], ... ] ]
  if (Array.isArray(data) && Array.isArray(data[0]) && Array.isArray(data[0][0])) {
    data = data[0];
  }

  if (!Array.isArray(data)) return [];

  const result: LatLng[] = [];

  for (const item of data) {
    if (!item) continue;

    if (Array.isArray(item) && item.length >= 2) {
      // GeoJSON standard: [longitude, latitude]
      const lng = Number(item[0]);
      const lat = Number(item[1]);
      if (!isNaN(lat) && !isNaN(lng)) {
        result.push({ latitude: lat, longitude: lng });
      }
    } else if (typeof item === "object") {
      const lat = Number(item.latitude ?? item.lat);
      const lng = Number(item.longitude ?? item.lng);
      if (!isNaN(lat) && !isNaN(lng)) {
        result.push({ latitude: lat, longitude: lng });
      }
    }
  }

  return result;
}

/**
 * Point-in-Polygon test using the Ray-Casting algorithm (Jordan curve theorem).
 * Returns true if the coordinate is inside the polygon.
 */
export function isPointInPolygon(point: LatLng, polygon: LatLng[]): boolean {
  if (!polygon || polygon.length < 3) return false;

  let inside = false;
  const x = point.longitude;
  const y = point.latitude;

  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].longitude;
    const yi = polygon[i].latitude;
    const xj = polygon[j].longitude;
    const yj = polygon[j].latitude;

    const intersect =
      yi > y !== yj > y &&
      x < ((xj - xi) * (y - yi)) / (yj - yi || 0.00000001) + xi;

    if (intersect) {
      inside = !inside;
    }
  }

  return inside;
}

/**
 * Haversine formula to calculate great-circle distance between two coordinates in meters.
 */
export function calculateDistanceMeters(p1: LatLng, p2: LatLng): number {
  const R = 6371000; // Earth radius in meters
  const dLat = ((p2.latitude - p1.latitude) * Math.PI) / 180;
  const dLng = ((p2.longitude - p1.longitude) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((p1.latitude * Math.PI) / 180) *
      Math.cos((p2.latitude * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Calculates perpendicular or nearest distance from a point to a line segment (in meters).
 */
export function distancePointToSegment(point: LatLng, p1: LatLng, p2: LatLng): number {
  const d12 = calculateDistanceMeters(p1, p2);
  if (d12 === 0) return calculateDistanceMeters(point, p1);

  // Vector projection
  const dLat = p2.latitude - p1.latitude;
  const dLng = p2.longitude - p1.longitude;

  const t = Math.max(
    0,
    Math.min(
      1,
      ((point.latitude - p1.latitude) * dLat + (point.longitude - p1.longitude) * dLng) /
        (dLat * dLat + dLng * dLng || 0.00000001)
    )
  );

  const projection: LatLng = {
    latitude: p1.latitude + t * dLat,
    longitude: p1.longitude + t * dLng,
  };

  return calculateDistanceMeters(point, projection);
}

/**
 * Checks if a point is within `maxDistanceMeters` of any segment along a polyline.
 */
export function isPointNearPolyline(
  point: LatLng,
  polyline: LatLng[],
  maxDistanceMeters: number = 35
): boolean {
  if (!polyline || polyline.length < 2) return false;

  for (let i = 0; i < polyline.length - 1; i++) {
    const dist = distancePointToSegment(point, polyline[i], polyline[i + 1]);
    if (dist <= maxDistanceMeters) {
      return true;
    }
  }

  return false;
}

/**
 * Verifies if user is inside a zone (handles both Polygon and Polyline).
 */
export function isUserInZone(userLocation: LatLng, zone: MobileGeofence): boolean {
  if (!zone || !zone.coordinates || zone.coordinates.length === 0) return true;

  if (zone.type === "POLYLINE" || zone.coordinates.length === 2) {
    return isPointNearPolyline(userLocation, zone.coordinates, 40);
  }

  return isPointInPolygon(userLocation, zone.coordinates);
}

/**
 * Calculates geometric center/centroid and bounds delta for camera view.
 */
export function getCoordinatesCenterAndDelta(coords: LatLng[]): {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
} {
  if (!coords || coords.length === 0) {
    return {
      latitude: 41.0082,
      longitude: 28.9784,
      latitudeDelta: 0.005,
      longitudeDelta: 0.005,
    };
  }

  let minLat = coords[0].latitude;
  let maxLat = coords[0].latitude;
  let minLng = coords[0].longitude;
  let maxLng = coords[0].longitude;

  for (const c of coords) {
    if (c.latitude < minLat) minLat = c.latitude;
    if (c.latitude > maxLat) maxLat = c.latitude;
    if (c.longitude < minLng) minLng = c.longitude;
    if (c.longitude > maxLng) maxLng = c.longitude;
  }

  const centerLat = (minLat + maxLat) / 2;
  const centerLng = (minLng + maxLng) / 2;
  const latDelta = Math.max(0.002, (maxLat - minLat) * 1.6);
  const lngDelta = Math.max(0.002, (maxLng - minLng) * 1.6);

  return {
    latitude: centerLat,
    longitude: centerLng,
    latitudeDelta: latDelta,
    longitudeDelta: lngDelta,
  };
}

