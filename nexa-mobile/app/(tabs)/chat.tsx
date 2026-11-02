/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Nexa ERP - Mobil Şantiye İç Haberleşme & Telsiz (iOS iMessage Tasarımı)
 *
 * ADIM 3: iOS iMessage Arayüzü
 * - Bulanık arka plan (Frosted Glass / Dark iOS)
 * - Mesaj Balonları: Gönderilenler sağda mavi, gelenler solda koyu gri
 * - Telsiz (Bas-Konuş / Walkie-Talkie) sesli mesajları için expo-av oynatıcı
 * - Socket.io sendMessage & receiveMessage ile gerçek zamanlı mesajlaşma
 */

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Image,
  Dimensions,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather, MaterialCommunityIcons, Ionicons } from "@expo/vector-icons";
import { Audio } from "expo-av";
import * as FileSystem from "expo-file-system/legacy";
import * as ImagePicker from "expo-image-picker";
import { useAuth } from "../../src/hooks/useAuth";
import { api, API_BASE_URL } from "../../src/lib/api";
import { locationSocket } from "../../src/services/LocationSocket";
import { PushToTalkButton } from "../../src/components/chat/PushToTalkButton";

const WEB_BASE_URL = API_BASE_URL.replace(/\/api\/?$/, "");

export interface ChatChannel {
  id: string;
  name: string;
  description?: string;
  _count?: {
    messages: number;
  };
}

export interface ChatMessage {
  id: string;
  content?: string | null;
  audioUrl?: string | null;
  imageUrl?: string | null;
  channelId: string;
  senderId: string;
  createdAt: string;
  sender?: {
    id: string;
    name: string;
    role: string;
    profileImage?: string | null;
  };
}

