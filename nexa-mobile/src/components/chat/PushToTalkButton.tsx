/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Nexa ERP - Mobil Telsiz (Bas-Konuş / Push-to-Talk) Bileşeni
 *
 * Butona basılı tutulduğunda expo-av Audio.Recording.createAsync ile telsiz ses kaydı başlar.
 * Buton bırakıldığında telsiz mandalı kapanır (stopAndUnloadAsync) ve kaydedilen ses dosyası döner.
 */

import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Vibration,
  Platform,
  Alert,
} from "react-native";
import { Audio } from "expo-av";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";

export interface PushToTalkButtonProps {
  onRecordingComplete: (audioUri: string, durationMs: number) => Promise<void> | void;
  onRecordingStart?: () => void;
  disabled?: boolean;
}

export const PushToTalkButton: React.FC<PushToTalkButtonProps> = ({
  onRecordingComplete,
  onRecordingStart,
  disabled = false,
}) => {
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recordDuration, setRecordDuration] = useState<number>(0);
  const recordingRef = useRef<Audio.Recording | null>(null);
  const timerRef = useRef<any>(null);
  const startTimeRef = useRef<number>(0);

  // Dalga animasyonu (Pulsing ring)
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (isRecording) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.35,
            duration: 650,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 650,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      pulseAnim.stopAnimation();
      pulseAnim.setValue(1);
    }
  }, [isRecording, pulseAnim]);

  // Ses İzni ve Ses Modu Ayarı
  const prepareAudio = async (): Promise<boolean> => {
    try {
      const permission = await Audio.requestPermissionsAsync();
      if (!permission.granted) {
        Alert.alert(
          "Mikrofon İzni Gerekli",
          "Telsiz sesli mesajı gönderebilmek için mikrofon erişimine izin vermelisiniz."
        );
        return false;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
      });

      return true;
    } catch (err) {
      console.error("[PushToTalk] Ses modu hazırlama hatası:", err);
      return false;
    }
  };

  // Butona basıldığında: Telsiz Mandalını Aç ve Kayda Başla
  const handlePressIn = async () => {
    if (disabled || isRecording) return;

    const hasPermission = await prepareAudio();
    if (!hasPermission) return;

    try {
      // Titreşim (Mandal basıldı hissi)
      Vibration.vibrate(60);

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );

      recordingRef.current = recording;
      setIsRecording(true);
      startTimeRef.current = Date.now();
      setRecordDuration(0);

      onRecordingStart?.();

      // Süre sayacı başlat
      timerRef.current = setInterval(() => {
        setRecordDuration(Math.floor((Date.now() - startTimeRef.current) / 1000));
      }, 500);
    } catch (err: any) {
      console.error("[PushToTalk] Kayıt başlatma hatası:", err);
      setIsRecording(false);
    }
  };

  // Buton bırakıldığında: Telsiz Mandalını Kapat ve Gönder
  const handlePressOut = async () => {
    if (!isRecording || !recordingRef.current) return;

    // Timer'ı temizle
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    try {
      // Telsiz bırakma titreşimi
      Vibration.vibrate([0, 40, 40, 40]);

      const recording = recordingRef.current;
      recordingRef.current = null;
      setIsRecording(false);

      const status = await recording.getStatusAsync();
      await recording.stopAndUnloadAsync();

      const durationMs = Date.now() - startTimeRef.current;
      const uri = recording.getURI();

      // Ses modu oynatma moduna geri dönsün
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
      });

      // 600ms altındaki çok kısa dokunuşları iptal et
      if (durationMs < 600) {
        return;
      }

      if (uri) {
        await onRecordingComplete(uri, durationMs);
      }
    } catch (err: any) {
      console.error("[PushToTalk] Kaydı durdurma hatası:", err);
    } finally {
      setRecordDuration(0);
    }
  };

  // Süreyi mm:ss formatına çevir
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <View style={styles.container}>
      {/* Basılı tutulduğunda yukarıda çıkan canlı telsiz göstergesi */}
      {isRecording && (
        <View style={styles.recordingBanner}>
          <View style={styles.liveRedDot} />
          <Text style={styles.recordingText}>Telsiz Yayını: {formatTime(recordDuration)}</Text>
          <Text style={styles.recordingSubtext}>Mandalı bırakınca iletilir</Text>
        </View>
      )}

      {/* Dalga Halka Efekti (Pulsing Glow) */}
      {isRecording && (
        <Animated.View
          style={[
            styles.pulseRing,
            {
              transform: [{ scale: pulseAnim }],
              opacity: pulseAnim.interpolate({
                inputRange: [1, 1.35],
                outputRange: [0.6, 0],
              }),
            },
          ]}
        />
      )}

      {/* Telsiz Butonu */}
      <TouchableOpacity
        activeOpacity={0.9}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled}
        style={[
          styles.talkButton,
          isRecording && styles.talkButtonActive,
          disabled && styles.talkButtonDisabled,
        ]}
      >
        <MaterialCommunityIcons
          name={isRecording ? "microphone" : "radio-handheld"}
          size={24}
          color="#FFFFFF"
        />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  recordingBanner: {
    position: "absolute",
    bottom: 60,
    backgroundColor: "rgba(15, 23, 42, 0.95)",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(239, 68, 68, 0.5)",
    alignItems: "center",
    flexDirection: "column",
    shadowColor: "#EF4444",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
    minWidth: 170,
  },
  liveRedDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#EF4444",
    position: "absolute",
    top: 10,
    left: 14,
  },
  recordingText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.3,
    marginLeft: 10,
  },
  recordingSubtext: {
    color: "#94A3B8",
    fontSize: 10,
    marginTop: 2,
    fontWeight: "500",
  },
  pulseRing: {
    position: "absolute",
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#EF4444",
  },
  talkButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#2563EB",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#2563EB",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 5,
    elevation: 5,
  },
  talkButtonActive: {
    backgroundColor: "#DC2626",
    transform: [{ scale: 1.08 }],
    shadowColor: "#DC2626",
  },
  talkButtonDisabled: {
    backgroundColor: "#4B5563",
    opacity: 0.6,
  },
});

export default PushToTalkButton;
