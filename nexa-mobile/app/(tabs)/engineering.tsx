/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Nexa ERP - Mobil BIM Görüntüleyici, AR (Artırılmış Gerçeklik) & Saha Radarı
 *
 * ADIM 1: Mühendis ve Şantiye Şefi (ENGINEER, FOREMAN) rolleri için
 * cihaz kamerası (expo-camera) altta tam ekran, üstünde ise saydam WebView içinde
 * merkezdeki Next.js 3D BIM modeli çalışarak gerçek şantiyenin üzerine saydam
 * 3D BIM modelini oturtan AR (Artırılmış Gerçeklik) deneyimi.
 *
 * ADIM 2: "🗺️ Canlı Haritayı Aç" butonu -> react-native-maps ile tam ekran MapView
 * Sahadaki canlı personeller, araçlar (transmikser, pompa) ve kırmızı Risk Bölgeleri (Geofences).
 */

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  ActivityIndicator,
  Platform,
  Dimensions,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather, MaterialCommunityIcons, Ionicons, FontAwesome5 } from "@expo/vector-icons";
import { CameraView, useCameraPermissions, CameraType } from "expo-camera";
import { WebView, WebViewMessageEvent } from "react-native-webview";
import MapView, { Marker, Circle, Callout, PROVIDER_DEFAULT } from "react-native-maps";
import { useAuth } from "../../src/hooks/useAuth";
import { api, API_BASE_URL } from "../../src/lib/api";
import { locationSocket } from "../../src/services/LocationSocket";

// React 19 uyumlu WebView bileşeni
const WebViewComponent = WebView as unknown as React.ComponentType<any>;

// Web taban URL'si (Örn: http://10.0.2.2:3000 veya https://nxerp.com.tr)
const WEB_BASE_URL = API_BASE_URL.replace(/\/api\/?$/, "");
const BIM_VIEWER_URL = `${WEB_BASE_URL}/bim-ar-viewer.html`;

// Tip Tanımları
export interface LivePersonnel {
  id: string;
  name: string;
  role: string;
  latitude: number;
  longitude: number;
  lastSeen: string;
  isOnline: boolean;
  type: "PERSON" | "VEHICLE";
}

export interface RiskZone {
  id: string;
  name: string;
  zoneName?: string;
  centerLat: number;
  centerLng: number;
  radius: number;
  dangerLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  requiredPpe?: string[];
}

