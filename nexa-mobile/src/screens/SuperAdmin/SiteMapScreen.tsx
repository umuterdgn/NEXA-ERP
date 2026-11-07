/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Nexa ERP - Super Admin Şantiye BLE Canlı Takip & GIS Haritası (SiteMapScreen)
 *
 * BLE donanımlı personelleri (mavi baret), ağır iş makinelerini (turuncu vinç/ekskavatör)
 * ve Web Panelinden çizilen Sanal Çit (Poligon/Polyline/DANGER_ZONE) sınırlarını
 * canlı harita üzerinde açık/koyu tema destekli olarak görselleştirir.
 */

import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Dimensions,
  ScrollView,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import MapView, { Marker, Callout, Region, Polygon, Polyline } from "react-native-maps";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import {
  mockBleEntities,
  BleEntity,
  SITE_CENTER_REGION,
} from "../../data/mockBleData";
import { useMobileTheme } from "../../context/ThemeContext";
import { geofencesApi } from "../../apiClient";
import {
  normalizeCoordinates,
  MobileGeofence,
  getCoordinatesCenterAndDelta,
  LatLng,
} from "../../lib/geofencing";

const { width } = Dimensions.get("window");

export interface SiteMapScreenProps {
  onBackPress?: () => void;
}

// Google Maps Koyu Tema JSON Yapılandırması
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

