import React, { useRef, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from "react-native";
import SignatureView, { SignatureViewRef } from "react-native-signature-canvas";
import { Feather } from "@expo/vector-icons";

export interface SignaturePadProps {
  /**
   * İmza başarıyla onaylandığında tetiklenir. Base64 (PNG data-uri) formatında string döner.
   */
  onConfirm: (base64Signature: string) => void;
  /**
   * Çizim temizlendiğinde tetiklenir
   */
  onClear?: () => void;
  /**
   * İptal veya kapatma işlemi istendiğinde tetiklenir
   */
  onClose?: () => void;
  /**
   * Başlık metni
   */
  title?: string;
  /**
   * Alt açıklama veya denetçi ünvanı
   */
  subtitle?: string;
  /**
   * İmzalayan yetkili adı
   */
  signerName?: string;
  /**
   * Çizim kalemi rengi (Varsayılan: #0f172a - koyu lacivert/siyah)
   */
  penColor?: string;
  /**
   * Çizim alanının yüksekliği (Varsayılan: 220)
   */
  canvasHeight?: number;
  /**
   * Yüklenme durumu (örn: backend isteği sürerken)
   */
  isLoading?: boolean;
}

/**
 * Nexa ERP - Yapı Denetim Dijital e-İmza Çizim Alanı (SignaturePad)
 * React Native Signature Canvas tabanlı, Base64 PNG dışa aktarma destekli.
 */
export const SignaturePad: React.FC<SignaturePadProps> = ({
  onConfirm,
  onClear,
  onClose,
  title = "Yetkili Dijital e-İmza",
  subtitle = "Lütfen parmağınız veya stylus kalem ile beyaz alana imzanızı atın.",
  signerName,
  penColor = "#0f172a",
  canvasHeight = 220,
  isLoading = false,
}) => {
  const signatureRef = useRef<SignatureViewRef>(null);
  const [hasDrawn, setHasDrawn] = useState(false);

  // WebView içerisindeki varsayılan HTML düğmelerini gizle, sadece çizim tuvalini bırak
  const webStyle = `
    .m-signature-pad--footer { display: none !important; margin: 0px !important; }
    body, html {
      width: 100%;
      height: 100%;
      background-color: #ffffff;
      margin: 0;
      padding: 0;
      user-select: none;
      -webkit-user-select: none;
      touch-action: none;
    }
    .m-signature-pad {
      box-shadow: none;
      border: none;
      background-color: #ffffff;
      width: 100%;
      height: 100%;
    }
    .m-signature-pad--body {
      border: none;
      background-color: #ffffff;
      width: 100%;
      height: 100%;
    }
    canvas {
      width: 100%;
      height: 100%;
    }
  `;

  // Onayla tıklandığında tuvalden Base64 veriyi oku
  const handleConfirmPress = () => {
    if (!signatureRef.current) return;
    signatureRef.current.readSignature();
  };

  // Temizle tıklandığında tuvali sıfırla
  const handleClearPress = () => {
    if (!signatureRef.current) return;
    signatureRef.current.clearSignature();
    setHasDrawn(false);
    onClear?.();
  };

  // İmza Base64 olarak okunduğunda
  const handleOK = (signature: string) => {
    if (!signature || signature.length < 50) {
      Alert.alert("Uyarı", "Lütfen onaylamadan önce imzanızı çiziniz.");
      return;
    }
    onConfirm(signature);
  };

  // İmza çizilmeden Onayla dendiğinde
  const handleEmpty = () => {
    Alert.alert(
      "İmza Eksik",
      "Kritik imalat onayı için geçerli bir dijital imza zorunludur. Lütfen beyaz alana imzanızı atınız."
    );
  };

  return (
    <View style={styles.container}>
      {/* Üst Başlık & Kapat Butonu */}
      <View style={styles.headerRow}>
        <View style={styles.headerTextGroup}>
          <View style={styles.badgeRow}>
            <View style={styles.pulseDot} />
            <Text style={styles.badgeText}>YAPI DENETİM ONAYI</Text>
          </View>
          <Text style={styles.title}>{title}</Text>
          {signerName && (
            <Text style={styles.signerName}>Denetçi: {signerName}</Text>
          )}
          <Text style={styles.subtitle}>{subtitle}</Text>
        </View>

        {onClose && (
          <TouchableOpacity
            onPress={onClose}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            style={styles.closeButton}
            accessibilityLabel="Kapat"
          >
            <Feather name="x" size={20} color="#9CA3AF" />
          </TouchableOpacity>
        )}
      </View>

      {/* Beyaz Çizim Alanı (Signature Canvas) */}
      <View style={[styles.canvasWrapper, { height: canvasHeight }]}>
        <SignatureView
          ref={signatureRef}
          onOK={handleOK}
          onEmpty={handleEmpty}
          onBegin={() => setHasDrawn(true)}
          penColor={penColor}
          webStyle={webStyle}
          imageType="image/png"
          autoClear={false}
          descriptionText=""
          clearText=""
          confirmText=""
          style={styles.signatureView}
        />

        {/* Çizim Rehberi (İmza Alt Çizgisi) */}
        <View pointerEvents="none" style={styles.guidelineContainer}>
          <View style={styles.dashedLine} />
          <Text style={styles.guidelineText}>X — İmza Çizgisi</Text>
        </View>
      </View>

      {/* Alt Butonlar: Temizle & Onayla */}
      <View style={styles.buttonRow}>
        {/* Temizle Butonu */}
        <TouchableOpacity
          onPress={handleClearPress}
          disabled={isLoading}
          style={[styles.btn, styles.btnClear]}
          activeOpacity={0.7}
        >
          <Feather name="rotate-ccw" size={16} color="#E5E7EB" />
          <Text style={styles.btnClearText}>Temizle</Text>
        </TouchableOpacity>

        {/* Onayla Butonu */}
        <TouchableOpacity
          onPress={handleConfirmPress}
          disabled={isLoading}
          style={[styles.btn, styles.btnConfirm]}
          activeOpacity={0.8}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <>
              <Feather name="check" size={18} color="#FFFFFF" />
              <Text style={styles.btnConfirmText}>Onayla ve İmzala</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Yasal Uyarı Notu */}
      <View style={styles.legalNoticeRow}>
        <Feather name="shield" size={12} color="#6B7280" />
        <Text style={styles.legalNoticeText}>
          Bu dijital imza 5070 Sayılı Elektronik İmza Kanunu ve Şantiye Denetim
          Mevzuatı gereğince kayıt altına alınmaktadır.
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#1F2937", // gray-800
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: "#374151", // gray-700
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 14,
  },
  headerTextGroup: {
    flex: 1,
    paddingRight: 8,
  },
  badgeRow: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: "rgba(16, 185, 129, 0.15)", // emerald transparent
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: "rgba(16, 185, 129, 0.3)",
  },
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#10B981", // emerald-500
    marginRight: 6,
  },
  badgeText: {
    color: "#34D399", // emerald-400
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  title: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "700",
    letterSpacing: -0.3,
  },
  signerName: {
    color: "#93C5FD", // blue-300
    fontSize: 12,
    fontWeight: "600",
    marginTop: 2,
  },
  subtitle: {
    color: "#9CA3AF", // gray-400
    fontSize: 12,
    marginTop: 4,
    lineHeight: 16,
  },
  closeButton: {
    backgroundColor: "#374151",
    padding: 8,
    borderRadius: 10,
  },
  canvasWrapper: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "#4B5563",
    overflow: "hidden",
    position: "relative",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  signatureView: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  guidelineContainer: {
    position: "absolute",
    bottom: 24,
    left: 20,
    right: 20,
    flexDirection: "column",
    alignItems: "flex-start",
  },
  dashedLine: {
    width: "100%",
    height: 1,
    backgroundColor: "#CBD5E1",
    marginBottom: 4,
  },
  guidelineText: {
    color: "#94A3B8",
    fontSize: 11,
    fontWeight: "600",
  },
  buttonRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 16,
  },
  btn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    gap: 8,
  },
  btnClear: {
    backgroundColor: "#374151", // gray-700
    borderWidth: 1,
    borderColor: "#4B5563",
    flex: 1,
  },
  btnClearText: {
    color: "#E5E7EB",
    fontSize: 14,
    fontWeight: "600",
  },
  btnConfirm: {
    backgroundColor: "#2563EB", // blue-600
    flex: 2,
    shadowColor: "#2563EB",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 4,
  },
  btnConfirmText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
  legalNoticeRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginTop: 12,
    paddingHorizontal: 8,
  },
  legalNoticeText: {
    color: "#6B7280",
    fontSize: 10,
    lineHeight: 14,
    flex: 1,
    textAlign: "center",
  },
});

export default SignaturePad;
