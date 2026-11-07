/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Nexa ERP - Mobil Görev Mini Haritası (TaskMiniMap)
 * 
 * Personel veya taşeron bir iş emrine tıkladığında görevin bağlı olduğu
 * poligon veya çizgiyi (Polyline), şantiyedeki konumunu ve kullanıcının canlı
 * GPS mesafesini görselleştiren iOS standartlarında mini harita bileşeni.
 */

import React, { useRef, useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from "react-native";
import MapView, { Polygon, Polyline, Marker } from "react-native-maps";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import {
  LatLng,
  getCoordinatesCenterAndDelta,
  calculateDistanceMeters,
} from "../../lib/geofencing";
import { useMobileTheme } from "../../context/ThemeContext";

const { width } = Dimensions.get("window");

export interface TaskMiniMapProps {
  taskTitle?: string;
  taskCode?: string;
  zoneName?: string;
  zoneType?: "POLYGON" | "POLYLINE" | "DANGER_ZONE" | "MAIN_SITE" | string;
  coordinates: LatLng[];
  userLocation?: LatLng | null;
  height?: number;
  onExpandPress?: () => void;
}

// Google Maps Dark Style JSON
const DARK_MAP_STYLE = [
  { elementType: "geometry", stylers: [{ color: "#171B26" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#171B26" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#8E9AA8" }] },
  {
    featureType: "administrative.locality",
    elementType: "labels.text.fill",
    stylers: [{ color: "#D4DFEE" }],
  },
  {
    featureType: "poi",
    elementType: "labels.text.fill",
    stylers: [{ color: "#6A778B" }],
  },
  {
    featureType: "poi.park",
    elementType: "geometry",
    stylers: [{ color: "#1B2820" }],
  },
  {
    featureType: "road",
    elementType: "geometry",
    stylers: [{ color: "#242C3C" }],
  },
  {
    featureType: "road",
    elementType: "geometry.stroke",
    stylers: [{ color: "#1B2230" }],
  },
  {
    featureType: "road.highway",
    elementType: "geometry",
    stylers: [{ color: "#3B4A62" }],
  },
  {
    featureType: "transit",
    elementType: "geometry",
    stylers: [{ color: "#1B2230" }],
  },
  {
    featureType: "water",
    elementType: "geometry",
    stylers: [{ color: "#0E1420" }],
  },
];

export default function TaskMiniMap({
  taskTitle = "İş Emri Görev Sahası",
  taskCode,
  zoneName = "Blok Sahası",
  zoneType = "POLYGON",
  coordinates = [],
  userLocation,
  height = 170,
  onExpandPress,
}: TaskMiniMapProps) {
  const mapRef = useRef<MapView | null>(null);
  const { colors, theme } = useMobileTheme();
  const isDark = theme === "dark" || theme === "monochrome";

  const isPolyline =
    zoneType === "POLYLINE" ||
    (coordinates.length >= 2 && coordinates.length <= 3 && zoneType !== "DANGER_ZONE");

  const isDanger = zoneType === "DANGER_ZONE";

  const centerDelta = getCoordinatesCenterAndDelta(coordinates);

  // Recenter map if coordinates change
  useEffect(() => {
    if (mapRef.current && coordinates.length > 0) {
      mapRef.current.animateToRegion(centerDelta, 600);
    }
  }, [coordinates]);

  // Center coordinate of the zone
  const centerCoord: LatLng = {
    latitude: centerDelta.latitude,
    longitude: centerDelta.longitude,
  };

  // User distance to zone center
  const distanceToCenter = userLocation
    ? Math.round(calculateDistanceMeters(userLocation, centerCoord))
    : null;

  return (
    <View style={[styles.container, { height }]}>
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFill}
        initialRegion={centerDelta}
        customMapStyle={isDark ? DARK_MAP_STYLE : []}
        userInterfaceStyle={isDark ? "dark" : "light"}
        scrollEnabled={true}
        zoomEnabled={true}
        pitchEnabled={false}
        rotateEnabled={false}
        showsCompass={false}
      >
        {/* Polyline Rendering (Yatay Proje / Altyapı Hattı) */}
        {isPolyline && coordinates.length >= 2 && (
          <Polyline
            coordinates={coordinates}
            strokeColor="#F59E0B"
            strokeWidth={4}
            lineDashPattern={[8, 4]}
          />
        )}

        {/* Polygon Rendering (Kat, Mahal, Şantiye veya Risk Alanı) */}
        {!isPolyline && coordinates.length >= 3 && (
          <Polygon
            coordinates={coordinates}
            strokeColor={isDanger ? "#EF4444" : "#0A7AFF"}
            fillColor={
              isDanger ? "rgba(239, 68, 68, 0.28)" : "rgba(10, 122, 255, 0.22)"
            }
            strokeWidth={2}
          />
        )}

        {/* Görev Sahası Merkez Pin İşaretçisi */}
        {coordinates.length > 0 && (
          <Marker coordinate={centerCoord} anchor={{ x: 0.5, y: 0.5 }}>
            <View style={styles.centerPinWrapper}>
              <View
                style={[
                  styles.centerPinBubble,
                  { backgroundColor: isDanger ? "#EF4444" : "#0A7AFF" },
                ]}
              >
                <MaterialCommunityIcons
                  name={isPolyline ? "vector-polyline" : isDanger ? "alert-octagon" : "office-building-marker"}
                  size={16}
                  color="#FFFFFF"
                />
              </View>
              <View
                style={[
                  styles.centerPinTriangle,
                  { borderTopColor: isDanger ? "#EF4444" : "#0A7AFF" },
                ]}
              />
            </View>
          </Marker>
        )}

        {/* Kullanıcının Canlı GPS Konumu */}
        {userLocation && (
          <Marker coordinate={userLocation} anchor={{ x: 0.5, y: 0.5 }}>
            <View style={styles.userDotWrapper}>
              <View style={styles.userDotPulse} />
              <View style={styles.userDotCore} />
            </View>
          </Marker>
        )}
      </MapView>

      {/* Üst Sol Bilgi Kapsülü */}
      <View style={styles.floatingHeader}>
        <View style={styles.zoneTypeBadge}>
          <Ionicons
            name={isPolyline ? "git-commit" : isDanger ? "warning" : "map"}
            size={12}
            color={isDanger ? "#EF4444" : isPolyline ? "#F59E0B" : "#60A5FA"}
          />
          <Text
            style={[
              styles.zoneTypeText,
              { color: isDanger ? "#EF4444" : isPolyline ? "#F59E0B" : "#60A5FA" },
            ]}
          >
            {isPolyline ? "YATAY HAT (GÜZERGAH)" : isDanger ? "RİSKLİ ALAN (DANGER)" : "ŞANTİYE GÖREV SAHASI"}
          </Text>
        </View>

        <Text style={styles.zoneNameText} numberOfLines={1}>
          📍 {zoneName}
        </Text>
      </View>

      {/* Üst Sağ Mesafe & Koordinat Rozeti */}
      <View style={styles.floatingDistance}>
        {distanceToCenter !== null ? (
          <View style={styles.distanceBadge}>
            <Ionicons name="navigate-circle" size={13} color="#10B981" />
            <Text style={styles.distanceText}>
              {distanceToCenter < 1000
                ? `${distanceToCenter} m uzaktasınız`
                : `${(distanceToCenter / 1000).toFixed(1)} km`}
            </Text>
          </View>
        ) : (
          <View style={styles.distanceBadge}>
            <Ionicons name="location-outline" size={13} color="#94A3B8" />
            <Text style={styles.distanceText}>
              {centerCoord.latitude.toFixed(4)}°, {centerCoord.longitude.toFixed(4)}°
            </Text>
          </View>
        )}
      </View>

      {/* Alt Sağ Odaklan / Büyüt Butonu */}
      <TouchableOpacity
        style={styles.recenterButton}
        activeOpacity={0.8}
        onPress={() => {
          mapRef.current?.animateToRegion(centerDelta, 500);
          if (onExpandPress) onExpandPress();
        }}
      >
        <Ionicons name="scan" size={16} color="#FFFFFF" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    borderRadius: 16,
    overflow: "hidden",
    position: "relative",
    backgroundColor: "#111827",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.12)",
    marginBottom: 12,
  },
  floatingHeader: {
    position: "absolute",
    top: 10,
    left: 10,
    backgroundColor: "rgba(15, 23, 42, 0.85)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.15)",
    maxWidth: width * 0.58,
  },
  zoneTypeBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 2,
  },
  zoneTypeText: {
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 0.4,
  },
  zoneNameText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "700",
  },
  floatingDistance: {
    position: "absolute",
    top: 10,
    right: 10,
  },
  distanceBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(15, 23, 42, 0.85)",
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.15)",
  },
  distanceText: {
    color: "#E2E8F0",
    fontSize: 10,
    fontWeight: "600",
  },
  recenterButton: {
    position: "absolute",
    bottom: 10,
    right: 10,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(15, 23, 42, 0.85)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  centerPinWrapper: {
    alignItems: "center",
    justifyContent: "center",
  },
  centerPinBubble: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 4,
    elevation: 5,
  },
  centerPinTriangle: {
    width: 0,
    height: 0,
    backgroundColor: "transparent",
    borderStyle: "solid",
    borderLeftWidth: 5,
    borderRightWidth: 5,
    borderTopWidth: 6,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
  },
  userDotWrapper: {
    alignItems: "center",
    justifyContent: "center",
  },
  userDotPulse: {
    position: "absolute",
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "rgba(16, 185, 129, 0.3)",
    borderWidth: 1,
    borderColor: "rgba(16, 185, 129, 0.6)",
  },
  userDotCore: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#10B981",
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
});
