/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Nexa ERP - Super Admin Şantiye BLE Canlı Takip Haritası (SiteMapScreen)
 *
 * BLE donanımlı personelleri (mavi baret) ve ağır iş makinelerini (turuncu vinç/ekskavatör)
 * harita üzerinde canlı radar olarak görselleştirir.
 */

import React, { useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Dimensions,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import MapView, { Marker, Callout, Region } from "react-native-maps";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import {
  mockBleEntities,
  BleEntity,
  SITE_CENTER_REGION,
} from "../../data/mockBleData";

const { width } = Dimensions.get("window");

export interface SiteMapScreenProps {
  onBackPress?: () => void;
}

export default function SiteMapScreen({ onBackPress }: SiteMapScreenProps) {
  const mapRef = useRef<MapView | null>(null);

  // ADIM 3: Veriyi state içine al
  const [entities, setEntities] = useState<BleEntity[]>(mockBleEntities);
  const [selectedFilter, setSelectedFilter] = useState<"all" | "personnel" | "equipment">("all");
  const [selectedEntity, setSelectedEntity] = useState<BleEntity | null>(null);
  const [mapType, setMapType] = useState<"standard" | "satellite">("standard");

  // Filtreleme mantığı
  const filteredEntities = entities.filter((item) => {
    if (selectedFilter === "all") return true;
    return item.type === selectedFilter;
  });

  // Şantiye merkezine odaklan
  const handleRecenter = () => {
    mapRef.current?.animateToRegion(SITE_CENTER_REGION, 800);
    setSelectedEntity(null);
  };

  // Belirli bir öğeye haritada odaklan
  const handleFocusEntity = (item: BleEntity) => {
    setSelectedEntity(item);
    const targetRegion: Region = {
      latitude: item.latitude,
      longitude: item.longitude,
      latitudeDelta: 0.003,
      longitudeDelta: 0.003,
    };
    mapRef.current?.animateToRegion(targetRegion, 600);
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

  const personnelCount = entities.filter((e) => e.type === "personnel").length;
  const equipmentCount = entities.filter((e) => e.type === "equipment").length;
  const warningCount = entities.filter((e) => e.battery <= 20).length;

  return (
    <SafeAreaView edges={["top"]} style={styles.container}>
      {/* Üst Başlık & Kontrol Çubuğu */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          {onBackPress && (
            <TouchableOpacity
              onPress={onBackPress}
              activeOpacity={0.7}
              style={styles.backButton}
            >
              <Ionicons name="arrow-back" size={22} color="#FFFFFF" />
            </TouchableOpacity>
          )}

          <View style={styles.titleContainer}>
            <View style={styles.badgeRow}>
              <View style={styles.liveDot} />
              <Text style={styles.badgeText}>SUPER ADMIN • CANLI BLE RADARI</Text>
            </View>
            <Text style={styles.titleText}>Şantiye Konum & Telemetri</Text>
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
              Tümü ({entities.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setSelectedFilter("personnel")}
            activeOpacity={0.8}
            style={[
              styles.filterPill,
              selectedFilter === "personnel" && styles.filterPillActivePersonnel,
            ]}
          >
            <Ionicons
              name="person"
              size={14}
              color={selectedFilter === "personnel" ? "#FFFFFF" : "#60A5FA"}
            />
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
              selectedFilter === "equipment" && styles.filterPillActiveEquipment,
            ]}
          >
            <MaterialCommunityIcons
              name="crane"
              size={14}
              color={selectedFilter === "equipment" ? "#FFFFFF" : "#FB923C"}
            />
            <Text
              style={[
                styles.filterText,
                selectedFilter === "equipment" && styles.filterTextActive,
              ]}
            >
              Ekipman ({equipmentCount})
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
          showsCompass={true}
          showsScale={true}
        >
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
                {/* ADIM 3: Personel için Mavi, Ekipman için Turuncu Özel İşaretçi */}
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

                    {/* Düşük Pil / Dikkat Uyarı Rozeti */}
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

                {/* ADIM 3: Tıklandığında Açılan Detaylı Callout Bilgi Kartı */}
                <Callout tooltip>
                  <View style={styles.calloutCard}>
                    {/* Başlık ve Tür İkonu */}
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

                    {/* Durum & Pil Bilgileri */}
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

        {/* Harita Üstü Hızlı Odaklanma / Merkezleme Butonu */}
        <TouchableOpacity
          onPress={handleRecenter}
          activeOpacity={0.85}
          style={styles.recenterButton}
        >
          <MaterialCommunityIcons name="crosshairs-gps" size={22} color="#FFFFFF" />
        </TouchableOpacity>

        {/* Alt Özet / Liste Şeridi */}
        <View style={styles.bottomSheet}>
          <View style={styles.summaryBar}>
            <Text style={styles.summaryTitle}>Şantiye BLE Durumu</Text>
            {warningCount > 0 && (
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
            {filteredEntities.map((entity) => {
              const isPers = entity.type === "personnel";
              const isSelected = selectedEntity?.id === entity.id;

              return (
                <TouchableOpacity
                  key={entity.id}
                  onPress={() => handleFocusEntity(entity)}
                  activeOpacity={0.8}
                  style={[
                    styles.entityCard,
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

                  <Text style={styles.entityCardName} numberOfLines={1}>
                    {entity.name}
                  </Text>
                  <Text style={styles.entityCardRole} numberOfLines={1}>
                    {entity.role}
                  </Text>
                </TouchableOpacity>
              );
            })}
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
  header: {
    backgroundColor: "rgba(15, 23, 42, 0.95)",
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.08)",
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
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
    marginBottom: 2,
  },
  liveDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: "#10B981",
    marginRight: 6,
  },
  badgeText: {
    color: "#94A3B8",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.8,
  },
  titleText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "800",
    letterSpacing: -0.2,
  },
  mapTypeToggle: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(37, 99, 235, 0.15)",
    borderWidth: 1,
    borderColor: "rgba(59, 130, 246, 0.3)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 4,
  },
  mapTypeText: {
    color: "#93C5FD",
    fontSize: 11,
    fontWeight: "600",
  },
  filterRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 12,
  },
  filterPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    gap: 4,
  },
  filterPillActive: {
    backgroundColor: "rgba(255, 255, 255, 0.22)",
    borderColor: "rgba(255, 255, 255, 0.35)",
  },
  filterPillActivePersonnel: {
    backgroundColor: "#2563EB",
    borderColor: "#3B82F6",
  },
  filterPillActiveEquipment: {
    backgroundColor: "#EA580C",
    borderColor: "#F97316",
  },
  filterText: {
    color: "#94A3B8",
    fontSize: 12,
    fontWeight: "600",
  },
  filterTextActive: {
    color: "#FFFFFF",
  },
  mapWrapper: {
    flex: 1,
    position: "relative",
  },
  markerContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  markerBubble: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 4,
    elevation: 6,
    position: "relative",
  },
  markerPersonnel: {
    backgroundColor: "#2563EB",
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  markerEquipment: {
    backgroundColor: "#EA580C",
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  markerSelected: {
    transform: [{ scale: 1.15 }],
    borderColor: "#FDE047",
    borderWidth: 3,
  },
  markerWarningBadge: {
    position: "absolute",
    top: -3,
    right: -3,
    backgroundColor: "#EF4444",
    width: 14,
    height: 14,
    borderRadius: 7,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#FFFFFF",
  },
  markerTriangle: {
    width: 0,
    height: 0,
    borderLeftWidth: 5,
    borderRightWidth: 5,
    borderTopWidth: 6,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    marginTop: -1,
  },
  markerTrianglePersonnel: {
    borderTopColor: "#2563EB",
  },
  markerTriangleEquipment: {
    borderTopColor: "#EA580C",
  },
  calloutCard: {
    backgroundColor: "#0F172A",
    borderRadius: 14,
    padding: 12,
    width: 230,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.15)",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.45,
    shadowRadius: 8,
    elevation: 10,
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
    fontSize: 10,
    marginTop: 1,
  },
  calloutDivider: {
    height: 1,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    marginVertical: 8,
  },
  calloutRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  calloutLabel: {
    color: "#64748B",
    fontSize: 10,
    fontWeight: "500",
  },
  calloutValue: {
    color: "#E2E8F0",
    fontSize: 10,
    fontWeight: "600",
  },
  calloutStatusPill: {
    flexDirection: "row",
    alignItems: "center",
  },
  statusIndicatorDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 4,
  },
  batteryContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  batteryText: {
    fontSize: 11,
    fontWeight: "700",
  },
  calloutTimestamp: {
    color: "#94A3B8",
    fontSize: 10,
  },
  recenterButton: {
    position: "absolute",
    right: 16,
    top: 16,
    backgroundColor: "#1E293B",
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.15)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 8,
  },
  bottomSheet: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(15, 23, 42, 0.95)",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 12,
    paddingBottom: Platform.OS === "ios" ? 24 : 14,
    borderTopWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  summaryBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  summaryTitle: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
  warningPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(239, 68, 68, 0.15)",
    borderWidth: 1,
    borderColor: "rgba(239, 68, 68, 0.3)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    gap: 4,
  },
  warningPillText: {
    color: "#FCA5A5",
    fontSize: 10,
    fontWeight: "700",
  },
  entitiesList: {
    paddingHorizontal: 16,
    gap: 10,
  },
  entityCard: {
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    borderRadius: 14,
    padding: 10,
    width: 140,
  },
  entityCardSelected: {
    backgroundColor: "rgba(37, 99, 235, 0.2)",
    borderColor: "#3B82F6",
  },
  entityCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  entityIconCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },
  cardBattery: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
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
  entityCardRole: {
    color: "#94A3B8",
    fontSize: 10,
    marginTop: 1,
  },
});
