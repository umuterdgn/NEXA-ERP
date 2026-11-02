import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Vibration,
  StyleSheet,
  ActivityIndicator,
  Platform,
} from "react-native";
import {
  CameraView,
  useCameraPermissions,
  BarcodeScanningResult,
} from "expo-camera";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather, Ionicons } from "@expo/vector-icons";

export interface LogisticsScannerProps {
  onScanned: (data: string, type?: string) => void;
  onClose: () => void;
  title?: string;
  subtitle?: string;
}

/**
 * Nexa ERP - Lojistik & Depo Sorumlusu Native Malzeme Vizörü (Viewfinder)
 * İrsaliye ve malzeme kabul barkod/QR tarayıcısı
 */
export const LogisticsScanner: React.FC<LogisticsScannerProps> = ({
  onScanned,
  onClose,
  title = "Malzeme Kabul Vizörü",
  subtitle = "İrsaliye QR kodunu veya malzeme etiketini vizör içine hizalayınız",
}) => {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [enableTorch, setEnableTorch] = useState(false);

  // İzin yükleniyor
  if (!permission) {
    return (
      <View className="flex-1 bg-slate-950 items-center justify-center">
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text className="text-gray-400 text-xs mt-3 font-medium">
          Vizör hazırlanıyor...
        </Text>
      </View>
    );
  }

  // İzin verilmemişse
  if (!permission.granted) {
    return (
      <SafeAreaView className="flex-1 bg-slate-950 items-center justify-center px-6">
        <View className="w-16 h-16 rounded-3xl bg-blue-500/10 border border-blue-500/30 items-center justify-center mb-4">
          <Feather name="camera" size={30} color="#3B82F6" />
        </View>
        <Text className="text-white text-xl font-bold text-center mb-2">
          Kamera İzni Gerekli
        </Text>
        <Text className="text-gray-400 text-xs text-center mb-6 leading-5">
          Malzeme kabul irsaliyelerini ve şantiye depo barkodlarını okutabilmek
          için kamera erişimine izin vermelisiniz.
        </Text>

        <TouchableOpacity
          onPress={requestPermission}
          activeOpacity={0.8}
          className="w-full py-3.5 bg-blue-600 rounded-2xl items-center mb-3 shadow-lg shadow-blue-500/30"
        >
          <Text className="text-white font-bold text-base">İzin Ver</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={onClose}
          activeOpacity={0.7}
          className="w-full py-3 bg-gray-900 border border-gray-800 rounded-2xl items-center"
        >
          <Text className="text-gray-400 font-medium text-sm">İptal</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  // Barkod / QR başarıyla okunduğunda
  const handleBarcodeScanned = (result: BarcodeScanningResult) => {
    if (scanned) return;
    setScanned(true);

    // Titreşim (Haptic)
    if (Platform.OS !== "web") {
      Vibration.vibrate(100);
    }

    console.log(
      `[LogisticsScanner] Başarıyla Okundu (${result.type}): ${result.data}`
    );

    onScanned(result.data, result.type);
    onClose();
  };

  return (
    <View className="flex-1 bg-black">
      {/* Tam Ekran Kamera */}
      <CameraView
        style={StyleSheet.absoluteFill}
        facing="back"
        enableTorch={enableTorch}
        barcodeScannerSettings={{
          barcodeTypes: [
            "qr",
            "ean13",
            "ean8",
            "code128",
            "code39",
            "upc_a",
            "upc_e",
          ],
        }}
        onBarcodeScanned={scanned ? undefined : handleBarcodeScanned}
      />

      {/* Güvenli Alan & Transparan Koyu Vizör Arayüzü */}
      <SafeAreaView className="flex-1 justify-between">
        {/* Üst Bar */}
        <View className="px-6 pt-3 pb-4 bg-gray-950/80 backdrop-blur-md flex-row items-center justify-between border-b border-gray-800/80">
          <View>
            <View className="flex-row items-center gap-1.5 mb-0.5">
              <View className="w-2 h-2 rounded-full bg-blue-400" />
              <Text className="text-blue-400 text-[10px] font-bold tracking-widest uppercase">
                Lojistik & Depo Vizörü
              </Text>
            </View>
            <Text className="text-white text-base font-bold">{title}</Text>
          </View>

          <View className="flex-row items-center gap-2">
            <TouchableOpacity
              onPress={() => setEnableTorch(!enableTorch)}
              activeOpacity={0.7}
              className={`w-9 h-9 rounded-full items-center justify-center border ${
                enableTorch
                  ? "bg-amber-500/20 border-amber-400"
                  : "bg-gray-800 border-gray-700"
              }`}
            >
              <Feather
                name={enableTorch ? "zap" : "zap-off"}
                size={16}
                color={enableTorch ? "#FBBF24" : "#9CA3AF"}
              />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={onClose}
              activeOpacity={0.7}
              className="w-9 h-9 rounded-full bg-gray-800 items-center justify-center border border-gray-700"
            >
              <Feather name="x" size={18} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Orta Alan: Modern Lojistik Vizör (Viewfinder) Çerçevesi */}
        <View className="items-center justify-center px-8">
          <View className="relative w-72 h-72 rounded-3xl border border-blue-500/40 bg-blue-500/5 items-center justify-center overflow-hidden">
            {/* Vizör Köşe Göstergeleri */}
            <View className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-blue-400 rounded-tl-2xl" />
            <View className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-blue-400 rounded-tr-2xl" />
            <View className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-blue-400 rounded-bl-2xl" />
            <View className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-blue-400 rounded-br-2xl" />

            {/* Vizör Ortasındaki Kılavuz Tarama Çizgisi */}
            <View className="w-full h-0.5 bg-blue-400/90 shadow-lg shadow-blue-400" />
            
            {/* Merkez Hedefleme Artısı */}
            <View className="absolute w-4 h-4 items-center justify-center">
              <View className="w-3 h-0.5 bg-white/40 absolute" />
              <View className="w-0.5 h-3 bg-white/40 absolute" />
            </View>
          </View>

          <Text className="text-gray-200 text-xs text-center mt-5 font-medium px-4 bg-gray-950/80 py-2 rounded-full border border-gray-800">
            {subtitle}
          </Text>
        </View>

        {/* Alt Bilgi Çubuğu */}
        <View className="p-6 bg-gray-950/80 backdrop-blur-md border-t border-gray-800/80 flex-row items-center justify-center">
          <View className="flex-row items-center gap-2">
            <Ionicons name="barcode-outline" size={18} color="#60A5FA" />
            <Text className="text-gray-300 text-xs font-semibold">
              Karekod, EAN-13, Code-128 Otomatik Algılama Aktif
            </Text>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
};

export default LogisticsScanner;