export default function EngineeringScreen() {
  const insets = useSafeAreaInsets();
  const { role, setRole } = useAuth();

  // Yetki Kontrolü: ENGINEER, FOREMAN veya ADMIN
  const isAuthorized =
    role === "ENGINEER" ||
    role === "FOREMAN" ||
    role === "ADMIN";

  // 1. Kamera İzinleri & Durumu
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<CameraType>("back");
  const [isTorchOn, setIsTorchOn] = useState<boolean>(false);
  const [isCameraActive, setIsCameraActive] = useState<boolean>(true);

  // 2. BIM & AR WebView Durumu
  const webViewRef = useRef<any>(null);
  const [isWebViewLoading, setIsWebViewLoading] = useState<boolean>(true);
  const [selectedBimElement, setSelectedBimElement] = useState<any | null>(null);

  // 3. Canlı Saha Radarı (Harita) Durumu
  const [isRadarModalOpen, setIsRadarModalOpen] = useState<boolean>(false);
  const [mapType, setMapType] = useState<"standard" | "satellite" | "hybrid">("standard");
  const [radarFilter, setRadarFilter] = useState<"ALL" | "PERSONNEL" | "VEHICLES" | "RISK">("ALL");
  const [isLoadingRadar, setIsLoadingRadar] = useState<boolean>(false);
  const [personnelList, setPersonnelList] = useState<LivePersonnel[]>([]);
  const [riskZonesList, setRiskZonesList] = useState<RiskZone[]>([]);
  const [mapCenter, setMapCenter] = useState<{ latitude: number; longitude: number }>({
    latitude: 41.0851,
    longitude: 28.8021,
  });
  const mapRef = useRef<MapView>(null);

  // Radar verilerini çek (API + Socket)
  const fetchRadarData = useCallback(async () => {
    try {
      setIsLoadingRadar(true);
      const res = await api.get("/location/radar");
      if (res.data?.success) {
        setPersonnelList(res.data.personnel || []);
        setRiskZonesList(res.data.riskZones || []);
        if (res.data.center?.latitude && res.data.center?.longitude) {
          setMapCenter({
            latitude: res.data.center.latitude,
            longitude: res.data.center.longitude,
          });
        }
      }
    } catch (err: any) {
      console.warn("[Radar Fetch Warning]:", err?.message || err);
      // Fallback demo veriler
      setPersonnelList([
        {
          id: "p_1",
          name: "Ahmet Yılmaz (Saha Şefi)",
          role: "FOREMAN",
          latitude: 41.0854,
          longitude: 28.8019,
          lastSeen: "Şimdi (Canlı)",
          isOnline: true,
          type: "PERSON",
        },
        {
          id: "p_2",
          name: "Mehmet Kaya (İSG Uzmanı)",
          role: "ENGINEER",
          latitude: 41.0847,
          longitude: 28.8024,
          lastSeen: "2 dk önce",
          isOnline: true,
          type: "PERSON",
        },
        {
          id: "v_1",
          name: "Transmikser 34 NXA 101",
          role: "DRIVER",
          latitude: 41.0844,
          longitude: 28.8016,
          lastSeen: "Hareket Halinde",
          isOnline: true,
          type: "VEHICLE",
        },
        {
          id: "v_2",
          name: "Kule Vinç Operatörü",
          role: "OPERATOR",
          latitude: 41.0853,
          longitude: 28.8025,
          lastSeen: "Şimdi",
          isOnline: true,
          type: "PERSON",
        },
      ]);
      setRiskZonesList([
        {
          id: "rz_1",
          name: "Kule Vinç 1 Ağır Yük Kaldırma Alanı",
          centerLat: 41.0853,
          centerLng: 28.8025,
          radius: 45.0,
          dangerLevel: "CRITICAL",
          requiredPpe: ["BARET", "REFLEKTORLU_YELEK"],
        },
        {
          id: "rz_2",
          name: "A Blok Dış İskele Hattı",
          centerLat: 41.0858,
          centerLng: 28.8017,
          radius: 35.0,
          dangerLevel: "HIGH",
          requiredPpe: ["PARASUT_TIPI_KEMER", "BARET"],
        },
        {
          id: "rz_3",
          name: "Bodrum Kat Derin Kazı ve Şev Bölgesi",
          centerLat: 41.0845,
          centerLng: 28.8028,
          radius: 40.0,
          dangerLevel: "HIGH",
          requiredPpe: ["BARET", "CELIK_BURUNLU_BOT"],
        },
      ]);
    } finally {
      setIsLoadingRadar(false);
    }
  }, []);

  // Socket.io Canlı Konum Dinleyicisi
  useEffect(() => {
    if (!isRadarModalOpen) return;

    fetchRadarData();

    // Socket bağlantısı ve canlı konum güncelleme olayları
    const socket = locationSocket.connect();
    const handleLocationBroadcast = (payload: any) => {
      if (payload?.userId && payload?.lat && payload?.lng) {
        setPersonnelList((prev) =>
          prev.map((item) =>
            item.id === payload.userId
              ? {
                  ...item,
                  latitude: payload.lat,
                  longitude: payload.lng,
                  lastSeen: "Şimdi (Socket Canlı)",
                  isOnline: true,
                }
              : item
          )
        );
      }
    };

    socket.on("locationBroadcast", handleLocationBroadcast);
    socket.on("personnelLocationsUpdated", fetchRadarData);

    // Her 5 saniyede bir otomatik tazeleyen interval
    const interval = setInterval(fetchRadarData, 5000);

    return () => {
      socket.off("locationBroadcast", handleLocationBroadcast);
      socket.off("personnelLocationsUpdated", fetchRadarData);
      clearInterval(interval);
    };
  }, [isRadarModalOpen, fetchRadarData]);

  // WebView'den gelen mesajları dinle
  const handleWebViewMessage = (event: WebViewMessageEvent) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === "BIM_ELEMENT_SELECTED") {
        setSelectedBimElement(data.payload);
      } else if (data.type === "BIM_VIEWER_READY") {
        setIsWebViewLoading(false);
      }
    } catch (e) {
      // JSON olmayan mesajları yoksay
    }
  };

  // Kamera açma/kapatma
  const toggleCameraFacing = () => {
    setFacing((current) => (current === "back" ? "front" : "back"));
  };

  // Yetkisiz kullanıcı uyarısı (Role Switcher)
  if (!isAuthorized) {
    return (
      <SafeAreaView style={styles.authContainer}>
        <View style={styles.authCard}>
          <View style={styles.authIconCircle}>
            <Feather name="shield" size={32} color="#3B82F6" />
          </View>
          <Text style={styles.authTitle}>Mühendislik & Şantiye Şefi Yetkisi</Text>
          <Text style={styles.authSubtitle}>
            Mobil 3D BIM Görüntüleyici, AR Katmanı ve Canlı Saha Radarı yalnızca{" "}
            <Text style={{ color: "#60A5FA", fontWeight: "bold" }}>Mühendis (ENGINEER)</Text> ve{" "}
            <Text style={{ color: "#60A5FA", fontWeight: "bold" }}>Şantiye Şefi (FOREMAN)</Text>{" "}
            rolleri içindir.
          </Text>
          <Text style={styles.authCurrentRole}>
            Mevcut Rolünüz: <Text style={{ color: "#F59E0B" }}>{role}</Text>
          </Text>

          <TouchableOpacity
            style={[styles.authButton, { backgroundColor: "#2563EB", marginBottom: 12 }]}
            onPress={() => setRole("ENGINEER")}
            activeOpacity={0.8}
          >
            <Feather name="box" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
            <Text style={styles.authButtonText}>Mühendis (ENGINEER) Rolüne Geç</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.authButton, { backgroundColor: "#0D9488" }]}
            onPress={() => setRole("FOREMAN")}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons name="hard-hat" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
            <Text style={styles.authButtonText}>Şantiye Şefi (FOREMAN) Rolüne Geç</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Kamera İzin Ekranı
  if (!permission) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.loadingText}>Kamera izinleri sorgulanıyor...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.authContainer}>
        <View style={styles.authCard}>
          <View style={styles.authIconCircle}>
            <Feather name="camera-off" size={32} color="#EF4444" />
          </View>
          <Text style={styles.authTitle}>Kamera İzni Gerekli</Text>
          <Text style={styles.authSubtitle}>
            AR (Artırılmış Gerçeklik) modunda 3D BIM modelini gerçek şantiye görüntüsü üzerine
            oturtmak için kamera erişimine izin verilmelidir.
          </Text>
          <TouchableOpacity
            style={[styles.authButton, { backgroundColor: "#2563EB" }]}
            onPress={requestPermission}
            activeOpacity={0.8}
          >
            <Feather name="camera" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
            <Text style={styles.authButtonText}>Kamera İznini Onayla</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Filtrelenmiş personel ve araç listesi
  const filteredPersonnel = personnelList.filter((p) => {
    if (radarFilter === "PERSONNEL") return p.type === "PERSON";
    if (radarFilter === "VEHICLES") return p.type === "VEHICLE";
    return true;
  });

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* ============================================================ */}
      {/* ADIM 1: KATMAN 1 (EN ALT) - EXPO CAMERA (TAM EKRAN ABSOLUTE)   */}
      {/* ============================================================ */}
      {isCameraActive ? (
        <CameraView
          style={StyleSheet.absoluteFill}
          facing={facing}
          enableTorch={isTorchOn}
        />
      ) : (
        <View style={[StyleSheet.absoluteFill, styles.cameraPlaceholder]}>
          <Feather name="eye-off" size={48} color="#475569" />
          <Text style={styles.cameraPlaceholderText}>Kamera Arka Planı Duraklatıldı</Text>
        </View>
      )}

      {/* ============================================================ */}
      {/* ADIM 1: KATMAN 2 (ORTA) - SAYDAM WEBVIEW BIM GÖRÜNTÜLEYİCİ    */}
      {/* ============================================================ */}
      <View style={[StyleSheet.absoluteFill, styles.webViewContainer]}>
        <WebViewComponent
          ref={webViewRef}
          source={{ uri: BIM_VIEWER_URL }}
          style={styles.transparentWebView}
          containerStyle={styles.transparentWebView}
          opaque={false}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          allowsInlineMediaPlayback={true}
          scrollEnabled={false}
          bounces={false}
          onMessage={handleWebViewMessage}
          onLoadEnd={() => setIsWebViewLoading(false)}
          onError={(syntheticEvent: any) => {
            const { nativeEvent } = syntheticEvent || {};
            console.warn("[WebView Load Warning]:", nativeEvent?.description);
            setIsWebViewLoading(false);
          }}
        />

        {isWebViewLoading && (
          <View style={styles.webViewLoader}>
            <ActivityIndicator size="large" color="#38BDF8" />
            <Text style={styles.webViewLoaderText}>3D BIM Modeli AR Sahasına Yükleniyor...</Text>
          </View>
        )}
      </View>

      {/* ============================================================ */}
      {/* KATMAN 3 (EN ÜST) - AR KONTROLLERİ & "🗺️ CANLI HARİTAYI AÇ"     */}
      {/* ============================================================ */}
      <SafeAreaView edges={["top"]} style={styles.topHudContainer}>
        {/* Üst Bar: Sol (Proje Rozeti), Sağ (Canlı Harita Butonu) */}
        <View style={styles.topBarRow}>
          {/* Proje Rozeti */}
          <View style={styles.arBadge}>
            <View style={styles.livePulseDot} />
            <Text style={styles.arBadgeText}>BIM AR • Vadi Evleri</Text>
          </View>

          {/* ADIM 2: "🗺️ Canlı Haritayı Aç" Butonu */}
          <TouchableOpacity
            style={styles.openMapButton}
            activeOpacity={0.85}
            onPress={() => setIsRadarModalOpen(true)}
          >
            <Text style={styles.openMapButtonIcon}>🗺️</Text>
            <Text style={styles.openMapButtonText}>Canlı Haritayı Aç</Text>
          </TouchableOpacity>
        </View>

        {/* Sağ Taraf Hızlı Kamera Kontrolleri */}
        <View style={styles.floatingToolColumn}>
          {/* Kamera Çevir */}
          <TouchableOpacity
            style={styles.circleIconButton}
            activeOpacity={0.75}
            onPress={toggleCameraFacing}
          >
            <Feather name="refresh-ccw" size={18} color="#FFFFFF" />
          </TouchableOpacity>

          {/* Flaş / Meşale */}
          <TouchableOpacity
            style={[
              styles.circleIconButton,
              isTorchOn && { backgroundColor: "rgba(234, 179, 8, 0.85)" },
            ]}
            activeOpacity={0.75}
            onPress={() => setIsTorchOn(!isTorchOn)}
          >
            <Feather
              name="zap"
              size={18}
              color={isTorchOn ? "#0F172A" : "#FFFFFF"}
            />
          </TouchableOpacity>

          {/* Kamera Aç/Kapat Toggle */}
          <TouchableOpacity
            style={[
              styles.circleIconButton,
              !isCameraActive && { backgroundColor: "rgba(239, 68, 68, 0.85)" },
            ]}
            activeOpacity={0.75}
            onPress={() => setIsCameraActive(!isCameraActive)}
          >
            <Feather
              name={isCameraActive ? "camera" : "camera-off"}
              size={18}
              color="#FFFFFF"
            />
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      {/* Seçilen Yapı Elemanı Toast Kartı */}
      {selectedBimElement && (
        <SafeAreaView edges={["bottom"]} style={styles.bottomHudContainer}>
          <View style={styles.elementSelectionCard}>
            <View style={styles.elementHeaderRow}>
              <View style={styles.elementTitleGroup}>
                <MaterialCommunityIcons name="cube-scan" size={20} color="#38BDF8" />
                <Text style={styles.elementNameText}>{selectedBimElement.name}</Text>
              </View>
              <TouchableOpacity
                onPress={() => setSelectedBimElement(null)}
                style={styles.closeElementBtn}
              >
                <Feather name="x" size={16} color="#94A3B8" />
              </TouchableOpacity>
            </View>

            <View style={styles.elementPropsGrid}>
              <View style={styles.propItem}>
                <Text style={styles.propLabel}>Kategori</Text>
                <Text style={styles.propValue}>{selectedBimElement.category || "STATİK"}</Text>
              </View>
              <View style={styles.propItem}>
                <Text style={styles.propLabel}>Kot</Text>
                <Text style={styles.propValue}>{selectedBimElement.level || "+0.00m"}</Text>
              </View>
              <View style={styles.propItem}>
                <Text style={styles.propLabel}>Boyut/Kesit</Text>
                <Text style={styles.propValue}>{selectedBimElement.dim || "Standart"}</Text>
              </View>
              <View style={styles.propItem}>
                <Text style={styles.propLabel}>Malzeme</Text>
                <Text style={styles.propValue}>{selectedBimElement.material || "C30/37"}</Text>
              </View>
            </View>
          </View>
        </SafeAreaView>
      )}

      {/* ============================================================ */}
      {/* ADIM 2: ŞEF İÇİN CANLI SAHA RADARI (TAM EKRAN MAPVIEW MODAL)  */}
      {/* ============================================================ */}
      <Modal
        visible={isRadarModalOpen}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={() => setIsRadarModalOpen(false)}
      >
        <View style={styles.mapModalContainer}>
          <StatusBar style="light" />

          {/* Tam Ekran MapView */}
          <MapView
            ref={mapRef}
            provider={PROVIDER_DEFAULT}
            style={StyleSheet.absoluteFill}
            mapType={mapType}
            initialRegion={{
              latitude: mapCenter.latitude,
              longitude: mapCenter.longitude,
              latitudeDelta: 0.0045,
              longitudeDelta: 0.0045,
            }}
            showsUserLocation={true}
            showsMyLocationButton={false}
            showsCompass={true}
          >
            {/* ADIM 2: Kırmızı Risk Bölgeleri (Geofences) */}
            {(radarFilter === "ALL" || radarFilter === "RISK") &&
              riskZonesList.map((zone) => (
                <React.Fragment key={zone.id}>
                  {/* Kırmızı Risk Çemberi */}
                  <Circle
                    center={{ latitude: zone.centerLat, longitude: zone.centerLng }}
                    radius={zone.radius}
                    strokeColor="rgba(239, 68, 68, 0.95)"
                    fillColor="rgba(239, 68, 68, 0.28)"
                    strokeWidth={2}
                  />

                  {/* Çember Merkezindeki Uyarı Marker'ı */}
                  <Marker
                    coordinate={{ latitude: zone.centerLat, longitude: zone.centerLng }}
                    anchor={{ x: 0.5, y: 0.5 }}
                  >
                    <View style={styles.riskMarkerBadge}>
                      <Ionicons name="warning" size={14} color="#FFFFFF" />
                      <Text style={styles.riskMarkerText}>RİSK</Text>
                    </View>
                    <Callout style={styles.calloutContainer}>
                      <View style={styles.calloutCard}>
                        <View style={styles.calloutHeader}>
                          <Ionicons name="alert-circle" size={16} color="#EF4444" />
                          <Text style={styles.calloutTitle}>{zone.name}</Text>
                        </View>
                        <Text style={styles.calloutSubtitle}>
                          Tehlike: <Text style={{ color: "#EF4444", fontWeight: "bold" }}>{zone.dangerLevel}</Text>
                        </Text>
                        <Text style={styles.calloutSubtitle}>
                          Yarıçap: {zone.radius} metre
                        </Text>
                        {zone.requiredPpe && zone.requiredPpe.length > 0 && (
                          <Text style={styles.calloutPpe}>
                            Zorunlu KKD: {zone.requiredPpe.join(", ")}
                          </Text>
                        )}
                      </View>
                    </Callout>
                  </Marker>
                </React.Fragment>
              ))}

            {/* ADIM 2: Sahadaki Personeller ve Araçlar (Canlı Marker'lar) */}
            {(radarFilter === "ALL" || radarFilter === "PERSONNEL" || radarFilter === "VEHICLES") &&
              filteredPersonnel.map((item) => (
                <Marker
                  key={item.id}
                  coordinate={{ latitude: item.latitude, longitude: item.longitude }}
                  anchor={{ x: 0.5, y: 0.8 }}
                  title={item.name}
                  description={`${item.role} • ${item.lastSeen}`}
                >
                  {/* Özel Marker İkonu: Araç ise Kamyon/Mikser, Kişi ise Baret/Personel */}
                  <View
                    style={[
                      styles.personnelMarkerBubble,
                      item.type === "VEHICLE"
                        ? styles.vehicleMarkerBubble
                        : item.role === "FOREMAN"
                        ? styles.foremanMarkerBubble
                        : styles.workerMarkerBubble,
                    ]}
                  >
                    {item.type === "VEHICLE" ? (
                      <FontAwesome5 name="truck" size={12} color="#FFFFFF" />
                    ) : item.role === "FOREMAN" ? (
                      <MaterialCommunityIcons name="hard-hat" size={14} color="#FFFFFF" />
                    ) : (
                      <Ionicons name="person" size={12} color="#FFFFFF" />
                    )}
                    <View
                      style={[
                        styles.markerStatusDot,
                        { backgroundColor: item.isOnline ? "#10B981" : "#94A3B8" },
                      ]}
                    />
                  </View>

                  <Callout style={styles.calloutContainer}>
                    <View style={styles.calloutCard}>
                      <View style={styles.calloutHeader}>
                        <Text style={styles.calloutTitle}>{item.name}</Text>
                      </View>
                      <Text style={styles.calloutSubtitle}>
                        Rol: <Text style={{ fontWeight: "bold", color: "#3B82F6" }}>{item.role}</Text>
                      </Text>
                      <Text style={styles.calloutSubtitle}>
                        Son Sinyal: {item.lastSeen}
                      </Text>
                      <Text style={styles.calloutSubtitle}>
                        Durum: {item.isOnline ? "🟢 Sinyal Aktif" : "⚪ Çevrimdışı"}
                      </Text>
                    </View>
                  </Callout>
                </Marker>
              ))}
          </MapView>

          {/* Modal Üst Header & Filtreler */}
          <SafeAreaView edges={["top"]} style={styles.mapModalHeader}>
            {/* Üst Satır: Başlık, Yenile ve Kapat Butonu */}
            <View style={styles.mapHeaderRow}>
              <View style={styles.mapHeaderTitleGroup}>
                <Text style={styles.mapHeaderTitle}>Canlı Saha Radarı</Text>
                <Text style={styles.mapHeaderSub}>
                  {personnelList.length} Personel/Araç • {riskZonesList.length} Risk Alanı
                </Text>
              </View>

              <View style={styles.mapHeaderActions}>
                {/* Şantiye Merkezine Git */}
                <TouchableOpacity
                  style={styles.mapSmallBtn}
                  onPress={() => {
                    mapRef.current?.animateToRegion({
                      latitude: mapCenter.latitude,
                      longitude: mapCenter.longitude,
                      latitudeDelta: 0.004,
                      longitudeDelta: 0.004,
                    });
                  }}
                >
                  <MaterialCommunityIcons name="crosshairs-gps" size={18} color="#FFFFFF" />
                </TouchableOpacity>

                {/* Uydu / Normal Katman Değiştir */}
                <TouchableOpacity
                  style={styles.mapSmallBtn}
                  onPress={() =>
                    setMapType((prev) => (prev === "standard" ? "satellite" : "standard"))
                  }
                >
                  <Feather
                    name={mapType === "satellite" ? "map" : "globe"}
                    size={16}
                    color="#FFFFFF"
                  />
                </TouchableOpacity>

                {/* Kapat Butonu */}
                <TouchableOpacity
                  style={[styles.mapSmallBtn, { backgroundColor: "#EF4444" }]}
                  onPress={() => setIsRadarModalOpen(false)}
                >
                  <Feather name="x" size={18} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Filtre Çipleri */}
            <View style={styles.filterChipRow}>
              <TouchableOpacity
                style={[
                  styles.filterChip,
                  radarFilter === "ALL" && styles.filterChipActive,
                ]}
                onPress={() => setRadarFilter("ALL")}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    radarFilter === "ALL" && styles.filterChipTextActive,
                  ]}
                >
                  Tümü ({personnelList.length + riskZonesList.length})
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.filterChip,
                  radarFilter === "PERSONNEL" && styles.filterChipActive,
                ]}
                onPress={() => setRadarFilter("PERSONNEL")}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    radarFilter === "PERSONNEL" && styles.filterChipTextActive,
                  ]}
                >
                  👷 Personel ({personnelList.filter((p) => p.type === "PERSON").length})
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.filterChip,
                  radarFilter === "VEHICLES" && styles.filterChipActive,
                ]}
                onPress={() => setRadarFilter("VEHICLES")}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    radarFilter === "VEHICLES" && styles.filterChipTextActive,
                  ]}
                >
                  🚚 Araçlar ({personnelList.filter((p) => p.type === "VEHICLE").length})
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.filterChip,
                  radarFilter === "RISK" && styles.filterChipActive,
                ]}
                onPress={() => setRadarFilter("RISK")}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    radarFilter === "RISK" && styles.filterChipTextActive,
                  ]}
                >
                  🛑 Risk ({riskZonesList.length})
                </Text>
              </TouchableOpacity>
            </View>
          </SafeAreaView>

          {/* Alt Canlı Lejant / İpuçları Çubuğu */}
          <SafeAreaView edges={["bottom"]} style={styles.mapBottomLegendContainer}>
            <View style={styles.legendCard}>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: "#3B82F6" }]} />
                <Text style={styles.legendText}>Saha Personeli</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: "#F59E0B" }]} />
                <Text style={styles.legendText}>Araç / Transmikser</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: "#EF4444" }]} />
                <Text style={styles.legendText}>Kırmızı Risk Bölgesi</Text>
              </View>
            </View>
          </SafeAreaView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000000",
  },
  cameraPlaceholder: {
    backgroundColor: "#090D16",
    justifyContent: "center",
    alignItems: "center",
  },
  cameraPlaceholderText: {
    color: "#64748B",
    fontSize: 13,
    fontWeight: "600",
    marginTop: 12,
  },
  webViewContainer: {
    zIndex: 10,
    backgroundColor: "transparent",
  },
  transparentWebView: {
    flex: 1,
    backgroundColor: "transparent",
  },
  webViewLoader: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(15, 23, 42, 0.7)",
    justifyContent: "center",
    alignItems: "center",
  },
  webViewLoaderText: {
    color: "#38BDF8",
    fontSize: 12,
    fontWeight: "600",
    marginTop: 10,
  },
  topHudContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 20,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  topBarRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  arBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(15, 23, 42, 0.8)",
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(59, 130, 246, 0.4)",
  },
  livePulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#10B981",
    marginRight: 8,
  },
  arBadgeText: {
    color: "#F1F5F9",
    fontSize: 12,
    fontWeight: "700",
  },
  openMapButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(37, 99, 235, 0.9)",
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#60A5FA",
    shadowColor: "#3B82F6",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  openMapButtonIcon: {
    fontSize: 14,
    marginRight: 6,
  },
  openMapButtonText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.3,
  },
  floatingToolColumn: {
    position: "absolute",
    right: 16,
    top: 75,
    flexDirection: "column",
    gap: 12,
  },
  circleIconButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "rgba(15, 23, 42, 0.82)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  bottomHudContainer: {
    position: "absolute",
    bottom: 24,
    left: 16,
    right: 16,
    zIndex: 20,
  },
  elementSelectionCard: {
    backgroundColor: "rgba(15, 23, 42, 0.92)",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(56, 189, 248, 0.4)",
    padding: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 8,
  },
  elementHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.1)",
    paddingBottom: 8,
    marginBottom: 8,
  },
  elementTitleGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  elementNameText: {
    color: "#38BDF8",
    fontSize: 13,
    fontWeight: "800",
  },
  closeElementBtn: {
    padding: 4,
  },
  elementPropsGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  propItem: {
    flex: 1,
  },
  propLabel: {
    color: "#94A3B8",
    fontSize: 10,
    fontWeight: "600",
    textTransform: "uppercase",
  },
  propValue: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "700",
    marginTop: 2,
  },

  // MapView Modal Stilleri
  mapModalContainer: {
    flex: 1,
    backgroundColor: "#0F172A",
  },
  mapModalHeader: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 30,
    paddingHorizontal: 16,
    paddingBottom: 10,
    backgroundColor: "rgba(15, 23, 42, 0.88)",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.1)",
  },
  mapHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  mapHeaderTitleGroup: {
    flex: 1,
  },
  mapHeaderTitle: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "800",
  },
  mapHeaderSub: {
    color: "#94A3B8",
    fontSize: 11,
    fontWeight: "500",
    marginTop: 2,
  },
  mapHeaderActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  mapSmallBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(30, 41, 59, 0.9)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.15)",
    justifyContent: "center",
    alignItems: "center",
  },
  filterChipRow: {
    flexDirection: "row",
    gap: 6,
  },
  filterChip: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 12,
    backgroundColor: "rgba(30, 41, 59, 0.8)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  filterChipActive: {
    backgroundColor: "#2563EB",
    borderColor: "#60A5FA",
  },
  filterChipText: {
    color: "#94A3B8",
    fontSize: 11,
    fontWeight: "600",
  },
  filterChipTextActive: {
    color: "#FFFFFF",
    fontWeight: "700",
  },

  // Marker Stilleri
  personnelMarkerBubble: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 5,
  },
  workerMarkerBubble: {
    backgroundColor: "#2563EB",
  },
  foremanMarkerBubble: {
    backgroundColor: "#0D9488",
  },
  vehicleMarkerBubble: {
    backgroundColor: "#F59E0B",
  },
  markerStatusDot: {
    position: "absolute",
    bottom: -1,
    right: -1,
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: "#FFFFFF",
  },
  riskMarkerBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#DC2626",
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: "#FFFFFF",
    gap: 3,
  },
  riskMarkerText: {
    color: "#FFFFFF",
    fontSize: 9,
    fontWeight: "900",
  },
  calloutContainer: {
    width: 200,
  },
  calloutCard: {
    backgroundColor: "#0F172A",
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: "rgba(59, 130, 246, 0.3)",
  },
  calloutHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 4,
  },
  calloutTitle: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "800",
  },
  calloutSubtitle: {
    color: "#CBD5E1",
    fontSize: 10,
    marginTop: 2,
  },
  calloutPpe: {
    color: "#FBBF24",
    fontSize: 9,
    fontWeight: "700",
    marginTop: 4,
  },

  // Harita Lejantı
  mapBottomLegendContainer: {
    position: "absolute",
    bottom: 20,
    left: 16,
    right: 16,
    zIndex: 30,
  },
  legendCard: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    backgroundColor: "rgba(15, 23, 42, 0.9)",
    borderRadius: 16,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.12)",
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    color: "#E2E8F0",
    fontSize: 10,
    fontWeight: "600",
  },

  // Auth & İzin Ekranları
  authContainer: {
    flex: 1,
    backgroundColor: "#090D16",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  authCard: {
    backgroundColor: "#111827",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#1F2937",
    padding: 24,
    alignItems: "center",
  },
  authIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "rgba(59, 130, 246, 0.12)",
    borderWidth: 1,
    borderColor: "rgba(59, 130, 246, 0.3)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  authTitle: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "800",
    textAlign: "center",
    marginBottom: 8,
  },
  authSubtitle: {
    color: "#9CA3AF",
    fontSize: 13,
    textAlign: "center",
    lineHeight: 19,
    marginBottom: 16,
  },
  authCurrentRole: {
    color: "#D1D5DB",
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 20,
  },
  authButton: {
    width: "100%",
    paddingVertical: 14,
    borderRadius: 14,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  authButtonText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: "#090D16",
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    color: "#94A3B8",
    fontSize: 12,
    fontWeight: "600",
    marginTop: 12,
  },
});