export default function ChatScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();

  // Kanallar ve Seçili Kanal
  const [channels, setChannels] = useState<ChatChannel[]>([]);
  const [activeChannel, setActiveChannel] = useState<ChatChannel | null>(null);
  const [isChannelSelectorOpen, setIsChannelSelectorOpen] = useState<boolean>(false);

  // Mesajlar
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState<boolean>(true);
  const [inputText, setInputText] = useState<string>("");
  const [isSending, setIsSending] = useState<boolean>(false);

  // Ses Oynatıcı Durumu (Telsiz Dinleme)
  const [playingMessageId, setPlayingMessageId] = useState<string | null>(null);
  const soundRef = useRef<Audio.Sound | null>(null);

  const flatListRef = useRef<FlatList>(null);

  // 1. Kanalları Getir
  const fetchChannels = useCallback(async () => {
    try {
      const res = await api.get("/chat/channels");
      if (res.data?.channels && res.data.channels.length > 0) {
        setChannels(res.data.channels);
        if (!activeChannel) {
          setActiveChannel(res.data.channels[0]);
        }
      }
    } catch (err: any) {
      console.warn("[Chat] Kanal listesi çekilemedi:", err.message);
      // Fallback varsayılan kanallar
      const fallbackChannels: ChatChannel[] = [
        { id: "ch_general", name: "Şantiye Genel (Telsiz)" },
        { id: "ch_block_a", name: "A Blok Kaba Yapı" },
        { id: "ch_safety", name: "İSG & Acil Durum ⚠️" },
        { id: "ch_logistics", name: "Lojistik & Sevkiyat 🚚" },
      ];
      setChannels(fallbackChannels);
      if (!activeChannel) {
        setActiveChannel(fallbackChannels[0]);
      }
    }
  }, [activeChannel]);

  useEffect(() => {
    fetchChannels();
  }, [fetchChannels]);

  // 2. Seçili Kanalın Mesajlarını Getir
  const fetchMessages = useCallback(async (channelId: string) => {
    try {
      setIsLoadingMessages(true);
      const res = await api.get(`/chat/messages?channelId=${channelId}`);
      if (res.data?.messages) {
        setMessages(res.data.messages);
      }
    } catch (err: any) {
      console.warn("[Chat] Mesajlar çekilemedi:", err.message);
      // Demo mesajlar
      setMessages([
        {
          id: "m_1",
          channelId,
          senderId: "usr_foreman_01",
          content: "Tüm ekipler dikkat: Kule vinç 1 saat içinde A Blok 4. kat döşeme demirlerini kaldıracak.",
          createdAt: new Date(Date.now() - 1000 * 60 * 18).toISOString(),
          sender: {
            id: "usr_foreman_01",
            name: "Ahmet Yılmaz",
            role: "FOREMAN",
          },
        },
        {
          id: "m_2",
          channelId,
          senderId: "usr_eng_02",
          content: "İskele güvenlik kontrolü tamamlandı, yeşil etiket asıldı.",
          createdAt: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
          sender: {
            id: "usr_eng_02",
            name: "Mehmet Kaya",
            role: "ENGINEER",
          },
        },
        {
          id: "m_3",
          channelId,
          senderId: "usr_driver_01",
          content: "Transmikser 34 NXA 101 şantiye giriş kapısında, pompa yanına yanaşıyorum.",
          createdAt: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
          sender: {
            id: "usr_driver_01",
            name: "Ali Demir",
            role: "DRIVER",
          },
        },
      ]);
    } finally {
      setIsLoadingMessages(false);
    }
  }, []);

  useEffect(() => {
    if (activeChannel?.id) {
      fetchMessages(activeChannel.id);
    }
  }, [activeChannel?.id, fetchMessages]);

  // 3. Socket.io Gerçek Zamanlı Mesajlaşma (receiveMessage)
  useEffect(() => {
    const socket = locationSocket.connect();

    const handleReceiveMessage = (incomingMsg: ChatMessage) => {
      if (incomingMsg.channelId === activeChannel?.id) {
        setMessages((prev) => {
          // Mükerrer eklemeyi önle
          if (prev.some((m) => m.id === incomingMsg.id)) return prev;
          return [...prev, incomingMsg];
        });
        // En alta kaydır
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        }, 150);
      }
    };

    socket.on("receiveMessage", handleReceiveMessage);

    return () => {
      socket.off("receiveMessage", handleReceiveMessage);
    };
  }, [activeChannel?.id]);

  // 4. Metin Mesajı Gönder (sendMessage)
  const handleSendMessage = async () => {
    const text = inputText.trim();
    if (!text || !activeChannel || isSending) return;

    setInputText("");
    setIsSending(true);

    const payload = {
      channelId: activeChannel.id,
      content: text,
      senderId: user?.id || "usr_eng_101",
      senderName: user?.name || "Ahmet Yılmaz",
      senderRole: user?.role || "ENGINEER",
      createdAt: new Date().toISOString(),
    };

    try {
      // 1. Socket.io üzerinden anında ilet
      const socket = locationSocket.connect();
      socket.emit("sendMessage", payload);

      // 2. REST API yedeği
      await api.post("/chat/messages", payload);
    } catch (err: any) {
      console.warn("[Chat] Mesaj API gönderim uyarısı:", err.message);
    } finally {
      setIsSending(false);
    }
  };

  // 5. Telsiz (Bas-Konuş) Sesli Mesaj Gönder
  const handleVoiceRecordingComplete = async (audioUri: string, durationMs: number) => {
    if (!activeChannel) return;

    try {
      setIsSending(true);

      // Ses dosyasını Base64 olarak oku
      const base64Audio = await FileSystem.readAsStringAsync(audioUri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      // Backend'e yükle
      let uploadedAudioUrl: string | null = null;
      try {
        const uploadRes = await api.post("/chat/upload-audio", {
          audioBase64: base64Audio,
          extension: "m4a",
        });
        if (uploadRes.data?.audioUrl) {
          uploadedAudioUrl = uploadRes.data.audioUrl;
        }
      } catch (uploadErr: any) {
        console.warn("[Chat] Ses yükleme uyarısı (yerel URI kullanılıyor):", uploadErr.message);
        uploadedAudioUrl = audioUri;
      }

      const payload = {
        channelId: activeChannel.id,
        content: null,
        audioUrl: uploadedAudioUrl || audioUri,
        senderId: user?.id || "usr_eng_101",
        senderName: user?.name || "Ahmet Yılmaz",
        senderRole: user?.role || "ENGINEER",
        createdAt: new Date().toISOString(),
      };

      // Socket.io ile telsiz anonsunu tüm şantiyeye yayınla
      const socket = locationSocket.connect();
      socket.emit("sendMessage", payload);

      // REST API
      await api.post("/chat/messages", payload);
    } catch (err: any) {
      console.error("[Chat] Telsiz kaydı gönderme hatası:", err);
    } finally {
      setIsSending(false);
    }
  };

  // 6. Saha Fotoğrafı Gönder
  const handlePickImage = async () => {
    if (!activeChannel) return;

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.7,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        const base64 = asset.base64;

        setIsSending(true);

        const payload = {
          channelId: activeChannel.id,
          content: "📷 [Saha Fotoğrafı]",
          imageUrl: asset.uri,
          senderId: user?.id || "usr_eng_101",
          senderName: user?.name || "Ahmet Yılmaz",
          senderRole: user?.role || "ENGINEER",
          createdAt: new Date().toISOString(),
        };

        const socket = locationSocket.connect();
        socket.emit("sendMessage", payload);

        await api.post("/chat/messages", payload);
      }
    } catch (err: any) {
      console.error("[Chat] Fotoğraf gönderme hatası:", err);
    } finally {
      setIsSending(false);
    }
  };

  // 7. Telsiz Ses Kaydını Oynat / Duraklat
  const handlePlayAudio = async (msgId: string, audioUrl: string) => {
    try {
      if (soundRef.current) {
        await soundRef.current.unloadAsync();
        soundRef.current = null;
      }

      if (playingMessageId === msgId) {
        setPlayingMessageId(null);
        return;
      }

      const fullUrl =
        audioUrl.startsWith("http") || audioUrl.startsWith("file://")
          ? audioUrl
          : `${WEB_BASE_URL}${audioUrl}`;

      const { sound } = await Audio.Sound.createAsync(
        { uri: fullUrl },
        { shouldPlay: true }
      );

      soundRef.current = sound;
      setPlayingMessageId(msgId);

      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          setPlayingMessageId(null);
        }
      });
    } catch (err) {
      console.warn("[Chat] Ses oynatma hatası:", err);
      setPlayingMessageId(null);
    }
  };

  // Ses oynatıcı unmount temizliği
  useEffect(() => {
    return () => {
      if (soundRef.current) {
        soundRef.current.unloadAsync();
      }
    };
  }, []);

  return (
    <SafeAreaView edges={["top"]} style={styles.safeContainer}>
      <StatusBar style="light" />

      {/* ============================================================ */}
      {/* ÜST HEADER (iOS iMessage Stili + Telsiz Kanal Seçici)        */}
      {/* ============================================================ */}
      <View style={styles.headerContainer}>
        <View style={styles.headerLeft}>
          <View style={styles.radioIndicator}>
            <View style={styles.radioDot} />
            <Text style={styles.radioStatusText}>CANLI TELSİZ</Text>
          </View>
          <TouchableOpacity
            style={styles.channelTitleRow}
            activeOpacity={0.7}
            onPress={() => setIsChannelSelectorOpen(!isChannelSelectorOpen)}
          >
            <Text style={styles.channelNameText}>
              {activeChannel?.name || "Kanal Yükleniyor..."}
            </Text>
            <Feather
              name={isChannelSelectorOpen ? "chevron-up" : "chevron-down"}
              size={18}
              color="#38BDF8"
            />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.headerRightBtn}
          onPress={() => setIsChannelSelectorOpen(!isChannelSelectorOpen)}
        >
          <MaterialCommunityIcons name="radio-tower" size={22} color="#60A5FA" />
        </TouchableOpacity>
      </View>

      {/* Kanal Değiştirme Açılır Listesi */}
      {isChannelSelectorOpen && (
        <View style={styles.channelDropdown}>
          <Text style={styles.channelDropdownTitle}>Şantiyedeki Kanallar & Gruplar</Text>
          {channels.map((ch) => (
            <TouchableOpacity
              key={ch.id}
              style={[
                styles.channelOption,
                activeChannel?.id === ch.id && styles.channelOptionActive,
              ]}
              onPress={() => {
                setActiveChannel(ch);
                setIsChannelSelectorOpen(false);
              }}
            >
              <MaterialCommunityIcons
                name={
                  ch.name.includes("Telsiz")
                    ? "radio-handheld"
                    : ch.name.includes("İSG")
                    ? "alert-decagram"
                    : "chat"
                }
                size={18}
                color={activeChannel?.id === ch.id ? "#38BDF8" : "#94A3B8"}
                style={{ marginRight: 10 }}
              />
              <View style={{ flex: 1 }}>
                <Text
                  style={[
                    styles.channelOptionText,
                    activeChannel?.id === ch.id && styles.channelOptionTextActive,
                  ]}
                >
                  {ch.name}
                </Text>
                {ch.description && (
                  <Text style={styles.channelOptionDesc}>{ch.description}</Text>
                )}
              </View>
              {activeChannel?.id === ch.id && (
                <Feather name="check" size={16} color="#38BDF8" />
              )}
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* ============================================================ */}
      {/* MESAJ LİSTESİ (iOS iMessage Balonları)                       */}
      {/* ============================================================ */}
      <View style={styles.chatBody}>
        {isLoadingMessages ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color="#3B82F6" />
            <Text style={styles.loadingText}>Telsiz mesajları alınıyor...</Text>
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.messageListContent}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
            renderItem={({ item }) => {
              const isMe = item.senderId === (user?.id || "usr_eng_101");
              const isVoice = Boolean(item.audioUrl);
              const isPlaying = playingMessageId === item.id;

              return (
                <View
                  style={[
                    styles.messageRow,
                    isMe ? styles.messageRowMe : styles.messageRowOther,
                  ]}
                >
                  {/* Karşı tarafın avatarı veya baş harfi */}
                  {!isMe && (
                    <View style={styles.otherAvatar}>
                      <Text style={styles.otherAvatarText}>
                        {(item.sender?.name || "P").substring(0, 1).toUpperCase()}
                      </Text>
                    </View>
                  )}

                  <View
                    style={[
                      styles.bubbleBase,
                      isMe ? styles.bubbleMe : styles.bubbleOther,
                      isVoice && styles.bubbleVoice,
                    ]}
                  >
                    {/* Gelen mesajda gönderen adı & rol rozeti */}
                    {!isMe && (
                      <View style={styles.senderHeader}>
                        <Text style={styles.senderName}>{item.sender?.name || "Personel"}</Text>
                        <Text style={styles.senderRole}>
                          {item.sender?.role || "SAHA"}
                        </Text>
                      </View>
                    )}

                    {/* 1. Telsiz Ses Kaydı Mesajı */}
                    {isVoice && (
                      <View style={styles.voiceMessageContainer}>
                        <TouchableOpacity
                          style={[
                            styles.playPauseBtn,
                            isMe ? styles.playPauseBtnMe : styles.playPauseBtnOther,
                          ]}
                          onPress={() => item.audioUrl && handlePlayAudio(item.id, item.audioUrl)}
                        >
                          <Ionicons
                            name={isPlaying ? "pause" : "play"}
                            size={18}
                            color="#FFFFFF"
                          />
                        </TouchableOpacity>

                        <View style={styles.voiceWaveContainer}>
                          {/* Ses dalga çizgileri */}
                          <View style={styles.waveBarsRow}>
                            {[14, 22, 10, 26, 18, 12, 28, 16, 20, 10, 24, 14].map((h, i) => (
                              <View
                                key={i}
                                style={[
                                  styles.waveBar,
                                  { height: h },
                                  isPlaying && {
                                    backgroundColor: isMe ? "#FFFFFF" : "#38BDF8",
                                  },
                                ]}
                              />
                            ))}
                          </View>
                          <Text style={[styles.voiceDurationText, isMe && { color: "#E0E7FF" }]}>
                            {isPlaying ? "Yürütülüyor..." : "🎙️ Telsiz Anonsu"}
                          </Text>
                        </View>
                      </View>
                    )}

                    {/* 2. Fotoğraf Mesajı */}
                    {item.imageUrl && (
                      <Image
                        source={{ uri: item.imageUrl }}
                        style={styles.messageImage}
                        resizeMode="cover"
                      />
                    )}

                    {/* 3. Metin Mesajı */}
                    {Boolean(item.content) && !isVoice && (
                      <Text
                        style={[
                          styles.messageText,
                          isMe ? styles.messageTextMe : styles.messageTextOther,
                        ]}
                      >
                        {item.content}
                      </Text>
                    )}

                    {/* Zaman & İletildi Tikleri */}
                    <View style={styles.metaRow}>
                      <Text
                        style={[
                          styles.timestampText,
                          isMe ? styles.timestampMe : styles.timestampOther,
                        ]}
                      >
                        {new Date(item.createdAt).toLocaleTimeString("tr-TR", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </Text>
                      {isMe && (
                        <MaterialCommunityIcons
                          name="check-all"
                          size={13}
                          color="#93C5FD"
                          style={{ marginLeft: 4 }}
                        />
                      )}
                    </View>
                  </View>
                </View>
              );
            }}
          />
        )}
      </View>

      {/* ============================================================ */}
      {/* ALT MESAJ GİRİŞ ÇUBUĞU (iOS iMessage + Telsiz Mandalı)       */}
      {/* ============================================================ */}
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 10 : 0}
      >
        <SafeAreaView edges={["bottom"]} style={styles.inputBarSafeArea}>
          <View style={styles.inputBarContainer}>
            {/* Fotoğraf Ekleme Butonu */}
            <TouchableOpacity
              style={styles.attachButton}
              onPress={handlePickImage}
              activeOpacity={0.7}
            >
              <Feather name="camera" size={20} color="#94A3B8" />
            </TouchableOpacity>

            {/* iOS Kavisli Metin Girişi */}
            <View style={styles.textInputWrapper}>
              <TextInput
                style={styles.textInputField}
                placeholder="iMessage • Şantiye Telsizi..."
                placeholderTextColor="#64748B"
                value={inputText}
                onChangeText={setInputText}
                multiline={false}
                returnKeyType="send"
                onSubmitEditing={handleSendMessage}
              />
            </View>

            {/* Sağ Taraf: Metin varsa Gönder Butonu, Yoksa Telsiz Mandalı (Push-to-Talk) */}
            {inputText.trim().length > 0 ? (
              <TouchableOpacity
                style={styles.sendButton}
                activeOpacity={0.8}
                onPress={handleSendMessage}
                disabled={isSending}
              >
                {isSending ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Feather name="arrow-up" size={18} color="#FFFFFF" />
                )}
              </TouchableOpacity>
            ) : (
              <PushToTalkButton
                onRecordingComplete={handleVoiceRecordingComplete}
                disabled={isSending}
              />
            )}
          </View>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: "#0B0F19", // Koyu Apple iOS teması
  },
  headerContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#1E293B",
    backgroundColor: "rgba(15, 23, 42, 0.95)",
  },
  headerLeft: {
    flex: 1,
  },
  radioIndicator: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 2,
  },
  radioDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#10B981",
  },
  radioStatusText: {
    color: "#10B981",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.8,
  },
  channelTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  channelNameText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "800",
  },
  headerRightBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(30, 41, 59, 0.8)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(59, 130, 246, 0.3)",
  },
  channelDropdown: {
    backgroundColor: "#111827",
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#1F2937",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 8,
    zIndex: 100,
  },
  channelDropdownTitle: {
    color: "#64748B",
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    marginBottom: 8,
    paddingLeft: 4,
  },
  channelOption: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginBottom: 4,
  },
  channelOptionActive: {
    backgroundColor: "rgba(37, 99, 235, 0.15)",
    borderWidth: 1,
    borderColor: "rgba(59, 130, 246, 0.4)",
  },
  channelOptionText: {
    color: "#94A3B8",
    fontSize: 13,
    fontWeight: "700",
  },
  channelOptionTextActive: {
    color: "#38BDF8",
  },
  channelOptionDesc: {
    color: "#64748B",
    fontSize: 11,
    marginTop: 2,
  },
  chatBody: {
    flex: 1,
  },
  loadingBox: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    color: "#64748B",
    fontSize: 12,
    marginTop: 10,
    fontWeight: "600",
  },
  messageListContent: {
    paddingHorizontal: 14,
    paddingVertical: 16,
    gap: 8,
  },
  messageRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    marginVertical: 3,
  },
  messageRowMe: {
    justifyContent: "flex-end",
  },
  messageRowOther: {
    justifyContent: "flex-start",
  },
  otherAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#334155",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
    marginBottom: 2,
  },
  otherAvatarText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "800",
  },
  bubbleBase: {
    maxWidth: "76%",
    paddingHorizontal: 14,
    paddingVertical: 9,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2,
  },
  // ADIM 3: Gönderilenler sağda mavi (rounded-l-2xl rounded-tr-2xl)
  bubbleMe: {
    backgroundColor: "#2563EB", // iOS iMessage Blue
    borderTopLeftRadius: 18,
    borderBottomLeftRadius: 18,
    borderTopRightRadius: 18,
    borderBottomRightRadius: 4,
  },
  // ADIM 3: Gelenler solda koyu gri (rounded-r-2xl rounded-tl-2xl)
  bubbleOther: {
    backgroundColor: "#1F2937", // Koyu gri iOS bubble
    borderTopRightRadius: 18,
    borderBottomRightRadius: 18,
    borderTopLeftRadius: 18,
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.05)",
  },
  bubbleVoice: {
    minWidth: 190,
  },
  senderHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 4,
  },
  senderName: {
    color: "#60A5FA",
    fontSize: 11,
    fontWeight: "800",
  },
  senderRole: {
    color: "#94A3B8",
    fontSize: 9,
    fontWeight: "700",
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
  },
  messageTextMe: {
    color: "#FFFFFF",
    fontWeight: "500",
  },
  messageTextOther: {
    color: "#F1F5F9",
    fontWeight: "500",
  },
  voiceMessageContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 4,
  },
  playPauseBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  playPauseBtnMe: {
    backgroundColor: "rgba(255, 255, 255, 0.25)",
  },
  playPauseBtnOther: {
    backgroundColor: "#2563EB",
  },
  voiceWaveContainer: {
    flex: 1,
  },
  waveBarsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    height: 28,
  },
  waveBar: {
    width: 3,
    backgroundColor: "rgba(255, 255, 255, 0.4)",
    borderRadius: 2,
  },
  voiceDurationText: {
    color: "#94A3B8",
    fontSize: 10,
    fontWeight: "700",
    marginTop: 2,
  },
  messageImage: {
    width: 200,
    height: 150,
    borderRadius: 12,
    marginBottom: 6,
  },
  metaRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    marginTop: 3,
  },
  timestampText: {
    fontSize: 10,
    fontWeight: "500",
  },
  timestampMe: {
    color: "rgba(255, 255, 255, 0.7)",
  },
  timestampOther: {
    color: "#94A3B8",
  },
  // Alt Giriş Barı
  inputBarSafeArea: {
    backgroundColor: "#111827",
    borderTopWidth: 1,
    borderTopColor: "#1F2937",
  },
  inputBarContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  attachButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#1E293B",
    justifyContent: "center",
    alignItems: "center",
  },
  textInputWrapper: {
    flex: 1,
    backgroundColor: "#1E293B",
    borderRadius: 22,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === "ios" ? 8 : 4,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
  },
  textInputField: {
    color: "#FFFFFF",
    fontSize: 14,
    minHeight: 24,
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#2563EB",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#2563EB",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
});