export default function SiteMapScreen({ onBackPress }: SiteMapScreenProps) {
  const mapRef = useRef<MapView | null>(null);
  const { theme } = useMobileTheme();
  const isDark = theme === "dark" || theme === "monochrome";

  const [entities, setEntities] = useState<BleEntity[]>(mockBleEntities);
  const [geofences, setGeofences] = useState<MobileGeofence[]>([]);
  const [selectedFilter, setSelectedFilter] = useState<"all" | "personnel" | "equipment" | "geofences">("all");
  const [selectedEntity, setSelectedEntity] = useState<BleEntity | null>(null);
  const [selectedGeofence, setSelectedGeofence] = useState<MobileGeofence | null>(null);
  const [mapType, setMapType] = useState<"standard" | "satellite">("standard");
  const [isLoadingGeofences, setIsLoadingGeofences] = useState<boolean>(false);

  // Web Panelinden çizilen Sanal Çit (Poligon & Polyline) verilerini yükle
  const loadGeofences = useCallback(async () => {
    try {
      setIsLoadingGeofences(true);
      const data = await geofencesApi.getGeofences();
      if (Array.isArray(data)) {
        const parsed: MobileGeofence[] = data.map((item: any) => ({
          id: item.id || `gf-${Math.random()}`,
          name: item.name || item.title || "Şantiye Alanı",
          type: item.type || item.zoneType || "MAIN_SITE",
          coordinates: normalizeCoordinates(item.coordinates || item.polygonCoordinates),
          projectId: item.projectId,
          isActive: item.isActive !== false,
        }));
        setGeofences(parsed);
      }
    } catch (err) {
      console.warn("[SiteMapScreen] loadGeofences error:", err);
    } finally {
      setIsLoadingGeofences(false);
    }
  }, []);

  useEffect(() => {
    loadGeofences();
  }, [loadGeofences]);

  // Filtreleme mantığı
  const filteredEntities = entities.filter((item) => {
    if (selectedFilter === "geofences") return false;
    if (selectedFilter === "all") return true;
    return item.type === selectedFilter;
  });

  const filteredGeofences = geofences.filter((item) => {
    if (selectedFilter === "personnel" || selectedFilter === "equipment") return false;
    return true;
  });

  // Şantiye merkezine odaklan
  const handleRecenter = () => {
    mapRef.current?.animateToRegion(SITE_CENTER_REGION, 800);
    setSelectedEntity(null);
    setSelectedGeofence(null);
  };

  // Belirli bir öğeye haritada odaklan
  const handleFocusEntity = (item: BleEntity) => {
    setSelectedEntity(item);
    setSelectedGeofence(null);
    const targetRegion: Region = {
      latitude: item.latitude,
      longitude: item.longitude,
      latitudeDelta: 0.003,
      longitudeDelta: 0.003,
    };
    mapRef.current?.animateToRegion(targetRegion, 600);
  };

  // Belirli bir poligon veya polyline alanına odaklan
  const handleFocusGeofence = (gf: MobileGeofence) => {
    setSelectedGeofence(gf);
    setSelectedEntity(null);
    if (gf.coordinates.length > 0) {
      const delta = getCoordinatesCenterAndDelta(gf.coordinates);
      mapRef.current?.animateToRegion(delta, 600);
    }
  };

  // Pil durumuna göre renk kodu
  const getBatteryColor = (level: number) => {
    if (level > 50) return "#10B981"; // Yeşil
    if (level > 20) return "#F59E0B"; // Sarı / Kehribar
    return "#EF4444"; // Kırmızı (Kritik)
  };

  // Durum etiket metni
  const getStatusLabel = (status: BleEntity["status"]) => {
    switch (status) {
      case "active":
        return "Aktif / Çalışıyor";
      case "idle":
        return "Rölanti / Beklemede";
      case "warning":
        return "Dikkat / Düşük Pil";
      default:
        return "Bilinmiyor";
    }
  };

  // Poligon stili belirleme
  const getPolygonStyle = (type: string) => {
    switch (type) {
      case "DANGER_ZONE":
        return {
          stroke: "#EF4444",
          fill: "rgba(239, 68, 68, 0.28)",
          label: "⚠️ RİSKLİ BÖLGE",
        };
      case "REST_AREA":
        return {
          stroke: "#10B981",
          fill: "rgba(16, 185, 129, 0.22)",
          label: "☕ DİNLENME ALANI",
        };
      case "STORAGE":
      case "EXCAVATION":
        return {
          stroke: "#F59E0B",
          fill: "rgba(245, 158, 11, 0.20)",
          label: "📦 DEPO / KAZI",
        };
      case "MAIN_SITE":
      default:
        return {
          stroke: "#3B82F6",
          fill: "rgba(59, 130, 246, 0.16)",
          label: "🏗️ ŞANTİYE SINIRI",
        };
    }
  };

  const personnelCount = entities.filter((e) => e.type === "personnel").length;
  const equipmentCount = entities.filter((e) => e.type === "equipment").length;
  const warningCount = entities.filter((e) => e.battery <= 20).length;

  return (
    <SafeAreaView edges={["top"]} style={[styles.container, !isDark && styles.containerLight]}>
      {/* Üst Başlık & Kontrol Çubuğu */}
      <View style={[styles.header, !isDark && styles.headerLight]}>
        <View style={styles.headerRow}>
          {onBackPress && (
            <TouchableOpacity
              onPress={onBackPress}
              activeOpacity={0.7}
              style={styles.backButton}
            >
              <Ionicons name="arrow-back" size={22} color={isDark ? "#FFFFFF" : "#0F172A"} />
            </TouchableOpacity>
          )}

          <View style={styles.titleContainer}>
            <View style={styles.badgeRow}>
              <View style={styles.liveDot} />
              <Text style={styles.badgeText}>SUPER ADMIN • CANLI GIS & RADAR</Text>
            </View>
            <Text style={[styles.titleText, !isDark && styles.titleTextLight]}>
              Şantiye Konum, Çit & Telemetri
            </Text>
          </View>

          <TouchableOpacity
            onPress={() => setMapType(mapType === "standard" ? "satellite" : "standard")}
            activeOpacity={0.8}
            style={styles.mapTypeToggle}
          >
            <Ionicons
              name={mapType === "standard" ? "earth" : "map-outline"}
              size={18}
              color="#60A5FA"
            />
            <Text style={styles.mapTypeText}>
              {mapType === "standard" ? "Uydu" : "Harita"}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Filtre Kapsülleri */}
        <View style={styles.filterRow}>
          <TouchableOpacity
            onPress={() => setSelectedFilter("all")}
            activeOpacity={0.8}
            style={[
              styles.filterPill,
              selectedFilter === "all" && styles.filterPillActive,
            ]}
          >
            <Text
              style={[
                styles.filterText,
                selectedFilter === "all" && styles.filterTextActive,
              ]}
            >
              Tümü ({entities.length + geofences.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setSelectedFilter("personnel")}
            activeOpacity={0.8}
            style={[
              styles.filterPill,
              selectedFilter === "personnel" && styles.filterPillActive,
            ]}
          >
            <Text
              style={[
                styles.filterText,
                selectedFilter === "personnel" && styles.filterTextActive,
              ]}
            >
              Personel ({personnelCount})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setSelectedFilter("equipment")}
            activeOpacity={0.8}
            style={[
              styles.filterPill,
              selectedFilter === "equipment" && styles.filterPillActive,
            ]}
          >
            <Text
              style={[
                styles.filterText,
                selectedFilter === "equipment" && styles.filterTextActive,
              ]}
            >
              Ekipman ({equipmentCount})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setSelectedFilter("geofences")}
            activeOpacity={0.8}
            style={[
              styles.filterPill,
              selectedFilter === "geofences" && styles.filterPillActive,
            ]}
          >
            <Text
              style={[
                styles.filterText,
                selectedFilter === "geofences" && styles.filterTextActive,
              ]}
            >
              📐 Sanal Çit ({geofences.length})
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Harita Görünümü */}
      <View style={styles.mapWrapper}>
        <MapView
          ref={mapRef}
          style={StyleSheet.absoluteFill}
          initialRegion={SITE_CENTER_REGION}
          mapType={mapType}
          customMapStyle={isDark && mapType === "standard" ? DARK_MAP_STYLE : []}
          userInterfaceStyle={isDark ? "dark" : "light"}
          showsCompass={true}
          showsScale={true}
        >
          {/* ======================================================== */}
          {/* ADIM 1: GEOFENCE POLİGONLARI VE POLYLİNE (ÇİZGİ) ÇİZİMİ   */}
          {/* ======================================================== */}
          {filteredGeofences.map((gf) => {
            const isPoly = gf.type === "POLYLINE" || gf.coordinates.length === 2;
            const style = getPolygonStyle(gf.type);
            const isSelected = selectedGeofence?.id === gf.id;

            if (isPoly) {
              return (
                <Polyline
                  key={`gf-poly-${gf.id}`}
                  coordinates={gf.coordinates}
                  strokeColor={isSelected ? "#38BDF8" : "#F59E0B"}
                  strokeWidth={isSelected ? 6 : 4}
                  lineDashPattern={[10, 5]}
                  tappable
                  onPress={() => handleFocusGeofence(gf)}
                />
              );
            }

            if (gf.coordinates.length >= 3) {
              return (
                <Polygon
                  key={`gf-poly-${gf.id}`}
                  coordinates={gf.coordinates}
                  strokeColor={isSelected ? "#38BDF8" : style.stroke}
                  fillColor={style.fill}
                  strokeWidth={isSelected ? 3.5 : 2}
                  tappable
                  onPress={() => handleFocusGeofence(gf)}
                />
              );
            }

            return null;
          })}

          {/* ======================================================== */}
          {/* BLE PERSONEL VE İŞ MAKİNESİ İŞARETÇİLERİ                 */}
          {/* ======================================================== */}
          {filteredEntities.map((item) => {
            const isPersonnel = item.type === "personnel";
            const isLowBattery = item.battery <= 20;

            return (
              <Marker
                key={item.id}
                coordinate={{
                  latitude: item.latitude,
                  longitude: item.longitude,
                }}
                onPress={() => setSelectedEntity(item)}
              >
                <View style={styles.markerContainer}>
                  <View
                    style={[
                      styles.markerBubble,
                      isPersonnel ? styles.markerPersonnel : styles.markerEquipment,
                      selectedEntity?.id === item.id && styles.markerSelected,
                    ]}
                  >
                    <MaterialCommunityIcons
                      name={isPersonnel ? "account-hard-hat" : "crane"}
                      size={20}
                      color="#FFFFFF"
                    />

                    {isLowBattery && (
                      <View style={styles.markerWarningBadge}>
                        <Ionicons name="warning" size={10} color="#FFFFFF" />
                      </View>
                    )}
                  </View>
                  <View
                    style={[
                      styles.markerTriangle,
                      isPersonnel
                        ? styles.markerTrianglePersonnel
                        : styles.markerTriangleEquipment,
                    ]}
                  />
                </View>

                {/* Callout Bilgi Kartı */}
                <Callout tooltip>
                  <View style={styles.calloutCard}>
                    <View style={styles.calloutHeader}>
                      <View
                        style={[
                          styles.calloutTypeIcon,
                          {
                            backgroundColor: isPersonnel
                              ? "rgba(37, 99, 235, 0.2)"
                              : "rgba(234, 88, 12, 0.2)",
                          },
                        ]}
                      >
                        <MaterialCommunityIcons
                          name={isPersonnel ? "account-hard-hat" : "crane"}
                          size={18}
                          color={isPersonnel ? "#60A5FA" : "#FB923C"}
                        />
                      </View>
                      <View style={{ flex: 1, marginLeft: 8 }}>
                        <Text style={styles.calloutTitle} numberOfLines={1}>
                          {item.name}
                        </Text>
                        <Text style={styles.calloutRole}>
                          {item.role} {item.zone ? `• ${item.zone}` : ""}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.calloutDivider} />

                    <View style={styles.calloutRow}>
                      <Text style={styles.calloutLabel}>BLE Sinyali:</Text>
                      <View style={styles.calloutStatusPill}>
                        <View
                          style={[
                            styles.statusIndicatorDot,
                            {
                              backgroundColor:
                                item.status === "active"
                                  ? "#10B981"
                                  : item.status === "warning"
                                  ? "#EF4444"
                                  : "#F59E0B",
                            },
                          ]}
                        />
                        <Text style={styles.calloutValue}>
                          {getStatusLabel(item.status)}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.calloutRow}>
                      <Text style={styles.calloutLabel}>Cihaz Pili:</Text>
                      <View style={styles.batteryContainer}>
                        <Ionicons
                          name={
                            item.battery > 80
                              ? "battery-full"
                              : item.battery > 30
                              ? "battery-half"
                              : "battery-dead"
                          }
                          size={15}
                          color={getBatteryColor(item.battery)}
                        />
                        <Text
                          style={[
                            styles.batteryText,
                            { color: getBatteryColor(item.battery) },
                          ]}
                        >
                          %{item.battery}
                        </Text>
                      </View>
                    </View>

                    {item.lastSeen && (
                      <View style={styles.calloutRow}>
                        <Text style={styles.calloutLabel}>Son Güncelleme:</Text>
                        <Text style={styles.calloutTimestamp}>{item.lastSeen}</Text>
                      </View>
                    )}
                  </View>
                </Callout>
              </Marker>
            );
          })}
        </MapView>

        {/* Seçili Sanal Çit (Geofence) Bilgi Kartı */}
        {selectedGeofence && (
          <View style={styles.selectedGeofenceCard}>
            <View style={styles.selectedGeofenceHeader}>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 2 }}>
                  <Ionicons
                    name={
                      selectedGeofence.type === "DANGER_ZONE"
                        ? "warning"
                        : selectedGeofence.type === "POLYLINE"
                        ? "git-commit"
                        : "shield-checkmark"
                    }
                    size={15}
                    color={
                      selectedGeofence.type === "DANGER_ZONE"
                        ? "#EF4444"
                        : selectedGeofence.type === "POLYLINE"
                        ? "#F59E0B"
                        : "#38BDF8"
                    }
                  />
                  <Text
                    style={[
                      styles.selectedGeofenceType,
                      {
                        color:
                          selectedGeofence.type === "DANGER_ZONE"
                            ? "#EF4444"
                            : selectedGeofence.type === "POLYLINE"
                            ? "#F59E0B"
                            : "#38BDF8",
                      },
                    ]}
                  >
                    {selectedGeofence.type === "DANGER_ZONE"
                      ? "RİSKLİ ALAN (DANGER ZONE)"
                      : selectedGeofence.type === "POLYLINE"
                      ? "YATAY HAT / GÜZERGAH (POLYLINE)"
                      : "SANAL ÇİT (GEOFENCE)"}
                  </Text>
                </View>
                <Text style={styles.selectedGeofenceName}>{selectedGeofence.name}</Text>
              </View>

              <TouchableOpacity
                onPress={() => setSelectedGeofence(null)}
                style={styles.closeGeofenceBtn}
              >
                <Ionicons name="close" size={18} color="#94A3B8" />
              </TouchableOpacity>
            </View>

            <View style={styles.geofenceMetaRow}>
              <Text style={styles.geofenceMetaText}>
                📍 Nokta Sayısı: {selectedGeofence.coordinates.length}
              </Text>
              <Text style={styles.geofenceMetaText}>
                🛡️ Sanal Çit Koruma: Aktif
              </Text>
            </View>
          </View>
        )}

        {/* Harita Üstü Hızlı Odaklanma / Merkezleme Butonu */}
        <TouchableOpacity
          onPress={handleRecenter}
          activeOpacity={0.85}
          style={styles.recenterButton}
        >
          <MaterialCommunityIcons name="crosshairs-gps" size={22} color="#FFFFFF" />
        </TouchableOpacity>

        {/* Alt Özet / Liste Şeridi */}
        <View style={[styles.bottomSheet, !isDark && styles.bottomSheetLight]}>
          <View style={styles.summaryBar}>
            <Text style={[styles.summaryTitle, !isDark && styles.summaryTitleLight]}>
              {selectedFilter === "geofences" ? "Sanal Çitler (GIS Sınırları)" : "Şantiye BLE Durumu"}
            </Text>
            {warningCount > 0 && selectedFilter !== "geofences" && (
              <View style={styles.warningPill}>
                <Ionicons name="alert-circle" size={13} color="#EF4444" />
                <Text style={styles.warningPillText}>
                  {warningCount} Cihazda Kritik Pil!
                </Text>
              </View>
            )}
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.entitiesList}
          >
            {selectedFilter === "geofences" ? (
              geofences.map((gf) => {
                const isSelected = selectedGeofence?.id === gf.id;
                const style = getPolygonStyle(gf.type);
                return (
                  <TouchableOpacity
                    key={gf.id}
                    onPress={() => handleFocusGeofence(gf)}
                    activeOpacity={0.8}
                    style={[
                      styles.entityCard,
                      !isDark && styles.entityCardLight,
                      isSelected && styles.entityCardSelected,
                    ]}
                  >
                    <View style={styles.entityCardHeader}>
                      <View
                        style={[
                          styles.entityIconCircle,
                          { backgroundColor: `${style.stroke}25` },
                        ]}
                      >
                        <MaterialCommunityIcons
                          name={gf.type === "POLYLINE" ? "vector-polyline" : gf.type === "DANGER_ZONE" ? "alert-octagon" : "shape-polygon-plus"}
                          size={16}
                          color={style.stroke}
                        />
                      </View>
                      <Text style={[styles.cardBatteryText, { color: style.stroke }]}>
                        {style.label}
                      </Text>
                    </View>

                    <Text style={[styles.entityCardName, !isDark && styles.entityCardNameLight]} numberOfLines={1}>
                      {gf.name}
                    </Text>
                    <Text style={styles.entityCardRole} numberOfLines={1}>
                      {gf.coordinates.length} Koordinat Noktası
                    </Text>
                  </TouchableOpacity>
                );
              })
            ) : (
              filteredEntities.map((entity) => {
                const isPers = entity.type === "personnel";
                const isSelected = selectedEntity?.id === entity.id;

                return (
                  <TouchableOpacity
                    key={entity.id}
                    onPress={() => handleFocusEntity(entity)}
                    activeOpacity={0.8}
                    style={[
                      styles.entityCard,
                      !isDark && styles.entityCardLight,
                      isSelected && styles.entityCardSelected,
                    ]}
                  >
                    <View style={styles.entityCardHeader}>
                      <View
                        style={[
                          styles.entityIconCircle,
                          {
                            backgroundColor: isPers
                              ? "rgba(37, 99, 235, 0.25)"
                              : "rgba(234, 88, 12, 0.25)",
                          },
                        ]}
                      >
                        <MaterialCommunityIcons
                          name={isPers ? "account-hard-hat" : "crane"}
                          size={16}
                          color={isPers ? "#60A5FA" : "#FB923C"}
                        />
                      </View>
                      <View style={styles.cardBattery}>
                        <Ionicons
                          name="battery-charging"
                          size={13}
                          color={getBatteryColor(entity.battery)}
                        />
                        <Text
                          style={[
                            styles.cardBatteryText,
                            { color: getBatteryColor(entity.battery) },
                          ]}
                        >
                          %{entity.battery}
                        </Text>
                      </View>
                    </View>

                    <Text style={[styles.entityCardName, !isDark && styles.entityCardNameLight]} numberOfLines={1}>
                      {entity.name}
                    </Text>
                    <Text style={styles.entityCardRole} numberOfLines={1}>
                      {entity.role}
                    </Text>
                  </TouchableOpacity>
                );
              })
            )}
          </ScrollView>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#030712",
  },
  containerLight: {
    backgroundColor: "#F8FAFC",
  },
  header: {
    backgroundColor: "rgba(15, 23, 42, 0.95)",
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.08)",
  },
  headerLight: {
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    borderBottomColor: "rgba(0, 0, 0, 0.08)",
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  titleContainer: {
    flex: 1,
  },
  badgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 2,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#10B981",
  },
  badgeText: {
    color: "#60A5FA",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  titleText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  titleTextLight: {
    color: "#0F172A",
  },
  mapTypeToggle: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(37, 99, 235, 0.15)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(59, 130, 246, 0.3)",
  },
  mapTypeText: {
    color: "#60A5FA",
    fontSize: 12,
    fontWeight: "600",
  },
  filterRow: {
    flexDirection: "row",
    gap: 8,
  },
  filterPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: "rgba(255, 255, 255, 0.06)",
  },
  filterPillActive: {
    backgroundColor: "#2563EB",
  },
  filterText: {
    color: "#94A3B8",
    fontSize: 12,
    fontWeight: "600",
  },
  filterTextActive: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  mapWrapper: {
    flex: 1,
    position: "relative",
  },
  markerContainer: {
    alignItems: "center",
  },
  markerBubble: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 3,
    elevation: 4,
  },
  markerPersonnel: {
    backgroundColor: "#2563EB",
  },
  markerEquipment: {
    backgroundColor: "#EA580C",
  },
  markerSelected: {
    borderColor: "#FACC15",
    borderWidth: 3,
    transform: [{ scale: 1.15 }],
  },
  markerWarningBadge: {
    position: "absolute",
    top: -4,
    right: -4,
    backgroundColor: "#EF4444",
    width: 14,
    height: 14,
    borderRadius: 7,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "#FFFFFF",
  },
  markerTriangle: {
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
  markerTrianglePersonnel: {
    borderTopColor: "#2563EB",
  },
  markerTriangleEquipment: {
    borderTopColor: "#EA580C",
  },
  calloutCard: {
    width: 220,
    backgroundColor: "rgba(15, 23, 42, 0.95)",
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.15)",
  },
  calloutHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  calloutTypeIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  calloutTitle: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
  },
  calloutRole: {
    color: "#94A3B8",
    fontSize: 11,
    marginTop: 1,
  },
  calloutDivider: {
    height: 1,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    marginVertical: 8,
  },
  calloutRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  calloutLabel: {
    color: "#64748B",
    fontSize: 11,
  },
  calloutStatusPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  statusIndicatorDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  calloutValue: {
    color: "#E2E8F0",
    fontSize: 11,
    fontWeight: "600",
  },
  batteryContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  batteryText: {
    fontSize: 11,
    fontWeight: "700",
  },
  calloutTimestamp: {
    color: "#94A3B8",
    fontSize: 11,
  },
  selectedGeofenceCard: {
    position: "absolute",
    top: 14,
    left: 14,
    right: 14,
    backgroundColor: "rgba(15, 23, 42, 0.95)",
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.15)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 8,
  },
  selectedGeofenceHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  selectedGeofenceType: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  selectedGeofenceName: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },
  closeGeofenceBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  geofenceMetaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.1)",
  },
  geofenceMetaText: {
    color: "#94A3B8",
    fontSize: 11,
    fontWeight: "500",
  },
  recenterButton: {
    position: "absolute",
    bottom: 125,
    right: 16,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(15, 23, 42, 0.9)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  bottomSheet: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(15, 23, 42, 0.95)",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.1)",
  },
  bottomSheetLight: {
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    borderTopColor: "rgba(0, 0, 0, 0.1)",
  },
  summaryBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  summaryTitle: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
  },
  summaryTitleLight: {
    color: "#0F172A",
  },
  warningPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(239, 68, 68, 0.15)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  warningPillText: {
    color: "#EF4444",
    fontSize: 11,
    fontWeight: "600",
  },
  entitiesList: {
    paddingHorizontal: 16,
    gap: 10,
  },
  entityCard: {
    width: 140,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 14,
    padding: 10,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
  },
  entityCardLight: {
    backgroundColor: "#F1F5F9",
    borderColor: "#E2E8F0",
  },
  entityCardSelected: {
    borderColor: "#2563EB",
    borderWidth: 1.5,
  },
  entityCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  entityIconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  cardBattery: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  cardBatteryText: {
    fontSize: 10,
    fontWeight: "700",
  },
  entityCardName: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
  },
  entityCardNameLight: {
    color: "#0F172A",
  },
  entityCardRole: {
    color: "#94A3B8",
    fontSize: 10,
    marginTop: 2,
  },
});
