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

export interface QRScannerProps {
  onScan: (data: string, type?: string) => void;
  onClose: () => void;
  title?: string;
  subtitle?: string;
}

/**
 * Nexa ERP - Lojistik & Malzeme Kabul QR / Barkod Tarayıcı
 * Modern CameraView entegrasyonu, koyu tema overlay ve dokunsal geri bildirim (Vibration)
 */
export const QRScanner: React.FC<QRScannerProps> = ({
  onScan,
  onClose,
  title = "Malzeme QR / Barkod Tara",
  subtitle = "Lojistik barkodunu veya irsaliye QR kodunu çerçeve içine hizalayınız",
}) => {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [enableTorch, setEnableTorch] = useState(false);

  // İzin yükleniyor
  if (!permission) {
    return (
      <View className="flex-1 bg-slate-950 items-center justify-center">
        <ActivityIndicator size="large" color="#10b981" />
        <Text className="text-slate-400 text-sm mt-3 font-medium">
          Kamera hazırlanıyor...
        </Text>
      </View>
    );
  }

  // İzin verilmemişse
  if (!permission.granted) {
    return (
      <SafeAreaView className="flex-1 bg-slate-950 items-center justify-center px-6">
        <View className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 items-center justify-center mb-4">
          <Text className="text-amber-400 text-2xl font-bold">📷</Text>
        </View>
        <Text className="text-white text-xl font-bold text-center mb-2">
          Kamera İzni Gerekli
        </Text>
        <Text className="text-slate-400 text-sm text-center mb-6 leading-5">
          Malzeme irsaliyelerini, şantiye envanter etiketlerini ve teslimat QR
          kodlarını okutabilmek için kamera erişimine izin vermelisiniz.
        </Text>

        <TouchableOpacity
          onPress={requestPermission}
          activeOpacity={0.8}
          className="w-full py-3.5 bg-emerald-500 rounded-xl items-center mb-3"
        >
          <Text className="text-slate-950 font-bold text-base">İzin Ver</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={onClose}
          activeOpacity={0.7}
          className="w-full py-3 bg-slate-900 border border-slate-800 rounded-xl items-center"
        >
          <Text className="text-slate-400 font-medium text-sm">İptal</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  // Barkod / QR okunduğunda çalışan tetikleyici
  const handleBarcodeScanned = (result: BarcodeScanningResult) => {
    if (scanned) return;
    setScanned(true);

    // Dokunsal titreşim geri bildirimi
    if (Platform.OS !== "web") {
      Vibration.vibrate(120);
    }

    console.log(`[QRScanner] Başarıyla Okundu (${result.type}): ${result.data}`);

    // Callback ile üst bileşene veriyi ilet ve kapat
    onScan(result.data, result.type);
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

      {/* Güvenli Alan & Transparan Koyu Overlay Arayüzü */}
      <SafeAreaView className="flex-1 justify-between">
        {/* Üst Bar */}
        <View className="px-5 pt-3 pb-4 bg-slate-950/80 backdrop-blur-md flex-row items-center justify-between border-b border-slate-800/60">
          <View>
            <View className="flex-row items-center gap-1.5 mb-0.5">
              <View className="w-2 h-2 rounded-full bg-emerald-400" />
              <Text className="text-emerald-400 text-[10px] font-bold tracking-widest uppercase">
                Nexa Lojistik Tarayıcı
              </Text>
            </View>
            <Text className="text-white text-base font-bold">{title}</Text>
          </View>

          <TouchableOpacity
            onPress={onClose}
            activeOpacity={0.7}
            className="w-9 h-9 rounded-full bg-slate-800/90 items-center justify-center border border-slate-700"
          >
            <Text className="text-white font-bold text-base">✕</Text>
          </TouchableOpacity>
        </View>

        {/* Orta Alan: Tarama Hedef Çerçevesi */}
        <View className="items-center justify-center px-8">
          <View className="relative w-64 h-64 border-2 border-emerald-400/50 rounded-3xl bg-emerald-500/5 items-center justify-center overflow-hidden">
            {/* Köşe Vurguları */}
            <View className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-emerald-400 rounded-tl-2xl" />
            <View className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-emerald-400 rounded-tr-2xl" />
            <View className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-emerald-400 rounded-bl-2xl" />
            <View className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-emerald-400 rounded-br-2xl" />

            {/* Yatay Tarama Kılavuz Çizgisi */}
            <View className="w-full h-0.5 bg-emerald-400/80 shadow-md shadow-emerald-400" />
          </View>

          <Text className="text-slate-200 text-xs text-center mt-5 font-medium px-4 bg-slate-950/70 py-2 rounded-full border border-slate-800">
            {subtitle}
          </Text>
        </View>

        {/* Alt Bar: Flaş ve Kontroller */}
        <View className="p-6 bg-slate-950/80 backdrop-blur-md border-t border-slate-800/60 flex-row items-center justify-center gap-6">
          <TouchableOpacity
            onPress={() => setEnableTorch(!enableTorch)}
            activeOpacity={0.8}
            className={`flex-row items-center gap-2 px-5 py-3 rounded-full border ${
              enableTorch
                ? "bg-amber-500/20 border-amber-400"
                : "bg-slate-900 border-slate-700"
            }`}
          >
            <Text className="text-base">{enableTorch ? "🔦" : "💡"}</Text>
            <Text
              className={`text-xs font-semibold ${
                enableTorch ? "text-amber-400" : "text-slate-300"
              }`}
            >
              {enableTorch ? "Flaşı Kapat" : "Flaşı Aç"}
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
};

export default QRScanner;
